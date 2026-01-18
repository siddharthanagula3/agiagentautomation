/**
 * Chat React Query Hooks
 * Server state management for chat sessions and messages using React Query
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { queryKeys } from '@shared/stores/query-client';
import { supabase } from '@shared/lib/supabase-client';
import { chatPersistenceService } from '../services/conversation-storage';
import type { ChatSession, ChatMessage } from '../types';
import { toast } from 'sonner';

/**
 * Hook to get current authenticated user
 */
async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Fetch all chat sessions for a user
 */
export function useChatSessions(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.sessions(userId ?? ''),
    queryFn: async (): Promise<ChatSession[]> => {
      if (!userId) return [];

      const sessions = await chatPersistenceService.getUserSessions(userId);

      // Get message counts for each session in parallel
      const sessionsWithCounts = await Promise.all(
        sessions.map(async (session) => {
          const count = await chatPersistenceService.getMessageCount(
            session.id
          );
          return { ...session, messageCount: count };
        })
      );

      // Sort by updatedAt (most recent first)
      return sessionsWithCounts.sort((a, b) => {
        const aTime =
          a.updatedAt instanceof Date
            ? a.updatedAt.getTime()
            : new Date(a.updatedAt).getTime();
        const bTime =
          b.updatedAt instanceof Date
            ? b.updatedAt.getTime()
            : new Date(b.updatedAt).getTime();

        if (isNaN(aTime)) return 1;
        if (isNaN(bTime)) return -1;

        return bTime - aTime;
      });
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch a single chat session
 */
export function useChatSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.session(sessionId ?? ''),
    queryFn: async (): Promise<ChatSession | null> => {
      if (!sessionId) return null;

      const user = await getCurrentUser();
      if (!user) return null;

      return chatPersistenceService.getSession(sessionId, user.id);
    },
    enabled: !!sessionId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch messages for a chat session
 */
export function useChatMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.messages(sessionId ?? ''),
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!sessionId) return [];
      return chatPersistenceService.getSessionMessages(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds - messages update frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a new chat session
 */
export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title = 'New Chat',
      metadata,
    }: {
      title?: string;
      metadata?: {
        employeeId?: string;
        role?: string;
        provider?: string;
      };
    }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to create a chat');
      }

      return chatPersistenceService.createSession(user.id, title, metadata);
    },
    onSuccess: async (newSession) => {
      const user = await getCurrentUser();
      if (user) {
        // Optimistically add to cache
        queryClient.setQueryData<ChatSession[]>(
          queryKeys.chat.sessions(user.id),
          (old) => (old ? [newSession, ...old] : [newSession])
        );
      }
      toast.success('New chat created');
    },
    onError: (error) => {
      console.error('Failed to create session:', error);
      toast.error('Failed to create chat');
    },
  });
}

/**
 * Rename a chat session
 */
export function useRenameChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      newTitle,
    }: {
      sessionId: string;
      newTitle: string;
    }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to rename a chat');
      }

      await chatPersistenceService.updateSessionTitle(
        sessionId,
        newTitle,
        user.id
      );
      return { sessionId, newTitle, userId: user.id };
    },
    onSuccess: ({ sessionId, newTitle, userId }) => {
      // Update cache
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(userId),
        (old) =>
          old?.map((session) =>
            session.id === sessionId
              ? { ...session, title: newTitle, updatedAt: new Date() }
              : session
          )
      );

      // Also update individual session cache
      queryClient.setQueryData<ChatSession | null>(
        queryKeys.chat.session(sessionId),
        (old) =>
          old ? { ...old, title: newTitle, updatedAt: new Date() } : null
      );

      toast.success('Chat renamed');
    },
    onError: (error) => {
      console.error('Failed to rename session:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to rename chat';
      toast.error(errorMessage);
    },
  });
}

/**
 * Delete (archive) a chat session
 */
export function useDeleteChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to delete a chat');
      }

      await chatPersistenceService.deleteSession(sessionId, user.id);
      return { sessionId, userId: user.id };
    },
    onSuccess: ({ sessionId, userId }) => {
      // Remove from cache
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(userId),
        (old) => old?.filter((session) => session.id !== sessionId)
      );

      // Invalidate individual session cache
      queryClient.removeQueries({
        queryKey: queryKeys.chat.session(sessionId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.chat.messages(sessionId),
      });

      toast.success('Chat deleted');
    },
    onError: (error) => {
      console.error('Failed to delete session:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete chat';
      toast.error(errorMessage);
    },
  });
}

/**
 * Toggle star status on a chat session
 */
export function useToggleStarSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      isStarred,
    }: {
      sessionId: string;
      isStarred: boolean;
    }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in');
      }

      await chatPersistenceService.updateSessionStarred(
        sessionId,
        isStarred,
        user.id
      );
      return { sessionId, isStarred, userId: user.id };
    },
    onMutate: async ({ sessionId, isStarred }) => {
      const user = await getCurrentUser();
      if (!user) return;

      // Optimistic update
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id),
        (old) =>
          old?.map((session) =>
            session.id === sessionId ? { ...session, isStarred } : session
          )
      );
    },
    onSuccess: ({ isStarred }) => {
      toast.success(isStarred ? 'Chat starred' : 'Chat unstarred');
    },
    onError: (error, { sessionId }) => {
      console.error('Failed to update starred state:', error);
      toast.error('Failed to update starred state');
      // Revert optimistic update by invalidating
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.all() });
    },
  });
}

/**
 * Toggle pin status on a chat session
 */
export function useTogglePinSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      isPinned,
    }: {
      sessionId: string;
      isPinned: boolean;
    }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in');
      }

      await chatPersistenceService.updateSessionPinned(
        sessionId,
        isPinned,
        user.id
      );
      return { sessionId, isPinned, userId: user.id };
    },
    onMutate: async ({ sessionId, isPinned }) => {
      const user = await getCurrentUser();
      if (!user) return;

      // Optimistic update
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id),
        (old) =>
          old?.map((session) =>
            session.id === sessionId ? { ...session, isPinned } : session
          )
      );
    },
    onSuccess: ({ isPinned }) => {
      toast.success(isPinned ? 'Chat pinned' : 'Chat unpinned');
    },
    onError: (error) => {
      console.error('Failed to update pinned state:', error);
      toast.error('Failed to update pinned state');
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.all() });
    },
  });
}

/**
 * Toggle archive status on a chat session
 */
export function useToggleArchiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      isArchived,
    }: {
      sessionId: string;
      isArchived: boolean;
    }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in');
      }

      await chatPersistenceService.updateSessionArchived(
        sessionId,
        isArchived,
        user.id
      );
      return { sessionId, isArchived, userId: user.id };
    },
    onMutate: async ({ sessionId, isArchived }) => {
      const user = await getCurrentUser();
      if (!user) return;

      // Optimistic update
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id),
        (old) =>
          old?.map((session) =>
            session.id === sessionId ? { ...session, isArchived } : session
          )
      );
    },
    onSuccess: ({ isArchived }) => {
      toast.success(isArchived ? 'Chat archived' : 'Chat unarchived');
    },
    onError: (error) => {
      console.error('Failed to update archived state:', error);
      toast.error('Failed to update archived state');
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.all() });
    },
  });
}

/**
 * Duplicate a chat session
 */
export function useDuplicateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in');
      }

      // Get original session
      const original = await chatPersistenceService.getSession(
        sessionId,
        user.id
      );
      if (!original) {
        throw new Error('Original session not found');
      }

      // Create new session
      const newSession = await chatPersistenceService.createSession(
        user.id,
        `${original.title} (Copy)`
      );

      // Copy messages
      await chatPersistenceService.copySessionMessages(
        sessionId,
        newSession.id,
        user.id
      );

      return { newSession, userId: user.id };
    },
    onSuccess: ({ newSession, userId }) => {
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(userId),
        (old) => (old ? [newSession, ...old] : [newSession])
      );
      toast.success('Chat duplicated');
    },
    onError: (error) => {
      console.error('Failed to duplicate session:', error);
      toast.error('Failed to duplicate chat');
    },
  });
}

/**
 * Share a chat session
 */
export function useShareChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to share a chat');
      }

      // Generate share token
      const shareToken = `${sessionId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const shareLink = `${window.location.origin}/share/${shareToken}`;

      await chatPersistenceService.updateSessionSharedLink(
        sessionId,
        shareToken,
        user.id
      );

      return { shareLink, sessionId, userId: user.id };
    },
    onSuccess: async ({ shareLink }) => {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard');
    },
    onError: (error) => {
      console.error('Failed to share session:', error);
      toast.error('Failed to share chat');
    },
  });
}

/**
 * Search chat sessions
 */
export function useSearchChatSessions(query: string) {
  return useQuery({
    queryKey: ['chat', 'search', query],
    queryFn: async (): Promise<ChatSession[]> => {
      if (!query.trim()) return [];

      const user = await getCurrentUser();
      if (!user) return [];

      return chatPersistenceService.searchSessions(user.id, query);
    },
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Save a new message to a session
 */
export function useSaveMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      role,
      content,
    }: {
      sessionId: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
    }) => {
      return chatPersistenceService.saveMessage(sessionId, role, content);
    },
    onSuccess: (newMessage) => {
      // Add message to cache
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(newMessage.sessionId),
        (old) => (old ? [...old, newMessage] : [newMessage])
      );
    },
    onError: (error) => {
      console.error('Failed to save message:', error);
    },
  });
}

/**
 * Update an existing message
 */
export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      newContent,
      sessionId,
    }: {
      messageId: string;
      newContent: string;
      sessionId: string;
    }) => {
      const updated = await chatPersistenceService.updateMessage(
        messageId,
        newContent
      );
      return { ...updated, sessionId };
    },
    onSuccess: (updatedMessage) => {
      // Update message in cache
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(updatedMessage.sessionId),
        (old) =>
          old?.map((msg) =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
      );
      toast.success('Message updated');
    },
    onError: (error) => {
      console.error('Failed to update message:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update message';
      toast.error(errorMessage);
    },
  });
}

/**
 * Delete a message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      sessionId,
    }: {
      messageId: string;
      sessionId: string;
    }) => {
      await chatPersistenceService.deleteMessage(messageId);
      return { messageId, sessionId };
    },
    onSuccess: ({ messageId, sessionId }) => {
      // Remove message from cache
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(sessionId),
        (old) => old?.filter((msg) => msg.id !== messageId)
      );
      toast.success('Message deleted');
    },
    onError: (error) => {
      console.error('Failed to delete message:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete message';
      toast.error(errorMessage);
    },
  });
}

/**
 * Invalidate all chat queries - useful after major changes
 */
export function useInvalidateChatQueries() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.all() });
  };
}
