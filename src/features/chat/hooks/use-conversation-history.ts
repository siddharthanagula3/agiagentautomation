/**
 * useChatHistory Hook
 * Manages chat conversation history with database persistence
 * Updated: Jan 18th 2026 - Migrated to React Query for server state management
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@shared/lib/supabase-client';
import { chatPersistenceService } from '../services/conversation-storage';
import { queryKeys } from '@shared/stores/query-client';
import type { ChatSession } from '../types';
import {
  useChatSessions,
  useCreateChatSession,
  useRenameChatSession,
  useDeleteChatSession,
  useToggleStarSession,
  useTogglePinSession,
  useToggleArchiveSession,
  useDuplicateChatSession,
  useShareChatSession,
} from './use-chat-queries';

// Get current user helper
async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export const useChatHistory = () => {
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Get current user ID synchronously from cache if available
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize userId on first render
  useState(() => {
    getCurrentUser().then((user) => {
      if (user) setUserId(user.id);
    });
  });

  // React Query hooks
  const {
    data: sessions = [],
    isLoading,
    refetch: refetchSessions,
  } = useChatSessions(userId ?? undefined);

  // Mutations
  const createSessionMutation = useCreateChatSession();
  const renameSessionMutation = useRenameChatSession();
  const deleteSessionMutation = useDeleteChatSession();
  const toggleStarMutation = useToggleStarSession();
  const togglePinMutation = useTogglePinSession();
  const toggleArchiveMutation = useToggleArchiveSession();
  const duplicateMutation = useDuplicateChatSession();
  const shareMutation = useShareChatSession();

  // Derive current session from sessions list
  const currentSession =
    sessions.find((s) => s.id === currentSessionId) ?? null;

  // Load sessions - now just refetches the query
  const loadSessions = useCallback(async () => {
    const user = await getCurrentUser();
    if (user) {
      setUserId(user.id);
      await refetchSessions();
    }
  }, [refetchSessions]);

  // Create new session
  const createSession = useCallback(
    async (title: string = 'New Chat') => {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('You must be logged in to create a chat');
        // Return a temporary session for offline use
        const tempSession: ChatSession = {
          id: crypto.randomUUID(),
          title,
          createdAt: new Date(),
          updatedAt: new Date(),
          messageCount: 0,
          tokenCount: 0,
          cost: 0,
          isPinned: false,
          isArchived: false,
          tags: [],
          participants: [],
        };
        setCurrentSessionId(tempSession.id);
        return tempSession;
      }

      try {
        const newSession = await createSessionMutation.mutateAsync({ title });
        setCurrentSessionId(newSession.id);
        return newSession;
      } catch (error) {
        console.error('Failed to create session:', error);
        throw error;
      }
    },
    [createSessionMutation]
  );

  // Rename session
  const renameSession = useCallback(
    async (sessionId: string, newTitle: string) => {
      try {
        await renameSessionMutation.mutateAsync({ sessionId, newTitle });
      } catch (error) {
        console.error('Failed to rename session:', error);
      }
    },
    [renameSessionMutation]
  );

  // Delete session
  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSessionMutation.mutateAsync(sessionId);
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
        }
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    },
    [deleteSessionMutation, currentSessionId]
  );

  // Search sessions
  const searchSessions = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await loadSessions();
        return sessions;
      }

      try {
        const user = await getCurrentUser();
        if (!user) return [];

        const results = await chatPersistenceService.searchSessions(
          user.id,
          query
        );
        return results;
      } catch (error) {
        console.error('Failed to search sessions:', error);
        toast.error('Failed to search chats');
        return [];
      }
    },
    [sessions, loadSessions]
  );

  // Load specific session
  const loadSession = useCallback(
    async (sessionId: string) => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          toast.error('You must be logged in to load a chat');
          return;
        }

        // Check if session exists in cached sessions
        const cachedSession = sessions.find((s) => s.id === sessionId);
        if (cachedSession) {
          setCurrentSessionId(sessionId);
          return;
        }

        // Otherwise fetch from database
        const session = await chatPersistenceService.getSession(
          sessionId,
          user.id
        );
        if (session) {
          setCurrentSessionId(sessionId);
          // Invalidate sessions cache to include this session
          queryClient.invalidateQueries({
            queryKey: queryKeys.chat.sessions(user.id),
          });
        } else {
          toast.error('Chat not found or access denied');
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        toast.error('Failed to load chat');
      }
    },
    [sessions, queryClient]
  );

  // Star/unstar session
  const toggleStarSession = useCallback(
    async (sessionId: string) => {
      const current = sessions.find((s) => s.id === sessionId);
      const newState = !current?.isStarred;

      try {
        await toggleStarMutation.mutateAsync({
          sessionId,
          isStarred: newState,
        });
      } catch (error) {
        console.error('Failed to toggle star:', error);
      }
    },
    [sessions, toggleStarMutation]
  );

  // Pin/unpin session
  const togglePinSession = useCallback(
    async (sessionId: string) => {
      const current = sessions.find((s) => s.id === sessionId);
      const newState = !current?.isPinned;

      try {
        await togglePinMutation.mutateAsync({
          sessionId,
          isPinned: newState,
        });
      } catch (error) {
        console.error('Failed to toggle pin:', error);
      }
    },
    [sessions, togglePinMutation]
  );

  // Archive/unarchive session
  const toggleArchiveSession = useCallback(
    async (sessionId: string) => {
      const current = sessions.find((s) => s.id === sessionId);
      const newState = !current?.isArchived;

      try {
        await toggleArchiveMutation.mutateAsync({
          sessionId,
          isArchived: newState,
        });
      } catch (error) {
        console.error('Failed to toggle archive:', error);
      }
    },
    [sessions, toggleArchiveMutation]
  );

  // Duplicate session
  const duplicateSession = useCallback(
    async (sessionId: string) => {
      try {
        const result = await duplicateMutation.mutateAsync(sessionId);
        return result.newSession;
      } catch (error) {
        console.error('Failed to duplicate session:', error);
      }
    },
    [duplicateMutation]
  );

  // Share session
  const shareSession = useCallback(
    async (sessionId: string) => {
      try {
        await shareMutation.mutateAsync(sessionId);
      } catch (error) {
        console.error('Failed to share session:', error);
      }
    },
    [shareMutation]
  );

  return {
    sessions,
    currentSession,
    isLoading,
    createSession,
    renameSession,
    deleteSession,
    searchSessions,
    loadSessions,
    loadSession,
    toggleStarSession,
    togglePinSession,
    toggleArchiveSession,
    duplicateSession,
    shareSession,
  };
};
