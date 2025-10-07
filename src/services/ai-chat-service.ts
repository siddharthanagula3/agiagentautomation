/**
 * AI Chat Service - Production-ready implementation
 * Based on official documentation and best practices for each provider
 * Supports: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), Perplexity
 * Integrated with context management, system prompts, and persistence
 */

import { contextManagementService } from './context-management-service';
import { systemPromptsService } from './system-prompts-service';
import { chatPersistenceService } from './chat-persistence-service';
import { tokenTrackingService } from './token-tracking-service';

// Environment variables for API keys
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
  tokenUsage?: {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    timestamp: Date;
    sessionId?: string;
    userId?: string;
  };
}

export interface AIImageAttachment {
  type: 'image';
  mimeType: string;
  dataBase64: string;
}

/**
 * Enhanced error handling with retry logic
 */
class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public provider?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxRetries) {
        break;
      }
      
      // Check if error is retryable
      if (error instanceof APIError && !error.retryable) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );
      
      console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Generate demo response when API keys are not configured
 */
function generateDemoResponse(messages: AIMessage[], provider: string): AIResponse {
  const systemMessage = messages.find(m => m.role === 'system');
  const lastMessage = messages[messages.length - 1];
  
  // Extract role from system message
  const role = systemMessage?.content?.match(/You are a (.+?)\./)?.[1] || 'AI Assistant';
  
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
    provider,
    model: `${provider.toLowerCase()}-demo`
  };
}

/**
 * OpenAI (ChatGPT) Implementation - Based on official documentation
 */
export async function sendToOpenAI(
  messages: AIMessage[], 
  model: string = 'gpt-4o-mini'
): Promise<AIResponse> {
  if (!OPENAI_API_KEY) {
    if (IS_DEMO_MODE) {
      console.log('[OpenAI] Demo mode enabled, returning mock response');
      return generateDemoResponse(messages, 'ChatGPT');
    }
    throw new APIError(
      'OpenAI API key not configured.\n\n' +
      '✅ Get a FREE key at: https://platform.openai.com/api-keys\n' +
      '📝 Add to .env file: VITE_OPENAI_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true',
      undefined,
      'OpenAI'
    );
  }

  return retryWithBackoff(async () => {
    try {
      console.log('[OpenAI] Sending request with model:', model);
      
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
          max_tokens: 4000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new APIError(
            'Invalid OpenAI API key. Please check your VITE_OPENAI_API_KEY in .env file.',
            response.status,
            'OpenAI'
          );
        }
        if (response.status === 429) {
          throw new APIError(
            'OpenAI rate limit exceeded. Please try again in a moment.',
            response.status,
            'OpenAI',
            true // Retryable
          );
        }
        if (response.status === 402) {
          throw new APIError(
            'OpenAI account has insufficient funds. Please add credits at: https://platform.openai.com/account/billing',
            response.status,
            'OpenAI'
          );
        }
        if (response.status === 503) {
          throw new APIError(
            'OpenAI service temporarily unavailable. Please try again later.',
            response.status,
            'OpenAI',
            true // Retryable
          );
        }

        throw new APIError(
          `OpenAI API error (${response.status}): ${errorMessage}`,
          response.status,
          'OpenAI'
        );
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
      console.error('[OpenAI] Request failed:', error);
      if (error instanceof APIError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new APIError(
          'Network error: Unable to connect to OpenAI. Please check your internet connection.',
          undefined,
          'OpenAI',
          true // Retryable
        );
      }
      throw new APIError(
        `OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'OpenAI',
        true // Retryable
      );
    }
  });
}

/**
 * Anthropic (Claude) Implementation - Based on official documentation
 */
export async function sendToAnthropic(
  messages: AIMessage[], 
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<AIResponse> {
  if (!ANTHROPIC_API_KEY) {
    if (IS_DEMO_MODE) {
      console.log('[Anthropic] Demo mode enabled, returning mock response');
      return generateDemoResponse(messages, 'Claude');
    }
    throw new APIError(
      'Anthropic API key not configured.\n\n' +
      '✅ Get a FREE key at: https://console.anthropic.com/\n' +
      '📝 Add to .env file: VITE_ANTHROPIC_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true',
      undefined,
      'Anthropic'
    );
  }

  return retryWithBackoff(async () => {
    try {
      console.log('[Anthropic] Sending request with model:', model);
      
      // Convert messages to Anthropic format
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
          max_tokens: 4000,
          system: systemMessages || undefined,
          messages: conversationMessages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        if (response.status === 401) {
          throw new APIError(
            'Invalid Anthropic API key. Please check your VITE_ANTHROPIC_API_KEY in .env file.',
            response.status,
            'Anthropic'
          );
        }
        if (response.status === 429) {
          throw new APIError(
            'Anthropic rate limit exceeded. Please try again in a moment.',
            response.status,
            'Anthropic',
            true // Retryable
          );
        }
        if (response.status === 402) {
          throw new APIError(
            'Anthropic account has insufficient funds. Please add credits.',
            response.status,
            'Anthropic'
          );
        }

        throw new APIError(
          `Anthropic API error (${response.status}): ${errorMessage}`,
          response.status,
          'Anthropic'
        );
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
      console.error('[Anthropic] Request failed:', error);
      if (error instanceof APIError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new APIError(
          'Network error: Unable to connect to Anthropic. Please check your internet connection.',
          undefined,
          'Anthropic',
          true // Retryable
        );
      }
      throw new APIError(
        `Anthropic request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'Anthropic',
        true // Retryable
      );
    }
  });
}

/**
 * Google (Gemini) Implementation - Based on official documentation
 */
export async function sendToGoogle(
  messages: AIMessage[],
  model: string = 'gemini-2.0-flash',
  attachments: AIImageAttachment[] = []
): Promise<AIResponse> {
  if (!GOOGLE_API_KEY) {
    if (IS_DEMO_MODE) {
      console.log('[Google] Demo mode enabled, returning mock response');
      return generateDemoResponse(messages, 'Gemini');
    }
    throw new APIError(
      'Google API key not configured.\n\n' +
      '✅ Get a FREE key at: https://aistudio.google.com/app/apikey\n' +
      '📝 Add to .env file: VITE_GOOGLE_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true',
      undefined,
      'Google'
    );
  }

  return retryWithBackoff(async () => {
    try {
      console.log('[Google] Sending request with model:', model);
      
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
          target.parts.push({ 
            inlineData: { 
              mimeType: img.mimeType, 
              data: img.dataBase64 
            } 
          });
        }
      }

      const systemInstruction = messages.find(m => m.role === 'system')?.content;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`,
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
              maxOutputTokens: 4000,
              topP: 1,
              topK: 40,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        if (response.status === 401) {
          throw new APIError(
            'Invalid Google API key. Please check your VITE_GOOGLE_API_KEY in .env file.',
            response.status,
            'Google'
          );
        }
        if (response.status === 429) {
          throw new APIError(
            'Google rate limit exceeded. Please try again in a moment.',
            response.status,
            'Google',
            true // Retryable
          );
        }
        if (response.status === 403) {
          throw new APIError(
            'Google API access denied. Please check your API key permissions.',
            response.status,
            'Google'
          );
        }

        throw new APIError(
          `Google API error (${response.status}): ${errorMessage}`,
          response.status,
          'Google'
        );
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
        provider: 'Google',
        model: data.model || model
      };
    } catch (error) {
      console.error('[Google] Request failed:', error);
      if (error instanceof APIError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new APIError(
          'Network error: Unable to connect to Google. Please check your internet connection.',
          undefined,
          'Google',
          true // Retryable
        );
      }
      throw new APIError(
        `Google request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'Google',
        true // Retryable
      );
    }
  });
}

/**
 * Perplexity Implementation
 */
export async function sendToPerplexity(
  messages: AIMessage[], 
  model: string = 'llama-3.1-sonar-large-128k-online'
): Promise<AIResponse> {
  if (!PERPLEXITY_API_KEY) {
    if (IS_DEMO_MODE) {
      console.log('[Perplexity] Demo mode enabled, returning mock response');
      return generateDemoResponse(messages, 'Perplexity');
    }
    throw new APIError(
      'Perplexity API key not configured.\n\n' +
      '✅ Get a FREE key at: https://www.perplexity.ai/settings/api\n' +
      '📝 Add to .env file: VITE_PERPLEXITY_API_KEY=your_key_here\n' +
      '💡 Or enable demo mode: VITE_DEMO_MODE=true',
      undefined,
      'Perplexity'
    );
  }

  return retryWithBackoff(async () => {
    try {
      console.log('[Perplexity] Sending request with model:', model);
      
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
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        if (response.status === 401) {
          throw new APIError(
            'Invalid Perplexity API key. Please check your VITE_PERPLEXITY_API_KEY in .env file.',
            response.status,
            'Perplexity'
          );
        }
        if (response.status === 429) {
          throw new APIError(
            'Perplexity rate limit exceeded. Please try again in a moment.',
            response.status,
            'Perplexity',
            true // Retryable
          );
        }

        throw new APIError(
          `Perplexity API error (${response.status}): ${errorMessage}`,
          response.status,
          'Perplexity'
        );
      }

      const data = await response.json();
      console.log('[Perplexity] ✅ Success');

      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        provider: 'Perplexity',
        model: data.model
      };
    } catch (error) {
      console.error('[Perplexity] Request failed:', error);
      if (error instanceof APIError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new APIError(
          'Network error: Unable to connect to Perplexity. Please check your internet connection.',
          undefined,
          'Perplexity',
          true // Retryable
        );
      }
      throw new APIError(
        `Perplexity request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'Perplexity',
        true // Retryable
      );
    }
  });
}

/**
 * Main function to send message to appropriate AI provider with enhanced context management
 */
export async function sendAIMessage(
  provider: string,
  messages: AIMessage[],
  employeeRole?: string,
  attachments?: AIImageAttachment[],
  sessionId?: string,
  model?: string
): Promise<AIResponse> {
  console.log(`[AI Service] Attempting to send message via ${provider}...`);
  
  try {
    // Get optimized system prompt
    const systemPrompt = systemPromptsService.createRolePrompt(
      employeeRole || 'Assistant',
      provider,
      'Provide detailed, actionable advice based on your expertise.'
    );

    // Get optimized context if session ID provided
    let optimizedMessages: AIMessage[];
    if (sessionId) {
      // Add messages to context management
      messages.forEach(msg => {
        contextManagementService.addMessage(sessionId, {
          role: msg.role,
          content: msg.content,
          timestamp: new Date()
        });
      });

      // Get optimized context
      const contextMessages = contextManagementService.getOptimizedContext(sessionId, provider, model || 'default');
      optimizedMessages = contextMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    } else {
      // Use provided messages with system prompt
      optimizedMessages = [
        {
          role: 'system' as const,
          content: systemPrompt.content,
        },
        ...messages,
      ];
    }

    const providerLower = provider.toLowerCase();
    let response: AIResponse;
    
    switch (providerLower) {
      case 'chatgpt':
      case 'openai':
        response = await sendToOpenAI(optimizedMessages, model);
        break;
      
      case 'claude':
      case 'anthropic':
        response = await sendToAnthropic(optimizedMessages, model);
        break;
      
      case 'gemini':
      case 'google':
        response = await sendToGoogle(optimizedMessages, model || 'gemini-2.0-flash', attachments);
        break;
      
      case 'perplexity':
        response = await sendToPerplexity(optimizedMessages, model);
        break;
      
      default:
        throw new APIError(`Unsupported AI provider: ${provider}`);
    }

    // Track token usage
    if (response.usage) {
      const tokenUsage = tokenTrackingService.calculateTokenUsage(
        provider,
        model || 'default',
        response.usage.promptTokens,
        response.usage.completionTokens,
        sessionId,
        undefined // userId would be passed from the calling component
      );
      
      // Add token usage to response
      response.tokenUsage = tokenUsage;
    }

    // Save response to persistence if session ID provided
    if (sessionId && response.content) {
      await chatPersistenceService.addMessage(sessionId, 'assistant', response.content, {
        provider,
        model,
        usage: response.usage,
        tokenUsage: response.tokenUsage
      });
    }

    return response;
  } catch (error) {
    console.error(`[AI Service] Error with ${provider}:`, error);
    
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      `Failed to send message via ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      provider
    );
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
  const providers: string[] = [];
  
  if (OPENAI_API_KEY) providers.push('OpenAI');
  if (ANTHROPIC_API_KEY) providers.push('Anthropic');
  if (GOOGLE_API_KEY) providers.push('Google');
  if (PERPLEXITY_API_KEY) providers.push('Perplexity');
  
  return providers;
}

export { APIError };