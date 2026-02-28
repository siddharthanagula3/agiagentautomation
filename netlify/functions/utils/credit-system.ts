/**
 * Credit System Utility
 *
 * Wraps the shared Supabase billing RPCs for the cents-based credit system.
 * The shared Supabase project (desktop app DB) uses token_credits table with
 * a cents-based billing model instead of token-count-based.
 *
 * Key RPCs in shared Supabase:
 *   - get_credit_balance(p_user_id) → credits_remaining_cents (integer)
 *   - check_credits_available(p_user_id, p_amount_cents) → boolean
 *   - deduct_credits(p_user_id, p_amount_cents, p_description, p_metadata, p_idempotency_key) → void
 *   - get_or_create_credit_account(p_user_id, p_subscription_id, p_period_start, p_period_end, p_credits_allocated_cents)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Token Pricing (per 1M tokens, in dollars) ────────────────────────────────

const TOKEN_PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  openai: {
    'gpt-4o': { input: 2.5, output: 10.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4-turbo': { input: 10.0, output: 30.0 },
    'gpt-4': { input: 30.0, output: 60.0 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  },
  anthropic: {
    'claude-opus-4-6': { input: 15.0, output: 75.0 },
    'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
    'claude-haiku-4-5-20251001': { input: 0.25, output: 1.25 },
    'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
    'claude-3-5-sonnet-20240620': { input: 3.0, output: 15.0 },
    'claude-3-opus': { input: 15.0, output: 75.0 },
    'claude-3-sonnet': { input: 3.0, output: 15.0 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
  },
  google: {
    'gemini-2.0-flash-exp': { input: 0.0, output: 0.0 },
    'gemini-2.0-flash': { input: 0.075, output: 0.3 },
    'gemini-1.5-pro': { input: 1.25, output: 5.0 },
    'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  },
  perplexity: {
    'sonar-small-chat': { input: 0.2, output: 0.2 },
    'sonar-medium-chat': { input: 0.6, output: 0.6 },
    'sonar-large-chat': { input: 1.0, output: 1.0 },
    'llama-3.1-sonar-small-128k-online': { input: 0.2, output: 0.2 },
    'llama-3.1-sonar-large-128k-online': { input: 1.0, output: 1.0 },
  },
  qwen: {
    'qwen-turbo': { input: 0.3, output: 0.6 },
    'qwen-plus': { input: 0.3, output: 0.6 },
    'qwen-long': { input: 0.3, output: 0.6 },
  },
  grok: {
    'grok-2': { input: 5.0, output: 15.0 },
    'grok-3': { input: 5.0, output: 15.0 },
    'grok-2-latest': { input: 5.0, output: 15.0 },
  },
  deepseek: {
    'deepseek-chat': { input: 0.1, output: 0.2 },
    'deepseek-reasoner': { input: 0.55, output: 2.19 },
    'deepseek-reasoning': { input: 0.1, output: 0.2 },
  },
};

// Default pricing when provider/model not found (conservative overestimate)
const DEFAULT_PRICING = { input: 5.0, output: 15.0 };

// ─── Helper: Create Supabase Admin Client ─────────────────────────────────────

export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('[CreditSystem] Supabase configuration missing (VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// ─── Cost Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate cost in cents from token usage.
 * Always rounds UP to prevent underbilling.
 */
export function calculateCostCents(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const providerPricing = TOKEN_PRICING[provider.toLowerCase()];
  const modelPricing = providerPricing?.[model] ?? DEFAULT_PRICING;

  const inputCostDollars = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCostDollars = (outputTokens / 1_000_000) * modelPricing.output;
  const totalDollars = inputCostDollars + outputCostDollars;

  // Convert dollars to cents, rounding up (never underbill)
  return Math.ceil(totalDollars * 100);
}

/**
 * Estimate pre-flight cost in cents.
 * Uses 3x safety factor on estimated tokens to prevent overdraft.
 */
export function estimatePreflightCostCents(
  provider: string,
  model: string,
  estimatedInputTokens: number
): number {
  // Estimate output will be similar to input, with 2x safety factor
  const estimatedOutputTokens = estimatedInputTokens;
  const raw = calculateCostCents(provider, model, estimatedInputTokens, estimatedOutputTokens);
  // Minimum 1 cent for any request
  return Math.max(raw, 1);
}

/**
 * Convert dollars to cents (rounds up).
 */
export function dollarsToCents(dollars: number): number {
  return Math.ceil(dollars * 100);
}

// ─── Credit System Functions ──────────────────────────────────────────────────

export interface CreditBalanceResult {
  creditsCents: number | null;
  error?: string;
}

export interface CreditCheckResult {
  hasCredits: boolean;
  creditsCents: number | null;
  error?: string;
}

export interface CreditDeductionResult {
  success: boolean;
  newBalanceCents?: number;
  error?: string;
}

/**
 * Get user's current credit balance in cents.
 * Uses get_credit_balance() RPC from shared Supabase.
 * Falls back to querying token_credits table directly.
 */
export async function getCreditBalance(userId: string): Promise<CreditBalanceResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_credit_balance', {
      p_user_id: userId,
    });

    if (!rpcError && rpcData !== null && rpcData !== undefined) {
      return { creditsCents: Number(rpcData) };
    }

    if (rpcError) {
      console.warn('[CreditSystem] get_credit_balance RPC failed, falling back to direct query:', rpcError.message);
    }

    // Fallback: direct table query
    const { data, error } = await supabaseAdmin
      .from('token_credits')
      .select('credits_remaining_cents')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[CreditSystem] Error fetching credit balance:', error.message);
      return { creditsCents: null, error: error.message };
    }

    if (!data) {
      // No credit account — try to create one
      await getOrCreateCreditAccount(userId);
      // Return 0 balance (will be populated on next check)
      return { creditsCents: 0 };
    }

    return { creditsCents: data.credits_remaining_cents ?? 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[CreditSystem] getCreditBalance error:', message);
    return { creditsCents: null, error: message };
  }
}

/**
 * Check if user has sufficient credits for an operation.
 * Uses check_credits_available() RPC — fails CLOSED (deny) on any error.
 */
export async function checkCreditsAvailable(
  userId: string,
  amountCents: number,
  logPrefix = '[CreditSystem]'
): Promise<CreditCheckResult> {
  // Free operations (0 cents) always allowed
  if (amountCents <= 0) {
    return { hasCredits: true, creditsCents: null };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Try RPC first
    const { data: available, error: rpcError } = await supabaseAdmin.rpc('check_credits_available', {
      p_user_id: userId,
      p_amount_cents: amountCents,
    });

    if (!rpcError) {
      if (!available) {
        console.warn(`${logPrefix} Insufficient credits:`, { userId, required: amountCents });
      }
      const balanceResult = await getCreditBalance(userId);
      return {
        hasCredits: Boolean(available),
        creditsCents: balanceResult.creditsCents,
      };
    }

    console.warn(`${logPrefix} check_credits_available RPC failed, falling back:`, rpcError.message);

    // Fallback: manual check
    const balanceResult = await getCreditBalance(userId);
    if (balanceResult.creditsCents === null) {
      // Error fetching balance — fail closed
      return { hasCredits: false, creditsCents: null, error: balanceResult.error };
    }

    const hasCredits = balanceResult.creditsCents >= amountCents;
    if (!hasCredits) {
      console.warn(`${logPrefix} Insufficient credits:`, {
        userId,
        required: amountCents,
        available: balanceResult.creditsCents,
      });
    }
    return { hasCredits, creditsCents: balanceResult.creditsCents };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`${logPrefix} checkCreditsAvailable error:`, message);
    // Fail closed
    return { hasCredits: false, creditsCents: null, error: message };
  }
}

/**
 * Deduct credits after a successful API call.
 * Returns { success: false } if deduction fails — callers MUST return 402.
 *
 * @param userId - Authenticated user ID (from JWT)
 * @param amountCents - Amount to deduct in cents
 * @param description - Human-readable description for audit trail
 * @param metadata - Optional metadata (provider, model, etc.)
 * @param idempotencyKey - Optional key to prevent double-deductions
 */
export async function deductCredits(
  userId: string,
  amountCents: number,
  description: string,
  metadata?: Record<string, unknown>,
  idempotencyKey?: string
): Promise<CreditDeductionResult> {
  if (amountCents <= 0) {
    return { success: true, newBalanceCents: undefined };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount_cents: amountCents,
      p_description: description,
      p_metadata: metadata ?? {},
      p_idempotency_key: idempotencyKey ?? `${userId}-${Date.now()}`,
    });

    if (error) {
      console.error('[CreditSystem] deduct_credits RPC failed:', error.message);
      return { success: false, error: error.message };
    }

    // Fetch new balance for response
    const balanceResult = await getCreditBalance(userId);
    return {
      success: true,
      newBalanceCents: balanceResult.creditsCents ?? undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[CreditSystem] deductCredits error:', message);
    return { success: false, error: message };
  }
}

/**
 * Ensure a user has a credit account.
 * Called on first access or subscription events.
 */
export async function getOrCreateCreditAccount(
  userId: string,
  subscriptionId?: string,
  periodStart?: string,
  periodEnd?: string,
  creditsAllocatedCents?: number
): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (subscriptionId && periodStart && periodEnd && creditsAllocatedCents !== undefined) {
      // Full account creation with subscription details
      await supabaseAdmin.rpc('get_or_create_credit_account', {
        p_user_id: userId,
        p_subscription_id: subscriptionId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_credits_allocated_cents: creditsAllocatedCents,
      });
    } else {
      // Try simple upsert into token_credits for new free-tier users
      await supabaseAdmin
        .from('token_credits')
        .upsert(
          {
            user_id: userId,
            credits_remaining_cents: 0, // Will be set by RPC or subscription webhook
            credits_allocated_cents: 0,
          },
          { onConflict: 'user_id' }
        );
    }
  } catch (err) {
    console.warn('[CreditSystem] getOrCreateCreditAccount error (non-fatal):', err);
  }
}

// ─── Insufficient Credits Response ───────────────────────────────────────────

/**
 * Creates a standardized HTTP 402 response for insufficient credits.
 */
export function createInsufficientCreditsResponse(
  options: {
    requiredCents: number;
    availableCents: number;
    upgradeUrl?: string;
  },
  corsHeaders: Record<string, string>
): { statusCode: number; headers: Record<string, string>; body: string } {
  const { requiredCents, availableCents, upgradeUrl = '/pricing' } = options;

  return {
    statusCode: 402,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
    body: JSON.stringify({
      error: 'Insufficient credits',
      required_cents: requiredCents,
      available_cents: availableCents,
      required_dollars: (requiredCents / 100).toFixed(4),
      available_dollars: (availableCents / 100).toFixed(2),
      upgradeUrl,
      code: 'INSUFFICIENT_CREDITS',
    }),
  };
}
