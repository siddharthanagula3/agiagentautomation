/**
 * Task Decomposer - Breaks down complex tasks into manageable subtasks
 * Creates dependency graphs and execution plans
 */

import { UserIntent, IntentType, DomainType, ComplexityLevel } from './nlp-processor';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked' | 'skipped';
export type AgentType = 'claude-code' | 'cursor-agent' | 'replit-agent' | 'gemini-cli' | 'web-search' | 'bash-executor' | 'puppeteer-agent' | 'mcp-tool';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: IntentType;
  domain: DomainType;
  status: TaskStatus;
  dependencies: string[]; // Task IDs this task depends on
  dependents: string[]; // Task IDs that depend on this task
  estimatedTime: number; // in minutes
  actualTime?: number;
  requiredAgent: AgentType;
  requiredTools: string[];
  priority: TaskPriority;
  complexity: ComplexityLevel;
  context: Record<string, any>;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface DependencyGraph {
  nodes: Map<string, Task>;
  edges: Map<string, Set<string>>; // taskId -> Set of dependent task IDs
  levels: Map<number, string[]>; // execution level -> task IDs
}

export interface ExecutionPlan {
  tasks: Task[];
  graph: DependencyGraph;
  estimatedTotalTime: number;
  criticalPath: string[];
  executionOrder: string[][];
}

/**
 * TaskDecomposer - Main class for breaking down tasks
 */
export class TaskDecomposer {
  private taskCounter: number = 0;

  /**
   * Main decomposition method - breaks down intent into tasks
   */
  async decompose(intent: UserIntent): Promise<ExecutionPlan> {
    console.log('🧩 Decomposing task:', intent);

    // Generate tasks based on intent and complexity
    const tasks = await this.generateTasks(intent);
    
    // Add dependencies between tasks
    const tasksWithDeps = this.addDependencies(tasks, intent);
    
    // Create dependency graph
    const graph = this.createDependencyGraph(tasksWithDeps);
    
    // Calculate execution order
    const executionOrder = this.calculateExecutionOrder(graph);
    
    // Find critical path
    const criticalPath = this.findCriticalPath(graph);
    
    // Estimate total time
    const estimatedTotalTime = this.estimateTotalTime(tasks, graph);

    return {
      tasks: tasksWithDeps,
      graph,
      estimatedTotalTime,
      criticalPath,
      executionOrder
    };
  }

  /**
   * Generate tasks based on the user intent
   */
  private async generateTasks(intent: UserIntent): Promise<Task[]> {
    const tasks: Task[] = [];

    // Always start with a research/planning task for non-simple tasks
    if (intent.complexity !== 'simple') {
      tasks.push(this.createTask({
        title: 'Research and Planning',
        description: `Research best approaches for: ${intent.requirements.join(', ')}`,
        type: 'research',
        domain: intent.domain,
        agent: 'gemini-cli',
        tools: ['web-search', 'web-fetch'],
        estimatedTime: intent.complexity === 'expert' ? 10 : 5,
        priority: 'high',
        complexity: intent.complexity
      }));
    }

    // Generate domain-specific tasks
    switch (intent.domain) {
      case 'code':
        tasks.push(...this.generateCodeTasks(intent));
        break;
      case 'data':
        tasks.push(...this.generateDataTasks(intent));
        break;
      case 'design':
        tasks.push(...this.generateDesignTasks(intent));
        break;
      case 'automation':
        tasks.push(...this.generateAutomationTasks(intent));
        break;
      case 'devops':
        tasks.push(...this.generateDevOpsTasks(intent));
        break;
      case 'testing':
        tasks.push(...this.generateTestingTasks(intent));
        break;
      default:
        tasks.push(...this.generateGenericTasks(intent));
    }

    // Always add a validation/testing task for medium+ complexity
    if (intent.complexity !== 'simple') {
      tasks.push(this.createTask({
        title: 'Validation and Testing',
        description: 'Validate the completed work and run tests',
        type: 'test',
        domain: intent.domain,
        agent: 'claude-code',
        tools: ['test-runner', 'code-analyzer'],
        estimatedTime: 5,
        priority: 'high',
        complexity: intent.complexity
      }));
    }

    // Add final review task for complex work
    if (intent.complexity === 'complex' || intent.complexity === 'expert') {
      tasks.push(this.createTask({
        title: 'Final Review and Documentation',
        description: 'Review all work and create documentation',
        type: 'analyze',
        domain: intent.domain,
        agent: 'claude-code',
        tools: ['document-generator'],
        estimatedTime: 5,
        priority: 'medium',
        complexity: intent.complexity
      }));
    }

    return tasks;
  }

  /**
   * Generate tasks specific to code domain
   */
  private generateCodeTasks(intent: UserIntent): Task[] {
    const tasks: Task[] = [];

    switch (intent.type) {
      case 'create':
        tasks.push(
          this.createTask({
            title: 'Design Architecture',
            description: 'Design the code architecture and structure',
            type: 'analyze',
            domain: 'code',
            agent: 'claude-code',
            tools: ['code-analyzer'],
            estimatedTime: 10,
            priority: 'high',
            complexity: intent.complexity
          }),
          this.createTask({
            title: 'Implement Core Functionality',
            description: 'Write the main code implementation',
            type: 'create',
            domain: 'code',
            agent: 'cursor-agent',
            tools: ['file-editor', 'code-generator'],
            estimatedTime: 20,
            priority: 'critical',
            complexity: intent.complexity
          }),
          this.createTask({
            title: 'Write Tests',
            description: 'Create unit and integration tests',
            type: 'test',
            domain: 'testing',
            agent: 'claude-code',
            tools: ['test-generator'],
            estimatedTime: 10,
            priority: 'high',
            complexity: intent.complexity
          })
        );
        break;

      case 'modify':
        tasks.push(
          this.createTask({
            title: 'Analyze Existing Code',
            description: 'Review and understand current implementation',
            type: 'analyze',
            domain: 'code',
            agent: 'claude-code',
            tools: ['code-analyzer', 'file-reader'],
            estimatedTime: 5,
            priority: 'high',
            complexity: intent.complexity
          }),
          this.createTask({
            title: 'Make Modifications',
            description: 'Apply the required changes',
            type: 'modify',
            domain: 'code',
            agent: 'cursor-agent',
            tools: ['file-editor'],
            estimatedTime: 10,
            priority: 'critical',
            complexity: intent.complexity
          })
        );
        break;

      case 'debug':
        tasks.push(
          this.createTask({
            title: 'Reproduce Issue',
            description: 'Identify and reproduce the bug',
            type: 'analyze',
            domain: 'code',
            agent: 'claude-code',
            tools: ['code-analyzer', 'test-runner'],
            estimatedTime: 5,
            priority: 'critical',
            complexity: intent.complexity
          }),
          this.createTask({
            title: 'Fix Bug',
            description: 'Implement the fix for the identified issue',
            type: 'modify',
            domain: 'code',
            agent: 'cursor-agent',
            tools: ['file-editor'],
            estimatedTime: 10,
            priority: 'critical',
            complexity: intent.complexity
          }),
          this.createTask({
            title: 'Verify Fix',
            description: 'Test the fix to ensure it works',
            type: 'test',
            domain: 'testing',
            agent: 'claude-code',
            tools: ['test-runner'],
            estimatedTime: 5,
            priority: 'high',
            complexity: intent.complexity
          })
        );
        break;
    }

    return tasks;
  }

  /**
   * Generate tasks specific to data domain
   */
  private generateDataTasks(intent: UserIntent): Task[] {
    const tasks: Task[] = [];

    tasks.push(
      this.createTask({
        title: 'Data Collection',
        description: 'Gather required data from sources',
        type: 'research',
        domain: 'data',
        agent: 'gemini-cli',
        tools: ['web-search', 'file-reader'],
        estimatedTime: 5,
        priority: 'high',
        complexity: intent.complexity
      }),
      this.createTask({
        title: 'Data Processing',
        description: 'Clean and process the data',
        type: 'analyze',
        domain: 'data',
        agent: 'claude-code',
        tools: ['data-processor'],
        estimatedTime: 10,
        priority: 'high',
        complexity: intent.complexity
      }),
      this.createTask({
        title: 'Generate Insights',
        description: 'Analyze data and generate insights',
        type: 'analyze',
        domain: 'data',
        agent: 'gemini-cli',
        tools: ['analyzer'],
        estimatedTime: 10,
        priority: 'medium',
        complexity: intent.complexity
      })
    );

    return tasks;
  }

  /**
   * Generate tasks specific to design domain
   */
  private generateDesignTasks(intent: UserIntent): Task[] {
    return [
      this.createTask({
        title: 'Design Concept',
        description: 'Create initial design concepts',
        type: 'create',
        domain: 'design',
        agent: 'gemini-cli',
        tools: ['design-generator'],
        estimatedTime: 10,
        priority: 'high',
        complexity: intent.complexity
      }),
      this.createTask({
        title: 'Implement Design',
        description: 'Code the UI based on design',
        type: 'create',
        domain: 'code',
        agent: 'cursor-agent',
        tools: ['file-editor'],
        estimatedTime: 15,
        priority: 'high',
        complexity: intent.complexity
      })
    ];
  }

  /**
   * Generate tasks specific to automation domain
   */
  private generateAutomationTasks(intent: UserIntent): Task[] {
    return [
      this.createTask({
        title: 'Define Workflow',
        description: 'Define automation workflow steps',
        type: 'analyze',
        domain: 'automation',
        agent: 'claude-code',
        tools: ['workflow-analyzer'],
        estimatedTime: 5,
        priority: 'high',
        complexity: intent.complexity
      }),
      this.createTask({
        title: 'Implement Automation',
        description: 'Create automation scripts',
        type: 'create',
        domain: 'automation',
        agent: 'replit-agent',
        tools: ['script-generator', 'bash-executor'],
        estimatedTime: 15,
        priority: 'critical',
        complexity: intent.complexity
      }),
      this.createTask({
        title: 'Test Automation',
        description: 'Test automation workflow',
        type: 'test',
        domain: 'testing',
        agent: 'puppeteer-agent',
        tools: ['test-runner'],
        estimatedTime: 10,
        priority: 'high',
        complexity: intent.complexity
      })
    ];
  }

  /**
   * Generate tasks specific to devops domain
   */
  private generateDevOpsTasks(intent: UserIntent): Task[] {
    return [
      this.createTask({
        title: 'Setup Infrastructure',
        description: 'Configure deployment infrastructure',
        type: 'create',
        domain: 'devops',
        agent: 'bash-executor',
        tools: ['docker', 'kubernetes'],
        estimatedTime: 15,
        priority: 'critical',
        complexity: intent.complexity
      }),
      this.createTask({
        title: 'Deploy Application',
        description: 'Deploy to target environment',
        type: 'deploy',
        domain: 'devops',
        agent: 'replit-agent',
        tools: ['deployment-manager'],
        estimatedTime: 10,
        priority: 'critical',
        complexity: intent.complexity
      })
    ];
  }

  /**
   * Generate tasks specific to testing domain
   */
  private generateTestingTasks(intent: UserIntent): Task[] {
    return [
      this.createTask({
        title: 'Write Test Cases',
        description: 'Create comprehensive test cases',
        type: 'create',
        domain: 'testing',
        agent: 'claude-code',
        tools: ['test-generator'],
        estimatedTime: 10,
        priority: 'high',
        complexity: intent.complexity
      }),
      this.createTask({
        title: 'Run Tests',
        description: 'Execute all test cases',
        type: 'test',
        domain: 'testing',
        agent: 'replit-agent',
        tools: ['test-runner'],
        estimatedTime: 5,
        priority: 'high',
        complexity: intent.complexity
      }),
      this.createTask({
        title: 'Analyze Coverage',
        description: 'Check test coverage and gaps',
        type: 'analyze',
        domain: 'testing',
        agent: 'claude-code',
        tools: ['coverage-analyzer'],
        estimatedTime: 5,
        priority: 'medium',
        complexity: intent.complexity
      })
    ];
  }

  /**
   * Generate generic tasks for other domains
   */
  private generateGenericTasks(intent: UserIntent): Task[] {
    return [
      this.createTask({
        title: 'Execute Main Task',
        description: intent.requirements.join('; '),
        type: intent.type,
        domain: intent.domain,
        agent: intent.suggestedAgents[0] as AgentType || 'claude-code',
        tools: ['generic-tool'],
        estimatedTime: 15,
        priority: 'critical',
        complexity: intent.complexity
      })
    ];
  }

  /**
   * Helper to create a task with standard properties
   */
  private createTask(params: {
    title: string;
    description: string;
    type: IntentType;
    domain: DomainType;
    agent: AgentType;
    tools: string[];
    estimatedTime: number;
    priority: TaskPriority;
    complexity: ComplexityLevel;
  }): Task {
    return {
      id: `task-${++this.taskCounter}`,
      title: params.title,
      description: params.description,
      type: params.type,
      domain: params.domain,
      status: 'pending',
      dependencies: [],
      dependents: [],
      estimatedTime: params.estimatedTime,
      requiredAgent: params.agent,
      requiredTools: params.tools,
      priority: params.priority,
      complexity: params.complexity,
      context: {},
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date()
    };
  }

  /**
   * Add dependencies between tasks based on logical flow
   */
  private addDependencies(tasks: Task[], intent: UserIntent): Task[] {
    // Create a copy to avoid mutation
    const tasksWithDeps = tasks.map(t => ({ ...t }));

    // Add logical dependencies
    for (let i = 0; i < tasksWithDeps.length - 1; i++) {
      const currentTask = tasksWithDeps[i];
      const nextTask = tasksWithDeps[i + 1];

      // Next task depends on current task
      if (!nextTask.dependencies.includes(currentTask.id)) {
        nextTask.dependencies.push(currentTask.id);
      }
      
      // Current task has next task as dependent
      if (!currentTask.dependents.includes(nextTask.id)) {
        currentTask.dependents.push(nextTask.id);
      }
    }

    // Add specific dependencies based on task types
    tasksWithDeps.forEach(task => {
      // Testing tasks depend on implementation tasks
      if (task.type === 'test') {
        const implTasks = tasksWithDeps.filter(t => 
          t.type === 'create' || t.type === 'modify'
        );
        implTasks.forEach(implTask => {
          if (!task.dependencies.includes(implTask.id)) {
            task.dependencies.push(implTask.id);
            implTask.dependents.push(task.id);
          }
        });
      }

      // Review tasks depend on all other tasks
      if (task.title.includes('Review') || task.title.includes('Documentation')) {
        tasksWithDeps.forEach(t => {
          if (t.id !== task.id && !task.dependencies.includes(t.id)) {
            task.dependencies.push(t.id);
            t.dependents.push(task.id);
          }
        });
      }
    });

    return tasksWithDeps;
  }

  /**
   * Create a dependency graph from tasks
   */
  private createDependencyGraph(tasks: Task[]): DependencyGraph {
    const nodes = new Map<string, Task>();
    const edges = new Map<string, Set<string>>();
    const levels = new Map<number, string[]>();

    // Build nodes
    tasks.forEach(task => {
      nodes.set(task.id, task);
      edges.set(task.id, new Set(task.dependents));
    });

    // Calculate levels (for parallel execution)
    const visited = new Set<string>();
    let level = 0;

    while (visited.size < tasks.length) {
      const levelTasks = tasks.filter(task => 
        !visited.has(task.id) && 
        task.dependencies.every(dep => visited.has(dep))
      );

      if (levelTasks.length === 0) break; // Circular dependency

      levels.set(level, levelTasks.map(t => t.id));
      levelTasks.forEach(task => visited.add(task.id));
      level++;
    }

    return { nodes, edges, levels };
  }

  /**
   * Calculate execution order respecting dependencies
   */
  private calculateExecutionOrder(graph: DependencyGraph): string[][] {
    const order: string[][] = [];

    // Execute level by level (tasks in same level can run in parallel)
    const sortedLevels = Array.from(graph.levels.keys()).sort((a, b) => a - b);
    
    sortedLevels.forEach(level => {
      const taskIds = graph.levels.get(level) || [];
      
      // Sort by priority within each level
      const priorityOrder: Record<TaskPriority, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };

      const sortedTasks = taskIds.sort((a, b) => {
        const taskA = graph.nodes.get(a)!;
        const taskB = graph.nodes.get(b)!;
        return priorityOrder[taskB.priority] - priorityOrder[taskA.priority];
      });

      order.push(sortedTasks);
    });

    return order;
  }

  /**
   * Find the critical path (longest path through the graph)
   */
  private findCriticalPath(graph: DependencyGraph): string[] {
    let longestPath: string[] = [];
    let longestTime = 0;

    // Try each task as starting point
    graph.nodes.forEach((task, taskId) => {
      if (task.dependencies.length === 0) {
        const path = this.findLongestPathFrom(taskId, graph);
        const pathTime = path.reduce((sum, id) => sum + graph.nodes.get(id)!.estimatedTime, 0);
        
        if (pathTime > longestTime) {
          longestTime = pathTime;
          longestPath = path;
        }
      }
    });

    return longestPath;
  }

  /**
   * Find longest path from a given task
   */
  private findLongestPathFrom(taskId: string, graph: DependencyGraph): string[] {
    const task = graph.nodes.get(taskId)!;
    
    if (task.dependents.length === 0) {
      return [taskId];
    }

    let longestPath: string[] = [];
    let longestTime = 0;

    task.dependents.forEach(depId => {
      const path = this.findLongestPathFrom(depId, graph);
      const pathTime = path.reduce((sum, id) => sum + graph.nodes.get(id)!.estimatedTime, 0);
      
      if (pathTime > longestTime) {
        longestTime = pathTime;
        longestPath = path;
      }
    });

    return [taskId, ...longestPath];
  }

  /**
   * Estimate total time considering parallel execution
   */
  private estimateTotalTime(tasks: Task[], graph: DependencyGraph): number {
    let totalTime = 0;

    // Sum up time for each level (parallel tasks count as one)
    const sortedLevels = Array.from(graph.levels.keys()).sort((a, b) => a - b);
    
    sortedLevels.forEach(level => {
      const taskIds = graph.levels.get(level) || [];
      const maxTimeInLevel = Math.max(
        ...taskIds.map(id => graph.nodes.get(id)!.estimatedTime)
      );
      totalTime += maxTimeInLevel;
    });

    return totalTime;
  }

  /**
   * Optimize execution order for better performance
   */
  optimizeExecutionOrder(tasks: Task[]): Task[] {
    // Sort by priority and dependencies
    return tasks.sort((a, b) => {
      // Critical tasks first
      const priorityOrder: Record<TaskPriority, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };

      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Tasks with fewer dependencies first
      return a.dependencies.length - b.dependencies.length;
    });
  }
}

// Export singleton instance
export const taskDecomposer = new TaskDecomposer();

// Export utility function
export function decomposeTask(intent: UserIntent): Promise<ExecutionPlan> {
  return taskDecomposer.decompose(intent);
}
