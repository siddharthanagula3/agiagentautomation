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
}

export interface AIImageAttachment {
  type: 'image';
  mimeType: string;
  dataBase64: string; // base64 without data: prefix
}

/**
 * Generate demo response when API keys are not configured
 */
function generateDemoResponse(messages: AIMessage[], provider: string): AIResponse {
  const lastMessage = messages[messages.length - 1];
  const role = messages.find(m => m.role === 'system')?.content?.includes('Product Manager') ? 'Product Manager' :
              messages.find(m => m.role === 'system')?.content?.includes('Data Scientist') ? 'Data Scientist' :
              messages.find(m => m.role === 'system')?.content?.includes('Video Content Creator') ? 'Video Content Creator' :
              'AI Assistant';

  const responses = {
    'Product Manager': `As your Product Manager, I'd be happy to help you with product strategy, roadmap planning, and feature prioritization. In demo mode, I can't provide real AI responses, but I'm ready to assist with product management tasks once you configure your API keys.`,
    'Data Scientist': `As your Data Scientist, I'm here to help with data analysis, machine learning models, and statistical insights. In demo mode, I can't process real data, but I'm ready to assist with data science tasks once you configure your API keys.`,
    'Video Content Creator': `As your Video Content Creator, I can help with script writing, video planning, and content strategy. In demo mode, I can't create real content, but I'm ready to assist with video production tasks once you configure your API keys.`,
    'AI Assistant': `Hello! I'm your AI Assistant powered by ${provider}. In demo mode, I can't provide real AI responses, but I'm ready to help once you configure your API keys.`
  };

  return {
    content: responses[role as keyof typeof responses] || responses['AI Assistant'],
    usage: {
      promptTokens: 50,
      completionTokens: 100,
      totalTokens: 150,
    },
  };
}

/**
 * Send message to OpenAI (ChatGPT)
 */
export async function sendToOpenAI(messages: AIMessage[], model: string = 'gpt-4'): Promise<AIResponse> {
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
    console.log('[OpenAI] Sending request...');
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
      let errorMessage = response.statusText;
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch (e) {
        console.error('[OpenAI] Failed to parse error response:', e);
      }
      console.error('[OpenAI] API Error:', errorMessage);
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }

    const data = await response.json();
    console.log('[OpenAI] Response received successfully');
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  } catch (error) {
    console.error('[OpenAI] Request failed:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to OpenAI. Please check your internet connection.');
    }
    throw error;
  }
}

/**
 * Send message to Anthropic (Claude)
 */
export async function sendToAnthropic(messages: AIMessage[], model: string = 'claude-3-5-sonnet-20241022'): Promise<AIResponse> {
  if (!ANTHROPIC_API_KEY) {
    if (IS_DEMO_MODE) {
      console.log('[Anthropic] Demo mode enabled, returning mock response');
      return generateDemoResponse(messages, 'Claude');
    }
    throw new Error('Anthropic API key not configured.\n\n' +
      '✅ Get a FREE key at: https://console.anthropic.com/\n' +
      '📝 Add to .env file: VITE_ANTHROPIC_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true');
  }

  try {
    console.log('[Anthropic] Sending request...');
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
      let errorMessage = response.statusText;
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch (e) {
        console.error('[Anthropic] Failed to parse error response:', e);
      }
      console.error('[Anthropic] API Error:', errorMessage);
      throw new Error(`Anthropic API error: ${errorMessage}`);
    }

    const data = await response.json();
    console.log('[Anthropic] Response received successfully');
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error('[Anthropic] Request failed:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Anthropic. Please check your internet connection.');
    }
    throw error;
  }
}

/**
 * Send message to Google (Gemini)
 */
export async function sendToGoogle(
  messages: AIMessage[],
  model: string = GOOGLE_MODEL,
  attachments: AIImageAttachment[] = []
): Promise<AIResponse> {
  if (!GOOGLE_API_KEY) {
    if (IS_DEMO_MODE) {
      console.log('[Google] Demo mode enabled, returning mock response');
      return generateDemoResponse(messages, 'Gemini');
    }
    throw new Error('Google API key not configured.\n\n' +
      '✅ Get a FREE key at: https://aistudio.google.com/app/apikey\n' +
      '📝 Add to .env file: VITE_GOOGLE_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true');
  }

  console.log('[Google/Gemini] Sending request...');

  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // If there are image attachments, append them to the last user message; if none, create one
  if (attachments.length > 0) {
    const userIdx = contents.findLastIndex(c => c.role === 'user');
    const target = userIdx >= 0 ? contents[userIdx] : { role: 'user' as const, parts: [] as any[] };
    if (userIdx < 0) contents.push(target);
    for (const img of attachments) {
      target.parts.push({ inlineData: { mimeType: img.mimeType, data: img.dataBase64 } });
    }
  }

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
    if (IS_DEMO_MODE) {
      console.log('[Perplexity] Demo mode enabled, returning mock response');
      return generateDemoResponse(messages, 'Perplexity');
    }
    throw new Error('Perplexity API key not configured.\n\n' +
      '✅ Get a FREE key at: https://www.perplexity.ai/settings/api\n' +
      '📝 Add to .env file: VITE_PERPLEXITY_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true');
  }

  try {
    console.log('[Perplexity] Sending request...');
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
      let errorMessage = response.statusText;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {
        console.error('[Perplexity] Failed to parse error response:', e);
      }
      console.error('[Perplexity] API Error:', errorMessage);
      throw new Error(`Perplexity API error: ${errorMessage}`);
    }

    const data = await response.json();
    console.log('[Perplexity] Response received successfully');
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('[Perplexity] Request failed:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Perplexity. Please check your internet connection.');
    }
    throw error;
  }
}

/**
 * Main function to send message to appropriate AI provider with fallback support
 */
export async function sendAIMessage(
  provider: string,
  messages: AIMessage[],
  employeeRole?: string,
  attachments?: AIImageAttachment[]
): Promise<AIResponse> {
  console.log(`[AI Service] Attempting to send message via ${provider}...`);
  
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

  // Try the requested provider first
  try {
    const providerLower = provider.toLowerCase();
    
    switch (providerLower) {
      case 'chatgpt':
      case 'openai':
        return await sendToOpenAI(messagesWithContext);
      
      case 'claude':
      case 'anthropic':
        return await sendToAnthropic(messagesWithContext);
      
      case 'gemini':
      case 'google':
        return await sendToGoogle(messagesWithContext, undefined as unknown as string, attachments);
      
      case 'perplexity':
        return await sendToPerplexity(messagesWithContext);
      
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    console.error(`[AI Service] ${provider} failed:`, error);
    
    // Try fallback providers if primary fails
    const fallbackProviders = getConfiguredProviders().filter(
      p => p.toLowerCase() !== provider.toLowerCase()
    );
    
    if (fallbackProviders.length > 0) {
      console.log(`[AI Service] Attempting fallback to ${fallbackProviders[0]}...`);
      const fallbackProvider = fallbackProviders[0].toLowerCase();
      
      try {
        switch (fallbackProvider) {
          case 'chatgpt':
            return await sendToOpenAI(messagesWithContext);
          case 'claude':
            return await sendToAnthropic(messagesWithContext);
          case 'gemini':
            return await sendToGoogle(messagesWithContext, undefined as unknown as string, attachments);
          case 'perplexity':
            return await sendToPerplexity(messagesWithContext);
        }
      } catch (fallbackError) {
        console.error(`[AI Service] Fallback to ${fallbackProvider} also failed:`, fallbackError);
      }
    }
    
    // If all fails, throw the original error with helpful message
    throw new Error(
      `Failed to get AI response. Primary provider (${provider}) failed. ` +
      (fallbackProviders.length > 0 
        ? `Fallback providers also failed. ` 
        : `No fallback providers configured. `) +
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
