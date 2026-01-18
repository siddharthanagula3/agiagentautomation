/**
 * Token Tracking Service
 * Comprehensive token usage tracking and billing calculation for all AI providers
 * Based on official pricing from OpenAI, Anthropic, Google, and Perplexity
 */

export interface TokenUsage {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}

export interface TokenStats {
  totalTokens: number;
  totalCost: number;
  providerBreakdown: Record<
    string,
    {
      tokens: number;
      cost: number;
      percentage: number;
    }
  >;
  modelBreakdown: Record<
    string,
    {
      tokens: number;
      cost: number;
      percentage: number;
    }
  >;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
  }>;
  monthlyUsage: Array<{
    month: string;
    tokens: number;
    cost: number;
  }>;
}

// Official pricing as of Jan 2026 (per 1M tokens)
const PRICING = {
  openai: {
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    o1: { input: 15, output: 60 },
    'o1-mini': { input: 3, output: 12 },
  },
  anthropic: {
    'claude-sonnet-4-20250514': { input: 3, output: 15 },
    'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
    'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 },
  },
  google: {
    'gemini-2.0-flash': { input: 0.1, output: 0.4 },
    'gemini-1.5-pro': { input: 1.25, output: 10 },
    'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  },
  perplexity: {
    'sonar-pro': { input: 3, output: 15 },
    sonar: { input: 1, output: 1 },
    'sonar-reasoning': { input: 5, output: 20 },
  },
};

export class TokenTrackingService {
  private static instance: TokenTrackingService;
  private usageHistory: TokenUsage[] = [];
  private dailyStats: Map<string, { tokens: number; cost: number }> = new Map();
  private monthlyStats: Map<string, { tokens: number; cost: number }> =
    new Map();

  static getInstance(): TokenTrackingService {
    if (!TokenTrackingService.instance) {
      TokenTrackingService.instance = new TokenTrackingService();
    }
    return TokenTrackingService.instance;
  }

  /**
   * Calculate token usage for a specific provider and model
   */
  calculateTokenUsage(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    sessionId?: string,
    userId?: string
  ): TokenUsage {
    const providerKey = provider.toLowerCase();
    const modelKey = model.toLowerCase();

    // Get pricing for the model
    const pricing =
      PRICING[providerKey as keyof typeof PRICING]?.[
        modelKey as keyof (typeof PRICING)[typeof providerKey]
      ];

    if (!pricing) {
      console.warn(
        `No pricing found for ${provider}/${model}, using default rates`
      );
      // Default fallback pricing
      const defaultPricing = { input: 1, output: 2 };
      const inputCost = (inputTokens / 1000000) * defaultPricing.input;
      const outputCost = (outputTokens / 1000000) * defaultPricing.output;

      return {
        provider,
        model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
        timestamp: new Date(),
        sessionId,
        userId,
      };
    }

    // Calculate costs (pricing is per 1M tokens)
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;

    const usage: TokenUsage = {
      provider,
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      timestamp: new Date(),
      sessionId,
      userId,
    };

    // Store usage
    this.usageHistory.push(usage);
    this.updateDailyStats(usage);
    this.updateMonthlyStats(usage);

    return usage;
  }

  /**
   * Get token statistics for a user
   */
  getTokenStats(userId?: string, startDate?: Date, endDate?: Date): TokenStats {
    let filteredUsage = this.usageHistory;

    if (userId) {
      filteredUsage = filteredUsage.filter((usage) => usage.userId === userId);
    }

    if (startDate) {
      filteredUsage = filteredUsage.filter(
        (usage) => usage.timestamp >= startDate
      );
    }

    if (endDate) {
      filteredUsage = filteredUsage.filter(
        (usage) => usage.timestamp <= endDate
      );
    }

    const totalTokens = filteredUsage.reduce(
      (sum, usage) => sum + usage.totalTokens,
      0
    );
    const totalCost = filteredUsage.reduce(
      (sum, usage) => sum + usage.totalCost,
      0
    );

    // Provider breakdown
    const providerBreakdown: Record<
      string,
      { tokens: number; cost: number; percentage: number }
    > = {};
    filteredUsage.forEach((usage) => {
      if (!providerBreakdown[usage.provider]) {
        providerBreakdown[usage.provider] = {
          tokens: 0,
          cost: 0,
          percentage: 0,
        };
      }
      providerBreakdown[usage.provider].tokens += usage.totalTokens;
      providerBreakdown[usage.provider].cost += usage.totalCost;
    });

    // Calculate percentages
    Object.keys(providerBreakdown).forEach((provider) => {
      providerBreakdown[provider].percentage =
        totalTokens > 0
          ? (providerBreakdown[provider].tokens / totalTokens) * 100
          : 0;
    });

    // Model breakdown
    const modelBreakdown: Record<
      string,
      { tokens: number; cost: number; percentage: number }
    > = {};
    filteredUsage.forEach((usage) => {
      const key = `${usage.provider}/${usage.model}`;
      if (!modelBreakdown[key]) {
        modelBreakdown[key] = { tokens: 0, cost: 0, percentage: 0 };
      }
      modelBreakdown[key].tokens += usage.totalTokens;
      modelBreakdown[key].cost += usage.totalCost;
    });

    // Calculate percentages for models
    Object.keys(modelBreakdown).forEach((model) => {
      modelBreakdown[model].percentage =
        totalTokens > 0
          ? (modelBreakdown[model].tokens / totalTokens) * 100
          : 0;
    });

    // Daily usage (last 30 days)
    const dailyUsage = this.getDailyUsage(30);

    // Monthly usage (last 12 months)
    const monthlyUsage = this.getMonthlyUsage(12);

    return {
      totalTokens,
      totalCost,
      providerBreakdown,
      modelBreakdown,
      dailyUsage,
      monthlyUsage,
    };
  }

  /**
   * Get usage by provider
   */
  getUsageByProvider(provider: string, userId?: string): TokenUsage[] {
    return this.usageHistory.filter(
      (usage) =>
        usage.provider.toLowerCase() === provider.toLowerCase() &&
        (!userId || usage.userId === userId)
    );
  }

  /**
   * Get usage by model
   */
  getUsageByModel(model: string, userId?: string): TokenUsage[] {
    return this.usageHistory.filter(
      (usage) =>
        usage.model.toLowerCase() === model.toLowerCase() &&
        (!userId || usage.userId === userId)
    );
  }

  /**
   * Get cost breakdown by provider
   */
  getCostBreakdown(userId?: string): Record<string, number> {
    const breakdown: Record<string, number> = {};

    this.usageHistory
      .filter((usage) => !userId || usage.userId === userId)
      .forEach((usage) => {
        if (!breakdown[usage.provider]) {
          breakdown[usage.provider] = 0;
        }
        breakdown[usage.provider] += usage.totalCost;
      });

    return breakdown;
  }

  /**
   * Get token efficiency metrics
   */
  getEfficiencyMetrics(userId?: string): {
    avgTokensPerRequest: number;
    avgCostPerRequest: number;
    mostUsedProvider: string;
    mostUsedModel: string;
    costPerToken: number;
  } {
    const filteredUsage = this.usageHistory.filter(
      (usage) => !userId || usage.userId === userId
    );

    if (filteredUsage.length === 0) {
      return {
        avgTokensPerRequest: 0,
        avgCostPerRequest: 0,
        mostUsedProvider: '',
        mostUsedModel: '',
        costPerToken: 0,
      };
    }

    const totalTokens = filteredUsage.reduce(
      (sum, usage) => sum + usage.totalTokens,
      0
    );
    const totalCost = filteredUsage.reduce(
      (sum, usage) => sum + usage.totalCost,
      0
    );

    // Most used provider
    const providerCounts: Record<string, number> = {};
    filteredUsage.forEach((usage) => {
      providerCounts[usage.provider] =
        (providerCounts[usage.provider] || 0) + 1;
    });
    const mostUsedProvider = Object.keys(providerCounts).reduce(
      (a, b) => (providerCounts[a] > providerCounts[b] ? a : b),
      ''
    );

    // Most used model
    const modelCounts: Record<string, number> = {};
    filteredUsage.forEach((usage) => {
      const key = `${usage.provider}/${usage.model}`;
      modelCounts[key] = (modelCounts[key] || 0) + 1;
    });
    const mostUsedModel = Object.keys(modelCounts).reduce(
      (a, b) => (modelCounts[a] > modelCounts[b] ? a : b),
      ''
    );

    return {
      avgTokensPerRequest: totalTokens / filteredUsage.length,
      avgCostPerRequest: totalCost / filteredUsage.length,
      mostUsedProvider,
      mostUsedModel,
      costPerToken: totalTokens > 0 ? totalCost / totalTokens : 0,
    };
  }

  /**
   * Export usage data
   */
  exportUsageData(userId?: string, format: 'json' | 'csv' = 'json'): string {
    const filteredUsage = this.usageHistory.filter(
      (usage) => !userId || usage.userId === userId
    );

    if (format === 'csv') {
      const headers =
        'Provider,Model,Input Tokens,Output Tokens,Total Tokens,Input Cost,Output Cost,Total Cost,Timestamp,Session ID,User ID';
      const rows = filteredUsage.map(
        (usage) =>
          `${usage.provider},${usage.model},${usage.inputTokens},${usage.outputTokens},${usage.totalTokens},${usage.inputCost.toFixed(6)},${usage.outputCost.toFixed(6)},${usage.totalCost.toFixed(6)},${usage.timestamp.toISOString()},${usage.sessionId || ''},${usage.userId || ''}`
      );
      return [headers, ...rows].join('\n');
    }

    return JSON.stringify(filteredUsage, null, 2);
  }

  /**
   * Clear usage history
   */
  clearHistory(userId?: string): void {
    if (userId) {
      this.usageHistory = this.usageHistory.filter(
        (usage) => usage.userId !== userId
      );
    } else {
      this.usageHistory = [];
    }
    this.dailyStats.clear();
    this.monthlyStats.clear();
  }

  /**
   * Update daily statistics
   */
  private updateDailyStats(usage: TokenUsage): void {
    const dateKey = usage.timestamp.toISOString().split('T')[0];
    const current = this.dailyStats.get(dateKey) || { tokens: 0, cost: 0 };
    current.tokens += usage.totalTokens;
    current.cost += usage.totalCost;
    this.dailyStats.set(dateKey, current);
  }

  /**
   * Update monthly statistics
   */
  private updateMonthlyStats(usage: TokenUsage): void {
    const monthKey = usage.timestamp.toISOString().substring(0, 7); // YYYY-MM
    const current = this.monthlyStats.get(monthKey) || { tokens: 0, cost: 0 };
    current.tokens += usage.totalTokens;
    current.cost += usage.totalCost;
    this.monthlyStats.set(monthKey, current);
  }

  /**
   * Get daily usage for the last N days
   */
  private getDailyUsage(
    days: number
  ): Array<{ date: string; tokens: number; cost: number }> {
    const result: Array<{ date: string; tokens: number; cost: number }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const stats = this.dailyStats.get(dateKey) || { tokens: 0, cost: 0 };
      result.push({
        date: dateKey,
        tokens: stats.tokens,
        cost: stats.cost,
      });
    }

    return result;
  }

  /**
   * Get monthly usage for the last N months
   */
  private getMonthlyUsage(
    months: number
  ): Array<{ month: string; tokens: number; cost: number }> {
    const result: Array<{ month: string; tokens: number; cost: number }> = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);
      const stats = this.monthlyStats.get(monthKey) || { tokens: 0, cost: 0 };
      result.push({
        month: monthKey,
        tokens: stats.tokens,
        cost: stats.cost,
      });
    }

    return result;
  }
}

// Export singleton instance
export const tokenTrackingService = TokenTrackingService.getInstance();
