/**
 * OpenAI ChatGPT Provider
 * Official SDK integration for OpenAI GPT models
 * Updated: Jan 3rd 2026 - Updated to GPT-5.2, o3, Sora 2, gpt-image-1.5
 */

import OpenAI from 'openai';
import { supabase } from '@shared/lib/supabase-client';
import { toast } from 'sonner';
import { logger } from '@shared/lib/logger';

/**
 * Helper function to get the current Supabase session token
 * Required for authenticated API proxy calls
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    logger.error('[OpenAI Provider] Failed to get auth token:', error);
    return null;
  }
}

// All API calls use Netlify proxy functions for security
// Proxy endpoints: /.netlify/functions/llm-proxies/openai-proxy

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sessionId?: string;
    userId?: string;
    employeeId?: string;
    employeeRole?: string;
    timestamp?: string;
  };
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

import {
  SUPPORTED_OPENAI_MODELS,
  SUPPORTED_OPENAI_IMAGE_MODELS,
  SUPPORTED_OPENAI_VIDEO_MODELS,
  SUPPORTED_OPENAI_AUDIO_MODELS,
  DEFAULT_OPENAI_MODEL,
  type OpenAIModel,
} from '@shared/config/supported-models';

export interface OpenAIConfig {
  model: OpenAIModel;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
}

/**
 * HTTP Error Messages for user-friendly display
 */
const HTTP_ERROR_MESSAGES: Record<
  number,
  { title: string; message: string; action?: string }
> = {
  402: {
    title: 'Insufficient Tokens',
    message:
      'You have run out of AI tokens. Please upgrade your plan or purchase more tokens to continue.',
    action: 'Upgrade Plan',
  },
  429: {
    title: 'Rate Limit Exceeded',
    message: 'Too many requests. Please wait a moment before trying again.',
  },
  504: {
    title: 'Request Timeout',
    message: 'The AI service took too long to respond. Please try again.',
  },
};

/**
 * Exponential backoff retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelayMs
  );
  // Add jitter (0-25% of delay)
  const jitter = delay * Math.random() * 0.25;
  return delay + jitter;
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Error codes specific to OpenAI provider */
export type OpenAIErrorCode =
  | 'PAYMENT_REQUIRED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'GATEWAY_TIMEOUT'
  | 'NOT_AUTHENTICATED'
  | 'API_ERROR'
  | 'REQUEST_FAILED'
  | 'STREAMING_FAILED'
  | `HTTP_${number}`;

export class OpenAIError extends Error {
  public readonly name = 'OpenAIError' as const;

  constructor(
    message: string,
    public readonly code: OpenAIErrorCode | string,
    public readonly retryable: boolean = false,
    public readonly statusCode?: number
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OpenAIError);
    }
  }
}

/**
 * Handle HTTP error responses with user-friendly messages
 */
function handleHttpError(
  status: number,
  errorData: Record<string, unknown>
): never {
  const errorInfo = HTTP_ERROR_MESSAGES[status];

  if (status === 402) {
    // Payment Required - Insufficient tokens
    toast.error(errorInfo.title, {
      description: errorInfo.message,
      action: errorInfo.action
        ? {
            label: errorInfo.action,
            onClick: () => {
              // Navigate to billing page
              window.location.href = '/settings/billing';
            },
          }
        : undefined,
      duration: 10000, // Show for 10 seconds
    });
    throw new OpenAIError(
      'Insufficient tokens. Please upgrade your plan or purchase more tokens.',
      'PAYMENT_REQUIRED',
      false,
      402
    );
  }

  if (status === 429) {
    // Rate Limit - Will be handled with retry logic in the calling function
    throw new OpenAIError(
      'Rate limit exceeded. Please wait before making more requests.',
      'RATE_LIMIT_EXCEEDED',
      true,
      429
    );
  }

  if (status === 504) {
    // Gateway Timeout
    toast.error(errorInfo.title, {
      description: errorInfo.message,
      action: {
        label: 'Retry',
        onClick: () => {
          // User can manually retry
          window.location.reload();
        },
      },
      duration: 8000,
    });
    throw new OpenAIError(
      'The AI service timed out. Please try again.',
      'GATEWAY_TIMEOUT',
      true,
      504
    );
  }

  // Generic HTTP error
  const errorMessage =
    (errorData.error as string) || `HTTP error! status: ${status}`;
  throw new OpenAIError(
    errorMessage,
    `HTTP_${status}`,
    status === 503, // 503 is also retryable
    status
  );
}

export class OpenAIProvider {
  private config: OpenAIConfig;

  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = {
      model: DEFAULT_OPENAI_MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      tools: [],
      ...config,
    };
  }

  /**
   * Send a message to OpenAI with retry logic for rate limits
   */
  async sendMessage(
    messages: OpenAIMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<OpenAIResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        return await this.executeRequest(messages, sessionId, userId);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(
          `[OpenAI Provider] Attempt ${attempt + 1} failed:`,
          error
        );

        // Check if error is retryable (rate limit)
        if (error instanceof OpenAIError && error.statusCode === 429) {
          if (attempt < RETRY_CONFIG.maxRetries) {
            const delay = calculateBackoffDelay(attempt);

            // Show toast notification about retry
            toast.info('Rate limit reached', {
              description: `Waiting ${Math.round(delay / 1000)} seconds before retry (attempt ${attempt + 2}/${RETRY_CONFIG.maxRetries + 1})`,
              duration: delay,
            });

            await sleep(delay);
            continue;
          } else {
            // Max retries exceeded for rate limit
            toast.error(HTTP_ERROR_MESSAGES[429].title, {
              description:
                'Maximum retry attempts reached. Please try again later.',
              duration: 8000,
            });
          }
        }

        // Non-retryable error or max retries exceeded
        throw error;
      }
    }

    // Should not reach here, but TypeScript needs this
    throw (
      lastError || new OpenAIError('Unknown error occurred', 'UNKNOWN', false)
    );
  }

  /**
   * Execute the actual API request
   */
  private async executeRequest(
    messages: OpenAIMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<OpenAIResponse> {
    try {
      // Convert messages to OpenAI format
      const openaiMessages = this.convertMessagesToOpenAI(messages);

      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/llm-proxies/openai-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new OpenAIError(
          'User not authenticated. Please log in to use AI features.',
          'NOT_AUTHENTICATED'
        );
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          messages: openaiMessages,
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          tools:
            this.config.tools && this.config.tools.length > 0
              ? this.config.tools
              : undefined,
          tool_choice:
            this.config.tools && this.config.tools.length > 0
              ? 'auto'
              : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        handleHttpError(response.status, errorData);
      }

      const data = await response.json();

      // Extract content and usage from proxy response
      const content = data.content || data.choices?.[0]?.message?.content || '';
      const usage = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      // Save to database
      if (sessionId && userId) {
        await this.saveMessageToDatabase({
          sessionId,
          userId,
          role: 'assistant',
          content,
          metadata: {
            provider: 'openai',
            model: this.config.model,
            usage,
            responseId: data.id,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return {
        content,
        usage,
        model: this.config.model,
        sessionId,
        userId,
        metadata: {
          responseId: data.id,
          finishReason: data.choices?.[0]?.finish_reason,
          usage: data.usage,
        },
      };
    } catch (error) {
      logger.error('[OpenAI Provider] Error:', error);

      // Re-throw OpenAIError instances as-is
      if (error instanceof OpenAIError) {
        throw error;
      }

      if (error instanceof OpenAI.APIError) {
        // Handle specific status codes from SDK errors
        if (
          error.status === 402 ||
          error.status === 429 ||
          error.status === 504
        ) {
          handleHttpError(error.status, { error: error.message });
        }
        throw new OpenAIError(
          `OpenAI API error: ${error.message}`,
          error.status?.toString() || 'API_ERROR',
          error.status === 429 || error.status === 503,
          error.status
        );
      }

      throw new OpenAIError(
        `OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REQUEST_FAILED',
        true
      );
    }
  }

  /**
   * Stream a message from OpenAI with retry logic for rate limits
   */
  async *streamMessage(
    messages: OpenAIMessage[],
    sessionId?: string,
    userId?: string
  ): AsyncGenerator<{
    content: string;
    done: boolean;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        // Use yield* to delegate to the inner generator
        yield* this.executeStreamRequest(messages, sessionId, userId);
        return; // Success - exit the retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(
          `[OpenAI Provider] Stream attempt ${attempt + 1} failed:`,
          error
        );

        // Check if error is retryable (rate limit)
        if (error instanceof OpenAIError && error.statusCode === 429) {
          if (attempt < RETRY_CONFIG.maxRetries) {
            const delay = calculateBackoffDelay(attempt);

            // Show toast notification about retry
            toast.info('Rate limit reached', {
              description: `Waiting ${Math.round(delay / 1000)} seconds before retry (attempt ${attempt + 2}/${RETRY_CONFIG.maxRetries + 1})`,
              duration: delay,
            });

            await sleep(delay);
            continue;
          } else {
            // Max retries exceeded for rate limit
            toast.error(HTTP_ERROR_MESSAGES[429].title, {
              description:
                'Maximum retry attempts reached. Please try again later.',
              duration: 8000,
            });
          }
        }

        // Non-retryable error or max retries exceeded
        throw error;
      }
    }

    // Should not reach here, but TypeScript needs this
    throw (
      lastError || new OpenAIError('Unknown error occurred', 'UNKNOWN', false)
    );
  }

  /**
   * Execute the actual streaming request
   */
  private async *executeStreamRequest(
    messages: OpenAIMessage[],
    sessionId?: string,
    userId?: string
  ): AsyncGenerator<{
    content: string;
    done: boolean;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  }> {
    try {
      // Convert messages to OpenAI format
      const openaiMessages = this.convertMessagesToOpenAI(messages);

      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/llm-proxies/openai-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new OpenAIError(
          'User not authenticated. Please log in to use AI features.',
          'NOT_AUTHENTICATED'
        );
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          messages: openaiMessages,
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          tools:
            this.config.tools && this.config.tools.length > 0
              ? this.config.tools
              : undefined,
          tool_choice:
            this.config.tools && this.config.tools.length > 0
              ? 'auto'
              : undefined,
          stream: false, // Note: Netlify proxy doesn't support streaming yet, using non-streaming for now
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        handleHttpError(response.status, errorData);
      }

      const data = await response.json();
      const fullContent =
        data.content || data.choices?.[0]?.message?.content || '';
      const usage = data.usage;

      // Yield the full response at once (simulating streaming)
      yield { content: fullContent, done: false };
      yield { content: '', done: true, usage };

      // Save to database
      if (sessionId && userId) {
        await this.saveMessageToDatabase({
          sessionId,
          userId,
          role: 'assistant',
          content: fullContent,
          metadata: {
            provider: 'openai',
            model: this.config.model,
            usage,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      logger.error('[OpenAI Provider] Streaming error:', error);

      // Re-throw OpenAIError instances as-is
      if (error instanceof OpenAIError) {
        throw error;
      }

      if (error instanceof OpenAI.APIError) {
        // Handle specific status codes from SDK errors
        if (
          error.status === 402 ||
          error.status === 429 ||
          error.status === 504
        ) {
          handleHttpError(error.status, { error: error.message });
        }
      }

      throw new OpenAIError(
        `OpenAI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STREAMING_FAILED',
        true
      );
    }
  }

  /**
   * Convert our message format to OpenAI format
   */
  private convertMessagesToOpenAI(
    messages: OpenAIMessage[]
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Extract content from OpenAI response
   */
  private extractContentFromResponse(
    response: OpenAI.Chat.Completions.ChatCompletion
  ): string {
    return response.choices[0]?.message?.content || '';
  }

  /**
   * Extract usage information from OpenAI response
   */
  private extractUsageFromResponse(
    response: OpenAI.Chat.Completions.ChatCompletion
  ): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    if (response.usage) {
      return {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      };
    }
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  /**
   * Save message to database
   */
  private async saveMessageToDatabase(message: {
    sessionId: string;
    userId: string;
    role: string;
    content: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    try {
      const { error } = await supabase.from('agent_messages').insert({
        session_id: message.sessionId,
        user_id: message.userId,
        role: message.role,
        content: message.content,
        metadata: message.metadata,
        created_at: new Date().toISOString(),
      });

      if (error) {
        logger.error('[OpenAI Provider] Error saving message:', error);
      }
    } catch (error) {
      logger.error(
        '[OpenAI Provider] Unexpected error saving message:',
        error
      );
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): OpenAIConfig {
    return { ...this.config };
  }

  /**
   * Check if API key is configured
   * SECURITY: API keys are managed by Netlify proxy functions
   */
  isConfigured(): boolean {
    return true; // API keys managed securely by Netlify proxy
  }

  /**
   * Get available models (Jan 2026)
   * Uses shared config from @shared/config/supported-models.ts
   */
  static getAvailableModels(): string[] {
    return [...SUPPORTED_OPENAI_MODELS];
  }

  /**
   * Get available image models
   */
  static getImageModels(): string[] {
    return [...SUPPORTED_OPENAI_IMAGE_MODELS];
  }

  /**
   * Get available video models (Sora)
   */
  static getVideoModels(): string[] {
    return [...SUPPORTED_OPENAI_VIDEO_MODELS];
  }

  /**
   * Get available audio models
   */
  static getAudioModels(): string[] {
    return [...SUPPORTED_OPENAI_AUDIO_MODELS];
  }
}

// Export singleton instance
export const openaiProvider = new OpenAIProvider();
