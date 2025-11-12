/**
 * Enhanced AI Chat Service V2
 * Enhanced chat service with provider configuration and model management
 */

import { unifiedLLMService } from '@core/ai/llm/unified-llm-service';

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
    openai: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
    ],
    anthropic: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    google: [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
    ],
    perplexity: [
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-huge-128k-online',
    ],
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

