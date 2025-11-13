/**
 * Multi-Agent Chat Database Services
 * Centralized exports for all chat-related database operations
 */

// Main database services
export * from './multi-agent-chat-database';
export * from './collaboration-database';
export * from './chat-realtime-subscriptions';

// Re-export types for convenience
export type {
  MultiAgentConversation,
  ConversationParticipant,
  AgentCollaboration,
  MessageReaction,
  ConversationMetadata,
  ConversationWithParticipants,
  ConversationWithDetails,
  CreateConversationRequest,
  AddParticipantRequest,
  CreateCollaborationRequest,
  ConversationListFilters,
  ConversationStats,
  RealtimeConversationUpdate,
  RealtimeParticipantUpdate,
  TypingIndicator,
  PresenceState,
} from '@shared/types/multi-agent-chat';
