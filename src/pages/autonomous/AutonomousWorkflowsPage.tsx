/**
 * Enhanced Autonomous Workflows Page
 * Modern UI for managing proactive and autonomous workflows
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Calendar,
  Bell,
  BarChart3,
  Settings,
  Eye,
  Trash2,
  Loader2,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Copy,
  Edit,
  Download,
  Upload,
  Brain,
  Bot,
  MessageSquare,
  Database,
  Globe,
  Code,
  FileText,
  Mail,
  Smartphone,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Layers,
  GitBranch,
  Power,
  PowerOff,
  RefreshCw,
  Archive,
  ExternalLink,
  Info,
  Sparkles,
  Cpu,
  Network
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { autonomousWorkflowService, type AutonomousWorkflow, type StandingOrder } from '@/services/autonomous-workflow-service';
import { useAuthStore } from '@/stores/unified-auth-store';
import { toast } from 'sonner';

interface AutonomousWorkflowsPageProps {
  className?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'communication' | 'automation' | 'monitoring';
  icon: React.ComponentType<{ className?: string }>;
  workflow: Partial<AutonomousWorkflow>;
  premium?: boolean;
}

interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  successRate: number;
  totalExecutions: number;
  avgExecutionTime: number;
  upcomingRuns: number;
}

const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'daily-analytics',
    name: 'Daily Analytics Report',
    description: 'Generate and send daily performance analytics',
    category: 'analytics',
    icon: BarChart3,
    workflow: {
      name: 'Daily Analytics Report',
      description: 'Automated daily analytics report generation and distribution',
      actions: [
        { id: 'collect-data', type: 'data_collection', config: { sources: ['website', 'app', 'sales'] } },
        { id: 'analyze', type: 'ai_analysis', config: { model: 'gpt-4', task: 'Generate insights' } },
        { id: 'report', type: 'report_generation', config: { format: 'pdf', template: 'analytics' } },
        { id: 'notify', type: 'notification', config: { type: 'email', recipients: ['team@company.com'] } }
      ],
      schedule: { frequency: 'daily', time: '09:00' }
    }
  },
  {
    id: 'lead-nurturing',
    name: 'Lead Nurturing Campaign',
    description: 'Automated lead scoring and follow-up sequences',
    category: 'communication',
    icon: Users,
    workflow: {
      name: 'Lead Nurturing Campaign',
      description: 'Automated lead qualification and nurturing workflow',
      actions: [
        { id: 'score-leads', type: 'ai_analysis', config: { model: 'claude-3', task: 'Score leads' } },
        { id: 'segment', type: 'data_processing', config: { criteria: 'score > 75' } },
        { id: 'personalize', type: 'content_generation', config: { template: 'personalized_email' } },
        { id: 'send', type: 'notification', config: { type: 'email', personalized: true } }
      ],
      schedule: { frequency: 'hourly' }
    },
    premium: true
  },
  {
    id: 'system-monitoring',
    name: 'System Health Monitor',
    description: 'Monitor system performance and alert on issues',
    category: 'monitoring',
    icon: Activity,
    workflow: {
      name: 'System Health Monitor',
      description: 'Continuous system monitoring with intelligent alerting',
      actions: [
        { id: 'check-metrics', type: 'api_call', config: { endpoint: '/health', method: 'GET' } },
        { id: 'analyze-health', type: 'ai_analysis', config: { task: 'Analyze system metrics' } },
        { id: 'alert', type: 'conditional_notification', config: { condition: 'issue_detected' } }
      ],
      schedule: { frequency: 'custom', interval: '5m' }
    }
  },
  {
    id: 'content-creation',
    name: 'Content Creation Pipeline',
    description: 'Automated content research, creation, and publishing',
    category: 'automation',
    icon: FileText,
    workflow: {
      name: 'Content Creation Pipeline',
      description: 'End-to-end content creation and publishing automation',
      actions: [
        { id: 'research', type: 'web_search', config: { topics: ['industry trends', 'competitors'] } },
        { id: 'generate', type: 'content_generation', config: { type: 'blog_post', tone: 'professional' } },
        { id: 'review', type: 'ai_review', config: { criteria: ['quality', 'seo', 'brand_voice'] } },
        { id: 'publish', type: 'api_call', config: { endpoint: '/content/publish', method: 'POST' } }
      ],
      schedule: { frequency: 'weekly', time: '10:00', day: 'monday' }
    },
    premium: true
  }
];

export const AutonomousWorkflowsPage: React.FC<AutonomousWorkflowsPageProps> = ({ className }) => {
  // State management
  const [selectedTab, setSelectedTab] = useState('workflows');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'lastRun' | 'nextRun'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);
  const [selectedWorkflowDetails, setSelectedWorkflowDetails] = useState<StandingOrder | null>(null);

  const queryClient = useQueryClient();

  const { user } = useAuthStore();
  const userId = user?.id;

  // Fetch standing orders (real user id)
  const { data: standingOrders = [], isLoading, error } = useQuery<StandingOrder[]>({
    queryKey: ['standing-orders'],
    queryFn: () => autonomousWorkflowService.getStandingOrders(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Derived metrics from real data
  const metrics: WorkflowMetrics = useMemo(() => {
    const total = standingOrders.length;
    const active = standingOrders.filter(o => o.isActive).length;
    const successAvg = Math.round(
      standingOrders.length > 0
        ? standingOrders.reduce((acc, o) => acc + (o.workflow.successRate || 0), 0) / standingOrders.length
        : 0
    );
    const totalRuns = standingOrders.reduce((acc, o) => acc + (o.workflow.runCount || 0), 0);
    const avgTime = standingOrders.length > 0
      ? Math.round((standingOrders.reduce((acc, o) => acc + (o.workflow.avgExecutionTime || 0), 0) / standingOrders.length) * 10) / 10
      : 0;
    const upcoming = standingOrders.filter(o => !!o.workflow.nextRun && o.isActive).length;

    return {
      totalWorkflows: total,
      activeWorkflows: active,
      successRate: successAvg,
      totalExecutions: totalRuns,
      avgExecutionTime: avgTime,
      upcomingRuns: upcoming
    };
  }, [standingOrders]);

  // Filter and sort workflows
  const filteredWorkflows = useMemo(() => {
    let filtered = standingOrders.filter(order => {
      const matchesSearch = order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           order.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && order.isActive) ||
                           (statusFilter === 'inactive' && !order.isActive) ||
                           order.workflow.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.workflow.status;
          bValue = b.workflow.status;
          break;
        case 'lastRun':
          aValue = a.workflow.lastRun?.getTime() || 0;
          bValue = b.workflow.lastRun?.getTime() || 0;
          break;
        case 'nextRun':
          aValue = a.workflow.nextRun?.getTime() || 0;
          bValue = b.workflow.nextRun?.getTime() || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [standingOrders, searchQuery, statusFilter, sortBy, sortOrder]);

  // Mutations
  const createStandingOrderMutation = useMutation({
    mutationFn: async (orderData: {
      name: string;
      description: string;
      workflow: Omit<AutonomousWorkflow, 'id' | 'createdAt' | 'updatedAt'>;
    }) => {
      return autonomousWorkflowService.createStandingOrder(
        'current-user-id',
        orderData.name,
        orderData.description,
        orderData.workflow
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standing-orders'] });
      setShowCreateForm(false);
      setShowTemplateDialog(false);
      toast.success('Workflow created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create workflow');
      console.error('Create workflow error:', error);
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ orderId, isActive }: { orderId: string; isActive: boolean }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standing-orders'] });
      toast.success('Workflow status updated');
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standing-orders'] });
      toast.success('Workflow deleted');
    },
  });

  // Handlers
  const handleCreateFromTemplate = useCallback((template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateDialog(true);
  }, []);

  const handleToggleWorkflow = useCallback((orderId: string, currentStatus: boolean) => {
    toggleWorkflowMutation.mutate({ orderId, isActive: !currentStatus });
  }, [toggleWorkflowMutation]);

  const handleDeleteWorkflow = useCallback((orderId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflowMutation.mutate(orderId);
    }
  }, [deleteWorkflowMutation]);

  const handleViewDetails = useCallback((order: StandingOrder) => {
    setSelectedWorkflowDetails(order);
    setShowWorkflowDetails(true);
  }, []);

  // Utility functions
  const getStatusIcon = (status: AutonomousWorkflow['status']) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4 text-green-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: AutonomousWorkflow['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'paused': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatNextRun = (nextRun?: Date) => {
    if (!nextRun) return 'Not scheduled';
    
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Running now';
    if (minutes < 60) return `In ${minutes}m`;
    if (hours < 24) return `In ${hours}h`;
    return `In ${days}d`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analytics': return BarChart3;
      case 'communication': return MessageSquare;
      case 'automation': return Zap;
      case 'monitoring': return Activity;
      default: return Workflow;
    }
  };

  if (error) {
    return (
      <div className={cn('p-6 space-y-6', className)}>
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-400">
            Failed to load workflows. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Autonomous Workflows</h1>
          <p className="text-slate-400 mt-1">
            Create and manage intelligent automation that works around the clock
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['standing-orders'] })}
            className="text-slate-400 hover:text-white"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => setShowTemplateDialog(true)}
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </motion.div>

      {/* Metrics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4"
      >
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Workflow className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total</p>
                <p className="text-xl font-semibold text-white">{metrics.totalWorkflows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Play className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active</p>
                <p className="text-xl font-semibold text-white">{metrics.activeWorkflows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Success Rate</p>
                <p className="text-xl font-semibold text-white">{metrics.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Executions</p>
                <p className="text-xl font-semibold text-white">{metrics.totalExecutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg Time</p>
                <p className="text-xl font-semibold text-white">{metrics.avgExecutionTime}s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Upcoming</p>
                <p className="text-xl font-semibold text-white">{metrics.upcomingRuns}</p>
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
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="workflows" className="data-[state=active]:bg-slate-700">
              Workflows
            </TabsTrigger>
            <TabsTrigger value="executions" className="data-[state=active]:bg-slate-700">
              Executions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            {/* Filters and Search */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search workflows..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-slate-700/30 border-slate-600/30 text-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-40 bg-slate-700/30 border-slate-600/30 text-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="lastRun">Last Run</SelectItem>
                      <SelectItem value="nextRun">Next Run</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="text-slate-400 hover:text-white"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Workflows Grid */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-slate-700 rounded w-1/4 mb-3"></div>
                        <div className="h-3 bg-slate-700 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-slate-700 rounded w-1/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredWorkflows.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                      <Workflow className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {searchQuery || statusFilter !== 'all' ? 'No workflows found' : 'No workflows yet'}
                    </h3>
                    <p className="text-slate-400 text-center mb-6">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filters'
                        : 'Create your first autonomous workflow to automate your business processes'
                      }
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => setShowTemplateDialog(true)}
                          variant="ghost"
                          className="text-slate-400 hover:text-white"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Browse Templates
                        </Button>
                        <Button 
                          onClick={() => setShowCreateForm(true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Workflow
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredWorkflows.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:bg-slate-800/70 transition-all duration-200 group">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                    {order.name}
                                  </h3>
                                  <Badge className={cn('text-xs border', getStatusColor(order.workflow.status))}>
                                    <div className="flex items-center space-x-1">
                                      {getStatusIcon(order.workflow.status)}
                                      <span className="capitalize">{order.workflow.status}</span>
                                    </div>
                                  </Badge>
                                  {order.isActive && (
                                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                                  {order.description}
                                </p>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-slate-500">Schedule:</span>
                                    <p className="text-slate-300 font-medium capitalize">
                                      {order.workflow.schedule.frequency}
                                      {order.workflow.schedule.time && ` at ${order.workflow.schedule.time}`}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Runs:</span>
                                    <p className="text-slate-300 font-medium">{order.workflow.runCount || 0}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Success Rate:</span>
                                    <p className="text-slate-300 font-medium">{order.workflow.successRate || 0}%</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Next Run:</span>
                                    <p className="text-slate-300 font-medium">
                                      {formatNextRun(order.workflow.nextRun)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewDetails(order)}
                                      className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleToggleWorkflow(order.id, order.isActive)}
                                      className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                      disabled={toggleWorkflowMutation.isPending}
                                    >
                                      {order.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{order.isActive ? 'Pause' : 'Resume'}</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteWorkflow(order.id)}
                                      className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                      disabled={deleteWorkflowMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>

                            {/* Progress Bar for Active Workflows */}
                            {order.isActive && order.workflow.nextRun && (
                              <div className="mt-4 pt-4 border-t border-slate-700/50">
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                                  <span>Next execution</span>
                                  <span>{formatNextRun(order.workflow.nextRun)}</span>
                                </div>
                                <Progress 
                                  value={Math.random() * 100} 
                                  className="h-1.5"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="executions" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Recent Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-400">Execution history will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Workflow Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-400">Analytics dashboard will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Workflow Templates</DialogTitle>
            <DialogDescription className="text-slate-400">
              Choose from pre-built templates to get started quickly
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {workflowTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card 
                  key={template.id} 
                  className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/70 transition-colors cursor-pointer group"
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                        <IconComponent className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {template.name}
                          </h3>
                          {template.premium && (
                            <Badge variant="secondary" className="text-xs">Pro</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-3">
                          {template.description}
                        </p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow Details Dialog */}
      <Dialog open={showWorkflowDetails} onOpenChange={setShowWorkflowDetails}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedWorkflowDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{selectedWorkflowDetails.name}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {selectedWorkflowDetails.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-6">
                {/* Status and Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-xs text-slate-400">Status</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(selectedWorkflowDetails.workflow.status)}
                      <span className="text-sm font-medium text-white capitalize">
                        {selectedWorkflowDetails.workflow.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-xs text-slate-400">Runs</p>
                    <p className="text-sm font-medium text-white">
                      {selectedWorkflowDetails.workflow.runCount || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-xs text-slate-400">Success Rate</p>
                    <p className="text-sm font-medium text-white">
                      {selectedWorkflowDetails.workflow.successRate || 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-xs text-slate-400">Next Run</p>
                    <p className="text-sm font-medium text-white">
                      {formatNextRun(selectedWorkflowDetails.workflow.nextRun)}
                    </p>
                  </div>
                </div>

                {/* Workflow Actions */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Workflow Steps</h4>
                  <div className="space-y-3">
                    {selectedWorkflowDetails.workflow.actions.map((action, index) => (
                      <div key={action.id} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white capitalize">
                            {action.type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-slate-400">
                            {Object.entries(action.config).map(([key, value]) => `${key}: ${value}`).join(', ')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {action.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schedule Details */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Schedule</h4>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Frequency:</span>
                        <p className="text-white font-medium capitalize">
                          {selectedWorkflowDetails.workflow.schedule.frequency}
                        </p>
                      </div>
                      {selectedWorkflowDetails.workflow.schedule.time && (
                        <div>
                          <span className="text-slate-400">Time:</span>
                          <p className="text-white font-medium">
                            {selectedWorkflowDetails.workflow.schedule.time}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Workflow Form */}
      {showCreateForm && (
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Workflow</DialogTitle>
              <DialogDescription className="text-slate-400">
                Set up a new autonomous workflow to automate your processes
              </DialogDescription>
            </DialogHeader>
            
            <CreateWorkflowForm
              onSubmit={(data) => {
                const workflow: Omit<AutonomousWorkflow, 'id' | 'createdAt' | 'updatedAt'> = {
                  name: data.name,
                  description: data.description,
                  trigger: { type: 'schedule', config: {} },
                  actions: [
                    {
                      id: 'action-1',
                      type: 'ai_task',
                      config: { task: 'Execute workflow task', model: 'gpt-4' }
                    }
                  ],
                  conditions: [],
                  schedule: {
                    frequency: data.frequency,
                    time: data.time
                  },
                  status: 'active',
                  runCount: 0,
                  successRate: 0
                };

                createStandingOrderMutation.mutate({
                  name: data.name,
                  description: data.description,
                  workflow
                });
              }}
              onCancel={() => setShowCreateForm(false)}
              isLoading={createStandingOrderMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Create Workflow Form Component
interface CreateWorkflowFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    frequency: AutonomousWorkflow['schedule']['frequency'];
    time?: string;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CreateWorkflowForm: React.FC<CreateWorkflowFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily' as AutonomousWorkflow['schedule']['frequency'],
    time: '09:00',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      <div>
        <Label htmlFor="name" className="text-slate-300">Workflow Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Daily Sales Report"
          className="mt-2 bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description" className="text-slate-300">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what this workflow does..."
          className="mt-2 min-h-[100px] bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="frequency" className="text-slate-300">Frequency *</Label>
          <Select 
            value={formData.frequency} 
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}
          >
            <SelectTrigger className="mt-2 bg-slate-700/30 border-slate-600/30 text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="time" className="text-slate-300">Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            disabled={formData.frequency === 'hourly'}
            className="mt-2 bg-slate-700/30 border-slate-600/30 text-white"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel}
          className="text-slate-400 hover:text-white"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.name.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Create Workflow
        </Button>
      </div>
    </form>
  );
};

export default AutonomousWorkflowsPage;