import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@shared/ui/badge';
import { User, Bot, Wrench } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: MCPToolCall[];
  reasoning?: string;
  status?: 'thinking' | 'working' | 'completed' | 'error';
}

export interface MCPToolCall {
  tool: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

interface ChatMessageProps {
  message: ChatMessage;
  employeeName: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  employeeName,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'flex',
        message.type === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg p-4',
          message.type === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <div className="mb-2 flex items-center space-x-2">
          {message.type === 'user' ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {message.type === 'user' ? 'You' : employeeName}
          </span>
          {message.status && (
            <Badge variant="outline" className="text-xs">
              {message.status}
            </Badge>
          )}
        </div>

        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* Tool Calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium">Tools Used:</p>
            {message.toolCalls.map((toolCall, index) => (
              <div key={index} className="rounded bg-background p-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-3 w-3" />
                  <span className="font-medium">{toolCall.tool}</span>
                  <Badge
                    variant={
                      toolCall.status === 'completed'
                        ? 'default'
                        : 'destructive'
                    }
                    className="text-xs"
                  >
                    {toolCall.status}
                  </Badge>
                </div>
                {toolCall.error && (
                  <p className="mt-1 text-xs text-red-500">{toolCall.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
};
