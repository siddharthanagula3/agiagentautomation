/**
 * Offline Sync Manager
 *
 * Manages offline mode for the chat application:
 * - Detects online/offline status
 * - Queues operations when offline
 * - Syncs when connection is restored
 * - Provides conflict resolution
 */

import { chatPersistenceService } from '@features/chat/services/conversation-storage';
import type { ChatMessage } from '@features/chat/types';

export interface QueuedOperation {
  id: string;
  type: 'create_message' | 'update_message' | 'delete_message' | 'create_session' | 'update_session';
  payload: any;
  timestamp: number;
  attempts: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface SyncStatus {
  online: boolean;
  syncing: boolean;
  queueSize: number;
  lastSyncTime: number | null;
  failedOperations: number;
}

export type ConnectionStatus = 'online' | 'offline' | 'slow';

export class OfflineSyncManager {
  private queue: Map<string, QueuedOperation> = new Map();
  private isOnline = navigator.onLine;
  private isSyncing = false;
  private connectionType: ConnectionStatus = 'online';
  private lastSyncTime: number | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly storageKey = 'agi-offline-queue';
  private readonly syncIntervalMs = 30000; // 30 seconds
  private readonly maxRetries = 3;

  private statusCallbacks: Set<(status: SyncStatus) => void> = new Set();
  private connectionCallbacks: Set<(status: ConnectionStatus) => void> = new Set();

  constructor() {
    this.loadQueue();
    this.setupEventListeners();
    this.startSyncInterval();
  }

  /**
   * Setup online/offline event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('Connection restored');
      this.isOnline = true;
      this.connectionType = 'online';
      this.notifyConnectionChange();
      this.syncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost');
      this.isOnline = false;
      this.connectionType = 'offline';
      this.notifyConnectionChange();
    });

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', () => {
        this.updateConnectionType();
      });
    }

    // Visibility change - sync when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncQueue();
      }
    });
  }

  /**
   * Update connection type based on network information
   */
  private updateConnectionType(): void {
    if (!this.isOnline) {
      this.connectionType = 'offline';
      return;
    }

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;

      if (effectiveType === '2g' || effectiveType === 'slow-2g') {
        this.connectionType = 'slow';
      } else {
        this.connectionType = 'online';
      }
    } else {
      this.connectionType = 'online';
    }

    this.notifyConnectionChange();
  }

  /**
   * Start automatic sync interval
   */
  private startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.queue.size > 0) {
        this.syncQueue();
      }
    }, this.syncIntervalMs);
  }

  /**
   * Stop automatic sync interval
   */
  private stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const operations: QueuedOperation[] = JSON.parse(stored);
        operations.forEach((op) => {
          this.queue.set(op.id, op);
        });
        console.log(`Loaded ${operations.length} operations from storage`);
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    try {
      const operations = Array.from(this.queue.values());
      localStorage.setItem(this.storageKey, JSON.stringify(operations));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  /**
   * Add operation to queue
   */
  enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'attempts' | 'status'>): string {
    const id = `${operation.type}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const queuedOp: QueuedOperation = {
      id,
      ...operation,
      timestamp: Date.now(),
      attempts: 0,
      status: 'pending',
    };

    this.queue.set(id, queuedOp);
    this.saveQueue();
    this.notifyStatusChange();

    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.syncQueue();
    }

    return id;
  }

  /**
   * Remove operation from queue
   */
  dequeue(operationId: string): void {
    this.queue.delete(operationId);
    this.saveQueue();
    this.notifyStatusChange();
  }

  /**
   * Sync all pending operations
   */
  async syncQueue(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.queue.size === 0) {
      return;
    }

    this.isSyncing = true;
    this.notifyStatusChange();

    console.log(`Syncing ${this.queue.size} operations...`);

    const operations = Array.from(this.queue.values())
      .filter((op) => op.status === 'pending' || op.status === 'failed')
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const operation of operations) {
      try {
        // Update status
        operation.status = 'syncing';
        operation.attempts++;
        this.queue.set(operation.id, operation);
        this.notifyStatusChange();

        // Execute operation
        await this.executeOperation(operation);

        // Mark as completed and remove from queue
        this.dequeue(operation.id);

        console.log(`Successfully synced operation: ${operation.id}`);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);

        // Update error status
        operation.status = 'failed';
        operation.error = error instanceof Error ? error.message : 'Unknown error';
        this.queue.set(operation.id, operation);

        // Remove if max retries exceeded
        if (operation.attempts >= this.maxRetries) {
          console.warn(`Removing operation after ${this.maxRetries} failed attempts:`, operation.id);
          this.dequeue(operation.id);
        }
      }
    }

    this.isSyncing = false;
    this.lastSyncTime = Date.now();
    this.saveQueue();
    this.notifyStatusChange();

    console.log('Sync completed');
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    switch (operation.type) {
      case 'create_message':
        await this.syncCreateMessage(operation.payload);
        break;

      case 'update_message':
        await this.syncUpdateMessage(operation.payload);
        break;

      case 'delete_message':
        await this.syncDeleteMessage(operation.payload);
        break;

      case 'create_session':
        await this.syncCreateSession(operation.payload);
        break;

      case 'update_session':
        await this.syncUpdateSession(operation.payload);
        break;

      default:
        throw new Error(`Unknown operation type: ${(operation as any).type}`);
    }
  }

  /**
   * Sync create message operation
   */
  private async syncCreateMessage(payload: {
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
  }): Promise<void> {
    await chatPersistenceService.saveMessage(payload.sessionId, payload.role, payload.content);
  }

  /**
   * Sync update message operation
   */
  private async syncUpdateMessage(payload: {
    messageId: string;
    content: string;
  }): Promise<void> {
    await chatPersistenceService.updateMessage(payload.messageId, payload.content);
  }

  /**
   * Sync delete message operation
   */
  private async syncDeleteMessage(payload: { messageId: string }): Promise<void> {
    await chatPersistenceService.deleteMessage(payload.messageId);
  }

  /**
   * Sync create session operation
   */
  private async syncCreateSession(payload: {
    userId: string;
    title: string;
    metadata?: any;
  }): Promise<void> {
    await chatPersistenceService.createSession(payload.userId, payload.title, payload.metadata);
  }

  /**
   * Sync update session operation
   */
  private async syncUpdateSession(payload: {
    sessionId: string;
    title?: string;
    userId?: string;
  }): Promise<void> {
    if (payload.title) {
      await chatPersistenceService.updateSessionTitle(
        payload.sessionId,
        payload.title,
        payload.userId
      );
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    const failedCount = Array.from(this.queue.values()).filter(
      (op) => op.status === 'failed'
    ).length;

    return {
      online: this.isOnline,
      syncing: this.isSyncing,
      queueSize: this.queue.size,
      lastSyncTime: this.lastSyncTime,
      failedOperations: failedCount,
    };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionType;
  }

  /**
   * Check if online
   */
  isConnected(): boolean {
    return this.isOnline;
  }

  /**
   * Get pending operations
   */
  getPendingOperations(): QueuedOperation[] {
    return Array.from(this.queue.values()).filter((op) => op.status === 'pending');
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): QueuedOperation[] {
    return Array.from(this.queue.values()).filter((op) => op.status === 'failed');
  }

  /**
   * Retry a specific operation
   */
  async retryOperation(operationId: string): Promise<void> {
    const operation = this.queue.get(operationId);
    if (!operation) {
      throw new Error(`Operation not found: ${operationId}`);
    }

    if (!this.isOnline) {
      throw new Error('Cannot retry operation while offline');
    }

    operation.status = 'pending';
    operation.attempts = 0;
    this.queue.set(operationId, operation);
    this.saveQueue();

    await this.syncQueue();
  }

  /**
   * Retry all failed operations
   */
  async retryFailedOperations(): Promise<void> {
    const failedOps = this.getFailedOperations();

    failedOps.forEach((op) => {
      op.status = 'pending';
      op.attempts = 0;
      this.queue.set(op.id, op);
    });

    this.saveQueue();
    await this.syncQueue();
  }

  /**
   * Clear all operations
   */
  clearQueue(): void {
    this.queue.clear();
    this.saveQueue();
    this.notifyStatusChange();
  }

  /**
   * Clear only failed operations
   */
  clearFailedOperations(): void {
    const failedOps = this.getFailedOperations();
    failedOps.forEach((op) => this.dequeue(op.id));
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusCallbacks.add(callback);

    // Call immediately with current status
    callback(this.getStatus());

    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to connection changes
   */
  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionCallbacks.add(callback);

    // Call immediately with current status
    callback(this.connectionType);

    // Return unsubscribe function
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  /**
   * Notify subscribers of status change
   */
  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.statusCallbacks.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  /**
   * Notify subscribers of connection change
   */
  private notifyConnectionChange(): void {
    this.connectionCallbacks.forEach((callback) => {
      try {
        callback(this.connectionType);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  /**
   * Cleanup and stop sync
   */
  destroy(): void {
    this.stopSyncInterval();
    this.statusCallbacks.clear();
    this.connectionCallbacks.clear();
  }
}

// Singleton instance
export const offlineSyncManager = new OfflineSyncManager();
