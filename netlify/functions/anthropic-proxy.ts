import { Handler, HandlerEvent } from '@netlify/functions';
import {
  calculateTokenCost,
  storeTokenUsage,
  extractRequestMetadata,
} from './utils/token-tracking';

/**
 * Netlify Function to proxy Anthropic Claude API calls
 * This solves CORS issues by making API calls server-side
 * Includes token usage tracking for billing and analytics
 */
export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Get API key from environment
  const ANTHROPIC_API_KEY = process.env.VITE_ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          'Anthropic API key not configured in Netlify environment variables',
      }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const {
      messages,
      model = 'claude-3-5-sonnet-20241022',
      max_tokens = 4000,
      system,
      temperature = 0.7,
    } = body;

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
        err => {
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
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalized),
    };
  } catch (error) {
    console.error('[Anthropic Proxy] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
