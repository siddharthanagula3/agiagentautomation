import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type Webhook = Database['public']['Tables']['webhooks']['Row'];

export interface WebhookData {
  id: string;
  user_id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  is_active: boolean;
  last_triggered?: string;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookStats {
  total: number;
  active: number;
  inactive: number;
  totalTriggers: number;
  successRate: number;
}

export interface WebhookEvent {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  response_code?: number;
  response_body?: string;
  created_at: string;
  sent_at?: string;
}

class WebhooksService {
  async getWebhooks(userId: string): Promise<{ data: WebhookData[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('WebhooksService: Error fetching webhooks:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('WebhooksService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch webhooks' };
    }
  }

  async getWebhookStats(userId: string): Promise<{ data: WebhookStats; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('is_active, success_count, failure_count')
        .eq('user_id', userId);

      if (error) {
        console.error('WebhooksService: Error fetching stats:', error);
        return { 
          data: { total: 0, active: 0, inactive: 0, totalTriggers: 0, successRate: 0 }, 
          error: error.message 
        };
      }

      const totalTriggers = data?.reduce((sum, w) => sum + w.success_count + w.failure_count, 0) || 0;
      const successRate = totalTriggers > 0 ? (data?.reduce((sum, w) => sum + w.success_count, 0) || 0) / totalTriggers * 100 : 0;

      const stats: WebhookStats = {
        total: data?.length || 0,
        active: data?.filter(w => w.is_active).length || 0,
        inactive: data?.filter(w => !w.is_active).length || 0,
        totalTriggers,
        successRate: Math.round(successRate * 100) / 100
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('WebhooksService: Unexpected error:', error);
      return { 
        data: { total: 0, active: 0, inactive: 0, totalTriggers: 0, successRate: 0 }, 
        error: 'Failed to fetch webhook stats' 
      };
    }
  }

  async createWebhook(userId: string, webhook: Omit<WebhookData, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'success_count' | 'failure_count'>): Promise<{ data: WebhookData | null; error: string | null }> {
    try {
      const secret = this.generateWebhookSecret();
      
      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          user_id: userId,
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          secret,
          is_active: webhook.is_active,
          success_count: 0,
          failure_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('WebhooksService: Error creating webhook:', error);
        return { data: null, error: error.message };
      }

      return { data: data as WebhookData, error: null };
    } catch (error) {
      console.error('WebhooksService: Unexpected error:', error);
      return { data: null, error: 'Failed to create webhook' };
    }
  }

  async updateWebhook(webhookId: string, updates: Partial<Pick<WebhookData, 'name' | 'url' | 'events' | 'is_active'>>): Promise<{ data: WebhookData | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', webhookId)
        .select()
        .single();

      if (error) {
        console.error('WebhooksService: Error updating webhook:', error);
        return { data: null, error: error.message };
      }

      return { data: data as WebhookData, error: null };
    } catch (error) {
      console.error('WebhooksService: Unexpected error:', error);
      return { data: null, error: 'Failed to update webhook' };
    }
  }

  async deleteWebhook(webhookId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) {
        console.error('WebhooksService: Error deleting webhook:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('WebhooksService: Unexpected error:', error);
      return { success: false, error: 'Failed to delete webhook' };
    }
  }

  async testWebhook(webhookId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: webhook, error: fetchError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (fetchError || !webhook) {
        return { success: false, error: 'Webhook not found' };
      }

      // Simulate webhook test
      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: { message: 'Test webhook from AGI Agent Automation' }
      };

      // In a real implementation, you would make an HTTP request to the webhook URL
      // For now, we'll just simulate success
      console.log('Webhook test payload:', testPayload);
      console.log('Webhook URL:', webhook.url);

      return { success: true, error: null };
    } catch (error) {
      console.error('WebhooksService: Unexpected error:', error);
      return { success: false, error: 'Failed to test webhook' };
    }
  }

  async getWebhookEvents(webhookId: string, limit: number = 50): Promise<{ data: WebhookEvent[]; error: string | null }> {
    try {
      // This would typically come from a webhook_events table
      // For now, return empty array as event tracking isn't implemented yet
      return { data: [], error: null };
    } catch (error) {
      console.error('WebhooksService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch webhook events' };
    }
  }

  private generateWebhookSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  async getAvailableEvents(): Promise<{ data: string[]; error: string | null }> {
    try {
      const events = [
        'job.created',
        'job.completed',
        'job.failed',
        'agent.created',
        'agent.updated',
        'agent.deleted',
        'user.registered',
        'user.updated',
        'billing.invoice_created',
        'billing.payment_succeeded',
        'billing.payment_failed',
        'system.maintenance',
        'system.alert'
      ];

      return { data: events, error: null };
    } catch (error) {
      console.error('WebhooksService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch available events' };
    }
  }
}

export const webhooksService = new WebhooksService();
