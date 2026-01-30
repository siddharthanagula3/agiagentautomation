/**
 * Advanced Multi-Agent Orchestrator
 * Intelligently coordinates 165+ AI Employees to work together autonomously
 * Runs continuously until task completion
 */

import { AI_EMPLOYEES } from '@/data/marketplace-employees';
import {
  UnifiedLLMService,
  type LLMProvider,
} from '@core/ai/llm/unified-language-model';
import { logger } from '@shared/lib/logger';
import type { CollaborationAgentCapability } from '@shared/types';

/**
 * Re-export canonical type for backward compatibility
 * @deprecated Import CollaborationAgentCapability from @shared/types instead
 */
export type AgentCapability = CollaborationAgentCapability;

export interface AgentTask {
  id: string;
  description: string;
  assignedTo: string; // employee name
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[]; // other task IDs
  result?: unknown;
  startTime?: Date;
  endTime?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface AgentCommunication {
  id: string;
  from: string;
  to: string;
  type:
    | 'request'
    | 'response'
    | 'handoff'
    | 'collaboration'
    | 'status'
    | 'error'
    | 'completion';
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationPlan {
  id: string;
  userRequest: string;
  intent: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  requiredAgents: string[];
  tasks: AgentTask[];
  executionStrategy: 'sequential' | 'parallel' | 'hybrid' | 'recursive';
  estimatedDuration: number;
  currentPhase: number;
  totalPhases: number;
  isComplete: boolean;
}

export interface AgentStatus {
  agentName: string;
  status:
    | 'idle'
    | 'analyzing'
    | 'working'
    | 'waiting'
    | 'completed'
    | 'blocked'
    | 'error';
  currentTask?: string;
  progress: number; // 0-100
  toolsUsing?: string[];
  blockedBy?: string;
  output?: unknown;
}

export interface TaskExecutionRecord {
  success: boolean;
  output?: unknown;
}

// Build capability map from all AI employees
const buildCapabilityMap = (): Record<string, AgentCapability> => {
  const capabilities: Record<string, AgentCapability> = {};

  AI_EMPLOYEES.forEach((emp) => {
    const key = emp.role.toLowerCase().replace(/\s+/g, '-');

    // Determine specialization from role and category
    const specialization = [
      ...emp.skills.map((s) => s.toLowerCase()),
      emp.category.toLowerCase(),
      emp.role.toLowerCase(),
    ];

    // Determine if can delegate (leadership roles)
    const canDelegate = [
      'architect',
      'manager',
      'ceo',
      'cto',
      'coo',
      'cfo',
      'director',
      'lead',
      'head',
      'orchestrator',
      'coordinator',
    ].some((title) => emp.role.toLowerCase().includes(title));

    // Determine priority (1-10)
    let priority = 5;
    if (emp.role.includes('Chief')) priority = 10;
    else if (emp.role.includes('Architect')) priority = 9;
    else if (emp.role.includes('Manager')) priority = 8;
    else if (emp.role.includes('Lead')) priority = 7;
    else if (emp.role.includes('Senior')) priority = 6;

    capabilities[key] = {
      employeeId: emp.id,
      employeeName: emp.name,
      role: emp.role,
      provider: emp.provider,
      skills: emp.skills,
      tools: emp.defaultTools || [],
      specialization,
      canDelegate,
      priority,
    };
  });

  return capabilities;
};

const EMPLOYEE_CAPABILITIES = buildCapabilityMap();

// TTL configuration for cleanup
const PLAN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const AGENT_STATUS_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // Run cleanup every minute
const MAX_ACTIVE_PLANS = 100; // Maximum concurrent plans to prevent unbounded growth
const MAX_AGENT_STATUSES = 500; // Maximum tracked agent statuses

interface TimestampedPlan extends OrchestrationPlan {
  _createdAt: number;
  _lastAccessedAt: number;
}

interface TimestampedAgentStatus extends AgentStatus {
  _updatedAt: number;
}

class MultiAgentOrchestrator {
  private activePlans: Map<string, TimestampedPlan> = new Map();
  private agentStatuses: Map<string, TimestampedAgentStatus> = new Map();
  private llmService: UnifiedLLMService;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Analyze user intent and create an orchestration plan
   */
  async analyzeIntent(userRequest: string): Promise<OrchestrationPlan> {

    // Determine complexity
    const complexity = this.determineComplexity(userRequest);

    // Determine intent
    const intent = this.extractIntent(userRequest);

    // Select appropriate agents
    const requiredAgents = this.selectAgents(userRequest, intent, complexity);

    // Break down into tasks
    const tasks = this.createTasks(userRequest, requiredAgents, complexity);

    // Determine execution strategy
    const executionStrategy = this.determineStrategy(tasks, complexity);

    // Estimate duration
    const estimatedDuration = this.estimateDuration(tasks, executionStrategy);

    const now = Date.now();
    const plan: TimestampedPlan = {
      id: `plan-${now}`,
      userRequest,
      intent,
      complexity,
      requiredAgents,
      tasks,
      executionStrategy,
      estimatedDuration,
      currentPhase: 1,
      totalPhases: this.calculatePhases(tasks),
      isComplete: false,
      _createdAt: now,
      _lastAccessedAt: now,
    };

    this.activePlans.set(plan.id, plan);

    // Return plan without internal timestamp fields
    const { _createdAt, _lastAccessedAt, ...publicPlan } = plan;
    return publicPlan as OrchestrationPlan;
  }

  /**
   * Execute the orchestration plan with continuous execution
   */
  async executePlan(
    plan: OrchestrationPlan,
    onCommunication: (comm: AgentCommunication) => void,
    onStatusUpdate: (status: AgentStatus) => void
  ): Promise<Map<string, TaskExecutionRecord>> {
    // Update last accessed timestamp for the plan
    const storedPlan = this.activePlans.get(plan.id);
    if (storedPlan) {
      storedPlan._lastAccessedAt = Date.now();
    }

    const results = new Map<string, TaskExecutionRecord>();
    let iterationCount = 0;
    const MAX_ITERATIONS = 100; // Prevent infinite loops

    // CONTINUOUS EXECUTION LOOP
    while (!plan.isComplete && iterationCount < MAX_ITERATIONS) {
      iterationCount++;

      // Update last accessed timestamp periodically during execution
      if (storedPlan && iterationCount % 10 === 0) {
        storedPlan._lastAccessedAt = Date.now();
      }

      // Get next executable tasks
      const nextTasks = this.getExecutableTasks(plan);

      if (nextTasks.length === 0) {
        // Check if all tasks are complete
        const allComplete = plan.tasks.every((t) => t.status === 'completed');
        if (allComplete) {
          plan.isComplete = true;
          this.sendCompletion(plan, onCommunication);
          break;
        }

        // Check for blocked tasks
        const blockedTasks = plan.tasks.filter(
          (t) => t.status === 'pending' && !this.canExecute(t, plan)
        );

        if (blockedTasks.length > 0) {
          // Try to unblock by creating helper tasks
          await this.unblockTasks(blockedTasks, plan, onCommunication);
        } else {
          // No tasks left and not complete - something went wrong
          logger.warn(
            '[Agent Collaboration] No executable tasks but plan not complete'
          );
          break;
        }
      }

      // Execute tasks based on strategy
      if (plan.executionStrategy === 'parallel') {
        await Promise.all(
          nextTasks.map((task) =>
            this.executeTask(
              task,
              plan,
              onCommunication,
              onStatusUpdate,
              results
            )
          )
        );
      } else {
        for (const task of nextTasks) {
          await this.executeTask(
            task,
            plan,
            onCommunication,
            onStatusUpdate,
            results
          );
        }
      }

      // Small delay to allow UI updates
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (iterationCount >= MAX_ITERATIONS) {
      logger.warn('[Agent Collaboration] Max iterations reached');
    }

    return results;
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    task: AgentTask,
    plan: OrchestrationPlan,
    onCommunication: (comm: AgentCommunication) => void,
    onStatusUpdate: (status: AgentStatus) => void,
    results: Map<string, TaskExecutionRecord>
  ): Promise<void> {
    if (task.status !== 'pending') return;

    task.status = 'in_progress';
    task.startTime = new Date();

    const agentName = task.assignedTo;

    // Send handoff communication if appropriate
    if (this.isHandoff(task, plan)) {
      this.sendHandoff(task, plan, onCommunication);
    }

    // Get provider for this agent
    const agentKey = agentName.toLowerCase().replace(/\s+/g, '-');
    const capability = EMPLOYEE_CAPABILITIES[agentKey];
    const provider = this.mapProviderToLLM(capability?.provider || 'claude');

    // Execute task with real LLM
    try {
      const result = await this.executeAgentTask(
        task,
        agentName,
        provider,
        onStatusUpdate
      );

      // Mark complete
      task.status = 'completed';
      task.endTime = new Date();
      task.result = result;
      results.set(task.id, { success: true, output: result });

      // Update agent status
      this.updateAgentStatus(
        agentName,
        {
          agentName,
          status: 'completed',
          currentTask: task.description,
          progress: 100,
          output: result,
        },
        onStatusUpdate
      );

      // Send completion communication
      this.sendTaskCompletion(task, onCommunication);
    } catch (error) {
      // Mark failed
      task.status = 'failed';
      task.endTime = new Date();
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      task.result = errorMsg;
      results.set(task.id, { success: false, output: errorMsg });

      // Update agent status
      this.updateAgentStatus(
        agentName,
        {
          agentName,
          status: 'failed',
          currentTask: task.description,
          progress: 0,
          output: errorMsg,
        },
        onStatusUpdate
      );

      // Optionally retry or delegate to another agent
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = 'pending'; // Reset for retry
      }
    }

    // Move to next phase if needed
    this.updatePhase(plan);
  }

  /**
   * Get next executable tasks based on dependencies
   */
  private getExecutableTasks(plan: OrchestrationPlan): AgentTask[] {
    return plan.tasks.filter((task) => {
      if (task.status !== 'pending') return false;

      // Check if all dependencies are complete
      const dependenciesMet = task.dependencies.every((depId) => {
        const depTask = plan.tasks.find((t) => t.id === depId);
        return depTask?.status === 'completed';
      });

      return dependenciesMet;
    });
  }

  /**
   * Check if a task can be executed
   */
  private canExecute(task: AgentTask, plan: OrchestrationPlan): boolean {
    return task.dependencies.every((depId) => {
      const depTask = plan.tasks.find((t) => t.id === depId);
      return depTask?.status === 'completed';
    });
  }

  /**
   * Try to unblock stuck tasks
   */
  private async unblockTasks(
    blockedTasks: AgentTask[],
    plan: OrchestrationPlan,
    onCommunication: (comm: AgentCommunication) => void
  ): Promise<void> {

    for (const task of blockedTasks) {
      // Find which dependency is blocking
      const blockingDeps = task.dependencies.filter((depId) => {
        const depTask = plan.tasks.find((t) => t.id === depId);
        return depTask?.status !== 'completed';
      });

      if (blockingDeps.length > 0) {
        // Send communication about blocking
        onCommunication({
          id: `comm-${Date.now()}`,
          from: 'System Orchestrator',
          to: task.assignedTo,
          type: 'status',
          message: `⏸️ Task "${task.description}" is waiting for ${blockingDeps.length} dependencies to complete`,
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Determine task complexity
   */
  private determineComplexity(
    userRequest: string
  ): OrchestrationPlan['complexity'] {
    const lowerRequest = userRequest.toLowerCase();

    // Very complex indicators
    if (
      (lowerRequest.includes('full') && lowerRequest.includes('stack')) ||
      (lowerRequest.includes('complete') &&
        lowerRequest.includes('application')) ||
      lowerRequest.includes('microservices') ||
      lowerRequest.includes('enterprise') ||
      lowerRequest.split(' ').length > 30
    ) {
      return 'very_complex';
    }

    // Complex indicators
    if (
      lowerRequest.includes('integrate') ||
      lowerRequest.includes('deploy') ||
      lowerRequest.includes('database') ||
      lowerRequest.includes('authentication') ||
      lowerRequest.split(' ').length > 15
    ) {
      return 'complex';
    }

    // Moderate indicators
    if (
      lowerRequest.includes('create') ||
      lowerRequest.includes('build') ||
      lowerRequest.includes('develop') ||
      lowerRequest.split(' ').length > 7
    ) {
      return 'moderate';
    }

    return 'simple';
  }

  /**
   * Extract intent from user request
   */
  private extractIntent(userRequest: string): string {
    const lowerRequest = userRequest.toLowerCase();

    if (lowerRequest.includes('build') || lowerRequest.includes('create')) {
      return 'Build new application/feature';
    }
    if (lowerRequest.includes('fix') || lowerRequest.includes('debug')) {
      return 'Fix issues/bugs';
    }
    if (lowerRequest.includes('optimize') || lowerRequest.includes('improve')) {
      return 'Optimize performance';
    }
    if (lowerRequest.includes('deploy') || lowerRequest.includes('launch')) {
      return 'Deploy application';
    }
    if (lowerRequest.includes('test') || lowerRequest.includes('qa')) {
      return 'Test and validate';
    }
    if (lowerRequest.includes('document')) {
      return 'Create documentation';
    }
    if (lowerRequest.includes('design')) {
      return 'Design architecture/UI';
    }

    return 'General assistance';
  }

  /**
   * Select appropriate agents for the task
   */
  private selectAgents(
    userRequest: string,
    intent: string,
    complexity: OrchestrationPlan['complexity']
  ): string[] {
    const lowerRequest = userRequest.toLowerCase();
    const selectedAgents: string[] = [];

    // Always start with System Orchestrator for complex tasks
    if (complexity === 'complex' || complexity === 'very_complex') {
      selectedAgents.push('System Orchestrator');
    }

    // Software architecture
    if (complexity !== 'simple') {
      selectedAgents.push('Software Architect');
    }

    // Frontend development
    if (
      lowerRequest.includes('ui') ||
      lowerRequest.includes('frontend') ||
      lowerRequest.includes('react') ||
      lowerRequest.includes('interface')
    ) {
      selectedAgents.push('Frontend Engineer');
      if (lowerRequest.includes('design')) {
        selectedAgents.push('UI/UX Designer');
      }
    }

    // Backend development
    if (
      lowerRequest.includes('api') ||
      lowerRequest.includes('backend') ||
      lowerRequest.includes('server') ||
      lowerRequest.includes('database')
    ) {
      selectedAgents.push('Backend Engineer');
      if (
        lowerRequest.includes('database') ||
        lowerRequest.includes('schema')
      ) {
        selectedAgents.push('Schema Designer');
      }
    }

    // Full-stack
    if (lowerRequest.includes('full') && lowerRequest.includes('stack')) {
      if (!selectedAgents.includes('Frontend Engineer'))
        selectedAgents.push('Frontend Engineer');
      if (!selectedAgents.includes('Backend Engineer'))
        selectedAgents.push('Backend Engineer');
      selectedAgents.push('Full-Stack Engineer');
    }

    // DevOps & Deployment
    if (
      lowerRequest.includes('deploy') ||
      lowerRequest.includes('docker') ||
      lowerRequest.includes('kubernetes') ||
      lowerRequest.includes('ci/cd')
    ) {
      selectedAgents.push('DevOps Engineer');
      selectedAgents.push('Deployment Specialist');
    }

    // Testing & QA
    if (
      lowerRequest.includes('test') ||
      lowerRequest.includes('qa') ||
      lowerRequest.includes('quality')
    ) {
      selectedAgents.push('QA Engineer');
      selectedAgents.push('Performance Testing Engineer');
    }

    // Security
    if (
      lowerRequest.includes('security') ||
      lowerRequest.includes('auth') ||
      lowerRequest.includes('authentication')
    ) {
      selectedAgents.push('Security Analyst');
      selectedAgents.push('Cybersecurity Engineer');
    }

    // Documentation
    if (
      lowerRequest.includes('document') ||
      lowerRequest.includes('readme') ||
      lowerRequest.includes('docs')
    ) {
      selectedAgents.push('Technical Writer');
      if (lowerRequest.includes('api')) {
        selectedAgents.push('API Documentation Specialist');
      }
    }

    // Data & Analytics
    if (
      lowerRequest.includes('data') ||
      lowerRequest.includes('analytics') ||
      lowerRequest.includes('ml') ||
      lowerRequest.includes('ai')
    ) {
      selectedAgents.push('Data Engineer');
      if (
        lowerRequest.includes('ml') ||
        lowerRequest.includes('machine learning')
      ) {
        selectedAgents.push('ML Engineer');
      }
    }

    // Mobile
    if (
      lowerRequest.includes('mobile') ||
      lowerRequest.includes('ios') ||
      lowerRequest.includes('android')
    ) {
      selectedAgents.push('Mobile App Developer');
    }

    // Default: if nothing selected, use versatile agents
    if (selectedAgents.length === 0) {
      selectedAgents.push('Full-Stack Engineer');
    }

    // Add supporting roles for complex tasks
    if (complexity === 'very_complex') {
      if (!selectedAgents.includes('Code Reviewer'))
        selectedAgents.push('Code Reviewer');
      if (!selectedAgents.includes('Error Handler'))
        selectedAgents.push('Error Handler');
    }

    return [...new Set(selectedAgents)]; // Remove duplicates
  }

  /**
   * Create tasks from requirements
   */
  private createTasks(
    userRequest: string,
    requiredAgents: string[],
    complexity: OrchestrationPlan['complexity']
  ): AgentTask[] {
    const tasks: AgentTask[] = [];
    let taskId = 1;

    // Phase 1: Planning & Design
    if (
      requiredAgents.includes('Software Architect') ||
      requiredAgents.includes('System Orchestrator')
    ) {
      tasks.push({
        id: `task-${taskId++}`,
        description: 'Analyze requirements and create architecture plan',
        assignedTo: requiredAgents.includes('System Orchestrator')
          ? 'System Orchestrator'
          : 'Software Architect',
        status: 'pending',
        priority: 'critical',
        dependencies: [],
        retryCount: 0,
        maxRetries: 3,
      });
    }

    // Phase 2: Frontend Development
    if (requiredAgents.includes('Frontend Engineer')) {
      tasks.push({
        id: `task-${taskId++}`,
        description: 'Build frontend UI components and layouts',
        assignedTo: 'Frontend Engineer',
        status: 'pending',
        priority: 'high',
        dependencies: tasks.length > 0 ? [tasks[0].id] : [],
        retryCount: 0,
        maxRetries: 3,
      });
    }

    // Phase 3: Backend Development
    if (requiredAgents.includes('Backend Engineer')) {
      tasks.push({
        id: `task-${taskId++}`,
        description: 'Create backend API and business logic',
        assignedTo: 'Backend Engineer',
        status: 'pending',
        priority: 'high',
        dependencies: tasks.length > 0 ? [tasks[0].id] : [],
        retryCount: 0,
        maxRetries: 3,
      });
    }

    // Phase 4: Integration
    if (requiredAgents.includes('Full-Stack Engineer')) {
      const frontendTask = tasks.find(
        (t) => t.assignedTo === 'Frontend Engineer'
      );
      const backendTask = tasks.find(
        (t) => t.assignedTo === 'Backend Engineer'
      );
      const deps = [frontendTask?.id, backendTask?.id].filter(
        Boolean
      ) as string[];

      tasks.push({
        id: `task-${taskId++}`,
        description: 'Integrate frontend and backend',
        assignedTo: 'Full-Stack Engineer',
        status: 'pending',
        priority: 'high',
        dependencies: deps,
        retryCount: 0,
        maxRetries: 3,
      });
    }

    // Phase 5: Testing
    if (requiredAgents.includes('QA Engineer')) {
      const implementationTasks = tasks.filter(
        (t) =>
          t.assignedTo.includes('Engineer') && t.assignedTo !== 'QA Engineer'
      );

      tasks.push({
        id: `task-${taskId++}`,
        description: 'Test application and verify quality',
        assignedTo: 'QA Engineer',
        status: 'pending',
        priority: 'high',
        dependencies: implementationTasks.map((t) => t.id),
        retryCount: 0,
        maxRetries: 3,
      });
    }

    // Phase 6: Deployment
    if (requiredAgents.includes('DevOps Engineer')) {
      tasks.push({
        id: `task-${taskId++}`,
        description: 'Deploy application to production',
        assignedTo: 'DevOps Engineer',
        status: 'pending',
        priority: 'medium',
        dependencies: tasks.slice(0, -1).map((t) => t.id), // Depends on all previous
        retryCount: 0,
        maxRetries: 3,
      });
    }

    // Phase 7: Documentation
    if (requiredAgents.includes('Technical Writer')) {
      tasks.push({
        id: `task-${taskId++}`,
        description: 'Create comprehensive documentation',
        assignedTo: 'Technical Writer',
        status: 'pending',
        priority: 'low',
        dependencies: [],
        retryCount: 0,
        maxRetries: 3,
      });
    }

    return tasks;
  }

  /**
   * Determine execution strategy
   */
  private determineStrategy(
    tasks: AgentTask[],
    complexity: OrchestrationPlan['complexity']
  ): OrchestrationPlan['executionStrategy'] {
    if (complexity === 'simple') return 'sequential';
    if (complexity === 'very_complex') return 'recursive';

    // Check if tasks can be parallelized
    const hasIndependentTasks = tasks.some(
      (task) => task.dependencies.length === 0
    );
    if (hasIndependentTasks && tasks.length > 3) {
      return 'hybrid';
    }

    return 'sequential';
  }

  /**
   * Estimate duration in seconds
   */
  private estimateDuration(
    tasks: AgentTask[],
    strategy: OrchestrationPlan['executionStrategy']
  ): number {
    const avgTaskDuration = 5; // seconds

    if (strategy === 'parallel') {
      return avgTaskDuration * 2; // Tasks run in parallel
    }
    if (strategy === 'sequential') {
      return tasks.length * avgTaskDuration;
    }

    // Hybrid/recursive
    return tasks.length * avgTaskDuration * 0.6; // Some parallelization
  }

  /**
   * Calculate total phases
   */
  private calculatePhases(tasks: AgentTask[]): number {
    // Group tasks by priority/dependencies
    const phases = new Set<number>();

    tasks.forEach((task) => {
      const phase = task.dependencies.length + 1;
      phases.add(phase);
    });

    return phases.size;
  }

  /**
   * Get tools for an agent
   */
  private getAgentTools(agentName: string): string[] {
    const key = agentName.toLowerCase().replace(/\s+/g, '-');
    const capability = EMPLOYEE_CAPABILITIES[key];
    return capability?.tools || ['code_interpreter', 'web_search'];
  }

  /**
   * Check if this is a handoff between agents
   */
  private isHandoff(task: AgentTask, plan: OrchestrationPlan): boolean {
    const taskIndex = plan.tasks.findIndex((t) => t.id === task.id);
    if (taskIndex === 0) return false;

    const prevTask = plan.tasks[taskIndex - 1];
    return prevTask.assignedTo !== task.assignedTo;
  }

  /**
   * Send handoff communication
   */
  private sendHandoff(
    task: AgentTask,
    plan: OrchestrationPlan,
    onCommunication: (comm: AgentCommunication) => void
  ): void {
    const taskIndex = plan.tasks.findIndex((t) => t.id === task.id);
    const prevTask = plan.tasks[taskIndex - 1];

    onCommunication({
      id: `comm-${Date.now()}`,
      from: prevTask.assignedTo,
      to: task.assignedTo,
      type: 'handoff',
      message: `Handing off to ${task.assignedTo} for "${task.description}"`,
      timestamp: new Date(),
    });
  }

  /**
   * Send task completion communication
   */
  private sendTaskCompletion(
    task: AgentTask,
    onCommunication: (comm: AgentCommunication) => void
  ): void {
    onCommunication({
      id: `comm-${Date.now()}`,
      from: task.assignedTo,
      to: 'user',
      type: 'completion',
      message: `✅ Completed: ${task.description}`,
      timestamp: new Date(),
    });
  }

  /**
   * Send plan completion
   */
  private sendCompletion(
    plan: OrchestrationPlan,
    onCommunication: (comm: AgentCommunication) => void
  ): void {
    onCommunication({
      id: `comm-${Date.now()}`,
      from: 'System',
      to: 'user',
      type: 'completion',
      message: `🎉 All tasks completed! Your request "${plan.userRequest}" has been fulfilled.`,
      timestamp: new Date(),
    });
  }

  /**
   * Update agent status
   */
  private updateAgentStatus(
    agentName: string,
    status: AgentStatus,
    onStatusUpdate: (status: AgentStatus) => void
  ): void {
    const timestampedStatus: TimestampedAgentStatus = {
      ...status,
      _updatedAt: Date.now(),
    };
    this.agentStatuses.set(agentName, timestampedStatus);
    onStatusUpdate(status);
  }

  /**
   * Update plan phase
   */
  private updatePhase(plan: OrchestrationPlan): void {
    const completedTasks = plan.tasks.filter(
      (t) => t.status === 'completed'
    ).length;
    const totalTasks = plan.tasks.length;

    plan.currentPhase = Math.ceil(
      (completedTasks / totalTasks) * plan.totalPhases
    );
  }

  /**
   * Initialize the orchestrator with LLM service
   */
  constructor() {
    this.llmService = new UnifiedLLMService();
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of stale entries to prevent memory leaks
   */
  private startCleanupInterval(): void {
    // Clear any existing interval
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }

    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL_MS);
  }

  /**
   * Stop the cleanup interval (call when orchestrator is being disposed)
   */
  public stopCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Clean up stale plans and agent statuses to prevent memory leaks
   * Removes entries that have exceeded their TTL or when maps exceed size limits
   */
  public cleanup(): void {
    const now = Date.now();

    // Clean up stale plans based on TTL
    for (const [planId, plan] of this.activePlans.entries()) {
      const age = now - plan._createdAt;
      const idleTime = now - plan._lastAccessedAt;

      // Remove completed plans older than TTL, or incomplete plans that have been idle
      if (
        (plan.isComplete && age > PLAN_TTL_MS) ||
        (!plan.isComplete && idleTime > PLAN_TTL_MS)
      ) {
        this.activePlans.delete(planId);
        logger.debug(`[Agent Collaboration] Cleaned up stale plan: ${planId}`);
      }
    }

    // Clean up stale agent statuses based on TTL
    for (const [agentName, status] of this.agentStatuses.entries()) {
      const age = now - status._updatedAt;

      // Remove statuses that haven't been updated within TTL
      // Keep 'working' statuses longer as they may be active
      const effectiveTTL =
        status.status === 'working'
          ? AGENT_STATUS_TTL_MS * 2
          : AGENT_STATUS_TTL_MS;

      if (age > effectiveTTL) {
        this.agentStatuses.delete(agentName);
        logger.debug(
          `[Agent Collaboration] Cleaned up stale agent status: ${agentName}`
        );
      }
    }

    // Enforce size limits by removing oldest entries if maps exceed max size
    if (this.activePlans.size > MAX_ACTIVE_PLANS) {
      const sortedPlans = [...this.activePlans.entries()].sort(
        ([, a], [, b]) => a._lastAccessedAt - b._lastAccessedAt
      );

      const toRemove = sortedPlans.slice(
        0,
        this.activePlans.size - MAX_ACTIVE_PLANS
      );
      for (const [planId] of toRemove) {
        this.activePlans.delete(planId);
        logger.debug(
          `[Agent Collaboration] Evicted plan due to size limit: ${planId}`
        );
      }
    }

    if (this.agentStatuses.size > MAX_AGENT_STATUSES) {
      const sortedStatuses = [...this.agentStatuses.entries()].sort(
        ([, a], [, b]) => a._updatedAt - b._updatedAt
      );

      const toRemove = sortedStatuses.slice(
        0,
        this.agentStatuses.size - MAX_AGENT_STATUSES
      );
      for (const [agentName] of toRemove) {
        this.agentStatuses.delete(agentName);
        logger.debug(
          `[Agent Collaboration] Evicted agent status due to size limit: ${agentName}`
        );
      }
    }
  }

  /**
   * Get current statistics for monitoring
   */
  public getStats(): { activePlans: number; agentStatuses: number } {
    return {
      activePlans: this.activePlans.size,
      agentStatuses: this.agentStatuses.size,
    };
  }

  /**
   * Clear all tracked state (useful for testing or reset scenarios)
   */
  public clearAll(): void {
    this.activePlans.clear();
    this.agentStatuses.clear();
    logger.debug('[Agent Collaboration] Cleared all tracked state');
  }

  /**
   * Map AI employee provider to LLM provider enum
   */
  private mapProviderToLLM(provider: string): LLMProvider {
    const providerMap: Record<string, LLMProvider> = {
      chatgpt: 'openai',
      openai: 'openai',
      claude: 'anthropic',
      anthropic: 'anthropic',
      gemini: 'google',
      google: 'google',
      perplexity: 'perplexity',
    };

    return providerMap[provider.toLowerCase()] || 'anthropic'; // Default to Anthropic (Claude)
  }

  /**
   * Execute agent task using real LLM API calls
   */
  private async executeAgentTask(
    task: AgentTask,
    agentName: string,
    provider: LLMProvider,
    onStatusUpdate: (status: AgentStatus) => void
  ): Promise<string> {

    // Update status: starting
    this.updateAgentStatus(
      agentName,
      {
        agentName,
        status: 'working',
        currentTask: task.description,
        progress: 0,
        toolsUsing: this.getAgentTools(agentName),
      },
      onStatusUpdate
    );

    // Get agent capability to create specialized prompt
    const agentKey = agentName.toLowerCase().replace(/\s+/g, '-');
    const capability = EMPLOYEE_CAPABILITIES[agentKey];

    // Create enhanced system prompt following Cursor, Bolt.new, v0, and Copilot best practices
    const systemPrompt = `<role>
You are ${agentName}, a world-class ${capability?.role || 'specialist'} AI agent in a collaborative multi-agent workforce.
You emulate the expertise of top developers and are always up-to-date with latest technologies and best practices (2025).
</role>

<identity>
- **Experience**: 10+ years of hands-on expertise in your domain
- **Approach**: Methodical, thorough, and autonomous
- **Communication**: Clear, concise, and production-focused
- **Quality**: You deliver code that is secure, tested, and maintainable
</identity>

<specializations>
${capability?.specialization.map((s) => `- ${s}`).join('\n') || '- General problem solving'}
</specializations>

<available_tools>
${capability?.tools.map((t) => `- ${t}`).join('\n') || '- Standard reasoning tools'}
</available_tools>

<core_principles>
1. **Holistic Thinking**: Consider the entire project context, dependencies, and constraints before acting
2. **Test-Driven Development**: Write tests first, then code, then verify tests pass
3. **Security First**: Validate all inputs, implement proper authentication/authorization (OAuth 2.0, JWT), use HTTPS
4. **Error Handling**: Handle errors and edge cases at function start, use early returns, place happy path last
5. **Code Quality**: Follow existing linting/Prettier settings, use 2-space indentation, functional > OOP patterns
6. **Minimal Disruption**: Only change what's necessary, avoid cosmetic-only changes unless requested
</core_principles>

<coordination_guidelines>
1. **Think Step-by-Step**: Break down tasks into clear, logical steps with explicit reasoning
2. **Plan Holistically**: Review ALL relevant files, previous changes, and project dependencies before creating artifacts
3. **Use Tools Wisely**: Only invoke tools when necessary; think between tool calls
4. **Communicate Clearly**: When handing off, provide concise summaries (1000-2000 tokens) with artifact references
5. **Reflect and Verify**: After completing work, verify output meets all requirements and tests pass
6. **Autonomy**: Complete multi-step tasks with minimal interruption by planning thoroughly upfront
</coordination_guidelines>

<output_format>
- **Code**: Use markdown code blocks with language and filename: \`\`\`typescript src/App.tsx
- **Formatting**: 2-space indentation, follow existing patterns, no unnecessary whitespace changes
- **Explanations**: Clear, structured, and technical
- **Handoffs**: Provide artifact references (e.g., "see artifact:12345"), not full content
- **Summaries**: Compress context while preserving key information and decisions
- **Tests**: Include test cases for non-trivial functionality
</output_format>

<constraints>
- Never break existing functionality or tests
- Respect existing code style and patterns
- Security and validation are non-negotiable
- Every change must have a clear purpose
- When uncertain, ask specific clarifying questions
</constraints>

<success_criteria>
- Execute tasks thoroughly with production-ready, tested, and secure code
- Provide complete solutions that work end-to-end
- Ensure all tests pass before marking work complete
- Create clear artifacts for handoffs to other specialists
- Think comprehensively about edge cases and error handling
</success_criteria>`;

    // Prepare messages for LLM with planning instructions (OpenAI, Anthropic, Google best practices)
    const userPrompt = `<task>
${task.description}
</task>

<context>
You are working within a React + TypeScript + Vite + Supabase project.
- Existing code patterns: Functional components, hooks, Zustand for state
- Styling: Tailwind CSS + Shadcn UI components
- Always follow existing linting and formatting rules
</context>

<instructions>
1. **Think first (Chain-of-Thought)**: Break down the task into logical steps with explicit reasoning
2. **Plan holistically**: Review ALL relevant files and dependencies before making changes
3. **Execute with precision**: Implement your plan following TDD (test-first approach when applicable)
4. **Verify thoroughly**: Ensure all tests pass and requirements are met
</instructions>

<output_requirements>
- **Start with**: "## Plan\n[Your step-by-step reasoning and approach]"
- **Include reasoning**: Show your thought process explicitly
- **Production-ready code**: Complete, tested, secure, and following existing patterns
- **Artifacts for handoffs**: Use references like "artifact:file-path" not full content
- **Examples when helpful**: Provide 1-2 few-shot examples if the task is complex
</output_requirements>

<constraints>
- Never break existing tests or functionality
- Follow the exact code style (2-space indents, functional patterns)
- Validate all inputs, handle errors at function start
- Security first: proper auth, HTTPS, input validation
- Be eager and autonomous - complete multi-step tasks with minimal interruption
</constraints>

Provide your complete, production-ready implementation following this structure.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    let fullResponse = '';
    let progress = 0;

    try {
      // Stream the response from LLM
      const stream = this.llmService.streamMessage(
        messages,
        `orchestration-${task.id}`,
        undefined, // userId - will be added when auth is integrated
        provider
      );

      for await (const chunk of stream) {
        if (!chunk.done && chunk.content) {
          fullResponse += chunk.content;
          progress = Math.min(95, progress + 5);

          // Update progress
          this.updateAgentStatus(
            agentName,
            {
              agentName,
              status: 'working',
              currentTask: task.description,
              progress,
              toolsUsing: this.getAgentTools(agentName),
            },
            onStatusUpdate
          );
        }

        if (chunk.done) {
          // Task complete
          this.updateAgentStatus(
            agentName,
            {
              agentName,
              status: 'completed',
              currentTask: task.description,
              progress: 100,
              output: fullResponse,
            },
            onStatusUpdate
          );
        }
      }

      return fullResponse;
    } catch (error) {
      logger.error(
        `[Agent Collaboration] Error executing task for ${agentName}:`,
        error
      );

      // Update status: failed
      this.updateAgentStatus(
        agentName,
        {
          agentName,
          status: 'failed',
          currentTask: task.description,
          progress: 0,
          output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        onStatusUpdate
      );

      throw error;
    }
  }
}

// Export singleton instance
export const multiAgentOrchestrator = new MultiAgentOrchestrator();
