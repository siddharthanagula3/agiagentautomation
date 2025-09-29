/**
 * Automation Page - Main automation hub and workflow management
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AutonomousWorkflowsPage from '@/pages/autonomous/AutonomousWorkflowsPage';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Square,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Activity,
  TrendingUp,
  Bot,
  Workflow,
  GitBranch,
  Target,
  Sparkles,
  ArrowRight,
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

interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastRun: Date;
  nextRun?: Date;
  executionCount: number;
  successRate: number;
  avgDuration: number;
  assignedEmployees: string[];
}

const AutomationPage: React.FC = () => {
  const [workflows] = useState<WorkflowSummary[]>([
    {
      id: 'wf-001',
      name: 'Customer Data Pipeline',
      description: 'Automated processing and analysis of customer data',
      status: 'running',
      progress: 67,
      category: 'Data Processing',
      priority: 'high',
      lastRun: new Date(Date.now() - 3600000),
      nextRun: new Date(Date.now() + 7200000),
      executionCount: 247,
      successRate: 98.2,
      avgDuration: 42,
      assignedEmployees: ['emp-001', 'emp-003']
    },
    {
      id: 'wf-002',
      name: 'Marketing Campaign Optimizer',
      description: 'Real-time optimization of marketing campaigns',
      status: 'running',
      progress: 89,
      category: 'Marketing',
      priority: 'medium',
      lastRun: new Date(Date.now() - 1800000),
      nextRun: new Date(Date.now() + 3600000),
      executionCount: 156,
      successRate: 94.1,
      avgDuration: 28,
      assignedEmployees: ['emp-004']
    },
    {
      id: 'wf-003',
      name: 'Code Quality Assessment',
      description: 'Automated code review and quality metrics',
      status: 'paused',
      progress: 34,
      category: 'Development',
      priority: 'low',
      lastRun: new Date(Date.now() - 7200000),
      executionCount: 89,
      successRate: 96.7,
      avgDuration: 15,
      assignedEmployees: ['emp-005', 'emp-006']
    },
    {
      id: 'wf-004',
      name: 'Financial Report Generator',
      description: 'Automated generation of financial reports and insights',
      status: 'completed',
      progress: 100,
      category: 'Finance',
      priority: 'high',
      lastRun: new Date(Date.now() - 86400000),
      nextRun: new Date(Date.now() + 604800000),
      executionCount: 52,
      successRate: 100,
      avgDuration: 180,
      assignedEmployees: ['emp-001']
    }
  ]);

  // Stats calculations
  const stats = {
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter(w => w.status === 'running').length,
    pausedWorkflows: workflows.filter(w => w.status === 'paused').length,
    averageSuccessRate: workflows.reduce((acc, w) => acc + w.successRate, 0) / workflows.length,
    totalExecutions: workflows.reduce((acc, w) => acc + w.executionCount, 0),
    avgExecutionTime: workflows.reduce((acc, w) => acc + w.avgDuration, 0) / workflows.length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'paused': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'completed': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'failed': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Workflows</p>
                <p className="text-2xl font-bold text-white">{stats.totalWorkflows}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+3 this week</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Workflow className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Now</p>
                <p className="text-2xl font-bold text-white">{stats.activeWorkflows}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Activity className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">{stats.pausedWorkflows} paused</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Play className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">{stats.averageSuccessRate.toFixed(1)}%</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Target className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+2.1% vs last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Duration</p>
                <p className="text-2xl font-bold text-white">{formatDuration(stats.avgExecutionTime)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="h-3 w-3 text-orange-400" />
                  <span className="text-xs text-orange-400">{stats.totalExecutions} total runs</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
            </div>
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
                    <CardTitle className="text-white">Active Workflows</CardTitle>
                    <CardDescription>Manage and monitor your automation workflows</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                            <Badge className={`text-xs border ${getStatusColor(workflow.status)}`}>
                              {workflow.status}
                            </Badge>
                            <Badge className={`text-xs border ${getPriorityColor(workflow.priority)}`}>
                              {workflow.priority}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-slate-400 truncate mb-2">
                            {workflow.description}
                          </p>
                          
                          {workflow.status === 'running' && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>Progress</span>
                                <span>{workflow.progress}%</span>
                              </div>
                              <Progress value={workflow.progress} className="h-1" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-sm text-slate-400">
                        <div className="text-right">
                          <p className="text-white font-medium">{workflow.successRate}%</p>
                          <p className="text-xs">Success Rate</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-white font-medium">{workflow.executionCount}</p>
                          <p className="text-xs">Executions</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-white font-medium">{formatDuration(workflow.avgDuration)}</p>
                          <p className="text-xs">Avg Duration</p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem className="text-slate-300">
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
                            <DropdownMenuItem className="text-red-400">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
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
                <p className="text-slate-400">
                  Detailed analytics and performance metrics for your automation workflows
                  will be displayed here. This includes execution trends, resource utilization,
                  and optimization opportunities.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AutomationPage;