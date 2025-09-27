import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type Billing = Database['public']['Tables']['billing']['Row'];

export interface BillingStats {
  totalSpent: number;
  thisMonth: number;
  pending: number;
  nextBilling: number;
  usage: {
    tokensUsed: number;
    tokensLimit: number;
    jobsCompleted: number;
    employeesActive: number;
    estimatedCost: number;
  };
}

export interface SubscriptionPlan {
  name: string;
  amount: number;
  features: string[];
  limits: {
    ai_agents: number;
    jobs_per_month: number;
    tokens_per_month: number;
  };
}

export interface UsageBreakdown {
  [agentId: string]: {
    tokens: number;
    cost: number;
    count: number;
  };
}

export interface SubscriptionFeatures {
  tokens_per_month?: number;
  tokens?: number;
  [key: string]: unknown;
}

class BillingService {
  async getBillingStats(userId: string): Promise<{ data: BillingStats; error: string | null }> {
    try {
      // Get user's subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (subError) {
        return { 
          data: this.getEmptyBillingStats(), 
          error: null 
        };
      }

      // Get billing history
      const { data: billing, error: billingError } = await supabase
        .from('billing')
        .select('amount, status, created_at')
        .eq('user_id', userId);

      if (billingError) {
        return { 
          data: this.getEmptyBillingStats(), 
          error: null 
        };
      }

      // Get usage data
      const { data: usage, error: usageError } = await supabase
        .from('usage_tracking')
        .select('tokens_used, cost, created_at')
        .eq('user_id', userId);

      if (usageError) {
        return { 
          data: this.getEmptyBillingStats(), 
          error: null 
        };
      }

      // Calculate stats
      const totalSpent = billing?.reduce((sum, bill) => sum + (bill.amount || 0), 0) || 0;
      const thisMonth = this.calculateThisMonth(billing || []);
      const pending = billing?.filter(bill => bill.status === 'pending').reduce((sum, bill) => sum + (bill.amount || 0), 0) || 0;
      const nextBilling = subscription?.amount || 0;

      const tokensUsed = usage?.reduce((sum, u) => sum + (u.tokens_used || 0), 0) || 0;
      const tokensLimit = this.getTokensLimit(subscription?.features);
      const jobsCompleted = await this.getJobsCompleted(userId);
      const employeesActive = await this.getActiveEmployees(userId);
      const estimatedCost = usage?.reduce((sum, u) => sum + (u.cost || 0), 0) || 0;

      const stats: BillingStats = {
        totalSpent,
        thisMonth,
        pending,
        nextBilling,
        usage: {
          tokensUsed,
          tokensLimit,
          jobsCompleted,
          employeesActive,
          estimatedCost
        }
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { 
        data: this.getEmptyBillingStats(), 
        error: null 
      };
    }
  }

  async getBillingHistory(userId: string): Promise<{ data: Billing[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('billing')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }
  }

  async getSubscription(userId: string): Promise<{ data: Subscription | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error) {
        return { data: null, error: null };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: null, error: null };
    }
  }

  async updateSubscription(userId: string, planName: string, amount: number): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_name: planName,
          amount: amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      return { error: error?.message || null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async cancelSubscription(userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      return { error: error?.message || null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async createBillingRecord(userId: string, amount: number, description: string): Promise<{ data: Billing | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('billing')
        .insert({
          user_id: userId,
          amount: amount,
          description: description,
          status: 'pending',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
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

  async markBillingAsPaid(billingId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('billing')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', billingId);

      return { error: error?.message || null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async getAvailablePlans(): Promise<{ data: SubscriptionPlan[]; error: string | null }> {
    try {
      const plans: SubscriptionPlan[] = [
        {
          name: 'Starter',
          amount: 29,
          features: [
            '5 AI Employees',
            '100 Jobs/month',
            'Basic Analytics',
            'Email Support'
          ],
          limits: {
            ai_agents: 5,
            jobs_per_month: 100,
            tokens_per_month: 10000
          }
        },
        {
          name: 'Professional',
          amount: 99,
          features: [
            '25 AI Employees',
            'Unlimited Jobs',
            'Advanced Analytics',
            'Priority Support',
            'API Access',
            'Custom Workflows'
          ],
          limits: {
            ai_agents: 25,
            jobs_per_month: -1, // unlimited
            tokens_per_month: 100000
          }
        },
        {
          name: 'Enterprise',
          amount: 999,
          features: [
            'Unlimited AI Employees',
            'Unlimited Jobs',
            'Custom Analytics',
            'Dedicated Support',
            'White-label Options',
            'SLA Guarantee'
          ],
          limits: {
            ai_agents: -1, // unlimited
            jobs_per_month: -1, // unlimited
            tokens_per_month: -1 // unlimited
          }
        }
      ];

      return { data: plans, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }
  }

  async getUsageBreakdown(userId: string): Promise<{ data: UsageBreakdown | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('tokens_used, cost, agent_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: null };
      }

      // Group by agent and calculate usage
      const agentUsage = data?.reduce((acc, usage) => {
        const agentId = usage.agent_id || 'unknown';
        if (!acc[agentId]) {
          acc[agentId] = { tokens: 0, cost: 0, count: 0 };
        }
        acc[agentId].tokens += usage.tokens_used || 0;
        acc[agentId].cost += usage.cost || 0;
        acc[agentId].count += 1;
        return acc;
      }, {} as Record<string, { tokens: number; cost: number; count: number }>) || {};

      return { data: agentUsage, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: null, error: null };
    }
  }

  private getEmptyBillingStats(): BillingStats {
    return {
      totalSpent: 0,
      thisMonth: 0,
      pending: 0,
      nextBilling: 0,
      usage: {
        tokensUsed: 0,
        tokensLimit: 10000,
        jobsCompleted: 0,
        employeesActive: 0,
        estimatedCost: 0
      }
    };
  }

  private calculateThisMonth(billing: Billing[]): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return billing
      .filter(bill => new Date(bill.created_at) >= startOfMonth && bill.status === 'paid')
      .reduce((sum, bill) => sum + (bill.amount || 0), 0);
  }

  private getTokensLimit(features: SubscriptionFeatures | null | undefined): number {
    if (!features || typeof features !== 'object') return 10000;
    
    // Extract tokens limit from features
    if (features.tokens_per_month) return features.tokens_per_month;
    if (features.tokens) return features.tokens;
    
    return 10000; // Default limit
  }

  private async getJobsCompleted(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (error) return 0;
      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getActiveEmployees(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) return 0;
      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  }
}

export const billingService = new BillingService();