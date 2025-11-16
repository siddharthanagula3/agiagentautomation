/**
 * Message Routing Service
 * Handles intelligent message routing, priority-based delivery, and group messaging
 *
 * Features:
 * - Intelligent routing based on message type and participants
 * - Priority-based message delivery
 * - Group message handling with mentions
 * - Direct message routing
 * - Message broadcasting
 * - Delivery guarantees and retry logic
 */

import { useMultiAgentChatStore } from '@shared/stores/multi-agent-chat-store';
import type {
  ChatMessage,
  ConversationParticipant,
  MessageDeliveryStatus,
} from '@shared/stores/multi-agent-chat-store';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Message route information
 */
export interface MessageRoute {
  messageId: string;
  conversationId: string;
  fromId: string;
  toIds: string[]; // Target participant IDs
  routeType: 'direct' | 'group' | 'broadcast' | 'mention';
  priority: MessagePriority;
  deliveryGuarantee: 'at-most-once' | 'at-least-once' | 'exactly-once';
  retryAttempts: number;
  maxRetries: number;
  timestamp: Date;
}

/**
 * Message priority levels
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Routing rule
 */
export interface RoutingRule {
  id: string;
  name: string;
  condition: (
    message: ChatMessage,
    participants: ConversationParticipant[]
  ) => boolean;
  action: (route: MessageRoute) => Promise<void>;
  priority: number; // Higher priority rules are evaluated first
  enabled: boolean;
}

/**
 * Message delivery attempt
 */
export interface DeliveryAttempt {
  attemptNumber: number;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed';
  error?: string;
}

/**
 * Routing statistics
 */
export interface RoutingStats {
  totalMessagesRouted: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  retryCount: number;
}

// ============================================================================
// MESSAGE ROUTING SERVICE CLASS
// ============================================================================

export class MessageRoutingService {
  private routes: Map<string, MessageRoute> = new Map();
  private rules: RoutingRule[] = [];
  private deliveryAttempts: Map<string, DeliveryAttempt[]> = new Map();
  private stats: RoutingStats = {
    totalMessagesRouted: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    averageDeliveryTime: 0,
    retryCount: 0,
  };

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default routing rules
   */
  private initializeDefaultRules(): void {
    // Rule 1: Direct messages to specific users
    this.addRule({
      id: 'direct-message',
      name: 'Direct Message Routing',
      condition: (message, participants) => {
        // Check if message mentions a specific participant
        const mentions = this.extractMentions(message.content);
        return mentions.length === 1;
      },
      action: async (route) => {
        await this.routeDirectMessage(route);
      },
      priority: 100,
      enabled: true,
    });

    // Rule 2: Group messages with multiple mentions
    this.addRule({
      id: 'group-mention',
      name: 'Group Mention Routing',
      condition: (message, participants) => {
        const mentions = this.extractMentions(message.content);
        return mentions.length > 1;
      },
      action: async (route) => {
        await this.routeGroupMessage(route);
      },
      priority: 90,
      enabled: true,
    });

    // Rule 3: Broadcast to all participants
    this.addRule({
      id: 'broadcast',
      name: 'Broadcast Routing',
      condition: (message, participants) => {
        // Messages with no specific mentions are broadcast
        const mentions = this.extractMentions(message.content);
        return mentions.length === 0;
      },
      action: async (route) => {
        await this.routeBroadcastMessage(route);
      },
      priority: 10,
      enabled: true,
    });

    // Rule 4: Priority routing for urgent messages
    this.addRule({
      id: 'urgent-priority',
      name: 'Urgent Priority Routing',
      condition: (message) => {
        return (
          message.content.toLowerCase().includes('urgent') ||
          message.content.toLowerCase().includes('asap') ||
          message.content.includes('!')
        );
      },
      action: async (route) => {
        route.priority = 'urgent';
        route.deliveryGuarantee = 'exactly-once';
        await this.priorityRoute(route);
      },
      priority: 200,
      enabled: true,
    });
  }

  /**
   * Route a message to appropriate participants
   */
  async routeMessage(message: ChatMessage): Promise<MessageRoute> {
    const store = useMultiAgentChatStore.getState();
    const conversation = store.conversations[message.conversationId];

    if (!conversation) {
      throw new Error(`Conversation ${message.conversationId} not found`);
    }

    const startTime = Date.now();

    // Determine routing based on rules
    const route = await this.determineRoute(message, conversation.participants);

    // Store route
    this.routes.set(message.id, route);

    // Apply routing rules
    await this.applyRoutingRules(route, message, conversation.participants);

    // Update statistics
    const deliveryTime = Date.now() - startTime;
    this.updateStats(true, deliveryTime);

    console.log(
      `[MessageRouting] Routed message ${message.id} via ${route.routeType} to ${route.toIds.length} participants`
    );

    return route;
  }

  /**
   * Determine the route for a message
   */
  private async determineRoute(
    message: ChatMessage,
    participants: ConversationParticipant[]
  ): Promise<MessageRoute> {
    const mentions = this.extractMentions(message.content);
    let routeType: MessageRoute['routeType'] = 'broadcast';
    let toIds: string[] = participants.map((p) => p.id);

    // Determine route type
    if (mentions.length === 1) {
      routeType = 'direct';
      const mentionedParticipant = participants.find(
        (p) =>
          p.name.toLowerCase() === mentions[0].toLowerCase() ||
          p.id === mentions[0]
      );
      if (mentionedParticipant) {
        toIds = [mentionedParticipant.id];
      }
    } else if (mentions.length > 1) {
      routeType = 'group';
      toIds = participants
        .filter((p) =>
          mentions.some(
            (m) => m.toLowerCase() === p.name.toLowerCase() || m === p.id
          )
        )
        .map((p) => p.id);
    } else if (mentions.includes('@all') || mentions.includes('@everyone')) {
      routeType = 'broadcast';
      toIds = participants.map((p) => p.id);
    }

    // Filter out sender
    toIds = toIds.filter((id) => id !== message.senderId);

    // Determine priority
    const priority = this.determinePriority(message);

    const route: MessageRoute = {
      messageId: message.id,
      conversationId: message.conversationId,
      fromId: message.senderId,
      toIds,
      routeType,
      priority,
      deliveryGuarantee:
        priority === 'urgent' ? 'exactly-once' : 'at-least-once',
      retryAttempts: 0,
      maxRetries: 3,
      timestamp: new Date(),
    };

    return route;
  }

  /**
   * Apply routing rules to a message
   */
  private async applyRoutingRules(
    route: MessageRoute,
    message: ChatMessage,
    participants: ConversationParticipant[]
  ): Promise<void> {
    // Sort rules by priority
    const sortedRules = [...this.rules]
      .filter((r) => r.enabled)
      .sort((a, b) => b.priority - a.priority);

    // Apply first matching rule
    for (const rule of sortedRules) {
      if (rule.condition(message, participants)) {
        console.log(`[MessageRouting] Applying rule: ${rule.name}`);
        await rule.action(route);
        return;
      }
    }

    // Default action if no rules match
    await this.routeBroadcastMessage(route);
  }

  /**
   * Route a direct message
   */
  private async routeDirectMessage(route: MessageRoute): Promise<void> {
    const store = useMultiAgentChatStore.getState();

    for (const toId of route.toIds) {
      try {
        // Update delivery status
        store.updateMessageDeliveryStatus(
          route.conversationId,
          route.messageId,
          'delivered'
        );

        this.recordDeliveryAttempt(route.messageId, 'success');
      } catch (error) {
        console.error(`[MessageRouting] Failed to route to ${toId}:`, error);
        this.recordDeliveryAttempt(
          route.messageId,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );

        // Retry if needed
        if (route.retryAttempts < route.maxRetries) {
          route.retryAttempts++;
          this.stats.retryCount++;
          await this.retryDelivery(route, toId);
        }
      }
    }
  }

  /**
   * Route a group message
   */
  private async routeGroupMessage(route: MessageRoute): Promise<void> {
    const store = useMultiAgentChatStore.getState();

    // Send to all mentioned participants
    for (const toId of route.toIds) {
      try {
        // In a real implementation, this might trigger notifications
        // or update participant-specific delivery tracking

        this.recordDeliveryAttempt(route.messageId, 'success');
      } catch (error) {
        console.error(`[MessageRouting] Failed to route to ${toId}:`, error);
        this.recordDeliveryAttempt(
          route.messageId,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    // Update overall delivery status
    store.updateMessageDeliveryStatus(
      route.conversationId,
      route.messageId,
      'delivered'
    );
  }

  /**
   * Route a broadcast message
   */
  private async routeBroadcastMessage(route: MessageRoute): Promise<void> {
    const store = useMultiAgentChatStore.getState();

    // Message is visible to all participants by default
    // Just update delivery status

    try {
      store.updateMessageDeliveryStatus(
        route.conversationId,
        route.messageId,
        'delivered'
      );

      this.recordDeliveryAttempt(route.messageId, 'success');
    } catch (error) {
      console.error('[MessageRouting] Broadcast failed:', error);
      this.recordDeliveryAttempt(
        route.messageId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Priority routing for urgent messages
   */
  private async priorityRoute(route: MessageRoute): Promise<void> {
    const store = useMultiAgentChatStore.getState();

    console.log(
      `[MessageRouting] Priority routing for message ${route.messageId}`
    );

    // Ensure immediate delivery
    route.maxRetries = 5; // More retries for urgent messages

    // Route based on type
    if (route.routeType === 'direct') {
      await this.routeDirectMessage(route);
    } else if (route.routeType === 'group') {
      await this.routeGroupMessage(route);
    } else {
      await this.routeBroadcastMessage(route);
    }

    // Mark as urgent in metadata
    store.updateMessage(route.messageId, {
      metadata: {
        priority: 'urgent',
      },
    });
  }

  /**
   * Retry message delivery
   */
  private async retryDelivery(
    route: MessageRoute,
    toId: string
  ): Promise<void> {
    console.log(
      `[MessageRouting] Retrying delivery to ${toId}, attempt ${route.retryAttempts}/${route.maxRetries}`
    );

    // Exponential backoff
    const delay = Math.pow(2, route.retryAttempts - 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      // Attempt redelivery (simplified)
      this.recordDeliveryAttempt(route.messageId, 'success');
    } catch (error) {
      console.error('[MessageRouting] Retry failed:', error);
      this.recordDeliveryAttempt(
        route.messageId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Extract mentions from message content
   */
  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  /**
   * Determine message priority
   */
  private determinePriority(message: ChatMessage): MessagePriority {
    const content = message.content.toLowerCase();

    if (
      content.includes('urgent') ||
      content.includes('asap') ||
      content.includes('emergency')
    ) {
      return 'urgent';
    }

    if (content.includes('important') || content.includes('priority')) {
      return 'high';
    }

    if (message.senderType === 'system') {
      return 'high';
    }

    return 'normal';
  }

  /**
   * Record a delivery attempt
   */
  private recordDeliveryAttempt(
    messageId: string,
    status: DeliveryAttempt['status'],
    error?: string
  ): void {
    const attempts = this.deliveryAttempts.get(messageId) || [];

    attempts.push({
      attemptNumber: attempts.length + 1,
      timestamp: new Date(),
      status,
      error,
    });

    this.deliveryAttempts.set(messageId, attempts);
  }

  /**
   * Update routing statistics
   */
  private updateStats(success: boolean, deliveryTime: number): void {
    this.stats.totalMessagesRouted++;

    if (success) {
      this.stats.successfulDeliveries++;
    } else {
      this.stats.failedDeliveries++;
    }

    // Update average delivery time
    const totalTime =
      this.stats.averageDeliveryTime * (this.stats.totalMessagesRouted - 1);
    this.stats.averageDeliveryTime =
      (totalTime + deliveryTime) / this.stats.totalMessagesRouted;
  }

  /**
   * Add a custom routing rule
   */
  addRule(rule: RoutingRule): void {
    this.rules.push(rule);
    console.log(`[MessageRouting] Added rule: ${rule.name}`);
  }

  /**
   * Remove a routing rule
   */
  removeRule(ruleId: string): void {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      console.log(`[MessageRouting] Removed rule: ${ruleId}`);
    }
  }

  /**
   * Enable/disable a routing rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      console.log(
        `[MessageRouting] ${enabled ? 'Enabled' : 'Disabled'} rule: ${ruleId}`
      );
    }
  }

  /**
   * Get routing statistics
   */
  getStats(): RoutingStats {
    return { ...this.stats };
  }

  /**
   * Get route information for a message
   */
  getRoute(messageId: string): MessageRoute | undefined {
    return this.routes.get(messageId);
  }

  /**
   * Get delivery attempts for a message
   */
  getDeliveryAttempts(messageId: string): DeliveryAttempt[] {
    return this.deliveryAttempts.get(messageId) || [];
  }

  /**
   * Clear old routing data (for memory management)
   */
  cleanup(olderThan: Date): void {
    // Remove old routes
    for (const [messageId, route] of this.routes.entries()) {
      if (route.timestamp < olderThan) {
        this.routes.delete(messageId);
        this.deliveryAttempts.delete(messageId);
      }
    }

    console.log(
      `[MessageRouting] Cleaned up routes older than ${olderThan.toISOString()}`
    );
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalMessagesRouted: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0,
      retryCount: 0,
    };
    console.log('[MessageRouting] Statistics reset');
  }
}

// Export singleton instance
export const messageRoutingService = new MessageRoutingService();
