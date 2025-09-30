/**
 * Real Data Service - Connects to Supabase for all application data
 * Replaces all mock data with real database queries
 */

import { supabase } from '@/integrations/supabase/client';
import { enhancedCache } from './enhanced-cache-service';

// ========================================
// Types
// ========================================

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'draft';
  progress: number;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  next_run_at?: string;
  execution_count: number;
  success_rate: number;
  avg_duration_minutes: number;
  assigned_employee_ids: string[];
  user_id: string;
}

export interface AnalyticsMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  totalTasks: number;
  taskGrowth: number;
  averageEfficiency: number;
  efficiencyGrowth: number;
  activeEmployees: number;
  employeeGrowth: number;
  successRate: number;
  successGrowth: number;
  avgResponseTime: number;
  responseTimeChange: number;
}

export interface PerformanceData {
  name: string;
  revenue: number;
  tasks: number;
  efficiency: number;
  date: string;
}

export interface DepartmentDistribution {
  name: string;
  value: number;
  color: string;
}

export interface EmployeePerformance {
  id: string;
  name: string;
  performance: number;
  tasks: number;
  revenue: number;
  success_rate: number;
}

export interface WorkflowStats {
  name: string;
  success: number;
  failed: number;
  total: number;
  category: string;
}

// ========================================
// Workflow Service
// ========================================

export class WorkflowService {
  private cachePrefix = 'workflow:';

  async getAllWorkflows(userId: string): Promise<Workflow[]> {
    const cacheKey = `${this.cachePrefix}all:${userId}`;
    
    // Try cache first
    const cached = await enhancedCache.get<Workflow[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const workflows = data || [];
      
      // Cache for 5 minutes
      await enhancedCache.set(cacheKey, workflows, {
        ttl: 5 * 60 * 1000,
        tags: ['workflows', userId],
      });

      return workflows;
    } catch (error) {
      console.error('Error fetching workflows:', error);
      return [];
    }
  }

  async getWorkflowStats(userId: string): Promise<{
    total: number;
    active: number;
    paused: number;
    avgSuccessRate: number;
    totalExecutions: number;
    avgDuration: number;
  }> {
    const workflows = await this.getAllWorkflows(userId);

    return {
      total: workflows.length,
      active: workflows.filter(w => w.status === 'running').length,
      paused: workflows.filter(w => w.status === 'paused').length,
      avgSuccessRate:
        workflows.reduce((acc, w) => acc + w.success_rate, 0) / workflows.length || 0,
      totalExecutions: workflows.reduce((acc, w) => acc + w.execution_count, 0),
      avgDuration:
        workflows.reduce((acc, w) => acc + w.avg_duration_minutes, 0) / workflows.length || 0,
    };
  }

  async createWorkflow(workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<Workflow | null> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert([workflow])
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache
      await enhancedCache.deleteByTag('workflows');

      return data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      return null;
    }
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .update({...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache
      await enhancedCache.deleteByTag('workflows');

      return data;
    } catch (error) {
      console.error('Error updating workflow:', error);
      return null;
    }
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Invalidate cache
      await enhancedCache.deleteByTag('workflows');

      return true;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      return false;
    }
  }
}

// ========================================
// Analytics Service
// ========================================

export class AnalyticsService {
  private cachePrefix = 'analytics:';

  async getMetrics(userId: string, timeRange: string = '7d'): Promise<AnalyticsMetrics> {
    const cacheKey = `${this.cachePrefix}metrics:${userId}:${timeRange}`;
    
    // Try cache first
    const cached = await enhancedCache.get<AnalyticsMetrics>(cacheKey);
    if (cached) return cached;

    try {
      // Get current period data
      const { data: currentData } = await supabase
        .rpc('get_analytics_metrics', {
          p_user_id: userId,
          p_time_range: timeRange,
        });

      // Get previous period for comparison
      const { data: previousData } = await supabase
        .rpc('get_analytics_metrics', {
          p_user_id: userId,
          p_time_range: this.getPreviousPeriod(timeRange),
        });

      const current = currentData || {};
      const previous = previousData || {};

      const metrics: AnalyticsMetrics = {
        totalRevenue: current.total_revenue || 0,
        revenueGrowth: this.calculateGrowth(current.total_revenue, previous.total_revenue),
        totalTasks: current.total_tasks || 0,
        taskGrowth: this.calculateGrowth(current.total_tasks, previous.total_tasks),
        averageEfficiency: current.avg_efficiency || 0,
        efficiencyGrowth: this.calculateGrowth(current.avg_efficiency, previous.avg_efficiency),
        activeEmployees: current.active_employees || 0,
        employeeGrowth: this.calculateGrowth(current.active_employees, previous.active_employees),
        successRate: current.success_rate || 0,
        successGrowth: this.calculateGrowth(current.success_rate, previous.success_rate),
        avgResponseTime: current.avg_response_time || 0,
        responseTimeChange: this.calculateGrowth(previous.avg_response_time, current.avg_response_time), // Lower is better
      };

      // Cache for 10 minutes
      await enhancedCache.set(cacheKey, metrics, {
        ttl: 10 * 60 * 1000,
        tags: ['analytics', userId],
      });

      return metrics;
    } catch (error) {
      console.error('Error fetching analytics metrics:', error);
      // Return default metrics
      return {
        totalRevenue: 0,
        revenueGrowth: 0,
        totalTasks: 0,
        taskGrowth: 0,
        averageEfficiency: 0,
        efficiencyGrowth: 0,
        activeEmployees: 0,
        employeeGrowth: 0,
        successRate: 0,
        successGrowth: 0,
        avgResponseTime: 0,
        responseTimeChange: 0,
      };
    }
  }

  async getPerformanceData(userId: string, timeRange: string = '7d'): Promise<PerformanceData[]> {
    const cacheKey = `${this.cachePrefix}performance:${userId}:${timeRange}`;
    
    // Try cache first
    const cached = await enhancedCache.get<PerformanceData[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .rpc('get_performance_data', {
          p_user_id: userId,
          p_time_range: timeRange,
        });

      if (error) throw error;

      const performanceData = data || [];

      // Cache for 15 minutes
      await enhancedCache.set(cacheKey, performanceData, {
        ttl: 15 * 60 * 1000,
        tags: ['analytics', userId],
      });

      return performanceData;
    } catch (error) {
      console.error('Error fetching performance data:', error);
      return [];
    }
  }

  async getDepartmentDistribution(userId: string): Promise<DepartmentDistribution[]> {
    const cacheKey = `${this.cachePrefix}departments:${userId}`;
    
    // Try cache first
    const cached = await enhancedCache.get<DepartmentDistribution[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .rpc('get_department_distribution', {
          p_user_id: userId,
        });

      if (error) throw error;

      const distribution = data || [];

      // Cache for 30 minutes
      await enhancedCache.set(cacheKey, distribution, {
        ttl: 30 * 60 * 1000,
        tags: ['analytics', userId],
      });

      return distribution;
    } catch (error) {
      console.error('Error fetching department distribution:', error);
      return [];
    }
  }

  async getEmployeePerformance(userId: string): Promise<EmployeePerformance[]> {
    const cacheKey = `${this.cachePrefix}employees:${userId}`;
    
    // Try cache first
    const cached = await enhancedCache.get<EmployeePerformance[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .rpc('get_employee_performance', {
          p_user_id: userId,
        });

      if (error) throw error;

      const performance = data || [];

      // Cache for 10 minutes
      await enhancedCache.set(cacheKey, performance, {
        ttl: 10 * 60 * 1000,
        tags: ['analytics', userId],
      });

      return performance;
    } catch (error) {
      console.error('Error fetching employee performance:', error);
      return [];
    }
  }

  async getWorkflowStats(userId: string): Promise<WorkflowStats[]> {
    const cacheKey = `${this.cachePrefix}workflow_stats:${userId}`;
    
    // Try cache first
    const cached = await enhancedCache.get<WorkflowStats[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .rpc('get_workflow_stats', {
          p_user_id: userId,
        });

      if (error) throw error;

      const stats = data || [];

      // Cache for 10 minutes
      await enhancedCache.set(cacheKey, stats, {
        ttl: 10 * 60 * 1000,
        tags: ['analytics', userId],
      });

      return stats;
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      return [];
    }
  }

  private calculateGrowth(current: number, previous: number): number {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private getPreviousPeriod(timeRange: string): string {
    // Map time ranges to previous periods
    const map: Record<string, string> = {
      '24h': '48h',
      '7d': '14d',
      '30d': '60d',
      '90d': '180d',
    };
    return map[timeRange] || '14d';
  }
}

// ========================================
// Singleton Instances
// ========================================

export const workflowService = new WorkflowService();
export const analyticsService = new AnalyticsService();
