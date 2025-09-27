import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  User,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Pin,
  MoreHorizontal,
  ExternalLink,
  Code,
  FileText,
  Image as ImageIcon,
  Download,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { designTokens, animationPresets } from '@/lib/design-tokens';

export interface Citation {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output: unknown;
  status: 'running' | 'completed' | 'failed';
  executionTime?: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  thumbnail?: string;
}

export interface MessageBubbleProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  status?: 'sending' | 'sent' | 'error' | 'streaming';
  citations?: Citation[];
  toolCalls?: ToolCall[];
  attachments?: Attachment[];
  tokensUsed?: number;
  cost?: number;
  streamingContent?: string;
  isStreaming?: boolean;
  onCopy?: (content: string) => void;
  onEdit?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  onReaction?: (id: string, reaction: 'up' | 'down') => void;
  onPin?: (id: string) => void;
  className?: string;
  'data-testid'?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  role,
  content,
  timestamp,
  model,
  status = 'sent',
  citations = [],
  toolCalls = [],
  attachments = [],
  tokensUsed,
  cost,
  streamingContent,
  isStreaming = false,
  onCopy,
  onEdit,
  onRegenerate,
  onReaction,
  onPin,
  className,
  'data-testid': dataTestId = 'message-bubble'
}) => {
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedToolCall, setExpandedToolCall] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const displayContent = isStreaming && streamingContent ? streamingContent : content;
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const isSystem = role === 'system';

  // Sanitize HTML content for security
  const sanitizedContent = useMemo(() => {
    if (!displayContent) return '';
    return DOMPurify.sanitize(displayContent, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  }, [displayContent]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy?.(content);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleReaction = (reaction: 'up' | 'down') => {
    const newReaction = isLiked === (reaction === 'up') ? null : (reaction === 'up');
    setIsLiked(newReaction);
    onReaction?.(id, reaction);
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const renderCodeBlock = (code: string, language?: string) => (
    <div className="relative group">
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
        <code className={language ? `language-${language}` : ''}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );

  const renderToolCall = (toolCall: ToolCall) => (
    <Card key={toolCall.id} className="mt-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge
              variant={toolCall.status === 'completed' ? 'default' :
                      toolCall.status === 'running' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              <Code className="w-3 h-3 mr-1" />
              {toolCall.name}
            </Badge>
            {toolCall.status === 'running' && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          {toolCall.executionTime && (
            <span className="text-xs text-muted-foreground">
              {toolCall.executionTime}ms
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Input:</p>
            <pre className="text-xs bg-surface p-2 rounded overflow-x-auto">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>

          {toolCall.output && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedToolCall(
                  expandedToolCall === toolCall.id ? null : toolCall.id
                )}
                className="text-xs p-1 h-auto"
              >
                {expandedToolCall === toolCall.id ? 'Hide' : 'Show'} Output
              </Button>

              <AnimatePresence>
                {expandedToolCall === toolCall.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <pre className="text-xs bg-surface p-2 rounded mt-2 max-h-40 overflow-auto">
                      {typeof toolCall.output === 'string'
                        ? toolCall.output
                        : JSON.stringify(toolCall.output, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderAttachment = (attachment: Attachment) => {
    const isImage = attachment.type.startsWith('image/');
    const isAudio = attachment.type.startsWith('audio/');

    return (
      <div key={attachment.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
        <div className="flex-shrink-0">
          {isImage ? (
            <ImageIcon className="w-8 h-8 text-primary" />
          ) : isAudio ? (
            <Volume2 className="w-8 h-8 text-primary" />
          ) : (
            <FileText className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatFileSize(attachment.size)}</span>
            <span>•</span>
            <span>{attachment.type}</span>
          </div>
        </div>

        {attachment.url && (
          <div className="flex gap-1">
            {isAudio && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPlayingAudio(
                  playingAudio === attachment.id ? null : attachment.id
                )}
              >
                {playingAudio === attachment.id ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={attachment.url} download={attachment.name}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
      </div>
    );
  };

  // System message rendering
  if (isSystem) {
    return (
      <motion.div
        className="flex justify-center py-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        data-testid={`${dataTestId}-system`}
      >
        <div className="chat-bubble-system max-w-md text-center">
          <div
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            className="prose prose-sm dark:prose-invert max-w-none"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        'group flex gap-3 py-4 px-4 hover:bg-surface/30 transition-colors',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      data-testid={dataTestId}
      role="article"
      aria-label={`Message from ${isUser ? 'you' : model || 'assistant'} at ${timestamp}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className={cn(
          'h-8 w-8 ring-2 ring-transparent transition-all',
          isAssistant && 'ring-primary/20 hover:ring-primary/40',
          isUser && 'ring-primary/10'
        )}>
          {isUser ? (
            <>
              <AvatarImage src="/api/placeholder/32/32" alt="Your avatar" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback className="bg-agent text-agent-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          )}
        </Avatar>
      </div>

      {/* Message content */}
      <div className={cn(
        'flex-1 space-y-2 max-w-[85%]',
        isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'
      )}>
        {/* Message header */}
        <div className={cn(
          'flex items-center gap-2 text-xs text-muted-foreground',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}>
          <span className="font-medium">
            {isUser ? 'You' : model || 'Assistant'}
          </span>
          <span>•</span>
          <time dateTime={timestamp}>{timestamp}</time>

          <AnimatePresence>
            {status === 'sending' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge variant="secondary" className="animate-pulse">
                  Sending...
                </Badge>
              </motion.div>
            )}
            {status === 'streaming' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge variant="default" className="animate-pulse">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </Badge>
              </motion.div>
            )}
            {status === 'error' && (
              <Badge variant="destructive">
                Error
              </Badge>
            )}
          </AnimatePresence>
        </div>

        {/* Message bubble */}
        <div className={cn(
          'relative rounded-2xl px-4 py-3 break-words',
          isUser
            ? 'chat-bubble-user ml-auto'
            : 'chat-bubble-assistant mr-auto'
        )}>
          <div
            className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {/* Streaming cursor */}
          <AnimatePresence>
            {isStreaming && (
              <motion.span
                className="inline-block w-2 h-5 ml-1 bg-current animate-pulse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map(renderAttachment)}
            </div>
          )}

          {/* Tool calls */}
          {toolCalls.length > 0 && (
            <div className="mt-3 space-y-2">
              {toolCalls.map(renderToolCall)}
            </div>
          )}

          {/* Citations */}
          {citations.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Sources:</p>
              <div className="space-y-1">
                {citations.map((citation) => (
                  <a
                    key={citation.id}
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline p-2 rounded bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    {citation.favicon && (
                      <img
                        src={citation.favicon}
                        alt=""
                        className="w-4 h-4"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{citation.title}</p>
                      {citation.description && (
                        <p className="text-muted-foreground truncate">{citation.description}</p>
                      )}
                    </div>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Message metadata */}
        <AnimatePresence>
          {(tokensUsed || cost) && (
            <motion.div
              className={cn(
                'flex gap-3 text-xs text-muted-foreground',
                isUser ? 'flex-row-reverse' : 'flex-row'
              )}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {tokensUsed && (
                <span title={`${tokensUsed} tokens used`}>
                  {tokensUsed.toLocaleString()} tokens
                </span>
              )}
              {cost && (
                <span title={`Cost: $${cost.toFixed(6)}`}>
                  ${cost.toFixed(4)}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message actions */}
        <div className={cn(
          'flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
                aria-label="Copy message content"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? 'Copied!' : 'Copy message'}
            </TooltipContent>
          </Tooltip>

          {isUser && onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(id)}
                  aria-label="Edit message"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit message</TooltipContent>
            </Tooltip>
          )}

          {isAssistant && (
            <>
              {onRegenerate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onRegenerate(id)}
                      aria-label="Regenerate response"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerate</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-7 w-7',
                      isLiked === true && 'text-success bg-success/10'
                    )}
                    onClick={() => handleReaction('up')}
                    aria-label="Good response"
                    aria-pressed={isLiked === true}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Good response</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-7 w-7',
                      isLiked === false && 'text-error bg-error/10'
                    )}
                    onClick={() => handleReaction('down')}
                    aria-label="Poor response"
                    aria-pressed={isLiked === false}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Poor response</TooltipContent>
              </Tooltip>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isUser ? 'end' : 'start'}>
              {onPin && (
                <DropdownMenuItem onClick={() => onPin(id)}>
                  <Pin className="mr-2 h-4 w-4" />
                  Pin message
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-error focus:text-error">
                Report issue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;