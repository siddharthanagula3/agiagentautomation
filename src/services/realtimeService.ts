import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';
import { RealtimeChannel } from '@supabase/supabase-js';

type Job = Database['public']['Tables']['jobs']['Row'];
type AIAgent = Database['public']['Tables']['ai_agents']['Row'];
type Notification = Database['public']['Tables']['notifications']['Row'];

export interface RealtimeCallbacks {
  onJobUpdate?: (job: Job) => void;
  onJobCreated?: (job: Job) => void;
  onJobDeleted?: (jobId: string) => void;
  onAgentUpdate?: (agent: AIAgent) => void;
  onNotification?: (notification: Notification) => void;
  onError?: (error: string) => void;
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: RealtimeCallbacks = {};

  // Initialize real-time subscriptions
  async initializeRealtime(userId: string, callbacks: RealtimeCallbacks): Promise<void> {
    this.callbacks = callbacks;

    // Subscribe to job changes
    await this.subscribeToJobs(userId);
    
    // Subscribe to agent updates
    await this.subscribeToAgents();
    
    // Subscribe to notifications
    await this.subscribeToNotifications(userId);
  }

  // Subscribe to job changes for a specific user
  private async subscribeToJobs(userId: string): Promise<void> {
    const channel = supabase
      .channel(`jobs_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Job change received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              if (this.callbacks.onJobCreated && payload.new) {
                this.callbacks.onJobCreated(payload.new as Job);
              }
              break;
            case 'UPDATE':
              if (this.callbacks.onJobUpdate && payload.new) {
                this.callbacks.onJobUpdate(payload.new as Job);
              }
              break;
            case 'DELETE':
              if (this.callbacks.onJobDeleted && payload.old) {
                this.callbacks.onJobDeleted((payload.old as Job).id);
              }
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('Jobs subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to job changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to job changes');
          this.callbacks.onError?.('Failed to subscribe to job updates');
        }
      });

    this.channels.set(`jobs_${userId}`, channel);
  }

  // Subscribe to agent updates
  private async subscribeToAgents(): Promise<void> {
    const channel = supabase
      .channel('agents_global')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_agents'
        },
        (payload) => {
          console.log('Agent update received:', payload);
          if (this.callbacks.onAgentUpdate && payload.new) {
            this.callbacks.onAgentUpdate(payload.new as AIAgent);
          }
        }
      )
      .subscribe((status) => {
        console.log('Agents subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to agent updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to agent updates');
          this.callbacks.onError?.('Failed to subscribe to agent updates');
        }
      });

    this.channels.set('agents_global', channel);
  }

  // Subscribe to notifications for a specific user
  private async subscribeToNotifications(userId: string): Promise<void> {
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Notification received:', payload);
          if (this.callbacks.onNotification && payload.new) {
            this.callbacks.onNotification(payload.new as Notification);
          }
        }
      )
      .subscribe((status) => {
        console.log('Notifications subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to notifications');
          this.callbacks.onError?.('Failed to subscribe to notifications');
        }
      });

    this.channels.set(`notifications_${userId}`, channel);
  }

  // Send a real-time message to a specific user
  async sendMessage(userId: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'System Message',
          message: message,
          type: type,
          is_read: false
        });

      if (error) {
        console.error('Error sending real-time message:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to send real-time message:', error);
      throw error;
    }
  }

  // Update job progress in real-time
  async updateJobProgress(jobId: string, progress: number, status?: Job['status']): Promise<void> {
    try {
      const updates: unknown = { progress };
      
      if (status) {
        updates.status = status;
        if (status === 'completed') {
          updates.completed_at = new Date().toISOString();
        } else if (status === 'running') {
          updates.started_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) {
        console.error('Error updating job progress:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update job progress:', error);
      throw error;
    }
  }

  // Broadcast job status change to all connected clients
  async broadcastJobStatusChange(jobId: string, status: Job['status'], message?: string): Promise<void> {
    try {
      // Update the job status
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', jobId);

      if (updateError) {
        throw updateError;
      }

      // Send notification to job owner
      const { data: job } = await supabase
        .from('jobs')
        .select('user_id, title')
        .eq('id', jobId)
        .single();

      if (job && message) {
        await this.sendMessage(
          job.user_id,
          `Job "${job.title}" status changed to ${status}. ${message}`,
          status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info'
        );
      }
    } catch (error) {
      console.error('Failed to broadcast job status change:', error);
      throw error;
    }
  }

  // Clean up all subscriptions
  async cleanup(): Promise<void> {
    console.log('Cleaning up real-time subscriptions...');
    
    for (const [channelName, channel] of this.channels) {
      try {
        await supabase.removeChannel(channel);
        console.log(`Removed channel: ${channelName}`);
      } catch (error) {
        console.error(`Error removing channel ${channelName}:`, error);
      }
    }
    
    this.channels.clear();
    console.log('All real-time subscriptions cleaned up');
  }

  // Get connection status
  getConnectionStatus(): { connected: boolean; channels: string[] } {
    return {
      connected: this.channels.size > 0,
      channels: Array.from(this.channels.keys())
    };
  }

  // Reconnect all channels
  async reconnect(userId: string): Promise<void> {
    console.log('Reconnecting real-time subscriptions...');
    await this.cleanup();
    await this.initializeRealtime(userId, this.callbacks);
  }
}

export const realtimeService = new RealtimeService();
