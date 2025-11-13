/**
 * Multi-Agent Chat Hook
 * Main hook for integrating multi-agent orchestration with chat interface
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useMissionStore } from '@shared/stores/mission-control-store';
import { useChatStore } from '@shared/stores/chat-store';
import { workforceOrchestratorRefactored } from '@core/ai/orchestration/workforce-orchestrator';
import type { AIEmployee } from '@core/types/ai-employee';

export interface MultiAgentChatOptions {
  mode?: 'mission' | 'chat';
  sessionId?: string;
  userId?: string;
  selectedAgents?: string[];
  autoSelectAgent?: boolean;
}

export interface UseMultiAgentChatReturn {
  // State
  messages: Array<{
    type: 'user' | 'employee' | 'system' | 'error';
    content: string;
    timestamp?: Date;
    employee?: string;
    metadata?: Record<string, unknown>;
  }>;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  activeAgents: AIEmployee[];
  currentMode: 'mission' | 'chat';

  // Actions
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
  switchMode: (mode: 'mission' | 'chat') => void;
  selectAgent: (agentName: string) => void;
  deselectAgent: (agentName: string) => void;
  clearMessages: () => void;
  regenerateLastResponse: () => Promise<void>;
}

export interface SendMessageOptions {
  agents?: string[];
  forceMode?: 'mission' | 'chat';
  temperature?: number;
  model?: string;
}

/**
 * Main multi-agent chat hook
 * Integrates workforce orchestrator with chat UI
 */
export function useMultiAgentChat(
  options: MultiAgentChatOptions = {}
): UseMultiAgentChatReturn {
  const {
    mode: initialMode = 'chat',
    sessionId,
    userId,
    selectedAgents = [],
    autoSelectAgent = true,
  } = options;

  // Mission store state
  const missionMode = useMissionStore((state) => state.mode);
  const missionMessages = useMissionStore((state) => state.messages);
  const activeEmployees = useMissionStore((state) => state.activeEmployees);
  const isOrchestrating = useMissionStore((state) => state.isOrchestrating);
  const missionError = useMissionStore((state) => state.error);

  // Mission store actions
  const setMode = useMissionStore((state) => state.setMode);
  const setChatSession = useMissionStore((state) => state.setChatSession);
  const addCollaborativeAgent = useMissionStore((state) => state.addCollaborativeAgent);
  const removeCollaborativeAgent = useMissionStore((state) => state.removeCollaborativeAgent);
  const startMission = useMissionStore((state) => state.startMission);
  const reset = useMissionStore((state) => state.reset);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableAgents, setAvailableAgents] = useState<AIEmployee[]>([]);
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

  // Load available agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        // Ensure employees are loaded
        await workforceOrchestratorRefactored.processRequest({
          userId: userId || 'system',
          input: 'initialize',
          mode: 'chat',
        });

        const agents = workforceOrchestratorRefactored.getAvailableEmployees();
        setAvailableAgents(agents);
      } catch (err) {
        console.error('Failed to load agents:', err);
      }
    };

    loadAgents();
  }, [userId]);

  // Initialize mode and session
  useEffect(() => {
    setMode(initialMode);
    if (sessionId) {
      setChatSession(sessionId);
    }
  }, [initialMode, sessionId, setMode, setChatSession]);

  // Sync mission messages to conversation history
  useEffect(() => {
    const newHistory = missionMessages
      .filter((msg) => msg.type === 'user' || msg.type === 'employee')
      .map((msg) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

    conversationHistoryRef.current = newHistory;
  }, [missionMessages]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, opts: SendMessageOptions = {}) => {
      if (!content.trim()) {
        toast.error('Please enter a message');
        return;
      }

      if (!userId) {
        toast.error('User ID is required');
        return;
      }

      setIsLoading(true);
      setError(null);

      const messageMode = opts.forceMode || missionMode;

      try {
        const response = await workforceOrchestratorRefactored.processRequest({
          userId,
          input: content,
          mode: messageMode,
          sessionId,
          conversationHistory: conversationHistoryRef.current,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to process message');
        }

        // Add user message to conversation history
        conversationHistoryRef.current.push({
          role: 'user',
          content,
        });

        // Add assistant response to conversation history
        if (response.chatResponse) {
          conversationHistoryRef.current.push({
            role: 'assistant',
            content: response.chatResponse,
          });
        }

        toast.success(
          messageMode === 'mission'
            ? 'Mission started successfully'
            : 'Message sent'
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, missionMode, sessionId]
  );

  // Switch mode
  const switchMode = useCallback(
    (newMode: 'mission' | 'chat') => {
      setMode(newMode);
      toast.info(
        newMode === 'mission'
          ? 'Switched to Mission Mode - full orchestration'
          : 'Switched to Chat Mode - conversational'
      );
    },
    [setMode]
  );

  // Select agent for collaboration
  const selectAgent = useCallback(
    (agentName: string) => {
      addCollaborativeAgent(agentName);
      toast.success(`${agentName} added to collaboration`);
    },
    [addCollaborativeAgent]
  );

  // Deselect agent
  const deselectAgent = useCallback(
    (agentName: string) => {
      removeCollaborativeAgent(agentName);
      toast.info(`${agentName} removed from collaboration`);
    },
    [removeCollaborativeAgent]
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    reset();
    conversationHistoryRef.current = [];
    toast.success('Messages cleared');
  }, [reset]);

  // Regenerate last response
  const regenerateLastResponse = useCallback(async () => {
    const history = conversationHistoryRef.current;
    if (history.length < 2) {
      toast.error('No message to regenerate');
      return;
    }

    // Get last user message
    const lastUserMessage = history
      .slice()
      .reverse()
      .find((msg) => msg.role === 'user');

    if (!lastUserMessage) {
      toast.error('No user message found');
      return;
    }

    // Remove last assistant message from history
    conversationHistoryRef.current = history.filter(
      (msg, idx) => idx !== history.length - 1 || msg.role !== 'assistant'
    );

    // Resend
    await sendMessage(lastUserMessage.content);
  }, [sendMessage]);

  // Get active agents from activeEmployees map
  const activeAgentsList = Array.from(activeEmployees.values()).map(
    (employee) => {
      const agentData = availableAgents.find((a) => a.name === employee.name);
      return (
        agentData || {
          name: employee.name,
          description: '',
          tools: [],
          model: 'inherit',
          systemPrompt: '',
        }
      );
    }
  );

  return {
    // State
    messages: missionMessages,
    isLoading: isLoading || isOrchestrating,
    isStreaming: isOrchestrating,
    error: error || missionError,
    activeAgents: activeAgentsList,
    currentMode: missionMode,

    // Actions
    sendMessage,
    switchMode,
    selectAgent,
    deselectAgent,
    clearMessages,
    regenerateLastResponse,
  };
}
