/**
 * Workforce Supabase Service
 * Handles all database operations for the AI Workforce system
 */

import { supabase } from '@shared/lib/supabase-client';
import type { ExecutionPlan, Task } from '../reasoning/task-decomposer';
import type { AnalysisResult } from '../reasoning/nlp-processor';

// ================================================
// TYPES
// ================================================

export interface WorkforceExecution {
  id: string;
  user_id: string;
  input_text: string;
  status:
    | 'pending'
    | 'planning'
    | 'running'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled';
  intent_type?: string;
  domain?: string;
  complexity?: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  estimated_time?: number;
  actual_time?: number;
  estimated_cost?: number;
  actual_cost: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkforceTask {
  id: string;
  execution_id: string;
  task_id: string;
  title: string;
  description?: string;
  type: string;
  domain: string;
  status: string;
  priority: string;
  complexity: string;
  assigned_agent: string;
  dependencies: string[];
  result?: unknown;
  error_message?: string;
  retry_count: number;
  estimated_time?: number;
  actual_time?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface APIUsage {
  id: string;
  user_id: string;
  provider: string;
  model?: string;
  operation_type: string;
  tokens_used: number;
  cost: number;
  execution_id?: string;
  session_id?: string;
  created_at: string;
}

export type RecentActivity = {
  user_id: string;
  created_at: string;
} & Record<string, unknown>;

// ================================================
// WORKFORCE EXECUTIONS
// ================================================

/**
 * Create a new workforce execution
 */
export async function createExecution(
  userId: string,
  input: string,
  analysis: AnalysisResult,
  plan: ExecutionPlan
): Promise<WorkforceExecution | null> {
  try {
    const { data, error } = await supabase
      .from('workforce_executions')
      .insert({
        user_id: userId,
        input_text: input,
        status: 'pending',
        intent_type: analysis.intent.type,
        domain: analysis.intent.domain,
        complexity: analysis.intent.complexity,
        total_tasks: plan.tasks.length,
        completed_tasks: 0,
        failed_tasks: 0,
        estimated_time: plan.estimatedTotalTime,
        estimated_cost: 0, // Will be calculated
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating execution:', error);
      return null;
    }

    // Create tasks for this execution
    if (data && plan.tasks.length > 0) {
      await createExecutionTasks(data.id, plan.tasks);
    }

    return data;
  } catch (error) {
    console.error('Exception creating execution:', error);
    return null;
  }
}

/**
 * Update execution status
 */
export async function updateExecutionStatus(
  executionId: string,
  status: WorkforceExecution['status'],
  updates?: {
    completedTasks?: number;
    failedTasks?: number;
    actualCost?: number;
    errorMessage?: string;
  }
): Promise<boolean> {
  try {
    const updateData: unknown = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'running' && !updates) {
      updateData.started_at = new Date().toISOString();
    }

    if (
      status === 'completed' ||
      status === 'failed' ||
      status === 'cancelled'
    ) {
      updateData.completed_at = new Date().toISOString();
    }

    if (updates) {
      if (updates.completedTasks !== undefined)
        updateData.completed_tasks = updates.completedTasks;
      if (updates.failedTasks !== undefined)
        updateData.failed_tasks = updates.failedTasks;
      if (updates.actualCost !== undefined)
        updateData.actual_cost = updates.actualCost;
      if (updates.errorMessage) updateData.error_message = updates.errorMessage;
    }

    const { error } = await supabase
      .from('workforce_executions')
      .update(updateData)
      .eq('id', executionId);

    if (error) {
      console.error('Error updating execution status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating execution status:', error);
    return false;
  }
}

/**
 * Get execution by ID
 */
export async function getExecution(
  executionId: string
): Promise<WorkforceExecution | null> {
  try {
    const { data, error } = await supabase
      .from('workforce_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error) {
      console.error('Error getting execution:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception getting execution:', error);
    return null;
  }
}

/**
 * Get user's executions
 */
export async function getUserExecutions(
  userId: string,
  limit: number = 50
): Promise<WorkforceExecution[]> {
  try {
    const { data, error } = await supabase
      .from('workforce_executions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting user executions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception getting user executions:', error);
    return [];
  }
}

/**
 * Get active executions for a user
 */
export async function getActiveExecutions(
  userId: string
): Promise<WorkforceExecution[]> {
  try {
    const { data, error } = await supabase
      .from('workforce_executions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'planning', 'running', 'paused'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting active executions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception getting active executions:', error);
    return [];
  }
}

// ================================================
// WORKFORCE TASKS
// ================================================

/**
 * Create tasks for an execution
 */
export async function createExecutionTasks(
  executionId: string,
  tasks: Task[]
): Promise<boolean> {
  try {
    const taskData = tasks.map((task) => ({
      execution_id: executionId,
      task_id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      domain: task.domain,
      status: task.status,
      priority: task.priority,
      complexity: task.complexity,
      assigned_agent: task.requiredAgent,
      dependencies: task.dependencies,
      retry_count: task.retryCount,
      estimated_time: task.estimatedTime,
    }));

    const { error } = await supabase.from('workforce_tasks').insert(taskData);

    if (error) {
      console.error('Error creating execution tasks:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception creating execution tasks:', error);
    return false;
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  executionId: string,
  taskId: string,
  status: string,
  updates?: {
    result?: unknown;
    errorMessage?: string;
    retryCount?: number;
    actualTime?: number;
  }
): Promise<boolean> {
  try {
    const updateData: unknown = {
      status,
    };

    if (status === 'in_progress') {
      updateData.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (updates) {
      if (updates.result !== undefined) updateData.result = updates.result;
      if (updates.errorMessage) updateData.error_message = updates.errorMessage;
      if (updates.retryCount !== undefined)
        updateData.retry_count = updates.retryCount;
      if (updates.actualTime !== undefined)
        updateData.actual_time = updates.actualTime;
    }

    const { error } = await supabase
      .from('workforce_tasks')
      .update(updateData)
      .eq('execution_id', executionId)
      .eq('task_id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating task status:', error);
    return false;
  }
}

/**
 * Get tasks for an execution
 */
export async function getExecutionTasks(
  executionId: string
): Promise<WorkforceTask[]> {
  try {
    const { data, error } = await supabase
      .from('workforce_tasks')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting execution tasks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception getting execution tasks:', error);
    return [];
  }
}

// ================================================
// API USAGE TRACKING
// ================================================

/**
 * Track API usage
 */
export async function trackAPIUsage(
  userId: string,
  provider: string,
  model: string,
  operationType: string,
  tokensUsed: number,
  cost: number,
  executionId?: string,
  sessionId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('api_usage').insert({
      user_id: userId,
      provider,
      model,
      operation_type: operationType,
      tokens_used: tokensUsed,
      cost,
      execution_id: executionId,
      session_id: sessionId,
    });

    if (error) {
      console.error('Error tracking API usage:', error);
      return false;
    }

    // Update user subscription token usage
    await updateSubscriptionUsage(userId, tokensUsed);

    return true;
  } catch (error) {
    console.error('Exception tracking API usage:', error);
    return false;
  }
}

/**
 * Get API usage for a user
 */
export async function getUserAPIUsage(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<APIUsage[]> {
  try {
    let query = supabase.from('api_usage').select('*').eq('user_id', userId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error getting API usage:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception getting API usage:', error);
    return [];
  }
}

/**
 * Get API usage summary
 */
export async function getAPIUsageSummary(
  userId: string,
  period: 'today' | 'week' | 'month' | 'all' = 'month'
): Promise<{
  totalCost: number;
  totalTokens: number;
  byProvider: Record<string, { cost: number; tokens: number }>;
}> {
  try {
    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0);
    }

    const usage = await getUserAPIUsage(userId, startDate);

    const summary = {
      totalCost: 0,
      totalTokens: 0,
      byProvider: {} as Record<string, { cost: number; tokens: number }>,
    };

    usage.forEach((record) => {
      summary.totalCost += record.cost;
      summary.totalTokens += record.tokens_used;

      if (!summary.byProvider[record.provider]) {
        summary.byProvider[record.provider] = { cost: 0, tokens: 0 };
      }

      summary.byProvider[record.provider].cost += record.cost;
      summary.byProvider[record.provider].tokens += record.tokens_used;
    });

    return summary;
  } catch (error) {
    console.error('Exception getting API usage summary:', error);
    return {
      totalCost: 0,
      totalTokens: 0,
      byProvider: {},
    };
  }
}

// ================================================
// SUBSCRIPTION MANAGEMENT
// ================================================

/**
 * Update subscription token usage
 */
async function updateSubscriptionUsage(
  userId: string,
  tokensUsed: number
): Promise<boolean> {
  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!subscription) {
      return false;
    }

    const newUsedTokens = subscription.used_tokens + tokensUsed;

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        used_tokens: newUsedTokens,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating subscription usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating subscription usage:', error);
    return false;
  }
}

/**
 * Get user subscription
 */
export async function getUserSubscription(userId: string): Promise<unknown> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception getting subscription:', error);
    return null;
  }
}

// ================================================
// DASHBOARD STATS
// ================================================

/**
 * Get dashboard stats for a user
 */
export async function getDashboardStats(userId: string): Promise<{
  activeEmployees: number;
  totalEmployees: number;
  activeWorkflows: number;
  totalWorkflows: number;
  totalExecutions: number;
  successRate: number;
  totalCost: number;
}> {
  try {
    // Get stats from view
    const { data, error } = await supabase
      .from('user_dashboard_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return {
        activeEmployees: 0,
        totalEmployees: 0,
        activeWorkflows: 0,
        totalWorkflows: 0,
        totalExecutions: 0,
        successRate: 0,
        totalCost: 0,
      };
    }

    // Calculate success rate
    const completedTasks = data.total_completed_tasks || 0;
    const failedTasks = data.total_failed_tasks || 0;
    const totalTasks = completedTasks + failedTasks;
    const successRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      activeEmployees: data.active_employees || 0,
      totalEmployees: data.total_employees || 0,
      activeWorkflows: data.active_executions || 0,
      totalWorkflows: data.total_executions || 0,
      totalExecutions: data.total_executions || 0,
      successRate: Math.round(successRate),
      totalCost: data.total_spent || 0,
    };
  } catch (error) {
    console.error('Exception getting dashboard stats:', error);
    return {
      activeEmployees: 0,
      totalEmployees: 0,
      activeWorkflows: 0,
      totalWorkflows: 0,
      totalExecutions: 0,
      successRate: 0,
      totalCost: 0,
    };
  }
}

/**
 * Get recent activity
 */
export async function getRecentActivity(
  userId: string,
  limit: number = 10
): Promise<RecentActivity[]> {
  try {
    const { data, error } = await supabase
      .from('user_recent_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }

    return (data as RecentActivity[]) || [];
  } catch (error) {
    console.error('Exception getting recent activity:', error);
    return [];
  }
}

// ================================================
// EXPORTS
// ================================================

export const workforceService = {
  // Executions
  createExecution,
  updateExecutionStatus,
  getExecution,
  getUserExecutions,
  getActiveExecutions,

  // Tasks
  createExecutionTasks,
  updateTaskStatus,
  getExecutionTasks,

  // API Usage
  trackAPIUsage,
  getUserAPIUsage,
  getAPIUsageSummary,

  // Subscription
  getUserSubscription,

  // Dashboard
  getDashboardStats,
  getRecentActivity,
};

export default workforceService;
