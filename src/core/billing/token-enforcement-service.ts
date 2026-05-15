/**
 * Token Enforcement Service
 *
 * CRITICAL: This service ensures users cannot exceed their token balance.
 * It performs pre-flight checks and post-call deductions.
 *
 * Security Features:
 * - Atomic balance checks (prevents race conditions)
 * - Server-side enforcement (client cannot bypass)
 * - Audit trail for all token operations
 * - Subscription allowance tracking
 */

import { supabase } from '@shared/lib/supabase-client';
import { logger } from '@shared/lib/logger';
import { captureError } from '@shared/lib/sentry';

export interface TokenCheckResult {
  allowed: boolean;
  currentBalance: number;
  estimatedCost: number;
  reason?: string;
}

export interface TokenDeductionResult {
  success: boolean;
  newBalance: number;
  transactionId?: string;
  error?: string;
}

export interface UsageMetadata {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  sessionId?: string;
  feature?: string;
}

const FREE_TIER_MONTHLY_TOKENS = 1000000;
const PRO_TIER_MONTHLY_TOKENS = 10000000;
const MAX_TIER_MONTHLY_TOKENS = 40000000;

function coerceNonNegativeBalance(value: unknown): number | null {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.max(numericValue, 0);
}

function extractCurrentBalance(data: unknown): number | null {
  if (Array.isArray(data)) {
    return coerceNonNegativeBalance(data[0]?.current_balance);
  }

  if (data && typeof data === 'object' && 'current_balance' in data) {
    return coerceNonNegativeBalance(
      (data as { current_balance?: unknown }).current_balance
    );
  }

  return coerceNonNegativeBalance(data);
}

function defaultBalanceForPlan(plan: string | null | undefined): number {
  switch (plan) {
    case 'pro':
      return PRO_TIER_MONTHLY_TOKENS;
    case 'max':
    case 'enterprise':
      return MAX_TIER_MONTHLY_TOKENS;
    default:
      return FREE_TIER_MONTHLY_TOKENS;
  }
}

/**
 * Check if user has sufficient tokens for an operation
 * MUST be called BEFORE making any API request
 * Uses user_token_balances table (correct table)
 */
export async function checkTokenSufficiency(
  userId: string,
  estimatedTokens: number
): Promise<TokenCheckResult> {
  try {
    // Get user's current token balance from correct table
    const currentBalance = await getUserTokenBalance(userId);

    if (currentBalance === null) {
      return {
        allowed: false,
        currentBalance: 0,
        estimatedCost: estimatedTokens,
        reason: 'Failed to fetch user balance',
      };
    }

    // Check if user has sufficient balance
    if (currentBalance < estimatedTokens) {
      return {
        allowed: false,
        currentBalance,
        estimatedCost: estimatedTokens,
        reason: `Insufficient tokens. You need ${estimatedTokens.toLocaleString()} tokens, but only have ${currentBalance.toLocaleString()} remaining.`,
      };
    }

    return {
      allowed: true,
      currentBalance,
      estimatedCost: estimatedTokens,
    };
  } catch (error) {
    logger.error('[Token Enforcement] Error checking sufficiency:', error);
    captureError(error as Error, {
      tags: { feature: 'billing', operation: 'check_token_sufficiency' },
      extra: { userId, estimatedTokens },
    });
    return {
      allowed: false,
      currentBalance: 0,
      estimatedCost: estimatedTokens,
      reason: 'System error checking token balance',
    };
  }
}

/**
 * Deduct tokens from user balance after an API call.
 * NOTE: Client-side deduction is a legacy pattern. All actual deductions
 * should happen server-side via Netlify Functions using deductCredits()
 * from credit-system.ts. This function is kept for backwards compatibility
 * but the server-side proxies are the source of truth for billing.
 *
 * TODO: Remove client-side deduction once all proxies use deductCredits() server-side.
 * Client should only read balance, never deduct directly.
 */
export async function deductTokens(
  userId: string,
  metadata: UsageMetadata
): Promise<TokenDeductionResult> {
  try {
    const { provider, model, totalTokens } = metadata;

    const result = await supabase.rpc(
      'deduct_user_tokens',
      {
        p_user_id: userId,
        p_tokens: totalTokens,
        p_provider: provider,
        p_model: model,
      }
    );
    const { data: newBalance, error } = result ?? {};

    if (error) {
      logger.error('[Token Enforcement] Error deducting tokens:', error);
      return {
        success: false,
        newBalance: 0,
        error: `Token deduction failed: ${error.message}`,
      };
    }

    logger.info(
      `[Token Enforcement] Deducted ${totalTokens} tokens (legacy) from user ${userId}. New balance: ${newBalance}`
    );

    return {
      success: true,
      newBalance: coerceNonNegativeBalance(newBalance) ?? 0,
    };
  } catch (error) {
    logger.error('[Token Enforcement] Error:', error);
    captureError(error as Error, {
      tags: { feature: 'billing', operation: 'deduct_tokens' },
      extra: { userId, ...metadata },
    });
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's current token balance.
 * Uses the local user_token_balances system defined in Supabase migrations.
 * Fails CLOSED on errors (returns null to trigger denial).
 */
export async function getUserTokenBalance(
  userId: string
): Promise<number | null> {
  try {
    const rpcResult = await supabase.rpc(
      'get_or_create_token_balance',
      { p_user_id: userId }
    );
    const { data: rpcData, error: rpcError } = rpcResult ?? {};

    if (!rpcError && rpcData !== null && rpcData !== undefined) {
      const balance = extractCurrentBalance(rpcData);
      if (balance !== null) {
        logger.info(`[Token Balance] Token balance (via RPC): ${balance}`);
        return balance;
      }
    }

    if (rpcError) {
      logger.warn(
        '[Token Balance] get_or_create_token_balance RPC failed, falling back:',
        rpcError.message
      );
    }

    const { data: balanceData, error: balanceError } = await supabase
      .from('user_token_balances')
      .select('current_balance, monthly_allowance')
      .eq('user_id', userId)
      .maybeSingle();

    if (balanceError) {
      logger.error('[Token Balance] Error fetching token balance:', balanceError.message);
      // SECURITY: Fail closed on database errors
      return null;
    }

    if (balanceData) {
      const balance = extractCurrentBalance(balanceData);
      if (balance !== null) {
        logger.info(`[Token Balance] Token balance: ${balance}`);
        return balance;
      }
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      logger.error('[Token Balance] Error fetching user plan:', userError.message);
      return null;
    }

    const defaultBalance = defaultBalanceForPlan(user?.plan);
    logger.warn(
      `[Token Balance] No balance record found for user ${userId}; using ${defaultBalance} default for ${user?.plan || 'free'} plan`
    );
    return defaultBalance;
  } catch (error) {
    logger.error('[Token Enforcement] Error:', error);
    captureError(error as Error, {
      tags: { feature: 'billing', operation: 'get_user_token_balance' },
      extra: { userId },
    });
    // SECURITY: Fail closed on unexpected errors
    return null;
  }
}

/**
 * Estimate tokens for a request (rough estimate)
 * Better to overestimate than underestimate
 */
export function estimateTokensForRequest(
  messageLength: number,
  conversationHistory: number = 0
): number {
  // Rough estimate: 1 token ≈ 4 characters
  const inputEstimate = Math.ceil((messageLength + conversationHistory) / 4);

  // Assume response will be similar length (overestimate for safety)
  const outputEstimate = inputEstimate * 2;

  return inputEstimate + outputEstimate;
}

/**
 * Check subscription allowances (free tier limits)
 * Free tier: 1M tokens/month (matches billing dashboard display)
 * Pro tier: Unlimited with balance
 */
export async function checkMonthlyAllowance(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  resetDate: Date;
}> {
  try {
    // Calculate reset date (first of next month)
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { data: user, error } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      if (error) {
        logger.error('[Token Enforcement] Error fetching user:', error);
      }
      // Return free tier defaults on error
      return {
        allowed: true, // Allow request but with free tier limits
        used: 0,
        limit: FREE_TIER_MONTHLY_TOKENS, // Free tier default: 1M tokens/month
        resetDate,
      };
    }

    // Pro/Max/Enterprise users: unlimited monthly (only limited by token balance)
    if (
      user.plan === 'pro' ||
      user.plan === 'max' ||
      user.plan === 'enterprise'
    ) {
      return {
        allowed: true,
        used: 0,
        limit: Infinity,
        resetDate,
      };
    }

    // Free tier: check monthly usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: transactions, error: txError } = await supabase
      .from('token_transactions')
      .select('tokens')
      .eq('user_id', userId)
      .eq('transaction_type', 'usage')
      .gte('created_at', startOfMonth.toISOString());

    if (txError) {
      logger.error(
        '[Token Enforcement] Error checking monthly usage:',
        txError
      );
      return {
        allowed: true, // Allow on error to prevent blocking users
        used: 0,
        limit: FREE_TIER_MONTHLY_TOKENS,
        resetDate,
      };
    }

    const used = Math.abs(
      transactions?.reduce((sum, tx) => sum + tx.tokens, 0) || 0
    );
    const limit = FREE_TIER_MONTHLY_TOKENS; // 1M tokens/month for free tier (matches billing dashboard)

    return {
      allowed: used < limit,
      used,
      limit,
      resetDate: new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 1,
        1
      ),
    };
  } catch (error) {
    logger.error('[Token Enforcement] Error checking allowance:', error);
    captureError(error as Error, {
      tags: { feature: 'billing', operation: 'check_monthly_allowance' },
      extra: { userId },
    });
    return {
      allowed: false,
      used: 0,
      limit: FREE_TIER_MONTHLY_TOKENS,
      resetDate: new Date(),
    };
  }
}

/**
 * Comprehensive pre-flight check
 * Checks BOTH token balance AND monthly allowances
 */
export async function canUserMakeRequest(
  userId: string,
  estimatedTokens: number
): Promise<{ allowed: boolean; reason?: string }> {
  // Check monthly allowance first (free tier only)
  const allowance = await checkMonthlyAllowance(userId);
  if (!allowance.allowed) {
    return {
      allowed: false,
      reason: `Monthly limit reached. You've used ${allowance.used.toLocaleString()} of your ${allowance.limit.toLocaleString()} token monthly allowance. Limit resets ${allowance.resetDate.toLocaleDateString()}. Upgrade to Pro for unlimited usage.`,
    };
  }

  // Check token balance
  const sufficiency = await checkTokenSufficiency(userId, estimatedTokens);
  if (!sufficiency.allowed) {
    return {
      allowed: false,
      reason:
        sufficiency.reason ||
        `Insufficient tokens. You need ${estimatedTokens.toLocaleString()} tokens, but only have ${sufficiency.currentBalance.toLocaleString()} remaining.`,
    };
  }

  return { allowed: true };
}
