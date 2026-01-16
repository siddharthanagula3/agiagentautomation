/**
 * CollaborativeTaskView - Visualize task breakdown and agent assignments
 *
 * Features:
 * - Task breakdown visualization
 * - Agent assignment display
 * - Progress tracking per agent
 * - Subtask dependencies
 * - Timeline view
 * - Task status indicators
 */

import React, { useState, useMemo } from 'react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { Progress } from '@shared/components/ui/progress';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { Separator } from '@shared/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shared/components/ui/collapsible';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Target,
  Zap,
  TrendingUp,
  List,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Agent } from '../Main/MultiAgentChatInterface';
import type { Task } from '@shared/stores/mission-control-store';

interface CollaborativeTaskViewProps {
  /** Array of tasks */
  tasks: Task[];
  /** Array of agents */
  agents: Agent[];
  /** View mode */
  viewMode?: 'list' | 'timeline' | 'kanban';
  /** Custom className */
  className?: string;
}

export function CollaborativeTaskView({
  tasks,
  agents,
  viewMode = 'list',
  className,
}: CollaborativeTaskViewProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  }, [tasks]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    return {
      pending: tasks.filter((t) => t.status === 'pending'),
      in_progress: tasks.filter((t) => t.status === 'in_progress'),
      completed: tasks.filter((t) => t.status === 'completed'),
      failed: tasks.filter((t) => t.status === 'failed'),
    };
  }, [tasks]);

  // Get agent for a task
  const getTaskAgent = (task: Task): Agent | undefined => {
    if (!task.assignedTo) return undefined;
    return agents.find(
      (a) => a.id === task.assignedTo || a.name === task.assignedTo
    );
  };

  // Toggle task expansion
  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Tasks</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Overall Progress</span>
            <span className="font-semibold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <div className="grid grid-cols-4 gap-2 pt-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-yellow-600">
                {tasksByStatus.pending.length}
              </div>
              <div className="text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">
                {tasksByStatus.in_progress.length}
              </div>
              <div className="text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">
                {tasksByStatus.completed.length}
              </div>
              <div className="text-muted-foreground">Done</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">
                {tasksByStatus.failed.length}
              </div>
              <div className="text-muted-foreground">Failed</div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <List className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                agent={getTaskAgent(task)}
                isExpanded={expandedTasks.has(task.id)}
                isSelected={selectedTask === task.id}
                onToggle={() => toggleTask(task.id)}
                onSelect={() => setSelectedTask(task.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: Task;
  agent?: Agent;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
}

function TaskCard({
  task,
  agent,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
}: TaskCardProps) {
  const statusConfig = {
    pending: {
      icon: Circle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-950',
      label: 'Pending',
    },
    in_progress: {
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
      label: 'In Progress',
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-950',
      label: 'Completed',
    },
    failed: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-950',
      label: 'Failed',
    },
  };

  const status = statusConfig[task.status];
  const StatusIcon = status.icon;

  // Calculate task duration if available
  const duration =
    task.startedAt && task.completedAt
      ? Math.round(
          (task.completedAt.getTime() - task.startedAt.getTime()) / 1000
        )
      : null;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div
        className={cn(
          'rounded-lg border transition-all',
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-primary/50'
        )}
      >
        {/* Task Header */}
        <CollapsibleTrigger asChild>
          <button
            onClick={onSelect}
            className="flex w-full items-start gap-3 p-3 text-left"
          >
            {/* Status Icon */}
            <div className={cn('mt-0.5 flex-shrink-0', status.color)}>
              <StatusIcon className="h-4 w-4" />
            </div>

            {/* Task Info */}
            <div className="flex-1 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">
                  {task.description}
                </p>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
              </div>

              {/* Task Metadata */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className={cn('h-5 text-xs', status.bgColor, status.color)}
                >
                  {status.label}
                </Badge>

                {agent && (
                  <div className="flex items-center gap-1">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: agent.color }}
                    >
                      <div className="flex h-full w-full items-center justify-center text-[8px] font-semibold text-white">
                        {agent.name.substring(0, 1).toUpperCase()}
                      </div>
                    </div>
                    <span className="text-muted-foreground">{agent.name}</span>
                  </div>
                )}

                {task.toolRequired && (
                  <Badge variant="secondary" className="h-5 text-xs">
                    <Zap className="mr-1 h-3 w-3" />
                    {task.toolRequired}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="border-t border-border bg-muted/30 px-3 py-3">
            <div className="space-y-3 text-xs">
              {/* Assigned Agent */}
              {agent && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-medium text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Assigned To</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-background px-2 py-1.5">
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: agent.color }}
                    >
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white">
                        {agent.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-muted-foreground">{agent.role}</div>
                    </div>
                    {agent.progress !== undefined && agent.progress > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {agent.progress}%
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {(task.startedAt || task.completedAt) && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-medium text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Timeline</span>
                  </div>
                  <div className="space-y-1 rounded-md bg-background px-2 py-1.5">
                    {task.startedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Started</span>
                        <span className="font-medium">
                          {format(task.startedAt, 'MMM d, HH:mm')}
                        </span>
                      </div>
                    )}
                    {task.completedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-medium">
                          {format(task.completedAt, 'MMM d, HH:mm')}
                        </span>
                      </div>
                    )}
                    {duration !== null && (
                      <div className="flex items-center justify-between border-t border-border pt-1">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">
                          {formatDuration(duration)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Result */}
              {task.result && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-medium text-muted-foreground">
                    <Target className="h-3 w-3" />
                    <span>Result</span>
                  </div>
                  <div className="rounded-md bg-background px-2 py-1.5">
                    <p className="whitespace-pre-wrap break-words">
                      {task.result}
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {task.error && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-medium text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <span>Error</span>
                  </div>
                  <div className="rounded-md bg-destructive/10 px-2 py-1.5 text-destructive">
                    <p className="whitespace-pre-wrap break-words">
                      {task.error}
                    </p>
                  </div>
                </div>
              )}

              {/* Tool Required */}
              {task.toolRequired && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-medium text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    <span>Tool Required</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {task.toolRequired}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}
