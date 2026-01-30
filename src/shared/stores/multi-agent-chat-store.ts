/**
 * Multi-Agent Chat Store - Enhanced Chat State Management
 * Manages active conversations, multi-participant support, and real-time synchronization
 *
 * Features:
 * - Active conversation management with multi-participant support
 * - Real-time message synchronization
 * - Typing indicators per participant
 * - Message delivery status tracking
 * - Conversation metadata and search
 * - Agent presence tracking
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import type {
  MessageDeliveryStatus,
  ParticipantType,
  ToolCall,
  ThinkingStep,
  Attachment,
  MessageReaction,
  TypingIndicator,
} from '@shared/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Re-export canonical types for backward compatibility
 * @deprecated Import directly from @shared/types instead
 */
export type {
  MessageDeliveryStatus,
  ParticipantType,
  ToolCall,
  ThinkingStep,
  Attachment,
  MessageReaction,
  TypingIndicator,
};

/**
 * Conversation participant
 */
export interface ConversationParticipant {
  id: string;
  name: string;
  type: ParticipantType;
  role?: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'idle';
  lastSeen: Date;
  isTyping: boolean;
}

/**
 * Multi-agent chat message - store-specific extension
 * Extends the canonical ChatMessage with multi-agent specific fields
 */
export interface MultiAgentChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: ParticipantType;
  content: string;
  timestamp: Date;
  deliveryStatus: MessageDeliveryStatus;
  readBy: string[]; // IDs of participants who read the message
  replyTo?: string; // ID of message being replied to
  metadata?: {
    model?: string;
    provider?: string;
    tokensUsed?: number;
    cost?: number;
    processingTime?: number;
    toolCalls?: ToolCall[];
    attachments?: Attachment[];
    thinkingProcess?: ThinkingStep[];
  };
  reactions?: MessageReaction[];
  isStreaming?: boolean;
  streamingComplete?: boolean;
  error?: string;
}

/**
 * @deprecated Use MultiAgentChatMessage instead
 */
export type ChatMessage = MultiAgentChatMessage;

/**
 * Multi-participant conversation
 */
export interface MultiAgentConversation {
  id: string;
  title: string;
  description?: string;
  participants: ConversationParticipant[];
  messages: ChatMessage[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  metadata: {
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    tags: string[];
    starred: boolean;
    pinned: boolean;
    archived: boolean;
    muted: boolean;
  };
  settings: {
    model: string;
    provider: string;
    temperature: number;
    maxTokens: number;
    allowMultipleAgents: boolean;
    autoAssignAgents: boolean;
  };
}

/**
 * Agent presence information
 */
export interface AgentPresence {
  agentId: string;
  agentName: string;
  status: 'online' | 'offline' | 'busy' | 'idle';
  lastActivity: Date;
  currentTask?: string;
  capabilities: string[];
}

// ============================================================================
// STATE INTERFACE
// ============================================================================

export interface MultiAgentChatState {
  // Conversations
  conversations: Record<string, MultiAgentConversation>;
  activeConversationId: string | null;

  // Real-time tracking (using Record for Immer compatibility)
  typingIndicators: Record<string, TypingIndicator[]>;
  agentPresence: Record<string, AgentPresence>;

  // Message queue for offline support
  messageQueue: ChatMessage[];

  // UI state
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Search and filters
  searchQuery: string;
  filterTags: string[];
  showArchived: boolean;

  // Sync state
  lastSyncTimestamp: Date | null;
  pendingSyncOperations: number;
  syncConflicts: SyncConflict[];
}

/**
 * Sync conflict information
 */
export interface SyncConflict {
  id: string;
  conversationId: string;
  messageId: string;
  localVersion: ChatMessage;
  remoteVersion: ChatMessage;
  timestamp: Date;
  resolved: boolean;
}

// ============================================================================
// ACTION INTERFACES
// ============================================================================

export interface MultiAgentChatActions {
  // Conversation management
  createConversation: (
    title: string,
    participants: Omit<ConversationParticipant, 'isTyping' | 'lastSeen'>[]
  ) => string;
  updateConversation: (
    id: string,
    updates: Partial<MultiAgentConversation>
  ) => void;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  archiveConversation: (id: string) => void;
  unarchiveConversation: (id: string) => void;

  // Participant management
  addParticipant: (
    conversationId: string,
    participant: Omit<ConversationParticipant, 'isTyping' | 'lastSeen'>
  ) => void;
  removeParticipant: (conversationId: string, participantId: string) => void;
  updateParticipantStatus: (
    conversationId: string,
    participantId: string,
    status: ConversationParticipant['status']
  ) => void;

  // Message management
  addMessage: (
    message: Omit<ChatMessage, 'id' | 'timestamp' | 'deliveryStatus' | 'readBy'>
  ) => string;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  markMessageAsRead: (
    conversationId: string,
    messageId: string,
    userId: string
  ) => void;
  updateMessageDeliveryStatus: (
    conversationId: string,
    messageId: string,
    status: MessageDeliveryStatus
  ) => void;
  addMessageReaction: (
    conversationId: string,
    messageId: string,
    reaction: MessageReaction
  ) => void;

  // Typing indicators
  setTypingIndicator: (
    conversationId: string,
    participantId: string,
    participantName: string,
    isTyping: boolean
  ) => void;
  clearTypingIndicators: (conversationId: string) => void;

  // Agent presence
  updateAgentPresence: (presence: AgentPresence) => void;
  removeAgentPresence: (agentId: string) => void;

  // Message queue (offline support)
  queueMessage: (message: ChatMessage) => void;
  processMessageQueue: () => Promise<void>;
  clearMessageQueue: () => void;

  // Synchronization
  setSyncing: (isSyncing: boolean) => void;
  recordSyncTimestamp: () => void;
  addSyncConflict: (
    conflict: Omit<SyncConflict, 'id' | 'timestamp' | 'resolved'>
  ) => void;
  resolveSyncConflict: (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge'
  ) => void;
  clearResolvedConflicts: () => void;

  // Search and filters
  setSearchQuery: (query: string) => void;
  addFilterTag: (tag: string) => void;
  removeFilterTag: (tag: string) => void;
  clearFilters: () => void;

  // Utility
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// STORE TYPE
// ============================================================================

export type MultiAgentChatStore = MultiAgentChatState & MultiAgentChatActions;

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
 * Key: fingerprint string (senderId + content hash)
 * Value: timestamp when the fingerprint was added
 */
const recentMessageFingerprints: Map<string, number> = new Map();

/**
 * Generates a fingerprint for a message based on sender and content
 * Uses a simple but effective hash to detect duplicates
 */
function generateMessageFingerprint(senderId: string, content: string): string {
  // Simple hash function for content (djb2 algorithm variant)
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) ^ content.charCodeAt(i);
  }
  return `${senderId}:${hash.toString(36)}`;
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
function isDuplicateMessage(senderId: string, content: string): boolean {
  const fingerprint = generateMessageFingerprint(senderId, content);
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
export function clearMessageFingerprintCache(): void {
  recentMessageFingerprints.clear();
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_STATE: MultiAgentChatState = {
  conversations: {},
  activeConversationId: null,
  typingIndicators: {},
  agentPresence: {},
  messageQueue: [],
  isLoading: false,
  isSyncing: false,
  error: null,
  searchQuery: '',
  filterTags: [],
  showArchived: false,
  lastSyncTimestamp: null,
  pendingSyncOperations: 0,
  syncConflicts: [],
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

const enableDevtools = import.meta.env.MODE !== 'production';

export const useMultiAgentChatStore = create<MultiAgentChatStore>()(
  devtools(
    persist(
      immer<MultiAgentChatStore>((set, get) => ({
        ...INITIAL_STATE,

        // ====================================================================
        // CONVERSATION MANAGEMENT
        // ====================================================================

        createConversation: (title, participants) => {
          const id = crypto.randomUUID();
          const now = new Date();

          set((state) => {
            const conversation: MultiAgentConversation = {
              id,
              title,
              participants: participants.map((p) => ({
                ...p,
                isTyping: false,
                lastSeen: now,
              })),
              messages: [],
              createdBy:
                participants.find((p) => p.type === 'user')?.id || 'system',
              createdAt: now,
              updatedAt: now,
              metadata: {
                totalMessages: 0,
                totalTokens: 0,
                totalCost: 0,
                tags: [],
                starred: false,
                pinned: false,
                archived: false,
                muted: false,
              },
              settings: {
                model: 'gpt-4',
                provider: 'openai',
                temperature: 0.7,
                maxTokens: 4096,
                allowMultipleAgents: true,
                autoAssignAgents: true,
              },
            };

            state.conversations[id] = conversation;
            state.activeConversationId = id;
          });

          return id;
        },

        updateConversation: (id, updates) =>
          set((state) => {
            if (state.conversations[id]) {
              state.conversations[id] = {
                ...state.conversations[id],
                ...updates,
                updatedAt: new Date(),
              };
            }
          }),

        deleteConversation: (id) =>
          set((state) => {
            delete state.conversations[id];
            if (state.activeConversationId === id) {
              state.activeConversationId = null;
            }
          }),

        setActiveConversation: (id) =>
          set((state) => {
            state.activeConversationId = id;
          }),

        archiveConversation: (id) =>
          set((state) => {
            const conversation = state.conversations[id];
            if (conversation) {
              conversation.metadata.archived = true;
              conversation.updatedAt = new Date();
            }
          }),

        unarchiveConversation: (id) =>
          set((state) => {
            const conversation = state.conversations[id];
            if (conversation) {
              conversation.metadata.archived = false;
              conversation.updatedAt = new Date();
            }
          }),

        // ====================================================================
        // PARTICIPANT MANAGEMENT
        // ====================================================================

        addParticipant: (conversationId, participant) =>
          set((state) => {
            const conversation = state.conversations[conversationId];
            if (conversation) {
              const exists = conversation.participants.some(
                (p) => p.id === participant.id
              );
              if (!exists) {
                conversation.participants.push({
                  ...participant,
                  isTyping: false,
                  lastSeen: new Date(),
                });
                conversation.updatedAt = new Date();
              }
            }
          }),

        removeParticipant: (conversationId, participantId) =>
          set((state) => {
            const conversation = state.conversations[conversationId];
            if (conversation) {
              conversation.participants = conversation.participants.filter(
                (p) => p.id !== participantId
              );
              conversation.updatedAt = new Date();
            }
          }),

        updateParticipantStatus: (conversationId, participantId, status) =>
          set((state) => {
            const conversation = state.conversations[conversationId];
            if (conversation) {
              const participant = conversation.participants.find(
                (p) => p.id === participantId
              );
              if (participant) {
                participant.status = status;
                participant.lastSeen = new Date();
              }
            }
          }),

        // ====================================================================
        // MESSAGE MANAGEMENT
        // ====================================================================

        addMessage: (message) => {
          // Generate ID before set() for return value, but use atomic check inside
          const messageId = crypto.randomUUID();
          let wasAdded = false;

          // First-pass duplicate check using fingerprint cache (fast, outside set())
          // This catches most duplicates without needing to enter the Immer transaction
          if (isDuplicateMessage(message.senderId, message.content)) {
            return ''; // Skip duplicate
          }

          set((state) => {
            const conversation = state.conversations[message.conversationId];
            if (!conversation) return;

            // Second-pass duplicate check inside set() for atomic verification
            // Uses expanded time window (500ms) and checks existing messages in conversation
            // This handles edge cases where fingerprint cache might have been cleared
            const recentDuplicate = conversation.messages.find(
              (m) =>
                m.senderId === message.senderId &&
                m.content === message.content &&
                Date.now() - new Date(m.timestamp).getTime() < DEDUP_CONFIG.TIME_WINDOW_MS
            );
            if (recentDuplicate) {
              return; // Skip duplicate
            }

            const now = new Date();
            const newMessage: ChatMessage = {
              ...message,
              id: messageId,
              timestamp: now,
              deliveryStatus: 'sent',
              readBy: [message.senderId], // Sender has read their own message
            };

            conversation.messages.push(newMessage);
            conversation.updatedAt = now;
            conversation.lastMessageAt = now;
            conversation.metadata.totalMessages += 1;
            wasAdded = true;

            if (message.metadata?.tokensUsed) {
              conversation.metadata.totalTokens += message.metadata.tokensUsed;
            }
            if (message.metadata?.cost) {
              conversation.metadata.totalCost += message.metadata.cost;
            }
          });

          return wasAdded ? messageId : '';
        },

        updateMessage: (messageId, updates) =>
          set((state) => {
            for (const conversation of Object.values(state.conversations)) {
              const messageIndex = conversation.messages.findIndex(
                (m) => m.id === messageId
              );
              if (messageIndex !== -1) {
                conversation.messages[messageIndex] = {
                  ...conversation.messages[messageIndex],
                  ...updates,
                };
                conversation.updatedAt = new Date();
                break;
              }
            }
          }),

        deleteMessage: (conversationId, messageId) =>
          set((state) => {
            const conversation = state.conversations[conversationId];
            if (conversation) {
              const index = conversation.messages.findIndex(
                (m) => m.id === messageId
              );
              if (index !== -1) {
                conversation.messages.splice(index, 1);
                conversation.metadata.totalMessages = Math.max(
                  0,
                  conversation.metadata.totalMessages - 1
                );
                conversation.updatedAt = new Date();
              }
            }
          }),

        markMessageAsRead: (conversationId, messageId, userId) =>
          set((state) => {
            const conversation = state.conversations[conversationId];
            if (conversation) {
              const message = conversation.messages.find(
                (m) => m.id === messageId
              );
              if (message && !message.readBy.includes(userId)) {
                message.readBy.push(userId);
                message.deliveryStatus = 'read';
              }
            }
          }),

        updateMessageDeliveryStatus: (conversationId, messageId, status) =>
          set((state) => {
            const conversation = state.conversations[conversationId];
            if (conversation) {
              const message = conversation.messages.find(
                (m) => m.id === messageId
              );
              if (message) {
                message.deliveryStatus = status;
              }
            }
          }),

        addMessageReaction: (conversationId, messageId, reaction) =>
          set((state) => {
            const conversation = state.conversations[conversationId];
            if (conversation) {
              const message = conversation.messages.find(
                (m) => m.id === messageId
              );
              if (message) {
                if (!message.reactions) {
                  message.reactions = [];
                }

                // Remove existing reaction of same type by same user
                message.reactions = message.reactions.filter(
                  (r) =>
                    !(r.type === reaction.type && r.userId === reaction.userId)
                );

                // Add new reaction
                message.reactions.push(reaction);
              }
            }
          }),

        // ====================================================================
        // TYPING INDICATORS
        // ====================================================================

        setTypingIndicator: (
          conversationId,
          participantId,
          participantName,
          isTyping
        ) =>
          set((state) => {
            const indicators = state.typingIndicators[conversationId] || [];

            if (isTyping) {
              // Add or update indicator
              const existingIndex = indicators.findIndex(
                (i) => i.participantId === participantId
              );

              if (existingIndex >= 0) {
                indicators[existingIndex].startedAt = new Date();
              } else {
                indicators.push({
                  participantId,
                  participantName,
                  conversationId,
                  startedAt: new Date(),
                });
              }

              // Update participant typing status
              const conversation = state.conversations[conversationId];
              if (conversation) {
                const participant = conversation.participants.find(
                  (p) => p.id === participantId
                );
                if (participant) {
                  participant.isTyping = true;
                }
              }

              state.typingIndicators[conversationId] = indicators;
            } else {
              // Remove indicator
              const filtered = indicators.filter(
                (i) => i.participantId !== participantId
              );
              state.typingIndicators[conversationId] = filtered;

              // Update participant typing status
              const conversation = state.conversations[conversationId];
              if (conversation) {
                const participant = conversation.participants.find(
                  (p) => p.id === participantId
                );
                if (participant) {
                  participant.isTyping = false;
                }
              }
            }
          }),

        clearTypingIndicators: (conversationId) =>
          set((state) => {
            delete state.typingIndicators[conversationId];

            // Clear all participant typing statuses
            const conversation = state.conversations[conversationId];
            if (conversation) {
              conversation.participants.forEach((p) => {
                p.isTyping = false;
              });
            }
          }),

        // ====================================================================
        // AGENT PRESENCE
        // ====================================================================

        updateAgentPresence: (presence) =>
          set((state) => {
            state.agentPresence[presence.agentId] = presence;
          }),

        removeAgentPresence: (agentId) =>
          set((state) => {
            delete state.agentPresence[agentId];
          }),

        // ====================================================================
        // MESSAGE QUEUE (OFFLINE SUPPORT)
        // ====================================================================

        queueMessage: (message) =>
          set((state) => {
            // Prevent duplicate messages in queue by checking ID
            const exists = state.messageQueue.some((m) => m.id === message.id);
            if (!exists) {
              state.messageQueue.push(message);
            }
          }),

        processMessageQueue: async () => {
          const { messageQueue } = get();

          set((state) => {
            state.pendingSyncOperations = messageQueue.length;
          });

          // Process messages sequentially
          for (const message of messageQueue) {
            try {
              // Attempt to send message (implementation depends on your sync service)
              // For now, just mark as delivered
              set((state) => {
                const conversation =
                  state.conversations[message.conversationId];
                if (conversation) {
                  const existingMessage = conversation.messages.find(
                    (m) => m.id === message.id
                  );
                  if (existingMessage) {
                    existingMessage.deliveryStatus = 'delivered';
                  }
                }
                state.pendingSyncOperations = Math.max(
                  0,
                  state.pendingSyncOperations - 1
                );
              });
            } catch (error) {
              console.error('Failed to process queued message:', error);
              set((state) => {
                state.pendingSyncOperations = Math.max(
                  0,
                  state.pendingSyncOperations - 1
                );
              });
            }
          }

          // Clear queue after processing
          set((state) => {
            state.messageQueue = [];
          });
        },

        clearMessageQueue: () =>
          set((state) => {
            state.messageQueue = [];
          }),

        // ====================================================================
        // SYNCHRONIZATION
        // ====================================================================

        setSyncing: (isSyncing) =>
          set((state) => {
            state.isSyncing = isSyncing;
          }),

        recordSyncTimestamp: () =>
          set((state) => {
            state.lastSyncTimestamp = new Date();
          }),

        addSyncConflict: (conflict) =>
          set((state) => {
            state.syncConflicts.push({
              ...conflict,
              id: crypto.randomUUID(),
              timestamp: new Date(),
              resolved: false,
            });
          }),

        resolveSyncConflict: (conflictId, resolution) =>
          set((state) => {
            const conflict = state.syncConflicts.find(
              (c) => c.id === conflictId
            );
            if (conflict) {
              const conversation = state.conversations[conflict.conversationId];
              if (conversation) {
                const messageIndex = conversation.messages.findIndex(
                  (m) => m.id === conflict.messageId
                );

                if (messageIndex >= 0) {
                  if (resolution === 'local') {
                    // Keep local version
                    conversation.messages[messageIndex] = conflict.localVersion;
                  } else if (resolution === 'remote') {
                    // Use remote version
                    conversation.messages[messageIndex] =
                      conflict.remoteVersion;
                  } else if (resolution === 'merge') {
                    // Merge both versions (simple strategy: prefer remote content, keep local metadata)
                    conversation.messages[messageIndex] = {
                      ...conflict.remoteVersion,
                      metadata: {
                        ...conflict.remoteVersion.metadata,
                        ...conflict.localVersion.metadata,
                      },
                    };
                  }
                }
              }

              conflict.resolved = true;
            }
          }),

        clearResolvedConflicts: () =>
          set((state) => {
            state.syncConflicts = state.syncConflicts.filter(
              (c) => !c.resolved
            );
          }),

        // ====================================================================
        // SEARCH AND FILTERS
        // ====================================================================

        setSearchQuery: (query) =>
          set((state) => {
            state.searchQuery = query;
          }),

        addFilterTag: (tag) =>
          set((state) => {
            if (!state.filterTags.includes(tag)) {
              state.filterTags.push(tag);
            }
          }),

        removeFilterTag: (tag) =>
          set((state) => {
            state.filterTags = state.filterTags.filter((t) => t !== tag);
          }),

        clearFilters: () =>
          set((state) => {
            state.searchQuery = '';
            state.filterTags = [];
          }),

        // ====================================================================
        // UTILITY
        // ====================================================================

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        clearError: () =>
          set((state) => {
            state.error = null;
          }),

        reset: () => set(INITIAL_STATE),
      })),
      {
        name: 'multi-agent-chat-store',
        version: 1,
        partialize: (state) => ({
          conversations: state.conversations,
          filterTags: state.filterTags,
          showArchived: state.showArchived,
        }),
        // CRITICAL FIX: Custom storage handlers to properly serialize/deserialize Date objects
        // Without this, Date objects become strings after page refresh, breaking .getTime() calls
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            try {
              const data = JSON.parse(str);

              // Rehydrate Date objects in conversations
              if (data.state?.conversations) {
                for (const convId of Object.keys(data.state.conversations)) {
                  const conv = data.state.conversations[convId];

                  // Rehydrate conversation-level dates
                  if (conv.createdAt) {
                    conv.createdAt = new Date(conv.createdAt);
                  }
                  if (conv.updatedAt) {
                    conv.updatedAt = new Date(conv.updatedAt);
                  }
                  if (conv.lastMessageAt) {
                    conv.lastMessageAt = new Date(conv.lastMessageAt);
                  }

                  // Rehydrate participant dates
                  if (conv.participants && Array.isArray(conv.participants)) {
                    for (const participant of conv.participants) {
                      if (participant.lastSeen) {
                        participant.lastSeen = new Date(participant.lastSeen);
                      }
                    }
                  }

                  // Rehydrate message timestamps and nested dates
                  if (conv.messages && Array.isArray(conv.messages)) {
                    for (const msg of conv.messages) {
                      if (msg.timestamp) {
                        msg.timestamp = new Date(msg.timestamp);
                      }

                      // Handle tool call timestamps
                      if (msg.metadata?.toolCalls && Array.isArray(msg.metadata.toolCalls)) {
                        for (const toolCall of msg.metadata.toolCalls) {
                          if (toolCall.timestamp) {
                            toolCall.timestamp = new Date(toolCall.timestamp);
                          }
                        }
                      }

                      // Handle thinking step timestamps
                      if (msg.metadata?.thinkingProcess && Array.isArray(msg.metadata.thinkingProcess)) {
                        for (const step of msg.metadata.thinkingProcess) {
                          if (step.timestamp) {
                            step.timestamp = new Date(step.timestamp);
                          }
                        }
                      }

                      // Handle attachment uploadedAt dates
                      if (msg.metadata?.attachments && Array.isArray(msg.metadata.attachments)) {
                        for (const att of msg.metadata.attachments) {
                          if (att.uploadedAt) {
                            att.uploadedAt = new Date(att.uploadedAt);
                          }
                        }
                      }

                      // Handle reaction timestamps
                      if (msg.reactions && Array.isArray(msg.reactions)) {
                        for (const reaction of msg.reactions) {
                          if (reaction.timestamp) {
                            reaction.timestamp = new Date(reaction.timestamp);
                          }
                        }
                      }
                    }
                  }
                }
              }

              // Rehydrate lastSyncTimestamp
              if (data.state?.lastSyncTimestamp) {
                data.state.lastSyncTimestamp = new Date(data.state.lastSyncTimestamp);
              }

              // Rehydrate typing indicator timestamps
              if (data.state?.typingIndicators) {
                for (const convId of Object.keys(data.state.typingIndicators)) {
                  const indicators = data.state.typingIndicators[convId];
                  if (Array.isArray(indicators)) {
                    for (const indicator of indicators) {
                      if (indicator.startedAt) {
                        indicator.startedAt = new Date(indicator.startedAt);
                      }
                    }
                  }
                }
              }

              // Rehydrate agent presence dates
              if (data.state?.agentPresence) {
                for (const agentId of Object.keys(data.state.agentPresence)) {
                  const presence = data.state.agentPresence[agentId];
                  if (presence.lastActivity) {
                    presence.lastActivity = new Date(presence.lastActivity);
                  }
                }
              }

              // Rehydrate message queue timestamps
              if (data.state?.messageQueue && Array.isArray(data.state.messageQueue)) {
                for (const msg of data.state.messageQueue) {
                  if (msg.timestamp) {
                    msg.timestamp = new Date(msg.timestamp);
                  }
                }
              }

              // Rehydrate sync conflict timestamps
              if (data.state?.syncConflicts && Array.isArray(data.state.syncConflicts)) {
                for (const conflict of data.state.syncConflicts) {
                  if (conflict.timestamp) {
                    conflict.timestamp = new Date(conflict.timestamp);
                  }
                  // Also rehydrate nested message timestamps
                  if (conflict.localVersion?.timestamp) {
                    conflict.localVersion.timestamp = new Date(conflict.localVersion.timestamp);
                  }
                  if (conflict.remoteVersion?.timestamp) {
                    conflict.remoteVersion.timestamp = new Date(conflict.remoteVersion.timestamp);
                  }
                }
              }

              return data;
            } catch {
              return null;
            }
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      }
    ),
    { name: 'MultiAgentChatStore', enabled: enableDevtools }
  )
);

// ============================================================================
// SELECTOR HOOKS (optimized with useShallow to prevent stale closures)
// ============================================================================

// Empty array constant to avoid creating new references for missing data
const EMPTY_ARRAY: never[] = [];

/**
 * Selector for active conversation - returns stable reference when conversation hasn't changed
 * Uses the conversation object directly from state to maintain referential equality
 */
export const useActiveConversation = () =>
  useMultiAgentChatStore((state) =>
    state.activeConversationId
      ? state.conversations[state.activeConversationId]
      : null
  );

/**
 * Selector for conversation messages - returns stable empty array when conversation doesn't exist
 * The messages array reference is stable because it comes directly from state
 */
export const useConversationMessages = (conversationId: string) =>
  useMultiAgentChatStore(
    (state) => state.conversations[conversationId]?.messages ?? EMPTY_ARRAY
  );

/**
 * Selector for conversation participants - returns stable empty array when conversation doesn't exist
 */
export const useConversationParticipants = (conversationId: string) =>
  useMultiAgentChatStore(
    (state) => state.conversations[conversationId]?.participants ?? EMPTY_ARRAY
  );

/**
 * Selector for typing indicators - returns stable empty array when no indicators exist
 */
export const useTypingIndicators = (conversationId: string) =>
  useMultiAgentChatStore(
    (state) => state.typingIndicators[conversationId] ?? EMPTY_ARRAY
  );

/**
 * Selector for agent presence - returns undefined when agent not found (stable reference)
 */
export const useAgentPresence = (agentId: string) =>
  useMultiAgentChatStore((state) => state.agentPresence[agentId]);

/**
 * Selector for sync state - uses useShallow for multi-value object selection
 */
export const useSyncState = () =>
  useMultiAgentChatStore(
    useShallow((state) => ({
      isSyncing: state.isSyncing,
      lastSyncTimestamp: state.lastSyncTimestamp,
      pendingSyncOperations: state.pendingSyncOperations,
      syncConflicts: state.syncConflicts,
    }))
  );

/**
 * Selector for active conversation ID - primitive value, no shallow needed
 */
export const useActiveConversationId = () =>
  useMultiAgentChatStore((state) => state.activeConversationId);

/**
 * Selector for all conversations - returns stable reference to conversations record
 */
export const useConversations = () =>
  useMultiAgentChatStore((state) => state.conversations);

/**
 * Selector for search and filter state - uses useShallow for multi-value selection
 */
export const useSearchAndFilters = () =>
  useMultiAgentChatStore(
    useShallow((state) => ({
      searchQuery: state.searchQuery,
      filterTags: state.filterTags,
      showArchived: state.showArchived,
    }))
  );

/**
 * Selector for loading and error state - uses useShallow for multi-value selection
 */
export const useChatLoadingState = () =>
  useMultiAgentChatStore(
    useShallow((state) => ({
      isLoading: state.isLoading,
      error: state.error,
    }))
  );
