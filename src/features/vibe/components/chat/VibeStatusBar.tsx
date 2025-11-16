/**
 * VibeStatusBar - Active Agents Display
 * Shows which agents are currently working with real-time status
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Badge } from '@shared/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shared/ui/tooltip';
import type { ActiveAgent } from '../../types';
import { cn } from '@shared/lib/utils';

interface VibeStatusBarProps {
  agents: ActiveAgent[];
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'working':
    case 'active':
      return 'bg-green-500';
    case 'thinking':
      return 'bg-yellow-500';
    case 'idle':
      return 'bg-gray-400';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

const getStatusAnimation = (status: string): string => {
  switch (status) {
    case 'working':
    case 'active':
      return 'animate-pulse';
    case 'thinking':
      return 'animate-spin';
    default:
      return '';
  }
};

const VibeStatusBar: React.FC<VibeStatusBarProps> = ({ agents }) => {
  // Only show agents that are active or thinking
  const activeAgents = agents.filter(
    (agent) => agent.status === 'active' || agent.status === 'thinking' || agent.status === 'working'
  );

  if (activeAgents.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No active agents
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        {activeAgents.map((agent) => (
          <Tooltip key={agent.employee.name}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-md transition-colors cursor-default">
                {/* Agent Avatar with Status Indicator */}
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={agent.employee.avatar_url}
                      alt={agent.employee.name}
                    />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {agent.employee.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Status Indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full border-2 border-background',
                        getStatusColor(agent.status),
                        getStatusAnimation(agent.status)
                      )}
                    />
                  </div>
                </div>

                {/* Agent Role Badge */}
                <span className="text-xs font-medium">
                  {agent.employee.role || agent.employee.name}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold">{agent.employee.name}</p>
                <p className="text-xs opacity-80">
                  Status: {agent.status}
                </p>
                {agent.current_task && (
                  <p className="text-xs opacity-60">
                    Task: {agent.current_task}
                  </p>
                )}
                {agent.progress !== undefined && (
                  <p className="text-xs opacity-60">
                    Progress: {Math.round(agent.progress * 100)}%
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>

      {/* Active count badge */}
      {activeAgents.length > 3 && (
        <Badge variant="secondary" className="text-xs">
          +{activeAgents.length - 3} more
        </Badge>
      )}
    </div>
  );
};

export default VibeStatusBar;
