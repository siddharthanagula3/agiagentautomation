/**
 * VibeMessageList.tsx
 * Scrollable message list with auto-scroll for the VIBE interface
 *
 * Performance optimizations:
 * - React.memo to prevent unnecessary re-renders
 * - useCallback for helper functions
 * - useMemo for computed values
 */

import React, { useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { VibeMessage } from './VibeMessage';
import { VibeThinkingIndicator } from './VibeThinkingIndicator';
import { useVibeChatStore } from '../../stores/vibe-chat-store';
import { useVibeAgentStore } from '../../stores/vibe-agent-store';
import type { VibeMessage as VibeMessageType } from '../../types/vibe-message';

interface VibeMessageListProps {
  messages: VibeMessageType[];
  isLoading?: boolean;
  className?: string;
}

export const VibeMessageList = memo(function VibeMessageList({
  messages,
  isLoading = false,
  className = '',
}: VibeMessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { streamingMessageId } = useVibeChatStore();
  const { activeAgents, getActiveAgent } = useVibeAgentStore();

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      }
    };

    // Scroll when messages change or during streaming
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, streamingMessageId]);

  // Memoized helper to get employee and status for agent messages
  const getEmployeeForMessage = useCallback(
    (message: VibeMessageType) => {
      if (message.role !== 'assistant' || !message.employee_id) {
        return { employee: undefined, status: undefined };
      }

      const activeAgent = getActiveAgent(message.employee_id);
      return {
        employee: activeAgent?.employee,
        status: activeAgent?.status,
      };
    },
    [getActiveAgent]
  );

  // Memoize thinking agent to prevent unnecessary recalculations
  const thinkingAgent = useMemo(() => {
    return Array.from(activeAgents.values()).find(
      (agent) => agent.status === 'thinking'
    );
  }, [activeAgents]);

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="space-y-2 py-4">
          {messages.length === 0 && !isLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="mb-2 text-lg font-medium">Welcome to VIBE</p>
                <p className="text-sm">
                  Start a conversation with your AI workforce
                </p>
                <p className="mt-2 text-xs">
                  Use <code className="rounded bg-muted px-1 py-0.5">#</code> to
                  mention agents or{' '}
                  <code className="rounded bg-muted px-1 py-0.5">@</code> to
                  reference files
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((message) => {
                const { employee, status } = getEmployeeForMessage(message);
                return (
                  <VibeMessage
                    key={message.id}
                    message={message}
                    employee={employee}
                    agentStatus={status}
                  />
                );
              })}
            </AnimatePresence>
          )}

          {/* Thinking Indicator */}
          {thinkingAgent && (
            <div className="mb-4 flex gap-3">
              <div className="w-10 flex-shrink-0" />{' '}
              {/* Spacer for alignment */}
              <div className="flex-1">
                <VibeThinkingIndicator
                  agentName={thinkingAgent.employee.name}
                  size="md"
                />
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && !thinkingAgent && (
            <div className="flex justify-center py-4">
              <VibeThinkingIndicator size="md" />
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
});
