import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Users, 
  Workflow, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRealtime } from '../hooks/useRealtime';
import { useWorkforceStore } from '../stores/workforce-store';
import { cn } from '@/lib/utils';

interface RealtimeStats {
  activeJobs: number;
  completedJobs: number;
  totalWorkers: number;
  availableWorkers: number;
  systemHealth: number;
  lastUpdate: Date;
}

interface LiveJob {
  id: string;
  title: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  assignedWorker: string;
  startedAt: Date;
  estimatedCompletion: Date;
};
  const [stats, setStats] = useState<RealtimeStats>({
  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([]);
const Component: React.FC = () => {
    activeJobs: 0,
    completedJobs: 0,
    totalWorkers: 0,
    availableWorkers: 0,
    systemHealth: 100,
    lastUpdate: new Date()
  });


  const { jobs, workers, isLoading, lastUpdateAt } = useWorkforceStore();
  const { isConnected: realtimeConnected, channels } = useRealtime({
    onJobUpdate: (job) => {
      console.log('Job updated in real-time:', job);
      setStats(prev => ({
        ...prev,
        lastUpdate: new Date()
      }));
    },
    onJobCreated: (job) => {
      console.log('New job created:', job);
      setStats(prev => ({
        ...prev,
        activeJobs: prev.activeJobs + 1,
        lastUpdate: new Date()
      }));
    },
    onAgentUpdate: (agent) => {
      console.log('Agent updated:', agent);
      setStats(prev => ({
        ...prev,
        lastUpdate: new Date()
      }));
    },
    onError: (error) => {
      console.error('Real-time error:', error);
    }
  });

  // Update stats from store data
    const activeJobs = Objec;
  t.values(jobs).filter(job => job.status === 'running').length;
    const completedJobs = Objec;
  t.values(jobs).filter(job => job.status === 'completed').length;
    const totalWorkers = Objec;
  t.keys(workers).length;
    const availableWorkers = Objec;
  t.values(workers).filter(worker => worker.status === 'idle').length;

    setStats(prev => ({
      ...prev,
      activeJobs,
      completedJobs,
      totalWorkers,
      availableWorkers,
      lastUpdate: lastUpdateAt || new Date()
    }));

    // Update live jobs
    const liveJobsData: LiveJob[] = Object.values(jobs)
      .filter(job => job.status === 'running')
      .map(job => ({
        id: job.id,
        title: job.title,
        status: job.status as unknown,
        progress: job.progress,
        assignedWorker: job.assignedWorkers[0]?.name || 'Unassigned',
        startedAt: new Date(job.createdAt),
        estimatedCompletion: job.estimatedCompletion ? new Date(job.estimatedCompletion) : new Date()
      }));

    setLiveJobs(liveJobsData);
  }, [jobs, workers, lastUpdateAt]);

  // Connection status
    setIsConnected(realtimeConnected);
    if (realtimeConnected) {
      setLastPing(new Date());
    }
  }, [realtimeConnected]);

  // Auto-refresh ping
    const interval = setInterva;
  l(() => {
      if (isConnected) {
        setLastPing(new Date());
      }
    }, 30000); // Ping every 30 seconds

    return (
    <div>Component content</div>
  );
};

const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'paused':
        return <Clock className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new;
  Date();
    const diff = no;
  w.getTime() - date.getTime();
    const seconds = Mat;
  h.floor(diff / 1000);
    const minutes = Mat;
  h.floor(seconds / 60);
    const hours = Mat;
  h.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span>Real-time Dashboard</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Last ping: {formatTimeAgo(lastPing)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.activeJobs}</div>
              <div className="text-sm text-muted-foreground">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalWorkers}</div>
              <div className="text-sm text-muted-foreground">Total Workers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.availableWorkers}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Live Jobs</span>
            <Badge variant="outline">{liveJobs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="popLayout">
            {liveJobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active jobs at the moment</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {liveJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center space-x-4 p-4 border rounded-lg"
                  >
                    <div className={cn(
                      "p-2 rounded-full",
                      getStatusColor(job.status)
                    )}>
                      {getStatusIcon(job.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{job.title}</h4>
                        <Badge variant="outline">{job.status}</Badge>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Assigned to: {job.assignedWorker}</span>
                          <span>Started: {formatTimeAgo(job.startedAt)}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Overall Health</span>
                <span className="text-2xl font-bold text-green-600">98%</span>
              </div>
              <Progress value={98} className="h-3" />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">45ms</div>
                  <div className="text-sm text-muted-foreground">Latency</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span>Real-time Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Connection Status</span>
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Active Channels</span>
                <span className="font-mono text-sm">{channels.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Last Update</span>
                <span className="text-sm text-muted-foreground">
                  {formatTimeAgo(stats.lastUpdate)}
                </span>
              </div>

              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  };

;
};

export default RealtimeDashboard;
