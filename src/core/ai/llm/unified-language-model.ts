/**
 * Unified LLM Service
 * Manages all LLM providers (Anthropic, OpenAI, Google, Perplexity, Grok, DeepSeek, Qwen)
 * Provides a consistent interface for all AI models
 * Updated: Jan 3rd 2026 - Added DeepSeek and Qwen providers
 */

import {
  anthropicProvider,
  AnthropicProvider,
  AnthropicMessage,
  AnthropicConfig,
} from './providers/anthropic-claude';
import {
  openaiProvider,
  OpenAIProvider,
  OpenAIMessage,
  OpenAIConfig,
} from './providers/openai-gpt';
import {
  googleProvider,
  GoogleProvider,
  GoogleMessage,
  GoogleConfig,
} from './providers/google-gemini';
import {
  perplexityProvider,
  PerplexityProvider,
  PerplexityMessage,
  PerplexityConfig,
} from './providers/perplexity-ai';
import {
  grokProvider,
  GrokProvider,
  GrokMessage,
  GrokConfig,
} from './providers/grok-ai';
import {
  deepseekProvider,
  DeepSeekProvider,
  DeepSeekMessage,
  DeepSeekConfig,
} from './providers/deepseek-ai';
import {
  qwenProvider,
  QwenProvider,
  QwenMessage,
  QwenConfig,
} from './providers/qwen-ai';
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
import { logger } from '@shared/lib/logger';

export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'perplexity'
  | 'grok'
  | 'deepseek'
  | 'qwen';
type ProviderInstance =
  | AnthropicProvider
  | OpenAIProvider
  | GoogleProvider
  | PerplexityProvider
  | GrokProvider
  | DeepSeekProvider
  | QwenProvider;

// Model arrays - Jan 2026 update
const ANTHROPIC_MODELS: AnthropicConfig['model'][] =
  AnthropicProvider.getAvailableModels() as AnthropicConfig['model'][];
const OPENAI_MODELS: OpenAIConfig['model'][] =
  OpenAIProvider.getAvailableModels() as OpenAIConfig['model'][];
const GOOGLE_MODELS: GoogleConfig['model'][] =
  GoogleProvider.getAvailableModels() as GoogleConfig['model'][];
const PERPLEXITY_MODELS: PerplexityConfig['model'][] =
  PerplexityProvider.getAvailableModels() as PerplexityConfig['model'][];
const GROK_MODELS: GrokConfig['model'][] =
  GrokProvider.getAvailableModels() as GrokConfig['model'][];
const DEEPSEEK_MODELS: DeepSeekConfig['model'][] =
  DeepSeekProvider.getAvailableModels() as DeepSeekConfig['model'][];
const QWEN_MODELS: QwenConfig['model'][] =
  QwenProvider.getAvailableModels() as QwenConfig['model'][];

const isAnthropicModel = (model: string): model is AnthropicConfig['model'] =>
  ANTHROPIC_MODELS.includes(model as AnthropicConfig['model']);

const isOpenAIModel = (model: string): model is OpenAIConfig['model'] =>
  OPENAI_MODELS.includes(model as OpenAIConfig['model']);

const isGoogleModel = (model: string): model is GoogleConfig['model'] =>
  GOOGLE_MODELS.includes(model as GoogleConfig['model']);

const isPerplexityModel = (model: string): model is PerplexityConfig['model'] =>
  PERPLEXITY_MODELS.includes(model as PerplexityConfig['model']);

const isGrokModel = (model: string): model is GrokConfig['model'] =>
  GROK_MODELS.includes(model as GrokConfig['model']);

const isDeepSeekModel = (model: string): model is DeepSeekConfig['model'] =>
  DEEPSEEK_MODELS.includes(model as DeepSeekConfig['model']);

const isQwenModel = (model: string): model is QwenConfig['model'] =>
  QWEN_MODELS.includes(model as QwenConfig['model']);

/** Message role types supported by unified LLM service */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Metadata associated with unified messages */
export interface UnifiedMessageMetadata {
  sessionId?: string;
  userId?: string;
  employeeId?: string;
  employeeRole?: string;
  timestamp?: string;
  provider?: LLMProvider;
}

export interface UnifiedMessage {
  role: MessageRole;
  content: string;
  metadata?: UnifiedMessageMetadata;
}

/** Token usage information returned by LLM providers */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface UnifiedResponse {
  content: string;
  usage?: TokenUsage;
  model: string;
  provider: LLMProvider;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/** Perplexity-specific search recency filter options */
export type SearchRecencyFilter = 'day' | 'week' | 'month' | 'year';

/** Provider-specific configuration for Anthropic */
export interface AnthropicProviderConfig {
  tools?: AnthropicConfig['tools'];
}

/** Provider-specific configuration for OpenAI */
export interface OpenAIProviderConfig {
  tools?: OpenAIConfig['tools'];
}

/** Provider-specific configuration for Google */
export interface GoogleProviderConfig {
  tools?: GoogleConfig['tools'];
}

/** Provider-specific configuration for Perplexity */
export interface PerplexityProviderConfig {
  searchDomain?: string;
  searchRecencyFilter?: SearchRecencyFilter;
}

/** Provider-specific configuration for Grok */
export interface GrokProviderConfig {
  includeRealTimeData?: boolean;
}

export interface UnifiedConfig {
  provider: LLMProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  // Provider-specific configs
  anthropic?: AnthropicProviderConfig;
  openai?: OpenAIProviderConfig;
  google?: GoogleProviderConfig;
  perplexity?: PerplexityProviderConfig;
  grok?: GrokProviderConfig;
}

/** Provider-agnostic message format used internally */
interface ProviderMessage {
  role: MessageRole;
  content: string;
  metadata?: UnifiedMessageMetadata & { provider: LLMProvider };
}

/** Shape of provider response for type validation */
interface ProviderResponseShape {
  content: string;
  model: string;
  sessionId?: string;
  userId?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  metadata?: Record<string, unknown>;
}

/** Usage info in streaming format (snake_case from provider APIs) */
export interface StreamingUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

/** Streaming chunk returned by the streamMessage generator */
export interface StreamingChunk {
  content: string;
  done: boolean;
  usage?: StreamingUsage;
  provider: LLMProvider;
}

/** Error codes for unified LLM service */
export type UnifiedLLMErrorCode =
  | 'PROVIDER_NOT_FOUND'
  | 'UNSUPPORTED_PROVIDER'
  | 'PROMPT_INJECTION_DETECTED'
  | 'API_ABUSE_DETECTED'
  | 'REQUEST_TOO_LARGE'
  | 'TOO_MANY_MESSAGES'
  | 'INSUFFICIENT_TOKENS'
  | 'PROVIDER_ERROR'
  | 'PROVIDER_STREAMING_ERROR'
  | 'INVALID_RESPONSE';

export class UnifiedLLMError extends Error {
  public readonly name = 'UnifiedLLMError' as const;

  constructor(
    message: string,
    public readonly code: UnifiedLLMErrorCode | string,
    public readonly provider: LLMProvider,
    public readonly retryable: boolean = false
  ) {
    super(message);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnifiedLLMError);
    }
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
    this.providers.set('grok', grokProvider);
    this.providers.set('deepseek', deepseekProvider);
    this.providers.set('qwen', qwenProvider);
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
        case 'grok':
          response = await (providerInstance as GrokProvider).sendMessage(
            providerMessages as GrokMessage[],
            actualSessionId,
            actualUserId
          );
          break;
        case 'deepseek':
          response = await (providerInstance as DeepSeekProvider).sendMessage(
            providerMessages as DeepSeekMessage[],
            actualSessionId,
            actualUserId
          );
          break;
        case 'qwen':
          response = await (providerInstance as QwenProvider).sendMessage(
            providerMessages as QwenMessage[],
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
          logger.error(
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

      logger.error(
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

  /** Streaming chunk returned by the streamMessage generator */
  /**
   * Stream a message using the specified provider
   */
  async *streamMessage(
    messages: UnifiedMessage[],
    sessionId?: string,
    userId?: string,
    provider?: LLMProvider
  ): AsyncGenerator<StreamingChunk> {
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
      let stream: AsyncGenerator<Omit<StreamingChunk, 'provider'>>;
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
        case 'grok':
          stream = (providerInstance as GrokProvider).streamMessage(
            providerMessages as GrokMessage[],
            sessionId,
            userId
          );
          break;
        case 'deepseek':
          stream = (providerInstance as DeepSeekProvider).streamMessage(
            providerMessages as DeepSeekMessage[],
            sessionId,
            userId
          );
          break;
        case 'qwen':
          stream = (providerInstance as QwenProvider).streamMessage(
            providerMessages as QwenMessage[],
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
      logger.error(
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
   * @returns Array of provider-formatted messages
   */
  private convertMessagesToProvider(
    messages: UnifiedMessage[],
    provider: LLMProvider
  ): ProviderMessage[] {
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
   * Type guard to check if response has the expected provider response shape
   */
  private isProviderResponse(response: unknown): response is ProviderResponseShape {
    return (
      typeof response === 'object' &&
      response !== null &&
      'content' in response &&
      typeof (response as Record<string, unknown>).content === 'string' &&
      'model' in response &&
      typeof (response as Record<string, unknown>).model === 'string'
    );
  }

  /**
   * Convert provider response to unified format
   */
  private convertResponseToUnified(
    response: unknown,
    provider: LLMProvider
  ): UnifiedResponse {
    // Validate response shape
    if (!this.isProviderResponse(response)) {
      throw new UnifiedLLMError(
        'Invalid provider response format',
        'INVALID_RESPONSE',
        provider,
        false
      );
    }

    // Normalize usage information
    let usage: UnifiedResponse['usage'];
    if (response.usage) {
      if (provider === 'anthropic') {
        usage = {
          promptTokens: response.usage.inputTokens || 0,
          completionTokens: response.usage.outputTokens || 0,
          totalTokens: response.usage.totalTokens || 0,
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
      case 'grok':
        {
          const update: Partial<GrokConfig> = {
            maxTokens: this.config.maxTokens,
            temperature: this.config.temperature,
            systemPrompt: this.config.systemPrompt,
            includeRealTimeData: this.config.grok?.includeRealTimeData,
          };
          if (isGrokModel(this.config.model)) {
            update.model = this.config.model;
          }
          (providerInstance as GrokProvider).updateConfig(update);
        }
        break;
      case 'deepseek':
        {
          const update: Partial<DeepSeekConfig> = {
            maxTokens: this.config.maxTokens,
            temperature: this.config.temperature,
            systemPrompt: this.config.systemPrompt,
          };
          if (isDeepSeekModel(this.config.model)) {
            update.model = this.config.model;
          }
          (providerInstance as DeepSeekProvider).updateConfig(update);
        }
        break;
      case 'qwen':
        {
          const update: Partial<QwenConfig> = {
            maxTokens: this.config.maxTokens,
            temperature: this.config.temperature,
            systemPrompt: this.config.systemPrompt,
          };
          if (isQwenModel(this.config.model)) {
            update.model = this.config.model;
          }
          (providerInstance as QwenProvider).updateConfig(update);
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
      case 'grok':
        return (providerInstance as GrokProvider).isConfigured();
      case 'deepseek':
        return (providerInstance as DeepSeekProvider).isConfigured();
      case 'qwen':
        return (providerInstance as QwenProvider).isConfigured();
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
      case 'grok':
        return GrokProvider.getAvailableModels();
      case 'deepseek':
        return DeepSeekProvider.getAvailableModels();
      case 'qwen':
        return QwenProvider.getAvailableModels();
      default:
        return [];
    }
  }

  /**
   * Get provider instance
   * SECURITY FIX: Jan 15th 2026 - Added undefined to return type since Map.get() can return undefined
   */
  getProvider(
    provider: LLMProvider
  ):
    | AnthropicProvider
    | GoogleProvider
    | OpenAIProvider
    | PerplexityProvider
    | GrokProvider
    | DeepSeekProvider
    | QwenProvider
    | undefined {
    return this.providers.get(provider);
  }

  /**
   * Get all available providers
   */
  static getAllProviders(): LLMProvider[] {
    return [
      'anthropic',
      'openai',
      'google',
      'perplexity',
      'grok',
      'deepseek',
      'qwen',
    ];
  }
}

// Export singleton instance
export const unifiedLLMService = new UnifiedLLMService();
