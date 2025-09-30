/**
 * Jobs Page - Real Data Implementation
 * Displays workflow executions as "jobs" from Supabase
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/unified-auth-store';
import { automationService } from '@/services/automation-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Briefcase, 
  Plus, 
  Search, 
  MoreHorizontal,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';

const JobsPage: React.FC = () => {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch automation overview for stats
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['automation-overview', userId],
    queryFn: () => automationService.getAutomationOverview(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  // Fetch recent executions as "jobs"
  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['user-executions', userId],
    queryFn: () => automationService.getUserExecutions(userId!, 50),
    enabled: !!userId,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view jobs</CardDescription>
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

  const isLoading = overviewLoading || executionsLoading;

  // Calculate stats from executions
  const stats = {
    total: executions?.length || 0,
    pending: executions?.filter(e => e.status === 'pending').length || 0,
    inProgress: executions?.filter(e => e.status === 'running').length || 0,
    completed: executions?.filter(e => e.status === 'completed').length || 0,
    failed: executions?.filter(e => e.status === 'failed').length || 0,
  };

  // Filter executions based on search
  const filteredExecutions = executions?.filter(execution => 
    execution.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    execution.workflowId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    execution.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-500/30';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-500/30';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-500/30';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-500/30';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400 border-slate-500/30';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            Monitor and manage your automation job executions
          </p>
        </div>
        <Link to="/dashboard/automation">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All executions</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Waiting to start</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">{stats.inProgress}</div>
                  {stats.inProgress > 0 && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Currently executing</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Successfully finished</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.failed}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Jobs</CardTitle>
          <CardDescription>
            Find and filter your job executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, workflow, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Executions</CardTitle>
              <CardDescription>
                Recent workflow execution history
              </CardDescription>
            </div>
            {stats.inProgress > 0 && (
              <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                {stats.inProgress} Running
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {executionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats.total === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No jobs yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create and run workflows to see job executions here
              </p>
              <div className="mt-6">
                <Link to="/dashboard/automation">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Workflow
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExecutions.map((execution) => (
                <div 
                  key={execution.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getStatusIcon(execution.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Execution #{execution.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        Workflow: {execution.workflowId.slice(0, 8)}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                        <span>Started {formatDate(execution.executedAt)}</span>
                        {execution.durationMs && (
                          <>
                            <span>•</span>
                            <span>Duration: {formatDuration(execution.durationMs)}</span>
                          </>
                        )}
                        {execution.triggerSource && (
                          <>
                            <span>•</span>
                            <span>Trigger: {execution.triggerSource}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge className={getStatusColor(execution.status)}>
                      {execution.status}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {filteredExecutions.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No jobs match your search criteria
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing your jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/dashboard/automation">
              <Button variant="outline" className="h-20 w-full flex-col">
                <Plus className="h-6 w-6 mb-2" />
                Create Workflow
              </Button>
            </Link>
            <Link to="/dashboard/automation">
              <Button variant="outline" className="h-20 w-full flex-col">
                <Play className="h-6 w-6 mb-2" />
                View Workflows
              </Button>
            </Link>
            <Link to="/dashboard/analytics">
              <Button variant="outline" className="h-20 w-full flex-col">
                <Briefcase className="h-6 w-6 mb-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobsPage;
