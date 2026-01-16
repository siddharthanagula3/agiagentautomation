/**
 * useVibeMessages Hook
 *
 * React hook for managing VIBE messages with real-time updates
 * Provides message CRUD operations and streaming support
 */

import { useState, useEffect, useCallback } from 'react';
import {
  VibeMessageService,
  type VibeMessage,
} from '../services/vibe-message-service';
import { useAuthStore } from '@shared/stores/authentication-store';
import { toast } from 'sonner';

export interface UseVibeMessagesOptions {
  sessionId: string | null;
  autoLoad?: boolean;
}

export interface UseVibeMessagesReturn {
  messages: VibeMessage[];
  isLoading: boolean;
  error: Error | null;
  loadMessages: () => Promise<void>;
  createMessage: (params: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    employeeName?: string;
    employeeRole?: string;
    // Updated: Jan 15th 2026 - Fixed any type
    metadata?: Record<string, unknown>;
  }) => Promise<VibeMessage>;
  clearMessages: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing VIBE messages
 */
export function useVibeMessages(
  options: UseVibeMessagesOptions
): UseVibeMessagesReturn {
  const { sessionId, autoLoad = true } = options;
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<VibeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadMessages = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const loadedMessages = await VibeMessageService.getMessages(sessionId);
      setMessages(loadedMessages);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to load messages');
      setError(error);
      console.error('[useVibeMessages] Load failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const createMessage = useCallback(
    async (params: {
      role: 'user' | 'assistant' | 'system';
      content: string;
      employeeName?: string;
      employeeRole?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!sessionId || !user) {
        throw new Error('Session ID and user required to create message');
      }

      const message = await VibeMessageService.createMessage({
        sessionId,
        userId: user.id,
        ...params,
      });

      // Optimistically add to local state
      setMessages((prev) => [...prev, message]);

      return message;
    },
    [sessionId, user]
  );

  const clearMessages = useCallback(async () => {
    if (!sessionId) return;

    try {
      await VibeMessageService.clearSessionMessages(sessionId);
      setMessages([]);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to clear messages');
      setError(error);
      toast.error(error.message);
    }
  }, [sessionId]);

  const refresh = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  // Auto-load messages on mount
  useEffect(() => {
    if (autoLoad && sessionId) {
      loadMessages();
    }
  }, [autoLoad, sessionId, loadMessages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = VibeMessageService.subscribeToMessages(
      sessionId,
      (newMessage) => {
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some((msg) => msg.id === newMessage.id);
          if (exists) {
            // Update existing message
            return prev.map((msg) =>
              msg.id === newMessage.id ? newMessage : msg
            );
          } else {
            // Add new message
            return [...prev, newMessage];
          }
        });
      },
      (err) => {
        setError(err);
        console.error('[useVibeMessages] Subscription error:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  return {
    messages,
    isLoading,
    error,
    loadMessages,
    createMessage,
    clearMessages,
    refresh,
  };
}
