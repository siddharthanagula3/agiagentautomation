import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  ShoppingBag,
  Settings,
  CreditCard,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Plus,
  ChevronDown,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardSidebarProps {
  collapsed?: boolean;
  className?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  isNew?: boolean;
  children?: NavigationItem[];
  description?: string;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  collapsed = false,
  className,
}) => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and analytics',
      badge: 'Beta',
    },
    {
      name: 'AI Workforce',
      href: '/workforce',
      icon: Users,
      description: 'Manage AI employees',
      badge: 'Beta',
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: MessageSquare,
      description: 'AI communication hub',
      badge: 'Beta',
    },
    {
      name: 'Marketplace',
      href: '/marketplace',
      icon: ShoppingBag,
      description: 'Hire AI employees',
      badge: 'Beta',
    },
  ];

  const settingsNavigation: NavigationItem[] = [
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Account settings',
    },
    {
      name: 'Billing',
      href: '/billing',
      icon: CreditCard,
      description: 'Manage subscription',
    },
    {
      name: 'Support',
      href: '/support',
      icon: HelpCircle,
      description: 'Get help',
    },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return (
      location.pathname === href || location.pathname.startsWith(href + '/')
    );
  };

  const toggleGroup = (groupName: string) => {
    if (collapsed) return;
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const filteredNavigation = React.useMemo(() => {
    if (!searchQuery) return navigation;
    return navigation.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, navigation]);

  const renderNavItem = (
    item: NavigationItem,
    index: number,
    section: 'main' | 'settings'
  ) => {
    const isActive = isActiveLink(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.has(item.name);

    return (
      <motion.div
        key={item.name}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        {hasChildren && !collapsed ? (
          <div className="group relative">
            <button
              onClick={() => toggleGroup(item.name)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300',
                'hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10',
                isActive
                  ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'rounded-lg p-2 transition-all duration-300',
                  isActive
                    ? 'bg-primary/10'
                    : 'bg-muted/50 group-hover:bg-muted'
                )}
              >
                <item.icon
                  className={cn(
                    'h-4 w-4 transition-all duration-300',
                    isActive && 'text-primary'
                  )}
                />
              </div>

              <div className="flex-1 text-left">
                <div className="font-semibold">{item.name}</div>
                {item.description && !collapsed && (
                  <div className="text-[10px] text-muted-foreground">
                    {item.description}
                  </div>
                )}
              </div>

              {item.badge && (
                <Badge
                  variant={item.badgeVariant || 'default'}
                  className="px-2 py-0.5 text-[10px]"
                >
                  {item.badge}
                </Badge>
              )}

              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-300',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="ml-12 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-4">
                    {item.children!.map((child, i) => (
                      <NavLink
                        key={child.name}
                        to={child.href}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-300',
                            'hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent',
                            isActive
                              ? 'bg-gradient-to-r from-primary/10 to-transparent font-medium text-primary'
                              : 'text-muted-foreground hover:text-foreground'
                          )
                        }
                      >
                        <Circle
                          className={cn(
                            'h-1.5 w-1.5 fill-current transition-all duration-300',
                            isActive && 'scale-125'
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{child.name}</div>
                          {child.description && (
                            <div className="text-[10px] text-muted-foreground">
                              {child.description}
                            </div>
                          )}
                        </div>
                      </NavLink>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <NavLink
            to={item.href}
            className={({ isActive: linkActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300',
                'hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10',
                collapsed ? 'justify-center' : '',
                linkActive || isActive
                  ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
            title={collapsed ? item.name : undefined}
          >
            {/* Active indicator - Modern left accent */}
            {isActive && !collapsed && (
              <motion.div
                layoutId={`active-indicator-${section}`}
                className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-primary/50"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            {/* Icon with background */}
            <div
              className={cn(
                'rounded-lg p-2 transition-all duration-300',
                isActive
                  ? 'scale-110 bg-primary/10'
                  : 'bg-muted/50 group-hover:scale-105 group-hover:bg-muted'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 transition-all duration-300',
                  isActive && 'text-primary'
                )}
              />
            </div>

            {/* Label with description */}
            {!collapsed && (
              <div className="flex-1">
                <div className="font-semibold">{item.name}</div>
                {item.description && (
                  <div className="text-[10px] text-muted-foreground">
                    {item.description}
                  </div>
                )}
              </div>
            )}

            {/* Badge */}
            {!collapsed && item.badge && (
              <Badge
                variant={item.badgeVariant || 'default'}
                className="px-2 py-0.5 text-[10px]"
              >
                {item.badge}
              </Badge>
            )}

            {/* New indicator with pulse animation */}
            {!collapsed && item.isNew && (
              <motion.div className="relative h-2 w-2">
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
                <div className="absolute inset-0 rounded-full bg-primary" />
              </motion.div>
            )}

            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div
                className={cn(
                  'absolute left-full z-50 ml-3 rounded-lg border bg-popover/95 px-3 py-2 shadow-lg backdrop-blur-sm',
                  'pointer-events-none opacity-0 transition-all duration-300 group-hover:opacity-100',
                  'whitespace-nowrap'
                )}
              >
                <p className="text-sm font-medium">{item.name}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            )}
          </NavLink>
        )}
      </motion.div>
    );
  };

  return (
    <div
      className={cn(
        'glass-strong flex h-full flex-col border-r border-border/50 backdrop-blur-xl',
        'overflow-hidden', // Ensure proper overflow handling
        className
      )}
    >
      {/* Logo Section with gradient background */}
      <div
        className={cn(
          'flex items-center gap-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent px-4 py-5',
          collapsed && 'justify-center px-2'
        )}
      >
        {collapsed ? (
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
            className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
        ) : (
          <>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
              className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
            >
              <Sparkles className="h-5 w-5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-base font-bold text-transparent">
                AI Workforce
              </h1>
              <p className="text-xs text-muted-foreground">Powered by AGI</p>
            </div>
          </>
        )}
      </div>

      {/* Search Bar - Modern 2025 trend */}
      {!collapsed && (
        <div className="border-b border-border/50 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full rounded-lg py-2.5 pl-10 pr-3',
                'bg-muted/50 hover:bg-muted/70 focus:bg-muted',
                'border border-border/50 focus:border-primary/50',
                'text-sm placeholder:text-muted-foreground',
                'outline-none transition-all duration-300'
              )}
            />
          </div>
        </div>
      )}

      {/* Quick Action Button with modern gradient */}
      {!collapsed && (
        <div className="border-b border-border/50 px-4 py-4">
          <Button
            className={cn(
              'btn-glow gradient-primary w-full text-white shadow-lg',
              'transition-all duration-300 hover:scale-[1.02] hover:shadow-xl'
            )}
            asChild
          >
            <NavLink to="/marketplace">
              <Plus className="mr-2 h-4 w-4" />
              Hire AI Employee
            </NavLink>
          </Button>
        </div>
      )}

      {/* Main Navigation with improved spacing */}
      <div className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {/* Main Menu */}
        <nav className="space-y-1">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-3 flex items-center justify-between px-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Main Menu
              </p>
              <div className="ml-3 h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
            </motion.div>
          )}
          {filteredNavigation.map((item, index) =>
            renderNavItem(item, index, 'main')
          )}
        </nav>

        {/* Divider with gradient */}
        {!collapsed && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"></div>
            </div>
          </div>
        )}

        {/* Settings Menu */}
        <nav className="space-y-1">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-3 flex items-center justify-between px-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Settings
              </p>
              <div className="ml-3 h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
            </motion.div>
          )}
          {settingsNavigation.map((item, index) =>
            renderNavItem(item, index, 'settings')
          )}
        </nav>
      </div>

      {/* Footer with dark mode toggle */}
      <div className="space-y-3 border-t border-border/50 bg-gradient-to-t from-muted/20 to-transparent p-4"></div>
    </div>
  );
};

export { DashboardSidebar };
