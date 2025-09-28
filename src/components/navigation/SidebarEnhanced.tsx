/**
 * Enhanced Sidebar Component
 * Provides intuitive navigation with Dashboard, Marketplace, Workforce, etc.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/stores/ui-store';
import { useAuth } from '@/stores/auth-store-v2';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard,
  Store,
  Users,
  Bot,
  Workflow,
  History,
  CreditCard,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Activity,
  FileText,
  Database,
  Globe,
  Shield,
  Bell
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string | number;
  children?: NavigationItem[];
  isNew?: boolean;
  isPro?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: Store,
    href: '/marketplace',
    badge: '250+',
    isNew: true,
  },
  {
    id: 'workforce',
    label: 'My Workforce',
    icon: Users,
    href: '/workforce',
    children: [
      {
        id: 'workforce-active',
        label: 'Active Employees',
        icon: Bot,
        href: '/workforce/active',
      },
      {
        id: 'workforce-hired',
        label: 'Hired Employees',
        icon: Users,
        href: '/workforce/hired',
      },
    ],
  },
  {
    id: 'ai-workforce',
    label: 'AI Workforce',
    icon: Workflow,
    href: '/ai-workforce',
    badge: 'CEO',
    isPro: true,
  },
  {
    id: 'history',
    label: 'History',
    icon: History,
    href: '/history',
  },
  {
    id: 'subscription',
    label: 'Subscription',
    icon: CreditCard,
    href: '/subscription',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
];

const quickActions = [
  {
    id: 'create-employee',
    label: 'Hire Employee',
    icon: Bot,
    href: '/marketplace?action=hire',
  },
  {
    id: 'start-project',
    label: 'Start Project',
    icon: Workflow,
    href: '/ai-workforce?action=start',
  },
  {
    id: 'view-analytics',
    label: 'Analytics',
    icon: TrendingUp,
    href: '/analytics',
  },
];

export const SidebarEnhanced: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed } = useSidebar();

  const handleLogout = () => {
    // Handle logout logic
    console.log('Logout clicked');
  };

  const NavItem: React.FC<{ item: NavigationItem; level?: number }> = ({ 
    item, 
    level = 0 
  }) => {
    const isActive = location.pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
      <div className="space-y-1">
        <NavLink
          to={item.href}
          className={({ isActive }) =>
            cn(
              'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              level > 0 && 'ml-6'
            )
          }
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          {!sidebarCollapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
              {item.isNew && (
                <Badge variant="default" className="text-xs bg-green-600">
                  New
                </Badge>
              )}
              {item.isPro && (
                <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-600">
                  Pro
                </Badge>
              )}
            </>
          )}
        </NavLink>
        
        {hasChildren && isExpanded && !sidebarCollapsed && (
          <div className="space-y-1">
            {item.children?.map((child) => (
              <NavItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-card border-r transition-all duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed ? 'w-16' : 'w-64',
          'lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">AGI Agent</h1>
                  <p className="text-xs text-muted-foreground">Automation</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </nav>

            {/* Quick Actions */}
            {!sidebarCollapsed && (
              <div className="mt-8">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-1">
                  {quickActions.map((action) => (
                    <NavLink
                      key={action.id}
                      to={action.href}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )
                      }
                    >
                      <action.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{action.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* User Section */}
          <div className="p-4 border-t">
            {!sidebarCollapsed ? (
              <div className="space-y-3">
                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted rounded p-2 text-center">
                    <div className="font-semibold">12</div>
                    <div className="text-muted-foreground">Employees</div>
                  </div>
                  <div className="bg-muted rounded p-2 text-center">
                    <div className="font-semibold">45</div>
                    <div className="text-muted-foreground">Jobs</div>
                  </div>
                </div>

                {/* User Actions */}
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <User className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
