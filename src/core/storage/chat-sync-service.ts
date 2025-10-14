/**
 * Chat Synchronization Service
 * Handles real-time message synchronization and conflict resolution
 */

import { supabase } from '@shared/lib/supabase-client';
import { useAuthStore } from '@shared/stores/unified-auth-store';

export interface SyncMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface SyncConversation {
  id: string;
  user_id: string;
  employee_id: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

class ChatSyncService {
  private subscriptions: Map<string, any> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;

  /**
   * Subscribe to real-time updates for a conversation
   */
  async subscribeToConversation(
    conversationId: string,
    onMessage: (message: SyncMessage) => void,
    onError?: (error: Error) => void
  ) {
    try {
      // Clean up existing subscription
      this.unsubscribeFromConversation(conversationId);

      const subscription = supabase
        .channel(`conversation_${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          payload => {
            console.log('New message received:', payload);
            onMessage(payload.new as SyncMessage);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          payload => {
            console.log('Message updated:', payload);
            onMessage(payload.new as SyncMessage);
          }
        )
        .subscribe(status => {
          console.log('Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            this.retryAttempts.delete(conversationId);
          } else if (status === 'CHANNEL_ERROR') {
            this.handleSubscriptionError(conversationId, onError);
          }
        });

      this.subscriptions.set(conversationId, subscription);
    } catch (error) {
      console.error('Error subscribing to conversation:', error);
      onError?.(error as Error);
    }
  }

  /**
   * Unsubscribe from conversation updates
   */
  unsubscribeFromConversation(conversationId: string) {
    const subscription = this.subscriptions.get(conversationId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(conversationId);
    }
  }

  /**
   * Handle subscription errors with retry logic
   */
  private handleSubscriptionError(
    conversationId: string,
    onError?: (error: Error) => void
  ) {
    const attempts = this.retryAttempts.get(conversationId) || 0;

    if (attempts < this.maxRetries) {
      this.retryAttempts.set(conversationId, attempts + 1);

      console.log(
        `Retrying subscription for ${conversationId}, attempt ${attempts + 1}`
      );

      setTimeout(
        () => {
          // Retry subscription
          this.subscribeToConversation(conversationId, () => {}, onError);
        },
        Math.pow(2, attempts) * 1000
      ); // Exponential backoff
    } else {
      console.error(
        `Max retry attempts reached for conversation ${conversationId}`
      );
      onError?.(
        new Error(
          'Failed to establish real-time connection after multiple attempts'
        )
      );
    }
  }

  /**
   * Send message with retry logic
   */
  async sendMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<SyncMessage> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role,
            content,
            metadata,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data as SyncMessage;
      } catch (error) {
        lastError = error as Error;
        console.error(`Send message attempt ${attempt + 1} failed:`, error);

        if (attempt < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw (
      lastError || new Error('Failed to send message after multiple attempts')
    );
  }

  /**
   * Get conversation messages with pagination
   */
  async getMessages(
    conversationId: string,
    limit = 50,
    offset = 0
  ): Promise<SyncMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data as SyncMessage[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Create or get conversation
   */
  async getOrCreateConversation(
    userId: string,
    employeeId: string
  ): Promise<SyncConversation> {
    try {
      // Try to find existing conversation
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('employee_id', employeeId)
        .single();

      if (existing && !findError) {
        return existing as SyncConversation;
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          employee_id: employeeId,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return newConversation as SyncConversation;
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    this.subscriptions.forEach((subscription, conversationId) => {
      this.unsubscribeFromConversation(conversationId);
    });
    this.subscriptions.clear();
    this.retryAttempts.clear();
  }
}

export const chatSyncService = new ChatSyncService();
