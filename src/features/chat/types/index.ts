// Chat Types for Enhanced MGX-style Interface

export type ChatMode = 'team' | 'engineer' | 'research' | 'race' | 'solo';
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';
export type ToolCallStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ChatSession {
  id: string;
  title: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  tokenCount: number;
  cost: number;
  isPinned: boolean;
  isArchived: boolean;
  isStarred?: boolean;
  folder?: string;
  tags: string[];
  sharedLink?: string;
  participants: string[];
  metadata?: Record<string, unknown> & {
    starred?: boolean;
    pinned?: boolean;
    archived?: boolean;
    tags?: string[];
  };
}

export interface ChatMessage {
  id: string;
  sessionId?: string;
  role: MessageRole;
  content: string;
  attachments?: Attachment[];
  toolCalls?: ToolCall[];
  createdAt: Date;
  updatedAt?: Date;
  edited?: boolean;
  editCount?: number;
  metadata?: {
    mode?: ChatMode;
    model?: string;
    temperature?: number;
    tokens?: number;
    cost?: number;
    employeeId?: string;
    [key: string]: unknown;
  };
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: ToolCallStatus;
  result?: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  category: 'search' | 'code' | 'image' | 'file' | 'system';
  icon?: string;
}

export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar?: string;
  capabilities: string[];
  tools: string[];
  status: 'available' | 'busy' | 'offline';
  performance?: {
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: number;
  };
}

export interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt?: string;
}

export interface StreamingUpdate {
  type: 'content' | 'tool_call' | 'error' | 'done';
  content?: string;
  toolCall?: ToolCall;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    inputTokens?: number;
    outputTokens?: number;
    model?: string;
    cost?: number;
    metrics?: unknown;
  };
}
