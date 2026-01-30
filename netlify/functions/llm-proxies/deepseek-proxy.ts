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
import { getSafeCorsHeaders, getMinimalCorsHeaders, checkOriginAndBlock } from '../utils/cors';
import {
  deepseekRequestSchema,
  formatValidationError,
} from '../utils/validation-schemas';
import {
  checkTokenBalance,
  createInsufficientBalanceResponse,
  estimateTokensFromMessages,
} from '../utils/token-balance-check';

/**
 * Netlify Function to proxy DeepSeek API calls
 * DeepSeek uses OpenAI-compatible API for chat completions
 * Includes token usage tracking for billing and analytics
 * SECURITY: Rate limited to 10 requests per minute per user + Authentication required
 * Created: Jan 6th 2026
 * Updated: Jan 22nd 2026 - Fixed CORS null spreading by using getSafeCorsHeaders
 */
const deepseekHandler: Handler = async (event: AuthenticatedEvent) => {
  // Extract origin for CORS validation
  // Updated: Jan 29th 2026 - Fixed null CORS headers and added OPTIONS preflight handling
  const origin = event.headers.origin || event.headers.Origin || '';
  const corsHeaders = getSafeCorsHeaders(origin);

  // Handle CORS preflight requests before auth check
  if (event.httpMethod === 'OPTIONS') {
    const blockedResponse = checkOriginAndBlock(origin);
    if (blockedResponse) {
      return blockedResponse;
    }
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  // Block unauthorized origins early
  const blockedResponse = checkOriginAndBlock(origin);
  if (blockedResponse) {
    return blockedResponse;
  }

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
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

  if (!DEEPSEEK_API_KEY) {
    console.error('[DeepSeek Proxy] API key not configured');
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Service temporarily unavailable',
        code: 'SERVER_CONFIGURATION_ERROR',
        retryable: true,
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
    const rawBody = JSON.parse(event.body || '{}');
    const parseResult = deepseekRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return {
        statusCode: 400,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { messages, model, max_tokens, temperature, stream } = parseResult.data;
    // Additional parameters not in base schema (passed through without validation)
    const top_p = rawBody.top_p ?? 1;
    const frequency_penalty = rawBody.frequency_penalty ?? 0;
    const presence_penalty = rawBody.presence_penalty ?? 0;

    console.log('[DeepSeek Proxy] Received request:', {
      model,
      messageCount: messages?.length,
      stream,
    });

    // Pre-flight token check to prevent overdraft
    // SECURITY FIX: Use verified user ID from JWT (via withAuth middleware) instead of request body
    const authenticatedUserId = event.user?.id;

    // Token balance check using shared utility
    if (authenticatedUserId) {
      const estimatedTokens = estimateTokensFromMessages(messages);
      const balanceCheck = await checkTokenBalance(authenticatedUserId, estimatedTokens, '[DeepSeek Proxy]');

      if (!balanceCheck.hasBalance) {
        return createInsufficientBalanceResponse(
          { required: estimatedTokens, available: balanceCheck.balance || 0 },
          corsHeaders
        );
      }
    }

    // Handle streaming responses
    if (stream) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds

      let response: Response;
      try {
        response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens,
            stream: true,
            top_p,
            frequency_penalty,
            presence_penalty,
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

      if (!response.ok) {
        const errorData = await response.json();
        // SECURITY: Log full error server-side but return generic message to client
        console.error('[DeepSeek Proxy] Streaming API Error:', errorData);
        return {
          statusCode: response.status,
          headers: getMinimalCorsHeaders(origin),
          body: JSON.stringify({
            error: 'An error occurred processing your request',
          }),
        };
      }

      // For streaming, return the response body directly
      // Note: Netlify Functions have limited streaming support,
      // so we collect the stream and return it
      const reader = response.body?.getReader();
      if (!reader) {
        return {
          statusCode: 500,
          headers: getMinimalCorsHeaders(origin),
          body: JSON.stringify({ error: 'Failed to get response stream' }),
        };
      }

      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      const streamContent = Buffer.concat(chunks).toString('utf-8');

      console.log('[DeepSeek Proxy] Stream completed');

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          ...corsHeaders,
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: streamContent,
      };
    }

    // Non-streaming request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds

    let response: Response;
    try {
      response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
          stream: false,
          top_p,
          frequency_penalty,
          presence_penalty,
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
      // SECURITY: Log full error server-side but return generic message to client
      console.error('[DeepSeek Proxy] API Error:', data);
      return {
        statusCode: response.status,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify({
          error: 'An error occurred processing your request',
        }),
      };
    }

    console.log('[DeepSeek Proxy] Success');

    // Track token usage
    if (data.usage) {
      // SECURITY FIX: Use verified userId from JWT
      const verifiedUserId = event.user?.id || null;
      const { sessionId: bodySessionId } = extractRequestMetadata(event);

      // Calculate token cost for DeepSeek
      // DeepSeek pricing: ~$0.14/1M input tokens, ~$0.28/1M output tokens (deepseek-chat)
      // DeepSeek Coder: ~$0.14/1M input tokens, ~$0.28/1M output tokens
      const tokenUsage = {
        inputTokens: data.usage.prompt_tokens || 0,
        outputTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
        inputCost: ((data.usage.prompt_tokens || 0) / 1000000) * 0.14,
        outputCost: ((data.usage.completion_tokens || 0) / 1000000) * 0.28,
        totalCost: 0,
      };
      tokenUsage.totalCost = tokenUsage.inputCost + tokenUsage.outputCost;

      // Store usage in Supabase with timeout and retry
      const storageResult = await storeTokenUsage(
        'deepseek',
        model,
        verifiedUserId,
        bodySessionId,
        tokenUsage,
        { timeout: 3000, retries: 1 }
      );

      // Add token usage info to response with storage status
      data.tokenTracking = {
        ...tokenUsage,
        provider: 'deepseek',
        model: data.model || model,
        timestamp: new Date().toISOString(),
        stored: storageResult.success,
        storageError: storageResult.error,
      };

      if (!storageResult.success) {
        console.warn('[DeepSeek Proxy] Token usage tracking failed:', storageResult.error);
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
          p_provider: 'deepseek',
          p_model: model,
        });

        if (deductError) {
          console.error('[DeepSeek Proxy] Token deduction failed:', deductError);
          data.tokenTracking.deductionFailed = true;
          data.tokenTracking.deductionError = deductError.message;
        } else {
          console.log('[DeepSeek Proxy] Token deduction successful. New balance:', newBalance);
          data.tokenTracking.newBalance = newBalance;
          data.tokenTracking.deducted = true;
        }
      }
    }

    // Normalize content for UI consumers (OpenAI-compatible format)
    const content = data.choices?.[0]?.message?.content || data.content;
    const normalized = { ...data, content };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify(normalized),
    };
  } catch (error) {
    // SECURITY: Log full error server-side but return generic message to client
    console.error('[DeepSeek Proxy] Error:', error);
    return {
      statusCode: 500,
      headers: getMinimalCorsHeaders(origin),
      body: JSON.stringify({
        error: 'An error occurred processing your request',
      }),
    };
  }
};

// Export handler with both authentication and rate limiting middleware
export const handler = withAuth(withRateLimit(deepseekHandler));
