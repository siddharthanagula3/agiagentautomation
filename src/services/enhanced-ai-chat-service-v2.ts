/**
 * Enhanced AI Chat Service V2
 * Enhanced chat service with provider configuration and model management
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

/**
 * Get configured providers
 */
export function getConfiguredProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  if (import.meta.env.VITE_OPENAI_API_KEY) {
    providers.push('openai');
  }
  if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
    providers.push('anthropic');
  }
  if (import.meta.env.VITE_GOOGLE_API_KEY) {
    providers.push('google');
  }
  if (import.meta.env.VITE_PERPLEXITY_API_KEY) {
    providers.push('perplexity');
  }

  return providers;
}

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider: AIProvider): string[] {
  const models: Record<AIProvider, string[]> = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini'],
    anthropic: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
    ],
    google: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    perplexity: ['sonar-pro', 'sonar', 'sonar-reasoning'],
  };

  return models[provider] || [];
}

/**
 * Create custom system prompt
 */
export async function createCustomSystemPrompt(
  prompt: string,
  provider?: AIProvider
): Promise<string> {
  // Custom system prompt creation would be implemented here
  // For now, just return the prompt
  return prompt;
}

/**
 * Test provider connection
 */
export async function testProviderConnection(
  provider: AIProvider
): Promise<{ success: boolean; error?: string }> {
  try {
    // Test connection by making a simple API call
    const response = await unifiedLLMService.sendMessage({
      provider,
      messages: [{ role: 'user', content: 'test' }],
      model: getAvailableModels(provider)[0],
    });

    return {
      success: !!response.content,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
