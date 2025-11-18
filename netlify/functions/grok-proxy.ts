import { Handler, HandlerEvent } from '@netlify/functions';
import {
  calculateTokenCost,
  storeTokenUsage,
  extractRequestMetadata,
} from './utils/token-tracking';
import { withRateLimit } from './utils/rate-limiter';
import { withAuth } from './utils/auth-middleware';

/**
 * Netlify Function to proxy xAI Grok API calls
 * Grok uses OpenAI-compatible API with real-time X (Twitter) access
 * Includes token usage tracking for billing and analytics
 * SECURITY: Rate limited to 10 requests per minute per user + Authentication required
 * Created: Nov 18th 2025
 */
const grokHandler: Handler = async (event: HandlerEvent) => {
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
  const GROK_API_KEY = process.env.VITE_GROK_API_KEY;

  if (!GROK_API_KEY) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Grok API key not configured in Netlify environment variables',
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
      model = 'grok-beta',
      temperature = 0.7,
      max_tokens = 4000,
      stream = false,
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

    console.log('[Grok Proxy] Received request:', {
      model,
      messageCount: messages?.length,
      stream,
    });

    // Make request to xAI Grok API (OpenAI-compatible endpoint)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        stream,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Grok Proxy] API Error:', data);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: data.error?.message || 'Grok API error',
          details: data,
        }),
      };
    }

    console.log('[Grok Proxy] Success');

    // Track token usage
    if (data.usage) {
      const { userId, sessionId } = extractRequestMetadata(event);

      // Calculate token cost for Grok
      // Grok pricing: ~$5/1M input tokens, ~$15/1M output tokens (estimated)
      const tokenUsage = {
        inputTokens: data.usage.prompt_tokens || 0,
        outputTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
        inputCost: ((data.usage.prompt_tokens || 0) / 1000000) * 5,
        outputCost: ((data.usage.completion_tokens || 0) / 1000000) * 15,
        totalCost: 0,
      };
      tokenUsage.totalCost = tokenUsage.inputCost + tokenUsage.outputCost;

      // Store usage in Supabase (non-blocking)
      storeTokenUsage('grok', model, userId, sessionId, tokenUsage).catch(
        (err) => {
          console.error('[Grok Proxy] Failed to store token usage:', err);
        }
      );

      // Add token usage info to response
      data.tokenTracking = {
        ...tokenUsage,
        provider: 'grok',
        model: data.model,
        timestamp: new Date().toISOString(),
      };
    }

    // Normalize content for UI consumers
    const content = data.choices?.[0]?.message?.content || data.content;
    const normalized = { ...data, content };

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
    console.error('[Grok Proxy] Error:', error);
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
export const handler = withAuth(withRateLimit(grokHandler));
