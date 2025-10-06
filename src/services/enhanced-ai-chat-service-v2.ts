/**
 * Enhanced AI Chat Service V2
 * Comprehensive implementation with advanced system prompts, error handling, and API optimizations
 * Supports: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), Perplexity
 */

// Environment variables for API keys
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Model configurations
const MODEL_CONFIGS = {
  openai: {
    default: 'gpt-4o-mini',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    maxTokens: 4096,
    temperature: 0.7
  },
  anthropic: {
    default: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    maxTokens: 4096,
    temperature: 0.7
  },
  google: {
    default: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    maxTokens: 4096,
    temperature: 0.7
  },
  perplexity: {
    default: 'llama-3.1-sonar-large-128k-online',
    models: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online'],
    maxTokens: 4096,
    temperature: 0.7
  }
};

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
  model?: string;
  provider?: string;
}

export interface AIImageAttachment {
  type: 'image';
  mimeType: string;
  dataBase64: string;
}

export interface ChatConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  enableWebSearch?: boolean;
  enableTools?: boolean;
}

// Enhanced system prompt templates
const SYSTEM_PROMPTS = {
  default: `You are an intelligent AI assistant designed to help users with a wide variety of tasks. You should:

1. Provide accurate, helpful, and detailed responses
2. Be professional yet approachable in your tone
3. Ask clarifying questions when needed
4. Break down complex topics into understandable parts
5. Provide actionable advice and solutions
6. Admit when you don't know something rather than guessing

Remember to be concise but comprehensive in your responses.`,

  employee: (role: string) => `You are a specialized ${role} with deep expertise in your field. Your role is to:

1. Provide professional, expert-level advice and solutions
2. Demonstrate deep knowledge of your domain
3. Offer practical, actionable insights
4. Maintain a professional yet helpful tone
5. Ask relevant questions to better understand the user's needs
6. Provide detailed explanations when appropriate

As a ${role}, you should be authoritative but approachable, and always aim to deliver value through your expertise.`,

  creative: `You are a creative AI assistant specializing in imaginative and innovative solutions. You should:

1. Think outside the box and offer unique perspectives
2. Generate creative ideas and solutions
3. Use vivid, engaging language
4. Encourage experimentation and exploration
5. Balance creativity with practicality
6. Inspire and motivate users

Be bold, innovative, and help users see possibilities they might not have considered.`,

  analytical: `You are an analytical AI assistant focused on data-driven insights and logical reasoning. You should:

1. Break down complex problems systematically
2. Provide evidence-based recommendations
3. Use clear, logical reasoning
4. Present information in structured formats
5. Identify patterns and trends
6. Offer quantitative insights when possible

Be thorough, methodical, and help users make informed decisions based on solid analysis.`
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

/**
 * Enhanced retry mechanism with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config = RETRY_CONFIG
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }
      
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      break;
    }
  }
  
  throw lastError!;
}

/**
 * Generate demo response for testing
 */
function generateDemoResponse(messages: AIMessage[], provider: string): AIResponse {
  const lastMessage = messages[messages.length - 1]?.content || 'Hello';
  
  const responses = {
    'OpenAI': `🤖 **ChatGPT Demo Response**\n\nI understand you're asking: "${lastMessage}"\n\nThis is a demo response. To get real AI responses, please configure your API keys:\n\n1. Get OpenAI API key: https://platform.openai.com/api-keys\n2. Add to .env: VITE_OPENAI_API_KEY=your_key_here\n3. Restart the application`,
    
    'Claude': `🧠 **Claude Demo Response**\n\nI understand you're asking: "${lastMessage}"\n\nThis is a demo response. To get real AI responses, please configure your API keys:\n\n1. Get Anthropic API key: https://console.anthropic.com/\n2. Add to .env: VITE_ANTHROPIC_API_KEY=your_key_here\n3. Restart the application`,
    
    'Gemini': `💎 **Gemini Demo Response**\n\nI understand you're asking: "${lastMessage}"\n\nThis is a demo response. To get real AI responses, please configure your API keys:\n\n1. Get Google API key: https://aistudio.google.com/app/apikey\n2. Add to .env: VITE_GOOGLE_API_KEY=your_key_here\n3. Restart the application`,
    
    'Perplexity': `🔍 **Perplexity Demo Response**\n\nI understand you're asking: "${lastMessage}"\n\nThis is a demo response. To get real AI responses, please configure your API keys:\n\n1. Get Perplexity API key: https://www.perplexity.ai/settings/api\n2. Add to .env: VITE_PERPLEXITY_API_KEY=your_key_here\n3. Restart the application`
  };
  
  return {
    content: responses[provider as keyof typeof responses] || responses['OpenAI'],
    usage: {
      promptTokens: 50,
      completionTokens: 100,
      totalTokens: 150
    },
    model: 'demo',
    provider
  };
}

/**
 * Enhanced OpenAI implementation with advanced system prompts
 */
export async function sendToOpenAI(
  messages: AIMessage[], 
  config: ChatConfig = {}
): Promise<AIResponse> {
  if (!OPENAI_API_KEY) {
    if (IS_DEMO_MODE) {
      return generateDemoResponse(messages, 'OpenAI');
    }
    throw new Error('OpenAI API key not configured.\n\n' +
      '✅ Get a FREE key at: https://platform.openai.com/api-keys\n' +
      '📝 Add to .env file: VITE_OPENAI_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true');
  }

  const model = config.model || MODEL_CONFIGS.openai.default;
  const temperature = config.temperature ?? MODEL_CONFIGS.openai.temperature;
  const maxTokens = config.maxTokens ?? MODEL_CONFIGS.openai.maxTokens;

  // Enhanced system prompt handling
  const systemPrompt = config.systemPrompt || SYSTEM_PROMPTS.default;
  const messagesWithSystem = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.filter(m => m.role !== 'system')
  ];

  try {
    console.log('[OpenAI] Sending request with model:', model);
    
    const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: messagesWithSystem,
        temperature,
        max_tokens: maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
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
      model: data.model,
      provider: 'OpenAI'
    };
  } catch (error) {
    console.error('[OpenAI] Request failed:', error);
    throw error;
  }
}

/**
 * Enhanced Anthropic implementation with advanced system prompts
 */
export async function sendToAnthropic(
  messages: AIMessage[], 
  config: ChatConfig = {}
): Promise<AIResponse> {
  if (!ANTHROPIC_API_KEY) {
    if (IS_DEMO_MODE) {
      return generateDemoResponse(messages, 'Claude');
    }
    throw new Error('Anthropic API key not configured.\n\n' +
      '✅ Get a FREE key at: https://console.anthropic.com/\n' +
      '📝 Add to .env file: VITE_ANTHROPIC_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true');
  }

  const model = config.model || MODEL_CONFIGS.anthropic.default;
  const temperature = config.temperature ?? MODEL_CONFIGS.anthropic.temperature;
  const maxTokens = config.maxTokens ?? MODEL_CONFIGS.anthropic.maxTokens;

  // Enhanced system prompt handling for Claude
  const systemPrompt = config.systemPrompt || SYSTEM_PROMPTS.default;
  const systemMessages = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const finalSystemPrompt = systemPrompt + (systemMessages ? '\n\nAdditional context:\n' + systemMessages : '');

  try {
    console.log('[Anthropic] Sending request with model:', model);
    
    const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
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
        top_p: 1,
        top_k: 250
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
      model: data.model,
      provider: 'Claude'
    };
  } catch (error) {
    console.error('[Anthropic] Request failed:', error);
    throw error;
  }
}

/**
 * Enhanced Google Gemini implementation with advanced system prompts
 */
export async function sendToGoogle(
  messages: AIMessage[],
  config: ChatConfig = {},
  attachments: AIImageAttachment[] = []
): Promise<AIResponse> {
  if (!GOOGLE_API_KEY) {
    if (IS_DEMO_MODE) {
      return generateDemoResponse(messages, 'Gemini');
    }
    throw new Error('Google API key not configured.\n\n' +
      '✅ Get a FREE key at: https://aistudio.google.com/app/apikey\n' +
      '📝 Add to .env file: VITE_GOOGLE_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true');
  }

  const model = config.model || MODEL_CONFIGS.google.default;
  const temperature = config.temperature ?? MODEL_CONFIGS.google.temperature;
  const maxTokens = config.maxTokens ?? MODEL_CONFIGS.google.maxTokens;

  // Enhanced system prompt handling for Gemini
  const systemPrompt = config.systemPrompt || SYSTEM_PROMPTS.default;
  
  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Handle image attachments
  if (attachments.length > 0) {
    const userIdx = contents.findLastIndex(c => c.role === 'user');
    const target = userIdx >= 0 ? contents[userIdx] : { role: 'user' as const, parts: [] as any[] };
    if (userIdx < 0) contents.push(target);
    for (const img of attachments) {
      target.parts.push({ inlineData: { mimeType: img.mimeType, data: img.dataBase64 } });
    }
  }

  async function callModel(targetModel: string) {
    const resp = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${GOOGLE_API_KEY}`,
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
  console.log('[Google] ✅ Success');

  return {
    content: data.candidates[0].content.parts[0].text,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0,
    },
    model: data.model || model,
    provider: 'Gemini'
  };
}

/**
 * Enhanced Perplexity implementation with advanced system prompts
 */
export async function sendToPerplexity(
  messages: AIMessage[], 
  config: ChatConfig = {}
): Promise<AIResponse> {
  if (!PERPLEXITY_API_KEY) {
    if (IS_DEMO_MODE) {
      return generateDemoResponse(messages, 'Perplexity');
    }
    throw new Error('Perplexity API key not configured.\n\n' +
      '✅ Get a FREE key at: https://www.perplexity.ai/settings/api\n' +
      '📝 Add to .env file: VITE_PERPLEXITY_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true');
  }

  const model = config.model || MODEL_CONFIGS.perplexity.default;
  const temperature = config.temperature ?? MODEL_CONFIGS.perplexity.temperature;
  const maxTokens = config.maxTokens ?? MODEL_CONFIGS.perplexity.maxTokens;

  // Enhanced system prompt handling for Perplexity
  const systemPrompt = config.systemPrompt || SYSTEM_PROMPTS.default;
  const messagesWithSystem = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.filter(m => m.role !== 'system')
  ];

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
        messages: messagesWithSystem,
        temperature,
        max_tokens: maxTokens,
        top_p: 1,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;

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
      model: data.model || model,
      provider: 'Perplexity'
    };
  } catch (error) {
    console.error('[Perplexity] Request failed:', error);
    throw error;
  }
}

/**
 * Main function with automatic fallback to configured providers
 */
export async function sendAIMessage(
  provider: string,
  messages: AIMessage[],
  employeeRole?: string,
  attachments?: AIImageAttachment[],
  config: ChatConfig = {}
): Promise<AIResponse> {
  console.log(`[AI Service V2] Attempting to send message via ${provider}...`);
  
  // Enhanced system prompt based on employee role
  let systemPrompt = config.systemPrompt;
  if (employeeRole && !systemPrompt) {
    systemPrompt = SYSTEM_PROMPTS.employee(employeeRole);
  }

  const enhancedConfig = {
    ...config,
    systemPrompt
  };

  // Try the requested provider first
  try {
    const providerLower = provider.toLowerCase();
    
    switch (providerLower) {
      case 'chatgpt':
      case 'openai':
        return await sendToOpenAI(messages, enhancedConfig);
      
      case 'claude':
      case 'anthropic':
        return await sendToAnthropic(messages, enhancedConfig);
      
      case 'gemini':
      case 'google':
        return await sendToGoogle(messages, enhancedConfig, attachments);
      
      case 'perplexity':
        return await sendToPerplexity(messages, enhancedConfig);
      
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    console.error(`[AI Service V2] ${provider} failed:`, error);
    
    // Try fallback providers if primary fails
    const fallbackProviders = getConfiguredProviders().filter(
      p => p.toLowerCase() !== provider.toLowerCase()
    );
    
    if (fallbackProviders.length > 0) {
      console.log(`[AI Service V2] Attempting fallback to ${fallbackProviders[0]}...`);
      const fallbackProvider = fallbackProviders[0].toLowerCase();
      
      try {
        switch (fallbackProvider) {
          case 'chatgpt':
          case 'openai':
            return await sendToOpenAI(messages, enhancedConfig);
          case 'claude':
          case 'anthropic':
            return await sendToAnthropic(messages, enhancedConfig);
          case 'gemini':
          case 'google':
            return await sendToGoogle(messages, enhancedConfig, attachments);
          case 'perplexity':
            return await sendToPerplexity(messages, enhancedConfig);
        }
      } catch (fallbackError) {
        console.error(`[AI Service V2] Fallback ${fallbackProvider} also failed:`, fallbackError);
      }
    }
    
    throw error;
  }
}

/**
 * Check if a provider is configured
 */
export function isProviderConfigured(provider: string): boolean {
  const providerLower = provider.toLowerCase();
  
  switch (providerLower) {
    case 'chatgpt':
    case 'openai':
      return !!OPENAI_API_KEY || IS_DEMO_MODE;
    case 'claude':
    case 'anthropic':
      return !!ANTHROPIC_API_KEY || IS_DEMO_MODE;
    case 'gemini':
    case 'google':
      return !!GOOGLE_API_KEY || IS_DEMO_MODE;
    case 'perplexity':
      return !!PERPLEXITY_API_KEY || IS_DEMO_MODE;
    default:
      return false;
  }
}

/**
 * Get list of configured providers
 */
export function getConfiguredProviders(): string[] {
  const providers: string[] = [];
  if (GOOGLE_API_KEY || IS_DEMO_MODE) providers.push('Gemini');
  if (OPENAI_API_KEY || IS_DEMO_MODE) providers.push('ChatGPT');
  if (ANTHROPIC_API_KEY || IS_DEMO_MODE) providers.push('Claude');
  if (PERPLEXITY_API_KEY || IS_DEMO_MODE) providers.push('Perplexity');
  return providers;
}

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider: string): string[] {
  const providerLower = provider.toLowerCase();
  
  switch (providerLower) {
    case 'chatgpt':
    case 'openai':
      return MODEL_CONFIGS.openai.models;
    case 'claude':
    case 'anthropic':
      return MODEL_CONFIGS.anthropic.models;
    case 'gemini':
    case 'google':
      return MODEL_CONFIGS.google.models;
    case 'perplexity':
      return MODEL_CONFIGS.perplexity.models;
    default:
      return [];
  }
}

/**
 * Get system prompt templates
 */
export function getSystemPromptTemplates() {
  return SYSTEM_PROMPTS;
}

/**
 * Create custom system prompt
 */
export function createCustomSystemPrompt(
  role: string,
  expertise: string[],
  tone: 'professional' | 'friendly' | 'creative' | 'analytical' = 'professional'
): string {
  const expertiseList = expertise.join(', ');
  
  return `You are a specialized ${role} with expertise in ${expertiseList}. Your role is to:

1. Provide expert-level advice and solutions in your field
2. Demonstrate deep knowledge of ${expertiseList}
3. Offer practical, actionable insights
4. Maintain a ${tone} tone while being helpful
5. Ask relevant questions to better understand the user's needs
6. Provide detailed explanations when appropriate

As a ${role}, you should be authoritative but approachable, and always aim to deliver value through your expertise in ${expertiseList}.`;
}
