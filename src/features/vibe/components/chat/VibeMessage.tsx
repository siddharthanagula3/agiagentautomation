/**
 * VibeMessage.tsx
 * Individual message bubble component for the VIBE interface
 */

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@shared/components/ui/badge';
import { VibeAgentAvatar } from './VibeAgentAvatar';
import type { VibeMessage as VibeMessageType } from '../../types/vibe-message';
import type { AIEmployee } from '@core/types/ai-employee';
import type { AgentStatus } from '../../types/vibe-agent';

interface VibeMessageProps {
  message: VibeMessageType;
  employee?: AIEmployee;
  agentStatus?: AgentStatus;
}

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - messageDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

export const VibeMessage: React.FC<VibeMessageProps> = ({
  message,
  employee,
  agentStatus = 'idle',
}) => {
  const messageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  // User message (right-aligned)
  if (message.role === 'user') {
    return (
      <motion.div
        className="mb-4 flex justify-end"
        variants={messageVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.2 }}
      >
        <div className="max-w-[70%]">
          <div className="rounded-2xl rounded-tr-sm bg-primary px-5 py-3 text-primary-foreground shadow-sm">
            <ReactMarkdown
              className="prose prose-sm dark:prose-invert max-w-none"
              components={{
                p: ({ children }) => <p className="mb-0">{children}</p>,
              }}
            >
              {message.content}
            </ReactMarkdown>
            {message.is_streaming && (
              <motion.span
                className="ml-1 inline-block h-4 w-2 bg-primary-foreground"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          <div className="mt-1 text-right text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </motion.div>
    );
  }

  // System message (center-aligned)
  if (message.role === 'system') {
    return (
      <motion.div
        className="mb-4 flex justify-center"
        variants={messageVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.2 }}
      >
        <div className="max-w-[80%] text-center">
          <div className="rounded-xl bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
            {message.content}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </motion.div>
    );
  }

  // Agent message (left-aligned with avatar)
  return (
    <motion.div
      className="mb-4 flex gap-3"
      variants={messageVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.2 }}
    >
      {/* Agent Avatar */}
      {employee && (
        <div className="flex-shrink-0">
          <VibeAgentAvatar employee={employee} status={agentStatus} size="md" />
        </div>
      )}

      <div className="max-w-[70%] flex-1">
        {/* Agent Name and Role Badge */}
        {(message.employee_name || employee) && (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium">
              {message.employee_name || employee?.name || 'AI Assistant'}
            </span>
            {message.employee_role && (
              <Badge variant="outline" className="text-xs">
                {message.employee_role}
              </Badge>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className="rounded-2xl rounded-tl-sm border bg-card px-5 py-3 shadow-sm">
          <ReactMarkdown
            className="prose prose-sm dark:prose-invert max-w-none"
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="mb-2 ml-4 last:mb-0">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-2 ml-4 last:mb-0">{children}</ol>
              ),
              code: ({ inline, children }) =>
                inline ? (
                  <code className="rounded bg-muted px-1 py-0.5 text-sm">
                    {children}
                  </code>
                ) : (
                  <code className="my-2 block overflow-x-auto rounded bg-muted p-2">
                    {children}
                  </code>
                ),
            }}
          >
            {message.content}
          </ReactMarkdown>
          {message.is_streaming && (
            <motion.span
              className="ml-1 inline-block h-4 w-2 bg-primary"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-1 text-xs text-muted-foreground">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </motion.div>
  );
};
