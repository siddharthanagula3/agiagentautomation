/**
 * Company Hub Orchestrator
 * Coordinates multiple AI employees in parallel for complex tasks
 * Handles skill analysis, employee selection, and upselling
 */

import {
  multiAgentOrchestrator,
  type AgentTask,
  type AgentCommunication,
  type AgentStatus,
} from './multi-agent-orchestrator';
import { AI_EMPLOYEES } from '@/data/marketplace-employees';
import { listPurchasedEmployees } from '@features/workforce/services/supabase-employees';
import { tokenLogger } from '@_core/api/token-logger';
import type {
  AgentAssignment,
  UpsellRequest,
  HubMessage,
} from '@shared/stores/company-hub-store';

export interface CompanyHubExecutionOptions {
  userId: string;
  sessionId: string;
  taskDescription: string;
  onStatusUpdate: (agentId: string, status: AgentStatus) => void;
  onMessage: (message: Omit<HubMessage, 'id' | 'timestamp'>) => void;
  onUpsellRequest: (
    request: Omit<UpsellRequest, 'id' | 'timestamp' | 'isResolved'>
  ) => Promise<boolean>;
  onTokenUpdate: (
    model: string,
    tokens: number,
    cost: number,
    provider: string
  ) => void;
}

export interface RequiredSkill {
  skill: string;
  employeeRole: string;
  employeeId?: string;
  isAvailable: boolean;
  reason: string;
}

export interface ExecutionPlan {
  taskDescription: string;
  requiredSkills: RequiredSkill[];
  assignedEmployees: AgentAssignment[];
  estimatedDuration: number;
  estimatedCost: number;
}

class CompanyHubOrchestrator {
  /**
   * Analyze task and determine required skills
   */
  async analyzeRequiredSkills(
    taskDescription: string
  ): Promise<RequiredSkill[]> {
    const lowerTask = taskDescription.toLowerCase();
    const requiredSkills: RequiredSkill[] = [];

    // Frontend development
    if (
      lowerTask.includes('ui') ||
      lowerTask.includes('frontend') ||
      lowerTask.includes('react') ||
      lowerTask.includes('interface') ||
      lowerTask.includes('page') ||
      lowerTask.includes('component')
    ) {
      requiredSkills.push({
        skill: 'Frontend Development',
        employeeRole: 'Frontend Engineer',
        employeeId: 'employee-frontend',
        isAvailable: false,
        reason: 'Required for building user interface components',
      });
    }

    // Backend development
    if (
      lowerTask.includes('api') ||
      lowerTask.includes('backend') ||
      lowerTask.includes('server') ||
      lowerTask.includes('database') ||
      lowerTask.includes('endpoint')
    ) {
      requiredSkills.push({
        skill: 'Backend Development',
        employeeRole: 'Backend Engineer',
        employeeId: 'employee-backend',
        isAvailable: false,
        reason: 'Required for creating API endpoints and business logic',
      });
    }

    // Design
    if (
      lowerTask.includes('design') ||
      lowerTask.includes('layout') ||
      lowerTask.includes('ux') ||
      lowerTask.includes('mockup')
    ) {
      requiredSkills.push({
        skill: 'UI/UX Design',
        employeeRole: 'UI/UX Designer',
        employeeId: 'employee-uiux',
        isAvailable: false,
        reason: 'Required for creating user-friendly designs',
      });
    }

    // Data analysis
    if (
      lowerTask.includes('data') ||
      lowerTask.includes('analytics') ||
      lowerTask.includes('ml') ||
      lowerTask.includes('analysis')
    ) {
      requiredSkills.push({
        skill: 'Data Analysis',
        employeeRole: 'Data Scientist',
        employeeId: 'employee-datascientist',
        isAvailable: false,
        reason: 'Required for data analysis and insights',
      });
    }

    // Testing
    if (
      lowerTask.includes('test') ||
      lowerTask.includes('qa') ||
      lowerTask.includes('quality')
    ) {
      requiredSkills.push({
        skill: 'Testing & QA',
        employeeRole: 'QA Engineer',
        employeeId: 'employee-qa',
        isAvailable: false,
        reason: 'Required for testing and quality assurance',
      });
    }

    // DevOps/Deployment
    if (
      lowerTask.includes('deploy') ||
      lowerTask.includes('docker') ||
      lowerTask.includes('kubernetes') ||
      lowerTask.includes('ci/cd')
    ) {
      requiredSkills.push({
        skill: 'DevOps',
        employeeRole: 'DevOps Engineer',
        employeeId: 'employee-devops',
        isAvailable: false,
        reason: 'Required for deployment and infrastructure',
      });
    }

    // Always add Software Architect for complex tasks
    if (requiredSkills.length > 1) {
      requiredSkills.unshift({
        skill: 'Software Architecture',
        employeeRole: 'Software Architect',
        employeeId: 'employee-architect',
        isAvailable: false,
        reason: 'Required for overall system architecture and planning',
      });
    }

    // Default: Full-Stack Engineer if nothing specific
    if (requiredSkills.length === 0) {
      requiredSkills.push({
        skill: 'Full-Stack Development',
        employeeRole: 'Full-Stack Engineer',
        employeeId: 'employee-fullstack',
        isAvailable: false,
        reason: 'Required for general development tasks',
      });
    }

    return requiredSkills;
  }

  /**
   * Check user's hired employees against required skills
   */
  async checkAvailability(
    userId: string,
    requiredSkills: RequiredSkill[]
  ): Promise<{ available: RequiredSkill[]; missing: RequiredSkill[] }> {
    const purchasedEmployees = await listPurchasedEmployees(userId);
    const purchasedIds = new Set(purchasedEmployees.map((e) => e.employee_id));

    const available: RequiredSkill[] = [];
    const missing: RequiredSkill[] = [];

    for (const skill of requiredSkills) {
      if (skill.employeeId && purchasedIds.has(skill.employeeId)) {
        skill.isAvailable = true;
        available.push(skill);
      } else {
        skill.isAvailable = false;
        missing.push(skill);
      }
    }

    return { available, missing };
  }

  /**
   * Create execution plan with employee assignments
   */
  async createExecutionPlan(
    userId: string,
    taskDescription: string
  ): Promise<ExecutionPlan> {
    // Analyze required skills
    const requiredSkills = await this.analyzeRequiredSkills(taskDescription);

    // Check availability
    const { available, missing } = await this.checkAvailability(
      userId,
      requiredSkills
    );

    // Create agent assignments for available employees
    const assignedEmployees: AgentAssignment[] = available.map((skill) => {
      const employee = AI_EMPLOYEES.find((e) => e.id === skill.employeeId);
      return {
        agentId: skill.employeeId || crypto.randomUUID(),
        agentName: skill.employeeRole,
        role: skill.employeeRole,
        provider: employee?.provider || 'claude',
        status: 'idle',
        progress: 0,
      };
    });

    return {
      taskDescription,
      requiredSkills: [...available, ...missing],
      assignedEmployees,
      estimatedDuration: requiredSkills.length * 30, // 30 seconds per skill
      estimatedCost: requiredSkills.length * 0.05, // Rough estimate
    };
  }

  /**
   * Execute the company hub workflow
   */
  async execute(options: CompanyHubExecutionOptions): Promise<void> {
    const {
      userId,
      sessionId,
      taskDescription,
      onStatusUpdate,
      onMessage,
      onUpsellRequest,
      onTokenUpdate,
    } = options;

    try {
      // Step 1: Create execution plan
      onMessage({
        sessionId,
        from: 'system',
        type: 'system',
        content:
          '🔍 Analyzing your request and determining required AI employees...',
      });

      const plan = await this.createExecutionPlan(userId, taskDescription);

      // Step 2: Check for missing employees
      const missingSkills = plan.requiredSkills.filter((s) => !s.isAvailable);
      if (missingSkills.length > 0) {
        for (const skill of missingSkills) {
          const employee = AI_EMPLOYEES.find((e) => e.id === skill.employeeId);
          if (!employee) continue;

          onMessage({
            sessionId,
            from: 'system',
            type: 'upsell',
            content: `⚠️ To complete this task, the **${skill.employeeRole}** is required but not hired.`,
            metadata: { agentId: skill.employeeId },
          });

          // Request upsell
          const approved = await onUpsellRequest({
            requiredEmployeeId: skill.employeeId || '',
            requiredEmployeeName: employee.name,
            requiredEmployeeRole: skill.employeeRole,
            provider: employee.provider,
            price: 0, // Free in this version
            reason: skill.reason,
            taskDescription,
          });

          if (!approved) {
            onMessage({
              sessionId,
              from: 'system',
              type: 'system',
              content: `⏭️ Skipping ${skill.employeeRole}. Continuing with available employees...`,
            });
          } else {
            onMessage({
              sessionId,
              from: 'system',
              type: 'system',
              content: `✅ ${skill.employeeRole} hired! Adding to the team...`,
            });

            // Add to assigned employees
            plan.assignedEmployees.push({
              agentId: skill.employeeId || crypto.randomUUID(),
              agentName: skill.employeeRole,
              role: skill.employeeRole,
              provider: employee.provider,
              status: 'idle',
              progress: 0,
            });
          }
        }
      }

      // Step 3: Start orchestration
      onMessage({
        sessionId,
        from: 'system',
        type: 'system',
        content: `🚀 Starting collaborative work with ${plan.assignedEmployees.length} AI employees...`,
      });

      // Analyze user intent and create orchestration plan
      const orchestrationPlan =
        await multiAgentOrchestrator.analyzeIntent(taskDescription);

      // Execute with multi-agent orchestrator
      await multiAgentOrchestrator.executePlan(
        orchestrationPlan,
        (comm: AgentCommunication) => {
          // Forward communications as messages
          onMessage({
            sessionId,
            from: comm.from,
            to: comm.to,
            type:
              comm.type === 'handoff'
                ? 'handoff'
                : comm.type === 'completion'
                  ? 'completion'
                  : comm.type === 'error'
                    ? 'error'
                    : 'agent',
            content: comm.message,
            metadata: comm.metadata,
          });
        },
        (status: AgentStatus) => {
          // Forward status updates
          onStatusUpdate(status.agentName, status);

          // Log tokens if present
          if (status.output && typeof status.output === 'object') {
            const output = status.output as {
              usage?: {
                totalTokens?: number;
                model?: string;
                provider?: string;
                cost?: number;
              };
            };
            if (output.usage) {
              const tokens = output.usage.totalTokens || 0;
              const model = output.usage.model || 'unknown';
              const provider = output.usage.provider || 'openai';
              const cost = output.usage.cost || 0;

              // Log to token logger
              tokenLogger.logTokenUsage(
                model,
                tokens,
                userId,
                sessionId,
                status.agentName,
                status.agentName,
                undefined,
                undefined,
                status.currentTask
              );

              // Update UI
              onTokenUpdate(model, tokens, cost, provider);
            }
          }
        }
      );

      // Step 4: Completion
      onMessage({
        sessionId,
        from: 'system',
        type: 'completion',
        content:
          '🎉 All tasks completed successfully! Your collaborative workspace has finished the work.',
      });
    } catch (error) {
      console.error('[CompanyHubOrchestrator] Execution error:', error);
      onMessage({
        sessionId,
        from: 'system',
        type: 'error',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  }

  /**
   * Create a simple mock execution for testing
   */
  async mockExecute(options: CompanyHubExecutionOptions): Promise<void> {
    const {
      sessionId,
      taskDescription,
      onStatusUpdate,
      onMessage,
      onTokenUpdate,
    } = options;

    // Simulate analysis
    onMessage({
      sessionId,
      from: 'system',
      type: 'system',
      content: '🔍 Analyzing your request...',
    });

    await this.delay(1000);

    // Simulate employee assignments
    const mockEmployees = [
      {
        id: 'frontend',
        name: 'Frontend Engineer',
        role: 'Frontend Engineer',
        provider: 'claude',
      },
      {
        id: 'backend',
        name: 'Backend Engineer',
        role: 'Backend Engineer',
        provider: 'chatgpt',
      },
    ];

    for (const emp of mockEmployees) {
      onMessage({
        sessionId,
        from: 'system',
        type: 'system',
        content: `👷 Assigning ${emp.name}...`,
      });

      await this.delay(500);

      // Simulate work
      onStatusUpdate(emp.id, {
        agentName: emp.name,
        status: 'working',
        currentTask: `Working on ${taskDescription}`,
        progress: 0,
      });

      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        await this.delay(800);
        onStatusUpdate(emp.id, {
          agentName: emp.name,
          status: 'working',
          currentTask: `Working on ${taskDescription}`,
          progress: i,
        });

        // Simulate token usage
        onTokenUpdate(
          emp.provider === 'claude'
            ? 'claude-3-5-sonnet-20241022'
            : 'gpt-4o-mini',
          150,
          0.002,
          emp.provider
        );
      }

      onStatusUpdate(emp.id, {
        agentName: emp.name,
        status: 'completed',
        currentTask: `Completed ${taskDescription}`,
        progress: 100,
      });

      onMessage({
        sessionId,
        from: emp.name,
        type: 'completion',
        content: `✅ ${emp.name} completed their tasks!`,
      });
    }

    // Final message
    onMessage({
      sessionId,
      from: 'system',
      type: 'completion',
      content: '🎉 All employees have completed their work!',
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const companyHubOrchestrator = new CompanyHubOrchestrator();
