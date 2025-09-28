/**
 * Refactored Dashboard Component
 * Uses smaller, focused components for better maintainability
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  Users, 
  Bot, 
  Activity, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { StatCard } from './StatCard';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { useAuth } from '@/stores/auth-store-v2';
import { useUIStore } from '@/stores/ui-store';

interface DashboardStats {
  totalRevenue: number;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalEmployees: number;
  activeEmployees: number;
  totalProjects: number;
  completedProjects: number;
}

interface DashboardActivity {
  id: string;
  type: 'job' | 'employee' | 'system' | 'workforce';
  title: string;
  description: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  timestamp: Date;
  user?: string;
}

const DashboardRefactored: React.FC = () => {
  const { user } = useAuth();
  const { dashboard } = useUIStore();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        totalRevenue: 12500.75,
        totalJobs: 45,
        activeJobs: 8,
        completedJobs: 37,
        totalEmployees: 12,
        activeEmployees: 10,
        totalProjects: 15,
        completedProjects: 12,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<DashboardActivity[]>({
    queryKey: ['dashboard-activities'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      return [
        {
          id: '1',
          type: 'job',
          title: 'Data Processing Job',
          description: 'Processed customer onboarding data',
          status: 'completed',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          user: 'Data Processor AI',
        },
        {
          id: '2',
          type: 'workforce',
          title: 'Marketing Campaign',
          description: 'Created social media content strategy',
          status: 'running',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          user: 'Marketing Team AI',
        },
        {
          id: '3',
          type: 'employee',
          title: 'New Employee Hired',
          description: 'Added Python Developer AI to workforce',
          status: 'completed',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        },
        {
          id: '4',
          type: 'system',
          title: 'System Update',
          description: 'Updated AI models to latest version',
          status: 'completed',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          id: '5',
          type: 'job',
          title: 'Code Review',
          description: 'Failed to complete code analysis',
          status: 'failed',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          user: 'Code Reviewer AI',
        },
      ];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleQuickAction = (actionId: string) => {
    console.log('Quick action triggered:', actionId);
    // Handle quick actions here
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'User'}! Here's what's happening with your AI workforce.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue.toFixed(2) || '0.00'}`}
          description="Generated this month"
          icon={DollarSign}
          trend={{
            value: 12.5,
            label: "from last month",
            isPositive: true,
          }}
          loading={statsLoading}
        />
        
        <StatCard
          title="Total Jobs"
          value={stats?.totalJobs || 0}
          description="All automation tasks"
          icon={Activity}
          trend={{
            value: 8.2,
            label: "from last week",
            isPositive: true,
          }}
          loading={statsLoading}
        />
        
        <StatCard
          title="Active Employees"
          value={stats?.activeEmployees || 0}
          description="Currently working"
          icon={Bot}
          trend={{
            value: 2.1,
            label: "from yesterday",
            isPositive: true,
          }}
          loading={statsLoading}
        />
        
        <StatCard
          title="Completed Jobs"
          value={stats?.completedJobs || 0}
          description="Successfully finished"
          icon={CheckCircle}
          trend={{
            value: 15.3,
            label: "from last week",
            isPositive: true,
          }}
          loading={statsLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity
            activities={activities || []}
            loading={activitiesLoading}
            maxItems={5}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions
            onAction={handleQuickAction}
          />
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Active Jobs"
          value={stats?.activeJobs || 0}
          description="Currently running"
          icon={Clock}
          loading={statsLoading}
        />
        
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          description="Workforce projects"
          icon={TrendingUp}
          loading={statsLoading}
        />
        
        <StatCard
          title="Success Rate"
          value={`${stats ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}%`}
          description="Job completion rate"
          icon={CheckCircle}
          loading={statsLoading}
        />
      </div>
    </div>
  );
};

export default DashboardRefactored;
