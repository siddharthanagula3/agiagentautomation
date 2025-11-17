/**
 * Collaboration Database Service
 *
 * Manages collaborative sessions between AI agents including:
 * - Collaboration session management
 * - Agent task assignment persistence
 * - Collaborative message tracking
 * - Session history and analytics
 */

import { supabase } from '@shared/lib/supabase-client';
import type {
  AgentCollaboration,
  AgentCollaborationInsert,
  AgentCollaborationUpdate,
  CreateCollaborationRequest,
  SessionType,
  TaskStatus,
  MultiAgentChatError,
} from '@shared/types/multi-agent-chat';

// =============================================
// COLLABORATION SESSION OPERATIONS
// =============================================

/**
 * Creates a new collaboration session
 */
export async function createCollaboration(
  conversationId: string,
  request: CreateCollaborationRequest
): Promise<AgentCollaboration> {
  try {
    const collaborationData: AgentCollaborationInsert = {
      conversation_id: conversationId,
      session_name: request.session_name || null,
      session_type: request.session_type,
      participant_ids: request.participant_ids,
      lead_participant_id: request.lead_participant_id || null,
      task_description: request.task_description,
      task_status: 'pending',
      workflow_steps: request.workflow_steps || [],
      current_step: 0,
      output_artifacts: [],
    };

    const { data, error } = await supabase
      .from('agent_collaborations')
      .insert(collaborationData)
      .select()
      .single();

    if (error) {
      throw new MultiAgentChatError(
        'Failed to create collaboration',
        'COLLABORATION_CREATE_ERROR',
        error
      );
    }

    return data;
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error creating collaboration',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Gets a collaboration session by ID
 */
export async function getCollaboration(
  collaborationId: string
): Promise<AgentCollaboration | null> {
  try {
    const { data, error } = await supabase
      .from('agent_collaborations')
      .select('*')
      .eq('id', collaborationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new MultiAgentChatError(
        'Failed to fetch collaboration',
        'COLLABORATION_FETCH_ERROR',
        error
      );
    }

    return data;
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error fetching collaboration',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Lists all collaborations for a conversation
 */
export async function listCollaborations(
  conversationId: string,
  filters?: {
    session_type?: SessionType[];
    task_status?: TaskStatus[];
    limit?: number;
    offset?: number;
  }
): Promise<{ collaborations: AgentCollaboration[]; total: number }> {
  try {
    let query = supabase
      .from('agent_collaborations')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId);

    // Apply filters
    if (filters?.session_type && filters.session_type.length > 0) {
      query = query.in('session_type', filters.session_type);
    }

    if (filters?.task_status && filters.task_status.length > 0) {
      query = query.in('task_status', filters.task_status);
    }

    // Pagination
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Ordering
    query = query.order('started_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new MultiAgentChatError(
        'Failed to list collaborations',
        'COLLABORATION_LIST_ERROR',
        error
      );
    }

    return {
      collaborations: data || [],
      total: count || 0,
    };
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error listing collaborations',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Updates a collaboration session
 */
export async function updateCollaboration(
  collaborationId: string,
  updates: AgentCollaborationUpdate
): Promise<AgentCollaboration> {
  try {
    const { data, error } = await supabase
      .from('agent_collaborations')
      .update(updates)
      .eq('id', collaborationId)
      .select()
      .single();

    if (error) {
      throw new MultiAgentChatError(
        'Failed to update collaboration',
        'COLLABORATION_UPDATE_ERROR',
        error
      );
    }

    return data;
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error updating collaboration',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Deletes a collaboration session
 */
export async function deleteCollaboration(
  collaborationId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('agent_collaborations')
      .delete()
      .eq('id', collaborationId);

    if (error) {
      throw new MultiAgentChatError(
        'Failed to delete collaboration',
        'COLLABORATION_DELETE_ERROR',
        error
      );
    }
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error deleting collaboration',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

// =============================================
// COLLABORATION STATE MANAGEMENT
// =============================================

/**
 * Starts a collaboration session
 */
export async function startCollaboration(
  collaborationId: string
): Promise<AgentCollaboration> {
  return updateCollaboration(collaborationId, {
    task_status: 'in_progress',
    started_at: new Date().toISOString(),
  });
}

/**
 * Completes a collaboration session
 */
// Updated: Nov 16th 2025 - Fixed any type
export async function completeCollaboration(
  collaborationId: string,
  result?: unknown,
  artifacts?: unknown[]
): Promise<AgentCollaboration> {
  return updateCollaboration(collaborationId, {
    task_status: 'completed',
    completed_at: new Date().toISOString(),
    collaboration_result: result || null,
    output_artifacts: artifacts || [],
  });
}

/**
 * Fails a collaboration session
 */
// Updated: Nov 16th 2025 - Fixed any type
export async function failCollaboration(
  collaborationId: string,
  errorDetails?: unknown
): Promise<AgentCollaboration> {
  return updateCollaboration(collaborationId, {
    task_status: 'failed',
    completed_at: new Date().toISOString(),
    collaboration_result: errorDetails
      ? { error: true, details: errorDetails }
      : null,
  });
}

/**
 * Cancels a collaboration session
 */
export async function cancelCollaboration(
  collaborationId: string
): Promise<AgentCollaboration> {
  return updateCollaboration(collaborationId, {
    task_status: 'cancelled',
    completed_at: new Date().toISOString(),
  });
}

// =============================================
// WORKFLOW MANAGEMENT
// =============================================

/**
 * Advances collaboration to the next workflow step
 */
export async function advanceWorkflowStep(
  collaborationId: string
): Promise<AgentCollaboration> {
  try {
    const collaboration = await getCollaboration(collaborationId);
    if (!collaboration) {
      throw new MultiAgentChatError(
        'Collaboration not found',
        'COLLABORATION_NOT_FOUND',
        { collaborationId }
      );
    }

    const nextStep = collaboration.current_step + 1;
    const workflowSteps = collaboration.workflow_steps as unknown[];

    // Check if we've reached the end
    if (nextStep >= workflowSteps.length) {
      // Auto-complete if all steps done
      return completeCollaboration(collaborationId);
    }

    return updateCollaboration(collaborationId, {
      current_step: nextStep,
    });
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error advancing workflow step',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Sets the current workflow step
 */
export async function setWorkflowStep(
  collaborationId: string,
  stepIndex: number
): Promise<AgentCollaboration> {
  try {
    const collaboration = await getCollaboration(collaborationId);
    if (!collaboration) {
      throw new MultiAgentChatError(
        'Collaboration not found',
        'COLLABORATION_NOT_FOUND',
        { collaborationId }
      );
    }

    const workflowSteps = collaboration.workflow_steps as unknown[];
    if (stepIndex < 0 || stepIndex >= workflowSteps.length) {
      throw new MultiAgentChatError(
        'Invalid workflow step index',
        'INVALID_WORKFLOW_STEP',
        { stepIndex, maxSteps: workflowSteps.length }
      );
    }

    return updateCollaboration(collaborationId, {
      current_step: stepIndex,
    });
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error setting workflow step',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Updates workflow steps
 */
export async function updateWorkflowSteps(
  collaborationId: string,
  steps: unknown[]
): Promise<AgentCollaboration> {
  return updateCollaboration(collaborationId, {
    workflow_steps: steps,
  });
}

// =============================================
// PARTICIPANT MANAGEMENT
// =============================================

/**
 * Adds a participant to a collaboration
 */
export async function addCollaborationParticipant(
  collaborationId: string,
  participantId: string
): Promise<AgentCollaboration> {
  try {
    const collaboration = await getCollaboration(collaborationId);
    if (!collaboration) {
      throw new MultiAgentChatError(
        'Collaboration not found',
        'COLLABORATION_NOT_FOUND',
        { collaborationId }
      );
    }

    // Check if participant already exists
    if (collaboration.participant_ids.includes(participantId)) {
      throw new MultiAgentChatError(
        'Participant already in collaboration',
        'PARTICIPANT_ALREADY_EXISTS',
        { participantId }
      );
    }

    const updatedParticipants = [
      ...collaboration.participant_ids,
      participantId,
    ];

    return updateCollaboration(collaborationId, {
      participant_ids: updatedParticipants,
    });
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error adding collaboration participant',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Removes a participant from a collaboration
 */
export async function removeCollaborationParticipant(
  collaborationId: string,
  participantId: string
): Promise<AgentCollaboration> {
  try {
    const collaboration = await getCollaboration(collaborationId);
    if (!collaboration) {
      throw new MultiAgentChatError(
        'Collaboration not found',
        'COLLABORATION_NOT_FOUND',
        { collaborationId }
      );
    }

    const updatedParticipants = collaboration.participant_ids.filter(
      (id) => id !== participantId
    );

    // If removing the lead, clear lead_participant_id
    const updates: AgentCollaborationUpdate = {
      participant_ids: updatedParticipants,
    };

    if (collaboration.lead_participant_id === participantId) {
      updates.lead_participant_id = null;
    }

    return updateCollaboration(collaborationId, updates);
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error removing collaboration participant',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Sets the lead participant
 */
export async function setLeadParticipant(
  collaborationId: string,
  participantId: string | null
): Promise<AgentCollaboration> {
  try {
    if (participantId) {
      // Verify participant exists in collaboration
      const collaboration = await getCollaboration(collaborationId);
      if (!collaboration) {
        throw new MultiAgentChatError(
          'Collaboration not found',
          'COLLABORATION_NOT_FOUND',
          { collaborationId }
        );
      }

      if (!collaboration.participant_ids.includes(participantId)) {
        throw new MultiAgentChatError(
          'Participant not in collaboration',
          'PARTICIPANT_NOT_FOUND',
          { participantId }
        );
      }
    }

    return updateCollaboration(collaborationId, {
      lead_participant_id: participantId,
    });
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error setting lead participant',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

// =============================================
// STATISTICS AND TRACKING
// =============================================

/**
 * Increments message count for a collaboration
 */
export async function incrementCollaborationMessages(
  collaborationId: string,
  count: number = 1
): Promise<void> {
  try {
    const collaboration = await getCollaboration(collaborationId);
    if (!collaboration) {
      throw new MultiAgentChatError(
        'Collaboration not found',
        'COLLABORATION_NOT_FOUND',
        { collaborationId }
      );
    }

    await updateCollaboration(collaborationId, {
      total_messages: collaboration.total_messages + count,
    });
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error incrementing collaboration messages',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Increments iteration count
 */
export async function incrementCollaborationIterations(
  collaborationId: string,
  count: number = 1
): Promise<void> {
  try {
    const collaboration = await getCollaboration(collaborationId);
    if (!collaboration) {
      throw new MultiAgentChatError(
        'Collaboration not found',
        'COLLABORATION_NOT_FOUND',
        { collaborationId }
      );
    }

    await updateCollaboration(collaborationId, {
      total_iterations: collaboration.total_iterations + count,
    });
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error incrementing collaboration iterations',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Updates consensus score
 */
export async function updateConsensusScore(
  collaborationId: string,
  score: number
): Promise<AgentCollaboration> {
  if (score < 0 || score > 1) {
    throw new MultiAgentChatError(
      'Invalid consensus score (must be between 0 and 1)',
      'INVALID_CONSENSUS_SCORE',
      { score }
    );
  }

  return updateCollaboration(collaborationId, {
    consensus_score: score,
  });
}

/**
 * Adds output artifacts
 */
export async function addOutputArtifacts(
  collaborationId: string,
  artifacts: unknown[]
): Promise<AgentCollaboration> {
  try {
    const collaboration = await getCollaboration(collaborationId);
    if (!collaboration) {
      throw new MultiAgentChatError(
        'Collaboration not found',
        'COLLABORATION_NOT_FOUND',
        { collaborationId }
      );
    }

    const existingArtifacts = collaboration.output_artifacts as unknown[];
    const updatedArtifacts = [...existingArtifacts, ...artifacts];

    return updateCollaboration(collaborationId, {
      output_artifacts: updatedArtifacts,
    });
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error adding output artifacts',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

// =============================================
// ANALYTICS AND REPORTING
// =============================================

/**
 * Gets collaboration statistics for a conversation
 */
export async function getCollaborationStats(conversationId: string): Promise<{
  total_collaborations: number;
  active_collaborations: number;
  completed_collaborations: number;
  failed_collaborations: number;
  total_messages: number;
  total_iterations: number;
  average_consensus_score: number;
  average_duration_seconds: number;
  collaboration_types: Record<string, number>;
}> {
  try {
    const { data: collaborations, error } = await supabase
      .from('agent_collaborations')
      .select('*')
      .eq('conversation_id', conversationId);

    if (error) {
      throw new MultiAgentChatError(
        'Failed to fetch collaboration stats',
        'COLLABORATION_STATS_ERROR',
        error
      );
    }

    const stats = {
      total_collaborations: collaborations?.length || 0,
      active_collaborations:
        collaborations?.filter((c) => c.task_status === 'in_progress').length ||
        0,
      completed_collaborations:
        collaborations?.filter((c) => c.task_status === 'completed').length ||
        0,
      failed_collaborations:
        collaborations?.filter((c) => c.task_status === 'failed').length || 0,
      total_messages:
        collaborations?.reduce((sum, c) => sum + c.total_messages, 0) || 0,
      total_iterations:
        collaborations?.reduce((sum, c) => sum + c.total_iterations, 0) || 0,
      average_consensus_score: 0,
      average_duration_seconds: 0,
      collaboration_types: {} as Record<string, number>,
    };

    // Calculate average consensus score
    const collaborationsWithConsensus =
      collaborations?.filter((c) => c.consensus_score !== null) || [];
    if (collaborationsWithConsensus.length > 0) {
      stats.average_consensus_score =
        collaborationsWithConsensus.reduce(
          (sum, c) => sum + (c.consensus_score || 0),
          0
        ) / collaborationsWithConsensus.length;
    }

    // Calculate average duration
    const completedCollaborations =
      collaborations?.filter((c) => c.completed_at && c.started_at) || [];
    if (completedCollaborations.length > 0) {
      const totalDuration = completedCollaborations.reduce((sum, c) => {
        const start = new Date(c.started_at).getTime();
        const end = new Date(c.completed_at!).getTime();
        return sum + (end - start);
      }, 0);
      stats.average_duration_seconds = Math.round(
        totalDuration / completedCollaborations.length / 1000
      );
    }

    // Count collaboration types
    collaborations?.forEach((c) => {
      stats.collaboration_types[c.session_type] =
        (stats.collaboration_types[c.session_type] || 0) + 1;
    });

    return stats;
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error fetching collaboration stats',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Gets active collaborations for a conversation
 */
export async function getActiveCollaborations(
  conversationId: string
): Promise<AgentCollaboration[]> {
  try {
    const { data, error } = await supabase
      .from('agent_collaborations')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('task_status', 'in_progress')
      .order('started_at', { ascending: false });

    if (error) {
      throw new MultiAgentChatError(
        'Failed to fetch active collaborations',
        'ACTIVE_COLLABORATIONS_ERROR',
        error
      );
    }

    return data || [];
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error fetching active collaborations',
      'UNEXPECTED_ERROR',
      error
    );
  }
}

/**
 * Gets collaboration history for a participant
 */
export async function getParticipantCollaborationHistory(
  participantId: string,
  limit: number = 50
): Promise<AgentCollaboration[]> {
  try {
    const { data, error } = await supabase
      .from('agent_collaborations')
      .select('*')
      .contains('participant_ids', [participantId])
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new MultiAgentChatError(
        'Failed to fetch participant collaboration history',
        'PARTICIPANT_HISTORY_ERROR',
        error
      );
    }

    return data || [];
  } catch (error) {
    if (error instanceof MultiAgentChatError) {
      throw error;
    }
    throw new MultiAgentChatError(
      'Unexpected error fetching participant collaboration history',
      'UNEXPECTED_ERROR',
      error
    );
  }
}
