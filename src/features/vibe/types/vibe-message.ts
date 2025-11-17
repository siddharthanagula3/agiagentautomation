/**
 * Vibe Message Types
 * Type definitions for the VIBE multi-agent interface messages
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface VibeMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  employee_id?: string;
  employee_name?: string;
  employee_role?: string;
  timestamp: Date;
  // Updated: Nov 16th 2025 - Fixed any type
  metadata?: Record<string, unknown>;
  is_streaming?: boolean;
}

export type AgentMessageType =
  | 'task_assignment'
  | 'task_result'
  | 'status_update'
  | 'question'
  | 'resource_request'
  | 'handoff';

export interface VibeAgentMessage {
  id: string;
  session_id: string;
  type: AgentMessageType;
  from_agent: string;
  to_agents: string[];
  timestamp: Date;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface MessageContent {
  text?: string;
  task?: {
    id: string;
    description: string;
    requirements: string[];
  };
  result?: {
    task_id: string;
    output: unknown;
    artifacts?: string[];
  };
  status?: {
    state: 'thinking' | 'working' | 'idle' | 'error';
    progress?: number;
    current_action?: string;
  };
  question?: {
    question: string;
    context: string;
    urgency: 'high' | 'medium' | 'low';
  };
  resource?: {
    type: 'file' | 'data' | 'tool' | 'information';
    description: string;
    required: boolean;
  };
  handoff?: {
    reason: string;
    context: string;
    suggested_agent?: string;
  };
}
