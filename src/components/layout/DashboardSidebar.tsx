import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { 
  Home,
  Users,
  Workflow,
  Target,
  BarChart3,
  User,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  Bot,
  Zap,
  Shield,
  Database,
  Globe,
  Key,
  ChevronRight,
  Plus,
  Briefcase,
  Clock,
  TrendingUp,
  Brain,
  Cpu,
  Network,
  Calendar,
  MessageSquare,
  FileText,
  Download,
  Upload,
  Building,
  Layers
} from 'lucide-react';

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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['main']));

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview and analytics'
    },
    {
      name: 'Workforce',
      href: '/dashboard/workforce',
      icon: Users,
      description: 'Manage your AI workforce',
      children: [
        { name: 'Overview', href: '/dashboard/workforce', icon: Building },
        { name: 'Management', href: '/dashboard/workforce/management', icon: Users },
        { name: 'Analytics', href: '/dashboard/workforce/analytics', icon: BarChart3 }
      ]
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: MessageSquare,
      description: 'AI employee communication'
    },
    {
      name: 'Automation',
      href: '/dashboard/automation',
      icon: Zap,
      description: 'Workflows and automation',
      children: [
        { name: 'Overview', href: '/dashboard/automation', icon: Layers },
        { name: 'Workflows', href: '/dashboard/automation/workflows', icon: Workflow },
        { name: 'Designer', href: '/dashboard/automation/designer', icon: Target }
      ]
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      description: 'Performance insights',
      children: [
        { name: 'Overview', href: '/dashboard/analytics', icon: BarChart3 },
        { name: 'Workforce', href: '/dashboard/analytics/workforce', icon: Users },
        { name: 'Financial', href: '/dashboard/analytics/financial', icon: TrendingUp }
      ]
    },
    {
      name: 'Integrations',
      href: '/dashboard/integrations',
      icon: Globe,
      description: 'External tool connections'
    }
  ];

  const accountNavigation: NavigationItem[] = [
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      description: 'Account and system settings',
      children: [
        { name: 'Profile', href: '/dashboard/settings/profile', icon: User },
        { name: 'Notifications', href: '/dashboard/settings/notifications', icon: Bell },
        { name: 'Security', href: '/dashboard/settings/security', icon: Shield },
        { name: 'System', href: '/dashboard/settings/system', icon: Database }
      ]
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
      description: 'Subscription and usage'
    },
    {
      name: 'API Keys',
      href: '/dashboard/api-keys',
      icon: Key,
      description: 'API access management'
    }
  ];

  const systemNavigation: NavigationItem[] = [
    {
      name: 'Help & Support',
      href: '/dashboard/support',
      icon: HelpCircle,
      description: 'Documentation and support'
    }
  ];

  const toggleGroup = (groupName: string) => {
    if (collapsed) return;
    
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    // Special handling for chat route
    if (href === '/chat') {
      return location.pathname === '/chat' || location.pathname.startsWith('/chat/');
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const hasActiveChild = (children?: NavigationItem[]) => {
    if (!children) return false;
    return children.some(child => isActiveLink(child.href));
  };

  const renderNavItem = (item: NavigationItem, level = 0) => {
    const isActive = isActiveLink(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isGroupExpanded = expandedGroups.has(item.name.toLowerCase());
    const hasActiveChildren = hasActiveChild(item.children);

    return (
      <div key={item.name} className={cn("relative", level > 0 && "ml-4")}>
        {hasChildren && !collapsed ? (
          <Button
            variant="ghost"
            onClick={() => toggleGroup(item.name.toLowerCase())}
            className={cn(
              "w-full justify-start mb-1 text-left font-medium",
              "text-slate-300 hover:text-white hover:bg-slate-700/50",
              "transition-all duration-200 group",
              (isActive || hasActiveChildren) && "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-r-2 border-blue-500"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-colors duration-200",
              (isActive || hasActiveChildren) ? "text-blue-400" : "text-slate-400 group-hover:text-blue-400"
            )} />
            {!collapsed && (
              <>
                <span className="ml-3 flex-1">{item.name}</span>
                {item.badge && (
                  <Badge 
                    variant={item.badgeVariant || 'default'} 
                    className="ml-2 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
                {item.isNew && (
                  <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
                <ChevronRight className={cn(
                  "h-4 w-4 ml-2 transition-transform duration-200",
                  isGroupExpanded && "rotate-90"
                )} />
              </>
            )}
          </Button>
        ) : (
          <NavLink
            to={item.href}
            className={({ isActive: linkActive }) => cn(
              "flex items-center px-3 py-2 rounded-lg text-sm font-medium mb-1",
              "transition-all duration-200 group relative overflow-hidden",
              "text-slate-300 hover:text-white hover:bg-slate-700/50",
              (linkActive || isActive) && "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-r-2 border-blue-500"
            )}
            title={collapsed ? item.name : undefined}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-colors duration-200 flex-shrink-0",
              (isActive) ? "text-blue-400" : "text-slate-400 group-hover:text-blue-400"
            )} />
            {!collapsed && (
              <>
                <span className="ml-3 flex-1">{item.name}</span>
                {item.badge && (
                  <Badge 
                    variant={item.badgeVariant || 'default'} 
                    className="ml-2 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
                {item.isNew && (
                  <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </>
            )}
            
            {/* Hover Tooltip for Collapsed State */}
            {collapsed && (
              <div className={cn(
                "absolute left-full ml-2 px-3 py-2 bg-slate-800 rounded-lg",
                "text-sm text-white whitespace-nowrap z-50",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "pointer-events-none shadow-lg border border-slate-700"
              )}>
                {item.name}
                {item.description && (
                  <div className="text-xs text-slate-300 mt-1">{item.description}</div>
                )}
              </div>
            )}
          </NavLink>
        )}

        {/* Render Children */}
        {hasChildren && !collapsed && isGroupExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full",
      "bg-transparent", // Let parent handle background
      className
    )}>
      {/* Logo/Brand Section */}
      <div className={cn(
        "flex items-center px-4 py-4 border-b border-slate-700/50",
        collapsed && "justify-center px-2"
      )}>
        {collapsed ? (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AGI Platform</h1>
              <p className="text-xs text-slate-400">AI Workforce Management</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-slate-700/50">
          <Button 
            className={cn(
              "w-full bg-gradient-to-r from-blue-600 to-purple-600",
              "hover:from-blue-700 hover:to-purple-700",
              "text-white border-0 shadow-lg shadow-blue-500/25",
              "transition-all duration-200 hover:scale-[1.02]"
            )}
            asChild
          >
            <NavLink to="/marketplace">
              <Plus className="h-4 w-4 mr-2" />
              Hire AI Employee
            </NavLink>
          </Button>
        </div>
      )}

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
        <div className="px-4 py-4 space-y-6">
          {/* Main Navigation */}
          <nav className="space-y-1">
            {!collapsed && (
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Workspace
              </div>
            )}
            {navigation.map(item => renderNavItem(item))}
          </nav>

          {/* Account Navigation */}
          <nav className="space-y-1">
            {!collapsed && (
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Account
              </div>
            )}
            {accountNavigation.map(item => renderNavItem(item))}
          </nav>

          {/* System Navigation */}
          <nav className="space-y-1">
            {!collapsed && (
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                System
              </div>
            )}
            {systemNavigation.map(item => renderNavItem(item))}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700/50 p-4">
        {!collapsed && (
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-2">
              AGI Platform v2.0.0
            </p>
            <div className="flex items-center justify-center space-x-1 text-xs text-slate-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>All systems operational</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { DashboardSidebar };
