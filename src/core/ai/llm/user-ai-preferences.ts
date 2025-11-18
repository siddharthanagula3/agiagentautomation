/**
 * User AI Preferences Service
 * Loads user AI preferences from settings and applies them to the LLM service
 */

import { settingsService } from '@features/settings/services/user-preferences';
import { unifiedLLMService, type LLMProvider } from './unified-language-model';

/**
 * Load user AI preferences and apply them to the unified LLM service
 * Returns the configured provider and model
 */
export async function loadUserAIPreferences(): Promise<{
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
}> {
  try {
    const { data, error } = await settingsService.getSettings();

    if (error || !data) {
      // Return defaults if settings can't be loaded
      return {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 4000,
      };
    }

    // Extract AI preferences with fallbacks
    const provider = (data.default_ai_provider || 'openai') as LLMProvider;
    const model = data.default_ai_model || 'gpt-4o';
    const temperature = data.ai_temperature ?? 0.7;
    const maxTokens = data.ai_max_tokens ?? 4000;

    // Update the unified LLM service config
    unifiedLLMService.updateConfig({
      provider,
      model,
      temperature,
      maxTokens,
    });

    return {
      provider,
      model,
      temperature,
      maxTokens,
    };
  } catch (error) {
    console.error('Error loading user AI preferences:', error);

    // Return defaults on error
    return {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4000,
    };
  }
}

/**
 * Get the default provider and model for a specific task type
 * This allows overriding user preferences for specialized tasks
 */
export function getProviderForTaskType(
  taskType: 'chat' | 'document' | 'image' | 'video' | 'code'
): {
  provider: LLMProvider;
  model: string;
} {
  switch (taskType) {
    case 'document':
      // Claude is better for document generation
      return {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      };
    case 'image':
      // Google Imagen for image generation
      return {
        provider: 'google',
        model: 'gemini-2.0-flash',
      };
    case 'video':
      // Google Veo for video generation
      return {
        provider: 'google',
        model: 'gemini-2.5-flash',
      };
    case 'code':
    case 'chat':
    default:
      // For general chat and code, use user preferences
      // These will be loaded by loadUserAIPreferences()
      return {
        provider: 'openai',
        model: 'gpt-4o',
      };
  }
}

/**
 * Apply task-specific configuration to the LLM service
 */
export async function applyTaskConfiguration(
  taskType: 'chat' | 'document' | 'image' | 'video' | 'code',
  overrideUserPreferences = false
): Promise<void> {
  if (overrideUserPreferences) {
    // Use task-specific configuration
    const config = getProviderForTaskType(taskType);
    unifiedLLMService.updateConfig(config);
  } else {
    // Load and apply user preferences
    await loadUserAIPreferences();
  }
}
