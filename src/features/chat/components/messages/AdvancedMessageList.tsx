/**
 * AdvancedMessageList - Virtualized message list with advanced features
 *
 * Features:
 * - Virtualized scrolling for performance with 1000+ messages
 * - Message clustering by agent and time
 * - Timestamp grouping (Today, Yesterday, etc.)
 * - Read receipts
 * - Reaction support
 * - Auto-scroll to bottom on new messages
 * - Smooth animations
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { cn } from '@shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@shared/components/ui/avatar';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import {
  User,
  Bot,
  CheckCheck,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import type { Agent, ChatMessage } from '../Main/MultiAgentChatInterface';

interface AdvancedMessageListProps {
  /** Array of messages to display */
  messages: ChatMessage[];
  /** Array of active agents */
  agents: Agent[];
  /** Current user ID */
  currentUserId: string;
  /** Set of agent IDs currently typing */
  typingAgents?: Set<string>;
  /** Callback when a user reacts to a message */
  onReaction?: (messageId: string, emoji: string) => void;
  /** Whether to auto-scroll to bottom */
  autoScroll?: boolean;
  /** Custom className */
  className?: string;
}

interface MessageCluster {
  agentId: string;
  agentName: string;
  agentColor?: string;
  agentAvatar?: string;
  messages: ChatMessage[];
  startTime: Date;
  endTime: Date;
}

interface TimeGroup {
  label: string;
  date: Date;
  clusters: MessageCluster[];
}

// Virtualization row types
type VirtualizedRowType = 'time-header' | 'cluster' | 'typing-indicator';

interface VirtualizedRow {
  type: VirtualizedRowType;
  data: TimeGroup | MessageCluster | { typingAgents: Set<string> };
  groupLabel?: string;
}

interface VirtualizedRowData {
  rows: VirtualizedRow[];
  agents: Agent[];
  currentUserId: string;
  onReaction?: (messageId: string, emoji: string) => void;
  getAgent: (agentId: string) => Agent | undefined;
}

const CLUSTER_TIME_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const ITEM_SIZE = 120; // Estimated height per row in pixels

// Row renderer for react-window
const VirtualizedRowRenderer = React.memo(function VirtualizedRowRenderer({
  index,
  style,
  data,
}: ListChildComponentProps<VirtualizedRowData>) {
  const { rows, currentUserId, onReaction, getAgent } = data;
  const row = rows[index];

  if (!row) return null;

  return (
    <div style={style} className="px-4">
      {row.type === 'time-header' && (
        <div className="flex items-center justify-center py-2">
          <div className="rounded-full bg-muted px-3 py-1">
            <span className="text-xs font-medium text-muted-foreground">
              {row.groupLabel}
            </span>
          </div>
        </div>
      )}

      {row.type === 'cluster' && (
        <MessageClusterComponent
          cluster={row.data as MessageCluster}
          agent={getAgent((row.data as MessageCluster).agentId)}
          isUser={(row.data as MessageCluster).agentId === currentUserId}
          onReaction={onReaction}
        />
      )}

      {row.type === 'typing-indicator' && (
        <TypingIndicator typingAgents={(row.data as { typingAgents: Set<string> }).typingAgents} />
      )}
    </div>
  );
});

// Typing indicator component extracted for virtualization
const TypingIndicator = React.memo(function TypingIndicator({
  typingAgents,
}: {
  typingAgents: Set<string>;
}) {
  if (typingAgents.size === 0) return null;

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
          <Bot className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="flex flex-col">
        <div className="text-xs font-medium text-muted-foreground">
          {Array.from(typingAgents).slice(0, 2).join(', ')}
          {typingAgents.size > 2 && ` and ${typingAgents.size - 2} more`}
          {typingAgents.size === 1 ? ' is typing' : ' are typing'}
        </div>
        <div className="mt-2 flex items-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
});

// Updated: Jan 6th 2026 - Added react-window virtualization for 1000+ messages
export const AdvancedMessageList = React.memo(function AdvancedMessageList({
  messages,
  agents,
  currentUserId,
  typingAgents = new Set(),
  onReaction,
  autoScroll = true,
  className,
}: AdvancedMessageListProps) {
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(500);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(autoScroll);
  const prevMessageCountRef = useRef(messages.length);

  // Group messages by time and cluster by agent
  const timeGroups = useMemo(() => {
    return groupMessagesByTimeAndAgent(messages);
  }, [messages]);

  // Flatten time groups into virtualized rows
  const virtualizedRows = useMemo(() => {
    const rows: VirtualizedRow[] = [];

    timeGroups.forEach((group) => {
      // Add time header row
      rows.push({
        type: 'time-header',
        data: group,
        groupLabel: group.label,
      });

      // Add cluster rows
      group.clusters.forEach((cluster) => {
        rows.push({
          type: 'cluster',
          data: cluster,
        });
      });
    });

    // Add typing indicator if needed
    if (typingAgents.size > 0) {
      rows.push({
        type: 'typing-indicator',
        data: { typingAgents },
      });
    }

    return rows;
  }, [timeGroups, typingAgents]);

  // Get agent info
  const getAgent = useCallback(
    (agentId: string) => {
      return agents.find((a) => a.id === agentId);
    },
    [agents]
  );

  // Item data for row renderer
  const itemData = useMemo<VirtualizedRowData>(
    () => ({
      rows: virtualizedRows,
      agents,
      currentUserId,
      onReaction,
      getAgent,
    }),
    [virtualizedRows, agents, currentUserId, onReaction, getAgent]
  );

  // Measure container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        if (height > 0) {
          setContainerHeight(height);
        }
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const messageCountChanged = messages.length !== prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (shouldAutoScroll && listRef.current && messageCountChanged) {
      // Scroll to the last item
      listRef.current.scrollToItem(virtualizedRows.length - 1, 'end');
    }
  }, [messages.length, virtualizedRows.length, shouldAutoScroll]);

  // Handle scroll to detect manual scrolling
  const handleScroll = useCallback(
    ({ scrollOffset, scrollUpdateWasRequested }: { scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
      if (scrollUpdateWasRequested) return; // Ignore programmatic scrolls

      const totalHeight = virtualizedRows.length * ITEM_SIZE;
      const isAtBottom = totalHeight - scrollOffset - containerHeight < 150;
      setShouldAutoScroll(isAtBottom);
    },
    [virtualizedRows.length, containerHeight]
  );

  return (
    <div ref={containerRef} className={cn('h-full w-full', className)}>
      <List
        ref={listRef}
        height={containerHeight}
        itemCount={virtualizedRows.length}
        itemSize={ITEM_SIZE}
        itemData={itemData}
        width="100%"
        onScroll={handleScroll}
        overscanCount={5}
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {VirtualizedRowRenderer}
      </List>
    </div>
  );
});

// Message Cluster Component
interface MessageClusterComponentProps {
  cluster: MessageCluster;
  agent?: Agent;
  isUser: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
}

function MessageClusterComponent({
  cluster,
  agent,
  isUser,
  onReaction,
}: MessageClusterComponentProps) {
  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500">
              <User className="h-5 w-5 text-white" />
            </AvatarFallback>
          </Avatar>
        ) : agent ? (
          <Avatar className="h-9 w-9">
            {agent.avatar ? (
              <AvatarImage src={agent.avatar} alt={agent.name} />
            ) : null}
            <AvatarFallback
              className="text-xs font-semibold text-white"
              style={{ backgroundColor: agent.color }}
            >
              {agent.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
            <Bot className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        className={cn('flex max-w-[70%] flex-col gap-1', isUser && 'items-end')}
      >
        {/* Agent Name & Time */}
        {!isUser && (
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs font-semibold">{cluster.agentName}</span>
            <span className="text-xs text-muted-foreground">
              {format(cluster.startTime, 'HH:mm')}
            </span>
            {agent && agent.status === 'active' && (
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            )}
          </div>
        )}

        {/* Message Bubbles */}
        {cluster.messages.map((message, index) => (
          <MessageBubbleComponent
            key={message.id}
            message={message}
            isUser={isUser}
            isFirstInCluster={index === 0}
            isLastInCluster={index === cluster.messages.length - 1}
            onReaction={onReaction}
          />
        ))}
      </div>
    </div>
  );
}

// Message Bubble Component
interface MessageBubbleComponentProps {
  message: ChatMessage;
  isUser: boolean;
  isFirstInCluster: boolean;
  isLastInCluster: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
}

function MessageBubbleComponent({
  message,
  isUser,
  isFirstInCluster,
  isLastInCluster,
  onReaction,
}: MessageBubbleComponentProps) {
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = (emoji: string) => {
    onReaction?.(message.id, emoji);
    setShowReactions(false);
  };

  return (
    <div className="group relative">
      <div
        className={cn(
          'rounded-2xl px-4 py-2 transition-colors',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
          !isFirstInCluster && (isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'),
          !isLastInCluster && (isUser ? 'rounded-br-sm' : 'rounded-bl-sm')
        )}
      >
        {/* Message Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 rounded bg-background/50 px-2 py-1 text-xs"
              >
                <span className="truncate">{attachment.name}</span>
                <span className="text-muted-foreground">
                  ({formatFileSize(attachment.size)})
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        {message.metadata && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {message.metadata.model && (
              <Badge variant="outline" className="text-xs">
                {message.metadata.model}
              </Badge>
            )}
            {message.metadata.tokensUsed && (
              <span>{message.metadata.tokensUsed} tokens</span>
            )}
          </div>
        )}
      </div>

      {/* Reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1 px-2">
          {aggregateReactions(message.reactions).map(({ emoji, count }) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-muted/80"
            >
              <span>{emoji}</span>
              <span className="text-muted-foreground">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Reaction Buttons (on hover) */}
      <div
        className={cn(
          'absolute -top-8 flex gap-1 rounded-lg border border-border bg-card p-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100',
          isUser ? 'right-0' : 'left-0'
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => handleReaction('👍')}
        >
          👍
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => handleReaction('👎')}
        >
          👎
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => handleReaction('❤️')}
        >
          ❤️
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => handleReaction('🎉')}
        >
          🎉
        </Button>
      </div>

      {/* Read Receipt */}
      {isUser && isLastInCluster && (
        <div className="mt-1 flex items-center justify-end gap-1 px-2">
          <span className="text-xs text-muted-foreground">
            {format(message.timestamp, 'HH:mm')}
          </span>
          <CheckCheck className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// Helper functions
function groupMessagesByTimeAndAgent(messages: ChatMessage[]): TimeGroup[] {
  const groups: TimeGroup[] = [];
  let currentGroup: TimeGroup | null = null;
  let currentCluster: MessageCluster | null = null;

  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp);
    const timeLabel = getTimeLabel(messageDate);

    // Start new time group if needed
    if (!currentGroup || currentGroup.label !== timeLabel) {
      currentGroup = {
        label: timeLabel,
        date: messageDate,
        clusters: [],
      };
      groups.push(currentGroup);
      currentCluster = null;
    }

    const agentId = message.from === 'user' ? 'user' : message.from;

    // Start new cluster if needed
    if (
      !currentCluster ||
      currentCluster.agentId !== agentId ||
      messageDate.getTime() - currentCluster.endTime.getTime() >
        CLUSTER_TIME_THRESHOLD
    ) {
      currentCluster = {
        agentId,
        agentName: message.from === 'user' ? 'You' : message.from,
        agentColor: message.agentColor,
        agentAvatar: message.agentAvatar,
        messages: [],
        startTime: messageDate,
        endTime: messageDate,
      };
      currentGroup.clusters.push(currentCluster);
    }

    // Add message to cluster
    currentCluster.messages.push(message);
    currentCluster.endTime = messageDate;
  });

  return groups;
}

function getTimeLabel(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else if (isThisWeek(date)) {
    return format(date, 'EEEE');
  } else if (isThisYear(date)) {
    return format(date, 'MMMM d');
  } else {
    return format(date, 'MMMM d, yyyy');
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function aggregateReactions(
  reactions: Array<{ emoji: string; userId: string; timestamp: Date }>
) {
  const counts = new Map<string, number>();
  reactions.forEach(({ emoji }) => {
    counts.set(emoji, (counts.get(emoji) || 0) + 1);
  });
  return Array.from(counts.entries()).map(([emoji, count]) => ({
    emoji,
    count,
  }));
}
