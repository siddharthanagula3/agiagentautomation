import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/unified-auth-store';
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
  Bot,
  Brain,
  Zap,
  Command,
  Moon,
  Sun,
  Monitor,
  ChevronDown,
  Plus,
  Activity,
  BarChart3,
  MessageSquare,
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

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
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Notifications - load from real data
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
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
    console.log('DashboardHeader: Logout button clicked');
    setShowUserMenu(false);
    try {
      await logout();
      console.log('DashboardHeader: Logout completed, navigating to login');
      navigate('/auth/login');
    } catch (error) {
      console.error('DashboardHeader: Logout error:', error);
      navigate('/auth/login');
    }
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
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
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
    if (path === '/dashboard') return 'Dashboard Overview';
    if (path.includes('/employees')) return 'AI Employees';
    if (path.includes('/workforce')) return 'AI Workforce';
    if (path.includes('/jobs')) return 'Jobs & Tasks';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/automation')) return 'Automation';
    if (path.includes('/chat')) return 'Chat';
    return 'AGI Platform';
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40",
        "bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50",
        "shadow-lg shadow-slate-900/10",
        "transition-all duration-300",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-slate-300 hover:text-white hover:bg-slate-700/50"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="hidden lg:flex text-slate-300 hover:text-white hover:bg-slate-700/50"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className={cn(
              "h-5 w-5 transition-transform duration-200",
              sidebarCollapsed && "rotate-180"
            )} />
          </Button>

          {/* Page Title */}
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-white">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-slate-400 hidden md:block">
              Manage your AI workforce and automation
            </p>
          </div>
        </div>

        {/* Center - Enhanced Search */}
        <div className="flex-1 max-w-md mx-4 lg:mx-8" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search employees, workflows, jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className={cn(
                "pl-10 pr-4 bg-slate-700/50 border-slate-600 text-white",
                "placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20",
                "transition-all duration-200"
              )}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-600 bg-slate-700 px-1.5 font-mono text-[10px] font-medium text-slate-400">
                <Command className="h-3 w-3" />
                K
              </kbd>
            </div>

            {/* Search Results Dropdown */}
            {showSearch && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs text-slate-400 mb-2">Search Results</div>
                  {/* Mock search results */}
                  <div className="space-y-1">
                    <button className="w-full text-left p-2 rounded hover:bg-slate-700 text-sm text-white">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4 text-blue-400" />
                        <span>Sarah - Data Analyst</span>
                      </div>
                    </button>
                    <button className="w-full text-left p-2 rounded hover:bg-slate-700 text-sm text-white">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-purple-400" />
                        <span>Customer Analysis Workflow</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="text-slate-300 hover:text-white hover:bg-slate-700/50"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-slate-300 hover:text-white hover:bg-slate-700/50"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-96 overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={cn(
                          "w-full text-left p-4 border-b border-slate-700/50 hover:bg-slate-700/30",
                          "transition-colors duration-200",
                          !notification.read && "bg-slate-700/20"
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-white truncate">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-700/50 px-2"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.role || 'Member'}</p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                {/* User Info */}
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button 
                    onClick={() => {setShowUserMenu(false); navigate('/settings/profile');}}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </button>
                  <button 
                    onClick={() => {setShowUserMenu(false); navigate('/billing');}}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Billing & Usage</span>
                  </button>
                  <button 
                    onClick={() => {setShowUserMenu(false); navigate('/settings');}}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Account Settings</span>
                  </button>
                </div>

                {/* Support & Logout */}
                <div className="border-t border-slate-700 py-2">
                  <button 
                    onClick={() => {setShowUserMenu(false); navigate('/support');}}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export { DashboardHeader };