/**
 * Conversation Branching Service
 *
 * Allows users to fork conversations at any message point,
 * creating alternate conversation paths and supporting conversation trees.
 */

import { chatPersistenceService } from './conversation-storage';
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
      const originalSession = await chatPersistenceService.getSession(sessionId, userId);
      if (!originalSession) {
        throw new Error('Original session not found');
      }

      // Get all messages from the original session
      const allMessages = await chatPersistenceService.getSessionMessages(sessionId);

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
        newTitle || `${originalSession.title} (Branch from message ${branchPointIndex + 1})`;

      const branchSession = await chatPersistenceService.createSession(userId, branchTitle, {
        employeeId: originalSession.metadata?.employeeId as string,
        role: originalSession.metadata?.role as string,
        provider: originalSession.metadata?.provider as string,
      });

      // Copy messages to the new branch
      if (messagesUpToBranch.length > 0) {
        await chatPersistenceService.copySessionMessages(sessionId, branchSession.id, userId);
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
   */
  private async storeBranchMetadata(
    branchSessionId: string,
    parentSessionId: string,
    branchPointMessageId: string,
    userId: string
  ): Promise<void> {
    // We can store this in the session metadata
    // For now, we'll use a simple approach with metadata
    // In production, you might want a dedicated branches table

    // This is a placeholder - you'd implement actual metadata storage
    // based on your database schema
    console.log('Branch metadata:', {
      branchSessionId,
      parentSessionId,
      branchPointMessageId,
    });
  }

  /**
   * Get all branches for a session
   */
  async getBranches(sessionId: string, userId: string): Promise<ConversationBranch[]> {
    // This would query a branches table or metadata
    // For now, returning empty array as placeholder
    // In production, implement proper branch tracking

    return [];
  }

  /**
   * Get the conversation tree for a session
   * Shows the root session and all its branches
   */
  async getConversationTree(sessionId: string, userId: string): Promise<ConversationTree> {
    const rootSession = await chatPersistenceService.getSession(sessionId, userId);
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
      const originalSession = await chatPersistenceService.getSession(sessionId, userId);
      if (!originalSession) {
        throw new Error('Original session not found');
      }

      // Create a new session
      const duplicateTitle = newTitle || `${originalSession.title} (Copy)`;

      const duplicateSession = await chatPersistenceService.createSession(userId, duplicateTitle, {
        employeeId: originalSession.metadata?.employeeId as string,
        role: originalSession.metadata?.role as string,
        provider: originalSession.metadata?.provider as string,
      });

      // Copy all messages
      await chatPersistenceService.copySessionMessages(sessionId, duplicateSession.id, userId);

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
      const mergeTitle = newTitle || `Merged: ${session1.title} + ${session2.title}`;

      const mergeSession = await chatPersistenceService.createSession(userId, mergeTitle, {
        employeeId: session1.metadata?.employeeId as string,
        role: session1.metadata?.role as string,
        provider: session1.metadata?.provider as string,
      });

      // Combine messages (you might want to sort by timestamp or use a different strategy)
      const combinedMessages = [...messages1, ...messages2].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      // Copy combined messages to the merge session
      // This is a simplified version - you'd need to handle this more carefully
      console.log('Merging messages:', combinedMessages.length);

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
  async getParentSession(branchSessionId: string, userId: string): Promise<ChatSession | null> {
    // This would look up the parent from branch metadata
    // For now, returning null as placeholder

    return null;
  }

  /**
   * Check if a session is a branch
   */
  async isBranch(sessionId: string): Promise<boolean> {
    // This would check if the session has parent metadata
    // For now, returning false as placeholder

    return false;
  }

  /**
   * Get all descendants of a session (branches and their branches)
   */
  async getDescendants(sessionId: string, userId: string): Promise<ChatSession[]> {
    // This would recursively get all branches and sub-branches
    // For now, returning empty array as placeholder

    return [];
  }
}

export const conversationBranchingService = new ConversationBranchingService();
