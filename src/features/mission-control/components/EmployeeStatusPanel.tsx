/**
 * Agent Status Panel
 * Displays real-time status of all AI employees working in Company Hub
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Progress } from '@shared/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import {
  Bot,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pause,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useAssignedAgents } from '@shared/stores/multi-agent-workspace-store';
import type { AgentAssignment } from '@shared/stores/multi-agent-workspace-store';

const getStatusIcon = (status: AgentAssignment['status']) => {
  switch (status) {
    case 'idle':
      return <Clock className="h-4 w-4 text-gray-400" />;
    case 'thinking':
    case 'analyzing':
    case 'working':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'waiting':
      return <Pause className="h-4 w-4 text-yellow-500" />;
    case 'blocked':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Bot className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusColor = (status: AgentAssignment['status']) => {
  switch (status) {
    case 'idle':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'thinking':
    case 'analyzing':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'working':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'completed':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'waiting':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'blocked':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'error':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusLabel = (status: AgentAssignment['status']) => {
  switch (status) {
    case 'idle':
      return 'Idle';
    case 'thinking':
      return 'Thinking...';
    case 'analyzing':
      return 'Analyzing...';
    case 'working':
      return 'Working...';
    case 'completed':
      return 'Completed';
    case 'waiting':
      return 'Waiting...';
    case 'blocked':
      return 'Blocked';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
};

const getProviderColor = (provider: string) => {
  const colors = {
    chatgpt: 'bg-green-500/20 text-green-400 border-green-500/30',
    openai: 'bg-green-500/20 text-green-400 border-green-500/30',
    claude: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    anthropic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    gemini: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    google: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    perplexity: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return colors[provider as keyof typeof colors] || colors.chatgpt;
};

export const AgentStatusPanel: React.FC = () => {
  const assignedAgents = useAssignedAgents();

  return (
    <Card className="h-full border-border bg-card">
      <CardHeader className="border-b border-border p-3 sm:pb-4 sm:p-4">
        <CardTitle className="flex items-center gap-2 text-sm text-foreground sm:text-base">
          <Zap className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          AI Team ({assignedAgents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        {assignedAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center sm:py-12">
            <Bot className="mb-3 h-10 w-10 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
            <p className="text-xs text-muted-foreground sm:text-sm">
              No AI employees assigned yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start a task to assemble your team
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <AnimatePresence mode="popLayout">
              {assignedAgents.map((agent, index) => (
                <motion.div
                  key={agent.agentId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'rounded-lg border p-2 transition-all sm:p-3',
                    'bg-card/50 backdrop-blur-sm',
                    agent.status === 'working' &&
                      'border-blue-500/50 shadow-lg shadow-blue-500/10',
                    agent.status === 'completed' && 'border-green-500/50',
                    agent.status === 'error' && 'border-red-500/50'
                  )}
                >
                  {/* Agent Header */}
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Avatar className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.agentId}`}
                          alt={agent.agentName}
                        />
                        <AvatarFallback>
                          <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
                          {agent.agentName}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                          {agent.role}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(agent.status)}
                  </div>

                  {/* Status Badge */}
                  <div className="mb-2 flex flex-wrap items-center gap-1 sm:gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] sm:text-xs',
                        getStatusColor(agent.status)
                      )}
                    >
                      {getStatusLabel(agent.status)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] sm:text-xs',
                        getProviderColor(agent.provider)
                      )}
                    >
                      {agent.provider}
                    </Badge>
                  </div>

                  {/* Current Task */}
                  {agent.currentTask && (
                    <p className="mb-2 line-clamp-2 text-[10px] text-muted-foreground sm:text-xs">
                      {agent.currentTask}
                    </p>
                  )}

                  {/* Progress Bar */}
                  {agent.status === 'working' && (
                    <div className="space-y-1">
                      <Progress value={agent.progress} className="h-1" />
                      <p className="text-right text-[10px] text-muted-foreground sm:text-xs">
                        {agent.progress}%
                      </p>
                    </div>
                  )}

                  {/* Tools Using */}
                  {agent.toolsUsing && agent.toolsUsing.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {agent.toolsUsing.slice(0, 2).map((tool, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-[10px] sm:text-xs"
                        >
                          {tool}
                        </Badge>
                      ))}
                      {agent.toolsUsing.length > 2 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] sm:text-xs"
                        >
                          +{agent.toolsUsing.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {agent.error && (
                    <div className="mt-2 rounded bg-red-500/10 p-2">
                      <p className="text-[10px] text-red-400 sm:text-xs">
                        {agent.error}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
