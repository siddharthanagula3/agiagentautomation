/**
 * Enhanced Streaming Service V2
 * Advanced streaming implementation with better error handling, retry logic, and provider-specific optimizations
 * Supports: OpenAI, Anthropic, Google Gemini (Perplexity doesn't support streaming yet)
 */

// Environment variables for API keys
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export interface StreamChunk {
  content: string;
  isComplete: boolean;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type StreamCallback = (chunk: StreamChunk) => void;

export interface StreamConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  enableTools?: boolean;
  tools?: any[];
}

// Retry configuration for streaming
const STREAM_RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 2
};

/**
 * Enhanced retry mechanism for streaming
 */
async function streamWithRetry(
  streamFunction: () => Promise<void>,
  config = STREAM_RETRY_CONFIG
): Promise<void> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      await streamFunction();
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );
        console.log(`[Stream Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      break;
    }
  }
  
  throw lastError!;
}

/**
 * Enhanced OpenAI streaming with better error handling
 */
export async function streamOpenAI(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  config: StreamConfig = {},
  tools?: any[]
): Promise<void> {
  if (!OPENAI_API_KEY) {
    if (IS_DEMO_MODE) {
      // Simulate streaming for demo
      const demoContent = "🤖 **OpenAI Demo Streaming Response**\n\nThis is a simulated streaming response. To get real streaming, configure your OpenAI API key.";
      const words = demoContent.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        onChunk({
          content: words.slice(0, i + 1).join(' ') + (i < words.length - 1 ? '...' : ''),
          isComplete: i === words.length - 1
        });
      }
      return;
    }
    throw new Error('OpenAI API key not configured');
  }

  const model = config.model || 'gpt-4o-mini';
  const temperature = config.temperature ?? 0.7;
  const maxTokens = config.maxTokens ?? 4096;
  const systemPrompt = config.systemPrompt || 'You are a helpful AI assistant.';

  // Enhanced system prompt handling
  const messagesWithSystem = [
    { role: 'system', content: systemPrompt },
    ...messages.filter(m => m.role !== 'system')
  ];

  await streamWithRetry(async () => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: messagesWithSystem,
        tools,
        stream: true,
        temperature,
        max_tokens: maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      throw new Error(`OpenAI streaming error (${response.status}): ${errorMessage}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let buffer = '';
    let totalTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onChunk({ content: '', isComplete: true, usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens } });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onChunk({ content: '', isComplete: true, usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens } });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta?.content) {
                onChunk({ content: delta.content, isComplete: false });
              }
              
              if (parsed.usage) {
                totalTokens = parsed.usage.total_tokens || 0;
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  });
}

/**
 * Enhanced Anthropic streaming with better error handling
 */
export async function streamAnthropic(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  config: StreamConfig = {}
): Promise<void> {
  if (!ANTHROPIC_API_KEY) {
    if (IS_DEMO_MODE) {
      // Simulate streaming for demo
      const demoContent = "🧠 **Claude Demo Streaming Response**\n\nThis is a simulated streaming response. To get real streaming, configure your Anthropic API key.";
      const words = demoContent.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 120));
        onChunk({
          content: words.slice(0, i + 1).join(' ') + (i < words.length - 1 ? '...' : ''),
          isComplete: i === words.length - 1
        });
      }
      return;
    }
    throw new Error('Anthropic API key not configured');
  }

  const model = config.model || 'claude-3-5-sonnet-20241022';
  const temperature = config.temperature ?? 0.7;
  const maxTokens = config.maxTokens ?? 4096;
  const systemPrompt = config.systemPrompt || 'You are a helpful AI assistant.';

  // Enhanced system prompt handling for Claude
  const systemMessages = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const conversationMessages = messages.filter(m => m.role !== 'system');
  const finalSystemPrompt = systemPrompt + (systemMessages ? '\n\nAdditional context:\n' + systemMessages : '');

  await streamWithRetry(async () => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: finalSystemPrompt,
        messages: conversationMessages,
        stream: true,
        top_p: 1,
        top_k: 250
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      throw new Error(`Anthropic streaming error (${response.status}): ${errorMessage}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let buffer = '';
    let totalTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onChunk({ content: '', isComplete: true, usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens } });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onChunk({ content: '', isComplete: true, usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens } });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                onChunk({ content: parsed.delta.text, isComplete: false });
              }
              
              if (parsed.type === 'message_stop') {
                onChunk({ content: '', isComplete: true, usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens } });
                return;
              }
              
              if (parsed.usage) {
                totalTokens = parsed.usage.input_tokens + parsed.usage.output_tokens;
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  });
}

/**
 * Enhanced Google Gemini streaming with better error handling
 */
export async function streamGoogle(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  config: StreamConfig = {}
): Promise<void> {
  if (!GOOGLE_API_KEY) {
    if (IS_DEMO_MODE) {
      // Simulate streaming for demo
      const demoContent = "💎 **Gemini Demo Streaming Response**\n\nThis is a simulated streaming response. To get real streaming, configure your Google API key.";
      const words = demoContent.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 110));
        onChunk({
          content: words.slice(0, i + 1).join(' ') + (i < words.length - 1 ? '...' : ''),
          isComplete: i === words.length - 1
        });
      }
      return;
    }
    throw new Error('Google API key not configured');
  }

  const model = config.model || 'gemini-2.0-flash';
  const temperature = config.temperature ?? 0.7;
  const maxTokens = config.maxTokens ?? 4096;
  const systemPrompt = config.systemPrompt || 'You are a helpful AI assistant.';

  // Enhanced system prompt handling for Gemini
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  await streamWithRetry(async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP: 1,
            topK: 40,
            candidateCount: 1,
            stopSequences: []
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      throw new Error(`Google streaming error (${response.status}): ${errorMessage}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let buffer = '';
    let totalTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onChunk({ content: '', isComplete: true, usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens } });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onChunk({ content: '', isComplete: true, usage: { promptTokens: 0, completionTokens: totalTokens, totalTokens } });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                onChunk({ content: parsed.candidates[0].content.parts[0].text, isComplete: false });
              }
              
              if (parsed.usageMetadata) {
                totalTokens = parsed.usageMetadata.totalTokenCount || 0;
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  });
}

/**
 * Main streaming function that routes to appropriate provider
 */
export async function streamAIResponse(
  provider: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  config: StreamConfig = {},
  tools?: any[]
): Promise<void> {
  console.log(`[Streaming V2] Starting stream via ${provider}...`);
  
  try {
    switch (provider.toLowerCase()) {
      case 'chatgpt':
      case 'openai':
        return await streamOpenAI(messages, onChunk, config, tools);
      
      case 'claude':
      case 'anthropic':
        return await streamAnthropic(messages, onChunk, config);
      
      case 'gemini':
      case 'google':
        return await streamGoogle(messages, onChunk, config);
      
      case 'perplexity':
        // Perplexity doesn't support streaming yet, fall back to regular API
        throw new Error('Perplexity streaming not yet supported. Use regular API instead.');
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`[Streaming V2] ${provider} streaming failed:`, error);
    
    // Try fallback providers if primary fails
    const fallbackProviders = getConfiguredProviders().filter(
      p => p.toLowerCase() !== provider.toLowerCase()
    );
    
    if (fallbackProviders.length > 0) {
      console.log(`[Streaming V2] Attempting fallback to ${fallbackProviders[0]}...`);
      const fallbackProvider = fallbackProviders[0].toLowerCase();
      
      try {
        switch (fallbackProvider) {
          case 'chatgpt':
          case 'openai':
            return await streamOpenAI(messages, onChunk, config, tools);
          case 'claude':
          case 'anthropic':
            return await streamAnthropic(messages, onChunk, config);
          case 'gemini':
          case 'google':
            return await streamGoogle(messages, onChunk, config);
        }
      } catch (fallbackError) {
        console.error(`[Streaming V2] Fallback ${fallbackProvider} also failed:`, fallbackError);
      }
    }
    
    throw error;
  }
}

/**
 * Check if a provider supports streaming
 */
export function supportsStreaming(provider: string): boolean {
  const providerLower = provider.toLowerCase();
  return ['chatgpt', 'openai', 'claude', 'anthropic', 'gemini', 'google'].includes(providerLower);
}

/**
 * Get list of configured providers (imported from enhanced-ai-chat-service-v2)
 */
function getConfiguredProviders(): string[] {
  const providers: string[] = [];
  if (GOOGLE_API_KEY || IS_DEMO_MODE) providers.push('Gemini');
  if (OPENAI_API_KEY || IS_DEMO_MODE) providers.push('ChatGPT');
  if (ANTHROPIC_API_KEY || IS_DEMO_MODE) providers.push('Claude');
  return providers;
}

/**
 * Create streaming configuration
 */
export function createStreamConfig(
  model?: string,
  temperature?: number,
  maxTokens?: number,
  systemPrompt?: string,
  enableTools?: boolean
): StreamConfig {
  return {
    model,
    temperature,
    maxTokens,
    systemPrompt,
    enableTools
  };
}
