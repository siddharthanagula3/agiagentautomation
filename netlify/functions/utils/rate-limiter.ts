/**
 * Rate Limiting Utility for Netlify Functions
 * Uses Upstash Redis for distributed rate limiting
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { HandlerEvent } from '@netlify/functions';

// Initialize Redis client
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

function initializeRateLimiter() {
  if (ratelimit) return ratelimit;

  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  // If Redis is not configured, return a pass-through rate limiter (for local dev)
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn(
      '[Rate Limiter] Redis not configured. Rate limiting is DISABLED. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in production.'
    );
    return null;
  }

  // Create Redis client
  redis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });

  // Create rate limiter with sliding window algorithm
  // 10 requests per minute per user
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'agi-agent',
  });

  return ratelimit;
}

/**
 * Extract user identifier from request
 * Priority: Auth header > IP address > Default
 */
function getUserIdentifier(event: HandlerEvent): string {
  // Try to get user ID from auth header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (authHeader) {
    // Extract user ID from JWT or session token
    try {
      const token = authHeader.replace('Bearer ', '');
      // For now, use the token itself as identifier
      // In production, you'd decode the JWT and extract user ID
      return `user:${token.substring(0, 16)}`;
    } catch (error) {
      console.error('[Rate Limiter] Failed to parse auth token:', error);
    }
  }

  // Fall back to IP address
  const ip =
    event.headers['x-forwarded-for'] ||
    event.headers['X-Forwarded-For'] ||
    event.headers['client-ip'] ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Check rate limit for a request
 * Returns { success: true } if allowed, { success: false, ... } if rate limited
 */
export async function checkRateLimit(event: HandlerEvent): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  statusCode?: number;
  body?: string;
}> {
  const limiter = initializeRateLimiter();

  // If rate limiter is not configured, allow all requests (local dev)
  if (!limiter) {
    return { success: true };
  }

  const identifier = getUserIdentifier(event);

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      console.warn(
        `[Rate Limiter] Rate limit exceeded for ${identifier}. Limit: ${limit}, Reset: ${new Date(reset).toISOString()}`
      );

      return {
        success: false,
        limit,
        remaining: 0,
        reset,
        statusCode: 429,
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          message: `You have exceeded the rate limit of ${limit} requests per minute. Please try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
          limit,
          remaining: 0,
          reset: new Date(reset).toISOString(),
        }),
      };
    }

    console.log(
      `[Rate Limiter] Request allowed for ${identifier}. Remaining: ${remaining}/${limit}`
    );

    return {
      success: true,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('[Rate Limiter] Error checking rate limit:', error);
    // On error, allow the request (fail open)
    return { success: true };
  }
}

/**
 * Rate limit middleware wrapper
 * Usage: export const handler = withRateLimit(yourHandler);
 */
export function withRateLimit(
  handler: (event: HandlerEvent) => Promise<any>
): (event: HandlerEvent) => Promise<any> {
  return async (event: HandlerEvent) => {
    const rateLimitResult = await checkRateLimit(event);

    if (!rateLimitResult.success) {
      return {
        statusCode: rateLimitResult.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '',
          'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '',
          'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '',
          'Retry-After': rateLimitResult.reset
            ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
            : '60',
        },
        body: rateLimitResult.body,
      };
    }

    // Add rate limit headers to successful responses
    const result = await handler(event);

    return {
      ...result,
      headers: {
        ...(result.headers || {}),
        'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '',
        'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '',
        'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '',
      },
    };
  };
}
