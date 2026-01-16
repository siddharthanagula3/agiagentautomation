/**
 * Vibe Collaboration Protocol
 * Structured communication protocol for agent-to-agent collaboration
 * Based on MetaGPT's SOP (Standard Operating Procedure) approach
 */

import { messagePool } from './vibe-message-pool';
import type {
  VibeAgentMessage,
  AgentMessageType,
  MessageContent,
} from '../types/vibe-message';

/**
 * AgentCollaborationManager
 * Manages structured communication for an individual AI agent
 *
 * Each agent gets its own collaboration manager that:
 * - Subscribes to relevant message types
 * - Sends structured messages to other agents
 * - Handles incoming messages with type-specific logic
 */
export class AgentCollaborationManager {
  private employeeName: string;
  private sessionId: string;

  constructor(employeeName: string, sessionId: string) {
    this.employeeName = employeeName;
    this.sessionId = sessionId;

    // Subscribe to relevant message types
    this.initializeSubscriptions();

    // Listen for messages addressed to this agent
    messagePool.on(`message:${employeeName}`, this.handleMessage.bind(this));
  }

  /**
   * Initialize message subscriptions for this agent
   *
   * @private
   */
  private initializeSubscriptions(): void {
    messagePool.subscribe(this.employeeName, [
      'task_assignment',
      'question',
      'resource_request',
      'handoff',
    ]);
  }

  /**
   * Send a structured message to other agents
   *
   * @param type - Type of message to send
   * @param to - Recipient agent name(s) or 'broadcast'
   * @param content - Message content following the structured format
   * @param metadata - Optional metadata
   * @returns Promise that resolves when message is sent
   */
  // Updated: Jan 15th 2026 - Fixed any type
  async send(
    type: AgentMessageType,
    to: string[],
    content: MessageContent,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const message: VibeAgentMessage = {
      id: crypto.randomUUID(),
      session_id: this.sessionId,
      type,
      from_agent: this.employeeName,
      to_agents: to,
      timestamp: new Date(),
      content,
      metadata: {
        ...metadata,
      },
    };

    await messagePool.publish(message);
  }

  /**
   * Send a task assignment to another agent
   *
   * @param toAgent - Recipient agent name
   * @param taskId - Unique task identifier
   * @param description - Task description
   * @param requirements - Task requirements
   */
  async sendTaskAssignment(
    toAgent: string,
    taskId: string,
    description: string,
    requirements: string[] = []
  ): Promise<void> {
    await this.send('task_assignment', [toAgent], {
      task: {
        id: taskId,
        description,
        requirements,
      },
    });
  }

  /**
   * Send a task result to supervisor or another agent
   *
   * @param toAgent - Recipient agent name (usually 'supervisor')
   * @param taskId - Task identifier
   * @param output - Task output/result
   * @param artifacts - Optional artifacts produced
   */
  async sendTaskResult(
    toAgent: string,
    taskId: string,
    output: unknown,
    artifacts: string[] = []
  ): Promise<void> {
    await this.send('task_result', [toAgent], {
      result: {
        task_id: taskId,
        output,
        artifacts,
      },
    });
  }

  /**
   * Send a status update
   *
   * @param toAgent - Recipient agent name (usually 'supervisor')
   * @param state - Current state ('thinking' | 'working' | 'idle' | 'error')
   * @param progress - Progress percentage (0-100)
   * @param currentAction - Description of current action
   */
  async sendStatusUpdate(
    toAgent: string,
    state: 'thinking' | 'working' | 'idle' | 'error',
    progress?: number,
    currentAction?: string
  ): Promise<void> {
    await this.send('status_update', [toAgent], {
      status: {
        state,
        progress,
        current_action: currentAction,
      },
    });
  }

  /**
   * Ask a question to another agent or broadcast
   *
   * @param toAgents - Recipient agent name(s) or ['broadcast']
   * @param question - The question to ask
   * @param context - Context for the question
   * @param urgency - Urgency level
   */
  async askQuestion(
    toAgents: string[],
    question: string,
    context: string,
    urgency: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    await this.send('question', toAgents, {
      question: {
        question,
        context,
        urgency,
      },
    });
  }

  /**
   * Request a resource from another agent
   *
   * @param toAgent - Recipient agent name
   * @param resourceType - Type of resource needed
   * @param description - Description of the resource
   * @param required - Whether the resource is required
   */
  async requestResource(
    toAgent: string,
    resourceType: 'file' | 'data' | 'tool' | 'information',
    description: string,
    required: boolean = true
  ): Promise<void> {
    await this.send('resource_request', [toAgent], {
      resource: {
        type: resourceType,
        description,
        required,
      },
    });
  }

  /**
   * Handoff work to another agent
   *
   * @param toAgent - Agent to hand off to
   * @param reason - Reason for handoff
   * @param context - Context to pass along
   * @param suggestedAgent - Optional suggestion for further handoff
   */
  async handoffTo(
    toAgent: string,
    reason: string,
    context: string,
    suggestedAgent?: string
  ): Promise<void> {
    await this.send('handoff', [toAgent], {
      handoff: {
        reason,
        context,
        suggested_agent: suggestedAgent,
      },
    });
  }

  /**
   * Broadcast a message to all agents
   *
   * @param type - Message type
   * @param content - Message content
   */
  async broadcast(
    type: AgentMessageType,
    content: MessageContent
  ): Promise<void> {
    await this.send(type, ['broadcast'], content);
  }

  /**
   * Get all messages relevant to this agent
   *
   * @returns Array of messages for this agent
   */
  getMessages(): VibeAgentMessage[] {
    return messagePool.getMessagesFor(this.employeeName);
  }

  /**
   * Get messages by type
   *
   * @param type - Message type to filter by
   * @returns Array of messages of the specified type
   */
  getMessagesByType(type: AgentMessageType): VibeAgentMessage[] {
    const allMessages = this.getMessages();
    return allMessages.filter((msg) => msg.type === type);
  }

  /**
   * Handle incoming message
   * Dispatches to type-specific handlers
   *
   * @private
   */
  private handleMessage(message: VibeAgentMessage): void {
    switch (message.type) {
      case 'task_assignment':
        this.handleTaskAssignment(message);
        break;
      case 'question':
        this.handleQuestion(message);
        break;
      case 'resource_request':
        this.handleResourceRequest(message);
        break;
      case 'handoff':
        this.handleHandoff(message);
        break;
      case 'status_update':
        this.handleStatusUpdate(message);
        break;
      case 'task_result':
        this.handleTaskResult(message);
        break;
    }
  }

  /**
   * Handle task assignment message
   *
   * @private
   */
  private handleTaskAssignment(message: VibeAgentMessage): void {
    const task = message.content.task;
    if (!task) return;

    // Emit event for external handling (e.g., by execution coordinator)
    messagePool.emit('task_assigned', {
      agentName: this.employeeName,
      task,
      message,
    });
  }

  /**
   * Handle question message
   *
   * @private
   */
  private handleQuestion(message: VibeAgentMessage): void {
    const question = message.content.question;
    if (!question) return;

    // Emit event for external handling
    messagePool.emit('question_received', {
      agentName: this.employeeName,
      question,
      from: message.from_agent,
      message,
    });
  }

  /**
   * Handle resource request message
   *
   * @private
   */
  private handleResourceRequest(message: VibeAgentMessage): void {
    const resource = message.content.resource;
    if (!resource) return;

    // Emit event for external handling
    messagePool.emit('resource_requested', {
      agentName: this.employeeName,
      resource,
      from: message.from_agent,
      message,
    });
  }

  /**
   * Handle handoff message
   *
   * @private
   */
  private handleHandoff(message: VibeAgentMessage): void {
    const handoff = message.content.handoff;
    if (!handoff) return;

    // Emit event for external handling
    messagePool.emit('handoff_received', {
      agentName: this.employeeName,
      handoff,
      from: message.from_agent,
      message,
    });
  }

  /**
   * Handle status update message
   *
   * @private
   */
  private handleStatusUpdate(message: VibeAgentMessage): void {
    const status = message.content.status;
    if (!status) return;

    // Emit event for external handling (e.g., for UI updates)
    messagePool.emit('status_updated', {
      agentName: message.from_agent,
      status,
      message,
    });
  }

  /**
   * Handle task result message
   *
   * @private
   */
  private handleTaskResult(message: VibeAgentMessage): void {
    const result = message.content.result;
    if (!result) return;

    // Emit event for external handling
    messagePool.emit('task_completed', {
      agentName: message.from_agent,
      result,
      message,
    });
  }

  /**
   * Cleanup when agent is done
   * Unsubscribes from message pool and removes listeners
   */
  destroy(): void {
    messagePool.unsubscribe(this.employeeName);
  }
}

/**
 * Create a collaboration manager for an agent
 *
 * @param employeeName - Name of the AI employee
 * @param sessionId - VIBE session ID
 * @returns AgentCollaborationManager instance
 */
export function createCollaborationManager(
  employeeName: string,
  sessionId: string
): AgentCollaborationManager {
  return new AgentCollaborationManager(employeeName, sessionId);
}
