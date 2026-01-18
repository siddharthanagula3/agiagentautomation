/**
 * Enhanced AI Chat Service V2
 * Enhanced chat service with provider configuration and model management
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

/**
 * Get configured providers
 * SECURITY: All providers are available through authenticated Netlify proxies
 * API keys are managed server-side, not exposed to client
 */
export function getConfiguredProviders(): AIProvider[] {
  // All providers are available through authenticated Netlify proxies
  // Actual availability depends on server-side API key configuration
  return ['openai', 'anthropic', 'google', 'perplexity'];
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
