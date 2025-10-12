/**
 * AI Chat Service
 * Provides unified interface for sending messages to AI providers
 */

import { unifiedLLMService } from './llm-providers/unified-llm-service';

export interface AIMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

export async function sendAIMessage(
  provider: AIProvider,
  messages: AIMessage[],
  model?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }
): Promise<string> {
  try {
    const response = await unifiedLLMService.sendMessage({
      provider,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      model: model || getDefaultModel(provider),
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      stream: options?.stream || false,
    });

    return response.content;
  } catch (error: any) {
    throw new Error(error.message || `Failed to send message to ${provider}`);
  }
}

export function isProviderConfigured(provider: AIProvider): boolean {
  const envKeys: Record<AIProvider, string> = {
    openai: 'VITE_OPENAI_API_KEY',
    anthropic: 'VITE_ANTHROPIC_API_KEY',
    google: 'VITE_GOOGLE_API_KEY',
    perplexity: 'VITE_PERPLEXITY_API_KEY',
  };

  const key = import.meta.env[envKeys[provider]];
  return !!key && key.length > 0;
}

export function getConfiguredProviders(): AIProvider[] {
  const providers: AIProvider[] = [
    'openai',
    'anthropic',
    'google',
    'perplexity',
  ];
  return providers.filter(provider => isProviderConfigured(provider));
}

function getDefaultModel(provider: AIProvider): string {
  const defaultModels: Record<AIProvider, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-2.0-flash-exp',
    perplexity: 'llama-3.1-sonar-large-128k-online',
  };

  return defaultModels[provider];
}

export { type AIProvider as Provider };
