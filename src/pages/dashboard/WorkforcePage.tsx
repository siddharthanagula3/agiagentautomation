import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { 
  Workflow, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Edit,
  Trash2,
  Zap,
  BarChart3,
  Activity,
  DollarSign,
  Calendar,
  FileText,
  Upload,
  Download,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';
import { jobsService } from '../../services/jobsService';
import { agentsService } from '../../services/agentsService';
import type { Database } from '../../integrations/supabase/types';

type Job = Databas;
  e['public']['Tables']['jobs']['Row'];
type AIAgent = Databas;
  e['public']['Tables']['ai_agents']['Row'];

interface JobFile {
  name: string;
  url: string;
  type: string;
  size?: number;
}

  const [selectedStatus, setSelectedStatus] = useState('');

const WorkforcePage: React.FC = () => {
  const { user } = useAuth();
  
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent' | 'critical',
    assigned_agent_id: '',
    estimated_duration: 0,
    files: [] as JobFile[],
    tags: [] as string[]
  });

    if (user) {loadData();
      const timeout = setTimeout(() => setLoading(false), 8000);
      return (
    <div>Component content</div>
  );
};

const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await jobsService.createJob(user.id, newJob);
      
      if (error) {console.error('Error creating job:', error);
        return;
      }

      // Reset form
      setNewJob({
        title: '',
        description: '',
        priority: 'medium',
        assigned_agent_id: '',
        estimated_duration: 0,
        files: [],
        tags: []
      });
      setShowCreateJob(false);
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const handleJobAction = async (jobId: string, action: string) => {
    if (!user) return;

    try {
      let result;
      switch (action) {
        case 'start':
            result = await jobsService.resumeJob(jobId);
          break;
        case 'pause':
          result = await jobsService.pauseJob(jobId);
          break;
        case 'cancel':
          result = await jobsService.cancelJob(jobId);
          break;
        case 'delete':
          result = await jobsService.deleteJob(jobId);
          break;
      }

      if (result?.error) {console.error(`Error ${action} job:`, result.error);
        return;
      }

      // Reload data
      await loadData();
    } catch (error) {
      console.error(`Error ${action} job:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'running':
        return 'bg-primary/10 text-primary';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      case 'paused':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive/10 text-destructive';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Play className="h-4 w-4 text-primary" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Mat;
  h.floor(minutes / 60);
    const mins = minute;
  s % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  if (loading) {return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading workforce...</span>
        </div>
      </div>
    );
  }

  if (error) {return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Empty state for new users */}
      {data.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No data yet</h3>
          <p className="text-muted-foreground mb-4">
            This page will show your data once you start using the system.
          </p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Workforce</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your AI workforce jobs and tasks.
          </p>
        </div>
        <Button onClick={() => setShowCreateJob(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold text-foreground">{jobStats.totalJobs}</p>
              </div>
              <Workflow className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold text-primary">{jobStats.activeJobs}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{jobStats.completedJobs}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {jobStats.totalJobs > 0 ? Math.round((jobStats.completedJobs / jobStats.totalJobs) * 100) : 0}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold text-foreground">${jobStats.totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Time</p>
                <p className="text-2xl font-bold text-foreground">{formatDuration(jobStats.avgCompletionTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
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
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="queued">Queued</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="paused">Paused</option>
              </select>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length > 0 ? filteredJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    <Badge className={getPriorityColor(job.priority)}>
                      {job.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{job.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{job.ai_agents?.name || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{job.actual_duration ? formatDuration(job.actual_duration) : 'In progress'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>${job.cost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatTimeAgo(job.created_at)}</span>
                    </div>
                  </div>

                  {job.status === 'running' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{job.files?.length || 0} files</span>
                    {job.tags?.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{job.tags.join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusIcon(job.status)}
                  <div className="flex space-x-1">
                    {job.status === 'queued' && (
                      <Button size="sm" onClick={() => handleJobAction(job.id, 'start')}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {job.status === 'running' && (
                      <Button size="sm" variant="outline" onClick={() => handleJobAction(job.id, 'pause')}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {job.status === 'paused' && (
                      <Button size="sm" onClick={() => handleJobAction(job.id, 'start')}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive/80" onClick={() => handleJobAction(job.id, 'delete')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Workflow className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || selectedStatus || selectedPriority
                  ? 'Try adjusting your search criteria.'
                  : 'Create your first job to get started with the AI workforce.'}
              </p>
              <Button onClick={() => setShowCreateJob(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Job</CardTitle>
              <CardDescription>
                Submit a new task to your AI workforce
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateJob} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      placeholder="Enter job title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={newJob.priority}
                      onChange={(e) => setNewJob({ ...newJob, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' | 'critical' })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    placeholder="Describe the task in detail"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agent">Assign to Agent (Optional)</Label>
                    <select
                      id="agent"
                      value={newJob.assigned_agent_id}
                      onChange={(e) => setNewJob({ ...newJob, assigned_agent_id: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Auto-assign</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} - {agent.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newJob.estimated_duration}
                      onChange={(e) => setNewJob({ ...newJob, estimated_duration: parseInt(e.target.value) || 0 })}
                      placeholder="60"
                    />
                  </div>
                </div>

                <div>
                  <Label>Upload Files (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateJob(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Job
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WorkforcePage;