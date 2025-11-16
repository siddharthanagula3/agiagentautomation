/**
 * VibeMessageList.tsx
 * Scrollable message list with auto-scroll for the VIBE interface
 */

import React, { useEffect, useRef } from 'react';
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

export const VibeMessageList: React.FC<VibeMessageListProps> = ({
  messages,
  isLoading = false,
  className = '',
}) => {
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

  // Get employee and status for agent messages
  const getEmployeeForMessage = (message: VibeMessageType) => {
    if (message.role !== 'assistant' || !message.employee_id) {
      return { employee: undefined, status: undefined };
    }

    const activeAgent = getActiveAgent(message.employee_id);
    return {
      employee: activeAgent?.employee,
      status: activeAgent?.status,
    };
  };

  // Show thinking indicator for actively thinking agents
  const getThinkingAgent = () => {
    const thinkingAgent = Array.from(activeAgents.values()).find(
      (agent) => agent.status === 'thinking'
    );
    return thinkingAgent;
  };

  const thinkingAgent = getThinkingAgent();

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="py-4 space-y-2">
          {messages.length === 0 && !isLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Welcome to VIBE</p>
                <p className="text-sm">
                  Start a conversation with your AI workforce
                </p>
                <p className="text-xs mt-2">
                  Use <code className="bg-muted px-1 py-0.5 rounded">#</code> to mention agents
                  or <code className="bg-muted px-1 py-0.5 rounded">@</code> to reference files
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
            <div className="flex gap-3 mb-4">
              <div className="flex-shrink-0 w-10" /> {/* Spacer for alignment */}
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
};
