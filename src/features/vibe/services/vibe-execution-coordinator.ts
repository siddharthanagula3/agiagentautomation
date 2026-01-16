/**
 * Vibe Execution Coordinator
 * Coordinates parallel task execution with dependency management
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import { messagePool } from './vibe-message-pool';
import { createCollaborationManager } from './vibe-collaboration-protocol';
import type { AIEmployee } from '@core/types/ai-employee';
import type {
  VibeTask,
  TaskStatus,
  TaskResult,
  ExecutionPlan,
} from '../types/vibe-task';
import type { SupervisorPlan } from '../types/vibe-agent';

/**
 * VibeExecutionCoordinator
 * Manages parallel execution of tasks with dependency tracking
 *
 * Features:
 * - Topological sorting for dependency resolution
 * - Parallel execution of independent tasks
 * - Real-time progress tracking
 * - Error handling and recovery
 */
export class VibeExecutionCoordinator {
  private activeTasks: Map<string, VibeTask> = new Map();
  private completedTasks: Map<string, VibeTask> = new Map();
  private sessionId: string = '';

  /**
   * Execute a supervisor plan with maximum parallelism
   *
   * @param plan - Supervisor plan with tasks and assignments
   * @param sessionId - VIBE session ID
   * @param userMessage - Original user request for context
   * @returns Map of task results
   */
  async executePlan(
    plan: SupervisorPlan,
    sessionId: string,
    userMessage: string
  ): Promise<Map<string, TaskResult>> {
    this.sessionId = sessionId;
    this.activeTasks.clear();
    this.completedTasks.clear();

    // Convert plan to execution tasks
    const tasks = this.convertPlanToTasks(plan, sessionId);

    // Build execution plan with dependency levels
    const executionPlan = this.buildExecutionPlan(tasks);

    // Track results
    const results = new Map<string, TaskResult>();

    // Execute level by level
    for (
      let levelIndex = 0;
      levelIndex < executionPlan.execution_order.length;
      levelIndex++
    ) {
      const levelTaskIds = executionPlan.execution_order[levelIndex];
      const levelTasks = levelTaskIds
        .map((id) => tasks.find((t) => t.id === id))
        .filter((t): t is VibeTask => t !== undefined);

      // Execute all tasks in this level in parallel
      const promises = levelTasks.map((task) =>
        this.executeTask(task, userMessage)
      );

      // Wait for all tasks in this level to complete
      const levelResults = await Promise.allSettled(promises);

      // Collect results and check for failures
      let hasFailures = false;

      levelResults.forEach((result, idx) => {
        const task = levelTasks[idx];

        if (result.status === 'fulfilled') {
          results.set(task.id, result.value);

          this.completedTasks.set(task.id, {
            ...task,
            status: 'completed',
            result: result.value.output,
            completed_at: new Date(),
          });
        } else {
          hasFailures = true;

          const errorResult: TaskResult = {
            task_id: task.id,
            status: 'failed',
            error: result.reason?.message || 'Unknown error',
            artifacts: [],
          };

          results.set(task.id, errorResult);

          this.completedTasks.set(task.id, {
            ...task,
            status: 'failed',
            error: result.reason?.message || 'Unknown error',
            completed_at: new Date(),
          });
        }
      });

      // If any task failed in this level, stop execution
      if (hasFailures && plan.execution_strategy !== 'parallel') {
        throw new Error(
          `Execution failed at level ${levelIndex + 1}. Check task results for details.`
        );
      }
    }

    return results;
  }

  /**
   * Execute a single task
   *
   * @private
   */
  private async executeTask(
    task: VibeTask,
    userMessage: string
  ): Promise<TaskResult> {
    const startTime = Date.now();

    // Update task status
    this.activeTasks.set(task.id, { ...task, status: 'running' });

    // Emit progress event
    this.emitProgress();

    try {
      // Find employee for this task
      const employee = await this.getEmployeeById(task.assigned_to);

      if (!employee) {
        throw new Error(`Employee not found: ${task.assigned_to}`);
      }

      // Create collaboration manager for this agent
      const collaborationManager = createCollaborationManager(
        employee.name,
        this.sessionId
      );

      // Send status update
      await collaborationManager.sendStatusUpdate(
        'supervisor',
        'working',
        0,
        task.description
      );

      // Execute task via LLM with employee's system prompt
      const result = await this.executeLLMTask(
        employee,
        task.description,
        userMessage
      );

      // Send task result
      await collaborationManager.sendTaskResult(
        'supervisor',
        task.id,
        result,
        []
      );

      // Cleanup
      collaborationManager.destroy();

      // Remove from active tasks
      this.activeTasks.delete(task.id);

      // Emit progress event
      this.emitProgress();

      return {
        task_id: task.id,
        status: 'completed',
        output: result,
        artifacts: [],
        metadata: {
          execution_time: Date.now() - startTime,
        },
      };
    } catch (error) {
      // Remove from active tasks
      this.activeTasks.delete(task.id);

      // Emit progress event
      this.emitProgress();

      throw error;
    }
  }

  /**
   * Execute LLM task with employee's system prompt
   *
   * @private
   */
  // Updated: Jan 15th 2026 - Fixed any type
  private async executeLLMTask(
    employee: AIEmployee,
    taskDescription: string,
    userMessage: string
  ): Promise<unknown> {
    const messages = [
      {
        role: 'system' as const,
        content: employee.systemPrompt,
      },
      {
        role: 'user' as const,
        content: `Original request: ${userMessage}\n\nYour task: ${taskDescription}\n\nPlease complete this task and provide your response.`,
      },
    ];

    const response = await unifiedLLMService.sendMessage(messages);

    return response.content;
  }

  /**
   * Get employee by ID/name from file-based employee system
   * Uses prompt-management service to get employees with their system prompts
   *
   * @private
   */
  private async getEmployeeById(
    employeeId: string
  ): Promise<AIEmployee | null> {
    // Updated: Jan 16th 2026 - Fixed to use prompt-management service
    // which loads file-based employees with system prompts
    try {
      // Import prompt management service dynamically to avoid circular dependencies
      const { systemPromptsService } = await import(
        '@core/ai/employees/prompt-management'
      );

      // employeeId here is actually the employee name (from task assignment)
      const employee = await systemPromptsService.getEmployeeByName(employeeId);

      if (employee) {
        return employee;
      }

      // Try exact name match if not found
      const allEmployees = await systemPromptsService.getAvailableEmployees();
      const matchedEmployee = allEmployees.find(
        (emp) =>
          emp.name === employeeId ||
          emp.name.toLowerCase() === employeeId.toLowerCase()
      );

      return matchedEmployee || null;
    } catch (error) {
      console.error(
        '[VibeExecutionCoordinator] Error loading employee:',
        error
      );
      return null;
    }
  }

  /**
   * Convert supervisor plan to execution tasks
   *
   * @private
   */
  private convertPlanToTasks(
    plan: SupervisorPlan,
    sessionId: string
  ): VibeTask[] {
    return plan.tasks.map((assignment) => ({
      id: assignment.id,
      session_id: sessionId,
      description: assignment.description,
      assigned_to: assignment.assigned_to.name, // Store employee name
      dependencies: assignment.dependencies,
      status: 'pending' as TaskStatus,
      created_at: new Date(),
    }));
  }

  /**
   * Build execution plan with dependency levels
   *
   * @private
   */
  private buildExecutionPlan(tasks: VibeTask[]): ExecutionPlan {
    const dependencyGraph = new Map<string, string[]>();

    // Build dependency graph
    tasks.forEach((task) => {
      dependencyGraph.set(task.id, task.dependencies);
    });

    // Topological sort to get execution levels
    const executionOrder = this.topologicalSort(tasks, dependencyGraph);

    return {
      tasks,
      dependency_graph: dependencyGraph,
      execution_order: executionOrder,
    };
  }

  /**
   * Topological sort to determine execution order
   * Returns tasks grouped by level (all tasks in a level can run in parallel)
   *
   * @private
   */
  private topologicalSort(
    tasks: VibeTask[],
    graph: Map<string, string[]>
  ): string[][] {
    const levels: string[][] = [];
    const completed = new Set<string>();
    const taskMap = new Map<string, VibeTask>();

    // Build task map
    tasks.forEach((task) => taskMap.set(task.id, task));

    while (completed.size < tasks.length) {
      const currentLevel: string[] = [];

      // Find tasks with all dependencies completed
      for (const task of tasks) {
        if (completed.has(task.id)) continue;

        const deps = graph.get(task.id) || [];
        const allDepsCompleted = deps.every((depId) => completed.has(depId));

        if (allDepsCompleted) {
          currentLevel.push(task.id);
          completed.add(task.id);
        }
      }

      if (currentLevel.length === 0 && completed.size < tasks.length) {
        // Circular dependency detected
        const remaining = tasks.filter((t) => !completed.has(t.id));
        throw new Error(
          `Circular dependency detected. Remaining tasks: ${remaining.map((t) => t.description).join(', ')}`
        );
      }

      if (currentLevel.length > 0) {
        levels.push(currentLevel);
      }
    }

    return levels;
  }

  /**
   * Emit progress event for UI updates
   *
   * @private
   */
  private emitProgress(): void {
    const stats = this.getExecutionStatus();

    messagePool.emit('execution_progress', {
      sessionId: this.sessionId,
      ...stats,
    });
  }

  /**
   * Get execution status
   *
   * @returns Execution statistics
   */
  getExecutionStatus(): {
    total: number;
    running: number;
    completed: number;
    failed: number;
    progress: number;
  } {
    const completed = Array.from(this.completedTasks.values()).filter(
      (t) => t.status === 'completed'
    ).length;

    const failed = Array.from(this.completedTasks.values()).filter(
      (t) => t.status === 'failed'
    ).length;

    const total = this.activeTasks.size + this.completedTasks.size;
    const progress = total > 0 ? ((completed + failed) / total) * 100 : 0;

    return {
      total,
      running: this.activeTasks.size,
      completed,
      failed,
      progress,
    };
  }

  /**
   * Get active tasks
   *
   * @returns Array of active tasks
   */
  getActiveTasks(): VibeTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Get completed tasks
   *
   * @returns Array of completed tasks
   */
  getCompletedTasks(): VibeTask[] {
    return Array.from(this.completedTasks.values());
  }

  /**
   * Reset coordinator state
   */
  reset(): void {
    this.activeTasks.clear();
    this.completedTasks.clear();
    this.sessionId = '';
  }
}

// Export singleton instance
export const vibeExecutionCoordinator = new VibeExecutionCoordinator();
