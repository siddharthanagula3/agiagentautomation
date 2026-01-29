/**
 * Workforce Orchestrator - REFACTORED with Plan-Delegate-Execute Loop
 * Implements autonomous AI workforce with file-based employee system
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import { systemPromptsService } from '@core/ai/employees/prompt-management';
import {
  AppError,
  ErrorCodes,
  getErrorMessage,
  withTimeout,
  retryWithBackoff,
  safeJsonParse,
  isRetryableError,
} from '@shared/utils/error-handling';
import { useMissionStore } from '@shared/stores/mission-control-store';
import type { Task } from '@shared/stores/mission-control-store';
import type { AIEmployee } from '@core/types/ai-employee';
import { agentConversationProtocol } from './agent-conversation-protocol';
import { supabase } from '@shared/lib/supabase-client';
import { useAuthStore } from '@shared/stores/authentication-store';
import { tokenLogger } from '@core/integrations/token-usage-tracker';
import { updateVibeSessionTokens } from '@features/vibe/services/vibe-token-tracker';
import { logger } from '@shared/lib/logger';
// SECURITY: Import prompt injection defense
import {
  sanitizeEmployeeInput,
  buildSecureMessages,
  validateEmployeeOutput,
} from '@core/security/employee-input-sanitizer';

/** Mode of operation for workforce requests */
export type WorkforceMode = 'mission' | 'chat';

/** Conversation history message format */
export interface ConversationHistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface WorkforceRequest {
  userId: string;
  input: string;
  context?: Record<string, unknown>;
  mode?: WorkforceMode;
  sessionId?: string;
  conversationHistory?: ConversationHistoryMessage[];
}

export interface WorkforceResponse {
  success: boolean;
  missionId?: string;
  plan?: Task[];
  error?: string;
  chatResponse?: string;
  mode?: WorkforceMode;
}

/** Available tool names for plan tasks */
export type ToolName = 'Read' | 'Grep' | 'Glob' | 'Bash' | 'Edit' | 'Write' | 'general' | string;

export interface PlanTask {
  task: string;
  tool_required?: ToolName;
}

export interface MissionPlan {
  plan: PlanTask[];
  reasoning?: string;
}

/** Result of individual task execution */
type TaskExecutionStatus = 'fulfilled' | 'failed' | 'rejected' | 'skipped';

interface TaskExecutionResult {
  taskId: string;
  status: TaskExecutionStatus;
  result?: string;
  reason?: string;
  error?: string;
}

/**
 * WorkforceOrchestrator - Main orchestrator class with Plan-Delegate-Execute
 */
export class WorkforceOrchestratorRefactored {
  private employees: AIEmployee[] = [];
  private employeesLoaded = false;

  /**
   * MAIN METHOD: Plan, Delegate, Execute
   * Now supports both mission mode (full orchestration) and chat mode (conversational)
   */
  async processRequest(request: WorkforceRequest): Promise<WorkforceResponse> {
    const missionId = crypto.randomUUID();
    const store = useMissionStore.getState();
    const mode = request.mode || 'mission';

    try {
      // ============================================
      // SECURITY: Sanitize user input before processing
      // ============================================
      const sanitizationResult = sanitizeEmployeeInput(
        request.input,
        request.userId,
        {
          maxInputLength: 50000,
          applySandwichDefense: true,
          blockThreshold: 'high',
          logAllInputs: false,
        }
      );

      if (sanitizationResult.blocked) {
        logger.warn(
          '[Workforce Orchestrator] Input blocked:',
          sanitizationResult.blockReason
        );
        store.addMessage({
          from: 'system',
          type: 'error',
          content: `Your request was blocked for security reasons. Please rephrase your request without attempting to manipulate AI behavior.`,
        });
        return {
          success: false,
          error: 'Request blocked due to security concerns',
        };
      }

      // Use sanitized input for all subsequent processing
      const sanitizedInput = sanitizationResult.sanitized;

      // Input sanitization is tracked via Sentry breadcrumbs when modifications occur

      // Updated: Jan 15th 2026 - Fixed empty employee handling to prevent setting loaded flag on failure
      // Load employees if not already loaded
      if (!this.employeesLoaded) {
        this.employees = await systemPromptsService.getAvailableEmployees();
        // Only set loaded flag if we actually got employees
        if (this.employees.length > 0) {
          this.employeesLoaded = true;
        } else {
          logger.warn('[Workforce Orchestrator] No employees loaded from .agi/employees/');
        }
      }

      // CHAT MODE: Direct conversational response
      if (mode === 'chat') {
        // Pass sanitized input to chat request
        return await this.processChatRequest(
          { ...request, input: sanitizedInput },
          missionId
        );
      }

      // MISSION MODE: Full Plan-Delegate-Execute
      store.startMission(missionId);
      store.addMessage({
        from: 'user',
        type: 'user',
        content: sanitizedInput, // Use sanitized input
      });

      // ============================================
      // STAGE 1: PLANNING - Generate structured plan
      // ============================================
      store.addMessage({
        from: 'system',
        type: 'system',
        content: '🧠 Analyzing request and creating execution plan...',
      });

      const plan = await this.generatePlan(
        sanitizedInput, // Use sanitized input
        request.sessionId,
        request.userId
      );

      if (!plan || plan.plan.length === 0) {
        throw new AppError(
          'Failed to generate execution plan',
          ErrorCodes.PLAN_GENERATION_FAILED,
          500,
          true,
          'Could not create an execution plan for your request. Please try again or rephrase your request.'
        );
      }


      // Convert to Task objects
      const tasks: Task[] = plan.plan.map((planTask, index) => ({
        id: `task-${index + 1}`,
        description: planTask.task,
        status: 'pending' as const,
        assignedTo: null,
        toolRequired: planTask.tool_required,
      }));

      store.setMissionPlan(tasks);
      store.addMessage({
        from: 'system',
        type: 'plan',
        content: `📋 Plan created with ${tasks.length} tasks:\n${tasks.map((t, i) => `${i + 1}. ${t.description}`).join('\n')}`,
      });

      // ============================================
      // STAGE 2: DELEGATION - Select optimal employees
      // ============================================
      store.addMessage({
        from: 'system',
        type: 'system',
        content: '🤖 Selecting optimal AI employees for each task...',
      });

      for (const task of tasks) {
        const selectedEmployee = await this.selectOptimalEmployee(task);

        if (selectedEmployee) {
          store.updateTaskStatus(task.id, 'in_progress', selectedEmployee.name);
          store.updateEmployeeStatus(
            selectedEmployee.name,
            'thinking',
            null,
            task.description
          );

          store.addMessage({
            from: 'system',
            type: 'task_update',
            content: `✓ Assigned "${task.description}" to ${selectedEmployee.name}`,
            metadata: { taskId: task.id, employeeName: selectedEmployee.name },
          });
        } else {
          logger.warn(
            `[Workforce Orchestrator] No suitable employee for task: ${task.description}`
          );
        }
      }

      // ============================================
      // STAGE 3: EXECUTION - Execute tasks
      // ============================================
      store.addMessage({
        from: 'system',
        type: 'system',
        content: '⚡ Beginning task execution...',
      });

      await this.executeTasks(
        tasks,
        sanitizedInput, // Use sanitized input
        request.sessionId,
        request.userId
      );

      store.completeMission();
      store.addMessage({
        from: 'system',
        type: 'system',
        content: '✅ Mission completed successfully!',
      });

      return {
        success: true,
        missionId,
        plan: tasks,
      };
    } catch (error) {
      const technicalMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const userMessage = getErrorMessage(error);
      logger.error('[Workforce Orchestrator] Error processing request:', technicalMessage);

      store.failMission(userMessage);
      store.addMessage({
        from: 'system',
        type: 'error',
        content: `❌ Mission failed: ${userMessage}`,
      });

      return {
        success: false,
        error: userMessage,
      };
    }
  }

  /**
   * PLANNING STAGE: Generate structured plan using LLM
   */
  private async generatePlan(
    userInput: string,
    sessionId?: string,
    userId?: string
  ): Promise<MissionPlan> {
    const plannerPrompt = `You are a strategic AI planner. Given a user request, create a detailed step-by-step execution plan.

Return your response ONLY as valid JSON in this exact format:
{
  "plan": [
    {"task": "Task description", "tool_required": "tool_name"},
    {"task": "Another task", "tool_required": "another_tool"}
  ],
  "reasoning": "Brief explanation of the plan"
}

Available tools: Read, Grep, Glob, Bash, Edit, Write

User request: ${userInput}

Think step-by-step and create a comprehensive plan. Respond with JSON only.`;

    try {
      const response = await retryWithBackoff(
        () =>
          unifiedLLMService.sendMessage({
            provider: 'anthropic',
            messages: [{ role: 'user', content: plannerPrompt }],
            model: 'claude-3-5-sonnet-20241022',
            temperature: 0.3,
            userId,
            sessionId,
          }),
        {
          maxRetries: 3,
        }
      );

      // Track token usage
      if (response.usage && userId) {
        await tokenLogger.logTokenUsage(
          response.model,
          response.usage.totalTokens,
          userId,
          sessionId,
          'planner',
          'AI Planner',
          response.usage.promptTokens,
          response.usage.completionTokens,
          'Planning stage - generating execution plan'
        );

        // Update vibe session if sessionId provided
        if (sessionId) {
          const cost = tokenLogger.calculateCost(
            response.model,
            response.usage.promptTokens,
            response.usage.completionTokens
          );
          await updateVibeSessionTokens(
            sessionId,
            response.usage.promptTokens,
            response.usage.completionTokens,
            cost
          );
        }
      }

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = response.content.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }

      // Use safe JSON parsing with validation
      const parseResult = safeJsonParse<MissionPlan>(jsonText);
      if (!parseResult.success) {
        throw new AppError(
          'Failed to parse plan JSON',
          ErrorCodes.VALIDATION_ERROR,
          400,
          false,
          'Could not understand the generated plan. Please try again.'
        );
      }

      const parsed = parseResult.data;

      // Validate the parsed structure
      if (!parsed || typeof parsed !== 'object') {
        throw new AppError(
          'Invalid plan structure: not an object',
          ErrorCodes.VALIDATION_ERROR,
          400,
          false,
          'Generated plan has an invalid format.'
        );
      }

      if (!parsed.plan || !Array.isArray(parsed.plan)) {
        throw new AppError(
          'Invalid plan structure: plan is not an array',
          ErrorCodes.VALIDATION_ERROR,
          400,
          false,
          'Generated plan is missing the task list.'
        );
      }

      // Validate each task in the plan
      for (const task of parsed.plan) {
        if (!task.task || typeof task.task !== 'string') {
          throw new AppError(
            'Invalid plan structure: task description missing',
            ErrorCodes.VALIDATION_ERROR,
            400,
            false,
            'One or more tasks in the plan are missing descriptions.'
          );
        }
      }

      return parsed;
    } catch (error) {
      logger.error('[Workforce Orchestrator] Error generating plan:', error);
      // Fallback: create simple single-task plan
      return {
        plan: [{ task: userInput, tool_required: 'general' }],
        reasoning: 'Fallback plan due to parsing error',
      };
    }
  }

  /**
   * DELEGATION STAGE: Select optimal employee for a task
   */
  private async selectOptimalEmployee(task: Task): Promise<AIEmployee | null> {
    if (this.employees.length === 0) {
      logger.warn('[Workforce Orchestrator] No employees available');
      return null;
    }

    // Updated: Jan 15th 2026 - Fixed employee selection to check user permissions
    // Get user's hired employees from database to enforce permissions
    const { user } = useAuthStore.getState();
    let availableEmployees = this.employees;

    if (user) {
      try {
        const { data: hiredEmployees, error } = await supabase
          .from('purchased_employees')
          .select('employee_id, ai_employees(name)')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (!error && hiredEmployees && hiredEmployees.length > 0) {
          // Create set of hired employee names for quick lookup
          const hiredNames = new Set(
            hiredEmployees
              .map((e) => (e.ai_employees as { name: string } | null)?.name)
              .filter((name): name is string => name !== null)
          );

          // Filter to only employees user has hired (or free employees with price 0)
          availableEmployees = this.employees.filter(
            (emp) => hiredNames.has(emp.name) || emp.price === 0
          );

          if (availableEmployees.length === 0) {
            logger.warn(
              '[Workforce Orchestrator] User has no hired employees available for task assignment'
            );
            return null;
          }

        }
      } catch (error) {
        logger.error('[Workforce Orchestrator] Error fetching hired employees:', error);
        // On error, continue with all employees (degraded mode)
      }
    }

    // Simple matching: find employee whose description best matches the task
    let bestMatch: AIEmployee | null = null;
    let bestScore = 0;

    for (const employee of availableEmployees) {
      let score = 0;

      // Check if task mentions any tools the employee has
      const taskLower = task.description.toLowerCase();
      const descLower = employee.description.toLowerCase();

      // Score based on description relevance
      if (taskLower.includes('review') && descLower.includes('review'))
        score += 10;
      if (taskLower.includes('debug') && descLower.includes('debug'))
        score += 10;
      if (taskLower.includes('code') && descLower.includes('code')) score += 5;
      if (taskLower.includes('test') && descLower.includes('test')) score += 5;

      // Score based on tool availability
      if (task.toolRequired) {
        const hasRequiredTool = employee.tools.some(
          (tool) =>
            tool.toLowerCase().includes(task.toolRequired!.toLowerCase()) ||
            task.toolRequired!.toLowerCase().includes(tool.toLowerCase())
        );
        if (hasRequiredTool) score += 15;
      }

      // General capability score
      score += employee.tools.length; // More tools = more capable

      if (score > bestScore) {
        bestScore = score;
        bestMatch = employee;
      }
    }

    // If no good match, use first available employee
    return bestMatch || availableEmployees[0] || null;
  }

  /**
   * EXECUTION STAGE: Execute all tasks in parallel
   * Updated: Jan 6th 2026 - Changed from sequential to parallel execution using Promise.allSettled
   * CRITICAL FIX: Snapshot pause state at entry to prevent race conditions
   */
  private async executeTasks(
    tasks: Task[],
    originalInput: string,
    sessionId?: string,
    userId?: string
  ): Promise<void> {
    const store = useMissionStore.getState();

    // CRITICAL FIX: Take a snapshot of the pause state at the beginning
    // This prevents race conditions where pause state changes between checks
    // Use a function to get current state, allowing tasks to respect pause during execution
    const checkIfPaused = () => useMissionStore.getState().isPaused;

    // Check if mission is paused before starting execution
    if (checkIfPaused()) {
      return;
    }

    // Execute tasks in parallel
    const taskPromises: Promise<TaskExecutionResult>[] = tasks.map(async (task): Promise<TaskExecutionResult> => {
      // Check pause state at start of each task
      // This allows tasks that haven't started yet to be skipped if paused
      if (checkIfPaused()) {
        return {
          taskId: task.id,
          status: 'skipped' as const,
          reason: 'Mission paused',
        };
      }

      if (!task.assignedTo) {
        store.updateTaskStatus(
          task.id,
          'failed',
          undefined,
          undefined,
          'No employee assigned'
        );
        return {
          taskId: task.id,
          status: 'failed' as const,
          reason: 'No employee assigned',
        };
      }

      try {
        store.updateEmployeeStatus(
          task.assignedTo,
          'using_tool',
          task.toolRequired || 'general',
          task.description
        );
        store.addEmployeeLog(
          task.assignedTo,
          `Starting task: ${task.description}`
        );
        store.updateEmployeeProgress(task.assignedTo, 25);

        // Get employee details
        const employee = this.employees.find((e) => e.name === task.assignedTo);

        if (!employee) {
          throw new AppError(
            `Employee ${task.assignedTo} not found`,
            ErrorCodes.EMPLOYEE_NOT_FOUND,
            404,
            false,
            `The assigned AI employee "${task.assignedTo}" could not be found.`
          );
        }

        // Execute using employee's system prompt
        const result = await this.executeWithEmployee(
          employee,
          task,
          originalInput,
          sessionId,
          userId
        );

        store.updateEmployeeProgress(task.assignedTo, 100);
        store.updateTaskStatus(task.id, 'completed', task.assignedTo, result);
        store.updateEmployeeStatus(task.assignedTo, 'idle');
        store.addEmployeeLog(
          task.assignedTo,
          `✓ Completed: ${task.description}`
        );

        store.addMessage({
          from: task.assignedTo,
          type: 'employee',
          content: result,
          metadata: { taskId: task.id, employeeName: task.assignedTo },
        });

        return { taskId: task.id, status: 'fulfilled' as const, result };
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        store.updateTaskStatus(
          task.id,
          'failed',
          task.assignedTo,
          undefined,
          errorMsg
        );
        store.updateEmployeeStatus(task.assignedTo, 'error');
        store.addEmployeeLog(task.assignedTo, `✗ Failed: ${errorMsg}`);

        store.addMessage({
          from: task.assignedTo,
          type: 'error',
          content: `Task failed: ${errorMsg}`,
          metadata: { taskId: task.id, employeeName: task.assignedTo },
        });

        return {
          taskId: task.id,
          status: 'rejected' as const,
          error: errorMsg,
        };
      }
    });

    const results = await Promise.allSettled(taskPromises);

    // Process results - handle partial failures
    const processedResults: TaskExecutionResult[] = results.map((r): TaskExecutionResult =>
      r.status === 'fulfilled'
        ? r.value
        : {
            taskId: 'unknown',
            status: 'rejected',
            error: 'Promise rejected',
          }
    );

    const failedTasks = processedResults.filter(
      (r) => r.status === 'rejected' || r.status === 'failed'
    );
    const succeededTasks = processedResults.filter(
      (r) => r.status === 'fulfilled'
    );
    const skippedTasks = processedResults.filter((r) => r.status === 'skipped');

    // Report partial success/failure
    if (failedTasks.length > 0 && succeededTasks.length > 0) {
      store.addMessage({
        from: 'system',
        type: 'warning',
        content: `⚠️ Partial completion: ${succeededTasks.length} task(s) succeeded, ${failedTasks.length} task(s) failed`,
      });
    }

    if (skippedTasks.length > 0) {
      store.addMessage({
        from: 'system',
        type: 'system',
        content: `⏸️ ${skippedTasks.length} task(s) skipped due to mission pause`,
      });
    }

  }

  /**
   * Execute a task using a specific AI employee
   * SECURITY: Uses sandwich defense and validates output
   */
  private async executeWithEmployee(
    employee: AIEmployee,
    task: Task,
    originalContext: string,
    sessionId?: string,
    userId?: string
  ): Promise<string> {
    const prompt = `Original request: ${originalContext}

Your specific task: ${task.description}

${task.toolRequired ? `Tool to use: ${task.toolRequired}` : ''}

Please complete this task according to your role and capabilities.`;

    try {
      // Use withTimeout from shared utilities for consistent timeout handling
      const TASK_TIMEOUT = 120000; // 2 minutes

      // SECURITY: Build secure messages with sandwich defense
      const secureMessages = buildSecureMessages(
        employee.systemPrompt,
        prompt,
        employee.name
      );

      const executionPromise = retryWithBackoff(
        () =>
          unifiedLLMService.sendMessage({
            provider: 'anthropic',
            messages: secureMessages,
            model:
              employee.model === 'inherit'
                ? 'claude-3-5-sonnet-20241022'
                : employee.model,
            temperature: 0.7,
            userId,
            sessionId,
          }),
        {
          maxRetries: 3,
        }
      );

      const response = await withTimeout(
        executionPromise,
        TASK_TIMEOUT,
        `Task execution timeout after ${TASK_TIMEOUT / 1000} seconds`
      );

      // SECURITY: Validate employee output for data leakage
      const outputValidation = validateEmployeeOutput(
        response.content,
        employee.name
      );
      if (!outputValidation.isValid) {
        logger.warn(
          `[Workforce Orchestrator] Output validation issues for ${employee.name}:`,
          outputValidation.issues
        );
        // Use sanitized output if there were issues
        if (outputValidation.sanitizedOutput) {
          response.content = outputValidation.sanitizedOutput;
        }
      }

      // Track token usage
      if (response.usage && userId) {
        await tokenLogger.logTokenUsage(
          response.model,
          response.usage.totalTokens,
          userId,
          sessionId,
          employee.name,
          employee.name,
          response.usage.promptTokens,
          response.usage.completionTokens,
          `Task execution: ${task.description.slice(0, 100)}`
        );

        // Update vibe session if sessionId provided
        if (sessionId) {
          const cost = tokenLogger.calculateCost(
            response.model,
            response.usage.promptTokens,
            response.usage.completionTokens
          );
          await updateVibeSessionTokens(
            sessionId,
            response.usage.promptTokens,
            response.usage.completionTokens,
            cost
          );
        }
      }

      return response.content;
    } catch (error) {
      const userMessage = getErrorMessage(error);
      throw new AppError(
        `Employee execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCodes.TASK_EXECUTION_FAILED,
        500,
        isRetryableError(error),
        `${employee.name} encountered an error: ${userMessage}`
      );
    }
  }

  /**
   * Get current status
   * @returns Current mission store state
   */
  getStatus(): ReturnType<typeof useMissionStore.getState> {
    return useMissionStore.getState();
  }

  /**
   * Pause current mission
   */
  pauseMission(): void {
    useMissionStore.getState().pauseMission();
  }

  /**
   * Resume paused mission
   */
  resumeMission(): void {
    useMissionStore.getState().resumeMission();
  }

  /**
   * Reset mission state
   */
  reset(): void {
    useMissionStore.getState().reset();
  }

  /**
   * CHAT MODE: Process conversational chat request
   * Auto-selects best employee(s) and initiates multi-agent conversation if needed
   */
  private async processChatRequest(
    request: WorkforceRequest,
    missionId: string
  ): Promise<WorkforceResponse> {
    const store = useMissionStore.getState();

    store.startMission(missionId);
    store.addMessage({
      from: 'user',
      type: 'user',
      content: request.input,
    });

    try {
      // AUTO-SELECT: Analyze query and select best employee(s)
      const selectedEmployees = await this.autoSelectEmployees(
        request.input,
        request.sessionId,
        request.userId
      );

      if (selectedEmployees.length === 0) {
        throw new AppError(
          'No suitable employees found for this request',
          ErrorCodes.EMPLOYEE_NOT_FOUND,
          404,
          false,
          'No AI employees are available to handle your request. Please try a different request or hire additional employees.'
        );
      }

      // Show selected team to user
      store.addMessage({
        from: 'system',
        type: 'system',
        content: `🤖 **Selected team:** ${selectedEmployees.map((e) => e.name).join(', ')}`,
      });

      // Update employee statuses
      selectedEmployees.forEach((employee) => {
        store.updateEmployeeStatus(
          employee.name,
          'thinking',
          null,
          'Analyzing query'
        );
      });

      // Start multi-agent conversation protocol

      const conversationResult =
        await agentConversationProtocol.startConversation(
          request.input,
          selectedEmployees,
          request.userId
        );

      // Display conversation to user (all agent messages are already in store via protocol)
      // Add final answer
      store.addMessage({
        from: 'system',
        type: 'assistant',
        content: conversationResult.finalAnswer,
        metadata: {
          conversationMetadata: conversationResult.metadata,
        },
      });

      // Update all employees to idle
      selectedEmployees.forEach((employee) => {
        store.updateEmployeeStatus(employee.name, 'idle');
      });

      store.completeMission();

      return {
        success: true,
        missionId,
        chatResponse: conversationResult.finalAnswer,
        mode: 'chat',
      };
    } catch (error) {
      const technicalMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const userMessage = getErrorMessage(error);
      logger.error('[Workforce Orchestrator] Error processing chat request:', technicalMessage);

      store.failMission(userMessage);
      store.addMessage({
        from: 'system',
        type: 'error',
        content: `❌ Chat failed: ${userMessage}`,
      });

      return {
        success: false,
        error: userMessage,
        mode: 'chat',
      };
    }
  }

  /**
   * AUTO-SELECT: Automatically select best employee(s) for a query
   * Uses LLM to analyze query and match with employee capabilities
   */
  private async autoSelectEmployees(
    query: string,
    sessionId?: string,
    userId?: string
  ): Promise<AIEmployee[]> {
    // Build employee directory
    const employeeDirectory = this.employees
      .map((e) => `- ${e.name}: ${e.description}`)
      .join('\n');

    const selectionPrompt = `Analyze this user query and select the BEST AI employee(s) to answer it.

**User Query:** ${query}

**Available Employees:**
${employeeDirectory}

**Instructions:**
- Select 1-3 employees maximum
- Choose employees whose expertise directly matches the query
- If query is simple, select only ONE employee
- If query requires multiple areas of expertise, select 2-3 employees
- Return ONLY employee names, comma-separated, nothing else

**Examples:**
Query: "Review my code for bugs" → Answer: "code-reviewer"
Query: "Build a login system and make it secure" → Answer: "backend-engineer, code-reviewer"
Query: "Help me learn Python" → Answer: "expert-tutor"

**Your selection (names only, comma-separated):**`;

    try {
      const response = await retryWithBackoff(
        () =>
          unifiedLLMService.sendMessage(
            [{ role: 'user', content: selectionPrompt }],
            sessionId,
            userId,
            'anthropic'
          ),
        {
          maxRetries: 3,
        }
      );

      // Track token usage
      if (response.usage && userId) {
        await tokenLogger.logTokenUsage(
          response.model,
          response.usage.totalTokens,
          userId,
          sessionId,
          'auto-selector',
          'Auto Selector',
          response.usage.promptTokens,
          response.usage.completionTokens,
          'Auto-selecting employees for query'
        );

        // Update vibe session if sessionId provided
        if (sessionId) {
          const cost = tokenLogger.calculateCost(
            response.model,
            response.usage.promptTokens,
            response.usage.completionTokens
          );
          await updateVibeSessionTokens(
            sessionId,
            response.usage.promptTokens,
            response.usage.completionTokens,
            cost
          );
        }
      }

      // Parse response to extract employee names
      const selectedNames = response.content
        .split(',')
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0);

      // Match names to actual employees
      const selectedEmployees = selectedNames
        .map((name) =>
          this.employees.find((e) => e.name.toLowerCase() === name)
        )
        .filter((e): e is AIEmployee => e !== undefined);

      // Fallback: if no match, select first employee
      if (selectedEmployees.length === 0 && this.employees.length > 0) {
        logger.warn('[Workforce Orchestrator] Auto-select failed, using default employee');
        return [this.employees[0]];
      }

      return selectedEmployees;
    } catch (error) {
      logger.error('[Workforce Orchestrator] Auto-select failed:', error);
      // Fallback to first employee
      return this.employees.length > 0 ? [this.employees[0]] : [];
    }
  }

  /**
   * Select optimal employee for chat interaction
   * Uses simpler matching than full task delegation
   */
  private async selectEmployeeForChat(
    userMessage: string
  ): Promise<AIEmployee | null> {
    if (this.employees.length === 0) {
      return null;
    }

    // Simple keyword matching for chat mode
    const messageLower = userMessage.toLowerCase();
    let bestMatch: AIEmployee | null = null;
    let bestScore = 0;

    for (const employee of this.employees) {
      let score = 0;
      const descLower = employee.description.toLowerCase();

      // Score based on description relevance
      if (messageLower.includes('code') && descLower.includes('code'))
        score += 10;
      if (messageLower.includes('debug') && descLower.includes('debug'))
        score += 10;
      if (messageLower.includes('review') && descLower.includes('review'))
        score += 10;
      if (messageLower.includes('test') && descLower.includes('test'))
        score += 10;
      if (messageLower.includes('write') && descLower.includes('write'))
        score += 5;
      if (messageLower.includes('analyze') && descLower.includes('analyze'))
        score += 5;

      // General capability score
      score += employee.tools.length * 0.5;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = employee;
      }
    }

    // Return best match or first employee as fallback
    return bestMatch || this.employees[0];
  }

  /**
   * Route message to specific employee (for multi-agent chat)
   * SECURITY: Sanitizes input and validates output
   * @param employeeName - Name of the employee to route the message to
   * @param message - The message content to send
   * @param conversationHistory - Optional conversation history for context
   * @param sessionId - Optional session ID for tracking
   * @param userId - Optional user ID for authentication and logging
   * @returns The employee's response content
   */
  async routeMessageToEmployee(
    employeeName: string,
    message: string,
    conversationHistory?: ConversationHistoryMessage[],
    sessionId?: string,
    userId?: string
  ): Promise<string> {
    const employee = this.employees.find((e) => e.name === employeeName);

    if (!employee) {
      throw new AppError(
        `Employee ${employeeName} not found`,
        ErrorCodes.EMPLOYEE_NOT_FOUND,
        404,
        false,
        `The AI employee "${employeeName}" could not be found. Please select a different employee.`
      );
    }

    // SECURITY: Sanitize user message before processing
    const sanitizationResult = sanitizeEmployeeInput(
      message,
      userId || 'anonymous',
      {
        maxInputLength: 50000,
        applySandwichDefense: true,
        blockThreshold: 'high',
        employeeName: employee.name,
      }
    );

    if (sanitizationResult.blocked) {
      logger.warn(
        `[Workforce Orchestrator] Message to ${employee.name} blocked:`,
        sanitizationResult.blockReason
      );
      throw new AppError(
        'Message blocked due to security concerns',
        ErrorCodes.VALIDATION_ERROR,
        400,
        false,
        'Your message was blocked for security reasons. Please rephrase without attempting to manipulate AI behavior.'
      );
    }

    const sanitizedMessage = sanitizationResult.sanitized;

    const store = useMissionStore.getState();

    store.updateEmployeeStatus(
      employee.name,
      'thinking',
      null,
      'Processing message'
    );

    try {
      // SECURITY: Build secure messages with sandwich defense
      const secureMessages = buildSecureMessages(
        employee.systemPrompt,
        sanitizedMessage,
        employee.name,
        conversationHistory
      );

      const response = await retryWithBackoff(
        () =>
          unifiedLLMService.sendMessage({
            provider: 'anthropic',
            messages: secureMessages,
            model:
              employee.model === 'inherit'
                ? 'claude-3-5-sonnet-20241022'
                : employee.model,
            temperature: 0.7,
            userId,
            sessionId,
          }),
        {
          maxRetries: 3,
        }
      );

      // SECURITY: Validate output for data leakage
      const outputValidation = validateEmployeeOutput(
        response.content,
        employee.name
      );
      let finalContent = response.content;

      if (!outputValidation.isValid) {
        logger.warn(
          `[Workforce Orchestrator] Output validation issues for ${employee.name}:`,
          outputValidation.issues
        );
        if (outputValidation.sanitizedOutput) {
          finalContent = outputValidation.sanitizedOutput;
        }
      }

      // Track token usage
      if (response.usage && userId) {
        await tokenLogger.logTokenUsage(
          response.model,
          response.usage.totalTokens,
          userId,
          sessionId,
          employee.name,
          employee.name,
          response.usage.promptTokens,
          response.usage.completionTokens,
          `Routing message to ${employee.name}`
        );

        // Update vibe session if sessionId provided
        if (sessionId) {
          const cost = tokenLogger.calculateCost(
            response.model,
            response.usage.promptTokens,
            response.usage.completionTokens
          );
          await updateVibeSessionTokens(
            sessionId,
            response.usage.promptTokens,
            response.usage.completionTokens,
            cost
          );
        }
      }

      store.updateEmployeeStatus(employee.name, 'idle');
      store.addEmployeeLog(
        employee.name,
        `Responded to: ${sanitizedMessage.slice(0, 50)}...`
      );

      return finalContent;
    } catch (error) {
      store.updateEmployeeStatus(employee.name, 'error');
      throw error;
    }
  }

  /**
   * Get available employees for multi-agent chat
   */
  getAvailableEmployees(): AIEmployee[] {
    return this.employees;
  }

  /**
   * Check if employees are loaded
   */
  areEmployeesLoaded(): boolean {
    return this.employeesLoaded;
  }
}

// Export singleton instance
export const workforceOrchestratorRefactored =
  new WorkforceOrchestratorRefactored();

// Export convenience function
export async function executeWorkforce(
  userId: string,
  input: string,
  context?: Record<string, unknown>
): Promise<WorkforceResponse> {
  return workforceOrchestratorRefactored.processRequest({
    userId,
    input,
    context,
  });
}
