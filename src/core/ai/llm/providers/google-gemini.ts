/**
 * Google Gemini Provider
 * Official SDK integration for Google AI Studio Gemini models
 * Updated: Jan 6th 2026 - Migrated to @google/genai SDK
 */

import { GoogleGenAI } from '@google/genai';
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
    console.error('[Google Provider] Failed to get auth token:', error);
    return null;
  }
}

// SECURITY WARNING: Client-side API initialization is disabled
// All API calls should go through Netlify proxy functions instead
// Environment variables with VITE_ prefix are exposed to the browser (security risk)

// DEPRECATED: Direct client-side initialization (security risk)
// const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

// Initialize clients - DISABLED for security
// New @google/genai SDK pattern:
// const ai = new GoogleGenAI({ apiKey });
// const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
const ai: GoogleGenAI | null = null; // Client-side SDK disabled - use Netlify proxy instead

// All API calls use Netlify proxy functions for security
// Proxy endpoints: /.netlify/functions/google-proxy

// Using centralized Supabase client

export interface GoogleMessage {
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

export interface GoogleResponse {
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

export interface GoogleConfig {
  model:
    | 'gemini-3-pro-preview'
    | 'gemini-3-flash-preview'
    | 'gemini-2.5-pro'
    | 'gemini-2.5-flash'
    | 'gemini-2.0-flash';
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  tools?: unknown[];
  thinkingMode?: 'low' | 'medium' | 'high'; // Gemini 3 thinking mode
}

export class GoogleError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GoogleError';
  }
}

export class GoogleProvider {
  private config: GoogleConfig;
  private client: GoogleGenAI | null;

  constructor(config: Partial<GoogleConfig> = {}) {
    this.config = {
      model: 'gemini-2.0-flash',
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      tools: [],
      thinkingMode: undefined,
      ...config,
    };

    // Client-side SDK disabled for security - use Netlify proxy instead
    // New SDK pattern would be: this.client = new GoogleGenAI({ apiKey });
    this.client = ai;
  }

  /**
   * Send a message to Gemini
   */
  async sendMessage(
    messages: GoogleMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<GoogleResponse> {
    try {
      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/google-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new GoogleError(
          'User not authenticated. Please log in to use AI features.',
          'NOT_AUTHENTICATED'
        );
      }

      // Convert messages to Gemini format
      const geminiMessages = this.convertMessagesToGemini(messages);

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          messages: geminiMessages,
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: this.config.systemPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GoogleError(
          errorData.error || `HTTP error! status: ${response.status}`,
          `HTTP_${response.status}`,
          response.status === 429 || response.status === 503
        );
      }

      const data = await response.json();

      // Extract content and usage from proxy response
      const content = data.content || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const usage = data.usage
        ? {
            promptTokens: data.usage.promptTokenCount || data.usage.prompt_tokens || 0,
            completionTokens: data.usage.candidatesTokenCount || data.usage.completion_tokens || 0,
            totalTokens: data.usage.totalTokenCount || data.usage.total_tokens || 0,
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
            provider: 'google',
            model: this.config.model,
            usage,
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
          finishReason: data.candidates?.[0]?.finishReason,
          usage: data.usageMetadata || usage,
        },
      };
    } catch (error) {
      console.error('[Google Provider] Error:', error);

      if (error instanceof Error) {
        // Check for specific Google API errors
        if (error.message.includes('API_KEY_INVALID')) {
          throw new GoogleError(
            'Invalid Google API key. Please check your VITE_GOOGLE_API_KEY.',
            'INVALID_API_KEY'
          );
        }

        if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new GoogleError(
            'Google API quota exceeded. Please try again later.',
            'QUOTA_EXCEEDED',
            true
          );
        }

        if (error.message.includes('SAFETY')) {
          throw new GoogleError(
            'Content blocked by safety filters.',
            'SAFETY_FILTER',
            false
          );
        }
      }

      throw new GoogleError(
        `Google request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REQUEST_FAILED',
        true
      );
    }
  }

  /**
   * Stream a message from Gemini
   * Uses new @google/genai SDK pattern: ai.models.generateContentStream()
   */
  async *streamMessage(
    messages: GoogleMessage[],
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
      throw new GoogleError(
        'Direct Google streaming is disabled for security. Use /.netlify/functions/google-proxy instead.',
        'DIRECT_API_DISABLED'
      );

      // Convert messages to Gemini format
      const prompt = this.convertMessagesToGemini(messages);

      // Make the streaming API call using new @google/genai SDK pattern
      if (!this.client) {
        throw new GoogleError(
          'Google client not initialized. Please check your API key configuration.',
          'CLIENT_NOT_INITIALIZED'
        );
      }

      // New SDK pattern: ai.models.generateContentStream({ model, contents, config })
      const stream = await this.client.models.generateContentStream({
        model: this.config.model,
        contents: prompt,
        config: {
          maxOutputTokens: this.config.maxTokens,
          temperature: this.config.temperature,
        },
      });

      let fullContent = '';
      let usage: ReturnType<typeof this.extractUsageFromResponse> | null = null;

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullContent += chunkText;
          yield { content: chunkText, done: false };
        }
        // Extract usage from final chunk if available
        if (chunk.usageMetadata) {
          usage = this.extractUsageFromResponse(chunk);
        }
      }

      yield { content: '', done: true, usage: usage || undefined };

      // Save to database
      if (sessionId && userId) {
        await this.saveMessageToDatabase({
          sessionId,
          userId,
          role: 'assistant',
          content: fullContent,
          metadata: {
            provider: 'google',
            model: this.config.model,
            usage,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('[Google Provider] Streaming error:', error);

      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID')) {
          throw new GoogleError(
            'Invalid Google API key. Please check your VITE_GOOGLE_API_KEY.',
            'INVALID_API_KEY'
          );
        }

        if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new GoogleError(
            'Google API quota exceeded. Please try again later.',
            'QUOTA_EXCEEDED',
            true
          );
        }
      }

      throw new GoogleError(
        `Google streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STREAMING_FAILED',
        true
      );
    }
  }

  /**
   * Convert our message format to Gemini format
   */
  private convertMessagesToGemini(messages: GoogleMessage[]): string {
    let prompt = '';

    // Add system prompt if provided
    if (this.config.systemPrompt) {
      prompt += `System: ${this.config.systemPrompt}\n\n`;
    }

    // Convert conversation history
    for (const message of messages) {
      if (message.role === 'system') {
        prompt += `System: ${message.content}\n\n`;
      } else if (message.role === 'user') {
        prompt += `User: ${message.content}\n\n`;
      } else if (message.role === 'assistant') {
        prompt += `Assistant: ${message.content}\n\n`;
      }
    }

    // Add final prompt for response
    prompt += 'Assistant:';

    return prompt;
  }

  /**
   * Extract usage information from Gemini response
   * New @google/genai SDK returns usageMetadata directly on response
   */
  private extractUsageFromResponse(result: {
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  }): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    if (result.usageMetadata) {
      return {
        promptTokens: result.usageMetadata.promptTokenCount || 0,
        completionTokens: result.usageMetadata.candidatesTokenCount || 0,
        totalTokens: result.usageMetadata.totalTokenCount || 0,
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
        console.error('[Google Provider] Error saving message:', error);
      }
    } catch (error) {
      console.error(
        '[Google Provider] Unexpected error saving message:',
        error
      );
    }
  }

  /**
   * Update configuration
   * Note: With @google/genai SDK, model is specified per-request rather than at client init
   */
  updateConfig(newConfig: Partial<GoogleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // New SDK doesn't require client reinitialization - model is specified per request
    // via ai.models.generateContent({ model: "gemini-2.0-flash", ... })
  }

  /**
   * Get current configuration
   */
  getConfig(): GoogleConfig {
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
   * Get available models (Jan 2026 - Gemini 3 series)
   * Updated for @google/genai SDK
   */
  static getAvailableModels(): string[] {
    return [
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
    ];
  }

  /**
   * Get available image generation models (Imagen 4)
   */
  static getImageModels(): string[] {
    return [
      'imagen-4.0-generate-001',
      'imagen-4.0-ultra-generate-001',
      'imagen-4.0-fast-generate-001',
    ];
  }

  /**
   * Get available video generation models (Veo 3.1)
   */
  static getVideoModels(): string[] {
    return [
      'veo-3.1-generate-preview',
      'veo-3.1-fast-generate-preview',
      'veo-3.0-generate-001',
    ];
  }

  /**
   * Get available audio models
   */
  static getAudioModels(): string[] {
    return [
      'gemini-2.5-flash-native-audio-preview-12-2025',
      'gemini-2.5-pro-preview-tts',
      'gemini-2.5-flash-preview-tts',
    ];
  }
}

// Export singleton instance
export const googleProvider = new GoogleProvider();
