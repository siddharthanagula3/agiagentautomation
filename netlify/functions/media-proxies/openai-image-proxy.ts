import { Handler } from '@netlify/functions';
import { AuthenticatedEvent } from '../utils/auth-middleware';
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
import { checkTokenBalance, estimateTokensFromCost, createInsufficientBalanceResponse } from '../utils/token-balance-check';
import { deductCredits } from '../utils/credit-system';

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

  // Get API key from environment (server-side only - no VITE_ prefix)
  // SECURITY FIX: Use non-prefixed key to prevent exposure to client
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

    // Pre-flight credit balance check
    if (authenticatedUserId) {
      type DalleModel = keyof typeof DALLE_PRICING;
      type DalleSize = keyof typeof DALLE_PRICING['dall-e-3'];

      const modelPricing = DALLE_PRICING[model as DalleModel];
      const sizePricing = modelPricing?.[size as DalleSize];
      const pricePerImage = model === 'dall-e-3'
        ? (sizePricing as { standard: number; hd: number })?.[quality] || 0.04
        : (sizePricing as { standard: number })?.standard || 0.02;

      const estimatedCostCents = estimateTokensFromCost(pricePerImage, n);
      const balanceCheck = await checkTokenBalance(authenticatedUserId, estimatedCostCents, '[DALL-E Proxy]', 'openai', 'dall-e-3');

      if (!balanceCheck.hasBalance) {
        return createInsufficientBalanceResponse(
          { required: estimatedCostCents, available: balanceCheck.balance ?? 0 },
          corsHeaders
        );
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

    // Deduct credits from user balance
    // REVENUE LEAK FIX: Return 402 if deduction fails
    if (authenticatedUserId) {
      type DalleModel = keyof typeof DALLE_PRICING;
      type DalleSize = keyof typeof DALLE_PRICING['dall-e-3'];

      const modelPricing = DALLE_PRICING[model as DalleModel];
      const sizePricing = modelPricing?.[size as DalleSize];
      const pricePerImage = model === 'dall-e-3'
        ? (sizePricing as { standard: number; hd: number })?.[quality] || 0.04
        : (sizePricing as { standard: number })?.standard || 0.02;
      const actualCount = data.data?.length || n;
      const actualCostCents = estimateTokensFromCost(pricePerImage, actualCount);

      const deductResult = await deductCredits(
        authenticatedUserId,
        actualCostCents,
        `DALL-E ${model} - ${actualCount} image(s)`,
        { model, count: actualCount, size, quality, style }
      );

      if (!deductResult.success) {
        console.error('[OpenAI Image Proxy] Credit deduction failed:', deductResult.error);
        return {
          statusCode: 402,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Credit deduction failed', details: deductResult.error }),
        };
      }

      console.log('[OpenAI Image Proxy] Credit deduction successful. New balance:', deductResult.newBalanceCents);
      data.tokenTracking = {
        costCents: actualCostCents,
        newBalanceCents: deductResult.newBalanceCents,
      };
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
