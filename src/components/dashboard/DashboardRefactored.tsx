import React from 'react';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { StatCard } from './StatCard';
import { RecentActivity } from './RecentActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  TrendingUp,
  Plus,
  Activity
} from 'lucide-react';

interface DashboardRefactoredProps {
  onCreateJob?: () => void;
  onCreateEmployee?: () => void;
  onViewJobs?: () => void;
  onViewEmployees?: () => void;
}

export const DashboardRefactored: React.FC<DashboardRefactoredProps> = ({
  onCreateJob,
  onCreateEmployee,
  onViewJobs,
  onViewEmployees
}) => {
  const { stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats.totalJobs,
      change: stats.totalJobs > 0 ? 12 : 0,
      changeType: 'increase' as const,
      icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
      description: `${stats.activeJobs} active, ${stats.completedJobs} completed`
    },
    {
      title: 'AI Employees',
      value: stats.totalEmployees,
      change: stats.totalEmployees > 0 ? 8 : 0,
      changeType: 'increase' as const,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      description: `${stats.activeEmployees} active employees`
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      change: Math.abs(stats.revenueGrowth),
      changeType: stats.revenueGrowth >= 0 ? 'increase' as const : 'decrease' as const,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      description: `Total: $${stats.totalRevenue.toLocaleString()}`
    },
    {
      title: 'Growth Rate',
      value: `${stats.revenueGrowth.toFixed(1)}%`,
      change: Math.abs(stats.revenueGrowth),
      changeType: stats.revenueGrowth >= 0 ? 'increase' as const : 'decrease' as const,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      description: 'Revenue growth this month'
    }
  ];

  const recentActivities = [
    {
      id: '1',
      type: 'job' as const,
      title: 'Content Creation Job',
      description: 'AI employee completed content creation task',
      timestamp: new Date().toISOString(),
      status: 'completed' as const,
      user: 'AI Writer'
    },
    {
      id: '2',
      type: 'employee' as const,
      title: 'New AI Employee Hired',
      description: 'Marketing specialist added to workforce',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed' as const,
      user: 'System'
    },
    {
      id: '3',
      type: 'job' as const,
      title: 'Data Analysis Task',
      description: 'Processing customer feedback data',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'pending' as const,
      user: 'AI Analyst'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your AI workforce.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={onCreateJob} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Job</span>
          </Button>
          <Button onClick={onCreateEmployee} variant="outline" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Hire AI</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            description={stat.description}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <RecentActivity activities={recentActivities} />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={onViewJobs} 
              className="w-full justify-start"
              variant="outline"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              View All Jobs
            </Button>
            <Button 
              onClick={onViewEmployees} 
              className="w-full justify-start"
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage AI Employees
            </Button>
            <Button 
              onClick={onCreateJob} 
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Job
            </Button>
            <Button 
              onClick={onCreateEmployee} 
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Hire New AI Employee
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};