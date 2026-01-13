/**
 * Anthropic Claude Provider
 * Official SDK integration for Claude AI models
 * Updated: Jan 3rd 2026 - Updated to Claude 4.5 series (Opus, Sonnet, Haiku)
 */

import Anthropic from '@anthropic-ai/sdk';
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
// Proxy endpoints: /.netlify/functions/anthropic-proxy

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

export interface AnthropicConfig {
  model:
    | 'claude-opus-4-5-20251101'
    | 'claude-sonnet-4-5-20250929'
    | 'claude-haiku-4-5-20251001'
    | 'claude-sonnet-4-20250514'
    | 'claude-3-5-sonnet-20241022';
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  tools?: Anthropic.Tool[];
  computerUse?: boolean; // Enable computer use capabilities
  extendedThinking?: boolean; // Enable extended thinking mode
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
      model: 'claude-sonnet-4-5-20250929',
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
   * Send a message to Claude
   */
  async sendMessage(
    messages: AnthropicMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<AnthropicResponse> {
    try {
      // Convert messages to Anthropic format
      const anthropicMessages = this.convertMessagesToAnthropic(messages);

      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/anthropic-proxy';

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
          'Authorization': `Bearer ${authToken}`,
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
        throw new AnthropicError(
          errorData.error || `HTTP error! status: ${response.status}`,
          `HTTP_${response.status}`,
          response.status === 429 || response.status === 503
        );
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
    try {
      // Convert messages to Anthropic format
      const anthropicMessages = this.convertMessagesToAnthropic(messages);

      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/anthropic-proxy';

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
          'Authorization': `Bearer ${authToken}`,
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
        throw new AnthropicError(
          errorData.error || `HTTP error! status: ${response.status}`,
          `HTTP_${response.status}`,
          response.status === 429 || response.status === 503
        );
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
   */
  static getAvailableModels(): string[] {
    return [
      'claude-opus-4-5-20251101',
      'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
    ];
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
