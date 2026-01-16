/**
 * Execution Coordinator - Manages task execution flow and agent coordination
 * This is the central controller for the AI Workforce
 */

import {
  Task,
  TaskStatus,
  AgentType,
  ExecutionPlan,
} from './reasoning/task-breakdown';
import { agentCommunicator, AgentMessage } from './agent-communication-protocol';

// Simple browser-compatible EventEmitter
class SimpleEventEmitter {
  private listeners: Map<string, EventListener[]> = new Map();

  on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  emit(event: string, ...args: unknown[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(...args));
    }
  }

  removeListener(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }
}

type EventListener = (...args: unknown[]) => void;

export type ExecutionStatus =
  | 'pending'
  | 'planning'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExecutionContext {
  id: string;
  userId: string;
  plan: ExecutionPlan;
  status: ExecutionStatus;
  currentTask: Task | null;
  completedTasks: Task[];
  failedTasks: Task[];
  pausedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface ExecutionUpdate {
  type:
    | 'status'
    | 'task_start'
    | 'task_progress'
    | 'task_complete'
    | 'task_error'
    | 'agent_message';
  executionId: string;
  timestamp: Date;
  data: unknown;
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  completedTasks: Task[];
  failedTasks: Task[];
  totalTime: number;
  totalCost: number;
  error?: string;
}

/**
 * ExecutionCoordinator - Main class for coordinating task execution
 */
export class ExecutionCoordinator extends SimpleEventEmitter {
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private executionHistory: ExecutionContext[] = [];
  private agentPool: Map<AgentType, AgentWorker> = new Map();

  constructor() {
    super();
    this.initializeAgentPool();
    this.setupMessageHandlers();
  }

  /**
   * Start executing a plan
   */
  async execute(
    userId: string,
    plan: ExecutionPlan,
    metadata: Record<string, unknown> = {}
  ): Promise<AsyncGenerator<ExecutionUpdate>> {
    const executionId = this.generateExecutionId();

    const context: ExecutionContext = {
      id: executionId,
      userId,
      plan,
      status: 'pending',
      currentTask: null,
      completedTasks: [],
      failedTasks: [],
      startedAt: new Date(),
      metadata,
    };

    this.activeExecutions.set(executionId, context);

    // Emit initial status
    this.emitUpdate({
      type: 'status',
      executionId,
      timestamp: new Date(),
      data: { status: 'planning', message: 'Preparing execution plan...' },
    });

    // Return async generator for streaming updates
    return this.executeWithUpdates(context);
  }

  /**
   * Execute plan and yield updates
   */
  private async *executeWithUpdates(
    context: ExecutionContext
  ): AsyncGenerator<ExecutionUpdate> {
    try {
      context.status = 'running';

      yield {
        type: 'status',
        executionId: context.id,
        timestamp: new Date(),
        data: {
          status: 'running',
          message: `Starting execution of ${context.plan.tasks.length} tasks...`,
        },
      };

      // Execute tasks level by level (parallel execution within levels)
      for (
        let levelIndex = 0;
        levelIndex < context.plan.executionOrder.length;
        levelIndex++
      ) {
        const taskIds = context.plan.executionOrder[levelIndex];

        yield {
          type: 'status',
          executionId: context.id,
          timestamp: new Date(),
          data: {
            status: 'running',
            message: `Executing level ${levelIndex + 1}/${context.plan.executionOrder.length} with ${taskIds.length} tasks...`,
          },
        };

        // Execute all tasks in this level in parallel
        const levelTasks = taskIds.map(
          (id) => context.plan.tasks.find((t) => t.id === id)!
        );

        const results = await Promise.allSettled(
          levelTasks.map((task) => this.executeTask(context, task))
        );

        // Process results and yield updates
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const task = levelTasks[i];

          if (result.status === 'fulfilled') {
            context.completedTasks.push(task);

            yield {
              type: 'task_complete',
              executionId: context.id,
              timestamp: new Date(),
              data: {
                task: task.id,
                title: task.title,
                result: result.value,
              },
            };
          } else {
            context.failedTasks.push(task);

            yield {
              type: 'task_error',
              executionId: context.id,
              timestamp: new Date(),
              data: {
                task: task.id,
                title: task.title,
                error: result.reason?.message || 'Unknown error',
              },
            };

            // Check if we should continue or abort
            if (task.priority === 'critical') {
              throw new Error(
                `Critical task ${task.title} failed: ${result.reason?.message}`
              );
            }
          }
        }

        // Check if execution was paused
        if (context.status === 'paused') {
          yield {
            type: 'status',
            executionId: context.id,
            timestamp: new Date(),
            data: { status: 'paused', message: 'Execution paused by user' },
          };
          return;
        }

        // Check if execution was cancelled
        if (context.status === 'cancelled') {
          yield {
            type: 'status',
            executionId: context.id,
            timestamp: new Date(),
            data: {
              status: 'cancelled',
              message: 'Execution cancelled by user',
            },
          };
          return;
        }
      }

      // Execution completed successfully
      context.status = 'completed';
      context.completedAt = new Date();

      yield {
        type: 'status',
        executionId: context.id,
        timestamp: new Date(),
        data: {
          status: 'completed',
          message: 'All tasks completed successfully!',
          completedTasks: context.completedTasks.length,
          failedTasks: context.failedTasks.length,
        },
      };
    } catch (error) {
      context.status = 'failed';
      context.error = (error as Error).message;
      context.completedAt = new Date();

      yield {
        type: 'status',
        executionId: context.id,
        timestamp: new Date(),
        data: {
          status: 'failed',
          message: (error as Error).message,
          error: (error as Error).stack,
        },
      };
    } finally {
      // Move to history
      this.executionHistory.push(context);
      this.activeExecutions.delete(context.id);
    }
  }

  /**
   * Execute a single task
   */
  // Updated: Jan 15th 2026 - Fixed recursive retry logic to use iteration to prevent stack overflow
  private async executeTask(
    context: ExecutionContext,
    task: Task
  ): Promise<unknown> {
    console.log(
      `🎯 Executing task: ${task.title} with agent: ${task.requiredAgent}`
    );

    context.currentTask = task;

    // Use iteration instead of recursion for retries
    while (task.retryCount < task.maxRetries) {
      task.status = 'in_progress';
      task.startedAt = new Date();

      this.emitUpdate({
        type: 'task_start',
        executionId: context.id,
        timestamp: new Date(),
        data: {
          task: task.id,
          title: task.title,
          agent: task.requiredAgent,
        },
      });

      try {
        // Get agent worker
        const agent = this.agentPool.get(task.requiredAgent);
        if (!agent) {
          throw new Error(`Agent ${task.requiredAgent} not available`);
        }

        // Check if agent is available
        if (!agent.available) {
          // Wait for agent to become available
          await this.waitForAgent(agent, 30000); // 30s timeout
        }

        // Mark agent as busy
        agent.available = false;
        agent.currentTask = task.id;

        // Execute task with agent
        const result = await this.executeWithAgent(agent, task, context);

        // Mark task as complete
        task.status = 'completed';
        task.completedAt = new Date();
        task.actualTime =
          (task.completedAt.getTime() - task.startedAt!.getTime()) / 1000 / 60; // minutes
        task.result = result;

        // Mark agent as available
        agent.available = true;
        agent.currentTask = undefined;
        agent.tasksCompleted++;

        return result;
      } catch (error) {
        console.error(`❌ Task ${task.title} failed:`, error);

        task.status = 'failed';
        task.error = (error as Error).message;
        task.retryCount++;

        // Retry logic with iteration instead of recursion
        if (task.retryCount < task.maxRetries) {
          console.log(
            `🔄 Retrying task ${task.title} (${task.retryCount}/${task.maxRetries})...`
          );

          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * task.retryCount)
          );

          // Reset status and continue loop for retry
          task.status = 'pending';
          continue;
        }

        // Mark agent as available even on failure
        const agent = this.agentPool.get(task.requiredAgent);
        if (agent) {
          agent.available = true;
          agent.currentTask = undefined;
          agent.tasksFailed++;
        }

        throw error;
      }
    }

    // Should never reach here, but TypeScript needs a return
    throw new Error(`Task ${task.title} exceeded max retries`);
  }

  /**
   * Execute task using specific agent
   */
  private async executeWithAgent(
    agent: AgentWorker,
    task: Task,
    context: ExecutionContext
  ): Promise<unknown> {
    // Send request to agent
    const response = await agentCommunicator.sendRequest(
      'system',
      agent.type,
      {
        action: 'execute_task',
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          type: task.type,
          domain: task.domain,
          tools: task.requiredTools,
          context: task.context,
        },
        executionContext: {
          id: context.id,
          userId: context.userId,
          metadata: context.metadata,
        },
      },
      'high',
      300000 // 5 minute timeout
    );

    return response;
  }

  /**
   * Wait for agent to become available
   */
  private async waitForAgent(
    agent: AgentWorker,
    timeout: number
  ): Promise<void> {
    const startTime = Date.now();

    while (!agent.available) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for agent ${agent.type}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  /**
   * Pause execution
   */
  pause(executionId: string): void {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (context.status !== 'running') {
      throw new Error(`Cannot pause execution in status: ${context.status}`);
    }

    context.status = 'paused';
    context.pausedAt = new Date();

    this.emitUpdate({
      type: 'status',
      executionId,
      timestamp: new Date(),
      data: { status: 'paused', message: 'Execution paused' },
    });
  }

  /**
   * Resume execution
   */
  async resume(executionId: string): Promise<AsyncGenerator<ExecutionUpdate>> {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (context.status !== 'paused') {
      throw new Error(`Cannot resume execution in status: ${context.status}`);
    }

    context.status = 'running';
    context.pausedAt = undefined;

    this.emitUpdate({
      type: 'status',
      executionId,
      timestamp: new Date(),
      data: { status: 'running', message: 'Execution resumed' },
    });

    return this.executeWithUpdates(context);
  }

  /**
   * Cancel execution
   */
  cancel(executionId: string): void {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    context.status = 'cancelled';
    context.completedAt = new Date();

    this.emitUpdate({
      type: 'status',
      executionId,
      timestamp: new Date(),
      data: { status: 'cancelled', message: 'Execution cancelled by user' },
    });

    // Move to history
    this.executionHistory.push(context);
    this.activeExecutions.delete(executionId);
  }

  /**
   * Rollback to a specific task
   */
  async rollback(executionId: string, toTaskId: string): Promise<void> {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    // Find the task in the plan
    const taskIndex = context.plan.tasks.findIndex((t) => t.id === toTaskId);
    if (taskIndex === -1) {
      throw new Error(`Task ${toTaskId} not found in execution plan`);
    }

    // Reset all tasks after this one
    context.plan.tasks.slice(taskIndex + 1).forEach((task) => {
      task.status = 'pending';
      task.result = undefined;
      task.error = undefined;
      task.retryCount = 0;
      task.startedAt = undefined;
      task.completedAt = undefined;
    });

    // Update completed tasks
    context.completedTasks = context.plan.tasks
      .slice(0, taskIndex + 1)
      .filter((t) => t.status === 'completed');

    // Clear failed tasks
    context.failedTasks = [];

    this.emitUpdate({
      type: 'status',
      executionId,
      timestamp: new Date(),
      data: {
        status: 'running',
        message: `Rolled back to task: ${toTaskId}`,
      },
    });
  }

  /**
   * Get current execution status
   */
  getCurrentStatus(executionId: string): ExecutionContext | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): ExecutionContext[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution history
   */
  getHistory(limit: number = 10): ExecutionContext[] {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Initialize agent pool
   */
  private initializeAgentPool(): void {
    const agentTypes: AgentType[] = [
      'claude-code',
      'cursor-agent',
      'replit-agent',
      'gemini-cli',
      'web-search',
      'bash-executor',
      'puppeteer-agent',
      'mcp-tool',
    ];

    agentTypes.forEach((type) => {
      this.agentPool.set(type, {
        type,
        available: true,
        tasksCompleted: 0,
        tasksFailed: 0,
        currentTask: undefined,
      });
    });
  }

  /**
   * Setup message handlers for agent communication
   */
  private setupMessageHandlers(): void {
    // Listen for agent messages
    agentCommunicator.addListener((message: AgentMessage) => {
      // Find execution context for this message
      const context = Array.from(this.activeExecutions.values()).find(
        (ctx) =>
          ctx.currentTask && message.payload?.taskId === ctx.currentTask.id
      );

      if (context) {
        this.emitUpdate({
          type: 'agent_message',
          executionId: context.id,
          timestamp: new Date(),
          data: {
            agent: message.from,
            message: message.payload,
          },
        });
      }
    });
  }

  /**
   * Emit an update event
   */
  private emitUpdate(update: ExecutionUpdate): void {
    this.emit('update', update);
  }

  /**
   * Generate unique execution ID
   */
  // Updated: Jan 15th 2026 - Fixed deprecated substr() method
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get agent pool status
   */
  getAgentPoolStatus(): Map<AgentType, AgentWorker> {
    return new Map(this.agentPool);
  }
}

interface AgentWorker {
  type: AgentType;
  available: boolean;
  currentTask?: string;
  tasksCompleted: number;
  tasksFailed: number;
}

// Export singleton instance
export const executionCoordinator = new ExecutionCoordinator();

// Export utility functions
export function startExecution(
  userId: string,
  plan: ExecutionPlan,
  metadata?: Record<string, unknown>
): Promise<AsyncGenerator<ExecutionUpdate>> {
  return executionCoordinator.execute(userId, plan, metadata);
}

export function pauseExecution(executionId: string): void {
  executionCoordinator.pause(executionId);
}

export function resumeExecution(
  executionId: string
): Promise<AsyncGenerator<ExecutionUpdate>> {
  return executionCoordinator.resume(executionId);
}

export function cancelExecution(executionId: string): void {
  executionCoordinator.cancel(executionId);
}

export function rollbackExecution(
  executionId: string,
  toTaskId: string
): Promise<void> {
  return executionCoordinator.rollback(executionId, toTaskId);
}

export function getExecutionStatus(
  executionId: string
): ExecutionContext | undefined {
  return executionCoordinator.getCurrentStatus(executionId);
}
