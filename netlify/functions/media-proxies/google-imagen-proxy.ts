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
  googleImagenRequestSchema,
  formatValidationError,
} from '../utils/validation-schemas';

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

  // Get API key from environment
  const GOOGLE_API_KEY = process.env.VITE_GOOGLE_API_KEY;

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

    // Estimate cost for pre-flight balance check
    if (authenticatedUserId) {
      const pricePerImage = IMAGEN_PRICING[model as keyof typeof IMAGEN_PRICING] || 0.04;
      const estimatedCost = pricePerImage * sampleCount;
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
          console.warn('[Google Imagen Proxy] Insufficient token balance:', {
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
        console.warn('[Google Imagen Proxy] Insufficient token balance:', {
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
      console.error('[Google Imagen Proxy] API Error:', data);

      // Handle specific Google API errors
      const errorMessage = data.error?.message || data.message || 'Google Imagen API error';
      const errorCode = data.error?.code || response.status;

      return {
        statusCode: response.status,
        headers: getSecurityHeaders(),
        body: JSON.stringify({
          error: errorMessage,
          code: errorCode,
          details: data,
        }),
      };
    }

    // Normalize response format
    // Google Imagen returns predictions array with base64 images
    const imagesGenerated = data.predictions?.length || data.images?.length || sampleCount;

    console.log('[Google Imagen Proxy] Success:', {
      imagesGenerated,
    });

    // Deduct tokens from user balance
    if (authenticatedUserId) {
      const pricePerImage = IMAGEN_PRICING[model as keyof typeof IMAGEN_PRICING] || 0.04;
      const actualCost = pricePerImage * imagesGenerated;
      const tokensToDeduct = Math.ceil(actualCost * 1000000);

      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: newBalance, error: deductError } = await supabaseAdmin.rpc('deduct_user_tokens', {
        p_user_id: authenticatedUserId,
        p_tokens: tokensToDeduct,
        p_provider: 'google-imagen',
        p_model: model,
      });

      if (deductError) {
        console.error('[Google Imagen Proxy] Token deduction failed:', deductError);
        data.tokenTracking = {
          deductionFailed: true,
          deductionError: deductError.message,
        };
      } else {
        console.log('[Google Imagen Proxy] Token deduction successful. New balance:', newBalance);
        data.tokenTracking = {
          cost: actualCost,
          tokensDeducted: tokensToDeduct,
          newBalance,
        };
      }

      // Log usage for analytics
      await supabaseAdmin.from('media_generation_usage').insert({
        user_id: authenticatedUserId,
        provider: 'google',
        model,
        type: 'image',
        prompt_length: prompt.length,
        images_generated: imagesGenerated,
        parameters: { aspectRatio, personGeneration, safetyFilterLevel },
        cost: actualCost,
        created_at: new Date().toISOString(),
      }).catch(err => {
        console.warn('[Google Imagen Proxy] Failed to log usage:', err);
      });
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
    console.error('[Google Imagen Proxy] Error:', error);
    return {
      statusCode: 500,
      headers: getSecurityHeaders(),
      body: JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Export handler with both authentication and rate limiting middleware
export const handler = withAuth(withRateLimit(googleImagenHandler));
