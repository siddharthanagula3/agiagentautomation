/**
 * Conversation Branch Service
 * Handles conversation branching operations for chat sessions
 * Wraps Supabase RPC functions: get_root_session, get_session_branches, get_branch_history
 *
 * This is a low-level service that provides direct database access.
 * For higher-level operations with session creation/copying, use:
 * @see src/features/chat/services/conversation-branching.ts
 */

import { supabase } from '@shared/lib/supabase-client';
import { logger } from '@shared/lib/logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a conversation branch record from the database
 */
export interface ConversationBranch {
  id: string;
  parentSessionId: string;
  childSessionId: string;
  branchPointMessageId: string;
  branchName: string | null;
  createdBy: string | null;
  createdAt: Date;
}

/**
 * Branch info returned from get_session_branches RPC
 */
export interface SessionBranchInfo {
  branchId: string;
  childSessionId: string;
  branchPointMessageId: string;
  branchName: string | null;
  createdAt: Date;
}

/**
 * Branch history entry returned from get_branch_history RPC
 */
export interface BranchHistoryEntry {
  sessionId: string;
  branchName: string | null;
  branchPointMessageId: string | null;
  depth: number;
}

/**
 * Parameters for creating a new branch record
 * Note: This only creates the branch relationship, not the child session
 * For creating a full branch with session, use conversationBranchingService.branchConversation()
 */
export interface CreateBranchParams {
  parentSessionId: string;
  childSessionId: string;
  branchPointMessageId: string;
  branchName?: string;
  createdBy?: string;
}

/**
 * Parameters for updating a branch
 */
export interface UpdateBranchParams {
  branchId: string;
  branchName: string;
}

// ============================================================================
// Database Row Types (snake_case from Supabase)
// ============================================================================

interface ConversationBranchRow {
  id: string;
  parent_session_id: string;
  child_session_id: string;
  branch_point_message_id: string;
  branch_name: string | null;
  created_by: string | null;
  created_at: string;
}

interface SessionBranchRow {
  branch_id: string;
  child_session_id: string;
  branch_point_message_id: string;
  branch_name: string | null;
  created_at: string;
}

interface BranchHistoryRow {
  session_id: string;
  branch_name: string | null;
  branch_point_message_id: string | null;
  depth: number;
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Conversation Branch Service
 * Provides methods for managing conversation branches
 */
class ConversationBranchService {
  private static instance: ConversationBranchService;

  private constructor() {}

  static getInstance(): ConversationBranchService {
    if (!ConversationBranchService.instance) {
      ConversationBranchService.instance = new ConversationBranchService();
    }
    return ConversationBranchService.instance;
  }

  // --------------------------------------------------------------------------
  // RPC Function Wrappers
  // --------------------------------------------------------------------------

  /**
   * Get the root session of a branch chain
   * Traverses up the branch hierarchy to find the original session
   *
   * @param sessionId - The session ID to find the root for
   * @returns The root session ID, or null if not found
   */
  async getRootSession(sessionId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_root_session', {
        session_id: sessionId,
      });

      if (error) {
        logger.error('Failed to get root session:', error);
        throw new Error(`Failed to get root session: ${error.message}`);
      }

      return data as string | null;
    } catch (error) {
      logger.error('Error in getRootSession:', error);
      throw error;
    }
  }

  /**
   * Get all direct branches of a session
   * Returns child sessions that were branched from the specified session
   *
   * @param sessionId - The parent session ID
   * @returns Array of branch information
   */
  async getSessionBranches(sessionId: string): Promise<SessionBranchInfo[]> {
    try {
      const { data, error } = await supabase.rpc('get_session_branches', {
        p_session_id: sessionId,
      });

      if (error) {
        logger.error('Failed to get session branches:', error);
        throw new Error(`Failed to get session branches: ${error.message}`);
      }

      if (!data) {
        return [];
      }

      // Transform from snake_case to camelCase
      return (data as SessionBranchRow[]).map((row) => ({
        branchId: row.branch_id,
        childSessionId: row.child_session_id,
        branchPointMessageId: row.branch_point_message_id,
        branchName: row.branch_name,
        createdAt: new Date(row.created_at),
      }));
    } catch (error) {
      logger.error('Error in getSessionBranches:', error);
      throw error;
    }
  }

  /**
   * Get the branch history (ancestry chain) for a session
   * Returns all ancestor sessions from the current session to the root
   *
   * @param sessionId - The session ID to get history for
   * @returns Array of branch history entries, ordered from current to root
   */
  async getBranchHistory(sessionId: string): Promise<BranchHistoryEntry[]> {
    try {
      const { data, error } = await supabase.rpc('get_branch_history', {
        p_session_id: sessionId,
      });

      if (error) {
        logger.error('Failed to get branch history:', error);
        throw new Error(`Failed to get branch history: ${error.message}`);
      }

      if (!data) {
        return [];
      }

      // Transform from snake_case to camelCase
      return (data as BranchHistoryRow[]).map((row) => ({
        sessionId: row.session_id,
        branchName: row.branch_name,
        branchPointMessageId: row.branch_point_message_id,
        depth: row.depth,
      }));
    } catch (error) {
      logger.error('Error in getBranchHistory:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new conversation branch
   *
   * @param params - Branch creation parameters
   * @returns The created branch record
   */
  async createBranch(params: CreateBranchParams): Promise<ConversationBranch> {
    try {
      const { data, error } = await supabase
        .from('conversation_branches')
        .insert({
          parent_session_id: params.parentSessionId,
          child_session_id: params.childSessionId,
          branch_point_message_id: params.branchPointMessageId,
          branch_name: params.branchName ?? null,
          created_by: params.createdBy ?? null,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create branch:', error);
        throw new Error(`Failed to create branch: ${error.message}`);
      }

      const row = data as ConversationBranchRow;
      return {
        id: row.id,
        parentSessionId: row.parent_session_id,
        childSessionId: row.child_session_id,
        branchPointMessageId: row.branch_point_message_id,
        branchName: row.branch_name,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
      };
    } catch (error) {
      logger.error('Error in createBranch:', error);
      throw error;
    }
  }

  /**
   * Get a branch by its ID
   *
   * @param branchId - The branch ID
   * @returns The branch record, or null if not found
   */
  async getBranch(branchId: string): Promise<ConversationBranch | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_branches')
        .select()
        .eq('id', branchId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to get branch:', error);
        throw new Error(`Failed to get branch: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const row = data as ConversationBranchRow;
      return {
        id: row.id,
        parentSessionId: row.parent_session_id,
        childSessionId: row.child_session_id,
        branchPointMessageId: row.branch_point_message_id,
        branchName: row.branch_name,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
      };
    } catch (error) {
      logger.error('Error in getBranch:', error);
      throw error;
    }
  }

  /**
   * Get a branch by child session ID
   *
   * @param childSessionId - The child session ID
   * @returns The branch record, or null if the session is not a branch
   */
  async getBranchByChildSession(
    childSessionId: string
  ): Promise<ConversationBranch | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_branches')
        .select()
        .eq('child_session_id', childSessionId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to get branch by child session:', error);
        throw new Error(
          `Failed to get branch by child session: ${error.message}`
        );
      }

      if (!data) {
        return null;
      }

      const row = data as ConversationBranchRow;
      return {
        id: row.id,
        parentSessionId: row.parent_session_id,
        childSessionId: row.child_session_id,
        branchPointMessageId: row.branch_point_message_id,
        branchName: row.branch_name,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
      };
    } catch (error) {
      logger.error('Error in getBranchByChildSession:', error);
      throw error;
    }
  }

  /**
   * Update a branch name
   *
   * @param params - Update parameters
   * @returns The updated branch record
   */
  async updateBranchName(
    params: UpdateBranchParams
  ): Promise<ConversationBranch> {
    try {
      const { data, error } = await supabase
        .from('conversation_branches')
        .update({ branch_name: params.branchName })
        .eq('id', params.branchId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update branch name:', error);
        throw new Error(`Failed to update branch name: ${error.message}`);
      }

      const row = data as ConversationBranchRow;
      return {
        id: row.id,
        parentSessionId: row.parent_session_id,
        childSessionId: row.child_session_id,
        branchPointMessageId: row.branch_point_message_id,
        branchName: row.branch_name,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
      };
    } catch (error) {
      logger.error('Error in updateBranchName:', error);
      throw error;
    }
  }

  /**
   * Delete a branch record
   * Note: This only deletes the branch relationship, not the child session
   *
   * @param branchId - The branch ID to delete
   */
  async deleteBranch(branchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_branches')
        .delete()
        .eq('id', branchId);

      if (error) {
        logger.error('Failed to delete branch:', error);
        throw new Error(`Failed to delete branch: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error in deleteBranch:', error);
      throw error;
    }
  }

  /**
   * Delete a branch by child session ID
   * Useful when deleting a branched session
   *
   * @param childSessionId - The child session ID
   */
  async deleteBranchByChildSession(childSessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_branches')
        .delete()
        .eq('child_session_id', childSessionId);

      if (error) {
        logger.error('Failed to delete branch by child session:', error);
        throw new Error(
          `Failed to delete branch by child session: ${error.message}`
        );
      }
    } catch (error) {
      logger.error('Error in deleteBranchByChildSession:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Check if a session is a branch (has a parent)
   *
   * @param sessionId - The session ID to check
   * @returns True if the session is a branch
   */
  async isBranch(sessionId: string): Promise<boolean> {
    const branch = await this.getBranchByChildSession(sessionId);
    return branch !== null;
  }

  /**
   * Check if a session has branches (has children)
   *
   * @param sessionId - The session ID to check
   * @returns True if the session has branches
   */
  async hasBranches(sessionId: string): Promise<boolean> {
    const branches = await this.getSessionBranches(sessionId);
    return branches.length > 0;
  }

  /**
   * Get the full branch tree for a session
   * Returns all branches recursively from the root
   *
   * @param sessionId - The session ID (will find root first)
   * @returns Map of session IDs to their branches
   */
  async getBranchTree(
    sessionId: string
  ): Promise<Map<string, SessionBranchInfo[]>> {
    const tree = new Map<string, SessionBranchInfo[]>();

    // Find root session
    const rootId = await this.getRootSession(sessionId);
    if (!rootId) {
      return tree;
    }

    // Build tree recursively
    const buildTree = async (id: string): Promise<void> => {
      const branches = await this.getSessionBranches(id);
      tree.set(id, branches);

      for (const branch of branches) {
        await buildTree(branch.childSessionId);
      }
    };

    await buildTree(rootId);
    return tree;
  }

  /**
   * Count total branches in a conversation tree
   *
   * @param sessionId - Any session ID in the tree
   * @returns Total number of branches
   */
  async countBranchesInTree(sessionId: string): Promise<number> {
    const tree = await this.getBranchTree(sessionId);
    let count = 0;
    for (const branches of tree.values()) {
      count += branches.length;
    }
    return count;
  }
}

// Export singleton instance
export const conversationBranchService =
  ConversationBranchService.getInstance();

// Export class for testing
export { ConversationBranchService };
