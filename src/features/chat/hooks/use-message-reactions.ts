/**
 * Message Reactions React Query Hook
 * Server state management for message reactions using React Query
 * Supports optimistic updates for instant UI feedback
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@shared/lib/supabase-client';
import {
  messageReactionsService,
  type ReactionSummary,
  REACTION_EMOJIS,
} from '../services/message-reactions-service';
import { toast } from 'sonner';
import { logger } from '@shared/lib/logger';

// Re-export for convenience
export { REACTION_EMOJIS, type ReactionSummary };

/**
 * Query key factory for reactions
 */
export const reactionQueryKeys = {
  all: () => ['reactions'] as const,
  message: (messageId: string) => ['reactions', 'message', messageId] as const,
  messages: (messageIds: string[]) =>
    ['reactions', 'messages', messageIds.sort().join(',')] as const,
};

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Hook to fetch reactions for a single message
 */
export function useMessageReactions(messageId: string | undefined) {
  return useQuery({
    queryKey: reactionQueryKeys.message(messageId ?? ''),
    queryFn: async (): Promise<ReactionSummary[]> => {
      if (!messageId) return [];
      return messageReactionsService.getReactions(messageId);
    },
    enabled: !!messageId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Failed to load reactions',
    },
  });
}

/**
 * Hook to fetch reactions for multiple messages (batch query)
 * Useful for loading reactions for all messages in a conversation
 */
export function useMessagesReactions(messageIds: string[]) {
  return useQuery({
    queryKey: reactionQueryKeys.messages(messageIds),
    queryFn: async (): Promise<Map<string, ReactionSummary[]>> => {
      if (messageIds.length === 0) return new Map();
      return messageReactionsService.getReactionsForMessages(messageIds);
    },
    enabled: messageIds.length > 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    meta: {
      errorMessage: 'Failed to load reactions',
    },
  });
}

/**
 * Hook to add a reaction to a message
 */
export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to react');
      }
      const reaction = await messageReactionsService.addReaction(
        user.id,
        messageId,
        emoji
      );
      return { reaction, userId: user.id, messageId, emoji };
    },
    onMutate: async ({ messageId, emoji }) => {
      const user = await getCurrentUser();
      if (!user) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: reactionQueryKeys.message(messageId),
      });

      // Snapshot previous value
      const previousReactions = queryClient.getQueryData<ReactionSummary[]>(
        reactionQueryKeys.message(messageId)
      );

      // Optimistically update
      queryClient.setQueryData<ReactionSummary[]>(
        reactionQueryKeys.message(messageId),
        (old) => {
          const reactions = old || [];
          const existingIndex = reactions.findIndex((r) => r.emoji === emoji);

          if (existingIndex >= 0) {
            // Increment existing reaction count
            return reactions.map((r, i) =>
              i === existingIndex
                ? {
                    ...r,
                    count: r.count + 1,
                    userIds: [...r.userIds, user.id],
                    userReacted: true,
                  }
                : r
            );
          } else {
            // Add new reaction
            return [
              ...reactions,
              {
                emoji,
                count: 1,
                userIds: [user.id],
                userReacted: true,
              },
            ];
          }
        }
      );

      return { previousReactions };
    },
    onError: (error, { messageId }, context) => {
      // Rollback on error
      if (context?.previousReactions) {
        queryClient.setQueryData(
          reactionQueryKeys.message(messageId),
          context.previousReactions
        );
      }
      logger.error('Failed to add reaction:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to add reaction';
      toast.error(errorMessage);
    },
    onSettled: (_data, _error, { messageId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: reactionQueryKeys.message(messageId),
      });
    },
  });
}

/**
 * Hook to remove a reaction from a message
 */
export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to remove reaction');
      }
      await messageReactionsService.removeReaction(user.id, messageId, emoji);
      return { userId: user.id, messageId, emoji };
    },
    onMutate: async ({ messageId, emoji }) => {
      const user = await getCurrentUser();
      if (!user) return;

      await queryClient.cancelQueries({
        queryKey: reactionQueryKeys.message(messageId),
      });

      const previousReactions = queryClient.getQueryData<ReactionSummary[]>(
        reactionQueryKeys.message(messageId)
      );

      // Optimistically update
      queryClient.setQueryData<ReactionSummary[]>(
        reactionQueryKeys.message(messageId),
        (old) => {
          if (!old) return [];
          return old
            .map((r) => {
              if (r.emoji === emoji) {
                const newCount = r.count - 1;
                if (newCount <= 0) return null; // Remove if count is 0
                return {
                  ...r,
                  count: newCount,
                  userIds: r.userIds.filter((id) => id !== user.id),
                  userReacted: false,
                };
              }
              return r;
            })
            .filter((r): r is ReactionSummary => r !== null);
        }
      );

      return { previousReactions };
    },
    onError: (error, { messageId }, context) => {
      if (context?.previousReactions) {
        queryClient.setQueryData(
          reactionQueryKeys.message(messageId),
          context.previousReactions
        );
      }
      logger.error('Failed to remove reaction:', error);
      toast.error('Failed to remove reaction');
    },
    onSettled: (_data, _error, { messageId }) => {
      queryClient.invalidateQueries({
        queryKey: reactionQueryKeys.message(messageId),
      });
    },
  });
}

/**
 * Hook to toggle a reaction (add if not exists, remove if exists)
 * This is the primary hook for reaction UI interactions
 */
export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to react');
      }
      const result = await messageReactionsService.toggleReaction(
        user.id,
        messageId,
        emoji
      );
      return { ...result, userId: user.id, messageId, emoji };
    },
    onMutate: async ({ messageId, emoji }) => {
      const user = await getCurrentUser();
      if (!user) return;

      await queryClient.cancelQueries({
        queryKey: reactionQueryKeys.message(messageId),
      });

      const previousReactions = queryClient.getQueryData<ReactionSummary[]>(
        reactionQueryKeys.message(messageId)
      );

      // Determine if adding or removing based on current state
      const existing = previousReactions?.find((r) => r.emoji === emoji);
      const isRemoving = existing?.userReacted;

      queryClient.setQueryData<ReactionSummary[]>(
        reactionQueryKeys.message(messageId),
        (old) => {
          const reactions = old || [];

          if (isRemoving && existing) {
            // Remove reaction
            return reactions
              .map((r) => {
                if (r.emoji === emoji) {
                  const newCount = r.count - 1;
                  if (newCount <= 0) return null;
                  return {
                    ...r,
                    count: newCount,
                    userIds: r.userIds.filter((id) => id !== user.id),
                    userReacted: false,
                  };
                }
                return r;
              })
              .filter((r): r is ReactionSummary => r !== null);
          } else {
            // Add reaction
            const existingIndex = reactions.findIndex((r) => r.emoji === emoji);
            if (existingIndex >= 0) {
              return reactions.map((r, i) =>
                i === existingIndex
                  ? {
                      ...r,
                      count: r.count + 1,
                      userIds: [...r.userIds, user.id],
                      userReacted: true,
                    }
                  : r
              );
            } else {
              return [
                ...reactions,
                {
                  emoji,
                  count: 1,
                  userIds: [user.id],
                  userReacted: true,
                },
              ];
            }
          }
        }
      );

      return { previousReactions };
    },
    onError: (error, { messageId }, context) => {
      if (context?.previousReactions) {
        queryClient.setQueryData(
          reactionQueryKeys.message(messageId),
          context.previousReactions
        );
      }
      logger.error('Failed to toggle reaction:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update reaction';
      toast.error(errorMessage);
    },
    onSettled: (_data, _error, { messageId }) => {
      queryClient.invalidateQueries({
        queryKey: reactionQueryKeys.message(messageId),
      });
    },
  });
}

/**
 * Hook that provides all reaction functionality for a message
 * Combines query and mutation hooks for convenient use
 */
export function useReactions(messageId: string | undefined) {
  const reactionsQuery = useMessageReactions(messageId);
  const toggleReaction = useToggleReaction();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();

  return {
    // Data
    reactions: reactionsQuery.data || [],
    isLoading: reactionsQuery.isLoading,
    error: reactionsQuery.error,

    // Actions
    toggle: (emoji: string) => {
      if (!messageId) return;
      toggleReaction.mutate({ messageId, emoji });
    },
    add: (emoji: string) => {
      if (!messageId) return;
      addReaction.mutate({ messageId, emoji });
    },
    remove: (emoji: string) => {
      if (!messageId) return;
      removeReaction.mutate({ messageId, emoji });
    },

    // Mutation states
    isToggling: toggleReaction.isPending,
    isAdding: addReaction.isPending,
    isRemoving: removeReaction.isPending,

    // Helper to check if user has reacted with specific emoji
    hasReacted: (emoji: string) =>
      reactionsQuery.data?.find((r) => r.emoji === emoji)?.userReacted ?? false,

    // Helper to get count for specific emoji
    getCount: (emoji: string) =>
      reactionsQuery.data?.find((r) => r.emoji === emoji)?.count ?? 0,
  };
}
