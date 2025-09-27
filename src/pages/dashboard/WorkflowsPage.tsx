import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';
import { 
  Workflow,
  Plus,
  Play,
  Pause,
  Square,
  Edit,
  Copy,
  Trash2,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  GitBranch,
  Zap,
  Settings,
  Eye,
  Download,
  Upload,
  ChevronRight,
  Loader2,
  Bot,
  Target,
  Repeat,
  Timer,
  Activity,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';
import { toast } from '../../hooks/use-toast';

interface WorkflowNode {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'condition' | 'loop' | 'output';
  config: Record<string, unknown>;
  nextNodes: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  popularity: number;
  icon?: string;
}

interface WorkflowType {
  id: string;
  name: string;
  description: string;
  category: 'automation' | 'ai-tasks' | 'data-processing' | 'integration' | 'custom';
  status: 'active' | 'paused' | 'completed' | 'failed' | 'draft';
  trigger: {
    type: 'manual' | 'scheduled' | 'event' | 'webhook' | 'condition';
    config: Record<string, unknown>;
  };
  nodes: WorkflowNode[];
  executionCount: number;
  successRate: number;
  avgDuration: number; // in seconds
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  version: number;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  progress: number;
  currentNode?: string;
  output?: unknown;
  error?: string;
}

  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<WorkflowType[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  useEffect(() => {
  useEffect(() => {
const WorkflowsPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access this page.</p>
        </div>
      </div>
    );
  }
  

    if (user) {
      loadWorkflows();
    }
  }, [user]);

    filterWorkflows();
  }, [workflows, searchTerm, categoryFilter, statusFilter]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simulate loading delay
      
      
      // TODO: Replace with real Supabase data fetching
      // For now, show empty state
      setData([]);
      setExecutions(mockExecutions);
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading workflows:', error);
      setError('Failed to load workflows.');
    } finally {
      setLoading(false);
    }
  };

  const filterWorkflows = useCallback(() => {
    let filtered = workflows;

    if (searchTerm) {
      filtered = filtered.filter(workflow =>
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(workflow => workflow.category === categoryFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(workflow => workflow.status === statusFilter);
    }

    setFilteredWorkflows(filtered);
  }, [workflows, searchTerm, categoryFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-500" />;
      default:
        return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'automation':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'ai-tasks':
        return <Bot className="h-4 w-4 text-purple-500" />;
      case 'data-processing':
        return <BarChart3 className="h-4 w-4 text-green-500" />;
      case 'integration':
        return <GitBranch className="h-4 w-4 text-orange-500" />;
      case 'custom':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Workflow className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'manual':
        return <Play className="h-3 w-3 text-blue-500" />;
      case 'scheduled':
        return <Clock className="h-3 w-3 text-green-500" />;
      case 'event':
        return <Zap className="h-3 w-3 text-yellow-500" />;
      case 'webhook':
        return <GitBranch className="h-3 w-3 text-purple-500" />;
      case 'condition':
        return <Target className="h-3 w-3 text-orange-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const handleRunWorkflow = async (workflowId: string) => {
    try {
      
      toast({
        title: "Workflow Started",
        description: "Your workflow has been started successfully.",
      });
      loadWorkflows();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start workflow.",
        variant: "destructive",
      });
    }
  };

  const handleCreateWorkflow = async () => {
    setIsCreatingWorkflow(true);
    try {
      
      toast({
        title: "Workflow Created",
        description: "Your new workflow has been created successfully.",
      });
      loadWorkflows();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workflow.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWorkflow(false);
    }
  };

  const workflowStats = {
    total: workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    paused: workflows.filter(w => w.status === 'paused').length,
    failed: workflows.filter(w => w.status === 'failed').length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.executionCount, 0),
    avgSuccessRate: workflows.length > 0 
      ? workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length 
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading workflows...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadWorkflows}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workflows</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage automated workflows for your AI workforce.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={handleCreateWorkflow} disabled={isCreatingWorkflow}>
            {isCreatingWorkflow ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold text-foreground">{workflowStats.total}</p>
                <p className="text-sm text-green-600">{workflowStats.active} active</p>
              </div>
              <Workflow className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold text-foreground">{workflowStats.totalExecutions}</p>
                <p className="text-sm text-muted-foreground">All time</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{workflowStats.avgSuccessRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Average</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold text-primary">{executions.filter(e => e.status === 'running').length}</p>
                <p className="text-sm text-muted-foreground">Running</p>
              </div>
              <Play className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                <option value="automation">Automation</option>
                <option value="ai-tasks">AI Tasks</option>
                <option value="data-processing">Data Processing</option>
                <option value="integration">Integration</option>
                <option value="custom">Custom</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Executions */}
      {executions.filter(e => e.status === 'running').length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Executions</CardTitle>
                <CardDescription>Currently running workflow executions</CardDescription>
              </div>
              <Badge variant="default">
                {executions.filter(e => e.status === 'running').length} Running
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executions.filter(e => e.status === 'running').map((execution) => {
                const workflow = workflows.find(w => w.id === execution.workflowId);
                if (!workflow) return null;
                
                return (
                  <div key={execution.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-foreground">{workflow.name}</h4>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Started {formatTimeAgo(execution.startedAt)}</span>
                        {execution.currentNode && (
                          <>
                            <span>•</span>
                            <span>Current: {execution.currentNode}</span>
                          </>
                        )}
                      </div>
                      <Progress value={execution.progress} className="mt-2 h-2" />
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive">
                        <Square className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows List */}
      <div className="space-y-4">
        {filteredWorkflows.map((workflow) => {
          const execution = executions.find(e => e.workflowId === workflow.id);
          
          return (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getCategoryIcon(workflow.category)}
                      <h3 className="font-semibold text-foreground">{workflow.name}</h3>
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                      <Badge variant="outline">
                        v{workflow.version}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-3">
                      <div className="flex items-center space-x-2">
                        {getTriggerIcon(workflow.trigger.type)}
                        <span className="text-muted-foreground">Trigger:</span>
                        <span className="font-medium capitalize">{workflow.trigger.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Runs:</span>
                        <span className="font-medium">{workflow.executionCount}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Success:</span>
                        <span className="font-medium text-green-600">{workflow.successRate}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Avg:</span>
                        <span className="font-medium">{formatDuration(workflow.avgDuration)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Nodes:</span>
                        <span className="font-medium">{workflow.nodes.length}</span>
                      </div>
                    </div>

                    {/* Nodes Preview */}
                    <div className="flex items-center space-x-2 mb-3">
                      {workflow.nodes.slice(0, 3).map((node, index) => (
                        <React.Fragment key={node.id}>
                          <Badge variant="outline" className="text-xs">
                            {node.name}
                          </Badge>
                          {index < Math.min(2, workflow.nodes.length - 1) && (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </React.Fragment>
                      ))}
                      {workflow.nodes.length > 3 && (
                        <>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            +{workflow.nodes.length - 3} more
                          </span>
                        </>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Tags:</span>
                      <div className="flex space-x-1">
                        {workflow.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {getStatusIcon(workflow.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    {workflow.lastRun && (
                      <span>Last run: {formatTimeAgo(workflow.lastRun)}</span>
                    )}
                    {workflow.nextRun && (
                      <span> • Next run: {new Date(workflow.nextRun).toLocaleString()}</span>
                    )}
                    {!workflow.lastRun && !workflow.nextRun && (
                      <span>Never executed</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                    {workflow.status === 'active' ? (
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRunWorkflow(workflow.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredWorkflows.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Workflow className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No workflows found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || categoryFilter || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Start by creating your first workflow.'}
            </p>
            <Button onClick={handleCreateWorkflow}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowsPage;
