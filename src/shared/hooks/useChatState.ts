/**
 * Chat State Management Hook
 * Centralizes chat state management and provides stable state updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '@shared/stores/unified-auth-store';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: string;
}

export interface ChatTab {
  id: string;
  employeeId: string;
  role: string;
  name: string;
  provider: string;
  messages: ChatMessage[];
  isActive: boolean;
}

export interface ChatState {
  tabs: ChatTab[];
  activeTabId: string | null;
  isSending: boolean;
  error: string | null;
}

export const useChatState = () => {
  const { user } = useAuthStore();
  const [state, setState] = useState<ChatState>({
    tabs: [],
    activeTabId: null,
    isSending: false,
    error: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Update state with error handling
  const updateState = useCallback((updater: (prev: ChatState) => ChatState) => {
    try {
      setState(prev => {
        const newState = updater(prev);
        return newState;
      });
    } catch (error) {
      console.error('Error updating chat state:', error);
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, []);

  // Add a new tab
  const addTab = useCallback(
    (tab: Omit<ChatTab, 'messages' | 'isActive'>) => {
      updateState(prev => {
        const newTab: ChatTab = {
          ...tab,
          messages: [],
          isActive: true,
        };

        // Deactivate other tabs
        const updatedTabs = prev.tabs.map(t => ({ ...t, isActive: false }));

        return {
          ...prev,
          tabs: [...updatedTabs, newTab],
          activeTabId: newTab.id,
          error: null,
        };
      });
    },
    [updateState]
  );

  // Remove a tab
  const removeTab = useCallback(
    (tabId: string) => {
      updateState(prev => {
        const updatedTabs = prev.tabs.filter(t => t.id !== tabId);
        const newActiveTabId =
          updatedTabs.length > 0 ? updatedTabs[0].id : null;

        return {
          ...prev,
          tabs: updatedTabs,
          activeTabId: newActiveTabId,
        };
      });
    },
    [updateState]
  );

  // Set active tab
  const setActiveTab = useCallback(
    (tabId: string) => {
      updateState(prev => ({
        ...prev,
        tabs: prev.tabs.map(t => ({ ...t, isActive: t.id === tabId })),
        activeTabId: tabId,
      }));
    },
    [updateState]
  );

  // Add message to a tab
  const addMessage = useCallback(
    (tabId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      updateState(prev => ({
        ...prev,
        tabs: prev.tabs.map(tab =>
          tab.id === tabId
            ? {
                ...tab,
                messages: [
                  ...tab.messages,
                  {
                    ...message,
                    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date(),
                  },
                ],
              }
            : tab
        ),
      }));
    },
    [updateState]
  );

  // Update message (for streaming)
  const updateMessage = useCallback(
    (tabId: string, messageId: string, updates: Partial<ChatMessage>) => {
      updateState(prev => ({
        ...prev,
        tabs: prev.tabs.map(tab =>
          tab.id === tabId
            ? {
                ...tab,
                messages: tab.messages.map(msg =>
                  msg.id === messageId ? { ...msg, ...updates } : msg
                ),
              }
            : tab
        ),
      }));
    },
    [updateState]
  );

  // Set sending state
  const setSending = useCallback(
    (isSending: boolean) => {
      updateState(prev => ({ ...prev, isSending }));
    },
    [updateState]
  );

  // Set error
  const setError = useCallback(
    (error: string | null) => {
      updateState(prev => ({ ...prev, error }));
    },
    [updateState]
  );

  // Clear error
  const clearError = useCallback(() => {
    updateState(prev => ({ ...prev, error: null }));
  }, [updateState]);

  // Get active tab
  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || null;

  // Get active tab messages
  const activeMessages = activeTab?.messages || [];

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error, clearError]);

  // Show error toasts
  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return {
    // State
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    activeTab,
    activeMessages,
    isSending: state.isSending,
    error: state.error,

    // Actions
    addTab,
    removeTab,
    setActiveTab,
    addMessage,
    updateMessage,
    setSending,
    setError,
    clearError,
  };
};
