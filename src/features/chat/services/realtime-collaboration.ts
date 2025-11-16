/**
 * Real-time Collaboration Service
 *
 * Provides real-time features for chat:
 * - Live message updates across devices
 * - Typing indicators
 * - Presence tracking
 * - Collaborative editing
 */

import { supabase } from '@shared/lib/supabase-client';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import type { ChatMessage } from '../types';

export interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

export interface PresenceState {
  userId: string;
  username: string;
  online: boolean;
  lastSeen: number;
}

export type MessageChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface MessageChange {
  type: MessageChangeType;
  message: ChatMessage;
}

export interface RealtimeCallbacks {
  onMessageChange?: (change: MessageChange) => void;
  onTypingUpdate?: (users: TypingUser[]) => void;
  onPresenceUpdate?: (users: PresenceState[]) => void;
  onError?: (error: Error) => void;
}

export class RealtimeCollaborationService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly typingTimeout = 3000; // 3 seconds

  /**
   * Subscribe to real-time updates for a chat session
   */
  async subscribeToSession(
    sessionId: string,
    userId: string,
    username: string,
    callbacks: RealtimeCallbacks
  ): Promise<void> {
    // Unsubscribe if already subscribed
    if (this.channels.has(sessionId)) {
      await this.unsubscribeFromSession(sessionId);
    }

    const channelName = `chat:${sessionId}`;

    // Create channel
    const channel = supabase
      .channel(channelName)
      // Listen to message changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleMessageChange(payload, callbacks.onMessageChange);
        }
      )
      // Track presence
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = this.mapPresenceState(state);
        callbacks.onPresenceUpdate?.(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        const state = channel.presenceState();
        const users = this.mapPresenceState(state);
        callbacks.onPresenceUpdate?.(users);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        const state = channel.presenceState();
        const users = this.mapPresenceState(state);
        callbacks.onPresenceUpdate?.(users);
      })
      // Listen for typing events
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        this.handleTypingBroadcast(payload, callbacks.onTypingUpdate);
      });

    // Subscribe to channel
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence
        await channel.track({
          userId,
          username,
          online: true,
          lastSeen: Date.now(),
        });

        console.log(`Subscribed to session: ${sessionId}`);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        callbacks.onError?.(new Error(`Channel ${status.toLowerCase()}`));
      }
    });

    // Store channel reference
    this.channels.set(sessionId, channel);
  }

  /**
   * Unsubscribe from a session
   */
  async unsubscribeFromSession(sessionId: string): Promise<void> {
    const channel = this.channels.get(sessionId);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(sessionId);
      console.log(`Unsubscribed from session: ${sessionId}`);
    }
  }

  /**
   * Broadcast typing indicator
   */
  async broadcastTyping(
    sessionId: string,
    userId: string,
    username: string
  ): Promise<void> {
    const channel = this.channels.get(sessionId);
    if (!channel) {
      console.warn('Cannot broadcast typing: not subscribed to session');
      return;
    }

    // Clear existing timeout
    const timeoutKey = `${sessionId}:${userId}`;
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Broadcast typing event
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        username,
        timestamp: Date.now(),
        isTyping: true,
      },
    });

    // Set timeout to clear typing indicator
    const timeout = setTimeout(async () => {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId,
          username,
          timestamp: Date.now(),
          isTyping: false,
        },
      });
      this.typingTimeouts.delete(timeoutKey);
    }, this.typingTimeout);

    this.typingTimeouts.set(timeoutKey, timeout);
  }

  /**
   * Stop typing indicator
   */
  async stopTyping(
    sessionId: string,
    userId: string,
    username: string
  ): Promise<void> {
    const channel = this.channels.get(sessionId);
    if (!channel) return;

    const timeoutKey = `${sessionId}:${userId}`;
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(timeoutKey);
    }

    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        username,
        timestamp: Date.now(),
        isTyping: false,
      },
    });
  }

  /**
   * Update presence status
   */
  async updatePresence(
    sessionId: string,
    userId: string,
    username: string,
    status: Partial<PresenceState>
  ): Promise<void> {
    const channel = this.channels.get(sessionId);
    if (!channel) return;

    await channel.track({
      userId,
      username,
      online: true,
      lastSeen: Date.now(),
      ...status,
    });
  }

  /**
   * Broadcast custom event
   */
  async broadcastEvent(
    sessionId: string,
    event: string,
    payload: any
  ): Promise<void> {
    const channel = this.channels.get(sessionId);
    if (!channel) return;

    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }

  /**
   * Handle message change from Postgres
   */
  private handleMessageChange(
    payload: RealtimePostgresChangesPayload<any>,
    callback?: (change: MessageChange) => void
  ): void {
    if (!callback) return;

    const eventType = payload.eventType;
    const record = payload.new || payload.old;

    if (!record) return;

    // Map database record to ChatMessage
    const message: ChatMessage = {
      id: record.id,
      sessionId: record.session_id,
      role: record.role,
      content: record.content,
      createdAt: new Date(record.created_at),
      updatedAt: record.updated_at ? new Date(record.updated_at) : undefined,
      edited: record.edited || false,
      editCount: record.edit_count || 0,
    };

    let changeType: MessageChangeType;
    if (eventType === 'INSERT') {
      changeType = 'INSERT';
    } else if (eventType === 'UPDATE') {
      changeType = 'UPDATE';
    } else if (eventType === 'DELETE') {
      changeType = 'DELETE';
    } else {
      return;
    }

    callback({ type: changeType, message });
  }

  /**
   * Handle typing broadcast
   */
  private handleTypingBroadcast(
    payload: any,
    callback?: (users: TypingUser[]) => void
  ): void {
    if (!callback) return;

    const { userId, username, timestamp, isTyping } = payload;

    if (isTyping) {
      // Add to typing users
      const typingUser: TypingUser = {
        userId,
        username,
        timestamp,
      };
      callback([typingUser]);
    } else {
      // Remove from typing users
      callback([]);
    }
  }

  /**
   * Map presence state to PresenceState array
   */
  private mapPresenceState(state: Record<string, any[]>): PresenceState[] {
    const users: PresenceState[] = [];

    Object.keys(state).forEach((key) => {
      const presences = state[key];
      if (presences && presences.length > 0) {
        const presence = presences[0];
        users.push({
          userId: presence.userId,
          username: presence.username,
          online: presence.online,
          lastSeen: presence.lastSeen,
        });
      }
    });

    return users;
  }

  /**
   * Cleanup all subscriptions
   */
  async cleanup(): Promise<void> {
    // Clear all typing timeouts
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();

    // Unsubscribe from all channels
    const sessionIds = Array.from(this.channels.keys());
    await Promise.all(sessionIds.map((id) => this.unsubscribeFromSession(id)));
  }

  /**
   * Get active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if subscribed to a session
   */
  isSubscribed(sessionId: string): boolean {
    return this.channels.has(sessionId);
  }
}

export const realtimeCollaborationService = new RealtimeCollaborationService();
