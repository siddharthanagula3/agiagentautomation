/**
 * OpenAI ChatGPT Provider
 * Official SDK integration for OpenAI GPT models
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize clients
const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
}) : null;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  metadata?: Record<string, any>;
}

export interface OpenAIConfig {
  model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
}

export class OpenAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export class OpenAIProvider {
  private config: OpenAIConfig;

  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = {
      model: 'gpt-4o-mini',
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      tools: [],
      ...config
    };
  }

  /**
   * Send a message to OpenAI
   */
  async sendMessage(
    messages: OpenAIMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<OpenAIResponse> {
    try {
      if (!OPENAI_API_KEY) {
        throw new OpenAIError(
          'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.',
          'API_KEY_MISSING'
        );
      }

      // Convert messages to OpenAI format
      const openaiMessages = this.convertMessagesToOpenAI(messages);

      // Prepare the request
      const request: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: openaiMessages,
        tools: this.config.tools.length > 0 ? this.config.tools : undefined,
        tool_choice: this.config.tools.length > 0 ? 'auto' : undefined,
      };

      // Make the API call
      if (!openai) {
        throw new OpenAIError(
          'OpenAI client not initialized. Please check your API key configuration.',
          'CLIENT_NOT_INITIALIZED'
        );
      }
      const response = await openai.chat.completions.create(request);

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
            provider: 'openai',
            model: this.config.model,
            usage,
            responseId: response.id,
            timestamp: new Date().toISOString()
          }
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
          finishReason: response.choices[0]?.finish_reason,
          usage: response.usage
        }
      };

    } catch (error) {
      console.error('[OpenAI Provider] Error:', error);
      
      if (error instanceof OpenAI.APIError) {
        throw new OpenAIError(
          `OpenAI API error: ${error.message}`,
          error.status?.toString() || 'API_ERROR',
          error.status === 429 || error.status === 503
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
   * Stream a message from OpenAI
   */
  async *streamMessage(
    messages: OpenAIMessage[],
    sessionId?: string,
    userId?: string
  ): AsyncGenerator<{ content: string; done: boolean; usage?: any }> {
    try {
      if (!OPENAI_API_KEY) {
        throw new OpenAIError(
          'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.',
          'API_KEY_MISSING'
        );
      }

      // Convert messages to OpenAI format
      const openaiMessages = this.convertMessagesToOpenAI(messages);

      // Prepare the request
      const request: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: openaiMessages,
        tools: this.config.tools.length > 0 ? this.config.tools : undefined,
        tool_choice: this.config.tools.length > 0 ? 'auto' : undefined,
        stream: true,
      };

      // Make the streaming API call
      if (!openai) {
        throw new OpenAIError(
          'OpenAI client not initialized. Please check your API key configuration.',
          'CLIENT_NOT_INITIALIZED'
        );
      }
      const stream = await openai.chat.completions.create(request);

      let fullContent = '';
      let usage: any = null;

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
            provider: 'openai',
            model: this.config.model,
            usage,
            timestamp: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      console.error('[OpenAI Provider] Streaming error:', error);
      
      if (error instanceof OpenAI.APIError) {
        throw new OpenAIError(
          `OpenAI API error: ${error.message}`,
          error.status?.toString() || 'API_ERROR',
          error.status === 429 || error.status === 503
        );
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
  private convertMessagesToOpenAI(messages: OpenAIMessage[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Extract content from OpenAI response
   */
  private extractContentFromResponse(response: OpenAI.Chat.Completions.ChatCompletion): string {
    return response.choices[0]?.message?.content || '';
  }

  /**
   * Extract usage information from OpenAI response
   */
  private extractUsageFromResponse(response: OpenAI.Chat.Completions.ChatCompletion): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    if (response.usage) {
      return {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
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
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('agent_messages')
        .insert({
          session_id: message.sessionId,
          user_id: message.userId,
          role: message.role,
          content: message.content,
          metadata: message.metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[OpenAI Provider] Error saving message:', error);
      }
    } catch (error) {
      console.error('[OpenAI Provider] Unexpected error saving message:', error);
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
   */
  isConfigured(): boolean {
    return !!OPENAI_API_KEY;
  }

  /**
   * Get available models
   */
  static getAvailableModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ];
  }
}

// Export singleton instance
export const openaiProvider = new OpenAIProvider();
