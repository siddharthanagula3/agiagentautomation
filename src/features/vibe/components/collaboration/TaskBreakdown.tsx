/**
 * TaskBreakdown Component
 * Displays decomposed tasks in supervisor mode
 * Features: Task dependencies, status, assigned agents, timeline
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Clock,
  User,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import type { VibeTask, TaskStatus } from '@features/vibe/types';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Avatar } from '@/shared/components/ui/avatar';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/lib/utils';

export interface TaskBreakdownProps {
  tasks: VibeTask[];
  employeeMap?: Map<string, { name: string; description: string }>;
  showDependencies?: boolean;
  showTimeline?: boolean;
  className?: string;
}

export const TaskBreakdown: React.FC<TaskBreakdownProps> = ({
  tasks,
  employeeMap = new Map(),
  showDependencies = true,
  showTimeline = false,
  className,
}) => {
  // Calculate overall progress
  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, VibeTask[]> = {
      pending: [],
      running: [],
      completed: [],
      failed: [],
    };

    tasks.forEach((task) => {
      groups[task.status].push(task);
    });

    return groups;
  }, [tasks]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Task Breakdown</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} total
            </p>
          </div>

          {/* Status Summary */}
          <div className="flex items-center gap-3">
            <StatusBadge status="completed" count={tasksByStatus.completed.length} />
            <StatusBadge status="running" count={tasksByStatus.running.length} />
            <StatusBadge status="pending" count={tasksByStatus.pending.length} />
            {tasksByStatus.failed.length > 0 && (
              <StatusBadge status="failed" count={tasksByStatus.failed.length} />
            )}
          </div>
        </div>

        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Progress</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            employee={employeeMap.get(task.assigned_to)}
            showDependencies={showDependencies}
            index={index}
          />
        ))}
      </div>

      {/* Timeline View */}
      {showTimeline && tasks.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Execution Timeline
          </h4>
          <TaskTimeline tasks={tasks} />
        </Card>
      )}
    </div>
  );
};

/**
 * Individual Task Card
 */
interface TaskCardProps {
  task: VibeTask;
  employee?: { name: string; description: string };
  showDependencies: boolean;
  index: number;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  employee,
  showDependencies,
  index,
}) => {
  const statusConfig = getTaskStatusConfig(task.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'p-4 transition-all',
          task.status === 'running' && 'border-primary shadow-sm'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <statusConfig.icon
              className={cn('h-5 w-5', statusConfig.iconColor)}
            />
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            {/* Task Description */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-sm font-medium">{task.description}</p>
              <Badge variant={statusConfig.variant} className="text-xs flex-shrink-0">
                {statusConfig.label}
              </Badge>
            </div>

            {/* Assigned Employee */}
            {employee && (
              <div className="flex items-center gap-2 mb-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Assigned to <span className="font-medium">{employee.name}</span>
                </span>
              </div>
            )}

            {/* Dependencies */}
            {showDependencies && task.dependencies.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Depends on {task.dependencies.length}{' '}
                  {task.dependencies.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            )}

            {/* Error Message */}
            {task.error && (
              <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                <p className="text-xs text-destructive">{task.error}</p>
              </div>
            )}

            {/* Result Preview */}
            {task.result && task.status === 'completed' && (
              <div className="mt-2 p-2 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {typeof task.result === 'string'
                    ? task.result
                    : JSON.stringify(task.result)}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>Created {formatTimestamp(task.created_at)}</span>
              {task.completed_at && (
                <>
                  <span>•</span>
                  <span>Completed {formatTimestamp(task.completed_at)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Status Badge Component
 */
interface StatusBadgeProps {
  status: TaskStatus;
  count: number;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, count }) => {
  if (count === 0) return null;

  const config = getTaskStatusConfig(status);

  return (
    <div className="flex items-center gap-1.5">
      <config.icon className={cn('h-4 w-4', config.iconColor)} />
      <span className="text-sm font-medium">{count}</span>
    </div>
  );
};

/**
 * Task Timeline Component
 */
interface TaskTimelineProps {
  tasks: VibeTask[];
}

const TaskTimeline: React.FC<TaskTimelineProps> = ({ tasks }) => {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort(
      (a, b) => a.created_at.getTime() - b.created_at.getTime()
    );
  }, [tasks]);

  return (
    <div className="space-y-3">
      {sortedTasks.map((task, index) => {
        const statusConfig = getTaskStatusConfig(task.status);

        return (
          <div key={task.id} className="flex items-start gap-3">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <statusConfig.icon
                className={cn('h-4 w-4 flex-shrink-0', statusConfig.iconColor)}
              />
              {index < sortedTasks.length - 1 && (
                <div className="w-0.5 h-8 bg-border mt-1" />
              )}
            </div>

            {/* Timeline Content */}
            <div className="flex-1 pb-2">
              <p className="text-sm font-medium">{task.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTimestamp(task.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Get task status configuration
 */
function getTaskStatusConfig(status: TaskStatus) {
  switch (status) {
    case 'pending':
      return {
        icon: Circle,
        label: 'Pending',
        variant: 'secondary' as const,
        iconColor: 'text-muted-foreground',
      };
    case 'running':
      return {
        icon: Loader2,
        label: 'Running',
        variant: 'default' as const,
        iconColor: 'text-primary animate-spin',
      };
    case 'completed':
      return {
        icon: CheckCircle2,
        label: 'Completed',
        variant: 'default' as const,
        iconColor: 'text-green-500',
      };
    case 'failed':
      return {
        icon: AlertCircle,
        label: 'Failed',
        variant: 'destructive' as const,
        iconColor: 'text-destructive',
      };
    default:
      return {
        icon: Circle,
        label: 'Unknown',
        variant: 'secondary' as const,
        iconColor: 'text-muted-foreground',
      };
  }
}

/**
 * Format timestamp
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}
