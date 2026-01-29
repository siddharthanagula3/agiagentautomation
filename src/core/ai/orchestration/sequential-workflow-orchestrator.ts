/**
 * Sequential Workflow Orchestrator
 * Manages sequential multi-agent workflows with handoffs
 *
 * Example flow: User → Gym Trainer → Dietitian → Chef
 * Each employee has their own context window and can pass information to the next
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import { systemPromptsService } from '@core/ai/employees/prompt-management';
import {
  employeeMemoryService,
  type HandoffPackage,
  type EmployeeContextMessage,
} from '@core/ai/employees/employee-memory-service';
import { useMissionStore } from '@shared/stores/mission-control-store';
import type { AIEmployee } from '@core/types/ai-employee';
import { tokenLogger } from '@core/integrations/token-usage-tracker';
import { logger } from '@shared/lib/logger';

// ================================================
// TYPES
// ================================================

export interface WorkflowStep {
  employeeId: string;
  employeeName: string;
  role: string;
  instructions?: string;
  requiredOutput?: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggerPatterns?: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  sessionId: string;
  userId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentStepIndex: number;
  steps: WorkflowStepExecution[];
  userRequest: string;
  startedAt: Date;
  completedAt?: Date;
  finalResult?: string;
  error?: string;
}

export interface WorkflowStepExecution {
  stepIndex: number;
  employeeId: string;
  employeeName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input?: string;
  output?: string;
  handoffData?: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  tokensUsed?: number;
  error?: string;
}

export interface WorkflowRequest {
  userId: string;
  sessionId: string;
  input: string;
  workflowId?: string;
  employees?: string[];
  context?: Record<string, unknown>;
}

export interface WorkflowResponse {
  success: boolean;
  executionId: string;
  status: WorkflowExecution['status'];
  currentStep?: WorkflowStepExecution;
  finalResult?: string;
  error?: string;
}

// ================================================
// PREDEFINED WORKFLOWS
// ================================================

const PREDEFINED_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'fitness-consultation',
    name: 'Fitness Consultation',
    description:
      'Get fitness advice from trainer, diet plan from dietitian, and meal prep from chef',
    steps: [
      {
        employeeId: 'gym-trainer',
        employeeName: 'Gym Trainer',
        role: 'fitness',
        instructions:
          'Analyze user fitness goals and create a workout plan. Note any dietary requirements.',
        requiredOutput: [
          'workout_plan',
          'dietary_requirements',
          'fitness_goals',
        ],
      },
      {
        employeeId: 'dietitian',
        employeeName: 'Dietitian',
        role: 'nutrition',
        instructions:
          'Based on the workout plan and goals, create a personalized diet chart.',
        requiredOutput: ['diet_plan', 'calorie_requirements', 'meal_schedule'],
      },
      {
        employeeId: 'chef',
        employeeName: 'Chef',
        role: 'cooking',
        instructions: 'Create delicious recipes that match the diet plan.',
        requiredOutput: ['recipes', 'grocery_list', 'meal_prep_instructions'],
      },
    ],
    triggerPatterns: [
      'diet',
      'fitness',
      'workout',
      'meal plan',
      'gym',
      'nutrition',
    ],
  },
  {
    id: 'code-review-workflow',
    name: 'Code Review Pipeline',
    description: 'Review code through multiple specialists',
    steps: [
      {
        employeeId: 'code-reviewer',
        employeeName: 'Code Reviewer',
        role: 'code-quality',
        instructions: 'Review code for bugs, logic errors, and best practices.',
        requiredOutput: ['issues_found', 'suggestions', 'code_quality_score'],
      },
      {
        employeeId: 'security-analyst',
        employeeName: 'Security Analyst',
        role: 'security',
        instructions: 'Review code for security vulnerabilities.',
        requiredOutput: [
          'vulnerabilities',
          'risk_level',
          'security_recommendations',
        ],
      },
    ],
    triggerPatterns: ['review', 'security', 'audit', 'code check'],
  },
];

// ================================================
// SEQUENTIAL WORKFLOW ORCHESTRATOR
// ================================================

export class SequentialWorkflowOrchestrator {
  private static instance: SequentialWorkflowOrchestrator;
  private employees: AIEmployee[] = [];
  private employeesLoaded = false;
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();

  constructor() {
    // Load predefined workflows
    PREDEFINED_WORKFLOWS.forEach((wf) => this.workflows.set(wf.id, wf));
  }

  static getInstance(): SequentialWorkflowOrchestrator {
    if (!SequentialWorkflowOrchestrator.instance) {
      SequentialWorkflowOrchestrator.instance =
        new SequentialWorkflowOrchestrator();
    }
    return SequentialWorkflowOrchestrator.instance;
  }

  // ================================================
  // INITIALIZATION
  // ================================================

  async ensureEmployeesLoaded(): Promise<void> {
    if (!this.employeesLoaded) {
      this.employees = await systemPromptsService.getAvailableEmployees();
      if (this.employees.length > 0) {
        this.employeesLoaded = true;
      }
    }
  }

  // ================================================
  // WORKFLOW MANAGEMENT
  // ================================================

  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Auto-detect workflow based on user input
   */
  detectWorkflow(input: string): WorkflowDefinition | undefined {
    const inputLower = input.toLowerCase();

    for (const workflow of this.workflows.values()) {
      if (
        workflow.triggerPatterns?.some((pattern) =>
          inputLower.includes(pattern)
        )
      ) {
        return workflow;
      }
    }

    return undefined;
  }

  // ================================================
  // WORKFLOW EXECUTION
  // ================================================

  /**
   * Start a sequential workflow
   */
  async startWorkflow(request: WorkflowRequest): Promise<WorkflowResponse> {
    await this.ensureEmployeesLoaded();

    const store = useMissionStore.getState();
    const executionId = crypto.randomUUID();

    try {
      // Determine workflow to use
      let workflow: WorkflowDefinition | undefined;

      if (request.workflowId) {
        workflow = this.workflows.get(request.workflowId);
      } else if (request.employees && request.employees.length > 0) {
        // Create ad-hoc workflow from employee list
        workflow = this.createAdHocWorkflow(request.employees);
      } else {
        // Auto-detect workflow from input
        workflow = this.detectWorkflow(request.input);
      }

      if (!workflow) {
        throw new Error(
          'No suitable workflow found. Please specify employees or workflow ID.'
        );
      }

      // Create execution record
      const execution: WorkflowExecution = {
        id: executionId,
        workflowId: workflow.id,
        sessionId: request.sessionId,
        userId: request.userId,
        status: 'running',
        currentStepIndex: 0,
        steps: workflow.steps.map((step, index) => ({
          stepIndex: index,
          employeeId: step.employeeId,
          employeeName: step.employeeName,
          status: index === 0 ? 'running' : 'pending',
        })),
        userRequest: request.input,
        startedAt: new Date(),
      };

      this.executions.set(executionId, execution);

      // Update mission store
      store.startMission(executionId);
      store.addMessage({
        from: 'system',
        type: 'system',
        content: `🚀 Starting workflow: ${workflow.name}\n📋 Steps: ${workflow.steps.map((s) => s.employeeName).join(' → ')}`,
      });

      // Execute workflow steps sequentially
      const result = await this.executeWorkflowSteps(
        execution,
        workflow,
        request
      );

      return {
        success: true,
        executionId,
        status: execution.status,
        finalResult: result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('[Sequential Workflow] Workflow execution failed:', errorMessage);

      const execution = this.executions.get(executionId);
      if (execution) {
        execution.status = 'failed';
        execution.error = errorMessage;
      }

      store.failMission(errorMessage);

      return {
        success: false,
        executionId,
        status: 'failed',
        error: errorMessage,
      };
    }
  }

  /**
   * Execute workflow steps sequentially with handoffs
   */
  private async executeWorkflowSteps(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    request: WorkflowRequest
  ): Promise<string> {
    const store = useMissionStore.getState();
    let previousOutput: string = request.input;
    let previousHandoffData: Record<string, unknown> = request.context || {};

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepExecution = execution.steps[i];

      // Check if workflow is paused
      if (execution.status === 'paused') {
        store.addMessage({
          from: 'system',
          type: 'system',
          content: '⏸️ Workflow paused',
        });
        break;
      }

      // Update execution state
      execution.currentStepIndex = i;
      stepExecution.status = 'running';
      stepExecution.startedAt = new Date();

      // Find employee
      const employee = this.employees.find(
        (e) =>
          e.name.toLowerCase() === step.employeeName.toLowerCase() ||
          e.name.toLowerCase().includes(step.employeeId.toLowerCase())
      );

      if (!employee) {
        logger.warn(
          `[Sequential Workflow] Employee not found: ${step.employeeName}, skipping step`
        );
        stepExecution.status = 'skipped';
        stepExecution.error = 'Employee not found';
        continue;
      }

      store.addMessage({
        from: 'system',
        type: 'system',
        content: `👤 **${employee.name}** is now working...`,
      });

      store.updateEmployeeStatus(
        employee.name,
        'thinking',
        null,
        `Step ${i + 1}: ${step.instructions || 'Processing'}`
      );

      try {
        // Get employee's context window
        const contextWindow = employeeMemoryService.getContextWindow(
          request.sessionId,
          employee.name,
          employee.name,
          employee.systemPrompt
        );

        // Build memory context from previous interactions
        const memoryContext = await employeeMemoryService.buildMemoryContext(
          request.userId,
          employee.name
        );

        // Build input for this step
        const stepInput = this.buildStepInput(
          step,
          request.input,
          previousOutput,
          previousHandoffData,
          memoryContext,
          i === 0
        );

        // Add user message to employee's context
        employeeMemoryService.addMessageToContext(
          request.sessionId,
          employee.name,
          { role: 'user', content: stepInput }
        );

        // Get optimized messages for API call
        const contextMessages = employeeMemoryService.getOptimizedMessages(
          request.sessionId,
          employee.name
        );

        // Execute step
        store.updateEmployeeStatus(
          employee.name,
          'using_tool',
          'LLM',
          step.instructions
        );
        store.updateEmployeeProgress(employee.name, 25);

        const response = await unifiedLLMService.sendMessage({
          provider: 'anthropic',
          messages: [
            { role: 'system', content: employee.systemPrompt },
            ...contextMessages.map((m) => ({
              role: m.role === 'handoff' ? 'system' : m.role,
              content: m.content,
            })),
          ],
          model:
            employee.model === 'inherit'
              ? 'claude-3-5-sonnet-20241022'
              : employee.model,
          temperature: 0.7,
          userId: request.userId,
          sessionId: request.sessionId,
        });

        // Track tokens
        if (response.usage) {
          stepExecution.tokensUsed = response.usage.totalTokens;

          await tokenLogger.logTokenUsage(
            response.model,
            response.usage.totalTokens,
            request.userId,
            request.sessionId,
            employee.name,
            employee.name,
            response.usage.promptTokens,
            response.usage.completionTokens,
            `Workflow step ${i + 1}: ${step.employeeName}`
          );
        }

        // Add assistant response to employee's context
        employeeMemoryService.addMessageToContext(
          request.sessionId,
          employee.name,
          { role: 'assistant', content: response.content }
        );

        // Extract any structured data for handoff
        const handoffData = this.extractHandoffData(
          response.content,
          step.requiredOutput
        );

        // Update step execution
        stepExecution.status = 'completed';
        stepExecution.completedAt = new Date();
        stepExecution.output = response.content;
        stepExecution.handoffData = handoffData;

        // Update store
        store.updateEmployeeProgress(employee.name, 100);
        store.updateEmployeeStatus(employee.name, 'idle');
        store.addEmployeeLog(employee.name, `✓ Completed step ${i + 1}`);

        store.addMessage({
          from: employee.name,
          type: 'employee',
          content: response.content,
          metadata: {
            employeeName: employee.name,
            stepIndex: i,
            workflowId: workflow.id,
          },
        });

        // Create handoff to next employee if not last step
        if (i < workflow.steps.length - 1) {
          const nextStep = workflow.steps[i + 1];
          const nextEmployee = this.employees.find(
            (e) =>
              e.name.toLowerCase() === nextStep.employeeName.toLowerCase() ||
              e.name.toLowerCase().includes(nextStep.employeeId.toLowerCase())
          );

          if (nextEmployee) {
            employeeMemoryService.createHandoff(
              employee.name,
              employee.name,
              nextEmployee.name,
              nextEmployee.name,
              request.sessionId,
              request.userId,
              {
                summary: `${employee.name} completed their part of the workflow.`,
                keyPoints: Object.entries(handoffData).map(
                  ([k, v]) => `${k}: ${String(v).slice(0, 100)}`
                ),
                userRequest: request.input,
                workCompleted: step.instructions || `Step ${i + 1}`,
                pendingTasks: [nextStep.instructions || `Step ${i + 2}`],
              },
              handoffData,
              nextStep.instructions
            );

            store.addMessage({
              from: 'system',
              type: 'system',
              content: `📤 Handoff: ${employee.name} → ${nextEmployee.name}`,
            });
          }
        }

        // Learn from this interaction
        await this.learnFromInteraction(
          request.userId,
          employee.name,
          request.input,
          response.content
        );

        // Prepare for next step
        previousOutput = response.content;
        previousHandoffData = { ...previousHandoffData, ...handoffData };
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        stepExecution.status = 'failed';
        stepExecution.error = errorMsg;

        store.updateEmployeeStatus(employee.name, 'error');
        store.addMessage({
          from: employee.name,
          type: 'error',
          content: `❌ Step failed: ${errorMsg}`,
        });

        throw error;
      }
    }

    // Mark execution complete
    execution.status = 'completed';
    execution.completedAt = new Date();
    execution.finalResult = previousOutput;

    store.completeMission();
    store.addMessage({
      from: 'system',
      type: 'system',
      content: `✅ Workflow completed: ${workflow.name}`,
    });

    return previousOutput;
  }

  /**
   * Build input for a workflow step
   */
  private buildStepInput(
    step: WorkflowStep,
    originalRequest: string,
    previousOutput: string,
    handoffData: Record<string, unknown>,
    memoryContext: string,
    isFirstStep: boolean
  ): string {
    let input = '';

    // Add memory context if available
    if (memoryContext) {
      input += `${memoryContext}\n\n---\n\n`;
    }

    if (isFirstStep) {
      input += `**User Request:** ${originalRequest}`;
    } else {
      input += `**Original User Request:** ${originalRequest}\n\n`;
      input += `**Previous Agent's Work:**\n${previousOutput}\n\n`;

      if (Object.keys(handoffData).length > 0) {
        input += `**Handoff Data:**\n\`\`\`json\n${JSON.stringify(handoffData, null, 2)}\n\`\`\`\n\n`;
      }
    }

    if (step.instructions) {
      input += `\n\n**Your Task:** ${step.instructions}`;
    }

    if (step.requiredOutput && step.requiredOutput.length > 0) {
      input += `\n\n**Required Output:** Please include the following in your response: ${step.requiredOutput.join(', ')}`;
    }

    return input;
  }

  /**
   * Extract structured data from response for handoff
   */
  private extractHandoffData(
    response: string,
    requiredOutput?: string[]
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    // Try to extract JSON if present
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        Object.assign(data, parsed);
      } catch {
        // Not valid JSON, continue
      }
    }

    // Extract key-value patterns
    if (requiredOutput) {
      for (const key of requiredOutput) {
        const pattern = new RegExp(`${key}[:\\s]+(.+?)(?:\\n|$)`, 'i');
        const match = response.match(pattern);
        if (match) {
          data[key] = match[1].trim();
        }
      }
    }

    // Always include a summary
    data.summary = response.slice(0, 500);

    return data;
  }

  /**
   * Learn from interaction and store in employee memory
   */
  private async learnFromInteraction(
    userId: string,
    employeeName: string,
    userInput: string,
    response: string
  ): Promise<void> {
    // Extract key information to remember
    const learningPrompt = `Analyze this interaction and extract 1-2 key facts about the user that would be helpful to remember for future interactions.

User said: "${userInput.slice(0, 500)}"

Your response included: "${response.slice(0, 500)}"

If there's useful information about the user (preferences, goals, facts about them), format as:
- Category: [personal|preferences|goals|history]
- Key: brief identifier
- Value: the information

If no useful information, respond with "NO_LEARNING"`;

    try {
      // This could be done async/in background
      // For now, just add interaction to history
      await employeeMemoryService.addKnowledge(userId, employeeName, {
        category: 'history',
        key: `interaction_${Date.now()}`,
        value: `User asked about: ${userInput.slice(0, 100)}`,
        confidence: 0.8,
        source: 'inferred',
      });
    } catch (error) {
      logger.warn('[Sequential Workflow] Failed to learn from interaction:', error);
    }
  }

  /**
   * Create ad-hoc workflow from employee list
   */
  private createAdHocWorkflow(employeeNames: string[]): WorkflowDefinition {
    const steps: WorkflowStep[] = employeeNames.map((name) => ({
      employeeId: name.toLowerCase().replace(/\s+/g, '-'),
      employeeName: name,
      role: 'general',
    }));

    return {
      id: `adhoc-${Date.now()}`,
      name: 'Custom Workflow',
      description: `Custom workflow with: ${employeeNames.join(', ')}`,
      steps,
    };
  }

  // ================================================
  // EXECUTION CONTROL
  // ================================================

  pauseExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';
    }
  }

  resumeExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'running';
      // Note: Actual resumption would need to restart from current step
    }
  }

  cancelExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = 'failed';
      execution.error = 'Cancelled by user';

      // Clear context windows
      employeeMemoryService.clearSessionContext(execution.sessionId);
    }
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getSessionExecutions(sessionId: string): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(
      (e) => e.sessionId === sessionId
    );
  }

  // ================================================
  // DIRECT EMPLOYEE CHAT
  // ================================================

  /**
   * Chat directly with a specific employee (not in workflow)
   */
  async chatWithEmployee(
    employeeName: string,
    message: string,
    sessionId: string,
    userId: string
  ): Promise<string> {
    await this.ensureEmployeesLoaded();

    const employee = this.employees.find(
      (e) => e.name.toLowerCase() === employeeName.toLowerCase()
    );

    if (!employee) {
      throw new Error(`Employee ${employeeName} not found`);
    }

    const store = useMissionStore.getState();

    // Get or create context window for this employee
    employeeMemoryService.getContextWindow(
      sessionId,
      employee.name,
      employee.name,
      employee.systemPrompt
    );

    // Get memory context
    const memoryContext = await employeeMemoryService.buildMemoryContext(
      userId,
      employee.name
    );

    // Build full input
    const fullInput = memoryContext
      ? `${memoryContext}\n\n---\n\n${message}`
      : message;

    // Add to context
    employeeMemoryService.addMessageToContext(sessionId, employee.name, {
      role: 'user',
      content: fullInput,
    });

    // Get optimized messages
    const contextMessages = employeeMemoryService.getOptimizedMessages(
      sessionId,
      employee.name
    );

    store.updateEmployeeStatus(
      employee.name,
      'thinking',
      null,
      'Processing message'
    );

    try {
      const response = await unifiedLLMService.sendMessage({
        provider: 'anthropic',
        messages: [
          { role: 'system', content: employee.systemPrompt },
          ...contextMessages.map((m) => ({
            role: m.role === 'handoff' ? 'system' : m.role,
            content: m.content,
          })),
        ],
        model:
          employee.model === 'inherit'
            ? 'claude-3-5-sonnet-20241022'
            : employee.model,
        temperature: 0.7,
        userId,
        sessionId,
      });

      // Track tokens
      if (response.usage) {
        await tokenLogger.logTokenUsage(
          response.model,
          response.usage.totalTokens,
          userId,
          sessionId,
          employee.name,
          employee.name,
          response.usage.promptTokens,
          response.usage.completionTokens,
          `Direct chat with ${employee.name}`
        );
      }

      // Add response to context
      employeeMemoryService.addMessageToContext(sessionId, employee.name, {
        role: 'assistant',
        content: response.content,
      });

      store.updateEmployeeStatus(employee.name, 'idle');

      // Learn from interaction
      await this.learnFromInteraction(
        userId,
        employee.name,
        message,
        response.content
      );

      return response.content;
    } catch (error) {
      store.updateEmployeeStatus(employee.name, 'error');
      throw error;
    }
  }

  // ================================================
  // UTILITY
  // ================================================

  getAvailableEmployees(): AIEmployee[] {
    return this.employees;
  }

  getEmployeeContextStats(sessionId: string, employeeName: string) {
    return employeeMemoryService.getContextStats(sessionId, employeeName);
  }

  async getEmployeeMemoryAboutUser(userId: string, employeeName: string) {
    return employeeMemoryService.getAllKnowledge(userId, employeeName);
  }
}

// Export singleton
export const sequentialWorkflowOrchestrator =
  SequentialWorkflowOrchestrator.getInstance();
