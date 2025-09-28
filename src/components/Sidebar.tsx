import React, { useState, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Store,
  Users,
  BarChart3,
  Settings,
  History,
  Plus,
  ChevronDown,
  Search,
  Trash2,
  Pin,
  ChevronLeft,
  ChevronRight,
  Archive,
  Star,
  Clock,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { designTokens, animationPresets } from '@/lib/design-tokens';

export interface ConversationItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  lastMessage?: string;
  messageCount: number;
  pinned: boolean;
  starred: boolean;
  archived: boolean;
  model?: string;
  tokensUsed?: number;
  tags?: string[];
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  shortcut?: string;
  description?: string;
}

export interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
  conversations?: ConversationItem[];
  currentConversationId?: string;
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onPinConversation?: (id: string) => void;
  onArchiveConversation?: (id: string) => void;
  className?: string;
  'data-testid'?: string;
}

const Sidebar = ({
  collapsed,
  onCollapse,
  conversations = [],
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onPinConversation,
  onArchiveConversation,
  className,
  'data-testid': dataTestId = 'sidebar'
}: SidebarProps) => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [historyOpen, setHistoryOpen] = useState(true);
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [starredOpen, setStarredOpen] = useState(false);

  // Keyboard shortcuts
  useHotkeys('cmd+shift+n', (e) => {
    e.preventDefault();
    onNewChat?.();
  }, { enableOnFormTags: true });

  useHotkeys('cmd+b', (e) => {
    e.preventDefault();
    onCollapse();
  });

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter(conv =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [conversations, searchQuery]);

  const pinnedConversations = useMemo(() =>
    filteredConversations.filter(conv => conv.pinned && !conv.archived),
    [filteredConversations]
  );

  const starredConversations = useMemo(() =>
    filteredConversations.filter(conv => conv.starred && !conv.archived && !conv.pinned),
    [filteredConversations]
  );

  const recentConversations = useMemo(() =>
    filteredConversations.filter(conv => !conv.pinned && !conv.starred && !conv.archived)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [filteredConversations]
  );

  const handleConversationAction = useCallback((action: string, conversationId: string) => {
    switch (action) {
      case 'select':
        onSelectConversation?.(conversationId);
        break;
      case 'delete':
        onDeleteConversation?.(conversationId);
        break;
      case 'pin':
        onPinConversation?.(conversationId);
        break;
      case 'archive':
        onArchiveConversation?.(conversationId);
        break;
    }
  }, [onSelectConversation, onDeleteConversation, onPinConversation, onArchiveConversation]);

  const navigation: NavigationItem[] = [
    {
      name: 'Chat',
      href: '/',
      icon: MessageSquare,
      description: 'AI Assistant Chat',
      shortcut: ''
    },
    {
      name: 'Marketplace',
      href: '/marketplace',
      icon: Store,
      description: 'AI Employee Store',
      badge: conversations.filter(c => c.tags?.includes('marketplace')).length || undefined
    },
    {
      name: 'Workforce',
      href: '/workforce',
      icon: Users,
      description: 'AI Workforce Dashboard',
      badge: conversations.filter(c => c.tags?.includes('workforce')).length || undefined
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Usage Analytics'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'App Settings',
      shortcut: '⌘,'
    },
  ];


  const ConversationItem = ({ conversation, isActive }: { conversation: ConversationItem; isActive: boolean }) => (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.div
          className={cn(
            'group flex items-center gap-2 rounded-lg p-3 cursor-pointer transition-all',
            'hover:bg-sidebar-accent/50',
            isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
          )}
          onClick={() => handleConversationAction('select', conversation.id)}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {conversation.pinned && (
                <Pin className="h-3 w-3 text-workforce flex-shrink-0" aria-label="Pinned" />
              )}
              {conversation.starred && (
                <Star className="h-3 w-3 text-warning flex-shrink-0" aria-label="Starred" />
              )}
              <p className="text-sm font-medium truncate" title={conversation.title}>
                {conversation.title}
              </p>
            </div>
            {conversation.lastMessage && (
              <p className="text-xs text-muted-foreground truncate mb-1" title={conversation.lastMessage}>
                {conversation.lastMessage}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>{conversation.timestamp}</span>
              {conversation.messageCount > 0 && (
                <>
                  <span>•</span>
                  <span>{conversation.messageCount} messages</span>
                </>
              )}
              {conversation.model && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="h-4 px-1 text-xs">
                    {conversation.model}
                  </Badge>
                </>
              )}
            </div>
            {conversation.tags && conversation.tags.length > 0 && (
              <div className="flex gap-1 mt-1">
                {conversation.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="h-4 px-1 text-xs">
                    {tag}
                  </Badge>
                ))}
                {conversation.tags.length > 2 && (
                  <Badge variant="outline" className="h-4 px-1 text-xs">
                    +{conversation.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-error"
              onClick={(e) => {
                e.stopPropagation();
                handleConversationAction('delete', conversation.id);
              }}
              aria-label={`Delete conversation: ${conversation.title}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => handleConversationAction('select', conversation.id)}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Open
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleConversationAction('pin', conversation.id)}>
          <Pin className="mr-2 h-4 w-4" />
          {conversation.pinned ? 'Unpin' : 'Pin'}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleConversationAction('archive', conversation.id)}>
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => handleConversationAction('delete', conversation.id)}
          className="text-error focus:text-error"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  return (
    <TooltipProvider>
      <motion.div
        className={cn(
          'flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300',
          collapsed ? 'w-14' : 'w-64',
          className
        )}
        initial={false}
        animate={{ width: collapsed ? 56 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        data-testid={dataTestId}
        role="navigation"
        aria-label="Main navigation sidebar"
      >
        {/* New Chat Button */}
        <div className="p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  'w-full gap-2 justify-start bg-primary hover:bg-primary/90 shadow-lg',
                  collapsed && 'px-2 justify-center'
                )}
                onClick={onNewChat}
                aria-label="Start new chat conversation (⌘⇧N)"
              >
                <Plus className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span>New Chat</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-popover">
                <p>New Chat (⌘⇧N)</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Navigation */}
        <div className="px-3 py-2">
          <nav className="space-y-1" role="navigation" aria-label="Main navigation">
            {navigation.map((item) => {
              const isCurrentPage = location.pathname === item.href;
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isCurrentPage
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                          : 'text-sidebar-foreground',
                        collapsed && 'justify-center px-2'
                      )}
                      aria-current={isCurrentPage ? 'page' : undefined}
                      aria-label={collapsed ? `${item.name}: ${item.description}` : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="h-5 min-w-5 px-1 text-xs"
                              aria-label={`${item.badge} items`}
                            >
                              {item.badge > 99 ? '99+' : item.badge}
                            </Badge>
                          )}
                          {item.shortcut && (
                            <kbd className="text-xs text-muted-foreground">
                              {item.shortcut}
                            </kbd>
                          )}
                        </>
                      )}
                    </NavLink>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="bg-popover">
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                        {item.shortcut && (
                          <kbd className="text-xs mt-1">{item.shortcut}</kbd>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* Search and Conversation History */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="flex-1 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Search */}
              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4"
                    aria-label="Search conversations"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 px-3">
                <div className="space-y-2">
                  {/* Pinned Conversations */}
                  {pinnedConversations.length > 0 && (
                    <Collapsible open={pinnedOpen} onOpenChange={setPinnedOpen}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-2 text-sm font-medium"
                          aria-expanded={pinnedOpen}
                          aria-controls="pinned-conversations"
                        >
                          <div className="flex items-center gap-2">
                            <Pin className="h-4 w-4" aria-hidden="true" />
                            <span>Pinned ({pinnedConversations.length})</span>
                          </div>
                          <ChevronDown className={cn(
                            'h-4 w-4 transition-transform',
                            pinnedOpen && 'rotate-180'
                          )} aria-hidden="true" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1" id="pinned-conversations">
                        {pinnedConversations.map((conversation) => (
                          <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isActive={conversation.id === currentConversationId}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Starred Conversations */}
                  {starredConversations.length > 0 && (
                    <Collapsible open={starredOpen} onOpenChange={setStarredOpen}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-2 text-sm font-medium"
                          aria-expanded={starredOpen}
                          aria-controls="starred-conversations"
                        >
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" aria-hidden="true" />
                            <span>Starred ({starredConversations.length})</span>
                          </div>
                          <ChevronDown className={cn(
                            'h-4 w-4 transition-transform',
                            starredOpen && 'rotate-180'
                          )} aria-hidden="true" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1" id="starred-conversations">
                        {starredConversations.map((conversation) => (
                          <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isActive={conversation.id === currentConversationId}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Recent Conversations */}
                  <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-2 text-sm font-medium"
                        aria-expanded={historyOpen}
                        aria-controls="recent-conversations"
                      >
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4" aria-hidden="true" />
                          <span>Recent ({recentConversations.length})</span>
                        </div>
                        <ChevronDown className={cn(
                          'h-4 w-4 transition-transform',
                          historyOpen && 'rotate-180'
                        )} aria-hidden="true" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1" id="recent-conversations">
                      {recentConversations.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No conversations yet</p>
                          <p className="text-xs">Start a new chat to begin</p>
                        </div>
                      ) : (
                        recentConversations.map((conversation) => (
                          <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isActive={conversation.id === currentConversationId}
                          />
                        ))
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse button */}
        <div className="p-3 border-t border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCollapse}
                className="w-full"
                aria-label={collapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? 'right' : 'top'} className="bg-popover">
              <p>{collapsed ? 'Expand' : 'Collapse'} sidebar (⌘B)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
  )
};

export default Sidebar;