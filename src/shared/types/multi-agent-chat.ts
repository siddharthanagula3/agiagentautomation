/**
 * Multi-Agent Chat System Types
 * TypeScript interfaces for the multi-agent chat database schema
 */

// =============================================
// ENUMS AND CONSTANTS
// =============================================

export type ConversationType =
  | 'single'
  | 'multi_agent'
  | 'collaborative'
  | 'mission_control';
export type ConversationStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived'
  | 'failed';
export type OrchestrationMode = 'automatic' | 'manual' | 'supervised';
export type CollaborationStrategy = 'parallel' | 'sequential' | 'hierarchical';

export type ParticipantRole =
  | 'lead'
  | 'collaborator'
  | 'advisor'
  | 'reviewer'
  | 'observer';
export type ParticipantStatus =
  | 'active'
  | 'idle'
  | 'working'
  | 'completed'
  | 'removed';

export type SessionType =
  | 'task_based'
  | 'brainstorming'
  | 'review'
  | 'problem_solving'
  | 'research';
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'reviewing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ReactionType =
  | 'like'
  | 'helpful'
  | 'unhelpful'
  | 'insightful'
  | 'flag'
  | 'bookmark';

// =============================================
// DATABASE ROW TYPES
// =============================================

export interface MultiAgentConversation {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  conversation_type: ConversationType;
  status: ConversationStatus;

  // Configuration
  orchestration_mode: OrchestrationMode;
  collaboration_strategy: CollaborationStrategy;
  max_agents: number;

  // Metadata
  metadata: Record<string, unknown>;
  tags: string[];

  // Statistics
  total_messages: number;
  total_tokens: number;
  total_cost: number;
  active_agents_count: number;

  // Timestamps
  started_at: string;
  last_message_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;

  // Agent identification
  employee_id: string;
  employee_name: string;
  employee_role: string;
  employee_provider: string;

  // Participation details
  participant_role: ParticipantRole;
  status: ParticipantStatus;

  // Capabilities
  capabilities: string[];
  tools_available: string[];

  // Statistics
  message_count: number;
  tokens_used: number;
  cost_incurred: number;
  tasks_assigned: number;
  tasks_completed: number;

  // Activity tracking
  last_active_at: string | null;
  total_active_duration: number;

  // Timestamps
  joined_at: string;
  left_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentCollaboration {
  id: string;
  conversation_id: string;

  // Collaboration details
  session_name: string | null;
  session_type: SessionType;

  // Participating agents
  participant_ids: string[];
  lead_participant_id: string | null;

  // Task tracking
  task_description: string;
  task_status: TaskStatus;

  // Collaboration flow
  workflow_steps: unknown[];
  current_step: number;

  // Results
  collaboration_result: unknown | null;
  output_artifacts: unknown[];

  // Metrics
  total_messages: number;
  total_iterations: number;
  consensus_score: number | null;

  // Timestamps
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;

  // Reaction details
  reaction_type: ReactionType;
  feedback_text: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ConversationMetadata {
  id: string;
  conversation_id: string;
  user_id: string;

  // Display settings
  is_pinned: boolean;
  is_archived: boolean;
  is_favorite: boolean;
  folder_id: string | null;

  // Sharing settings
  is_public: boolean;
  share_token: string | null;
  shared_with: string[];

  // Model configuration
  default_model: string | null;
  default_temperature: number | null;
  default_max_tokens: number | null;

  // UI preferences
  ui_settings: Record<string, unknown>;

  // Analytics
  view_count: number;
  export_count: number;
  share_count: number;

  // Timestamps
  last_viewed_at: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// INSERT TYPES (for creating new records)
// =============================================

export type MultiAgentConversationInsert = Omit<
  MultiAgentConversation,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'total_messages'
  | 'total_tokens'
  | 'total_cost'
  | 'active_agents_count'
  | 'last_message_at'
  | 'completed_at'
> & {
  id?: string;
  title?: string | null;
  description?: string | null;
  conversation_type?: ConversationType;
  status?: ConversationStatus;
  orchestration_mode?: OrchestrationMode;
  collaboration_strategy?: CollaborationStrategy;
  max_agents?: number;
  metadata?: Record<string, unknown>;
  tags?: string[];
  started_at?: string;
};

export type ConversationParticipantInsert = Omit<
  ConversationParticipant,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'message_count'
  | 'tokens_used'
  | 'cost_incurred'
  | 'tasks_assigned'
  | 'tasks_completed'
  | 'total_active_duration'
  | 'last_active_at'
  | 'left_at'
> & {
  id?: string;
  participant_role?: ParticipantRole;
  status?: ParticipantStatus;
  capabilities?: string[];
  tools_available?: string[];
  joined_at?: string;
};

export type AgentCollaborationInsert = Omit<
  AgentCollaboration,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'total_messages'
  | 'total_iterations'
  | 'completed_at'
  | 'collaboration_result'
  | 'consensus_score'
> & {
  id?: string;
  session_name?: string | null;
  session_type?: SessionType;
  participant_ids?: string[];
  lead_participant_id?: string | null;
  task_status?: TaskStatus;
  workflow_steps?: unknown[];
  current_step?: number;
  output_artifacts?: unknown[];
  started_at?: string;
};

export type MessageReactionInsert = Omit<
  MessageReaction,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  feedback_text?: string | null;
};

export type ConversationMetadataInsert = Omit<
  ConversationMetadata,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'view_count'
  | 'export_count'
  | 'share_count'
  | 'last_viewed_at'
> & {
  id?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
  is_favorite?: boolean;
  folder_id?: string | null;
  is_public?: boolean;
  share_token?: string | null;
  shared_with?: string[];
  default_model?: string | null;
  default_temperature?: number | null;
  default_max_tokens?: number | null;
  ui_settings?: Record<string, any>;
};

// =============================================
// UPDATE TYPES (for updating records)
// =============================================

export type MultiAgentConversationUpdate = Partial<
  Omit<MultiAgentConversation, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;
export type ConversationParticipantUpdate = Partial<
  Omit<
    ConversationParticipant,
    'id' | 'conversation_id' | 'created_at' | 'updated_at'
  >
>;
export type AgentCollaborationUpdate = Partial<
  Omit<
    AgentCollaboration,
    'id' | 'conversation_id' | 'created_at' | 'updated_at'
  >
>;
export type MessageReactionUpdate = Partial<
  Omit<
    MessageReaction,
    'id' | 'message_id' | 'user_id' | 'created_at' | 'updated_at'
  >
>;
export type ConversationMetadataUpdate = Partial<
  Omit<
    ConversationMetadata,
    'id' | 'conversation_id' | 'user_id' | 'created_at' | 'updated_at'
  >
>;

// =============================================
// EXTENDED TYPES (with joins)
// =============================================

export interface ConversationWithParticipants extends MultiAgentConversation {
  participants: ConversationParticipant[];
  metadata?: ConversationMetadata;
}

export interface ConversationWithDetails extends MultiAgentConversation {
  participants: ConversationParticipant[];
  collaborations: AgentCollaboration[];
  metadata: ConversationMetadata;
  message_count: number;
}

export interface ParticipantWithStats extends ConversationParticipant {
  conversation_title: string | null;
  efficiency_score: number;
}

// =============================================
// API REQUEST/RESPONSE TYPES
// =============================================

export interface CreateConversationRequest {
  title?: string;
  description?: string;
  conversation_type?: ConversationType;
  orchestration_mode?: OrchestrationMode;
  collaboration_strategy?: CollaborationStrategy;
  max_agents?: number;
  initial_participants?: {
    employee_id: string;
    employee_name: string;
    employee_role: string;
    employee_provider: string;
    participant_role?: ParticipantRole;
  }[];
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface AddParticipantRequest {
  employee_id: string;
  employee_name: string;
  employee_role: string;
  employee_provider: string;
  participant_role?: ParticipantRole;
  capabilities?: string[];
  tools_available?: string[];
}

export interface CreateCollaborationRequest {
  session_name?: string;
  session_type: SessionType;
  participant_ids: string[];
  lead_participant_id?: string;
  task_description: string;
  workflow_steps?: unknown[];
}

export interface ConversationListFilters {
  status?: ConversationStatus[];
  conversation_type?: ConversationType[];
  tags?: string[];
  search_query?: string;
  is_archived?: boolean;
  is_pinned?: boolean;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface ConversationStats {
  total_conversations: number;
  active_conversations: number;
  total_messages: number;
  total_tokens: number;
  total_cost: number;
  most_used_agents: Array<{
    employee_id: string;
    employee_name: string;
    usage_count: number;
  }>;
  average_conversation_duration: number;
}

// =============================================
// REAL-TIME SUBSCRIPTION TYPES
// =============================================

export interface RealtimeConversationUpdate {
  conversation_id: string;
  update_type:
    | 'status_change'
    | 'participant_added'
    | 'participant_removed'
    | 'message_added'
    | 'stats_updated';
  data: unknown;
  timestamp: string;
}

export interface RealtimeParticipantUpdate {
  participant_id: string;
  conversation_id: string;
  update_type: 'status_change' | 'activity' | 'stats_updated';
  data: unknown;
  timestamp: string;
}

export interface TypingIndicator {
  conversation_id: string;
  participant_id: string;
  employee_name: string;
  is_typing: boolean;
  timestamp: string;
}

export interface PresenceState {
  conversation_id: string;
  participant_id: string;
  status: 'online' | 'offline' | 'busy';
  last_seen: string;
}

// =============================================
// ERROR TYPES
// =============================================

export interface DatabaseError {
  code: string;
  message: string;
  details?: unknown;
}

export class MultiAgentChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MultiAgentChatError';
  }
}
