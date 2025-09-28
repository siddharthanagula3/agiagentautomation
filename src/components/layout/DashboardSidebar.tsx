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
  Activity,
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
  Upload
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
      description: 'Overview and quick actions'
    },
    {
      name: 'AI Employees',
      href: '/dashboard/employees',
      icon: Bot,
      badge: '12',
      description: 'Manage your AI workforce',
      children: [
        { name: 'Marketplace', href: '/dashboard/employees/marketplace', icon: Users },
        { name: 'My Employees', href: '/dashboard/employees/hired', icon: Briefcase },
        { name: 'Performance', href: '/dashboard/employees/performance', icon: TrendingUp }
      ]
    },
    {
      name: 'AI Workforce',
      href: '/dashboard/workforce',
      icon: Network,
      badge: '3',
      description: 'Team management and collaboration',
      children: [
        { name: 'Teams', href: '/dashboard/workforce/teams', icon: Users },
        { name: 'Projects', href: '/dashboard/workforce/projects', icon: Target },
        { name: 'Communication', href: '/dashboard/workforce/communication', icon: MessageSquare }
      ]
    },
    {
      name: 'Automation',
      href: '/dashboard/automation',
      icon: Zap,
      badge: 'New',
      badgeVariant: 'secondary',
      isNew: true,
      description: 'Autonomous workflows and tasks',
      children: [
        { name: 'Workflows', href: '/dashboard/automation/workflows', icon: Workflow },
        { name: 'Triggers', href: '/dashboard/automation/triggers', icon: Clock },
        { name: 'Standing Orders', href: '/dashboard/automation/standing-orders', icon: Calendar }
      ]
    },
    {
      name: 'Jobs & Tasks',
      href: '/dashboard/jobs',
      icon: Target,
      badge: '8',
      badgeVariant: 'destructive',
      description: 'Active and completed jobs'
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      description: 'Performance insights and metrics'
    },
    {
      name: 'Chat',
      href: '/dashboard/chat',
      icon: MessageSquare,
      badge: '3',
      description: 'Communicate with AI employees'
    }
  ];

  const accountNavigation: NavigationItem[] = [
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      description: 'Personal settings and preferences'
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
      description: 'Subscription and usage'
    },
    {
      name: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      badge: '5',
      description: 'Alerts and updates'
    }
  ];

  const systemNavigation: NavigationItem[] = [
    {
      name: 'Integrations',
      href: '/dashboard/integrations',
      icon: Globe,
      description: 'External tool connections'
    },
    {
      name: 'API Keys',
      href: '/dashboard/api-keys',
      icon: Key,
      description: 'API access management'
    },
    {
      name: 'Activity Logs',
      href: '/dashboard/logs',
      icon: Activity,
      description: 'System activity and audit trail'
    },
    {
      name: 'Security',
      href: '/dashboard/security',
      icon: Shield,
      description: 'Security settings and policies'
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      description: 'Platform configuration'
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
          >
            <Plus className="h-4 w-4 mr-2" />
            Hire AI Employee
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
        <Button 
          variant="ghost" 
          className={cn(
            "w-full text-slate-300 hover:text-white hover:bg-slate-700/50",
            "transition-all duration-200",
            collapsed && "px-0"
          )}
          asChild
        >
          <NavLink to="/dashboard/support">
            <HelpCircle className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && "Help & Support"}
          </NavLink>
        </Button>
        
        {!collapsed && (
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-500">
              Version 2.0.0
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export { DashboardSidebar };