/**
 * Analytics Page - Real Data Implementation
 * All data fetched from Supabase via analytics service
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Target,
  Activity,
  Download,
  Share,
  Zap
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid
} from 'recharts';
import { analyticsService } from '@/services/analytics-service';
import { useAuthStore } from '@/stores/unified-auth-store';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('7');

  // Fetch real dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: () => analyticsService.getDashboardStats(user!.id),
    enabled: !!user,
  });

  // Fetch execution chart data
  const { data: executionData, isLoading: execLoading } = useQuery({
    queryKey: ['execution-chart', user?.id, timeRange],
    queryFn: () => analyticsService.getExecutionChartData(user!.id, parseInt(timeRange)),
    enabled: !!user,
  });

  // Fetch workflow analytics
  const { data: workflowData, isLoading: workflowLoading } = useQuery({
    queryKey: ['workflow-analytics', user?.id],
    queryFn: () => analyticsService.getWorkflowAnalytics(user!.id),
    enabled: !!user,
  });

  // Fetch employee performance
  const { data: employeeData, isLoading: employeeLoading } = useQuery({
    queryKey: ['employee-performance', user?.id],
    queryFn: () => analyticsService.getEmployeePerformance(user!.id),
    enabled: !!user,
  });

  // Fetch cost breakdown
  const { data: costData, isLoading: costLoading } = useQuery({
    queryKey: ['cost-breakdown', user?.id, timeRange],
    queryFn: () => analyticsService.getCostBreakdown(user!.id, parseInt(timeRange)),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view analytics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isLoading = statsLoading || execLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your AI workforce performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="ghost">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Total Cost */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalCost || 0)}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">
                      {(stats?.totalTokensUsed || 0).toLocaleString()} tokens
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Completed */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="text-2xl font-bold">{stats?.totalExecutions || 0}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Activity className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-muted-foreground">All time</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{Math.round(stats?.successRate || 0)}%</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Target className="h-3 w-3 text-purple-600" />
                    <span className="text-xs text-muted-foreground">
                      Quality metric
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Employees */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Employees</p>
                  <p className="text-2xl font-bold">{stats?.activeEmployees || 0}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Users className="h-3 w-3 text-orange-600" />
                    <span className="text-xs text-muted-foreground">
                      {stats?.totalEmployees || 0} total
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Avg Execution Time */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Execution Time</p>
                  <p className="text-2xl font-bold">{Math.round(stats?.avgExecutionTime || 0)}s</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-3 w-3 text-cyan-600" />
                    <span className="text-xs text-muted-foreground">Per task</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Running Workflows */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Running Now</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold">{stats?.runningWorkflows || 0}</p>
                    {(stats?.runningWorkflows || 0) > 0 && (
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <Zap className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">Active workflows</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="workforce">
              <Users className="h-4 w-4 mr-2" />
              Workforce
            </TabsTrigger>
            <TabsTrigger value="workflows">
              <Zap className="h-4 w-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="financial">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Execution Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Execution Trends</CardTitle>
                  <CardDescription>Completed vs failed executions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {execLoading ? (
                    <Skeleton className="h-80 w-full" />
                  ) : executionData && executionData.length > 0 ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={executionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="completed"
                            stackId="1"
                            stroke="#10B981"
                            fill="#10B981"
                            fillOpacity={0.6}
                            name="Completed"
                          />
                          <Area
                            type="monotone"
                            dataKey="failed"
                            stackId="2"
                            stroke="#EF4444"
                            fill="#EF4444"
                            fillOpacity={0.6}
                            name="Failed"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      No execution data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cost Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Distribution</CardTitle>
                  <CardDescription>Spending by service type</CardDescription>
                </CardHeader>
                <CardContent>
                  {costLoading ? (
                    <Skeleton className="h-80 w-full" />
                  ) : costData && costData.length > 0 ? (
                    <div className="h-80 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: $${entry.cost.toFixed(2)}`}
                            outerRadius={100}
                            dataKey="cost"
                          >
                            {costData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      No cost data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workforce" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Performance</CardTitle>
                <CardDescription>Individual performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {employeeLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : employeeData && employeeData.length > 0 ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={employeeData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tasks" fill="#8B5CF6" name="Tasks Completed" />
                        <Bar dataKey="successRate" fill="#10B981" name="Success Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No employee data available. Hire AI employees to see their performance.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Success Rates</CardTitle>
                <CardDescription>Success and failure rates by workflow</CardDescription>
              </CardHeader>
              <CardContent>
                {workflowLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : workflowData && workflowData.length > 0 ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workflowData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="success" fill="#10B981" name="Success %" />
                        <Bar dataKey="failed" fill="#EF4444" name="Failed %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No workflow data available. Create workflows to see their performance.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Analytics</CardTitle>
                <CardDescription>Revenue, costs, and ROI analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {costLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Spend</p>
                        <p className="text-2xl font-bold">{formatCurrency(stats?.totalCost || 0)}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Tokens Used</p>
                        <p className="text-2xl font-bold">{(stats?.totalTokensUsed || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Avg Cost/Task</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency((stats?.totalCost || 0) / Math.max(stats?.totalExecutions || 1, 1))}
                        </p>
                      </div>
                    </div>
                    
                    {costData && costData.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-medium">Cost by Service</h3>
                        {costData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <span>{item.name}</span>
                            <span className="font-medium">{formatCurrency(item.cost)}</span>
                          </div>
                        ))}
                      </div>
                    )}
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

export default AnalyticsPage;
