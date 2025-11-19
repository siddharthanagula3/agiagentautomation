import React, { useState, useMemo } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  User,
  Bot,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Sparkles,
  Brain,
  Wrench,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';
import { EmployeeWorkStream } from './EmployeeWorkStream';
import { TokenUsageDisplay } from './TokenUsageDisplay';
import { MessageActions } from './MessageActions';
import { ImageAttachmentPreview } from './ImageAttachmentPreview';
import { TypingIndicator } from './TypingIndicator';
import { toast } from 'sonner';
import { ArtifactPreview } from './ArtifactPreview';
import {
  extractArtifacts,
  removeArtifactBlocks,
} from '../utils/artifact-detector';
import { useArtifactStore } from '@shared/stores/artifact-store';
import { employeeChatService } from '../services/employee-chat-service';
import { SearchResults } from './SearchResults';
import type { SearchResponse } from '@core/integrations/web-search-handler';
import type { MediaGenerationResult } from '@core/integrations/media-generation-handler';
import type { GeneratedDocument } from '../services/document-generation-service';
import { documentGenerationService } from '../services/document-generation-service';

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
    // Token tracking metadata
    tokensUsed?: number;
    inputTokens?: number;
    outputTokens?: number;
    model?: string;
    cost?: number;
    // Employee selection metadata
    selectionReason?: string;
    thinkingSteps?: string[];
    isThinking?: boolean;
    isStreaming?: boolean; // Streaming indicator
    // Multi-agent collaboration metadata
    isCollaboration?: boolean;
    collaborationType?: 'contribution' | 'discussion' | 'synthesis';
    collaborationTo?: string;
    isMultiAgent?: boolean;
    employeesInvolved?: string[];
    isSynthesis?: boolean;
    // Web search metadata
    searchResults?: SearchResponse;
    isSearching?: boolean;
    // Tool result metadata
    toolResult?: boolean;
    toolType?: string;
    imageUrl?: string;
    imageData?: MediaGenerationResult;
    videoUrl?: string;
    thumbnailUrl?: string;
    videoData?: MediaGenerationResult;
    documentData?: GeneratedDocument;
    documentTitle?: string;
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
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
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
  code: CodeBlock as React.ComponentType<
    React.HTMLAttributes<HTMLElement> & { inline?: boolean }
  >,
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

// Updated: Nov 16th 2025 - Added React.memo for performance
export const MessageBubble = React.memo(function MessageBubble({
  message,
  onEdit,
  onRegenerate,
  onDelete,
  onPin,
  onReact,
}: MessageBubbleProps) {
  const [documentExpanded, setDocumentExpanded] = useState(false);
  const [workStreamExpanded, setWorkStreamExpanded] = useState(true);
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const isUser = message.role === 'user';
  const isDocument = message.metadata?.isDocument;
  const hasWorkStream = message.metadata?.hasWorkStream;
  const isThinking = message.metadata?.isThinking;
  const hasThinkingSteps =
    message.metadata?.thinkingSteps &&
    message.metadata.thinkingSteps.length > 0;

  // Artifact detection and management
  const { addArtifact, shareArtifact, setCurrentVersion, getMessageArtifacts } =
    useArtifactStore();

  // Extract artifacts from message content (only for assistant messages)
  const artifacts = useMemo(() => {
    if (isUser) return [];

    // Check if we already have artifacts for this message
    const existingArtifacts = getMessageArtifacts(message.id);
    if (existingArtifacts.length > 0) {
      return existingArtifacts;
    }

    // Extract new artifacts
    const newArtifacts = extractArtifacts(message.content);

    // Store artifacts in the store
    newArtifacts.forEach((artifact) => {
      addArtifact(message.id, artifact);
    });

    return newArtifacts;
  }, [message.id, message.content, isUser, getMessageArtifacts, addArtifact]);

  // Remove artifact code blocks from content to avoid duplication
  const cleanedContent = useMemo(() => {
    if (artifacts.length === 0) return message.content;
    return removeArtifactBlocks(message.content, artifacts);
  }, [message.content, artifacts]);

  const handleShareArtifact = async (artifactId: string) => {
    try {
      const shareId = await shareArtifact(message.id, artifactId);
      // In production, copy share URL to clipboard
      const shareUrl = `${window.location.origin}/artifact/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Artifact link copied to clipboard');
    } catch (error) {
      console.error('Failed to share artifact:', error);
    }
  };

  const handleVersionChange = (artifactId: string, versionIndex: number) => {
    setCurrentVersion(message.id, artifactId, versionIndex);
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

  const handleExportPDF = async () => {
    try {
      const generatedDoc: GeneratedDocument = {
        title: message.metadata?.documentTitle || 'Document',
        content: message.content,
        metadata: {
          type: 'general',
          generatedAt: message.timestamp,
          wordCount: message.content.split(/\s+/).length,
          tokensUsed: message.metadata?.tokensUsed,
          model: message.metadata?.model,
        },
      };
      await documentGenerationService.exportDocumentToPDF(generatedDoc);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleExportDOCX = async () => {
    try {
      const generatedDoc: GeneratedDocument = {
        title: message.metadata?.documentTitle || 'Document',
        content: message.content,
        metadata: {
          type: 'general',
          generatedAt: message.timestamp,
          wordCount: message.content.split(/\s+/).length,
          tokensUsed: message.metadata?.tokensUsed,
          model: message.metadata?.model,
        },
      };
      await documentGenerationService.exportDocumentToDOCX(generatedDoc);
      toast.success('DOCX exported successfully');
    } catch (error) {
      console.error('DOCX export failed:', error);
      toast.error('Failed to export DOCX');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const shouldShowInline = !isUser && !isDocument;
  const maxHeight = isDocument && !documentExpanded ? '300px' : 'none';

  // Get employee initials for avatar fallback
  const employeeInitials = message.employeeName
    ? employeeChatService.getEmployeeInitials(message.employeeName)
    : 'AI';

  // Get employee color
  const employeeColor =
    message.employeeAvatar ||
    employeeChatService.getEmployeeAvatar(message.employeeName || '');

  return (
    <div className="group relative">
      <div
        className={cn(
          'flex gap-3 px-4 py-6',
          isUser ? 'justify-end' : 'justify-start',
          !isUser && 'transition-colors hover:bg-muted/30'
        )}
      >
        {/* Avatar - only show for assistant messages */}
        {!isUser && (
          <div className="flex-shrink-0">
            <Avatar
              className="h-9 w-9 ring-2 ring-offset-1"
              style={{ ringColor: employeeColor }}
            >
              <AvatarImage
                src={
                  typeof message.employeeAvatar === 'string' &&
                  message.employeeAvatar.startsWith('/')
                    ? message.employeeAvatar
                    : undefined
                }
              />
              <AvatarFallback
                className="text-xs font-semibold text-white"
                style={{
                  backgroundColor: employeeColor,
                }}
              >
                {employeeInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col',
            isUser ? 'max-w-[85%] items-end' : 'max-w-full items-start'
          )}
        >
          {/* Employee Name, Badge & Timestamp */}
          {!isUser && message.employeeName && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold"
                  style={{ color: employeeColor }}
                >
                  {message.employeeName
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>
                {message.metadata?.selectionReason &&
                  !message.metadata?.isCollaboration && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: employeeColor }}
                    >
                      <Sparkles className="mr-0.5 inline-block h-2.5 w-2.5" />
                      {message.metadata.selectionReason}
                    </span>
                  )}
                {message.metadata?.isCollaboration && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor:
                        message.metadata.collaborationType === 'synthesis'
                          ? '#4f46e5'
                          : employeeColor,
                      color: 'white',
                    }}
                  >
                    {message.metadata.collaborationType === 'contribution' &&
                      '💭 Contribution'}
                    {message.metadata.collaborationType === 'discussion' &&
                      '💬 Discussion'}
                    {message.metadata.collaborationType === 'synthesis' &&
                      '📋 Final Synthesis'}
                  </span>
                )}
                {message.metadata?.isMultiAgent &&
                  message.metadata?.employeesInvolved && (
                    <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      🤝 Team of {message.metadata.employeesInvolved.length}
                    </span>
                  )}
                {message.metadata?.collaborationTo && (
                  <span className="text-[10px] text-muted-foreground">
                    → {message.metadata.collaborationTo}
                  </span>
                )}
              </div>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-muted-foreground/70">
                {formatTime(message.timestamp)}
              </span>
              {message.metadata?.model && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {message.metadata.model}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Document Header (if document) */}
          {isDocument && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">
                {message.metadata?.documentTitle || 'Document'}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportDocument}
                  className="h-7 px-2 text-xs"
                  title="Export as Markdown"
                >
                  <Download className="mr-1 h-3 w-3" />
                  .md
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportPDF}
                  className="h-7 px-2 text-xs"
                  title="Export as PDF"
                >
                  <Download className="mr-1 h-3 w-3" />
                  .pdf
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportDOCX}
                  className="h-7 px-2 text-xs"
                  title="Export as DOCX"
                >
                  <Download className="mr-1 h-3 w-3" />
                  .docx
                </Button>
              </div>
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
              <ScrollArea className="w-full" style={{ maxHeight }}>
                <div className="px-4 py-3">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                      rehypePlugins={[rehypeHighlight, rehypeRaw]}
                      components={markdownComponents}
                    >
                      {cleanedContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              /* Regular Message Content */
              <div
                className={cn(
                  'prose prose-sm dark:prose-invert max-w-none',
                  !isUser && 'prose-p:leading-relaxed'
                )}
              >
                {/* Show typing indicator when streaming with no content */}
                {message.isStreaming && !cleanedContent.trim() ? (
                  <TypingIndicator
                    agentName={message.employeeName || 'AI Assistant'}
                  />
                ) : (
                  <>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                      rehypePlugins={[rehypeHighlight, rehypeRaw]}
                      components={markdownComponents}
                    >
                      {cleanedContent}
                    </ReactMarkdown>
                    {/* Show cursor when streaming with content */}
                    {message.isStreaming && cleanedContent.trim() && (
                      <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-current" />
                    )}
                  </>
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

          {/* Image Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <ImageAttachmentPreview attachments={message.attachments} />
          )}

          {/* Artifacts - Live Interactive Previews (Claude Artifacts-like) */}
          {!isUser && artifacts.length > 0 && (
            <div className="mt-3 w-full space-y-3">
              {artifacts.map((artifact) => (
                <ArtifactPreview
                  key={artifact.id}
                  artifact={artifact}
                  onVersionChange={(versionIndex) =>
                    handleVersionChange(artifact.id, versionIndex)
                  }
                  onShare={() => handleShareArtifact(artifact.id)}
                />
              ))}
            </div>
          )}

          {/* Image Generation Result */}
          {!isUser &&
            message.metadata?.toolType === 'image-generation' &&
            message.metadata?.imageUrl && (
              <div className="mt-3 w-full">
                <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">
                        Generated Image
                      </span>
                    </div>
                    {message.metadata?.imageData && (
                      <div className="text-xs text-muted-foreground">
                        {message.metadata.imageData.metadata.aspectRatio} •{' '}
                        {message.metadata.imageData.model}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={message.metadata.imageUrl}
                      alt={
                        message.metadata?.imageData?.prompt || 'Generated image'
                      }
                      className="h-auto max-h-[600px] w-full object-contain"
                    />
                  </div>
                  {message.metadata?.imageData?.images &&
                    message.metadata.imageData.images.length > 1 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {message.metadata.imageData.images
                          .slice(1)
                          .map((img, idx) => (
                            <div
                              key={idx}
                              className="overflow-hidden rounded-lg border border-border"
                            >
                              <img
                                src={img.url}
                                alt={`Variant ${idx + 2}`}
                                className="h-auto w-full object-contain"
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = message.metadata!.imageUrl!;
                        a.download = 'generated-image.png';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="h-8 text-xs"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          message.metadata!.imageUrl!
                        );
                        toast.success('Image URL copied');
                      }}
                      className="h-8 text-xs"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copy URL
                    </Button>
                  </div>
                </div>
              </div>
            )}

          {/* Video Generation Result */}
          {!isUser &&
            message.metadata?.toolType === 'video-generation' &&
            message.metadata?.videoUrl && (
              <div className="mt-3 w-full">
                <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-pink-500" />
                      <span className="text-sm font-medium">
                        Generated Video
                      </span>
                    </div>
                    {message.metadata?.videoData && (
                      <div className="text-xs text-muted-foreground">
                        {message.metadata.videoData.metadata.duration}s •{' '}
                        {message.metadata.videoData.metadata.resolution} •{' '}
                        {message.metadata.videoData.model}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden rounded-lg bg-black">
                    <video
                      src={message.metadata.videoUrl}
                      controls
                      poster={message.metadata?.thumbnailUrl}
                      className="h-auto w-full"
                      style={{ maxHeight: '600px' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = message.metadata!.videoUrl!;
                        a.download = 'generated-video.mp4';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="h-8 text-xs"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          message.metadata!.videoUrl!
                        );
                        toast.success('Video URL copied');
                      }}
                      className="h-8 text-xs"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copy URL
                    </Button>
                  </div>
                </div>
              </div>
            )}

          {/* Web Search Results */}
          {!isUser && message.metadata?.searchResults && (
            <div className="mt-3 w-full">
              <SearchResults
                searchResponse={message.metadata.searchResults}
                showAnswer={true}
              />
            </div>
          )}

          {/* Thinking Process Display */}
          {hasThinkingSteps && (
            <div className="mt-3 w-full">
              <div className="mb-2 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setThinkingExpanded(!thinkingExpanded)}
                  className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {thinkingExpanded ? (
                    <>
                      <ChevronUp className="mr-1 h-3 w-3" />
                      Hide Thinking Process
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-3 w-3" />
                      <Brain className="mr-1 h-3 w-3" />
                      Show Thinking Process
                    </>
                  )}
                </Button>
              </div>
              {thinkingExpanded && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Brain className="h-3.5 w-3.5" />
                    Reasoning Steps
                  </div>
                  <div className="space-y-2">
                    {message.metadata?.thinkingSteps?.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <div
                          className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                          style={{ backgroundColor: employeeColor }}
                        >
                          {index + 1}
                        </div>
                        <span className="flex-1 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Work Stream - HIDDEN (not implemented yet) */}
          {/* TODO: Implement work stream visualization before enabling
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
          */}

          {/* Action Buttons & Token Usage */}
          <div
            className={cn(
              'mt-2 flex items-center gap-2',
              isUser ? 'justify-end' : 'justify-between'
            )}
          >
            {/* Token Usage Display (for assistant messages) */}
            {!isUser && message.metadata?.tokensUsed && (
              <TokenUsageDisplay
                tokensUsed={message.metadata.tokensUsed}
                inputTokens={message.metadata.inputTokens}
                outputTokens={message.metadata.outputTokens}
                model={message.metadata.model}
                cost={message.metadata.cost}
              />
            )}

            {/* Message Actions */}
            <MessageActions
              messageId={message.id}
              content={message.content}
              isUser={isUser}
              isPinned={message.metadata?.isPinned}
              reactions={message.reactions}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              onDelete={onDelete}
              onPin={onPin}
              onReact={onReact}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            />
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
});
