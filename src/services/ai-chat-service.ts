/**
 * AI Chat Service
 * Handles communication with different AI providers (OpenAI, Anthropic, Google, Perplexity)
 */

// Environment variables for API keys
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
// Allow overriding Gemini model via env; default to 2.0 Flash
const GOOGLE_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';

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
}

/**
 * Send message to OpenAI (ChatGPT)
 */
export async function sendToOpenAI(messages: AIMessage[], model: string = 'gpt-4'): Promise<AIResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}

/**
 * Send message to Anthropic (Claude)
 */
export async function sendToAnthropic(messages: AIMessage[], model: string = 'claude-3-5-sonnet-20241022'): Promise<AIResponse> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured. Please add VITE_ANTHROPIC_API_KEY to your environment variables.');
  }

  // Convert messages to Anthropic format (system messages handled separately)
  const systemMessages = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system: systemMessages || undefined,
      messages: conversationMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

/**
 * Send message to Google (Gemini)
 */
export async function sendToGoogle(messages: AIMessage[], model: string = GOOGLE_MODEL): Promise<AIResponse> {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured. Please add VITE_GOOGLE_API_KEY to your environment variables.');
  }

  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find(m => m.role === 'system')?.content;

  async function callModel(targetModel: string) {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    );
    return resp;
  }

  // Try requested model first; on model-not-found, fall back to widely-available Flash model
  let response = await callModel(model);
  if (!response.ok) {
    let errJson: any = {};
    try { errJson = await response.json(); } catch {}
    const msg: string = errJson?.error?.message || response.statusText;
    const isModelNotFound = /not found|not supported|ListModels/i.test(msg);
    if (isModelNotFound && model !== 'gemini-2.0-flash' && model !== 'gemini-2.5-flash') {
      // Prefer 2.5 flash if available; otherwise 2.0 flash
      response = await callModel('gemini-2.5-flash');
      if (!response.ok) {
        response = await callModel('gemini-2.0-flash');
      }
    }
    if (!response.ok) {
      const finalErr = errJson.error ? errJson : await response.json().catch(() => ({}));
      throw new Error(`Google API error: ${finalErr?.error?.message || msg}`);
    }
  }

  const data = await response.json();
  return {
    content: data.candidates[0].content.parts[0].text,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0,
    },
  };
}

/**
 * Send message to Perplexity
 */
export async function sendToPerplexity(messages: AIMessage[], model: string = 'llama-3.1-sonar-large-128k-online'): Promise<AIResponse> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured. Please add VITE_PERPLEXITY_API_KEY to your environment variables.');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Perplexity API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

/**
 * Main function to send message to appropriate AI provider
 */
export async function sendAIMessage(
  provider: string,
  messages: AIMessage[],
  employeeRole?: string
): Promise<AIResponse> {
  // Add system message with employee role context
  const messagesWithContext = employeeRole
    ? [
        {
          role: 'system' as const,
          content: `You are a ${employeeRole}. Respond professionally and helpfully in that role. Provide detailed, actionable advice based on your expertise.`,
        },
        ...messages,
      ]
    : messages;

  switch (provider.toLowerCase()) {
    case 'chatgpt':
    case 'openai':
      return sendToOpenAI(messagesWithContext);
    
    case 'claude':
    case 'anthropic':
      return sendToAnthropic(messagesWithContext);
    
    case 'gemini':
    case 'google':
      return sendToGoogle(messagesWithContext);
    
    case 'perplexity':
      return sendToPerplexity(messagesWithContext);
    
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * Check if AI provider is configured
 */
export function isProviderConfigured(provider: string): boolean {
  switch (provider.toLowerCase()) {
    case 'chatgpt':
    case 'openai':
      return !!OPENAI_API_KEY;
    
    case 'claude':
    case 'anthropic':
      return !!ANTHROPIC_API_KEY;
    
    case 'gemini':
    case 'google':
      return !!GOOGLE_API_KEY;
    
    case 'perplexity':
      return !!PERPLEXITY_API_KEY;
    
    default:
      return false;
  }
}

/**
 * Get list of configured providers
 */
export function getConfiguredProviders(): string[] {
  const providers = [];
  if (OPENAI_API_KEY) providers.push('ChatGPT');
  if (ANTHROPIC_API_KEY) providers.push('Claude');
  if (GOOGLE_API_KEY) providers.push('Gemini');
  if (PERPLEXITY_API_KEY) providers.push('Perplexity');
  return providers;
}
