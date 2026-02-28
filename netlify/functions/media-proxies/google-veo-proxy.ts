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
  googleVeoRequestSchema,
  googleVeoPollingSchema,
  formatValidationError,
} from '../utils/validation-schemas';
import { checkTokenBalance, estimateTokensFromCost, createInsufficientBalanceResponse } from '../utils/token-balance-check';
import { deductCredits } from '../utils/credit-system';

/**
 * Netlify Function to proxy Google Veo video generation API calls
 * This solves CORS issues by making API calls server-side
 *
 * Supports two operations:
 * 1. POST /generate - Start video generation (returns operation name for polling)
 * 2. POST /poll - Check status of ongoing generation
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

// Veo pricing per second of video (as of January 2026)
// Note: Pricing is approximate and may vary
const VEO_PRICING = {
  'veo-2.0-generate-001': 0.02, // Per second of video
  'veo-001': 0.015, // Per second (older model)
};

/**
 * Handle video generation request
 */
async function handleGenerateRequest(
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  // Get API key from environment
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.error('[Google Veo Proxy] API key not configured');
    return {
      statusCode: 500,
      headers: getSecurityHeaders(),
      body: JSON.stringify({
        error: 'Google API key not configured in Netlify environment variables',
      }),
    };
  }

  // Parse and validate request body with Zod schema
  const parseResult = googleVeoRequestSchema.safeParse(
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
    durationSeconds,
    aspectRatio,
    negativePrompt,
    personGeneration,
    referenceImage,
  } = parseResult.data;

  console.log('[Google Veo Proxy] Generate request:', {
    model,
    durationSeconds,
    aspectRatio,
    promptLength: prompt.length,
    hasReferenceImage: !!referenceImage,
  });

  // Get authenticated user ID from JWT
  const authenticatedUserId = event.user?.id;

  // Pre-flight credit balance check
  if (authenticatedUserId) {
    const pricePerSecond = VEO_PRICING[model as keyof typeof VEO_PRICING] || 0.02;
    const estimatedCostCents = estimateTokensFromCost(pricePerSecond, durationSeconds);
    const balanceCheck = await checkTokenBalance(authenticatedUserId, estimatedCostCents, '[Veo Proxy]', 'google', model);

    if (!balanceCheck.hasBalance) {
      return createInsufficientBalanceResponse(
        { required: estimatedCostCents, available: balanceCheck.balance ?? 0 },
        corsHeaders
      );
    }
  }

  // Build request body for Google Veo API
  interface VeoRequestBody {
    prompt: string;
    generationConfig: {
      durationSeconds: number;
      aspectRatio: string;
      negativePrompt?: string;
      personGeneration: string;
    };
    referenceImage?: {
      imageBytes: string;
      mimeType: string;
    };
  }

  const requestBody: VeoRequestBody = {
    prompt,
    generationConfig: {
      durationSeconds,
      aspectRatio,
      personGeneration,
    },
  };

  if (negativePrompt) {
    requestBody.generationConfig.negativePrompt = negativePrompt;
  }

  // Add reference image for image-to-video if provided
  if (referenceImage) {
    requestBody.referenceImage = {
      imageBytes: referenceImage.data,
      mimeType: referenceImage.mimeType,
    };
  }

  // Google Veo uses the generativelanguage API
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateVideo?key=${GOOGLE_API_KEY}`;

  // Make request to Google Veo API with 30-second timeout
  // Note: This returns an operation name for polling, not the actual video
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
          message: 'Request to start video generation took too long. Please try again.',
        }),
      };
    }
    throw error;
  }

  const data = await response.json();

  if (!response.ok) {
    // SECURITY: Log full error server-side but return generic message to client
    console.error('[Google Veo Proxy] API Error:', data);

    return {
      statusCode: response.status,
      headers: getSecurityHeaders(),
      body: JSON.stringify({
        error: 'An error occurred processing your request',
      }),
    };
  }

  console.log('[Google Veo Proxy] Generation started:', {
    operationName: data.name,
  });

  // Store the operation in the database for tracking
  if (authenticatedUserId) {
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Store pending operation
    await supabaseAdmin.from('media_generation_operations').insert({
      user_id: authenticatedUserId,
      provider: 'google',
      model,
      type: 'video',
      operation_name: data.name,
      status: 'pending',
      parameters: {
        prompt,
        durationSeconds,
        aspectRatio,
        hasReferenceImage: !!referenceImage,
      },
      estimated_cost: VEO_PRICING[model as keyof typeof VEO_PRICING] * durationSeconds,
      created_at: new Date().toISOString(),
    }).catch(err => {
      console.warn('[Google Veo Proxy] Failed to store operation:', err);
    });
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify({
      operationName: data.name,
      status: 'pending',
      message: 'Video generation started. Use the poll endpoint to check status.',
      estimatedWaitTime: '2-5 minutes',
    }),
  };
}

/**
 * Handle polling request to check video generation status
 */
async function handlePollRequest(
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  // Get API key from environment
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.error('[Google Veo Proxy] API key not configured');
    return {
      statusCode: 500,
      headers: getSecurityHeaders(),
      body: JSON.stringify({
        error: 'Google API key not configured in Netlify environment variables',
      }),
    };
  }

  // Parse and validate request body with Zod schema
  const parseResult = googleVeoPollingSchema.safeParse(
    JSON.parse(event.body || '{}')
  );

  if (!parseResult.success) {
    return {
      statusCode: 400,
      headers: getSecurityHeaders(),
      body: JSON.stringify(formatValidationError(parseResult.error)),
    };
  }

  const { operationName } = parseResult.data;

  console.log('[Google Veo Proxy] Poll request:', {
    operationName,
  });

  // Get authenticated user ID from JWT
  const authenticatedUserId = event.user?.id;

  // Verify user owns this operation (if we have database records)
  if (authenticatedUserId) {
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: operationData } = await supabaseAdmin
      .from('media_generation_operations')
      .select('user_id, status')
      .eq('operation_name', operationName)
      .maybeSingle();

    if (operationData && operationData.user_id !== authenticatedUserId) {
      console.warn('[Google Veo Proxy] User attempted to poll another user\'s operation:', {
        userId: authenticatedUserId,
        operationOwner: operationData.user_id,
      });
      return {
        statusCode: 403,
        headers: getSecurityHeaders(),
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'You do not have permission to access this operation',
        }),
      };
    }
  }

  // Poll the operation status
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${GOOGLE_API_KEY}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
          message: 'Status check took too long. Please try again.',
        }),
      };
    }
    throw error;
  }

  const data = await response.json();

  if (!response.ok) {
    // SECURITY: Log full error server-side but return generic message to client
    console.error('[Google Veo Proxy] Poll API Error:', data);

    return {
      statusCode: response.status,
      headers: getSecurityHeaders(),
      body: JSON.stringify({
        error: 'An error occurred processing your request',
      }),
    };
  }

  // Check if operation is complete
  const isDone = data.done === true;
  const status = isDone ? 'completed' : 'in_progress';

  console.log('[Google Veo Proxy] Poll result:', {
    operationName,
    status,
    isDone,
  });

  // If completed, deduct credits and update database
  if (isDone && authenticatedUserId && !data.error) {
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get operation details from database
    const { data: operationData } = await supabaseAdmin
      .from('media_generation_operations')
      .select('*')
      .eq('operation_name', operationName)
      .eq('status', 'pending')
      .maybeSingle();

    if (operationData && operationData.estimated_cost) {
      // Convert estimated_cost (in dollars) to cents
      const actualCostCents = Math.ceil(operationData.estimated_cost * 100);

      // REVENUE LEAK FIX: Deduct credits via credit system
      const deductResult = await deductCredits(
        authenticatedUserId,
        actualCostCents,
        `Veo ${operationData.model} - video generation`,
        { model: operationData.model, durationSeconds: operationData.parameters?.durationSeconds, operationName }
      );

      if (!deductResult.success) {
        console.error('[Google Veo Proxy] Credit deduction failed:', deductResult.error);
        // Video already generated — log failure but don't block response
      } else {
        console.log('[Google Veo Proxy] Credit deduction successful. New balance:', deductResult.newBalanceCents);
      }

      // Update operation status
      await supabaseAdmin
        .from('media_generation_operations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          actual_cost: operationData.estimated_cost,
        })
        .eq('operation_name', operationName);
    }
  } else if (isDone && data.error) {
    // Operation failed - update database without charging
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabaseAdmin
      .from('media_generation_operations')
      .update({
        status: 'failed',
        error_message: data.error.message || 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('operation_name', operationName);
  }

  // Build response
  const responseData: {
    operationName: string;
    status: string;
    done: boolean;
    video?: { uri: string; mimeType: string };
    error?: string;
  } = {
    operationName,
    status,
    done: isDone,
  };

  if (isDone && data.response?.video) {
    responseData.video = {
      uri: data.response.video.uri,
      mimeType: data.response.video.mimeType || 'video/mp4',
    };
  }

  if (data.error) {
    responseData.error = data.error.message || 'Video generation failed';
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify(responseData),
  };
}

const googleVeoHandler: Handler = async (event: AuthenticatedEvent) => {
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

  // Validate request body size (max 15MB for image-to-video)
  const MAX_REQUEST_SIZE = 15 * 1024 * 1024; // 15MB
  if (event.body && event.body.length > MAX_REQUEST_SIZE) {
    return {
      statusCode: 413,
      headers: getSecurityHeaders(),
      body: JSON.stringify({
        error: 'Request payload too large',
        maxSize: '15MB',
      }),
    };
  }

  try {
    // Determine operation type from path or body
    const path = event.path || '';
    const body = JSON.parse(event.body || '{}');

    // If operationName is provided, this is a poll request
    // Otherwise, it's a generate request
    if (body.operationName || path.includes('/poll')) {
      return await handlePollRequest(event, corsHeaders);
    } else {
      return await handleGenerateRequest(event, corsHeaders);
    }
  } catch (error) {
    // SECURITY: Log full error server-side but return generic message to client
    console.error('[Google Veo Proxy] Error:', error);
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
export const handler = withAuth(withRateLimit(googleVeoHandler));
