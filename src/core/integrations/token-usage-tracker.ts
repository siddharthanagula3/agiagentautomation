/**
 * Token Logger Service
 * Tracks LLM token usage across all providers with granular billing
 */

import { UsageTracker } from '@features/billing/services/usage-monitor';
import type { LLMProvider } from './llm/unified-llm-service';

export interface TokenLogEntry {
  userId: string;
  sessionId: string;
  agentId: string;
  agentName: string;
  provider: LLMProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: Date;
  taskDescription?: string;
}

export interface TokenUsageByModel {
  [model: string]: {
    provider: LLMProvider;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    callCount: number;
  };
}

export interface SessionTokenSummary {
  sessionId: string;
  userId: string;
  totalTokens: number;
  totalCost: number;
  byModel: TokenUsageByModel;
  startTime: Date;
  lastUpdate: Date;
}

/**
 * Token pricing per million tokens (as of 2025)
 */
const TOKEN_PRICING: Record<
  string,
  { input: number; output: number; provider: LLMProvider }
> = {
  // OpenAI
  'gpt-4o': { input: 5.0, output: 15.0, provider: 'openai' },
  'gpt-4o-mini': { input: 0.15, output: 0.6, provider: 'openai' },
  'gpt-4-turbo': { input: 10.0, output: 30.0, provider: 'openai' },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5, provider: 'openai' },

  // Anthropic
  'claude-3-5-sonnet-20241022': {
    input: 3.0,
    output: 15.0,
    provider: 'anthropic',
  },
  'claude-3-5-haiku-20241022': {
    input: 1.0,
    output: 5.0,
    provider: 'anthropic',
  },
  'claude-3-opus-20240229': {
    input: 15.0,
    output: 75.0,
    provider: 'anthropic',
  },
  'claude-3-sonnet-20240229': {
    input: 3.0,
    output: 15.0,
    provider: 'anthropic',
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25,
    provider: 'anthropic',
  },

  // Google
  'gemini-1.5-pro': { input: 3.5, output: 10.5, provider: 'google' },
  'gemini-1.5-flash': { input: 0.075, output: 0.3, provider: 'google' },
  'gemini-1.0-pro': { input: 0.5, output: 1.5, provider: 'google' },

  // Perplexity
  'llama-3.1-sonar-small-128k-online': {
    input: 0.2,
    output: 0.2,
    provider: 'perplexity',
  },
  'llama-3.1-sonar-large-128k-online': {
    input: 1.0,
    output: 1.0,
    provider: 'perplexity',
  },
  'llama-3.1-sonar-huge-128k-online': {
    input: 5.0,
    output: 5.0,
    provider: 'perplexity',
  },
};

class TokenLoggerService {
  private usageTracker: UsageTracker;
  private sessionCache: Map<string, SessionTokenSummary>;
  private logEntries: Map<string, TokenLogEntry[]>; // sessionId -> entries

  constructor() {
    this.usageTracker = new UsageTracker();
    this.sessionCache = new Map();
    this.logEntries = new Map();
  }

  /**
   * Log token usage for an LLM API call
   * This is the main function that external services will call
   */
  async logTokenUsage(
    model: string,
    tokensUsed: number,
    userId: string,
    sessionId?: string,
    agentId?: string,
    agentName?: string,
    inputTokens?: number,
    outputTokens?: number,
    taskDescription?: string
  ): Promise<void> {
    const pricing = TOKEN_PRICING[model] || {
      input: 1.0,
      output: 1.0,
      provider: 'openai',
    };
    const provider = pricing.provider;

    // Calculate cost - use actual values if provided, otherwise estimate
    // NOTE: All providers should provide actual input/output tokens from API responses
    const actualInputTokens = inputTokens ?? (tokensUsed > 0 ? Math.floor(tokensUsed * 0.4) : 0);
    const actualOutputTokens = outputTokens ?? (tokensUsed > 0 ? Math.ceil(tokensUsed * 0.6) : 0);
    
    // Validate token values
    if (tokensUsed > 0 && actualInputTokens === 0 && actualOutputTokens === 0) {
      console.warn(`[TokenLogger] ⚠️ No input/output tokens provided for ${model}, using estimation`);
    }
    
    // Validate that input + output equals total (with small tolerance for rounding)
    const calculatedTotal = actualInputTokens + actualOutputTokens;
    if (tokensUsed > 0 && Math.abs(calculatedTotal - tokensUsed) > 1) {
      console.warn(
        `[TokenLogger] ⚠️ Token mismatch for ${model}: input(${actualInputTokens}) + output(${actualOutputTokens}) = ${calculatedTotal}, but total = ${tokensUsed}`
      );
    }
    const cost = this.calculateCost(
      model,
      actualInputTokens,
      actualOutputTokens
    );

    const entry: TokenLogEntry = {
      userId,
      sessionId: sessionId || 'default',
      agentId: agentId || 'unknown',
      agentName: agentName || 'Unknown Agent',
      provider,
      model,
      inputTokens: actualInputTokens,
      outputTokens: actualOutputTokens,
      totalTokens: tokensUsed,
      cost,
      timestamp: new Date(),
      taskDescription,
    };

    // Store in memory cache
    const entries = this.logEntries.get(entry.sessionId) || [];
    entries.push(entry);
    this.logEntries.set(entry.sessionId, entries);

    // Update session summary
    this.updateSessionSummary(entry);

    // Persist to database via UsageTracker
    try {
      await this.usageTracker.trackAPICall({
        userId,
        agentType: agentName || 'Unknown Agent',
        provider: model,
        tokensUsed,
        inputTokens: actualInputTokens,
        outputTokens: actualOutputTokens,
        taskId: sessionId || 'default',
        timestamp: entry.timestamp,
        cost,
      });
    } catch (error) {
      console.error('[TokenLogger] Failed to persist to database:', error);
      // Don't throw - continue even if DB persist fails
    }
  }

  /**
   * Calculate cost for a specific model
   */
  calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = TOKEN_PRICING[model] || { input: 1.0, output: 1.0 };

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Update session summary in cache
   */
  private updateSessionSummary(entry: TokenLogEntry): void {
    let summary = this.sessionCache.get(entry.sessionId);

    if (!summary) {
      summary = {
        sessionId: entry.sessionId,
        userId: entry.userId,
        totalTokens: 0,
        totalCost: 0,
        byModel: {},
        startTime: entry.timestamp,
        lastUpdate: entry.timestamp,
      };
      this.sessionCache.set(entry.sessionId, summary);
    }

    // Update totals
    summary.totalTokens += entry.totalTokens;
    summary.totalCost += entry.cost;
    summary.lastUpdate = entry.timestamp;

    // Update by-model breakdown
    if (!summary.byModel[entry.model]) {
      summary.byModel[entry.model] = {
        provider: entry.provider,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
        callCount: 0,
      };
    }

    const modelStats = summary.byModel[entry.model];
    modelStats.inputTokens += entry.inputTokens;
    modelStats.outputTokens += entry.outputTokens;
    modelStats.totalTokens += entry.totalTokens;
    modelStats.cost += entry.cost;
    modelStats.callCount += 1;
  }

  /**
   * Get session summary
   */
  getSessionSummary(sessionId: string): SessionTokenSummary | null {
    return this.sessionCache.get(sessionId) || null;
  }

  /**
   * Get all log entries for a session
   */
  getSessionLogs(sessionId: string): TokenLogEntry[] {
    return this.logEntries.get(sessionId) || [];
  }

  /**
   * Get real-time token usage (for live updates)
   */
  getRealtimeUsage(sessionId: string): {
    totalTokens: number;
    totalCost: number;
    byModel: TokenUsageByModel;
  } {
    const summary = this.getSessionSummary(sessionId);
    if (!summary) {
      return {
        totalTokens: 0,
        totalCost: 0,
        byModel: {},
      };
    }

    return {
      totalTokens: summary.totalTokens,
      totalCost: summary.totalCost,
      byModel: summary.byModel,
    };
  }

  /**
   * Clear session cache
   */
  clearSessionCache(sessionId: string): void {
    this.sessionCache.delete(sessionId);
    this.logEntries.delete(sessionId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.sessionCache.clear();
    this.logEntries.clear();
  }

  /**
   * Get supported models
   */
  static getSupportedModels(): string[] {
    return Object.keys(TOKEN_PRICING);
  }

  /**
   * Get pricing for a model
   */
  static getModelPricing(
    model: string
  ): { input: number; output: number; provider: LLMProvider } | null {
    return TOKEN_PRICING[model] || null;
  }
}

// Export singleton instance
export const tokenLogger = new TokenLoggerService();

// Export convenience function for external use
export function logTokenUsage(
  model_name: string,
  tokens_used: number,
  user_id: string
): Promise<void> {
  return tokenLogger.logTokenUsage(model_name, tokens_used, user_id);
}
