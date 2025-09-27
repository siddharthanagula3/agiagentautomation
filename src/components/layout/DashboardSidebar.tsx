import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '../ui/button';
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
  ChevronRight
} from 'lucide-react';

const DashboardSidebar: React.FC = () => {
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: true
    },
    {
      name: 'AI Employees',
      href: '/dashboard/employees',
      icon: Users,
      current: false
    },
    {
      name: 'Workforce',
      href: '/dashboard/workforce',
      icon: Workflow,
      current: false
    },
    {
      name: 'Jobs',
      href: '/dashboard/jobs',
      icon: Target,
      current: false
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      current: false
    }
  ];

  const userNavigation = [
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      current: false
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
      current: false
    },
    {
      name: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      current: false
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      current: false
    }
  ];

  const systemNavigation = [
    {
      name: 'Integrations',
      href: '/dashboard/integrations',
      icon: Globe,
      current: false
    },
    {
      name: 'API Keys',
      href: '/dashboard/api-keys',
      icon: Key,
      current: false
    },
    {
      name: 'Logs',
      href: '/dashboard/logs',
      icon: Database,
      current: false
    },
    {
      name: 'Security',
      href: '/dashboard/security',
      icon: Shield,
      current: false
    }
  ];

  const getNavItemClasses = (isActive: boolean) => {
    return `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`;
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-full">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">AGI Agent</span>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Button className="w-full mb-3" asChild>
            <NavLink to="/dashboard/employees">
              <Users className="mr-2 h-4 w-4" />
              Hire AI Employee
            </NavLink>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <NavLink to="/dashboard/workforce">
              <Zap className="mr-2 h-4 w-4" />
              Create Job
            </NavLink>
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1 mb-8">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Main
          </div>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Navigation */}
        <nav className="space-y-1 mb-8">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Account
          </div>
          {userNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* System Navigation */}
        <nav className="space-y-1 mb-8">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            System
          </div>
          {systemNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => getNavItemClasses(isActive)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Support */}
        <div className="border-t border-sidebar-border pt-4">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <NavLink to="/dashboard/support">
              <HelpCircle className="mr-2 h-4 w-4" />
              Support
            </NavLink>
          </Button>
        </div>
      </div>
    </div>
  );
};

export { DashboardSidebar };