/**
 * Qwen Provider (Alibaba)
 * Integration for Qwen/Alibaba Cloud AI models
 * Specialized for multilingual tasks, coding, and vision
 * Created: Jan 3rd 2026
 */

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
    console.error('[Qwen Provider] Failed to get auth token:', error);
    return null;
  }
}

// SECURITY: All API calls go through Netlify proxy functions
// Environment variables with VITE_ prefix are exposed to the browser (security risk)

export interface QwenMessage {
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

export interface QwenResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  sessionId?: string;
  userId?: string;
  metadata?: {
    responseId?: string;
    finishReason?: string;
  };
}

export interface QwenConfig {
  model:
    | 'qwen3-max'
    | 'qwen-plus'
    | 'qwen-flash'
    | 'qwen3-coder-plus'
    | 'qwen3-coder-flash'
    | 'qwen3-vl-plus'
    | 'qwq-plus';
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  thinkingMode?: boolean; // Enable thinking mode for qwen3-max
}

export class QwenError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'QwenError';
  }
}

export class QwenProvider {
  private config: QwenConfig;

  constructor(config: Partial<QwenConfig> = {}) {
    this.config = {
      model: 'qwen-plus',
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      thinkingMode: false,
      ...config,
    };
  }

  /**
   * Send a message to Qwen
   */
  async sendMessage(
    messages: QwenMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<QwenResponse> {
    try {
      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/llm-proxies/qwen-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new QwenError(
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
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new QwenError(
          errorData.error || `HTTP error! status: ${response.status}`,
          `HTTP_${response.status}`,
          response.status === 429 || response.status === 503
        );
      }

      const data = await response.json();

      // Extract content and usage from proxy response
      const content = data.choices?.[0]?.message?.content || data.content || '';
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
            provider: 'qwen',
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
        },
      };
    } catch (error) {
      console.error('[Qwen Provider] Error:', error);

      throw new QwenError(
        `Qwen request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REQUEST_FAILED',
        true
      );
    }
  }

  /**
   * Stream a message from Qwen
   */
  async *streamMessage(
    messages: QwenMessage[],
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
      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/llm-proxies/qwen-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new QwenError(
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
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false, // Non-streaming for now
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new QwenError(
          errorData.error || `HTTP error! status: ${response.status}`,
          `HTTP_${response.status}`,
          response.status === 429 || response.status === 503
        );
      }

      const data = await response.json();
      const fullContent =
        data.choices?.[0]?.message?.content || data.content || '';
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
            provider: 'qwen',
            model: this.config.model,
            usage,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('[Qwen Provider] Streaming error:', error);

      throw new QwenError(
        `Qwen streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STREAMING_FAILED',
        true
      );
    }
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
        console.error('[Qwen Provider] Error saving message:', error);
      }
    } catch (error) {
      console.error('[Qwen Provider] Unexpected error saving message:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<QwenConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): QwenConfig {
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
      'qwen3-max',
      'qwen-plus',
      'qwen-flash',
      'qwen3-coder-plus',
      'qwen3-coder-flash',
      'qwen3-vl-plus',
      'qwq-plus',
    ];
  }

  /**
   * Get models by capability
   */
  static getModelsByCapability(): Record<string, string[]> {
    return {
      chat: ['qwen3-max', 'qwen-plus', 'qwen-flash'],
      coding: ['qwen3-coder-plus', 'qwen3-coder-flash'],
      vision: ['qwen3-vl-plus'],
      reasoning: ['qwq-plus', 'qwen3-max'],
    };
  }

  /**
   * Get image generation models
   */
  static getImageModels(): string[] {
    return ['qwen-image-max', 'wan2.6-t2i'];
  }

  /**
   * Get video generation models
   */
  static getVideoModels(): string[] {
    return ['wan2.6-t2v', 'wan2.6-i2v'];
  }
}

// Export singleton instance
export const qwenProvider = new QwenProvider();
