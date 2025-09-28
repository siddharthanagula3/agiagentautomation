import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type Report = Database['public']['Tables']['reports']['Row'];

export interface ReportData {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: 'analytics' | 'performance' | 'usage' | 'billing' | 'custom';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data: Record<string, any>;
  filters: Record<string, any>;
  generated_at: string;
  expires_at?: string;
  download_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  byType: {
    analytics: number;
    performance: number;
    usage: number;
    billing: number;
    custom: number;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  filters: Record<string, any>;
  schedule?: string;
  is_public: boolean;
}

class ReportsService {
  async getReports(userId: string, limit: number = 50): Promise<{ data: ReportData[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('ReportsService: Error fetching reports:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('ReportsService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch reports' };
    }
  }

  async getReportStats(userId: string): Promise<{ data: ReportStats; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('status, type')
        .eq('user_id', userId);

      if (error) {
        console.error('ReportsService: Error fetching stats:', error);
        return { 
          data: { total: 0, completed: 0, pending: 0, failed: 0, byType: { analytics: 0, performance: 0, usage: 0, billing: 0, custom: 0 } }, 
          error: error.message 
        };
      }

      const stats: ReportStats = {
        total: data?.length || 0,
        completed: data?.filter(r => r.status === 'completed').length || 0,
        pending: data?.filter(r => r.status === 'pending').length || 0,
        failed: data?.filter(r => r.status === 'failed').length || 0,
        byType: {
          analytics: data?.filter(r => r.type === 'analytics').length || 0,
          performance: data?.filter(r => r.type === 'performance').length || 0,
          usage: data?.filter(r => r.type === 'usage').length || 0,
          billing: data?.filter(r => r.type === 'billing').length || 0,
          custom: data?.filter(r => r.type === 'custom').length || 0,
        }
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('ReportsService: Unexpected error:', error);
      return { 
        data: { total: 0, completed: 0, pending: 0, failed: 0, byType: { analytics: 0, performance: 0, usage: 0, billing: 0, custom: 0 } }, 
        error: 'Failed to fetch report stats' 
      };
    }
  }

  async createReport(userId: string, report: Omit<ReportData, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<{ data: ReportData | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: userId,
          title: report.title,
          description: report.description,
          type: report.type,
          status: report.status,
          data: report.data,
          filters: report.filters,
          generated_at: report.generated_at,
          expires_at: report.expires_at,
          download_url: report.download_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('ReportsService: Error creating report:', error);
        return { data: null, error: error.message };
      }

      return { data: data as ReportData, error: null };
    } catch (error) {
      console.error('ReportsService: Unexpected error:', error);
      return { data: null, error: 'Failed to create report' };
    }
  }

  async generateAnalyticsReport(userId: string, filters: Record<string, any> = {}): Promise<{ data: ReportData | null; error: string | null }> {
    try {
      const reportData = {
        title: 'Analytics Report',
        description: 'Comprehensive analytics report',
        type: 'analytics' as const,
        status: 'pending' as const,
        data: {},
        filters,
        generated_at: new Date().toISOString()
      };

      return await this.createReport(userId, reportData);
    } catch (error) {
      console.error('ReportsService: Error generating analytics report:', error);
      return { data: null, error: 'Failed to generate analytics report' };
    }
  }

  async generatePerformanceReport(userId: string, filters: Record<string, any> = {}): Promise<{ data: ReportData | null; error: string | null }> {
    try {
      const reportData = {
        title: 'Performance Report',
        description: 'System performance analysis',
        type: 'performance' as const,
        status: 'pending' as const,
        data: {},
        filters,
        generated_at: new Date().toISOString()
      };

      return await this.createReport(userId, reportData);
    } catch (error) {
      console.error('ReportsService: Error generating performance report:', error);
      return { data: null, error: 'Failed to generate performance report' };
    }
  }

  async generateUsageReport(userId: string, filters: Record<string, any> = {}): Promise<{ data: ReportData | null; error: string | null }> {
    try {
      const reportData = {
        title: 'Usage Report',
        description: 'Usage statistics and trends',
        type: 'usage' as const,
        status: 'pending' as const,
        data: {},
        filters,
        generated_at: new Date().toISOString()
      };

      return await this.createReport(userId, reportData);
    } catch (error) {
      console.error('ReportsService: Error generating usage report:', error);
      return { data: null, error: 'Failed to generate usage report' };
    }
  }

  async deleteReport(reportId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        console.error('ReportsService: Error deleting report:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('ReportsService: Unexpected error:', error);
      return { success: false, error: 'Failed to delete report' };
    }
  }

  async getReportTemplates(): Promise<{ data: ReportTemplate[]; error: string | null }> {
    try {
      // For now, return default templates
      const templates: ReportTemplate[] = [
        {
          id: 'analytics',
          name: 'Analytics Report',
          description: 'Comprehensive analytics and metrics',
          type: 'analytics',
          filters: {},
          is_public: true
        },
        {
          id: 'performance',
          name: 'Performance Report',
          description: 'System performance analysis',
          type: 'performance',
          filters: {},
          is_public: true
        },
        {
          id: 'usage',
          name: 'Usage Report',
          description: 'Usage statistics and trends',
          type: 'usage',
          filters: {},
          is_public: true
        }
      ];

      return { data: templates, error: null };
    } catch (error) {
      console.error('ReportsService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch report templates' };
    }
  }
}

export const reportsService = new ReportsService();
