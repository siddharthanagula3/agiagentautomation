/**
 * Chat store using Zustand
 * Handles chat conversations, messages, and AI interactions
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { realtimeService } from '../services/realtimeService';

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    cost?: number;
    processingTime?: number;
    temperature?: number;
  };
  toolCalls?: ToolCall[];
  citations?: Citation[];
  attachments?: Attachment[];
  reactions?: MessageReaction[];
  isStreaming?: boolean;
  streamingComplete?: boolean;
  error?: string;
}

export interface ToolCall {
  id: string;
  type: string;
  name: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  snippet?: string;
  timestamp?: Date;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'code';
  size: number;
  url: string;
  mimeType: string;
  uploadedAt: Date;
}

export interface MessageReaction {
  type: 'up' | 'down' | 'helpful' | 'creative' | 'accurate';
  userId: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  summary?: string;
  messages: Message[];
  participants: string[];
  model: string;
  systemPrompt?: string;
  settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    tags: string[];
    starred: boolean;
    pinned: boolean;
    archived: boolean;
  };
}

export interface ChatModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  costPer1KTokens: number;
  features: string[];
  tier: 'free' | 'pro' | 'premium';
  enabled: boolean;
}

export interface ChatState {
  // Conversations
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;

  // UI state
  isLoading: boolean;
  isStreamingResponse: boolean;
  error: string | null;

  // Models and settings
  availableModels: ChatModel[];
  selectedModel: string;
  defaultSettings: Conversation['settings'];

  // Search and filters
  searchQuery: string;
  filterTags: string[];
  showArchived: boolean;

  // Real-time state
  typingIndicator: boolean;
  lastActivity: Date | null;

  // MGX-style interface state
  sidebarOpen: boolean;
  activeEmployees: string[];
  workingProcesses: Record<string, WorkingProcess>;
  currentCheckpoint: string | null;
  checkpointHistory: Checkpoint[];
}

export interface WorkingProcess {
  employeeId: string;
  steps: ProcessStep[];
  currentStep: number;
  status: 'idle' | 'working' | 'completed' | 'error';
  totalSteps: number;
}

export interface ProcessStep {
  id: string;
  description: string;
  type: 'thinking' | 'writing' | 'executing' | 'reading' | 'analyzing';
  details?: string;
  timestamp: Date;
  status: 'pending' | 'active' | 'completed' | 'error';
  filePath?: string;
  command?: string;
  output?: string;
}

export interface Checkpoint {
  id: string;
  sessionId: string;
  messageCount: number;
  timestamp: Date;
  label: string;
}

export interface ChatActions {
  // Conversation management
  createConversation: (title?: string, model?: string) => string;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  duplicateConversation: (id: string) => string;

  // Message management
  addMessage: (
    conversationId: string,
    message: Omit<Message, 'id' | 'timestamp'>
  ) => string;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  reactToMessage: (
    messageId: string,
    reaction: MessageReaction['type']
  ) => void;

  // AI interactions
  sendMessage: (
    conversationId: string,
    content: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ) => Promise<void>;
  regenerateResponse: (messageId: string) => Promise<void>;
  stopGeneration: () => void;

  // Search and filtering
  setSearchQuery: (query: string) => void;
  addFilterTag: (tag: string) => void;
  removeFilterTag: (tag: string) => void;
  clearFilters: () => void;

  // Model management
  setSelectedModel: (modelId: string) => void;
  updateModelSettings: (settings: Partial<Conversation['settings']>) => void;

  // Utility actions
  exportConversation: (
    id: string,
    format: 'json' | 'markdown' | 'txt'
  ) => string;
  importConversations: (data: Conversation[]) => void;
  clearHistory: () => void;
  setError: (error: string | null) => void;

  // Conversation metadata actions
  toggleStarConversation: (id: string) => void;
  togglePinConversation: (id: string) => void;
  toggleArchiveConversation: (id: string) => void;
  addConversationTag: (id: string, tag: string) => void;
  removeConversationTag: (id: string, tag: string) => void;

  // MGX-style interface actions
  toggleSidebar: () => void;
  selectEmployee: (employeeId: string) => void;
  deselectEmployee: (employeeId: string) => void;
  updateWorkingProcess: (employeeId: string, process: WorkingProcess) => void;
  saveCheckpoint: (checkpoint: Checkpoint) => void;
  restoreCheckpoint: (checkpointId: string) => void;
}

export interface ChatStore extends ChatState, ChatActions {}

const DEFAULT_MODELS: ChatModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Most capable model for complex reasoning',
    maxTokens: 8192,
    costPer1KTokens: 0.03,
    features: ['text', 'code', 'analysis'],
    tier: 'pro',
    enabled: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fast and efficient for most tasks',
    maxTokens: 16384,
    costPer1KTokens: 0.00015,
    features: ['text', 'code'],
    tier: 'free',
    enabled: true,
  },
  {
    id: 'claude-3',
    name: 'Claude-3',
    provider: 'Anthropic',
    description: 'Excellent at reasoning and analysis',
    maxTokens: 100000,
    costPer1KTokens: 0.015,
    features: ['text', 'code', 'analysis', 'long-context'],
    tier: 'pro',
    enabled: true,
  },
];

const DEFAULT_SETTINGS: Conversation['settings'] = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
};

const INITIAL_STATE: ChatState = {
  conversations: {},
  activeConversationId: null,
  isLoading: false,
  isStreamingResponse: false,
  error: null,
  availableModels: DEFAULT_MODELS,
  selectedModel: 'gpt-4o-mini',
  defaultSettings: DEFAULT_SETTINGS,
  searchQuery: '',
  filterTags: [],
  showArchived: false,
  typingIndicator: false,
  lastActivity: null,
  // MGX-style interface state
  sidebarOpen: true,
  activeEmployees: [],
  workingProcesses: {},
  currentCheckpoint: null,
  checkpointHistory: [],
};

const enableDevtools = import.meta.env.MODE !== 'production';

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...INITIAL_STATE,

        // Conversation management
        createConversation: (title?: string, model?: string) => {
          const id = crypto.randomUUID();
          const now = new Date();

          set((state) => {
            const conversation: Conversation = {
              id,
              title: title || 'New Conversation',
              messages: [],
              participants: [],
              model: model || state.selectedModel,
              settings: { ...state.defaultSettings },
              metadata: {
                createdAt: now,
                updatedAt: now,
                totalMessages: 0,
                totalTokens: 0,
                totalCost: 0,
                tags: [],
                starred: false,
                pinned: false,
                archived: false,
              },
            };

            state.conversations[id] = conversation;
            state.activeConversationId = id;
          });

          return id;
        },

        updateConversation: (id: string, updates: Partial<Conversation>) =>
          set((state) => {
            if (state.conversations[id]) {
              state.conversations[id] = {
                ...state.conversations[id],
                ...updates,
                metadata: {
                  ...state.conversations[id].metadata,
                  ...updates.metadata,
                  updatedAt: new Date(),
                },
              };
            }
          }),

        deleteConversation: (id: string) =>
          set((state) => {
            delete state.conversations[id];
            if (state.activeConversationId === id) {
              state.activeConversationId = null;
            }
          }),

        setActiveConversation: (id: string | null) =>
          set((state) => {
            state.activeConversationId = id;
            state.lastActivity = new Date();
          }),

        duplicateConversation: (id: string) => {
          const { conversations } = get();
          const original = conversations[id];
          if (!original) return '';

          const newId = crypto.randomUUID();
          set((state) => {
            state.conversations[newId] = {
              ...original,
              id: newId,
              title: `${original.title} (Copy)`,
              metadata: {
                ...original.metadata,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            };
          });

          return newId;
        },

        // Message management
        addMessage: (
          conversationId: string,
          message: Omit<Message, 'id' | 'timestamp'>
        ) => {
          const messageId = crypto.randomUUID();

          set((state) => {
            if (state.conversations[conversationId]) {
              const newMessage: Message = {
                ...message,
                id: messageId,
                timestamp: new Date(),
              };

              state.conversations[conversationId].messages.push(newMessage);
              state.conversations[conversationId].metadata.updatedAt =
                new Date();
              state.conversations[conversationId].metadata.totalMessages += 1;

              if (message.metadata?.tokensUsed) {
                state.conversations[conversationId].metadata.totalTokens +=
                  message.metadata.tokensUsed;
              }

              if (message.metadata?.cost) {
                state.conversations[conversationId].metadata.totalCost +=
                  message.metadata.cost;
              }
            }
          });

          return messageId;
        },

        updateMessage: (messageId: string, updates: Partial<Message>) =>
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
                conversation.metadata.updatedAt = new Date();
                break;
              }
            }
          }),

        deleteMessage: (messageId: string) =>
          set((state) => {
            for (const conversation of Object.values(state.conversations)) {
              const index = conversation.messages.findIndex(
                (m) => m.id === messageId
              );
              if (index !== -1) {
                conversation.messages.splice(index, 1);
                conversation.metadata.updatedAt = new Date();
                conversation.metadata.totalMessages = Math.max(
                  0,
                  conversation.metadata.totalMessages - 1
                );
                break;
              }
            }
          }),

        reactToMessage: (
          messageId: string,
          reactionType: MessageReaction['type']
        ) =>
          set((state) => {
            for (const conversation of Object.values(state.conversations)) {
              const message = conversation.messages.find(
                (m) => m.id === messageId
              );
              if (message) {
                if (!message.reactions) message.reactions = [];

                const existingReaction = message.reactions.find(
                  (r) => r.type === reactionType && r.userId === 'current-user'
                );

                if (existingReaction) {
                  // Remove existing reaction
                  message.reactions = message.reactions.filter(
                    (r) => r !== existingReaction
                  );
                } else {
                  // Add new reaction
                  message.reactions.push({
                    type: reactionType,
                    userId: 'current-user',
                    timestamp: new Date(),
                  });
                }
                break;
              }
            }
          }),

        // AI interactions
        sendMessage: async (
          conversationId: string,
          content: string,
          options = {}
        ) => {
          const { addMessage } = get();

          // Add user message
          const userMessageId = addMessage(conversationId, {
            conversationId,
            role: 'user',
            content,
          });

          set((state) => {
            state.isStreamingResponse = true;
            state.error = null;
          });

          try {
            // Simulate AI response with streaming
            const assistantMessageId = addMessage(conversationId, {
              conversationId,
              role: 'assistant',
              content: '',
              isStreaming: true,
            });

            // Simulate streaming response
            const fullResponse = `Thank you for your message: "${content}". This is a simulated AI response that demonstrates the streaming functionality. The response includes various features like token counting, cost calculation, and processing time tracking.`;

            let currentContent = '';
            const words = fullResponse.split(' ');

            for (let i = 0; i < words.length; i++) {
              // Allow user to stop generation
              if (!get().isStreamingResponse) {
                break;
              }
              await new Promise((resolve) => setTimeout(resolve, 50));
              currentContent += (i > 0 ? ' ' : '') + words[i];

              set((state) => {
                for (const conversation of Object.values(state.conversations)) {
                  const message = conversation.messages.find(
                    (m) => m.id === assistantMessageId
                  );
                  if (message) {
                    message.content = currentContent;
                    break;
                  }
                }
              });
            }

            // Complete or stop the streaming
            set((state) => {
              for (const conversation of Object.values(state.conversations)) {
                const message = conversation.messages.find(
                  (m) => m.id === assistantMessageId
                );
                if (message) {
                  message.isStreaming = false;
                  message.streamingComplete = get().isStreamingResponse;
                  message.metadata = {
                    model: options.model || state.selectedModel,
                    tokensUsed: words.length * 1.3, // Rough estimate
                    cost: (words.length * 1.3 * 0.002) / 1000,
                    processingTime: words.length * 50,
                    temperature:
                      options.temperature || state.defaultSettings.temperature,
                  };
                  break;
                }
              }

              state.isStreamingResponse = false;
            });
          } catch (error) {
            set((state) => {
              state.isStreamingResponse = false;
              state.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to send message';
            });
          }
        },

        regenerateResponse: async (messageId: string) => {
          const { conversations, sendMessage, deleteMessage } = get();

          // Find the conversation and message
          let targetConversation: Conversation | null = null;
          let assistantMessageIndex = -1;

          for (const conversation of Object.values(conversations)) {
            const index = conversation.messages.findIndex(
              (m) => m.id === messageId
            );
            if (index !== -1) {
              targetConversation = conversation;
              assistantMessageIndex = index;
              break;
            }
          }

          if (!targetConversation || assistantMessageIndex === -1) {
            set((state) => {
              state.error = 'Message not found';
            });
            return;
          }

          const assistantMessage =
            targetConversation.messages[assistantMessageIndex];

          // Ensure it's an assistant message
          if (assistantMessage.role !== 'assistant') {
            set((state) => {
              state.error = 'Can only regenerate assistant messages';
            });
            return;
          }

          // Find the preceding user message
          let userMessage: Message | null = null;
          for (let i = assistantMessageIndex - 1; i >= 0; i--) {
            if (targetConversation.messages[i].role === 'user') {
              userMessage = targetConversation.messages[i];
              break;
            }
          }

          if (!userMessage) {
            set((state) => {
              state.error = 'No user message found to regenerate from';
            });
            return;
          }

          // Delete the assistant message
          deleteMessage(messageId);

          // Regenerate by sending the user's original message again
          await sendMessage(
            targetConversation.id,
            userMessage.content,
            assistantMessage.metadata
              ? {
                  model: assistantMessage.metadata.model,
                  temperature: assistantMessage.metadata.temperature,
                }
              : undefined
          );
        },

        stopGeneration: () =>
          set((state) => {
            state.isStreamingResponse = false;
          }),

        // Search and filtering
        setSearchQuery: (query: string) =>
          set((state) => {
            state.searchQuery = query;
          }),

        addFilterTag: (tag: string) =>
          set((state) => {
            if (!state.filterTags.includes(tag)) {
              state.filterTags.push(tag);
            }
          }),

        removeFilterTag: (tag: string) =>
          set((state) => {
            state.filterTags = state.filterTags.filter((t) => t !== tag);
          }),

        clearFilters: () =>
          set((state) => {
            state.searchQuery = '';
            state.filterTags = [];
          }),

        // Model management
        setSelectedModel: (modelId: string) =>
          set((state) => {
            state.selectedModel = modelId;
          }),

        updateModelSettings: (settings: Partial<Conversation['settings']>) =>
          set((state) => {
            state.defaultSettings = { ...state.defaultSettings, ...settings };
          }),

        // Utility actions
        exportConversation: (
          id: string,
          format: 'json' | 'markdown' | 'txt'
        ) => {
          const { conversations } = get();
          const conversation = conversations[id];
          if (!conversation) return '';

          switch (format) {
            case 'json':
              return JSON.stringify(conversation, null, 2);
            case 'markdown': {
              let markdown = `# ${conversation.title}\n\n`;
              conversation.messages.forEach((message) => {
                markdown += `## ${message.role.charAt(0).toUpperCase() + message.role.slice(1)}\n\n`;
                markdown += `${message.content}\n\n`;
              });
              return markdown;
            }
            case 'txt':
              return conversation.messages
                .map((m) => `${m.role}: ${m.content}`)
                .join('\n\n');
            default:
              return '';
          }
        },

        importConversations: (data: Conversation[]) => {
          if (!Array.isArray(data)) {
            set((state) => {
              state.error =
                'Invalid import data: expected an array of conversations';
            });
            return;
          }

          set((state) => {
            let importedCount = 0;

            for (const conversation of data) {
              // Validate required fields
              if (
                !conversation ||
                typeof conversation.id !== 'string' ||
                typeof conversation.title !== 'string' ||
                !Array.isArray(conversation.messages)
              ) {
                continue;
              }

              // Check for duplicate by ID - skip if already exists
              if (state.conversations[conversation.id]) {
                continue;
              }

              // Ensure all required fields have valid values
              const validatedConversation: Conversation = {
                id: conversation.id,
                title: conversation.title || 'Imported Conversation',
                summary: conversation.summary,
                messages: conversation.messages.map((msg) => ({
                  id: msg.id || crypto.randomUUID(),
                  conversationId: conversation.id,
                  role: msg.role || 'user',
                  content: msg.content || '',
                  timestamp: msg.timestamp
                    ? new Date(msg.timestamp)
                    : new Date(),
                  metadata: msg.metadata,
                  toolCalls: msg.toolCalls,
                  citations: msg.citations,
                  attachments: msg.attachments,
                  reactions: msg.reactions,
                  isStreaming: false,
                  streamingComplete: true,
                  error: msg.error,
                })),
                participants: conversation.participants || [],
                model: conversation.model || state.selectedModel,
                systemPrompt: conversation.systemPrompt,
                settings: {
                  temperature:
                    conversation.settings?.temperature ??
                    state.defaultSettings.temperature,
                  maxTokens:
                    conversation.settings?.maxTokens ??
                    state.defaultSettings.maxTokens,
                  topP:
                    conversation.settings?.topP ?? state.defaultSettings.topP,
                  frequencyPenalty:
                    conversation.settings?.frequencyPenalty ??
                    state.defaultSettings.frequencyPenalty,
                  presencePenalty:
                    conversation.settings?.presencePenalty ??
                    state.defaultSettings.presencePenalty,
                },
                metadata: {
                  createdAt: conversation.metadata?.createdAt
                    ? new Date(conversation.metadata.createdAt)
                    : new Date(),
                  updatedAt: new Date(),
                  totalMessages:
                    conversation.metadata?.totalMessages ??
                    conversation.messages.length,
                  totalTokens: conversation.metadata?.totalTokens ?? 0,
                  totalCost: conversation.metadata?.totalCost ?? 0,
                  tags: conversation.metadata?.tags || [],
                  starred: conversation.metadata?.starred ?? false,
                  pinned: conversation.metadata?.pinned ?? false,
                  archived: conversation.metadata?.archived ?? false,
                },
              };

              state.conversations[validatedConversation.id] =
                validatedConversation;
              importedCount++;
            }

            // Clear any previous error on successful import
            if (importedCount > 0) {
              state.error = null;
            }
          });
        },

        clearHistory: () =>
          set((state) => {
            state.conversations = {};
            state.activeConversationId = null;
          }),

        setError: (error: string | null) =>
          set((state) => {
            state.error = error;
          }),

        // Conversation metadata actions
        toggleStarConversation: (id: string) =>
          set((state) => {
            if (state.conversations[id]) {
              state.conversations[id].metadata.starred =
                !state.conversations[id].metadata.starred;
              state.conversations[id].metadata.updatedAt = new Date();
            }
          }),

        togglePinConversation: (id: string) =>
          set((state) => {
            if (state.conversations[id]) {
              state.conversations[id].metadata.pinned =
                !state.conversations[id].metadata.pinned;
              state.conversations[id].metadata.updatedAt = new Date();
            }
          }),

        toggleArchiveConversation: (id: string) =>
          set((state) => {
            if (state.conversations[id]) {
              state.conversations[id].metadata.archived =
                !state.conversations[id].metadata.archived;
              state.conversations[id].metadata.updatedAt = new Date();
            }
          }),

        addConversationTag: (id: string, tag: string) =>
          set((state) => {
            if (
              state.conversations[id] &&
              !state.conversations[id].metadata.tags.includes(tag)
            ) {
              state.conversations[id].metadata.tags.push(tag);
              state.conversations[id].metadata.updatedAt = new Date();
            }
          }),

        removeConversationTag: (id: string, tag: string) =>
          set((state) => {
            if (state.conversations[id]) {
              state.conversations[id].metadata.tags = state.conversations[
                id
              ].metadata.tags.filter((t) => t !== tag);
              state.conversations[id].metadata.updatedAt = new Date();
            }
          }),

        // MGX-style interface actions
        toggleSidebar: () =>
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          }),

        selectEmployee: (employeeId: string) =>
          set((state) => {
            if (!state.activeEmployees.includes(employeeId)) {
              state.activeEmployees.push(employeeId);
            }
          }),

        deselectEmployee: (employeeId: string) =>
          set((state) => {
            state.activeEmployees = state.activeEmployees.filter(
              (id) => id !== employeeId
            );
          }),

        updateWorkingProcess: (employeeId: string, process: WorkingProcess) =>
          set((state) => {
            state.workingProcesses[employeeId] = process;
          }),

        saveCheckpoint: (checkpoint: Checkpoint) =>
          set((state) => {
            state.checkpointHistory.push(checkpoint);
            state.currentCheckpoint = checkpoint.id;
          }),

        restoreCheckpoint: (checkpointId: string) =>
          set((state) => {
            const checkpoint = state.checkpointHistory.find(
              (cp) => cp.id === checkpointId
            );
            if (checkpoint) {
              state.currentCheckpoint = checkpointId;
              // Additional logic to restore conversation state would go here
            }
          }),
      })),
      {
        name: 'agi-chat-store',
        version: 1,
        partialize: (state) => ({
          conversations: state.conversations,
          selectedModel: state.selectedModel,
          defaultSettings: state.defaultSettings,
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
                  // Rehydrate conversation metadata dates
                  if (conv.metadata) {
                    if (conv.metadata.createdAt) {
                      conv.metadata.createdAt = new Date(
                        conv.metadata.createdAt
                      );
                    }
                    if (conv.metadata.updatedAt) {
                      conv.metadata.updatedAt = new Date(
                        conv.metadata.updatedAt
                      );
                    }
                  }
                  // Rehydrate message timestamps
                  if (conv.messages && Array.isArray(conv.messages)) {
                    for (const msg of conv.messages) {
                      if (msg.timestamp) {
                        msg.timestamp = new Date(msg.timestamp);
                      }
                      // Also handle uploadedAt in attachments
                      if (msg.attachments && Array.isArray(msg.attachments)) {
                        for (const att of msg.attachments) {
                          if (att.uploadedAt) {
                            att.uploadedAt = new Date(att.uploadedAt);
                          }
                        }
                      }
                      // Handle citation timestamps
                      if (msg.citations && Array.isArray(msg.citations)) {
                        for (const cit of msg.citations) {
                          if (cit.timestamp) {
                            cit.timestamp = new Date(cit.timestamp);
                          }
                        }
                      }
                      // Handle reaction timestamps
                      if (msg.reactions && Array.isArray(msg.reactions)) {
                        for (const react of msg.reactions) {
                          if (react.timestamp) {
                            react.timestamp = new Date(react.timestamp);
                          }
                        }
                      }
                    }
                  }
                }
              }
              // Rehydrate lastActivity
              if (data.state?.lastActivity) {
                data.state.lastActivity = new Date(data.state.lastActivity);
              }
              // Rehydrate checkpoint timestamps
              if (
                data.state?.checkpointHistory &&
                Array.isArray(data.state.checkpointHistory)
              ) {
                for (const cp of data.state.checkpointHistory) {
                  if (cp.timestamp) {
                    cp.timestamp = new Date(cp.timestamp);
                  }
                }
              }
              // Rehydrate working process step timestamps
              if (data.state?.workingProcesses) {
                for (const procId of Object.keys(data.state.workingProcesses)) {
                  const proc = data.state.workingProcesses[procId];
                  if (proc.steps && Array.isArray(proc.steps)) {
                    for (const step of proc.steps) {
                      if (step.timestamp) {
                        step.timestamp = new Date(step.timestamp);
                      }
                    }
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
    {
      name: 'Chat Store',
      enabled: enableDevtools,
    }
  )
);

// ============================================================================
// SELECTOR HOOKS (optimized with useShallow to prevent stale closures)
// ============================================================================

/**
 * Selector for conversations - returns stable reference to conversations record
 */
export const useConversationsRecord = () =>
  useChatStore((state) => state.conversations);

/**
 * Selector for active conversation - returns stable reference when conversation hasn't changed
 */
export const useActiveChatConversation = () =>
  useChatStore((state) =>
    state.activeConversationId
      ? state.conversations[state.activeConversationId]
      : null
  );

/**
 * Selector for active conversation ID - primitive value, no shallow needed
 */
export const useActiveChatConversationId = () =>
  useChatStore((state) => state.activeConversationId);

/**
 * Selector for streaming state - uses useShallow for multi-value selection
 */
export const useChatStreamingState = () =>
  useChatStore(
    useShallow((state) => ({
      isLoading: state.isLoading,
      isStreamingResponse: state.isStreamingResponse,
      error: state.error,
    }))
  );

/**
 * Selector for selected model - primitive value
 */
export const useSelectedChatModel = () =>
  useChatStore((state) => state.selectedModel);

/**
 * Selector for available models - returns stable reference
 */
export const useAvailableChatModels = () =>
  useChatStore((state) => state.availableModels);

/**
 * Selector for search and filter state - uses useShallow for multi-value selection
 */
export const useChatSearchAndFilters = () =>
  useChatStore(
    useShallow((state) => ({
      searchQuery: state.searchQuery,
      filterTags: state.filterTags,
      showArchived: state.showArchived,
    }))
  );

/**
 * Selector for MGX-style working processes - returns stable reference
 */
export const useWorkingProcesses = () =>
  useChatStore((state) => state.workingProcesses);

/**
 * Selector for active employees in chat - returns stable reference
 */
export const useChatActiveEmployees = () =>
  useChatStore((state) => state.activeEmployees);

/**
 * Selector for checkpoint state - uses useShallow for multi-value selection
 */
export const useCheckpointState = () =>
  useChatStore(
    useShallow((state) => ({
      currentCheckpoint: state.currentCheckpoint,
      checkpointHistory: state.checkpointHistory,
    }))
  );

/**
 * Selector for sidebar state - primitive value
 */
export const useChatSidebarOpen = () =>
  useChatStore((state) => state.sidebarOpen);
