import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  user
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MGX</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">AI Employees</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2"
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button 
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isOpen && "New Chat"}
        </Button>
      </div>

      {/* Search */}
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Chat History */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {isOpen && (
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Recent Chats
            </div>
          )}
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                "p-3 rounded-lg cursor-pointer transition-colors",
                currentSessionId === session.id
                  ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              {isOpen ? (
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {session.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    {session.lastMessage}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {session.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </div>
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
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user.plan} Plan
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="p-1">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </>
      )}

      {/* Help & Documentation */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-600 dark:text-gray-400"
            onClick={() => window.open('https://docs.mgx.dev/', '_blank')}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Documentation
          </Button>
        </div>
      )}
    </div>
  );
}
