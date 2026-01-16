/**
 * Rate Limiting Utility for Netlify Functions
 * Uses Upstash Redis for distributed rate limiting
 * Updated: Jan 6th 2026 - Fixed JWT verification to use Supabase instead of decoding without verification
 * Updated: Jan 10th 2026 - Added tiered rate limiting for different endpoint types
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { HandlerEvent, HandlerResponse } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// =============================================================================
// RATE LIMIT TIERS
// SECURITY: Different limits for different endpoint types to prevent abuse
// =============================================================================

export type RateLimitTier = 'public' | 'authenticated' | 'payment' | 'webhook';

/**
 * Rate limit configuration per tier
 * - public: Unauthenticated endpoints (stricter)
 * - authenticated: Standard authenticated endpoints
 * - payment: Billing/payment endpoints (restrictive to prevent spam)
 * - webhook: Webhook endpoints (higher limit for legitimate traffic)
 */
const RATE_LIMIT_TIERS: Record<RateLimitTier, { requests: number; window: string }> = {
  public: { requests: 5, window: '1 m' },      // 5 req/min for unauthenticated
  authenticated: { requests: 10, window: '1 m' }, // 10 req/min (default)
  payment: { requests: 5, window: '1 m' },     // 5 req/min for payment endpoints
  webhook: { requests: 100, window: '1 m' },   // 100 req/min for webhooks (high volume)
};

// Initialize Redis client
let redis: Redis | null = null;
const rateLimiters: Map<RateLimitTier, Ratelimit> = new Map();

/**
 * Get or create Redis client instance
 */
function getRedisClient(): Redis | null {
  if (redis) return redis;

  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn(
      '[Rate Limiter] Redis not configured. Rate limiting is DISABLED. ' +
        'Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in production. ' +
        'WARNING: In-memory rate limiting does not work in serverless environments ' +
        'as each function invocation is stateless. Use Redis for production.'
    );
    return null;
  }

  redis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });

  return redis;
}

/**
 * Initialize rate limiter for a specific tier
 * Uses sliding window algorithm for fair distribution
 */
function initializeRateLimiter(tier: RateLimitTier = 'authenticated'): Ratelimit | null {
  // Check if already initialized for this tier
  const existingLimiter = rateLimiters.get(tier);
  if (existingLimiter) return existingLimiter;

  const redisClient = getRedisClient();
  if (!redisClient) return null;

  const config = RATE_LIMIT_TIERS[tier];

  // Create rate limiter with sliding window algorithm
  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(config.requests, config.window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
    prefix: `agi-agent-${tier}`,
  });

  rateLimiters.set(tier, limiter);
  return limiter;
}

// Backwards compatibility: default rate limiter
function initializeDefaultRateLimiter(): Ratelimit | null {
  return initializeRateLimiter('authenticated');
}

// Keep old function name for backwards compatibility
const ratelimit = null; // Deprecated, use initializeRateLimiter(tier) instead

/**
 * Extract user identifier from request
 * Priority: Auth header (verified via Supabase) > IP address > Default
 * Updated: Jan 6th 2026 - Fixed JWT verification security vulnerability
 * SECURITY: JWT is now properly verified via Supabase instead of just decoded
 */
async function getUserIdentifier(event: HandlerEvent): Promise<string> {
  // Try to get user ID from auth header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');

      // SECURITY FIX: Properly verify JWT using Supabase instead of just decoding
      // Previous implementation only decoded the JWT without verification, which is insecure
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
          console.log('[Rate Limiter] JWT verified successfully for user:', user.id);
          return `user:${user.id}`;
        }

        if (error) {
          console.warn('[Rate Limiter] JWT verification failed:', error.message);
        }
      } else {
        console.warn('[Rate Limiter] Supabase credentials not configured, falling back to token hash');
      }

      // If JWT verification fails, use a hash of the token for rate limiting
      // This prevents token manipulation while maintaining uniqueness
      // But the request will likely fail auth middleware anyway
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      return `token:${hash.substring(0, 32)}`;
    } catch (error) {
      console.error('[Rate Limiter] Failed to verify auth token:', error);
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
 * Rate limit result type
 */
export interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  statusCode?: number;
  body?: string;
}

/**
 * Check rate limit for a request with specified tier
 * Returns { success: true } if allowed, { success: false, ... } if rate limited
 * Updated: Jan 6th 2026 - Now awaits async getUserIdentifier for proper JWT verification
 * Updated: Jan 10th 2026 - Added tier parameter for different rate limit levels
 */
export async function checkRateLimitWithTier(
  event: HandlerEvent,
  tier: RateLimitTier = 'authenticated'
): Promise<RateLimitResult> {
  const limiter = initializeRateLimiter(tier);
  const config = RATE_LIMIT_TIERS[tier];

  // If rate limiter is not configured, allow all requests (local dev)
  if (!limiter) {
    return { success: true };
  }

  // For webhook tier, use IP-based identification only
  // For other tiers, try user-based first
  const identifier =
    tier === 'webhook'
      ? `ip:${getClientIP(event)}`
      : await getUserIdentifier(event);

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      console.warn(
        `[Rate Limiter] Rate limit exceeded for ${identifier} (tier: ${tier}). ` +
          `Limit: ${limit}, Reset: ${new Date(reset).toISOString()}`
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
          tier,
        }),
      };
    }

    console.log(
      `[Rate Limiter] Request allowed for ${identifier} (tier: ${tier}). Remaining: ${remaining}/${limit}`
    );

    return {
      success: true,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('[Rate Limiter] Error checking rate limit:', error);
    // SECURITY FIX: Fail closed instead of fail open
    // On error, deny the request to prevent abuse when rate limiter is unavailable
    // This is more secure than allowing unlimited requests during outages
    return {
      success: false,
      statusCode: 503,
      body: JSON.stringify({
        error: 'Service temporarily unavailable',
        message: 'Rate limiting service is currently unavailable. Please try again in a few moments.',
        retryAfter: 30,
      }),
    };
  }
}

/**
 * Check rate limit for a request (backwards compatible)
 * Uses 'authenticated' tier by default
 */
export async function checkRateLimit(event: HandlerEvent): Promise<RateLimitResult> {
  return checkRateLimitWithTier(event, 'authenticated');
}

/**
 * Extract client IP address from request headers
 * SECURITY: Properly extracts IP for rate limiting purposes
 */
function getClientIP(event: HandlerEvent): string {
  return (
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    event.headers['X-Forwarded-For']?.split(',')[0]?.trim() ||
    event.headers['client-ip'] ||
    'unknown'
  );
}

/**
 * Rate limit middleware wrapper
 * Usage: export const handler = withRateLimit(yourHandler);
 */
// Updated: Nov 16th 2025 - Fixed any type
export function withRateLimit(
  handler: (event: HandlerEvent) => Promise<HandlerResponse>
): (event: HandlerEvent) => Promise<HandlerResponse> {
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

/**
 * Rate limit middleware wrapper with configurable tier
 * Usage: export const handler = withRateLimitTier('payment')(yourHandler);
 * Updated: Jan 10th 2026 - Added for tiered rate limiting support
 */
export function withRateLimitTier(tier: RateLimitTier) {
  return function (
    handler: (event: HandlerEvent) => Promise<HandlerResponse>
  ): (event: HandlerEvent) => Promise<HandlerResponse> {
    return async (event: HandlerEvent) => {
      const rateLimitResult = await checkRateLimitWithTier(event, tier);

      if (!rateLimitResult.success) {
        return {
          statusCode: rateLimitResult.statusCode || 429,
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
  };
}
