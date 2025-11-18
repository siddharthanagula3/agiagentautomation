import React from 'react';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Loader2, Bot } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { MessageBubble } from '../MessageBubble';
import { EmployeeThinkingIndicator } from '../EmployeeThinkingIndicator';
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
    // Simple edit implementation - can be enhanced with a modal dialog later
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
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
          const timestamp =
            message.createdAt instanceof Date
              ? message.createdAt
              : new Date(message.createdAt || Date.now());

          // Check if this is a thinking/processing indicator message
          if (message.metadata?.isThinking || message.metadata?.isSearching || message.metadata?.isToolProcessing) {
            return (
              <EmployeeThinkingIndicator
                key={message.id}
                employeeName={message.metadata?.employeeName as string | undefined}
                employeeAvatar={message.metadata?.employeeAvatar as string | undefined}
                message={message.content}
              />
            );
          }

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
                employeeAvatar: message.metadata?.employeeAvatar as
                  | string
                  | undefined,
                reactions: [],
                metadata: {
                  tokensUsed: message.metadata?.tokens || message.metadata?.tokensUsed,
                  inputTokens: message.metadata?.inputTokens as
                    | number
                    | undefined,
                  outputTokens: message.metadata?.outputTokens as
                    | number
                    | undefined,
                  model: message.metadata?.model,
                  cost: message.metadata?.cost,
                  isPinned: message.metadata?.isPinned as boolean | undefined,
                  selectionReason: message.metadata?.selectionReason as
                    | string
                    | undefined,
                  thinkingSteps: message.metadata?.thinkingSteps as
                    | string[]
                    | undefined,
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

        {/* Loading indicator - fallback if not using thinking indicator */}
        {isLoading && messages.every(m => !m.metadata?.isThinking) && (
          <EmployeeThinkingIndicator message="Processing your request..." />
        )}
      </div>
    </ScrollArea>
  );
};
