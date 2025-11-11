/**
 * Chat store using Zustand
 * Handles chat conversations, messages, and AI interactions
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
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
  workingProcesses: Map<string, WorkingProcess>;
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
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and efficient for most tasks',
    maxTokens: 4096,
    costPer1KTokens: 0.002,
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
  selectedModel: 'gpt-3.5-turbo',
  defaultSettings: DEFAULT_SETTINGS,
  searchQuery: '',
  filterTags: [],
  showArchived: false,
  typingIndicator: false,
  lastActivity: null,
  // MGX-style interface state
  sidebarOpen: true,
  activeEmployees: [],
  workingProcesses: new Map(),
  currentCheckpoint: null,
  checkpointHistory: [],
};

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
              const message = conversation.messages.find(
                (m) => m.id === messageId
              );
              if (message) {
                Object.assign(message, updates);
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
          // Find the message and regenerate the last assistant response
          // Implementation would be similar to sendMessage
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
          // Implementation for importing conversations
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
              state.conversations[id].metadata.tags =
                state.conversations[id].metadata.tags.filter((t) => t !== tag);
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
            state.workingProcesses.set(employeeId, process);
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
      }
    ),
    {
      name: 'Chat Store',
    }
  )
);

// Selectors for optimized re-renders
