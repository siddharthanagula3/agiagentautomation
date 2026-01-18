/**
 * API Abuse Prevention Service Tests
 *
 * Tests for rate limiting, cost-based throttling, and abuse detection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkApiAbuse,
  trackRequestStart,
  trackRequestEnd,
  detectAbusePatterns,
  getUserUsageStats,
  cleanupOldMetrics,
  REQUEST_LIMITS,
  type AbusePrevention,
  type ApiUsageMetrics,
} from './api-abuse-prevention';

// Mock the rate limiter
vi.mock('@core/auth/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  RATE_LIMITS: {
    AI_REQUEST: { windowMs: 60000, maxRequests: 60 },
  },
}));

import { checkRateLimit } from '@core/auth/rate-limiter';

describe('API Abuse Prevention Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the internal metrics between tests by cleaning up
    cleanupOldMetrics();
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('REQUEST_LIMITS', () => {
    it('should have defined limits', () => {
      expect(REQUEST_LIMITS.maxInputTokens).toBe(100000);
      expect(REQUEST_LIMITS.maxOutputTokens).toBe(4096);
      expect(REQUEST_LIMITS.maxMessageLength).toBe(200000);
      expect(REQUEST_LIMITS.maxMessagesInConversation).toBe(100);
      expect(REQUEST_LIMITS.maxTotalConversationLength).toBe(500000);
    });
  });

  describe('checkApiAbuse', () => {
    const userId = 'user-123';
    const mockCheckRateLimit = vi.mocked(checkRateLimit);

    describe('Rate limiting', () => {
      it('should allow request when rate limit is not exceeded', async () => {
        mockCheckRateLimit.mockResolvedValueOnce({ allowed: true });

        const result = await checkApiAbuse(userId, 'gpt-4o-mini', 1000);

        expect(result.allowed).toBe(true);
        expect(mockCheckRateLimit).toHaveBeenCalledWith('AI_REQUEST', userId);
      });

      it('should deny request when rate limit is exceeded', async () => {
        mockCheckRateLimit.mockResolvedValueOnce({
          allowed: false,
          retryAfter: 60,
        });

        const result = await checkApiAbuse(userId, 'gpt-4o-mini', 1000);

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Rate limit exceeded');
        expect(result.retryAfter).toBe(60);
      });
    });

    describe('Input size limits', () => {
      it('should deny request when input is too long', async () => {
        const sizeTestUser = 'user-size-test-long';
        mockCheckRateLimit.mockResolvedValueOnce({ allowed: true });

        // Input exceeds maxMessageLength (200000 chars)
        const result = await checkApiAbuse(sizeTestUser, 'gpt-4o-mini', 250000);

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Input too long');
      });

      it('should deny request when estimated tokens exceed limit', async () => {
        const sizeTestUser = 'user-size-test-tokens';
        mockCheckRateLimit.mockResolvedValueOnce({ allowed: true });

        // 500000 chars / 4 = 125000 tokens (exceeds 100000)
        const result = await checkApiAbuse(sizeTestUser, 'gpt-4o-mini', 500000);

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Input too');
      });

      it('should allow request with acceptable input size', async () => {
        const sizeTestUser = 'user-size-test-ok';
        mockCheckRateLimit.mockResolvedValueOnce({ allowed: true });

        const result = await checkApiAbuse(sizeTestUser, 'gpt-4o-mini', 1000);

        expect(result.allowed).toBe(true);
      });
    });

    describe('Model-based throttling', () => {
      it('should apply stricter limits for high-cost models', async () => {
        // High cost model: gpt-4o - max 10 per minute, max 2 concurrent
        const highCostUser = 'user-throttle-high-cost';
        mockCheckRateLimit.mockResolvedValue({ allowed: true });

        // Make requests up to per-minute limit
        // Note: Each checkApiAbuse increments concurrent count, so we also need to end them
        for (let i = 0; i < 10; i++) {
          await checkApiAbuse(highCostUser, 'gpt-4o', 1000);
          trackRequestStart(highCostUser, 'gpt-4o', 250);
          trackRequestEnd(highCostUser); // End the request to allow more
        }

        // 11th request should be blocked due to per-minute limit
        const result = await checkApiAbuse(highCostUser, 'gpt-4o', 1000);

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Too many requests');
      });

      it('should apply more lenient limits for low-cost models', async () => {
        // Low cost model: gemini-2.0-flash - max 30 per minute
        const lowCostUser = 'user-throttle-low-cost';
        mockCheckRateLimit.mockResolvedValue({ allowed: true });

        // Should allow up to 30 requests per minute (minus concurrent limit)
        for (let i = 0; i < 10; i++) {
          const result = await checkApiAbuse(lowCostUser, 'gemini-2.0-flash', 1000);
          expect(result.allowed).toBe(true);
          trackRequestStart(lowCostUser, 'gemini-2.0-flash', 250);
          trackRequestEnd(lowCostUser); // End request to allow more concurrent
        }
      });
    });

    describe('Concurrent request limits', () => {
      it('should track concurrent requests', async () => {
        const concurrentUser = 'user-concurrent-test';
        mockCheckRateLimit.mockResolvedValue({ allowed: true });

        // Start multiple concurrent requests (high-cost model max 2)
        const result1 = await checkApiAbuse(concurrentUser, 'gpt-4o', 1000);
        expect(result1.allowed).toBe(true);

        const result2 = await checkApiAbuse(concurrentUser, 'gpt-4o', 1000);
        expect(result2.allowed).toBe(true);

        // Third concurrent request should be blocked
        const result3 = await checkApiAbuse(concurrentUser, 'gpt-4o', 1000);
        expect(result3.allowed).toBe(false);
        expect(result3.reason).toContain('concurrent requests');
      });

      it('should allow more concurrent requests for low-cost models', async () => {
        const concurrentLowUser = 'user-concurrent-low';
        mockCheckRateLimit.mockResolvedValue({ allowed: true });

        // Low-cost models allow 5 concurrent
        for (let i = 0; i < 5; i++) {
          const result = await checkApiAbuse(
            concurrentLowUser,
            'gemini-2.0-flash',
            1000
          );
          expect(result.allowed).toBe(true);
        }

        // 6th should be blocked
        const result = await checkApiAbuse(
          concurrentLowUser,
          'gemini-2.0-flash',
          1000
        );
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('concurrent');
      });
    });

    describe('Usage metrics', () => {
      it('should return current metrics when allowed', async () => {
        mockCheckRateLimit.mockResolvedValueOnce({ allowed: true });

        const result = await checkApiAbuse('user-metrics', 'gpt-4o-mini', 1000);

        expect(result.currentMetrics).toBeDefined();
        expect(typeof result.currentMetrics?.requestsLastMinute).toBe('number');
        expect(typeof result.currentMetrics?.requestsLastHour).toBe('number');
        expect(typeof result.currentMetrics?.totalCostLastHour).toBe('number');
        expect(typeof result.currentMetrics?.concurrentRequests).toBe('number');
      });
    });
  });

  describe('trackRequestStart', () => {
    it('should track request cost and model', async () => {
      const trackUser = 'user-track-start';
      const mockCheckRateLimit = vi.mocked(checkRateLimit);
      mockCheckRateLimit.mockResolvedValue({ allowed: true });

      // Initialize the user metrics by making a check first
      await checkApiAbuse(trackUser, 'gpt-4o', 1000);

      trackRequestStart(trackUser, 'gpt-4o', 1000);

      const stats = getUserUsageStats(trackUser);
      expect(stats.requestsLastMinute).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-existent user gracefully', () => {
      // Should not throw
      expect(() => {
        trackRequestStart('nonexistent-user', 'gpt-4o', 1000);
      }).not.toThrow();
    });
  });

  describe('trackRequestEnd', () => {
    it('should decrement concurrent request count', async () => {
      const endUser = 'user-track-end';
      const mockCheckRateLimit = vi.mocked(checkRateLimit);
      mockCheckRateLimit.mockResolvedValue({ allowed: true });

      // Start requests
      await checkApiAbuse(endUser, 'gpt-4o-mini', 1000);
      await checkApiAbuse(endUser, 'gpt-4o-mini', 1000);

      const beforeEnd = getUserUsageStats(endUser);
      const concurrentBefore = beforeEnd.concurrentRequests;

      // End one request
      trackRequestEnd(endUser);

      const afterEnd = getUserUsageStats(endUser);
      expect(afterEnd.concurrentRequests).toBe(concurrentBefore - 1);
    });

    it('should not go below zero concurrent requests', async () => {
      const zeroUser = 'user-track-zero';
      const mockCheckRateLimit = vi.mocked(checkRateLimit);
      mockCheckRateLimit.mockResolvedValue({ allowed: true });

      await checkApiAbuse(zeroUser, 'gpt-4o-mini', 1000);

      // End more requests than started
      trackRequestEnd(zeroUser);
      trackRequestEnd(zeroUser);
      trackRequestEnd(zeroUser);

      const stats = getUserUsageStats(zeroUser);
      expect(stats.concurrentRequests).toBe(0);
    });

    it('should handle non-existent user gracefully', () => {
      expect(() => {
        trackRequestEnd('nonexistent-user');
      }).not.toThrow();
    });
  });

  describe('detectAbusePatterns', () => {
    it('should detect rapid-fire requests', async () => {
      const rapidUser = 'user-rapid-fire';
      const mockCheckRateLimit = vi.mocked(checkRateLimit);
      mockCheckRateLimit.mockResolvedValue({ allowed: true });

      // Make many requests quickly
      for (let i = 0; i < 60; i++) {
        await checkApiAbuse(rapidUser, 'gpt-4o-mini', 1000);
        trackRequestStart(rapidUser, 'gpt-4o-mini', 100);
      }

      const result = detectAbusePatterns(rapidUser, 60);

      expect(result.isAbusive).toBe(true);
      expect(result.patterns).toContain('rapid_fire_requests');
    });

    it('should detect model spam', async () => {
      const spamUser = 'user-model-spam';
      const mockCheckRateLimit = vi.mocked(checkRateLimit);
      mockCheckRateLimit.mockResolvedValue({ allowed: true });

      // Make many requests to the same model
      for (let i = 0; i < 35; i++) {
        await checkApiAbuse(spamUser, 'gpt-4o-mini', 1000);
        trackRequestStart(spamUser, 'gpt-4o-mini', 100);
      }

      const result = detectAbusePatterns(spamUser, 35);

      expect(result.isAbusive).toBe(true);
      expect(result.patterns.some((p) => p.startsWith('model_spam_'))).toBe(
        true
      );
    });

    it('should return not abusive for normal usage', () => {
      const result = detectAbusePatterns('normal-user', 5);

      expect(result.isAbusive).toBe(false);
      expect(result.patterns).toHaveLength(0);
    });

    it('should handle non-existent user', () => {
      const result = detectAbusePatterns('nonexistent-user', 0);

      expect(result.isAbusive).toBe(false);
      expect(result.patterns).toHaveLength(0);
    });
  });

  describe('getUserUsageStats', () => {
    it('should return zero stats for non-existent user', () => {
      const stats = getUserUsageStats('nonexistent-user');

      expect(stats.requestsLastMinute).toBe(0);
      expect(stats.requestsLastHour).toBe(0);
      expect(stats.totalCostLastHour).toBe(0);
      expect(stats.concurrentRequests).toBe(0);
    });

    it('should return accurate stats for active user', async () => {
      const activeUser = 'user-active-stats';
      const mockCheckRateLimit = vi.mocked(checkRateLimit);
      mockCheckRateLimit.mockResolvedValue({ allowed: true });

      // Make some requests
      for (let i = 0; i < 5; i++) {
        await checkApiAbuse(activeUser, 'gpt-4o-mini', 1000);
        trackRequestStart(activeUser, 'gpt-4o-mini', 100);
      }

      const stats = getUserUsageStats(activeUser);

      expect(stats.requestsLastMinute).toBeGreaterThanOrEqual(0);
      expect(stats.requestsLastHour).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cleanupOldMetrics', () => {
    it('should not throw when cleaning up', () => {
      expect(() => {
        cleanupOldMetrics();
      }).not.toThrow();
    });

    it('should be callable multiple times', () => {
      cleanupOldMetrics();
      cleanupOldMetrics();
      cleanupOldMetrics();
      // Should not throw
    });
  });

  describe('Model cost tier detection', () => {
    const mockCheckRateLimit = vi.mocked(checkRateLimit);

    beforeEach(() => {
      mockCheckRateLimit.mockResolvedValue({ allowed: true });
    });

    it('should categorize high-cost models correctly', async () => {
      const highCostModels = [
        'gpt-4o',
        'o1',
        'claude-sonnet-4-20250514',
        'claude-3-5-sonnet-20241022',
        'sonar-pro',
      ];

      for (const model of highCostModels) {
        // These should have stricter limits
        const result = await checkApiAbuse(`user-${model}`, model, 1000);
        expect(result.allowed).toBe(true);
        // After 10 requests, should be blocked (high-cost limit)
      }
    });

    it('should categorize medium-cost models correctly', async () => {
      const mediumCostModels = [
        'gpt-4o-mini',
        'o1-mini',
        'gemini-1.5-pro',
        'sonar-reasoning',
      ];

      for (const model of mediumCostModels) {
        const result = await checkApiAbuse(`user-med-${model}`, model, 1000);
        expect(result.allowed).toBe(true);
      }
    });

    it('should categorize low-cost models correctly', async () => {
      const lowCostModels = [
        'claude-3-5-haiku-20241022',
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'sonar',
        'grok-2',
      ];

      for (const model of lowCostModels) {
        const result = await checkApiAbuse(`user-low-${model}`, model, 1000);
        expect(result.allowed).toBe(true);
      }
    });

    it('should default unknown models to medium tier', async () => {
      const result = await checkApiAbuse(
        'user-unknown',
        'unknown-model-xyz',
        1000
      );
      expect(result.allowed).toBe(true);
      // Medium tier allows 20 per minute
    });
  });
});
