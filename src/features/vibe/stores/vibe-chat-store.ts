/**
 * Vibe Chat Store
 * Central state management for VIBE multi-agent chat interface
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { VibeMessage } from '../types';

export interface VibeChatState {
  // Session state
  currentSessionId: string | null;
  sessions: Map<string, SessionMetadata>;

  // Messages
  messages: VibeMessage[];
  isLoading: boolean;
  streamingMessageId: string | null;

  // Input state
  input: string;
  selectedFiles: string[];
  selectedAgent: string | null;
  selectedModel: string;

  // Actions
  setCurrentSession: (sessionId: string) => void;
  createNewSession: (title?: string) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;

  // Message actions
  addMessage: (message: Omit<VibeMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (
    messageId: string,
    updates: Partial<VibeMessage>
  ) => void;
  startStreamingMessage: (
    messageId: string,
    initialContent: string
  ) => void;
  appendToStreamingMessage: (content: string) => void;
  finishStreamingMessage: () => void;
  clearMessages: () => void;

  // Input actions
  setInput: (input: string) => void;
  setSelectedFiles: (files: string[]) => void;
  setSelectedAgent: (agentId: string | null) => void;
  setSelectedModel: (model: string) => void;
  resetInput: () => void;

  // Utility
  setLoading: (isLoading: boolean) => void;
}

export interface SessionMetadata {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  message_count: number;
}

export const useVibeChatStore = create<VibeChatState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      currentSessionId: null,
      sessions: new Map(),
      messages: [],
      isLoading: false,
      streamingMessageId: null,
      input: '',
      selectedFiles: [],
      selectedAgent: null,
      selectedModel: 'claude-sonnet-4',

      // Session actions
      setCurrentSession: (sessionId) => {
        set((state) => {
          state.currentSessionId = sessionId;
        });
      },

      createNewSession: async (title = 'New Chat') => {
        const sessionId = crypto.randomUUID();
        const now = new Date();

        set((state) => {
          state.sessions.set(sessionId, {
            id: sessionId,
            title,
            created_at: now,
            updated_at: now,
            message_count: 0,
          });
          state.currentSessionId = sessionId;
          state.messages = [];
        });

        return sessionId;
      },

      loadSession: async (sessionId) => {
        set((state) => {
          state.isLoading = true;
        });

        // In a real implementation, this would fetch from Supabase
        // For now, just switch to the session
        set((state) => {
          state.currentSessionId = sessionId;
          state.isLoading = false;
        });
      },

      deleteSession: async (sessionId) => {
        set((state) => {
          state.sessions.delete(sessionId);
          if (state.currentSessionId === sessionId) {
            state.currentSessionId = null;
            state.messages = [];
          }
        });
      },

      // Message actions
      addMessage: (message) => {
        const fullMessage: VibeMessage = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };

        set((state) => {
          state.messages.push(fullMessage);

          // Update session metadata
          const sessionId = state.currentSessionId;
          if (sessionId) {
            const session = state.sessions.get(sessionId);
            if (session) {
              session.message_count += 1;
              session.updated_at = new Date();
            }
          }
        });
      },

      updateMessage: (messageId, updates) => {
        set((state) => {
          const message = state.messages.find((m) => m.id === messageId);
          if (message) {
            Object.assign(message, updates);
          }
        });
      },

      startStreamingMessage: (messageId, initialContent) => {
        set((state) => {
          state.streamingMessageId = messageId;
          const message = state.messages.find((m) => m.id === messageId);
          if (message) {
            message.content = initialContent;
            message.is_streaming = true;
          }
        });
      },

      appendToStreamingMessage: (content) => {
        const { streamingMessageId } = get();
        if (!streamingMessageId) return;

        set((state) => {
          const message = state.messages.find(
            (m) => m.id === streamingMessageId
          );
          if (message) {
            message.content += content;
          }
        });
      },

      finishStreamingMessage: () => {
        const { streamingMessageId } = get();
        if (!streamingMessageId) return;

        set((state) => {
          const message = state.messages.find(
            (m) => m.id === streamingMessageId
          );
          if (message) {
            message.is_streaming = false;
          }
          state.streamingMessageId = null;
        });
      },

      clearMessages: () => {
        set((state) => {
          state.messages = [];
        });
      },

      // Input actions
      setInput: (input) => {
        set((state) => {
          state.input = input;
        });
      },

      setSelectedFiles: (files) => {
        set((state) => {
          state.selectedFiles = files;
        });
      },

      setSelectedAgent: (agentId) => {
        set((state) => {
          state.selectedAgent = agentId;
        });
      },

      setSelectedModel: (model) => {
        set((state) => {
          state.selectedModel = model;
        });
      },

      resetInput: () => {
        set((state) => {
          state.input = '';
          state.selectedFiles = [];
          state.selectedAgent = null;
        });
      },

      // Utility
      setLoading: (isLoading) => {
        set((state) => {
          state.isLoading = isLoading;
        });
      },
    })),
    { name: 'VibeChatStore' }
  )
);
