import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@shared/lib/supabase-client';
import { chatPersistenceService } from '../services/conversation-storage';
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

      // Sort sessions by updatedAt (most recent first), ensuring timestamps are valid
      const sortedSessions = sessionsWithCounts.sort((a, b) => {
        const aTime = a.updatedAt instanceof Date 
          ? a.updatedAt.getTime() 
          : new Date(a.updatedAt).getTime();
        const bTime = b.updatedAt instanceof Date 
          ? b.updatedAt.getTime() 
          : new Date(b.updatedAt).getTime();
        
        // Handle invalid dates
        if (isNaN(aTime)) return 1;
        if (isNaN(bTime)) return -1;
        
        return bTime - aTime; // Most recent first
      });

      setSessions(sortedSessions);
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
        const user = await getCurrentUser();
        if (!user) {
          toast.error('You must be logged in to rename a chat');
          return;
        }

        // Pass userId for extra security verification
        await chatPersistenceService.updateSessionTitle(sessionId, newTitle, user.id);

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
        const errorMessage = error instanceof Error ? error.message : 'Failed to rename chat';
        toast.error(errorMessage);
      }
    },
    []
  );

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('You must be logged in to delete a chat');
        return;
      }

      // Pass userId for extra security verification
      await chatPersistenceService.deleteSession(sessionId, user.id);

      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      setCurrentSession((current) =>
        current?.id === sessionId ? null : current
      );

      toast.success('Chat deleted');
    } catch (error) {
      console.error('Failed to delete session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete chat';
      toast.error(errorMessage);
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
      const user = await getCurrentUser();
      if (!user) {
        toast.error('You must be logged in to load a chat');
        return;
      }

      // Pass userId for extra security verification
      const session = await chatPersistenceService.getSession(sessionId, user.id);
      if (session) {
        setCurrentSession(session);
      } else {
        toast.error('Chat not found or access denied');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Failed to load chat');
    }
  }, []);

  // Star/unstar session
  const toggleStarSession = useCallback(async (sessionId: string) => {
    const current = sessions.find((s) => s.id === sessionId);
    
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, isStarred: !session.isStarred }
          : session
      )
    );

    setCurrentSession((currentSession) =>
      currentSession?.id === sessionId
        ? { ...currentSession, isStarred: !currentSession.isStarred }
        : currentSession
    );

    // Persist star state to database
    try {
      const user = await getCurrentUser();
      if (user) {
        await chatPersistenceService.updateSessionStarred(sessionId, !current?.isStarred, user.id);
      }
      toast.success('Chat starred');
    } catch (error) {
      console.error('Failed to update starred state:', error);
      toast.error('Failed to update starred state');
    }
  }, [sessions]);

  // Pin/unpin session
  const togglePinSession = useCallback(async (sessionId: string) => {
    const current = sessions.find((s) => s.id === sessionId);
    
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, isPinned: !session.isPinned }
          : session
      )
    );

    setCurrentSession((currentSession) =>
      currentSession?.id === sessionId
        ? { ...currentSession, isPinned: !currentSession.isPinned }
        : currentSession
    );

    // Persist pin state to database
    try {
      const user = await getCurrentUser();
      if (user) {
        await chatPersistenceService.updateSessionPinned(sessionId, !current?.isPinned, user.id);
      }
      toast.success('Chat pinned');
    } catch (error) {
      console.error('Failed to update pinned state:', error);
      toast.error('Failed to update pinned state');
    }
  }, [sessions]);

  // Archive/unarchive session
  const toggleArchiveSession = useCallback(async (sessionId: string) => {
    const current = sessions.find((s) => s.id === sessionId);
    
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, isArchived: !session.isArchived }
          : session
      )
    );

    setCurrentSession((currentSession) =>
      currentSession?.id === sessionId
        ? { ...currentSession, isArchived: !currentSession.isArchived }
        : currentSession
    );

    // Persist archive state to database
    try {
      const user = await getCurrentUser();
      if (user) {
        await chatPersistenceService.updateSessionArchived(sessionId, !current?.isArchived, user.id);
      }
      toast.success('Chat archived');
    } catch (error) {
      console.error('Failed to update archived state:', error);
      toast.error('Failed to update archived state');
    }
  }, [sessions]);

  // Duplicate session
  const duplicateSession = useCallback(
    async (sessionId: string) => {
      try {
        const original = sessions.find((s) => s.id === sessionId);
        if (!original) return;

        const user = await getCurrentUser();
        if (!user) return;

        const newSession = await chatPersistenceService.createSession(
          user.id,
          `${original.title} (Copy)`
        );

        // Copy messages from original session
        await chatPersistenceService.copySessionMessages(sessionId, newSession.id, user.id);
        setSessions((prev) => [newSession, ...prev]);
        toast.success('Chat duplicated');

        return newSession;
      } catch (error) {
        console.error('Failed to duplicate session:', error);
        toast.error('Failed to duplicate chat');
      }
    },
    [sessions]
  );

  // Share session (generate shareable link)
  const shareSession = useCallback(async (sessionId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('You must be logged in to share a chat');
        return;
      }

      // Generate share token
      const shareToken = `${sessionId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const shareLink = `${window.location.origin}/share/${shareToken}`;

      // Update session with share link
      await chatPersistenceService.updateSessionSharedLink(sessionId, shareToken, user.id);

      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      console.error('Failed to share session:', error);
      toast.error('Failed to share chat');
    }
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
    toggleStarSession,
    togglePinSession,
    toggleArchiveSession,
    duplicateSession,
    shareSession,
  };
};
