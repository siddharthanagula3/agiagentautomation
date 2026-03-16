import type { Handler } from '@netlify/functions';
import { AuthenticatedEvent } from '../utils/auth-middleware';
import { withRateLimit } from '../utils/rate-limiter';
import { withAuth } from '../utils/auth-middleware';
import {
  getSafeCorsHeaders,
  getSecurityHeaders,
  checkOriginAndBlock,
} from '../utils/cors';
import {
  googleImagenRequestSchema,
  formatValidationError,
} from '../utils/validation-schemas';
import { checkTokenBalance, estimateTokensFromCost, createInsufficientBalanceResponse } from '../utils/token-balance-check';
import { deductCredits } from '../utils/credit-system';

/**
 * Netlify Function to proxy Google Imagen image generation API calls
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

// Imagen pricing per image (as of January 2026)
// Note: Pricing varies by model and may change
const IMAGEN_PRICING = {
  'imagen-3.0-generate-001': 0.04, // Per image
  'imagen-3.0-fast-generate-001': 0.02, // Per image (faster, lower quality)
  'imagegeneration@006': 0.02,
  'imagegeneration@005': 0.02,
};

const googleImagenHandler: Handler = async (event: AuthenticatedEvent) => {
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
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.error('[Google Imagen Proxy] API key not configured');
    return {
      statusCode: 500,
      headers: getSecurityHeaders(),
      body: JSON.stringify({
        error: 'Google API key not configured in Netlify environment variables',
      }),
    };
  }

  try {
    // Validate request body size (max 1MB for prompts)
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
    const parseResult = googleImagenRequestSchema.safeParse(
      JSON.parse(event.body || '{}')
    );

    if (!parseResult.success) {
      return {
        statusCode: 400,
        headers: getSecurityHeaders(),
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const {
      prompt,
      model,
      sampleCount,
      aspectRatio,
      negativePrompt,
      personGeneration,
      safetyFilterLevel,
    } = parseResult.data;

    console.log('[Google Imagen Proxy] Received request:', {
      model,
      sampleCount,
      aspectRatio,
      promptLength: prompt.length,
    });

    // Get authenticated user ID from JWT
    const authenticatedUserId = event.user?.id;

    // Pre-flight credit balance check
    if (authenticatedUserId) {
      const pricePerImage = IMAGEN_PRICING[model as keyof typeof IMAGEN_PRICING] || 0.04;
      const estimatedCostCents = estimateTokensFromCost(pricePerImage, sampleCount);
      const balanceCheck = await checkTokenBalance(authenticatedUserId, estimatedCostCents, '[Imagen Proxy]', 'google', model);

      if (!balanceCheck.hasBalance) {
        return createInsufficientBalanceResponse(
          { required: estimatedCostCents, available: balanceCheck.balance ?? 0 },
          corsHeaders
        );
      }
    }

    // Build request body for Google Imagen API
    // Google Imagen uses Vertex AI endpoint format
    const requestBody = {
      instances: [
        {
          prompt,
        },
      ],
      parameters: {
        sampleCount,
        aspectRatio,
        ...(negativePrompt && { negativePrompt }),
        personGeneration,
        safetyFilterLevel,
      },
    };

    // Determine the API endpoint based on the model
    // For Imagen 3.0, use the generativelanguage API
    // For older models, use Vertex AI
    let apiUrl: string;
    let headers: Record<string, string>;

    if (model.startsWith('imagen-3.0')) {
      // Use the newer Gemini-style API for Imagen 3.0
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateImages?key=${GOOGLE_API_KEY}`;
      headers = {
        'Content-Type': 'application/json',
      };
    } else {
      // Use Vertex AI for older imagegeneration models
      // Note: Requires a GCP project configured
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id';
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
      apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GOOGLE_API_KEY}`,
      };
    }

    // Make request to Google Imagen API with 90-second timeout (image generation can be slow)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers,
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
      console.error('[Google Imagen Proxy] API Error:', data);

      return {
        statusCode: response.status,
        headers: getSecurityHeaders(),
        body: JSON.stringify({
          error: 'An error occurred processing your request',
        }),
      };
    }

    // Normalize response format
    // Google Imagen returns predictions array with base64 images
    const imagesGenerated = data.predictions?.length || data.images?.length || sampleCount;

    console.log('[Google Imagen Proxy] Success:', {
      imagesGenerated,
    });

    // Deduct credits from user balance
    // REVENUE LEAK FIX: Return 402 if deduction fails
    if (authenticatedUserId) {
      const pricePerImage = IMAGEN_PRICING[model as keyof typeof IMAGEN_PRICING] || 0.04;
      const actualCostCents = estimateTokensFromCost(pricePerImage, imagesGenerated);

      const deductResult = await deductCredits(
        authenticatedUserId,
        actualCostCents,
        `Imagen ${model} - ${imagesGenerated} image(s)`,
        { model, count: imagesGenerated, aspectRatio, personGeneration, safetyFilterLevel }
      );

      if (!deductResult.success) {
        console.error('[Google Imagen Proxy] Credit deduction failed:', deductResult.error);
        return {
          statusCode: 402,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Credit deduction failed', details: deductResult.error }),
        };
      }

      console.log('[Google Imagen Proxy] Credit deduction successful. New balance:', deductResult.newBalanceCents);
      data.tokenTracking = {
        costCents: actualCostCents,
        newBalanceCents: deductResult.newBalanceCents,
      };
    }

    // Transform response to a consistent format
    const normalizedResponse = {
      images: data.predictions || data.images || [],
      model,
      created: Date.now(),
      tokenTracking: data.tokenTracking,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify(normalizedResponse),
    };
  } catch (error) {
    // SECURITY: Log full error server-side but return generic message to client
    console.error('[Google Imagen Proxy] Error:', error);
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
export const handler = withAuth(withRateLimit(googleImagenHandler));
