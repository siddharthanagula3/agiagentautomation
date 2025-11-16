/**
 * Enhanced Agent Collaboration Manager
 * Manages multi-agent coordination, message routing, and collaborative task execution
 *
 * Features:
 * - Multi-agent coordination protocols
 * - Agent-to-agent communication
 * - Task delegation and handoff
 * - Collaborative decision making
 * - Real-time status synchronization
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import { systemPromptsService } from '@core/ai/employees/prompt-management';
import { useMultiAgentChatStore } from '@shared/stores/multi-agent-chat-store';
import type { AIEmployee } from '@core/types/ai-employee';
import type {
  ChatMessage,
  ConversationParticipant,
  AgentPresence,
} from '@shared/stores/multi-agent-chat-store';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Agent communication message types
 */
export type AgentMessageType =
  | 'task_assignment'
  | 'task_request'
  | 'task_completion'
  | 'question'
  | 'answer'
  | 'handoff'
  | 'collaboration_request'
  | 'status_update'
  | 'error_report';

/**
 * Agent communication protocol message
 */
export interface AgentCommunicationMessage {
  id: string;
  type: AgentMessageType;
  fromAgentId: string;
  toAgentId: string;
  conversationId: string;
  content: string;
  metadata?: {
    taskId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    requiresResponse?: boolean;
    relatedMessages?: string[];
    context?: Record<string, unknown>;
  };
  timestamp: Date;
}

/**
 * Collaborative task
 */
export interface CollaborativeTask {
  id: string;
  description: string;
  conversationId: string;
  assignedAgents: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[]; // IDs of tasks that must complete first
  result?: unknown;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
}

/**
 * Agent collaboration context
 */
export interface CollaborationContext {
  conversationId: string;
  activeAgents: ConversationParticipant[];
  tasks: CollaborativeTask[];
  messages: AgentCommunicationMessage[];
  sharedContext: Record<string, unknown>;
}

/**
 * Agent capability assessment
 */
export interface AgentCapabilityMatch {
  agentId: string;
  agentName: string;
  score: number; // 0-100
  strengths: string[];
  availability: boolean;
  currentLoad: number; // Number of active tasks
}

// ============================================================================
// AGENT COLLABORATION MANAGER CLASS
// ============================================================================

export class EnhancedAgentCollaborationManager {
  private employees: AIEmployee[] = [];
  private employeesLoaded = false;
  private activeCollaborations: Map<string, CollaborationContext> = new Map();
  private agentMessageQueue: Map<string, AgentCommunicationMessage[]> =
    new Map();

  /**
   * Initialize the collaboration manager
   */
  async initialize(): Promise<void> {
    if (!this.employeesLoaded) {
      this.employees = await systemPromptsService.getAvailableEmployees();
      this.employeesLoaded = true;
      console.log(
        `[CollaborationManager] Loaded ${this.employees.length} AI employees`
      );
    }
  }

  /**
   * Start a multi-agent collaboration session
   */
  async startCollaboration(
    conversationId: string,
    userRequest: string,
    preferredAgents?: string[]
  ): Promise<CollaborationContext> {
    await this.initialize();

    const store = useMultiAgentChatStore.getState();

    console.log(
      `[CollaborationManager] Starting collaboration for conversation ${conversationId}`
    );

    // Analyze request and select optimal agents
    const selectedAgents = preferredAgents
      ? this.getAgentsByIds(preferredAgents)
      : await this.selectOptimalAgents(userRequest);

    // Create collaboration context
    const context: CollaborationContext = {
      conversationId,
      activeAgents: selectedAgents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        type: 'agent' as const,
        role: agent.role,
        status: 'online' as const,
        lastSeen: new Date(),
        isTyping: false,
      })),
      tasks: [],
      messages: [],
      sharedContext: {
        userRequest,
        startTime: new Date(),
      },
    };

    this.activeCollaborations.set(conversationId, context);

    // Add agents as participants in the chat store
    for (const agent of context.activeAgents) {
      store.addParticipant(conversationId, agent);

      // Update agent presence
      this.updateAgentPresence(agent.id, agent.name, 'online', userRequest);
    }

    // Break down the request into collaborative tasks
    const tasks = await this.breakDownIntoCollaborativeTasks(
      userRequest,
      selectedAgents
    );
    context.tasks = tasks;

    console.log(
      `[CollaborationManager] Created ${tasks.length} tasks for ${selectedAgents.length} agents`
    );

    return context;
  }

  /**
   * Execute a collaborative task with multiple agents
   */
  async executeCollaborativeTask(
    task: CollaborativeTask,
    context: CollaborationContext
  ): Promise<unknown> {
    const store = useMultiAgentChatStore.getState();

    console.log(`[CollaborationManager] Executing task: ${task.description}`);

    task.status = 'in_progress';
    task.startedAt = new Date();

    try {
      // Check if task has multiple agents assigned
      if (task.assignedAgents.length === 1) {
        // Single agent execution
        const agentId = task.assignedAgents[0];
        const agent = context.activeAgents.find((a) => a.id === agentId);
        if (!agent) {
          throw new Error(`Agent ${agentId} not found in context`);
        }

        const result = await this.executeSingleAgentTask(task, agent, context);

        task.status = 'completed';
        task.completedAt = new Date();
        task.result = result;

        return result;
      } else {
        // Multi-agent collaboration
        const results = await this.executeMultiAgentTask(task, context);

        task.status = 'completed';
        task.completedAt = new Date();
        task.result = results;

        return results;
      }
    } catch (error) {
      console.error(`[CollaborationManager] Task execution failed:`, error);

      task.status = 'failed';
      task.completedAt = new Date();
      task.error = error instanceof Error ? error.message : 'Unknown error';

      throw error;
    }
  }

  /**
   * Execute a task with a single agent
   */
  private async executeSingleAgentTask(
    task: CollaborativeTask,
    agent: ConversationParticipant,
    context: CollaborationContext
  ): Promise<string> {
    const store = useMultiAgentChatStore.getState();

    // Update agent status
    this.updateAgentPresence(agent.id, agent.name, 'busy', task.description);

    // Set typing indicator
    store.setTypingIndicator(
      context.conversationId,
      agent.id,
      agent.name,
      true
    );

    try {
      // Get agent's employee data
      const employee = this.employees.find((e) => e.id === agent.id);
      if (!employee) {
        throw new Error(`Employee data not found for agent ${agent.id}`);
      }

      // Create specialized prompt with collaboration context
      const systemPrompt = this.buildCollaborationSystemPrompt(
        employee,
        context,
        task
      );

      // Execute task with LLM
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        {
          role: 'user' as const,
          content: `Task: ${task.description}\n\nPlease complete this task as part of the collaborative effort.`,
        },
      ];

      let fullResponse = '';

      // Stream response
      const stream = unifiedLLMService.streamMessage(
        messages,
        context.conversationId,
        undefined, // userId
        'anthropic' // Default provider
      );

      for await (const chunk of stream) {
        if (!chunk.done && chunk.content) {
          fullResponse += chunk.content;

          // Update message in real-time
          if (fullResponse.length % 100 === 0) {
            // Update every 100 characters
            store.updateMessage(task.id, {
              content: fullResponse,
              isStreaming: true,
            });
          }
        }
      }

      // Clear typing indicator
      store.setTypingIndicator(
        context.conversationId,
        agent.id,
        agent.name,
        false
      );

      // Add completion message
      const messageId = store.addMessage({
        conversationId: context.conversationId,
        senderId: agent.id,
        senderName: agent.name,
        senderType: 'agent',
        content: fullResponse,
        metadata: {
          model: 'claude-sonnet-4-5',
          provider: 'anthropic',
        },
      });

      // Update agent presence
      this.updateAgentPresence(agent.id, agent.name, 'online');

      return fullResponse;
    } catch (error) {
      // Clear typing indicator on error
      store.setTypingIndicator(
        context.conversationId,
        agent.id,
        agent.name,
        false
      );

      // Update agent presence
      this.updateAgentPresence(agent.id, agent.name, 'idle');

      throw error;
    }
  }

  /**
   * Execute a task with multiple agents collaborating
   */
  private async executeMultiAgentTask(
    task: CollaborativeTask,
    context: CollaborationContext
  ): Promise<Map<string, string>> {
    const store = useMultiAgentChatStore.getState();
    const results = new Map<string, string>();

    console.log(
      `[CollaborationManager] Multi-agent execution with ${task.assignedAgents.length} agents`
    );

    // Each agent works on their part
    for (const agentId of task.assignedAgents) {
      const agent = context.activeAgents.find((a) => a.id === agentId);
      if (!agent) continue;

      try {
        // Create sub-task for this agent
        const subTask: CollaborativeTask = {
          ...task,
          id: `${task.id}-${agentId}`,
          description: `Your part of "${task.description}" - Coordinate with other agents`,
        };

        const result = await this.executeSingleAgentTask(
          subTask,
          agent,
          context
        );

        results.set(agentId, result);

        // Send collaboration message to other agents
        await this.broadcastAgentMessage(
          {
            id: crypto.randomUUID(),
            type: 'status_update',
            fromAgentId: agentId,
            toAgentId: 'all',
            conversationId: context.conversationId,
            content: `I've completed my part of the task: ${result.substring(0, 100)}...`,
            metadata: {
              taskId: task.id,
            },
            timestamp: new Date(),
          },
          context
        );
      } catch (error) {
        console.error(`[CollaborationManager] Agent ${agentId} failed:`, error);
        results.set(
          agentId,
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return results;
  }

  /**
   * Send a message from one agent to another
   */
  async sendAgentMessage(
    message: Omit<AgentCommunicationMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    const fullMessage: AgentCommunicationMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    const context = this.activeCollaborations.get(message.conversationId);
    if (!context) {
      throw new Error(
        `No active collaboration found for conversation ${message.conversationId}`
      );
    }

    context.messages.push(fullMessage);

    // Queue message for recipient
    const queue = this.agentMessageQueue.get(message.toAgentId) || [];
    queue.push(fullMessage);
    this.agentMessageQueue.set(message.toAgentId, queue);

    console.log(
      `[CollaborationManager] Agent message sent: ${message.type} from ${message.fromAgentId} to ${message.toAgentId}`
    );
  }

  /**
   * Broadcast message to all agents in collaboration
   */
  private async broadcastAgentMessage(
    message: AgentCommunicationMessage,
    context: CollaborationContext
  ): Promise<void> {
    for (const agent of context.activeAgents) {
      if (agent.id !== message.fromAgentId) {
        await this.sendAgentMessage({
          ...message,
          toAgentId: agent.id,
        });
      }
    }
  }

  /**
   * Get pending messages for an agent
   */
  getAgentMessages(agentId: string): AgentCommunicationMessage[] {
    const messages = this.agentMessageQueue.get(agentId) || [];
    this.agentMessageQueue.set(agentId, []); // Clear queue after retrieval
    return messages;
  }

  /**
   * Select optimal agents for a request
   */
  private async selectOptimalAgents(
    userRequest: string
  ): Promise<AIEmployee[]> {
    // Assess all available agents
    const assessments: AgentCapabilityMatch[] = [];

    for (const employee of this.employees) {
      const score = this.assessAgentCapability(employee, userRequest);
      assessments.push({
        agentId: employee.id,
        agentName: employee.name,
        score,
        strengths: employee.skills || [],
        availability: true,
        currentLoad: 0, // Would track actual load in production
      });
    }

    // Sort by score and select top agents
    assessments.sort((a, b) => b.score - a.score);

    // Select top 3 agents with score > 50
    const selectedIds = assessments
      .filter((a) => a.score > 50)
      .slice(0, 3)
      .map((a) => a.agentId);

    return this.getAgentsByIds(selectedIds);
  }

  /**
   * Assess how well an agent matches a request
   */
  private assessAgentCapability(
    employee: AIEmployee,
    userRequest: string
  ): number {
    const request = userRequest.toLowerCase();
    let score = 0;

    // Check role match
    if (request.includes(employee.role.toLowerCase())) {
      score += 30;
    }

    // Check skills match
    const skills = employee.skills || [];
    for (const skill of skills) {
      if (request.includes(skill.toLowerCase())) {
        score += 20;
      }
    }

    // Check category match
    if (request.includes(employee.category?.toLowerCase() || '')) {
      score += 15;
    }

    // Check description match
    if (
      employee.description &&
      request.includes(employee.description.toLowerCase())
    ) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Get agents by IDs
   */
  private getAgentsByIds(ids: string[]): AIEmployee[] {
    return this.employees.filter((e) => ids.includes(e.id));
  }

  /**
   * Break down request into collaborative tasks
   */
  private async breakDownIntoCollaborativeTasks(
    userRequest: string,
    agents: AIEmployee[]
  ): Promise<CollaborativeTask[]> {
    const tasks: CollaborativeTask[] = [];

    // For now, create a simple task structure
    // In production, this would use LLM to intelligently break down tasks

    // Main task - assign to all agents for collaboration
    tasks.push({
      id: crypto.randomUUID(),
      description: userRequest,
      conversationId: '',
      assignedAgents: agents.map((a) => a.id),
      status: 'pending',
      priority: 'high',
      dependencies: [],
      createdAt: new Date(),
      estimatedDuration: 300, // 5 minutes
    });

    return tasks;
  }

  /**
   * Build system prompt for collaboration
   */
  private buildCollaborationSystemPrompt(
    employee: AIEmployee,
    context: CollaborationContext,
    task: CollaborativeTask
  ): string {
    const otherAgents = context.activeAgents
      .filter((a) => a.id !== employee.id)
      .map((a) => a.name)
      .join(', ');

    return `${employee.systemPrompt || `You are ${employee.name}, ${employee.role}`}

<collaboration_context>
You are working as part of a collaborative multi-agent team.

**Other Agents in This Collaboration:**
${otherAgents || 'None'}

**Your Current Task:**
${task.description}

**Task Priority:** ${task.priority}

**Collaboration Guidelines:**
1. Work efficiently on your assigned portion of the task
2. Communicate clearly with other agents when needed
3. Share relevant findings and progress updates
4. Request help if you encounter blockers
5. Coordinate handoffs smoothly
6. Build upon work from other agents

**Communication Protocol:**
- When you need help: Clearly state what you need and why
- When sharing results: Provide context for how they can be used
- When handing off: Summarize what you've done and what's next

**Quality Standards:**
- Ensure your work integrates well with others' contributions
- Verify assumptions with other agents when uncertain
- Document your decisions for team transparency
</collaboration_context>`;
  }

  /**
   * Update agent presence in the store
   */
  private updateAgentPresence(
    agentId: string,
    agentName: string,
    status: AgentPresence['status'],
    currentTask?: string
  ): void {
    const store = useMultiAgentChatStore.getState();

    const presence: AgentPresence = {
      agentId,
      agentName,
      status,
      lastActivity: new Date(),
      currentTask,
      capabilities: [], // Would be populated from employee data
    };

    store.updateAgentPresence(presence);
  }

  /**
   * End a collaboration session
   */
  async endCollaboration(conversationId: string): Promise<void> {
    const context = this.activeCollaborations.get(conversationId);
    if (!context) return;

    const store = useMultiAgentChatStore.getState();

    // Update all agents to offline
    for (const agent of context.activeAgents) {
      this.updateAgentPresence(agent.id, agent.name, 'offline');
      store.setTypingIndicator(conversationId, agent.id, agent.name, false);
    }

    // Clean up
    this.activeCollaborations.delete(conversationId);

    console.log(
      `[CollaborationManager] Ended collaboration for conversation ${conversationId}`
    );
  }

  /**
   * Get active collaboration context
   */
  getCollaborationContext(
    conversationId: string
  ): CollaborationContext | undefined {
    return this.activeCollaborations.get(conversationId);
  }

  /**
   * Clean up all collaborations
   */
  cleanup(): void {
    const store = useMultiAgentChatStore.getState();

    for (const [conversationId, context] of this.activeCollaborations) {
      for (const agent of context.activeAgents) {
        this.updateAgentPresence(agent.id, agent.name, 'offline');
        store.setTypingIndicator(conversationId, agent.id, agent.name, false);
      }
    }

    this.activeCollaborations.clear();
    this.agentMessageQueue.clear();

    console.log('[CollaborationManager] Cleaned up all collaborations');
  }
}

// Export singleton instance
export const enhancedAgentCollaborationManager =
  new EnhancedAgentCollaborationManager();
