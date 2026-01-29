/**
 * Agent Conversation Protocol
 * Manages multi-agent conversations with loop prevention and quality monitoring
 * SECURITY: Includes prompt injection defense for multi-agent conversations
 */

import { unifiedLLMService } from '../llm/unified-language-model';
import type { AIEmployee } from '@core/types/ai-employee';
import { useMissionStore } from '@shared/stores/mission-control-store';
import { logger } from '@shared/lib/logger';
// SECURITY: Import prompt injection defense
import {
  sanitizeEmployeeInput,
  buildSecureMessages,
  validateEmployeeOutput,
} from '@core/security/employee-input-sanitizer';

export interface AgentMessage {
  id: string;
  employeeName: string;
  employeeAvatar?: string;
  content: string;
  timestamp: Date;
  role: 'agent' | 'supervisor' | 'user';
  metadata?: {
    model?: string;
    tokens?: number;
  };
}

export interface ConversationState {
  id: string;
  userQuery: string;
  participants: AIEmployee[];
  messages: AgentMessage[];
  turnCount: number;
  isComplete: boolean;
  finalAnswer?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface ConversationResult {
  success: boolean;
  finalAnswer: string;
  conversation: AgentMessage[];
  metadata: {
    turnCount: number;
    participantCount: number;
    duration: number;
    wasInterrupted: boolean;
    loopDetected: boolean;
  };
}

const MAX_TURNS = 10;
const MAX_REPETITION_THRESHOLD = 0.85; // 85% similarity = repetition

export class AgentConversationProtocol {
  private activeConversations: Map<string, ConversationState> = new Map();

  /**
   * Start a new multi-agent conversation
   * SECURITY: Sanitizes user input before processing
   */
  async startConversation(
    userQuery: string,
    participants: AIEmployee[],
    userId?: string
  ): Promise<ConversationResult> {
    const conversationId = crypto.randomUUID();
    const startTime = Date.now();

    // SECURITY: Sanitize user query before processing
    const sanitizationResult = sanitizeEmployeeInput(
      userQuery,
      userId || 'anonymous',
      {
        maxInputLength: 50000,
        applySandwichDefense: true,
        blockThreshold: 'high',
      }
    );

    if (sanitizationResult.blocked) {
      logger.warn(
        '[Agent Conversation] Input blocked:',
        sanitizationResult.blockReason
      );
      return {
        success: false,
        finalAnswer:
          'Your request was blocked for security reasons. Please rephrase your request without attempting to manipulate AI behavior.',
        conversation: [],
        metadata: {
          turnCount: 0,
          participantCount: participants.length,
          duration: Date.now() - startTime,
          wasInterrupted: true,
          loopDetected: false,
        },
      };
    }

    // Use sanitized query
    const sanitizedQuery = sanitizationResult.sanitized;

    const state: ConversationState = {
      id: conversationId,
      userQuery: sanitizedQuery, // Use sanitized query
      participants,
      messages: [],
      turnCount: 0,
      isComplete: false,
      startedAt: new Date(),
    };

    this.activeConversations.set(conversationId, state);

    try {
      // Add initial user message
      this.addMessage(state, {
        id: crypto.randomUUID(),
        employeeName: 'User',
        content: sanitizedQuery, // Use sanitized query
        timestamp: new Date(),
        role: 'user',
      });

      // If only one participant, direct response
      if (participants.length === 1) {
        const response = await this.getSingleEmployeeResponse(
          participants[0],
          userQuery,
          userId
        );

        this.addMessage(state, {
          id: crypto.randomUUID(),
          employeeName: participants[0].name,
          employeeAvatar: this.getEmployeeAvatar(participants[0]),
          content: response,
          timestamp: new Date(),
          role: 'agent',
          metadata: { model: participants[0].model },
        });

        state.isComplete = true;
        state.finalAnswer = response;
        state.completedAt = new Date();

        return this.createResult(state, startTime);
      }

      // Multi-agent conversation with supervisor
      const supervisor = this.createSupervisor();
      const result = await this.orchestrateConversation(
        state,
        supervisor,
        userId
      );

      return result;
    } catch (error) {
      logger.error('[Agent Conversation] Error:', error);

      return {
        success: false,
        finalAnswer: `I apologize, but I encountered an error while coordinating the response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        conversation: state.messages,
        metadata: {
          turnCount: state.turnCount,
          participantCount: participants.length,
          duration: Date.now() - startTime,
          wasInterrupted: true,
          loopDetected: false,
        },
      };
    } finally {
      this.activeConversations.delete(conversationId);
    }
  }

  /**
   * Orchestrate multi-agent conversation with supervisor
   */
  private async orchestrateConversation(
    state: ConversationState,
    supervisor: AIEmployee,
    userId?: string
  ): Promise<ConversationResult> {
    const startTime = Date.now();
    let loopDetected = false;

    // Supervisor analyzes query and plans coordination
    const coordinationPlan = await this.getSupervisorAnalysis(
      state,
      supervisor,
      userId
    );

    this.addMessage(state, {
      id: crypto.randomUUID(),
      employeeName: 'Supervisor',
      content: `**Coordinating team:** ${state.participants.map((p) => p.name).join(', ')}\n\n${coordinationPlan}`,
      timestamp: new Date(),
      role: 'supervisor',
      metadata: { model: supervisor.model },
    });

    // Coordinate conversation between agents
    while (state.turnCount < MAX_TURNS && !state.isComplete) {
      state.turnCount++;

      // Update UI with current turn
      useMissionStore.getState().addMessage({
        id: crypto.randomUUID(),
        type: 'status',
        content: `Turn ${state.turnCount}/${MAX_TURNS}`,
        timestamp: new Date(),
      });

      // Check for completion signals
      if (this.hasCompletionSignal(state)) {
        state.isComplete = true;
        break;
      }

      // Check for loops
      if (this.detectLoop(state)) {
        loopDetected = true;
        logger.warn('[Agent Conversation] Loop detected, ending conversation');

        this.addMessage(state, {
          id: crypto.randomUUID(),
          employeeName: 'Supervisor',
          content:
            '**Loop detected.** Synthesizing final answer from current discussion.',
          timestamp: new Date(),
          role: 'supervisor',
        });

        break;
      }

      // Get next employee's contribution
      const nextEmployee = this.selectNextEmployee(state);
      if (!nextEmployee) break;

      const response = await this.getEmployeeContribution(
        nextEmployee,
        state,
        userId
      );

      this.addMessage(state, {
        id: crypto.randomUUID(),
        employeeName: nextEmployee.name,
        employeeAvatar: this.getEmployeeAvatar(nextEmployee),
        content: response,
        timestamp: new Date(),
        role: 'agent',
        metadata: { model: nextEmployee.model },
      });

      // Update mission control UI
      useMissionStore.getState().addEmployeeLog(nextEmployee.name, {
        timestamp: new Date(),
        message: response,
        type: 'contribution',
      });
    }

    // Supervisor synthesizes final answer
    const finalAnswer = await this.synthesizeFinalAnswer(
      state,
      supervisor,
      userId
    );

    this.addMessage(state, {
      id: crypto.randomUUID(),
      employeeName: 'Supervisor',
      content: `**FINAL ANSWER:**\n\n${finalAnswer}`,
      timestamp: new Date(),
      role: 'supervisor',
    });

    state.isComplete = true;
    state.finalAnswer = finalAnswer;
    state.completedAt = new Date();

    return this.createResult(state, startTime, loopDetected);
  }

  /**
   * Get supervisor's analysis and coordination plan
   */
  private async getSupervisorAnalysis(
    state: ConversationState,
    supervisor: AIEmployee,
    userId?: string
  ): Promise<string> {
    const prompt = `You are coordinating a team to answer this user query:

**User Query:** ${state.userQuery}

**Available Team:**
${state.participants.map((p) => `- ${p.name}: ${p.description}`).join('\n')}

Analyze the query and provide a coordination plan. Keep it brief (2-3 sentences).`;

    const response = await unifiedLLMService.sendMessage(
      [
        { role: 'system', content: supervisor.systemPrompt },
        { role: 'user', content: prompt },
      ],
      state.id,
      userId,
      'anthropic'
    );

    return response.content;
  }

  /**
   * Get employee's contribution to the conversation
   * SECURITY: Uses sandwich defense and validates output
   */
  private async getEmployeeContribution(
    employee: AIEmployee,
    state: ConversationState,
    userId?: string
  ): Promise<string> {
    // Build conversation context
    const conversationContext = state.messages
      .slice(-5) // Last 5 messages for context
      .map((m) => `${m.employeeName}: ${m.content}`)
      .join('\n\n');

    const prompt = `You are ${employee.name} contributing to a team discussion.

**Original Query:** ${state.userQuery}

**Conversation so far:**
${conversationContext}

Provide your expertise. Be concise (2-3 sentences). If you're done, end with "DONE".`;

    // SECURITY: Build secure messages with sandwich defense
    const secureMessages = buildSecureMessages(
      employee.systemPrompt,
      prompt,
      employee.name
    );

    const response = await unifiedLLMService.sendMessage(
      secureMessages,
      state.id,
      userId,
      this.getEmployeeProvider(employee)
    );

    // SECURITY: Validate output for data leakage
    const outputValidation = validateEmployeeOutput(
      response.content,
      employee.name
    );
    if (!outputValidation.isValid) {
      logger.warn(
        `[Agent Conversation] Output validation issues for ${employee.name}:`,
        outputValidation.issues
      );
      if (outputValidation.sanitizedOutput) {
        return outputValidation.sanitizedOutput;
      }
    }

    return response.content;
  }

  /**
   * Get single employee response (no conversation needed)
   * SECURITY: Uses sandwich defense and validates output
   */
  private async getSingleEmployeeResponse(
    employee: AIEmployee,
    query: string,
    userId?: string
  ): Promise<string> {
    // SECURITY: Build secure messages with sandwich defense
    const secureMessages = buildSecureMessages(
      employee.systemPrompt,
      query,
      employee.name
    );

    const response = await unifiedLLMService.sendMessage(
      secureMessages,
      crypto.randomUUID(),
      userId,
      this.getEmployeeProvider(employee)
    );

    // SECURITY: Validate output for data leakage
    const outputValidation = validateEmployeeOutput(
      response.content,
      employee.name
    );
    if (!outputValidation.isValid) {
      logger.warn(
        `[Agent Conversation] Output validation issues for ${employee.name}:`,
        outputValidation.issues
      );
      if (outputValidation.sanitizedOutput) {
        return outputValidation.sanitizedOutput;
      }
    }

    return response.content;
  }

  /**
   * Synthesize final answer from conversation
   */
  private async synthesizeFinalAnswer(
    state: ConversationState,
    supervisor: AIEmployee,
    userId?: string
  ): Promise<string> {
    const conversation = state.messages
      .filter((m) => m.role === 'agent')
      .map((m) => `${m.employeeName}: ${m.content}`)
      .join('\n\n');

    const prompt = `You coordinated a team discussion for this query:

**User Query:** ${state.userQuery}

**Team Discussion:**
${conversation}

Synthesize a clear, comprehensive final answer. Focus on directly answering the user's query.`;

    const response = await unifiedLLMService.sendMessage(
      [
        { role: 'system', content: supervisor.systemPrompt },
        { role: 'user', content: prompt },
      ],
      state.id,
      userId,
      'anthropic'
    );

    return response.content;
  }

  /**
   * Select next employee to contribute
   */
  private selectNextEmployee(state: ConversationState): AIEmployee | null {
    // Simple round-robin for now
    const lastAgentMessage = [...state.messages]
      .reverse()
      .find((m) => m.role === 'agent');

    if (!lastAgentMessage) {
      return state.participants[0];
    }

    const lastEmployeeName = lastAgentMessage.employeeName;
    const currentIndex = state.participants.findIndex(
      (p) => p.name === lastEmployeeName
    );

    if (currentIndex === -1) return state.participants[0];

    const nextIndex = (currentIndex + 1) % state.participants.length;
    return state.participants[nextIndex];
  }

  /**
   * Detect if conversation has completion signal
   */
  private hasCompletionSignal(state: ConversationState): boolean {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage) return false;

    const completionKeywords = ['DONE', 'COMPLETE', 'FINAL ANSWER'];
    return completionKeywords.some((keyword) =>
      lastMessage.content.toUpperCase().includes(keyword)
    );
  }

  /**
   * Detect conversation loops
   */
  private detectLoop(state: ConversationState): boolean {
    if (state.messages.length < 4) return false;

    const recentMessages = state.messages.slice(-4);
    const contents = recentMessages.map((m) => m.content);

    // Check if last two messages are very similar
    for (let i = 0; i < contents.length - 1; i++) {
      const similarity = this.calculateSimilarity(contents[i], contents[i + 1]);
      if (similarity > MAX_REPETITION_THRESHOLD) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Add message to conversation state
   */
  private addMessage(state: ConversationState, message: AgentMessage): void {
    state.messages.push(message);

    // Also update mission control store for real-time UI
    useMissionStore.getState().addMessage({
      id: message.id,
      type: 'agent',
      content: message.content,
      timestamp: message.timestamp,
      metadata: {
        employeeName: message.employeeName,
        employeeAvatar: message.employeeAvatar,
        role: message.role,
        ...message.metadata,
      },
    });
  }

  /**
   * Create final result
   */
  private createResult(
    state: ConversationState,
    startTime: number,
    loopDetected: boolean = false
  ): ConversationResult {
    return {
      success: true,
      finalAnswer: state.finalAnswer || 'No answer generated',
      conversation: state.messages,
      metadata: {
        turnCount: state.turnCount,
        participantCount: state.participants.length,
        duration: Date.now() - startTime,
        wasInterrupted: false,
        loopDetected,
      },
    };
  }

  /**
   * Get employee avatar (placeholder for now)
   */
  private getEmployeeAvatar(employee: AIEmployee): string {
    // TODO: Load from employee definition or generate
    return `/avatars/${employee.name.toLowerCase().replace(/\s+/g, '-')}.png`;
  }

  /**
   * Get LLM provider for employee
   */
  private getEmployeeProvider(
    employee: AIEmployee
  ): 'anthropic' | 'openai' | 'google' | 'perplexity' {
    // Determine provider from model name
    const model = employee.model?.toLowerCase() || '';

    if (model.includes('claude')) return 'anthropic';
    if (model.includes('gpt') || model.includes('openai')) return 'openai';
    if (model.includes('gemini') || model.includes('google')) return 'google';
    if (model.includes('perplexity') || model.includes('sonar'))
      return 'perplexity';

    // Default to anthropic
    return 'anthropic';
  }

  /**
   * Create supervisor employee
   */
  private createSupervisor(): AIEmployee {
    return {
      id: 'supervisor',
      name: 'Supervisor',
      description: 'Orchestrates multi-agent conversations',
      systemPrompt: `You are the Supervisor AI that coordinates multiple AI employees to solve user queries efficiently.`,
      model: 'claude-3-5-sonnet-20241022',
      tools: [],
      capabilities: ['coordination', 'synthesis', 'quality-control'],
      pricing: { inputCost: 0, outputCost: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// Export singleton
export const agentConversationProtocol = new AgentConversationProtocol();
