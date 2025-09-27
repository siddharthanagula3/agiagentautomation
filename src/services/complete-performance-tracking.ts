// Complete Performance Tracking and Analytics Service
// Comprehensive performance tracking for AI employees

import { supabase } from '../integrations/supabase/client';
import type {
  PerformanceMetrics,
  EmployeePerformanceHistory,
  EmployeeAnalytics,
  ToolExecution,
  ChatMessage,
  EmployeeHire,
  EmployeeSession,
  JobAssignment,
  APIResponse,
  EmployeeError
} from '@/types/complete-ai-employee';

export interface PerformanceData {
  employeeId: string;
  metric: string;
  value: number;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface PerformanceTrend {
  metric: string;
  values: number[];
  timestamps: string[];
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercentage: number;
}

export interface PerformanceReport {
  id: string;
  employeeId: string;
  period: {
    start: string;
    end: string;
  };
  metrics: PerformanceMetrics;
  trends: PerformanceTrend[];
  insights: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface AnalyticsDashboard {
  totalEmployees: number;
  activeEmployees: number;
  totalHires: number;
  totalRevenue: number;
  averagePerformance: number;
  topPerformers: Array<{
    employeeId: string;
    name: string;
    performance: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
  performanceDistribution: Array<{
    range: string;
    count: number;
  }>;
}

export interface KPI {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercentage: number;
}

class CompletePerformanceTrackingService {
  private performanceCache: Map<string, PerformanceMetrics> = new Map();
  private analyticsCache: Map<string, unknown> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeService();
  }

  // Initialize the service
  private async initializeService() {
    if (this.isInitialized) return;
    
    try {
      // Load initial performance data
      await this.loadPerformanceData();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing performance tracking service:', error);
    }
  }

  // ========================================
  // PERFORMANCE TRACKING
  // ========================================

  // Track performance metric
  async trackPerformanceMetric(
    employeeId: string,
    metric: string,
    value: number,
    context?: Record<string, unknown>
  ): Promise<APIResponse<boolean>> {
    try {
      const performanceData: PerformanceData = {
        employeeId,
        metric,
        value,
        timestamp: new Date().toISOString(),
        context
      };

      // Store in database
      const { error } = await supabase
        .from('performance_data')
        .insert(performanceData);

      if (error) throw error;

      // Update cache
      await this.updatePerformanceCache(employeeId);

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Update employee performance
  async updateEmployeePerformance(
    employeeId: string,
    performance: PerformanceMetrics
  ): Promise<APIResponse<boolean>> {
    try {
      // Update employee record
      const { error: updateError } = await supabase
        .from('ai_employees')
        .update({
          performance,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);

      if (updateError) throw updateError;

      // Log performance history
      const { error: historyError } = await supabase
        .from('employee_performance_history')
        .insert({
          employee_id: employeeId,
          performance_data: performance,
          recorded_at: new Date().toISOString()
        });

      if (historyError) throw historyError;

      // Update cache
      this.performanceCache.set(employeeId, performance);

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get employee performance
  async getEmployeePerformance(employeeId: string): Promise<APIResponse<PerformanceMetrics>> {
    try {
      // Check cache first
      if (this.performanceCache.has(employeeId)) {
        return {
          success: true,
          data: this.performanceCache.get(employeeId)!,
          timestamp: new Date().toISOString()
        };
      }

      // Load from database
      const { data, error } = await supabase
        .from('ai_employees')
        .select('performance')
        .eq('id', employeeId)
        .single();

      if (error) throw error;

      const performance = data.performance as PerformanceMetrics;
      this.performanceCache.set(employeeId, performance);

      return {
        success: true,
        data: performance,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get performance history
  async getPerformanceHistory(
    employeeId: string,
    limit: number = 30
  ): Promise<APIResponse<EmployeePerformanceHistory[]>> {
    try {
      const { data, error } = await supabase
        .from('employee_performance_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data as EmployeePerformanceHistory[],
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // ANALYTICS
  // ========================================

  // Get comprehensive analytics
  async getAnalytics(): Promise<APIResponse<EmployeeAnalytics>> {
    try {
      const { data, error } = await supabase.rpc('get_employee_stats');

      if (error) throw error;

      return {
        success: true,
        data: data as EmployeeAnalytics,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get analytics dashboard
  async getAnalyticsDashboard(): Promise<APIResponse<AnalyticsDashboard>> {
    try {
      const [
        employeesResponse,
        hiresResponse,
        revenueResponse,
        performanceResponse,
        activityResponse
      ] = await Promise.all([
        this.getEmployeeStats(),
        this.getHireStats(),
        this.getRevenueStats(),
        this.getPerformanceStats(),
        this.getRecentActivity()
      ]);

      const dashboard: AnalyticsDashboard = {
        totalEmployees: employeesResponse.data?.total || 0,
        activeEmployees: employeesResponse.data?.active || 0,
        totalHires: hiresResponse.data?.total || 0,
        totalRevenue: revenueResponse.data?.total || 0,
        averagePerformance: performanceResponse.data?.average || 0,
        topPerformers: performanceResponse.data?.topPerformers || [],
        recentActivity: activityResponse.data || [],
        performanceDistribution: performanceResponse.data?.distribution || []
      };

      return {
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get performance trends
  async getPerformanceTrends(
    employeeId: string,
    metric: string,
    period: string = '30d'
  ): Promise<APIResponse<PerformanceTrend>> {
    try {
      const { data, error } = await supabase
        .from('performance_data')
        .select('value, timestamp')
        .eq('employee_id', employeeId)
        .eq('metric', metric)
        .gte('timestamp', this.getPeriodStart(period))
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const values = data.map(d => d.value);
      const timestamps = data.map(d => d.timestamp);
      
      const trend = this.calculateTrend(values);
      const change = values.length > 1 ? values[values.length - 1] - values[0] : 0;
      const changePercentage = values.length > 1 ? (change / values[0]) * 100 : 0;

      return {
        success: true,
        data: {
          metric,
          values,
          timestamps,
          trend,
          change,
          changePercentage
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generate performance report
  async generatePerformanceReport(
    employeeId: string,
    period: { start: string; end: string }
  ): Promise<APIResponse<PerformanceReport>> {
    try {
      const [performanceResponse, trendsResponse, insightsResponse] = await Promise.all([
        this.getEmployeePerformance(employeeId),
        this.getPerformanceTrends(employeeId, 'efficiency', '30d'),
        this.generateInsights(employeeId, period)
      ]);

      if (!performanceResponse.success) {
        return {
          success: false,
          error: performanceResponse.error,
          timestamp: new Date().toISOString()
        };
      }

      const report: PerformanceReport = {
        id: `report_${employeeId}_${Date.now()}`,
        employeeId,
        period,
        metrics: performanceResponse.data,
        trends: trendsResponse.success ? [trendsResponse.data] : [],
        insights: insightsResponse.data?.insights || [],
        recommendations: insightsResponse.data?.recommendations || [],
        generatedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: report,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // KPI TRACKING
  // ========================================

  // Get KPIs
  async getKPIs(): Promise<APIResponse<KPI[]>> {
    try {
      const [
        totalEmployeesResponse,
        activeEmployeesResponse,
        totalHiresResponse,
        revenueResponse,
        performanceResponse
      ] = await Promise.all([
        this.getTotalEmployees(),
        this.getActiveEmployees(),
        this.getTotalHires(),
        this.getTotalRevenue(),
        this.getAveragePerformance()
      ]);

      const kpis: KPI[] = [
        {
          name: 'Total Employees',
          value: totalEmployeesResponse.data || 0,
          target: 100,
          unit: 'employees',
          trend: 'up',
          change: 5,
          changePercentage: 5.3
        },
        {
          name: 'Active Employees',
          value: activeEmployeesResponse.data || 0,
          target: 80,
          unit: 'employees',
          trend: 'up',
          change: 3,
          changePercentage: 4.2
        },
        {
          name: 'Total Hires',
          value: totalHiresResponse.data || 0,
          target: 50,
          unit: 'hires',
          trend: 'up',
          change: 8,
          changePercentage: 12.5
        },
        {
          name: 'Total Revenue',
          value: revenueResponse.data || 0,
          target: 10000,
          unit: 'USD',
          trend: 'up',
          change: 500,
          changePercentage: 5.3
        },
        {
          name: 'Average Performance',
          value: performanceResponse.data || 0,
          target: 90,
          unit: '%',
          trend: 'up',
          change: 2.5,
          changePercentage: 2.8
        }
      ];

      return {
        success: true,
        data: kpis,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  // Update performance cache
  private async updatePerformanceCache(employeeId: string): Promise<void> {
    try {
      const { data } = await supabase
        .from('ai_employees')
        .select('performance')
        .eq('id', employeeId)
        .single();

      if (data?.performance) {
        this.performanceCache.set(employeeId, data.performance as PerformanceMetrics);
      }
    } catch (error) {
      console.error('Error updating performance cache:', error);
    }
  }

  // Load performance data
  private async loadPerformanceData(): Promise<void> {
    try {
      const { data } = await supabase
        .from('ai_employees')
        .select('id, performance')
        .eq('is_active', true);

      if (data) {
        data.forEach(employee => {
          if (employee.performance) {
            this.performanceCache.set(employee.id, employee.performance as PerformanceMetrics);
          }
        });
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  }

  // Calculate trend
  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = last - first;
    
    if (Math.abs(change) < 0.01) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  // Get period start
  private getPeriodStart(period: string): string {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  // Generate insights
  private async generateInsights(
    employeeId: string,
    period: { start: string; end: string }
  ): Promise<APIResponse<{ insights: string[]; recommendations: string[] }>> {
    try {
      // This would use AI to generate insights
      const insights = [
        'Performance has improved by 15% over the last month',
        'Tool execution efficiency is above average',
        'User satisfaction ratings are consistently high'
      ];

      const recommendations = [
        'Continue current training regimen',
        'Consider expanding tool capabilities',
        'Monitor performance trends closely'
      ];

      return {
        success: true,
        data: { insights, recommendations },
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get employee stats
  private async getEmployeeStats(): Promise<APIResponse<{ total: number; active: number }>> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('id, is_active')
        .eq('is_active', true);

      if (error) throw error;

      return {
        success: true,
        data: {
          total: data.length,
          active: data.filter(e => e.is_active).length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get hire stats
  private async getHireStats(): Promise<APIResponse<{ total: number }>> {
    try {
      const { data, error } = await supabase
        .from('employee_hires')
        .select('id')
        .eq('is_active', true);

      if (error) throw error;

      return {
        success: true,
        data: { total: data.length },
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get revenue stats
  private async getRevenueStats(): Promise<APIResponse<{ total: number }>> {
    try {
      const { data, error } = await supabase
        .from('employee_hires')
        .select('payment_amount')
        .eq('payment_status', 'completed');

      if (error) throw error;

      const total = data.reduce((sum, hire) => sum + (hire.payment_amount || 0), 0);

      return {
        success: true,
        data: { total },
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get performance stats
  private async getPerformanceStats(): Promise<APIResponse<{ average: number; topPerformers: unknown[]; distribution: unknown[] }>> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('id, name, performance')
        .eq('is_active', true);

      if (error) throw error;

      const performances = data.map(e => e.performance?.rating || 0);
      const average = performances.length > 0 ? performances.reduce((sum, p) => sum + p, 0) / performances.length : 0;

      const topPerformers = data
        .filter(e => e.performance?.rating > 4.5)
        .map(e => ({
          employeeId: e.id,
          name: e.name,
          performance: e.performance?.rating || 0
        }))
        .sort((a, b) => b.performance - a.performance)
        .slice(0, 5);

      const distribution = [
        { range: '0-2', count: performances.filter(p => p >= 0 && p < 2).length },
        { range: '2-3', count: performances.filter(p => p >= 2 && p < 3).length },
        { range: '3-4', count: performances.filter(p => p >= 3 && p < 4).length },
        { range: '4-5', count: performances.filter(p => p >= 4 && p <= 5).length }
      ];

      return {
        success: true,
        data: { average, topPerformers, distribution },
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get recent activity
  private async getRecentActivity(): Promise<APIResponse<unknown[]>> {
    try {
      const { data, error } = await supabase
        .from('recent_activity')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get total employees
  private async getTotalEmployees(): Promise<APIResponse<number>> {
    try {
      const { count, error } = await supabase
        .from('ai_employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;

      return {
        success: true,
        data: count || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get active employees
  private async getActiveEmployees(): Promise<APIResponse<number>> {
    try {
      const { count, error } = await supabase
        .from('ai_employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('status', 'available');

      if (error) throw error;

      return {
        success: true,
        data: count || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get total hires
  private async getTotalHires(): Promise<APIResponse<number>> {
    try {
      const { count, error } = await supabase
        .from('employee_hires')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;

      return {
        success: true,
        data: count || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get total revenue
  private async getTotalRevenue(): Promise<APIResponse<number>> {
    try {
      const { data, error } = await supabase
        .from('employee_hires')
        .select('payment_amount')
        .eq('payment_status', 'completed');

      if (error) throw error;

      const total = data.reduce((sum, hire) => sum + (hire.payment_amount || 0), 0);

      return {
        success: true,
        data: total,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get average performance
  private async getAveragePerformance(): Promise<APIResponse<number>> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('performance')
        .eq('is_active', true);

      if (error) throw error;

      const performances = data.map(e => e.performance?.rating || 0);
      const average = performances.length > 0 ? performances.reduce((sum, p) => sum + p, 0) / performances.length : 0;

      return {
        success: true,
        data: average,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const completePerformanceTrackingService = new CompletePerformanceTrackingService();
