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
  const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

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
        className="flex justify-end mb-4"
        variants={messageVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.2 }}
      >
        <div className="max-w-[70%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm">
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
                className="inline-block w-2 h-4 bg-primary-foreground ml-1"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-right">
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
        className="flex justify-center mb-4"
        variants={messageVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.2 }}
      >
        <div className="max-w-[80%] text-center">
          <div className="bg-muted/50 text-muted-foreground rounded-xl px-4 py-2 text-sm">
            {message.content}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </motion.div>
    );
  }

  // Agent message (left-aligned with avatar)
  return (
    <motion.div
      className="flex gap-3 mb-4"
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

      <div className="flex-1 max-w-[70%]">
        {/* Agent Name and Role Badge */}
        {(message.employee_name || employee) && (
          <div className="flex items-center gap-2 mb-1">
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
        <div className="bg-card rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm border">
          <ReactMarkdown
            className="prose prose-sm dark:prose-invert max-w-none"
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 last:mb-0 ml-4">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 last:mb-0 ml-4">{children}</ol>,
              code: ({ inline, children }) =>
                inline ? (
                  <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>
                ) : (
                  <code className="block bg-muted p-2 rounded my-2 overflow-x-auto">
                    {children}
                  </code>
                ),
            }}
          >
            {message.content}
          </ReactMarkdown>
          {message.is_streaming && (
            <motion.span
              className="inline-block w-2 h-4 bg-primary ml-1"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground mt-1">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </motion.div>
  );
};
