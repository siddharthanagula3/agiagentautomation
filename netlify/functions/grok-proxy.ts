import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import {
  calculateTokenCost,
  storeTokenUsage,
  extractRequestMetadata,
} from './utils/token-tracking';
import { withRateLimit } from './utils/rate-limiter';
import { withAuth } from './utils/auth-middleware';
import { getCorsHeaders, getMinimalCorsHeaders } from './utils/cors';
import {
  grokRequestSchema,
  formatValidationError,
} from './utils/validation-schemas';

/**
 * Netlify Function to proxy xAI Grok API calls
 * Grok uses OpenAI-compatible API with real-time X (Twitter) access
 * Includes token usage tracking for billing and analytics
 * SECURITY: Rate limited to 10 requests per minute per user + Authentication required
 * Created: Nov 18th 2025
 */
const grokHandler: Handler = async (event: HandlerEvent) => {
  // Extract origin for CORS validation
  const origin = event.headers.origin || event.headers.Origin || '';
  const corsHeaders = getCorsHeaders(origin);

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
  const GROK_API_KEY = process.env.VITE_GROK_API_KEY;

  if (!GROK_API_KEY) {
    return {
      statusCode: 500,
      headers: getMinimalCorsHeaders(origin),
      body: JSON.stringify({
        error: 'Grok API key not configured in Netlify environment variables',
      }),
    };
  }

  try {
    // Validate request body size (max 1MB)
    const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
    if (event.body && event.body.length > MAX_REQUEST_SIZE) {
      return {
        statusCode: 413,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify({
          error: 'Request payload too large',
          maxSize: '1MB',
        }),
      };
    }

    // Parse and validate request body with Zod schema
    // SECURITY: Validates model whitelist, temperature bounds, message limits
    // Updated: Jan 10th 2026 - Added strict Zod schema validation
    const parseResult = grokRequestSchema.safeParse(
      JSON.parse(event.body || '{}')
    );

    if (!parseResult.success) {
      return {
        statusCode: 400,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { messages, model, max_tokens, temperature, stream } = parseResult.data;

    console.log('[Grok Proxy] Received request:', {
      model,
      messageCount: messages?.length,
      stream,
    });

    // Pre-flight token check to prevent overdraft
    const { userId } = extractRequestMetadata(event);
    if (userId && userId !== 'anonymous') {
      const messageLength = JSON.stringify(messages).length;
      const estimatedTokens = Math.ceil(messageLength / 3) * 3; // Conservative estimate

      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('token_balance, plan')
        .eq('id', userId)
        .maybeSingle();

      if (!userData || (userData.token_balance !== null && userData.token_balance < estimatedTokens)) {
        console.warn('[Grok Proxy] Insufficient token balance:', {
          userId,
          required: estimatedTokens,
          available: userData?.token_balance || 0,
        });
        return {
          statusCode: 402,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Insufficient token balance',
            required: estimatedTokens,
            available: userData?.token_balance || 0,
            upgradeUrl: '/pricing',
          }),
        };
      }
    }

    // Make request to xAI Grok API (OpenAI-compatible endpoint) with 25-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds

    let response: Response;
    try {
      response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROK_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
          stream,
        }),
        signal: controller.signal,
      });
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
      console.error('[Grok Proxy] API Error:', data);
      return {
        statusCode: response.status,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify({
          error: data.error?.message || 'Grok API error',
          details: data,
        }),
      };
    }

    console.log('[Grok Proxy] Success');

    // Track token usage
    if (data.usage) {
      const { userId, sessionId } = extractRequestMetadata(event);

      // Calculate token cost for Grok
      // Grok pricing: ~$5/1M input tokens, ~$15/1M output tokens (estimated)
      const tokenUsage = {
        inputTokens: data.usage.prompt_tokens || 0,
        outputTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
        inputCost: ((data.usage.prompt_tokens || 0) / 1000000) * 5,
        outputCost: ((data.usage.completion_tokens || 0) / 1000000) * 15,
        totalCost: 0,
      };
      tokenUsage.totalCost = tokenUsage.inputCost + tokenUsage.outputCost;

      // Store usage in Supabase with timeout and retry
      const storageResult = await storeTokenUsage(
        'grok',
        model,
        userId,
        sessionId,
        tokenUsage,
        { timeout: 3000, retries: 1 }
      );

      // Add token usage info to response with storage status
      data.tokenTracking = {
        ...tokenUsage,
        provider: 'grok',
        model: data.model,
        timestamp: new Date().toISOString(),
        stored: storageResult.success,
        storageError: storageResult.error,
      };

      if (!storageResult.success) {
        console.warn('[Grok Proxy] Token usage tracking failed:', storageResult.error);
      }

      // Deduct tokens from user balance
      if (userId && userId !== 'anonymous') {
        const supabaseAdmin = createClient(
          process.env.VITE_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const totalTokens = tokenUsage.inputTokens + tokenUsage.outputTokens;
        const { data: newBalance, error: deductError } = await supabaseAdmin.rpc('deduct_user_tokens', {
          p_user_id: userId,
          p_tokens: totalTokens,
          p_provider: 'grok',
          p_model: model,
        });

        if (deductError) {
          console.error('[Grok Proxy] Token deduction failed:', deductError);
          data.tokenTracking.deductionFailed = true;
          data.tokenTracking.deductionError = deductError.message;
        } else {
          console.log('[Grok Proxy] Token deduction successful. New balance:', newBalance);
          data.tokenTracking.newBalance = newBalance;
          data.tokenTracking.deducted = true;
        }
      }
    }

    // Normalize content for UI consumers
    const content = data.choices?.[0]?.message?.content || data.content;
    const normalized = { ...data, content };

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
    console.error('[Grok Proxy] Error:', error);
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
export const handler = withAuth(withRateLimit(grokHandler));
