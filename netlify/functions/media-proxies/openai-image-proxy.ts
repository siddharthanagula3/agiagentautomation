import { Handler } from '@netlify/functions';
import { AuthenticatedEvent } from '../utils/auth-middleware';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit } from '../utils/rate-limiter';
import { withAuth } from '../utils/auth-middleware';
import {
  getSafeCorsHeaders,
  getSecurityHeaders,
  checkOriginAndBlock,
} from '../utils/cors';
import {
  openaiImageRequestSchema,
  formatValidationError,
} from '../utils/validation-schemas';

/**
 * Netlify Function to proxy OpenAI DALL-E image generation API calls
 * This solves CORS issues by making API calls server-side
 *
 * SECURITY:
 * - JWT authentication required via withAuth middleware
 * - Rate limited to 10 requests per minute per user
 * - Zod validation for all input parameters
 * - Model whitelist to prevent injection
 * - CORS origin validation
 * - Request size limits
 *
 * Created: January 18, 2026
 */

// DALL-E pricing per image (as of January 2026)
const DALLE_PRICING = {
  'dall-e-3': {
    '1024x1024': { standard: 0.04, hd: 0.08 },
    '1024x1792': { standard: 0.08, hd: 0.12 },
    '1792x1024': { standard: 0.08, hd: 0.12 },
  },
  'dall-e-2': {
    '256x256': { standard: 0.016 },
    '512x512': { standard: 0.018 },
    '1024x1024': { standard: 0.02 },
  },
};

const openaiImageHandler: Handler = async (event: AuthenticatedEvent) => {
  // Extract origin for CORS validation
  const origin = event.headers.origin || event.headers.Origin || '';
  const corsHeaders = getSafeCorsHeaders(origin);

  // Check if origin should be blocked
  const blockResponse = checkOriginAndBlock(origin);
  if (blockResponse) {
    return blockResponse;
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Get API key from environment
  const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error('[OpenAI Image Proxy] API key not configured');
    return {
      statusCode: 500,
      headers: getSecurityHeaders(),
      body: JSON.stringify({
        error: 'OpenAI API key not configured in Netlify environment variables',
      }),
    };
  }

  try {
    // Validate request body size (max 1MB for prompts, not for image upload)
    const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
    if (event.body && event.body.length > MAX_REQUEST_SIZE) {
      return {
        statusCode: 413,
        headers: getSecurityHeaders(),
        body: JSON.stringify({
          error: 'Request payload too large',
          maxSize: '1MB',
        }),
      };
    }

    // Parse and validate request body with Zod schema
    const parseResult = openaiImageRequestSchema.safeParse(
      JSON.parse(event.body || '{}')
    );

    if (!parseResult.success) {
      return {
        statusCode: 400,
        headers: getSecurityHeaders(),
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { prompt, model, n, size, quality, style, response_format } = parseResult.data;

    console.log('[OpenAI Image Proxy] Received request:', {
      model,
      size,
      quality,
      imageCount: n,
      promptLength: prompt.length,
    });

    // Get authenticated user ID from JWT
    const authenticatedUserId = event.user?.id;

    // Estimate cost for pre-flight balance check
    if (authenticatedUserId) {
      // Calculate estimated cost
      type DalleModel = keyof typeof DALLE_PRICING;
      type DalleSize = keyof typeof DALLE_PRICING['dall-e-3'];

      const modelPricing = DALLE_PRICING[model as DalleModel];
      const sizePricing = modelPricing?.[size as DalleSize];
      const pricePerImage = model === 'dall-e-3'
        ? (sizePricing as { standard: number; hd: number })?.[quality] || 0.04
        : (sizePricing as { standard: number })?.standard || 0.02;
      const estimatedCost = pricePerImage * n;

      // Convert cost to tokens (approximately 1000 tokens = $0.001)
      const estimatedTokens = Math.ceil(estimatedCost * 1000000);

      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Check user's token balance
      const { data: balanceData, error: balanceError } = await supabaseAdmin
        .from('user_token_balances')
        .select('token_balance, plan')
        .eq('user_id', authenticatedUserId)
        .maybeSingle();

      if (!balanceData && !balanceError) {
        // Create balance record if it doesn't exist
        await supabaseAdmin.rpc('get_or_create_token_balance', { p_user_id: authenticatedUserId });
        const { data: newBalanceData } = await supabaseAdmin
          .from('user_token_balances')
          .select('token_balance, plan')
          .eq('user_id', authenticatedUserId)
          .maybeSingle();

        if (newBalanceData && newBalanceData.token_balance !== null && newBalanceData.token_balance < estimatedTokens) {
          console.warn('[OpenAI Image Proxy] Insufficient token balance:', {
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
              estimatedCost: `$${estimatedCost.toFixed(4)}`,
              upgradeUrl: '/pricing',
            }),
          };
        }
      } else if (balanceData && balanceData.token_balance !== null && balanceData.token_balance < estimatedTokens) {
        console.warn('[OpenAI Image Proxy] Insufficient token balance:', {
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
            estimatedCost: `$${estimatedCost.toFixed(4)}`,
            upgradeUrl: '/pricing',
          }),
        };
      }
    }

    // Build request body for OpenAI
    // Note: DALL-E 2 doesn't support quality/style parameters
    const requestBody: Record<string, unknown> = {
      model,
      prompt,
      n,
      size,
      response_format,
    };

    if (model === 'dall-e-3') {
      requestBody.quality = quality;
      requestBody.style = style;
    }

    // Make request to OpenAI API with 60-second timeout (image generation can be slow)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds

    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          statusCode: 504,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Gateway timeout',
            message: 'Image generation took too long. Please try again.',
          }),
        };
      }
      throw error;
    }

    const data = await response.json();

    if (!response.ok) {
      // SECURITY: Log full error server-side but return generic message to client
      console.error('[OpenAI Image Proxy] API Error:', data);
      return {
        statusCode: response.status,
        headers: getSecurityHeaders(),
        body: JSON.stringify({
          error: 'An error occurred processing your request',
        }),
      };
    }

    console.log('[OpenAI Image Proxy] Success:', {
      imagesGenerated: data.data?.length || 0,
    });

    // Deduct tokens from user balance
    if (authenticatedUserId) {
      type DalleModel = keyof typeof DALLE_PRICING;
      type DalleSize = keyof typeof DALLE_PRICING['dall-e-3'];

      const modelPricing = DALLE_PRICING[model as DalleModel];
      const sizePricing = modelPricing?.[size as DalleSize];
      const pricePerImage = model === 'dall-e-3'
        ? (sizePricing as { standard: number; hd: number })?.[quality] || 0.04
        : (sizePricing as { standard: number })?.standard || 0.02;
      const actualCost = pricePerImage * (data.data?.length || n);
      const tokensToDeduct = Math.ceil(actualCost * 1000000);

      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: newBalance, error: deductError } = await supabaseAdmin.rpc('deduct_user_tokens', {
        p_user_id: authenticatedUserId,
        p_tokens: tokensToDeduct,
        p_provider: 'openai-dalle',
        p_model: model,
      });

      if (deductError) {
        console.error('[OpenAI Image Proxy] Token deduction failed:', deductError);
        // Don't fail the request, just log the error
        data.tokenTracking = {
          deductionFailed: true,
          deductionError: deductError.message,
        };
      } else {
        console.log('[OpenAI Image Proxy] Token deduction successful. New balance:', newBalance);
        data.tokenTracking = {
          cost: actualCost,
          tokensDeducted: tokensToDeduct,
          newBalance,
        };
      }

      // Log usage for analytics
      await supabaseAdmin.from('media_generation_usage').insert({
        user_id: authenticatedUserId,
        provider: 'openai',
        model,
        type: 'image',
        prompt_length: prompt.length,
        images_generated: data.data?.length || n,
        parameters: { size, quality, style },
        cost: actualCost,
        created_at: new Date().toISOString(),
      }).catch(err => {
        console.warn('[OpenAI Image Proxy] Failed to log usage:', err);
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    // SECURITY: Log full error server-side but return generic message to client
    console.error('[OpenAI Image Proxy] Error:', error);
    return {
      statusCode: 500,
      headers: getSecurityHeaders(),
      body: JSON.stringify({
        error: 'An error occurred processing your request',
      }),
    };
  }
};

// Export handler with both authentication and rate limiting middleware
export const handler = withAuth(withRateLimit(openaiImageHandler));
