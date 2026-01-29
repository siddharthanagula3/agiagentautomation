/**
 * Conversation Branching Service
 *
 * Allows users to fork conversations at any message point,
 * creating alternate conversation paths and supporting conversation trees.
 *
 * Features:
 * - Branch at any message point
 * - Track parent-child session relationships
 * - Navigate branch history
 * - Name and rename branches
 */

import { supabase } from '@shared/lib/supabase-client';
import { chatPersistenceService } from './conversation-storage';
import type { ChatSession } from '../types';

/**
 * Branch metadata stored in database
 */
export interface ConversationBranch {
  id: string;
  parentSessionId: string;
  childSessionId: string;
  branchPointMessageId: string;
  branchName: string | null;
  createdAt: Date;
}

/**
 * Branch with additional session details
 */
export interface ConversationBranchWithDetails extends ConversationBranch {
  childSession?: ChatSession;
  messageCount?: number;
}

/**
 * Conversation tree with root and all branches
 */
export interface ConversationTree {
  rootSession: ChatSession;
  branches: ConversationBranchWithDetails[];
}

/**
 * Branch history entry for navigation
 */
export interface BranchHistoryEntry {
  sessionId: string;
  branchName: string | null;
  branchPointMessageId: string | null;
  depth: number;
}

/**
 * Database row structure for conversation_branches
 */
interface DBConversationBranch {
  id: string;
  parent_session_id: string;
  child_session_id: string;
  branch_point_message_id: string;
  branch_name: string | null;
  created_by: string | null;
  created_at: string;
}

export class ConversationBranchingService {
  /**
   * Branch a conversation at a specific message
   * Creates a new session with messages up to the branch point
   */
  async branchConversation(
    sessionId: string,
    branchPointMessageId: string,
    userId: string,
    branchName?: string
  ): Promise<ChatSession> {
    try {
      // Get the original session
      const originalSession = await chatPersistenceService.getSession(
        sessionId,
        userId
      );
      if (!originalSession) {
        throw new Error('Original session not found');
      }

      // Get all messages from the original session
      const allMessages =
        await chatPersistenceService.getSessionMessages(sessionId);

      // Find the branch point message
      const branchPointIndex = allMessages.findIndex(
        (msg) => msg.id === branchPointMessageId
      );

      if (branchPointIndex === -1) {
        throw new Error('Branch point message not found');
      }

      // Create a title for the branch
      const branchTitle =
        branchName ||
        `${originalSession.title} (Branch ${branchPointIndex + 1})`;

      // Create a new session for the branch
      const branchSession = await chatPersistenceService.createSession(
        userId,
        branchTitle,
        {
          employeeId: originalSession.metadata?.employeeId as string,
          role: originalSession.metadata?.role as string,
          provider: originalSession.metadata?.provider as string,
        }
      );

      // Copy messages up to and including the branch point to the new session
      if (branchPointIndex >= 0) {
        const messagesToCopy = allMessages.slice(0, branchPointIndex + 1);
        for (const msg of messagesToCopy) {
          await chatPersistenceService.saveMessage(
            branchSession.id,
            msg.role,
            msg.content
          );
        }
      }

      // Store branch metadata in the database
      await this.saveBranchMetadata(
        sessionId,
        branchSession.id,
        branchPointMessageId,
        branchName || null,
        userId
      );

      return branchSession;
    } catch (error) {
      console.error('Failed to branch conversation:', error);
      throw new Error(
        `Failed to branch conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Save branch metadata to the database
   */
  async saveBranchMetadata(
    parentSessionId: string,
    childSessionId: string,
    branchPointMessageId: string,
    branchName: string | null,
    userId: string
  ): Promise<ConversationBranch> {
    const { data, error } = await supabase
      .from('conversation_branches')
      .insert({
        parent_session_id: parentSessionId,
        child_session_id: childSessionId,
        branch_point_message_id: branchPointMessageId,
        branch_name: branchName,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save branch metadata:', error);
      throw new Error(`Failed to save branch metadata: ${error.message}`);
    }

    return this.mapDBBranchToBranch(data);
  }

  /**
   * Get all direct branches for a session
   */
  async getBranchesForSession(
    sessionId: string,
    userId?: string
  ): Promise<ConversationBranchWithDetails[]> {
    const { data, error } = await supabase
      .from('conversation_branches')
      .select(
        `
        *,
        child_session:chat_sessions!child_session_id (
          id,
          title,
          created_at,
          updated_at,
          is_active
        )
      `
      )
      .eq('parent_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get branches for session:', error);
      return [];
    }

    return (data || []).map((row) => {
      const branch = this.mapDBBranchToBranch(row);
      const childSession = row.child_session as {
        id: string;
        title: string;
        created_at: string;
        updated_at: string;
        is_active: boolean;
      } | null;

      return {
        ...branch,
        childSession: childSession
          ? {
              id: childSession.id,
              title: childSession.title || 'Untitled Branch',
              createdAt: new Date(childSession.created_at),
              updatedAt: new Date(childSession.updated_at),
              messageCount: 0,
              tokenCount: 0,
              cost: 0,
              isPinned: false,
              isArchived: !childSession.is_active,
              tags: [],
              participants: [],
            }
          : undefined,
      };
    });
  }

  /**
   * Get branch history (ancestry chain) for a session
   * Returns array from current session to root
   */
  async getBranchHistory(sessionId: string): Promise<BranchHistoryEntry[]> {
    const { data, error } = await supabase.rpc('get_branch_history', {
      p_session_id: sessionId,
    });

    if (error) {
      console.error('Failed to get branch history:', error);
      return [{ sessionId, branchName: null, branchPointMessageId: null, depth: 0 }];
    }

    return (data || []).map(
      (row: {
        session_id: string;
        branch_name: string | null;
        branch_point_message_id: string | null;
        depth: number;
      }) => ({
        sessionId: row.session_id,
        branchName: row.branch_name,
        branchPointMessageId: row.branch_point_message_id,
        depth: row.depth,
      })
    );
  }

  /**
   * Get the root session ID for any session in a branch tree
   */
  async getRootSessionId(sessionId: string): Promise<string> {
    const { data, error } = await supabase.rpc('get_root_session', {
      session_id: sessionId,
    });

    if (error) {
      console.error('Failed to get root session:', error);
      return sessionId; // Return self if error
    }

    return data || sessionId;
  }

  /**
   * Check if a session is a branch (has a parent)
   */
  async isBranchSession(sessionId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('conversation_branches')
      .select('id')
      .eq('child_session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Failed to check if session is branch:', error);
      return false;
    }

    return data !== null;
  }

  /**
   * Get branch info for a session if it is a branch
   */
  async getBranchInfo(sessionId: string): Promise<ConversationBranch | null> {
    const { data, error } = await supabase
      .from('conversation_branches')
      .select('*')
      .eq('child_session_id', sessionId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return this.mapDBBranchToBranch(data);
  }

  /**
   * Update branch name
   */
  async updateBranchName(
    branchId: string,
    newName: string
  ): Promise<ConversationBranch> {
    const { data, error } = await supabase
      .from('conversation_branches')
      .update({ branch_name: newName })
      .eq('id', branchId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update branch name: ${error.message}`);
    }

    return this.mapDBBranchToBranch(data);
  }

  /**
   * Delete a branch record (does not delete the session)
   */
  async deleteBranch(branchId: string): Promise<void> {
    const { error } = await supabase
      .from('conversation_branches')
      .delete()
      .eq('id', branchId);

    if (error) {
      throw new Error(`Failed to delete branch: ${error.message}`);
    }
  }

  /**
   * Get the conversation tree for a session
   * Finds the root and returns all branches
   */
  async getConversationTree(
    sessionId: string,
    userId: string
  ): Promise<ConversationTree> {
    // First, find the root session
    const rootSessionId = await this.getRootSessionId(sessionId);

    const rootSession = await chatPersistenceService.getSession(
      rootSessionId,
      userId
    );
    if (!rootSession) {
      throw new Error('Root session not found');
    }

    // Get all branches from root
    const branches = await this.getAllDescendantBranches(rootSessionId);

    return {
      rootSession,
      branches,
    };
  }

  /**
   * Get all descendant branches recursively
   */
  private async getAllDescendantBranches(
    sessionId: string,
    visited: Set<string> = new Set()
  ): Promise<ConversationBranchWithDetails[]> {
    if (visited.has(sessionId)) {
      return []; // Prevent cycles
    }
    visited.add(sessionId);

    const directBranches = await this.getBranchesForSession(sessionId);
    const allBranches: ConversationBranchWithDetails[] = [...directBranches];

    // Recursively get branches of branches
    for (const branch of directBranches) {
      const childBranches = await this.getAllDescendantBranches(
        branch.childSessionId,
        visited
      );
      allBranches.push(...childBranches);
    }

    return allBranches;
  }

  /**
   * Map database row to ConversationBranch
   */
  private mapDBBranchToBranch(dbBranch: DBConversationBranch): ConversationBranch {
    return {
      id: dbBranch.id,
      parentSessionId: dbBranch.parent_session_id,
      childSessionId: dbBranch.child_session_id,
      branchPointMessageId: dbBranch.branch_point_message_id,
      branchName: dbBranch.branch_name,
      createdAt: new Date(dbBranch.created_at),
    };
  }

  /**
   * Duplicate an entire conversation (full copy)
   * Unlike branching, this copies all messages
   */
  async duplicateConversation(
    sessionId: string,
    userId: string,
    newTitle?: string
  ): Promise<ChatSession> {
    try {
      // Get the original session
      const originalSession = await chatPersistenceService.getSession(
        sessionId,
        userId
      );
      if (!originalSession) {
        throw new Error('Original session not found');
      }

      // Create a new session
      const duplicateTitle = newTitle || `${originalSession.title} (Copy)`;

      const duplicateSession = await chatPersistenceService.createSession(
        userId,
        duplicateTitle,
        {
          employeeId: originalSession.metadata?.employeeId as string,
          role: originalSession.metadata?.role as string,
          provider: originalSession.metadata?.provider as string,
        }
      );

      // Copy all messages
      await chatPersistenceService.copySessionMessages(
        sessionId,
        duplicateSession.id,
        userId
      );

      return duplicateSession;
    } catch (error) {
      console.error('Failed to duplicate conversation:', error);
      throw new Error(
        `Failed to duplicate conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Merge two conversation branches
   * Creates a new session with messages from both branches
   */
  async mergeBranches(
    sessionId1: string,
    sessionId2: string,
    userId: string,
    newTitle?: string
  ): Promise<ChatSession> {
    try {
      // Get both sessions
      const [session1, session2] = await Promise.all([
        chatPersistenceService.getSession(sessionId1, userId),
        chatPersistenceService.getSession(sessionId2, userId),
      ]);

      if (!session1 || !session2) {
        throw new Error('One or both sessions not found');
      }

      // Get messages from both sessions
      const [messages1, messages2] = await Promise.all([
        chatPersistenceService.getSessionMessages(sessionId1),
        chatPersistenceService.getSessionMessages(sessionId2),
      ]);

      // Create a new session for the merge
      const mergeTitle =
        newTitle || `Merged: ${session1.title} + ${session2.title}`;

      const mergeSession = await chatPersistenceService.createSession(
        userId,
        mergeTitle,
        {
          employeeId: session1.metadata?.employeeId as string,
          role: session1.metadata?.role as string,
          provider: session1.metadata?.provider as string,
        }
      );

      // Combine messages sorted by timestamp
      const combinedMessages = [...messages1, ...messages2].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Copy combined messages to the merge session
      for (const msg of combinedMessages) {
        await chatPersistenceService.saveMessage(
          mergeSession.id,
          msg.role,
          msg.content
        );
      }

      return mergeSession;
    } catch (error) {
      console.error('Failed to merge branches:', error);
      throw new Error(
        `Failed to merge branches: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the parent session of a branch
   */
  async getParentSession(
    branchSessionId: string,
    userId: string
  ): Promise<ChatSession | null> {
    const branchInfo = await this.getBranchInfo(branchSessionId);
    if (!branchInfo) {
      return null;
    }

    return chatPersistenceService.getSession(branchInfo.parentSessionId, userId);
  }

  /**
   * Check if a session is a branch (alias for isBranchSession)
   */
  async isBranch(sessionId: string): Promise<boolean> {
    return this.isBranchSession(sessionId);
  }

  /**
   * Get all descendant sessions of a session (branches and their branches)
   */
  async getDescendants(
    sessionId: string,
    userId: string
  ): Promise<ChatSession[]> {
    const branches = await this.getAllDescendantBranches(sessionId);
    const sessions: ChatSession[] = [];

    for (const branch of branches) {
      const session = await chatPersistenceService.getSession(
        branch.childSessionId,
        userId
      );
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Get branches at a specific message point
   */
  async getBranchesAtMessage(
    messageId: string
  ): Promise<ConversationBranchWithDetails[]> {
    const { data, error } = await supabase
      .from('conversation_branches')
      .select(
        `
        *,
        child_session:chat_sessions!child_session_id (
          id,
          title,
          created_at,
          updated_at,
          is_active
        )
      `
      )
      .eq('branch_point_message_id', messageId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get branches at message:', error);
      return [];
    }

    return (data || []).map((row) => {
      const branch = this.mapDBBranchToBranch(row);
      const childSession = row.child_session as {
        id: string;
        title: string;
        created_at: string;
        updated_at: string;
        is_active: boolean;
      } | null;

      return {
        ...branch,
        childSession: childSession
          ? {
              id: childSession.id,
              title: childSession.title || 'Untitled Branch',
              createdAt: new Date(childSession.created_at),
              updatedAt: new Date(childSession.updated_at),
              messageCount: 0,
              tokenCount: 0,
              cost: 0,
              isPinned: false,
              isArchived: !childSession.is_active,
              tags: [],
              participants: [],
            }
          : undefined,
      };
    });
  }

  /**
   * Count branches for a session
   */
  async countBranches(sessionId: string): Promise<number> {
    const { count, error } = await supabase
      .from('conversation_branches')
      .select('*', { count: 'exact', head: true })
      .eq('parent_session_id', sessionId);

    if (error) {
      console.error('Failed to count branches:', error);
      return 0;
    }

    return count || 0;
  }
}

export const conversationBranchingService = new ConversationBranchingService();
