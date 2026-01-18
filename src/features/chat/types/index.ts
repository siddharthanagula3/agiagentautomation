/**
 * Chat Types for Enhanced MGX-style Interface
 *
 * Re-exports common types from @shared/types and defines chat-specific types.
 */

// Re-export common types for convenience
export type {
  MessageRole,
  ToolCallStatus,
  ChatMessage,
  ChatSession,
  ChatSettings,
  Tool,
  ToolCall,
  Attachment,
  StreamingUpdate,
  AIEmployeeBasic,
  AIEmployeeStatus,
  AIEmployeePerformance,
  MessageMetadata,
  MessageReaction,
} from '@shared/types';

// ============================================================================
// CHAT-SPECIFIC TYPES
// ============================================================================

/**
 * Chat mode for different conversation styles
 */
export type ChatMode = 'team' | 'engineer' | 'research' | 'race' | 'solo';

/**
 * Extended AI Employee type for chat feature
 * Uses AIEmployeeBasic from common types as base
 */
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

/**
 * Chat-specific message metadata extension
 */
export interface ChatMessageMetadata {
  mode?: ChatMode;
  model?: string;
  temperature?: number;
  tokens?: number;
  cost?: number;
  employeeId?: string;
  [key: string]: unknown;
}

/**
 * Feature-specific chat session with metadata
 */
export interface FeatureChatSession {
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
