/**
 * Dashboard Home Page Component - Simplified with Fresh User Experience
 * Shows empty states and zero values for new users
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/unified-auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Users,
  Bot,
  Zap,
  DollarSign,
  Target,
  ArrowRight,
  Sparkles,
  MessageSquare,
  BarChart3,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHomePageProps {
  className?: string;
}

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ className }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const stats = {
    activeEmployees: 0,
    totalEmployees: 0,
    activeWorkflows: 0,
    totalWorkflows: 0,
    monthlyRevenue: 0,
    successRate: 0,
  };

  const quickActions = [
    {
      id: 'hire',
      title: 'Hire AI Employee',
      description: 'Add your first AI team member',
      icon: Bot,
      color: 'blue',
      action: () => navigate('/marketplace'),
    },
    {
      id: 'workflow',
      title: 'Create Workflow',
      description: 'Build your first automation',
      icon: Zap,
      color: 'purple',
      action: () => navigate('/automation'),
    },
    {
      id: 'chat',
      title: 'Start Chat',
      description: 'Chat with an AI assistant',
      icon: MessageSquare,
      color: 'green',
      action: () => navigate('/chat'),
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Check performance metrics',
      icon: BarChart3,
      color: 'orange',
      action: () => navigate('/analytics'),
    },
  ];

  const getActionColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30',
      purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30',
      green: 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30',
      orange: 'bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome{user?.name ? `, ${user.name}` : ''}! 👋
        </h1>
        <p className="text-slate-400">
          Let's get started with building your AI workforce
          </p>
        </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Employees Card */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Employees</p>
                <p className="text-2xl font-bold text-white">
                  {stats.activeEmployees}
                  <span className="text-sm text-slate-400 font-normal">
                    /{stats.totalEmployees}
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-1">--</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Workflows Card */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Workflows</p>
                <p className="text-2xl font-bold text-white">
                  {stats.activeWorkflows}
                  <span className="text-sm text-slate-400 font-normal">
                    /{stats.totalWorkflows}
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-1">--</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue Card */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Monthly Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">--</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate Card */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">
                  {stats.successRate}%
                </p>
                <p className="text-xs text-slate-500 mt-1">--</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 backdrop-blur-xl">
              <CardHeader>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white">Getting Started</CardTitle>
                  </div>
          <CardDescription>
            Follow these steps to set up your AI workforce
          </CardDescription>
              </CardHeader>
              <CardContent>
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white mb-1">Hire Your First AI Employee</h3>
                <p className="text-sm text-slate-400 mb-3">
                  Browse our marketplace and hire an AI employee to join your team
                </p>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('/marketplace')}
                >
                  Browse Marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white mb-1">Create Your First Workflow</h3>
                <p className="text-sm text-slate-400 mb-3">
                  Set up an automation workflow to streamline your operations
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => navigate('/automation')}
                >
                  Create Workflow
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
                </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-400 font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white mb-1">Start Chatting with AI</h3>
                <p className="text-sm text-slate-400 mb-3">
                  Have a conversation with an AI assistant to explore capabilities
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => navigate('/chat')}
                >
                  Start Chat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
                </div>
              </CardContent>
            </Card>

          {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon;
                    return (
                <button
                        key={action.id}
                        onClick={action.action}
                        className={cn(
                          "relative p-4 rounded-lg border transition-all duration-200 text-left group",
                    getActionColor(action.color)
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-current/20 flex items-center justify-center">
                            <IconComponent className="h-5 w-5" />
                          </div>
                        </div>
                        <h3 className="font-medium text-white mb-1 group-hover:text-current transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {action.description}
                        </p>
                </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

      {/* Empty State for Activity */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <CardDescription>Latest system events and updates</CardDescription>
              </CardHeader>
              <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No Activity Yet
            </h3>
            <p className="text-slate-400 mb-4">
              Your activity feed will appear here once you start using the platform
            </p>
            <Button 
              onClick={() => navigate('/marketplace')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHomePage;
