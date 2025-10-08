/**
 * Agent Chat Service
 * Handles communication with agent API endpoints
 * Implements streaming, tool execution, and conversation management
 */

import { createClient } from '@supabase/supabase-js';

// Types
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  model: string;
  persona: string;
  tools: string[];
  capabilities: string[];
  streaming: boolean;
  maxTokens: number;
  temperature: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'error' | 'streaming';
  metadata?: {
    tool?: {
      name: string;
      parameters: any;
      result?: any;
      status: 'pending' | 'running' | 'completed' | 'error';
    };
    attachments?: any[];
    model?: string;
    tokens?: number;
    agent_id?: string;
    streaming?: boolean;
  };
}

export interface Conversation {
  id: string;
  user_id: string;
  agent_id: string;
  title?: string;
  metadata: any;
  status: 'active' | 'archived' | 'deleted';
  created_at: Date;
  updated_at: Date;
  last_activity_at: Date;
}

export interface ToolExecution {
  id: string;
  conversation_id: string;
  user_id: string;
  message_id?: string;
  tool_name: string;
  parameters: any;
  result?: any;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
  started_at: Date;
  completed_at?: Date;
  created_at: Date;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class AgentChatService {
  private getAuthHeaders() {
    const token = supabase.auth.getSession().then(session => session.data.session?.access_token);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Create a new conversation
   */
  async createConversation(agentId: string, title?: string): Promise<Conversation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        title: title || `Chat with ${agentId}`,
        metadata: {},
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('last_activity_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(msg => ({
      ...msg,
      timestamp: new Date(msg.created_at),
    }));
  }

  /**
   * Send a message to an agent
   */
  async sendMessage(
    conversationId: string,
    message: string,
    agentConfig: AgentConfig,
    attachments?: any[]
  ): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/.netlify/functions/agent-execute`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        conversationId,
        userId: user.id,
        message,
        agentConfig,
        attachments,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    const result = await response.json();
    
    // Get the created message
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', result.messageId)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      timestamp: new Date(data.created_at),
    };
  }

  /**
   * Stream a message to an agent
   */
  async streamMessage(
    conversationId: string,
    message: string,
    agentConfig: AgentConfig,
    onChunk: (chunk: any) => void,
    onComplete: (message: Message) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await fetch(`${API_BASE_URL}/.netlify/functions/agent-stream`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({
          conversationId,
          userId: user.id,
          message,
          agentConfig,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stream message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let messageId: string | null = null;
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              
              switch (parsed.type) {
                case 'message_start':
                  messageId = parsed.messageId;
                  onChunk({ type: 'start', messageId });
                  break;
                  
                case 'content_delta':
                  fullContent += parsed.content;
                  onChunk({ type: 'content', content: parsed.content });
                  break;
                  
                case 'message_complete':
                  // Get the complete message from database
                  const { data: messageData, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('id', messageId)
                    .single();

                  if (!error && messageData) {
                    onComplete({
                      ...messageData,
                      timestamp: new Date(messageData.created_at),
                    });
                  }
                  return;
                  
                case 'error':
                  onError(new Error(parsed.error));
                  return;
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  /**
   * Invoke a tool
   */
  async invokeTool(
    conversationId: string,
    toolName: string,
    parameters: any,
    messageId?: string
  ): Promise<ToolExecution> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/.netlify/functions/agent-tool`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        conversationId,
        userId: user.id,
        toolName,
        parameters,
        messageId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to invoke tool');
    }

    const result = await response.json();
    
    // Get the tool execution record
    const { data, error } = await supabase
      .from('tool_executions')
      .select('*')
      .eq('id', result.toolId)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      started_at: new Date(data.started_at),
      completed_at: data.completed_at ? new Date(data.completed_at) : undefined,
      created_at: new Date(data.created_at),
    };
  }

  /**
   * Get tool executions for a conversation
   */
  async getToolExecutions(conversationId: string): Promise<ToolExecution[]> {
    const { data, error } = await supabase
      .from('tool_executions')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(exec => ({
      ...exec,
      started_at: new Date(exec.started_at),
      completed_at: exec.completed_at ? new Date(exec.completed_at) : undefined,
      created_at: new Date(exec.created_at),
    }));
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) throw error;
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'archived' })
      .eq('id', conversationId);

    if (error) throw error;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'deleted' })
      .eq('id', conversationId);

    if (error) throw error;
  }

  /**
   * Get agent configurations
   */
  async getAgentConfigs(): Promise<AgentConfig[]> {
    const { data, error } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(config => ({
      id: config.id,
      name: config.name,
      description: config.description,
      ...config.config,
    }));
  }

  /**
   * Create a new agent configuration
   */
  async createAgentConfig(config: Omit<AgentConfig, 'id'>): Promise<AgentConfig> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('agent_configs')
      .insert({
        user_id: user.id,
        name: config.name,
        description: config.description,
        config: {
          model: config.model,
          persona: config.persona,
          tools: config.tools,
          capabilities: config.capabilities,
          streaming: config.streaming,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        },
        is_public: false,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      ...data.config,
    };
  }
}

// Export singleton instance
export const agentChatService = new AgentChatService();
export default agentChatService;
