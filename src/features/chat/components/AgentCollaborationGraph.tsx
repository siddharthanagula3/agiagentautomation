/**
 * Agent Collaboration Graph
 * Visualizes agent-to-agent communication as an interactive network graph
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { ScrollArea } from '@shared/ui/scroll-area';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ArrowRight,
  Activity,
} from 'lucide-react';
import type {
  AgentStatus,
  AgentCommunication,
} from '@core/orchestration/multi-agent-orchestrator';

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  status: AgentStatus['status'];
  messageCount: number;
}

interface Edge {
  id: string;
  from: string;
  to: string;
  type:
    | 'request'
    | 'response'
    | 'handoff'
    | 'collaboration'
    | 'status'
    | 'error'
    | 'completion';
  timestamp: Date;
  message: string;
  isActive: boolean;
}

interface AgentCollaborationGraphProps {
  agents: AgentStatus[];
  communications: AgentCommunication[];
  onAgentClick?: (agentName: string) => void;
  className?: string;
}

export const AgentCollaborationGraph: React.FC<
  AgentCollaborationGraphProps
> = ({ agents, communications, onAgentClick, className }) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);

  // Calculate nodes with circular layout
  const nodes = useMemo(() => {
    if (agents.length === 0) return [];

    const centerX = 200;
    const centerY = 200;
    const radius = 120;

    return agents.map((agent, index) => {
      const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Count messages for this agent
      const messageCount = communications.filter(
        c => c.from === agent.agentName || c.to === agent.agentName
      ).length;

      return {
        id: agent.agentName,
        name: agent.agentName,
        x,
        y,
        status: agent.status,
        messageCount,
      };
    });
  }, [agents, communications]);

  // Calculate edges from communications
  const edges = useMemo(() => {
    const edgeMap = new Map<string, Edge>();

    communications.forEach(comm => {
      // Skip system messages or user messages
      if (comm.from === 'System' || comm.to === 'user') return;

      const fromNode = nodes.find(n => n.id === comm.from);
      const toNode = nodes.find(n => n.id === comm.to);

      if (!fromNode || !toNode) return;

      const edgeKey = `${comm.from}-${comm.to}`;
      const existingEdge = edgeMap.get(edgeKey);

      // Check if this is the most recent communication (last 2 seconds)
      const isRecent = Date.now() - comm.timestamp.getTime() < 2000;

      if (!existingEdge || comm.timestamp > existingEdge.timestamp) {
        edgeMap.set(edgeKey, {
          id: comm.id,
          from: comm.from,
          to: comm.to,
          type: comm.type,
          timestamp: comm.timestamp,
          message: comm.message,
          isActive: isRecent,
        });
      }
    });

    return Array.from(edgeMap.values());
  }, [communications, nodes]);

  // Get color for communication type
  const getEdgeColor = (type: Edge['type'], isActive: boolean) => {
    const alpha = isActive ? '1' : '0.3';
    switch (type) {
      case 'handoff':
        return `rgba(59, 130, 246, ${alpha})`; // blue
      case 'collaboration':
        return `rgba(168, 85, 247, ${alpha})`; // purple
      case 'response':
        return `rgba(34, 197, 94, ${alpha})`; // green
      case 'error':
        return `rgba(239, 68, 68, ${alpha})`; // red
      case 'completion':
        return `rgba(16, 185, 129, ${alpha})`; // emerald
      case 'status':
        return `rgba(251, 146, 60, ${alpha})`; // orange
      default:
        return `rgba(156, 163, 175, ${alpha})`; // gray
    }
  };

  // Get node color based on status
  const getNodeColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'working':
      case 'analyzing':
        return 'from-blue-500 to-blue-600';
      case 'completed':
        return 'from-green-500 to-green-600';
      case 'error':
      case 'blocked':
        return 'from-red-500 to-red-600';
      case 'waiting':
        return 'from-orange-500 to-orange-600';
      case 'idle':
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const handleAgentClick = (agentName: string) => {
    setSelectedAgent(selectedAgent === agentName ? null : agentName);
    onAgentClick?.(agentName);
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.2, 2));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.2, 0.5));

  // Filter edges for selected agent
  const visibleEdges = selectedAgent
    ? edges.filter(e => e.from === selectedAgent || e.to === selectedAgent)
    : edges;

  // Get related communications for selected agent
  const selectedAgentCommunications = selectedAgent
    ? communications.filter(
        c => c.from === selectedAgent || c.to === selectedAgent
      )
    : [];

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {/* Header */}
      <div className="border-b border-border bg-card/30 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Agent Collaboration</h3>
            <Badge variant="secondary" className="text-xs">
              {agents.length} agents
            </Badge>
            <Badge variant="outline" className="text-xs">
              {communications.length} messages
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-7 w-7 p-0"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-7 w-7 p-0"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLabels(!showLabels)}
              className="h-7 px-2 text-xs"
            >
              {showLabels ? 'Hide' : 'Show'} Labels
            </Button>
          </div>
        </div>
      </div>

      {/* Graph Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Graph */}
        <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-background via-background to-accent/5">
          {agents.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Network className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p className="text-sm">No active agents</p>
                <p className="text-xs">
                  Agents will appear as they start working
                </p>
              </div>
            </div>
          ) : (
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 400 400"
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.3s ease',
              }}
            >
              {/* Grid background */}
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-border opacity-20"
                  />
                </pattern>
              </defs>
              <rect width="400" height="400" fill="url(#grid)" />

              {/* Edges */}
              <g className="edges">
                <AnimatePresence>
                  {visibleEdges.map(edge => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);

                    if (!fromNode || !toNode) return null;

                    const color = getEdgeColor(edge.type, edge.isActive);

                    return (
                      <motion.g
                        key={edge.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {/* Edge line */}
                        <motion.line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke={color}
                          strokeWidth={edge.isActive ? 3 : 1.5}
                          strokeLinecap="round"
                          markerEnd="url(#arrowhead)"
                        />

                        {/* Animated particle for active edges */}
                        {edge.isActive && (
                          <motion.circle
                            r="3"
                            fill={color}
                            initial={{
                              cx: fromNode.x,
                              cy: fromNode.y,
                            }}
                            animate={{
                              cx: toNode.x,
                              cy: toNode.y,
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                          />
                        )}
                      </motion.g>
                    );
                  })}
                </AnimatePresence>
              </g>

              {/* Arrow marker */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3, 0 6"
                    fill="currentColor"
                    className="text-primary opacity-60"
                  />
                </marker>
              </defs>

              {/* Nodes */}
              <g className="nodes">
                {nodes.map(node => {
                  const isSelected = selectedAgent === node.id;
                  const isHovered = hoveredAgent === node.id;
                  const nodeSize = isSelected ? 16 : isHovered ? 14 : 12;

                  return (
                    <g key={node.id}>
                      {/* Node glow for active/selected */}
                      {(isSelected ||
                        node.status === 'working' ||
                        node.status === 'analyzing') && (
                        <motion.circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeSize + 4}
                          fill={`url(#gradient-${node.id})`}
                          opacity={0.3}
                          animate={{
                            r: [nodeSize + 4, nodeSize + 8, nodeSize + 4],
                            opacity: [0.3, 0.1, 0.3],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      )}

                      {/* Node gradient */}
                      <defs>
                        <radialGradient id={`gradient-${node.id}`}>
                          <stop
                            offset="0%"
                            stopColor={getNodeColor(node.status)
                              .split(' ')[0]
                              .replace('from-', '')}
                          />
                          <stop
                            offset="100%"
                            stopColor={getNodeColor(node.status).split(' ')[2]}
                          />
                        </radialGradient>
                      </defs>

                      {/* Main node circle */}
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeSize}
                        fill={`url(#gradient-${node.id})`}
                        stroke="white"
                        strokeWidth={isSelected ? 3 : 2}
                        className="cursor-pointer"
                        whileHover={{ scale: 1.1 }}
                        onClick={() => handleAgentClick(node.id)}
                        onMouseEnter={() => setHoveredAgent(node.id)}
                        onMouseLeave={() => setHoveredAgent(null)}
                      />

                      {/* Message count badge */}
                      {node.messageCount > 0 && (
                        <g>
                          <circle
                            cx={node.x + 8}
                            cy={node.y - 8}
                            r="6"
                            fill="white"
                            stroke="currentColor"
                            strokeWidth="1"
                            className="text-primary"
                          />
                          <text
                            x={node.x + 8}
                            y={node.y - 8}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="fill-primary text-[8px] font-bold"
                          >
                            {node.messageCount}
                          </text>
                        </g>
                      )}

                      {/* Node label */}
                      {showLabels && (
                        <text
                          x={node.x}
                          y={node.y + nodeSize + 12}
                          textAnchor="middle"
                          className={cn(
                            'pointer-events-none text-[10px] font-medium',
                            isSelected
                              ? 'fill-primary font-bold'
                              : 'fill-foreground'
                          )}
                        >
                          {node.name.length > 15
                            ? node.name.substring(0, 15) + '...'
                            : node.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        {/* Side Panel for Selected Agent */}
        <AnimatePresence>
          {selectedAgent && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-hidden border-l border-border bg-card/50 backdrop-blur-sm"
            >
              <div className="flex h-full flex-col">
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b border-border bg-card/30 px-4 py-3">
                  <div>
                    <h4 className="text-sm font-semibold">{selectedAgent}</h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedAgentCommunications.length} communications
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAgent(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Communications List */}
                <ScrollArea className="flex-1">
                  <div className="space-y-3 p-4">
                    {selectedAgentCommunications.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        No communications yet
                      </p>
                    ) : (
                      selectedAgentCommunications.map(comm => (
                        <div
                          key={comm.id}
                          className="space-y-1 rounded-lg border border-border/50 bg-accent/30 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px]',
                                comm.type === 'handoff' &&
                                  'border-blue-500 text-blue-600',
                                comm.type === 'collaboration' &&
                                  'border-purple-500 text-purple-600',
                                comm.type === 'response' &&
                                  'border-green-500 text-green-600',
                                comm.type === 'error' &&
                                  'border-red-500 text-red-600'
                              )}
                            >
                              {comm.type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {comm.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="font-medium">{comm.from}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{comm.to}</span>
                          </div>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {comm.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="border-t border-border bg-card/30 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-3 text-xs">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Handoff</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            <span className="text-muted-foreground">Collaboration</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Response</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Status</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCollaborationGraph;
