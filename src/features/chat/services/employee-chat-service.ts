/**
 * Employee Chat Service
 * Integrates chat interface with workforce orchestrator for dynamic employee selection
 * Implements MGX.dev multi-agent protocol for conversational AI
 * Supports multi-agent collaboration with supervisor pattern for complex tasks
 */

import { workforceOrchestratorRefactored } from '@core/ai/orchestration/workforce-orchestrator';
import { systemPromptsService } from '@core/ai/employees/prompt-management';
import { multiAgentCollaborationService } from './multi-agent-collaboration-service';
import { sequentialWorkflowOrchestrator } from '@core/ai/orchestration/sequential-workflow-orchestrator';
import { employeeMemoryService } from '@core/ai/employees/employee-memory-service';
import {
  consultingOrchestrator,
  type ConsultingDomain,
  type ConsultationResult,
} from '@core/ai/orchestration/consulting-orchestrator';
import { ExpertiseTaxonomy } from '@core/ai/orchestration/intelligent-agent-router';
import type { AIEmployee } from '@core/types/ai-employee';
import { useMissionStore } from '@shared/stores/mission-control-store';

// Employee expertise mapping - maps employee names to their expertise areas
const EmployeeExpertiseMap: Record<string, string[]> = {
  'backend-engineer': ['software', 'database', 'api'],
  'frontend-engineer': ['software', 'web_development', 'ui_ux'],
  'code-reviewer': ['software', 'security'],
  'financial-advisor': ['finance', 'tax', 'investment'],
  'health-consultant': ['health', 'fitness', 'nutrition'],
  'mental-health-counselor': ['mental_health', 'relationships'],
  'legal-advisor': ['law', 'business'],
  'marketing-strategist': ['marketing', 'social_media', 'business'],
  'data-analyst': ['data_science', 'business'],
  'ui-designer': ['ui_ux', 'web_development'],
  'devops-engineer': ['software', 'cloud', 'security'],
  'product-manager': ['business', 'software'],
  'content-writer': ['writing', 'marketing'],
  'seo-specialist': ['marketing', 'web_development'],
  'career-coach': ['career', 'education'],
  'fitness-trainer': ['fitness', 'health', 'nutrition'],
  'chef-consultant': ['cooking', 'nutrition'],
  'travel-advisor': ['travel'],
  'real-estate-advisor': ['real_estate', 'finance'],
  'education-tutor': ['education'],
  'cybersecurity-expert': ['security', 'software'],
};

export interface EmployeeChatMessage {
  role: 'user' | 'assistant' | 'collaboration';
  content: string;
  employeeName?: string;
  employeeAvatar?: string;
  to?: string; // For collaboration messages
  messageType?: 'contribution' | 'discussion' | 'synthesis';
  metadata?: {
    selectedEmployee?: string;
    selectionReason?: string;
    thinkingSteps?: string[];
    toolsUsed?: string[];
    model?: string;
    tokensUsed?: number;
    isMultiAgent?: boolean;
    employeesInvolved?: string[];
  };
}

export interface EmployeeSelectionResult {
  employee: AIEmployee;
  reason: string;
  confidence: number;
}

export class EmployeeChatService {
  private employees: AIEmployee[] = [];
  private employeesLoaded = false;

  /**
   * Initialize service and load employees
   */
  async initialize(): Promise<void> {
    if (this.employeesLoaded) return;

    this.employees = await systemPromptsService.getAvailableEmployees();
    this.employeesLoaded = true;

    console.log(
      `[EmployeeChatService] Loaded ${this.employees.length} employees`
    );
  }

  /**
   * Send a message with dynamic employee selection
   * Automatically detects complexity and routes to multi-agent collaboration if needed
   * Supports different modes: team, engineer, research, race, solo, workflow, direct
   */
  async sendMessage(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    options?: {
      userId?: string;
      sessionId?: string;
      mode?:
        | 'team'
        | 'engineer'
        | 'research'
        | 'race'
        | 'solo'
        | 'workflow'
        | 'direct'
        | 'consulting';
      targetEmployee?: string; // For direct mode - chat with specific employee
      workflowId?: string; // For workflow mode - use specific workflow
      workflowEmployees?: string[]; // For workflow mode - custom employee sequence
      // Consulting mode options (MGX/MetaGPT/CrewAI patterns)
      consultingDomain?: ConsultingDomain; // Domain for consulting (health, finance, legal, etc.)
      consultingWorkflowId?: string; // Specific consulting workflow to use
      executionMode?: 'sequential' | 'parallel' | 'hierarchical' | 'race'; // How to run consultants
    }
  ): Promise<{
    response: string;
    selectedEmployee?: AIEmployee;
    selectionReason: string;
    thinkingSteps: string[];
    collaborationMessages?: EmployeeChatMessage[];
    metadata: {
      model: string;
      tokensUsed?: number;
      isMultiAgent?: boolean;
      employeesInvolved?: string[];
      workflowId?: string;
    };
  }> {
    // Ensure employees are loaded
    await this.initialize();

    if (this.employees.length === 0) {
      throw new Error(
        'No AI employees available. Please check .agi/employees/ directory.'
      );
    }

    const store = useMissionStore.getState();
    const mode = options?.mode || 'team';

    // STEP 1: Mode-specific routing
    // 'direct' mode - chat with specific employee (sub-agent with memory)
    // 'workflow' mode - sequential workflow (Trainer → Dietitian → Chef)
    // 'solo' mode - always single employee, skip complexity analysis
    // 'race' mode - multiple employees work independently (future)
    // 'team' mode - multi-agent collaboration for complex tasks
    // 'engineer' / 'research' - filter to specialized employees

    // DIRECT MODE: Chat directly with a specific employee (sub-agent)
    if (mode === 'direct' && options?.targetEmployee) {
      store.addMessage({
        from: 'system',
        type: 'status',
        content: `💬 Connecting to ${options.targetEmployee}...`,
      });

      return await this.handleDirectEmployeeChat(
        userMessage,
        options.targetEmployee,
        options.sessionId || crypto.randomUUID(),
        options.userId || 'anonymous'
      );
    }

    // WORKFLOW MODE: Sequential employee workflow with handoffs
    if (mode === 'workflow') {
      store.addMessage({
        from: 'system',
        type: 'status',
        content: '🔄 Starting sequential workflow...',
      });

      return await this.handleWorkflowTask(
        userMessage,
        options.sessionId || crypto.randomUUID(),
        options.userId || 'anonymous',
        options.workflowId,
        options.workflowEmployees
      );
    }

    // CONSULTING MODE: MGX/MetaGPT/CrewAI-style domain consulting
    // Uses specialized consultant agents with roles, goals, backstories
    // Supports sequential, parallel, hierarchical, and race execution modes
    if (mode === 'consulting') {
      store.addMessage({
        from: 'system',
        type: 'status',
        content: '🎯 Starting consulting session...',
      });

      return await this.handleConsultingTask(
        userMessage,
        options.sessionId || crypto.randomUUID(),
        options.userId || 'anonymous',
        options.consultingDomain,
        options.consultingWorkflowId,
        options.executionMode
      );
    }

    if (mode === 'solo') {
      // Solo mode: Single employee, no multi-agent
      store.addMessage({
        from: 'system',
        type: 'status',
        content: '🎯 Solo mode - selecting best employee...',
      });

      return await this.handleSimpleTask(
        userMessage,
        conversationHistory,
        'solo mode',
        mode,
        options?.userId
      );
    }

    // STEP 2: Analyze task complexity (for team/race modes)
    store.addMessage({
      from: 'system',
      type: 'status',
      content: '🔍 Analyzing task complexity...',
    });

    const complexity =
      await multiAgentCollaborationService.analyzeComplexity(userMessage);

    // Auto-detect workflow triggers
    const detectedWorkflow =
      sequentialWorkflowOrchestrator.detectWorkflow(userMessage);
    if (detectedWorkflow && mode === 'team') {
      store.addMessage({
        from: 'system',
        type: 'status',
        content: `🔍 Detected "${detectedWorkflow.name}" workflow - switching to sequential mode...`,
      });

      return await this.handleWorkflowTask(
        userMessage,
        options?.sessionId || crypto.randomUUID(),
        options?.userId || 'anonymous',
        detectedWorkflow.id
      );
    }

    // STEP 3: Route based on complexity and mode
    if (complexity.isComplex && mode === 'team') {
      // COMPLEX TASK + TEAM MODE: Multi-agent collaboration
      return await this.handleComplexTask(
        userMessage,
        conversationHistory,
        complexity.reason
      );
    } else {
      // SIMPLE TASK or non-team mode: Single employee
      return await this.handleSimpleTask(
        userMessage,
        conversationHistory,
        complexity.reason,
        mode,
        options?.userId
      );
    }
  }

  /**
   * Handle simple tasks with single employee
   */
  private async handleSimpleTask(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    complexityReason: string,
    mode?: string,
    userId?: string
  ): Promise<{
    response: string;
    selectedEmployee: AIEmployee;
    selectionReason: string;
    thinkingSteps: string[];
    metadata: {
      model: string;
      tokensUsed?: number;
      isMultiAgent: boolean;
    };
  }> {
    const store = useMissionStore.getState();

    // Show task handling status
    const modeLabel = mode ? ` (${mode} mode)` : '';
    store.addMessage({
      from: 'system',
      type: 'status',
      content: `✓ Selecting optimal employee${modeLabel}...`,
    });

    const selection = await this.selectEmployeeForMessage(
      userMessage,
      conversationHistory,
      mode
    );

    // Show employee selection
    store.addMessage({
      from: 'system',
      type: 'status',
      content: `✓ Selected **${selection.employee.name}** (${selection.reason})`,
      metadata: {
        employeeName: selection.employee.name,
      },
    });

    // Update employee status to thinking
    store.updateEmployeeStatus(
      selection.employee.name,
      'thinking',
      null,
      'Processing your message'
    );

    const thinkingSteps: string[] = [];

    try {
      thinkingSteps.push(
        `Analyzing query with ${selection.employee.description}`
      );

      // Build memory context if userId is available
      let enhancedHistory = conversationHistory;
      if (userId) {
        try {
          const memoryContext = await employeeMemoryService.buildMemoryContext(
            userId,
            selection.employee.name
          );
          if (memoryContext) {
            // Prepend memory context as a system message
            enhancedHistory = [
              {
                role: 'system',
                content: `## Previous Context:\n${memoryContext}`,
              },
              ...conversationHistory,
            ];
            thinkingSteps.push(
              'Loaded memory context from previous interactions'
            );
          }
        } catch (error) {
          console.warn('[EmployeeChat] Failed to load memory context:', error);
        }
      }

      const response =
        await workforceOrchestratorRefactored.routeMessageToEmployee(
          selection.employee.name,
          userMessage,
          enhancedHistory
        );

      store.updateEmployeeStatus(selection.employee.name, 'idle');

      // Save interaction to memory if userId is available
      if (userId) {
        try {
          await employeeMemoryService.addInteraction(
            userId,
            selection.employee.name,
            {
              userMessage,
              employeeResponse: response,
              timestamp: new Date(),
            }
          );
          thinkingSteps.push('Saved interaction to memory');
        } catch (error) {
          console.warn('[EmployeeChat] Failed to save memory:', error);
        }
      }

      thinkingSteps.push('Response generated successfully');

      return {
        response,
        selectedEmployee: selection.employee,
        selectionReason: selection.reason,
        thinkingSteps,
        metadata: {
          model:
            selection.employee.model === 'inherit'
              ? 'claude-3-5-sonnet-20241022'
              : selection.employee.model,
          isMultiAgent: false,
        },
      };
    } catch (error) {
      store.updateEmployeeStatus(selection.employee.name, 'error');
      throw error;
    }
  }

  /**
   * Handle complex tasks with multi-agent collaboration
   */
  private async handleComplexTask(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    complexityReason: string
  ): Promise<{
    response: string;
    selectionReason: string;
    thinkingSteps: string[];
    collaborationMessages: EmployeeChatMessage[];
    metadata: {
      model: string;
      tokensUsed: number;
      isMultiAgent: boolean;
      employeesInvolved: string[];
    };
  }> {
    const store = useMissionStore.getState();

    // Show that multi-agent collaboration is starting
    store.addMessage({
      from: 'system',
      type: 'status',
      content: `🤝 **Complex task detected!** Initiating multi-agent collaboration...`,
    });

    store.addMessage({
      from: 'system',
      type: 'status',
      content: `💡 ${complexityReason}`,
    });

    const thinkingSteps: string[] = [
      'Complex task detected',
      'Analyzing required expertise',
      'Selecting optimal team of AI employees',
    ];

    try {
      // Run multi-agent collaboration
      const collaboration = await multiAgentCollaborationService.collaborate(
        userMessage,
        conversationHistory
      );

      // Show assigned team
      const employeeNames = collaboration.employeesInvolved
        .map((e) => e.name)
        .join(', ');
      store.addMessage({
        from: 'system',
        type: 'status',
        content: `👥 **Team assembled:** ${employeeNames}`,
      });

      // Update all employee statuses
      collaboration.employeesInvolved.forEach((emp) => {
        store.updateEmployeeStatus(
          emp.name,
          'thinking',
          null,
          'Contributing expertise'
        );
      });

      thinkingSteps.push(`Team assembled: ${employeeNames}`);
      thinkingSteps.push('Employees collaborating...');

      // Convert collaboration messages to chat messages
      const collaborationMessages: EmployeeChatMessage[] =
        collaboration.collaborationMessages.map((msg) => ({
          role: 'collaboration' as const,
          content: msg.content,
          employeeName: msg.from,
          employeeAvatar: msg.fromAvatar,
          to: msg.to,
          messageType: msg.type,
          metadata: {
            isMultiAgent: true,
          },
        }));

      // Show collaboration messages in the UI
      collaboration.collaborationMessages.forEach((msg) => {
        const label =
          msg.type === 'synthesis'
            ? '📋 **Supervisor Synthesis**'
            : msg.to
              ? `💬 ${msg.from} → ${msg.to}`
              : `💭 ${msg.from}`;

        store.addMessage({
          from: msg.from,
          type: msg.type === 'synthesis' ? 'system' : 'employee',
          content: `${label}\n\n${msg.content}`,
          metadata: {
            employeeName: msg.from,
            collaborationType: msg.type,
            isCollaboration: true,
          },
        });
      });

      // Update all employees to idle
      collaboration.employeesInvolved.forEach((emp) => {
        store.updateEmployeeStatus(emp.name, 'idle');
      });

      thinkingSteps.push('Supervisor synthesized final answer');
      thinkingSteps.push('Collaboration completed successfully');

      return {
        response: collaboration.finalAnswer,
        selectionReason: complexityReason,
        thinkingSteps,
        collaborationMessages,
        metadata: {
          model: 'claude-3-5-sonnet-20241022', // Collaboration uses Claude
          tokensUsed: collaboration.metadata.totalTokens,
          isMultiAgent: true,
          employeesInvolved: collaboration.employeesInvolved.map((e) => e.name),
        },
      };
    } catch (error) {
      console.error('Multi-agent collaboration error:', error);

      // Fallback to single employee on error
      store.addMessage({
        from: 'system',
        type: 'error',
        content: '⚠️ Collaboration failed. Falling back to single employee...',
      });

      return await this.handleSimpleTask(
        userMessage,
        conversationHistory,
        'Fallback to single employee'
      );
    }
  }

  /**
   * Handle direct chat with a specific employee (sub-agent mode)
   * Each employee maintains their own context window and memory about the user
   */
  private async handleDirectEmployeeChat(
    userMessage: string,
    employeeName: string,
    sessionId: string,
    userId: string
  ): Promise<{
    response: string;
    selectedEmployee: AIEmployee;
    selectionReason: string;
    thinkingSteps: string[];
    metadata: {
      model: string;
      tokensUsed?: number;
      isMultiAgent: boolean;
    };
  }> {
    const store = useMissionStore.getState();

    const employee = this.employees.find(
      (e) => e.name.toLowerCase() === employeeName.toLowerCase()
    );

    if (!employee) {
      throw new Error(`Employee ${employeeName} not found`);
    }

    const thinkingSteps: string[] = [
      `Connecting to ${employee.name}`,
      'Loading conversation context and memory',
    ];

    store.updateEmployeeStatus(
      employee.name,
      'thinking',
      null,
      'Processing your message'
    );

    try {
      // Use sequential workflow orchestrator for direct chat
      // This gives the employee their own context window and memory
      const response = await sequentialWorkflowOrchestrator.chatWithEmployee(
        employee.name,
        userMessage,
        sessionId,
        userId
      );

      store.updateEmployeeStatus(employee.name, 'idle');
      thinkingSteps.push('Response generated with memory context');

      // Get context stats for metadata
      const contextStats =
        sequentialWorkflowOrchestrator.getEmployeeContextStats(
          sessionId,
          employee.name
        );

      store.addMessage({
        from: employee.name,
        type: 'employee',
        content: response,
        metadata: {
          employeeName: employee.name,
          contextTokens: contextStats.totalTokens,
          isDirectChat: true,
        },
      });

      return {
        response,
        selectedEmployee: employee,
        selectionReason: 'Direct employee chat (sub-agent mode)',
        thinkingSteps,
        metadata: {
          model:
            employee.model === 'inherit'
              ? 'claude-3-5-sonnet-20241022'
              : employee.model,
          tokensUsed: contextStats.totalTokens,
          isMultiAgent: false,
        },
      };
    } catch (error) {
      store.updateEmployeeStatus(employee.name, 'error');
      throw error;
    }
  }

  /**
   * Handle sequential workflow tasks
   * Executes employees in sequence with handoffs (Trainer → Dietitian → Chef)
   */
  private async handleWorkflowTask(
    userMessage: string,
    sessionId: string,
    userId: string,
    workflowId?: string,
    customEmployees?: string[]
  ): Promise<{
    response: string;
    selectionReason: string;
    thinkingSteps: string[];
    collaborationMessages: EmployeeChatMessage[];
    metadata: {
      model: string;
      tokensUsed: number;
      isMultiAgent: boolean;
      employeesInvolved: string[];
      workflowId: string;
    };
  }> {
    const store = useMissionStore.getState();

    const thinkingSteps: string[] = [
      'Initializing sequential workflow',
      'Setting up employee context windows',
    ];

    try {
      // Start the sequential workflow
      const workflowResult = await sequentialWorkflowOrchestrator.startWorkflow(
        {
          userId,
          sessionId,
          input: userMessage,
          workflowId,
          employees: customEmployees,
        }
      );

      if (!workflowResult.success) {
        throw new Error(workflowResult.error || 'Workflow execution failed');
      }

      // Get execution details
      const execution = sequentialWorkflowOrchestrator.getExecution(
        workflowResult.executionId
      );

      if (!execution) {
        throw new Error('Workflow execution not found');
      }

      // Build collaboration messages from workflow steps
      const collaborationMessages: EmployeeChatMessage[] = execution.steps
        .filter((step) => step.status === 'completed' && step.output)
        .map((step) => ({
          role: 'collaboration' as const,
          content: step.output!,
          employeeName: step.employeeName,
          messageType: 'contribution' as const,
          metadata: {
            isMultiAgent: true,
            stepIndex: step.stepIndex,
          },
        }));

      // Calculate total tokens
      const totalTokens = execution.steps.reduce(
        (sum, step) => sum + (step.tokensUsed || 0),
        0
      );

      // Get involved employees
      const employeesInvolved = execution.steps
        .filter((step) => step.status === 'completed')
        .map((step) => step.employeeName);

      thinkingSteps.push(
        `Workflow completed: ${employeesInvolved.join(' → ')}`
      );

      return {
        response:
          workflowResult.finalResult ||
          execution.finalResult ||
          'Workflow completed',
        selectionReason: `Sequential workflow: ${employeesInvolved.join(' → ')}`,
        thinkingSteps,
        collaborationMessages,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          tokensUsed: totalTokens,
          isMultiAgent: true,
          employeesInvolved,
          workflowId: execution.workflowId,
        },
      };
    } catch (error) {
      console.error('Workflow execution error:', error);

      store.addMessage({
        from: 'system',
        type: 'error',
        content: `⚠️ Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      throw error;
    }
  }

  /**
   * Handle consulting tasks using MGX/MetaGPT/CrewAI patterns
   * Routes to specialized consultant agents based on domain
   * Supports multiple execution modes: sequential, parallel, hierarchical, race
   */
  private async handleConsultingTask(
    userMessage: string,
    sessionId: string,
    userId: string,
    domain?: ConsultingDomain,
    workflowId?: string,
    executionMode?: 'sequential' | 'parallel' | 'hierarchical' | 'race'
  ): Promise<{
    response: string;
    selectionReason: string;
    thinkingSteps: string[];
    collaborationMessages: EmployeeChatMessage[];
    metadata: {
      model: string;
      tokensUsed: number;
      isMultiAgent: boolean;
      employeesInvolved: string[];
      workflowId?: string;
      consultingDomain?: string;
      executionMode?: string;
    };
  }> {
    const store = useMissionStore.getState();

    const thinkingSteps: string[] = [
      'Initializing consulting session',
      'Analyzing request for domain expertise',
    ];

    try {
      // Start consulting session - use correct ConsultationRequest interface
      const consultationResult = await consultingOrchestrator.startConsultation(
        {
          userId,
          sessionId,
          query: userMessage, // ConsultationRequest uses 'query' not 'input'
          domain,
          workflowId,
          mode: executionMode,
        }
      );

      if (!consultationResult.success) {
        throw new Error(consultationResult.error || 'Consultation failed');
      }

      // Show domain info
      store.addMessage({
        from: 'system',
        type: 'status',
        content: `🎯 Domain: **${consultationResult.domain}**`,
      });
      thinkingSteps.push(`Detected domain: ${consultationResult.domain}`);

      // Show agents involved
      const agentNames = consultationResult.metadata.agentsUsed.join(', ');
      store.addMessage({
        from: 'system',
        type: 'status',
        content: `👥 Consultants: **${agentNames}**`,
      });
      thinkingSteps.push(`Engaged consultants: ${agentNames}`);

      // Update employee statuses for involved agents
      consultationResult.metadata.agentsUsed.forEach((agentId) => {
        store.updateEmployeeStatus(
          agentId,
          'thinking',
          null,
          'Providing expertise'
        );
      });

      // Build collaboration messages from contributions
      const collaborationMessages: EmployeeChatMessage[] =
        consultationResult.contributions.map((contrib, index) => {
          // Show each agent's contribution in the UI
          store.addMessage({
            from: contrib.agentId,
            type: 'employee',
            content: `**${contrib.role}** (${consultationResult.mode}):\n\n${contrib.output}`,
            metadata: {
              employeeName: contrib.agentId,
              consultingRole: contrib.role,
              tokensUsed: contrib.tokensUsed,
              isConsulting: true,
            },
          });

          return {
            role: 'collaboration' as const,
            content: contrib.output,
            employeeName: contrib.agentId,
            messageType: 'contribution' as const,
            metadata: {
              isMultiAgent: true,
              consultingRole: contrib.role,
              executionOrder: index,
            },
          };
        });

      // Show final structured result
      const structuredResult = consultationResult.result;
      store.addMessage({
        from: 'supervisor',
        type: 'system',
        content: `📋 **Consulting Summary**\n\n${structuredResult.summary}\n\n**Recommendations:**\n${structuredResult.recommendations.map((r) => `- [${r.priority}] ${r.title}: ${r.description}`).join('\n')}\n\n**Action Items:**\n${structuredResult.actionItems.map((a) => `- ${a.title}: ${a.description}`).join('\n')}`,
        metadata: {
          isSynthesis: true,
        },
      });

      // Reset all agent statuses
      consultationResult.metadata.agentsUsed.forEach((agentId) => {
        store.updateEmployeeStatus(agentId, 'idle');
      });

      thinkingSteps.push('Consultation completed successfully');

      return {
        response: structuredResult.summary,
        selectionReason: `Consulting: ${consultationResult.domain} domain`,
        thinkingSteps,
        collaborationMessages,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          tokensUsed: consultationResult.metadata.totalTokens,
          isMultiAgent: consultationResult.contributions.length > 1,
          employeesInvolved: consultationResult.metadata.agentsUsed,
          workflowId: consultationResult.workflowId,
          consultingDomain: consultationResult.domain,
          executionMode: consultationResult.mode,
        },
      };
    } catch (error) {
      console.error('Consulting task error:', error);

      store.addMessage({
        from: 'system',
        type: 'error',
        content: `⚠️ Consulting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      // Fallback to simple task handling
      store.addMessage({
        from: 'system',
        type: 'status',
        content: '📋 Falling back to standard employee selection...',
      });

      return (await this.handleSimpleTask(
        userMessage,
        [],
        'Fallback from consulting',
        'solo'
      )) as {
        response: string;
        selectionReason: string;
        thinkingSteps: string[];
        collaborationMessages: EmployeeChatMessage[];
        metadata: {
          model: string;
          tokensUsed: number;
          isMultiAgent: boolean;
          employeesInvolved: string[];
          workflowId?: string;
          consultingDomain?: string;
          executionMode?: string;
        };
      };
    }
  }

  /**
   * Get employee's memory about a specific user
   */
  async getEmployeeMemoryAboutUser(
    userId: string,
    employeeName: string
  ): Promise<unknown[]> {
    return sequentialWorkflowOrchestrator.getEmployeeMemoryAboutUser(
      userId,
      employeeName
    );
  }

  /**
   * Get available workflows (sequential)
   */
  getAvailableWorkflows() {
    return sequentialWorkflowOrchestrator.listWorkflows();
  }

  /**
   * Get available consulting workflows (MGX/MetaGPT/CrewAI style)
   * Returns all predefined consulting workflows with metadata
   */
  getAvailableConsultingWorkflows() {
    return consultingOrchestrator.getAllWorkflows();
  }

  /**
   * Get consultant agents by domain
   * Returns specialized agents for a specific consulting domain
   */
  getConsultantsByDomain(domain: ConsultingDomain) {
    return consultingOrchestrator.getAgentsByDomain(domain);
  }

  /**
   * Get all available consulting domains
   */
  getAvailableConsultingDomains(): ConsultingDomain[] {
    return [
      'health',
      'fitness',
      'nutrition',
      'finance',
      'legal',
      'career',
      'technology',
      'business',
      'education',
      'lifestyle',
      'mental_health',
      'relationships',
    ];
  }

  /**
   * Detect which consulting domain a message relates to
   */
  detectConsultingDomain(message: string): ConsultingDomain | undefined {
    const messageLower = message.toLowerCase();

    // Domain keyword mapping
    const domainKeywords: Record<ConsultingDomain, string[]> = {
      health: [
        'health',
        'medical',
        'doctor',
        'symptom',
        'diagnosis',
        'treatment',
        'medicine',
      ],
      fitness: [
        'exercise',
        'workout',
        'gym',
        'training',
        'muscle',
        'cardio',
        'strength',
      ],
      nutrition: [
        'diet',
        'nutrition',
        'food',
        'meal',
        'calorie',
        'protein',
        'recipe',
        'eating',
      ],
      finance: [
        'money',
        'investment',
        'budget',
        'savings',
        'portfolio',
        'stocks',
        'wealth',
      ],
      legal: [
        'legal',
        'law',
        'contract',
        'lawsuit',
        'attorney',
        'rights',
        'compliance',
      ],
      career: [
        'career',
        'job',
        'resume',
        'interview',
        'promotion',
        'salary',
        'profession',
      ],
      technology: [
        'software',
        'programming',
        'code',
        'app',
        'technology',
        'developer',
        'system',
      ],
      business: [
        'business',
        'startup',
        'company',
        'entrepreneur',
        'marketing',
        'strategy',
      ],
      education: [
        'learn',
        'study',
        'course',
        'school',
        'college',
        'degree',
        'teaching',
      ],
      lifestyle: [
        'lifestyle',
        'habits',
        'routine',
        'productivity',
        'balance',
        'goals',
      ],
      mental_health: [
        'stress',
        'anxiety',
        'depression',
        'therapy',
        'mental',
        'emotional',
        'wellbeing',
      ],
      relationships: [
        'relationship',
        'dating',
        'marriage',
        'family',
        'communication',
        'social',
      ],
    };

    let bestDomain: ConsultingDomain | undefined;
    let bestScore = 0;

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const score = keywords.filter((kw) => messageLower.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain as ConsultingDomain;
      }
    }

    return bestScore > 0 ? bestDomain : undefined;
  }

  /**
   * Select optimal employee based on message content
   * Uses expertise taxonomy matching, employee-defined expertise, and semantic analysis
   */
  private async selectEmployeeForMessage(
    message: string,
    conversationHistory: Array<{ role: string; content: string }>,
    mode?: string
  ): Promise<EmployeeSelectionResult> {
    const messageLower = message.toLowerCase();
    const messageWords = messageLower.split(/\s+/);

    // Build scoring map with expertise-based matching
    const scores = new Map<
      string,
      { score: number; reasons: string[]; matchedExpertise: string[] }
    >();

    for (const employee of this.employees) {
      let score = 0;
      const reasons: string[] = [];
      const matchedExpertise: string[] = [];

      const nameLower = employee.name.toLowerCase();
      const descLower = employee.description.toLowerCase();

      // ==============================================================
      // 1. EXPERTISE TAXONOMY MATCHING (Primary - most accurate)
      // ==============================================================
      // Get employee's expertise areas from frontmatter or mapping
      const employeeExpertise =
        employee.expertise || EmployeeExpertiseMap[employee.name] || [];

      for (const expertiseArea of employeeExpertise) {
        const taxonomyKeywords = ExpertiseTaxonomy[expertiseArea];
        if (!taxonomyKeywords) continue;

        for (const keyword of taxonomyKeywords) {
          const keywordLower = keyword.toLowerCase();

          // Exact word boundary match (more reliable)
          if (messageWords.includes(keywordLower)) {
            score += 15;
            if (!matchedExpertise.includes(expertiseArea)) {
              matchedExpertise.push(expertiseArea);
              reasons.push(`${expertiseArea} expertise`);
            }
          }
          // Phrase match for multi-word keywords
          else if (
            keywordLower.includes(' ') &&
            messageLower.includes(keywordLower)
          ) {
            score += 12;
            if (!matchedExpertise.includes(expertiseArea)) {
              matchedExpertise.push(expertiseArea);
              reasons.push(`${expertiseArea} expertise`);
            }
          }
          // Partial match (lower confidence)
          else if (
            messageLower.includes(keywordLower) &&
            keywordLower.length > 4
          ) {
            score += 5;
          }
        }
      }

      // ==============================================================
      // 2. DESCRIPTION KEYWORD MATCHING (Secondary)
      // ==============================================================
      const descKeywords = descLower.split(/\s+/);
      for (const word of messageWords) {
        if (word.length > 3 && descKeywords.includes(word)) {
          score += 3;
        }
      }

      // ==============================================================
      // 3. DIRECT NAME MENTION (Highest priority)
      // ==============================================================
      const nameVariants = [
        nameLower,
        nameLower.replace(/-/g, ' '),
        nameLower.replace(/-/g, ''),
      ];
      for (const variant of nameVariants) {
        if (messageLower.includes(variant)) {
          score += 50;
          reasons.push('directly mentioned');
          break;
        }
      }

      // ==============================================================
      // 4. TOOL CAPABILITY MATCHING
      // ==============================================================
      const toolKeywords: Record<string, string[]> = {
        code: ['Edit', 'Write', 'Read', 'Glob', 'Grep'],
        search: ['Grep', 'Glob', 'Read'],
        execute: ['Bash'],
        file: ['Read', 'Write', 'Edit'],
      };

      for (const [taskType, requiredTools] of Object.entries(toolKeywords)) {
        if (messageLower.includes(taskType)) {
          const hasTools = requiredTools.some((tool) =>
            employee.tools.includes(tool)
          );
          if (hasTools) {
            score += 8;
            reasons.push(`has ${taskType} tools`);
          }
        }
      }

      // General tool count bonus (more capable = slight bonus)
      score += Math.min(employee.tools.length * 0.5, 3);

      // ==============================================================
      // 5. MODE-SPECIFIC FILTERING
      // ==============================================================
      if (mode === 'engineer' || mode === 'solo') {
        // Prefer technical employees
        const techEmployees = [
          'backend-engineer',
          'frontend-engineer',
          'code-reviewer',
          'devops-engineer',
          'data-analyst',
          'cybersecurity-expert',
        ];
        if (techEmployees.includes(employee.name)) {
          score += 10;
          reasons.push('tech-focused mode');
        }
      } else if (mode === 'research') {
        // Prefer research-oriented employees
        const researchEmployees = [
          'data-analyst',
          'content-writer',
          'education-tutor',
        ];
        if (researchEmployees.includes(employee.name)) {
          score += 10;
          reasons.push('research mode');
        }
      }

      // ==============================================================
      // 6. CONVERSATION CONTEXT CONTINUITY
      // ==============================================================
      if (conversationHistory.length > 0) {
        const lastMessages = conversationHistory.slice(-5);
        const contextText = lastMessages
          .map((m) => m.content)
          .join(' ')
          .toLowerCase();

        // If this employee was recently mentioned, prefer continuity
        for (const variant of nameVariants) {
          if (contextText.includes(variant)) {
            score += 12;
            reasons.push('conversation continuity');
            break;
          }
        }

        // Check if conversation topic matches employee expertise
        for (const expertiseArea of employeeExpertise) {
          const taxonomyKeywords = ExpertiseTaxonomy[expertiseArea] || [];
          const matchCount = taxonomyKeywords.filter((kw) =>
            contextText.includes(kw.toLowerCase())
          ).length;
          if (matchCount >= 2) {
            score += 8;
            reasons.push('context expertise match');
            break;
          }
        }
      }

      if (score > 0) {
        scores.set(employee.name, { score, reasons, matchedExpertise });
      }
    }

    // Find best match
    let bestEmployee = this.employees[0];
    let bestScore = 0;
    let bestReasons: string[] = ['general assistant'];
    let bestExpertise: string[] = [];

    scores.forEach((data, employeeName) => {
      if (data.score > bestScore) {
        const employee = this.employees.find((e) => e.name === employeeName);
        if (employee) {
          bestEmployee = employee;
          bestScore = data.score;
          bestReasons = data.reasons;
          bestExpertise = data.matchedExpertise;
        }
      }
    });

    // Calculate confidence based on score and match quality
    let confidence: number;
    if (bestScore >= 50) {
      confidence = 0.95; // Direct mention or very strong match
    } else if (bestScore >= 30) {
      confidence = 0.8; // Strong expertise match
    } else if (bestScore >= 15) {
      confidence = 0.6; // Moderate match
    } else if (bestScore > 0) {
      confidence = 0.3; // Weak match
    } else {
      confidence = 0.1; // Fallback
    }

    const reason =
      bestReasons.length > 0
        ? bestReasons.slice(0, 3).join(', ')
        : 'general capabilities';

    console.log(
      `[EmployeeChatService] Selected ${bestEmployee.name} (score: ${bestScore}, confidence: ${confidence.toFixed(2)}, expertise: ${bestExpertise.join(', ') || 'none'})`
    );

    return {
      employee: bestEmployee,
      reason,
      confidence,
    };
  }

  /**
   * Get all available employees
   */
  async getAvailableEmployees(): Promise<AIEmployee[]> {
    await this.initialize();
    return this.employees;
  }

  /**
   * Get employee by name
   */
  async getEmployeeByName(name: string): Promise<AIEmployee | undefined> {
    await this.initialize();
    return this.employees.find((e) => e.name === name);
  }

  /**
   * Get employee avatar URL (placeholder implementation)
   */
  getEmployeeAvatar(employeeName: string): string {
    // Generate a consistent color based on name
    const colors = [
      '#6366f1', // indigo
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // emerald
      '#3b82f6', // blue
      '#06b6d4', // cyan
      '#f43f5e', // rose
    ];

    const hash = employeeName.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    const colorIndex = hash % colors.length;
    return colors[colorIndex];
  }

  /**
   * Get employee initial(s) for avatar fallback
   */
  getEmployeeInitials(employeeName: string): string {
    return employeeName
      .split('-')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}

// Export singleton instance
export const employeeChatService = new EmployeeChatService();
