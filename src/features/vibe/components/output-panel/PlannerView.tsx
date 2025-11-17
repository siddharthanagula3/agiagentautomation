/**
 * PlannerView - Task breakdown and execution plan visualization
 * Shows agent's plan, dependencies, and progress
 */

import React from 'react';
import { useVibeViewStore } from '../../stores/vibe-view-store';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Clock,
  User,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

const statusConfig = {
  pending: {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    label: 'Pending',
  },
  in_progress: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    label: 'In Progress',
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
    label: 'Failed',
  },
};

export function PlannerView() {
  const { plannerState } = useVibeViewStore();

  // Mock tasks for demonstration
  const mockTasks =
    plannerState.tasks.length > 0
      ? plannerState.tasks
      : [
          {
            id: '1',
            title: 'Analyze Requirements',
            description: 'Review user request and identify key requirements',
            status: 'completed' as const,
            assignedTo: 'Project Manager',
            dependencies: [],
            progress: 100,
            estimatedTime: '2 min',
          },
          {
            id: '2',
            title: 'Design System Architecture',
            description: 'Create technical design and component structure',
            status: 'completed' as const,
            assignedTo: 'Architect',
            dependencies: ['1'],
            progress: 100,
            estimatedTime: '5 min',
          },
          {
            id: '3',
            title: 'Implement Core Features',
            description: 'Build main application components and functionality',
            status: 'in_progress' as const,
            assignedTo: 'Engineer',
            dependencies: ['2'],
            progress: 45,
            estimatedTime: '15 min',
          },
          {
            id: '4',
            title: 'Write Unit Tests',
            description: 'Create comprehensive test coverage',
            status: 'pending' as const,
            assignedTo: 'QA Engineer',
            dependencies: ['3'],
            progress: 0,
            estimatedTime: '8 min',
          },
          {
            id: '5',
            title: 'Deploy to Production',
            description: 'Build and deploy application',
            status: 'pending' as const,
            assignedTo: 'DevOps',
            dependencies: ['4'],
            progress: 0,
            estimatedTime: '3 min',
          },
        ];

  const completedCount = mockTasks.filter(
    (t) => t.status === 'completed'
  ).length;
  const totalCount = mockTasks.length;
  const overallProgress = (completedCount / totalCount) * 100;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 dark:border-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Execution Plan</h2>
          <Badge variant="secondary">
            {completedCount} / {totalCount} Completed
          </Badge>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-6">
          {mockTasks.map((task, index) => {
            const config = statusConfig[task.status];
            const Icon = config.icon;
            const hasDependencies = task.dependencies.length > 0;

            return (
              <div key={task.id}>
                {/* Dependency Arrow */}
                {hasDependencies && index > 0 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                  </div>
                )}

                {/* Task Card */}
                <div
                  className={cn(
                    'rounded-lg border p-4 transition-all',
                    config.bgColor,
                    task.status === 'in_progress' && 'ring-2 ring-blue-500/20'
                  )}
                >
                  {/* Task Header */}
                  <div className="mb-3 flex items-start gap-3">
                    <Icon
                      className={cn(
                        'mt-0.5 h-5 w-5 shrink-0',
                        config.color,
                        config.animate && 'animate-spin'
                      )}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{task.title}</h3>
                        <Badge
                          variant={
                            task.status === 'in_progress'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {/* Task Meta */}
                  <div className="ml-8 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>{task.assignedTo}</span>
                    </div>
                    {task.estimatedTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{task.estimatedTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar (for in-progress tasks) */}
                  {task.status === 'in_progress' && (
                    <div className="ml-8 mt-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-1.5" />
                    </div>
                  )}

                  {/* Dependencies */}
                  {hasDependencies && (
                    <div className="ml-8 mt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Depends on:
                      </span>
                      <div className="flex gap-1">
                        {task.dependencies.map((depId) => {
                          const depTask = mockTasks.find((t) => t.id === depId);
                          return (
                            <Badge
                              key={depId}
                              variant="outline"
                              className="h-5 px-2 text-xs"
                            >
                              {depTask?.title || `Task ${depId}`}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 bg-muted/30 p-4 dark:border-gray-800">
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {mockTasks.filter((t) => t.status === 'completed').length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {mockTasks.filter((t) => t.status === 'in_progress').length}
            </div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {mockTasks.filter((t) => t.status === 'pending').length}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {mockTasks.filter((t) => t.status === 'failed').length}
            </div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
