import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { 
  Home,
  Users,
  Workflow,
  Bot,
  BarChart3,
  User,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  Zap,
  Shield,
  Database,
  Globe,
  Key,
  ChevronDown,
  Plus,
  TrendingUp,
  Sparkles,
  MessageSquare,
  ShoppingBag,
  LayoutDashboard,
  Activity,
  Package,
  Briefcase
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
  description?: string;
  isNew?: boolean;
  children?: NavigationItem[];
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ collapsed = false, className }) => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview & insights'
    },
    {
      name: 'AI Workforce',
      href: '/workforce',
      icon: Users,
      description: 'Manage AI team'
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: MessageSquare,
      description: 'Talk to AI',
      badge: 'New',
      badgeVariant: 'default'
    },
    {
      name: 'Marketplace',
      href: '/marketplace',
      icon: ShoppingBag,
      description: 'Hire AI employees'
    },
    {
      name: 'Automation',
      href: '/automation',
      icon: Zap,
      description: 'Workflows & tasks'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Performance metrics'
    },
    {
      name: 'Integrations',
      href: '/integrations',
      icon: Globe,
      description: 'Connect tools'
    },
  ];

  const settingsNavigation: NavigationItem[] = [
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Preferences & config'
    },
    {
      name: 'Billing',
      href: '/billing',
      icon: CreditCard,
      description: 'Subscription & usage'
    },
    {
      name: 'API Keys',
      href: '/api-keys',
      icon: Key,
      description: 'Developer access'
    },
    {
      name: 'Support',
      href: '/support',
      icon: HelpCircle,
      description: 'Help center'
    }
  ];

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const renderNavItem = (item: NavigationItem, index: number) => {
    const isActive = isActiveLink(item.href);

    return (
      <motion.div
        key={item.name}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
      >
        <NavLink
          to={item.href}
          className={({ isActive: linkActive }) => cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
            collapsed ? "justify-center" : "justify-start",
            (linkActive || isActive) 
              ? "bg-primary/10 text-primary shadow-sm" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={collapsed ? item.name : undefined}
        >
          {/* Icon */}
          <item.icon className={cn(
            "h-5 w-5 flex-shrink-0 transition-transform duration-200",
            (isActive) && "scale-110"
          )} />
          
          {/* Label */}
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.name}</span>
              
              {/* Badge */}
              {item.badge && (
                <Badge 
                  variant={item.badgeVariant || 'default'} 
                  className="ml-auto text-[10px] px-1.5 py-0"
                >
                  {item.badge}
                </Badge>
              )}
              
              {/* New Indicator */}
              {item.isNew && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
              )}
            </>
          )}

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className={cn(
              "absolute left-full ml-3 px-3 py-2 bg-popover rounded-lg shadow-lg border z-50",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
              "whitespace-nowrap"
            )}>
              <p className="text-sm font-medium">{item.name}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              )}
            </div>
          )}
        </NavLink>
      </motion.div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full glass-strong border-r border-border",
      className
    )}>
      {/* Logo Section */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-border",
        collapsed && "justify-center px-2"
      )}>
        {collapsed ? (
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg"
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
        ) : (
          <>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg"
            >
              <Sparkles className="h-5 w-5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold">AI Workforce</h1>
              <p className="text-xs text-muted-foreground">Powered by AGI</p>
            </div>
          </>
        )}
      </div>

      {/* Quick Action Button */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-border">
          <Button 
            className="w-full btn-glow gradient-primary text-white"
            asChild
          >
            <NavLink to="/marketplace">
              <Plus className="h-4 w-4 mr-2" />
              Hire AI Employee
            </NavLink>
          </Button>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-8">
        {/* Main Menu */}
        <nav className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Main Menu
            </p>
          )}
          {navigation.map((item, index) => renderNavItem(item, index))}
        </nav>

        {/* Settings Menu */}
        <nav className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Settings
            </p>
          )}
          {settingsNavigation.map((item, index) => renderNavItem(item, index + navigation.length))}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          </div>
        ) : (
          <div className="glass rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <p className="text-xs font-medium">All Systems Online</p>
            </div>
            <p className="text-[10px] text-muted-foreground">
              v2.0.0 • Last updated: Today
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export { DashboardSidebar };
