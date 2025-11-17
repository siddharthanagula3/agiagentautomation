import { Handler, HandlerEvent } from '@netlify/functions';
import {
  calculateTokenCost,
  storeTokenUsage,
  extractRequestMetadata,
} from './utils/token-tracking';
import { withRateLimit } from './utils/rate-limiter';
import { withAuth } from './utils/auth-middleware';

/**
 * Netlify Function to proxy Google Gemini API calls
 * This solves CORS issues by making API calls server-side
 * Includes token usage tracking for billing and analytics
 * SECURITY: Rate limited to 10 requests per minute per user + Authentication required
 */
const googleHandler: Handler = async (event: HandlerEvent) => {
  // Updated: Nov 16th 2025 - Fixed missing CORS headers on error responses
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
  const GOOGLE_API_KEY = process.env.VITE_GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Google API key not configured in Netlify environment variables',
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
      model = 'gemini-2.0-flash-exp',
      temperature = 0.7,
      attachments = [],
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

    console.log('[Google Proxy] Received request:', {
      model,
      messageCount: messages?.length,
      attachmentCount: attachments.length,
    });

    // Convert messages to Gemini format
    interface Message {
      role: string;
      content: string;
    }
    interface Attachment {
      mimeType: string;
      dataBase64: string;
    }
    interface GeminiPart {
      text?: string;
      inline_data?: { mime_type: string; data: string };
    }

    const systemMessage = messages.find((m: Message) => m.role === 'system');
    const conversationMessages = messages.filter(
      (m: Message) => m.role !== 'system'
    );

    const geminiContents = conversationMessages.map((msg: Message) => {
      const parts: GeminiPart[] = [{ text: msg.content }];

      // Add attachments if this is the last user message
      if (msg.role === 'user' && attachments.length > 0) {
        attachments.forEach((attachment: Attachment) => {
          parts.push({
            inline_data: {
              mime_type: attachment.mimeType,
              data: attachment.dataBase64,
            },
          });
        });
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    interface GeminiRequestBody {
      contents: unknown[];
      generationConfig: { temperature: number; maxOutputTokens: number };
      systemInstruction?: { parts: Array<{ text: string }> };
    }

    const requestBody: GeminiRequestBody = {
      contents: geminiContents,
      generationConfig: {
        temperature,
        maxOutputTokens: 4000,
      },
    };

    // Add system instruction if present
    if (systemMessage) {
      requestBody.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    // Make request to Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[Google Proxy] API Error:', data);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: data.error?.message || 'Google API error',
          details: data,
        }),
      };
    }

    console.log('[Google Proxy] Success');

    // Track token usage
    if (data.usageMetadata) {
      const { userId, sessionId } = extractRequestMetadata(event);
      const tokenUsage = calculateTokenCost(
        'google',
        model,
        data.usageMetadata.promptTokenCount || 0,
        data.usageMetadata.candidatesTokenCount || 0
      );

      // Store usage in Supabase (non-blocking)
      storeTokenUsage('google', model, userId, sessionId, tokenUsage).catch(
        (err) => {
          console.error('[Google Proxy] Failed to store token usage:', err);
        }
      );

      // Add token usage info to response
      data.tokenTracking = {
        ...tokenUsage,
        provider: 'google',
        model,
        timestamp: new Date().toISOString(),
      };
    }

    // Normalize response to ensure a plain text content exists for the UI
    let normalizedContent: string | undefined = undefined;
    try {
      const parts = data.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        normalizedContent = parts
          .map((p: { text?: string }) => p.text)
          .filter(Boolean)
          .join('');
      }
      if (!normalizedContent) {
        normalizedContent =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          data.output_text ||
          data.content;
      }
    } catch (err) {
      // Silently ignore parsing errors
      console.debug('[Google Proxy] Content normalization error:', err);
    }

    const normalized = {
      ...data,
      content: normalizedContent,
    };

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
    console.error('[Google Proxy] Error:', error);
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
export const handler = withAuth(withRateLimit(googleHandler));
