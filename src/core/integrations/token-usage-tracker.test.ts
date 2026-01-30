/**
 * Token Usage Tracker Tests
 * Unit tests for the Token Logger Service that tracks LLM token usage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  tokenLogger,
  logTokenUsage,
  type TokenLogEntry,
  type SessionTokenSummary,
} from './token-usage-tracker';

// Mock the UsageTracker class - define inside factory to avoid hoisting issues
vi.mock('@features/billing/services/usage-monitor', () => {
  const mockFn = vi.fn().mockResolvedValue(undefined);
  return {
    UsageTracker: class MockUsageTracker {
      trackAPICall = mockFn;
      static __mockTrackAPICall = mockFn;
    },
    __getMockTrackAPICall: () => mockFn,
  };
});

describe('Token Usage Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenLogger.clearAllCaches();

    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenLogger.clearAllCaches();
  });

  describe('logTokenUsage', () => {
    it('should log token usage successfully', async () => {
      await tokenLogger.logTokenUsage(
        'gpt-4o',
        100,
        'user-123',
        'session-456',
        'agent-789',
        'Test Agent',
        40,
        60,
        'Test task'
      );

      const summary = tokenLogger.getSessionSummary('session-456');

      expect(summary).toBeDefined();
      expect(summary?.totalTokens).toBe(100);
      expect(summary?.userId).toBe('user-123');
    });

    it('should use default session ID when not provided', async () => {
      await tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123');

      const summary = tokenLogger.getSessionSummary('default');

      expect(summary).toBeDefined();
      expect(summary?.totalTokens).toBe(100);
    });

    it('should accumulate tokens for same session', async () => {
      await tokenLogger.logTokenUsage(
        'gpt-4o',
        100,
        'user-123',
        'session-1'
      );
      await tokenLogger.logTokenUsage(
        'gpt-4o',
        150,
        'user-123',
        'session-1'
      );

      const summary = tokenLogger.getSessionSummary('session-1');

      expect(summary?.totalTokens).toBe(250);
    });

    it('should track by model correctly', async () => {
      await tokenLogger.logTokenUsage(
        'gpt-4o',
        100,
        'user-123',
        'session-1',
        undefined,
        undefined,
        40,
        60
      );
      await tokenLogger.logTokenUsage(
        'claude-3-5-sonnet-20241022',
        200,
        'user-123',
        'session-1',
        undefined,
        undefined,
        80,
        120
      );

      const summary = tokenLogger.getSessionSummary('session-1');

      expect(summary?.byModel['gpt-4o']).toBeDefined();
      expect(summary?.byModel['gpt-4o'].totalTokens).toBe(100);
      expect(summary?.byModel['claude-3-5-sonnet-20241022']).toBeDefined();
      expect(summary?.byModel['claude-3-5-sonnet-20241022'].totalTokens).toBe(
        200
      );
    });

    it('should calculate cost correctly', async () => {
      await tokenLogger.logTokenUsage(
        'gpt-4o',
        1000,
        'user-123',
        'session-1',
        undefined,
        undefined,
        400,
        600
      );

      const summary = tokenLogger.getSessionSummary('session-1');

      // gpt-4o: input $2.5/1M, output $10/1M
      // 400 input tokens = 0.001, 600 output tokens = 0.006
      expect(summary?.totalCost).toBeGreaterThan(0);
    });

    it('should estimate input/output tokens when not provided', async () => {
      await tokenLogger.logTokenUsage('gpt-4o', 1000, 'user-123', 'session-1');

      const logs = tokenLogger.getSessionLogs('session-1');

      expect(logs[0].inputTokens).toBe(400); // 40% of 1000
      expect(logs[0].outputTokens).toBe(600); // 60% of 1000
    });

    it('should use provided agent info', async () => {
      await tokenLogger.logTokenUsage(
        'gpt-4o',
        100,
        'user-123',
        'session-1',
        'agent-custom',
        'Custom Agent Name'
      );

      const logs = tokenLogger.getSessionLogs('session-1');

      expect(logs[0].agentId).toBe('agent-custom');
      expect(logs[0].agentName).toBe('Custom Agent Name');
    });

    it('should handle concurrent calls safely', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123', 'session-1')
      );

      await Promise.all(promises);

      const summary = tokenLogger.getSessionSummary('session-1');
      expect(summary?.totalTokens).toBe(1000);
    });

    it('should increment call count per model', async () => {
      await tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123', 'session-1');
      await tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123', 'session-1');
      await tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123', 'session-1');

      const summary = tokenLogger.getSessionSummary('session-1');

      expect(summary?.byModel['gpt-4o'].callCount).toBe(3);
    });
  });

  describe('calculateCost', () => {
    it('should calculate GPT-4o cost correctly', () => {
      const cost = tokenLogger.calculateCost('gpt-4o', 1000000, 1000000);

      // Input: $2.5/1M, Output: $10/1M
      expect(cost).toBe(12.5);
    });

    it('should calculate Claude cost correctly', () => {
      const cost = tokenLogger.calculateCost(
        'claude-3-5-sonnet-20241022',
        1000000,
        1000000
      );

      // Input: $3/1M, Output: $15/1M
      expect(cost).toBe(18);
    });

    it('should calculate Gemini cost correctly', () => {
      const cost = tokenLogger.calculateCost('gemini-2.0-flash', 1000000, 1000000);

      // Input: $0.1/1M, Output: $0.4/1M
      expect(cost).toBe(0.5);
    });

    it('should use default pricing for unknown models', () => {
      const cost = tokenLogger.calculateCost('unknown-model', 1000000, 1000000);

      // Default: $1/1M for both
      expect(cost).toBe(2);
    });

    it('should handle zero tokens', () => {
      const cost = tokenLogger.calculateCost('gpt-4o', 0, 0);

      expect(cost).toBe(0);
    });
  });

  describe('getSessionSummary', () => {
    it('should return null for non-existent session', () => {
      const summary = tokenLogger.getSessionSummary('non-existent');

      expect(summary).toBeNull();
    });

    it('should return correct session summary', async () => {
      await tokenLogger.logTokenUsage(
        'gpt-4o',
        100,
        'user-123',
        'session-1',
        undefined,
        undefined,
        40,
        60
      );

      const summary = tokenLogger.getSessionSummary('session-1');

      expect(summary?.sessionId).toBe('session-1');
      expect(summary?.userId).toBe('user-123');
      expect(summary?.totalTokens).toBe(100);
      expect(summary?.startTime).toBeInstanceOf(Date);
      expect(summary?.lastUpdate).toBeInstanceOf(Date);
    });
  });

  describe('getSessionLogs', () => {
    it('should return empty array for non-existent session', () => {
      const logs = tokenLogger.getSessionLogs('non-existent');

      expect(logs).toEqual([]);
    });

    it('should return all logs for session', async () => {
      await tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123', 'session-1');
      await tokenLogger.logTokenUsage(
        'claude-3-5-sonnet-20241022',
        200,
        'user-123',
        'session-1'
      );

      const logs = tokenLogger.getSessionLogs('session-1');

      expect(logs.length).toBe(2);
    });

    it('should include task description in logs', async () => {
      await tokenLogger.logTokenUsage(
        'gpt-4o',
        100,
        'user-123',
        'session-1',
        undefined,
        undefined,
        undefined,
        undefined,
        'Generating code review'
      );

      const logs = tokenLogger.getSessionLogs('session-1');

      expect(logs[0].taskDescription).toBe('Generating code review');
    });
  });

  describe('getRealtimeUsage', () => {
    it('should return zeros for non-existent session', () => {
      const usage = tokenLogger.getRealtimeUsage('non-existent');

      expect(usage.totalTokens).toBe(0);
      expect(usage.totalCost).toBe(0);
      expect(usage.byModel).toEqual({});
    });

    it('should return current usage', async () => {
      await tokenLogger.logTokenUsage(
        'gpt-4o',
        100,
        'user-123',
        'session-1',
        undefined,
        undefined,
        40,
        60
      );

      const usage = tokenLogger.getRealtimeUsage('session-1');

      expect(usage.totalTokens).toBe(100);
      expect(usage.totalCost).toBeGreaterThan(0);
      expect(usage.byModel['gpt-4o']).toBeDefined();
    });
  });

  describe('clearSessionCache', () => {
    it('should clear specific session cache', async () => {
      await tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123', 'session-1');
      await tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123', 'session-2');

      tokenLogger.clearSessionCache('session-1');

      expect(tokenLogger.getSessionSummary('session-1')).toBeNull();
      expect(tokenLogger.getSessionSummary('session-2')).not.toBeNull();
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all session caches', async () => {
      await tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123', 'session-1');
      await tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123', 'session-2');

      tokenLogger.clearAllCaches();

      expect(tokenLogger.getSessionSummary('session-1')).toBeNull();
      expect(tokenLogger.getSessionSummary('session-2')).toBeNull();
    });
  });

  describe('static methods', () => {
    // Define interface for static methods on TokenLoggerService constructor
    interface TokenLoggerServiceStatic {
      getSupportedModels(): string[];
      getModelPricing(model: string): { input: number; output: number; provider: string } | null;
    }

    it('should return supported models', () => {
      const TokenLoggerClass = tokenLogger.constructor as unknown as TokenLoggerServiceStatic;
      const models = TokenLoggerClass.getSupportedModels();

      expect(models).toContain('gpt-4o');
      expect(models).toContain('claude-3-5-sonnet-20241022');
      expect(models).toContain('gemini-2.0-flash');
    });

    it('should return model pricing', () => {
      const TokenLoggerClass = tokenLogger.constructor as unknown as TokenLoggerServiceStatic;
      const pricing = TokenLoggerClass.getModelPricing('gpt-4o');

      expect(pricing?.input).toBe(2.5);
      expect(pricing?.output).toBe(10.0);
      expect(pricing?.provider).toBe('openai');
    });

    it('should return null for unknown model pricing', () => {
      const TokenLoggerClass = tokenLogger.constructor as unknown as TokenLoggerServiceStatic;
      const pricing = TokenLoggerClass.getModelPricing('unknown-model');

      expect(pricing).toBeNull();
    });
  });

  describe('convenience function', () => {
    it('should log token usage through convenience function', async () => {
      await logTokenUsage('gpt-4o', 100, 'user-123');

      const summary = tokenLogger.getSessionSummary('default');

      expect(summary?.totalTokens).toBe(100);
    });
  });

  describe('provider detection', () => {
    it('should detect OpenAI provider', async () => {
      await tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123', 'session-1');

      const logs = tokenLogger.getSessionLogs('session-1');
      const summary = tokenLogger.getSessionSummary('session-1');

      expect(logs[0].provider).toBe('openai');
      expect(summary?.byModel['gpt-4o'].provider).toBe('openai');
    });

    it('should detect Anthropic provider', async () => {
      await tokenLogger.logTokenUsage(
        'claude-3-5-sonnet-20241022',
        100,
        'user-123',
        'session-1'
      );

      const logs = tokenLogger.getSessionLogs('session-1');

      expect(logs[0].provider).toBe('anthropic');
    });

    it('should detect Google provider', async () => {
      await tokenLogger.logTokenUsage(
        'gemini-2.0-flash',
        100,
        'user-123',
        'session-1'
      );

      const logs = tokenLogger.getSessionLogs('session-1');

      expect(logs[0].provider).toBe('google');
    });

    it('should detect Perplexity provider', async () => {
      await tokenLogger.logTokenUsage(
        'sonar-pro',
        100,
        'user-123',
        'session-1'
      );

      const logs = tokenLogger.getSessionLogs('session-1');

      expect(logs[0].provider).toBe('perplexity');
    });

    it('should detect Grok provider', async () => {
      await tokenLogger.logTokenUsage('grok-2', 100, 'user-123', 'session-1');

      const logs = tokenLogger.getSessionLogs('session-1');

      expect(logs[0].provider).toBe('grok');
    });
  });

  describe('pricing accuracy', () => {
    it('should use correct GPT-4o pricing', async () => {
      await tokenLogger.logTokenUsage(
        'gpt-4o',
        1000000,
        'user-123',
        'session-1',
        undefined,
        undefined,
        500000, // 500K input
        500000 // 500K output
      );

      const summary = tokenLogger.getSessionSummary('session-1');

      // Input: 0.5M * $2.5/1M = $1.25
      // Output: 0.5M * $10/1M = $5.00
      // Total: $6.25
      expect(summary?.totalCost).toBeCloseTo(6.25, 2);
    });

    it('should use correct GPT-4o-mini pricing', async () => {
      await tokenLogger.logTokenUsage(
        'gpt-4o-mini',
        1000000,
        'user-123',
        'session-1',
        undefined,
        undefined,
        500000,
        500000
      );

      const summary = tokenLogger.getSessionSummary('session-1');

      // Input: 0.5M * $0.15/1M = $0.075
      // Output: 0.5M * $0.6/1M = $0.30
      // Total: $0.375
      expect(summary?.totalCost).toBeCloseTo(0.375, 3);
    });

    it('should use correct Claude Haiku pricing', async () => {
      await tokenLogger.logTokenUsage(
        'claude-3-5-haiku-20241022',
        1000000,
        'user-123',
        'session-1',
        undefined,
        undefined,
        500000,
        500000
      );

      const summary = tokenLogger.getSessionSummary('session-1');

      // Input: 0.5M * $0.25/1M = $0.125
      // Output: 0.5M * $1.25/1M = $0.625
      // Total: $0.75
      expect(summary?.totalCost).toBeCloseTo(0.75, 2);
    });
  });

  describe('error handling', () => {
    it('should warn on token mismatch', async () => {
      const warnSpy = vi.spyOn(console, 'warn');

      await tokenLogger.logTokenUsage(
        'gpt-4o',
        100,
        'user-123',
        'session-1',
        undefined,
        undefined,
        20, // Input
        30 // Output - total is 50, not 100
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Token mismatch')
      );
    });

    it('should handle database persistence errors gracefully', async () => {
      // Get the mock from the module
      const { __getMockTrackAPICall } = await import(
        '@features/billing/services/usage-monitor'
      ) as { __getMockTrackAPICall: () => ReturnType<typeof vi.fn> };
      const mockTrackAPICall = __getMockTrackAPICall();

      // Make the mock trackAPICall reject for this test
      mockTrackAPICall.mockRejectedValueOnce(new Error('DB error'));

      const errorSpy = vi.spyOn(console, 'error');

      // Should not throw
      await tokenLogger.logTokenUsage('gpt-4o', 100, 'user-123', 'session-db-error');

      // In-memory tracking should still work
      const summary = tokenLogger.getSessionSummary('session-db-error');
      expect(summary?.totalTokens).toBe(100);

      // Error should have been logged
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TokenLogger] Failed to persist to database:'),
        expect.any(Error)
      );
    });
  });
});
