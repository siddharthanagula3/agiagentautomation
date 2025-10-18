/**
 * Perplexity Provider
 * Official SDK integration for Perplexity AI models
 */

import { Perplexity } from '@perplexity-ai/perplexity_ai';
import { supabase } from '@shared/lib/supabase-client';

// Environment variables
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize clients
const perplexity = PERPLEXITY_API_KEY
  ? new Perplexity({
      apiKey: PERPLEXITY_API_KEY,
      dangerouslyAllowBrowser: true, // Allow browser usage for client-side
    })
  : null;

// Using centralized Supabase client

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

export interface PerplexityConfig {
  model:
    | 'llama-3.1-sonar-small-128k-online'
    | 'llama-3.1-sonar-large-128k-online'
    | 'llama-3.1-sonar-huge-128k-online';
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  searchDomain?: string;
  searchRecencyFilter?: 'day' | 'week' | 'month' | 'year';
}

export class PerplexityError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PerplexityError';
  }
}

export class PerplexityProvider {
  private config: PerplexityConfig;

  constructor(config: Partial<PerplexityConfig> = {}) {
    this.config = {
      model: 'llama-3.1-sonar-small-128k-online',
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
      if (!PERPLEXITY_API_KEY) {
        throw new PerplexityError(
          'Perplexity API key not configured. Please add VITE_PERPLEXITY_API_KEY to your environment variables.',
          'API_KEY_MISSING'
        );
      }

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
      };

      // Make the API call
      if (!perplexity) {
        throw new PerplexityError(
          'Perplexity client not initialized. Please check your API key configuration.',
          'CLIENT_NOT_INITIALIZED'
        );
      }
      const response = await perplexity.chat.completions.create(request);

      // Process the response
      const content = this.extractContentFromResponse(response);
      const usage = this.extractUsageFromResponse(response);

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
          finishReason: response.choices[0]?.finish_reason,
          usage: response.usage,
          citations: this.extractCitationsFromResponse(response),
        },
      };
    } catch (error) {
      console.error('[Perplexity Provider] Error:', error);

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
      if (!PERPLEXITY_API_KEY) {
        throw new PerplexityError(
          'Perplexity API key not configured. Please add VITE_PERPLEXITY_API_KEY to your environment variables.',
          'API_KEY_MISSING'
        );
      }

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
      console.error('[Perplexity Provider] Streaming error:', error);

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
   * Extract content from Perplexity response
   */
  private extractContentFromResponse(response: unknown): string {
    return response.choices[0]?.message?.content || '';
  }

  /**
   * Extract usage information from Perplexity response
   */
  private extractUsageFromResponse(response: unknown): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    if (response.usage) {
      return {
        promptTokens: response.usage.prompt_tokens || 0,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0,
      };
    }
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  /**
   * Extract citations from Perplexity response
   */
  private extractCitationsFromResponse(response: unknown): unknown[] {
    // Perplexity responses may include citations from web search
    // This would need to be implemented based on the actual response structure
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
        console.error('[Perplexity Provider] Error saving message:', error);
      }
    } catch (error) {
      console.error(
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
   */
  isConfigured(): boolean {
    return !!PERPLEXITY_API_KEY;
  }

  /**
   * Get available models
   */
  static getAvailableModels(): string[] {
    return [
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-huge-128k-online',
    ];
  }
}

// Export singleton instance
export const perplexityProvider = new PerplexityProvider();
