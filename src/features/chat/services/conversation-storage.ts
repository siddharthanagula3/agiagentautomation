// Chat persistence service - handles database operations for chat sessions and messages
import { supabase } from '@shared/lib/supabase-client';
import type { ChatSession, ChatMessage } from '../types';

interface DBChatSession {
  id: string;
  user_id: string;
  employee_id: string;
  role: string;
  provider: string;
  title: string | null;
  is_active: boolean | null;
  last_message_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface DBChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string | null;
}

export class ChatPersistenceService {
  /**
   * Create a new chat session
   */
  async createSession(
    userId: string,
    title: string,
    metadata?: {
      employeeId?: string;
      role?: string;
      provider?: string;
    }
  ): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title,
        employee_id: metadata?.employeeId || 'general',
        role: metadata?.role || 'assistant',
        provider: metadata?.provider || 'openai',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);

    return this.mapDBSessionToSession(data);
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(`Failed to load sessions: ${error.message}`);

    return (data || []).map(this.mapDBSessionToSession);
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to load session: ${error.message}`);
    }

    return this.mapDBSessionToSession(data);
  }

  /**
   * Update session title
   */
  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) throw new Error(`Failed to update session: ${error.message}`);
  }

  /**
   * Delete (archive) a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) throw new Error(`Failed to delete session: ${error.message}`);
  }

  /**
   * Save a message to the database
   */
  async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save message: ${error.message}`);

    // Update session's last_message_at
    await supabase
      .from('chat_sessions')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return this.mapDBMessageToMessage(data);
  }

  /**
   * Get all messages for a session
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to load messages: ${error.message}`);

    return (data || []).map(this.mapDBMessageToMessage);
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw new Error(`Failed to delete message: ${error.message}`);
  }

  /**
   * Get message count for a session
   */
  async getMessageCount(sessionId: string): Promise<number> {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (error) throw new Error(`Failed to count messages: ${error.message}`);

    return count || 0;
  }

  /**
   * Search sessions by title
   */
  async searchSessions(userId: string, query: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .ilike('title', `%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(`Failed to search sessions: ${error.message}`);

    return (data || []).map(this.mapDBSessionToSession);
  }

  // Mapping functions
  private mapDBSessionToSession(dbSession: DBChatSession): ChatSession {
    return {
      id: dbSession.id,
      title: dbSession.title || 'New Chat',
      createdAt: new Date(dbSession.created_at || Date.now()),
      updatedAt: new Date(dbSession.updated_at || Date.now()),
      messageCount: 0, // Will be populated separately if needed
      tokenCount: 0,
      cost: 0,
      isPinned: false,
      isArchived: !dbSession.is_active,
      tags: [],
      participants: [dbSession.user_id],
      metadata: {
        employeeId: dbSession.employee_id,
        role: dbSession.role,
        provider: dbSession.provider,
      },
    };
  }

  private mapDBMessageToMessage(dbMessage: DBChatMessage): ChatMessage {
    return {
      id: dbMessage.id,
      sessionId: dbMessage.session_id,
      role: dbMessage.role as 'user' | 'assistant' | 'system',
      content: dbMessage.content,
      createdAt: new Date(dbMessage.created_at || Date.now()),
    };
  }
}

export const chatPersistenceService = new ChatPersistenceService();
