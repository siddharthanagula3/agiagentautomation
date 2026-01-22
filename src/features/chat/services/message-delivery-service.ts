/**
 * Message Delivery Service
 * Handles message delivery tracking and confirmation:
 * - Delivery confirmation tracking
 * - Read receipt management
 * - Message retry logic with exponential backoff
 * - Delivery status updates
 * - Offline message queueing
 * - Message acknowledgment system
 */

import { supabase } from '@shared/lib/supabase-client';
import {
  websocketManager,
  MessageType,
} from '@core/integrations/websocket-manager';
import type { ChatMessage } from '../types';

// Delivery status types
export enum DeliveryStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

// Read receipt status
export enum ReadReceiptStatus {
  UNREAD = 'unread',
  READ = 'read',
  READ_BY_ALL = 'read_by_all',
}

// Message delivery record
export interface MessageDeliveryRecord {
  messageId: string;
  sessionId: string;
  senderId: string;
  recipientIds: string[];
  status: DeliveryStatus;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
  failedAt?: number;
  retryCount: number;
  maxRetries: number;
  error?: string;
  metadata?: {
    agentId?: string;
    priority?: 'high' | 'normal' | 'low';
    requiresAck?: boolean;
  };
}

// Read receipt record
export interface ReadReceiptRecord {
  messageId: string;
  userId: string;
  sessionId: string;
  readAt: number;
  metadata?: {
    deviceType?: string;
    location?: string;
  };
}

// Delivery confirmation
export interface DeliveryConfirmation {
  messageId: string;
  recipientId: string;
  status: DeliveryStatus;
  timestamp: number;
}

// Retry policy configuration
interface RetryPolicy {
  maxRetries: number;
  baseDelay: number; // Base delay in ms
  maxDelay: number; // Max delay in ms
  backoffMultiplier: number; // Exponential backoff multiplier
}

// Default retry policy
const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 60000, // 1 minute
  backoffMultiplier: 2,
};

// Configuration
const MESSAGE_TIMEOUT = 30000; // 30 seconds for message to be delivered
const READ_RECEIPT_TIMEOUT = 60000; // 1 minute for read receipt
const CLEANUP_INTERVAL = 300000; // 5 minutes - cleanup old records

export class MessageDeliveryService {
  private deliveryRecords: Map<string, MessageDeliveryRecord> = new Map();
  private readReceipts: Map<string, ReadReceiptRecord[]> = new Map();
  private pendingMessages: Map<string, ChatMessage> = new Map();
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();
  private deliveryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private cleanupTimer?: NodeJS.Timeout;
  private retryPolicy: RetryPolicy;

  constructor(retryPolicy: Partial<RetryPolicy> = {}) {
    this.retryPolicy = { ...DEFAULT_RETRY_POLICY, ...retryPolicy };
    this.startCleanupTimer();
    this.setupWebSocketListeners();
  }

  /**
   * Send a message with delivery tracking
   */
  async sendMessage(
    message: ChatMessage,
    recipientIds: string[],
    options: {
      requiresAck?: boolean;
      priority?: 'high' | 'normal' | 'low';
      agentId?: string;
    } = {}
  ): Promise<MessageDeliveryRecord> {
    const messageId = message.id;
    const sessionId = message.sessionId || '';
    const senderId = message.metadata?.userId || '';

    // Create delivery record
    const record: MessageDeliveryRecord = {
      messageId,
      sessionId,
      senderId,
      recipientIds,
      status: DeliveryStatus.PENDING,
      retryCount: 0,
      maxRetries: this.retryPolicy.maxRetries,
      metadata: {
        agentId: options.agentId,
        priority: options.priority || 'normal',
        requiresAck: options.requiresAck,
      },
    };

    this.deliveryRecords.set(messageId, record);
    this.pendingMessages.set(messageId, message);

    // Attempt to send
    try {
      await this.attemptDelivery(record, message);
    } catch (error) {
      console.error('[MessageDelivery] Send failed', error);
      await this.handleDeliveryFailure(record, error);
    }

    return record;
  }

  /**
   * Attempt to deliver a message
   */
  private async attemptDelivery(
    record: MessageDeliveryRecord,
    message: ChatMessage
  ): Promise<void> {
    // Update status
    record.status = DeliveryStatus.SENDING;
    this.emitStatusUpdate(record);

    try {
      // Save to database first
      await this.saveMessageToDatabase(message);

      // Send via WebSocket to all recipients
      const promises = record.recipientIds.map((recipientId) =>
        websocketManager.send(`collaboration-${record.sessionId}`, {
          type: MessageType.CHAT,
          payload: {
            message,
            deliveryId: record.messageId,
            requiresAck: record.metadata?.requiresAck,
          },
          sessionId: record.sessionId,
          userId: recipientId,
          priority: record.metadata?.priority,
        })
      );

      await Promise.all(promises);

      // Update status to sent
      record.status = DeliveryStatus.SENT;
      record.sentAt = Date.now();
      this.emitStatusUpdate(record);

      // Set delivery timeout
      this.setDeliveryTimeout(record);

      // If acknowledgment not required, mark as delivered immediately
      if (!record.metadata?.requiresAck) {
        record.status = DeliveryStatus.DELIVERED;
        record.deliveredAt = Date.now();
        this.emitStatusUpdate(record);
        this.clearPendingMessage(record.messageId);
      }
      // Updated: Jan 15th 2026 - Removed useless catch block that only re-throws
    } catch (error) {
      // Handle delivery failure
      await this.handleDeliveryFailure(record, error);
      throw error;
    }
  }

  /**
   * Handle delivery failure with retry logic
   */
  private async handleDeliveryFailure(
    record: MessageDeliveryRecord,
    error: unknown
  ): Promise<void> {
    record.retryCount++;
    record.error = error instanceof Error ? error.message : 'Unknown error';

    if (record.retryCount < record.maxRetries) {
      // Schedule retry with exponential backoff
      const delay = this.calculateRetryDelay(record.retryCount);

      const timer = setTimeout(() => {
        const message = this.pendingMessages.get(record.messageId);
        if (message) {
          this.attemptDelivery(record, message).catch((error) => {
            this.handleDeliveryFailure(record, error);
          });
        }
        this.retryTimers.delete(record.messageId);
      }, delay);

      this.retryTimers.set(record.messageId, timer);
    } else {
      // Max retries exceeded
      record.status = DeliveryStatus.FAILED;
      record.failedAt = Date.now();
      this.emitStatusUpdate(record);
      this.clearPendingMessage(record.messageId);

      console.error(
        `[MessageDelivery] Message ${record.messageId} failed after ${record.retryCount} retries`
      );
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const delay = Math.min(
      this.retryPolicy.baseDelay *
        Math.pow(this.retryPolicy.backoffMultiplier, retryCount - 1),
      this.retryPolicy.maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return delay + jitter;
  }

  /**
   * Set delivery timeout
   */
  private setDeliveryTimeout(record: MessageDeliveryRecord): void {
    const timer = setTimeout(() => {
      if (
        record.status === DeliveryStatus.SENT &&
        record.metadata?.requiresAck
      ) {
        console.warn(
          `[MessageDelivery] Delivery timeout for message ${record.messageId}`
        );
        // Don't mark as failed, just note the timeout
        // The message may still be delivered
      }
      this.deliveryTimeouts.delete(record.messageId);
    }, MESSAGE_TIMEOUT);

    this.deliveryTimeouts.set(record.messageId, timer);
  }

  /**
   * Handle delivery confirmation from recipient
   */
  async confirmDelivery(confirmation: DeliveryConfirmation): Promise<void> {
    const record = this.deliveryRecords.get(confirmation.messageId);
    if (!record) {
      console.warn(
        `[MessageDelivery] Record not found for message ${confirmation.messageId}`
      );
      return;
    }

    // Clear timeout
    const timeout = this.deliveryTimeouts.get(confirmation.messageId);
    if (timeout) {
      clearTimeout(timeout);
      this.deliveryTimeouts.delete(confirmation.messageId);
    }

    // Update status
    if (confirmation.status === DeliveryStatus.DELIVERED) {
      record.status = DeliveryStatus.DELIVERED;
      record.deliveredAt = confirmation.timestamp;
      this.emitStatusUpdate(record);
      this.clearPendingMessage(record.messageId);
    }
  }

  /**
   * Mark message as read by a user
   */
  async markAsRead(
    messageId: string,
    userId: string,
    sessionId: string,
    metadata?: ReadReceiptRecord['metadata']
  ): Promise<void> {
    const receipt: ReadReceiptRecord = {
      messageId,
      userId,
      sessionId,
      readAt: Date.now(),
      metadata,
    };

    // Store read receipt
    if (!this.readReceipts.has(messageId)) {
      this.readReceipts.set(messageId, []);
    }
    this.readReceipts.get(messageId)!.push(receipt);

    // Update delivery record
    const record = this.deliveryRecords.get(messageId);
    if (record) {
      const allRead = record.recipientIds.every((recipientId) =>
        this.isMessageReadBy(messageId, recipientId)
      );

      if (allRead) {
        record.status = DeliveryStatus.READ;
        record.readAt = Date.now();
        this.emitStatusUpdate(record);
      }
    }

    // Broadcast read receipt
    await websocketManager
      .send(`collaboration-${sessionId}`, {
        type: MessageType.READ_RECEIPT,
        payload: receipt,
        sessionId,
        userId,
      })
      .catch((error) => {
        console.error(
          '[MessageDelivery] Failed to broadcast read receipt',
          error
        );
      });

    // Save to database
    await this.saveReadReceiptToDatabase(receipt);
  }

  /**
   * Check if message was read by a specific user
   */
  isMessageReadBy(messageId: string, userId: string): boolean {
    const receipts = this.readReceipts.get(messageId) || [];
    return receipts.some((receipt) => receipt.userId === userId);
  }

  /**
   * Get read receipts for a message
   */
  getReadReceipts(messageId: string): ReadReceiptRecord[] {
    return this.readReceipts.get(messageId) || [];
  }

  /**
   * Get delivery status for a message
   */
  getDeliveryStatus(messageId: string): MessageDeliveryRecord | undefined {
    return this.deliveryRecords.get(messageId);
  }

  /**
   * Get all pending messages
   */
  getPendingMessages(): ChatMessage[] {
    return Array.from(this.pendingMessages.values());
  }

  /**
   * Retry failed message
   */
  async retryMessage(messageId: string): Promise<void> {
    const record = this.deliveryRecords.get(messageId);
    const message = this.pendingMessages.get(messageId);

    if (!record || !message) {
      throw new Error(`Message not found: ${messageId}`);
    }

    if (record.status !== DeliveryStatus.FAILED) {
      throw new Error(`Message is not in failed state: ${messageId}`);
    }

    // Reset retry count and attempt delivery
    record.retryCount = 0;
    record.status = DeliveryStatus.PENDING;
    record.error = undefined;

    await this.attemptDelivery(record, message);
  }

  /**
   * Cancel message delivery
   */
  cancelDelivery(messageId: string): void {
    // Clear timers
    const retryTimer = this.retryTimers.get(messageId);
    if (retryTimer) {
      clearTimeout(retryTimer);
      this.retryTimers.delete(messageId);
    }

    const deliveryTimer = this.deliveryTimeouts.get(messageId);
    if (deliveryTimer) {
      clearTimeout(deliveryTimer);
      this.deliveryTimeouts.delete(messageId);
    }

    // Remove records
    this.deliveryRecords.delete(messageId);
    this.pendingMessages.delete(messageId);
    this.readReceipts.delete(messageId);
  }

  /**
   * Save message to database
   */
  private async saveMessageToDatabase(message: ChatMessage): Promise<void> {
    try {
      const { error } = await supabase.from('chat_messages').insert({
        id: message.id,
        session_id: message.sessionId,
        role: message.role,
        content: message.content,
        created_at: new Date(message.createdAt).toISOString(),
        metadata: message.metadata,
      });

      if (error) throw error;
    } catch (error) {
      console.error(
        '[MessageDelivery] Failed to save message to database',
        error
      );
      throw error;
    }
  }

  /**
   * Save read receipt to database
   */
  private async saveReadReceiptToDatabase(
    receipt: ReadReceiptRecord
  ): Promise<void> {
    try {
      const { error } = await supabase.from('message_read_receipts').insert({
        message_id: receipt.messageId,
        user_id: receipt.userId,
        session_id: receipt.sessionId,
        read_at: new Date(receipt.readAt).toISOString(),
        metadata: receipt.metadata,
      });

      if (error && error.code !== '23505') {
        // Ignore duplicate key errors
        throw error;
      }
    } catch (error) {
      console.error(
        '[MessageDelivery] Failed to save read receipt to database',
        error
      );
      // Don't throw, read receipts are not critical
    }
  }

  /**
   * Setup WebSocket listeners for delivery confirmations
   */
  private setupWebSocketListeners(): void {
    // Listen for delivery confirmations
    websocketManager.onMessage(MessageType.DELIVERY, (message) => {
      const confirmation = message.payload as DeliveryConfirmation;
      this.confirmDelivery(confirmation);
    });

    // Listen for read receipts
    websocketManager.onMessage(MessageType.READ_RECEIPT, (message) => {
      const receipt = message.payload as ReadReceiptRecord;
      // Store the receipt (already handled in markAsRead for local user)
      if (!this.readReceipts.has(receipt.messageId)) {
        this.readReceipts.set(receipt.messageId, []);
      }
      this.readReceipts.get(receipt.messageId)!.push(receipt);
    });
  }

  /**
   * Emit delivery status update
   */
  private emitStatusUpdate(record: MessageDeliveryRecord): void {
    // Broadcast status update via WebSocket
    websocketManager
      .broadcast({
        type: MessageType.DELIVERY,
        payload: {
          messageId: record.messageId,
          status: record.status,
          timestamp: Date.now(),
        },
      })
      .catch(() => {
        // Ignore broadcast errors
      });
  }

  /**
   * Clear pending message
   */
  private clearPendingMessage(messageId: string): void {
    this.pendingMessages.delete(messageId);

    // Clear timers
    const retryTimer = this.retryTimers.get(messageId);
    if (retryTimer) {
      clearTimeout(retryTimer);
      this.retryTimers.delete(messageId);
    }

    const deliveryTimer = this.deliveryTimeouts.get(messageId);
    if (deliveryTimer) {
      clearTimeout(deliveryTimer);
      this.deliveryTimeouts.delete(messageId);
    }
  }

  /**
   * Start cleanup timer for old records
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldRecords();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Clean up old records (delivered/read messages older than 1 hour)
   */
  private cleanupOldRecords(): void {
    const oneHourAgo = Date.now() - 3600000;
    let cleanedCount = 0;

    for (const [messageId, record] of this.deliveryRecords.entries()) {
      const shouldCleanup =
        (record.status === DeliveryStatus.DELIVERED ||
          record.status === DeliveryStatus.READ) &&
        record.deliveredAt &&
        record.deliveredAt < oneHourAgo;

      if (shouldCleanup) {
        this.deliveryRecords.delete(messageId);
        this.readReceipts.delete(messageId);
        cleanedCount++;
      }
    }

  }

  /**
   * Get delivery statistics
   */
  getStatistics(): {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  } {
    const stats = {
      total: this.deliveryRecords.size,
      pending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    };

    for (const record of this.deliveryRecords.values()) {
      switch (record.status) {
        case DeliveryStatus.PENDING:
        case DeliveryStatus.SENDING:
          stats.pending++;
          break;
        case DeliveryStatus.SENT:
          stats.sent++;
          break;
        case DeliveryStatus.DELIVERED:
          stats.delivered++;
          break;
        case DeliveryStatus.READ:
          stats.read++;
          break;
        case DeliveryStatus.FAILED:
          stats.failed++;
          break;
      }
    }

    return stats;
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    // Clear all timers
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }
    for (const timer of this.deliveryTimeouts.values()) {
      clearTimeout(timer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Clear all data
    this.deliveryRecords.clear();
    this.readReceipts.clear();
    this.pendingMessages.clear();
    this.retryTimers.clear();
    this.deliveryTimeouts.clear();
  }
}

// Singleton instance
export const messageDeliveryService = new MessageDeliveryService();
