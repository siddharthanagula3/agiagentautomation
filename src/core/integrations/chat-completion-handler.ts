/**
 * AI Chat Service
 * Provides unified interface for sending messages to AI providers
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import { loadUserAIPreferences } from '@core/ai/llm/user-ai-preferences';

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
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      model: model || getDefaultModel(provider),
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      stream: options?.stream || false,
    });

    return response.content;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Failed to send message to ${provider}`;
    throw new Error(message);
  }
}

/**
 * Check if provider is configured
 * SECURITY: Always returns true since providers are available through authenticated proxies
 * Actual availability is determined server-side
 */
export function isProviderConfigured(provider: AIProvider): boolean {
  // All providers are available through authenticated Netlify proxies
  // Actual availability depends on server-side API key configuration
  return true;
}

/**
 * Get configured providers
 * SECURITY: All providers available through authenticated proxies
 */
export function getConfiguredProviders(): AIProvider[] {
  // All providers are available through authenticated Netlify proxies
  return ['openai', 'anthropic', 'google', 'perplexity'];
}

function getDefaultModel(provider: AIProvider): string {
  const defaultModels: Record<AIProvider, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-2.0-flash',
    perplexity: 'sonar-pro',
  };

  return defaultModels[provider];
}

export { type AIProvider as Provider };
