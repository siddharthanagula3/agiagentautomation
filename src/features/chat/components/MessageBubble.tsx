import React, { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Copy, Check, User, Bot, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';
import { EmployeeWorkStream } from './EmployeeWorkStream';

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
  metadata?: {
    isDocument?: boolean;
    documentTitle?: string;
    hasWorkStream?: boolean;
    workStreamData?: any;
  };
}

interface MessageBubbleProps {
  message: Message;
}

// Custom code block component with copy button
const CodeBlock = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  inline?: boolean;
  className?: string;
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
    return <code className={className} {...props}>{children}</code>;
  }

  return (
    <div className="group relative">
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg bg-gray-900 p-4">
        {language && (
          <div className="mb-2 text-xs font-medium text-gray-400">
            {language}
          </div>
        )}
        <pre className="m-0">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};

// Custom markdown components
const markdownComponents: Components = {
  code: CodeBlock as any,
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 text-2xl font-bold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-5 text-xl font-semibold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-lg font-semibold">{children}</h3>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse border border-border">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border bg-muted p-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border p-2">{children}</td>
  ),
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [documentExpanded, setDocumentExpanded] = useState(false);
  const [workStreamExpanded, setWorkStreamExpanded] = useState(true);
  const isUser = message.role === 'user';
  const isDocument = message.metadata?.isDocument;
  const hasWorkStream = message.metadata?.hasWorkStream;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportDocument = () => {
    const blob = new Blob([message.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${message.metadata?.documentTitle || 'document'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const shouldShowInline = !isUser && !isDocument;
  const maxHeight = isDocument && !documentExpanded ? '300px' : 'none';

  return (
    <div className="group relative">
      <div
        className={cn(
          'flex gap-3 px-4 py-6',
          isUser ? 'justify-end' : 'justify-start',
          !isUser && 'hover:bg-muted/30 transition-colors'
        )}
      >
        {/* Avatar - only show for assistant messages */}
        {!isUser && (
          <div className="flex-shrink-0">
            {message.employeeAvatar || message.employeeName ? (
              <Avatar className="h-9 w-9">
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
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-md">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col',
            isUser ? 'max-w-[85%] items-end' : 'max-w-full items-start'
          )}
        >
          {/* Employee Name & Timestamp */}
          {!isUser && message.employeeName && (
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>{message.employeeName}</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-muted-foreground/70">{formatTime(message.timestamp)}</span>
            </div>
          )}

          {/* Document Header (if document) */}
          {isDocument && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">
                {message.metadata?.documentTitle || 'Document'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportDocument}
                className="h-7 px-2 text-xs"
              >
                <Download className="mr-1 h-3 w-3" />
                Export .md
              </Button>
            </div>
          )}

          {/* Message Bubble or Document Container */}
          <div
            className={cn(
              'w-full overflow-hidden',
              isUser
                ? 'rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 shadow-sm'
                : shouldShowInline
                  ? 'px-1'
                  : 'rounded-xl border border-border bg-card shadow-sm'
            )}
          >
            {/* Document View (scrollable, expandable) */}
            {isDocument ? (
              <ScrollArea
                className="w-full"
                style={{ maxHeight }}
              >
                <div className="px-4 py-3">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                      rehypePlugins={[rehypeHighlight, rehypeRaw]}
                      components={markdownComponents}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              /* Regular Message Content */
              <div className={cn('prose prose-sm dark:prose-invert max-w-none', !isUser && 'prose-p:leading-relaxed')}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-current" />
                )}
              </div>
            )}

            {/* Document Expand/Collapse Button */}
            {isDocument && message.content.length > 1000 && (
              <div className="border-t border-border bg-muted/30 px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDocumentExpanded(!documentExpanded)}
                  className="w-full text-xs"
                >
                  {documentExpanded ? (
                    <>
                      <ChevronUp className="mr-1 h-3 w-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-3 w-3" />
                      Show More
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Work Stream (Agent Collaboration) */}
          {hasWorkStream && message.metadata?.workStreamData && (
            <div className="mt-3 w-full">
              <div className="mb-2 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWorkStreamExpanded(!workStreamExpanded)}
                  className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {workStreamExpanded ? (
                    <>
                      <ChevronUp className="mr-1 h-3 w-3" />
                      Hide Work Process
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-3 w-3" />
                      Show Work Process
                    </>
                  )}
                </Button>
              </div>
              {workStreamExpanded && (
                <EmployeeWorkStream {...message.metadata.workStreamData} />
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className={cn('mt-2 flex items-center gap-1', isUser ? 'justify-end' : 'justify-start')}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              title="Copy message"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Timestamp for user messages */}
          {isUser && (
            <div className="mt-1 text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </div>
          )}
        </div>

        {/* User Avatar - only show for user messages */}
        {isUser && (
          <div className="flex-shrink-0">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 shadow-md">
                <User className="h-5 w-5 text-white" />
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  );
}
