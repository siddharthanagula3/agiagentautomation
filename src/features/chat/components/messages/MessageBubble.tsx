/**
 * MessageBubble - Clean, minimal message display
 *
 * Redesigned with:
 * - Progressive disclosure (details on hover/click)
 * - Minimal metadata inline
 * - Clean visual hierarchy
 * - Token usage hidden by default
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shared/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shared/ui/collapsible';
import {
  User,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Brain,
  Download,
  MoreHorizontal,
  Pin,
  Pencil,
  RefreshCw,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import { cn } from '@shared/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';
import { toast } from 'sonner';
import { ArtifactPreview } from '../artifacts/ArtifactPreview';
import {
  extractArtifacts,
  removeArtifactBlocks,
} from '../../utils/artifact-detector';
import { useArtifactStore } from '@shared/stores/artifact-store';
import { employeeChatService } from '../../services/employee-chat-service';
import { SearchResults } from '../search/SearchResults';
import type { SearchResponse } from '@core/integrations/web-search-handler';
import type { MediaGenerationResult } from '@core/integrations/media-generation-handler';
import type { GeneratedDocument } from '../../services/document-generation-service';

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

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
  reactions?: Array<{ type: string; userId: string }>;
  attachments?: Attachment[];
  metadata?: {
    isDocument?: boolean;
    documentTitle?: string;
    hasWorkStream?: boolean;
    workStreamData?: Record<string, unknown>;
    isPinned?: boolean;
    tokensUsed?: number;
    inputTokens?: number;
    outputTokens?: number;
    model?: string;
    cost?: number;
    selectionReason?: string;
    thinkingSteps?: string[];
    isThinking?: boolean;
    isStreaming?: boolean;
    isCollaboration?: boolean;
    collaborationType?: 'contribution' | 'discussion' | 'synthesis';
    collaborationTo?: string;
    isMultiAgent?: boolean;
    employeesInvolved?: string[];
    isSynthesis?: boolean;
    searchResults?: SearchResponse;
    isSearching?: boolean;
    toolResult?: boolean;
    toolType?: string;
    imageUrl?: string;
    imageData?: MediaGenerationResult;
    videoUrl?: string;
    thumbnailUrl?: string;
    videoData?: MediaGenerationResult;
    documentData?: GeneratedDocument;
    collaborationMessages?: Array<{
      employeeName: string;
      employeeAvatar: string;
      content: string;
      messageType?: string;
    }>;
  };
}

interface MessageBubbleProps {
  message: Message;
  onEdit?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onReact?: (
    messageId: string,
    reactionType: 'up' | 'down' | 'helpful'
  ) => void;
}

// Code block with copy button
const CodeBlock = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!match) {
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{children}</code>
    );
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1.5 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={copied ? 'Code copied' : 'Copy code'}
        >
          {copied ? (
            <Check className="h-3 w-3" aria-hidden="true" />
          ) : (
            <Copy className="h-3 w-3" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="overflow-x-auto bg-zinc-950 p-4">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

const markdownComponents: Components = {
  code: CodeBlock as Components['code'],
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 text-xl font-bold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-5 text-lg font-semibold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal pl-6">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-2">{children}</td>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

export const MessageBubble = React.memo(function MessageBubble({
  message,
  onEdit,
  onRegenerate,
  onDelete,
  onPin,
  onReact,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [showContributions, setShowContributions] = useState(false);
  const isUser = message.role === 'user';

  const { addArtifact, getMessageArtifacts } = useArtifactStore();

  // Artifact handling
  const existingArtifacts = getMessageArtifacts(message.id);
  const extractedArtifacts = useMemo(() => {
    if (isUser) return [];
    return extractArtifacts(message.content);
  }, [message.content, isUser]);

  const artifacts =
    existingArtifacts.length > 0 ? existingArtifacts : extractedArtifacts;

  useEffect(() => {
    if (
      isUser ||
      existingArtifacts.length > 0 ||
      extractedArtifacts.length === 0
    )
      return;
    extractedArtifacts.forEach((artifact) => addArtifact(message.id, artifact));
  }, [
    message.id,
    isUser,
    existingArtifacts.length,
    extractedArtifacts,
    addArtifact,
  ]);

  const cleanedContent = useMemo(() => {
    if (artifacts.length === 0) return message.content;
    return removeArtifactBlocks(message.content, artifacts);
  }, [message.content, artifacts]);

  // Employee info
  const employeeInitials = message.employeeName
    ? employeeChatService.getEmployeeInitials(message.employeeName)
    : 'AI';
  const employeeColor =
    message.employeeColor ||
    employeeChatService.getEmployeeAvatar(message.employeeName || '');

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const hasThinkingSteps =
    message.metadata?.thinkingSteps &&
    message.metadata.thinkingSteps.length > 0;
  const hasContributions =
    message.metadata?.isMultiAgent &&
    message.metadata?.collaborationMessages &&
    message.metadata.collaborationMessages.length > 0;

  return (
    <div className={cn('group px-4 py-4', !isUser && 'hover:bg-muted/30')}>
      <div
        className={cn(
          'mx-auto flex max-w-3xl gap-4',
          isUser && 'flex-row-reverse'
        )}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          {isUser ? (
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600">
              <User className="h-4 w-4 text-white" aria-hidden="true" />
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage
                src={
                  message.employeeAvatar?.startsWith('/')
                    ? message.employeeAvatar
                    : undefined
                }
              />
              <AvatarFallback
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: employeeColor }}
              >
                {employeeInitials}
              </AvatarFallback>
            </>
          )}
        </Avatar>

        {/* Content */}
        <div className={cn('min-w-0 flex-1', isUser && 'text-right')}>
          {/* Header: Name + Time */}
          <div
            className={cn(
              'mb-1 flex items-center gap-2 text-sm',
              isUser && 'flex-row-reverse'
            )}
          >
            <span className="font-medium">
              {isUser
                ? 'You'
                : message.employeeName
                    ?.split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ') || 'AI'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            {message.metadata?.isPinned && (
              <Pin className="h-3 w-3 text-amber-500" aria-hidden="true" />
            )}
          </div>

          {/* Message Content */}
          <div
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none',
              isUser && 'prose-p:text-right'
            )}
          >
            {message.isStreaming && !cleanedContent.trim() ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-sm">Thinking...</span>
              </div>
            ) : (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={markdownComponents}
                >
                  {cleanedContent}
                </ReactMarkdown>
                {message.isStreaming && cleanedContent.trim() && (
                  <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-primary" />
                )}
              </>
            )}
          </div>

          {/* Artifacts */}
          {!isUser && artifacts.length > 0 && (
            <div className="mt-4 space-y-3">
              {artifacts.map((artifact) => (
                <ArtifactPreview key={artifact.id} artifact={artifact} />
              ))}
            </div>
          )}

          {/* Image Result with Error Handling */}
          {!isUser &&
            message.metadata?.toolType === 'image-generation' &&
            message.metadata?.imageUrl && (
              <div className="mt-4">
                <div className="overflow-hidden rounded-xl border border-border">
                  <img
                    src={message.metadata.imageUrl}
                    alt="Generated image"
                    className="max-h-96 w-auto"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'flex items-center justify-center p-8 bg-muted/50 text-muted-foreground';
                      errorDiv.innerHTML = '<span class="text-sm">⚠️ Image failed to load</span>';
                      target.parentNode?.appendChild(errorDiv);
                    }}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    asChild
                  >
                    <a href={message.metadata.imageUrl} download>
                      <Download className="mr-1.5 h-3 w-3" aria-hidden="true" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            )}

          {/* Video Result with Error Handling */}
          {!isUser &&
            message.metadata?.toolType === 'video-generation' &&
            message.metadata?.videoUrl && (
              <div className="mt-4">
                <video
                  src={message.metadata.videoUrl}
                  controls
                  className="max-h-96 rounded-xl"
                  poster={message.metadata.thumbnailUrl}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'flex items-center justify-center p-8 bg-muted/50 text-muted-foreground rounded-xl';
                    errorDiv.innerHTML = '<span class="text-sm">⚠️ Video failed to load</span>';
                    target.parentNode?.appendChild(errorDiv);
                  }}
                />
              </div>
            )}

          {/* Search Results */}
          {!isUser && message.metadata?.searchResults && (
            <div className="mt-4">
              <SearchResults
                searchResponse={message.metadata.searchResults}
                showAnswer
              />
            </div>
          )}

          {/* Thinking Steps (Collapsible) */}
          {hasThinkingSteps && (
            <Collapsible
              open={showThinking}
              onOpenChange={setShowThinking}
              className="mt-3"
            >
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                  aria-expanded={showThinking}
                  aria-label="Toggle thinking process visibility"
                >
                  {showThinking ? (
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  )}
                  <Brain className="h-3 w-3" aria-hidden="true" />
                  Thinking process ({
                    message.metadata?.thinkingSteps?.length
                  }{' '}
                  steps)
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                  {message.metadata?.thinkingSteps?.map((step, stepIndex) => (
                    <div
                      key={`thinking-step-${stepIndex}-${step.slice(0, 20)}`}
                      className="flex gap-2 text-xs text-muted-foreground"
                    >
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                        {stepIndex + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Agent Contributions (Collapsible) */}
          {hasContributions && (
            <Collapsible
              open={showContributions}
              onOpenChange={setShowContributions}
              className="mt-3"
            >
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                  aria-expanded={showContributions}
                  aria-label="Toggle agent contributions visibility"
                >
                  {showContributions ? (
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  )}
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {message.metadata?.collaborationMessages?.length} agents
                  contributed
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {message.metadata?.collaborationMessages?.map(
                  (collab, collabIndex) => (
                    <div
                      key={`collab-${collabIndex}-${collab.employeeName}`}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback
                            className="text-[10px] font-semibold text-white"
                            style={{ backgroundColor: collab.employeeAvatar }}
                          >
                            {collab.employeeName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">
                          {collab.employeeName}
                        </span>
                        {collab.messageType && (
                          <Badge
                            variant="secondary"
                            className="h-4 text-[10px]"
                          >
                            {collab.messageType}
                          </Badge>
                        )}
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {collab.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Actions (show on hover) */}
          {!message.isStreaming && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
                isUser && 'flex-row-reverse'
              )}
            >
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCopy}
                      aria-label={copied ? 'Message copied' : 'Copy message'}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>

                {!isUser && onReact && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onReact(message.id, 'up')}
                          aria-label="Rate as good response"
                        >
                          <ThumbsUp
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Good response</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onReact(message.id, 'down')}
                          aria-label="Rate as poor response"
                        >
                          <ThumbsDown
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Poor response</TooltipContent>
                    </Tooltip>
                  </>
                )}

                {/* More actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="More message actions"
                    >
                      <MoreHorizontal
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isUser ? 'end' : 'start'}>
                    {onPin && (
                      <DropdownMenuItem onClick={() => onPin(message.id)}>
                        <Pin className="mr-2 h-4 w-4" aria-hidden="true" />
                        {message.metadata?.isPinned ? 'Unpin' : 'Pin'}
                      </DropdownMenuItem>
                    )}
                    {isUser && onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(message.id)}>
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {!isUser && onRegenerate && (
                      <DropdownMenuItem
                        onClick={() => onRegenerate(message.id)}
                      >
                        <RefreshCw
                          className="mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                        Regenerate
                      </DropdownMenuItem>
                    )}
                    {message.metadata?.tokensUsed && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          {message.metadata.tokensUsed.toLocaleString()} tokens
                          {message.metadata.model &&
                            ` · ${message.metadata.model}`}
                        </div>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(message.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
