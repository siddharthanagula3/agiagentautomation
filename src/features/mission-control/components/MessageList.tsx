import React, { useEffect, useRef, memo, useMemo } from 'react';
import { ChatMessage } from '@shared/hooks/useChatState';
import { User, Bot } from 'lucide-react';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

/**
 * ChatMessageList - Memoized message list component for Mission Control
 *
 * Performance optimizations:
 * - React.memo to prevent re-renders when parent state changes
 * - Memoized message items to prevent unnecessary DOM updates
 */

// Memoized individual message component to prevent re-renders
const MessageItem = memo(function MessageItem({
  message,
}: {
  message: ChatMessage;
}) {
  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex max-w-[80%] items-start space-x-2 ${
          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
        }`}
      >
        <div className="flex-shrink-0">
          {message.role === 'user' ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
              <Bot className="h-4 w-4 text-secondary-foreground" />
            </div>
          )}
        </div>

        <div
          className={`rounded-lg px-4 py-2 ${
            message.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.toolCalls.map((toolCall) => (
                <div
                  key={toolCall.id}
                  className="rounded bg-background/50 px-2 py-1 text-xs"
                >
                  <span className="font-medium">{toolCall.name}</span>
                  {toolCall.result && (
                    <div className="mt-1 text-muted-foreground">
                      Result: {JSON.stringify(toolCall.result)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Loading indicator component - memoized since it's static
const LoadingIndicator = memo(function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
          <Bot className="h-4 w-4 text-secondary-foreground" />
        </div>
        <div className="rounded-lg bg-muted px-4 py-2">
          <div className="flex space-x-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: '0.1s' }}
            />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: '0.2s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export const ChatMessageList = memo(function ChatMessageList({
  messages,
  isLoading,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <p>No mission logs yet. Submit a mission to see activity here.</p>
        </div>
      )}
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {isLoading && <LoadingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
});
