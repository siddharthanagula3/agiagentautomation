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
  | 'research'
  | 'reasoning'
  | 'agentic'
  | 'computer-use'
  | 'vision'
  | 'multilingual';

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

// Available models with their strengths (Updated: Jan 3rd 2026)
const AVAILABLE_MODELS: ModelInfo[] = [
  // ==================== ANTHROPIC MODELS (Claude 4.5 Series) ====================
  {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    displayName: 'Claude 4.5 Opus',
    description: 'Most capable model for complex reasoning, coding, and extended thinking',
    strengths: ['coding', 'reasoning', 'data-analysis', 'research', 'agentic', 'computer-use'],
    costPer1KTokens: 0.015,
  },
  {
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929',
    displayName: 'Claude 4.5 Sonnet',
    description: 'Best balance of intelligence, speed, and computer use capabilities',
    strengths: ['coding', 'agentic', 'computer-use', 'general', 'vision'],
    costPer1KTokens: 0.003,
  },
  {
    provider: 'anthropic',
    model: 'claude-haiku-4-5-20251001',
    displayName: 'Claude 4.5 Haiku',
    description: 'Fast and efficient with computer use support',
    strengths: ['general', 'agentic', 'computer-use'],
    costPer1KTokens: 0.00025,
  },
  {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    description: 'Excellent for coding and analysis',
    strengths: ['coding', 'data-analysis', 'research'],
    costPer1KTokens: 0.003,
  },

  // ==================== OPENAI MODELS (GPT-5 & o3 Series) ====================
  {
    provider: 'openai',
    model: 'gpt-5.2',
    displayName: 'GPT-5.2',
    description: 'Most advanced reasoning and multimodal capabilities',
    strengths: ['reasoning', 'coding', 'research', 'vision', 'agentic'],
    costPer1KTokens: 0.02,
  },
  {
    provider: 'openai',
    model: 'gpt-5.1',
    displayName: 'GPT-5.1',
    description: 'Excellent for complex tasks with strong reasoning',
    strengths: ['reasoning', 'coding', 'general', 'vision'],
    costPer1KTokens: 0.015,
  },
  {
    provider: 'openai',
    model: 'gpt-4.1',
    displayName: 'GPT-4.1',
    description: 'Latest GPT-4 series with improved performance',
    strengths: ['general', 'coding', 'creative'],
    costPer1KTokens: 0.01,
  },
  {
    provider: 'openai',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
    description: 'Best for general tasks and multimodal',
    strengths: ['general', 'research', 'creative', 'vision'],
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
    model: 'o3',
    displayName: 'OpenAI o3',
    description: 'Most advanced reasoning model for complex problems',
    strengths: ['reasoning', 'coding', 'data-analysis', 'research'],
    costPer1KTokens: 0.02,
  },
  {
    provider: 'openai',
    model: 'o3-mini',
    displayName: 'OpenAI o3-mini',
    description: 'Fast reasoning for coding and analysis tasks',
    strengths: ['coding', 'reasoning'],
    costPer1KTokens: 0.004,
  },

  // ==================== GOOGLE MODELS (Gemini 3 Series) ====================
  {
    provider: 'google',
    model: 'gemini-3-pro-preview',
    displayName: 'Gemini 3 Pro',
    description: 'Most capable Gemini with thinking mode for complex reasoning',
    strengths: ['reasoning', 'coding', 'research', 'vision'],
    costPer1KTokens: 0.005,
  },
  {
    provider: 'google',
    model: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash',
    description: 'Fast Gemini 3 with thinking mode support',
    strengths: ['general', 'coding', 'reasoning'],
    costPer1KTokens: 0.001,
  },
  {
    provider: 'google',
    model: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    description: 'Excellent for complex tasks and large context',
    strengths: ['coding', 'research', 'general'],
    costPer1KTokens: 0.00125,
  },
  {
    provider: 'google',
    model: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    description: 'Fast and efficient multimodal model',
    strengths: ['general', 'vision'],
    costPer1KTokens: 0.0005,
  },
  {
    provider: 'google',
    model: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    description: 'Reliable multimodal model',
    strengths: ['general', 'creative'],
    costPer1KTokens: 0.0001,
  },

  // ==================== PERPLEXITY MODELS (Sonar Series) ====================
  {
    provider: 'perplexity',
    model: 'sonar-deep-research',
    displayName: 'Sonar Deep Research',
    description: 'Multi-step research with autonomous web browsing',
    strengths: ['research', 'data-analysis', 'agentic'],
    costPer1KTokens: 0.005,
  },
  {
    provider: 'perplexity',
    model: 'sonar-reasoning-pro',
    displayName: 'Sonar Reasoning Pro',
    description: 'Advanced reasoning with real-time web access',
    strengths: ['research', 'reasoning', 'data-analysis'],
    costPer1KTokens: 0.003,
  },
  {
    provider: 'perplexity',
    model: 'sonar-reasoning',
    displayName: 'Sonar Reasoning',
    description: 'Deep reasoning with web access',
    strengths: ['research', 'reasoning'],
    costPer1KTokens: 0.002,
  },
  {
    provider: 'perplexity',
    model: 'sonar-pro',
    displayName: 'Sonar Pro',
    description: 'Best for real-time research with citations',
    strengths: ['research'],
    costPer1KTokens: 0.001,
  },
  {
    provider: 'perplexity',
    model: 'sonar',
    displayName: 'Sonar',
    description: 'Fast web search and research',
    strengths: ['research'],
    costPer1KTokens: 0.0005,
  },

  // ==================== XAI GROK MODELS (Grok-4 Series) ====================
  {
    provider: 'grok',
    model: 'grok-4',
    displayName: 'Grok 4',
    description: 'Most capable Grok with real-time X/Twitter access',
    strengths: ['research', 'agentic', 'general', 'creative'],
    costPer1KTokens: 0.01,
  },
  {
    provider: 'grok',
    model: 'grok-4-1-fast-reasoning',
    displayName: 'Grok 4.1 Fast Reasoning',
    description: 'Fast reasoning with Agent Tools API support',
    strengths: ['reasoning', 'agentic', 'coding'],
    costPer1KTokens: 0.005,
  },
  {
    provider: 'grok',
    model: 'grok-4-1-fast-non-reasoning',
    displayName: 'Grok 4.1 Fast',
    description: 'Fast responses for general tasks',
    strengths: ['general', 'agentic'],
    costPer1KTokens: 0.002,
  },
  {
    provider: 'grok',
    model: 'grok-3',
    displayName: 'Grok 3',
    description: 'Reliable Grok for social media analysis',
    strengths: ['research', 'creative'],
    costPer1KTokens: 0.003,
  },
  {
    provider: 'grok',
    model: 'grok-2-vision-1212',
    displayName: 'Grok 2 Vision',
    description: 'Vision-capable Grok for image analysis',
    strengths: ['vision', 'general'],
    costPer1KTokens: 0.002,
  },

  // ==================== DEEPSEEK MODELS ====================
  {
    provider: 'deepseek',
    model: 'deepseek-reasoner',
    displayName: 'DeepSeek Reasoner',
    description: 'Advanced reasoning with chain-of-thought (R1 architecture)',
    strengths: ['reasoning', 'coding', 'data-analysis'],
    costPer1KTokens: 0.002,
  },
  {
    provider: 'deepseek',
    model: 'deepseek-chat',
    displayName: 'DeepSeek Chat',
    description: 'Excellent coding and general chat (V3.2)',
    strengths: ['coding', 'general', 'agentic'],
    costPer1KTokens: 0.0014,
  },

  // ==================== QWEN MODELS (Alibaba) ====================
  {
    provider: 'qwen',
    model: 'qwen3-max',
    displayName: 'Qwen3 Max',
    description: 'Most capable Qwen with thinking mode',
    strengths: ['reasoning', 'coding', 'multilingual'],
    costPer1KTokens: 0.004,
  },
  {
    provider: 'qwen',
    model: 'qwq-plus',
    displayName: 'QwQ Plus',
    description: 'Advanced reasoning model',
    strengths: ['reasoning', 'coding', 'data-analysis'],
    costPer1KTokens: 0.003,
  },
  {
    provider: 'qwen',
    model: 'qwen3-coder-plus',
    displayName: 'Qwen3 Coder Plus',
    description: 'Specialized for code generation and analysis',
    strengths: ['coding', 'agentic'],
    costPer1KTokens: 0.002,
  },
  {
    provider: 'qwen',
    model: 'qwen3-coder-flash',
    displayName: 'Qwen3 Coder Flash',
    description: 'Fast code generation',
    strengths: ['coding'],
    costPer1KTokens: 0.001,
  },
  {
    provider: 'qwen',
    model: 'qwen-plus',
    displayName: 'Qwen Plus',
    description: 'Excellent balance for general tasks',
    strengths: ['general', 'multilingual', 'coding'],
    costPer1KTokens: 0.002,
  },
  {
    provider: 'qwen',
    model: 'qwen-flash',
    displayName: 'Qwen Flash',
    description: 'Fast and efficient for quick responses',
    strengths: ['general', 'multilingual'],
    costPer1KTokens: 0.0005,
  },
  {
    provider: 'qwen',
    model: 'qwen3-vl-plus',
    displayName: 'Qwen3 VL Plus',
    description: 'Vision-language model for image understanding',
    strengths: ['vision', 'multilingual'],
    costPer1KTokens: 0.002,
  },
];

export class ModelRouter {
  /**
   * Detect task category from user input
   */
  detectTaskCategory(userInput: string): TaskCategory {
    const lowerInput = userInput.toLowerCase();

    // Computer use keywords (highest priority - specialized capability)
    if (
      /\b(computer use|browse|click|scroll|screenshot|navigate|automate browser|web automation|desktop automation)\b/i.test(
        lowerInput
      )
    ) {
      return 'computer-use';
    }

    // Reasoning keywords (complex problem-solving)
    if (
      /\b(reason|reasoning|think through|step by step|complex|mathematical proof|logic|theorem|solve|problem solving|chain of thought)\b/i.test(
        lowerInput
      )
    ) {
      return 'reasoning';
    }

    // Agentic keywords (autonomous tasks)
    if (
      /\b(agent|autonomous|orchestrate|coordinate|multi-step|workflow|execute tasks|tool use|tools|function calling)\b/i.test(
        lowerInput
      )
    ) {
      return 'agentic';
    }

    // Vision keywords
    if (
      /\b(look at|analyze image|describe image|what's in|see|vision|recognize|identify in image|image analysis|visual)\b/i.test(
        lowerInput
      )
    ) {
      return 'vision';
    }

    // Multilingual keywords
    if (
      /\b(translate|translation|chinese|japanese|korean|spanish|french|german|arabic|hindi|multilingual|language)\b/i.test(
        lowerInput
      )
    ) {
      return 'multilingual';
    }

    // Coding keywords
    if (
      /\b(code|debug|implement|refactor|function|class|api|typescript|javascript|python|react|component|bug|error|test|program|script)\b/i.test(
        lowerInput
      )
    ) {
      return 'coding';
    }

    // Creative keywords
    if (
      /\b(creative|story|poem|write|article|blog|content|marketing|design|ideate|brainstorm|narrative|fiction)\b/i.test(
        lowerInput
      )
    ) {
      return 'creative';
    }

    // Research keywords
    if (
      /\b(research|search|find|investigate|study|compare|lookup|information|trends|current events|news|latest)\b/i.test(
        lowerInput
      )
    ) {
      return 'research';
    }

    // Data analysis keywords
    if (
      /\b(analyze|analytics|data|metrics|statistics|chart|graph|calculate|compute|sql|database|spreadsheet)\b/i.test(
        lowerInput
      )
    ) {
      return 'data-analysis';
    }

    // Image generation keywords
    if (
      /\b(generate image|create image|draw|illustration|picture|photo|visualize|diagram|render|dalle|midjourney|imagen)\b/i.test(
        lowerInput
      )
    ) {
      return 'image-generation';
    }

    // Video generation keywords
    if (
      /\b(video|animation|movie|generate video|create video|sora|veo|runway)\b/i.test(
        lowerInput
      )
    ) {
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
      // Fallback to Claude 4.5 Sonnet as general purpose
      const fallback =
        AVAILABLE_MODELS.find((m) => m.model === 'claude-sonnet-4-5-20250929') ||
        AVAILABLE_MODELS.find((m) => m.model === 'gpt-5.2') ||
        AVAILABLE_MODELS[0];
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
      research: `${model.displayName} provides excellent research capabilities with real-time web access and citations.`,
      reasoning: `${model.displayName} features advanced reasoning with chain-of-thought and extended thinking for complex problems.`,
      agentic: `${model.displayName} is optimized for autonomous task execution with tool use and multi-step workflows.`,
      'computer-use': `${model.displayName} supports computer use capabilities for browser and desktop automation.`,
      vision: `${model.displayName} has advanced vision capabilities for image analysis and understanding.`,
      multilingual: `${model.displayName} excels at multilingual tasks including translation and cross-language understanding.`,
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
   * Get default model (Claude 4.5 Sonnet for balanced performance)
   */
  getDefaultModel(): ModelInfo {
    return (
      AVAILABLE_MODELS.find((m) => m.model === 'claude-sonnet-4-5-20250929') ||
      AVAILABLE_MODELS[0]
    );
  }

  /**
   * Get best model by category
   */
  getBestModelForCategory(category: TaskCategory): ModelInfo | undefined {
    const categoryModels = AVAILABLE_MODELS.filter((m) =>
      m.strengths.includes(category)
    );
    return categoryModels[0];
  }

  /**
   * Get all models grouped by provider
   */
  getModelsGroupedByProvider(): Record<LLMProvider, ModelInfo[]> {
    const grouped: Record<string, ModelInfo[]> = {};
    for (const model of AVAILABLE_MODELS) {
      if (!grouped[model.provider]) {
        grouped[model.provider] = [];
      }
      grouped[model.provider].push(model);
    }
    return grouped as Record<LLMProvider, ModelInfo[]>;
  }

  /**
   * Get image generation capable providers
   */
  getImageGenerationProviders(): LLMProvider[] {
    return ['openai', 'google', 'grok', 'qwen'];
  }

  /**
   * Get video generation capable providers
   */
  getVideoGenerationProviders(): LLMProvider[] {
    return ['openai', 'google', 'qwen'];
  }

  /**
   * Get computer use capable models
   */
  getComputerUseModels(): ModelInfo[] {
    return AVAILABLE_MODELS.filter((m) => m.strengths.includes('computer-use'));
  }

  /**
   * Get reasoning-optimized models
   */
  getReasoningModels(): ModelInfo[] {
    return AVAILABLE_MODELS.filter((m) => m.strengths.includes('reasoning'));
  }

  /**
   * Get agentic/tool-use capable models
   */
  getAgenticModels(): ModelInfo[] {
    return AVAILABLE_MODELS.filter((m) => m.strengths.includes('agentic'));
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
