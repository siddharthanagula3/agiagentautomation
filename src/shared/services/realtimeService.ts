/**
 * Realtime Service
 * Provides real-time subscriptions using Supabase Realtime
 *
 * This service manages:
 * - Database change subscriptions (postgres_changes)
 * - Broadcast messaging between clients
 * - Presence tracking for online users
 * - Automatic reconnection handling
 */

import { supabase } from '@shared/lib/supabase-client';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

// =============================================
// TYPES
// =============================================

type Unsubscribe = () => void;

export interface RealtimeCallbacks {
  onJobUpdate?: (job: unknown) => void;
  onJobCreated?: (job: unknown) => void;
  onJobDeleted?: (jobId: string) => void;
  onAgentUpdate?: (agent: unknown) => void;
  onNotification?: (notification: unknown) => void;
  onError?: (error: string) => void;
}

export interface ConnectionStatus {
  connected: boolean;
  channels: string[];
  lastError?: string;
}

export interface RealtimeService {
  connect: () => void;
  disconnect: () => void;
  subscribe: (
    channel: string,
    handler: (...args: unknown[]) => void
  ) => Unsubscribe;
  publish: (channel: string, payload: unknown) => void;
  // Extended API for useRealtime hook
  initializeRealtime: (
    userId: string,
    callbacks: RealtimeCallbacks
  ) => Promise<void>;
  cleanup: () => Promise<void>;
  getConnectionStatus: () => ConnectionStatus;
  reconnect: (userId: string) => Promise<void>;
}

// =============================================
// IMPLEMENTATION
// =============================================

class RealtimeServiceImpl implements RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private userId: string | null = null;
  private callbacks: RealtimeCallbacks = {};
  private connectionState: ConnectionStatus = {
    connected: false,
    channels: [],
  };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  // Track reconnect timeouts to prevent memory leaks
  private reconnectTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

  /**
   * Connect to the realtime service
   * Called automatically when subscribing to channels
   */
  connect(): void {
    this.connectionState.connected = true;
    console.log('[RealtimeService] Connected');
  }

  /**
   * Disconnect from all channels
   */
  disconnect(): void {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.connectionState.connected = false;
    this.connectionState.channels = [];
    console.log('[RealtimeService] Disconnected from all channels');
  }

  /**
   * Subscribe to a channel with postgres_changes
   * @param channelName - Name of the channel (can be table name or custom)
   * @param handler - Callback for received messages
   * @returns Unsubscribe function
   */
  subscribe(
    channelName: string,
    handler: (...args: unknown[]) => void
  ): Unsubscribe {
    // Remove existing subscription if present
    this.unsubscribeChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: channelName,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          handler(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.connectionState.connected = true;
          if (!this.connectionState.channels.includes(channelName)) {
            this.connectionState.channels.push(channelName);
          }
          this.reconnectAttempts = 0;
          console.log(`[RealtimeService] Subscribed to ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          this.handleReconnect(channelName, () =>
            this.subscribe(channelName, handler)
          );
        } else if (status === 'CLOSED') {
          this.connectionState.channels = this.connectionState.channels.filter(
            (c) => c !== channelName
          );
        }
      });

    this.channels.set(channelName, channel);

    return () => this.unsubscribeChannel(channelName);
  }

  /**
   * Publish a message to a channel via broadcast
   * @param channelName - Name of the channel
   * @param payload - Data to broadcast
   */
  publish(channelName: string, payload: unknown): void {
    let channel = this.channels.get(channelName);

    if (!channel) {
      // Create a broadcast-only channel if it doesn't exist
      channel = supabase.channel(channelName);
      channel.subscribe();
      this.channels.set(channelName, channel);
    }

    channel.send({
      type: 'broadcast',
      event: 'message',
      payload,
    });
  }

  /**
   * Initialize realtime subscriptions for a user
   * Sets up subscriptions for jobs, agents, and notifications
   */
  async initializeRealtime(
    userId: string,
    callbacks: RealtimeCallbacks
  ): Promise<void> {
    this.userId = userId;
    this.callbacks = callbacks;

    try {
      // Subscribe to job updates (workforce_tasks)
      this.subscribeToTable(
        `jobs:${userId}`,
        'workforce_tasks',
        `user_id=eq.${userId}`,
        (payload) => {
          const eventType = payload.eventType;
          const data = payload.new || payload.old;

          switch (eventType) {
            case 'INSERT':
              callbacks.onJobCreated?.(data);
              break;
            case 'UPDATE':
              callbacks.onJobUpdate?.(data);
              break;
            case 'DELETE':
              callbacks.onJobDeleted?.((data as { id?: string })?.id || '');
              break;
          }
        }
      );

      // Subscribe to agent updates (purchased_employees)
      this.subscribeToTable(
        `agents:${userId}`,
        'purchased_employees',
        `user_id=eq.${userId}`,
        (payload) => {
          if (payload.new) {
            callbacks.onAgentUpdate?.(payload.new);
          }
        }
      );

      // Subscribe to notifications
      this.subscribeToTable(
        `notifications:${userId}`,
        'notifications',
        `user_id=eq.${userId}`,
        (payload) => {
          if (payload.new) {
            callbacks.onNotification?.(payload.new);
          }
        }
      );

      this.connect();
      console.log(`[RealtimeService] Initialized realtime for user: ${userId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.connectionState.lastError = errorMessage;
      callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Clean up all subscriptions
   */
  async cleanup(): Promise<void> {
    // Clear all pending reconnect timeouts first
    this.clearReconnectTimeouts();
    this.disconnect();
    this.userId = null;
    this.callbacks = {};
    this.reconnectAttempts = 0;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionState };
  }

  /**
   * Reconnect all subscriptions for a user
   */
  async reconnect(userId: string): Promise<void> {
    await this.cleanup();
    await this.initializeRealtime(userId, this.callbacks);
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  /**
   * Subscribe to a specific database table with filter
   */
  private subscribeToTable(
    channelName: string,
    table: string,
    filter: string,
    handler: (
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>
    ) => void
  ): void {
    // Remove existing subscription if present
    this.unsubscribeChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        handler
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (!this.connectionState.channels.includes(channelName)) {
            this.connectionState.channels.push(channelName);
          }
          console.log(
            `[RealtimeService] Subscribed to ${table} (${channelName})`
          );
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[RealtimeService] Channel error for ${channelName}`);
          this.handleReconnect(channelName, () =>
            this.subscribeToTable(channelName, table, filter, handler)
          );
        }
      });

    this.channels.set(channelName, channel);
  }

  /**
   * Unsubscribe from a specific channel
   */
  private unsubscribeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.connectionState.channels = this.connectionState.channels.filter(
        (c) => c !== channelName
      );
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(channelName: string, reconnectFn: () => void): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `[RealtimeService] Max reconnect attempts reached for ${channelName}`
      );
      this.connectionState.lastError = `Failed to reconnect to ${channelName} after ${this.maxReconnectAttempts} attempts`;
      this.callbacks.onError?.(this.connectionState.lastError);
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(
      `[RealtimeService] Reconnecting ${channelName} in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    const timeoutId = setTimeout(() => {
      // Remove from tracking set once executed
      this.reconnectTimeouts.delete(timeoutId);
      reconnectFn();
    }, delay);

    // Track the timeout for cleanup
    this.reconnectTimeouts.add(timeoutId);
  }

  /**
   * Clear all pending reconnect timeouts
   */
  private clearReconnectTimeouts(): void {
    this.reconnectTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.reconnectTimeouts.clear();
  }
}

// =============================================
// SINGLETON EXPORT
// =============================================

export const realtimeService: RealtimeService = new RealtimeServiceImpl();
