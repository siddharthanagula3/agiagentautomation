/**
 * Anthropic Claude Provider
 * Official SDK integration for Claude AI models
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase-client';

// Environment variables
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize clients
const anthropic = ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true, // Allow browser usage for client-side
    })
  : null;

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
  metadata?: Record<string, any>;
}

export interface AnthropicConfig {
  model:
    | 'claude-3-5-sonnet-20241022'
    | 'claude-3-5-haiku-20241022'
    | 'claude-3-opus-20240229'
    | 'claude-3-sonnet-20240229'
    | 'claude-3-haiku-20240307';
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  tools?: Anthropic.Tool[];
}

export class AnthropicError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AnthropicError';
  }
}

export class AnthropicProvider {
  private config: AnthropicConfig;

  constructor(config: Partial<AnthropicConfig> = {}) {
    this.config = {
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      tools: [],
      ...config,
    };
  }

  /**
   * Send a message to Claude
   */
  async sendMessage(
    messages: AnthropicMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<AnthropicResponse> {
    try {
      if (!ANTHROPIC_API_KEY) {
        throw new AnthropicError(
          'Anthropic API key not configured. Please add VITE_ANTHROPIC_API_KEY to your environment variables.',
          'API_KEY_MISSING'
        );
      }

      // Convert messages to Anthropic format
      const anthropicMessages = this.convertMessagesToAnthropic(messages);

      // Prepare the request
      const request: Anthropic.Messages.MessageCreateParams = {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: anthropicMessages,
        system: this.config.systemPrompt,
        tools: this.config.tools.length > 0 ? this.config.tools : undefined,
      };

      // Make the API call
      if (!anthropic) {
        throw new AnthropicError(
          'Anthropic client not initialized. Please check your API key configuration.',
          'CLIENT_NOT_INITIALIZED'
        );
      }
      const response = await anthropic.messages.create(request);

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
            provider: 'anthropic',
            model: this.config.model,
            usage,
            responseId: response.id,
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
          responseId: response.id,
          stopReason: response.stop_reason,
          usage: response.usage,
        },
      };
    } catch (error) {
      console.error('[Anthropic Provider] Error:', error);

      if (error instanceof Anthropic.APIError) {
        throw new AnthropicError(
          `Anthropic API error: ${error.message}`,
          error.status?.toString() || 'API_ERROR',
          error.status === 429 || error.status === 503
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
   * Stream a message from Claude
   */
  async *streamMessage(
    messages: AnthropicMessage[],
    sessionId?: string,
    userId?: string
  ): AsyncGenerator<{ content: string; done: boolean; usage?: any }> {
    try {
      if (!ANTHROPIC_API_KEY) {
        throw new AnthropicError(
          'Anthropic API key not configured. Please add VITE_ANTHROPIC_API_KEY to your environment variables.',
          'API_KEY_MISSING'
        );
      }

      // Convert messages to Anthropic format
      const anthropicMessages = this.convertMessagesToAnthropic(messages);

      // Prepare the request
      const request: Anthropic.Messages.MessageCreateParams = {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: anthropicMessages,
        system: this.config.systemPrompt,
        tools: this.config.tools.length > 0 ? this.config.tools : undefined,
        stream: true,
      };

      // Make the streaming API call
      if (!anthropic) {
        throw new AnthropicError(
          'Anthropic client not initialized. Please check your API key configuration.',
          'CLIENT_NOT_INITIALIZED'
        );
      }
      const stream = await anthropic.messages.create(request);

      let fullContent = '';
      let usage: any = null;

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          const content = chunk.delta.text;
          fullContent += content;
          yield { content, done: false };
        } else if (chunk.type === 'message_stop') {
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
            provider: 'anthropic',
            model: this.config.model,
            usage,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('[Anthropic Provider] Streaming error:', error);

      if (error instanceof Anthropic.APIError) {
        throw new AnthropicError(
          `Anthropic API error: ${error.message}`,
          error.status?.toString() || 'API_ERROR',
          error.status === 429 || error.status === 503
        );
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
      .filter(msg => msg.role !== 'system') // System messages are handled separately
      .map(msg => ({
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
        .filter(block => block.type === 'text')
        .map(block => (block as Anthropic.Messages.TextBlock).text)
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
    metadata: Record<string, any>;
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
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!ANTHROPIC_API_KEY;
  }

  /**
   * Get available models
   */
  static getAvailableModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }
}

// Export singleton instance
export const anthropicProvider = new AnthropicProvider();
