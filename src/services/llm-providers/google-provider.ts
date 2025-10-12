/**
 * Google Gemini Provider
 * Official SDK integration for Google AI Studio Gemini models
 */

import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerationConfig,
} from '@google/generative-ai';
import { supabase } from '@/lib/supabase-client';

// Environment variables
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize clients
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
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
  metadata?: Record<string, any>;
}

export interface GoogleConfig {
  model: 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-1.0-pro';
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  tools?: any[];
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
  private model: GenerativeModel;

  constructor(config: Partial<GoogleConfig> = {}) {
    this.config = {
      model: 'gemini-1.5-flash',
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      tools: [],
      ...config,
    };

    this.model = genAI
      ? genAI.getGenerativeModel({
          model: this.config.model,
          generationConfig: {
            maxOutputTokens: this.config.maxTokens,
            temperature: this.config.temperature,
          },
        })
      : null;
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
      if (!GOOGLE_API_KEY) {
        throw new GoogleError(
          'Google API key not configured. Please add VITE_GOOGLE_API_KEY to your environment variables.',
          'API_KEY_MISSING'
        );
      }

      // Convert messages to Gemini format
      const prompt = this.convertMessagesToGemini(messages);

      // Prepare the request
      const generationConfig: GenerationConfig = {
        maxOutputTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      };

      // Make the API call
      if (!this.model) {
        throw new GoogleError(
          'Google client not initialized. Please check your API key configuration.',
          'CLIENT_NOT_INITIALIZED'
        );
      }
      const result = await this.model.generateContent(prompt, generationConfig);
      const response = await result.response;

      // Process the response
      const content = response.text();
      const usage = this.extractUsageFromResponse(result);

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
          finishReason: response.candidates?.[0]?.finishReason,
          usage: result.usageMetadata,
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
   */
  async *streamMessage(
    messages: GoogleMessage[],
    sessionId?: string,
    userId?: string
  ): AsyncGenerator<{ content: string; done: boolean; usage?: any }> {
    try {
      if (!GOOGLE_API_KEY) {
        throw new GoogleError(
          'Google API key not configured. Please add VITE_GOOGLE_API_KEY to your environment variables.',
          'API_KEY_MISSING'
        );
      }

      // Convert messages to Gemini format
      const prompt = this.convertMessagesToGemini(messages);

      // Prepare the request
      const generationConfig: GenerationConfig = {
        maxOutputTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      };

      // Make the streaming API call
      if (!this.model) {
        throw new GoogleError(
          'Google client not initialized. Please check your API key configuration.',
          'CLIENT_NOT_INITIALIZED'
        );
      }
      const result = await this.model.generateContentStream(
        prompt,
        generationConfig
      );

      let fullContent = '';
      let usage: any = null;

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullContent += chunkText;
          yield { content: chunkText, done: false };
        }
      }

      // Get final result for usage information
      const finalResult = await result.response;
      usage = this.extractUsageFromResponse(finalResult);
      yield { content: '', done: true, usage };

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
   */
  private extractUsageFromResponse(result: any): {
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
   */
  updateConfig(newConfig: Partial<GoogleConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reinitialize model with new config
    this.model = genAI.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        maxOutputTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      },
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): GoogleConfig {
    return { ...this.config };
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!GOOGLE_API_KEY;
  }

  /**
   * Get available models
   */
  static getAvailableModels(): string[] {
    return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
  }
}

// Export singleton instance
export const googleProvider = new GoogleProvider();
