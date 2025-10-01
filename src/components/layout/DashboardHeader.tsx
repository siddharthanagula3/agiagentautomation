import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/unified-auth-store';
import { useTheme } from '../theme-provider';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import {
  Bell, 
  Search, 
  Settings, 
  LogOut,
  Menu,
  User as UserIcon,
  CreditCard,
  HelpCircle,
  Command,
  Moon,
  Sun,
  ChevronDown,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
  className?: string;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onMenuClick, 
  onSidebarToggle, 
  sidebarCollapsed = false,
  className 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, setTheme, actualTheme } = useTheme();
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/auth/login');
    }
  };

  const toggleTheme = () => {
    setTheme(actualTheme === 'light' ? 'dark' : 'light');
  };

  const handleNotificationClick = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-error" />;
      default: return <Activity className="h-4 w-4 text-info" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.includes('/workforce')) return 'AI Workforce';
    if (path.includes('/chat')) return 'Chat';
    if (path.includes('/marketplace')) return 'Marketplace';
    if (path.includes('/automation')) return 'Automation';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/integrations')) return 'Integrations';
    if (path.includes('/settings')) return 'Settings';
    return 'AI Workforce';
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="hidden lg:flex"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className={cn(
              "h-5 w-5 transition-transform duration-200",
              sidebarCollapsed && "rotate-180"
            )} />
          </Button>

          {/* Page Title */}
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-4 lg:mx-8" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="pl-10 pr-20 glass"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />
                K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {actualTheme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center"
                >
                  <span className="text-[10px] text-white font-medium">{unreadCount}</span>
                </motion.div>
              )}
            </Button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 glass-strong rounded-2xl shadow-2xl border border-border overflow-hidden"
                >
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs text-primary"
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-12 text-center">
                        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id)}
                          className={cn(
                            "w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors",
                            !notification.read && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">{notification.title}</p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.timestamp)}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="gradient-primary text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.role || 'Member'}</p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl shadow-2xl border border-border overflow-hidden"
                >
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="gradient-primary text-white">
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button 
                      onClick={() => {setShowUserMenu(false); navigate('/settings/profile');}}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-3"
                    >
                      <UserIcon className="h-4 w-4" />
                      Profile Settings
                    </button>
                    <button 
                      onClick={() => {setShowUserMenu(false); navigate('/billing');}}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-3"
                    >
                      <CreditCard className="h-4 w-4" />
                      Billing & Usage
                    </button>
                    <button 
                      onClick={() => {setShowUserMenu(false); navigate('/settings');}}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-3"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-border py-2">
                    <button 
                      onClick={() => {setShowUserMenu(false); navigate('/support');}}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-3"
                    >
                      <HelpCircle className="h-4 w-4" />
                      Help & Support
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error/10 flex items-center gap-3"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export { DashboardHeader };
