/**
 * Employee Types
 * Type definitions for AI employees across the application
 */

export interface Employee {
  id: string;
  name: string;
  role: string;
  specialty: string;
  description: string;
  avatar?: string;
  provider: 'openai' | 'anthropic' | 'google' | 'perplexity';
  model?: string;
  capabilities: string[];
  tools?: string[];
  examples?: string[];
  pricing: {
    monthly: number;
    yearly: number;
    usage?: number;
  };
  stats?: {
    rating: number;
    reviews: number;
    successRate: number;
    avgResponseTime: string;
  };
  popular?: boolean;
  new?: boolean;
  category: string;
}

export interface PurchasedEmployee {
  id: string;
  user_id: string;
  employee_id: string;
  name: string;
  role: string;
  description: string;
  avatar_url?: string;
  provider: string;
  model?: string;
  capabilities?: string[];
  status: 'active' | 'inactive';
  subscription_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  created_at: string;
  updated_at?: string;
  expires_at?: string;
  usage_stats?: {
    messages_sent: number;
    last_used: string;
    total_sessions: number;
    tokens_used?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface EmployeeSession {
  id: string;
  employee_id: string;
  user_id: string;
  session_id: string;
  conversation_id: string;
  started_at: string;
  ended_at?: string;
  messages_count: number;
  tokens_used?: number;
  metadata?: Record<string, unknown>;
}

export interface EmployeeMessage {
  id: string;
  session_id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  employee_name?: string;
  tools_used?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface EmployeePerformance {
  employee_id: string;
  total_sessions: number;
  total_messages: number;
  success_rate: number;
  avg_response_time: number;
  user_satisfaction: number;
  tokens_used: number;
  cost_incurred: number;
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  date: string;
}

export interface EmployeeCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  count: number;
}

export type EmployeeStatus = 'active' | 'inactive' | 'suspended' | 'archived';
export type EmployeeProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'perplexity'
  | 'custom';
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'unpaid';
