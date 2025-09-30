/**
 * Automation Service - Real Workflow Data from Supabase
 * Replaces all mock workflow data with actual database queries
 */

import { supabase } from '@/integrations/supabase/client';
import { cacheService, CacheKeys, CacheTTL } from './cache-service';

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  triggerType: string;
  triggerConfig: Record<string, any>;
  workflowConfig: Record<string, any>;
  isActive: boolean;
  isTemplate: boolean;
  version: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
}

export interface WorkflowExecution {
  id: string;
  userId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  triggerSource?: string;
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  errorMessage?: string;
  errorStack?: string;
  executionLog: string[];
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  executedAt: Date;
  createdAt: Date;
}

export interface WorkflowStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgDurationMs: number;
  successRate: number;
  lastExecutionAt?: Date;
}

export interface AutomationOverview {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  runningExecutions: number;
  completedToday: number;
  successRate: number;
  avgExecutionTime: number;
}

class AutomationService {
  /**
   * Get all workflows for a user
   */
  async getWorkflows(userId: string, activeOnly: boolean = false): Promise<Workflow[]> {
    try {
      let query = supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(this.mapWorkflowFromDB);
    } catch (error) {
      console.error('[Automation] Error fetching workflows:', error);
      return [];
    }
  }
  
  /**
   * Get a single workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();
      
      if (error) throw error;
      
      return data ? this.mapWorkflowFromDB(data) : null;
    } catch (error) {
      console.error('[Automation] Error fetching workflow:', error);
      return null;
    }
  }
  
  /**
   * Create a new workflow
   */
  async createWorkflow(
    userId: string,
    workflow: Omit<Workflow, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Workflow | null> {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .insert({
          user_id: userId,
          name: workflow.name,
          description: workflow.description,
          category: workflow.category,
          trigger_type: workflow.triggerType,
          trigger_config: workflow.triggerConfig,
          workflow_config: workflow.workflowConfig,
          is_active: workflow.isActive,
          is_template: workflow.isTemplate,
          version: workflow.version,
          tags: workflow.tags
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Invalidate cache
      await cacheService.invalidateByTags([userId, 'automation']);
      
      return data ? this.mapWorkflowFromDB(data) : null;
    } catch (error) {
      console.error('[Automation] Error creating workflow:', error);
      return null;
    }
  }
  
  /**
   * Update a workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<Omit<Workflow, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Workflow | null> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.triggerType !== undefined) updateData.trigger_type = updates.triggerType;
      if (updates.triggerConfig !== undefined) updateData.trigger_config = updates.triggerConfig;
      if (updates.workflowConfig !== undefined) updateData.workflow_config = updates.workflowConfig;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.isTemplate !== undefined) updateData.is_template = updates.isTemplate;
      if (updates.version !== undefined) updateData.version = updates.version;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      
      const { data, error } = await supabase
        .from('automation_workflows')
        .update(updateData)
        .eq('id', workflowId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Invalidate cache
      const workflow = await this.getWorkflow(workflowId);
      if (workflow) {
        await cacheService.invalidateByTags([workflow.userId, 'automation']);
      }
      
      return data ? this.mapWorkflowFromDB(data) : null;
    } catch (error) {
      console.error('[Automation] Error updating workflow:', error);
      return null;
    }
  }
  
  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<boolean> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', workflowId);
      
      if (error) throw error;
      
      // Invalidate cache
      if (workflow) {
        await cacheService.invalidateByTags([workflow.userId, 'automation']);
      }
      
      return true;
    } catch (error) {
      console.error('[Automation] Error deleting workflow:', error);
      return false;
    }
  }
  
  /**
   * Get workflow statistics
   */
  async getWorkflowStats(workflowId: string): Promise<WorkflowStats> {
    try {
      const { data, error } = await supabase
        .rpc('get_workflow_stats', { workflow_uuid: workflowId });
      
      if (error) throw error;
      
      return {
        totalExecutions: data.total_executions || 0,
        successfulExecutions: data.successful_executions || 0,
        failedExecutions: data.failed_executions || 0,
        avgDurationMs: data.avg_duration_ms || 0,
        successRate: data.success_rate || 0,
        lastExecutionAt: data.last_execution_at ? new Date(data.last_execution_at) : undefined
      };
    } catch (error) {
      console.error('[Automation] Error fetching workflow stats:', error);
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgDurationMs: 0,
        successRate: 0
      };
    }
  }
  
  /**
   * Get automation overview for user
   */
  async getAutomationOverview(userId: string): Promise<AutomationOverview> {
    const cacheKey = CacheKeys.automationOverview(userId);
    
    // Try cache first
    const cached = await cacheService.get<AutomationOverview>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const { data, error } = await supabase
        .rpc('get_automation_overview', { user_uuid: userId });
      
      if (error) throw error;
      
      const overview: AutomationOverview = {
        totalWorkflows: data.total_workflows || 0,
        activeWorkflows: data.active_workflows || 0,
        totalExecutions: data.total_executions || 0,
        runningExecutions: data.running_executions || 0,
        completedToday: data.completed_today || 0,
        successRate: data.success_rate || 0,
        avgExecutionTime: data.avg_execution_time || 0
      };
      
      // Cache for 1 minute
      await cacheService.set(cacheKey, overview, { ttl: CacheTTL.MEDIUM });
      
      return overview;
    } catch (error) {
      console.error('[Automation] Error fetching automation overview:', error);
      return {
        totalWorkflows: 0,
        activeWorkflows: 0,
        totalExecutions: 0,
        runningExecutions: 0,
        completedToday: 0,
        successRate: 0,
        avgExecutionTime: 0
      };
    }
  }
  
  /**
   * Get workflow executions
   */
  async getWorkflowExecutions(
    workflowId: string,
    limit: number = 50
  ): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('executed_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(this.mapExecutionFromDB);
    } catch (error) {
      console.error('[Automation] Error fetching executions:', error);
      return [];
    }
  }
  
  /**
   * Get user's recent executions
   */
  async getUserExecutions(
    userId: string,
    limit: number = 50
  ): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('user_id', userId)
        .order('executed_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(this.mapExecutionFromDB);
    } catch (error) {
      console.error('[Automation] Error fetching user executions:', error);
      return [];
    }
  }
  
  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    inputData: Record<string, any> = {},
    triggerSource: string = 'manual'
  ): Promise<string | null> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }
      
      // Create execution record
      const { data, error } = await supabase
        .from('automation_executions')
        .insert({
          user_id: workflow.userId,
          workflow_id: workflowId,
          status: 'pending',
          trigger_source: triggerSource,
          input_data: inputData,
          output_data: {},
          execution_log: ['Workflow execution started']
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update workflow last executed timestamp
      await supabase
        .from('automation_workflows')
        .update({ last_executed_at: new Date().toISOString() })
        .eq('id', workflowId);
      
      // Invalidate caches
      await cacheService.invalidateByTags([workflow.userId, 'automation']);
      
      return data.id;
    } catch (error) {
      console.error('[Automation] Error executing workflow:', error);
      return null;
    }
  }
  
  /**
   * Update execution status
   */
  async updateExecutionStatus(
    executionId: string,
    status: WorkflowExecution['status'],
    updates: {
      outputData?: Record<string, any>;
      errorMessage?: string;
      errorStack?: string;
      executionLog?: string[];
      completedAt?: Date;
    } = {}
  ): Promise<boolean> {
    try {
      const updateData: any = { status };
      
      if (updates.outputData) updateData.output_data = updates.outputData;
      if (updates.errorMessage) updateData.error_message = updates.errorMessage;
      if (updates.errorStack) updateData.error_stack = updates.errorStack;
      if (updates.executionLog) updateData.execution_log = updates.executionLog;
      if (updates.completedAt) updateData.completed_at = updates.completedAt.toISOString();
      
      if (status === 'running' && !updateData.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('automation_executions')
        .update(updateData)
        .eq('id', executionId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('[Automation] Error updating execution status:', error);
      return false;
    }
  }
  
  // Private helper methods
  
  private mapWorkflowFromDB(dbWorkflow: any): Workflow {
    return {
      id: dbWorkflow.id,
      userId: dbWorkflow.user_id,
      name: dbWorkflow.name,
      description: dbWorkflow.description,
      category: dbWorkflow.category,
      triggerType: dbWorkflow.trigger_type,
      triggerConfig: dbWorkflow.trigger_config || {},
      workflowConfig: dbWorkflow.workflow_config || {},
      isActive: dbWorkflow.is_active,
      isTemplate: dbWorkflow.is_template,
      version: dbWorkflow.version,
      tags: dbWorkflow.tags || [],
      createdAt: new Date(dbWorkflow.created_at),
      updatedAt: new Date(dbWorkflow.updated_at),
      lastExecutedAt: dbWorkflow.last_executed_at ? new Date(dbWorkflow.last_executed_at) : undefined
    };
  }
  
  private mapExecutionFromDB(dbExecution: any): WorkflowExecution {
    return {
      id: dbExecution.id,
      userId: dbExecution.user_id,
      workflowId: dbExecution.workflow_id,
      status: dbExecution.status,
      triggerSource: dbExecution.trigger_source,
      inputData: dbExecution.input_data || {},
      outputData: dbExecution.output_data || {},
      errorMessage: dbExecution.error_message,
      errorStack: dbExecution.error_stack,
      executionLog: dbExecution.execution_log || [],
      startedAt: dbExecution.started_at ? new Date(dbExecution.started_at) : undefined,
      completedAt: dbExecution.completed_at ? new Date(dbExecution.completed_at) : undefined,
      durationMs: dbExecution.duration_ms,
      executedAt: new Date(dbExecution.executed_at),
      createdAt: new Date(dbExecution.created_at)
    };
  }
}

// Export singleton instance
export const automationService = new AutomationService();
