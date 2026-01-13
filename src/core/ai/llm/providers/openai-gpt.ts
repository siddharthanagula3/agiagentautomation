/**
 * OpenAI ChatGPT Provider
 * Official SDK integration for OpenAI GPT models
 * Updated: Jan 3rd 2026 - Updated to GPT-5.2, o3, Sora 2, gpt-image-1.5
 */

import OpenAI from 'openai';
import { supabase } from '@shared/lib/supabase-client';

/**
 * Helper function to get the current Supabase session token
 * Required for authenticated API proxy calls
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('[OpenAI Provider] Failed to get auth token:', error);
    return null;
  }
}

// SECURITY WARNING: Client-side API initialization is disabled
// All API calls should go through Netlify proxy functions instead
// Environment variables with VITE_ prefix are exposed to the browser (security risk)

// DEPRECATED: Direct client-side initialization (security risk)
// const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// Initialize clients - DISABLED for security
const openai = null; // Client-side SDK disabled - use Netlify proxy instead

// ✅ IMPLEMENTED: All API calls use Netlify proxy functions for security
// Proxy endpoints: /.netlify/functions/openai-proxy

// Using centralized Supabase client

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

export interface OpenAIConfig {
  model:
    | 'gpt-5.2'
    | 'gpt-5.1'
    | 'gpt-4.1'
    | 'gpt-4o'
    | 'gpt-4o-mini'
    | 'o3'
    | 'o3-mini';
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
      model: 'gpt-4o',
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      tools: [],
      ...config,
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
      // Convert messages to OpenAI format
      const openaiMessages = this.convertMessagesToOpenAI(messages);

      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/openai-proxy';

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
          'Authorization': `Bearer ${authToken}`,
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
        throw new OpenAIError(
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
      const proxyUrl = '/.netlify/functions/openai-proxy';

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        throw new OpenAIError(
          errorData.error || `HTTP error! status: ${response.status}`,
          `HTTP_${response.status}`,
          response.status === 429 || response.status === 503
        );
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
        console.error('[OpenAI Provider] Error saving message:', error);
      }
    } catch (error) {
      console.error(
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
   */
  static getAvailableModels(): string[] {
    return [
      'gpt-5.2',
      'gpt-5.1',
      'gpt-4.1',
      'gpt-4o',
      'gpt-4o-mini',
      'o3',
      'o3-mini',
    ];
  }

  /**
   * Get available image models
   */
  static getImageModels(): string[] {
    return ['gpt-image-1.5', 'dall-e-3'];
  }

  /**
   * Get available video models (Sora)
   */
  static getVideoModels(): string[] {
    return ['sora-2', 'sora-2-pro'];
  }

  /**
   * Get available audio models
   */
  static getAudioModels(): string[] {
    return ['gpt-4o-transcribe', 'gpt-4o-mini-tts', 'whisper-1', 'tts-1-hd'];
  }
}

// Export singleton instance
export const openaiProvider = new OpenAIProvider();
