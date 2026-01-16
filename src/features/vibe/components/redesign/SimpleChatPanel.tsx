/**
 * SimpleChatPanel - Clean, minimal chat for Vibe workspace
 *
 * Redesigned with:
 * - Minimal visual clutter
 * - File operations shown inline with message
 * - Clean message bubbles
 * - Auto-scroll behavior
 */

import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Avatar, AvatarFallback } from '@shared/ui/avatar';
import { Badge } from '@shared/ui/badge';
import { Bot, User, Loader2, FileCode, Sparkles } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { AgentMessage } from '../../components/agent-panel/AgentMessageList';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { parseCodeBlocks, extractFileOperations } from '../../utils/code-parser';
import { vibeFileSystem } from '@features/vibe/services/vibe-file-system';
import { toast } from 'sonner';
import { VibeEmptyState } from './VibeEmptyState';

interface SimpleChatPanelProps {
  messages: AgentMessage[];
  isLoading?: boolean;
  onFileCreated?: (filePath: string) => void;
  onPromptSelect?: (prompt: string) => void;
  showEmptyState?: boolean;
}

export function SimpleChatPanel({
  messages,
  isLoading,
  onFileCreated,
  onPromptSelect,
  showEmptyState = true,
}: SimpleChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Parse and create files from AI messages
  useEffect(() => {
    if (!messages.length) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;

    const parseResult = parseCodeBlocks(lastMessage.content);
    if (!parseResult.hasFiles) return;

    const operations = extractFileOperations(lastMessage.content, parseResult.codeBlocks);

    for (const operation of operations) {
      try {
        if (operation.action === 'create') {
          try {
            vibeFileSystem.readFile(operation.filePath);
            vibeFileSystem.updateFile(operation.filePath, operation.content || '');
          } catch {
            vibeFileSystem.createFile(operation.filePath, operation.content || '');
          }
        } else if (operation.action === 'update') {
          vibeFileSystem.updateFile(operation.filePath, operation.content || '');
        }
        onFileCreated?.(operation.filePath);
      } catch (error) {
        console.error('[VIBE] Failed to create/update file:', error);
      }
    }

    if (operations.length > 0) {
      toast.success(`${operations.length} file${operations.length > 1 ? 's' : ''} updated`);
    }
  }, [messages, onFileCreated]);

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-4">
          {messages.length === 0 && !isLoading && showEmptyState && onPromptSelect && (
            <VibeEmptyState onPromptSelect={onPromptSelect} />
          )}

          {messages.length === 0 && !isLoading && (!showEmptyState || !onPromptSelect) && (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-medium">Ready to build</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Describe what you want to create and I'll help you build it
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <ChatMessage key={message.id || index} message={message} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 py-4">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-violet-500/10">
                  <Bot className="h-4 w-4 text-violet-600" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Building...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

interface ChatMessageProps {
  message: AgentMessage;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const parseResult = !isUser ? parseCodeBlocks(message.content) : null;
  const fileOperations = parseResult?.hasFiles
    ? extractFileOperations(message.content, parseResult.codeBlocks)
    : [];

  return (
    <div className={cn('group py-3', !isUser && 'hover:bg-muted/30 rounded-lg')}>
      <div className="flex gap-3">
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarFallback className={cn(
            isUser ? 'bg-blue-500/10 text-blue-600' : 'bg-violet-500/10 text-violet-600'
          )}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          {/* Header: Name only */}
          <div className="mb-1 text-sm font-medium">
            {isUser ? 'You' : message.agentName || 'AI'}
          </div>

          {/* Content */}
          {isUser ? (
            <p className="text-sm">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="my-2 overflow-hidden rounded-lg border border-border">
                        <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5">
                          <span className="text-xs text-muted-foreground">{match[1]}</span>
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="!my-0 text-xs"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props}>
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

          {/* File operations - subtle, below content */}
          {fileOperations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {fileOperations.map((op, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="gap-1 border-green-500/30 bg-green-500/5 text-xs text-green-600"
                >
                  <FileCode className="h-3 w-3" />
                  {op.filePath.split('/').pop()}
                </Badge>
              ))}
            </div>
          )}

          {/* Streaming indicator */}
          {message.isStreaming && (
            <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-violet-500" />
          )}
        </div>
      </div>
    </div>
  );
}
