/**
 * Vibe Chat Hook
 * Main hook integrating all VIBE chat functionality
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useVibeChatStore } from '../stores/vibe-chat-store';
import { useVibeAgentStore } from '../stores/vibe-agent-store';
import { useVibeFileStore } from '../stores/vibe-file-store';
import { useStreamingResponse } from './use-streaming-response';
import { useAgentSelection } from './use-agent-selection';
import { useFileUpload } from './use-file-upload';
import type { AIEmployee } from '@core/types/ai-employee';
import type { VibeMessage } from '../types';

export interface SendMessageOptions {
  files?: string[]; // File IDs to attach
  agentOverride?: string; // Manual agent selection
  streaming?: boolean; // Enable streaming response
}

export interface UseVibeChatOptions {
  employees: AIEmployee[];
  sessionId?: string;
  enableAutoSave?: boolean;
}

export interface UseVibeChatReturn {
  // State
  messages: VibeMessage[];
  input: string;
  isLoading: boolean;
  currentAgent: AIEmployee | null;
  activeAgents: AIEmployee[];
  error: string | null;

  // Message actions
  sendMessage: (message: string, options?: SendMessageOptions) => Promise<void>;
  regenerateLastMessage: () => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;

  // Input actions
  setInput: (value: string) => void;
  clearInput: () => void;

  // Session actions
  createNewSession: () => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  clearMessages: () => void;

  // Utilities
  exportChat: () => string;
  getMessageCount: () => number;
  isAgentActive: (agentName: string) => boolean;
}

/**
 * Main hook for VIBE chat interface
 *
 * Integrates all chat functionality:
 * - Message sending and receiving
 * - Agent selection and routing
 * - File attachments
 * - Streaming responses
 * - Session management
 *
 * @example
 * ```tsx
 * const {
 *   messages,
 *   input,
 *   setInput,
 *   sendMessage,
 *   isLoading
 * } = useVibeChat({ employees: hiredEmployees });
 *
 * const handleSend = async () => {
 *   await sendMessage(input, { streaming: true });
 * };
 * ```
 */
export function useVibeChat(options: UseVibeChatOptions): UseVibeChatReturn {
  const {
    employees,
    sessionId: initialSessionId,
    enableAutoSave = true,
  } = options;

  // Chat store
  const {
    messages,
    input,
    isLoading,
    currentSessionId,
    setInput: setInputInStore,
    addMessage,
    updateMessage,
    resetInput,
    setLoading,
    createNewSession,
    loadSession: loadSessionInStore,
    clearMessages: clearMessagesInStore,
  } = useVibeChatStore();

  // Agent store
  const {
    primaryAgent,
    activeAgents: activeAgentsMap,
    addActiveAgent,
  } = useVibeAgentStore();

  // File store
  const { getSelectedFiles, clearSelection: clearFileSelection } =
    useVibeFileStore();

  // Hooks
  const streaming = useStreamingResponse();
  const agentSelection = useAgentSelection();
  const fileUpload = useFileUpload();

  const [error, setError] = useState<string | null>(null);
  const lastMessageRef = useRef<VibeMessage | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Initialize session
   */
  useEffect(() => {
    const initSession = async () => {
      if (initialSessionId) {
        await loadSessionInStore(initialSessionId);
      } else if (!currentSessionId) {
        await createNewSession('New Vibe Chat');
      }
    };

    initSession();
  }, [
    initialSessionId,
    currentSessionId,
    createNewSession,
    loadSessionInStore,
  ]);

  /**
   * Add employees to active agents on mount
   */
  useEffect(() => {
    employees.forEach((employee) => {
      addActiveAgent(employee);
    });
  }, [employees, addActiveAgent]);

  /**
   * Send a message to the chat
   */
  const sendMessage = useCallback(
    async (message: string, options?: SendMessageOptions) => {
      if (!message.trim()) return;

      try {
        setLoading(true);
        setError(null);

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        // Get selected files if any
        const attachedFiles = options?.files || [];
        const selectedFiles = getSelectedFiles();

        // Add user message
        const userMessage: Omit<VibeMessage, 'id' | 'timestamp'> = {
          session_id: currentSessionId || '',
          role: 'user',
          content: message,
          metadata: {
            files: [...attachedFiles, ...selectedFiles.map((f) => f.id)],
          },
        };

        addMessage(userMessage);
        lastMessageRef.current = null;

        // Clear input
        resetInput();
        clearFileSelection();

        // Select appropriate agent
        let selectedAgent: AIEmployee | null = null;

        if (options?.agentOverride) {
          // Manual agent selection via # syntax
          selectedAgent =
            employees.find((e) => e.name === options.agentOverride) || null;
          if (selectedAgent) {
            agentSelection.selectAgentManually(options.agentOverride);
          }
        } else {
          // Automatic agent selection
          selectedAgent = await agentSelection.selectAgent(message, {
            employees,
            enableComplexityAnalysis: true,
            conversationHistory: messages,
          });
        }

        if (!selectedAgent) {
          throw new Error('No suitable agent found for this request');
        }

        // Create assistant message placeholder
        const assistantMessageId = crypto.randomUUID();
        const assistantMessage: Omit<VibeMessage, 'id' | 'timestamp'> = {
          session_id: currentSessionId || '',
          role: 'assistant',
          content: '',
          employee_id: selectedAgent.name,
          employee_name: selectedAgent.name,
          employee_role: selectedAgent.description,
          is_streaming: options?.streaming ?? true,
        };

        addMessage(assistantMessage);

        // Start streaming if enabled
        if (options?.streaming ?? true) {
          streaming.startStreaming(assistantMessageId, selectedAgent.name);

          // Simulate streaming response (in production, this would be an SSE connection)
          // This is a placeholder - actual implementation would connect to a backend API
          const simulateStreaming = async () => {
            const responseText = `I'm ${selectedAgent.name}. I understand you want me to: ${message}\n\nI'll help you with that.`;
            const words = responseText.split(' ');

            for (let i = 0; i < words.length; i++) {
              if (abortControllerRef.current?.signal.aborted) break;

              const chunk = (i === 0 ? '' : ' ') + words[i];
              streaming.appendContent(chunk);

              // Simulate network delay
              await new Promise((resolve) =>
                setTimeout(resolve, 50 + Math.random() * 100)
              );
            }

            streaming.completeStreaming();
          };

          await simulateStreaming();
        } else {
          // Non-streaming response
          const responseText = `I'm ${selectedAgent.name}. I understand you want me to: ${message}\n\nI'll help you with that.`;

          updateMessage(assistantMessageId, {
            content: responseText,
            is_streaming: false,
          });
        }

        // Store last message for regeneration
        lastMessageRef.current = messages[messages.length - 1];
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        streaming.handleError(errorMessage);
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      currentSessionId,
      employees,
      messages,
      addMessage,
      updateMessage,
      resetInput,
      clearFileSelection,
      getSelectedFiles,
      setLoading,
      agentSelection,
      streaming,
    ]
  );

  /**
   * Regenerate the last assistant message
   */
  const regenerateLastMessage = useCallback(async () => {
    // Find the last user message
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m) => m.role === 'user');

    if (!lastUserMessage) {
      setError('No message to regenerate');
      return;
    }

    // Remove last assistant message if exists
    const lastAssistantIndex = messages
      .slice()
      .reverse()
      .findIndex((m) => m.role === 'assistant');

    if (lastAssistantIndex !== -1) {
      const messageId = messages[messages.length - 1 - lastAssistantIndex].id;
      // In a real implementation, we'd delete from the store
      // For now, just resend
    }

    // Resend the last user message
    await sendMessage(lastUserMessage.content, {
      streaming: true,
    });
  }, [messages, sendMessage]);

  /**
   * Edit a message
   */
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      updateMessage(messageId, { content: newContent });

      // If it's a user message, regenerate response
      const message = messages.find((m) => m.id === messageId);
      if (message?.role === 'user') {
        await sendMessage(newContent);
      }
    },
    [messages, updateMessage, sendMessage]
  );

  /**
   * Delete a message
   */
  const deleteMessage = useCallback(
    (messageId: string) => {
      // In a real implementation, this would remove from store
      // For now, just mark as deleted in metadata
      updateMessage(messageId, {
        metadata: { deleted: true },
      });
    },
    [updateMessage]
  );

  /**
   * Set input value
   */
  const setInput = useCallback(
    (value: string) => {
      setInputInStore(value);
    },
    [setInputInStore]
  );

  /**
   * Clear input
   */
  const clearInput = useCallback(() => {
    resetInput();
  }, [resetInput]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    clearMessagesInStore();
    lastMessageRef.current = null;
  }, [clearMessagesInStore]);

  /**
   * Export chat as JSON
   */
  const exportChat = useCallback((): string => {
    return JSON.stringify(
      {
        sessionId: currentSessionId,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          employee: m.employee_name,
          timestamp: m.timestamp,
        })),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }, [currentSessionId, messages]);

  /**
   * Get message count
   */
  const getMessageCount = useCallback((): number => {
    return messages.length;
  }, [messages]);

  /**
   * Check if agent is active
   */
  const isAgentActive = useCallback(
    (agentName: string): boolean => {
      return activeAgentsMap.has(agentName);
    },
    [activeAgentsMap]
  );

  // Convert active agents Map to array
  const activeAgents = Array.from(activeAgentsMap.values()).map(
    (agent) => agent.employee
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    messages,
    input,
    isLoading,
    currentAgent: primaryAgent?.employee || null,
    activeAgents,
    error,

    // Message actions
    sendMessage,
    regenerateLastMessage,
    editMessage,
    deleteMessage,

    // Input actions
    setInput,
    clearInput,

    // Session actions
    createNewSession,
    loadSession: loadSessionInStore,
    clearMessages,

    // Utilities
    exportChat,
    getMessageCount,
    isAgentActive,
  };
}
