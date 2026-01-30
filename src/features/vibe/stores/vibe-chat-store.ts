/**
 * Vibe Chat Store
 * Central state management for VIBE multi-agent chat interface
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import type { VibeMessage } from '../types';

// ============================================================================
// DEDUPLICATION CONFIGURATION
// ============================================================================

/**
 * Message deduplication configuration
 * Uses a combination of time window and content fingerprinting for robust detection
 */
const DEDUP_CONFIG = {
  /** Time window in milliseconds to check for duplicate messages */
  TIME_WINDOW_MS: 500,
  /** Maximum number of recent fingerprints to keep in memory */
  MAX_FINGERPRINTS: 100,
  /** Time-to-live for fingerprints in milliseconds */
  FINGERPRINT_TTL_MS: 5000,
} as const;

/**
 * Recent message fingerprints for fast duplicate detection
 * Key: fingerprint string (sender + content hash)
 * Value: timestamp when the fingerprint was added
 */
const recentMessageFingerprints: Map<string, number> = new Map();

/**
 * Generates a fingerprint for a message based on sender and content
 * Uses a simple but effective hash to detect duplicates
 */
function generateMessageFingerprint(sender: string, content: string): string {
  // Simple hash function for content (djb2 algorithm variant)
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) ^ content.charCodeAt(i);
  }
  return `${sender}:${hash.toString(36)}`;
}

/**
 * Cleans up expired fingerprints from the cache
 * Called periodically to prevent memory leaks
 */
function cleanupExpiredFingerprints(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, timestamp] of recentMessageFingerprints.entries()) {
    if (now - timestamp > DEDUP_CONFIG.FINGERPRINT_TTL_MS) {
      expiredKeys.push(key);
    }
  }

  for (const key of expiredKeys) {
    recentMessageFingerprints.delete(key);
  }

  // Also enforce max size by removing oldest entries
  if (recentMessageFingerprints.size > DEDUP_CONFIG.MAX_FINGERPRINTS) {
    const sortedEntries = [...recentMessageFingerprints.entries()]
      .sort((a, b) => a[1] - b[1]);
    const toRemove = sortedEntries.slice(0, sortedEntries.length - DEDUP_CONFIG.MAX_FINGERPRINTS);
    for (const [key] of toRemove) {
      recentMessageFingerprints.delete(key);
    }
  }
}

/**
 * Checks if a message is a duplicate based on fingerprint and time window
 * Returns true if the message should be considered a duplicate
 */
function isDuplicateMessage(sender: string, content: string): boolean {
  const fingerprint = generateMessageFingerprint(sender, content);
  const now = Date.now();

  // Check fingerprint cache first (fastest check)
  const existingTimestamp = recentMessageFingerprints.get(fingerprint);
  if (existingTimestamp && now - existingTimestamp < DEDUP_CONFIG.TIME_WINDOW_MS) {
    return true;
  }

  // Not a duplicate - add to cache
  recentMessageFingerprints.set(fingerprint, now);

  // Periodically cleanup (every 10 messages)
  if (recentMessageFingerprints.size % 10 === 0) {
    cleanupExpiredFingerprints();
  }

  return false;
}

/**
 * Clears the fingerprint cache - useful for testing
 * @internal This is exported for testing purposes only
 */
export function clearVibeChatFingerprintCache(): void {
  recentMessageFingerprints.clear();
}

export interface VibeChatState {
  // Session state
  currentSessionId: string | null;
  sessions: Record<string, SessionMetadata>;

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
  updateMessage: (messageId: string, updates: Partial<VibeMessage>) => void;
  startStreamingMessage: (messageId: string, initialContent: string) => void;
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
      sessions: {},
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
          state.sessions[sessionId] = {
            id: sessionId,
            title,
            created_at: now,
            updated_at: now,
            message_count: 0,
          };
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
          delete state.sessions[sessionId];
          if (state.currentSessionId === sessionId) {
            state.currentSessionId = null;
            state.messages = [];
          }
        });
      },

      // Message actions
      addMessage: (message) => {
        // Generate ID before set() but perform atomic duplicate check inside
        const messageId = crypto.randomUUID();

        // First-pass duplicate check using fingerprint cache (fast, outside set())
        // This catches most duplicates without needing to enter the Immer transaction
        if (isDuplicateMessage(message.sender, message.content)) {
          return; // Skip duplicate
        }

        set((state) => {
          // Second-pass duplicate check inside set() for atomic verification
          // Uses expanded time window (500ms) and checks existing messages
          // This handles edge cases where fingerprint cache might have been cleared
          const recentDuplicate = state.messages.find(
            (m) =>
              m.sender === message.sender &&
              m.content === message.content &&
              Date.now() - new Date(m.timestamp).getTime() < DEDUP_CONFIG.TIME_WINDOW_MS
          );
          if (recentDuplicate) {
            return; // Skip duplicate
          }

          const fullMessage: VibeMessage = {
            ...message,
            id: messageId,
            timestamp: new Date(),
          };

          state.messages.push(fullMessage);

          // Update session metadata
          const sessionId = state.currentSessionId;
          if (sessionId) {
            const session = state.sessions[sessionId];
            if (session) {
              session.message_count += 1;
              session.updated_at = new Date();
            }
          }
        });
      },

      updateMessage: (messageId, updates) => {
        set((state) => {
          const messageIndex = state.messages.findIndex(
            (m) => m.id === messageId
          );
          if (messageIndex !== -1) {
            state.messages[messageIndex] = {
              ...state.messages[messageIndex],
              ...updates,
            };
          }
        });
      },

      startStreamingMessage: (messageId, initialContent) => {
        set((state) => {
          // Finish any existing streaming message before starting a new one
          // to prevent orphaned streaming states
          if (
            state.streamingMessageId &&
            state.streamingMessageId !== messageId
          ) {
            const existingMessage = state.messages.find(
              (m) => m.id === state.streamingMessageId
            );
            if (existingMessage) {
              existingMessage.is_streaming = false;
            }
          }

          state.streamingMessageId = messageId;
          const message = state.messages.find((m) => m.id === messageId);
          if (message) {
            message.content = initialContent;
            message.is_streaming = true;
          }
        });
      },

      appendToStreamingMessage: (content) => {
        // All state reads happen inside set() to prevent race conditions
        // where streamingMessageId could change between get() and set()
        set((state) => {
          const { streamingMessageId } = state;
          if (!streamingMessageId) return;

          const message = state.messages.find(
            (m) => m.id === streamingMessageId
          );
          if (message && message.is_streaming) {
            message.content += content;
          }
        });
      },

      finishStreamingMessage: () => {
        // All state reads happen inside set() to prevent race conditions
        set((state) => {
          const { streamingMessageId } = state;
          if (!streamingMessageId) return;

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

// ============================================================================
// SELECTOR HOOKS (optimized with useShallow to prevent stale closures)
// ============================================================================

/**
 * Selector for messages - returns stable reference when messages haven't changed
 */
export const useVibeMessages = () =>
  useVibeChatStore((state) => state.messages);

/**
 * Selector for streaming state - uses useShallow for multi-value selection
 */
export const useVibeStreamingState = () =>
  useVibeChatStore(
    useShallow((state) => ({
      streamingMessageId: state.streamingMessageId,
      isLoading: state.isLoading,
    }))
  );

/**
 * Selector for current streaming message - returns the message being streamed
 */
export const useStreamingMessage = () =>
  useVibeChatStore((state) => {
    const { streamingMessageId, messages } = state;
    if (!streamingMessageId) return null;
    return messages.find((m) => m.id === streamingMessageId) ?? null;
  });

/**
 * Selector for input state - uses useShallow for multi-value selection
 */
export const useVibeInputState = () =>
  useVibeChatStore(
    useShallow((state) => ({
      input: state.input,
      selectedFiles: state.selectedFiles,
      selectedAgent: state.selectedAgent,
      selectedModel: state.selectedModel,
    }))
  );

/**
 * Selector for session state - uses useShallow for multi-value selection
 */
export const useVibeSessionState = () =>
  useVibeChatStore(
    useShallow((state) => ({
      currentSessionId: state.currentSessionId,
      sessions: state.sessions,
    }))
  );

/**
 * Selector for current session ID - primitive value, no shallow needed
 */
export const useCurrentVibeSessionId = () =>
  useVibeChatStore((state) => state.currentSessionId);

/**
 * Selector for current session metadata
 */
export const useCurrentSessionMetadata = () =>
  useVibeChatStore((state) =>
    state.currentSessionId ? state.sessions[state.currentSessionId] : null
  );

/**
 * Selector for loading state - primitive value, no shallow needed
 */
export const useVibeLoading = () =>
  useVibeChatStore((state) => state.isLoading);
