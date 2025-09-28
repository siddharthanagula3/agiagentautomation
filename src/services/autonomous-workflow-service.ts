/**
 * Autonomous Workflow Service
 * Enables proactive automation beyond request-response model
 */

import { supabase } from '../integrations/supabase/client';

export interface AutonomousWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'schedule' | 'event' | 'condition' | 'webhook';
    config: Record<string, unknown>;
  };
  actions: Array<{
    id: string;
    type: 'ai_task' | 'data_analysis' | 'notification' | 'integration' | 'custom';
    config: Record<string, unknown>;
    dependencies?: string[];
  }>;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
    value: unknown;
  }>;
  schedule: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
    time?: string;
    days?: number[];
    cron?: string;
  };
  status: 'active' | 'paused' | 'completed' | 'failed';
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  results: Array<{
    actionId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: unknown;
    error?: string;
    duration: number;
  }>;
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
    context?: Record<string, unknown>;
  }>;
}

export interface StandingOrder {
  id: string;
  userId: string;
  name: string;
  description: string;
  workflow: AutonomousWorkflow;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class AutonomousWorkflowService {
  private activeWorkflows: Map<string, AutonomousWorkflow> = new Map();
  private executionQueue: WorkflowExecution[] = [];
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.startScheduler();
  }

  /**
   * Create a new autonomous workflow
   */
  async createWorkflow(workflow: Omit<AutonomousWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutonomousWorkflow> {
    const newWorkflow: AutonomousWorkflow = {
      ...workflow,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Store in database
      const { data, error } = await supabase
        .from('autonomous_workflows')
        .insert([{
          name: newWorkflow.name,
          description: newWorkflow.description,
          trigger: newWorkflow.trigger,
          actions: newWorkflow.actions,
          conditions: newWorkflow.conditions,
          schedule: newWorkflow.schedule,
          status: newWorkflow.status,
          run_count: newWorkflow.runCount,
          success_rate: newWorkflow.successRate,
        }])
        .select()
        .single();

      if (error) throw error;

      // Add to active workflows
      this.activeWorkflows.set(newWorkflow.id, newWorkflow);

      // Schedule next run if active
      if (newWorkflow.status === 'active') {
        this.scheduleNextRun(newWorkflow);
      }

      return newWorkflow;
    } catch (error) {
      console.error('Failed to create workflow:', error);
      throw error;
    }
  }

  /**
   * Create a standing order (recurring autonomous workflow)
   */
  async createStandingOrder(
    userId: string,
    name: string,
    description: string,
    workflow: Omit<AutonomousWorkflow, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StandingOrder> {
    const autonomousWorkflow = await this.createWorkflow(workflow);
    
    const standingOrder: StandingOrder = {
      id: this.generateId(),
      userId,
      name,
      description,
      workflow: autonomousWorkflow,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Store in database
      const { data, error } = await supabase
        .from('standing_orders')
        .insert([{
          user_id: userId,
          name,
          description,
          workflow_id: autonomousWorkflow.id,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      return standingOrder;
    } catch (error) {
      console.error('Failed to create standing order:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, context?: Record<string, unknown>): Promise<WorkflowExecution> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const execution: WorkflowExecution = {
      id: this.generateId(),
      workflowId,
      status: 'running',
      startedAt: new Date(),
      results: workflow.actions.map(action => ({
        actionId: action.id,
        status: 'pending',
        duration: 0,
      })),
      logs: [],
    };

    this.executionQueue.push(execution);

    try {
      // Execute actions in sequence
      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i];
        const result = execution.results[i];
        
        result.status = 'running';
        const startTime = Date.now();

        try {
          // Check dependencies
          if (action.dependencies) {
            const dependencyResults = action.dependencies.map(depId => 
              execution.results.find(r => r.actionId === depId)
            );
            
            const failedDependencies = dependencyResults.filter(r => r?.status === 'failed');
            if (failedDependencies.length > 0) {
              throw new Error(`Dependencies failed: ${failedDependencies.map(d => d?.actionId).join(', ')}`);
            }
          }

          // Execute action
          const actionResult = await this.executeAction(action, context);
          
          result.status = 'completed';
          result.result = actionResult;
          result.duration = Date.now() - startTime;

          execution.logs.push({
            timestamp: new Date(),
            level: 'info',
            message: `Action ${action.id} completed successfully`,
            context: { actionId: action.id, duration: result.duration },
          });

        } catch (error) {
          result.status = 'failed';
          result.error = error instanceof Error ? error.message : 'Unknown error';
          result.duration = Date.now() - startTime;

          execution.logs.push({
            timestamp: new Date(),
            level: 'error',
            message: `Action ${action.id} failed: ${result.error}`,
            context: { actionId: action.id, error: result.error },
          });

          // Stop execution if action fails
          break;
        }
      }

      // Update execution status
      const hasFailures = execution.results.some(r => r.status === 'failed');
      execution.status = hasFailures ? 'failed' : 'completed';
      execution.completedAt = new Date();

      // Update workflow statistics
      await this.updateWorkflowStats(workflowId, !hasFailures);

      // Store execution in database
      await this.storeExecution(execution);

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      
      execution.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context: { error: error instanceof Error ? error.message : 'Unknown error' },
      });

      await this.storeExecution(execution);
      throw error;
    }
  }

  /**
   * Get user's standing orders
   */
  async getStandingOrders(userId: string): Promise<StandingOrder[]> {
    try {
      const { data, error } = await supabase
        .from('standing_orders')
        .select(`
          *,
          autonomous_workflows (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return data.map(order => ({
        id: order.id,
        userId: order.user_id,
        name: order.name,
        description: order.description,
        workflow: order.autonomous_workflows,
        isActive: order.is_active,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
      }));
    } catch (error) {
      console.error('Failed to get standing orders:', error);
      return [];
    }
  }

  /**
   * Get workflow executions
   */
  async getWorkflowExecutions(workflowId: string, limit = 10): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(exec => ({
        id: exec.id,
        workflowId: exec.workflow_id,
        status: exec.status,
        startedAt: new Date(exec.started_at),
        completedAt: exec.completed_at ? new Date(exec.completed_at) : undefined,
        results: exec.results,
        logs: exec.logs.map(log => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })),
      }));
    } catch (error) {
      console.error('Failed to get workflow executions:', error);
      return [];
    }
  }

  /**
   * Start the workflow scheduler
   */
  private startScheduler(): void {
    // Check for scheduled workflows every minute
    this.intervalId = setInterval(() => {
      this.checkScheduledWorkflows();
    }, 60000); // 1 minute
  }

  /**
   * Check for workflows that need to run
   */
  private async checkScheduledWorkflows(): Promise<void> {
    const now = new Date();
    
    for (const workflow of this.activeWorkflows.values()) {
      if (workflow.status !== 'active') continue;
      if (!workflow.nextRun || workflow.nextRun > now) continue;

      try {
        // Execute workflow
        await this.executeWorkflow(workflow.id);
        
        // Schedule next run
        this.scheduleNextRun(workflow);
      } catch (error) {
        console.error(`Failed to execute workflow ${workflow.id}:`, error);
      }
    }
  }

  /**
   * Schedule next run for a workflow
   */
  private scheduleNextRun(workflow: AutonomousWorkflow): void {
    const now = new Date();
    let nextRun: Date;

    switch (workflow.schedule.frequency) {
      case 'hourly':
        nextRun = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'daily':
        nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextRun = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        // Parse cron expression (simplified)
        nextRun = new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour
        break;
      default:
        nextRun = new Date(now.getTime() + 60 * 60 * 1000);
    }

    workflow.nextRun = nextRun;
    workflow.lastRun = now;
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: AutonomousWorkflow['actions'][0], context?: Record<string, unknown>): Promise<unknown> {
    switch (action.type) {
      case 'ai_task':
        return this.executeAITask(action.config, context);
      case 'data_analysis':
        return this.executeDataAnalysis(action.config, context);
      case 'notification':
        return this.executeNotification(action.config, context);
      case 'integration':
        return this.executeIntegration(action.config, context);
      case 'custom':
        return this.executeCustomAction(action.config, context);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute AI task
   */
  private async executeAITask(config: Record<string, unknown>, context?: Record<string, unknown>): Promise<unknown> {
    // This would integrate with your AI system
    console.log('Executing AI task:', config, context);
    
    // Simulate AI task execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      result: 'AI task completed successfully',
      timestamp: new Date(),
    };
  }

  /**
   * Execute data analysis
   */
  private async executeDataAnalysis(config: Record<string, unknown>, context?: Record<string, unknown>): Promise<unknown> {
    console.log('Executing data analysis:', config, context);
    
    // Simulate data analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      analysis: 'Data analysis completed',
      insights: ['Insight 1', 'Insight 2', 'Insight 3'],
      timestamp: new Date(),
    };
  }

  /**
   * Execute notification
   */
  private async executeNotification(config: Record<string, unknown>, context?: Record<string, unknown>): Promise<unknown> {
    console.log('Executing notification:', config, context);
    
    // Simulate notification sending
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Notification sent successfully',
      timestamp: new Date(),
    };
  }

  /**
   * Execute integration
   */
  private async executeIntegration(config: Record<string, unknown>, context?: Record<string, unknown>): Promise<unknown> {
    console.log('Executing integration:', config, context);
    
    // Simulate integration execution
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      integration: 'Integration executed successfully',
      timestamp: new Date(),
    };
  }

  /**
   * Execute custom action
   */
  private async executeCustomAction(config: Record<string, unknown>, context?: Record<string, unknown>): Promise<unknown> {
    console.log('Executing custom action:', config, context);
    
    // Simulate custom action execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      action: 'Custom action completed successfully',
      timestamp: new Date(),
    };
  }

  /**
   * Update workflow statistics
   */
  private async updateWorkflowStats(workflowId: string, success: boolean): Promise<void> {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow) return;

      workflow.runCount++;
      const newSuccessRate = ((workflow.successRate * (workflow.runCount - 1)) + (success ? 1 : 0)) / workflow.runCount;
      workflow.successRate = newSuccessRate;

      // Update in database
      await supabase
        .from('autonomous_workflows')
        .update({
          run_count: workflow.runCount,
          success_rate: workflow.successRate,
          last_run: workflow.lastRun?.toISOString(),
          next_run: workflow.nextRun?.toISOString(),
        })
        .eq('id', workflowId);
    } catch (error) {
      console.error('Failed to update workflow stats:', error);
    }
  }

  /**
   * Store execution in database
   */
  private async storeExecution(execution: WorkflowExecution): Promise<void> {
    try {
      await supabase
        .from('workflow_executions')
        .insert([{
          id: execution.id,
          workflow_id: execution.workflowId,
          status: execution.status,
          started_at: execution.startedAt.toISOString(),
          completed_at: execution.completedAt?.toISOString(),
          results: execution.results,
          logs: execution.logs.map(log => ({
            ...log,
            timestamp: log.timestamp.toISOString(),
          })),
        }]);
    } catch (error) {
      console.error('Failed to store execution:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

export const autonomousWorkflowService = new AutonomousWorkflowService();
