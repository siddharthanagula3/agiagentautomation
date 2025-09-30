/**
 * Agent Communication Protocol - Manages inter-agent communication
 * Allows agents to send messages, requests, and coordinate work
 */

import { AgentType } from '../reasoning/task-decomposer';

export type MessageType = 'request' | 'response' | 'error' | 'status' | 'broadcast' | 'handoff';
export type MessagePriority = 'urgent' | 'high' | 'normal' | 'low';

export interface AgentMessage {
  id: string;
  from: AgentType | 'system' | 'user';
  to: AgentType | 'all' | 'user';
  type: MessageType;
  priority: MessagePriority;
  payload: any;
  timestamp: Date;
  correlationId?: string; // Links related messages
  replyTo?: string; // Original message ID if this is a response
  metadata?: Record<string, any>;
}

export interface MessageHandler {
  agent: AgentType;
  handler: (message: AgentMessage) => Promise<void>;
  messageTypes: MessageType[];
}

export interface CommunicationStats {
  totalMessages: number;
  messagesByType: Record<MessageType, number>;
  messagesByAgent: Record<AgentType, number>;
  averageResponseTime: number;
  failedMessages: number;
}

/**
 * AgentCommunicator - Main class for agent-to-agent communication
 */
export class AgentCommunicator {
  private messageQueue: AgentMessage[] = [];
  private handlers: Map<AgentType, MessageHandler[]> = new Map();
  private messageHistory: AgentMessage[] = [];
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private stats: CommunicationStats;
  private listeners: Set<MessageListener> = new Set();

  constructor() {
    this.stats = {
      totalMessages: 0,
      messagesByType: {
        request: 0,
        response: 0,
        error: 0,
        status: 0,
        broadcast: 0,
        handoff: 0
      },
      messagesByAgent: {} as Record<AgentType, number>,
      averageResponseTime: 0,
      failedMessages: 0
    };

    this.startMessageProcessor();
  }

  /**
   * Send a request from one agent to another
   */
  async sendRequest(
    from: AgentType | 'system' | 'user',
    to: AgentType,
    request: any,
    priority: MessagePriority = 'normal',
    timeout: number = 30000
  ): Promise<any> {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      from,
      to,
      type: 'request',
      priority,
      payload: request,
      timestamp: new Date()
    };

    // Store pending request for tracking
    const pendingPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(message.id, {
        message,
        resolve,
        reject,
        timeoutId,
        sentAt: Date.now()
      });
    });

    // Queue the message
    await this.queueMessage(message);

    return pendingPromise;
  }

  /**
   * Send a response to a previous request
   */
  async sendResponse(
    from: AgentType,
    originalMessageId: string,
    response: any
  ): Promise<void> {
    const originalMessage = this.messageHistory.find(m => m.id === originalMessageId);
    
    if (!originalMessage) {
      throw new Error(`Original message ${originalMessageId} not found`);
    }

    const message: AgentMessage = {
      id: this.generateMessageId(),
      from,
      to: originalMessage.from as AgentType,
      type: 'response',
      priority: originalMessage.priority,
      payload: response,
      timestamp: new Date(),
      replyTo: originalMessageId,
      correlationId: originalMessage.correlationId || originalMessageId
    };

    await this.queueMessage(message);

    // Resolve pending request if exists
    const pending = this.pendingRequests.get(originalMessageId);
    if (pending) {
      clearTimeout(pending.timeoutId);
      const responseTime = Date.now() - pending.sentAt;
      this.updateResponseTime(responseTime);
      pending.resolve(response);
      this.pendingRequests.delete(originalMessageId);
    }
  }

  /**
   * Send an error message
   */
  async sendError(
    from: AgentType,
    to: AgentType | 'user',
    error: Error,
    originalMessageId?: string
  ): Promise<void> {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      from,
      to,
      type: 'error',
      priority: 'high',
      payload: {
        error: error.message,
        stack: error.stack,
        name: error.name
      },
      timestamp: new Date(),
      replyTo: originalMessageId
    };

    await this.queueMessage(message);
    this.stats.failedMessages++;

    // Reject pending request if exists
    if (originalMessageId) {
      const pending = this.pendingRequests.get(originalMessageId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pending.reject(error);
        this.pendingRequests.delete(originalMessageId);
      }
    }
  }

  /**
   * Send a status update
   */
  async sendStatus(
    from: AgentType,
    status: AgentStatus
  ): Promise<void> {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      from,
      to: 'user',
      type: 'status',
      priority: 'normal',
      payload: status,
      timestamp: new Date()
    };

    await this.queueMessage(message);
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcastToAll(
    from: AgentType | 'system',
    payload: any,
    priority: MessagePriority = 'normal'
  ): Promise<void> {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      from,
      to: 'all',
      type: 'broadcast',
      priority,
      payload,
      timestamp: new Date()
    };

    await this.queueMessage(message);
  }

  /**
   * Hand off a task from one agent to another
   */
  async handoffTask(
    from: AgentType,
    to: AgentType,
    taskData: any,
    reason: string
  ): Promise<void> {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      from,
      to,
      type: 'handoff',
      priority: 'high',
      payload: {
        task: taskData,
        reason,
        handoffTime: new Date()
      },
      timestamp: new Date()
    };

    await this.queueMessage(message);
  }

  /**
   * Register a message handler for an agent
   */
  subscribeToAgent(
    agent: AgentType,
    messageTypes: MessageType[],
    handler: (message: AgentMessage) => Promise<void>
  ): () => void {
    const handlerObj: MessageHandler = {
      agent,
      handler,
      messageTypes
    };

    if (!this.handlers.has(agent)) {
      this.handlers.set(agent, []);
    }

    this.handlers.get(agent)!.push(handlerObj);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(agent);
      if (handlers) {
        const index = handlers.indexOf(handlerObj);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Add a global message listener
   */
  addListener(listener: MessageListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Queue a message for processing
   */
  private async queueMessage(message: AgentMessage): Promise<void> {
    // Add to queue
    this.messageQueue.push(message);
    
    // Add to history
    this.messageHistory.push(message);
    
    // Update stats
    this.stats.totalMessages++;
    this.stats.messagesByType[message.type]++;
    
    if (message.from !== 'system' && message.from !== 'user') {
      this.stats.messagesByAgent[message.from] = 
        (this.stats.messagesByAgent[message.from] || 0) + 1;
    }

    // Notify listeners
    this.notifyListeners(message);

    // Sort queue by priority
    this.messageQueue.sort((a, b) => {
      const priorityOrder: Record<MessagePriority, number> = {
        urgent: 4,
        high: 3,
        normal: 2,
        low: 1
      };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Process messages in the queue
   */
  private async processMessage(message: AgentMessage): Promise<void> {
    try {
      // Broadcast messages go to all agents
      if (message.to === 'all') {
        const allHandlers = Array.from(this.handlers.values()).flat();
        await Promise.all(
          allHandlers
            .filter(h => h.messageTypes.includes(message.type))
            .map(h => h.handler(message))
        );
        return;
      }

      // Direct messages go to specific agent
      if (message.to !== 'user') {
        const handlers = this.handlers.get(message.to as AgentType);
        if (handlers) {
          await Promise.all(
            handlers
              .filter(h => h.messageTypes.includes(message.type))
              .map(h => h.handler(message))
          );
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Send error response if this was a request
      if (message.type === 'request' && message.from !== 'user') {
        await this.sendError(
          message.to as AgentType,
          message.from as AgentType,
          error as Error,
          message.id
        );
      }
    }
  }

  /**
   * Start the message processor
   */
  private startMessageProcessor(): void {
    setInterval(async () => {
      if (this.messageQueue.length === 0) return;

      // Process messages in batches
      const batch = this.messageQueue.splice(0, 5);
      await Promise.all(batch.map(msg => this.processMessage(msg)));
    }, 100); // Process every 100ms
  }

  /**
   * Notify all listeners of a new message
   */
  private notifyListeners(message: AgentMessage): void {
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }

  /**
   * Update average response time
   */
  private updateResponseTime(responseTime: number): void {
    const totalResponses = this.stats.messagesByType.response;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (totalResponses - 1) + responseTime) / 
      totalResponses;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get communication statistics
   */
  getStats(): CommunicationStats {
    return { ...this.stats };
  }

  /**
   * Get message history
   */
  getHistory(
    filter?: {
      from?: AgentType | 'system' | 'user';
      to?: AgentType | 'all' | 'user';
      type?: MessageType;
      since?: Date;
    }
  ): AgentMessage[] {
    let history = [...this.messageHistory];

    if (filter) {
      if (filter.from) {
        history = history.filter(m => m.from === filter.from);
      }
      if (filter.to) {
        history = history.filter(m => m.to === filter.to);
      }
      if (filter.type) {
        history = history.filter(m => m.type === filter.type);
      }
      if (filter.since) {
        history = history.filter(m => m.timestamp >= filter.since!);
      }
    }

    return history;
  }

  /**
   * Get pending requests
   */
  getPendingRequests(): Map<string, PendingRequest> {
    return new Map(this.pendingRequests);
  }

  /**
   * Clear message history (keep only recent messages)
   */
  clearOldHistory(olderThan: Date): void {
    this.messageHistory = this.messageHistory.filter(
      m => m.timestamp >= olderThan
    );
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.messageQueue.length;
  }
}

interface PendingRequest {
  message: AgentMessage;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeoutId: NodeJS.Timeout;
  sentAt: number;
}

interface AgentStatus {
  agent: AgentType;
  status: 'idle' | 'busy' | 'error' | 'offline';
  currentTask?: string;
  progress?: number;
  message?: string;
}

type MessageListener = (message: AgentMessage) => void;

// Export singleton instance
export const agentCommunicator = new AgentCommunicator();

// Export utility functions
export function sendAgentRequest(
  from: AgentType | 'system',
  to: AgentType,
  request: any,
  priority?: MessagePriority
): Promise<any> {
  return agentCommunicator.sendRequest(from, to, request, priority);
}

export function sendAgentResponse(
  from: AgentType,
  originalMessageId: string,
  response: any
): Promise<void> {
  return agentCommunicator.sendResponse(from, originalMessageId, response);
}

export function broadcastMessage(
  from: AgentType | 'system',
  payload: any,
  priority?: MessagePriority
): Promise<void> {
  return agentCommunicator.broadcastToAll(from, payload, priority);
}

export function subscribeToMessages(
  agent: AgentType,
  messageTypes: MessageType[],
  handler: (message: AgentMessage) => Promise<void>
): () => void {
  return agentCommunicator.subscribeToAgent(agent, messageTypes, handler);
}
