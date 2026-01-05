/**
 * MultiAgentChatInterface - Enhanced chat interface for multi-agent collaboration
 * Updated: Nov 16th 2025 - Added error boundary
 *
 * Features:
 * - Multi-participant chat view with agent avatars
 * - Real-time typing indicators for multiple agents
 * - Message grouping by agent
 * - Rich message rendering (markdown, code, attachments)
 * - Agent status indicators
 * - Collapsible panels
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/button';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { Separator } from '@shared/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Settings,
  Maximize2,
  Minimize2,
  MessageSquare,
} from 'lucide-react';
import { AdvancedMessageList } from './AdvancedMessageList';
import { EnhancedMessageInput } from './EnhancedMessageInput';
import { AgentParticipantPanel } from './AgentParticipantPanel';
import { CollaborativeTaskView } from './CollaborativeTaskView';
import {
  useMissionStore,
  useActiveEmployees,
} from '@shared/stores/mission-control-store';
import type { MissionMessage } from '@shared/stores/mission-control-store';
import ErrorBoundary from '@shared/components/ErrorBoundary';

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  color: string;
  status: 'active' | 'idle' | 'thinking' | 'typing' | 'offline';
  currentTask?: string;
  progress?: number;
}

export interface ChatMessage extends MissionMessage {
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  agentColor?: string;
  isTyping?: boolean;
  reactions?: Array<{ emoji: string; userId: string; timestamp: Date }>;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
}

interface MultiAgentChatInterfaceProps {
  /** Active agents participating in the conversation */
  agents?: Agent[];
  /** Chat messages */
  messages?: ChatMessage[];
  /** Current user ID */
  userId?: string;
  /** Callback when sending a message */
  onSendMessage?: (content: string, mentions?: string[]) => void;
  /** Callback when selecting an agent for direct message */
  onAgentSelect?: (agentId: string) => void;
  /** Whether to show the task view panel */
  showTaskView?: boolean;
  /** Whether to show the participant panel */
  showParticipants?: boolean;
  /** Whether the interface is in fullscreen mode */
  isFullscreen?: boolean;
  /** Callback when toggling fullscreen */
  onToggleFullscreen?: () => void;
  /** Custom className */
  className?: string;
}

export function MultiAgentChatInterface({
  agents: externalAgents = [],
  messages: externalMessages = [],
  userId = 'user',
  onSendMessage,
  onAgentSelect,
  showTaskView = true,
  showParticipants = true,
  isFullscreen = false,
  onToggleFullscreen,
  className,
}: MultiAgentChatInterfaceProps) {
  // State management
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<
    'tasks' | 'participants' | 'settings'
  >('tasks');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [typingAgents, setTypingAgents] = useState<Set<string>>(new Set());

  // Mission store integration
  const missionMessages = useMissionStore((state) => state.messages);
  const activeEmployees = useActiveEmployees();
  const missionPlan = useMissionStore((state) => state.missionPlan);

  // Convert mission store data to chat format
  // activeEmployees is now a Record, not a Map
  const agents: Agent[] =
    externalAgents.length > 0
      ? externalAgents
      : Object.values(activeEmployees).map((emp) => ({
          id: emp.name,
          name: emp.name,
          role: 'AI Employee',
          color: getAgentColor(emp.name),
          status:
            emp.status === 'thinking'
              ? 'thinking'
              : emp.status === 'using_tool'
                ? 'active'
                : emp.status === 'error'
                  ? 'offline'
                  : 'idle',
          currentTask: emp.currentTask || undefined,
          progress: emp.progress,
        }));

  const messages: ChatMessage[] =
    externalMessages.length > 0
      ? externalMessages
      : missionMessages.map((msg) => ({
          ...msg,
          agentId: msg.from === 'user' ? undefined : msg.from,
          agentName: msg.from === 'user' ? undefined : msg.from,
          agentColor: msg.from === 'user' ? undefined : getAgentColor(msg.from),
        }));

  // Typing indicator simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const thinkingAgents = agents.filter(
        (a) => a.status === 'thinking' || a.status === 'typing'
      );
      setTypingAgents(new Set(thinkingAgents.map((a) => a.id)));
    }, 500);

    return () => clearInterval(interval);
  }, [agents]);

  // Handle message send
  const handleSendMessage = useCallback(
    (content: string, attachments?: File[]) => {
      const mentions = extractMentions(content);
      onSendMessage?.(content, mentions);
    },
    [onSendMessage]
  );

  // Handle agent selection
  const handleAgentSelect = useCallback(
    (agentId: string) => {
      setSelectedAgent(agentId === selectedAgent ? null : agentId);
      onAgentSelect?.(agentId);
    },
    [selectedAgent, onAgentSelect]
  );

  // Handle message reactions
  const handleReaction = useCallback((messageId: string, emoji: string) => {
    console.log('Reaction:', messageId, emoji);
    // TODO: Implement reaction handling
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setLeftPanelOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        setRightPanelOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Multi-agent chat error</h2>
            <p className="mt-2 text-muted-foreground">
              Something went wrong with the multi-agent interface. Please
              refresh the page.
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      <div
        className={cn(
          'flex h-full w-full flex-col bg-background',
          isFullscreen && 'fixed inset-0 z-50',
          className
        )}
      >
        {/* Top Bar */}
        <div className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              aria-label={leftPanelOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {leftPanelOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold">
                Multi-Agent Collaboration
              </h2>
              <p className="text-xs text-muted-foreground">
                {agents.length} agent{agents.length !== 1 ? 's' : ''} active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Agent Avatar Stack */}
            <div className="flex -space-x-2">
              {agents.slice(0, 5).map((agent) => (
                <div
                  key={agent.id}
                  className="relative h-8 w-8 rounded-full border-2 border-background"
                  style={{ backgroundColor: agent.color }}
                  title={agent.name}
                >
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
                    {agent.name.substring(0, 2).toUpperCase()}
                  </div>
                  {agent.status === 'typing' && (
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                  )}
                </div>
              ))}
              {agents.length > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold">
                  +{agents.length - 5}
                </div>
              )}
            </div>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Agent List (Optional) */}
          {leftPanelOpen && (
            <div className="w-64 border-r border-border bg-card">
              <div className="p-4">
                <h3 className="mb-4 text-sm font-semibold">Active Agents</h3>
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="space-y-2">
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => handleAgentSelect(agent.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                          selectedAgent === agent.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        <div
                          className="h-10 w-10 rounded-full"
                          style={{ backgroundColor: agent.color }}
                        >
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                            {agent.name.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="truncate text-sm font-medium">
                            {agent.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {agent.role}
                          </div>
                        </div>
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full',
                            agent.status === 'active' && 'bg-green-500',
                            agent.status === 'thinking' &&
                              'animate-pulse bg-blue-500',
                            agent.status === 'typing' &&
                              'animate-pulse bg-yellow-500',
                            agent.status === 'idle' && 'bg-gray-400',
                            agent.status === 'offline' && 'bg-red-500'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Center Panel - Chat Messages */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Message List */}
            <div className="flex-1 overflow-hidden">
              <AdvancedMessageList
                messages={messages}
                agents={agents}
                currentUserId={userId}
                typingAgents={typingAgents}
                onReaction={handleReaction}
              />
            </div>

            {/* Message Input */}
            <div className="border-t border-border bg-card p-4">
              <EnhancedMessageInput
                agents={agents}
                onSend={handleSendMessage}
                placeholder="Type a message or @mention an agent..."
              />
            </div>
          </div>

          {/* Right Panel - Tasks/Participants/Settings */}
          {rightPanelOpen && (
            <div className="w-80 border-l border-border bg-card">
              {/* Panel Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setRightPanelTab('tasks')}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                    rightPanelTab === 'tasks'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setRightPanelTab('participants')}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                    rightPanelTab === 'participants'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Users className="mr-2 inline h-4 w-4" />
                  Agents
                </button>
                <button
                  onClick={() => setRightPanelTab('settings')}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                    rightPanelTab === 'settings'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Settings className="mr-2 inline h-4 w-4" />
                </button>
              </div>

              {/* Panel Content */}
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="p-4">
                  {rightPanelTab === 'tasks' && showTaskView && (
                    <CollaborativeTaskView
                      tasks={missionPlan}
                      agents={agents}
                    />
                  )}
                  {rightPanelTab === 'participants' && showParticipants && (
                    <AgentParticipantPanel
                      agents={agents}
                      onAgentSelect={handleAgentSelect}
                      selectedAgentId={selectedAgent}
                    />
                  )}
                  {rightPanelTab === 'settings' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold">Chat Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Settings panel - to be implemented
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Helper functions
function getAgentColor(agentName: string): string {
  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
  ];

  const hash = agentName
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+(?:-\w+)*)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}
