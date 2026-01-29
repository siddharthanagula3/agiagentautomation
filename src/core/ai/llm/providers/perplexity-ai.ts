/**
 * Perplexity Provider
 * Official SDK integration for Perplexity AI Sonar models
 * Updated: Jan 3rd 2026 - Updated to latest Sonar models
 */

import { supabase } from '@shared/lib/supabase-client';
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
    logger.error('[Perplexity Provider] Failed to get auth token:', error);
    return null;
  }
}

// All API calls use Netlify proxy functions for security
// Proxy endpoints: /.netlify/functions/llm-proxies/perplexity-proxy

export interface PerplexityMessage {
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

export interface PerplexityResponse {
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
  SUPPORTED_PERPLEXITY_MODELS,
  DEFAULT_PERPLEXITY_MODEL,
  type PerplexityModel,
} from '@shared/config/supported-models';

export interface PerplexityConfig {
  model: PerplexityModel;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  searchDomain?: string;
  searchRecencyFilter?: 'day' | 'week' | 'month' | 'year';
  reasoningEffort?: 'low' | 'medium' | 'high'; // For deep-research model
}

/** Error codes specific to Perplexity provider */
export type PerplexityErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'INVALID_API_KEY'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMIT'
  | 'CLIENT_NOT_INITIALIZED'
  | 'DIRECT_API_DISABLED'
  | 'NO_USER_MESSAGE'
  | 'REQUEST_FAILED'
  | 'STREAMING_FAILED'
  | `HTTP_${number}`;

export class PerplexityError extends Error {
  public readonly name = 'PerplexityError' as const;

  constructor(
    message: string,
    public readonly code: PerplexityErrorCode | string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PerplexityError);
    }
  }
}

export class PerplexityProvider {
  private config: PerplexityConfig;

  constructor(config: Partial<PerplexityConfig> = {}) {
    this.config = {
      model: DEFAULT_PERPLEXITY_MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt:
        'You are a helpful AI assistant with access to real-time web search.',
      searchDomain: undefined,
      searchRecencyFilter: undefined,
      ...config,
    };
  }

  /**
   * Send a message to Perplexity
   */
  async sendMessage(
    messages: PerplexityMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<PerplexityResponse> {
    try {
      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/llm-proxies/perplexity-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new PerplexityError(
          'User not authenticated. Please log in to use AI features.',
          'NOT_AUTHENTICATED'
        );
      }

      // Convert messages to Perplexity format
      const perplexityMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          messages: perplexityMessages,
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: this.config.systemPrompt,
          search_domain_filter: this.config.searchDomain,
          search_recency_filter: this.config.searchRecencyFilter,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new PerplexityError(
          errorData.error || `HTTP error! status: ${response.status}`,
          `HTTP_${response.status}`,
          response.status === 429 || response.status === 503
        );
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
            provider: 'perplexity',
            model: this.config.model,
            usage,
            searchDomain: this.config.searchDomain,
            searchRecencyFilter: this.config.searchRecencyFilter,
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
          finishReason: data.choices?.[0]?.finish_reason,
          usage: data.usage || usage,
          citations: data.citations || [],
        },
      };
    } catch (error) {
      logger.error('[Perplexity Provider] Error:', error);

      if (error instanceof Error) {
        // Check for specific Perplexity API errors
        if (
          error.message.includes('API_KEY_INVALID') ||
          error.message.includes('401')
        ) {
          throw new PerplexityError(
            'Invalid Perplexity API key. Please check your VITE_PERPLEXITY_API_KEY.',
            'INVALID_API_KEY'
          );
        }

        if (
          error.message.includes('QUOTA_EXCEEDED') ||
          error.message.includes('429')
        ) {
          throw new PerplexityError(
            'Perplexity API quota exceeded. Please try again later.',
            'QUOTA_EXCEEDED',
            true
          );
        }

        if (error.message.includes('RATE_LIMIT')) {
          throw new PerplexityError(
            'Rate limit exceeded. Please try again later.',
            'RATE_LIMIT',
            true
          );
        }
      }

      throw new PerplexityError(
        `Perplexity request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REQUEST_FAILED',
        true
      );
    }
  }

  /**
   * Stream a message from Perplexity
   */
  async *streamMessage(
    messages: PerplexityMessage[],
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
      // SECURITY: Direct API calls are disabled - use Netlify proxy instead
      throw new PerplexityError(
        'Direct Perplexity streaming is disabled for security. Use /.netlify/functions/llm-proxies/perplexity-proxy instead.',
        'DIRECT_API_DISABLED'
      );

      // Convert messages to Perplexity format
      const prompt = this.convertMessagesToPerplexity(messages);

      // Prepare the request
      const request = {
        model: this.config.model,
        messages: [
          {
            role: 'system' as const,
            content:
              this.config.systemPrompt ||
              'You are a helpful AI assistant with access to real-time web search.',
          },
          {
            role: 'user' as const,
            content: prompt,
          },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        search_domain_filter: this.config.searchDomain,
        search_recency_filter: this.config.searchRecencyFilter,
        stream: true,
      };

      // Make the streaming API call
      if (!perplexity) {
        throw new PerplexityError(
          'Perplexity client not initialized. Please check your API key configuration.',
          'CLIENT_NOT_INITIALIZED'
        );
      }
      const stream = await perplexity.chat.completions.create(request);

      let fullContent = '';
      let usage: unknown = null;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          yield { content, done: false };
        }

        if (chunk.choices[0]?.finish_reason) {
          usage = chunk.usage;
          yield { content: '', done: true, usage };
        }
      }

      // Save to database
      if (sessionId && userId) {
        await this.saveMessageToDatabase({
          sessionId,
          userId,
          role: 'assistant',
          content: fullContent,
          metadata: {
            provider: 'perplexity',
            model: this.config.model,
            usage,
            searchDomain: this.config.searchDomain,
            searchRecencyFilter: this.config.searchRecencyFilter,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      logger.error('[Perplexity Provider] Streaming error:', error);

      if (error instanceof Error) {
        if (
          error.message.includes('API_KEY_INVALID') ||
          error.message.includes('401')
        ) {
          throw new PerplexityError(
            'Invalid Perplexity API key. Please check your VITE_PERPLEXITY_API_KEY.',
            'INVALID_API_KEY'
          );
        }

        if (
          error.message.includes('QUOTA_EXCEEDED') ||
          error.message.includes('429')
        ) {
          throw new PerplexityError(
            'Perplexity API quota exceeded. Please try again later.',
            'QUOTA_EXCEEDED',
            true
          );
        }
      }

      throw new PerplexityError(
        `Perplexity streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STREAMING_FAILED',
        true
      );
    }
  }

  /**
   * Convert our message format to Perplexity format
   */
  private convertMessagesToPerplexity(messages: PerplexityMessage[]): string {
    // For Perplexity, we typically send the last user message as the prompt
    // since it's designed for single-turn interactions with web search
    const lastUserMessage = messages.filter((msg) => msg.role === 'user').pop();

    if (!lastUserMessage) {
      throw new PerplexityError('No user message found', 'NO_USER_MESSAGE');
    }

    return lastUserMessage.content;
  }

  /**
   * Type for Perplexity API response structure
   */
  private isPerplexityApiResponse(response: unknown): response is {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    citations?: unknown[];
  } {
    return typeof response === 'object' && response !== null;
  }

  /**
   * Extract content from Perplexity response
   */
  private extractContentFromResponse(response: unknown): string {
    if (!this.isPerplexityApiResponse(response)) {
      return '';
    }
    return response.choices?.[0]?.message?.content || '';
  }

  /**
   * Extract usage information from Perplexity response
   */
  private extractUsageFromResponse(response: unknown): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    if (!this.isPerplexityApiResponse(response) || !response.usage) {
      return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }
    return {
      promptTokens: response.usage.prompt_tokens || 0,
      completionTokens: response.usage.completion_tokens || 0,
      totalTokens: response.usage.total_tokens || 0,
    };
  }

  /**
   * Extract citations from Perplexity response
   */
  private extractCitationsFromResponse(response: unknown): unknown[] {
    // Perplexity responses may include citations from web search
    // This would need to be implemented based on the actual response structure
    if (!this.isPerplexityApiResponse(response)) {
      return [];
    }
    return response.citations || [];
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
        logger.error('[Perplexity Provider] Error saving message:', error);
      }
    } catch (error) {
      logger.error(
        '[Perplexity Provider] Unexpected error saving message:',
        error
      );
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerplexityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): PerplexityConfig {
    return { ...this.config };
  }

  /**
   * Check if API key is configured
   * SECURITY: Always returns false as direct API access is disabled
   */
  isConfigured(): boolean {
    return true; // Proxy-based access is always available
  }

  /**
   * Get available models (Jan 2026)
   * Uses shared config from @shared/config/supported-models.ts
   */
  static getAvailableModels(): string[] {
    return [...SUPPORTED_PERPLEXITY_MODELS];
  }

  /**
   * Get models by capability
   */
  static getModelsByCapability(): Record<string, string[]> {
    return {
      search: ['sonar', 'sonar-pro'],
      reasoning: ['sonar-reasoning', 'sonar-reasoning-pro'],
      research: ['sonar-deep-research'],
    };
  }
}

// Export singleton instance
export const perplexityProvider = new PerplexityProvider();
