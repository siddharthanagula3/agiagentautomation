import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@shared/lib/supabase-client';
import { chatPersistenceService } from '../services/chat-persistence.service';
import type { ChatSession } from '../types';

export const useChatHistory = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Get current user
  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  };

  // Load all sessions
  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const loadedSessions = await chatPersistenceService.getUserSessions(
        user.id
      );

      // Get message counts for each session
      const sessionsWithCounts = await Promise.all(
        loadedSessions.map(async (session) => {
          const count = await chatPersistenceService.getMessageCount(
            session.id
          );
          return { ...session, messageCount: count };
        })
      );

      setSessions(sessionsWithCounts);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new session
  const createSession = useCallback(async (title: string = 'New Chat') => {
    try {
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
        setCurrentSession(tempSession);
        return tempSession;
      }

      const newSession = await chatPersistenceService.createSession(
        user.id,
        title
      );

      setSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      toast.success('New chat created');

      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create chat');
      throw error;
    }
  }, []);

  // Rename session
  const renameSession = useCallback(
    async (sessionId: string, newTitle: string) => {
      try {
        await chatPersistenceService.updateSessionTitle(sessionId, newTitle);

        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? { ...session, title: newTitle, updatedAt: new Date() }
              : session
          )
        );

        setCurrentSession((current) =>
          current?.id === sessionId
            ? { ...current, title: newTitle, updatedAt: new Date() }
            : current
        );

        toast.success('Chat renamed');
      } catch (error) {
        console.error('Failed to rename session:', error);
        toast.error('Failed to rename chat');
      }
    },
    []
  );

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await chatPersistenceService.deleteSession(sessionId);

      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      setCurrentSession((current) =>
        current?.id === sessionId ? null : current
      );

      toast.success('Chat deleted');
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete chat');
    }
  }, []);

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
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const session = await chatPersistenceService.getSession(sessionId);
      if (session) {
        setCurrentSession(session);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Failed to load chat');
    }
  }, []);

  // Pin/unpin session
  const togglePinSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, isPinned: !session.isPinned }
          : session
      )
    );

    setCurrentSession((current) =>
      current?.id === sessionId
        ? { ...current, isPinned: !current.isPinned }
        : current
    );

    // TODO: Persist pin state to database
  }, []);

  // Archive/unarchive session
  const toggleArchiveSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, isArchived: !session.isArchived }
          : session
      )
    );

    // TODO: Persist archive state to database
    toast.success('Chat archived');
  }, []);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

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
    togglePinSession,
    toggleArchiveSession,
  };
};
