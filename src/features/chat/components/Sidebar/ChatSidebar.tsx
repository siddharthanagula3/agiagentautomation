import React, { memo, useCallback, useMemo } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Separator } from '@shared/ui/separator';
import { Skeleton } from '@shared/ui/skeleton';
import { Plus, Search, MessageSquare, MoreHorizontal } from 'lucide-react';
import type { ChatSession } from '../../types';
import { ConversationListItem } from './ConversationListItem';
import { FolderManagement } from './FolderManagement';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  searchQuery: string;
  selectedFolderId?: string | null;
  isLoading?: boolean;
  onSearchChange: (query: string) => void;
  onNewChat: () => void;
  onSessionSelect: (session: ChatSession) => void;
  onSessionRename: (sessionId: string, newTitle: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onToggleSidebar: () => void;
  onSessionStar?: (sessionId: string) => void;
  onSessionPin?: (sessionId: string) => void;
  onSessionArchive?: (sessionId: string) => void;
  onSessionShare?: (sessionId: string) => void;
  onSessionDuplicate?: (sessionId: string) => void;
  onFolderSelect?: (folderId: string | null) => void;
  onMoveSessionToFolder?: (sessionId: string, folderId: string | null) => void;
}

/**
 * Skeleton loader for chat session items - memoized since it's static
 */
const SessionSkeleton = memo(function SessionSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
});

const ChatSidebarContent = memo(function ChatSidebarContent({
  sessions,
  currentSession,
  searchQuery,
  selectedFolderId,
  isLoading = false,
  onSearchChange,
  onNewChat,
  onSessionSelect,
  onSessionRename,
  onSessionDelete,
  onToggleSidebar,
  onSessionStar,
  onSessionPin,
  onSessionArchive,
  onSessionShare,
  onSessionDuplicate,
  onFolderSelect,
  onMoveSessionToFolder,
}: ChatSidebarProps) {
  // Memoize search change handler
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  // Memoize session count display
  const sessionCountText = useMemo(
    () => `${sessions.length} chat${sessions.length !== 1 ? 's' : ''}`,
    [sessions.length]
  );

  return (
    <div className="flex h-full flex-col bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          <Button onClick={onNewChat} className="w-full" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Folder Management */}
      {onFolderSelect && onMoveSessionToFolder && (
        <>
          <Separator />
          <div className="py-2">
            <FolderManagement
              selectedFolderId={selectedFolderId || null}
              onFolderSelect={onFolderSelect}
              onMoveSession={onMoveSessionToFolder}
            />
          </div>
          <Separator />
        </>
      )}

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <SessionSkeleton />
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-sm">No chat history yet</p>
            <p className="text-xs">Start a new conversation</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {sessions.map((session) => {
              // Safely convert updatedAt to Date object
              // Use a stable fallback (epoch start) to avoid impure Date.now() during render
              const updatedAt =
                session.updatedAt instanceof Date
                  ? session.updatedAt
                  : new Date(session.updatedAt || 0);

              // Validate date
              const safeUpdatedAt = isNaN(updatedAt.getTime())
                ? new Date()
                : updatedAt;

              return (
                <ConversationListItem
                  key={session.id}
                  id={session.id}
                  title={session.title}
                  summary={session.summary}
                  updatedAt={safeUpdatedAt}
                  totalMessages={session.messageCount}
                  isActive={currentSession?.id === session.id}
                  isStarred={session.metadata?.starred}
                  isPinned={session.metadata?.pinned}
                  isArchived={session.metadata?.archived}
                  tags={session.metadata?.tags || []}
                  onClick={() => onSessionSelect(session)}
                  onRename={() => onSessionRename(session.id, session.title)}
                  onDelete={() => onSessionDelete(session.id)}
                  onStar={
                    onSessionStar ? () => onSessionStar(session.id) : undefined
                  }
                  onPin={
                    onSessionPin ? () => onSessionPin(session.id) : undefined
                  }
                  onArchive={
                    onSessionArchive
                      ? () => onSessionArchive(session.id)
                      : undefined
                  }
                  onShare={
                    onSessionShare
                      ? () => onSessionShare(session.id)
                      : undefined
                  }
                  onDuplicate={
                    onSessionDuplicate
                      ? () => onSessionDuplicate(session.id)
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="text-center text-xs text-muted-foreground">
          {sessionCountText}
        </div>
      </div>
    </div>
  );
});

/**
 * ChatSidebar - Chat history sidebar with error boundary protection
 */
export const ChatSidebar: React.FC<ChatSidebarProps> = (props) => {
  return (
    <ErrorBoundary compact componentName="Chat Sidebar">
      <ChatSidebarContent {...props} />
    </ErrorBoundary>
  );
};
