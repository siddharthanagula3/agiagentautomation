import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Result of a token balance check operation
 */
export interface TokenBalanceCheckResult {
  /** Whether the user has sufficient balance */
  hasBalance: boolean;
  /** Current token balance (null if user not found or balance check failed) */
  balance: number | null;
  /** User's subscription plan */
  plan: string | null;
  /** Error message if check failed */
  error?: string;
  /** Whether a new balance record was created */
  balanceCreated?: boolean;
}

/**
 * Options for the insufficient balance error response
 */
export interface InsufficientBalanceResponseOptions {
  /** Number of tokens required for the operation */
  required: number;
  /** Current available balance */
  available: number;
  /** Optional estimated cost string (e.g., "$0.04") */
  estimatedCost?: string;
  /** URL to upgrade page (defaults to '/pricing') */
  upgradeUrl?: string;
}

/**
 * Creates a Supabase admin client using service role key
 * @returns Supabase client with admin privileges
 */
function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Checks if a user has sufficient token balance for an operation.
 * Creates a new balance record if one doesn't exist.
 *
 * @param userId - The authenticated user's ID (from JWT)
 * @param estimatedTokens - Number of tokens required for the operation
 * @param logPrefix - Optional prefix for log messages (e.g., '[OpenAI Proxy]')
 * @returns TokenBalanceCheckResult indicating if user has sufficient balance
 *
 * @example
 * ```typescript
 * const result = await checkTokenBalance(userId, 5000, '[OpenAI Proxy]');
 * if (!result.hasBalance) {
 *   return createInsufficientBalanceResponse(
 *     { required: 5000, available: result.balance || 0 },
 *     corsHeaders
 *   );
 * }
 * ```
 */
export async function checkTokenBalance(
  userId: string,
  estimatedTokens: number,
  logPrefix = '[Token Check]'
): Promise<TokenBalanceCheckResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Query user's token balance from user_token_balances table
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('user_token_balances')
      .select('token_balance, plan')
      .eq('user_id', userId)
      .maybeSingle();

    if (balanceError) {
      console.error(`${logPrefix} Error fetching token balance:`, balanceError);
      return {
        hasBalance: false,
        balance: null,
        plan: null,
        error: balanceError.message,
      };
    }

    // If user has no balance record, create one via RPC
    if (!balanceData) {
      console.log(`${logPrefix} No token balance record found, creating one for user:`, userId);

      await supabaseAdmin.rpc('get_or_create_token_balance', {
        p_user_id: userId,
      });

      // Re-fetch after creation
      const { data: newBalanceData, error: newBalanceError } = await supabaseAdmin
        .from('user_token_balances')
        .select('token_balance, plan')
        .eq('user_id', userId)
        .maybeSingle();

      if (newBalanceError || !newBalanceData) {
        console.error(`${logPrefix} Error fetching newly created token balance:`, newBalanceError);
        return {
          hasBalance: false,
          balance: null,
          plan: null,
          error: newBalanceError?.message || 'Failed to create token balance record',
          balanceCreated: true,
        };
      }

      const balance = newBalanceData.token_balance;
      const hasSufficientBalance = balance !== null && balance >= estimatedTokens;

      if (!hasSufficientBalance) {
        console.warn(`${logPrefix} Insufficient token balance:`, {
          userId,
          required: estimatedTokens,
          available: balance,
        });
      }

      return {
        hasBalance: hasSufficientBalance,
        balance,
        plan: newBalanceData.plan,
        balanceCreated: true,
      };
    }

    // Check if existing balance is sufficient
    const balance = balanceData.token_balance;
    const hasSufficientBalance = balance !== null && balance >= estimatedTokens;

    if (!hasSufficientBalance) {
      console.warn(`${logPrefix} Insufficient token balance:`, {
        userId,
        required: estimatedTokens,
        available: balance,
      });
    }

    return {
      hasBalance: hasSufficientBalance,
      balance,
      plan: balanceData.plan,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${logPrefix} Token balance check failed:`, errorMessage);
    return {
      hasBalance: false,
      balance: null,
      plan: null,
      error: errorMessage,
    };
  }
}

/**
 * Creates a standardized HTTP 402 (Payment Required) response for insufficient token balance.
 *
 * @param options - Options for the error response
 * @param corsHeaders - CORS headers to include in the response
 * @returns Netlify function response object
 *
 * @example
 * ```typescript
 * return createInsufficientBalanceResponse(
 *   { required: 5000, available: 1000, estimatedCost: '$0.04' },
 *   corsHeaders
 * );
 * ```
 */
export function createInsufficientBalanceResponse(
  options: InsufficientBalanceResponseOptions,
  corsHeaders: Record<string, string>
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const { required, available, estimatedCost, upgradeUrl = '/pricing' } = options;

  const responseBody: {
    error: string;
    required: number;
    available: number;
    upgradeUrl: string;
    estimatedCost?: string;
  } = {
    error: 'Insufficient token balance',
    required,
    available,
    upgradeUrl,
  };

  if (estimatedCost) {
    responseBody.estimatedCost = estimatedCost;
  }

  return {
    statusCode: 402,
    headers: corsHeaders,
    body: JSON.stringify(responseBody),
  };
}

/**
 * Estimates token count from message content.
 * Uses a conservative estimate of ~3 characters per token.
 *
 * @param messages - Array of messages or any content to estimate
 * @returns Estimated number of tokens (rounded up and multiplied by safety factor)
 *
 * @example
 * ```typescript
 * const estimated = estimateTokensFromMessages(messages);
 * const result = await checkTokenBalance(userId, estimated);
 * ```
 */
export function estimateTokensFromMessages(messages: unknown): number {
  const messageLength = JSON.stringify(messages).length;
  // Conservative estimate: ~3 characters per token, with 3x safety factor
  return Math.ceil(messageLength / 3) * 3;
}

/**
 * Estimates token cost for media generation based on price and count.
 * Converts dollar cost to token units (1M tokens = $1).
 *
 * @param pricePerUnit - Price per unit (image/second of video) in dollars
 * @param units - Number of units (images or seconds)
 * @returns Estimated tokens to deduct
 *
 * @example
 * ```typescript
 * // For DALL-E 3 at $0.04 per image, generating 2 images:
 * const tokens = estimateTokensFromCost(0.04, 2); // Returns 80000
 * ```
 */
export function estimateTokensFromCost(pricePerUnit: number, units: number): number {
  const estimatedCost = pricePerUnit * units;
  // Convert cost to tokens: approximately 1M tokens = $1
  return Math.ceil(estimatedCost * 1000000);
}
