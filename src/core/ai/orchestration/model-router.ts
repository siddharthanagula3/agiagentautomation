/**
 * Task-Based Model Router
 * Automatically selects the best LLM for specific task types
 * Supports user override
 */

import type { LLMProvider } from '@core/ai/llm/unified-language-model';

export type TaskCategory =
  | 'coding'
  | 'general'
  | 'creative'
  | 'image-generation'
  | 'video-generation'
  | 'data-analysis'
  | 'research';

export interface ModelRecommendation {
  provider: LLMProvider;
  model: string;
  reason: string;
  confidence: number; // 0-1
  alternatives: Array<{
    provider: LLMProvider;
    model: string;
    reason: string;
  }>;
}

export interface ModelInfo {
  provider: LLMProvider;
  model: string;
  displayName: string;
  description: string;
  strengths: TaskCategory[];
  costPer1KTokens: number;
}

// Available models with their strengths
const AVAILABLE_MODELS: ModelInfo[] = [
  // Anthropic Models
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    description: 'Best for coding, analysis, and complex reasoning',
    strengths: ['coding', 'data-analysis', 'research'],
    costPer1KTokens: 0.003,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    description: 'Most capable for very complex tasks',
    strengths: ['research', 'data-analysis', 'general'],
    costPer1KTokens: 0.015,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    displayName: 'Claude 3 Haiku',
    description: 'Fast and efficient for simple tasks',
    strengths: ['general'],
    costPer1KTokens: 0.00025,
  },

  // OpenAI Models
  {
    provider: 'openai',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
    description: 'Best for general tasks and multimodal',
    strengths: ['general', 'research'],
    costPer1KTokens: 0.0025,
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    description: 'Fast and cost-effective for most tasks',
    strengths: ['general'],
    costPer1KTokens: 0.00015,
  },
  {
    provider: 'openai',
    model: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    description: 'Balanced performance and cost',
    strengths: ['general', 'coding'],
    costPer1KTokens: 0.01,
  },

  // Google Models
  {
    provider: 'google',
    model: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    description: 'Best for creative tasks and large context',
    strengths: ['creative', 'general', 'research'],
    costPer1KTokens: 0.00125,
  },
  {
    provider: 'google',
    model: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: 'Fast and efficient multimodal model',
    strengths: ['general', 'image-generation'],
    costPer1KTokens: 0.000075,
  },

  // Perplexity Models
  {
    provider: 'perplexity',
    model: 'llama-3.1-sonar-large-128k-online',
    displayName: 'Perplexity Sonar Large',
    description: 'Best for real-time research with web access',
    strengths: ['research'],
    costPer1KTokens: 0.001,
  },
];

export class ModelRouter {
  /**
   * Detect task category from user input
   */
  detectTaskCategory(userInput: string): TaskCategory {
    const lowerInput = userInput.toLowerCase();

    // Coding keywords
    if (
      /\b(code|debug|implement|refactor|function|class|api|typescript|javascript|python|react|component|bug|error|test)\b/i.test(
        lowerInput
      )
    ) {
      return 'coding';
    }

    // Creative keywords
    if (
      /\b(creative|story|poem|write|article|blog|content|marketing|design|ideate|brainstorm)\b/i.test(
        lowerInput
      )
    ) {
      return 'creative';
    }

    // Research keywords
    if (
      /\b(research|search|find|investigate|analyze|study|compare|lookup|information|data|trends)\b/i.test(
        lowerInput
      )
    ) {
      return 'research';
    }

    // Data analysis keywords
    if (
      /\b(analyze|analytics|data|metrics|statistics|chart|graph|calculate|compute|sql|database)\b/i.test(
        lowerInput
      )
    ) {
      return 'data-analysis';
    }

    // Image generation keywords
    if (
      /\b(image|picture|photo|generate image|create image|visualize|diagram|illustration)\b/i.test(
        lowerInput
      )
    ) {
      return 'image-generation';
    }

    // Video generation keywords
    if (/\b(video|animation|movie|generate video|create video)\b/i.test(lowerInput)) {
      return 'video-generation';
    }

    // Default to general
    return 'general';
  }

  /**
   * Recommend the best model for a task
   */
  recommendModel(
    userInput: string,
    taskCategory?: TaskCategory
  ): ModelRecommendation {
    const category = taskCategory || this.detectTaskCategory(userInput);

    // Find models that excel at this category
    const suitableModels = AVAILABLE_MODELS.filter((model) =>
      model.strengths.includes(category)
    ).sort((a, b) => {
      // Primary: strength match
      const aIndex = a.strengths.indexOf(category);
      const bIndex = b.strengths.indexOf(category);
      if (aIndex !== bIndex) return aIndex - bIndex;

      // Secondary: cost (lower is better for similar capability)
      return a.costPer1KTokens - b.costPer1KTokens;
    });

    if (suitableModels.length === 0) {
      // Fallback to general purpose
      const fallback = AVAILABLE_MODELS.find((m) => m.model === 'gpt-4o')!;
      return {
        provider: fallback.provider,
        model: fallback.model,
        reason: `No specialized model found for "${category}". Using general-purpose model.`,
        confidence: 0.5,
        alternatives: [],
      };
    }

    const primary = suitableModels[0];
    const alternatives = suitableModels.slice(1, 3).map((m) => ({
      provider: m.provider,
      model: m.model,
      reason: m.description,
    }));

    return {
      provider: primary.provider,
      model: primary.model,
      reason: this.getRecommendationReason(category, primary),
      confidence: 0.85,
      alternatives,
    };
  }

  /**
   * Get a human-readable reason for the recommendation
   */
  private getRecommendationReason(
    category: TaskCategory,
    model: ModelInfo
  ): string {
    const reasons: Record<TaskCategory, string> = {
      coding: `${model.displayName} excels at code generation, debugging, and technical analysis with superior reasoning capabilities.`,
      general: `${model.displayName} provides the best balance of performance and versatility for general tasks.`,
      creative: `${model.displayName} is optimized for creative writing, content generation, and brainstorming.`,
      'image-generation': `${model.displayName} supports multimodal capabilities for image understanding and generation guidance.`,
      'video-generation': `${model.displayName} can help plan and script video content effectively.`,
      'data-analysis': `${model.displayName} has strong analytical and mathematical reasoning for data work.`,
      research: `${model.displayName} provides excellent research capabilities with large context and reasoning.`,
    };

    return reasons[category] || model.description;
  }

  /**
   * Get model by ID
   */
  getModelById(modelId: string): ModelInfo | undefined {
    return AVAILABLE_MODELS.find((m) => m.model === modelId);
  }

  /**
   * Get all available models
   */
  getAllModels(): ModelInfo[] {
    return AVAILABLE_MODELS;
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(provider: LLMProvider): ModelInfo[] {
    return AVAILABLE_MODELS.filter((m) => m.provider === provider);
  }

  /**
   * Get default model (Claude 3.5 Sonnet for coding)
   */
  getDefaultModel(): ModelInfo {
    return (
      AVAILABLE_MODELS.find(
        (m) => m.model === 'claude-3-5-sonnet-20241022'
      ) || AVAILABLE_MODELS[0]
    );
  }
}

// Export singleton instance
export const modelRouter = new ModelRouter();

// Export convenience functions
export function recommendModelForTask(userInput: string): ModelRecommendation {
  return modelRouter.recommendModel(userInput);
}

export function getAvailableModels(): ModelInfo[] {
  return modelRouter.getAllModels();
}

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return modelRouter.getModelById(modelId);
}
