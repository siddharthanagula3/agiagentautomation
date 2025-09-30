/**
 * Dashboard Page - Real Data Implementation
 * All data fetched from Supabase via analytics and automation services
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/unified-auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Workflow,
  TrendingUp,
  Activity,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Zap,
  Plus,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { analyticsService } from '@/services/analytics-service';
import { automationService } from '@/services/automation-service';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const userId = user?.id;
  
  // Fetch real dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: () => analyticsService.getDashboardStats(userId!),
    enabled: !!userId,
    refetchInterval: 60000, // Refresh every minute
  });
  
  // Fetch automation overview
  const { data: automationOverview, isLoading: automationLoading } = useQuery({
    queryKey: ['automation-overview', userId],
    queryFn: () => automationService.getAutomationOverview(userId!),
    enabled: !!userId,
    refetchInterval: 60000,
  });
  
  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity', userId],
    queryFn: () => analyticsService.getRecentActivity(userId!, 5),
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Fetch execution chart data
  const { data: executionData } = useQuery({
    queryKey: ['execution-chart', userId],
    queryFn: () => analyticsService.getExecutionChartData(userId!, 7),
    enabled: !!userId,
  });
  
  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isLoading = statsLoading || automationLoading;
  
  // Calculate trends
  const todayExecutions = automationOverview?.completedToday || 0;
  const yesterdayExecutions = Math.floor((automationOverview?.totalExecutions || 0) / 30); // Rough estimate
  const executionTrend = yesterdayExecutions > 0 
    ? ((todayExecutions - yesterdayExecutions) / yesterdayExecutions) * 100
    : 0;
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || user?.email || 'User'}! Here's your AI automation overview.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/dashboard/automation">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Zap className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </Link>
          <Link to="/dashboard/analytics">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total AI Employees */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">AI Employees</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.activeEmployees || 0} active
                  </p>
                  <Link to="/dashboard/workforce">
                    <Button variant="link" className="h-auto p-0 mt-2 text-xs">
                      Manage workforce →
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Active Workflows */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
              <Workflow className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{automationOverview?.activeWorkflows || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {automationOverview?.totalWorkflows || 0} total
                  </p>
                  <Link to="/dashboard/automation">
                    <Button variant="link" className="h-auto p-0 mt-2 text-xs">
                      View automation →
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Success Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{Math.round(stats?.successRate || 0)}%</div>
                  <Progress value={stats?.successRate || 0} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.totalExecutions || 0} total executions
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Total Cost */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">${(stats?.totalCost || 0).toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(stats?.totalTokensUsed || 0).toLocaleString()} tokens used
                  </p>
                  <Link to="/dashboard/billing">
                    <Button variant="link" className="h-auto p-0 mt-2 text-xs">
                      View billing →
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Activity Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Activity</span>
                <Badge variant="outline">
                  {recentActivity?.length || 0} events
                </Badge>
              </CardTitle>
              <CardDescription>Latest events and executions</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.eventName}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.createdAt.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {activity.eventType}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Activity will appear here once you start using your AI employees
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Execution Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Today's Performance</CardTitle>
              <CardDescription>Execution metrics for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </>
              ) : (
                <>
                  {/* Executions Today */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div>
                      <p className="text-sm font-medium">Executions</p>
                      <p className="text-2xl font-bold">{todayExecutions}</p>
                    </div>
                    <div className="flex items-center">
                      {executionTrend >= 0 ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${executionTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(Math.round(executionTrend))}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Avg Execution Time */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <div>
                      <p className="text-sm font-medium">Avg Time</p>
                      <p className="text-2xl font-bold">
                        {Math.round(stats?.avgExecutionTime || 0)}s
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                  
                  {/* Running Now */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div>
                      <p className="text-sm font-medium">Running Now</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold">
                          {automationOverview?.runningExecutions || 0}
                        </p>
                        {(automationOverview?.runningExecutions || 0) > 0 && (
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                    <Zap className="h-8 w-8 text-green-600" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link to="/dashboard/automation">
                <Button variant="outline" className="h-24 w-full flex-col space-y-2 hover:bg-blue-500/10 hover:border-blue-500/50">
                  <Plus className="h-8 w-8" />
                  <span>Create Workflow</span>
                </Button>
              </Link>
              <Link to="/dashboard/workforce">
                <Button variant="outline" className="h-24 w-full flex-col space-y-2 hover:bg-purple-500/10 hover:border-purple-500/50">
                  <Users className="h-8 w-8" />
                  <span>Hire AI Employee</span>
                </Button>
              </Link>
              <Link to="/dashboard/analytics">
                <Button variant="outline" className="h-24 w-full flex-col space-y-2 hover:bg-green-500/10 hover:border-green-500/50">
                  <BarChart3 className="h-8 w-8" />
                  <span>View Reports</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
