import React from 'react';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import {
  Copy,
  Edit3,
  RotateCcw,
  Trash2,
  Loader2,
  Bot,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { ChatMessage, ToolCall } from '../../types';

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
  onToolExecute,
  toolResults,
  activeTool,
}) => {
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    return (
      <div
        key={message.id}
        className={`flex gap-4 p-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-4' : 'mr-4'}`}>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div
          className={`min-w-0 flex-1 ${isUser ? 'text-right' : 'text-left'}`}
        >
          <div
            className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 ${
              isUser
                ? 'rounded-br-sm bg-primary text-primary-foreground'
                : 'rounded-bl-sm border border-border bg-card'
            }`}
          >
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center space-x-2 text-sm text-muted-foreground"
                  >
                    <span>{attachment.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {attachment.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Tool Calls */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.toolCalls.map((toolCall) => (
                  <div
                    key={toolCall.id}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <Badge variant="outline">{toolCall.name}</Badge>
                    {toolCall.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {toolCall.status === 'failed' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {toolCall.status === 'running' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Actions */}
          {isAssistant && (
            <div className="mt-2 flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(message.content)}
                className="h-6 px-2 text-xs"
              >
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRegenerate(message.id)}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Regenerate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(message.id)}
                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-1 text-xs text-muted-foreground">
            {new Date(message.createdAt).toLocaleTimeString()}
            {message.isEdited && <span className="ml-2">(edited)</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4">
        {messages.map(renderMessage)}

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
