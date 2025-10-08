/**
 * ChatKit Service
 * Handles communication with ChatKit API endpoints
 * Based on OpenAI ChatKit patterns
 */

import { createClient } from '@supabase/supabase-js';

// Types
export interface ChatKitSession {
  id: string;
  sessionId: string;
  userId: string;
  workflowId: string;
  employeeId?: string;
  employeeRole?: string;
  status: 'active' | 'expired' | 'terminated';
  metadata: any;
  createdAt: Date;
  expiresAt: Date;
  updatedAt: Date;
}

export interface ChatKitMessage {
  id: string;
  sessionId: string;
  userId: string;
  messageId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata: any;
  createdAt: Date;
}

export interface ChatKitWorkflow {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  config: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ChatKitService {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    };
  }

  /**
   * Create a new ChatKit session
   */
  async createSession(
    workflowId: string,
    employeeId?: string,
    employeeRole?: string,
    sessionId?: string
  ): Promise<ChatKitSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/.netlify/functions/chatkit-session`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        workflowId,
        employeeId,
        employeeRole,
        sessionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create session');
    }

    const result = await response.json();
    
    // Get the created session from database
    const { data, error } = await supabase
      .from('chatkit_sessions')
      .select('*')
      .eq('session_id', result.sessionId)
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      workflowId: data.workflow_id,
      employeeId: data.employee_id,
      employeeRole: data.employee_role,
      status: data.status,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Get ChatKit sessions for the current user
   */
  async getSessions(): Promise<ChatKitSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/.netlify/functions/chatkit-session`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch sessions');
    }

    const result = await response.json();
    
    return (result.sessions || []).map((session: any) => ({
      id: session.id,
      sessionId: session.session_id,
      userId: session.user_id,
      workflowId: session.workflow_id,
      employeeId: session.employee_id,
      employeeRole: session.employee_role,
      status: session.status,
      metadata: session.metadata,
      createdAt: new Date(session.created_at),
      expiresAt: new Date(session.expires_at),
      updatedAt: new Date(session.updated_at),
    }));
  }

  /**
   * Get messages for a ChatKit session
   */
  async getSessionMessages(sessionId: string): Promise<ChatKitMessage[]> {
    const { data, error } = await supabase
      .from('chatkit_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(msg => ({
      id: msg.id,
      sessionId: msg.session_id,
      userId: msg.user_id,
      messageId: msg.message_id,
      role: msg.role,
      content: msg.content,
      metadata: msg.metadata,
      createdAt: new Date(msg.created_at),
    }));
  }

  /**
   * Save a message to a ChatKit session
   */
  async saveMessage(
    sessionId: string,
    messageId: string,
    role: 'user' | 'assistant' | 'system' | 'tool',
    content: string,
    metadata?: any
  ): Promise<ChatKitMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chatkit_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message_id: messageId,
        role,
        content,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      messageId: data.message_id,
      role: data.role,
      content: data.content,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Get available ChatKit workflows
   */
  async getWorkflows(): Promise<ChatKitWorkflow[]> {
    const { data, error } = await supabase
      .from('chatkit_workflows')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(workflow => ({
      id: workflow.id,
      workflowId: workflow.workflow_id,
      name: workflow.name,
      description: workflow.description,
      config: workflow.config,
      isActive: workflow.is_active,
      createdAt: new Date(workflow.created_at),
      updatedAt: new Date(workflow.updated_at),
    }));
  }

  /**
   * Get a specific ChatKit workflow
   */
  async getWorkflow(workflowId: string): Promise<ChatKitWorkflow | null> {
    const { data, error } = await supabase
      .from('chatkit_workflows')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return {
      id: data.id,
      workflowId: data.workflow_id,
      name: data.name,
      description: data.description,
      config: data.config,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Update session status
   */
  async updateSessionStatus(sessionId: string, status: 'active' | 'expired' | 'terminated'): Promise<void> {
    const { error } = await supabase
      .from('chatkit_sessions')
      .update({ status })
      .eq('session_id', sessionId);

    if (error) throw error;
  }

  /**
   * Terminate a ChatKit session
   */
  async terminateSession(sessionId: string): Promise<void> {
    await this.updateSessionStatus(sessionId, 'terminated');
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    averageMessagesPerSession: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get session counts
    const { data: sessions, error: sessionsError } = await supabase
      .from('chatkit_sessions')
      .select('status')
      .eq('user_id', user.id);

    if (sessionsError) throw sessionsError;

    // Get message count
    const { data: messages, error: messagesError } = await supabase
      .from('chatkit_messages')
      .select('id')
      .eq('user_id', user.id);

    if (messagesError) throw messagesError;

    const totalSessions = sessions?.length || 0;
    const activeSessions = sessions?.filter(s => s.status === 'active').length || 0;
    const totalMessages = messages?.length || 0;
    const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;

    return {
      totalSessions,
      activeSessions,
      totalMessages,
      averageMessagesPerSession,
    };
  }
}

// Export singleton instance
export const chatkitService = new ChatKitService();
export default chatkitService;
