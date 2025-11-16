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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Message delivery status
 */
export type MessageDeliveryStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

/**
 * Participant type in a conversation
 */
export type ParticipantType = 'user' | 'agent' | 'system';

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
 * Enhanced chat message with delivery tracking
 */
export interface ChatMessage {
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
 * Tool call information
 */
export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  timestamp: Date;
}

/**
 * Thinking process step
 */
export interface ThinkingStep {
  id: string;
  step: number;
  description: string;
  reasoning: string;
  timestamp: Date;
  duration?: number;
}

/**
 * Message attachment
 */
export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'code';
  size: number;
  url: string;
  mimeType: string;
  uploadedAt: Date;
}

/**
 * Message reaction
 */
export interface MessageReaction {
  type: 'up' | 'down' | 'helpful' | 'creative' | 'accurate';
  userId: string;
  timestamp: Date;
}

/**
 * Typing indicator
 */
export interface TypingIndicator {
  participantId: string;
  participantName: string;
  conversationId: string;
  startedAt: Date;
}

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

  // Real-time tracking
  typingIndicators: Map<string, TypingIndicator[]>;
  agentPresence: Map<string, AgentPresence>;

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
// INITIAL STATE
// ============================================================================

const INITIAL_STATE: MultiAgentChatState = {
  conversations: {},
  activeConversationId: null,
  typingIndicators: new Map(),
  agentPresence: new Map(),
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
            const conversation = state.conversations[id];
            if (conversation) {
              Object.assign(conversation, updates);
              conversation.updatedAt = new Date();
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
          const messageId = crypto.randomUUID();
          const now = new Date();

          set((state) => {
            const conversation = state.conversations[message.conversationId];
            if (conversation) {
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

              if (message.metadata?.tokensUsed) {
                conversation.metadata.totalTokens +=
                  message.metadata.tokensUsed;
              }
              if (message.metadata?.cost) {
                conversation.metadata.totalCost += message.metadata.cost;
              }
            }
          });

          return messageId;
        },

        updateMessage: (messageId, updates) =>
          set((state) => {
            for (const conversation of Object.values(state.conversations)) {
              const message = conversation.messages.find(
                (m) => m.id === messageId
              );
              if (message) {
                Object.assign(message, updates);
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
            const indicators = state.typingIndicators.get(conversationId) || [];

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
            } else {
              // Remove indicator
              const filtered = indicators.filter(
                (i) => i.participantId !== participantId
              );
              state.typingIndicators.set(conversationId, filtered);

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
              return;
            }

            state.typingIndicators.set(conversationId, indicators);
          }),

        clearTypingIndicators: (conversationId) =>
          set((state) => {
            state.typingIndicators.delete(conversationId);

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
            state.agentPresence.set(presence.agentId, presence);
          }),

        removeAgentPresence: (agentId) =>
          set((state) => {
            state.agentPresence.delete(agentId);
          }),

        // ====================================================================
        // MESSAGE QUEUE (OFFLINE SUPPORT)
        // ====================================================================

        queueMessage: (message) =>
          set((state) => {
            state.messageQueue.push(message);
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
      }
    ),
    { name: 'MultiAgentChatStore' }
  )
);

// ============================================================================
// SELECTOR HOOKS (for optimized re-renders)
// ============================================================================

export const useActiveConversation = () =>
  useMultiAgentChatStore((state) => {
    const { activeConversationId, conversations } = state;
    return activeConversationId ? conversations[activeConversationId] : null;
  });

export const useConversationMessages = (conversationId: string) =>
  useMultiAgentChatStore(
    (state) => state.conversations[conversationId]?.messages || []
  );

export const useConversationParticipants = (conversationId: string) =>
  useMultiAgentChatStore(
    (state) => state.conversations[conversationId]?.participants || []
  );

export const useTypingIndicators = (conversationId: string) =>
  useMultiAgentChatStore(
    (state) => state.typingIndicators.get(conversationId) || []
  );

export const useAgentPresence = (agentId: string) =>
  useMultiAgentChatStore((state) => state.agentPresence.get(agentId));

export const useSyncState = () =>
  useMultiAgentChatStore((state) => ({
    isSyncing: state.isSyncing,
    lastSyncTimestamp: state.lastSyncTimestamp,
    pendingSyncOperations: state.pendingSyncOperations,
    syncConflicts: state.syncConflicts,
  }));
