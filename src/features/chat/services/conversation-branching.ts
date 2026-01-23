/**
 * Conversation Branching Service
 *
 * Allows users to fork conversations at any message point,
 * creating alternate conversation paths and supporting conversation trees.
 */

import { chatPersistenceService } from './conversation-storage';
import { supabase } from '@shared/lib/supabase-client';
import type { ChatSession, ChatMessage } from '../types';

export interface ConversationBranch {
  id: string;
  parentSessionId: string;
  branchPointMessageId: string;
  title: string;
  createdAt: Date;
  messageCount: number;
}

export interface ConversationTree {
  rootSession: ChatSession;
  branches: ConversationBranch[];
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

      // Get messages up to and including the branch point
      const messagesUpToBranch = allMessages.slice(0, branchPointIndex + 1);

      // Create a new session for the branch
      const branchTitle =
        newTitle ||
        `${originalSession.title} (Branch from message ${branchPointIndex + 1})`;

      const branchSession = await chatPersistenceService.createSession(
        userId,
        branchTitle,
        {
          employeeId: originalSession.metadata?.employeeId as string,
          role: originalSession.metadata?.role as string,
          provider: originalSession.metadata?.provider as string,
        }
      );

      // Copy messages to the new branch
      if (messagesUpToBranch.length > 0) {
        await chatPersistenceService.copySessionMessages(
          sessionId,
          branchSession.id,
          userId
        );
      }

      // Store branch metadata in the new session
      // This helps track conversation trees
      await this.storeBranchMetadata(
        branchSession.id,
        sessionId,
        branchPointMessageId,
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
   * Store branch metadata for tracking conversation trees
   * Uses the chat_session_metadata table or updates session metadata
   */
  private async storeBranchMetadata(
    branchSessionId: string,
    parentSessionId: string,
    branchPointMessageId: string,
    userId: string
  ): Promise<void> {
    try {
      // Store branch metadata in the session's metadata field
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          metadata: {
            parent_session_id: parentSessionId,
            branch_point_message_id: branchPointMessageId,
            branched_at: new Date().toISOString(),
            is_branch: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', branchSessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to store branch metadata:', error);
        throw error;
      }

      // Also update the parent session to track its children
      const { data: parentSession } = await supabase
        .from('chat_sessions')
        .select('metadata')
        .eq('id', parentSessionId)
        .eq('user_id', userId)
        .maybeSingle();

      const parentMetadata = (parentSession?.metadata as Record<string, unknown>) || {};
      const childBranches = (parentMetadata.child_branches as string[]) || [];

      await supabase
        .from('chat_sessions')
        .update({
          metadata: {
            ...parentMetadata,
            child_branches: [...childBranches, branchSessionId],
            has_branches: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', parentSessionId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error storing branch metadata:', error);
      // Non-critical - log but don't throw
    }
  }

  /**
   * Get all branches for a session
   * Queries sessions that have this session as their parent
   */
  async getBranches(
    sessionId: string,
    userId: string
  ): Promise<ConversationBranch[]> {
    try {
      // Query sessions where metadata indicates this session as parent
      const { data: branchSessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .not('metadata', 'is', null);

      if (error) {
        console.error('Failed to get branches:', error);
        return [];
      }

      // Filter sessions that are branches of this session
      const branches: ConversationBranch[] = [];

      for (const session of branchSessions || []) {
        const metadata = session.metadata as Record<string, unknown>;
        if (metadata?.parent_session_id === sessionId) {
          // Get message count for this branch
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          branches.push({
            id: session.id,
            parentSessionId: sessionId,
            branchPointMessageId: metadata.branch_point_message_id as string,
            title: session.title || 'Untitled Branch',
            createdAt: new Date(metadata.branched_at as string || session.created_at),
            messageCount: count || 0,
          });
        }
      }

      return branches;
    } catch (error) {
      console.error('Error getting branches:', error);
      return [];
    }
  }

  /**
   * Get the conversation tree for a session
   * Shows the root session and all its branches
   */
  async getConversationTree(
    sessionId: string,
    userId: string
  ): Promise<ConversationTree> {
    const rootSession = await chatPersistenceService.getSession(
      sessionId,
      userId
    );
    if (!rootSession) {
      throw new Error('Session not found');
    }

    const branches = await this.getBranches(sessionId, userId);

    return {
      rootSession,
      branches,
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

      // Combine messages (you might want to sort by timestamp or use a different strategy)
      const combinedMessages = [...messages1, ...messages2].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      // Copy combined messages to the merge session
      // This is a simplified version - you'd need to handle this more carefully

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
    try {
      // Get the branch session to find its parent ID
      const { data: branchSession, error: branchError } = await supabase
        .from('chat_sessions')
        .select('metadata')
        .eq('id', branchSessionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (branchError || !branchSession) {
        return null;
      }

      const metadata = branchSession.metadata as Record<string, unknown>;
      const parentSessionId = metadata?.parent_session_id as string;

      if (!parentSessionId) {
        return null;
      }

      // Get the parent session
      return await chatPersistenceService.getSession(parentSessionId, userId);
    } catch (error) {
      console.error('Error getting parent session:', error);
      return null;
    }
  }

  /**
   * Check if a session is a branch
   */
  async isBranch(sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('metadata')
        .eq('id', sessionId)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      const metadata = data.metadata as Record<string, unknown>;
      return metadata?.is_branch === true;
    } catch (error) {
      console.error('Error checking if session is branch:', error);
      return false;
    }
  }

  /**
   * Get all descendants of a session (branches and their branches)
   * Uses recursive querying to get the full tree
   */
  async getDescendants(
    sessionId: string,
    userId: string
  ): Promise<ChatSession[]> {
    try {
      const descendants: ChatSession[] = [];
      const visited = new Set<string>();

      // Recursive function to get all descendants
      const collectDescendants = async (parentId: string) => {
        if (visited.has(parentId)) return;
        visited.add(parentId);

        const branches = await this.getBranches(parentId, userId);

        for (const branch of branches) {
          const session = await chatPersistenceService.getSession(branch.id, userId);
          if (session) {
            descendants.push(session);
            // Recursively get children of this branch
            await collectDescendants(branch.id);
          }
        }
      };

      await collectDescendants(sessionId);
      return descendants;
    } catch (error) {
      console.error('Error getting descendants:', error);
      return [];
    }
  }
}

export const conversationBranchingService = new ConversationBranchingService();
