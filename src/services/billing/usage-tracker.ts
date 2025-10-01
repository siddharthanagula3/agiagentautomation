import { supabase } from '@/integrations/supabase/client';

export interface APICallRecord {
  userId: string;
  agentType: string;
  provider: string;
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  taskId: string;
  timestamp: Date;
  cost: number;
}

export interface UsageRecord {
  userId: string;
  timestamp: Date;
  agentType: string;
  apiProvider: string;
  tokensUsed: number;
  cost: number;
  taskId: string;
}

export interface UsageSummary {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  byAgent: Record<string, { calls: number; tokens: number; cost: number }>;
  byDay: Record<string, { calls: number; tokens: number; cost: number }>;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export class UsageTracker {
  private cache: Map<string, UsageRecord[]> = new Map();
  private cacheTimeout: number = 2 * 60 * 1000; // 2 minutes

  async trackAPICall(call: APICallRecord): Promise<void> {
    try {
      const usage: UsageRecord = {
        userId: call.userId,
        timestamp: call.timestamp,
        agentType: call.agentType,
        apiProvider: call.provider,
        tokensUsed: call.tokensUsed,
        cost: call.cost,
        taskId: call.taskId
      };

      // Store in database
      const { error } = await supabase
        .from('api_usage')
        .insert({
          user_id: call.userId,
          timestamp: call.timestamp.toISOString(),
          agent_type: call.agentType,
          api_provider: call.provider,
          tokens_used: call.tokensUsed,
          input_tokens: call.inputTokens,
          output_tokens: call.outputTokens,
          cost: call.cost,
          task_id: call.taskId
        });

      if (error) {
        throw error;
      }

      // Update local cache
      const userUsage = this.cache.get(call.userId) || [];
      userUsage.push(usage);
      this.cache.set(call.userId, userUsage);

      // Keep cache size manageable
      if (userUsage.length > 1000) {
        userUsage.splice(0, 500); // Remove oldest 500 entries
      }
    } catch (error) {
      console.error('Failed to track API usage:', error);
      throw new Error(`Usage tracking failed: ${error.message}`);
    }
  }

  async getUsageSummary(
    userId: string,
    period: DateRange
  ): Promise<UsageSummary> {
    try {
      const { data, error } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', period.start.toISOString())
        .lte('timestamp', period.end.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        throw error;
      }

      const usage = data || [];
      
      const summary: UsageSummary = {
        totalCalls: usage.length,
        totalTokens: usage.reduce((sum, r) => sum + (r.tokens_used || 0), 0),
        totalCost: usage.reduce((sum, r) => sum + (r.cost || 0), 0),
        byAgent: this.groupByAgent(usage),
        byDay: this.groupByDay(usage)
      };

      return summary;
    } catch (error) {
      throw new Error(`Failed to get usage summary: ${error.message}`);
    }
  }

  private groupByAgent(usage: any[]): Record<string, { calls: number; tokens: number; cost: number }> {
    const grouped: Record<string, { calls: number; tokens: number; cost: number }> = {};
    
    for (const record of usage) {
      const agent = record.agent_type || 'unknown';
      
      if (!grouped[agent]) {
        grouped[agent] = { calls: 0, tokens: 0, cost: 0 };
      }
      
      grouped[agent].calls += 1;
      grouped[agent].tokens += record.tokens_used || 0;
      grouped[agent].cost += record.cost || 0;
    }
    
    return grouped;
  }

  private groupByDay(usage: any[]): Record<string, { calls: number; tokens: number; cost: number }> {
    const grouped: Record<string, { calls: number; tokens: number; cost: number }> = {};
    
    for (const record of usage) {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      
      if (!grouped[date]) {
        grouped[date] = { calls: 0, tokens: 0, cost: 0 };
      }
      
      grouped[date].calls += 1;
      grouped[date].tokens += record.tokens_used || 0;
      grouped[date].cost += record.cost || 0;
    }
    
    return grouped;
  }

  calculateCost(
    provider: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const rates: Record<string, { input: number; output: number }> = {
      'claude': { input: 3, output: 15 },
      'gemini': { input: 0.075, output: 0.30 },
      'gpt4': { input: 10, output: 30 },
      'gpt3.5': { input: 0.5, output: 1.5 }
    };

    const rate = rates[provider.toLowerCase()] || { input: 1, output: 1 };
    const inputCost = (inputTokens / 1000000) * rate.input;
    const outputCost = (outputTokens / 1000000) * rate.output;

    return inputCost + outputCost;
  }

  async getCurrentMonthUsage(userId: string): Promise<UsageSummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.getUsageSummary(userId, {
      start: startOfMonth,
      end: endOfMonth
    });
  }

  async getDailyUsage(userId: string, days: number = 30): Promise<UsageSummary> {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    return this.getUsageSummary(userId, { start, end });
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }
}
