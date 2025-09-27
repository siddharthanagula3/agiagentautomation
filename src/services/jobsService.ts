import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type Job = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];

export interface JobFile {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface JobMetadata {
  [key: string]: string | number | boolean;
}

export interface JobFilters {
  status?: string;
  priority?: string;
  assigned_agent_id?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface JobStats {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  totalCost: number;
  avgDuration: number;
}

export interface CreateJobData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  assigned_agent_id?: string;
  estimated_duration?: number;
  files?: JobFile[];
  tags?: string[];
  metadata?: JobMetadata;
}

class JobsService {
  async getJobs(userId: string, filters?: JobFilters): Promise<{ data: Job[]; error: string | null }> {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          ai_agents!assigned_agent_id (
            id,
            name,
            role,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.assigned_agent_id) {
        query = query.eq('assigned_agent_id', filters.assigned_agent_id);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: 'An unexpected error occurred' };
    }
  }

  async getJobById(id: string): Promise<{ data: Job | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          ai_agents!assigned_agent_id (
            id,
            name,
            role,
            status,
            rating
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  async createJob(userId: string, jobData: CreateJobData): Promise<{ data: Job | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          user_id: userId,
          title: jobData.title,
          description: jobData.description,
          priority: jobData.priority || 'medium',
          assigned_agent_id: jobData.assigned_agent_id,
          estimated_duration: jobData.estimated_duration,
          files: jobData.files || [],
          tags: jobData.tags || [],
          metadata: jobData.metadata || {},
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  async updateJob(id: string, updates: JobUpdate): Promise<{ data: Job | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  async deleteJob(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      return { error: error?.message || null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async getJobStats(userId: string): Promise<{ data: JobStats; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('status, cost, actual_duration')
        .eq('user_id', userId);

      if (error) {
        return { 
          data: { total: 0, queued: 0, running: 0, completed: 0, failed: 0, totalCost: 0, avgDuration: 0 }, 
          error: error.message 
        };
      }

      const stats: JobStats = {
        total: data?.length || 0,
        queued: data?.filter(job => job.status === 'queued').length || 0,
        running: data?.filter(job => job.status === 'running').length || 0,
        completed: data?.filter(job => job.status === 'completed').length || 0,
        failed: data?.filter(job => job.status === 'failed').length || 0,
        totalCost: data?.reduce((sum, job) => sum + (job.cost || 0), 0) || 0,
        avgDuration: data?.filter(job => job.actual_duration).reduce((sum, job) => sum + (job.actual_duration || 0), 0) / (data?.filter(job => job.actual_duration).length || 1) || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { 
        data: { total: 0, queued: 0, running: 0, completed: 0, failed: 0, totalCost: 0, avgDuration: 0 }, 
        error: 'An unexpected error occurred' 
      };
    }
  }

  async assignJob(jobId: string, agentId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          assigned_agent_id: agentId,
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', jobId);

      return { error: error?.message || null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async updateJobProgress(jobId: string, progress: number): Promise<{ error: string | null }> {
    try {
      const updates: Partial<JobUpdate> = { progress };
      
      if (progress === 100) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId);

      return { error: error?.message || null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async pauseJob(jobId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'paused' })
        .eq('id', jobId);

      return { error: error?.message || null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async resumeJob(jobId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'running' })
        .eq('id', jobId);

      return { error: error?.message || null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async cancelJob(jobId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);

      return { error: error?.message || null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  // Real-time subscription for job updates
  subscribeToJobs(userId: string, callback: (jobs: Job[]) => void) {
    return supabase
      .channel('jobs_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'jobs',
          filter: `user_id=eq.${userId}`
        },
        async () => {
          const { data } = await this.getJobs(userId);
          callback(data);
        }
      )
      .subscribe();
  }

  // Get recent jobs for dashboard
  async getRecentJobs(userId: string, limit: number = 5): Promise<{ data: Job[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          ai_agents!assigned_agent_id (
            id,
            name,
            role
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }
  }
}

export const jobsService = new JobsService();
