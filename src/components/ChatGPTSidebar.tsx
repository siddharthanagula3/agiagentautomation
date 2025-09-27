import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Edit3,
  Share,
  PanelLeft,
  Bot,
  Users,
  Store,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isActive?: boolean;
}

interface ChatGPTSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNewChat?: () => void;
  conversations?: Conversation[];
  activeConversationId?: string;
  onConversationSelect?: (id: string) => void;
  onNavigate?: (path: string) => void;
}

const ChatGPTSidebar: React.FC<ChatGPTSidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  onNewChat,
  conversations = [],
  activeConversationId,
  onConversationSelect,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const defaultConversations: Conversation[] = conversations.length > 0 ? conversations : [
    {
      id: '1',
      title: 'AGI Agent Automation Help',
      lastMessage: 'How can I deploy AI workforce?',
      timestamp: 'Today',
      isActive: true
    },
    {
      id: '2',
      title: 'Marketplace Integration',
      lastMessage: 'Best AI employees for data analysis',
      timestamp: 'Yesterday'
    },
    {
      id: '3',
      title: 'API Documentation',
      lastMessage: 'Setting up webhooks',
      timestamp: '2 days ago'
    }
  ];

  const navigationItems = [
    { icon: Bot, label: 'AI Chat', path: '/', isActive: true },
    { icon: Store, label: 'Marketplace', path: '/marketplace' },
    { icon: Users, label: 'Workforce', path: '/workforce' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help', path: '/help' }
  ];

  if (collapsed) {
    return (
      <div className="w-12 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-8 h-8 p-0"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col gap-1 p-2">
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.(item.path)}
              className={cn(
                "w-8 h-8 p-0",
                item.isActive && "bg-gray-200 dark:bg-gray-800"
              )}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-1"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>

          <Button
            onClick={onNewChat}
            size="sm"
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="grid gap-1">
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.(item.path)}
              className={cn(
                "justify-start gap-3 h-9",
                item.isActive && "bg-gray-200 dark:bg-gray-800"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
            Recent
          </div>

          {defaultConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group relative rounded-lg p-3 mb-1 cursor-pointer transition-colors",
                conversation.id === activeConversationId || conversation.isActive
                  ? "bg-gray-200 dark:bg-gray-800"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800/50"
              )}
              onClick={() => onConversationSelect?.(conversation.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <h4 className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                      {conversation.title}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                    {conversation.lastMessage}
                  </p>
                  <span className="text-xs text-gray-400">
                    {conversation.timestamp}
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 ml-2"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center gap-2 text-xs">
                      <Edit3 className="h-3 w-3" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 text-xs">
                      <Share className="h-3 w-3" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 text-xs text-red-600">
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">AGI Agent Automation</span>
          <br />
          Build your AI workforce
        </div>
      </div>
    </div>
  );
};

export default ChatGPTSidebar;