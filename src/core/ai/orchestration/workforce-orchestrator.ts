/**
 * Workforce Orchestrator - REFACTORED with Plan-Delegate-Execute Loop
 * Implements autonomous AI workforce with file-based employee system
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import { systemPromptsService } from '@core/ai/employees/prompt-management';
import { useMissionStore } from '@shared/stores/mission-control-store';
import type { Task } from '@shared/stores/mission-control-store';
import type { AIEmployee } from '@core/types/ai-employee';
import { agentConversationProtocol } from './agent-conversation-protocol';

export interface WorkforceRequest {
  userId: string;
  input: string;
  context?: Record<string, unknown>;
  mode?: 'mission' | 'chat'; // NEW: Support chat mode
  sessionId?: string; // NEW: Chat session tracking
  conversationHistory?: Array<{ role: string; content: string }>; // NEW: Chat context
}

export interface WorkforceResponse {
  success: boolean;
  missionId?: string;
  plan?: Task[];
  error?: string;
  chatResponse?: string; // NEW: Direct chat response
  mode?: 'mission' | 'chat';
}

export interface PlanTask {
  task: string;
  tool_required?: string;
}

export interface MissionPlan {
  plan: PlanTask[];
  reasoning?: string;
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
      // Load employees if not already loaded
      if (!this.employeesLoaded) {
        this.employees = await systemPromptsService.getAvailableEmployees();
        this.employeesLoaded = true;
        console.log(
          `📋 Loaded ${this.employees.length} AI employees from .agi/employees/`
        );
      }

      // CHAT MODE: Direct conversational response
      if (mode === 'chat') {
        return await this.processChatRequest(request, missionId);
      }

      // MISSION MODE: Full Plan-Delegate-Execute
      store.startMission(missionId);
      store.addMessage({
        from: 'user',
        type: 'user',
        content: request.input,
      });

      // ============================================
      // STAGE 1: PLANNING - Generate structured plan
      // ============================================
      console.log('🧠 STAGE 1: PLANNING...');
      store.addMessage({
        from: 'system',
        type: 'system',
        content: '🧠 Analyzing request and creating execution plan...',
      });

      const plan = await this.generatePlan(request.input);

      if (!plan || plan.plan.length === 0) {
        throw new Error('Failed to generate execution plan');
      }

      console.log('📋 Generated plan with', plan.plan.length, 'tasks');

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
      console.log('🤖 STAGE 2: DELEGATION...');
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

          console.log(
            `  ✓ Task "${task.description}" → ${selectedEmployee.name}`
          );
          store.addMessage({
            from: 'system',
            type: 'task_update',
            content: `✓ Assigned "${task.description}" to ${selectedEmployee.name}`,
            metadata: { taskId: task.id, employeeName: selectedEmployee.name },
          });
        } else {
          console.warn(
            `  ⚠️ No suitable employee for task: ${task.description}`
          );
        }
      }

      // ============================================
      // STAGE 3: EXECUTION - Execute tasks
      // ============================================
      console.log('⚡ STAGE 3: EXECUTION...');
      store.addMessage({
        from: 'system',
        type: 'system',
        content: '⚡ Beginning task execution...',
      });

      await this.executeTasks(tasks, request.input);

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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error processing request:', errorMessage);

      store.failMission(errorMessage);
      store.addMessage({
        from: 'system',
        type: 'error',
        content: `❌ Mission failed: ${errorMessage}`,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * PLANNING STAGE: Generate structured plan using LLM
   */
  private async generatePlan(userInput: string): Promise<MissionPlan> {
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
      const response = await unifiedLLMService.sendMessage({
        provider: 'anthropic',
        messages: [{ role: 'user', content: plannerPrompt }],
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
      });

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = response.content.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }

      const plan = JSON.parse(jsonText) as MissionPlan;
      return plan;
    } catch (error) {
      console.error('Error generating plan:', error);
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
      console.warn('No employees available');
      return null;
    }

    // Simple matching: find employee whose description best matches the task
    let bestMatch: AIEmployee | null = null;
    let bestScore = 0;

    for (const employee of this.employees) {
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
    return bestMatch || this.employees[0] || null;
  }

  /**
   * EXECUTION STAGE: Execute all tasks
   */
  private async executeTasks(
    tasks: Task[],
    originalInput: string
  ): Promise<void> {
    const store = useMissionStore.getState();

    for (const task of tasks) {
      if (!task.assignedTo) {
        store.updateTaskStatus(
          task.id,
          'failed',
          undefined,
          undefined,
          'No employee assigned'
        );
        continue;
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
          throw new Error(`Employee ${task.assignedTo} not found`);
        }

        // Execute using employee's system prompt
        const result = await this.executeWithEmployee(
          employee,
          task,
          originalInput
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
      }
    }
  }

  /**
   * Execute a task using a specific AI employee
   */
  private async executeWithEmployee(
    employee: AIEmployee,
    task: Task,
    originalContext: string
  ): Promise<string> {
    const prompt = `Original request: ${originalContext}

Your specific task: ${task.description}

${task.toolRequired ? `Tool to use: ${task.toolRequired}` : ''}

Please complete this task according to your role and capabilities.`;

    try {
      const response = await unifiedLLMService.sendMessage({
        provider: 'anthropic',
        messages: [
          { role: 'system', content: employee.systemPrompt },
          { role: 'user', content: prompt },
        ],
        model:
          employee.model === 'inherit'
            ? 'claude-3-5-sonnet-20241022'
            : employee.model,
        temperature: 0.7,
      });

      return response.content;
    } catch (error) {
      throw new Error(
        `Employee execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return useMissionStore.getState();
  }

  /**
   * Pause current mission
   */
  pauseMission() {
    useMissionStore.getState().pauseMission();
  }

  /**
   * Resume paused mission
   */
  resumeMission() {
    useMissionStore.getState().resumeMission();
  }

  /**
   * Reset mission state
   */
  reset() {
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
      const selectedEmployees = await this.autoSelectEmployees(request.input);

      if (selectedEmployees.length === 0) {
        throw new Error('No suitable employees found for this request');
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
      console.log(
        `🗣️ Starting conversation with ${selectedEmployees.length} employee(s)`
      );

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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error processing chat request:', errorMessage);

      store.failMission(errorMessage);
      store.addMessage({
        from: 'system',
        type: 'error',
        content: `❌ Chat failed: ${errorMessage}`,
      });

      return {
        success: false,
        error: errorMessage,
        mode: 'chat',
      };
    }
  }

  /**
   * AUTO-SELECT: Automatically select best employee(s) for a query
   * Uses LLM to analyze query and match with employee capabilities
   */
  private async autoSelectEmployees(query: string): Promise<AIEmployee[]> {
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
      const response = await unifiedLLMService.sendMessage(
        [{ role: 'user', content: selectionPrompt }],
        undefined,
        undefined,
        'anthropic'
      );

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
        console.warn('⚠️ Auto-select failed, using default employee');
        return [this.employees[0]];
      }

      console.log(
        `✅ Auto-selected ${selectedEmployees.length} employee(s):`,
        selectedEmployees.map((e) => e.name)
      );

      return selectedEmployees;
    } catch (error) {
      console.error('❌ Auto-select failed:', error);
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
   */
  async routeMessageToEmployee(
    employeeName: string,
    message: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    const employee = this.employees.find((e) => e.name === employeeName);

    if (!employee) {
      throw new Error(`Employee ${employeeName} not found`);
    }

    const store = useMissionStore.getState();

    store.updateEmployeeStatus(
      employee.name,
      'thinking',
      null,
      'Processing message'
    );

    try {
      const conversationMessages = [
        { role: 'system', content: employee.systemPrompt },
        ...(conversationHistory || []),
        { role: 'user', content: message },
      ];

      const response = await unifiedLLMService.sendMessage({
        provider: 'anthropic',
        messages: conversationMessages,
        model:
          employee.model === 'inherit'
            ? 'claude-3-5-sonnet-20241022'
            : employee.model,
        temperature: 0.7,
      });

      store.updateEmployeeStatus(employee.name, 'idle');
      store.addEmployeeLog(
        employee.name,
        `Responded to: ${message.slice(0, 50)}...`
      );

      return response.content;
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
