/**
 * Rate Limiter Service
 * Prevents brute force attacks and API abuse
 *
 * Implementation:
 * - In-memory rate limiting with Redis-compatible interface
 * - Configurable limits per endpoint
 * - Exponential backoff for repeated violations
 * - Automatic cleanup of expired entries
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts in window
  blockDurationMs?: number; // How long to block after exceeding (default: windowMs * 2)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds to wait before retry
}

interface RateLimitEntry {
  attempts: number;
  resetAt: number;
  blockedUntil?: number;
}

class RateLimiterService {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed under rate limit
   */
  async check(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil),
        retryAfter,
      };
    }

    // Initialize or reset if window expired
    if (!entry || entry.resetAt < now) {
      const resetAt = now + config.windowMs;
      this.store.set(key, {
        attempts: 1,
        resetAt,
      });

      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(resetAt),
      };
    }

    // Increment attempts
    entry.attempts++;

    // Check if exceeded limit
    if (entry.attempts > config.maxAttempts) {
      const blockDuration = config.blockDurationMs || config.windowMs * 2;
      entry.blockedUntil = now + blockDuration;

      const retryAfter = Math.ceil(blockDuration / 1000);

      console.warn(
        `[Rate Limiter] Key ${key} exceeded limit. Blocked for ${retryAfter}s`
      );

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil),
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining: config.maxAttempts - entry.attempts,
      resetAt: new Date(entry.resetAt),
    };
  }

  /**
   * Reset rate limit for a key (e.g., after successful auth)
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get current status without incrementing
   */
  getStatus(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      return {
        allowed: true,
        remaining: config.maxAttempts,
        resetAt: new Date(now + config.windowMs),
      };
    }

    if (entry.blockedUntil && entry.blockedUntil > now) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil),
        retryAfter,
      };
    }

    if (entry.resetAt < now) {
      return {
        allowed: true,
        remaining: config.maxAttempts,
        resetAt: new Date(now + config.windowMs),
      };
    }

    return {
      allowed: entry.attempts < config.maxAttempts,
      remaining: Math.max(0, config.maxAttempts - entry.attempts),
      resetAt: new Date(entry.resetAt),
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      // Remove if reset time passed and not blocked
      if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Rate Limiter] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Destroy the service (cleanup interval)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiterService();

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    blockDurationMs: 60 * 60 * 1000, // 1 hour block after exceeding
  },

  REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    blockDurationMs: 24 * 60 * 60 * 1000, // 24 hour block
  },

  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
  },

  // API endpoints
  API_CALL: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 60, // 60 requests per minute
  },

  AI_REQUEST: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 20, // 20 AI requests per minute
  },

  // Admin endpoints
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 100,
  },
} as const;

/**
 * Generate rate limit key for user
 */
export function getRateLimitKey(
  type: keyof typeof RATE_LIMITS,
  identifier: string
): string {
  return `ratelimit:${type}:${identifier}`;
}

/**
 * Check rate limit with predefined config
 */
export async function checkRateLimit(
  type: keyof typeof RATE_LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const key = getRateLimitKey(type, identifier);
  const config = RATE_LIMITS[type];
  return rateLimiter.check(key, config);
}

/**
 * Reset rate limit for user (e.g., successful login)
 */
export function resetRateLimit(
  type: keyof typeof RATE_LIMITS,
  identifier: string
): void {
  const key = getRateLimitKey(type, identifier);
  rateLimiter.reset(key);
}
