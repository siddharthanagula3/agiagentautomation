/**
 * Agents Service
 * Frontend service for interacting with OpenAI Agents SDK
 * via Netlify backend functions
 */

import { supabase } from '@/lib/supabase-client';

export interface AgentSession {
  conversationId: string;
  threadId: string;
  assistantId: string;
}

export interface AgentMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface AgentExecuteRequest {
  conversationId: string;
  userId: string;
  message: string;
  threadId: string;
  assistantId: string;
  streaming?: boolean;
}

export interface AgentExecuteResponse {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
  threadMessageId?: string;
  runId?: string;
}

/**
 * Get authentication headers with Supabase token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

/**
 * Create or retrieve an agent session
 */
export async function createAgentSession(
  userId: string,
  employeeId: string,
  employeeName: string,
  employeeRole: string,
  capabilities: string[],
  sessionId?: string
): Promise<AgentSession> {
  const headers = await getAuthHeaders();
  
  const response = await fetch('/.netlify/functions/agents-session', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userId,
      employeeId,
      employeeName,
      employeeRole,
      capabilities,
      sessionId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create agent session');
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to create agent session');
  }

  return {
    conversationId: data.conversationId,
    threadId: data.threadId,
    assistantId: data.assistantId,
  };
}

/**
 * Send a message to the agent
 */
export async function sendAgentMessage(request: AgentExecuteRequest): Promise<AgentExecuteResponse> {
  const headers = await getAuthHeaders();
  
  const response = await fetch('/.netlify/functions/agents-execute', {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message to agent');
  }

  const data = await response.json();
  return data;
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(conversationId: string): Promise<AgentMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load messages: ${error.message}`);
  }

  return (data || []).map(msg => ({
    id: msg.id,
    conversationId: msg.conversation_id,
    role: msg.role,
    content: msg.content,
    metadata: msg.metadata,
    createdAt: msg.created_at,
  }));
}

/**
 * Get conversation details
 */
export async function getConversation(conversationId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    throw new Error(`Failed to load conversation: ${error.message}`);
  }

  return data;
}

/**
 * Stream agent response (for future enhancement)
 */
export async function streamAgentMessage(
  request: AgentExecuteRequest,
  onChunk: (chunk: string) => void,
  onComplete: (response: AgentExecuteResponse) => void,
  onError: (error: Error) => void
): Promise<void> {
  // Placeholder for streaming implementation
  // This will use Server-Sent Events or WebSockets in the future
  try {
    const response = await sendAgentMessage(request);
    if (response.success && response.response) {
      onChunk(response.response);
      onComplete(response);
    } else {
      onError(new Error(response.error || 'Unknown error'));
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

export const agentsService = {
  createAgentSession,
  sendAgentMessage,
  getConversationMessages,
  getConversation,
  streamAgentMessage,
};

