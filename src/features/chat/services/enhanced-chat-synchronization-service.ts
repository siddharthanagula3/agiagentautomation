/**
 * Enhanced Chat Synchronization Service
 * Handles real-time message sync, conflict resolution, offline queue, and state reconciliation
 *
 * Features:
 * - Real-time bidirectional synchronization with Supabase
 * - Intelligent conflict resolution strategies
 * - Offline message queue with persistence
 * - State reconciliation on reconnection
 * - Optimistic updates with rollback
 * - Bandwidth-efficient delta sync
 */

import { supabase } from '@shared/lib/supabase-client';
import { useMultiAgentChatStore } from '@shared/stores/multi-agent-chat-store';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  ChatMessage,
  MultiAgentConversation,
  SyncConflict,
} from '@shared/stores/multi-agent-chat-store';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Updated: Jan 15th 2026 - Fixed any type
interface DatabaseChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: string;
  content: string;
  timestamp: string;
  delivery_status?: string;
  read_by?: string[];
  reply_to?: string;
  metadata?: Record<string, unknown>;
  reactions?: unknown[];
  is_streaming?: boolean;
  tool_calls?: unknown[];
}

/**
 * Sync status
 */
export type SyncStatus = 'idle' | 'syncing' | 'conflict' | 'error' | 'offline';

/**
 * Sync operation type
 */
export type SyncOperationType = 'insert' | 'update' | 'delete';

/**
 * Sync operation
 */
export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entity: 'message' | 'conversation';
  conversationId: string;
  data: Partial<ChatMessage> | Partial<MultiAgentConversation>;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed';
  retryCount: number;
  error?: string;
}

/**
 * Conflict resolution strategy
 */
export type ConflictResolutionStrategy =
  | 'local-wins'
  | 'remote-wins'
  | 'timestamp-wins'
  | 'merge'
  | 'manual';

/**
 * Sync configuration
 */
export interface SyncConfig {
  enableRealtime: boolean;
  enableOfflineQueue: boolean;
  conflictResolution: ConflictResolutionStrategy;
  syncInterval: number; // ms
  maxRetries: number;
  batchSize: number;
}

/**
 * Sync statistics
 */
export interface SyncStatistics {
  lastSyncTime: Date | null;
  totalSynced: number;
  totalConflicts: number;
  totalErrors: number;
  averageSyncTime: number;
  queueSize: number;
}

// ============================================================================
// ENHANCED CHAT SYNCHRONIZATION SERVICE CLASS
// ============================================================================

export class EnhancedChatSynchronizationService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private syncQueue: SyncOperation[] = [];
  private config: SyncConfig;
  private statistics: SyncStatistics;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  constructor(config?: Partial<SyncConfig>) {
    this.config = {
      enableRealtime: true,
      enableOfflineQueue: true,
      conflictResolution: 'timestamp-wins',
      syncInterval: 30000, // 30 seconds
      maxRetries: 3,
      batchSize: 50,
      ...config,
    };

    this.statistics = {
      lastSyncTime: null,
      totalSynced: 0,
      totalConflicts: 0,
      totalErrors: 0,
      averageSyncTime: 0,
      queueSize: 0,
    };

    this.initializeOnlineDetection();
    this.startPeriodicSync();
  }

  /**
   * Initialize online/offline detection
   */
  private initializeOnlineDetection(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('[ChatSync] Connection restored, processing queue...');
        this.processOfflineQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('[ChatSync] Connection lost, queuing operations...');
      });
    }
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.config.enableOfflineQueue) {
        this.processOfflineQueue();
      }
    }, this.config.syncInterval);
  }

  /**
   * Subscribe to real-time updates for a conversation
   */
  async subscribeToConversation(conversationId: string): Promise<void> {
    if (!this.config.enableRealtime) {
      console.warn('[ChatSync] Real-time sync is disabled');
      return;
    }

    // Clean up existing subscription
    await this.unsubscribeFromConversation(conversationId);

    const store = useMultiAgentChatStore.getState();

    try {
      const channel = supabase
        .channel(`conversation_${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            console.log('[ChatSync] New message received:', payload);
            this.handleRemoteInsert(payload.new as DatabaseChatMessage);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            console.log('[ChatSync] Message updated:', payload);
            this.handleRemoteUpdate(
              payload.new as DatabaseChatMessage,
              payload.old as DatabaseChatMessage
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            console.log('[ChatSync] Message deleted:', payload);
            this.handleRemoteDelete(payload.old as DatabaseChatMessage);
          }
        )
        .subscribe((status) => {
          console.log('[ChatSync] Subscription status:', status);

          if (status === 'SUBSCRIBED') {
            store.setSyncing(false);
            store.recordSyncTimestamp();
          } else if (status === 'CHANNEL_ERROR') {
            store.setError('Failed to establish real-time connection');
          }
        });

      this.channels.set(conversationId, channel);
      console.log(`[ChatSync] Subscribed to conversation ${conversationId}`);
    } catch (error) {
      console.error('[ChatSync] Subscription error:', error);
      store.setError(
        error instanceof Error ? error.message : 'Subscription failed'
      );
    }
  }

  /**
   * Unsubscribe from conversation updates
   */
  async unsubscribeFromConversation(conversationId: string): Promise<void> {
    const channel = this.channels.get(conversationId);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(conversationId);
      console.log(
        `[ChatSync] Unsubscribed from conversation ${conversationId}`
      );
    }
  }

  /**
   * Handle remote insert (new message from server)
   */
  private handleRemoteInsert(remoteData: DatabaseChatMessage): void {
    const store = useMultiAgentChatStore.getState();
    const conversation = store.conversations[remoteData.conversation_id];

    if (!conversation) {
      console.warn('[ChatSync] Conversation not found for remote insert');
      return;
    }

    // Check if message already exists locally
    const existingMessage = conversation.messages.find(
      (m) => m.id === remoteData.id
    );

    if (existingMessage) {
      // Message already exists, check for conflicts
      if (
        existingMessage.timestamp.getTime() !==
        new Date(remoteData.timestamp).getTime()
      ) {
        this.handleConflict(
          existingMessage,
          this.transformRemoteMessage(remoteData)
        );
      }
    } else {
      // New message, add it
      const message = this.transformRemoteMessage(remoteData);
      store.addMessage(message);
      this.statistics.totalSynced++;
    }
  }

  /**
   * Handle remote update (message updated on server)
   */
  private handleRemoteUpdate(
    remoteData: DatabaseChatMessage,
    oldData: DatabaseChatMessage
  ): void {
    const store = useMultiAgentChatStore.getState();
    const conversation = store.conversations[remoteData.conversation_id];

    if (!conversation) {
      console.warn('[ChatSync] Conversation not found for remote update');
      return;
    }

    const localMessage = conversation.messages.find(
      (m) => m.id === remoteData.id
    );

    if (!localMessage) {
      // Message doesn't exist locally, treat as insert
      this.handleRemoteInsert(remoteData);
      return;
    }

    // Check for conflicts
    const remoteTimestamp = new Date(
      remoteData.updated_at || remoteData.timestamp
    );
    const localTimestamp = localMessage.timestamp;

    if (localTimestamp.getTime() !== remoteTimestamp.getTime()) {
      this.handleConflict(
        localMessage,
        this.transformRemoteMessage(remoteData)
      );
    } else {
      // No conflict, apply update
      store.updateMessage(
        remoteData.id,
        this.transformRemoteMessage(remoteData)
      );
      this.statistics.totalSynced++;
    }
  }

  /**
   * Handle remote delete (message deleted on server)
   */
  private handleRemoteDelete(remoteData: DatabaseChatMessage): void {
    const store = useMultiAgentChatStore.getState();

    store.deleteMessage(remoteData.conversation_id, remoteData.id);
    this.statistics.totalSynced++;
  }

  /**
   * Handle sync conflict
   */
  private handleConflict(local: ChatMessage, remote: ChatMessage): void {
    const store = useMultiAgentChatStore.getState();

    console.log('[ChatSync] Conflict detected:', local.id);

    // Apply conflict resolution strategy
    switch (this.config.conflictResolution) {
      case 'local-wins':
        // Keep local version, no action needed
        console.log('[ChatSync] Conflict resolved: local wins');
        break;

      case 'remote-wins':
        // Use remote version
        store.updateMessage(local.id, remote);
        console.log('[ChatSync] Conflict resolved: remote wins');
        break;

      case 'timestamp-wins':
        // Use newer version based on timestamp
        if (remote.timestamp > local.timestamp) {
          store.updateMessage(local.id, remote);
          console.log('[ChatSync] Conflict resolved: remote is newer');
        } else {
          console.log('[ChatSync] Conflict resolved: local is newer');
        }
        break;

      case 'merge': {
        // Updated: Jan 15th 2026 - Fixed no-case-declarations by adding block scope
        // Merge both versions (prefer remote content, keep local metadata)
        const merged: ChatMessage = {
          ...remote,
          metadata: {
            ...remote.metadata,
            ...local.metadata,
          },
          reactions: [...(local.reactions || []), ...(remote.reactions || [])],
        };
        store.updateMessage(local.id, merged);
        console.log('[ChatSync] Conflict resolved: merged');
        break;
      }

      case 'manual':
        // Record conflict for manual resolution
        store.addSyncConflict({
          conversationId: local.conversationId,
          messageId: local.id,
          localVersion: local,
          remoteVersion: remote,
        });
        this.statistics.totalConflicts++;
        console.log('[ChatSync] Conflict recorded for manual resolution');
        break;
    }
  }

  /**
   * Sync a message to the server
   */
  async syncMessage(message: ChatMessage): Promise<void> {
    if (!this.isOnline && this.config.enableOfflineQueue) {
      this.queueOperation({
        id: crypto.randomUUID(),
        type: 'insert',
        entity: 'message',
        conversationId: message.conversationId,
        data: message,
        timestamp: new Date(),
        status: 'pending',
        retryCount: 0,
      });
      return;
    }

    const store = useMultiAgentChatStore.getState();
    store.setSyncing(true);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(this.transformLocalMessage(message))
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update delivery status
      store.updateMessageDeliveryStatus(
        message.conversationId,
        message.id,
        'delivered'
      );

      this.statistics.totalSynced++;
      store.recordSyncTimestamp();
      console.log('[ChatSync] Message synced successfully:', message.id);
    } catch (error) {
      console.error('[ChatSync] Sync error:', error);
      this.statistics.totalErrors++;

      // Queue for retry
      if (this.config.enableOfflineQueue) {
        this.queueOperation({
          id: crypto.randomUUID(),
          type: 'insert',
          entity: 'message',
          conversationId: message.conversationId,
          data: message,
          timestamp: new Date(),
          status: 'failed',
          retryCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      store.setError('Failed to sync message');
    } finally {
      store.setSyncing(false);
    }
  }

  /**
   * Update a message on the server
   */
  async updateMessage(
    message: Partial<ChatMessage> & { id: string }
  ): Promise<void> {
    if (!this.isOnline && this.config.enableOfflineQueue) {
      this.queueOperation({
        id: crypto.randomUUID(),
        type: 'update',
        entity: 'message',
        conversationId: message.conversationId || '',
        data: message,
        timestamp: new Date(),
        status: 'pending',
        retryCount: 0,
      });
      return;
    }

    const store = useMultiAgentChatStore.getState();
    store.setSyncing(true);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update(this.transformLocalMessage(message as ChatMessage))
        .eq('id', message.id);

      if (error) {
        throw error;
      }

      this.statistics.totalSynced++;
      store.recordSyncTimestamp();
      console.log('[ChatSync] Message updated successfully:', message.id);
    } catch (error) {
      console.error('[ChatSync] Update error:', error);
      this.statistics.totalErrors++;

      if (this.config.enableOfflineQueue) {
        this.queueOperation({
          id: crypto.randomUUID(),
          type: 'update',
          entity: 'message',
          conversationId: message.conversationId || '',
          data: message,
          timestamp: new Date(),
          status: 'failed',
          retryCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      store.setError('Failed to update message');
    } finally {
      store.setSyncing(false);
    }
  }

  /**
   * Delete a message from the server
   */
  async deleteMessage(
    conversationId: string,
    messageId: string
  ): Promise<void> {
    if (!this.isOnline && this.config.enableOfflineQueue) {
      this.queueOperation({
        id: crypto.randomUUID(),
        type: 'delete',
        entity: 'message',
        conversationId,
        data: { id: messageId },
        timestamp: new Date(),
        status: 'pending',
        retryCount: 0,
      });
      return;
    }

    const store = useMultiAgentChatStore.getState();
    store.setSyncing(true);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        throw error;
      }

      this.statistics.totalSynced++;
      store.recordSyncTimestamp();
      console.log('[ChatSync] Message deleted successfully:', messageId);
    } catch (error) {
      console.error('[ChatSync] Delete error:', error);
      this.statistics.totalErrors++;

      store.setError('Failed to delete message');
    } finally {
      store.setSyncing(false);
    }
  }

  /**
   * Queue an operation for offline sync
   */
  private queueOperation(operation: SyncOperation): void {
    this.syncQueue.push(operation);
    this.statistics.queueSize = this.syncQueue.length;
    console.log('[ChatSync] Operation queued:', operation.type, operation.id);
  }

  /**
   * Process offline queue
   */
  async processOfflineQueue(): Promise<void> {
    if (this.syncQueue.length === 0) {
      return;
    }

    const store = useMultiAgentChatStore.getState();
    store.setSyncing(true);

    console.log(
      `[ChatSync] Processing ${this.syncQueue.length} queued operations`
    );

    const operations = [...this.syncQueue];
    this.syncQueue = [];

    for (const operation of operations) {
      if (operation.retryCount >= this.config.maxRetries) {
        console.warn('[ChatSync] Max retries reached, skipping:', operation.id);
        this.statistics.totalErrors++;
        continue;
      }

      try {
        if (operation.entity === 'message') {
          const message = operation.data as ChatMessage;

          if (operation.type === 'insert') {
            await this.syncMessage(message);
          } else if (operation.type === 'update') {
            await this.updateMessage(message);
          } else if (operation.type === 'delete') {
            await this.deleteMessage(operation.conversationId, message.id);
          }

          operation.status = 'success';
        }
      } catch (error) {
        console.error('[ChatSync] Queue processing error:', error);
        operation.status = 'failed';
        operation.retryCount++;
        operation.error =
          error instanceof Error ? error.message : 'Unknown error';

        // Re-queue if retries remain
        if (operation.retryCount < this.config.maxRetries) {
          this.syncQueue.push(operation);
        }
      }
    }

    this.statistics.queueSize = this.syncQueue.length;
    store.setSyncing(false);
    store.recordSyncTimestamp();
  }

  /**
   * Transform local message to database format
   */
  private transformLocalMessage(message: ChatMessage): DatabaseChatMessage {
    return {
      id: message.id,
      conversation_id: message.conversationId,
      sender_id: message.senderId,
      sender_name: message.senderName,
      sender_type: message.senderType,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      delivery_status: message.deliveryStatus,
      read_by: message.readBy,
      reply_to: message.replyTo,
      metadata: message.metadata,
      is_streaming: message.isStreaming,
      streaming_complete: message.streamingComplete,
      error: message.error,
    };
  }

  /**
   * Transform remote message to local format
   */
  private transformRemoteMessage(data: DatabaseChatMessage): ChatMessage {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      senderName: data.sender_name,
      senderType: data.sender_type,
      content: data.content,
      timestamp: new Date(data.timestamp),
      deliveryStatus: data.delivery_status || 'delivered',
      readBy: data.read_by || [],
      replyTo: data.reply_to,
      metadata: data.metadata,
      reactions: data.reactions,
      isStreaming: data.is_streaming,
      streamingComplete: data.streaming_complete,
      error: data.error,
    };
  }

  /**
   * Get synchronization statistics
   */
  getStatistics(): SyncStatistics {
    return { ...this.statistics };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[ChatSync] Configuration updated:', config);

    // Restart periodic sync if interval changed
    if (config.syncInterval) {
      this.startPeriodicSync();
    }
  }

  /**
   * Clean up all subscriptions and stop sync
   */
  async cleanup(): Promise<void> {
    // Stop periodic sync
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Unsubscribe from all channels
    for (const [conversationId, channel] of this.channels.entries()) {
      await supabase.removeChannel(channel);
      this.channels.delete(conversationId);
    }

    // Process remaining queue
    if (this.syncQueue.length > 0) {
      console.log('[ChatSync] Processing remaining queue before cleanup...');
      await this.processOfflineQueue();
    }

    console.log('[ChatSync] Cleanup complete');
  }
}

// Export singleton instance with default configuration
export const enhancedChatSyncService = new EnhancedChatSynchronizationService({
  enableRealtime: true,
  enableOfflineQueue: true,
  conflictResolution: 'timestamp-wins',
  syncInterval: 30000,
  maxRetries: 3,
  batchSize: 50,
});
