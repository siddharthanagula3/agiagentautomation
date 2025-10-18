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
  Trash2,
  Edit3,
  Pin,
} from 'lucide-react';
import type { ChatSession } from '../../types';

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
              <div
                key={session.id}
                className={`group relative cursor-pointer rounded-lg border p-3 transition-all hover:bg-accent ${
                  currentSession?.id === session.id
                    ? 'border-primary/20 bg-accent'
                    : 'border-border hover:border-primary/20'
                }`}
                onClick={() => onSessionSelect(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium">
                      {session.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {session.messageCount} messages
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement pin functionality
                      }}
                    >
                      <Pin className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement rename functionality
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionDelete(session.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
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
