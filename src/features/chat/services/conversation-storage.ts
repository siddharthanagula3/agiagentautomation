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
  is_starred?: boolean | null;
  is_pinned?: boolean | null;
  is_archived?: boolean | null;
  shared_link?: string | null;
  metadata?: Record<string, unknown> | null;
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
  updated_at?: string | null;
  edited?: boolean | null;
  edit_count?: number | null;
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
   * Note: RLS policies ensure users can only access their own sessions
   */
  async getSession(
    sessionId: string,
    userId?: string
  ): Promise<ChatSession | null> {
    let query = supabase.from('chat_sessions').select('*').eq('id', sessionId);

    // Add user_id filter if provided for extra security (RLS should handle this, but explicit is better)
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      // RLS policy violation - user doesn't own this session
      if (
        error.code === '42501' ||
        error.message?.includes('permission denied')
      ) {
        console.warn('Access denied to session:', sessionId);
        return null;
      }
      throw new Error(`Failed to load session: ${error.message}`);
    }

    return this.mapDBSessionToSession(data);
  }

  /**
   * Update session title
   * Note: RLS policies ensure users can only update their own sessions
   */
  async updateSessionTitle(
    sessionId: string,
    title: string,
    userId?: string
  ): Promise<void> {
    let query = supabase
      .from('chat_sessions')
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    // Add user_id filter if provided for extra security
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      // RLS policy violation
      if (
        error.code === '42501' ||
        error.message?.includes('permission denied')
      ) {
        throw new Error('You do not have permission to update this session');
      }
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  /**
   * Delete (archive) a session
   * Note: RLS policies ensure users can only delete their own sessions
   */
  async deleteSession(sessionId: string, userId?: string): Promise<void> {
    let query = supabase
      .from('chat_sessions')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Add user_id filter if provided for extra security
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      // RLS policy violation
      if (
        error.code === '42501' ||
        error.message?.includes('permission denied')
      ) {
        throw new Error('You do not have permission to delete this session');
      }
      throw new Error(`Failed to delete session: ${error.message}`);
    }
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
   * Note: RLS policies ensure users can only access messages from their own sessions
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      // RLS policy violation - user doesn't own this session
      if (
        error.code === '42501' ||
        error.message?.includes('permission denied')
      ) {
        console.warn('Access denied to messages for session:', sessionId);
        return []; // Return empty array instead of throwing
      }
      throw new Error(`Failed to load messages: ${error.message}`);
    }

    return (data || []).map(this.mapDBMessageToMessage);
  }

  /**
   * Update a message's content
   * Note: RLS policies ensure users can only update messages from their own sessions
   */
  async updateMessage(
    messageId: string,
    newContent: string
  ): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        content: newContent,
        // updated_at, edited, and edit_count are automatically handled by the database trigger
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      // RLS policy violation
      if (
        error.code === '42501' ||
        error.message?.includes('permission denied')
      ) {
        throw new Error('You do not have permission to edit this message');
      }
      throw new Error(`Failed to update message: ${error.message}`);
    }

    return this.mapDBMessageToMessage(data);
  }

  /**
   * Get edit history for a message
   * Note: RLS policies ensure users can only view edit history for their own messages
   */
  async getMessageEditHistory(messageId: string): Promise<
    Array<{
      id: string;
      previousContent: string;
      editedAt: Date;
    }>
  > {
    const { data, error } = await supabase
      .from('chat_message_edits')
      .select('id, previous_content, edited_at')
      .eq('message_id', messageId)
      .order('edited_at', { ascending: false });

    if (error) {
      if (
        error.code === '42501' ||
        error.message?.includes('permission denied')
      ) {
        console.warn('Access denied to edit history for message:', messageId);
        return [];
      }
      throw new Error(`Failed to load edit history: ${error.message}`);
    }

    return (data || []).map((edit) => ({
      id: edit.id,
      previousContent: edit.previous_content,
      editedAt: new Date(edit.edited_at),
    }));
  }

  /**
   * Delete a message
   * Note: RLS policies ensure users can only delete messages from their own sessions
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      // RLS policy violation
      if (
        error.code === '42501' ||
        error.message?.includes('permission denied')
      ) {
        throw new Error('You do not have permission to delete this message');
      }
      throw new Error(`Failed to delete message: ${error.message}`);
    }
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

  /**
   * Update session starred state
   */
  async updateSessionStarred(
    sessionId: string,
    isStarred: boolean,
    userId?: string
  ): Promise<void> {
    let query = supabase
      .from('chat_sessions')
      .update({
        is_starred: isStarred,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      if (
        error.code === '42501' ||
        error.message?.includes('permission denied')
      ) {
        throw new Error('You do not have permission to update this session');
      }
      throw new Error(`Failed to update starred state: ${error.message}`);
    }
  }

  /**
   * Update session pinned state
   */
  async updateSessionPinned(
    sessionId: string,
    isPinned: boolean,
    userId?: string
  ): Promise<void> {
    let query = supabase
      .from('chat_sessions')
      .update({
        is_pinned: isPinned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      if (
        error.code === '42501' ||
        error.message?.includes('permission denied')
      ) {
        throw new Error('You do not have permission to update this session');
      }
      throw new Error(`Failed to update pinned state: ${error.message}`);
    }
  }

  /**
   * Update session archived state
   */
  async updateSessionArchived(
    sessionId: string,
    isArchived: boolean,
    userId?: string
  ): Promise<void> {
    let query = supabase
      .from('chat_sessions')
      .update({
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      if (
        error.code === '42501' ||
        error.message?.includes('permission denied')
      ) {
        throw new Error('You do not have permission to update this session');
      }
      throw new Error(`Failed to update archived state: ${error.message}`);
    }
  }

  /**
   * Update session shared link
   */
  async updateSessionSharedLink(
    sessionId: string,
    sharedLink: string | null,
    userId?: string
  ): Promise<void> {
    let query = supabase
      .from('chat_sessions')
      .update({
        shared_link: sharedLink,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      if (
        error.code === '42501' ||
        error.message?.includes('permission denied')
      ) {
        throw new Error('You do not have permission to update this session');
      }
      throw new Error(`Failed to update shared link: ${error.message}`);
    }
  }

  /**
   * Copy messages from one session to another
   */
  async copySessionMessages(
    sourceSessionId: string,
    targetSessionId: string,
    userId?: string
  ): Promise<void> {
    // Verify both sessions belong to the user
    if (userId) {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('id')
        .in('id', [sourceSessionId, targetSessionId])
        .eq('user_id', userId);

      if (error || !sessions || sessions.length !== 2) {
        throw new Error('Invalid session IDs or permission denied');
      }
    }

    // Get all messages from source session
    const sourceMessages = await this.getSessionMessages(sourceSessionId);

    // Insert messages into target session
    if (sourceMessages.length > 0) {
      const { error } = await supabase.from('chat_messages').insert(
        sourceMessages.map((msg) => ({
          session_id: targetSessionId,
          role: msg.role,
          content: msg.content,
          created_at: msg.createdAt.toISOString(),
        }))
      );

      if (error) {
        throw new Error(`Failed to copy messages: ${error.message}`);
      }

      // Update target session's last_message_at
      await supabase
        .from('chat_sessions')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetSessionId);
    }
  }

  // Mapping functions
  private mapDBSessionToSession(dbSession: DBChatSession): ChatSession {
    // Safely convert timestamps to Date objects
    const createdAt = dbSession.created_at
      ? new Date(dbSession.created_at)
      : new Date();
    const updatedAt = dbSession.updated_at
      ? new Date(dbSession.updated_at)
      : new Date();

    // Validate dates
    if (isNaN(createdAt.getTime())) {
      console.warn('Invalid createdAt for session:', dbSession.id);
    }
    if (isNaN(updatedAt.getTime())) {
      console.warn('Invalid updatedAt for session:', dbSession.id);
    }

    // Extract tags from metadata if available
    const metadataTags =
      (dbSession.metadata as { tags?: string[] })?.tags || [];

    return {
      id: dbSession.id,
      title: dbSession.title || 'New Chat',
      createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
      updatedAt: isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
      messageCount: 0, // Will be populated separately if needed
      tokenCount: 0,
      cost: 0,
      isPinned: dbSession.is_pinned ?? false,
      isArchived: dbSession.is_archived ?? !dbSession.is_active,
      isStarred: dbSession.is_starred ?? false,
      sharedLink: dbSession.shared_link || undefined,
      tags: metadataTags,
      participants: [dbSession.user_id],
      metadata: {
        employeeId: dbSession.employee_id,
        role: dbSession.role,
        provider: dbSession.provider,
        starred: dbSession.is_starred ?? false,
        pinned: dbSession.is_pinned ?? false,
        archived: dbSession.is_archived ?? false,
        tags: metadataTags,
        ...(dbSession.metadata || {}),
      },
    };
  }

  private mapDBMessageToMessage(dbMessage: DBChatMessage): ChatMessage {
    // Safely convert timestamps to Date objects
    const createdAt = dbMessage.created_at
      ? new Date(dbMessage.created_at)
      : new Date();

    const updatedAt = dbMessage.updated_at
      ? new Date(dbMessage.updated_at)
      : createdAt;

    // Validate dates
    if (isNaN(createdAt.getTime())) {
      console.warn('Invalid createdAt for message:', dbMessage.id);
    }
    if (isNaN(updatedAt.getTime())) {
      console.warn('Invalid updatedAt for message:', dbMessage.id);
    }

    return {
      id: dbMessage.id,
      sessionId: dbMessage.session_id,
      role: dbMessage.role as 'user' | 'assistant' | 'system',
      content: dbMessage.content,
      createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
      updatedAt: isNaN(updatedAt.getTime()) ? createdAt : updatedAt,
      edited: dbMessage.edited ?? false,
      editCount: dbMessage.edit_count ?? 0,
    };
  }
}

export const chatPersistenceService = new ChatPersistenceService();
