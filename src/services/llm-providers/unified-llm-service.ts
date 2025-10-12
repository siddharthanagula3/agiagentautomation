/**
 * Unified LLM Service
 * Manages all LLM providers (Anthropic, OpenAI, Google, Perplexity)
 * Provides a consistent interface for all AI models
 */

import {
  anthropicProvider,
  AnthropicProvider,
  AnthropicMessage,
  AnthropicResponse,
} from './anthropic-provider';
import {
  openaiProvider,
  OpenAIProvider,
  OpenAIMessage,
  OpenAIResponse,
} from './openai-provider';
import {
  googleProvider,
  GoogleProvider,
  GoogleMessage,
  GoogleResponse,
} from './google-provider';
import {
  perplexityProvider,
  PerplexityProvider,
  PerplexityMessage,
  PerplexityResponse,
} from './perplexity-provider';

export type LLMProvider = 'anthropic' | 'openai' | 'google' | 'perplexity';

export interface UnifiedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sessionId?: string;
    userId?: string;
    employeeId?: string;
    employeeRole?: string;
    timestamp?: string;
    provider?: LLMProvider;
  };
}

export interface UnifiedResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: LLMProvider;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface UnifiedConfig {
  provider: LLMProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  // Provider-specific configs
  anthropic?: {
    tools?: any[];
  };
  openai?: {
    tools?: any[];
  };
  google?: {
    tools?: any[];
  };
  perplexity?: {
    searchDomain?: string;
    searchRecencyFilter?: 'day' | 'week' | 'month' | 'year';
  };
}

export class UnifiedLLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: LLMProvider,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'UnifiedLLMError';
  }
}

export class UnifiedLLMService {
  private providers: Map<LLMProvider, any> = new Map();
  private config: UnifiedConfig;

  constructor(config: Partial<UnifiedConfig> = {}) {
    this.config = {
      provider: 'openai',
      model: 'gpt-4o-mini',
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      ...config,
    };

    // Initialize providers
    this.providers.set('anthropic', anthropicProvider);
    this.providers.set('openai', openaiProvider);
    this.providers.set('google', googleProvider);
    this.providers.set('perplexity', perplexityProvider);
  }

  /**
   * Send a message using the specified provider
   */
  async sendMessage(
    messages: UnifiedMessage[],
    sessionId?: string,
    userId?: string,
    provider?: LLMProvider
  ): Promise<UnifiedResponse> {
    const targetProvider = provider || this.config.provider;
    const providerInstance = this.providers.get(targetProvider);

    if (!providerInstance) {
      throw new UnifiedLLMError(
        `Provider ${targetProvider} not found`,
        'PROVIDER_NOT_FOUND',
        targetProvider
      );
    }

    try {
      // Convert messages to provider-specific format
      const providerMessages = this.convertMessagesToProvider(
        messages,
        targetProvider
      );

      // Update provider config
      this.updateProviderConfig(targetProvider);

      // Send message using provider
      let response: any;
      switch (targetProvider) {
        case 'anthropic':
          response = await (providerInstance as AnthropicProvider).sendMessage(
            providerMessages as AnthropicMessage[],
            sessionId,
            userId
          );
          break;
        case 'openai':
          response = await (providerInstance as OpenAIProvider).sendMessage(
            providerMessages as OpenAIMessage[],
            sessionId,
            userId
          );
          break;
        case 'google':
          response = await (providerInstance as GoogleProvider).sendMessage(
            providerMessages as GoogleMessage[],
            sessionId,
            userId
          );
          break;
        case 'perplexity':
          response = await (providerInstance as PerplexityProvider).sendMessage(
            providerMessages as PerplexityMessage[],
            sessionId,
            userId
          );
          break;
        default:
          throw new UnifiedLLMError(
            `Unsupported provider: ${targetProvider}`,
            'UNSUPPORTED_PROVIDER',
            targetProvider
          );
      }

      // Convert response to unified format
      return this.convertResponseToUnified(response, targetProvider);
    } catch (error) {
      console.error(
        `[Unified LLM Service] Error with ${targetProvider}:`,
        error
      );

      if (error instanceof UnifiedLLMError) {
        throw error;
      }

      throw new UnifiedLLMError(
        `Provider ${targetProvider} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROVIDER_ERROR',
        targetProvider,
        true
      );
    }
  }

  /**
   * Stream a message using the specified provider
   */
  async *streamMessage(
    messages: UnifiedMessage[],
    sessionId?: string,
    userId?: string,
    provider?: LLMProvider
  ): AsyncGenerator<{
    content: string;
    done: boolean;
    usage?: any;
    provider: LLMProvider;
  }> {
    const targetProvider = provider || this.config.provider;
    const providerInstance = this.providers.get(targetProvider);

    if (!providerInstance) {
      throw new UnifiedLLMError(
        `Provider ${targetProvider} not found`,
        'PROVIDER_NOT_FOUND',
        targetProvider
      );
    }

    try {
      // Convert messages to provider-specific format
      const providerMessages = this.convertMessagesToProvider(
        messages,
        targetProvider
      );

      // Update provider config
      this.updateProviderConfig(targetProvider);

      // Stream message using provider
      let stream: AsyncGenerator<{
        content: string;
        done: boolean;
        usage?: any;
      }>;
      switch (targetProvider) {
        case 'anthropic':
          stream = (providerInstance as AnthropicProvider).streamMessage(
            providerMessages as AnthropicMessage[],
            sessionId,
            userId
          );
          break;
        case 'openai':
          stream = (providerInstance as OpenAIProvider).streamMessage(
            providerMessages as OpenAIMessage[],
            sessionId,
            userId
          );
          break;
        case 'google':
          stream = (providerInstance as GoogleProvider).streamMessage(
            providerMessages as GoogleMessage[],
            sessionId,
            userId
          );
          break;
        case 'perplexity':
          stream = (providerInstance as PerplexityProvider).streamMessage(
            providerMessages as PerplexityMessage[],
            sessionId,
            userId
          );
          break;
        default:
          throw new UnifiedLLMError(
            `Unsupported provider: ${targetProvider}`,
            'UNSUPPORTED_PROVIDER',
            targetProvider
          );
      }

      // Yield stream with provider information
      for await (const chunk of stream) {
        yield { ...chunk, provider: targetProvider };
      }
    } catch (error) {
      console.error(
        `[Unified LLM Service] Streaming error with ${targetProvider}:`,
        error
      );

      if (error instanceof UnifiedLLMError) {
        throw error;
      }

      throw new UnifiedLLMError(
        `Provider ${targetProvider} streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROVIDER_STREAMING_ERROR',
        targetProvider,
        true
      );
    }
  }

  /**
   * Convert unified messages to provider-specific format
   */
  private convertMessagesToProvider(
    messages: UnifiedMessage[],
    provider: LLMProvider
  ): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      metadata: {
        ...msg.metadata,
        provider,
      },
    }));
  }

  /**
   * Convert provider response to unified format
   */
  private convertResponseToUnified(
    response: any,
    provider: LLMProvider
  ): UnifiedResponse {
    // Normalize usage information
    let usage;
    if (response.usage) {
      if (provider === 'anthropic') {
        usage = {
          promptTokens: response.usage.inputTokens,
          completionTokens: response.usage.outputTokens,
          totalTokens: response.usage.totalTokens,
        };
      } else {
        usage = {
          promptTokens: response.usage.promptTokens || 0,
          completionTokens: response.usage.completionTokens || 0,
          totalTokens: response.usage.totalTokens || 0,
        };
      }
    }

    return {
      content: response.content,
      usage,
      model: response.model,
      provider,
      sessionId: response.sessionId,
      userId: response.userId,
      metadata: {
        ...response.metadata,
        provider,
      },
    };
  }

  /**
   * Update provider configuration
   */
  private updateProviderConfig(provider: LLMProvider): void {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) return;

    const baseConfig = {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      systemPrompt: this.config.systemPrompt,
    };

    switch (provider) {
      case 'anthropic':
        (providerInstance as AnthropicProvider).updateConfig({
          ...baseConfig,
          model: this.config.model as any,
          tools: this.config.anthropic?.tools,
        });
        break;
      case 'openai':
        (providerInstance as OpenAIProvider).updateConfig({
          ...baseConfig,
          model: this.config.model as any,
          tools: this.config.openai?.tools,
        });
        break;
      case 'google':
        (providerInstance as GoogleProvider).updateConfig({
          ...baseConfig,
          model: this.config.model as any,
          tools: this.config.google?.tools,
        });
        break;
      case 'perplexity':
        (providerInstance as PerplexityProvider).updateConfig({
          ...baseConfig,
          model: this.config.model as any,
          searchDomain: this.config.perplexity?.searchDomain,
          searchRecencyFilter: this.config.perplexity?.searchRecencyFilter,
        });
        break;
    }
  }

  /**
   * Update unified configuration
   */
  updateConfig(newConfig: Partial<UnifiedConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): UnifiedConfig {
    return { ...this.config };
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: LLMProvider): boolean {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) return false;

    switch (provider) {
      case 'anthropic':
        return (providerInstance as AnthropicProvider).isConfigured();
      case 'openai':
        return (providerInstance as OpenAIProvider).isConfigured();
      case 'google':
        return (providerInstance as GoogleProvider).isConfigured();
      case 'perplexity':
        return (providerInstance as PerplexityProvider).isConfigured();
      default:
        return false;
    }
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): LLMProvider[] {
    return Array.from(this.providers.keys()).filter(provider =>
      this.isProviderConfigured(provider)
    );
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: LLMProvider): string[] {
    switch (provider) {
      case 'anthropic':
        return AnthropicProvider.getAvailableModels();
      case 'openai':
        return OpenAIProvider.getAvailableModels();
      case 'google':
        return GoogleProvider.getAvailableModels();
      case 'perplexity':
        return PerplexityProvider.getAvailableModels();
      default:
        return [];
    }
  }

  /**
   * Get provider instance
   */
  getProvider(provider: LLMProvider): any {
    return this.providers.get(provider);
  }
}

// Export singleton instance
export const unifiedLLMService = new UnifiedLLMService();
