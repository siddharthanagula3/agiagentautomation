import React, { useState, useCallback, useEffect } from 'react';
import { Bot, Menu, Plus, Settings, User, Bell, Zap, Command, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { designTokens, animationPresets } from '@/lib/design-tokens';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'pro' | 'enterprise';
  tokensPerMessage: number;
  enabled: boolean;
}

export interface HeaderProps {
  user?: User;
  onMenuToggle?: () => void;
  tokenBalance?: number;
  notifications?: NotificationItem[];
  models?: ModelOption[];
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  onNewChat?: () => void;
  className?: string;
  'data-testid'?: string;
}

const Header = ({
  user = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    plan: 'pro'
  },
  onMenuToggle,
  tokenBalance = 1250,
  notifications = [],
  models = [
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model', tier: 'pro', tokensPerMessage: 100, enabled: true },
    { id: 'claude-3', name: 'Claude-3', description: 'Excellent reasoning', tier: 'pro', tokensPerMessage: 120, enabled: true },
    { id: 'gpt-3.5', name: 'GPT-3.5', description: 'Fast and efficient', tier: 'free', tokensPerMessage: 50, enabled: true }
  ],
  selectedModel = 'gpt-4',
  onModelChange,
  onNewChat,
  className,
  'data-testid': dataTestId = 'header'
}: HeaderProps) => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();

  // Keyboard shortcuts
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setCommandPaletteOpen(true);
  }, { enableOnFormTags: true });

  useHotkeys('mod+shift+n', (e) => {
    e.preventDefault();
    onNewChat?.();
  });

  const handleModelChange = useCallback((modelId: string) => {
    onModelChange?.(modelId);
  }, [onModelChange]);

  const currentModel = models.find(m => m.id === selectedModel);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const navLinks = [
    { path: '/', label: 'Chat', shortcut: '' },
    { path: '/marketplace', label: 'Marketplace', shortcut: '' },
    { path: '/workforce', label: 'Workforce', shortcut: '' },
    { path: '/pricing', label: 'Pricing', shortcut: '' },
    { path: '/docs', label: 'Docs', shortcut: '' },
    { path: '/about', label: 'About', shortcut: '' }
  ];

  return (
    <>
      <motion.header
        className={cn(
          'sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          className
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        data-testid={dataTestId}
        role="banner"
        aria-label="Main navigation header"
      >
        <div className="flex h-16 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={false}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
          
          <Link
            to="/"
            className="flex items-center gap-2 group"
            aria-label="AGI Agent Automation home"
          >
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bot className="h-5 w-5" aria-hidden="true" />
            </motion.div>
            <div className="hidden sm:block">
              <motion.h1
                className="text-xl font-bold bg-gradient-to-r from-primary to-agent bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                AGI Agent Automation
              </motion.h1>
            </div>
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === link.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center section - Model selector & Command palette */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCommandPaletteOpen(true)}
            className="gap-2 min-w-[200px] justify-between text-muted-foreground"
            aria-label="Open command palette"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search or run command...</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium">
                <Command className="h-3 w-3" />
                K
              </kbd>
            </div>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                aria-label={`Current model: ${currentModel?.name || 'Unknown'}. Click to change model.`}
              >
                <Zap className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">{currentModel?.name || 'Select Model'}</span>
                <span className="lg:hidden">{currentModel?.name?.split('-')[0] || 'Model'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64">
              <DropdownMenuLabel>AI Models</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  disabled={!model.enabled}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description} • {model.tokensPerMessage} tokens/msg
                    </span>
                  </div>
                  <Badge
                    variant={model.tier === 'free' ? 'outline' : 'secondary'}
                    className={cn(
                      model.tier === 'pro' && 'bg-primary text-primary-foreground',
                      model.tier === 'enterprise' && 'bg-workforce text-workforce-foreground'
                    )}
                  >
                    {model.tier}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Token balance */}
          <motion.div
            className="hidden sm:flex items-center gap-1 rounded-lg bg-surface px-3 py-2 border transition-colors hover:border-workforce/50"
            whileHover={{ scale: 1.02 }}
            aria-label={`Token balance: ${tokenBalance.toLocaleString()} tokens remaining`}
          >
            <Zap className="h-4 w-4 text-workforce" aria-hidden="true" />
            <span className="text-sm font-medium" aria-live="polite">
              {tokenBalance.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">tokens</span>
          </motion.div>

          {/* New chat button */}
          <Button
            size="sm"
            className="gap-2"
            onClick={onNewChat}
            aria-label="Start new chat conversation (Cmd+Shift+N)"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>

          {/* Notifications */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                <AnimatePresence>
                  {unreadNotifications > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Badge className="h-5 w-5 rounded-full p-0 text-xs animate-pulse-glow">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        'flex flex-col items-start p-4 cursor-pointer',
                        !notification.read && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          notification.type === 'success' && 'bg-success',
                          notification.type === 'error' && 'bg-error',
                          notification.type === 'warning' && 'bg-warning',
                          notification.type === 'info' && 'bg-primary'
                        )} />
                        <span className="font-medium text-sm">{notification.title}</span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full ml-auto" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.timestamp}
                      </p>
                    </DropdownMenuItem>
                  ))}
                  {notifications.length > 5 && (
                    <DropdownMenuItem className="text-center text-sm text-primary">
                      View all notifications
                    </DropdownMenuItem>
                  )}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-ring hover:ring-offset-2"
                aria-label={`Account menu for ${user.name}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={`${user.name}'s avatar`} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <Badge
                    variant={user.plan === 'free' ? 'outline' : 'secondary'}
                    className={cn(
                      'w-fit mt-1',
                      user.plan === 'pro' && 'bg-primary text-primary-foreground',
                      user.plan === 'enterprise' && 'bg-workforce text-workforce-foreground'
                    )}
                  >
                    {user.plan} plan
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/billing" className="cursor-pointer">
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-error focus:text-error">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </motion.header>

      {/* Command Palette */}
      <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Command Palette
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-0">
            <Input
              placeholder="Type a command or search..."
              className="w-full"
              autoFocus
            />
            <div className="mt-4 space-y-1">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                Quick Actions
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onNewChat?.();
                  setCommandPaletteOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Chat
                <kbd className="ml-auto text-xs">⌘⇧N</kbd>
              </Button>
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setCommandPaletteOpen(false)}
                >
                  <Link to={link.path}>
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;