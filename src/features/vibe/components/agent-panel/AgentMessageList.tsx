/**
 * AgentMessageList - Displays conversation messages in agent panel
 * Compact view optimized for left sidebar
 */

import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
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

export function AgentMessageList({ messages, className }: AgentMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            Start a conversation with your AI employees
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Type @ to mention an agent
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={cn('flex-1', className)}>
      <div ref={scrollRef} className="p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' && 'flex-row-reverse'
            )}
          >
            {/* Avatar */}
            <Avatar className="w-8 h-8 shrink-0">
              {message.role === 'user' ? (
                <>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage src={undefined} alt={message.agentName} />
                  <AvatarFallback className="bg-blue-500/10 text-blue-600">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </>
              )}
            </Avatar>

            {/* Message Content */}
            <div
              className={cn(
                'flex-1 min-w-0',
                message.role === 'user' && 'flex flex-col items-end'
              )}
            >
              {/* Agent Name & Role (for assistant messages) */}
              {message.role === 'assistant' && message.agentName && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">{message.agentName}</span>
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
                  'rounded-lg p-3 text-sm break-words',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-12'
                    : 'bg-muted mr-12'
                )}
              >
                {message.isStreaming ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    </div>
                    <span className="text-xs opacity-70">Thinking...</span>
                  </div>
                ) : (
                  <ReactMarkdown
                    className="prose prose-sm dark:prose-invert max-w-none"
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      code: ({ children }) => (
                        <code className="bg-background/50 px-1 py-0.5 rounded text-xs">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-background/50 p-2 rounded text-xs overflow-x-auto my-2">
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
              <span className="text-xs text-muted-foreground mt-1 block">
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
