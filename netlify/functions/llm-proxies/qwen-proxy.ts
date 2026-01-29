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
  qwenRequestSchema,
  formatValidationError,
} from '../utils/validation-schemas';

/**
 * Netlify Function to proxy Qwen/DashScope API calls
 * This solves CORS issues by making API calls server-side
 * Includes token usage tracking for billing and analytics
 * SECURITY: Rate limited to 10 requests per minute per user + Authentication required
 *
 * Qwen API uses OpenAI-compatible endpoint format via DashScope
 * Endpoint: https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
 *
 * Created: Jan 6th 2026
 * Updated: Jan 22nd 2026 - Fixed CORS null spreading by using getSafeCorsHeaders
 */
const qwenHandler: Handler = async (event: AuthenticatedEvent) => {
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

  // Get API key from environment (try both QWEN_API_KEY and DASHSCOPE_API_KEY)
  const QWEN_API_KEY = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;

  if (!QWEN_API_KEY) {
    console.error('[Qwen Proxy] API key not configured');
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
    const parseResult = qwenRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return {
        statusCode: 400,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { messages, model, max_tokens, temperature, stream } = parseResult.data;
    // Additional parameters not in base schema (passed through without validation)
    const top_p = rawBody.top_p ?? 0.8;
    const enable_search = rawBody.enable_search ?? false;

    console.log('[Qwen Proxy] Received request:', {
      model,
      messageCount: messages?.length,
      stream,
      enableSearch: enable_search,
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
          console.warn('[Qwen Proxy] Insufficient token balance:', {
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
        console.warn('[Qwen Proxy] Insufficient token balance:', {
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

    // DashScope OpenAI-compatible endpoint
    const DASHSCOPE_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

    // Build request payload for DashScope API
    const requestPayload: Record<string, unknown> = {
      model,
      messages,
      max_tokens,
      temperature,
      top_p,
      stream,
    };

    // Add enable_search for web search capability (Qwen-specific)
    if (enable_search) {
      requestPayload.enable_search = true;
    }

    // Handle streaming responses
    if (stream) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds

      let response: Response;
      try {
        response = await fetch(DASHSCOPE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${QWEN_API_KEY}`,
          },
          body: JSON.stringify(requestPayload),
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
        const errorData = await response.json().catch(() => ({}));
        // SECURITY: Log full error server-side but return generic message to client
        console.error('[Qwen Proxy] Streaming API Error:', errorData);
        return {
          statusCode: response.status,
          headers: getMinimalCorsHeaders(origin),
          body: JSON.stringify({
            error: 'An error occurred processing your request',
          }),
        };
      }

      // For streaming, we need to return the raw stream
      // Netlify Functions support streaming via ReadableStream
      const responseBody = response.body;
      if (!responseBody) {
        return {
          statusCode: 500,
          headers: getMinimalCorsHeaders(origin),
          body: JSON.stringify({ error: 'No response body from Qwen API' }),
        };
      }

      // Return streaming response with proper headers
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders,
        },
        body: responseBody,
        isBase64Encoded: false,
      } as unknown as ReturnType<Handler>;
    }

    // Non-streaming request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds

    let response: Response;
    try {
      response = await fetch(DASHSCOPE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${QWEN_API_KEY}`,
        },
        body: JSON.stringify(requestPayload),
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
      console.error('[Qwen Proxy] API Error:', data);
      return {
        statusCode: response.status,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify({
          error: 'An error occurred processing your request',
        }),
      };
    }

    console.log('[Qwen Proxy] Success');

    // Track token usage with proper error handling
    if (data.usage) {
      // SECURITY FIX: Use verified userId from JWT
      const verifiedUserId = event.user?.id || null;
      const { sessionId: bodySessionId } = extractRequestMetadata(event);
      const tokenUsage = calculateTokenCost(
        'qwen',
        model,
        data.usage.prompt_tokens,
        data.usage.completion_tokens
      );

      // Store usage in Supabase with timeout and retry
      const storageResult = await storeTokenUsage(
        'qwen',
        model,
        verifiedUserId,
        bodySessionId,
        tokenUsage,
        { timeout: 3000, retries: 1 }
      );

      // Add token usage info to response with storage status
      data.tokenTracking = {
        ...tokenUsage,
        provider: 'qwen',
        model,
        timestamp: new Date().toISOString(),
        stored: storageResult.success,
        storageError: storageResult.error,
      };

      if (!storageResult.success) {
        console.warn('[Qwen Proxy] Token usage tracking failed:', storageResult.error);
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
          p_provider: 'qwen',
          p_model: model,
        });

        if (deductError) {
          console.error('[Qwen Proxy] Token deduction failed:', deductError);
          data.tokenTracking.deductionFailed = true;
          data.tokenTracking.deductionError = deductError.message;
        } else {
          console.log('[Qwen Proxy] Token deduction successful. New balance:', newBalance);
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
    console.error('[Qwen Proxy] Error:', error);
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
export const handler = withAuth(withRateLimit(qwenHandler));
