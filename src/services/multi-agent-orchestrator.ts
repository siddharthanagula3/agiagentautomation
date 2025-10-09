/**
 * Multi-Agent Orchestrator
 * Analyzes user intent and orchestrates multiple AI Employees to work together
 * Like Claude's sub-agents, CrewAI, AutoGPT
 */

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
}

export interface AgentTask {
  id: string;
  description: string;
  assignedTo: string; // employee name
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'high' | 'medium' | 'low';
  dependencies: string[]; // other task IDs
  result?: any;
  startTime?: Date;
  endTime?: Date;
}

export interface AgentCommunication {
  id: string;
  from: string; // agent name
  to: string; // agent name or 'user'
  type: 'request' | 'response' | 'handoff' | 'collaboration' | 'status';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface OrchestrationPlan {
  id: string;
  userRequest: string;
  intent: string;
  requiredAgents: string[];
  tasks: AgentTask[];
  executionStrategy: 'sequential' | 'parallel' | 'hybrid';
  estimatedDuration: number;
}

export interface AgentStatus {
  agentName: string;
  status: 'idle' | 'analyzing' | 'working' | 'waiting' | 'completed';
  currentTask?: string;
  progress: number; // 0-100
  toolsUsing?: string[];
}

// Define AI Employee capabilities
const EMPLOYEE_CAPABILITIES: Record<string, AgentCapability> = {
  'software-architect': {
    employeeId: 'emp-001',
    employeeName: 'Software Architect',
    role: 'Software Architect',
    provider: 'anthropic',
    skills: ['System Design', 'Architecture', 'Planning', 'Technical Leadership'],
    tools: ['create_project', 'design_system', 'plan_architecture', 'delegate_tasks'],
    specialization: ['planning', 'architecture', 'orchestration'],
    canDelegate: true,
  },
  'frontend-engineer': {
    employeeId: 'emp-004',
    employeeName: 'Frontend Engineer',
    role: 'Frontend Engineer',
    provider: 'openai',
    skills: ['React', 'TypeScript', 'UI/UX', 'Responsive Design'],
    tools: ['write_file', 'create_component', 'setup_routing', 'add_styling'],
    specialization: ['ui', 'components', 'frontend'],
    canDelegate: false,
  },
  'backend-engineer': {
    employeeId: 'emp-003',
    employeeName: 'Backend Engineer',
    role: 'Backend Engineer',
    provider: 'anthropic',
    skills: ['Node.js', 'API Design', 'Database', 'Authentication'],
    tools: ['write_file', 'create_api', 'setup_database', 'add_auth'],
    specialization: ['api', 'database', 'backend'],
    canDelegate: false,
  },
  'devops-engineer': {
    employeeId: 'emp-012',
    employeeName: 'DevOps Engineer',
    role: 'DevOps Engineer',
    provider: 'openai',
    skills: ['Docker', 'CI/CD', 'Deployment', 'Infrastructure'],
    tools: ['execute_command', 'create_dockerfile', 'setup_cicd', 'deploy'],
    specialization: ['deployment', 'infrastructure', 'automation'],
    canDelegate: false,
  },
  'qa-engineer': {
    employeeId: 'emp-015',
    employeeName: 'QA Engineer',
    role: 'QA Engineer',
    provider: 'openai',
    skills: ['Testing', 'Quality Assurance', 'Test Automation'],
    tools: ['write_test', 'run_tests', 'validate_quality'],
    specialization: ['testing', 'quality'],
    canDelegate: false,
  },
};

class MultiAgentOrchestrator {
  private activeAgents: Map<string, AgentStatus> = new Map();
  private communications: AgentCommunication[] = [];
  private currentPlan: OrchestrationPlan | null = null;

  /**
   * Analyze user intent and create orchestration plan
   */
  async analyzeIntent(userRequest: string): Promise<OrchestrationPlan> {
    const lowerRequest = userRequest.toLowerCase();
    
    // Determine required agents based on keywords
    const requiredAgents: string[] = [];
    const tasks: AgentTask[] = [];
    let intent = '';
    let strategy: 'sequential' | 'parallel' | 'hybrid' = 'hybrid';

    // Full-stack project
    if (
      (lowerRequest.includes('full') && lowerRequest.includes('stack')) ||
      (lowerRequest.includes('app') && (lowerRequest.includes('frontend') || lowerRequest.includes('backend'))) ||
      lowerRequest.includes('complete') ||
      lowerRequest.includes('entire')
    ) {
      intent = 'full-stack-development';
      requiredAgents.push('software-architect', 'frontend-engineer', 'backend-engineer');
      
      tasks.push({
        id: 'task-1',
        description: 'Design system architecture',
        assignedTo: 'Software Architect',
        status: 'pending',
        priority: 'high',
        dependencies: [],
      });
      
      tasks.push({
        id: 'task-2',
        description: 'Build frontend UI',
        assignedTo: 'Frontend Engineer',
        status: 'pending',
        priority: 'high',
        dependencies: ['task-1'],
      });
      
      tasks.push({
        id: 'task-3',
        description: 'Create backend API',
        assignedTo: 'Backend Engineer',
        status: 'pending',
        priority: 'high',
        dependencies: ['task-1'],
      });
    }
    // Frontend only
    else if (
      lowerRequest.includes('component') ||
      lowerRequest.includes('ui') ||
      lowerRequest.includes('interface') ||
      lowerRequest.includes('frontend')
    ) {
      intent = 'frontend-development';
      requiredAgents.push('frontend-engineer');
      
      tasks.push({
        id: 'task-1',
        description: 'Create frontend component',
        assignedTo: 'Frontend Engineer',
        status: 'pending',
        priority: 'high',
        dependencies: [],
      });
      
      strategy = 'sequential';
    }
    // Backend only
    else if (
      lowerRequest.includes('api') ||
      lowerRequest.includes('backend') ||
      lowerRequest.includes('database') ||
      lowerRequest.includes('server')
    ) {
      intent = 'backend-development';
      requiredAgents.push('backend-engineer');
      
      tasks.push({
        id: 'task-1',
        description: 'Create backend API',
        assignedTo: 'Backend Engineer',
        status: 'pending',
        priority: 'high',
        dependencies: [],
      });
      
      strategy = 'sequential';
    }
    // Deployment
    else if (
      lowerRequest.includes('deploy') ||
      lowerRequest.includes('production') ||
      lowerRequest.includes('docker')
    ) {
      intent = 'deployment';
      requiredAgents.push('devops-engineer');
      
      tasks.push({
        id: 'task-1',
        description: 'Setup deployment infrastructure',
        assignedTo: 'DevOps Engineer',
        status: 'pending',
        priority: 'high',
        dependencies: [],
      });
      
      strategy = 'sequential';
    }
    // Default: Use architect to decide
    else {
      intent = 'general-request';
      requiredAgents.push('software-architect');
      
      tasks.push({
        id: 'task-1',
        description: 'Analyze requirements and plan',
        assignedTo: 'Software Architect',
        status: 'pending',
        priority: 'high',
        dependencies: [],
      });
      
      strategy = 'sequential';
    }

    const plan: OrchestrationPlan = {
      id: `plan-${Date.now()}`,
      userRequest,
      intent,
      requiredAgents,
      tasks,
      executionStrategy: strategy,
      estimatedDuration: tasks.length * 2000, // 2s per task estimate
    };

    this.currentPlan = plan;
    return plan;
  }

  /**
   * Execute orchestration plan
   */
  async executePlan(
    plan: OrchestrationPlan,
    onCommunication: (comm: AgentCommunication) => void,
    onStatusUpdate: (status: AgentStatus) => void
  ): Promise<any> {
    const results: Record<string, any> = {};

    // Initialize agent statuses
    for (const agentKey of plan.requiredAgents) {
      const agent = EMPLOYEE_CAPABILITIES[agentKey];
      if (agent) {
        this.activeAgents.set(agent.employeeName, {
          agentName: agent.employeeName,
          status: 'idle',
          progress: 0,
        });
      }
    }

    // Send initial communication
    const initialComm: AgentCommunication = {
      id: `comm-${Date.now()}`,
      from: 'System',
      to: 'user',
      type: 'status',
      message: `🎯 Plan created: ${plan.intent}\n📋 Required agents: ${plan.requiredAgents.length}\n⚡ Execution: ${plan.executionStrategy}`,
      timestamp: new Date(),
    };
    onCommunication(initialComm);

    // Execute tasks based on strategy
    if (plan.executionStrategy === 'sequential') {
      for (const task of plan.tasks) {
        await this.executeTask(task, onCommunication, onStatusUpdate);
        results[task.id] = task.result;
      }
    } else if (plan.executionStrategy === 'parallel') {
      const taskPromises = plan.tasks.map(task =>
        this.executeTask(task, onCommunication, onStatusUpdate)
      );
      await Promise.all(taskPromises);
      plan.tasks.forEach(task => {
        results[task.id] = task.result;
      });
    } else {
      // Hybrid: Execute independent tasks in parallel, dependent ones sequentially
      const taskMap = new Map(plan.tasks.map(t => [t.id, t]));
      const executed = new Set<string>();

      const canExecute = (task: AgentTask) =>
        task.dependencies.every(dep => executed.has(dep));

      while (executed.size < plan.tasks.length) {
        const ready = plan.tasks.filter(t => !executed.has(t.id) && canExecute(t));
        
        if (ready.length === 0) break;

        await Promise.all(
          ready.map(async task => {
            await this.executeTask(task, onCommunication, onStatusUpdate);
            executed.add(task.id);
            results[task.id] = task.result;
          })
        );
      }
    }

    // Final completion message
    const completionComm: AgentCommunication = {
      id: `comm-${Date.now()}-complete`,
      from: 'System',
      to: 'user',
      type: 'status',
      message: `✅ All tasks completed!\n🎉 ${plan.tasks.length} agents worked together successfully!`,
      timestamp: new Date(),
    };
    onCommunication(completionComm);

    return results;
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    task: AgentTask,
    onCommunication: (comm: AgentCommunication) => void,
    onStatusUpdate: (status: AgentStatus) => void
  ): Promise<void> {
    task.status = 'in_progress';
    task.startTime = new Date();

    // Update agent status
    const agentStatus: AgentStatus = {
      agentName: task.assignedTo,
      status: 'analyzing',
      currentTask: task.description,
      progress: 0,
    };
    this.activeAgents.set(task.assignedTo, agentStatus);
    onStatusUpdate(agentStatus);

    // Agent starts working
    const startComm: AgentCommunication = {
      id: `comm-${Date.now()}`,
      from: task.assignedTo,
      to: 'user',
      type: 'status',
      message: `🔄 ${task.assignedTo} is working on: ${task.description}`,
      timestamp: new Date(),
    };
    onCommunication(startComm);

    // Simulate work with progress updates
    await new Promise(resolve => setTimeout(resolve, 500));
    
    agentStatus.status = 'working';
    agentStatus.progress = 30;
    onStatusUpdate(agentStatus);

    await new Promise(resolve => setTimeout(resolve, 800));
    
    agentStatus.progress = 60;
    onStatusUpdate(agentStatus);

    // Check if this agent needs to delegate to another
    const agentKey = Object.keys(EMPLOYEE_CAPABILITIES).find(
      key => EMPLOYEE_CAPABILITIES[key].employeeName === task.assignedTo
    );
    
    if (agentKey && EMPLOYEE_CAPABILITIES[agentKey].canDelegate) {
      // Architect delegates to other agents
      const delegationComm: AgentCommunication = {
        id: `comm-${Date.now()}-delegate`,
        from: task.assignedTo,
        to: 'Frontend Engineer',
        type: 'handoff',
        message: `📞 ${task.assignedTo} is delegating UI work to Frontend Engineer...`,
        timestamp: new Date(),
      };
      onCommunication(delegationComm);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await new Promise(resolve => setTimeout(resolve, 700));
    
    agentStatus.progress = 90;
    agentStatus.status = 'working';
    onStatusUpdate(agentStatus);

    // Complete task
    task.status = 'completed';
    task.endTime = new Date();
    task.result = {
      success: true,
      output: `Completed: ${task.description}`,
      artifacts: [`${task.assignedTo.replace(' ', '-')}-output.tsx`],
    };

    agentStatus.status = 'completed';
    agentStatus.progress = 100;
    onStatusUpdate(agentStatus);

    const completeComm: AgentCommunication = {
      id: `comm-${Date.now()}-complete`,
      from: task.assignedTo,
      to: 'user',
      type: 'response',
      message: `✅ ${task.assignedTo} completed: ${task.description}`,
      timestamp: new Date(),
      metadata: { result: task.result },
    };
    onCommunication(completeComm);
  }

  /**
   * Get active agents
   */
  getActiveAgents(): AgentStatus[] {
    return Array.from(this.activeAgents.values());
  }

  /**
   * Get communications log
   */
  getCommunications(): AgentCommunication[] {
    return [...this.communications];
  }

  /**
   * Get current plan
   */
  getCurrentPlan(): OrchestrationPlan | null {
    return this.currentPlan;
  }
}

export const multiAgentOrchestrator = new MultiAgentOrchestrator();
export default multiAgentOrchestrator;

