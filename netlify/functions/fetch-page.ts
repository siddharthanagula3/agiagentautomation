/**
 * Fetch Page API - Web content fetching with robots.txt compliance
 * Fetches and sanitizes web content while respecting robots.txt and rate limits
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
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
          'Access-Control-Allow-Origin': '*',
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
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid URL format' }),
      };
    }

    // Check rate limits
    const domain = parsedUrl.hostname;
    if (!checkRateLimit(domain)) {
      return {
        statusCode: 429,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests to this domain. Please try again later.',
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
          'Access-Control-Allow-Origin': '*',
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
        'Access-Control-Allow-Origin': '*',
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
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Check rate limits for domain
 */
function checkRateLimit(domain: string): boolean {
  const now = Date.now();
  const key = `rate_limit_${domain}`;
  const limit = rateLimitStore.get(key);

  if (!limit || now > limit.resetTime) {
    // Reset or initialize rate limit
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + 60000, // 1 minute window
    });
    return true;
  }

  if (limit.count >= 10) {
    // 10 requests per minute
    return false;
  }

  limit.count++;
  return true;
}

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
 */
async function fetchPageContent(url: URL): Promise<any> {
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
  // Remove script tags and their content
  let sanitized = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  // Remove style tags and their content
  sanitized = sanitized.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ''
  );

  // Remove comments
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');

  // Remove noscript tags
  sanitized = sanitized.replace(
    /<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi,
    ''
  );

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
