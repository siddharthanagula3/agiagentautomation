/**
 * Analytics Service - Real Data from Supabase
 * Replaces all mock data with actual database queries
 */

import { supabase } from '@/integrations/supabase/client';
import { cacheService, CacheKeys, CacheTTL } from './cache-service';

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalExecutions: number;
  successRate: number;
  totalTokensUsed: number;
  totalCost: number;
  avgExecutionTime: number;
  runningWorkflows: number;
  completedToday: number;
}

export interface AnalyticsMetric {
  id: string;
  metricType: string;
  metricName: string;
  metricValue: number;
  metricUnit?: string;
  timePeriod: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface PerformanceMetric {
  category: string;
  name: string;
  responseTime: number;
  successRate: number;
  errorCount: number;
  totalRequests: number;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

class AnalyticsService {
  /**
   * Get dashboard statistics for user
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const cacheKey = CacheKeys.dashboardStats(userId);
    
    // Try cache first
    const cached = await cacheService.get<DashboardStats>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      // Use the database function we created
      const { data, error } = await supabase
        .rpc('get_dashboard_stats', { user_uuid: userId });
      
      if (error) throw error;
      
      const stats: DashboardStats = {
        totalEmployees: data.total_employees || 0,
        activeEmployees: data.total_employees || 0,
        totalExecutions: data.completed_executions + data.failed_executions || 0,
        successRate: data.success_rate || 0,
        totalTokensUsed: data.total_tokens_used || 0,
        totalCost: data.total_cost || 0,
        avgExecutionTime: data.avg_execution_time || 0,
        runningWorkflows: data.active_executions || 0,
        completedToday: data.completed_executions || 0
      };
      
      // Cache for 30 seconds
      await cacheService.set(cacheKey, stats, { ttl: CacheTTL.SHORT });
      
      return stats;
    } catch (error) {
      console.error('[Analytics] Error fetching dashboard stats:', error);
      
      // Return default stats on error
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        totalExecutions: 0,
        successRate: 0,
        totalTokensUsed: 0,
        totalCost: 0,
        avgExecutionTime: 0,
        runningWorkflows: 0,
        completedToday: 0
      };
    }
  }
  
  /**
   * Get analytics metrics for a time period
   */
  async getAnalyticsMetrics(
    userId: string,
    timePeriod: 'hourly' | 'daily' | 'weekly' | 'monthly',
    limit: number = 30
  ): Promise<AnalyticsMetric[]> {
    try {
      const { data, error } = await supabase
        .from('analytics_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('time_period', timePeriod)
        .order('period_start', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(metric => ({
        id: metric.id,
        metricType: metric.metric_type,
        metricName: metric.metric_name,
        metricValue: metric.metric_value,
        metricUnit: metric.metric_unit,
        timePeriod: metric.time_period,
        periodStart: new Date(metric.period_start),
        periodEnd: new Date(metric.period_end)
      }));
    } catch (error) {
      console.error('[Analytics] Error fetching metrics:', error);
      return [];
    }
  }
  
  /**
   * Get chart data for executions over time
   */
  async getExecutionChartData(
    userId: string,
    days: number = 7
  ): Promise<ChartData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('workforce_executions')
        .select('status, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Group by date
      const groupedData = new Map<string, { completed: number; failed: number }>();
      
      (data || []).forEach(execution => {
        const date = new Date(execution.created_at).toLocaleDateString();
        const current = groupedData.get(date) || { completed: 0, failed: 0 };
        
        if (execution.status === 'completed') {
          current.completed++;
        } else if (execution.status === 'failed') {
          current.failed++;
        }
        
        groupedData.set(date, current);
      });
      
      // Convert to chart data format
      const chartData: ChartData[] = Array.from(groupedData.entries()).map(
        ([date, counts]) => ({
          name: date,
          completed: counts.completed,
          failed: counts.failed,
          value: counts.completed + counts.failed
        })
      );
      
      return chartData;
    } catch (error) {
      console.error('[Analytics] Error fetching execution chart data:', error);
      return [];
    }
  }
  
  /**
   * Get workflow success rates
   */
  async getWorkflowAnalytics(userId: string): Promise<ChartData[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('total_executions', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      return (data || []).map(workflow => ({
        name: workflow.workflow_name,
        success: Math.round(workflow.success_rate),
        failed: Math.round(100 - workflow.success_rate),
        total: workflow.total_executions,
        avgDuration: Math.round(workflow.avg_duration_ms / 1000) // Convert to seconds
      }));
    } catch (error) {
      console.error('[Analytics] Error fetching workflow analytics:', error);
      return [];
    }
  }
  
  /**
   * Get employee performance metrics
   */
  async getEmployeePerformance(userId: string): Promise<ChartData[]> {
    try {
      const { data, error } = await supabase
        .from('employee_performance')
        .select('*')
        .eq('user_id', userId)
        .order('total_tasks', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(employee => ({
        name: employee.role,
        tasks: employee.completed_tasks,
        successRate: Math.round(employee.success_rate),
        avgDuration: Math.round(employee.avg_task_duration),
        cost: employee.total_cost,
        provider: employee.provider
      }));
    } catch (error) {
      console.error('[Analytics] Error fetching employee performance:', error);
      return [];
    }
  }
  
  /**
   * Get performance metrics by category
   */
  async getPerformanceMetrics(
    userId: string,
    category?: string
  ): Promise<PerformanceMetric[]> {
    try {
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('measured_at', { ascending: false })
        .limit(100);
      
      if (category) {
        query = query.eq('metric_category', category);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(metric => ({
        category: metric.metric_category,
        name: metric.metric_name,
        responseTime: metric.response_time || 0,
        successRate: metric.success_rate || 0,
        errorCount: metric.error_count || 0,
        totalRequests: metric.total_requests || 0
      }));
    } catch (error) {
      console.error('[Analytics] Error fetching performance metrics:', error);
      return [];
    }
  }
  
  /**
   * Get cost breakdown by service
   */
  async getCostBreakdown(
    userId: string,
    days: number = 30
  ): Promise<ChartData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('cost_tracking')
        .select('service_type, service_name, cost_amount, usage_amount')
        .eq('user_id', userId)
        .gte('billing_period_start', startDate.toISOString());
      
      if (error) throw error;
      
      // Group by service type
      const groupedData = new Map<string, { cost: number; usage: number }>();
      
      (data || []).forEach(item => {
        const current = groupedData.get(item.service_type) || { cost: 0, usage: 0 };
        current.cost += item.cost_amount;
        current.usage += item.usage_amount || 0;
        groupedData.set(item.service_type, current);
      });
      
      return Array.from(groupedData.entries()).map(([service, data]) => ({
        name: service,
        cost: Math.round(data.cost * 100) / 100,
        usage: Math.round(data.usage),
        value: data.cost
      }));
    } catch (error) {
      console.error('[Analytics] Error fetching cost breakdown:', error);
      return [];
    }
  }
  
  /**
   * Record an analytics event
   */
  async recordEvent(
    userId: string,
    eventType: string,
    eventName: string,
    eventData: Record<string, any> = {}
  ): Promise<void> {
    try {
      await supabase.rpc('record_analytics_event', {
        p_user_id: userId,
        p_event_type: eventType,
        p_event_name: eventName,
        p_event_data: eventData
      });
      
      // Invalidate relevant caches
      await cacheService.invalidateByTags([userId, 'analytics']);
    } catch (error) {
      console.error('[Analytics] Error recording event:', error);
    }
  }
  
  /**
   * Get recent activity for user
   */
  async getRecentActivity(
    userId: string,
    limit: number = 10
  ): Promise<Array<{
    id: string;
    eventType: string;
    eventName: string;
    eventData: any;
    createdAt: Date;
  }>> {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(event => ({
        id: event.id,
        eventType: event.event_type,
        eventName: event.event_name,
        eventData: event.event_data,
        createdAt: new Date(event.created_at)
      }));
    } catch (error) {
      console.error('[Analytics] Error fetching recent activity:', error);
      return [];
    }
  }
  
  /**
   * Get API usage summary
   */
  async getAPIUsageSummary(
    userId: string,
    days: number = 30
  ): Promise<{
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    byProvider: Map<string, { calls: number; tokens: number; cost: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      const summary = {
        totalCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        byProvider: new Map<string, { calls: number; tokens: number; cost: number }>()
      };
      
      (data || []).forEach(usage => {
        summary.totalCalls++;
        summary.totalTokens += usage.tokens_used || 0;
        summary.totalCost += usage.cost || 0;
        
        const provider = usage.agent_id || 'unknown';
        const current = summary.byProvider.get(provider) || {
          calls: 0,
          tokens: 0,
          cost: 0
        };
        
        current.calls++;
        current.tokens += usage.tokens_used || 0;
        current.cost += usage.cost || 0;
        
        summary.byProvider.set(provider, current);
      });
      
      return summary;
    } catch (error) {
      console.error('[Analytics] Error fetching API usage summary:', error);
      return {
        totalCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        byProvider: new Map()
      };
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
