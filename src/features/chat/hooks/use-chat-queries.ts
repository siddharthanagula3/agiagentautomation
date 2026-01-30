/**
 * Chat React Query Hooks
 * Server state management for chat sessions and messages using React Query
 *
 * @module features/chat/hooks/use-chat-queries
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
  type QueryClient,
} from '@tanstack/react-query';
import { queryKeys } from '@shared/stores/query-client';
import { supabase } from '@shared/lib/supabase-client';
import {
  chatPersistenceService,
  type PaginatedResponse,
} from '../services/conversation-storage';
import type { ChatSession, ChatMessage } from '../types';
import { toast } from 'sonner';
import { logger } from '@shared/lib/logger';
import type { User } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Session creation parameters
 */
export interface CreateSessionParams {
  title?: string;
  metadata?: {
    employeeId?: string;
    role?: string;
    provider?: string;
  };
}

/**
 * Session rename parameters
 */
export interface RenameSessionParams {
  sessionId: string;
  newTitle: string;
}

/**
 * Session toggle parameters (star, pin, archive)
 */
export interface ToggleSessionParams {
  sessionId: string;
  isStarred?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
}

/**
 * Message save parameters
 */
export interface SaveMessageParams {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Message update parameters
 */
export interface UpdateMessageParams {
  messageId: string;
  newContent: string;
  sessionId: string;
}

/**
 * Message delete parameters
 */
export interface DeleteMessageParams {
  messageId: string;
  sessionId: string;
}

/**
 * Internal success result with user context
 */
interface SessionMutationResult {
  sessionId: string;
  userId: string;
}

/**
 * Optimistic update context for session mutations
 */
interface SessionMutationContext {
  previousSessions: ChatSession[] | undefined;
  userId: string;
}

/**
 * Optimistic update context for message mutations
 */
interface MessageMutationContext {
  previousMessages: ChatMessage[] | undefined;
  sessionId: string;
}

/**
 * Share session result
 */
interface ShareSessionResult extends SessionMutationResult {
  shareLink: string;
}

/**
 * Duplicate session result
 */
interface DuplicateSessionResult {
  newSession: ChatSession;
  userId: string;
}

/**
 * Hook to get current authenticated user
 */
async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Fetch all chat sessions for a user
 * Message counts are now included in a single query (no N+1 pattern)
 *
 * @param userId - The user ID to fetch sessions for
 * @returns UseQueryResult with array of ChatSession
 */
export function useChatSessions(
  userId: string | undefined
): UseQueryResult<ChatSession[], Error> {
  return useQuery<ChatSession[], Error>({
    queryKey: queryKeys.chat.sessions(userId ?? ''),
    queryFn: async (): Promise<ChatSession[]> => {
      if (!userId) return [];

      // getUserSessions now returns sessions with message counts included
      // via Supabase nested select (single query, no N+1 pattern)
      const sessions = await chatPersistenceService.getUserSessions(userId);

      // Sort by updatedAt (most recent first)
      // Note: Sessions are already ordered by the database, but we ensure client-side consistency
      return sessions.sort((a, b) => {
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
    meta: {
      errorMessage: 'Failed to load chat sessions',
    },
  });
}

/**
 * Fetch a single chat session
 *
 * @param sessionId - The session ID to fetch
 * @returns UseQueryResult with ChatSession or null
 */
export function useChatSession(
  sessionId: string | undefined
): UseQueryResult<ChatSession | null, Error> {
  return useQuery<ChatSession | null, Error>({
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
    meta: {
      errorMessage: 'Failed to load chat session',
    },
  });
}

/**
 * Fetch messages for a chat session
 *
 * @param sessionId - The session ID to fetch messages for
 * @returns UseQueryResult with array of ChatMessage
 */
export function useChatMessages(
  sessionId: string | undefined
): UseQueryResult<ChatMessage[], Error> {
  return useQuery<ChatMessage[], Error>({
    queryKey: queryKeys.chat.messages(sessionId ?? ''),
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!sessionId) return [];
      return chatPersistenceService.getSessionMessages(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds - messages update frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Failed to load chat messages',
    },
  });
}

/**
 * Create a new chat session with optimistic update
 *
 * @returns UseMutationResult for creating a chat session
 */
export function useCreateChatSession(): UseMutationResult<
  ChatSession,
  Error,
  CreateSessionParams,
  SessionMutationContext
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<ChatSession, Error, CreateSessionParams, SessionMutationContext>({
    mutationFn: async ({
      title = 'New Chat',
      metadata,
    }: CreateSessionParams): Promise<ChatSession> => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to create a chat');
      }

      return chatPersistenceService.createSession(user.id, title, metadata);
    },
    onMutate: async ({
      title = 'New Chat',
      metadata,
    }: CreateSessionParams): Promise<SessionMutationContext> => {
      const user = await getCurrentUser();
      if (!user) {
        return { previousSessions: undefined, userId: '' };
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.sessions(user.id) });

      // Snapshot previous value
      const previousSessions = queryClient.getQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id)
      );

      // Create optimistic session with temporary ID
      const optimisticSession: ChatSession = {
        id: `temp-${Date.now()}`,
        userId: user.id,
        title,
        createdAt: new Date(),
        updatedAt: new Date(),
        isStarred: false,
        isPinned: false,
        isArchived: false,
        messageCount: 0,
        metadata: metadata || {},
      };

      // Optimistically add to cache
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id),
        (old) => (old ? [optimisticSession, ...old] : [optimisticSession])
      );

      return { previousSessions, userId: user.id };
    },
    onSuccess: (newSession: ChatSession, _variables, context): void => {
      if (context?.userId) {
        // Replace optimistic session with real one
        queryClient.setQueryData<ChatSession[]>(
          queryKeys.chat.sessions(context.userId),
          (old) => {
            if (!old) return [newSession];
            // Remove temp session and add real one
            const filtered = old.filter((s) => !s.id.startsWith('temp-'));
            return [newSession, ...filtered];
          }
        );
      }
      toast.success('New chat created');
    },
    onError: (error: Error, _variables, context): void => {
      // Rollback on error
      if (context?.previousSessions !== undefined && context.userId) {
        queryClient.setQueryData(
          queryKeys.chat.sessions(context.userId),
          context.previousSessions
        );
      }
      logger.error('Failed to create session:', error);
      toast.error('Failed to create chat');
    },
    onSettled: async (_data, _error, _variables, context): Promise<void> => {
      // Invalidate to ensure consistency
      if (context?.userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.sessions(context.userId) });
      }
    },
  });
}

/**
 * Rename a chat session with optimistic update
 *
 * @returns UseMutationResult for renaming a chat session
 */
export function useRenameChatSession(): UseMutationResult<
  SessionMutationResult & { newTitle: string },
  Error,
  RenameSessionParams,
  SessionMutationContext & { previousSession: ChatSession | null | undefined }
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<
    SessionMutationResult & { newTitle: string },
    Error,
    RenameSessionParams,
    SessionMutationContext & { previousSession: ChatSession | null | undefined }
  >({
    mutationFn: async ({
      sessionId,
      newTitle,
    }: RenameSessionParams): Promise<SessionMutationResult & { newTitle: string }> => {
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
    onMutate: async ({
      sessionId,
      newTitle,
    }: RenameSessionParams): Promise<SessionMutationContext & { previousSession: ChatSession | null | undefined }> => {
      const user = await getCurrentUser();
      if (!user) {
        return { previousSessions: undefined, previousSession: undefined, userId: '' };
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.sessions(user.id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.session(sessionId) });

      // Snapshot previous values
      const previousSessions = queryClient.getQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id)
      );
      const previousSession = queryClient.getQueryData<ChatSession | null>(
        queryKeys.chat.session(sessionId)
      );

      // Optimistically update sessions list
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id),
        (old) =>
          old?.map((session) =>
            session.id === sessionId
              ? { ...session, title: newTitle, updatedAt: new Date() }
              : session
          )
      );

      // Optimistically update individual session
      queryClient.setQueryData<ChatSession | null>(
        queryKeys.chat.session(sessionId),
        (old) =>
          old ? { ...old, title: newTitle, updatedAt: new Date() } : null
      );

      return { previousSessions, previousSession, userId: user.id };
    },
    onSuccess: (): void => {
      toast.success('Chat renamed');
    },
    onError: (
      error: Error,
      { sessionId },
      context
    ): void => {
      // Rollback on error
      if (context?.previousSessions !== undefined && context.userId) {
        queryClient.setQueryData(
          queryKeys.chat.sessions(context.userId),
          context.previousSessions
        );
      }
      if (context?.previousSession !== undefined) {
        queryClient.setQueryData(
          queryKeys.chat.session(sessionId),
          context.previousSession
        );
      }
      logger.error('Failed to rename session:', error);
      toast.error(error.message || 'Failed to rename chat');
    },
    onSettled: async (_data, _error, { sessionId }, context): Promise<void> => {
      if (context?.userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.sessions(context.userId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.session(sessionId) });
    },
  });
}

/**
 * Delete (archive) a chat session with optimistic update
 *
 * @returns UseMutationResult for deleting a chat session
 */
export function useDeleteChatSession(): UseMutationResult<
  SessionMutationResult,
  Error,
  string,
  SessionMutationContext & { deletedSessionId: string }
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<SessionMutationResult, Error, string, SessionMutationContext & { deletedSessionId: string }>({
    mutationFn: async (sessionId: string): Promise<SessionMutationResult> => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to delete a chat');
      }

      await chatPersistenceService.deleteSession(sessionId, user.id);
      return { sessionId, userId: user.id };
    },
    onMutate: async (sessionId: string): Promise<SessionMutationContext & { deletedSessionId: string }> => {
      const user = await getCurrentUser();
      if (!user) {
        return { previousSessions: undefined, userId: '', deletedSessionId: sessionId };
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.sessions(user.id) });

      // Snapshot previous value
      const previousSessions = queryClient.getQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id)
      );

      // Optimistically remove from cache
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id),
        (old) => old?.filter((session) => session.id !== sessionId)
      );

      return { previousSessions, userId: user.id, deletedSessionId: sessionId };
    },
    onSuccess: ({ sessionId }): void => {
      // Remove individual session and messages cache
      queryClient.removeQueries({
        queryKey: queryKeys.chat.session(sessionId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.chat.messages(sessionId),
      });

      toast.success('Chat deleted');
    },
    onError: (error: Error, _sessionId, context): void => {
      // Rollback on error
      if (context?.previousSessions !== undefined && context.userId) {
        queryClient.setQueryData(
          queryKeys.chat.sessions(context.userId),
          context.previousSessions
        );
      }
      logger.error('Failed to delete session:', error);
      toast.error(error.message || 'Failed to delete chat');
    },
    onSettled: async (_data, _error, _sessionId, context): Promise<void> => {
      if (context?.userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.sessions(context.userId) });
      }
    },
  });
}

/**
 * Toggle star status on a chat session with optimistic update
 *
 * @returns UseMutationResult for toggling star status
 */
export function useToggleStarSession(): UseMutationResult<
  SessionMutationResult & { isStarred: boolean },
  Error,
  { sessionId: string; isStarred: boolean },
  SessionMutationContext
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<
    SessionMutationResult & { isStarred: boolean },
    Error,
    { sessionId: string; isStarred: boolean },
    SessionMutationContext
  >({
    mutationFn: async ({
      sessionId,
      isStarred,
    }: {
      sessionId: string;
      isStarred: boolean;
    }): Promise<SessionMutationResult & { isStarred: boolean }> => {
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
    onMutate: async ({
      sessionId,
      isStarred,
    }: {
      sessionId: string;
      isStarred: boolean;
    }): Promise<SessionMutationContext> => {
      const user = await getCurrentUser();
      if (!user) {
        return { previousSessions: undefined, userId: '' };
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.sessions(user.id) });

      // Snapshot previous value
      const previousSessions = queryClient.getQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id)
      );

      // Optimistic update
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id),
        (old) =>
          old?.map((session) =>
            session.id === sessionId ? { ...session, isStarred } : session
          )
      );

      return { previousSessions, userId: user.id };
    },
    onSuccess: ({
      isStarred,
    }: SessionMutationResult & { isStarred: boolean }): void => {
      toast.success(isStarred ? 'Chat starred' : 'Chat unstarred');
    },
    onError: (error: Error, _variables, context): void => {
      // Rollback on error
      if (context?.previousSessions !== undefined && context.userId) {
        queryClient.setQueryData(
          queryKeys.chat.sessions(context.userId),
          context.previousSessions
        );
      }
      logger.error('Failed to update starred state:', error);
      toast.error('Failed to update starred state');
    },
    onSettled: async (_data, _error, _variables, context): Promise<void> => {
      if (context?.userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.sessions(context.userId) });
      }
    },
  });
}

/**
 * Toggle pin status on a chat session with optimistic update
 *
 * @returns UseMutationResult for toggling pin status
 */
export function useTogglePinSession(): UseMutationResult<
  SessionMutationResult & { isPinned: boolean },
  Error,
  { sessionId: string; isPinned: boolean },
  SessionMutationContext
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<
    SessionMutationResult & { isPinned: boolean },
    Error,
    { sessionId: string; isPinned: boolean },
    SessionMutationContext
  >({
    mutationFn: async ({
      sessionId,
      isPinned,
    }: {
      sessionId: string;
      isPinned: boolean;
    }): Promise<SessionMutationResult & { isPinned: boolean }> => {
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
    onMutate: async ({
      sessionId,
      isPinned,
    }: {
      sessionId: string;
      isPinned: boolean;
    }): Promise<SessionMutationContext> => {
      const user = await getCurrentUser();
      if (!user) {
        return { previousSessions: undefined, userId: '' };
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.sessions(user.id) });

      // Snapshot previous value
      const previousSessions = queryClient.getQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id)
      );

      // Optimistic update
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(user.id),
        (old) =>
          old?.map((session) =>
            session.id === sessionId ? { ...session, isPinned } : session
          )
      );

      return { previousSessions, userId: user.id };
    },
    onSuccess: ({
      isPinned,
    }: SessionMutationResult & { isPinned: boolean }): void => {
      toast.success(isPinned ? 'Chat pinned' : 'Chat unpinned');
    },
    onError: (error: Error, _variables, context): void => {
      // Rollback on error
      if (context?.previousSessions !== undefined && context.userId) {
        queryClient.setQueryData(
          queryKeys.chat.sessions(context.userId),
          context.previousSessions
        );
      }
      logger.error('Failed to update pinned state:', error);
      toast.error('Failed to update pinned state');
    },
    onSettled: async (_data, _error, _variables, context): Promise<void> => {
      if (context?.userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.sessions(context.userId) });
      }
    },
  });
}

/**
 * Toggle archive status on a chat session
 *
 * @returns UseMutationResult for toggling archive status
 */
export function useToggleArchiveSession(): UseMutationResult<
  SessionMutationResult & { isArchived: boolean },
  Error,
  { sessionId: string; isArchived: boolean }
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<
    SessionMutationResult & { isArchived: boolean },
    Error,
    { sessionId: string; isArchived: boolean }
  >({
    mutationFn: async ({
      sessionId,
      isArchived,
    }: {
      sessionId: string;
      isArchived: boolean;
    }): Promise<SessionMutationResult & { isArchived: boolean }> => {
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
    onMutate: async ({
      sessionId,
      isArchived,
    }: {
      sessionId: string;
      isArchived: boolean;
    }): Promise<void> => {
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
    onSuccess: ({
      isArchived,
    }: SessionMutationResult & { isArchived: boolean }): void => {
      toast.success(isArchived ? 'Chat archived' : 'Chat unarchived');
    },
    onError: (error: Error): void => {
      logger.error('Failed to update archived state:', error);
      toast.error('Failed to update archived state');
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.all() });
    },
  });
}

/**
 * Duplicate a chat session
 *
 * @returns UseMutationResult for duplicating a chat session
 */
export function useDuplicateChatSession(): UseMutationResult<
  DuplicateSessionResult,
  Error,
  string
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<DuplicateSessionResult, Error, string>({
    mutationFn: async (sessionId: string): Promise<DuplicateSessionResult> => {
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
    onSuccess: ({ newSession, userId }: DuplicateSessionResult): void => {
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(userId),
        (old) => (old ? [newSession, ...old] : [newSession])
      );
      toast.success('Chat duplicated');
    },
    onError: (error: Error): void => {
      logger.error('Failed to duplicate session:', error);
      toast.error('Failed to duplicate chat');
    },
  });
}

/**
 * Share a chat session
 *
 * @returns UseMutationResult for sharing a chat session
 */
export function useShareChatSession(): UseMutationResult<
  ShareSessionResult,
  Error,
  string
> {
  return useMutation<ShareSessionResult, Error, string>({
    mutationFn: async (sessionId: string): Promise<ShareSessionResult> => {
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
    onSuccess: async ({ shareLink }: ShareSessionResult): Promise<void> => {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard');
    },
    onError: (error: Error): void => {
      logger.error('Failed to share session:', error);
      toast.error('Failed to share chat');
    },
  });
}

/**
 * Search chat sessions
 *
 * @param query - Search query string
 * @returns UseQueryResult with array of matching ChatSession
 */
export function useSearchChatSessions(
  query: string
): UseQueryResult<ChatSession[], Error> {
  return useQuery<ChatSession[], Error>({
    queryKey: queryKeys.chat.search('', query),
    queryFn: async (): Promise<ChatSession[]> => {
      if (!query.trim()) return [];

      const user = await getCurrentUser();
      if (!user) return [];

      return chatPersistenceService.searchSessions(user.id, query);
    },
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000, // 30 seconds
    meta: {
      errorMessage: 'Failed to search chats',
    },
  });
}

/**
 * Save a new message to a session
 *
 * @returns UseMutationResult for saving a message
 */
export function useSaveMessage(): UseMutationResult<
  ChatMessage,
  Error,
  SaveMessageParams
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<ChatMessage, Error, SaveMessageParams>({
    mutationFn: async ({
      sessionId,
      role,
      content,
    }: SaveMessageParams): Promise<ChatMessage> => {
      return chatPersistenceService.saveMessage(sessionId, role, content);
    },
    onSuccess: (newMessage: ChatMessage): void => {
      // Add message to cache
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(newMessage.sessionId ?? ''),
        (old) => (old ? [...old, newMessage] : [newMessage])
      );
    },
    onError: (error: Error): void => {
      logger.error('Failed to save message:', error);
      // Don't show toast for message saves - they happen in the background
    },
  });
}

/**
 * Updated message result with sessionId context
 */
interface UpdatedMessageResult extends ChatMessage {
  sessionId: string;
}

/**
 * Update an existing message
 *
 * @returns UseMutationResult for updating a message
 */
export function useUpdateMessage(): UseMutationResult<
  UpdatedMessageResult,
  Error,
  UpdateMessageParams
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<UpdatedMessageResult, Error, UpdateMessageParams>({
    mutationFn: async ({
      messageId,
      newContent,
      sessionId,
    }: UpdateMessageParams): Promise<UpdatedMessageResult> => {
      const updated = await chatPersistenceService.updateMessage(
        messageId,
        newContent
      );
      return { ...updated, sessionId };
    },
    onSuccess: (updatedMessage: UpdatedMessageResult): void => {
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
    onError: (error: Error): void => {
      logger.error('Failed to update message:', error);
      toast.error(error.message || 'Failed to update message');
    },
  });
}

/**
 * Delete a message
 *
 * @returns UseMutationResult for deleting a message
 */
export function useDeleteMessage(): UseMutationResult<
  DeleteMessageParams,
  Error,
  DeleteMessageParams
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<DeleteMessageParams, Error, DeleteMessageParams>({
    mutationFn: async ({
      messageId,
      sessionId,
    }: DeleteMessageParams): Promise<DeleteMessageParams> => {
      await chatPersistenceService.deleteMessage(messageId);
      return { messageId, sessionId };
    },
    onSuccess: ({ messageId, sessionId }: DeleteMessageParams): void => {
      // Remove message from cache
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(sessionId),
        (old) => old?.filter((msg) => msg.id !== messageId)
      );
      toast.success('Message deleted');
    },
    onError: (error: Error): void => {
      logger.error('Failed to delete message:', error);
      toast.error(error.message || 'Failed to delete message');
    },
  });
}

/**
 * Invalidate all chat queries - useful after major changes
 *
 * @returns Callback function to invalidate all chat queries
 */
export function useInvalidateChatQueries(): () => void {
  const queryClient: QueryClient = useQueryClient();

  return (): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.all() });
  };
}
