import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type Log = Database['public']['Tables']['logs']['Row'];

export interface LogData {
  id: string;
  user_id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context?: Record<string, any>;
  source: string;
  timestamp: string;
  created_at: string;
}

export interface LogStats {
  total: number;
  byLevel: {
    debug: number;
    info: number;
    warn: number;
    error: number;
    fatal: number;
  };
  bySource: Record<string, number>;
  recentErrors: number;
}

export interface LogFilter {
  level?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

class LogsService {
  async getLogs(userId: string, filter: LogFilter = {}, limit: number = 100): Promise<{ data: LogData[]; error: string | null }> {
    try {
      let query = supabase
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (filter.level) {
        query = query.eq('level', filter.level);
      }

      if (filter.source) {
        query = query.eq('source', filter.source);
      }

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate);
      }

      if (filter.search) {
        query = query.ilike('message', `%${filter.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('LogsService: Error fetching logs:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('LogsService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch logs' };
    }
  }

  async getLogStats(userId: string, days: number = 7): Promise<{ data: LogStats; error: string | null }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();

      const { data, error } = await supabase
        .from('logs')
        .select('level, source, timestamp')
        .eq('user_id', userId)
        .gte('timestamp', startDateStr);

      if (error) {
        console.error('LogsService: Error fetching stats:', error);
        return { 
          data: { total: 0, byLevel: { debug: 0, info: 0, warn: 0, error: 0, fatal: 0 }, bySource: {}, recentErrors: 0 }, 
          error: error.message 
        };
      }

      const byLevel = {
        debug: data?.filter(l => l.level === 'debug').length || 0,
        info: data?.filter(l => l.level === 'info').length || 0,
        warn: data?.filter(l => l.level === 'warn').length || 0,
        error: data?.filter(l => l.level === 'error').length || 0,
        fatal: data?.filter(l => l.level === 'fatal').length || 0,
      };

      const bySource: Record<string, number> = {};
      data?.forEach(log => {
        bySource[log.source] = (bySource[log.source] || 0) + 1;
      });

      const recentErrors = data?.filter(l => l.level === 'error' || l.level === 'fatal').length || 0;

      const stats: LogStats = {
        total: data?.length || 0,
        byLevel,
        bySource,
        recentErrors
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('LogsService: Unexpected error:', error);
      return { 
        data: { total: 0, byLevel: { debug: 0, info: 0, warn: 0, error: 0, fatal: 0 }, bySource: {}, recentErrors: 0 }, 
        error: 'Failed to fetch log stats' 
      };
    }
  }

  async createLog(userId: string, log: Omit<LogData, 'id' | 'created_at' | 'user_id' | 'timestamp'>): Promise<{ data: LogData | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('logs')
        .insert({
          user_id: userId,
          level: log.level,
          message: log.message,
          context: log.context,
          source: log.source,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('LogsService: Error creating log:', error);
        return { data: null, error: error.message };
      }

      return { data: data as LogData, error: null };
    } catch (error) {
      console.error('LogsService: Unexpected error:', error);
      return { data: null, error: 'Failed to create log' };
    }
  }

  async deleteLog(logId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('id', logId);

      if (error) {
        console.error('LogsService: Error deleting log:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('LogsService: Unexpected error:', error);
      return { success: false, error: 'Failed to delete log' };
    }
  }

  async clearLogs(userId: string, olderThanDays: number = 30): Promise<{ success: boolean; error: string | null }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      const cutoffDateStr = cutoffDate.toISOString();

      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('user_id', userId)
        .lt('timestamp', cutoffDateStr);

      if (error) {
        console.error('LogsService: Error clearing logs:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('LogsService: Unexpected error:', error);
      return { success: false, error: 'Failed to clear logs' };
    }
  }

  async getLogSources(userId: string): Promise<{ data: string[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('source')
        .eq('user_id', userId);

      if (error) {
        console.error('LogsService: Error fetching sources:', error);
        return { data: [], error: error.message };
      }

      const sources = [...new Set(data?.map(log => log.source) || [])];
      return { data: sources, error: null };
    } catch (error) {
      console.error('LogsService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch log sources' };
    }
  }

  async exportLogs(userId: string, filter: LogFilter = {}): Promise<{ data: string; error: string | null }> {
    try {
      const { data: logs, error } = await this.getLogs(userId, filter, 1000);
      
      if (error) {
        return { data: '', error };
      }

      const csvContent = this.convertLogsToCSV(logs);
      return { data: csvContent, error: null };
    } catch (error) {
      console.error('LogsService: Unexpected error:', error);
      return { data: '', error: 'Failed to export logs' };
    }
  }

  private convertLogsToCSV(logs: LogData[]): string {
    const headers = ['Timestamp', 'Level', 'Source', 'Message', 'Context'];
    const rows = logs.map(log => [
      log.timestamp,
      log.level,
      log.source,
      log.message,
      log.context ? JSON.stringify(log.context) : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

export const logsService = new LogsService();
