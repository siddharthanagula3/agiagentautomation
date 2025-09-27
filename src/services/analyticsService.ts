import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type Job = Database['public']['Tables']['jobs']['Row'];
type UsageTracking = Database['public']['Tables']['usage_tracking']['Row'];

export interface UsageStats {
  totalTokens: number;
  totalCost: number;
  totalDuration: number;
  periodUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
    duration: number;
  }>;
}

export interface CostAnalysis {
  totalCost: number;
  agentCosts: Record<string, { cost: number; count: number }>;
  monthlyBreakdown: Array<{
    month: string;
    cost: number;
  }>;
}

export interface AnalyticsData {
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
  totalCost: number;
  avgCompletionTime: number;
  successRate: number;
  tokensUsed: number;
  topPerformers: Array<{
    id: string;
    name: string;
    role: string;
    tasks: number;
    rating: number;
    efficiency: number;
  }>;
  usageByCategory: Array<{
    category: string;
    count: number;
    cost: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    jobs: number;
    cost: number;
    tokens: number;
  }>;
}

export interface PerformanceMetrics {
  efficiency: number;
  accuracy: number;
  speed: number;
  reliability: number;
}

class AnalyticsService {
  async getUserAnalytics(userId: string): Promise<{ data: AnalyticsData; error: string | null }> {
    try {
      // Get basic job stats
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('status, cost, actual_duration, created_at, assigned_agent_id')
        .eq('user_id', userId);

      if (jobsError) {
        return { 
          data: this.getEmptyAnalytics(), 
          error: jobsError.message 
        };
      }

      // Get usage tracking
      const { data: usage, error: usageError } = await supabase
        .from('usage_tracking')
        .select('tokens_used, cost, agent_id')
        .eq('user_id', userId);

      if (usageError) {
        return { 
          data: this.getEmptyAnalytics(), 
          error: usageError.message 
        };
      }

      // Get agent performance data
      const { data: agents, error: agentsError } = await supabase
        .from('ai_agents')
        .select('id, name, role, rating, tasks_completed')
        .in('id', jobs?.map(job => job.assigned_agent_id).filter(Boolean) || []);

      if (agentsError) {
        return { 
          data: this.getEmptyAnalytics(), 
          error: agentsError.message 
        };
      }

      // Calculate analytics
      const totalJobs = jobs?.length || 0;
      const completedJobs = jobs?.filter(job => job.status === 'completed').length || 0;
      const activeJobs = jobs?.filter(job => job.status === 'running').length || 0;
      const totalCost = jobs?.reduce((sum, job) => sum + (job.cost || 0), 0) || 0;
      const avgCompletionTime = this.calculateAvgCompletionTime(jobs || []);
      const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
      const tokensUsed = usage?.reduce((sum, u) => sum + (u.tokens_used || 0), 0) || 0;

      // Top performers
      const topPerformers = agents?.map(agent => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        tasks: agent.tasks_completed,
        rating: agent.rating,
        efficiency: Math.min(100, (agent.tasks_completed / 10) * 100) // Mock efficiency calculation
      })).sort((a, b) => b.rating - a.rating).slice(0, 5) || [];

      // Usage by category (mock data for now)
      const usageByCategory = [
        { category: 'Data Analysis', count: 15, cost: 250.00 },
        { category: 'Content Creation', count: 12, cost: 180.00 },
        { category: 'Code Review', count: 8, cost: 120.00 },
        { category: 'Research', count: 6, cost: 90.00 }
      ];

      // Monthly trends (mock data for now)
      const monthlyTrends = this.generateMonthlyTrends();

      const analytics: AnalyticsData = {
        totalJobs,
        completedJobs,
        activeJobs,
        totalCost,
        avgCompletionTime,
        successRate,
        tokensUsed,
        topPerformers,
        usageByCategory,
        monthlyTrends
      };

      return { data: analytics, error: null };
    } catch (error) {
      return { 
        data: this.getEmptyAnalytics(), 
        error: 'An unexpected error occurred' 
      };
    }
  } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }

  async getPerformanceMetrics(agentId: string): Promise<{ data: PerformanceMetrics; error: string | null }> {
    try {
      // Get agent's job history
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('status, actual_duration, estimated_duration, created_at')
        .eq('assigned_agent_id', agentId);

      if (error) {
        return { 
          data: { efficiency: 0, accuracy: 0, speed: 0, reliability: 0 }, 
          error: error.message 
        };
      }

      const completedJobs = jobs?.filter(job => job.status === 'completed') || [];
      const totalJobs = jobs?.length || 1;

      // Calculate metrics
      const efficiency = completedJobs.length / totalJobs * 100;
      const accuracy = Math.min(100, 85 + Math.random() * 15); // Mock accuracy
      const speed = this.calculateSpeed(completedJobs);
      const reliability = Math.min(100, 90 + Math.random() * 10); // Mock reliability

      return { 
        data: { efficiency, accuracy, speed, reliability }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: { efficiency: 0, accuracy: 0, speed: 0, reliability: 0 }, 
        error: 'An unexpected error occurred' 
      };
    }
  } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }

  async getUsageStats(userId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<{ data: UsageStats | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('tokens_used, cost, duration_minutes, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      // Filter by period
      const now = new Date();
      const periodStart = this.getPeriodStart(now, period);
      
      const filteredData = data?.filter(usage => 
        new Date(usage.created_at) >= periodStart
      ) || [];

      const totalTokens = filteredData.reduce((sum, usage) => sum + (usage.tokens_used || 0), 0);
      const totalCost = filteredData.reduce((sum, usage) => sum + (usage.cost || 0), 0);
      const totalDuration = filteredData.reduce((sum, usage) => sum + (usage.duration_minutes || 0), 0);

      return { 
        data: {
          totalTokens,
          totalCost,
          totalDuration,
          avgTokensPerDay: totalTokens / this.getDaysInPeriod(period),
          avgCostPerDay: totalCost / this.getDaysInPeriod(period)
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: 'An unexpected error occurred' };
    }
  } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }

  async getCostAnalysis(userId: string): Promise<{ data: CostAnalysis | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('cost, agent_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      // Group by agent and calculate costs
      const agentCosts = data?.reduce((acc, usage) => {
        const agentId = usage.agent_id || 'unknown';
        if (!acc[agentId]) {
          acc[agentId] = { cost: 0, count: 0 };
        }
        acc[agentId].cost += usage.cost || 0;
        acc[agentId].count += 1;
        return acc;
      }, {} as Record<string, { cost: number; count: number }>) || {};

      return { data: agentCosts, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: null, error: null };
    }
  }

  private getEmptyAnalytics(): AnalyticsData {
    return {
      totalJobs: 0,
      completedJobs: 0,
      activeJobs: 0,
      totalCost: 0,
      avgCompletionTime: 0,
      successRate: 0,
      tokensUsed: 0,
      topPerformers: [],
      usageByCategory: [],
      monthlyTrends: []
    };
  }

  private calculateAvgCompletionTime(jobs: Job[]): number {
    const completedJobs = jobs.filter(job => job.status === 'completed' && job.actual_duration);
    if (completedJobs.length === 0) return 0;
    
    const totalMinutes = completedJobs.reduce((sum, job) => sum + (job.actual_duration || 0), 0);
    return Math.round(totalMinutes / completedJobs.length);
  }

  private calculateSpeed(completedJobs: Job[]): number {
    if (completedJobs.length === 0) return 0;
    
    const avgDuration = completedJobs.reduce((sum, job) => sum + (job.actual_duration || 0), 0) / completedJobs.length;
    // Convert to speed score (lower duration = higher speed)
    return Math.max(0, Math.min(100, 100 - (avgDuration / 60))); // Assuming 60 minutes is baseline
  }

  private generateMonthlyTrends(): Array<{ month: string; jobs: number; cost: number; tokens: number }> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      jobs: Math.floor(Math.random() * 20) + 5,
      cost: Math.floor(Math.random() * 500) + 100,
      tokens: Math.floor(Math.random() * 10000) + 2000
    }));
  }

  private getPeriodStart(now: Date, period: string): Date {
    const start = new Date(now);
    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    return start;
  }

  private getDaysInPeriod(period: string): number {
    switch (period) {
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'year':
        return 365;
      default:
        return 30;
    }
    console.error('Service error:', error);
    return { data: [], error: null };
  }
}

export const analyticsService = new AnalyticsService();
