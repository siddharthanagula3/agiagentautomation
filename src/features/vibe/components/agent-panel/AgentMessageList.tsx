/**
 * AgentMessageList - Displays conversation messages in agent panel
 * Compact view optimized for left sidebar
 */

import React, { useRef, useEffect } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Bot, User } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import ReactMarkdown from 'react-markdown';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
  agentRole?: string;
  isStreaming?: boolean;
}

interface AgentMessageListProps {
  messages: AgentMessage[];
  className?: string;
}

export function AgentMessageList({
  messages,
  className,
}: AgentMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <Bot className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            Start a conversation with your AI employees
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Type @ to mention an agent
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={cn('flex-1', className)}>
      <div ref={scrollRef} className="space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' && 'flex-row-reverse'
            )}
          >
            {/* Avatar */}
            <Avatar className="h-8 w-8 shrink-0">
              {message.role === 'user' ? (
                <>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage src={undefined} alt={message.agentName} />
                  <AvatarFallback className="bg-blue-500/10 text-blue-600">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </>
              )}
            </Avatar>

            {/* Message Content */}
            <div
              className={cn(
                'min-w-0 flex-1',
                message.role === 'user' && 'flex flex-col items-end'
              )}
            >
              {/* Agent Name & Role (for assistant messages) */}
              {message.role === 'assistant' && message.agentName && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold">
                    {message.agentName}
                  </span>
                  {message.agentRole && (
                    <span className="text-xs text-muted-foreground">
                      {message.agentRole}
                    </span>
                  )}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={cn(
                  'break-words rounded-lg p-3 text-sm',
                  message.role === 'user'
                    ? 'ml-12 bg-primary text-primary-foreground'
                    : 'mr-12 bg-muted'
                )}
              >
                {message.isStreaming ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-current" />
                    </div>
                    <span className="text-xs opacity-70">Thinking...</span>
                  </div>
                ) : (
                  <ReactMarkdown
                    className="prose prose-sm dark:prose-invert max-w-none"
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                      ),
                      code: ({ children }) => (
                        <code className="rounded bg-background/50 px-1 py-0.5 text-xs">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="my-2 overflow-x-auto rounded bg-background/50 p-2 text-xs">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>

              {/* Timestamp */}
              <span className="mt-1 block text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
