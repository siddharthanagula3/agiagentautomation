/**
 * AgentParticipantPanel - Display and manage active agents
 *
 * Features:
 * - Active agent list with status indicators
 * - Agent selection for direct messages
 * - Quick agent info tooltips
 * - Agent performance metrics
 * - Role-based grouping
 * - Search/filter agents
 */

import React, { useState, useMemo } from 'react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import { Progress } from '@shared/components/ui/progress';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { Separator } from '@shared/components/ui/separator';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Info,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import type { Agent } from '../Main/MultiAgentChatInterface';

interface AgentParticipantPanelProps {
  /** Array of agents */
  agents: Agent[];
  /** Callback when selecting an agent */
  onAgentSelect?: (agentId: string) => void;
  /** Currently selected agent ID */
  selectedAgentId?: string | null;
  /** Whether to show performance metrics */
  showMetrics?: boolean;
  /** Whether to group by role */
  groupByRole?: boolean;
  /** Custom className */
  className?: string;
}

interface AgentGroup {
  role: string;
  agents: Agent[];
  expanded: boolean;
}

export function AgentParticipantPanel({
  agents,
  onAgentSelect,
  selectedAgentId,
  showMetrics = true,
  groupByRole = true,
  className,
}: AgentParticipantPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'active' | 'idle' | 'offline'
  >('all');

  // Filter agents by search query and status
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        selectedFilter === 'all' || agent.status === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [agents, searchQuery, selectedFilter]);

  // Group agents by role
  const groupedAgents = useMemo(() => {
    if (!groupByRole) return null;

    const groups = new Map<string, Agent[]>();
    filteredAgents.forEach((agent) => {
      const role = agent.role || 'Other';
      if (!groups.has(role)) {
        groups.set(role, []);
      }
      groups.get(role)!.push(agent);
    });

    return Array.from(groups.entries())
      .map(([role, agents]) => ({
        role,
        agents,
        expanded: expandedGroups.has(role),
      }))
      .sort((a, b) => a.role.localeCompare(b.role));
  }, [filteredAgents, groupByRole, expandedGroups]);

  // Toggle group expansion
  const toggleGroup = (role: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  // Expand all groups initially
  // Updated: Jan 15th 2026 - Adding expandedGroups.size would cause infinite loop
  React.useEffect(() => {
    if (groupedAgents && expandedGroups.size === 0) {
      setExpandedGroups(new Set(groupedAgents.map((g) => g.role)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedAgents]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      active: agents.filter((a) => a.status === 'active').length,
      idle: agents.filter((a) => a.status === 'idle').length,
      thinking: agents.filter((a) => a.status === 'thinking').length,
      typing: agents.filter((a) => a.status === 'typing').length,
      offline: agents.filter((a) => a.status === 'offline').length,
    };
  }, [agents]);

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Participants</h3>
          <Badge variant="secondary" className="text-xs">
            {agents.length} agent{agents.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
            className="h-7 text-xs"
          >
            All ({agents.length})
          </Button>
          <Button
            variant={selectedFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('active')}
            className="h-7 text-xs"
          >
            <div className="mr-1 h-2 w-2 rounded-full bg-green-500" />
            Active ({statusCounts.active})
          </Button>
          <Button
            variant={selectedFilter === 'idle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('idle')}
            className="h-7 text-xs"
          >
            <div className="mr-1 h-2 w-2 rounded-full bg-gray-400" />
            Idle ({statusCounts.idle})
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Agent List */}
      <ScrollArea className="flex-1">
        {groupByRole && groupedAgents ? (
          <div className="space-y-1">
            {groupedAgents.map((group) => (
              <div key={group.role} className="space-y-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.role)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  {group.expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>{group.role}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {group.agents.length}
                  </Badge>
                </button>

                {/* Group Agents */}
                {group.expanded && (
                  <div className="space-y-1 pl-6">
                    {group.agents.map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        isSelected={agent.id === selectedAgentId}
                        onSelect={onAgentSelect}
                        showMetrics={showMetrics}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={agent.id === selectedAgentId}
                onSelect={onAgentSelect}
                showMetrics={showMetrics}
              />
            ))}
          </div>
        )}

        {filteredAgents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No agents found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Agent Card Component
interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect?: (agentId: string) => void;
  showMetrics: boolean;
}

function AgentCard({
  agent,
  isSelected,
  onSelect,
  showMetrics,
}: AgentCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const statusConfig = {
    active: { icon: Activity, color: 'bg-green-500', label: 'Active' },
    idle: { icon: Clock, color: 'bg-gray-400', label: 'Idle' },
    thinking: { icon: Activity, color: 'bg-blue-500', label: 'Thinking' },
    typing: { icon: MessageSquare, color: 'bg-yellow-500', label: 'Typing' },
    offline: { icon: XCircle, color: 'bg-red-500', label: 'Offline' },
  };

  const status = statusConfig[agent.status];
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        'group rounded-lg border transition-all',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:border-border hover:bg-muted/50'
      )}
    >
      <button
        onClick={() => onSelect?.(agent.id)}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="h-10 w-10 rounded-full"
            style={{ backgroundColor: agent.color }}
          >
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
              {agent.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
          {/* Status Indicator */}
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
              status.color,
              (agent.status === 'thinking' || agent.status === 'typing') &&
                'animate-pulse'
            )}
          />
        </div>

        {/* Agent Info */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{agent.name}</span>
            {isSelected && (
              <Badge variant="default" className="h-4 text-xs">
                Selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <StatusIcon className="h-3 w-3" />
            <span>{status.label}</span>
            {agent.currentTask && (
              <>
                <span>•</span>
                <span className="truncate">{agent.currentTask}</span>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {showMetrics &&
            agent.progress !== undefined &&
            agent.progress > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{agent.progress}%</span>
                </div>
                <Progress value={agent.progress} className="h-1.5" />
              </div>
            )}
        </div>

        {/* Info Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(!showDetails);
          }}
        >
          <Info className="h-4 w-4" />
        </Button>
      </button>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-muted-foreground">Role:</span>{' '}
              <span>{agent.role}</span>
            </div>
            {agent.currentTask && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Current Task:
                </span>{' '}
                <span className="break-words">{agent.currentTask}</span>
              </div>
            )}
            <div className="flex items-center gap-4 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={() => onSelect?.(agent.id)}
              >
                <MessageSquare className="mr-1 h-3 w-3" />
                Message
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
