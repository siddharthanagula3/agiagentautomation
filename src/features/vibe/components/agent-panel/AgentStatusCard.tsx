/**
 * AgentStatusCard - Displays active agent status
 * Shows: Avatar, Name, Role, Status indicator (like MGX)
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Bot, Circle } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export interface AgentStatus {
  name: string;
  role: string;
  status: 'idle' | 'working' | 'waiting' | 'completed' | 'error';
  avatar?: string;
  currentTask?: string;
}

interface AgentStatusCardProps {
  agent: AgentStatus;
  className?: string;
}

const statusConfig = {
  idle: {
    label: 'Idle',
    color: 'text-gray-500',
    dotColor: 'bg-gray-400',
    badgeVariant: 'secondary' as const,
  },
  working: {
    label: 'Working...',
    color: 'text-blue-600',
    dotColor: 'bg-blue-500',
    badgeVariant: 'default' as const,
  },
  waiting: {
    label: 'Waiting',
    color: 'text-yellow-600',
    dotColor: 'bg-yellow-500',
    badgeVariant: 'secondary' as const,
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    dotColor: 'bg-green-500',
    badgeVariant: 'default' as const,
  },
  error: {
    label: 'Error',
    color: 'text-red-600',
    dotColor: 'bg-red-500',
    badgeVariant: 'destructive' as const,
  },
};

export function AgentStatusCard({ agent, className }: AgentStatusCardProps) {
  const config = statusConfig[agent.status];
  const initials = agent.name
    .split('-')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'border-b border-gray-200 dark:border-gray-800 p-4 bg-background',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="w-10 h-10">
          <AvatarImage src={agent.avatar} alt={agent.name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {agent.avatar ? initials : <Bot className="w-5 h-5" />}
          </AvatarFallback>
        </Avatar>

        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
            <Badge variant={config.badgeVariant} className="text-xs shrink-0">
              {agent.role}
            </Badge>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Circle
              className={cn(
                'w-2 h-2 fill-current',
                config.dotColor,
                agent.status === 'working' && 'animate-pulse'
              )}
            />
            <span className={cn('text-xs font-medium', config.color)}>
              {config.label}
            </span>
          </div>

          {/* Current Task */}
          {agent.currentTask && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
              {agent.currentTask}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
