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
 */
export async function checkTokenSufficiency(
  userId: string,
  estimatedTokens: number
): Promise<TokenCheckResult> {
  try {
    // Get user's current token balance
    const { data: user, error } = await supabase
      .from('users')
      .select('token_balance, subscription_tier')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        allowed: false,
        currentBalance: 0,
        estimatedCost: estimatedTokens,
        reason: 'Failed to fetch user balance',
      };
    }

    const currentBalance = user.token_balance || 0;

    // Check if user has sufficient balance
    if (currentBalance < estimatedTokens) {
      return {
        allowed: false,
        currentBalance,
        estimatedCost: estimatedTokens,
        reason: `Insufficient tokens. Need ${estimatedTokens}, have ${currentBalance}`,
      };
    }

    return {
      allowed: true,
      currentBalance,
      estimatedCost: estimatedTokens,
    };
  } catch (error) {
    console.error('[Token Enforcement] Error checking sufficiency:', error);
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
 */
export async function deductTokens(
  userId: string,
  metadata: UsageMetadata
): Promise<TokenDeductionResult> {
  try {
    const { provider, model, inputTokens, outputTokens, totalTokens } =
      metadata;

    // Use the database function to safely deduct tokens
    const { data: newBalance, error } = await supabase.rpc(
      'update_user_token_balance',
      {
        p_user_id: userId,
        p_tokens: -totalTokens, // Negative value = deduction
        p_transaction_type: 'usage',
        p_description: `${provider} ${model} - ${inputTokens} in, ${outputTokens} out`,
        p_metadata: {
          provider,
          model,
          inputTokens,
          outputTokens,
          totalTokens,
          sessionId: metadata.sessionId,
          feature: metadata.feature,
          timestamp: new Date().toISOString(),
        },
      }
    );

    if (error) {
      console.error('[Token Enforcement] Error deducting tokens:', error);
      return {
        success: false,
        newBalance: 0,
        error: error.message,
      };
    }

    console.log(
      `[Token Enforcement] Deducted ${totalTokens} tokens from user ${userId}. New balance: ${newBalance}`
    );

    return {
      success: true,
      newBalance: newBalance as number,
    };
  } catch (error) {
    console.error('[Token Enforcement] Error:', error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's current token balance
 */
export async function getUserTokenBalance(
  userId: string
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('token_balance')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('[Token Enforcement] Error fetching balance:', error);
      return null;
    }

    return data.token_balance || 0;
  } catch (error) {
    console.error('[Token Enforcement] Error:', error);
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
export async function checkMonthlyAllowance(
  userId: string
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  resetDate: Date;
}> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        allowed: false,
        used: 0,
        limit: 0,
        resetDate: new Date(),
      };
    }

    // Pro/Max users: unlimited (only limited by token balance)
    if (user.subscription_tier === 'pro' || user.subscription_tier === 'max') {
      return {
        allowed: true,
        used: 0,
        limit: Infinity,
        resetDate: new Date(),
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
      console.error(
        '[Token Enforcement] Error checking monthly usage:',
        txError
      );
      return {
        allowed: false,
        used: 0,
        limit: 1000000,
        resetDate: new Date(
          startOfMonth.getFullYear(),
          startOfMonth.getMonth() + 1,
          1
        ),
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
    console.error('[Token Enforcement] Error checking allowance:', error);
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
  // Check monthly allowance first
  const allowance = await checkMonthlyAllowance(userId);
  if (!allowance.allowed) {
    return {
      allowed: false,
      reason: `Monthly limit exceeded. You've used ${allowance.used.toLocaleString()} of ${allowance.limit.toLocaleString()} tokens. Limit resets on ${allowance.resetDate.toLocaleDateString()}.`,
    };
  }

  // Check token balance
  const sufficiency = await checkTokenSufficiency(userId, estimatedTokens);
  if (!sufficiency.allowed) {
    return {
      allowed: false,
      reason:
        sufficiency.reason ||
        `Insufficient tokens. You need ${estimatedTokens.toLocaleString()} tokens, but only have ${sufficiency.currentBalance.toLocaleString()}.`,
    };
  }

  return { allowed: true };
}
