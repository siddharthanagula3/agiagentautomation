/**
 * Automation Page - Real Data Implementation
 * All workflow data fetched from Supabase via automation service
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';
import { InteractiveHoverCard } from '@/components/ui/interactive-hover-card';
import { Particles } from '@/components/ui/particles';
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
      ? 'bg-success/20 text-success border-success/30'
      : 'bg-muted text-muted-foreground border-border';
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
          <h1 className="text-3xl font-bold">Automation Hub</h1>
          <p className="text-muted-foreground mt-1">
            Manage workflows, automations, and AI-driven processes
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link to="/dashboard/automation/designer">
            <Button className="gradient-primary">
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
        <Card>
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
                  <p className="text-sm text-muted-foreground">Total Workflows</p>
                  <p className="text-2xl font-bold">{automationOverview?.totalWorkflows || 0}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">
                      {automationOverview?.activeWorkflows || 0} active
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Workflow className="h-6 w-6 text-primary" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
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
                  <p className="text-sm text-muted-foreground">Running Now</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold">{automationOverview?.runningExecutions || 0}</p>
                    {(automationOverview?.runningExecutions || 0) > 0 && (
                      <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <Activity className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">Active executions</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
                  <Play className="h-6 w-6 text-success" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
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
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {Math.round(automationOverview?.successRate || 0)}%
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Target className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">
                      {automationOverview?.totalExecutions || 0} total
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-secondary/50 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
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
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">{automationOverview?.completedToday || 0}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary">
                      Avg {Math.round(automationOverview?.avgExecutionTime || 0)}s
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-accent/50 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
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
          <TabsList>
            <TabsTrigger value="workflows">
              <Workflow className="h-4 w-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="autonomous">
              <Bot className="h-4 w-4 mr-2" />
              Autonomous
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            {/* Quick Actions with BentoGrid */}
            <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/dashboard/automation/designer">
                <BentoCard
                  className="cursor-pointer group"
                  gradient={true}
                  hover={true}
                >
                  <div className="flex items-center space-x-3">
                    <InteractiveHoverCard>
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                    </InteractiveHoverCard>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        Create Workflow
                      </h3>
                      <p className="text-sm text-muted-foreground">Build new automation</p>
                    </div>
                  </div>
                </BentoCard>
              </Link>

              <BentoCard
                className="cursor-pointer group"
                gradient={true}
                hover={true}
              >
                <div className="flex items-center space-x-3">
                  <InteractiveHoverCard>
                    <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center group-hover:bg-success/30 transition-colors">
                      <GitBranch className="h-6 w-6 text-success" />
                    </div>
                  </InteractiveHoverCard>
                  <div>
                    <h3 className="font-semibold group-hover:text-success transition-colors">
                      Browse Templates
                    </h3>
                    <p className="text-sm text-muted-foreground">Use pre-built workflows</p>
                  </div>
                </div>
              </BentoCard>

              <BentoCard
                className="cursor-pointer group"
                gradient={true}
                hover={true}
              >
                <div className="flex items-center space-x-3">
                  <InteractiveHoverCard>
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                  </InteractiveHoverCard>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      AI Generator
                    </h3>
                    <p className="text-sm text-muted-foreground">Generate with AI</p>
                  </div>
                </div>
              </BentoCard>
            </BentoGrid>

            {/* Workflow List with Enhanced UI */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Workflows</CardTitle>
                    <CardDescription>Manage and monitor your automation workflows</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {workflowsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50">
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
                    <Workflow className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Workflows Yet</h3>
                    <p className="text-muted-foreground mb-6">
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
                  <BentoGrid className="grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {workflows.map((workflow, index) => (
                        <motion.div
                          key={workflow.id}
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -20 }}
                          transition={{
                            delay: 0.1 * index,
                            duration: 0.4,
                            ease: [0.25, 0.46, 0.45, 0.94]
                          }}
                        >
                          <BentoCard
                            className="group relative overflow-hidden"
                            gradient={workflow.isActive}
                            hover={true}
                          >
                            {/* Animated gradient background for active workflows */}
                            {workflow.isActive && (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-success/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Particles
                                  className="opacity-30"
                                  quantity={20}
                                  ease={30}
                                />
                              </>
                            )}

                            <div className="relative z-10 flex items-start justify-between">
                              <div className="flex items-start space-x-4 flex-1">
                                <InteractiveHoverCard>
                                  <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300">
                                    <Workflow className="h-6 w-6 text-primary" />
                                  </div>
                                </InteractiveHoverCard>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-3 mb-2 flex-wrap">
                                    <motion.h3
                                      className="font-semibold truncate group-hover:text-primary transition-colors"
                                      whileHover={{ scale: 1.02 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      {workflow.name}
                                    </motion.h3>
                                    <motion.div
                                      initial={{ scale: 0.8 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: 0.1 * index + 0.2 }}
                                    >
                                      <Badge className={`text-xs ${getStatusColor(workflow.isActive)}`}>
                                        {workflow.isActive ? (
                                          <span className="flex items-center gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                                            Active
                                          </span>
                                        ) : (
                                          'Inactive'
                                        )}
                                      </Badge>
                                    </motion.div>
                                    {workflow.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {workflow.category}
                                      </Badge>
                                    )}
                                  </div>

                                  {workflow.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                      {workflow.description}
                                    </p>
                                  )}

                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDate(workflow.lastExecutedAt)}
                                    </span>
                                    <span>•</span>
                                    <span>v{workflow.version}</span>
                                  </div>
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => automationService.executeWorkflow(workflow.id)}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Run Now
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Workflow
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => automationService.deleteWorkflow(workflow.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </BentoCard>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </BentoGrid>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="autonomous">
            <AutonomousWorkflowsPage />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Analytics</CardTitle>
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
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Executions</p>
                        <p className="text-2xl font-bold mt-1">
                          {automationOverview.totalExecutions}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                        <p className="text-2xl font-bold mt-1">
                          {Math.round(automationOverview.successRate)}%
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Avg Time</p>
                        <p className="text-2xl font-bold mt-1">
                          {Math.round(automationOverview.avgExecutionTime)}s
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Performance Insights</h3>
                      <div className="space-y-3">
                        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                          <p className="text-sm text-primary">
                            ✓ Your workflows have a {Math.round(automationOverview.successRate)}% success rate
                          </p>
                        </div>
                        <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                          <p className="text-sm text-success">
                            ✓ {automationOverview.activeWorkflows} workflows are currently active
                          </p>
                        </div>
                        {automationOverview.runningExecutions > 0 && (
                          <div className="p-4 bg-accent border border-border rounded-lg">
                            <p className="text-sm text-primary">
                              ⚡ {automationOverview.runningExecutions} executions running right now
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
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
