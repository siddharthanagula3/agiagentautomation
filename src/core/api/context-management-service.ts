/**
 * Context Management Service
 * Handles context window management, token counting, and message summarization
 * Based on official documentation and best practices for each LLM provider
 */

export interface ContextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens?: number;
}

export interface ContextSummary {
  summary: string;
  keyPoints: string[];
  timestamp: Date;
  messageCount: number;
}

export interface ContextWindow {
  messages: ContextMessage[];
  summary?: ContextSummary;
  totalTokens: number;
  maxTokens: number;
  provider: string;
}

export interface PersistedContext {
  sessionId: string;
  messages: ContextMessage[];
  summary?: ContextSummary;
  totalTokens: number;
  maxTokens: number;
  provider: string;
  exportedAt: Date;
}

type PersistedContextInput = {
  sessionId: string;
  messages?: ContextMessage[];
  summary?: ContextSummary;
  totalTokens?: number;
  maxTokens?: number;
  provider?: string;
};

// Token limits for each provider (approximate)
const TOKEN_LIMITS = {
  openai: {
    'gpt-4o-mini': 128000,
    'gpt-4o': 128000,
    'gpt-4': 8192,
    'gpt-3.5-turbo': 4096,
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': 200000,
    'claude-3-opus-20240229': 200000,
    'claude-3-haiku-20240307': 200000,
  },
  google: {
    'gemini-2.0-flash': 1000000,
    'gemini-1.5-pro': 2000000,
    'gemini-1.5-flash': 1000000,
  },
  perplexity: {
    'llama-3.1-sonar-large-128k-online': 128000,
  },
};

// Approximate token counting (1 token ≈ 4 characters for English)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// More accurate token counting using tiktoken-like approach
function countTokens(text: string): number {
  // Simple approximation - in production, use actual tokenizer
  const words = text.split(/\s+/).length;
  const chars = text.length;

  // Rough estimation: 1 token ≈ 0.75 words or 4 characters
  return Math.max(Math.ceil(words / 0.75), Math.ceil(chars / 4));
}

export class ContextManagementService {
  private static instance: ContextManagementService;
  private contextWindows: Map<string, ContextWindow> = new Map();

  static getInstance(): ContextManagementService {
    if (!ContextManagementService.instance) {
      ContextManagementService.instance = new ContextManagementService();
    }
    return ContextManagementService.instance;
  }

  /**
   * Get or create context window for a chat session
   */
  getContextWindow(
    sessionId: string,
    provider: string,
    model: string
  ): ContextWindow {
    if (!this.contextWindows.has(sessionId)) {
      const maxTokens = this.getMaxTokens(provider, model);
      this.contextWindows.set(sessionId, {
        messages: [],
        totalTokens: 0,
        maxTokens,
        provider,
      });
    }
    return this.contextWindows.get(sessionId)!;
  }

  /**
   * Add message to context window
   */
  addMessage(sessionId: string, message: ContextMessage): void {
    const context = this.getContextWindow(sessionId, '', '');
    const tokens = countTokens(message.content);
    message.tokens = tokens;

    context.messages.push(message);
    context.totalTokens += tokens;

    // Check if we need to summarize
    if (context.totalTokens > context.maxTokens * 0.8) {
      this.summarizeContext(sessionId);
    }
  }

  /**
   * Get optimized context for API call
   */
  getOptimizedContext(
    sessionId: string,
    provider: string,
    model: string
  ): ContextMessage[] {
    const context = this.getContextWindow(sessionId, provider, model);
    const maxTokens = this.getMaxTokens(provider, model);

    // If we have a summary, use it
    if (context.summary && context.totalTokens > maxTokens * 0.7) {
      return [
        {
          role: 'system',
          content: `Previous conversation summary: ${context.summary.summary}\n\nKey points: ${context.summary.keyPoints.join(', ')}\n\nContinue the conversation based on this context.`,
          timestamp: context.summary.timestamp,
          tokens: countTokens(context.summary.summary),
        },
        ...context.messages.slice(-10), // Keep last 10 messages
      ];
    }

    // If within limits, return all messages
    if (context.totalTokens <= maxTokens) {
      return context.messages;
    }

    // Otherwise, use sliding window approach
    return this.getSlidingWindow(context, maxTokens);
  }

  /**
   * Summarize context when it gets too long
   */
  private async summarizeContext(sessionId: string): Promise<void> {
    const context = this.contextWindows.get(sessionId);
    if (!context) return;

    // Take first 70% of messages for summarization
    const messagesToSummarize = context.messages.slice(
      0,
      Math.floor(context.messages.length * 0.7)
    );

    // Create summary prompt
    const summaryPrompt = `Please summarize the following conversation, highlighting key points and maintaining context for future interactions:

${messagesToSummarize.map((m) => `${m.role}: ${m.content}`).join('\n')}

Provide:
1. A concise summary of the conversation
2. Key points that should be remembered
3. Any important context or decisions made`;

    // For now, create a simple summary
    // In production, this would call the AI service
    const summary: ContextSummary = {
      summary: `Conversation with ${messagesToSummarize.length} messages covering various topics.`,
      keyPoints: [
        'User engaged in conversation',
        'Multiple topics discussed',
        'Context maintained for continuity',
      ],
      timestamp: new Date(),
      messageCount: messagesToSummarize.length,
    };

    context.summary = summary;

    // Remove summarized messages but keep recent ones
    const recentMessages = context.messages.slice(
      Math.floor(context.messages.length * 0.7)
    );
    context.messages = recentMessages;
    context.totalTokens = recentMessages.reduce(
      (sum, m) => sum + (m.tokens || 0),
      0
    );
  }

  /**
   * Get sliding window of messages that fit within token limit
   */
  private getSlidingWindow(
    context: ContextWindow,
    maxTokens: number
  ): ContextMessage[] {
    const messages = [...context.messages];
    const result: ContextMessage[] = [];
    let currentTokens = 0;

    // Start from the end (most recent messages)
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = message.tokens || countTokens(message.content);

      if (currentTokens + messageTokens > maxTokens * 0.9) {
        break;
      }

      result.unshift(message);
      currentTokens += messageTokens;
    }

    return result;
  }

  /**
   * Get maximum tokens for provider and model
   */
  private getMaxTokens(provider: string, model: string): number {
    const providerKey = provider.toLowerCase();
    const modelKey = model.toLowerCase();

    if (TOKEN_LIMITS[providerKey as keyof typeof TOKEN_LIMITS]) {
      const limits = TOKEN_LIMITS[providerKey as keyof typeof TOKEN_LIMITS];
      return (
        limits[modelKey as keyof typeof limits] ||
        limits[Object.keys(limits)[0] as keyof typeof limits] ||
        4000
      );
    }

    return 4000; // Default fallback
  }

  /**
   * Clear context for a session
   */
  clearContext(sessionId: string): void {
    this.contextWindows.delete(sessionId);
  }

  /**
   * Get context statistics
   */
  getContextStats(sessionId: string): {
    totalMessages: number;
    totalTokens: number;
    maxTokens: number;
    usagePercentage: number;
    hasSummary: boolean;
  } {
    const context = this.contextWindows.get(sessionId);
    if (!context) {
      return {
        totalMessages: 0,
        totalTokens: 0,
        maxTokens: 0,
        usagePercentage: 0,
        hasSummary: false,
      };
    }

    return {
      totalMessages: context.messages.length,
      totalTokens: context.totalTokens,
      maxTokens: context.maxTokens,
      usagePercentage: (context.totalTokens / context.maxTokens) * 100,
      hasSummary: !!context.summary,
    };
  }

  /**
   * Export context for persistence
   */
  exportContext(sessionId: string): PersistedContext | null {
    const context = this.contextWindows.get(sessionId);
    if (!context) return null;

    return {
      sessionId,
      messages: context.messages,
      summary: context.summary,
      totalTokens: context.totalTokens,
      maxTokens: context.maxTokens,
      provider: context.provider,
      exportedAt: new Date(),
    };
  }

  /**
   * Import context from persistence
   */
  importContext(contextData: PersistedContextInput | null | undefined): void {
    if (!contextData?.sessionId) {
      return;
    }

    this.contextWindows.set(contextData.sessionId, {
      messages: contextData.messages ?? [],
      summary: contextData.summary,
      totalTokens: contextData.totalTokens ?? 0,
      maxTokens: contextData.maxTokens ?? 4000,
      provider: contextData.provider ?? 'unknown',
    });
  }
}

// Export singleton instance
export const contextManagementService = ContextManagementService.getInstance();
