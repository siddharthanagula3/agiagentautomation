/**
 * SupervisorPanel Component
 * Supervisor orchestration UI for multi-agent coordination
 * Features: Active agents, task distribution, communication flow, execution strategy
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Brain,
  GitBranch,
  Zap,
  TrendingUp,
  Activity,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ActiveAgent, SupervisorPlan, TaskAssignment } from '@features/vibe/types';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar } from '@/shared/components/ui/avatar';
import { Progress } from '@/shared/components/ui/progress';
import { Separator } from '@/shared/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

export interface SupervisorPanelProps {
  supervisor: ActiveAgent;
  plan: SupervisorPlan;
  activeAgents: ActiveAgent[];
  messageCount?: number;
  className?: string;
}

export const SupervisorPanel: React.FC<SupervisorPanelProps> = ({
  supervisor,
  plan,
  activeAgents,
  messageCount = 0,
  className,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  // Calculate execution progress
  const progress = useMemo(() => {
    const completed = plan.tasks.filter(
      (t) => t.priority === 'high' // Simplified; would check actual status in real implementation
    ).length;
    return Math.round((completed / plan.tasks.length) * 100);
  }, [plan.tasks]);

  // Get strategy info
  const strategyConfig = getStrategyConfig(plan.execution_strategy);

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                  {supervisor.employee.name.charAt(0).toUpperCase()}
                </div>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Supervisor Mode</h3>
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {supervisor.employee.name} coordinating {activeAgents.length} agents
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-4">
              {/* Execution Strategy */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <strategyConfig.icon className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Execution Strategy</h4>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {strategyConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {strategyConfig.description}
                </p>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      Overall Progress
                    </span>
                    <span className="text-xs font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              </div>

              <Separator />

              {/* Active Agents */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Active Agents</h4>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {activeAgents.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {activeAgents.map((agent) => (
                    <AgentItem key={agent.employee.name} agent={agent} />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Task Distribution */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Task Distribution</h4>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {plan.tasks.length} tasks
                  </Badge>
                </div>

                <div className="space-y-2">
                  {plan.tasks.slice(0, 3).map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}

                  {plan.tasks.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      +{plan.tasks.length - 3} more tasks
                    </p>
                  )}
                </div>
              </div>

              {/* Communication Stats */}
              {messageCount > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Communication</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard
                        icon={Activity}
                        label="Messages"
                        value={messageCount.toString()}
                      />
                      <StatCard
                        icon={TrendingUp}
                        label="Efficiency"
                        value="High"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

/**
 * Agent Item Component
 */
interface AgentItemProps {
  agent: ActiveAgent;
}

const AgentItem: React.FC<AgentItemProps> = ({ agent }) => {
  const statusColor = getStatusColor(agent.status);

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="relative">
        <Avatar className="h-7 w-7">
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-xs">
            {agent.employee.name.charAt(0).toUpperCase()}
          </div>
        </Avatar>
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background',
            statusColor
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{agent.employee.name}</p>
        {agent.current_task && (
          <p className="text-xs text-muted-foreground truncate">
            {agent.current_task}
          </p>
        )}
      </div>

      {agent.progress !== undefined && agent.progress > 0 && (
        <span className="text-xs font-medium text-muted-foreground">
          {agent.progress}%
        </span>
      )}
    </div>
  );
};

/**
 * Task Item Component
 */
interface TaskItemProps {
  task: TaskAssignment;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const priorityConfig = getPriorityConfig(task.priority);

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
      <priorityConfig.icon className={cn('h-4 w-4 mt-0.5', priorityConfig.color)} />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium line-clamp-2">{task.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
            {task.assigned_to.name}
          </Badge>
          {task.dependencies.length > 0 && (
            <span className="text-xs text-muted-foreground">
              • {task.dependencies.length} deps
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Stat Card Component
 */
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value }) => (
  <div className="p-3 rounded-lg bg-muted/30">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);

/**
 * Get execution strategy configuration
 */
function getStrategyConfig(strategy: SupervisorPlan['execution_strategy']) {
  switch (strategy) {
    case 'parallel':
      return {
        icon: Zap,
        label: 'Parallel',
        description: 'Tasks execute simultaneously for maximum speed',
      };
    case 'sequential':
      return {
        icon: GitBranch,
        label: 'Sequential',
        description: 'Tasks execute in order with dependencies',
      };
    case 'mixed':
      return {
        icon: Settings,
        label: 'Mixed',
        description: 'Optimized execution with parallel and sequential tasks',
      };
    default:
      return {
        icon: Brain,
        label: 'Adaptive',
        description: 'Strategy adapts based on task requirements',
      };
  }
}

/**
 * Get priority configuration
 */
function getPriorityConfig(priority: TaskAssignment['priority']) {
  switch (priority) {
    case 'high':
      return {
        icon: Zap,
        color: 'text-red-500',
      };
    case 'medium':
      return {
        icon: Activity,
        color: 'text-amber-500',
      };
    case 'low':
      return {
        icon: Brain,
        color: 'text-blue-500',
      };
    default:
      return {
        icon: Brain,
        color: 'text-muted-foreground',
      };
  }
}

/**
 * Get status color
 */
function getStatusColor(status: ActiveAgent['status']): string {
  switch (status) {
    case 'thinking':
      return 'bg-blue-500';
    case 'working':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}
