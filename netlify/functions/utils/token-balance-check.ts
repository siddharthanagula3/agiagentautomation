/**
 * Token Balance Check Utility
 *
 * Server-side pre-flight credit checks for LLM and media proxy functions.
 * Updated to use the shared Supabase's cents-based credit system (token_credits table).
 *
 * Migration note: Previously used user_token_balances table with token-count based billing.
 * Now uses token_credits table with cents-based billing via credit-system.ts utility.
 */

import {
  checkCreditsAvailable,
  estimatePreflightCostCents,
  createInsufficientCreditsResponse,
  type CreditCheckResult,
} from './credit-system';

/**
 * Result of a credit balance check operation.
 * Maintains backwards-compatible shape for existing proxy callers.
 */
export interface TokenBalanceCheckResult {
  /** Whether the user has sufficient credits */
  hasBalance: boolean;
  /** Credit balance in cents (null if check failed) */
  balance: number | null;
  /** User's subscription plan (not available in new system — kept for compat) */
  plan: string | null;
  /** Error message if check failed */
  error?: string;
  /** Whether a new balance record was created */
  balanceCreated?: boolean;
}

export interface InsufficientBalanceResponseOptions {
  /** Estimated cost in cents required for the operation */
  required: number;
  /** Current available credits in cents */
  available: number;
  /** Optional human-readable cost string (e.g., "$0.04") */
  estimatedCost?: string;
  /** URL to upgrade page (defaults to '/pricing') */
  upgradeUrl?: string;
}

/**
 * Check if a user has sufficient credits for an LLM request.
 *
 * Uses the shared Supabase's cents-based credit system.
 * Fails CLOSED on any error (denies request rather than allowing free usage).
 *
 * @param userId - Authenticated user ID (from JWT — never trust client)
 * @param estimatedTokens - Estimated token count for pre-flight check
 * @param logPrefix - Optional log prefix for debugging
 * @param provider - LLM provider (for cost calculation)
 * @param model - LLM model (for cost calculation)
 */
export async function checkTokenBalance(
  userId: string,
  estimatedTokens: number,
  logPrefix = '[Token Check]',
  provider = 'openai',
  model = 'gpt-4o'
): Promise<TokenBalanceCheckResult> {
  try {
    // Calculate estimated cost in cents
    const estimatedCostCents = estimatePreflightCostCents(provider, model, estimatedTokens);

    const result: CreditCheckResult = await checkCreditsAvailable(
      userId,
      estimatedCostCents,
      logPrefix
    );

    if (result.error) {
      console.error(`${logPrefix} Credit check error:`, result.error);
      return {
        hasBalance: false,
        balance: result.creditsCents,
        plan: null,
        error: result.error,
      };
    }

    return {
      hasBalance: result.hasCredits,
      balance: result.creditsCents,
      plan: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`${logPrefix} checkTokenBalance unexpected error:`, message);
    return {
      hasBalance: false,
      balance: null,
      plan: null,
      error: message,
    };
  }
}

/**
 * Creates a standardized HTTP 402 response for insufficient credits.
 * Maintains backwards-compatible signature for existing proxy callers.
 */
export function createInsufficientBalanceResponse(
  options: InsufficientBalanceResponseOptions,
  corsHeaders: Record<string, string>
): { statusCode: number; headers: Record<string, string>; body: string } {
  const { required, available, upgradeUrl = '/pricing' } = options;

  return createInsufficientCreditsResponse(
    {
      requiredCents: required,
      availableCents: available,
      upgradeUrl,
    },
    corsHeaders
  );
}

/**
 * Estimates token count from message content.
 * Conservative estimate of ~3 characters per token with 3x safety factor.
 */
export function estimateTokensFromMessages(messages: unknown): number {
  const messageLength = JSON.stringify(messages).length;
  // Conservative estimate: ~3 characters per token, 3x safety factor
  return Math.ceil(messageLength / 3) * 3;
}

/**
 * Estimates token cost for media generation (dollar cost → cents).
 *
 * @param pricePerUnit - Price per unit in dollars (e.g., 0.04 for DALL-E image)
 * @param units - Number of units
 * @returns Estimated cost in cents
 */
export function estimateTokensFromCost(pricePerUnit: number, units: number): number {
  const estimatedCostDollars = pricePerUnit * units;
  // Convert to cents, rounding up
  return Math.ceil(estimatedCostDollars * 100);
}
