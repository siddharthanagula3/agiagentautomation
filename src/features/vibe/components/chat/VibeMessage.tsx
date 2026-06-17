/**
 * VibeMessage.tsx
 * Individual message bubble component for the VIBE interface
 *
 * Performance optimizations:
 * - React.memo to prevent unnecessary re-renders
 * - Memoized animation variants to avoid object recreation
 * - Memoized markdown components
 */

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
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

// Memoize animation variants outside component to prevent recreation
const messageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
} as const;

const cursorAnimation = { opacity: [1, 0.3, 1] };
const cursorTransition = { duration: 1, repeat: Infinity };
const messageTransition = { duration: 0.2 };

// Memoize markdown components outside component
const userMarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-0">{children}</p>,
};

const agentMarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 ml-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 last:mb-0">{children}</ol>,
  code: ({ inline, children }) =>
    inline ? (
      <code className="bg-muted rounded px-1 py-0.5 text-sm">{children}</code>
    ) : (
      <code className="bg-muted my-2 block overflow-x-auto rounded p-2">
        {children}
      </code>
    ),
};

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

export const VibeMessage = memo(function VibeMessage({
  message,
  employee,
  agentStatus = 'idle',
}: VibeMessageProps) {
  // Memoize formatted timestamp
  const formattedTimestamp = useMemo(
    () => formatTimestamp(message.timestamp),
    [message.timestamp]
  );

  // User message (right-aligned)
  if (message.role === 'user') {
    return (
      <motion.div
        className="mb-4 flex justify-end"
        variants={messageVariants}
        initial="initial"
        animate="animate"
        transition={messageTransition}
      >
        <div className="max-w-[70%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm">
            <ReactMarkdown
              className="prose prose-sm dark:prose-invert max-w-none"
              components={userMarkdownComponents}
            >
              {message.content}
            </ReactMarkdown>
            {message.is_streaming && (
              <motion.span
                className="bg-primary-foreground ml-1 inline-block h-4 w-2"
                animate={cursorAnimation}
                transition={cursorTransition}
              />
            )}
          </div>
          <div className="text-muted-foreground mt-1 text-right text-xs">
            {formattedTimestamp}
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
        transition={messageTransition}
      >
        <div className="max-w-[80%] text-center">
          <div className="bg-muted/50 text-muted-foreground rounded-xl px-4 py-2 text-sm">
            {message.content}
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {formattedTimestamp}
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
      transition={messageTransition}
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
        <div className="bg-card rounded-2xl rounded-tl-sm border px-5 py-3 shadow-sm">
          <ReactMarkdown
            className="prose prose-sm dark:prose-invert max-w-none"
            components={agentMarkdownComponents}
          >
            {message.content}
          </ReactMarkdown>
          {message.is_streaming && (
            <motion.span
              className="bg-primary ml-1 inline-block h-4 w-2"
              animate={cursorAnimation}
              transition={cursorTransition}
            />
          )}
        </div>

        {/* Timestamp */}
        <div className="text-muted-foreground mt-1 text-xs">
          {formattedTimestamp}
        </div>
      </div>
    </motion.div>
  );
});
