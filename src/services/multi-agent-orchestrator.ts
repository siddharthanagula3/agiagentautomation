/**
 * Advanced Multi-Agent Orchestrator
 * Intelligently coordinates 165+ AI Employees to work together autonomously
 * Runs continuously until task completion
 */

import { AI_EMPLOYEES, type AIEmployee } from '@/data/ai-employees';
import { mcpToolsService, type MCPTool } from './mcp-tools-service';

export interface AgentCapability {
  employeeId: string;
  employeeName: string;
  role: string;
  provider: string;
  skills: string[];
  tools: string[];
  specialization: string[];
  canDelegate: boolean;
  priority: number; // 1-10, higher means better for leadership
}

export interface AgentTask {
  id: string;
  description: string;
  assignedTo: string; // employee name
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[]; // other task IDs
  result?: any;
  startTime?: Date;
  endTime?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface AgentCommunication {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'handoff' | 'collaboration' | 'status' | 'error' | 'completion';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
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
  status: 'idle' | 'analyzing' | 'working' | 'waiting' | 'completed' | 'blocked' | 'error';
  currentTask?: string;
  progress: number; // 0-100
  toolsUsing?: string[];
  blockedBy?: string;
  output?: any;
}

// Build capability map from all AI employees
const buildCapabilityMap = (): Record<string, AgentCapability> => {
  const capabilities: Record<string, AgentCapability> = {};
  
  AI_EMPLOYEES.forEach(emp => {
    const key = emp.role.toLowerCase().replace(/\s+/g, '-');
    
    // Determine specialization from role and category
    const specialization = [
      ...emp.skills.map(s => s.toLowerCase()),
      emp.category.toLowerCase(),
      emp.role.toLowerCase(),
    ];
    
    // Determine if can delegate (leadership roles)
    const canDelegate = [
      'architect', 'manager', 'ceo', 'cto', 'coo', 'cfo', 
      'director', 'lead', 'head', 'orchestrator', 'coordinator'
    ].some(title => emp.role.toLowerCase().includes(title));
    
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

class MultiAgentOrchestrator {
  private activePlans: Map<string, OrchestrationPlan> = new Map();
  private agentStatuses: Map<string, AgentStatus> = new Map();
  
  /**
   * Analyze user intent and create an orchestration plan
   */
  async analyzeIntent(userRequest: string): Promise<OrchestrationPlan> {
    console.log('[Orchestrator] Analyzing user request:', userRequest);
    
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
    
    const plan: OrchestrationPlan = {
      id: `plan-${Date.now()}`,
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
    };
    
    this.activePlans.set(plan.id, plan);
    return plan;
  }
  
  /**
   * Execute the orchestration plan with continuous execution
   */
  async executePlan(
    plan: OrchestrationPlan,
    onCommunication: (comm: AgentCommunication) => void,
    onStatusUpdate: (status: AgentStatus) => void
  ): Promise<Map<string, any>> {
    console.log('[Orchestrator] Starting plan execution:', plan.id);
    
    const results = new Map<string, any>();
    let iterationCount = 0;
    const MAX_ITERATIONS = 100; // Prevent infinite loops
    
    // CONTINUOUS EXECUTION LOOP
    while (!plan.isComplete && iterationCount < MAX_ITERATIONS) {
      iterationCount++;
      console.log(`[Orchestrator] Iteration ${iterationCount}`);
      
      // Get next executable tasks
      const nextTasks = this.getExecutableTasks(plan);
      
      if (nextTasks.length === 0) {
        // Check if all tasks are complete
        const allComplete = plan.tasks.every(t => t.status === 'completed');
        if (allComplete) {
          plan.isComplete = true;
          this.sendCompletion(plan, onCommunication);
          break;
        }
        
        // Check for blocked tasks
        const blockedTasks = plan.tasks.filter(t => 
          t.status === 'pending' && !this.canExecute(t, plan)
        );
        
        if (blockedTasks.length > 0) {
          // Try to unblock by creating helper tasks
          await this.unblockTasks(blockedTasks, plan, onCommunication);
        } else {
          // No tasks left and not complete - something went wrong
          console.warn('[Orchestrator] No executable tasks but plan not complete');
          break;
        }
      }
      
      // Execute tasks based on strategy
      if (plan.executionStrategy === 'parallel') {
        await Promise.all(
          nextTasks.map(task => 
            this.executeTask(task, plan, onCommunication, onStatusUpdate, results)
          )
        );
      } else {
        for (const task of nextTasks) {
          await this.executeTask(task, plan, onCommunication, onStatusUpdate, results);
        }
      }
      
      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (iterationCount >= MAX_ITERATIONS) {
      console.warn('[Orchestrator] Max iterations reached');
    }
    
    console.log('[Orchestrator] Plan execution complete');
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
    results: Map<string, any>
  ): Promise<void> {
    if (task.status !== 'pending') return;
    
    task.status = 'in_progress';
    task.startTime = new Date();
    
    const agentName = task.assignedTo;
    
    // Update agent status
    this.updateAgentStatus(agentName, {
      agentName,
      status: 'working',
      currentTask: task.description,
      progress: 30,
      toolsUsing: this.getAgentTools(agentName),
    }, onStatusUpdate);
    
    // Send handoff communication if appropriate
    if (this.isHandoff(task, plan)) {
      this.sendHandoff(task, plan, onCommunication);
    }
    
    // Simulate agent working (in real implementation, this would call actual LLM)
    await this.simulateAgentWork(task, agentName, onStatusUpdate);
    
    // Mark complete
    task.status = 'completed';
    task.endTime = new Date();
    results.set(task.id, { success: true, output: `Completed: ${task.description}` });
    
    // Update agent status
    this.updateAgentStatus(agentName, {
      agentName,
      status: 'completed',
      currentTask: task.description,
      progress: 100,
    }, onStatusUpdate);
    
    // Send completion communication
    this.sendTaskCompletion(task, onCommunication);
    
    // Move to next phase if needed
    this.updatePhase(plan);
  }
  
  /**
   * Get next executable tasks based on dependencies
   */
  private getExecutableTasks(plan: OrchestrationPlan): AgentTask[] {
    return plan.tasks.filter(task => {
      if (task.status !== 'pending') return false;
      
      // Check if all dependencies are complete
      const dependenciesMet = task.dependencies.every(depId => {
        const depTask = plan.tasks.find(t => t.id === depId);
        return depTask?.status === 'completed';
      });
      
      return dependenciesMet;
    });
  }
  
  /**
   * Check if a task can be executed
   */
  private canExecute(task: AgentTask, plan: OrchestrationPlan): boolean {
    return task.dependencies.every(depId => {
      const depTask = plan.tasks.find(t => t.id === depId);
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
    console.log('[Orchestrator] Attempting to unblock tasks:', blockedTasks.length);
    
    for (const task of blockedTasks) {
      // Find which dependency is blocking
      const blockingDeps = task.dependencies.filter(depId => {
        const depTask = plan.tasks.find(t => t.id === depId);
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
  private determineComplexity(userRequest: string): OrchestrationPlan['complexity'] {
    const lowerRequest = userRequest.toLowerCase();
    
    // Very complex indicators
    if (
      (lowerRequest.includes('full') && lowerRequest.includes('stack')) ||
      (lowerRequest.includes('complete') && lowerRequest.includes('application')) ||
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
  private selectAgents(userRequest: string, intent: string, complexity: OrchestrationPlan['complexity']): string[] {
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
    if (lowerRequest.includes('ui') || lowerRequest.includes('frontend') || lowerRequest.includes('react') || lowerRequest.includes('interface')) {
      selectedAgents.push('Frontend Engineer');
      if (lowerRequest.includes('design')) {
        selectedAgents.push('UI/UX Designer');
      }
    }
    
    // Backend development
    if (lowerRequest.includes('api') || lowerRequest.includes('backend') || lowerRequest.includes('server') || lowerRequest.includes('database')) {
      selectedAgents.push('Backend Engineer');
      if (lowerRequest.includes('database') || lowerRequest.includes('schema')) {
        selectedAgents.push('Schema Designer');
      }
    }
    
    // Full-stack
    if (lowerRequest.includes('full') && lowerRequest.includes('stack')) {
      if (!selectedAgents.includes('Frontend Engineer')) selectedAgents.push('Frontend Engineer');
      if (!selectedAgents.includes('Backend Engineer')) selectedAgents.push('Backend Engineer');
      selectedAgents.push('Full-Stack Engineer');
    }
    
    // DevOps & Deployment
    if (lowerRequest.includes('deploy') || lowerRequest.includes('docker') || lowerRequest.includes('kubernetes') || lowerRequest.includes('ci/cd')) {
      selectedAgents.push('DevOps Engineer');
      selectedAgents.push('Deployment Specialist');
    }
    
    // Testing & QA
    if (lowerRequest.includes('test') || lowerRequest.includes('qa') || lowerRequest.includes('quality')) {
      selectedAgents.push('QA Engineer');
      selectedAgents.push('Performance Testing Engineer');
    }
    
    // Security
    if (lowerRequest.includes('security') || lowerRequest.includes('auth') || lowerRequest.includes('authentication')) {
      selectedAgents.push('Security Analyst');
      selectedAgents.push('Cybersecurity Engineer');
    }
    
    // Documentation
    if (lowerRequest.includes('document') || lowerRequest.includes('readme') || lowerRequest.includes('docs')) {
      selectedAgents.push('Technical Writer');
      if (lowerRequest.includes('api')) {
        selectedAgents.push('API Documentation Specialist');
      }
    }
    
    // Data & Analytics
    if (lowerRequest.includes('data') || lowerRequest.includes('analytics') || lowerRequest.includes('ml') || lowerRequest.includes('ai')) {
      selectedAgents.push('Data Engineer');
      if (lowerRequest.includes('ml') || lowerRequest.includes('machine learning')) {
        selectedAgents.push('ML Engineer');
      }
    }
    
    // Mobile
    if (lowerRequest.includes('mobile') || lowerRequest.includes('ios') || lowerRequest.includes('android')) {
      selectedAgents.push('Mobile App Developer');
    }
    
    // Default: if nothing selected, use versatile agents
    if (selectedAgents.length === 0) {
      selectedAgents.push('Full-Stack Engineer');
    }
    
    // Add supporting roles for complex tasks
    if (complexity === 'very_complex') {
      if (!selectedAgents.includes('Code Reviewer')) selectedAgents.push('Code Reviewer');
      if (!selectedAgents.includes('Error Handler')) selectedAgents.push('Error Handler');
    }
    
    return [...new Set(selectedAgents)]; // Remove duplicates
  }
  
  /**
   * Create tasks from requirements
   */
  private createTasks(userRequest: string, requiredAgents: string[], complexity: OrchestrationPlan['complexity']): AgentTask[] {
    const tasks: AgentTask[] = [];
    let taskId = 1;
    
    // Phase 1: Planning & Design
    if (requiredAgents.includes('Software Architect') || requiredAgents.includes('System Orchestrator')) {
      tasks.push({
        id: `task-${taskId++}`,
        description: 'Analyze requirements and create architecture plan',
        assignedTo: requiredAgents.includes('System Orchestrator') ? 'System Orchestrator' : 'Software Architect',
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
      const frontendTask = tasks.find(t => t.assignedTo === 'Frontend Engineer');
      const backendTask = tasks.find(t => t.assignedTo === 'Backend Engineer');
      const deps = [frontendTask?.id, backendTask?.id].filter(Boolean) as string[];
      
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
      const implementationTasks = tasks.filter(t => 
        t.assignedTo.includes('Engineer') && t.assignedTo !== 'QA Engineer'
      );
      
      tasks.push({
        id: `task-${taskId++}`,
        description: 'Test application and verify quality',
        assignedTo: 'QA Engineer',
        status: 'pending',
        priority: 'high',
        dependencies: implementationTasks.map(t => t.id),
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
        dependencies: tasks.slice(0, -1).map(t => t.id), // Depends on all previous
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
  private determineStrategy(tasks: AgentTask[], complexity: OrchestrationPlan['complexity']): OrchestrationPlan['executionStrategy'] {
    if (complexity === 'simple') return 'sequential';
    if (complexity === 'very_complex') return 'recursive';
    
    // Check if tasks can be parallelized
    const hasIndependentTasks = tasks.some(task => task.dependencies.length === 0);
    if (hasIndependentTasks && tasks.length > 3) {
      return 'hybrid';
    }
    
    return 'sequential';
  }
  
  /**
   * Estimate duration in seconds
   */
  private estimateDuration(tasks: AgentTask[], strategy: OrchestrationPlan['executionStrategy']): number {
    const avgTaskDuration = 5; // seconds
    
    if (strategy === 'parallel') {
      return avgTaskDuration * 2; // Tasks run in parallel
    }
    if (strategy === 'sequential') {
      return tasks.length * avgTaskDuration;
    }
    
    // Hybrid/recursive
    return (tasks.length * avgTaskDuration) * 0.6; // Some parallelization
  }
  
  /**
   * Calculate total phases
   */
  private calculatePhases(tasks: AgentTask[]): number {
    // Group tasks by priority/dependencies
    const phases = new Set<number>();
    
    tasks.forEach(task => {
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
    const taskIndex = plan.tasks.findIndex(t => t.id === task.id);
    if (taskIndex === 0) return false;
    
    const prevTask = plan.tasks[taskIndex - 1];
    return prevTask.assignedTo !== task.assignedTo;
  }
  
  /**
   * Send handoff communication
   */
  private sendHandoff(task: AgentTask, plan: OrchestrationPlan, onCommunication: (comm: AgentCommunication) => void): void {
    const taskIndex = plan.tasks.findIndex(t => t.id === task.id);
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
  private sendTaskCompletion(task: AgentTask, onCommunication: (comm: AgentCommunication) => void): void {
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
  private sendCompletion(plan: OrchestrationPlan, onCommunication: (comm: AgentCommunication) => void): void {
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
  private updateAgentStatus(agentName: string, status: AgentStatus, onStatusUpdate: (status: AgentStatus) => void): void {
    this.agentStatuses.set(agentName, status);
    onStatusUpdate(status);
  }
  
  /**
   * Update plan phase
   */
  private updatePhase(plan: OrchestrationPlan): void {
    const completedTasks = plan.tasks.filter(t => t.status === 'completed').length;
    const totalTasks = plan.tasks.length;
    
    plan.currentPhase = Math.ceil((completedTasks / totalTasks) * plan.totalPhases);
  }
  
  /**
   * Simulate agent work (in production, this would call actual LLM APIs)
   */
  private async simulateAgentWork(task: AgentTask, agentName: string, onStatusUpdate: (status: AgentStatus) => void): Promise<void> {
    const steps = [30, 60, 90];
    
    for (const progress of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.updateAgentStatus(agentName, {
        agentName,
        status: 'working',
        currentTask: task.description,
        progress,
        toolsUsing: this.getAgentTools(agentName),
      }, onStatusUpdate);
    }
  }
}

// Export singleton instance
export const multiAgentOrchestrator = new MultiAgentOrchestrator();
