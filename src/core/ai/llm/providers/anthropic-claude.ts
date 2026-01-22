/**
 * Anthropic Claude Provider
 * Official SDK integration for Claude AI models
 * Updated: Jan 3rd 2026 - Updated to Claude 4.5 series (Opus, Sonnet, Haiku)
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@shared/lib/supabase-client';
import { toast } from 'sonner';

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
    console.error('[Anthropic Provider] Failed to get auth token:', error);
    return null;
  }
}

// SECURITY WARNING: Client-side API initialization is disabled
// All API calls should go through Netlify proxy functions instead
// Environment variables with VITE_ prefix are exposed to the browser (security risk)

// DEPRECATED: Direct client-side initialization (security risk)
// const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

// Initialize clients - DISABLED for security
const anthropic = null; // Client-side SDK disabled - use Netlify proxy instead

// ✅ IMPLEMENTED: All API calls use Netlify proxy functions for security
// Proxy endpoints: /.netlify/functions/llm-proxies/anthropic-proxy

// Using centralized Supabase client

export interface AnthropicMessage {
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

export interface AnthropicResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

import {
  SUPPORTED_ANTHROPIC_MODELS,
  DEFAULT_ANTHROPIC_MODEL,
  type AnthropicModel,
} from '@shared/config/supported-models';

export interface AnthropicConfig {
  model: AnthropicModel;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  tools?: Anthropic.Tool[];
  computerUse?: boolean; // Enable computer use capabilities
  extendedThinking?: boolean; // Enable extended thinking mode
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

export class AnthropicError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AnthropicError';
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
    throw new AnthropicError(
      'Insufficient tokens. Please upgrade your plan or purchase more tokens.',
      'PAYMENT_REQUIRED',
      false,
      402
    );
  }

  if (status === 429) {
    // Rate Limit - Will be handled with retry logic in the calling function
    throw new AnthropicError(
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
    throw new AnthropicError(
      'The AI service timed out. Please try again.',
      'GATEWAY_TIMEOUT',
      true,
      504
    );
  }

  // Generic HTTP error
  const errorMessage =
    (errorData.error as string) || `HTTP error! status: ${status}`;
  throw new AnthropicError(
    errorMessage,
    `HTTP_${status}`,
    status === 503, // 503 is also retryable
    status
  );
}

export class AnthropicProvider {
  private config: AnthropicConfig;

  constructor(config: Partial<AnthropicConfig> = {}) {
    this.config = {
      model: DEFAULT_ANTHROPIC_MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      tools: [],
      computerUse: false,
      extendedThinking: false,
      ...config,
    };
  }

  /**
   * Send a message to Claude with retry logic for rate limits
   */
  async sendMessage(
    messages: AnthropicMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<AnthropicResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        return await this.executeRequest(messages, sessionId, userId);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[Anthropic Provider] Attempt ${attempt + 1} failed:`,
          error
        );

        // Check if error is retryable (rate limit)
        if (error instanceof AnthropicError && error.statusCode === 429) {
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
      lastError ||
      new AnthropicError('Unknown error occurred', 'UNKNOWN', false)
    );
  }

  /**
   * Execute the actual API request
   */
  private async executeRequest(
    messages: AnthropicMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<AnthropicResponse> {
    try {
      // Convert messages to Anthropic format
      const anthropicMessages = this.convertMessagesToAnthropic(messages);

      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/llm-proxies/anthropic-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new AnthropicError(
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
          messages: anthropicMessages,
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: this.config.systemPrompt,
          tools:
            this.config.tools && this.config.tools.length > 0
              ? this.config.tools
              : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        handleHttpError(response.status, errorData);
      }

      const data = await response.json();

      // Extract content and usage from proxy response
      const content =
        data.content ||
        (Array.isArray(data.content) ? data.content[0]?.text : '');
      const usage = data.usage
        ? {
            inputTokens: data.usage.input_tokens || 0,
            outputTokens: data.usage.output_tokens || 0,
            totalTokens:
              (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
          }
        : { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

      // Save to database
      if (sessionId && userId) {
        await this.saveMessageToDatabase({
          sessionId,
          userId,
          role: 'assistant',
          content,
          metadata: {
            provider: 'anthropic',
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
          stopReason: data.stop_reason,
          usage: data.usage,
        },
      };
    } catch (error) {
      console.error('[Anthropic Provider] Error:', error);

      // Re-throw AnthropicError instances as-is
      if (error instanceof AnthropicError) {
        throw error;
      }

      if (error instanceof Anthropic.APIError) {
        // Handle specific status codes from SDK errors
        if (
          error.status === 402 ||
          error.status === 429 ||
          error.status === 504
        ) {
          handleHttpError(error.status, { error: error.message });
        }
        throw new AnthropicError(
          `Anthropic API error: ${error.message}`,
          error.status?.toString() || 'API_ERROR',
          error.status === 429 || error.status === 503,
          error.status
        );
      }

      throw new AnthropicError(
        `Anthropic request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REQUEST_FAILED',
        true
      );
    }
  }

  /**
   * Stream a message from Claude with retry logic for rate limits
   * Uses Netlify proxy with simulated streaming (full response yielded in chunks)
   * Note: True SSE streaming through proxy is not yet supported by Netlify Functions
   */
  async *streamMessage(
    messages: AnthropicMessage[],
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
        console.error(
          `[Anthropic Provider] Stream attempt ${attempt + 1} failed:`,
          error
        );

        // Check if error is retryable (rate limit)
        if (error instanceof AnthropicError && error.statusCode === 429) {
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
      lastError ||
      new AnthropicError('Unknown error occurred', 'UNKNOWN', false)
    );
  }

  /**
   * Execute the actual streaming request
   */
  private async *executeStreamRequest(
    messages: AnthropicMessage[],
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
      // Convert messages to Anthropic format
      const anthropicMessages = this.convertMessagesToAnthropic(messages);

      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/llm-proxies/anthropic-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new AnthropicError(
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
          messages: anthropicMessages,
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: this.config.systemPrompt,
          tools:
            this.config.tools && this.config.tools.length > 0
              ? this.config.tools
              : undefined,
          // Note: Netlify proxy doesn't support true SSE streaming yet
          // When proxy streaming is implemented, set stream: true here
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        handleHttpError(response.status, errorData);
      }

      const data = await response.json();

      // Extract content from proxy response
      const fullContent =
        data.content ||
        (Array.isArray(data.content) ? data.content[0]?.text : '') ||
        '';

      // Extract usage information
      const usage = data.usage
        ? {
            prompt_tokens: data.usage.input_tokens || 0,
            completion_tokens: data.usage.output_tokens || 0,
            total_tokens:
              (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
          }
        : undefined;

      // Yield the full response (simulating streaming)
      // When true streaming is supported, this will yield chunks as they arrive
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
            provider: 'anthropic',
            model: this.config.model,
            usage,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('[Anthropic Provider] Streaming error:', error);

      // Re-throw AnthropicError instances as-is
      if (error instanceof AnthropicError) {
        throw error;
      }

      if (error instanceof Anthropic.APIError) {
        // Handle specific status codes from SDK errors
        if (
          error.status === 402 ||
          error.status === 429 ||
          error.status === 504
        ) {
          handleHttpError(error.status, { error: error.message });
        }
      }

      throw new AnthropicError(
        `Anthropic streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STREAMING_FAILED',
        true
      );
    }
  }

  /**
   * Convert our message format to Anthropic format
   */
  private convertMessagesToAnthropic(
    messages: AnthropicMessage[]
  ): Anthropic.Messages.MessageParam[] {
    return messages
      .filter((msg) => msg.role !== 'system') // System messages are handled separately
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
  }

  /**
   * Extract content from Anthropic response
   */
  private extractContentFromResponse(
    response: Anthropic.Messages.Message
  ): string {
    if (response.content && response.content.length > 0) {
      return response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as Anthropic.Messages.TextBlock).text)
        .join('');
    }
    return '';
  }

  /**
   * Extract usage information from Anthropic response
   */
  private extractUsageFromResponse(response: Anthropic.Messages.Message): {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  } {
    if (response.usage) {
      return {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      };
    }
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
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
        console.error('[Anthropic Provider] Error saving message:', error);
      }
    } catch (error) {
      console.error(
        '[Anthropic Provider] Unexpected error saving message:',
        error
      );
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AnthropicConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AnthropicConfig {
    return { ...this.config };
  }

  /**
   * Check if provider is configured
   * Returns true since we use Netlify proxy (API key is on server-side)
   */
  isConfigured(): boolean {
    return true; // Proxy-based access is always available
  }

  /**
   * Get available models (Jan 2026 - Claude 4.5 series)
   * Uses shared config from @shared/config/supported-models.ts
   */
  static getAvailableModels(): string[] {
    return [...SUPPORTED_ANTHROPIC_MODELS];
  }

  /**
   * Get models with computer use capability
   */
  static getComputerUseModels(): string[] {
    return [
      'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5-20251001',
      'claude-opus-4-5-20251101',
    ];
  }

  /**
   * Get model aliases for convenience
   */
  static getModelAliases(): Record<string, string> {
    return {
      'claude-opus-4-5': 'claude-opus-4-5-20251101',
      'claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
    };
  }
}

// Export singleton instance
export const anthropicProvider = new AnthropicProvider();
