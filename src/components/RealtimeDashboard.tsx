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
}

const RealtimeDashboard: React.FC = () => {
  const [stats, setStats] = useState<RealtimeStats>({
    activeJobs: 0,
    completedJobs: 0,
    totalWorkers: 0,
    availableWorkers: 0,
    systemHealth: 100,
    lastUpdate: new Date()
  });
  
  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState<Date>(new Date());

  const { workforce } = useWorkforceStore();

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeJobs: Math.floor(Math.random() * 10) + 1,
        completedJobs: Math.floor(Math.random() * 50) + 10,
        totalWorkers: workforce.length,
        availableWorkers: Math.floor(Math.random() * workforce.length),
        systemHealth: Math.floor(Math.random() * 20) + 80,
        lastUpdate: new Date()
      }));

      setLastPing(new Date());
      setIsConnected(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [workforce]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'paused': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-time Dashboard</h1>
          <p className="text-gray-600">Monitor your AI workforce in real-time</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Total completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableWorkers}</div>
            <p className="text-xs text-muted-foreground">
              Out of {stats.totalWorkers} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemHealth}%</div>
            <Progress value={stats.systemHealth} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Live Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Live Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {liveJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active jobs at the moment</p>
                <p className="text-sm">Jobs will appear here when they start running</p>
              </div>
            ) : (
              <AnimatePresence>
                {liveJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        getStatusColor(job.status)
                      )} />
                      <div>
                        <h3 className="font-medium">{job.title}</h3>
                        <p className="text-sm text-gray-600">
                          Assigned to: {job.assignedWorker}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{job.progress}%</div>
                        <Progress value={job.progress} className="w-20" />
                      </div>
                      <Badge variant="outline" className="flex items-center space-x-1">
                        {getStatusIcon(job.status)}
                        <span className="capitalize">{job.status}</span>
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {stats.lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default RealtimeDashboard;