/**
 * xAI Grok Provider
 * Integration for Grok models with real-time X (Twitter) access
 * Specialized for social media analysis, agentic tasks, and trend detection
 * Updated: Jan 3rd 2026 - Updated to Grok-4 series
 */

import { supabase } from '@shared/lib/supabase-client';

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
    console.error('[Grok Provider] Failed to get auth token:', error);
    return null;
  }
}

// SECURITY: All API calls go through Netlify proxy functions
// Environment variables with VITE_ prefix are exposed to the browser (security risk)

export interface GrokMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sessionId?: string;
    userId?: string;
    employeeId?: string;
    employeeRole?: string;
    timestamp?: string;
    includeRealTimeData?: boolean; // Enable real-time X/Twitter data
  };
}

export interface GrokResponse {
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
    realTimeDataUsed?: boolean;
    sources?: Array<{
      type: 'tweet' | 'trend' | 'news';
      url?: string;
      timestamp?: string;
      author?: string;
    }>;
  };
}

import {
  SUPPORTED_GROK_MODELS,
  SUPPORTED_GROK_IMAGE_MODELS,
  SUPPORTED_GROK_VISION_MODELS,
  DEFAULT_GROK_MODEL,
  type GrokModel,
} from '@shared/config/supported-models';

export interface GrokConfig {
  model: GrokModel;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  includeRealTimeData?: boolean; // Access real-time X/Twitter data
  useAgentTools?: boolean; // Enable xAI Agent Tools API
}

export class GrokError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GrokError';
  }
}

export class GrokProvider {
  private config: GrokConfig;

  constructor(config: Partial<GrokConfig> = {}) {
    this.config = {
      model: DEFAULT_GROK_MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt:
        'You are Grok, an AI assistant with access to real-time information from X (Twitter).',
      includeRealTimeData: true,
      ...config,
    };
  }

  /**
   * Send a message to Grok
   * @param messages - Conversation messages
   * @param sessionId - Optional session ID for tracking
   * @param userId - Optional user ID for tracking
   */
  async sendMessage(
    messages: GrokMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<GrokResponse> {
    try {
      // SECURITY: Use Netlify proxy to keep API keys secure
      const proxyUrl = '/.netlify/functions/llm-proxies/grok-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new GrokError(
          'User not authenticated. Please log in to use AI features.',
          'NOT_AUTHENTICATED'
        );
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          // Enable real-time data access for social media analysis
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GrokError(
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

      // Extract real-time data sources if available
      const sources = this.extractSources(data);

      // Save to database
      if (sessionId && userId) {
        await this.saveMessageToDatabase({
          sessionId,
          userId,
          role: 'assistant',
          content,
          metadata: {
            provider: 'grok',
            model: this.config.model,
            usage,
            responseId: data.id,
            timestamp: new Date().toISOString(),
            realTimeDataUsed: this.config.includeRealTimeData,
            sources,
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
          realTimeDataUsed: this.config.includeRealTimeData,
          sources,
        },
      };
    } catch (error) {
      console.error('[Grok Provider] Error:', error);

      throw new GrokError(
        `Grok request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REQUEST_FAILED',
        true
      );
    }
  }

  /**
   * Stream a message from Grok
   */
  async *streamMessage(
    messages: GrokMessage[],
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
      const proxyUrl = '/.netlify/functions/llm-proxies/grok-proxy';

      // Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new GrokError(
          'User not authenticated. Please log in to use AI features.',
          'NOT_AUTHENTICATED'
        );
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
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
        throw new GrokError(
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
            provider: 'grok',
            model: this.config.model,
            usage,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('[Grok Provider] Streaming error:', error);

      throw new GrokError(
        `Grok streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STREAMING_FAILED',
        true
      );
    }
  }

  /**
   * Analyze social media sentiment and trends
   * Specialized method for social media analysis using Grok's real-time capabilities
   */
  async analyzeSocialMedia(query: {
    topic: string;
    platforms?: ('twitter' | 'x')[];
    timeframe?: '1h' | '6h' | '24h' | '7d';
    sentiment?: boolean;
    trends?: boolean;
    influencers?: boolean;
  }): Promise<{
    summary: string;
    sentiment?: {
      positive: number;
      negative: number;
      neutral: number;
    };
    trends?: Array<{
      topic: string;
      volume: number;
      growth: string;
    }>;
    topPosts?: Array<{
      content: string;
      author: string;
      engagement: number;
      url?: string;
    }>;
    influencers?: Array<{
      username: string;
      followers: number;
      relevance: string;
    }>;
  }> {
    const prompt = this.buildSocialMediaPrompt(query);

    const response = await this.sendMessage([
      {
        role: 'system',
        content:
          'You are Grok, specialized in analyzing social media trends, public opinion, and sentiment from X (Twitter). Provide structured analysis with data-driven insights.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Parse structured response
    return this.parseSocialMediaResponse(response.content);
  }

  /**
   * Build prompt for social media analysis
   */
  private buildSocialMediaPrompt(query: {
    topic: string;
    platforms?: ('twitter' | 'x')[];
    timeframe?: string;
    sentiment?: boolean;
    trends?: boolean;
    influencers?: boolean;
  }): string {
    const parts = [
      `Analyze public opinion and social media discussion about: "${query.topic}"`,
      `\nTimeframe: ${query.timeframe || '24h'}`,
      `\nPlatforms: ${query.platforms?.join(', ') || 'X (Twitter)'}`,
    ];

    if (query.sentiment) {
      parts.push('\n\n**Sentiment Analysis Required:**');
      parts.push(
        '- Calculate percentage of positive, negative, and neutral mentions'
      );
      parts.push('- Identify key sentiment drivers');
    }

    if (query.trends) {
      parts.push('\n\n**Trend Analysis Required:**');
      parts.push('- Identify trending sub-topics and hashtags');
      parts.push('- Show volume and growth metrics');
    }

    if (query.influencers) {
      parts.push('\n\n**Influencer Analysis Required:**');
      parts.push('- List top influencers discussing this topic');
      parts.push('- Show follower counts and engagement metrics');
    }

    parts.push(
      '\n\n**Format your response as JSON with the following structure:**'
    );
    parts.push('```json');
    parts.push('{');
    parts.push('  "summary": "Brief overview of findings",');
    if (query.sentiment) {
      parts.push(
        '  "sentiment": { "positive": 0-100, "negative": 0-100, "neutral": 0-100 },'
      );
    }
    if (query.trends) {
      parts.push(
        '  "trends": [{ "topic": "", "volume": 0, "growth": "+/-X%" }],'
      );
    }
    parts.push(
      '  "topPosts": [{ "content": "", "author": "", "engagement": 0 }]'
    );
    if (query.influencers) {
      parts.push(
        '  "influencers": [{ "username": "", "followers": 0, "relevance": "" }]'
      );
    }
    parts.push('}');
    parts.push('```');

    return parts.join('\n');
  }

  /**
   * Parse social media analysis response
   */
  private parseSocialMediaResponse(content: string): {
    summary: string;
    sentiment?: { positive: number; negative: number; neutral: number };
    trends?: Array<{ topic: string; volume: number; growth: string }>;
    topPosts?: Array<{ content: string; author: string; engagement: number }>;
    influencers?: Array<{
      username: string;
      followers: number;
      relevance: string;
    }>;
  } {
    try {
      // Extract JSON from markdown code blocks
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) ||
        content.match(/```\n([\s\S]*?)\n```/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed;
      }

      // Try parsing the entire content as JSON
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      console.error('[Grok Provider] Failed to parse JSON response:', error);
      // Return raw content as summary if parsing fails
      return {
        summary: content,
      };
    }
  }

  /**
   * Extract source citations from Grok response
   */
  private extractSources(data: Record<string, unknown>): Array<{
    type: 'tweet' | 'trend' | 'news';
    url?: string;
    timestamp?: string;
    author?: string;
  }> {
    // Grok may include source citations in metadata
    if (data.sources && Array.isArray(data.sources)) {
      return data.sources;
    }
    return [];
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
        console.error('[Grok Provider] Error saving message:', error);
      }
    } catch (error) {
      console.error('[Grok Provider] Unexpected error saving message:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GrokConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): GrokConfig {
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
   * Get available models (Jan 2026 - Grok 4 series)
   * Uses shared config from @shared/config/supported-models.ts
   */
  static getAvailableModels(): string[] {
    return [...SUPPORTED_GROK_MODELS];
  }

  /**
   * Get vision-capable models
   */
  static getVisionModels(): string[] {
    return [...SUPPORTED_GROK_VISION_MODELS];
  }

  /**
   * Get image generation models
   */
  static getImageModels(): string[] {
    return [...SUPPORTED_GROK_IMAGE_MODELS];
  }

  /**
   * Get models optimized for tool calling
   */
  static getAgentModels(): string[] {
    return ['grok-4-1-fast-reasoning', 'grok-4-1-fast-non-reasoning', 'grok-4'];
  }
}

// Export singleton instance
export const grokProvider = new GrokProvider();
