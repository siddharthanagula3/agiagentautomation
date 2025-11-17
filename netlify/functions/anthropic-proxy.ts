import { Handler, HandlerEvent } from '@netlify/functions';
import {
  calculateTokenCost,
  storeTokenUsage,
  extractRequestMetadata,
} from './utils/token-tracking';
import { withRateLimit } from './utils/rate-limiter';
import { withAuth } from './utils/auth-middleware';

/**
 * Netlify Function to proxy Anthropic Claude API calls
 * This solves CORS issues by making API calls server-side
 * Includes token usage tracking for billing and analytics
 * SECURITY: Rate limited to 10 requests per minute per user + Authentication required
 */
const anthropicHandler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  // Updated: Nov 16th 2025 - Fixed missing CORS headers on error responses
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Get API key from environment
  const ANTHROPIC_API_KEY = process.env.VITE_ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error:
          'Anthropic API key not configured in Netlify environment variables',
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
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Request payload too large',
          maxSize: '1MB',
        }),
      };
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const {
      messages,
      model = 'claude-3-5-sonnet-20241022',
      max_tokens = 4000,
      system,
      temperature = 0.7,
    } = body;

    // Validate message count (max 100 messages per request)
    const MAX_MESSAGES = 100;
    if (messages && Array.isArray(messages) && messages.length > MAX_MESSAGES) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Too many messages in request',
          maxMessages: MAX_MESSAGES,
          received: messages.length,
        }),
      };
    }

    console.log('[Anthropic Proxy] Received request:', {
      model,
      messageCount: messages?.length,
      hasSystem: !!system,
    });

    // Make request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        system,
        messages,
        temperature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Anthropic Proxy] API Error:', data);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: data.error?.message || 'Anthropic API error',
          details: data,
        }),
      };
    }

    console.log('[Anthropic Proxy] Success');

    // Track token usage
    if (data.usage) {
      const { userId, sessionId } = extractRequestMetadata(event);
      const tokenUsage = calculateTokenCost(
        'anthropic',
        model,
        data.usage.input_tokens,
        data.usage.output_tokens
      );

      // Store usage in Supabase (non-blocking)
      storeTokenUsage('anthropic', model, userId, sessionId, tokenUsage).catch(
        (err) => {
          console.error('[Anthropic Proxy] Failed to store token usage:', err);
        }
      );

      // Add token usage info to response
      data.tokenTracking = {
        ...tokenUsage,
        provider: 'anthropic',
        model,
        timestamp: new Date().toISOString(),
      };
    }

    // Normalize content for UI
    const content = Array.isArray(data.content)
      ? data.content[0]?.text || data.output_text
      : data.output_text || data.content;
    const normalized = { ...data, content };
    // Updated: Nov 16th 2025 - Fixed missing CORS headers in API proxy responses
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify(normalized),
    };
  } catch (error) {
    console.error('[Anthropic Proxy] Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Updated: Nov 16th 2025 - Fixed authentication bypass by adding auth middleware
// Export handler with both authentication and rate limiting middleware
export const handler = withAuth(withRateLimit(anthropicHandler));
