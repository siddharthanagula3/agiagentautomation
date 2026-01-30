/**
 * Streaming Response Hook
 * Manages real-time streaming of AI agent responses in VIBE interface
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVibeChatStore } from '../stores/vibe-chat-store';
import { useVibeAgentStore } from '../stores/vibe-agent-store';
import type { AgentStatus } from '../types';

export interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
  streamingMessageId: string | null;
  streamingAgentId: string | null;
  progress: number;
  error: string | null;
}

export interface UseStreamingResponseReturn extends StreamingState {
  // Actions
  startStreaming: (messageId: string, agentId: string) => void;
  stopStreaming: () => void;
  appendContent: (content: string) => void;
  completeStreaming: () => void;
  handleError: (error: string) => void;

  // Utilities
  getStreamingStatus: () => AgentStatus;
  isAgentStreaming: (agentId: string) => boolean;
}

/**
 * Hook for managing real-time streaming responses from AI agents
 *
 * Features:
 * - Start/stop streaming for specific messages
 * - Append content chunks as they arrive
 * - Track streaming progress
 * - Update agent status in real-time
 * - Handle streaming errors
 *
 * @example
 * ```tsx
 * const { isStreaming, appendContent, startStreaming } = useStreamingResponse();
 *
 * // Start streaming when agent begins responding
 * startStreaming(messageId, agentId);
 *
 * // Append chunks as they arrive
 * eventSource.onmessage = (event) => {
 *   appendContent(event.data);
 * };
 * ```
 */
export function useStreamingResponse(): UseStreamingResponseReturn {
  const appendToStreamingMessage = useVibeChatStore(
    (state) => state.appendToStreamingMessage
  );
  const finishStreamingMessage = useVibeChatStore(
    (state) => state.finishStreamingMessage
  );
  const updateMessage = useVibeChatStore((state) => state.updateMessage);
  const updateAgentStatus = useVibeAgentStore(
    (state) => state.updateAgentStatus
  );

  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentContent: '',
    streamingMessageId: null,
    streamingAgentId: null,
    progress: 0,
    error: null,
  });

  const contentBufferRef = useRef('');
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Start streaming for a specific message and agent
   */
  const startStreaming = useCallback(
    (messageId: string, agentId: string) => {
      setStreamingState({
        isStreaming: true,
        currentContent: '',
        streamingMessageId: messageId,
        streamingAgentId: agentId,
        progress: 0,
        error: null,
      });

      contentBufferRef.current = '';

      // Update agent status to 'thinking'
      updateAgentStatus(agentId, 'thinking');

      // Updated: Jan 15th 2026 - Fixed memory leak by properly cleaning up interval timer
      // Simulate progress (optional - can be removed if actual progress available)
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      let progress = 0;
      progressTimerRef.current = setInterval(() => {
        progress += Math.random() * 5;
        if (progress > 95) {
          progress = 95; // Cap at 95% until complete
        }

        setStreamingState((prev) => ({
          ...prev,
          progress,
        }));
      }, 300);
    },
    [updateAgentStatus]
  );

  /**
   * Stop streaming and reset state
   */
  const stopStreaming = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    const { streamingAgentId } = streamingState;

    if (streamingAgentId) {
      updateAgentStatus(streamingAgentId, 'idle');
    }

    setStreamingState({
      isStreaming: false,
      currentContent: '',
      streamingMessageId: null,
      streamingAgentId: null,
      progress: 0,
      error: null,
    });

    contentBufferRef.current = '';
  }, [streamingState, updateAgentStatus]);

  /**
   * Append content chunk to the streaming message
   */
  const appendContent = useCallback(
    (content: string) => {
      contentBufferRef.current += content;

      setStreamingState((prev) => ({
        ...prev,
        currentContent: contentBufferRef.current,
      }));

      // Update the message in the store
      appendToStreamingMessage(content);

      // Update agent status to 'working' if it was 'thinking'
      const { streamingAgentId } = streamingState;
      if (streamingAgentId) {
        updateAgentStatus(streamingAgentId, 'working');
      }
    },
    [appendToStreamingMessage, streamingState, updateAgentStatus]
  );

  /**
   * Complete streaming and finalize the message
   */
  const completeStreaming = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    const { streamingMessageId, streamingAgentId } = streamingState;

    // Finish the streaming message in the store
    finishStreamingMessage();

    // Update agent status to 'idle'
    if (streamingAgentId) {
      updateAgentStatus(streamingAgentId, 'idle');
    }

    setStreamingState((prev) => ({
      ...prev,
      isStreaming: false,
      progress: 100,
    }));

    // Clear any existing reset timer
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    // Reset state after a brief delay
    resetTimerRef.current = setTimeout(() => {
      setStreamingState({
        isStreaming: false,
        currentContent: '',
        streamingMessageId: null,
        streamingAgentId: null,
        progress: 0,
        error: null,
      });
      contentBufferRef.current = '';
      resetTimerRef.current = null;
    }, 500);
  }, [streamingState, finishStreamingMessage, updateAgentStatus]);

  /**
   * Handle streaming error
   */
  const handleError = useCallback(
    (error: string) => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      const { streamingMessageId, streamingAgentId } = streamingState;

      // Update message with error state
      if (streamingMessageId) {
        updateMessage(streamingMessageId, {
          metadata: {
            error: true,
            errorMessage: error,
          },
        });
      }

      // Update agent status to 'error'
      if (streamingAgentId) {
        updateAgentStatus(streamingAgentId, 'error');
      }

      setStreamingState((prev) => ({
        ...prev,
        isStreaming: false,
        error,
      }));
    },
    [streamingState, updateMessage, updateAgentStatus]
  );

  /**
   * Get current streaming status
   */
  const getStreamingStatus = useCallback((): AgentStatus => {
    if (streamingState.error) return 'error';
    if (!streamingState.isStreaming) return 'idle';
    if (streamingState.currentContent.length === 0) return 'thinking';
    return 'working';
  }, [streamingState]);

  /**
   * Check if a specific agent is currently streaming
   */
  const isAgentStreaming = useCallback(
    (agentId: string): boolean => {
      return (
        streamingState.isStreaming &&
        streamingState.streamingAgentId === agentId
      );
    },
    [streamingState]
  );

  // Updated: Jan 15th 2026 - Fixed memory leak by ensuring cleanup on unmount and state changes
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
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
    handleError,

    // Utilities
    getStreamingStatus,
    isAgentStreaming,
  };
}

/**
 * Hook for monitoring a specific agent's streaming status
 *
 * @param agentId - The ID of the agent to monitor
 *
 * @example
 * ```tsx
 * const { isStreaming, content } = useAgentStreamingStatus('code-reviewer');
 * ```
 */
export function useAgentStreamingStatus(agentId: string) {
  const streamingMessageId = useVibeChatStore(
    (state) => state.streamingMessageId
  );
  const messages = useVibeChatStore((state) => state.messages);
  const agent = useVibeAgentStore((state) => state.getActiveAgent(agentId));

  const [status, setStatus] = useState({
    isStreaming: false,
    content: '',
    status: 'idle' as AgentStatus,
    progress: 0,
  });

  useEffect(() => {
    // Use queueMicrotask to batch the setState call and avoid cascading renders
    queueMicrotask(() => {
      if (streamingMessageId) {
        const message = messages.find((m) => m.id === streamingMessageId);
        const isAgentStreaming =
          message?.employee_id === agentId || message?.employee_name === agentId;

        setStatus({
          isStreaming: isAgentStreaming && (message?.is_streaming ?? false),
          content: message?.content || '',
          status: agent?.status || 'idle',
          progress: agent?.progress || 0,
        });
      } else {
        setStatus({
          isStreaming: false,
          content: '',
          status: agent?.status || 'idle',
          progress: 0,
        });
      }
    });
  }, [streamingMessageId, messages, agentId, agent]);

  return status;
}
