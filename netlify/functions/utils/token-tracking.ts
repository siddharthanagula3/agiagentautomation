import { createClient } from '@supabase/supabase-js';

/**
 * Token pricing per provider (per 1M tokens)
 * Updated prices as of 2024
 */
const TOKEN_PRICING = {
  openai: {
    'gpt-4o': { input: 2.5, output: 10.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4-turbo': { input: 10.0, output: 30.0 },
    'gpt-4': { input: 30.0, output: 60.0 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
    'claude-3-5-sonnet-20240620': { input: 3.0, output: 15.0 },
    'claude-3-opus': { input: 15.0, output: 75.0 },
    'claude-3-sonnet': { input: 3.0, output: 15.0 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
  },
  google: {
    'gemini-2.0-flash-exp': { input: 0.0, output: 0.0 }, // Free during preview
    'gemini-2.0-flash': { input: 0.075, output: 0.3 },
    'gemini-1.5-pro': { input: 1.25, output: 5.0 },
    'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  },
  perplexity: {
    'sonar-small-chat': { input: 0.2, output: 0.2 },
    'sonar-medium-chat': { input: 0.6, output: 0.6 },
    'sonar-large-chat': { input: 1.0, output: 1.0 },
  },
};

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

/**
 * Calculate token costs for a given provider and model
 */
export function calculateTokenCost(
  provider: 'openai' | 'anthropic' | 'google' | 'perplexity',
  model: string,
  inputTokens: number,
  outputTokens: number
): TokenUsage {
  const pricing =
    TOKEN_PRICING[provider][
      model as keyof (typeof TOKEN_PRICING)[typeof provider]
    ];

  if (!pricing) {
    console.warn(
      `[Token Tracking] Unknown model: ${provider}/${model}, using default pricing`
    );
    // Default pricing if model not found
    const defaultPricing = { input: 1.0, output: 2.0 };
    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost: (inputTokens / 1_000_000) * defaultPricing.input,
      outputCost: (outputTokens / 1_000_000) * defaultPricing.output,
      totalCost:
        (inputTokens / 1_000_000) * defaultPricing.input +
        (outputTokens / 1_000_000) * defaultPricing.output,
    };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

/**
 * Store token usage in Supabase
 */
export async function storeTokenUsage(
  provider: string,
  model: string,
  userId: string | null,
  sessionId: string | null,
  usage: TokenUsage
): Promise<void> {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        '[Token Tracking] Supabase not configured, skipping storage'
      );
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('token_usage').insert({
      user_id: userId,
      session_id: sessionId,
      provider,
      model,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      total_tokens: usage.totalTokens,
      input_cost: usage.inputCost,
      output_cost: usage.outputCost,
      total_cost: usage.totalCost,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[Token Tracking] Failed to store usage:', error);
    } else {
      console.log('[Token Tracking] Stored usage:', {
        provider,
        model,
        tokens: usage.totalTokens,
        cost: `$${usage.totalCost.toFixed(6)}`,
      });
    }
  } catch (error) {
    console.error('[Token Tracking] Error storing usage:', error);
  }
}

/**
 * Extract user and session info from request
 */
export function extractRequestMetadata(event: { body?: string | null }): {
  userId: string | null;
  sessionId: string | null;
} {
  try {
    const body = JSON.parse(event.body || '{}');
    return {
      userId: body.userId || body.user_id || null,
      sessionId: body.sessionId || body.session_id || null,
    };
  } catch {
    return {
      userId: null,
      sessionId: null,
    };
  }
}
