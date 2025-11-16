/**
 * Vibe Message Pool
 * Global pub-sub message system for agent communication
 * Based on MetaGPT's structured communication architecture
 */

import { EventEmitter } from 'events';
import { supabase } from '@shared/lib/supabase-client';
import type { VibeAgentMessage, AgentMessageType } from '../types/vibe-message';

/**
 * MessagePool
 * Centralized pub-sub system for structured agent-to-agent communication
 *
 * Key features:
 * - In-memory storage for fast access
 * - Persistent storage in Supabase
 * - Subscription-based message delivery
 * - Event-driven notifications
 */
export class MessagePool extends EventEmitter {
  private messages: Map<string, VibeAgentMessage>;
  private subscriptions: Map<string, Set<AgentMessageType>>;

  constructor() {
    super();
    this.messages = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Publish a message to the pool
   *
   * @param message - The structured message to publish
   * @returns Promise that resolves when message is published
   */
  async publish(message: VibeAgentMessage): Promise<void> {
    // Store in memory
    this.messages.set(message.id, message);

    // Persist to database
    await this.persistMessage(message);

    // Notify subscribers
    this.notifySubscribers(message);

    // Emit global event for real-time UI updates
    this.emit('message', message);
  }

  /**
   * Subscribe an agent to specific message types
   *
   * @param agentName - Name of the agent subscribing
   * @param messageTypes - Types of messages to subscribe to
   */
  subscribe(agentName: string, messageTypes: AgentMessageType[]): void {
    if (!this.subscriptions.has(agentName)) {
      this.subscriptions.set(agentName, new Set());
    }

    const agentSubs = this.subscriptions.get(agentName)!;
    messageTypes.forEach(type => agentSubs.add(type));
  }

  /**
   * Unsubscribe an agent from all messages
   *
   * @param agentName - Name of the agent to unsubscribe
   */
  unsubscribe(agentName: string): void {
    this.subscriptions.delete(agentName);
    this.removeAllListeners(`message:${agentName}`);
  }

  /**
   * Get messages for a specific agent based on subscriptions
   *
   * @param agentName - Name of the agent
   * @returns Array of messages relevant to this agent
   */
  getMessagesFor(agentName: string): VibeAgentMessage[] {
    const agentSubs = this.subscriptions.get(agentName);
    if (!agentSubs) return [];

    return Array.from(this.messages.values()).filter(msg => {
      // Message is directly addressed to this agent
      const isDirect = msg.to_agents.includes(agentName);

      // Message type is subscribed
      const isSubscribed = agentSubs.has(msg.type);

      // Broadcast messages
      const isBroadcast = msg.to_agents.includes('broadcast');

      return (isDirect || isBroadcast) && isSubscribed;
    });
  }

  /**
   * Get all messages from the pool
   *
   * @returns Array of all messages
   */
  getAllMessages(): VibeAgentMessage[] {
    return Array.from(this.messages.values());
  }

  /**
   * Get messages by session ID
   *
   * @param sessionId - The session ID to filter by
   * @returns Array of messages for the session
   */
  getMessagesBySession(sessionId: string): VibeAgentMessage[] {
    return Array.from(this.messages.values()).filter(
      msg => msg.session_id === sessionId
    );
  }

  /**
   * Get messages by type
   *
   * @param type - The message type to filter by
   * @returns Array of messages of the specified type
   */
  getMessagesByType(type: AgentMessageType): VibeAgentMessage[] {
    return Array.from(this.messages.values()).filter(
      msg => msg.type === type
    );
  }

  /**
   * Clear messages from memory
   * (Database records remain for persistence)
   *
   * @param sessionId - Optional session ID to clear specific session
   */
  clear(sessionId?: string): void {
    if (sessionId) {
      // Clear only messages for this session
      for (const [id, msg] of this.messages.entries()) {
        if (msg.session_id === sessionId) {
          this.messages.delete(id);
        }
      }
    } else {
      // Clear all messages
      this.messages.clear();
    }
  }

  /**
   * Cleanup old messages (garbage collection)
   *
   * @param olderThan - Delete messages older than this date
   */
  async cleanup(olderThan: Date): Promise<void> {
    // Remove from memory
    for (const [id, msg] of this.messages.entries()) {
      if (msg.timestamp < olderThan) {
        this.messages.delete(id);
      }
    }

    // Remove from database
    try {
      await supabase
        .from('vibe_agent_messages')
        .delete()
        .lt('timestamp', olderThan.toISOString());
    } catch (error) {
      console.error('Failed to cleanup old messages from database:', error);
    }
  }

  /**
   * Notify subscribers of new message
   *
   * @private
   */
  private notifySubscribers(message: VibeAgentMessage): void {
    // Notify specific recipients
    for (const recipient of message.to_agents) {
      const subs = this.subscriptions.get(recipient);

      if (subs && subs.has(message.type)) {
        this.emit(`message:${recipient}`, message);
      }
    }

    // Notify broadcast subscribers
    if (message.to_agents.includes('broadcast')) {
      for (const [agentName, subs] of this.subscriptions.entries()) {
        if (subs.has(message.type)) {
          this.emit(`message:${agentName}`, message);
        }
      }
    }
  }

  /**
   * Persist message to Supabase database
   *
   * @private
   */
  private async persistMessage(message: VibeAgentMessage): Promise<void> {
    try {
      await supabase.from('vibe_agent_messages').insert({
        id: message.id,
        session_id: message.session_id,
        type: message.type,
        from_agent: message.from_agent,
        to_agents: message.to_agents,
        timestamp: message.timestamp.toISOString(),
        content: message.content,
        metadata: message.metadata || {},
      });
    } catch (error) {
      console.error('Failed to persist message to database:', error);
      // Don't throw - message pool continues working with in-memory data
    }
  }

  /**
   * Load messages from database for a session
   *
   * @param sessionId - The session ID to load messages for
   * @returns Promise that resolves when messages are loaded
   */
  async loadMessagesFromDatabase(sessionId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('vibe_agent_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (data) {
        data.forEach(row => {
          const message: VibeAgentMessage = {
            id: row.id,
            session_id: row.session_id,
            type: row.type as AgentMessageType,
            from_agent: row.from_agent,
            to_agents: row.to_agents,
            timestamp: new Date(row.timestamp),
            content: row.content,
            metadata: row.metadata,
          };

          this.messages.set(message.id, message);
        });
      }
    } catch (error) {
      console.error('Failed to load messages from database:', error);
    }
  }

  /**
   * Get subscription count for monitoring
   *
   * @returns Number of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get message count for monitoring
   *
   * @returns Number of messages in pool
   */
  getMessageCount(): number {
    return this.messages.size;
  }

  /**
   * Get pool statistics
   *
   * @returns Object with pool statistics
   */
  getStatistics(): {
    totalMessages: number;
    activeSubscriptions: number;
    messagesByType: Record<AgentMessageType, number>;
  } {
    const messagesByType: Record<string, number> = {};

    for (const msg of this.messages.values()) {
      messagesByType[msg.type] = (messagesByType[msg.type] || 0) + 1;
    }

    return {
      totalMessages: this.messages.size,
      activeSubscriptions: this.subscriptions.size,
      messagesByType: messagesByType as Record<AgentMessageType, number>,
    };
  }
}

/**
 * Singleton instance of MessagePool
 * Used throughout the VIBE system for agent communication
 */
export const messagePool = new MessagePool();
