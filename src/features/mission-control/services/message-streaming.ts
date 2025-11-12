/**
 * Streaming Service for Real-time AI Responses
 * Implements Server-Sent Events (SSE) for token-by-token streaming
 */

export interface StreamChunk {
  type: 'content' | 'tool_call' | 'error' | 'done';
  content?: string;
  toolCall?: ToolCall;
  error?: string;
  usage?: TokenUsage;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type StreamCallback = (chunk: StreamChunk) => void;

type ErrorResponse = { error?: string } & Record<string, unknown>;

/**
 * ⚠️ SECURITY WARNING: API keys in development mode only
 * These keys are ONLY used in development for direct API access.
 * In production, ALL API calls are proxied through secure Netlify functions.
 * NEVER expose API keys with VITE_ prefix in production builds.
 */
const OPENAI_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_OPENAI_API_KEY || ''
  : '';
const ANTHROPIC_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_ANTHROPIC_API_KEY || ''
  : '';
const GOOGLE_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_GOOGLE_API_KEY || ''
  : '';
const PERPLEXITY_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_PERPLEXITY_API_KEY || ''
  : '';

/**
 * Stream responses from OpenAI
 */
export async function streamOpenAI(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  tools?: unknown[],
  model: string = 'gpt-4-turbo-preview'
) {
  // In production, use Netlify proxy (non-stream) and emit a single chunk
  if (import.meta.env.PROD) {
    const response = await fetch('/.netlify/functions/openai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.7 }),
    });
    if (!response.ok) {
      const data: ErrorResponse = await response.json().catch((err) => {
        console.error('[OpenAI Proxy] Failed to parse error response:', err);
        return {} as ErrorResponse;
      });
      throw new Error(
        data?.error || `OpenAI proxy error: ${response.statusText}`
      );
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.content;
    if (content) onChunk({ type: 'content', content });
    onChunk({ type: 'done' });
    return;
  }

  // Development: stream directly from provider API
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      stream: true,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onChunk({ type: 'done' });
        break;
      }
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.trim() !== '');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') {
          onChunk({ type: 'done' });
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices[0]?.delta;
          if (delta?.content)
            onChunk({ type: 'content', content: delta.content });
          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              onChunk({
                type: 'tool_call',
                toolCall: {
                  id: toolCall.id,
                  name: toolCall.function?.name,
                  arguments: toolCall.function?.arguments,
                },
              });
            }
          }
        } catch (e) {
          console.warn('Failed to parse SSE chunk:', e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Stream responses from Anthropic (Claude)
 */
export async function streamAnthropic(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  tools?: unknown[],
  model: string = 'claude-3-5-sonnet-20241022'
) {
  const systemMessage = messages.find((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  // In production, call Netlify proxy (non-stream) and emit one chunk
  if (import.meta.env.PROD) {
    const response = await fetch('/.netlify/functions/anthropic-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemMessage?.content,
        messages: conversationMessages,
        temperature: 0.7,
      }),
    });
    if (!response.ok) {
      const data: ErrorResponse = await response.json().catch((err) => {
        console.error('[Anthropic Proxy] Failed to parse error response:', err);
        return {} as ErrorResponse;
      });
      throw new Error(
        data?.error || `Anthropic proxy error: ${response.statusText}`
      );
    }
    const data = await response.json();
    const content = data.content?.[0]?.text || data.content || data.output_text;
    if (content) onChunk({ type: 'content', content });
    onChunk({ type: 'done' });
    return;
  }

  // Development: stream directly
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: conversationMessages,
      tools,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onChunk({ type: 'done' });
        break;
      }
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.trim() !== '');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            onChunk({ type: 'content', content: parsed.delta.text });
          }
          if (parsed.type === 'message_stop') onChunk({ type: 'done' });
        } catch (e) {
          console.warn('Failed to parse SSE chunk:', e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Stream responses from Google (Gemini)
 */
export async function streamGoogle(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  model: string = 'gemini-2.0-flash'
) {
  // In production, use Netlify proxy (non-stream)
  if (import.meta.env.PROD) {
    const response = await fetch('/.netlify/functions/google-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.7 }),
    });
    if (!response.ok) {
      const data: ErrorResponse = await response.json().catch((err) => {
        console.error('[Google Proxy] Failed to parse error response:', err);
        return {} as ErrorResponse;
      });
      throw new Error(
        data?.error || `Google proxy error: ${response.statusText}`
      );
    }
    const data = await response.json();
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text || data.content;
    if (content) onChunk({ type: 'content', content });
    onChunk({ type: 'done' });
    return;
  }

  // Development: stream directly
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured');
  }

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  const systemInstruction = messages.find((m) => m.role === 'system')?.content;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onChunk({ type: 'done' });
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
            onChunk({
              type: 'content',
              content: parsed.candidates[0].content.parts[0].text,
            });
          }
        } catch (e) {
          console.warn('Failed to parse streaming chunk:', e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Main streaming function that routes to appropriate provider
 */
export async function streamAIResponse(
  provider: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  tools?: unknown[]
): Promise<void> {
  switch (provider.toLowerCase()) {
    case 'chatgpt':
    case 'openai':
      return streamOpenAI(messages, onChunk, tools);

    case 'claude':
    case 'anthropic':
      return streamAnthropic(messages, onChunk, tools);

    case 'gemini':
    case 'google':
      return streamGoogle(messages, onChunk);

    case 'perplexity':
      // Perplexity doesn't support streaming yet, fall back to regular
      throw new Error('Perplexity streaming not yet supported');

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
