/**
 * Enhanced AI Chat Service with robust error handling, retry logic, and fallbacks
 * Supports: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), Perplexity
 */

// API Keys from environment
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider?: string;
  model?: string;
}

export interface AIImageAttachment {
  type: 'image';
  mimeType: string;
  dataBase64: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000
};

// Utility: Sleep for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Calculate exponential backoff delay
const getRetryDelay = (attempt: number, config: RetryConfig): number => {
  const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
  return delay + Math.random() * 1000; // Add jitter
};

// Utility: Check if error is retryable
const isRetryableError = (error: any): boolean => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true; // Network errors
  }
  if (error.message?.includes('rate limit') || error.message?.includes('429')) {
    return true; // Rate limiting
  }
  if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
    return true; // Timeouts
  }
  if (error.message?.includes('500') || error.message?.includes('502') || error.message?.includes('503')) {
    return true; // Server errors
  }
  return false;
};

// Demo mode response generator
function generateDemoResponse(messages: AIMessage[], provider: string): AIResponse {
  const userMessage = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';

  return {
    content: `[DEMO MODE] This is a simulated response from ${provider}.

Your question was: "${userMessage}"

To enable real AI responses:
1. Copy .env.example to .env
2. Add your API key for ${provider}
3. Restart the development server

For ${provider}:
${provider === 'Google' || provider === 'Gemini' ?
  '- Visit: https://aistudio.google.com/app/apikey\n- Get a FREE API key (no credit card needed!)\n- Add: VITE_GOOGLE_API_KEY=your_key_here' :
provider === 'ChatGPT' || provider === 'OpenAI' ?
  '- Visit: https://platform.openai.com/api-keys\n- Minimum $5 deposit required\n- Add: VITE_OPENAI_API_KEY=your_key_here' :
provider === 'Claude' || provider === 'Anthropic' ?
  '- Visit: https://console.anthropic.com/settings/keys\n- Minimum $5 deposit required\n- Add: VITE_ANTHROPIC_API_KEY=your_key_here' :
  '- Visit the provider website to get an API key'}

Demo mode is currently: ${IS_DEMO_MODE ? 'ENABLED' : 'DISABLED'}
Set VITE_DEMO_MODE=false in .env to use real API calls.`,
    provider: provider + ' (Demo)',
    model: 'demo-model'
  };
}

/**
 * Enhanced fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeout);
      return response;
    } catch (error) {
      lastError = error;

      if (attempt < config.maxRetries && isRetryableError(error)) {
        const delay = getRetryDelay(attempt, config);
        console.log(`[Retry] Attempt ${attempt + 1}/${config.maxRetries} failed, retrying in ${Math.round(delay)}ms...`);
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  throw lastError;
}

/**
 * OpenAI (ChatGPT) implementation
 */
export async function sendToOpenAI(messages: AIMessage[], model: string = 'gpt-4o-mini'): Promise<AIResponse> {
  if (!OPENAI_API_KEY) {
    if (IS_DEMO_MODE) {
      console.log('[OpenAI] Demo mode enabled, returning mock response');
      return generateDemoResponse(messages, 'ChatGPT');
    }
    throw new Error('OpenAI API key not configured.\n\n' +
      '✅ Get a FREE key at: https://platform.openai.com/api-keys\n' +
      '📝 Add to .env file: VITE_OPENAI_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true');
  }

  try {
    console.log('[OpenAI] Sending request with model:', model);

    // Use Netlify function proxy in production to avoid CORS and keep API keys secure
    const apiUrl = import.meta.env.PROD 
      ? '/.netlify/functions/openai-proxy'
      : 'https://api.openai.com/v1/chat/completions';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Only add Authorization header when calling API directly (dev mode)
    if (!import.meta.env.PROD) {
      headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
    }

    const response = await fetchWithRetry(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;

      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your VITE_OPENAI_API_KEY in .env file.');
      }
      if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment or upgrade your plan.');
      }
      if (response.status === 402) {
        throw new Error('OpenAI account has insufficient funds. Please add credits at: https://platform.openai.com/account/billing');
      }

      throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    console.log('[OpenAI] ✅ Success');

    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      provider: 'OpenAI',
      model: data.model
    };
  } catch (error) {
    console.error('[OpenAI] ❌ Error:', error);
    throw error;
  }
}

/**
 * Anthropic (Claude) implementation
 */
export async function sendToAnthropic(messages: AIMessage[], model: string = 'claude-3-5-sonnet-20241022'): Promise<AIResponse> {
  if (!ANTHROPIC_API_KEY) {
    if (IS_DEMO_MODE) {
      console.log('[Anthropic] Demo mode enabled, returning mock response');
      return generateDemoResponse(messages, 'Claude');
    }
    throw new Error('Anthropic API key not configured.\n\n' +
      '✅ Get a key at: https://console.anthropic.com/settings/keys\n' +
      '📝 Add to .env file: VITE_ANTHROPIC_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true');
  }

  try {
    console.log('[Anthropic] Sending request with model:', model);

    // Separate system messages from conversation
    const systemMessages = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Use Netlify function proxy in production to avoid CORS and keep API keys secure
    const apiUrl = import.meta.env.PROD 
      ? '/.netlify/functions/anthropic-proxy'
      : 'https://api.anthropic.com/v1/messages';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Only add API key header when calling API directly (dev mode)
    if (!import.meta.env.PROD) {
      headers['x-api-key'] = ANTHROPIC_API_KEY;
      headers['anthropic-version'] = '2023-06-01';
    }

    const response = await fetchWithRetry(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        system: systemMessages || undefined,
        messages: conversationMessages,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;

      if (response.status === 401) {
        throw new Error('Invalid Anthropic API key. Please check your VITE_ANTHROPIC_API_KEY in .env file.');
      }
      if (response.status === 429) {
        throw new Error('Anthropic rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('Anthropic account has insufficient funds. Please add credits at: https://console.anthropic.com/settings/billing');
      }

      throw new Error(`Anthropic API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    console.log('[Anthropic] ✅ Success');

    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      provider: 'Anthropic',
      model: data.model
    };
  } catch (error) {
    console.error('[Anthropic] ❌ Error:', error);
    throw error;
  }
}

/**
 * Google (Gemini) implementation with vision support
 */
export async function sendToGoogle(
  messages: AIMessage[],
  model: string = 'gemini-2.0-flash-exp',
  attachments?: AIImageAttachment[]
): Promise<AIResponse> {
  if (!GOOGLE_API_KEY) {
    if (IS_DEMO_MODE) {
      console.log('[Google] Demo mode enabled, returning mock response');
      return generateDemoResponse(messages, 'Gemini');
    }
    throw new Error('Google API key not configured.\n\n' +
      '✅ Get a FREE key at: https://aistudio.google.com/app/apikey\n' +
      '📝 Add to .env file: VITE_GOOGLE_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true\n\n' +
      '🎉 Google Gemini is FREE with no credit card required!');
  }

  try {
    console.log('[Google] Sending request with model:', model);

    // Convert messages to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    // Add system instruction if present
    const systemMessage = messages.find(m => m.role === 'system')?.content;

    // Add image attachments if present
    if (attachments && attachments.length > 0 && contents.length > 0) {
      const lastContent = contents[contents.length - 1];
      attachments.forEach(att => {
        lastContent.parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.dataBase64
          }
        });
      });
    }

    // Use Netlify function proxy in production to avoid CORS and keep API keys secure
    const apiUrl = import.meta.env.PROD 
      ? '/.netlify/functions/google-proxy'
      : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;

    const requestBody: any = import.meta.env.PROD
      ? {
          model,
          messages,
          attachments,
          temperature: 0.7,
        }
      : {
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        };

    if (!import.meta.env.PROD && systemMessage) {
      requestBody.systemInstruction = { parts: [{ text: systemMessage }] };
    }

    const response = await fetchWithRetry(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;

      if (response.status === 400 && errorMessage.includes('API key not valid')) {
        throw new Error('Invalid Google API key. Please check your VITE_GOOGLE_API_KEY in .env file.\n\nGet a free key at: https://aistudio.google.com/app/apikey');
      }
      if (response.status === 429) {
        throw new Error('Google rate limit exceeded (15 req/min, 1500/day). Please wait a moment.');
      }

      // Try fallback to stable model if experimental model fails
      if (model.includes('exp') || model.includes('latest')) {
        console.log('[Google] Experimental model failed, trying stable version...');
        return sendToGoogle(messages, 'gemini-2.0-flash', attachments);
      }

      throw new Error(`Google API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Google API returned no response candidates. The content may have been blocked by safety filters.');
    }

    console.log('[Google] ✅ Success');

    return {
      content: data.candidates[0].content.parts[0].text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      provider: 'Google',
      model: model
    };
  } catch (error) {
    console.error('[Google] ❌ Error:', error);
    throw error;
  }
}

/**
 * Perplexity implementation
 */
export async function sendToPerplexity(messages: AIMessage[], model: string = 'llama-3.1-sonar-large-128k-online'): Promise<AIResponse> {
  if (!PERPLEXITY_API_KEY) {
    if (IS_DEMO_MODE) {
      console.log('[Perplexity] Demo mode enabled, returning mock response');
      return generateDemoResponse(messages, 'Perplexity');
    }
    throw new Error('Perplexity API key not configured.\n\n' +
      '✅ Get a key at: https://www.perplexity.ai/settings/api\n' +
      '📝 Add to .env file: VITE_PERPLEXITY_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true');
  }

  try {
    console.log('[Perplexity] Sending request with model:', model);

    const response = await fetchWithRetry('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;

      if (response.status === 401) {
        throw new Error('Invalid Perplexity API key. Please check your VITE_PERPLEXITY_API_KEY in .env file.');
      }
      if (response.status === 429) {
        throw new Error('Perplexity rate limit exceeded. Please try again in a moment.');
      }

      throw new Error(`Perplexity API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    console.log('[Perplexity] ✅ Success');

    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      provider: 'Perplexity',
      model: data.model
    };
  } catch (error) {
    console.error('[Perplexity] ❌ Error:', error);
    throw error;
  }
}

/**
 * Check if a provider is configured
 * In production, we assume all providers are potentially configured (validated by Netlify functions)
 * In development, we check for actual API keys
 */
export function isProviderConfigured(provider: string): boolean {
  // In production, Netlify functions handle API key validation
  // We can't check keys in browser, so assume all providers are available
  if (import.meta.env.PROD) {
    return true;
  }
  
  // In development, check if API keys are present
  const lowerProvider = provider.toLowerCase();
  if (lowerProvider === 'chatgpt' || lowerProvider === 'openai') return !!OPENAI_API_KEY || IS_DEMO_MODE;
  if (lowerProvider === 'claude' || lowerProvider === 'anthropic') return !!ANTHROPIC_API_KEY || IS_DEMO_MODE;
  if (lowerProvider === 'gemini' || lowerProvider === 'google') return !!GOOGLE_API_KEY || IS_DEMO_MODE;
  if (lowerProvider === 'perplexity') return !!PERPLEXITY_API_KEY || IS_DEMO_MODE;
  return false;
}

/**
 * Get list of configured providers
 * In production, return all providers (validated by Netlify functions)
 * In development, return only providers with API keys
 */
export function getConfiguredProviders(): string[] {
  // In production, all providers are potentially available via Netlify functions
  if (import.meta.env.PROD) {
    return ['Gemini', 'ChatGPT', 'Claude'];
  }
  
  // In development, check for actual API keys
  const providers: string[] = [];
  if (GOOGLE_API_KEY || IS_DEMO_MODE) providers.push('Gemini');
  if (OPENAI_API_KEY || IS_DEMO_MODE) providers.push('ChatGPT');
  if (ANTHROPIC_API_KEY || IS_DEMO_MODE) providers.push('Claude');
  if (PERPLEXITY_API_KEY || IS_DEMO_MODE) providers.push('Perplexity');
  return providers;
}

/**
 * Main function with automatic fallback to configured providers
 */
export async function sendAIMessage(
  provider: string,
  messages: AIMessage[],
  employeeRole?: string,
  attachments?: AIImageAttachment[]
): Promise<AIResponse> {
  console.log(`[AI Service] 🚀 Sending to ${provider}...`);

  // Add role context if provided
  const messagesWithContext = employeeRole
    ? [
        { role: 'system' as const, content: `You are a ${employeeRole}. Respond professionally and helpfully in that role.` },
        ...messages,
      ]
    : messages;

  // Try requested provider
  try {
    const result = await sendToProvider(provider, messagesWithContext, attachments);
    console.log(`[AI Service] ✅ Success with ${provider}`);
    return result;
  } catch (error) {
    console.error(`[AI Service] ❌ ${provider} failed:`, error);

    // Try fallback providers
    const fallbackProviders = getConfiguredProviders().filter(
      p => p.toLowerCase() !== provider.toLowerCase()
    );

    if (fallbackProviders.length > 0) {
      console.log(`[AI Service] 🔄 Trying fallback: ${fallbackProviders[0]}`);
      try {
        const result = await sendToProvider(fallbackProviders[0], messagesWithContext, attachments);
        console.log(`[AI Service] ✅ Success with fallback ${fallbackProviders[0]}`);
        return result;
      } catch (fallbackError) {
        console.error(`[AI Service] ❌ Fallback ${fallbackProviders[0]} also failed:`, fallbackError);
      }
    }

    // All providers failed
    throw error;
  }
}

/**
 * Helper to route to correct provider
 */
async function sendToProvider(
  provider: string,
  messages: AIMessage[],
  attachments?: AIImageAttachment[]
): Promise<AIResponse> {
  const p = provider.toLowerCase();

  if (p === 'chatgpt' || p === 'openai') return await sendToOpenAI(messages);
  if (p === 'claude' || p === 'anthropic') return await sendToAnthropic(messages);
  if (p === 'gemini' || p === 'google') return await sendToGoogle(messages, undefined as any, attachments);
  if (p === 'perplexity') return await sendToPerplexity(messages);

  throw new Error(`Unsupported provider: ${provider}`);
}

export default {
  sendAIMessage,
  sendToOpenAI,
  sendToAnthropic,
  sendToGoogle,
  sendToPerplexity,
  isProviderConfigured,
  getConfiguredProviders
};
