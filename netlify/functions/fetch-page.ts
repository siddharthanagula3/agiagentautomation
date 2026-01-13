/**
 * Fetch Page API - Web content fetching with robots.txt compliance
 * Fetches and sanitizes web content while respecting robots.txt and rate limits
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from './utils/auth-middleware';
import { withRateLimit, checkRateLimitWithTier } from './utils/rate-limiter';
import { getCorsHeaders } from './utils/cors';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * SSRF Protection: Check if hostname is private/reserved (synchronous check)
 * This blocks obvious private hosts before DNS resolution
 */
function isPrivateOrReservedHost(hostname: string): boolean {
  // Block localhost variants
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }

  // Block private IP ranges (when hostname is an IP address)
  const privatePatterns = [
    /^10\./,                                      // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./,                // 172.16.0.0/12
    /^192\.168\./,                               // 192.168.0.0/16
    /^169\.254\./,                               // Link-local 169.254.0.0/16
    /^0\./,                                      // 0.0.0.0/8
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // Carrier-grade NAT 100.64.0.0/10
    /^127\./,                                    // Loopback 127.0.0.0/8
  ];

  return privatePatterns.some(pattern => pattern.test(hostname));
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
 * Updated: Nov 16th 2025 - Fixed SSRF vulnerability - validate IP addresses
 * Check if hostname resolves to a private/internal IP address
 */
async function isPrivateOrInternalIP(hostname: string): Promise<boolean> {
  try {
    const dns = await import('dns').then((m) => m.promises);
    const addresses = await dns.resolve4(hostname).catch(() => [] as string[]);

    for (const address of addresses) {
      const octets = address.split('.').map(Number);

      // Check for private IP ranges
      // 10.0.0.0/8
      if (octets[0] === 10) return true;
      // 172.16.0.0/12
      if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
      // 192.168.0.0/16
      if (octets[0] === 192 && octets[1] === 168) return true;
      // 127.0.0.0/8 (localhost)
      if (octets[0] === 127) return true;
      // 169.254.0.0/16 (link-local)
      if (octets[0] === 169 && octets[1] === 254) return true;
      // 0.0.0.0/8
      if (octets[0] === 0) return true;
    }

    return false;
  } catch (error) {
    // If DNS resolution fails, allow the request (fail open)
    // but log the error for monitoring
    console.warn('[Fetch Page] DNS resolution failed:', error);
    return false;
  }
}

/**
 * Fetch page content with sanitization
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
    // Updated: Nov 16th 2025 - Fixed SSRF vulnerability - block private/internal IP addresses
    const isPrivate = await isPrivateOrInternalIP(url.hostname);
    if (isPrivate) {
      throw new Error(
        'Access to private/internal IP addresses is not allowed for security reasons'
      );
    }

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
