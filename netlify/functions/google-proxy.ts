import { Handler, HandlerEvent } from '@netlify/functions';
import {
  calculateTokenCost,
  storeTokenUsage,
  extractRequestMetadata,
} from './utils/token-tracking';

/**
 * Netlify Function to proxy Google Gemini API calls
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
  const GOOGLE_API_KEY = process.env.VITE_GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Google API key not configured in Netlify environment variables',
      }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const {
      messages,
      model = 'gemini-2.0-flash-exp',
      temperature = 0.7,
      attachments = [],
    } = body;

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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalized),
    };
  } catch (error) {
    console.error('[Google Proxy] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
