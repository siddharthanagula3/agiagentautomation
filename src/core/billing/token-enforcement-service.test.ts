/**
 * Token Enforcement Service Tests
 *
 * Tests for the critical billing/token enforcement functionality.
 * Ensures users cannot exceed their token balance and proper deductions occur.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkTokenSufficiency,
  deductTokens,
  getUserTokenBalance,
  estimateTokensForRequest,
  checkMonthlyAllowance,
  canUserMakeRequest,
  type TokenCheckResult,
  type TokenDeductionResult,
  type UsageMetadata,
} from './token-enforcement-service';

// Mock Supabase client
vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          gte: vi.fn(),
        })),
      })),
    })),
  },
}));

import { supabase } from '@shared/lib/supabase-client';

describe('Token Enforcement Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('estimateTokensForRequest', () => {
    it('should estimate tokens based on message length', () => {
      // 1 token ≈ 4 characters
      const estimate = estimateTokensForRequest(400, 0);
      // Input: 400/4 = 100 tokens
      // Output estimate: 100 * 2 = 200 tokens
      // Total: 300 tokens
      expect(estimate).toBe(300);
    });

    it('should include conversation history in estimation', () => {
      const estimate = estimateTokensForRequest(400, 400);
      // Input: (400 + 400) / 4 = 200 tokens
      // Output estimate: 200 * 2 = 400 tokens
      // Total: 600 tokens
      expect(estimate).toBe(600);
    });

    it('should handle zero-length messages', () => {
      const estimate = estimateTokensForRequest(0, 0);
      expect(estimate).toBe(0);
    });

    it('should round up token estimates (better to overestimate)', () => {
      const estimate = estimateTokensForRequest(401, 0);
      // Input: ceil(401/4) = 101 tokens
      // Output estimate: 101 * 2 = 202 tokens
      // Total: 303 tokens
      expect(estimate).toBe(303);
    });
  });

  describe('checkTokenSufficiency', () => {
    const mockUserId = 'user-123';
    const mockRpc = vi.mocked(supabase.rpc);

    it('should allow request when user has sufficient balance', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ current_balance: 10000 }],
        error: null,
      });

      const result = await checkTokenSufficiency(mockUserId, 1000);

      expect(result.allowed).toBe(true);
      expect(result.currentBalance).toBe(10000);
      expect(result.estimatedCost).toBe(1000);
      expect(result.reason).toBeUndefined();
    });

    it('should deny request when user has insufficient balance', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ current_balance: 500 }],
        error: null,
      });

      const result = await checkTokenSufficiency(mockUserId, 1000);

      expect(result.allowed).toBe(false);
      expect(result.currentBalance).toBe(500);
      expect(result.estimatedCost).toBe(1000);
      expect(result.reason).toContain('Insufficient tokens');
    });

    it('should deny request when balance fetch fails', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: '500' },
      });

      // Also need to mock the fallback query
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      // Mock user plan lookup (also fails)
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await checkTokenSufficiency(mockUserId, 1000);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Failed to fetch');
    });

    it('should handle exact balance equal to estimated cost', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ current_balance: 1000 }],
        error: null,
      });

      const result = await checkTokenSufficiency(mockUserId, 1000);

      // Exact match should be allowed
      expect(result.allowed).toBe(true);
      expect(result.currentBalance).toBe(1000);
    });

    it('should handle zero balance', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ current_balance: 0 }],
        error: null,
      });

      const result = await checkTokenSufficiency(mockUserId, 1000);

      expect(result.allowed).toBe(false);
      expect(result.currentBalance).toBe(0);
    });
  });

  describe('getUserTokenBalance', () => {
    const mockUserId = 'user-123';
    const mockRpc = vi.mocked(supabase.rpc);
    const mockFrom = vi.mocked(supabase.from);

    it('should return balance from RPC when available', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ current_balance: 5000 }],
        error: null,
      });

      const balance = await getUserTokenBalance(mockUserId);

      expect(balance).toBe(5000);
      expect(mockRpc).toHaveBeenCalledWith('get_or_create_token_balance', {
        p_user_id: mockUserId,
      });
    });

    it('should fallback to direct query when RPC fails', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC not available', code: '500' },
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { current_balance: 3000 },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      const balance = await getUserTokenBalance(mockUserId);

      expect(balance).toBe(3000);
    });

    it('should return default free tier balance when no record exists', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC not available', code: '500' },
      });

      // Balance lookup fails
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      // User plan lookup returns free tier
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { plan: 'free' },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      const balance = await getUserTokenBalance(mockUserId);

      expect(balance).toBe(1000000); // 1M for free tier
    });

    it('should return default pro tier balance when user is pro', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC not available', code: '500' },
      });

      // Balance lookup fails
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      // User plan lookup returns pro tier
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { plan: 'pro' },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      const balance = await getUserTokenBalance(mockUserId);

      expect(balance).toBe(10000000); // 10M for pro tier
    });

    it('should return null when all lookups fail (fail closed)', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC failed', code: '500' },
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      const balance = await getUserTokenBalance(mockUserId);

      // Security: fail closed - return null instead of default balance
      expect(balance).toBeNull();
    });

    it('should ensure balance is never negative', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ current_balance: -100 }],
        error: null,
      });

      const balance = await getUserTokenBalance(mockUserId);

      expect(balance).toBe(0); // Should be clamped to 0
    });
  });

  describe('deductTokens', () => {
    const mockUserId = 'user-123';
    const mockMetadata: UsageMetadata = {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      sessionId: 'session-123',
      feature: 'chat',
    };
    const mockRpc = vi.mocked(supabase.rpc);

    it('should successfully deduct tokens', async () => {
      mockRpc.mockResolvedValueOnce({
        data: 9850, // New balance after deduction
        error: null,
      });

      const result = await deductTokens(mockUserId, mockMetadata);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(9850);
      expect(mockRpc).toHaveBeenCalledWith('deduct_user_tokens', {
        p_user_id: mockUserId,
        p_tokens: 150,
        p_provider: 'anthropic',
        p_model: 'claude-3-5-sonnet-20241022',
      });
    });

    it('should handle deduction failure', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insufficient balance', code: 'P0001' },
      });

      const result = await deductTokens(mockUserId, mockMetadata);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Token deduction failed');
    });

    it('should handle unexpected errors', async () => {
      mockRpc.mockRejectedValueOnce(new Error('Network error'));

      const result = await deductTokens(mockUserId, mockMetadata);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('checkMonthlyAllowance', () => {
    const mockUserId = 'user-123';
    const mockFrom = vi.mocked(supabase.from);

    it('should return unlimited for pro users', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { plan: 'pro' },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await checkMonthlyAllowance(mockUserId);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(Infinity);
    });

    it('should check monthly usage for free tier users', async () => {
      // First call returns user plan
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { plan: 'free' },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      // Second call returns transactions
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({
                data: [
                  { tokens: -500000 }, // Negative because it's usage
                ],
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await checkMonthlyAllowance(mockUserId);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1000000); // 1M for free tier
      expect(result.used).toBe(500000);
    });

    it('should deny when monthly limit is exceeded', async () => {
      // First call returns user plan
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { plan: 'free' },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      // Second call returns transactions exceeding limit
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({
                data: [
                  { tokens: -1100000 }, // Exceeds 1M limit
                ],
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await checkMonthlyAllowance(mockUserId);

      expect(result.allowed).toBe(false);
      expect(result.used).toBeGreaterThanOrEqual(result.limit);
    });

    it('should handle database errors gracefully', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await checkMonthlyAllowance(mockUserId);

      // Should default to allowing with free tier limits on error
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1000000);
    });
  });

  describe('canUserMakeRequest', () => {
    const mockUserId = 'user-123';
    const mockFrom = vi.mocked(supabase.from);
    const mockRpc = vi.mocked(supabase.rpc);

    it('should allow request when all checks pass', async () => {
      // Monthly allowance check - pro user
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { plan: 'pro' },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      // Token sufficiency check
      mockRpc.mockResolvedValueOnce({
        data: [{ current_balance: 10000 }],
        error: null,
      });

      const result = await canUserMakeRequest(mockUserId, 1000);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny when monthly allowance is exceeded', async () => {
      // First call returns user plan
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { plan: 'free' },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      // Second call returns transactions exceeding limit
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({
                data: [{ tokens: -1100000 }],
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await canUserMakeRequest(mockUserId, 1000);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Monthly limit');
    });

    it('should deny when token balance is insufficient', async () => {
      // Monthly allowance check - pro user (passes)
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { plan: 'pro' },
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      // Token sufficiency check - insufficient balance
      mockRpc.mockResolvedValueOnce({
        data: [{ current_balance: 500 }],
        error: null,
      });

      const result = await canUserMakeRequest(mockUserId, 1000);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient tokens');
    });
  });
});
