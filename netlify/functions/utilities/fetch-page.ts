/**
 * Fetch Page API - Web content fetching with robots.txt compliance
 * Fetches and sanitizes web content while respecting robots.txt and rate limits
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../utils/auth-middleware';
import { withRateLimit, checkRateLimitWithTier } from '../utils/rate-limiter';
import { getCorsHeaders } from '../utils/cors';
import * as dns from 'dns';
import { promisify } from 'util';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Promisified DNS lookup for async resolution
const dnsLookup = promisify(dns.lookup);
const dnsResolve4 = promisify(dns.resolve4);
const dnsResolve6 = promisify(dns.resolve6);

/**
 * SSRF Protection: Check if an IPv4 address is private/internal
 */
function isPrivateIPv4(ip: string): boolean {
  const octets = ip.split('.').map(Number);
  if (octets.length !== 4 || octets.some((o) => isNaN(o) || o < 0 || o > 255)) {
    return true; // Invalid IP format, treat as private for safety
  }

  const [a, b, c, d] = octets;

  // 0.0.0.0/8 - Current network
  if (a === 0) return true;

  // 10.0.0.0/8 - Private network
  if (a === 10) return true;

  // 100.64.0.0/10 - Carrier-grade NAT
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 - Loopback
  if (a === 127) return true;

  // 169.254.0.0/16 - Link-local
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 - Private network
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 - IETF Protocol Assignments
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 - TEST-NET-1
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.88.99.0/24 - IPv6 to IPv4 relay
  if (a === 192 && b === 88 && c === 99) return true;

  // 192.168.0.0/16 - Private network
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 - Benchmark testing
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 - TEST-NET-2
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 - TEST-NET-3
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 - Multicast
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 - Reserved for future use
  if (a >= 240) return true;

  // 255.255.255.255 - Broadcast
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * SSRF Protection: Check if an IPv6 address is private/internal
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // ::1 - Loopback
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

  // :: - Unspecified
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // ::ffff:0:0/96 - IPv4-mapped addresses (check the IPv4 portion)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.slice(7);
    if (ipv4Part.includes('.')) {
      return isPrivateIPv4(ipv4Part);
    }
  }

  // fe80::/10 - Link-local
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
      normalized.startsWith('fea') || normalized.startsWith('feb')) return true;

  // fc00::/7 - Unique local address (ULA)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // ff00::/8 - Multicast
  if (normalized.startsWith('ff')) return true;

  // 2001:db8::/32 - Documentation
  if (normalized.startsWith('2001:db8:') || normalized.startsWith('2001:0db8:')) return true;

  // 2001::/32 - Teredo tunneling (could be used to bypass)
  if (normalized.startsWith('2001:0:') || normalized.startsWith('2001:0000:')) return true;

  // 64:ff9b::/96 - NAT64
  if (normalized.startsWith('64:ff9b:')) return true;

  // 100::/64 - Discard prefix
  if (normalized.startsWith('100:') || normalized.startsWith('0100:')) return true;

  return false;
}

/**
 * SSRF Protection: Check if hostname is private/reserved (synchronous check)
 * This blocks obvious private hosts before DNS resolution
 */
function isPrivateOrReservedHost(hostname: string): boolean {
  // Block localhost variants
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === 'localhost.localdomain') {
    return true;
  }

  // Check if it's an IPv4 address
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return isPrivateIPv4(hostname);
  }

  // Check if it's an IPv6 address (with or without brackets)
  const ipv6 = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;
  if (ipv6.includes(':')) {
    return isPrivateIPv6(ipv6);
  }

  // Block common internal hostnames
  const internalPatterns = [
    /^localhost$/i,
    /\.localhost$/i,
    /\.local$/i,
    /\.internal$/i,
    /\.intranet$/i,
    /^metadata\./i,           // Cloud metadata services
    /^169\.254\.169\.254$/,   // AWS/GCP metadata
    /^metadata\.google\./i,   // GCP metadata
    /^instance-data\./i,      // Cloud instance data
  ];

  return internalPatterns.some((pattern) => pattern.test(hostname));
}

/**
 * SSRF Protection: Resolve hostname and validate all resolved IPs
 * This prevents DNS rebinding attacks by checking resolved IPs BEFORE fetch
 *
 * CRITICAL: This function must be called before ANY fetch to a user-provided URL
 */
async function validateHostnameResolution(hostname: string): Promise<{
  valid: boolean;
  error?: string;
  resolvedIPs?: string[];
}> {
  // First, check if the hostname itself is suspicious
  if (isPrivateOrReservedHost(hostname)) {
    return {
      valid: false,
      error: 'Hostname resolves to a private or reserved address',
    };
  }

  try {
    const resolvedIPs: string[] = [];

    // Resolve IPv4 addresses
    try {
      const ipv4Addresses = await dnsResolve4(hostname);
      resolvedIPs.push(...ipv4Addresses);

      for (const ip of ipv4Addresses) {
        if (isPrivateIPv4(ip)) {
          console.warn(`[SSRF Protection] Blocked DNS rebinding attempt: ${hostname} -> ${ip}`);
          return {
            valid: false,
            error: `Hostname resolves to private IPv4 address: ${ip}`,
            resolvedIPs,
          };
        }
      }
    } catch (err) {
      // IPv4 resolution failed, continue to IPv6
    }

    // Resolve IPv6 addresses
    try {
      const ipv6Addresses = await dnsResolve6(hostname);
      resolvedIPs.push(...ipv6Addresses);

      for (const ip of ipv6Addresses) {
        if (isPrivateIPv6(ip)) {
          console.warn(`[SSRF Protection] Blocked DNS rebinding attempt: ${hostname} -> ${ip}`);
          return {
            valid: false,
            error: `Hostname resolves to private IPv6 address: ${ip}`,
            resolvedIPs,
          };
        }
      }
    } catch (err) {
      // IPv6 resolution failed
    }

    // If no IPs were resolved, try dns.lookup as fallback
    if (resolvedIPs.length === 0) {
      try {
        const result = await dnsLookup(hostname, { all: true });
        // dns.lookup with { all: true } returns LookupAddress[]
        const addresses = result as dns.LookupAddress[];

        for (const addr of addresses) {
          const ip = addr.address;
          resolvedIPs.push(ip);

          // Check based on address family (4 = IPv4, 6 = IPv6)
          if (addr.family === 4) {
            if (isPrivateIPv4(ip)) {
              console.warn(`[SSRF Protection] Blocked DNS rebinding attempt: ${hostname} -> ${ip}`);
              return {
                valid: false,
                error: `Hostname resolves to private IPv4 address: ${ip}`,
                resolvedIPs,
              };
            }
          } else if (addr.family === 6) {
            if (isPrivateIPv6(ip)) {
              console.warn(`[SSRF Protection] Blocked DNS rebinding attempt: ${hostname} -> ${ip}`);
              return {
                valid: false,
                error: `Hostname resolves to private IPv6 address: ${ip}`,
                resolvedIPs,
              };
            }
          }
        }
      } catch (err) {
        // DNS lookup failed entirely
        console.warn(`[SSRF Protection] DNS resolution failed for ${hostname}:`, err);
        // Fail closed - if we can't resolve, don't allow the request
        return {
          valid: false,
          error: 'Failed to resolve hostname - request blocked for security',
        };
      }
    }

    // All resolved IPs are safe
    return {
      valid: true,
      resolvedIPs,
    };
  } catch (error) {
    console.error('[SSRF Protection] Unexpected error during DNS validation:', error);
    // Fail closed on unexpected errors
    return {
      valid: false,
      error: 'DNS validation failed - request blocked for security',
    };
  }
}

const fetchPageHandler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Get origin for CORS validation
  const origin = event.headers['origin'] || event.headers['Origin'];
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    const { url } = requestBody;

    // Validate URL
    if (!url) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid URL format' }),
      };
    }

    // SSRF Protection: Block requests to private/internal hosts
    if (isPrivateOrReservedHost(parsedUrl.hostname)) {
      return {
        statusCode: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Access denied',
          message: 'Requests to private or internal hosts are not allowed.',
        }),
      };
    }

    // Check rate limits using Redis-backed rate limiter
    // Use 'public' tier for domain-specific rate limiting (stricter than authenticated tier)
    const rateLimitResult = await checkRateLimitWithTier(event, 'public');
    if (!rateLimitResult.success) {
      return {
        statusCode: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '',
          'Retry-After': rateLimitResult.reset
            ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
            : '60',
        },
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset
            ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
            : 60,
        }),
      };
    }

    console.log('[Fetch Page] Fetching URL:', url);

    // CRITICAL: DNS Rebinding Protection
    // Validate that the hostname does not resolve to private/internal IPs
    // This MUST happen BEFORE any fetch operations to prevent TOCTOU attacks
    const dnsValidation = await validateHostnameResolution(parsedUrl.hostname);
    if (!dnsValidation.valid) {
      console.warn(`[SSRF Protection] Blocked request to ${parsedUrl.hostname}: ${dnsValidation.error}`);
      return {
        statusCode: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Access denied',
          message: 'Request blocked for security reasons: hostname resolves to internal network.',
        }),
      };
    }

    console.log(`[Fetch Page] DNS validation passed, resolved IPs: ${dnsValidation.resolvedIPs?.join(', ')}`);

    // Check robots.txt
    const robotsAllowed = await checkRobotsTxt(parsedUrl);
    if (!robotsAllowed) {
      return {
        statusCode: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Access denied by robots.txt',
          message: 'This website does not allow automated access.',
        }),
      };
    }

    // Fetch the page content
    const pageContent = await fetchPageContent(parsedUrl);

    // Log the fetch operation
    await logFetchOperation(url, pageContent.success);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        url: pageContent.url,
        title: pageContent.title,
        content: pageContent.content,
        summary: pageContent.summary,
        metadata: pageContent.metadata,
        fetchedAt: pageContent.fetchedAt,
      }),
    };
  } catch (error) {
    console.error('[Fetch Page] Error:', error);

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export const handler = withAuth(withRateLimit(fetchPageHandler));

/**
 * Check robots.txt compliance
 */
async function checkRobotsTxt(url: URL): Promise<boolean> {
  try {
    const robotsUrl = `${url.protocol}//${url.hostname}/robots.txt`;

    const response = await fetch(robotsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'AI-Agent-Fetcher/1.0 (https://your-domain.com)',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      // If robots.txt doesn't exist, assume access is allowed
      return true;
    }

    const robotsText = await response.text();
    return parseRobotsTxt(robotsText, url.pathname);
  } catch (error) {
    console.warn('[Fetch Page] Error checking robots.txt:', error);
    // If we can't check robots.txt, assume access is allowed
    return true;
  }
}

/**
 * Parse robots.txt content
 */
function parseRobotsTxt(robotsText: string, path: string): boolean {
  const lines = robotsText.split('\n');
  let currentUserAgent = '';
  let isRelevantSection = false;
  const disallowedPaths: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim().toLowerCase();

    if (trimmedLine.startsWith('user-agent:')) {
      const userAgent = trimmedLine.substring(11).trim();
      currentUserAgent = userAgent;
      isRelevantSection =
        userAgent === '*' ||
        userAgent.includes('ai') ||
        userAgent.includes('bot');
    } else if (trimmedLine.startsWith('disallow:') && isRelevantSection) {
      const disallowedPath = trimmedLine.substring(9).trim();
      if (disallowedPath) {
        disallowedPaths.push(disallowedPath);
      }
    }
  }

  // Check if the requested path is disallowed
  for (const disallowedPath of disallowedPaths) {
    if (path.startsWith(disallowedPath)) {
      return false;
    }
  }

  return true;
}

/**
 * Fetch page content with sanitization
 * NOTE: DNS rebinding protection is handled by validateHostnameResolution() in the main handler
 * which runs BEFORE this function is called
 */
async function fetchPageContent(url: URL): Promise<{
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  fetchedAt: string;
  error?: string;
}> {
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'AI-Agent-Fetcher/1.0 (https://your-domain.com)',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        Connection: 'keep-alive',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const sanitizedContent = sanitizeHtml(html);
    const extractedContent = extractMainContent(sanitizedContent);

    return {
      success: true,
      url: url.toString(),
      title: extractedContent.title,
      content: extractedContent.content,
      summary: generateSummary(extractedContent.content),
      metadata: {
        contentLength: extractedContent.content.length,
        wordCount: extractedContent.content.split(/\s+/).length,
        language: extractedContent.language,
        lastModified: response.headers.get('last-modified'),
        contentType: response.headers.get('content-type'),
      },
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Fetch Page] Error fetching content:', error);
    return {
      success: false,
      url: url.toString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Sanitize HTML content
 */
function sanitizeHtml(html: string): string {
  // SECURITY: Using non-backtracking [\s\S]*? patterns to prevent ReDoS
  // Remove script tags and their content
  let sanitized = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove comments
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');

  // Remove noscript tags
  sanitized = sanitized.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // Remove potentially dangerous attributes
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*javascript:/gi, '');

  return sanitized;
}

/**
 * Extract main content from HTML
 */
function extractMainContent(html: string): {
  title: string;
  content: string;
  language: string;
} {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

  // Extract language
  const langMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
  const language = langMatch ? langMatch[1] : 'en';

  // Remove HTML tags and extract text content
  let content = html
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Remove common navigation and footer text
  const unwantedPatterns = [
    /cookie/i,
    /privacy policy/i,
    /terms of service/i,
    /copyright/i,
    /all rights reserved/i,
    /skip to content/i,
    /menu/i,
    /navigation/i,
    /footer/i,
    /sidebar/i,
  ];

  for (const pattern of unwantedPatterns) {
    content = content.replace(pattern, '');
  }

  // Limit content length to prevent excessive data
  if (content.length > 10000) {
    content = content.substring(0, 10000) + '...';
  }

  return {
    title,
    content,
    language,
  };
}

/**
 * Generate a summary of the content
 */
function generateSummary(content: string): string {
  const words = content.split(/\s+/);
  const sentences = content.split(/[.!?]+/);

  if (sentences.length <= 3) {
    return content;
  }

  // Take first few sentences as summary
  const summarySentences = sentences.slice(0, 3).join('. ').trim();
  return summarySentences + (summarySentences.endsWith('.') ? '' : '.');
}

/**
 * Log fetch operation for analytics
 */
async function logFetchOperation(url: string, success: boolean): Promise<void> {
  try {
    const { error } = await supabase.from('web_fetch_logs').insert({
      url,
      success,
      timestamp: new Date().toISOString(),
      user_agent: 'AI-Agent-Fetcher/1.0',
    });

    if (error) {
      console.error('[Fetch Page] Error logging fetch operation:', error);
    }
  } catch (error) {
    console.error(
      '[Fetch Page] Unexpected error logging fetch operation:',
      error
    );
  }
}
