import { Handler } from '@netlify/functions';
import { AuthenticatedEvent } from '../utils/auth-middleware';
import { createClient } from '@supabase/supabase-js';
import {
  calculateTokenCost,
  storeTokenUsage,
  extractRequestMetadata,
} from '../utils/token-tracking';
import { withRateLimit } from '../utils/rate-limiter';
import { withAuth } from '../utils/auth-middleware';
import { getSafeCorsHeaders, checkOriginAndBlock } from '../utils/cors';
import {
  perplexityRequestSchema,
  formatValidationError,
} from '../utils/validation-schemas';

/**
 * Netlify Function to proxy Perplexity API calls
 * This solves CORS issues by making API calls server-side
 * Includes token usage tracking for billing and analytics
 * SECURITY: Rate limited to 10 requests per minute per user + Authentication required
 * Updated: Jan 22nd 2026 - Fixed CORS null spreading by using getSafeCorsHeaders
 */
const perplexityHandler: Handler = async (event: AuthenticatedEvent) => {
  // Extract origin for CORS validation
  const origin = event.headers.origin || event.headers.Origin || '';

  // Early-exit for unauthorized origins
  const blockedResponse = checkOriginAndBlock(origin);
  if (blockedResponse) {
    return blockedResponse;
  }

  // Use safe CORS headers that always return a valid object
  const corsHeaders = getSafeCorsHeaders(origin);

  // Only allow POST requests
  // Updated: Jan 6th 2026 - Fixed CORS wildcard vulnerability with origin validation
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Get API key from environment
  const PERPLEXITY_API_KEY = process.env.VITE_PERPLEXITY_API_KEY;

  if (!PERPLEXITY_API_KEY) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error:
          'Perplexity API key not configured in Netlify environment variables',
      }),
    };
  }

  try {
    // Validate request body size (max 1MB)
    const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
    if (event.body && event.body.length > MAX_REQUEST_SIZE) {
      return {
        statusCode: 413,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Request payload too large',
          maxSize: '1MB',
        }),
      };
    }

    // Parse and validate request body with Zod schema
    // SECURITY: Validates model whitelist, temperature bounds, message limits
    // Updated: Jan 10th 2026 - Added strict Zod schema validation
    const parseResult = perplexityRequestSchema.safeParse(
      JSON.parse(event.body || '{}')
    );

    if (!parseResult.success) {
      return {
        statusCode: 400,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { messages, model, max_tokens, temperature } = parseResult.data;

    console.log('[Perplexity Proxy] Received request:', {
      model,
      messageCount: messages?.length,
    });

    // Pre-flight token check to prevent overdraft
    // SECURITY FIX: Use verified user ID from JWT (via withAuth middleware) instead of request body
    const authenticatedUserId = event.user?.id;
    const { sessionId } = extractRequestMetadata(event); // Only get sessionId from body (safe)

    if (authenticatedUserId) {
      const messageLength = JSON.stringify(messages).length;
      const estimatedTokens = Math.ceil(messageLength / 3) * 3; // Conservative estimate

      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // SECURITY FIX: Use user_token_balances table (correct table) instead of users table
      const { data: balanceData, error: balanceError } = await supabaseAdmin
        .from('user_token_balances')
        .select('token_balance, plan')
        .eq('user_id', authenticatedUserId)
        .maybeSingle();

      if (!balanceData && !balanceError) {
        await supabaseAdmin.rpc('get_or_create_token_balance', { p_user_id: authenticatedUserId });
        const { data: newBalanceData } = await supabaseAdmin
          .from('user_token_balances')
          .select('token_balance, plan')
          .eq('user_id', authenticatedUserId)
          .maybeSingle();

        if (newBalanceData && newBalanceData.token_balance !== null && newBalanceData.token_balance < estimatedTokens) {
          console.warn('[Perplexity Proxy] Insufficient token balance:', {
            userId: authenticatedUserId,
            required: estimatedTokens,
            available: newBalanceData.token_balance,
          });
          return {
            statusCode: 402,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'Insufficient token balance',
              required: estimatedTokens,
              available: newBalanceData.token_balance,
              upgradeUrl: '/pricing',
            }),
          };
        }
      } else if (balanceData && balanceData.token_balance !== null && balanceData.token_balance < estimatedTokens) {
        console.warn('[Perplexity Proxy] Insufficient token balance:', {
          userId: authenticatedUserId,
          required: estimatedTokens,
          available: balanceData.token_balance,
        });
        return {
          statusCode: 402,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Insufficient token balance',
            required: estimatedTokens,
            available: balanceData.token_balance,
            upgradeUrl: '/pricing',
          }),
        };
      }
    }

    // Make request to Perplexity API (OpenAI-compatible) with 25-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds

    let response: Response;
    try {
      response = await fetch(
        'https://api.perplexity.ai/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          statusCode: 504,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Gateway timeout - API request took too long' })
        };
      }
      throw error;
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('[Perplexity Proxy] API Error:', data);
      return {
        statusCode: response.status,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify({
          error: data.error?.message || 'Perplexity API error',
          details: data,
        }),
      };
    }

    console.log('[Perplexity Proxy] Success');

    // Track token usage with proper error handling
    if (data.usage) {
      // SECURITY FIX: Use verified userId from JWT
      const verifiedUserId = event.user?.id || null;
      const { sessionId: bodySessionId } = extractRequestMetadata(event);
      const tokenUsage = calculateTokenCost(
        'perplexity',
        model,
        data.usage.prompt_tokens || 0,
        data.usage.completion_tokens || 0
      );

      // Store usage in Supabase with timeout and retry
      const storageResult = await storeTokenUsage(
        'perplexity',
        model,
        verifiedUserId,
        bodySessionId,
        tokenUsage,
        { timeout: 3000, retries: 1 }
      );

      // Add token usage info to response with storage status
      data.tokenTracking = {
        ...tokenUsage,
        provider: 'perplexity',
        model,
        timestamp: new Date().toISOString(),
        stored: storageResult.success,
        storageError: storageResult.error,
      };

      if (!storageResult.success) {
        console.warn('[Perplexity Proxy] Token usage tracking failed:', storageResult.error);
      }

      // Deduct tokens from user balance
      // SECURITY FIX: Use verified userId from JWT
      if (verifiedUserId) {
        const supabaseAdmin = createClient(
          process.env.VITE_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const totalTokens = tokenUsage.inputTokens + tokenUsage.outputTokens;
        const { data: newBalance, error: deductError } = await supabaseAdmin.rpc('deduct_user_tokens', {
          p_user_id: verifiedUserId,
          p_tokens: totalTokens,
          p_provider: 'perplexity',
          p_model: model,
        });

        if (deductError) {
          console.error('[Perplexity Proxy] Token deduction failed:', deductError);
          data.tokenTracking.deductionFailed = true;
          data.tokenTracking.deductionError = deductError.message;
        } else {
          console.log('[Perplexity Proxy] Token deduction successful. New balance:', newBalance);
          data.tokenTracking.newBalance = newBalance;
          data.tokenTracking.deducted = true;
        }
      }
    }

    // Normalize response to ensure a plain text content exists for the UI
    let normalizedContent: string | undefined = undefined;
    try {
      normalizedContent =
        data.choices?.[0]?.message?.content ||
        data.output_text ||
        data.content;
    } catch (err) {
      console.debug('[Perplexity Proxy] Content normalization error:', err);
    }

    const normalized = {
      ...data,
      content: normalizedContent,
    };

    // Updated: Jan 6th 2026 - Fixed CORS wildcard vulnerability with origin validation
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify(normalized),
    };
  } catch (error) {
    console.error('[Perplexity Proxy] Error:', error);
    return {
      statusCode: 500,
      headers: getMinimalCorsHeaders(origin),
      body: JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Export handler with both authentication and rate limiting middleware
export const handler = withAuth(withRateLimit(perplexityHandler));
