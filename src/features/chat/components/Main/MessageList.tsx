import React, { memo, useCallback, useState } from 'react';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Loader2, Bot } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { MessageBubble } from '../messages/MessageBubble';
import { EmployeeThinkingIndicator } from '../agents/EmployeeThinkingIndicator';
import { useChatStore } from '@shared/stores/chat-store';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import { Button } from '@shared/ui/button';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/ui/dialog';
import { Textarea } from '@shared/ui/textarea';

/**
 * Type-safe interface for message metadata fields
 * Includes tool-related fields for inline display
 */
interface MessageMetadata {
  employeeId?: string;
  employeeName?: string;
  employeeAvatar?: string;
  inputTokens?: number;
  outputTokens?: number;
  tokens?: number;
  tokensUsed?: number;
  model?: string;
  cost?: number;
  isPinned?: boolean;
  selectionReason?: string;
  thinkingSteps?: string[];
  isThinking?: boolean;
  isSearching?: boolean;
  isToolProcessing?: boolean;
  // Tool execution result fields for inline display
  toolType?: string;
  toolResult?: unknown;
  imageUrl?: string;
  imageData?: { url?: string; base64?: string; prompt?: string };
  videoUrl?: string;
  thumbnailUrl?: string;
  videoData?: { url?: string; thumbnailUrl?: string; duration?: number };
  searchResults?: Array<{ title: string; url: string; snippet: string }>;
  documentData?: { title?: string; content?: string; format?: string };
  downloadData?: { filename: string; content: string; contentType: string };
}

/**
 * Type guard to safely extract metadata from ChatMessage
 * Returns a validated MessageMetadata object with proper types
 */
function getValidatedMetadata(
  metadata: Record<string, unknown> | undefined
): MessageMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const result: MessageMetadata = {};

  // String fields
  if (typeof metadata.employeeId === 'string') {
    result.employeeId = metadata.employeeId;
  }
  if (typeof metadata.employeeName === 'string') {
    result.employeeName = metadata.employeeName;
  }
  if (typeof metadata.employeeAvatar === 'string') {
    result.employeeAvatar = metadata.employeeAvatar;
  }
  if (typeof metadata.model === 'string') {
    result.model = metadata.model;
  }
  if (typeof metadata.selectionReason === 'string') {
    result.selectionReason = metadata.selectionReason;
  }

  // Number fields
  if (typeof metadata.inputTokens === 'number') {
    result.inputTokens = metadata.inputTokens;
  }
  if (typeof metadata.outputTokens === 'number') {
    result.outputTokens = metadata.outputTokens;
  }
  if (typeof metadata.tokens === 'number') {
    result.tokens = metadata.tokens;
  }
  if (typeof metadata.tokensUsed === 'number') {
    result.tokensUsed = metadata.tokensUsed;
  }
  if (typeof metadata.cost === 'number') {
    result.cost = metadata.cost;
  }

  // Boolean fields
  if (typeof metadata.isPinned === 'boolean') {
    result.isPinned = metadata.isPinned;
  }
  if (typeof metadata.isThinking === 'boolean') {
    result.isThinking = metadata.isThinking;
  }
  if (typeof metadata.isSearching === 'boolean') {
    result.isSearching = metadata.isSearching;
  }
  if (typeof metadata.isToolProcessing === 'boolean') {
    result.isToolProcessing = metadata.isToolProcessing;
  }

  // Array fields
  if (
    Array.isArray(metadata.thinkingSteps) &&
    metadata.thinkingSteps.every((step) => typeof step === 'string')
  ) {
    result.thinkingSteps = metadata.thinkingSteps;
  }

  // Tool execution result fields for inline display
  if (typeof metadata.toolType === 'string') {
    result.toolType = metadata.toolType;
  }
  if (metadata.toolResult !== undefined) {
    result.toolResult = metadata.toolResult;
  }
  if (typeof metadata.imageUrl === 'string') {
    result.imageUrl = metadata.imageUrl;
  }
  if (metadata.imageData && typeof metadata.imageData === 'object') {
    result.imageData = metadata.imageData as MessageMetadata['imageData'];
  }
  if (typeof metadata.videoUrl === 'string') {
    result.videoUrl = metadata.videoUrl;
  }
  if (typeof metadata.thumbnailUrl === 'string') {
    result.thumbnailUrl = metadata.thumbnailUrl;
  }
  if (metadata.videoData && typeof metadata.videoData === 'object') {
    result.videoData = metadata.videoData as MessageMetadata['videoData'];
  }
  if (Array.isArray(metadata.searchResults)) {
    result.searchResults = metadata.searchResults as MessageMetadata['searchResults'];
  }
  if (metadata.documentData && typeof metadata.documentData === 'object') {
    result.documentData = metadata.documentData as MessageMetadata['documentData'];
  }
  if (metadata.downloadData && typeof metadata.downloadData === 'object') {
    result.downloadData = metadata.downloadData as MessageMetadata['downloadData'];
  }

  return result;
}

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

const MessageListComponent: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onRegenerate,
  onEdit,
  onDelete,
}) => {
  const reactToMessage = useChatStore((state) => state.reactToMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleEdit = useCallback(
    (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      setEditingMessageId(messageId);
      setEditContent(message.content);
      setEditDialogOpen(true);
    },
    [messages]
  );

  const handleEditSave = useCallback(() => {
    if (editingMessageId && editContent.trim()) {
      onEdit(editingMessageId, editContent.trim());
    }
    setEditDialogOpen(false);
    setEditingMessageId(null);
    setEditContent('');
  }, [editingMessageId, editContent, onEdit]);

  const handleEditCancel = useCallback(() => {
    setEditDialogOpen(false);
    setEditingMessageId(null);
    setEditContent('');
  }, []);

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
    <ErrorBoundary
      fallback={
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">
              Message Display Error
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Something went wrong displaying the chat messages.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Reload Chat
            </Button>
          </div>
        </div>
      }
    >
      <ScrollArea className="flex-1">
        <div className="space-y-0">
          {messages.map((message) => {
            // Ensure createdAt is a Date object
            const timestamp =
              message.createdAt instanceof Date
                ? message.createdAt
                : new Date(message.createdAt || Date.now());

            // Get validated metadata using type guard
            const meta = getValidatedMetadata(message.metadata);

            // Check if this is a thinking/processing indicator message
            if (meta.isThinking || meta.isSearching || meta.isToolProcessing) {
              return (
                <EmployeeThinkingIndicator
                  key={message.id}
                  employeeName={meta.employeeName}
                  employeeAvatar={meta.employeeAvatar}
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
                  employeeId: meta.employeeId,
                  employeeName: meta.employeeName,
                  employeeAvatar: meta.employeeAvatar,
                  reactions: [],
                  metadata: {
                    tokensUsed: meta.tokens ?? meta.tokensUsed,
                    inputTokens: meta.inputTokens,
                    outputTokens: meta.outputTokens,
                    model: meta.model,
                    cost: meta.cost,
                    isPinned: meta.isPinned,
                    selectionReason: meta.selectionReason,
                    thinkingSteps: meta.thinkingSteps,
                    // Tool execution result fields for inline display
                    toolType: meta.toolType,
                    toolResult: meta.toolResult,
                    imageUrl: meta.imageUrl,
                    imageData: meta.imageData,
                    videoUrl: meta.videoUrl,
                    thumbnailUrl: meta.thumbnailUrl,
                    videoData: meta.videoData,
                    searchResults: meta.searchResults,
                    documentData: meta.documentData,
                    downloadData: meta.downloadData,
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
          {isLoading &&
            messages.every(
              (m) => !getValidatedMetadata(m.metadata).isThinking
            ) && (
              <EmployeeThinkingIndicator message="Processing your request..." />
            )}
        </div>
      </ScrollArea>

      {/* Edit Message Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your message..."
              className="min-h-[150px] resize-y"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleEditCancel}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={!editContent.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};

// Memoize the component to prevent unnecessary re-renders when parent state changes
// This is important since MessageList can render 1000+ messages
export const MessageList = memo(MessageListComponent);
