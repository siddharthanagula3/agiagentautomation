/**
 * Workforce Page - Real Data Implementation
 * All workforce data fetched from Supabase via analytics service
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import WorkforceManagement from '@/components/employees/WorkforceManagement';
import { useAuthStore } from '@/stores/unified-auth-store';
import { analyticsService } from '@/services/analytics-service';
import { Users, Bot, BarChart3, Settings, Plus, TrendingUp } from 'lucide-react';

const WorkforcePage: React.FC = () => {
  const { user } = useAuthStore();
  const userId = user?.id;

  // Fetch real workforce statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: () => analyticsService.getDashboardStats(userId!),
    enabled: !!userId,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch employee performance data
  const { data: employeePerformance, isLoading: perfLoading } = useQuery({
    queryKey: ['employee-performance', userId],
    queryFn: () => analyticsService.getEmployeePerformance(userId!),
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view workforce</CardDescription>
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

  const isLoading = statsLoading || perfLoading;

  // Calculate utilization percentage
  const utilization = stats?.activeEmployees && stats?.totalEmployees
    ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Workforce Management</h1>
          <p className="text-slate-400 mt-1">
            Manage your AI employees, teams, and workforce performance
          </p>
        </div>
        
        <Link to="/marketplace">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Hire AI Employee
          </Button>
        </Link>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Employees</p>
                  <p className="text-xl font-semibold text-white">{stats?.totalEmployees || 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Active Now</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xl font-semibold text-white">{stats?.activeEmployees || 0}</p>
                    {(stats?.activeEmployees || 0) > 0 && (
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Avg Performance</p>
                  <p className="text-xl font-semibold text-white">{Math.round(stats?.successRate || 0)}%</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Utilization</p>
                  <p className="text-xl font-semibold text-white">{utilization}%</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              <Users className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="management" className="data-[state=active]:bg-slate-700">
              <Settings className="h-4 w-4 mr-2" />
              Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Workforce Overview</CardTitle>
                <CardDescription>
                  Get an overview of your AI workforce performance and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : stats && stats.totalEmployees > 0 ? (
                  <div className="space-y-4">
                    <p className="text-slate-300">
                      Your AI workforce is {stats.successRate > 90 ? 'performing excellently' : stats.successRate > 70 ? 'performing well' : 'showing potential for improvement'} with a {Math.round(stats.successRate)}% success rate across {stats.totalExecutions} total executions.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-sm text-blue-400 mb-1">Total Tasks Completed</p>
                        <p className="text-2xl font-bold text-white">{stats.totalExecutions}</p>
                      </div>
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-sm text-green-400 mb-1">Tokens Processed</p>
                        <p className="text-2xl font-bold text-white">{(stats.totalTokensUsed || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No AI Employees Yet</h3>
                    <p className="text-slate-400 mb-6">
                      Get started by hiring your first AI employee from the marketplace
                    </p>
                    <Link to="/marketplace">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Browse Marketplace
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management">
            <WorkforceManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Performance Analytics</CardTitle>
                <CardDescription>
                  Detailed analytics and insights about your workforce performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {perfLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : employeePerformance && employeePerformance.length > 0 ? (
                  <div className="space-y-4">
                    {employeePerformance.map((employee, index) => (
                      <div key={index} className="p-4 border border-slate-700 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-white">{employee.name}</h4>
                            <p className="text-sm text-slate-400">{employee.provider}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">{employee.successRate}%</p>
                            <p className="text-xs text-slate-400">Success Rate</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Tasks</p>
                            <p className="font-medium text-white">{employee.tasks}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Avg Duration</p>
                            <p className="font-medium text-white">{employee.avgDuration}s</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Cost</p>
                            <p className="font-medium text-white">${employee.cost.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      Performance analytics will appear here once your AI employees complete tasks
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default WorkforcePage;
