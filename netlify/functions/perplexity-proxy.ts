import { Handler, HandlerEvent } from '@netlify/functions';
import {
  calculateTokenCost,
  storeTokenUsage,
  extractRequestMetadata,
} from './utils/token-tracking';
import { withRateLimit } from './utils/rate-limiter';
import { withAuth } from './utils/auth-middleware';

/**
 * Netlify Function to proxy Perplexity API calls
 * This solves CORS issues by making API calls server-side
 * Includes token usage tracking for billing and analytics
 * SECURITY: Rate limited to 10 requests per minute per user + Authentication required
 */
const perplexityHandler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
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
  const PERPLEXITY_API_KEY = process.env.VITE_PERPLEXITY_API_KEY;

  if (!PERPLEXITY_API_KEY) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error:
          'Perplexity API key not configured in Netlify environment variables',
      }),
    };
  }

  try {
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
      model = 'llama-3.1-sonar-large-128k-online',
      temperature = 0.7,
      max_tokens = 4000,
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

    console.log('[Perplexity Proxy] Received request:', {
      model,
      messageCount: messages?.length,
    });

    // Make request to Perplexity API (OpenAI-compatible)
    const response = await fetch(
      'https://api.perplexity.ai/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[Perplexity Proxy] API Error:', data);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: data.error?.message || 'Perplexity API error',
          details: data,
        }),
      };
    }

    console.log('[Perplexity Proxy] Success');

    // Track token usage
    if (data.usage) {
      const { userId, sessionId } = extractRequestMetadata(event);
      const tokenUsage = calculateTokenCost(
        'perplexity',
        model,
        data.usage.prompt_tokens || 0,
        data.usage.completion_tokens || 0
      );

      // Store usage in Supabase (non-blocking)
      storeTokenUsage('perplexity', model, userId, sessionId, tokenUsage).catch(
        (err) => {
          console.error('[Perplexity Proxy] Failed to store token usage:', err);
        }
      );

      // Add token usage info to response
      data.tokenTracking = {
        ...tokenUsage,
        provider: 'perplexity',
        model,
        timestamp: new Date().toISOString(),
      };
    }

    // Normalize response to ensure a plain text content exists for the UI
    let normalizedContent: string | undefined = undefined;
    try {
      normalizedContent =
        data.choices?.[0]?.message?.content ||
        data.output_text ||
        data.content;
    } catch (err) {
      console.debug('[Perplexity Proxy] Content normalization error:', err);
    }

    const normalized = {
      ...data,
      content: normalizedContent,
    };

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
    console.error('[Perplexity Proxy] Error:', error);
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

// Export handler with both authentication and rate limiting middleware
export const handler = withAuth(withRateLimit(perplexityHandler));
