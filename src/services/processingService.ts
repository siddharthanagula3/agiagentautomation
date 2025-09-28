import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type ProcessingJob = Database['public']['Tables']['processing_jobs']['Row'];

export interface ProcessingJobData {
  id: string;
  user_id: string;
  name: string;
  type: 'data_processing' | 'ai_training' | 'model_inference' | 'data_analysis' | 'custom';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessingStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageDuration: number;
  successRate: number;
}

export interface ProcessingQueue {
  position: number;
  estimatedWaitTime: number;
  activeJobs: number;
  maxConcurrent: number;
}

class ProcessingService {
  async getProcessingJobs(userId: string, limit: number = 50): Promise<{ data: ProcessingJobData[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('ProcessingService: Error fetching processing jobs:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('ProcessingService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch processing jobs' };
    }
  }

  async getProcessingStats(userId: string): Promise<{ data: ProcessingStats; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('status, started_at, completed_at')
        .eq('user_id', userId);

      if (error) {
        console.error('ProcessingService: Error fetching stats:', error);
        return { 
          data: { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0, averageDuration: 0, successRate: 0 }, 
          error: error.message 
        };
      }

      const stats: ProcessingStats = {
        total: data?.length || 0,
        pending: data?.filter(j => j.status === 'pending').length || 0,
        running: data?.filter(j => j.status === 'running').length || 0,
        completed: data?.filter(j => j.status === 'completed').length || 0,
        failed: data?.filter(j => j.status === 'failed').length || 0,
        cancelled: data?.filter(j => j.status === 'cancelled').length || 0,
        averageDuration: 0,
        successRate: 0
      };

      // Calculate average duration and success rate
      const completedJobs = data?.filter(j => j.status === 'completed' && j.started_at && j.completed_at) || [];
      if (completedJobs.length > 0) {
        const totalDuration = completedJobs.reduce((sum, job) => {
          const start = new Date(job.started_at!);
          const end = new Date(job.completed_at!);
          return sum + (end.getTime() - start.getTime());
        }, 0);
        stats.averageDuration = totalDuration / completedJobs.length / 1000; // Convert to seconds
      }

      const totalFinished = stats.completed + stats.failed + stats.cancelled;
      if (totalFinished > 0) {
        stats.successRate = (stats.completed / totalFinished) * 100;
      }

      return { data: stats, error: null };
    } catch (error) {
      console.error('ProcessingService: Unexpected error:', error);
      return { 
        data: { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0, averageDuration: 0, successRate: 0 }, 
        error: 'Failed to fetch processing stats' 
      };
    }
  }

  async getProcessingQueue(userId: string): Promise<{ data: ProcessingQueue; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('status, created_at')
        .eq('user_id', userId)
        .in('status', ['pending', 'running']);

      if (error) {
        console.error('ProcessingService: Error fetching queue:', error);
        return { 
          data: { position: 0, estimatedWaitTime: 0, activeJobs: 0, maxConcurrent: 5 }, 
          error: error.message 
        };
      }

      const pendingJobs = data?.filter(j => j.status === 'pending') || [];
      const runningJobs = data?.filter(j => j.status === 'running') || [];

      const queue: ProcessingQueue = {
        position: pendingJobs.length,
        estimatedWaitTime: pendingJobs.length * 300, // Estimate 5 minutes per job
        activeJobs: runningJobs.length,
        maxConcurrent: 5
      };

      return { data: queue, error: null };
    } catch (error) {
      console.error('ProcessingService: Unexpected error:', error);
      return { 
        data: { position: 0, estimatedWaitTime: 0, activeJobs: 0, maxConcurrent: 5 }, 
        error: 'Failed to fetch processing queue' 
      };
    }
  }

  async createProcessingJob(userId: string, job: Omit<ProcessingJobData, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status' | 'progress'>): Promise<{ data: ProcessingJobData | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .insert({
          user_id: userId,
          name: job.name,
          type: job.type,
          status: 'pending',
          progress: 0,
          input_data: job.input_data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('ProcessingService: Error creating processing job:', error);
        return { data: null, error: error.message };
      }

      return { data: data as ProcessingJobData, error: null };
    } catch (error) {
      console.error('ProcessingService: Unexpected error:', error);
      return { data: null, error: 'Failed to create processing job' };
    }
  }

  async updateProcessingJob(jobId: string, updates: Partial<Pick<ProcessingJobData, 'status' | 'progress' | 'output_data' | 'error_message' | 'started_at' | 'completed_at'>>): Promise<{ data: ProcessingJobData | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        console.error('ProcessingService: Error updating processing job:', error);
        return { data: null, error: error.message };
      }

      return { data: data as ProcessingJobData, error: null };
    } catch (error) {
      console.error('ProcessingService: Unexpected error:', error);
      return { data: null, error: 'Failed to update processing job' };
    }
  }

  async cancelProcessingJob(jobId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('processing_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) {
        console.error('ProcessingService: Error cancelling processing job:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('ProcessingService: Unexpected error:', error);
      return { success: false, error: 'Failed to cancel processing job' };
    }
  }

  async deleteProcessingJob(jobId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('processing_jobs')
        .delete()
        .eq('id', jobId);

      if (error) {
        console.error('ProcessingService: Error deleting processing job:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('ProcessingService: Unexpected error:', error);
      return { success: false, error: 'Failed to delete processing job' };
    }
  }

  async getProcessingJobLogs(jobId: string): Promise<{ data: string[]; error: string | null }> {
    try {
      // This would typically come from a processing_job_logs table
      // For now, return empty array as logging isn't implemented yet
      return { data: [], error: null };
    } catch (error) {
      console.error('ProcessingService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch processing job logs' };
    }
  }

  async getAvailableJobTypes(): Promise<{ data: string[]; error: string | null }> {
    try {
      const jobTypes = [
        'data_processing',
        'ai_training',
        'model_inference',
        'data_analysis',
        'custom'
      ];

      return { data: jobTypes, error: null };
    } catch (error) {
      console.error('ProcessingService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch available job types' };
    }
  }
}

export const processingService = new ProcessingService();
