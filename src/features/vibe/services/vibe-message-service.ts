/**
 * VIBE Message Service
 *
 * Handles all database operations for vibe_messages table
 * Integrates with workforce orchestrator for AI-powered chat
 * Provides real-time message streaming and chunking
 */

import { supabase } from '@shared/lib/supabase-client';
import { workforceOrchestratorRefactored } from '@core/ai/orchestration/workforce-orchestrator';

export interface VibeMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  user_id?: string | null;
  employee_id?: string | null;
  employee_name?: string | null;
  employee_role?: string | null;
  timestamp?: string | null;
  // Updated: Nov 16th 2025 - Fixed any type
  metadata?: Record<string, unknown> | null;
  is_streaming?: boolean | null;
}

export interface CreateMessageParams {
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  employeeName?: string;
  employeeRole?: string;
  metadata?: Record<string, unknown>;
  isStreaming?: boolean;
}

export interface ProcessUserMessageParams {
  sessionId: string;
  userId: string;
  content: string;
  conversationHistory: Array<{ role: string; content: string }>;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Message Service Class
 * Provides all CRUD operations for vibe_messages
 */
export class VibeMessageService {
  /**
   * Fetch all messages for a session
   */
  static async getMessages(sessionId: string): Promise<VibeMessage[]> {
    const { data, error } = await supabase
      .from('vibe_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('[VibeMessageService] Failed to fetch messages:', error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return (data as VibeMessage[]) || [];
  }

  /**
   * Create a new message in the database
   */
  static async createMessage(
    params: CreateMessageParams
  ): Promise<VibeMessage> {
    const messageId = crypto.randomUUID();
    const message: Partial<VibeMessage> = {
      id: messageId,
      session_id: params.sessionId,
      user_id: params.userId,
      role: params.role,
      content: params.content,
      employee_name: params.employeeName,
      employee_role: params.employeeRole,
      metadata: params.metadata || {},
      is_streaming: params.isStreaming || false,
    };

    const { data, error } = await supabase
      .from('vibe_messages')
      .insert(message)
      .select()
      .single();

    if (error) {
      console.error('[VibeMessageService] Failed to create message:', error);
      throw new Error(`Failed to create message: ${error.message}`);
    }

    return data as VibeMessage;
  }

  /**
   * Update an existing message
   */
  static async updateMessage(
    messageId: string,
    updates: Partial<VibeMessage>
  ): Promise<VibeMessage> {
    const { data, error } = await supabase
      .from('vibe_messages')
      .update(updates)
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('[VibeMessageService] Failed to update message:', error);
      throw new Error(`Failed to update message: ${error.message}`);
    }

    return data as VibeMessage;
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('vibe_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('[VibeMessageService] Failed to delete message:', error);
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  /**
   * Process user message through workforce orchestrator
   * Handles the complete flow:
   * 1. Create user message in database
   * 2. Call workforce orchestrator
   * 3. Stream response chunks
   * 4. Save assistant response to database
   */
  static async processUserMessage(
    params: ProcessUserMessageParams
  ): Promise<VibeMessage> {
    const {
      sessionId,
      userId,
      content,
      conversationHistory,
      onChunk,
      onComplete,
      onError,
    } = params;

    try {
      // Step 1: Create user message
      const userMessage = await this.createMessage({
        sessionId,
        userId,
        role: 'user',
        content,
      });

      // Step 2: Call workforce orchestrator
      const orchestratorResponse =
        await workforceOrchestratorRefactored.processRequest({
          userId,
          input: content,
          mode: 'chat',
          sessionId,
          conversationHistory: [
            ...conversationHistory,
            { role: 'user', content },
          ],
        });

      if (!orchestratorResponse.success || !orchestratorResponse.chatResponse) {
        throw new Error(
          orchestratorResponse.error ||
            'No response from workforce orchestrator'
        );
      }

      const fullResponse = orchestratorResponse.chatResponse;

      // Step 3: Create streaming assistant message
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage = await this.createMessage({
        sessionId,
        userId,
        role: 'assistant',
        content: '', // Will be updated as chunks arrive
        employeeName: orchestratorResponse.assignedEmployee || 'AI Assistant',
        isStreaming: true,
      });

      // Step 4: Stream response chunks
      let currentContent = '';
      const chunks = fullResponse.split(/(\s+)/).filter((part) => part.length);

      for (const chunk of chunks) {
        currentContent += chunk;

        // Update database with new chunk
        await this.updateMessage(assistantMessageId, {
          content: currentContent,
        });

        // Notify UI
        if (onChunk) {
          onChunk(chunk);
        }

        // Small delay for realistic streaming
        await new Promise((resolve) => setTimeout(resolve, 40));
      }

      // Step 5: Mark as complete
      const finalMessage = await this.updateMessage(assistantMessageId, {
        content: fullResponse,
        is_streaming: false,
      });

      if (onComplete) {
        onComplete(fullResponse);
      }

      return finalMessage;
    } catch (error) {
      console.error('[VibeMessageService] Processing failed:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
      throw error;
    }
  }

  /**
   * Subscribe to real-time message updates for a session
   */
  static subscribeToMessages(
    sessionId: string,
    onMessage: (message: VibeMessage) => void,
    onError?: (error: Error) => void
  ) {
    const channel = supabase
      .channel(`vibe-messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vibe_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new) {
            onMessage(payload.new as VibeMessage);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Failed to subscribe to message updates'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Get the latest N messages for a session
   */
  static async getRecentMessages(
    sessionId: string,
    limit: number = 50
  ): Promise<VibeMessage[]> {
    const { data, error } = await supabase
      .from('vibe_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(
        '[VibeMessageService] Failed to fetch recent messages:',
        error
      );
      throw new Error(`Failed to fetch recent messages: ${error.message}`);
    }

    // Reverse to get chronological order
    return ((data as VibeMessage[]) || []).reverse();
  }

  /**
   * Clear all messages for a session
   */
  static async clearSessionMessages(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('vibe_messages')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('[VibeMessageService] Failed to clear messages:', error);
      throw new Error(`Failed to clear messages: ${error.message}`);
    }
  }
}
