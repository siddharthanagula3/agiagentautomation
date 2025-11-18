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
  AnthropicConfig,
} from './providers/anthropic-claude';
import {
  openaiProvider,
  OpenAIProvider,
  OpenAIMessage,
  OpenAIResponse,
  OpenAIConfig,
} from './providers/openai-gpt';
import {
  googleProvider,
  GoogleProvider,
  GoogleMessage,
  GoogleResponse,
  GoogleConfig,
} from './providers/google-gemini';
import {
  perplexityProvider,
  PerplexityProvider,
  PerplexityMessage,
  PerplexityResponse,
  PerplexityConfig,
} from './providers/perplexity-ai';
import {
  canUserMakeRequest,
  estimateTokensForRequest,
  deductTokens,
} from '@core/billing/token-enforcement-service';
import {
  checkUserInput,
  logInjectionAttempt,
} from '@core/security/prompt-injection-detector';
import {
  checkApiAbuse,
  trackRequestStart,
  trackRequestEnd,
  REQUEST_LIMITS,
} from '@core/security/api-abuse-prevention';
import { isFeatureEnabled } from '@core/security/gradual-rollout';

export type LLMProvider = 'anthropic' | 'openai' | 'google' | 'perplexity';
type ProviderInstance =
  | AnthropicProvider
  | OpenAIProvider
  | GoogleProvider
  | PerplexityProvider;

const ANTHROPIC_MODELS: AnthropicConfig['model'][] =
  AnthropicProvider.getAvailableModels() as AnthropicConfig['model'][];
const OPENAI_MODELS: OpenAIConfig['model'][] = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
];
const GOOGLE_MODELS: GoogleConfig['model'][] = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
];
const PERPLEXITY_MODELS: PerplexityConfig['model'][] = [
  'llama-3.1-sonar-small-128k-online',
  'llama-3.1-sonar-large-128k-online',
  'llama-3.1-sonar-huge-128k-online',
];

const isAnthropicModel = (model: string): model is AnthropicConfig['model'] =>
  ANTHROPIC_MODELS.includes(model as AnthropicConfig['model']);

const isOpenAIModel = (model: string): model is OpenAIConfig['model'] =>
  OPENAI_MODELS.includes(model as OpenAIConfig['model']);

const isGoogleModel = (model: string): model is GoogleConfig['model'] =>
  GOOGLE_MODELS.includes(model as GoogleConfig['model']);

const isPerplexityModel = (model: string): model is PerplexityConfig['model'] =>
  PERPLEXITY_MODELS.includes(model as PerplexityConfig['model']);

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
  metadata?: Record<string, unknown>;
}

export interface UnifiedConfig {
  provider: LLMProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  // Provider-specific configs
  anthropic?: {
    tools?: AnthropicConfig['tools'];
  };
  openai?: {
    tools?: OpenAIConfig['tools'];
  };
  google?: {
    tools?: GoogleConfig['tools'];
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
  private providers: Map<LLMProvider, ProviderInstance> = new Map();
  private config: UnifiedConfig;

  constructor(config: Partial<UnifiedConfig> = {}) {
    this.config = {
      provider: 'openai',
      model: 'gpt-4o',
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
   * Supports both old object API and new parameter API for backwards compatibility
   */
  async sendMessage(
    messagesOrConfig:
      | UnifiedMessage[]
      | {
          provider?: LLMProvider;
          messages: UnifiedMessage[];
          model?: string;
          sessionId?: string;
          userId?: string;
          temperature?: number;
          maxTokens?: number;
        },
    sessionId?: string,
    userId?: string,
    provider?: LLMProvider
  ): Promise<UnifiedResponse> {
    // Handle both API styles
    let messages: UnifiedMessage[];
    let targetProvider: LLMProvider;
    let actualSessionId: string | undefined;
    let actualUserId: string | undefined;

    if (Array.isArray(messagesOrConfig)) {
      // New API: sendMessage(messages, sessionId?, userId?, provider?)
      messages = messagesOrConfig;
      targetProvider = provider || this.config.provider;
      actualSessionId = sessionId;
      actualUserId = userId;
    } else {
      // Old API: sendMessage({ provider, messages, model, ... })
      messages = messagesOrConfig.messages;
      targetProvider = messagesOrConfig.provider || this.config.provider;
      actualSessionId = messagesOrConfig.sessionId || sessionId;
      actualUserId = messagesOrConfig.userId || userId;

      // Update config if model or other params provided
      if (messagesOrConfig.model) {
        this.config.model = messagesOrConfig.model;
      }
      if (messagesOrConfig.temperature !== undefined) {
        this.config.temperature = messagesOrConfig.temperature;
      }
      if (messagesOrConfig.maxTokens !== undefined) {
        this.config.maxTokens = messagesOrConfig.maxTokens;
      }
    }

    const providerInstance = this.providers.get(targetProvider);

    if (!providerInstance) {
      throw new UnifiedLLMError(
        `Provider ${targetProvider} not found`,
        'PROVIDER_NOT_FOUND',
        targetProvider
      );
    }

    try {
      // SECURITY LAYER 1: Prompt Injection Detection
      if (
        actualUserId &&
        isFeatureEnabled('prompt_injection_detection', actualUserId)
      ) {
        for (const message of messages) {
          if (message.role === 'user') {
            const injectionCheck = checkUserInput(message.content);

            if (!injectionCheck.allowed) {
              // Log the attempt
              await logInjectionAttempt(actualUserId, message.content, {
                isSafe: false,
                riskLevel: injectionCheck.riskLevel,
                detectedPatterns: [],
                confidence: 1.0,
              });

              throw new UnifiedLLMError(
                injectionCheck.reason ||
                  'Input blocked due to security concerns',
                'PROMPT_INJECTION_DETECTED',
                targetProvider,
                false
              );
            }

            // Use sanitized input if provided
            if (injectionCheck.sanitizedInput) {
              message.content = injectionCheck.sanitizedInput;
            }
          }
        }
      }

      // SECURITY LAYER 2: API Abuse Prevention
      if (
        actualUserId &&
        isFeatureEnabled('api_abuse_prevention', actualUserId)
      ) {
        const totalInputLength = messages.reduce(
          (sum, msg) => sum + msg.content.length,
          0
        );

        const abuseCheck = await checkApiAbuse(
          actualUserId,
          this.config.model,
          totalInputLength
        );

        if (!abuseCheck.allowed) {
          throw new UnifiedLLMError(
            abuseCheck.reason || 'API request blocked',
            'API_ABUSE_DETECTED',
            targetProvider,
            false
          );
        }
      }

      // SECURITY LAYER 3: Request Size Validation
      const totalMessageLength = messages.reduce(
        (sum, msg) => sum + msg.content.length,
        0
      );

      if (totalMessageLength > REQUEST_LIMITS.maxTotalConversationLength) {
        throw new UnifiedLLMError(
          `Conversation too long (${totalMessageLength} chars, max ${REQUEST_LIMITS.maxTotalConversationLength})`,
          'REQUEST_TOO_LARGE',
          targetProvider,
          false
        );
      }

      if (messages.length > REQUEST_LIMITS.maxMessagesInConversation) {
        throw new UnifiedLLMError(
          `Too many messages (${messages.length}, max ${REQUEST_LIMITS.maxMessagesInConversation})`,
          'TOO_MANY_MESSAGES',
          targetProvider,
          false
        );
      }

      // CRITICAL: Check token sufficiency BEFORE making API call
      if (actualUserId) {
        const messageLength = messages.reduce(
          (sum, msg) => sum + msg.content.length,
          0
        );
        const estimatedTokens = estimateTokensForRequest(messageLength);

        const permission = await canUserMakeRequest(
          actualUserId,
          estimatedTokens
        );

        if (!permission.allowed) {
          throw new UnifiedLLMError(
            permission.reason || 'Insufficient tokens',
            'INSUFFICIENT_TOKENS',
            targetProvider,
            false
          );
        }
      }

      // Track request start (for concurrent request limiting)
      if (actualUserId) {
        const estimatedTokens = estimateTokensForRequest(
          messages.reduce((sum, msg) => sum + msg.content.length, 0)
        );
        trackRequestStart(actualUserId, this.config.model, estimatedTokens);
      }

      // Convert messages to provider-specific format
      const providerMessages = this.convertMessagesToProvider(
        messages,
        targetProvider
      );

      // Update provider config
      this.updateProviderConfig(targetProvider);

      // Send message using provider
      let response: unknown;
      switch (targetProvider) {
        case 'anthropic':
          response = await (providerInstance as AnthropicProvider).sendMessage(
            providerMessages as AnthropicMessage[],
            actualSessionId,
            actualUserId
          );
          break;
        case 'openai':
          response = await (providerInstance as OpenAIProvider).sendMessage(
            providerMessages as OpenAIMessage[],
            actualSessionId,
            actualUserId
          );
          break;
        case 'google':
          response = await (providerInstance as GoogleProvider).sendMessage(
            providerMessages as GoogleMessage[],
            actualSessionId,
            actualUserId
          );
          break;
        case 'perplexity':
          response = await (providerInstance as PerplexityProvider).sendMessage(
            providerMessages as PerplexityMessage[],
            actualSessionId,
            actualUserId
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
      const unifiedResponse = this.convertResponseToUnified(
        response,
        targetProvider
      );

      // CRITICAL: Deduct tokens AFTER successful API call
      if (actualUserId && unifiedResponse.usage) {
        const deductionResult = await deductTokens(actualUserId, {
          provider: targetProvider,
          model: unifiedResponse.model,
          inputTokens: unifiedResponse.usage.promptTokens,
          outputTokens: unifiedResponse.usage.completionTokens,
          totalTokens: unifiedResponse.usage.totalTokens,
          sessionId: actualSessionId,
          feature: 'chat',
        });

        if (!deductionResult.success) {
          console.error(
            '[Unified LLM Service] Token deduction failed:',
            deductionResult.error
          );
          // Don't throw - user already received response
          // Log for audit purposes
        }
      }

      // Track request completion (for concurrent limiting)
      if (actualUserId) {
        trackRequestEnd(actualUserId);
      }

      return unifiedResponse;
    } catch (error) {
      // Track request end even on error
      if (actualUserId) {
        trackRequestEnd(actualUserId);
      }

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
    usage?: unknown;
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
        usage?: unknown;
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
  ): unknown[] {
    return messages.map((msg) => ({
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
    response: unknown,
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

    switch (provider) {
      case 'anthropic':
        {
          const update: Partial<AnthropicConfig> = {
            maxTokens: this.config.maxTokens,
            temperature: this.config.temperature,
            systemPrompt: this.config.systemPrompt,
            tools: this.config.anthropic?.tools,
          };
          if (isAnthropicModel(this.config.model)) {
            update.model = this.config.model;
          }
          (providerInstance as AnthropicProvider).updateConfig(update);
        }
        break;
      case 'openai':
        {
          const update: Partial<OpenAIConfig> = {
            maxTokens: this.config.maxTokens,
            temperature: this.config.temperature,
            systemPrompt: this.config.systemPrompt,
            tools: this.config.openai?.tools,
          };
          if (isOpenAIModel(this.config.model)) {
            update.model = this.config.model;
          }
          (providerInstance as OpenAIProvider).updateConfig(update);
        }
        break;
      case 'google':
        {
          const update: Partial<GoogleConfig> = {
            maxTokens: this.config.maxTokens,
            temperature: this.config.temperature,
            systemPrompt: this.config.systemPrompt,
            tools: this.config.google?.tools,
          };
          if (isGoogleModel(this.config.model)) {
            update.model = this.config.model;
          }
          (providerInstance as GoogleProvider).updateConfig(update);
        }
        break;
      case 'perplexity':
        {
          const update: Partial<PerplexityConfig> = {
            maxTokens: this.config.maxTokens,
            temperature: this.config.temperature,
            systemPrompt: this.config.systemPrompt,
            searchDomain: this.config.perplexity?.searchDomain,
            searchRecencyFilter: this.config.perplexity?.searchRecencyFilter,
          };
          if (isPerplexityModel(this.config.model)) {
            update.model = this.config.model;
          }
          (providerInstance as PerplexityProvider).updateConfig(update);
        }
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
    return Array.from(this.providers.keys()).filter((provider) =>
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
  getProvider(
    provider: LLMProvider
  ): AnthropicProvider | GoogleProvider | OpenAIProvider | PerplexityProvider {
    return this.providers.get(provider);
  }
}

// Export singleton instance
export const unifiedLLMService = new UnifiedLLMService();
