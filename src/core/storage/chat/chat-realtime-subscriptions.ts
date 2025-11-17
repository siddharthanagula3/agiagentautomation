/**
 * Chat Real-Time Subscriptions Service
 *
 * Implements Supabase real-time subscriptions for multi-agent chat:
 * - Message insert/update subscriptions
 * - Typing indicator broadcasts
 * - Presence tracking
 * - Connection state management
 * - Automatic reconnection handling
 */

import { supabase } from '@shared/lib/supabase-client';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import type {
  MultiAgentConversation,
  ConversationParticipant,
  AgentCollaboration,
  RealtimeConversationUpdate,
  RealtimeParticipantUpdate,
  TypingIndicator,
  PresenceState,
} from '@shared/types/multi-agent-chat';

// =============================================
// TYPES
// =============================================

type ConversationUpdateCallback = (update: RealtimeConversationUpdate) => void;
type ParticipantUpdateCallback = (update: RealtimeParticipantUpdate) => void;
// Updated: Nov 16th 2025 - Fixed any type
type MessageCallback = (
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>
) => void;
type TypingCallback = (indicator: TypingIndicator) => void;
type PresenceCallback = (state: PresenceState[]) => void;
type ConnectionStateCallback = (
  state: 'connected' | 'disconnected' | 'reconnecting'
) => void;

// =============================================
// SUBSCRIPTION MANAGER CLASS
// =============================================

export class ChatRealtimeSubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // 2 seconds

  /**
   * Subscribes to conversation updates
   */
  subscribeToConversation(
    conversationId: string,
    onUpdate: ConversationUpdateCallback,
    onConnectionStateChange?: ConnectionStateCallback
  ): () => void {
    const channelName = `conversation:${conversationId}`;

    // Remove existing channel if present
    this.unsubscribe(channelName);

    // Create new channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multi_agent_conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const update: RealtimeConversationUpdate = {
            conversation_id: conversationId,
            update_type: this.mapPostgresEventToUpdateType(payload.eventType),
            data: payload.new || payload.old,
            timestamp: new Date().toISOString(),
          };
          onUpdate(update);
        }
      )
      .subscribe((status) => {
        if (onConnectionStateChange) {
          onConnectionStateChange(this.mapSubscriptionStatus(status));
        }

        if (status === 'CHANNEL_ERROR') {
          this.handleReconnect(channelName, () =>
            this.subscribeToConversation(
              conversationId,
              onUpdate,
              onConnectionStateChange
            )
          );
        }
      });

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribes to participant updates
   */
  subscribeToParticipants(
    conversationId: string,
    onUpdate: ParticipantUpdateCallback,
    onConnectionStateChange?: ConnectionStateCallback
  ): () => void {
    const channelName = `participants:${conversationId}`;

    // Remove existing channel if present
    this.unsubscribe(channelName);

    // Create new channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const participant = (payload.new ||
            payload.old) as ConversationParticipant;
          const update: RealtimeParticipantUpdate = {
            participant_id: participant.id,
            conversation_id: conversationId,
            update_type: this.mapParticipantEvent(payload.eventType),
            data: participant,
            timestamp: new Date().toISOString(),
          };
          onUpdate(update);
        }
      )
      .subscribe((status) => {
        if (onConnectionStateChange) {
          onConnectionStateChange(this.mapSubscriptionStatus(status));
        }

        if (status === 'CHANNEL_ERROR') {
          this.handleReconnect(channelName, () =>
            this.subscribeToParticipants(
              conversationId,
              onUpdate,
              onConnectionStateChange
            )
          );
        }
      });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribes to collaboration updates
   */
  subscribeToCollaborations(
    conversationId: string,
    onUpdate: (collaboration: AgentCollaboration) => void,
    onConnectionStateChange?: ConnectionStateCallback
  ): () => void {
    const channelName = `collaborations:${conversationId}`;

    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_collaborations',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new as AgentCollaboration);
          }
        }
      )
      .subscribe((status) => {
        if (onConnectionStateChange) {
          onConnectionStateChange(this.mapSubscriptionStatus(status));
        }

        if (status === 'CHANNEL_ERROR') {
          this.handleReconnect(channelName, () =>
            this.subscribeToCollaborations(
              conversationId,
              onUpdate,
              onConnectionStateChange
            )
          );
        }
      });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribes to chat messages for a conversation
   */
  subscribeToMessages(
    conversationId: string,
    onMessage: MessageCallback,
    onConnectionStateChange?: ConnectionStateCallback
  ): () => void {
    const channelName = `messages:${conversationId}`;

    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${conversationId}`,
        },
        onMessage
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${conversationId}`,
        },
        onMessage
      )
      .subscribe((status) => {
        if (onConnectionStateChange) {
          onConnectionStateChange(this.mapSubscriptionStatus(status));
        }

        if (status === 'CHANNEL_ERROR') {
          this.handleReconnect(channelName, () =>
            this.subscribeToMessages(
              conversationId,
              onMessage,
              onConnectionStateChange
            )
          );
        }
      });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribes to typing indicators for a conversation
   */
  subscribeToTypingIndicators(
    conversationId: string,
    onTyping: TypingCallback
  ): () => void {
    const channelName = `typing:${conversationId}`;

    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        onTyping(payload.payload as TypingIndicator);
      });

    channel.subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Broadcasts a typing indicator
   */
  async broadcastTyping(
    conversationId: string,
    participantId: string,
    employeeName: string,
    isTyping: boolean
  ): Promise<void> {
    const channelName = `typing:${conversationId}`;
    let channel = this.channels.get(channelName);

    if (!channel) {
      // Create channel if it doesn't exist
      channel = supabase.channel(channelName);
      await channel.subscribe();
      this.channels.set(channelName, channel);
    }

    const indicator: TypingIndicator = {
      conversation_id: conversationId,
      participant_id: participantId,
      employee_name: employeeName,
      is_typing: isTyping,
      timestamp: new Date().toISOString(),
    };

    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: indicator,
    });
  }

  /**
   * Subscribes to presence tracking for a conversation
   */
  subscribeToPresence(
    conversationId: string,
    participantId: string,
    onPresenceChange: PresenceCallback
  ): () => void {
    const channelName = `presence:${conversationId}`;

    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const states: PresenceState[] = [];

        // Updated: Nov 16th 2025 - Fixed any type
        Object.values(presenceState).forEach((presences: unknown) => {
          if (Array.isArray(presences)) {
            presences.forEach((presence: unknown) => {
              states.push(presence as PresenceState);
            });
          }
        });

        onPresenceChange(states);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Handle new presence
        console.log('New presence:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Handle left presence
        console.log('Left presence:', leftPresences);
      });

    // Track this participant's presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          conversation_id: conversationId,
          participant_id: participantId,
          status: 'online',
          last_seen: new Date().toISOString(),
        });
      }
    });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Updates presence status
   */
  async updatePresenceStatus(
    conversationId: string,
    participantId: string,
    status: 'online' | 'offline' | 'busy'
  ): Promise<void> {
    const channelName = `presence:${conversationId}`;
    const channel = this.channels.get(channelName);

    if (channel) {
      await channel.track({
        conversation_id: conversationId,
        participant_id: participantId,
        status,
        last_seen: new Date().toISOString(),
      });
    }
  }

  /**
   * Unsubscribes from a specific channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.reconnectAttempts.delete(channelName);
    }
  }

  /**
   * Unsubscribes from all channels
   */
  // Updated: Nov 16th 2025 - Enhanced cleanup to prevent memory leaks from subscription tokens
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Gets the connection state of a channel
   */
  getChannelState(channelName: string): string | undefined {
    const channel = this.channels.get(channelName);
    return channel?.state;
  }

  /**
   * Gets all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  private mapPostgresEventToUpdateType(
    eventType: string
  ): RealtimeConversationUpdate['update_type'] {
    switch (eventType) {
      case 'UPDATE':
        return 'stats_updated';
      case 'INSERT':
        return 'message_added';
      default:
        return 'stats_updated';
    }
  }

  private mapParticipantEvent(
    eventType: string
  ): RealtimeParticipantUpdate['update_type'] {
    switch (eventType) {
      case 'INSERT':
        return 'activity';
      case 'UPDATE':
        return 'status_change';
      default:
        return 'stats_updated';
    }
  }

  private mapSubscriptionStatus(
    status: string
  ): 'connected' | 'disconnected' | 'reconnecting' {
    switch (status) {
      case 'SUBSCRIBED':
        return 'connected';
      case 'CLOSED':
        return 'disconnected';
      case 'CHANNEL_ERROR':
        return 'reconnecting';
      default:
        return 'disconnected';
    }
  }

  private handleReconnect(channelName: string, reconnectFn: () => void): void {
    const attempts = this.reconnectAttempts.get(channelName) || 0;

    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(channelName, attempts + 1);

      setTimeout(
        () => {
          console.log(
            `Reconnecting channel ${channelName} (attempt ${attempts + 1}/${this.maxReconnectAttempts})`
          );
          reconnectFn();
        },
        this.reconnectDelay * Math.pow(2, attempts)
      ); // Exponential backoff
    } else {
      console.error(
        `Max reconnection attempts reached for channel ${channelName}`
      );
      this.reconnectAttempts.delete(channelName);
    }
  }
}

// =============================================
// SINGLETON INSTANCE
// =============================================

let subscriptionManager: ChatRealtimeSubscriptionManager | null = null;

/**
 * Gets the singleton subscription manager instance
 */
export function getSubscriptionManager(): ChatRealtimeSubscriptionManager {
  if (!subscriptionManager) {
    subscriptionManager = new ChatRealtimeSubscriptionManager();
  }
  return subscriptionManager;
}

/**
 * Resets the subscription manager (useful for testing)
 */
export function resetSubscriptionManager(): void {
  if (subscriptionManager) {
    subscriptionManager.unsubscribeAll();
    subscriptionManager = null;
  }
}

// =============================================
// CONVENIENCE FUNCTIONS
// =============================================

/**
 * Subscribes to all updates for a conversation
 */
export function subscribeToConversationUpdates(
  conversationId: string,
  callbacks: {
    onConversationUpdate?: ConversationUpdateCallback;
    onParticipantUpdate?: ParticipantUpdateCallback;
    onMessage?: MessageCallback;
    onTyping?: TypingCallback;
    onPresenceChange?: PresenceCallback;
    onConnectionStateChange?: ConnectionStateCallback;
  },
  options?: {
    participantId?: string;
  }
): () => void {
  const manager = getSubscriptionManager();
  const unsubscribeFns: Array<() => void> = [];

  // Subscribe to conversation updates
  if (callbacks.onConversationUpdate) {
    unsubscribeFns.push(
      manager.subscribeToConversation(
        conversationId,
        callbacks.onConversationUpdate,
        callbacks.onConnectionStateChange
      )
    );
  }

  // Subscribe to participant updates
  if (callbacks.onParticipantUpdate) {
    unsubscribeFns.push(
      manager.subscribeToParticipants(
        conversationId,
        callbacks.onParticipantUpdate,
        callbacks.onConnectionStateChange
      )
    );
  }

  // Subscribe to messages
  if (callbacks.onMessage) {
    unsubscribeFns.push(
      manager.subscribeToMessages(
        conversationId,
        callbacks.onMessage,
        callbacks.onConnectionStateChange
      )
    );
  }

  // Subscribe to typing indicators
  if (callbacks.onTyping) {
    unsubscribeFns.push(
      manager.subscribeToTypingIndicators(conversationId, callbacks.onTyping)
    );
  }

  // Subscribe to presence
  if (callbacks.onPresenceChange && options?.participantId) {
    unsubscribeFns.push(
      manager.subscribeToPresence(
        conversationId,
        options.participantId,
        callbacks.onPresenceChange
      )
    );
  }

  // Return function to unsubscribe from all
  return () => {
    unsubscribeFns.forEach((unsubscribe) => unsubscribe());
  };
}

/**
 * Broadcasts typing status for a participant
 */
export async function broadcastTypingStatus(
  conversationId: string,
  participantId: string,
  employeeName: string,
  isTyping: boolean
): Promise<void> {
  const manager = getSubscriptionManager();
  await manager.broadcastTyping(
    conversationId,
    participantId,
    employeeName,
    isTyping
  );
}

/**
 * Updates participant presence status
 */
export async function updatePresence(
  conversationId: string,
  participantId: string,
  status: 'online' | 'offline' | 'busy'
): Promise<void> {
  const manager = getSubscriptionManager();
  await manager.updatePresenceStatus(conversationId, participantId, status);
}

/**
 * Cleans up all subscriptions (call on app unmount)
 */
export function cleanupSubscriptions(): void {
  const manager = getSubscriptionManager();
  manager.unsubscribeAll();
}

// =============================================
// REACT HOOKS (Optional - for convenience)
// =============================================

/**
 * React hook for subscribing to conversation updates
 * Usage in a React component:
 *
 * import { useConversationSubscription } from '@core/storage/chat/chat-realtime-subscriptions';
 *
 * function MyComponent({ conversationId }) {
 *   useConversationSubscription(conversationId, {
 *     onMessage: (payload) => console.log('New message:', payload),
 *     onTyping: (indicator) => console.log('Typing:', indicator)
 *   });
 * }
 */
export function useConversationSubscription(
  conversationId: string,
  callbacks: Parameters<typeof subscribeToConversationUpdates>[1],
  options?: Parameters<typeof subscribeToConversationUpdates>[2]
) {
  // This would need React imports to work properly
  // For now, it's a placeholder showing the intended API

  // useEffect(() => {
  //   const unsubscribe = subscribeToConversationUpdates(
  //     conversationId,
  //     callbacks,
  //     options
  //   );
  //
  //   return unsubscribe;
  // }, [conversationId]);

  console.warn(
    'useConversationSubscription requires React imports. Use subscribeToConversationUpdates directly for now.'
  );
}
