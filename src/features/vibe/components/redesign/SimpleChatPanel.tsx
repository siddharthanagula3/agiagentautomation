/**
 * SimpleChatPanel - Left panel showing ONLY chat interface
 * Clean, focused chat experience inspired by Lovable.dev, Bolt.new
 * Integrated with code parsing and automatic file creation
 */

import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Avatar, AvatarFallback } from '@shared/ui/avatar';
import { Badge } from '@shared/ui/badge';
import { Bot, User, Loader2, FileCode, CheckCircle } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { AgentMessage } from '../../components/agent-panel/AgentMessageList';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { parseCodeBlocks, extractFileOperations } from '../../utils/code-parser';
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';
import { toast } from 'sonner';

interface SimpleChatPanelProps {
  messages: AgentMessage[];
  isLoading?: boolean;
  onFileCreated?: (filePath: string) => void;
}

export function SimpleChatPanel({ messages, isLoading, onFileCreated }: SimpleChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Parse and create files from AI messages
  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];

    // Only process AI messages
    if (lastMessage.role !== 'assistant') return;

    // Parse code blocks
    const parseResult = parseCodeBlocks(lastMessage.content);

    if (parseResult.hasFiles) {
      const operations = extractFileOperations(lastMessage.content, parseResult.codeBlocks);

      // Create/update files
      for (const operation of operations) {
        try {
          if (operation.action === 'create') {
            // Check if file exists
            try {
              vibeFileSystem.readFile(operation.filePath);
              // File exists, update it instead
              vibeFileSystem.updateFile(operation.filePath, operation.content || '');
            } catch {
              // File doesn't exist, create it
              vibeFileSystem.createFile(operation.filePath, operation.content || '');
            }
          } else if (operation.action === 'update') {
            vibeFileSystem.updateFile(operation.filePath, operation.content || '');
          }

          // Notify parent component
          onFileCreated?.(operation.filePath);
        } catch (error) {
          console.error('[VIBE] Failed to create/update file:', error);
        }
      }

      // Show toast notification
      if (operations.length > 0) {
        toast.success(
          `${operations.length} file${operations.length > 1 ? 's' : ''} ${operations[0].action}d`,
          {
            description: operations.map(op => op.filePath).join(', '),
          }
        );
      }
    }
  }, [messages, onFileCreated]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold">AI Development Agent</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Build, code, and preview in real-time
        </p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex h-full min-h-[300px] items-center justify-center text-center">
              <div>
                <Bot className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mb-2 text-sm font-medium">Start a conversation</h3>
                <p className="text-xs text-muted-foreground">
                  Ask me to build an app, write code, or create something
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble key={message.id || index} message={message} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Agent is thinking...</span>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

interface MessageBubbleProps {
  message: AgentMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Parse code blocks to detect file operations
  const parseResult = !isUser ? parseCodeBlocks(message.content) : null;
  const fileOperations = parseResult?.hasFiles
    ? extractFileOperations(message.content, parseResult.codeBlocks)
    : [];

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? 'bg-blue-500/10 text-blue-600'
              : 'bg-purple-500/10 text-purple-600'
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          'flex max-w-[85%] flex-col gap-1',
          isUser && 'items-end'
        )}
      >
        {/* Agent Name/Role */}
        {!isUser && message.agentName && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-medium text-foreground">
              {message.agentName}
            </span>
            {message.agentRole && (
              <Badge variant="secondary" className="text-xs">
                {message.agentRole}
              </Badge>
            )}
          </div>
        )}

        {/* File Operations Badge */}
        {!isUser && fileOperations.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {fileOperations.map((op, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                {op.action === 'create' ? (
                  <FileCode className="h-3 w-3" />
                ) : (
                  <CheckCircle className="h-3 w-3" />
                )}
                <span className="truncate max-w-[150px]">{op.filePath}</span>
              </Badge>
            ))}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-lg px-3 py-2',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          {isUser ? (
            <p className="text-sm">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md text-xs"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {message.isStreaming && (
            <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-current" />
          )}
        </div>

        {/* Timestamp */}
        <span className="px-1 text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
