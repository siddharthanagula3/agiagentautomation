import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Copy, Check, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  employeeId?: string;
  employeeName?: string;
  employeeAvatar?: string;
  employeeColor?: string;
  isStreaming?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={cn('flex gap-3 p-4', isUser ? 'justify-end' : 'justify-start')}
    >
      {/* Avatar - only show for assistant messages */}
      {!isUser && (
        <div className="flex-shrink-0">
          {message.employeeAvatar || message.employeeName ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.employeeAvatar} />
              <AvatarFallback
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: message.employeeColor || '#6366f1' }}
              >
                {message.employeeName
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('') || 'AI'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
              <Bot className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          'flex max-w-[80%] flex-col',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Employee Name */}
        {!isUser && message.employeeName && (
          <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            {message.employeeName}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'group relative rounded-2xl px-4 py-3 shadow-sm',
            isUser
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
          )}
        >
          {/* Content */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
            {message.isStreaming && (
              <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-current" />
            )}
          </div>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={cn(
              'absolute right-2 top-2 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100',
              isUser
                ? 'text-white hover:bg-white/20'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700'
            )}
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Timestamp */}
        <div
          className={cn(
            'mt-1 text-xs text-gray-500 dark:text-gray-400',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>

      {/* User Avatar - only show for user messages */}
      {isUser && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500">
              <User className="h-4 w-4 text-white" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}
