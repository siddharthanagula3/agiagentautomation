/**
 * Multi-Agent Chat Database Service
 *
 * Comprehensive database operations for multi-agent conversations including:
 * - Conversation CRUD operations
 * - Participant management
 * - Message persistence with participants
 * - Batch operations for performance
 * - Transaction support
 */

import { supabase } from '@shared/lib/supabase-client';
import type {
  MultiAgentConversation,
  MultiAgentConversationInsert,
  MultiAgentConversationUpdate,
  ConversationParticipant,
  ConversationParticipantInsert,
  ConversationParticipantUpdate,
  ConversationMetadata,
  ConversationMetadataInsert,
  ConversationMetadataUpdate,
  ConversationWithParticipants,
  ConversationWithDetails,
  CreateConversationRequest,
  AddParticipantRequest,
  ConversationListFilters,
  ConversationStats,
  MultiAgentChatError,
} from '@shared/types/multi-agent-chat';

// =============================================
// CONVERSATION OPERATIONS
// =============================================

/**
 * Creates a new multi-agent conversation
 */
export async function createConversation(
  userId: string,
  request: CreateConversationRequest
): Promise<ConversationWithParticipants> {
  try {
    // Start a transaction by creating conversation first
    const conversationData: MultiAgentConversationInsert = {
      user_id: userId,
      title: request.title || null,
      description: request.description || null,
      conversation_type: request.conversation_type || 'multi_agent',
      orchestration_mode: request.orchestration_mode || 'automatic',
      collaboration_strategy: request.collaboration_strategy || 'parallel',
      max_agents: request.max_agents || 10,
      metadata: request.metadata || {},
      tags: request.tags || [],
      status: 'active',
    };

    const { data: conversation, error: convError } = await supabase
      .from('multi_agent_conversations')
      .insert(conversationData)
      .select()
      .maybeSingle();

    if (convError) {
      throw new MultiAgentChatError(
        'Failed to create conversation',
        'CONVERSATION_CREATE_ERROR',
        convError
      );
    }

    if (!conversation) {
      throw new MultiAgentChatError(
        'Failed to create conversation: No data returned',
        'CONVERSATION_CREATE_ERROR',
        null
      );
    }

    // Create metadata record
    const metadataData: ConversationMetadataInsert = {
      conversation_id: conversation.id,
      user_id: userId,
      ui_settings: {},
    };

    const { error: metaError } = await supabase
      .from('conversation_metadata')
      .insert(metadataData);

    if (metaError) {
      console.error('Failed to create conversation metadata:', metaError);
      // Don't fail the conversation creation for metadata error
    }

    // Add initial participants if provided
    let participants: ConversationParticipant[] = [];
    if (
      request.initial_participants &&
      request.initial_participants.length > 0
    ) {
      participants = await addParticipantsBatch(
        conversation.id,
        request.initial_participants
      );
    }

    return {
      ...conversation,
      participants,
    };
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error creating conversation',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Gets a conversation by ID with participants
 */
export async function getConversation(
  conversationId: string,
  userId: string
): Promise<ConversationWithParticipants | null> {
  try {
    const { data: conversation, error: convError } = await supabase
      .from('multi_agent_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (convError) {
      throw new MultiAgentChatError(
        'Failed to fetch conversation',
        'CONVERSATION_FETCH_ERROR',
        convError
      );
    }

    if (!conversation) {
      return null;
    }

    // Get participants
    const { data: participants, error: partError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('joined_at', { ascending: true });

    if (partError) {
      console.error('Failed to fetch participants:', partError);
    }

    return {
      ...conversation,
      participants: participants || [],
    };
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error fetching conversation',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Gets conversation with full details (participants, collaborations, metadata)
 */
export async function getConversationWithDetails(
  conversationId: string,
  userId: string
): Promise<ConversationWithDetails | null> {
  try {
    // Get base conversation
    const conversation = await getConversation(conversationId, userId);
    if (!conversation) {
      return null;
    }

    // Get collaborations
    const { data: collaborations, error: collabError } = await supabase
      .from('agent_collaborations')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('started_at', { ascending: false });

    if (collabError) {
      console.error('Failed to fetch collaborations:', collabError);
    }

    // Get metadata
    const { data: metadata, error: metaError } = await supabase
      .from('conversation_metadata')
      .select('*')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (metaError) {
      console.error('Failed to fetch metadata:', metaError);
    }

    // Get message count from chat_messages table
    const { count: messageCount, error: countError } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', conversationId);

    if (countError) {
      console.error('Failed to count messages:', countError);
    }

    return {
      ...conversation,
      collaborations: collaborations || [],
      metadata: metadata || ({} as ConversationMetadata),
      message_count: messageCount || 0,
    };
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error fetching conversation details',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Lists conversations with filters and pagination
 */
export async function listConversations(
  userId: string,
  filters: ConversationListFilters = {}
): Promise<{ conversations: ConversationWithParticipants[]; total: number }> {
  try {
    let query = supabase
      .from('multi_agent_conversations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters.conversation_type && filters.conversation_type.length > 0) {
      query = query.in('conversation_type', filters.conversation_type);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters.search_query) {
      // Updated: Nov 16th 2025 - Fixed SQL injection by sanitizing user input
      // Escape special characters that could be used for SQL injection
      const sanitized = filters.search_query
        .replace(/[%_\\]/g, '\\$&') // Escape LIKE wildcards and backslash
        .replace(/'/g, "''"); // Escape single quotes
      query = query.or(
        `title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
      );
    }

    // Apply metadata filters (requires join - simplified approach)
    if (filters.is_archived !== undefined || filters.is_pinned !== undefined) {
      // This is a simplified approach - ideally use a view or complex query
      console.warn(
        'Archived/pinned filters require metadata join - not implemented in this query'
      );
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Ordering
    query = query.order('last_message_at', {
      ascending: false,
      nullsFirst: false,
    });

    const { data: conversations, error: convError, count } = await query;

    if (convError) {
      throw new MultiAgentChatError(
        'Failed to list conversations',
        'CONVERSATION_LIST_ERROR',
        convError
      );
    }

    // Batch fetch participants for all conversations
    const conversationIds = conversations?.map((c) => c.id) || [];
    let participantsMap: Record<string, ConversationParticipant[]> = {};

    if (conversationIds.length > 0) {
      const { data: allParticipants, error: partError } = await supabase
        .from('conversation_participants')
        .select('*')
        .in('conversation_id', conversationIds);

      if (partError) {
        console.error('Failed to fetch participants:', partError);
      } else {
        // Group participants by conversation_id
        participantsMap = (allParticipants || []).reduce(
          (acc, participant) => {
            if (!acc[participant.conversation_id]) {
              acc[participant.conversation_id] = [];
            }
            acc[participant.conversation_id].push(participant);
            return acc;
          },
          {} as Record<string, ConversationParticipant[]>
        );
      }
    }

    const conversationsWithParticipants: ConversationWithParticipants[] =
      conversations?.map((conv) => ({
        ...conv,
        participants: participantsMap[conv.id] || [],
      })) || [];

    return {
      conversations: conversationsWithParticipants,
      total: count || 0,
    };
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error listing conversations',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Updates a conversation
 */
export async function updateConversation(
  conversationId: string,
  userId: string,
  updates: MultiAgentConversationUpdate
): Promise<MultiAgentConversation> {
  try {
    const { data, error } = await supabase
      .from('multi_agent_conversations')
      .update(updates)
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      throw new MultiAgentChatError(
        'Failed to update conversation',
        'CONVERSATION_UPDATE_ERROR',
        error
      );
    }

    if (!data) {
      throw new MultiAgentChatError(
        'Conversation not found or you do not have permission to update it',
        'CONVERSATION_NOT_FOUND',
        null
      );
    }

    return data;
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error updating conversation',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Deletes a conversation (cascade deletes participants, collaborations, metadata)
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('multi_agent_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      throw new MultiAgentChatError(
        'Failed to delete conversation',
        'CONVERSATION_DELETE_ERROR',
        error
      );
    }
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error deleting conversation',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

// =============================================
// PARTICIPANT OPERATIONS
// =============================================

/**
 * Adds a participant to a conversation
 */
export async function addParticipant(
  conversationId: string,
  request: AddParticipantRequest
): Promise<ConversationParticipant> {
  try {
    const participantData: ConversationParticipantInsert = {
      conversation_id: conversationId,
      employee_id: request.employee_id,
      employee_name: request.employee_name,
      employee_role: request.employee_role,
      employee_provider: request.employee_provider,
      participant_role: request.participant_role || 'collaborator',
      status: 'active',
      capabilities: request.capabilities || [],
      tools_available: request.tools_available || [],
    };

    const { data, error } = await supabase
      .from('conversation_participants')
      .insert(participantData)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new MultiAgentChatError(
          'Participant already exists in conversation',
          'PARTICIPANT_ALREADY_EXISTS',
          error
        );
      }
      throw new MultiAgentChatError(
        'Failed to add participant',
        'PARTICIPANT_ADD_ERROR',
        error
      );
    }

    if (!data) {
      throw new MultiAgentChatError(
        'Failed to add participant: No data returned',
        'PARTICIPANT_ADD_ERROR',
        null
      );
    }

    return data;
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error adding participant',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Adds multiple participants in batch
 */
export async function addParticipantsBatch(
  conversationId: string,
  participants: AddParticipantRequest[]
): Promise<ConversationParticipant[]> {
  try {
    const participantsData: ConversationParticipantInsert[] = participants.map(
      (p) => ({
        conversation_id: conversationId,
        employee_id: p.employee_id,
        employee_name: p.employee_name,
        employee_role: p.employee_role,
        employee_provider: p.employee_provider,
        participant_role: p.participant_role || 'collaborator',
        status: 'active',
        capabilities: p.capabilities || [],
        tools_available: p.tools_available || [],
      })
    );

    const { data, error } = await supabase
      .from('conversation_participants')
      .insert(participantsData)
      .select();

    if (error) {
      throw new MultiAgentChatError(
        'Failed to add participants in batch',
        'PARTICIPANT_BATCH_ADD_ERROR',
        error
      );
    }

    return data || [];
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error adding participants in batch',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Gets all participants in a conversation
 */
export async function getParticipants(
  conversationId: string
): Promise<ConversationParticipant[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new MultiAgentChatError(
        'Failed to fetch participants',
        'PARTICIPANT_FETCH_ERROR',
        error
      );
    }

    return data || [];
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error fetching participants',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Updates a participant
 */
export async function updateParticipant(
  participantId: string,
  updates: ConversationParticipantUpdate
): Promise<ConversationParticipant> {
  try {
    const { data, error } = await supabase
      .from('conversation_participants')
      .update(updates)
      .eq('id', participantId)
      .select()
      .maybeSingle();

    if (error) {
      throw new MultiAgentChatError(
        'Failed to update participant',
        'PARTICIPANT_UPDATE_ERROR',
        error
      );
    }

    if (!data) {
      throw new MultiAgentChatError(
        'Participant not found',
        'PARTICIPANT_NOT_FOUND',
        null
      );
    }

    return data;
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error updating participant',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Removes a participant from a conversation
 */
export async function removeParticipant(participantId: string): Promise<void> {
  try {
    // Soft delete by updating status and setting left_at
    const { error } = await supabase
      .from('conversation_participants')
      .update({
        status: 'removed',
        left_at: new Date().toISOString(),
      })
      .eq('id', participantId);

    if (error) {
      throw new MultiAgentChatError(
        'Failed to remove participant',
        'PARTICIPANT_REMOVE_ERROR',
        error
      );
    }
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error removing participant',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Updates participant activity
 */
export async function updateParticipantActivity(
  participantId: string,
  status: 'active' | 'idle' | 'working'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversation_participants')
      .update({
        status,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', participantId);

    if (error) {
      throw new MultiAgentChatError(
        'Failed to update participant activity',
        'PARTICIPANT_ACTIVITY_ERROR',
        error
      );
    }
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error updating participant activity',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Increments participant statistics using atomic database operations
 * Updated: Jan 10th 2026 - Deep repair: removed race-prone fallback, added retry logic
 *
 * CRITICAL: This function uses PostgreSQL's atomic increment via RPC to prevent
 * race conditions. The non-atomic fallback was removed because it caused data loss
 * when concurrent updates occurred.
 *
 * @param participantId - The participant UUID to update
 * @param stats - Statistics to increment (all values are additive)
 * @param options - Optional retry configuration
 * @throws MultiAgentChatError if the operation fails after retries
 */
export async function incrementParticipantStats(
  participantId: string,
  stats: {
    message_count?: number;
    tokens_used?: number;
    cost_incurred?: number;
    tasks_completed?: number;
  },
  options: { maxRetries?: number; retryDelayMs?: number } = {}
): Promise<{ success: boolean; retriesUsed: number }> {
  const { maxRetries = 3, retryDelayMs = 100 } = options;
  let lastError: Error | null = null;
  let retriesUsed = 0;

  // Validate input
  if (!participantId || typeof participantId !== 'string') {
    throw new MultiAgentChatError(
      'Invalid participantId provided',
      'INVALID_PARTICIPANT_ID',
      { participantId }
    );
  }

  // Ensure at least one stat is being updated
  const hasStats =
    (stats.message_count && stats.message_count > 0) ||
    (stats.tokens_used && stats.tokens_used > 0) ||
    (stats.cost_incurred && stats.cost_incurred > 0) ||
    (stats.tasks_completed && stats.tasks_completed > 0);

  if (!hasStats) {
    // No-op if no stats to update - return early
    return { success: true, retriesUsed: 0 };
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Use atomic RPC function for increment - prevents race conditions
      const { error } = await supabase.rpc('increment_participant_stats', {
        p_participant_id: participantId,
        p_message_count: stats.message_count || 0,
        p_tokens_used: stats.tokens_used || 0,
        p_cost_incurred: stats.cost_incurred || 0,
        p_tasks_completed: stats.tasks_completed || 0,
      });

      if (error) {
        // Categorize the error for proper handling
        const errorMessage = error.message?.toLowerCase() || '';
        const errorCode = error.code || '';

        // Check if RPC function doesn't exist (migration not applied)
        if (
          errorMessage.includes('function') &&
          (errorMessage.includes('does not exist') ||
            errorMessage.includes('could not find'))
        ) {
          // CRITICAL: Do not fall back to non-atomic operations
          // Instead, throw actionable error with migration instructions
          throw new MultiAgentChatError(
            'Database migration required: increment_participant_stats RPC function not found. ' +
              'Run: supabase migration up 20251117000003_add_participant_stats_rpc.sql',
            'MIGRATION_REQUIRED',
            {
              missingFunction: 'increment_participant_stats',
              migrationFile: '20251117000003_add_participant_stats_rpc.sql',
              originalError: error,
            }
          );
        }

        // Check if participant doesn't exist
        if (
          errorMessage.includes('participant not found') ||
          errorCode === 'P0001' // PostgreSQL RAISE EXCEPTION code
        ) {
          throw new MultiAgentChatError(
            `Participant not found: ${participantId}`,
            'PARTICIPANT_NOT_FOUND',
            { participantId, originalError: error }
          );
        }

        // Check for transient errors that warrant retry
        const isTransientError =
          errorCode === '40001' || // Serialization failure
          errorCode === '40P01' || // Deadlock detected
          errorCode === '57P01' || // Admin shutdown
          errorCode === '57P02' || // Crash shutdown
          errorCode === '57P03' || // Cannot connect now
          errorMessage.includes('connection') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('temporarily unavailable');

        if (isTransientError && attempt < maxRetries) {
          lastError = new Error(error.message);
          retriesUsed = attempt + 1;
          console.warn(
            `[incrementParticipantStats] Transient error on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${retryDelayMs}ms:`,
            error.message
          );
          await sleep(retryDelayMs * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }

        // Non-transient error or max retries exceeded
        throw new MultiAgentChatError(
          `Failed to increment participant stats: ${error.message}`,
          'PARTICIPANT_STATS_UPDATE_ERROR',
          {
            participantId,
            stats,
            attemptsMade: attempt + 1,
            errorCode,
            originalError: error,
          }
        );
      }

      // Success - log for audit trail
      console.log(
        `[incrementParticipantStats] Successfully updated participant ${participantId}:`,
        {
          message_count: `+${stats.message_count || 0}`,
          tokens_used: `+${stats.tokens_used || 0}`,
          cost_incurred: `+${stats.cost_incurred || 0}`,
          tasks_completed: `+${stats.tasks_completed || 0}`,
          retriesUsed,
        }
      );

      return { success: true, retriesUsed };
    } catch (error) {
      // Re-throw MultiAgentChatError as-is
      if (error instanceof MultiAgentChatError) {
        throw error;
      }

      // Handle unexpected errors
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        retriesUsed = attempt + 1;
        console.warn(
          `[incrementParticipantStats] Unexpected error on attempt ${attempt + 1}/${maxRetries + 1}:`,
          lastError.message
        );
        await sleep(retryDelayMs * Math.pow(2, attempt));
        continue;
      }
    }
  }

  // All retries exhausted
  throw new MultiAgentChatError(
    `Failed to increment participant stats after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
    'MAX_RETRIES_EXCEEDED',
    {
      participantId,
      stats,
      maxRetries,
      lastError: lastError?.message,
    }
  );
}

/**
 * Helper function for async sleep with exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================
// METADATA OPERATIONS
// =============================================

/**
 * Gets conversation metadata
 */
export async function getConversationMetadata(
  conversationId: string
): Promise<ConversationMetadata | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_metadata')
      .select('*')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (error) {
      throw new MultiAgentChatError(
        'Failed to fetch conversation metadata',
        'METADATA_FETCH_ERROR',
        error
      );
    }

    return data;
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error fetching metadata',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Updates conversation metadata
 */
export async function updateConversationMetadata(
  conversationId: string,
  updates: ConversationMetadataUpdate
): Promise<ConversationMetadata> {
  try {
    const { data, error } = await supabase
      .from('conversation_metadata')
      .update(updates)
      .eq('conversation_id', conversationId)
      .select()
      .maybeSingle();

    if (error) {
      throw new MultiAgentChatError(
        'Failed to update conversation metadata',
        'METADATA_UPDATE_ERROR',
        error
      );
    }

    if (!data) {
      throw new MultiAgentChatError(
        'Conversation metadata not found',
        'METADATA_NOT_FOUND',
        null
      );
    }

    return data;
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error updating metadata',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

// =============================================
// STATISTICS AND ANALYTICS
// =============================================

/**
 * Gets conversation statistics for a user
 */
export async function getConversationStats(
  userId: string
): Promise<ConversationStats> {
  try {
    // Get aggregate stats
    const { data: conversations, error: convError } = await supabase
      .from('multi_agent_conversations')
      .select(
        'status, total_messages, total_tokens, total_cost, started_at, completed_at'
      )
      .eq('user_id', userId);

    if (convError) {
      throw new MultiAgentChatError(
        'Failed to fetch conversation stats',
        'STATS_FETCH_ERROR',
        convError
      );
    }

    const total_conversations = conversations?.length || 0;
    const active_conversations =
      conversations?.filter((c) => c.status === 'active').length || 0;
    const total_messages =
      conversations?.reduce((sum, c) => sum + c.total_messages, 0) || 0;
    const total_tokens =
      conversations?.reduce((sum, c) => sum + c.total_tokens, 0) || 0;
    const total_cost =
      conversations?.reduce((sum, c) => sum + c.total_cost, 0) || 0;

    // Calculate average duration
    const completedConversations =
      conversations?.filter((c) => c.completed_at && c.started_at) || [];
    const totalDuration = completedConversations.reduce((sum, c) => {
      const start = new Date(c.started_at).getTime();
      const end = new Date(c.completed_at!).getTime();
      return sum + (end - start);
    }, 0);
    const average_conversation_duration =
      completedConversations.length > 0
        ? Math.round(totalDuration / completedConversations.length / 1000)
        : 0;

    // Get most used agents
    const conversationIds = conversations?.map((c) => c.id) || [];
    let most_used_agents: Array<{
      employee_id: string;
      employee_name: string;
      usage_count: number;
    }> = [];

    if (conversationIds.length > 0) {
      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select('employee_id, employee_name')
        .in('conversation_id', conversationIds);

      if (!partError && participants) {
        const agentCounts = participants.reduce(
          (acc, p) => {
            const key = `${p.employee_id}|${p.employee_name}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        most_used_agents = Object.entries(agentCounts)
          .map(([key, count]) => {
            const [employee_id, employee_name] = key.split('|');
            return { employee_id, employee_name, usage_count: count };
          })
          .sort((a, b) => b.usage_count - a.usage_count)
          .slice(0, 10);
      }
    }

    return {
      total_conversations,
      active_conversations,
      total_messages,
      total_tokens,
      total_cost,
      most_used_agents,
      average_conversation_duration,
    };
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error fetching conversation stats',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Archives a conversation
 */
export async function archiveConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    // Update conversation status
    await updateConversation(conversationId, userId, { status: 'archived' });

    // Update metadata
    await updateConversationMetadata(conversationId, { is_archived: true });
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error archiving conversation',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Pins a conversation
 */
export async function pinConversation(
  conversationId: string,
  isPinned: boolean
): Promise<void> {
  try {
    await updateConversationMetadata(conversationId, { is_pinned: isPinned });
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error pinning conversation',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Generates a share token for a conversation
 */
export async function generateShareToken(
  conversationId: string
): Promise<string> {
  try {
    const shareToken = crypto.randomUUID();
    await updateConversationMetadata(conversationId, {
      is_public: true,
      share_token: shareToken,
    });
    return shareToken;
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error generating share token',
      'UNEXPECTED_ERROR',
      error
    );
  }
}
