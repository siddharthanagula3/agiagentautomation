import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Separator } from '@/shared/components/ui/separator';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import {
  Plus,
  Search,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount?: number;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  currentSessionId?: string;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    plan: string;
  };
}

export function ChatSidebar({
  isOpen,
  onToggle,
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  user,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(
    (session) =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
                <span className="text-sm font-bold text-white">MGX</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                AI Employees
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
          aria-label="Start a new chat conversation"
        >
          <Plus className="mr-2 h-4 w-4" />
          {isOpen && 'New Chat'}
        </Button>
      </div>

      {/* Search */}
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search chat conversations"
            />
          </div>
        </div>
      )}

      {/* Chat History */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {isOpen && (
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Recent Chats
            </div>
          )}
          {filteredSessions.length === 0 && isOpen && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <p>No conversations yet. Start a new chat to begin!</p>
            </div>
          )}
          {filteredSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                'w-full cursor-pointer rounded-lg p-3 text-left transition-colors',
                currentSessionId === session.id
                  ? 'border border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
              aria-label={`${isOpen ? `Select chat: ${session.title}` : 'Select chat'}`}
              aria-pressed={currentSessionId === session.id}
            >
              {isOpen ? (
                <div>
                  <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {session.title}
                  </div>
                  <div className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    {session.lastMessage}
                  </div>
                  <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {session.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* User Profile */}
      {user && (
        <>
          <Separator />
          <div className="p-4">
            {isOpen ? (
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user.plan} Plan
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1"
                  aria-label="Open settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </>
      )}

      {/* Help & Documentation */}
      {isOpen && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-600 dark:text-gray-400"
            onClick={() => window.open('https://docs.mgx.dev/', '_blank')}
            aria-label="Open documentation in new tab"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Documentation
          </Button>
        </div>
      )}
    </div>
  );
}
