/**
 * Task Division Component
 * Shows AI's plan of action before execution
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Brain,
  Zap,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'simple' | 'medium' | 'reasoning';
  status: 'pending' | 'running' | 'completed' | 'failed';
  estimatedTime: number; // in minutes
  assignedEmployee?: string;
  dependencies?: string[];
  result?: string;
  error?: string;
}

interface TaskDivisionProps {
  tasks: Task[];
  onApprove?: () => void;
  onReject?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  isRunning?: boolean;
  isPaused?: boolean;
  className?: string;
}

export const TaskDivision: React.FC<TaskDivisionProps> = ({
  tasks,
  onApprove,
  onReject,
  onStart,
  onPause,
  onReset,
  isRunning = false,
  isPaused = false,
  className,
}) => {
  const getTaskIcon = (type: Task['type']) => {
    switch (type) {
      case 'simple':
        return <Zap className="h-4 w-4 text-green-600" />;
      case 'medium':
        return <Target className="h-4 w-4 text-yellow-600" />;
      case 'reasoning':
        return <Brain className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTaskStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Clock className="h-4 w-4 animate-pulse text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTaskStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: Task['type']) => {
    switch (type) {
      case 'simple':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'reasoning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const completedTasks = tasks.filter(
    task => task.status === 'completed'
  ).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const estimatedTotalTime = tasks.reduce(
    (total, task) => total + task.estimatedTime,
    0
  );

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            Task Division & Plan
          </CardTitle>
          <div className="flex items-center space-x-2">
            {!isRunning && !isPaused && (
              <>
                <Button variant="outline" size="sm" onClick={onReject}>
                  Reject Plan
                </Button>
                <Button size="sm" onClick={onApprove}>
                  Approve & Start
                </Button>
              </>
            )}
            {isRunning && (
              <Button variant="outline" size="sm" onClick={onPause}>
                <Pause className="mr-1 h-4 w-4" />
                Pause
              </Button>
            )}
            {isPaused && (
              <Button size="sm" onClick={onStart}>
                <Play className="mr-1 h-4 w-4" />
                Resume
              </Button>
            )}
            {(isRunning || isPaused) && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              Progress: {completedTasks}/{totalTasks} tasks
            </span>
            <span>Estimated time: {formatTime(estimatedTotalTime)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className={cn(
                'rounded-lg border p-4 transition-all',
                task.status === 'running' &&
                  'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10',
                task.status === 'completed' &&
                  'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10',
                task.status === 'failed' &&
                  'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 flex-shrink-0">
                    {getTaskIcon(task.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center space-x-2">
                      <h4 className="text-sm font-medium">{task.title}</h4>
                      <Badge
                        className={cn(
                          'text-xs',
                          getTaskStatusColor(task.status)
                        )}
                      >
                        {task.status}
                      </Badge>
                      <Badge className={cn('text-xs', getTypeColor(task.type))}>
                        {task.type}
                      </Badge>
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      {task.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>⏱️ {formatTime(task.estimatedTime)}</span>
                      {task.assignedEmployee && (
                        <span>👤 {task.assignedEmployee}</span>
                      )}
                      {task.dependencies && task.dependencies.length > 0 && (
                        <span>🔗 {task.dependencies.length} dependencies</span>
                      )}
                    </div>
                    {task.result && (
                      <div className="mt-2 rounded bg-muted p-2 text-sm">
                        <strong>Result:</strong> {task.result}
                      </div>
                    )}
                    {task.error && (
                      <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/20">
                        <strong>Error:</strong> {task.error}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  {getTaskStatusIcon(task.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="py-8 text-center">
            <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              No tasks planned
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The AI will analyze your request and create a task plan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
