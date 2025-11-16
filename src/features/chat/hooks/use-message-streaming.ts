/**
 * Message Streaming Hook
 * Manages real-time message streaming and status updates from agents
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMissionStore } from '@shared/stores/mission-control-store';
import type {
  MissionMessage,
  ActiveEmployee,
} from '@shared/stores/mission-control-store';

export interface StreamingState {
  isStreaming: boolean;
  currentMessage: string;
  streamingFrom: string | null;
  progress: number;
  error: string | null;
}

export interface UseMessageStreamingReturn extends StreamingState {
  // Actions
  startStreaming: (agentName: string) => void;
  stopStreaming: () => void;
  appendContent: (content: string) => void;
  completeStreaming: () => void;

  // Utilities
  getAgentProgress: (agentName: string) => number;
  isAgentActive: (agentName: string) => boolean;
  getLastMessageFrom: (agentName: string) => MissionMessage | undefined;
}

/**
 * Hook for managing real-time message streaming
 */
export function useMessageStreaming(): UseMessageStreamingReturn {
  const messages = useMissionStore((state) => state.messages);
  const activeEmployees = useMissionStore((state) => state.activeEmployees);
  const isOrchestrating = useMissionStore((state) => state.isOrchestrating);
  const missionStatus = useMissionStore((state) => state.missionStatus);

  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentMessage: '',
    streamingFrom: null,
    progress: 0,
    error: null,
  });

  const streamingContentRef = useRef('');
  const streamingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Complete streaming callback
  const completeStreaming = useCallback(() => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }

    setStreamingState((prev) => ({
      ...prev,
      isStreaming: false,
      progress: 100,
    }));
  }, []);

  // Monitor streaming state from mission store
  useEffect(() => {
    const isActivelyStreaming =
      isOrchestrating && missionStatus === 'executing';

    if (!isActivelyStreaming && streamingState.isStreaming) {
      // Streaming stopped
      completeStreaming();
    }
  }, [
    isOrchestrating,
    missionStatus,
    streamingState.isStreaming,
    completeStreaming,
  ]);

  // Start streaming callback
  const startStreaming = useCallback((agentName: string) => {
    setStreamingState((prev) => ({
      ...prev,
      isStreaming: true,
      streamingFrom: agentName,
      currentMessage: '',
      progress: 0,
      error: null,
    }));

    streamingContentRef.current = '';

    // Simulate streaming progress
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
    }

    let progress = 0;
    streamingTimerRef.current = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 95) {
        progress = 95; // Cap at 95% until complete
      }

      setStreamingState((prev) => ({
        ...prev,
        progress,
      }));
    }, 500);
  }, []);

  // Monitor active employees for streaming updates
  useEffect(() => {
    let activeStreamingAgent: ActiveEmployee | null = null;

    activeEmployees.forEach((employee) => {
      if (employee.status === 'thinking' || employee.status === 'using_tool') {
        activeStreamingAgent = employee;
      }
    });

    if (activeStreamingAgent && !streamingState.isStreaming) {
      startStreaming(activeStreamingAgent.name);
    }
  }, [activeEmployees, streamingState.isStreaming, startStreaming]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }

    setStreamingState((prev) => ({
      ...prev,
      isStreaming: false,
      progress: 0,
      streamingFrom: null,
    }));

    streamingContentRef.current = '';
  }, []);

  // Append content to streaming message
  const appendContent = useCallback((content: string) => {
    streamingContentRef.current += content;

    setStreamingState((prev) => ({
      ...prev,
      currentMessage: streamingContentRef.current,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
      }
    };
  }, []);

  // Reset after complete - extend completeStreaming with timeout
  useEffect(() => {
    if (!streamingState.isStreaming && streamingState.progress === 100) {
      const timeout = setTimeout(() => {
        setStreamingState((prev) => ({
          ...prev,
          progress: 0,
          streamingFrom: null,
          currentMessage: '',
        }));
        streamingContentRef.current = '';
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [streamingState.isStreaming, streamingState.progress]);

  // Get agent progress
  const getAgentProgress = useCallback(
    (agentName: string): number => {
      const agent = activeEmployees.get(agentName);
      return agent?.progress || 0;
    },
    [activeEmployees]
  );

  // Check if agent is active
  const isAgentActive = useCallback(
    (agentName: string): boolean => {
      const agent = activeEmployees.get(agentName);
      return agent?.status === 'thinking' || agent?.status === 'using_tool';
    },
    [activeEmployees]
  );

  // Get last message from agent
  const getLastMessageFrom = useCallback(
    (agentName: string): MissionMessage | undefined => {
      return messages
        .slice()
        .reverse()
        .find(
          (msg) =>
            msg.from === agentName || msg.metadata?.employeeName === agentName
        );
    },
    [messages]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    ...streamingState,

    // Actions
    startStreaming,
    stopStreaming,
    appendContent,
    completeStreaming,

    // Utilities
    getAgentProgress,
    isAgentActive,
    getLastMessageFrom,
  };
}

/**
 * Hook for monitoring agent activity in real-time
 */
export function useAgentActivity(agentName: string) {
  const activeEmployees = useMissionStore((state) => state.activeEmployees);
  const agent = activeEmployees.get(agentName);

  const [activity, setActivity] = useState({
    isActive: false,
    status: 'idle' as ActiveEmployee['status'],
    currentTask: null as string | null,
    currentTool: null as string | null,
    progress: 0,
    log: [] as string[],
  });

  useEffect(() => {
    if (agent) {
      setActivity({
        isActive: agent.status !== 'idle' && agent.status !== 'error',
        status: agent.status,
        currentTask: agent.currentTask,
        currentTool: agent.currentTool,
        progress: agent.progress,
        log: agent.log,
      });
    } else {
      setActivity({
        isActive: false,
        status: 'idle',
        currentTask: null,
        currentTool: null,
        progress: 0,
        log: [],
      });
    }
  }, [agent]);

  return activity;
}
