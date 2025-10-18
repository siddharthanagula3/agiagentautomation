import { useState, useCallback, useEffect } from 'react';
import type { ChatSession } from '../types';

export const useChatHistory = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load sessions on mount
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implement session loading from database
      setSessions([]);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSession = useCallback((title: string): ChatSession => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      isActive: true,
      metadata: {},
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSession(newSession);
    return newSession;
  }, []);

  const renameSession = useCallback(
    (sessionId: string, newTitle: string) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, title: newTitle, updatedAt: new Date() }
            : session
        )
      );

      if (currentSession?.id === sessionId) {
        setCurrentSession((prev) =>
          prev ? { ...prev, title: newTitle, updatedAt: new Date() } : null
        );
      }
    },
    [currentSession]
  );

  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
    },
    [currentSession]
  );

  const searchSessions = useCallback((query: string) => {
    // TODO: Implement session search
    console.log('Search sessions:', query);
  }, []);

  return {
    sessions,
    currentSession,
    isLoading,
    loadSessions,
    createSession,
    renameSession,
    deleteSession,
    searchSessions,
  };
};
