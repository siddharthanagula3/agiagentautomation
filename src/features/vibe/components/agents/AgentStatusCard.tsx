/**
 * AgentStatusCard Component
 * Real-time display of agent status with activity indicators
 * Shows: current task, progress, status badge, activity timeline
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
} from 'lucide-react';
import type { ActiveAgent, AgentStatus } from '@features/vibe/types';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar } from '@/shared/components/ui/avatar';
import { Progress } from '@/shared/components/ui/progress';
import { cn } from '@/shared/lib/utils';

export interface AgentStatusCardProps {
  agent: ActiveAgent;
  showProgress?: boolean;
  compact?: boolean;
  className?: string;
}

export const AgentStatusCard: React.FC<AgentStatusCardProps> = ({
  agent,
  showProgress = true,
  compact = false,
  className,
}) => {
  const statusConfig = getStatusConfig(agent.status);

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        compact ? 'p-3' : 'p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Agent Avatar with Status Indicator */}
        <div className="relative">
          <Avatar className={cn(compact ? 'h-10 w-10' : 'h-12 w-12')}>
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 font-semibold text-primary">
              {agent.employee.name.charAt(0).toUpperCase()}
            </div>
          </Avatar>

          {/* Status Pulse */}
          <AnimatePresence>
            {agent.status === 'working' || agent.status === 'thinking' ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -bottom-1 -right-1"
              >
                <div className="relative">
                  <div
                    className={cn(
                      'h-3 w-3 rounded-full',
                      statusConfig.dotColor
                    )}
                  />
                  <motion.div
                    className={cn(
                      'absolute inset-0 h-3 w-3 rounded-full',
                      statusConfig.dotColor,
                      'opacity-75'
                    )}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.75, 0, 0.75],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Agent Info */}
        <div className="min-w-0 flex-1">
          {/* Name and Status */}
          <div className="mb-1 flex items-center gap-2">
            <h4
              className={cn(
                'truncate font-medium',
                compact ? 'text-sm' : 'text-base'
              )}
            >
              {agent.employee.name}
            </h4>
            <Badge
              variant={statusConfig.variant}
              className={cn(
                'flex items-center gap-1',
                compact ? 'text-xs' : 'text-xs'
              )}
            >
              <statusConfig.icon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Description/Role */}
          {!compact && (
            <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">
              {agent.employee.description}
            </p>
          )}

          {/* Current Task */}
          {agent.current_task && (
            <div className="mt-2 flex items-start gap-2">
              <Activity className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {agent.current_task}
              </p>
            </div>
          )}

          {/* Progress Bar */}
          {showProgress &&
            agent.progress !== undefined &&
            agent.progress > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Progress
                  </span>
                  <span className="text-xs font-medium">{agent.progress}%</span>
                </div>
                <Progress value={agent.progress} className="h-1.5" />
              </div>
            )}

          {/* Last Activity */}
          {agent.last_activity && !compact && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatLastActivity(agent.last_activity)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * Get status configuration (icon, color, label)
 */
function getStatusConfig(status: AgentStatus) {
  switch (status) {
    case 'idle':
      return {
        icon: Brain,
        label: 'Idle',
        variant: 'secondary' as const,
        dotColor: 'bg-gray-400',
      };
    case 'thinking':
      return {
        icon: Loader2,
        label: 'Thinking',
        variant: 'default' as const,
        dotColor: 'bg-blue-500',
      };
    case 'working':
      return {
        icon: Activity,
        label: 'Working',
        variant: 'default' as const,
        dotColor: 'bg-green-500',
      };
    case 'error':
      return {
        icon: AlertCircle,
        label: 'Error',
        variant: 'destructive' as const,
        dotColor: 'bg-red-500',
      };
    default:
      return {
        icon: Brain,
        label: 'Unknown',
        variant: 'secondary' as const,
        dotColor: 'bg-gray-400',
      };
  }
}

/**
 * Format last activity timestamp
 */
function formatLastActivity(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}
