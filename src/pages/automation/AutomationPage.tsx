/**
 * Automation Page - Real Data Implementation
 * All workflow data fetched from Supabase via automation service
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AutonomousWorkflowsPage from '@/pages/autonomous/AutonomousWorkflowsPage';
import { useAuthStore } from '@/stores/unified-auth-store';
import { automationService } from '@/services/automation-service';
import {
  Zap,
  Plus,
  Play,
  Settings,
  BarChart3,
  Clock,
  Activity,
  TrendingUp,
  Bot,
  Workflow,
  GitBranch,
  Target,
  Sparkles,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AutomationPage: React.FC = () => {
  const { user } = useAuthStore();
  const userId = user?.id;

  // Fetch real workflows from database
  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflows', userId],
    queryFn: () => automationService.getWorkflows(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  // Fetch automation overview
  const { data: automationOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ['automation-overview', userId],
    queryFn: () => automationService.getAutomationOverview(userId!),
    enabled: !!userId,
    refetchInterval: 60000,
  });

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view automation</CardDescription>
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

  const isLoading = workflowsLoading || overviewLoading;

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'text-green-400 bg-green-500/20 border-green-500/30'
      : 'text-slate-400 bg-slate-500/20 border-slate-500/30';
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Automation Hub</h1>
          <p className="text-slate-400 mt-1">
            Manage workflows, automations, and AI-driven processes
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link to="/dashboard/automation/designer">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Workflows</p>
                  <p className="text-2xl font-bold text-white">{automationOverview?.totalWorkflows || 0}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-400">
                      {automationOverview?.activeWorkflows || 0} active
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Workflow className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Running Now</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-white">{automationOverview?.runningExecutions || 0}</p>
                    {(automationOverview?.runningExecutions || 0) > 0 && (
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <Activity className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-400">Active executions</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Play className="h-6 w-6 text-green-400" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Success Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(automationOverview?.successRate || 0)}%
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Target className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-400">
                      {automationOverview?.totalExecutions || 0} total
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Completed Today</p>
                  <p className="text-2xl font-bold text-white">{automationOverview?.completedToday || 0}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-3 w-3 text-orange-400" />
                    <span className="text-xs text-orange-400">
                      Avg {Math.round(automationOverview?.avgExecutionTime || 0)}s
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-400" />
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
        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="workflows" className="data-[state=active]:bg-slate-700">
              <Workflow className="h-4 w-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="autonomous" className="data-[state=active]:bg-slate-700">
              <Bot className="h-4 w-4 mr-2" />
              Autonomous
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/dashboard/automation/designer">
                <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-colors cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                        <Plus className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          Create Workflow
                        </h3>
                        <p className="text-sm text-slate-400">Build new automation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-colors cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <GitBranch className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">
                        Browse Templates
                      </h3>
                      <p className="text-sm text-slate-400">Use pre-built workflows</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-colors cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                      <Sparkles className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                        AI Generator
                      </h3>
                      <p className="text-sm text-slate-400">Generate with AI</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workflow List */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Your Workflows</CardTitle>
                    <CardDescription>Manage and monitor your automation workflows</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {workflowsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center space-x-4 p-4 rounded-lg bg-slate-700/30">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !workflows || workflows.length === 0 ? (
                  <div className="text-center py-12">
                    <Workflow className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Workflows Yet</h3>
                    <p className="text-slate-400 mb-6">
                      Create your first workflow to automate tasks with your AI employees
                    </p>
                    <Link to="/dashboard/automation/designer">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Workflow
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workflows.map((workflow, index) => (
                      <motion.div
                        key={workflow.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors group"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-slate-600/50 rounded-lg flex items-center justify-center">
                              <Workflow className="h-6 w-6 text-slate-400" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                                {workflow.name}
                              </h3>
                              <Badge className={`text-xs border ${getStatusColor(workflow.isActive)}`}>
                                {workflow.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              {workflow.category && (
                                <Badge variant="outline" className="text-xs">
                                  {workflow.category}
                                </Badge>
                              )}
                            </div>
                            
                            {workflow.description && (
                              <p className="text-sm text-slate-400 truncate mb-2">
                                {workflow.description}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                              <span>Last run: {formatDate(workflow.lastExecutedAt)}</span>
                              <span>•</span>
                              <span>Version {workflow.version}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuItem 
                                className="text-slate-300"
                                onClick={() => automationService.executeWorkflow(workflow.id)}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Run Now
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-slate-300">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Workflow
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-slate-300">
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuItem 
                                className="text-red-400"
                                onClick={() => automationService.deleteWorkflow(workflow.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="autonomous">
            <AutonomousWorkflowsPage />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Automation Analytics</CardTitle>
                <CardDescription>
                  Performance insights and optimization recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : automationOverview && automationOverview.totalExecutions > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border border-slate-700 rounded-lg">
                        <p className="text-sm text-slate-400">Total Executions</p>
                        <p className="text-2xl font-bold text-white mt-1">
                          {automationOverview.totalExecutions}
                        </p>
                      </div>
                      <div className="p-4 border border-slate-700 rounded-lg">
                        <p className="text-sm text-slate-400">Success Rate</p>
                        <p className="text-2xl font-bold text-white mt-1">
                          {Math.round(automationOverview.successRate)}%
                        </p>
                      </div>
                      <div className="p-4 border border-slate-700 rounded-lg">
                        <p className="text-sm text-slate-400">Avg Time</p>
                        <p className="text-2xl font-bold text-white mt-1">
                          {Math.round(automationOverview.avgExecutionTime)}s
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Performance Insights</h3>
                      <div className="space-y-3">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <p className="text-sm text-blue-400">
                            ✓ Your workflows have a {Math.round(automationOverview.successRate)}% success rate
                          </p>
                        </div>
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <p className="text-sm text-green-400">
                            ✓ {automationOverview.activeWorkflows} workflows are currently active
                          </p>
                        </div>
                        {automationOverview.runningExecutions > 0 && (
                          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                            <p className="text-sm text-orange-400">
                              ⚡ {automationOverview.runningExecutions} executions running right now
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      Analytics will appear here once you start running workflows
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

export default AutomationPage;
