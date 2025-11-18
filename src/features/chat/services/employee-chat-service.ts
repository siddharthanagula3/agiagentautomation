/**
 * Employee Chat Service
 * Integrates chat interface with workforce orchestrator for dynamic employee selection
 * Implements MGX.dev multi-agent protocol for conversational AI
 * Supports multi-agent collaboration with supervisor pattern for complex tasks
 */

import { workforceOrchestratorRefactored } from '@core/ai/orchestration/workforce-orchestrator';
import { systemPromptsService } from '@core/ai/employees/prompt-management';
import { multiAgentCollaborationService } from './multi-agent-collaboration-service';
import type { AIEmployee } from '@core/types/ai-employee';
import { useMissionStore } from '@shared/stores/mission-control-store';

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

    console.log(`[EmployeeChatService] Loaded ${this.employees.length} employees`);
  }

  /**
   * Send a message with dynamic employee selection
   * Automatically detects complexity and routes to multi-agent collaboration if needed
   */
  async sendMessage(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    options?: {
      userId?: string;
      sessionId?: string;
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
    };
  }> {
    // Ensure employees are loaded
    await this.initialize();

    if (this.employees.length === 0) {
      throw new Error('No AI employees available. Please check .agi/employees/ directory.');
    }

    const store = useMissionStore.getState();

    // STEP 1: Analyze task complexity
    store.addMessage({
      from: 'system',
      type: 'status',
      content: '🔍 Analyzing task complexity...',
    });

    const complexity = await multiAgentCollaborationService.analyzeComplexity(userMessage);

    // STEP 2: Route based on complexity
    if (complexity.isComplex) {
      // COMPLEX TASK: Multi-agent collaboration
      return await this.handleComplexTask(userMessage, conversationHistory, complexity.reason);
    } else {
      // SIMPLE TASK: Single employee
      return await this.handleSimpleTask(userMessage, conversationHistory, complexity.reason);
    }
  }

  /**
   * Handle simple tasks with single employee
   */
  private async handleSimpleTask(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    complexityReason: string
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

    // Show that it's a simple task
    store.addMessage({
      from: 'system',
      type: 'status',
      content: `✓ Simple task - selecting single employee...`,
    });

    const selection = await this.selectEmployeeForMessage(userMessage, conversationHistory);

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
      thinkingSteps.push(`Analyzing query with ${selection.employee.description}`);

      const response = await workforceOrchestratorRefactored.routeMessageToEmployee(
        selection.employee.name,
        userMessage,
        conversationHistory
      );

      store.updateEmployeeStatus(selection.employee.name, 'idle');

      thinkingSteps.push('Response generated successfully');

      return {
        response,
        selectedEmployee: selection.employee,
        selectionReason: selection.reason,
        thinkingSteps,
        metadata: {
          model: selection.employee.model === 'inherit'
            ? 'claude-3-5-sonnet-20241022'
            : selection.employee.model,
          isMultiAgent: false
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
      'Selecting optimal team of AI employees'
    ];

    try {
      // Run multi-agent collaboration
      const collaboration = await multiAgentCollaborationService.collaborate(
        userMessage,
        conversationHistory
      );

      // Show assigned team
      const employeeNames = collaboration.employeesInvolved.map(e => e.name).join(', ');
      store.addMessage({
        from: 'system',
        type: 'status',
        content: `👥 **Team assembled:** ${employeeNames}`,
      });

      // Update all employee statuses
      collaboration.employeesInvolved.forEach(emp => {
        store.updateEmployeeStatus(emp.name, 'thinking', null, 'Contributing expertise');
      });

      thinkingSteps.push(`Team assembled: ${employeeNames}`);
      thinkingSteps.push('Employees collaborating...');

      // Convert collaboration messages to chat messages
      const collaborationMessages: EmployeeChatMessage[] = collaboration.collaborationMessages.map(msg => ({
        role: 'collaboration' as const,
        content: msg.content,
        employeeName: msg.from,
        employeeAvatar: msg.fromAvatar,
        to: msg.to,
        messageType: msg.type,
        metadata: {
          isMultiAgent: true
        }
      }));

      // Show collaboration messages in the UI
      collaboration.collaborationMessages.forEach(msg => {
        const label = msg.type === 'synthesis'
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
            isCollaboration: true
          }
        });
      });

      // Update all employees to idle
      collaboration.employeesInvolved.forEach(emp => {
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
          employeesInvolved: collaboration.employeesInvolved.map(e => e.name)
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

      return await this.handleSimpleTask(userMessage, conversationHistory, 'Fallback to single employee');
    }
  }

  /**
   * Select optimal employee based on message content
   * Uses keyword matching and employee expertise
   */
  private async selectEmployeeForMessage(
    message: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<EmployeeSelectionResult> {
    const messageLower = message.toLowerCase();

    // Build scoring map
    const scores = new Map<string, { score: number; reasons: string[] }>();

    for (const employee of this.employees) {
      let score = 0;
      const reasons: string[] = [];

      const descLower = employee.description.toLowerCase();
      const nameLower = employee.name.toLowerCase();

      // Keyword matching from description
      if (messageLower.includes('health') && descLower.includes('health')) {
        score += 15;
        reasons.push('health-related query');
      }
      if (messageLower.includes('medical') && descLower.includes('medical')) {
        score += 15;
        reasons.push('medical expertise');
      }
      if (messageLower.includes('code') && descLower.includes('code')) {
        score += 12;
        reasons.push('coding expertise');
      }
      if (messageLower.includes('debug') && descLower.includes('debug')) {
        score += 12;
        reasons.push('debugging skills');
      }
      if (messageLower.includes('design') && descLower.includes('design')) {
        score += 10;
        reasons.push('design expertise');
      }
      if (messageLower.includes('legal') && descLower.includes('legal')) {
        score += 15;
        reasons.push('legal knowledge');
      }
      if (messageLower.includes('finance') && descLower.includes('finance')) {
        score += 12;
        reasons.push('financial expertise');
      }
      if (messageLower.includes('business') && descLower.includes('business')) {
        score += 10;
        reasons.push('business knowledge');
      }
      if (messageLower.includes('marketing') && descLower.includes('marketing')) {
        score += 12;
        reasons.push('marketing expertise');
      }
      if (messageLower.includes('data') && descLower.includes('data')) {
        score += 10;
        reasons.push('data analysis');
      }

      // Check for specific role mentions
      if (messageLower.includes(nameLower.replace(/-/g, ' '))) {
        score += 20;
        reasons.push('directly mentioned');
      }

      // Tool availability bonus
      score += employee.tools.length * 0.5;

      // Context analysis from conversation history
      if (conversationHistory.length > 0) {
        const lastMessages = conversationHistory.slice(-3);
        const contextText = lastMessages.map((m) => m.content).join(' ').toLowerCase();

        if (contextText.includes(nameLower.replace(/-/g, ' '))) {
          score += 8;
          reasons.push('conversation continuity');
        }
      }

      if (score > 0) {
        scores.set(employee.name, { score, reasons });
      }
    }

    // Find best match
    let bestEmployee = this.employees[0];
    let bestScore = 0;
    let bestReasons: string[] = ['default general assistant'];

    scores.forEach((data, employeeName) => {
      if (data.score > bestScore) {
        const employee = this.employees.find((e) => e.name === employeeName);
        if (employee) {
          bestEmployee = employee;
          bestScore = data.score;
          bestReasons = data.reasons;
        }
      }
    });

    const confidence = Math.min(bestScore / 20, 1.0);
    const reason = bestReasons.length > 0
      ? bestReasons.slice(0, 2).join(', ')
      : 'general capabilities';

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
