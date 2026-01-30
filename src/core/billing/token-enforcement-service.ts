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
 * Deduct tokens from user balance after an API call
 * MUST be called AFTER every API request completes
 * Uses the deduct_user_tokens RPC function which:
 * - Atomically deducts tokens from user_token_balances table
 * - Logs the transaction to token_transactions table
 * - Ensures balance never goes below 0
 */
export async function deductTokens(
  userId: string,
  metadata: UsageMetadata
): Promise<TokenDeductionResult> {
  try {
    const { provider, model, inputTokens, outputTokens, totalTokens } =
      metadata;

    // Use the deduct_user_tokens RPC function for atomic deduction
    // This function handles balance updates and transaction logging
    const { data: newBalance, error } = await supabase.rpc(
      'deduct_user_tokens',
      {
        p_user_id: userId,
        p_tokens: totalTokens, // Positive value - function handles the deduction
        p_provider: provider,
        p_model: model,
      }
    );

    if (error) {
      logger.error('[Token Enforcement] Error deducting tokens:', error);

      // Log detailed error for debugging
      logger.error('[Token Enforcement] Deduction details:', {
        userId,
        provider,
        model,
        totalTokens,
        errorCode: error.code,
        errorMessage: error.message,
      });

      return {
        success: false,
        newBalance: 0,
        error: `Token deduction failed: ${error.message}`,
      };
    }

    logger.info(
      `[Token Enforcement] Deducted ${totalTokens} tokens from user ${userId}. New balance: ${newBalance}`
    );

    return {
      success: true,
      newBalance: newBalance as number,
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
 * Get user's current token balance
 * Uses get_or_create_token_balance RPC to ensure balance record exists
 * Falls back to direct query if RPC not available
 * Returns free tier default if no balance record exists
 */
export async function getUserTokenBalance(
  userId: string
): Promise<number | null> {
  try {
    // Try using the get_or_create_token_balance RPC function
    // This ensures a balance record is created if it doesn't exist
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_or_create_token_balance',
      { p_user_id: userId }
    );

    if (!rpcError && rpcData && rpcData.length > 0) {
      const balance = Math.max(rpcData[0].current_balance || 0, 0);
      logger.info(
        `[Token Balance] Current balance (via RPC): ${balance.toLocaleString()}`
      );
      return balance;
    }

    // Fallback: Query user_token_balances table directly
    if (rpcError) {
      logger.warn(
        '[Token Balance] RPC failed, falling back to direct query:',
        rpcError.message
      );
    }

    const { data: balanceData, error: balanceError } = await supabase
      .from('user_token_balances')
      .select('current_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (balanceError || !balanceData) {
      if (balanceError) {
        logger.warn(
          '[Token Balance] Error fetching balance record, checking user plan...',
          balanceError.message
        );
      } else {
        logger.warn(
          '[Token Balance] No balance record found, checking user plan...'
        );
      }

      // Get user's plan to determine appropriate default balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('plan')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !userData) {
        logger.error('[Token Balance] Error fetching user plan:', userError);
        // SECURITY FIX: Jan 15th 2026 - Fail closed on database errors
        // Return null to trigger denial instead of allowing with default tokens
        // This prevents exploitation via database errors
        return null;
      }

      const isPro =
        userData.plan === 'pro' ||
        userData.plan === 'max' ||
        userData.plan === 'enterprise';
      const defaultBalance = isPro ? 10000000 : 1000000; // 10M for pro, 1M for free

      logger.info(
        `[Token Balance] User has no balance record. Plan: ${userData.plan}. Returning default: ${defaultBalance.toLocaleString()}`
      );
      return defaultBalance;
    }

    const balance = Math.max(balanceData.current_balance || 0, 0);
    logger.info(`[Token Balance] Current balance: ${balance.toLocaleString()}`);
    return balance;
  } catch (error) {
    logger.error('[Token Enforcement] Error:', error);
    captureError(error as Error, {
      tags: { feature: 'billing', operation: 'get_user_token_balance' },
      extra: { userId },
    });
    // SECURITY FIX: Jan 15th 2026 - Fail closed on unexpected errors
    // Return null to trigger denial instead of allowing with default tokens
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
        limit: 1000000, // Free tier default: 1M tokens/month
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
        limit: 1000000,
        resetDate,
      };
    }

    const used = Math.abs(
      transactions?.reduce((sum, tx) => sum + tx.tokens, 0) || 0
    );
    const limit = 1000000; // 1M tokens/month for free tier (matches billing dashboard)

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
      limit: 1000000,
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
