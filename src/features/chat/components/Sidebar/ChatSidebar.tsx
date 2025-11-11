import React from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Separator } from '@shared/ui/separator';
import { Badge } from '@shared/ui/badge';
import {
  Plus,
  Search,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react';
import type { ChatSession } from '../../types';
import { ConversationListItem } from '../ConversationListItem';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  searchQuery: string;
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
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  currentSession,
  searchQuery,
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
}) => {
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {sessions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-sm">No chat history yet</p>
              <p className="text-xs">Start a new conversation</p>
            </div>
          ) : (
            sessions.map((session) => (
              <ConversationListItem
                key={session.id}
                id={session.id}
                title={session.title}
                summary={session.summary}
                updatedAt={new Date(session.updatedAt)}
                totalMessages={session.messageCount}
                isActive={currentSession?.id === session.id}
                isStarred={session.metadata?.starred}
                isPinned={session.metadata?.pinned}
                isArchived={session.metadata?.archived}
                tags={session.metadata?.tags || []}
                onClick={() => onSessionSelect(session)}
                onRename={() => onSessionRename(session.id, session.title)}
                onDelete={() => onSessionDelete(session.id)}
                onStar={onSessionStar ? () => onSessionStar(session.id) : undefined}
                onPin={onSessionPin ? () => onSessionPin(session.id) : undefined}
                onArchive={onSessionArchive ? () => onSessionArchive(session.id) : undefined}
                onShare={onSessionShare ? () => onSessionShare(session.id) : undefined}
                onDuplicate={onSessionDuplicate ? () => onSessionDuplicate(session.id) : undefined}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="text-center text-xs text-muted-foreground">
          {sessions.length} chat{sessions.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};
