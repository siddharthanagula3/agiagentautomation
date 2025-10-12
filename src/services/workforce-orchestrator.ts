/**
 * Workforce Orchestrator - Main entry point for the AI Workforce system
 * This orchestrates the entire pipeline from user input to task completion
 */

import { nlpProcessor, AnalysisResult } from './reasoning/nlp-processor';
import { taskDecomposer, ExecutionPlan } from './reasoning/task-decomposer';
import { agentSelector } from './reasoning/agent-selector';
import {
  executionCoordinator,
  ExecutionContext,
  ExecutionUpdate,
} from './orchestration/execution-coordinator';

export interface WorkforceRequest {
  userId: string;
  input: string;
  context?: Record<string, any>;
  permissions?: string[];
}

export interface WorkforceResponse {
  success: boolean;
  executionId?: string;
  analysis?: AnalysisResult;
  plan?: ExecutionPlan;
  updates?: AsyncGenerator<ExecutionUpdate>;
  error?: string;
}

export interface WorkforceStatus {
  activeExecutions: number;
  totalTasksCompleted: number;
  totalTasksFailed: number;
  agentsAvailable: number;
  agentsBusy: number;
}

/**
 * WorkforceOrchestrator - Main orchestrator class
 */
export class WorkforceOrchestrator {
  private requestHistory: Map<string, WorkforceRequest> = new Map();

  /**
   * Main method - processes user input and executes the workflow
   */
  async processRequest(request: WorkforceRequest): Promise<WorkforceResponse> {
    console.log('🚀 Processing workforce request:', request.input);

    try {
      // Step 1: Validate input
      const validation = nlpProcessor.validateInput(request.input);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.reason,
        };
      }

      // Step 2: Analyze user input (NLP)
      console.log('🧠 Step 1: Analyzing user intent...');
      const analysis = await nlpProcessor.analyzeInput(request.input);

      console.log('📊 Analysis Result:', {
        intent: analysis.intent.type,
        domain: analysis.intent.domain,
        complexity: analysis.intent.complexity,
        confidence: analysis.intent.confidence,
        estimatedDuration: analysis.intent.estimatedDuration,
      });

      // Step 3: Decompose into tasks
      console.log('🧩 Step 2: Decomposing into tasks...');
      const plan = await taskDecomposer.decompose(analysis.intent);

      console.log('📋 Execution Plan:', {
        totalTasks: plan.tasks.length,
        estimatedTime: plan.estimatedTotalTime,
        executionLevels: plan.executionOrder.length,
        criticalPath: plan.criticalPath.length,
      });

      // Step 4: Select optimal agents for each task
      console.log('🤖 Step 3: Selecting optimal agents...');
      for (const task of plan.tasks) {
        const selection = await agentSelector.selectOptimalAgent(task);
        task.requiredAgent = selection.primaryAgent;

        console.log(`  ✓ ${task.title} -> ${selection.primaryAgent}`);
        console.log(`    Reason: ${selection.selectionReason}`);
      }

      // Step 5: Start execution
      console.log('⚡ Step 4: Starting execution...');
      const execution = await executionCoordinator.execute(
        request.userId,
        plan,
        {
          ...request.context,
          originalInput: request.input,
          analysis: analysis.intent,
        }
      );

      // Store request
      this.requestHistory.set(request.userId, request);

      return {
        success: true,
        executionId: (await execution.next()).value.executionId,
        analysis,
        plan,
        updates: execution,
      };
    } catch (error) {
      console.error('❌ Error processing request:', error);

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Quick execution - for simple tasks
   */
  async quickExecute(
    userId: string,
    input: string
  ): Promise<WorkforceResponse> {
    return this.processRequest({
      userId,
      input,
      context: { quickMode: true },
    });
  }

  /**
   * Get current workforce status
   */
  getStatus(): WorkforceStatus {
    const activeExecutions = executionCoordinator.getActiveExecutions();
    const agentPool = executionCoordinator.getAgentPoolStatus();

    const totalTasksCompleted = activeExecutions.reduce(
      (sum, exec) => sum + exec.completedTasks.length,
      0
    );

    const totalTasksFailed = activeExecutions.reduce(
      (sum, exec) => sum + exec.failedTasks.length,
      0
    );

    const agentsBusy = Array.from(agentPool.values()).filter(
      agent => !agent.available
    ).length;

    return {
      activeExecutions: activeExecutions.length,
      totalTasksCompleted,
      totalTasksFailed,
      agentsAvailable: agentPool.size - agentsBusy,
      agentsBusy,
    };
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): ExecutionContext | undefined {
    return executionCoordinator.getCurrentStatus(executionId);
  }

  /**
   * Pause an execution
   */
  pauseExecution(executionId: string): void {
    executionCoordinator.pause(executionId);
  }

  /**
   * Resume an execution
   */
  async resumeExecution(
    executionId: string
  ): Promise<AsyncGenerator<ExecutionUpdate>> {
    return executionCoordinator.resume(executionId);
  }

  /**
   * Cancel an execution
   */
  cancelExecution(executionId: string): void {
    executionCoordinator.cancel(executionId);
  }

  /**
   * Rollback to a specific task
   */
  async rollbackExecution(
    executionId: string,
    toTaskId: string
  ): Promise<void> {
    return executionCoordinator.rollback(executionId, toTaskId);
  }

  /**
   * Get suggestions for improving user input
   */
  getSuggestions(input: string): string[] {
    return nlpProcessor.getSuggestions(input);
  }

  /**
   * Preview what would happen without executing
   */
  async preview(
    userId: string,
    input: string
  ): Promise<{
    analysis: AnalysisResult;
    plan: ExecutionPlan;
    estimatedCost: number;
    estimatedTime: number;
  }> {
    const analysis = await nlpProcessor.analyzeInput(input);
    const plan = await taskDecomposer.decompose(analysis.intent);

    // Select agents
    for (const task of plan.tasks) {
      const selection = await agentSelector.selectOptimalAgent(task);
      task.requiredAgent = selection.primaryAgent;
    }

    const estimatedCost = agentSelector.estimateTotalCost(plan.tasks);

    return {
      analysis,
      plan,
      estimatedCost,
      estimatedTime: plan.estimatedTotalTime,
    };
  }

  /**
   * Get request history for a user
   */
  getRequestHistory(userId: string): WorkforceRequest | undefined {
    return this.requestHistory.get(userId);
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ExecutionContext[] {
    return executionCoordinator.getActiveExecutions();
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number): ExecutionContext[] {
    return executionCoordinator.getHistory(limit);
  }
}

// Export singleton instance
export const workforceOrchestrator = new WorkforceOrchestrator();

// Export convenience functions
export async function executeWorkforce(
  userId: string,
  input: string,
  context?: Record<string, any>
): Promise<WorkforceResponse> {
  return workforceOrchestrator.processRequest({
    userId,
    input,
    context,
  });
}

export async function quickExecute(
  userId: string,
  input: string
): Promise<WorkforceResponse> {
  return workforceOrchestrator.quickExecute(userId, input);
}

export async function previewExecution(
  userId: string,
  input: string
): Promise<{
  analysis: AnalysisResult;
  plan: ExecutionPlan;
  estimatedCost: number;
  estimatedTime: number;
}> {
  return workforceOrchestrator.preview(userId, input);
}

export function getWorkforceStatus(): WorkforceStatus {
  return workforceOrchestrator.getStatus();
}

export function pauseWorkforce(executionId: string): void {
  workforceOrchestrator.pauseExecution(executionId);
}

export function resumeWorkforce(
  executionId: string
): Promise<AsyncGenerator<ExecutionUpdate>> {
  return workforceOrchestrator.resumeExecution(executionId);
}

export function cancelWorkforce(executionId: string): void {
  workforceOrchestrator.cancelExecution(executionId);
}

export function rollbackWorkforce(
  executionId: string,
  toTaskId: string
): Promise<void> {
  return workforceOrchestrator.rollbackExecution(executionId, toTaskId);
}
