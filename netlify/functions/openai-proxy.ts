import { Handler, HandlerEvent } from '@netlify/functions';
import { calculateTokenCost, storeTokenUsage, extractRequestMetadata } from './utils/token-tracking';

/**
 * Netlify Function to proxy OpenAI API calls
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
  const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'OpenAI API key not configured in Netlify environment variables' 
      }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { 
      messages, 
      model = 'gpt-4o-mini',
      temperature = 0.7,
      max_tokens = 4000
    } = body;

    console.log('[OpenAI Proxy] Received request:', {
      model,
      messageCount: messages?.length
    });

    // Make request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[OpenAI Proxy] API Error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: data.error?.message || 'OpenAI API error',
          details: data 
        }),
      };
    }

    console.log('[OpenAI Proxy] Success');

    // Track token usage
    if (data.usage) {
      const { userId, sessionId } = extractRequestMetadata(event);
      const tokenUsage = calculateTokenCost(
        'openai',
        model,
        data.usage.prompt_tokens,
        data.usage.completion_tokens
      );

      // Store usage in Supabase (non-blocking)
      storeTokenUsage('openai', model, userId, sessionId, tokenUsage).catch(err => {
        console.error('[OpenAI Proxy] Failed to store token usage:', err);
      });

      // Add token usage info to response
      data.tokenTracking = {
        ...tokenUsage,
        provider: 'openai',
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
      },
      body: JSON.stringify(normalized),
    };
  } catch (error) {
    console.error('[OpenAI Proxy] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

