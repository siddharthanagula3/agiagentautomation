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
import {
  getSafeCorsHeaders,
  checkOriginAndBlock,
  getMinimalCorsHeaders,
} from '../utils/cors';
import {
  googleRequestSchema,
  formatValidationError,
} from '../utils/validation-schemas';

/**
 * Netlify Function to proxy Google Gemini API calls
 * This solves CORS issues by making API calls server-side
 * Includes token usage tracking for billing and analytics
 * SECURITY: Rate limited to 10 requests per minute per user + Authentication required
 * Updated: Jan 22nd 2026 - Fixed CORS null spreading by using getSafeCorsHeaders
 */
const googleHandler: Handler = async (event: AuthenticatedEvent) => {
  // Extract origin for CORS validation
  const origin = event.headers.origin || event.headers.Origin || '';

  // Early-exit for unauthorized origins
  const blockedResponse = checkOriginAndBlock(origin);
  if (blockedResponse) {
    return blockedResponse;
  }

  // Use safe CORS headers that always return a valid object
  const corsHeaders = getSafeCorsHeaders(origin);

  // Updated: Nov 16th 2025 - Fixed missing CORS headers on error responses
  // Updated: Jan 6th 2026 - Fixed CORS wildcard vulnerability with origin validation
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Get API key from environment (server-side only - no VITE_ prefix)
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.error('[Google Proxy] API key not configured');
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
    // Updated: Nov 16th 2025 - Fixed missing request size validation
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
    const parseResult = googleRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return {
        statusCode: 400,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { messages, model, temperature, attachments } = parseResult.data;
    // SECURITY: attachments are now validated through Zod schema (type whitelist, size limits)

    console.log('[Google Proxy] Received request:', {
      model,
      messageCount: messages?.length,
      attachmentCount: attachments.length,
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
          console.warn('[Google Proxy] Insufficient token balance:', {
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
        console.warn('[Google Proxy] Insufficient token balance:', {
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

    // Convert messages to Gemini format
    interface Message {
      role: string;
      content: string;
    }
    interface Attachment {
      mimeType: string;
      dataBase64: string;
    }
    interface GeminiPart {
      text?: string;
      inline_data?: { mime_type: string; data: string };
    }

    const systemMessage = messages.find((m: Message) => m.role === 'system');
    const conversationMessages = messages.filter(
      (m: Message) => m.role !== 'system'
    );

    const geminiContents = conversationMessages.map((msg: Message) => {
      const parts: GeminiPart[] = [{ text: msg.content }];

      // Add attachments if this is the last user message
      if (msg.role === 'user' && attachments.length > 0) {
        attachments.forEach((attachment: Attachment) => {
          parts.push({
            inline_data: {
              mime_type: attachment.mimeType,
              data: attachment.dataBase64,
            },
          });
        });
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    interface GeminiRequestBody {
      contents: unknown[];
      generationConfig: { temperature: number; maxOutputTokens: number };
      systemInstruction?: { parts: Array<{ text: string }> };
    }

    const requestBody: GeminiRequestBody = {
      contents: geminiContents,
      generationConfig: {
        temperature,
        maxOutputTokens: 4000,
      },
    };

    // Add system instruction if present
    if (systemMessage) {
      requestBody.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    // Make request to Google Gemini API with 25-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
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
      console.error('[Google Proxy] API Error:', data);
      return {
        statusCode: response.status,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify({
          error: data.error?.message || 'Google API error',
          details: data,
        }),
      };
    }

    console.log('[Google Proxy] Success');

    // Track token usage with proper error handling
    if (data.usageMetadata) {
      // SECURITY FIX: Use verified userId from JWT
      const verifiedUserId = event.user?.id || null;
      const { sessionId: bodySessionId } = extractRequestMetadata(event);
      const tokenUsage = calculateTokenCost(
        'google',
        model,
        data.usageMetadata.promptTokenCount || 0,
        data.usageMetadata.candidatesTokenCount || 0
      );

      // Store usage in Supabase with timeout and retry
      const storageResult = await storeTokenUsage(
        'google',
        model,
        verifiedUserId,
        bodySessionId,
        tokenUsage,
        { timeout: 3000, retries: 1 }
      );

      // Add token usage info to response with storage status
      data.tokenTracking = {
        ...tokenUsage,
        provider: 'google',
        model,
        timestamp: new Date().toISOString(),
        stored: storageResult.success,
        storageError: storageResult.error,
      };

      if (!storageResult.success) {
        console.warn('[Google Proxy] Token usage tracking failed:', storageResult.error);
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
          p_provider: 'google',
          p_model: model,
        });

        if (deductError) {
          console.error('[Google Proxy] Token deduction failed:', deductError);
          data.tokenTracking.deductionFailed = true;
          data.tokenTracking.deductionError = deductError.message;
        } else {
          console.log('[Google Proxy] Token deduction successful. New balance:', newBalance);
          data.tokenTracking.newBalance = newBalance;
          data.tokenTracking.deducted = true;
        }
      }
    }

    // Normalize response to ensure a plain text content exists for the UI
    let normalizedContent: string | undefined = undefined;
    try {
      const parts = data.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        normalizedContent = parts
          .map((p: { text?: string }) => p.text)
          .filter(Boolean)
          .join('');
      }
      if (!normalizedContent) {
        normalizedContent =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          data.output_text ||
          data.content;
      }
    } catch (err) {
      // Silently ignore parsing errors
      console.debug('[Google Proxy] Content normalization error:', err);
    }

    const normalized = {
      ...data,
      content: normalizedContent,
    };

    // Updated: Nov 16th 2025 - Fixed missing CORS headers in API proxy responses
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
    console.error('[Google Proxy] Error:', error);
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

// Updated: Nov 16th 2025 - Fixed authentication bypass by adding auth middleware
// Export handler with both authentication and rate limiting middleware
export const handler = withAuth(withRateLimit(googleHandler));
