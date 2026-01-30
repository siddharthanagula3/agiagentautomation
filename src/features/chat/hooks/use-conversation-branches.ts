/**
 * useConversationBranches - Hooks for managing conversation branches
 *
 * Features:
 * - Load branches for a session (React Query)
 * - Create new branches
 * - Navigate between branches
 * - Track branch history
 *
 * Two API styles available:
 * 1. Legacy hook: useConversationBranches({ sessionId, userId }) - useState/useCallback based
 * 2. React Query hooks: useBranches(sessionId), useBranchHistory(sessionId), etc.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/stores/query-client';
import {
  conversationBranchingService,
  type ConversationBranchWithDetails,
  type BranchHistoryEntry,
} from '../services/conversation-branching';
import { supabase } from '@shared/lib/supabase-client';
import { toast } from 'sonner';
import { logger } from '@shared/lib/logger';
import type { ChatSession } from '../types';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query keys for conversation branches
 * @deprecated Use queryKeys.branches from @shared/stores/query-client instead
 */
export const branchQueryKeys = {
  all: queryKeys.branches.all,
  branches: queryKeys.branches.session,
  history: queryKeys.branches.history,
  root: queryKeys.branches.root,
  isBranch: queryKeys.branches.isBranch,
  atMessage: queryKeys.branches.atMessage,
} as const;

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to get all branches for a session using React Query
 *
 * @param sessionId - The parent session ID
 * @returns Query result with branches array
 */
export function useBranches(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.branches.session(sessionId ?? ''),
    queryFn: async (): Promise<ConversationBranchWithDetails[]> => {
      if (!sessionId) return [];
      return conversationBranchingService.getBranchesForSession(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Failed to load conversation branches',
    },
  });
}

/**
 * Hook to get branch history (ancestry chain) for a session using React Query
 *
 * @param sessionId - The session ID to get history for
 * @returns Query result with history array (from current to root)
 */
export function useBranchHistory(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.branches.history(sessionId ?? ''),
    queryFn: async (): Promise<BranchHistoryEntry[]> => {
      if (!sessionId) return [];
      return conversationBranchingService.getBranchHistory(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    meta: {
      errorMessage: 'Failed to load branch history',
    },
  });
}

/**
 * Hook to check if a session is a branch using React Query
 *
 * @param sessionId - The session ID to check
 * @returns Query result with boolean
 */
export function useIsBranchSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.branches.isBranch(sessionId ?? ''),
    queryFn: async (): Promise<boolean> => {
      if (!sessionId) return false;
      return conversationBranchingService.isBranchSession(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook to get root session ID using React Query
 *
 * @param sessionId - The session ID to find root for
 * @returns Query result with root session ID
 */
export function useRootSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.branches.root(sessionId ?? ''),
    queryFn: async (): Promise<string> => {
      if (!sessionId) return '';
      return conversationBranchingService.getRootSessionId(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    meta: {
      errorMessage: 'Failed to find root session',
    },
  });
}

/**
 * Hook to create a new branch using React Query mutation
 *
 * @returns Mutation for creating branches
 */
export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      messageId,
      userId,
      branchName,
    }: {
      sessionId: string;
      messageId: string;
      userId: string;
      branchName?: string;
    }): Promise<ChatSession> => {
      return conversationBranchingService.branchConversation(
        sessionId,
        messageId,
        userId,
        branchName
      );
    },
    onSuccess: (newSession, { sessionId, messageId }) => {
      // Invalidate branches for parent session
      queryClient.invalidateQueries({
        queryKey: queryKeys.branches.session(sessionId),
      });

      // Invalidate branches at the message
      queryClient.invalidateQueries({
        queryKey: queryKeys.branches.atMessage(messageId),
      });

      // Invalidate isBranch check for new session
      queryClient.invalidateQueries({
        queryKey: queryKeys.branches.isBranch(newSession.id),
      });

      toast.success('Conversation branched successfully');
    },
    onError: (error) => {
      logger.error('Failed to create branch:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create branch';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook to delete a branch using React Query mutation
 *
 * @returns Mutation for deleting branches
 */
export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      branchId,
      parentSessionId,
    }: {
      branchId: string;
      parentSessionId: string;
    }): Promise<void> => {
      await conversationBranchingService.deleteBranch(branchId);
    },
    onSuccess: (_, { parentSessionId }) => {
      // Invalidate branches for parent session
      queryClient.invalidateQueries({
        queryKey: queryKeys.branches.session(parentSessionId),
      });

      // Invalidate all branch queries to be safe
      queryClient.invalidateQueries({
        queryKey: queryKeys.branches.all(),
      });

      toast.success('Branch deleted');
    },
    onError: (error) => {
      logger.error('Failed to delete branch:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete branch';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook to update branch name using React Query mutation
 *
 * @returns Mutation for updating branch names
 */
export function useUpdateBranchName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      branchId,
      newName,
    }: {
      branchId: string;
      newName: string;
      parentSessionId: string;
    }) => {
      return conversationBranchingService.updateBranchName(branchId, newName);
    },
    onSuccess: (_, { parentSessionId }) => {
      // Invalidate branches for parent session
      queryClient.invalidateQueries({
        queryKey: queryKeys.branches.session(parentSessionId),
      });

      toast.success('Branch renamed');
    },
    onError: (error) => {
      logger.error('Failed to update branch name:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to rename branch';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook to invalidate all branch queries
 *
 * @returns Function to invalidate all branch queries
 */
export function useInvalidateBranchQueries() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.branches.all(),
    });
  }, [queryClient]);
}

// ============================================================================
// Legacy Hook (useState/useCallback based)
// Maintained for backward compatibility
// ============================================================================

interface UseConversationBranchesOptions {
  sessionId: string;
  userId: string;
  autoLoad?: boolean;
}

interface UseConversationBranchesResult {
  // State
  branches: ConversationBranchWithDetails[];
  branchHistory: BranchHistoryEntry[];
  isBranchSession: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadBranches: () => Promise<void>;
  createBranch: (
    messageId: string,
    branchName?: string
  ) => Promise<ChatSession | null>;
  getBranchesAtMessage: (
    messageId: string
  ) => Promise<ConversationBranchWithDetails[]>;
  updateBranchName: (branchId: string, newName: string) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;
  getRootSession: () => Promise<string>;

  // Computed
  totalBranches: number;
  hasBranches: boolean;
}

/**
 * Legacy hook for managing conversation branches
 * Uses useState/useCallback pattern for backward compatibility
 *
 * @deprecated Prefer using individual React Query hooks:
 * - useBranches(sessionId)
 * - useBranchHistory(sessionId)
 * - useCreateBranch()
 * - useDeleteBranch()
 */
export function useConversationBranches({
  sessionId,
  userId,
  autoLoad = true,
}: UseConversationBranchesOptions): UseConversationBranchesResult {
  const [branches, setBranches] = useState<ConversationBranchWithDetails[]>([]);
  const [branchHistory, setBranchHistory] = useState<BranchHistoryEntry[]>([]);
  const [isBranchSession, setIsBranchSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load branches for the current session
  const loadBranches = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [branchesResult, historyResult, isBranchResult] = await Promise.all(
        [
          conversationBranchingService.getBranchesForSession(sessionId),
          conversationBranchingService.getBranchHistory(sessionId),
          conversationBranchingService.isBranchSession(sessionId),
        ]
      );

      setBranches(branchesResult);
      setBranchHistory(historyResult);
      setIsBranchSession(isBranchResult);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load branches';
      setError(message);
      logger.error('Failed to load branches:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Auto-load on mount or session change
  useEffect(() => {
    if (autoLoad && sessionId) {
      loadBranches();
    }
  }, [autoLoad, sessionId, loadBranches]);

  // Create a new branch
  const createBranch = useCallback(
    async (
      messageId: string,
      branchName?: string
    ): Promise<ChatSession | null> => {
      try {
        const newSession =
          await conversationBranchingService.branchConversation(
            sessionId,
            messageId,
            userId,
            branchName
          );

        // Reload branches to include the new one
        await loadBranches();

        return newSession;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create branch';
        setError(message);
        logger.error('Failed to create branch:', err);
        return null;
      }
    },
    [sessionId, userId, loadBranches]
  );

  // Get branches at a specific message
  const getBranchesAtMessage = useCallback(
    async (messageId: string): Promise<ConversationBranchWithDetails[]> => {
      try {
        return await conversationBranchingService.getBranchesAtMessage(
          messageId
        );
      } catch (err) {
        logger.error('Failed to get branches at message:', err);
        return [];
      }
    },
    []
  );

  // Update branch name
  const updateBranchName = useCallback(
    async (branchId: string, newName: string): Promise<void> => {
      try {
        await conversationBranchingService.updateBranchName(branchId, newName);
        await loadBranches();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update branch name';
        setError(message);
        throw err;
      }
    },
    [loadBranches]
  );

  // Delete a branch
  const deleteBranch = useCallback(
    async (branchId: string): Promise<void> => {
      try {
        await conversationBranchingService.deleteBranch(branchId);
        await loadBranches();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete branch';
        setError(message);
        throw err;
      }
    },
    [loadBranches]
  );

  // Get root session ID
  const getRootSession = useCallback(async (): Promise<string> => {
    try {
      return await conversationBranchingService.getRootSessionId(sessionId);
    } catch (err) {
      logger.error('Failed to get root session:', err);
      return sessionId;
    }
  }, [sessionId]);

  return {
    // State
    branches,
    branchHistory,
    isBranchSession,
    isLoading,
    error,

    // Actions
    loadBranches,
    createBranch,
    getBranchesAtMessage,
    updateBranchName,
    deleteBranch,
    getRootSession,

    // Computed
    totalBranches: branches.length,
    hasBranches: branches.length > 0,
  };
}

// ============================================================================
// Additional React Query Hooks
// ============================================================================

/**
 * Hook to get branches at a specific message using React Query
 *
 * @param messageId - The message ID to get branches for
 * @returns Query result with branches at that message
 */
export function useMessageBranches(messageId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.branches.atMessage(messageId ?? ''),
    queryFn: async (): Promise<ConversationBranchWithDetails[]> => {
      if (!messageId) return [];
      return conversationBranchingService.getBranchesAtMessage(messageId);
    },
    enabled: !!messageId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    branches: query.data ?? [],
    hasBranches: (query.data?.length ?? 0) > 0,
    branchCount: query.data?.length ?? 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Hook to get branch info for a session using React Query
 *
 * @param sessionId - The session ID to get branch info for
 * @returns Branch info if session is a branch, null otherwise
 */
export function useBranchInfo(sessionId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.branches.info(sessionId ?? ''),
    queryFn: async () => {
      if (!sessionId) return null;
      return conversationBranchingService.getBranchInfo(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  return {
    isBranch: query.data !== null && query.data !== undefined,
    parentSessionId: query.data?.parentSessionId ?? null,
    branchName: query.data?.branchName ?? null,
    branchPointMessageId: query.data?.branchPointMessageId ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Hook to prefetch branch data for a session
 * Useful for improving UX when hovering over sessions
 *
 * @returns Function to prefetch branch data
 */
export function usePrefetchBranches() {
  const queryClient = useQueryClient();

  return useCallback(
    (sessionId: string) => {
      // Prefetch branches for the session
      queryClient.prefetchQuery({
        queryKey: queryKeys.branches.session(sessionId),
        queryFn: () =>
          conversationBranchingService.getBranchesForSession(sessionId),
        staleTime: 2 * 60 * 1000,
      });

      // Prefetch isBranch check
      queryClient.prefetchQuery({
        queryKey: queryKeys.branches.isBranch(sessionId),
        queryFn: () => conversationBranchingService.isBranchSession(sessionId),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );
}

/**
 * Hook to get the conversation tree for a session
 *
 * @param sessionId - Any session ID in the tree
 * @param userId - The user ID
 * @returns Query result with the conversation tree
 */
export function useConversationTree(
  sessionId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.branches.tree(sessionId ?? ''),
    queryFn: async () => {
      if (!sessionId || !userId) return null;
      return conversationBranchingService.getConversationTree(sessionId, userId);
    },
    enabled: !!sessionId && !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    meta: {
      errorMessage: 'Failed to load conversation tree',
    },
  });
}

/**
 * Hook to count branches for a session
 *
 * @param sessionId - The session ID
 * @returns Query result with branch count
 */
export function useBranchCount(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.branches.count(sessionId ?? ''),
    queryFn: async (): Promise<number> => {
      if (!sessionId) return 0;
      return conversationBranchingService.countBranches(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
