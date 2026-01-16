/**
 * DeepSeek Provider
 * Integration for DeepSeek AI models (V3.2)
 * Specialized for coding, reasoning, and complex problem-solving
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
    console.error('[DeepSeek Provider] Failed to get auth token:', error);
    return null;
  }
}

// SECURITY: All API calls go through Netlify proxy functions
// Environment variables with VITE_ prefix are exposed to the browser (security risk)

export interface DeepSeekMessage {
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

export interface DeepSeekResponse {
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
    reasoningContent?: string; // For deepseek-reasoner
  };
}

export interface DeepSeekConfig {
  model: 'deepseek-chat' | 'deepseek-reasoner';
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
}

export class DeepSeekError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'DeepSeekError';
  }
}

export class DeepSeekProvider {
  private config: DeepSeekConfig;

  constructor(config: Partial<DeepSeekConfig> = {}) {
    this.config = {
      model: 'deepseek-chat',
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      ...config,
    };
  }

  /**
   * Send a message to DeepSeek
   */
  async sendMessage(
    messages: DeepSeekMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<DeepSeekResponse> {
    try {
      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/llm-proxies/deepseek-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new DeepSeekError(
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
        throw new DeepSeekError(
          errorData.error || `HTTP error! status: ${response.status}`,
          `HTTP_${response.status}`,
          response.status === 429 || response.status === 503
        );
      }

      const data = await response.json();

      // Extract content and usage from proxy response
      const content = data.choices?.[0]?.message?.content || data.content || '';
      const reasoningContent = data.choices?.[0]?.message?.reasoning_content;
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
            provider: 'deepseek',
            model: this.config.model,
            usage,
            responseId: data.id,
            timestamp: new Date().toISOString(),
            reasoningContent,
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
          reasoningContent,
        },
      };
    } catch (error) {
      console.error('[DeepSeek Provider] Error:', error);

      throw new DeepSeekError(
        `DeepSeek request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REQUEST_FAILED',
        true
      );
    }
  }

  /**
   * Stream a message from DeepSeek
   */
  async *streamMessage(
    messages: DeepSeekMessage[],
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
      const proxyUrl = '/.netlify/functions/llm-proxies/deepseek-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new DeepSeekError(
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
        throw new DeepSeekError(
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
            provider: 'deepseek',
            model: this.config.model,
            usage,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('[DeepSeek Provider] Streaming error:', error);

      throw new DeepSeekError(
        `DeepSeek streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        console.error('[DeepSeek Provider] Error saving message:', error);
      }
    } catch (error) {
      console.error(
        '[DeepSeek Provider] Unexpected error saving message:',
        error
      );
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DeepSeekConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): DeepSeekConfig {
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
    return ['deepseek-chat', 'deepseek-reasoner'];
  }

  /**
   * Get models by capability
   */
  static getModelsByCapability(): Record<string, string[]> {
    return {
      chat: ['deepseek-chat'],
      reasoning: ['deepseek-reasoner'],
      coding: ['deepseek-chat', 'deepseek-reasoner'],
      tools: ['deepseek-chat', 'deepseek-reasoner'],
    };
  }
}

// Export singleton instance
export const deepseekProvider = new DeepSeekProvider();
