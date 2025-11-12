import React from 'react';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Loader2, Bot } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { MessageBubble } from '../MessageBubble';
import { useChatStore } from '@shared/stores/chat-store';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onRegenerate: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onToolExecute: (toolId: string, args?: Record<string, unknown>) => void;
  toolResults?: Record<string, unknown>;
  activeTool?: string | null;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onRegenerate,
  onEdit,
  onDelete,
}) => {
  const reactToMessage = useChatStore((state) => state.reactToMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);

  const handleEdit = (messageId: string) => {
    // TODO: Implement edit UI
    const newContent = prompt('Edit message:');
    if (newContent) {
      onEdit(messageId, newContent);
    }
  };

  const handlePin = (messageId: string) => {
    updateMessage(messageId, {
      metadata: {
        ...messages.find((m) => m.id === messageId)?.metadata,
        isPinned: !messages.find((m) => m.id === messageId)?.metadata?.isPinned,
      },
    });
  };

  const handleReact = (
    messageId: string,
    reactionType: 'up' | 'down' | 'helpful'
  ) => {
    reactToMessage(messageId, reactionType);
  };

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-0">
        {messages.map((message) => {
          // Ensure createdAt is a Date object
          const timestamp = message.createdAt instanceof Date 
            ? message.createdAt 
            : new Date(message.createdAt || Date.now());
          
          return (
            <MessageBubble
              key={message.id}
              message={{
                id: message.id,
                content: message.content,
                role: message.role,
                timestamp,
              employeeId: message.metadata?.employeeId as string | undefined,
              employeeName: message.metadata?.employeeName as
                | string
                | undefined,
              reactions: [],
              metadata: {
                tokensUsed: message.metadata?.tokens,
                inputTokens: message.metadata?.inputTokens as
                  | number
                  | undefined,
                outputTokens: message.metadata?.outputTokens as
                  | number
                  | undefined,
                model: message.metadata?.model,
                cost: message.metadata?.cost,
                isPinned: message.metadata?.isPinned as boolean | undefined,
              },
            }}
            onEdit={handleEdit}
            onRegenerate={onRegenerate}
            onDelete={onDelete}
            onPin={handlePin}
            onReact={handleReact}
          />
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-4 p-4">
            <div className="mr-4 flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bot className="h-4 w-4" />
              </div>
            </div>
            <div className="flex-1">
              <div className="inline-block rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
