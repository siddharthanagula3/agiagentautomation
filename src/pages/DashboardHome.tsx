/**
 * Dashboard Home Page - Chat-First Design
 * Chat is the primary interface with a collapsible right panel for workforce stats.
 * The DashboardLayout provides the app navigation sidebar and header.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { useAuthStore } from '@shared/stores/authentication-store';
import { useAgentMetricsStore } from '@shared/stores/agent-metrics-store';
import { useWorkforceStore } from '@shared/stores/workforce-store';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { ScrollArea } from '@shared/ui/scroll-area';
import {
  Brain,
  Target,
  Zap,
  CheckCircle2,
  PanelRightClose,
  PanelRightOpen,
  Users,
  Activity,
  TrendingUp,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { motion, animate } from 'framer-motion';

// Chat components (reuse existing)
import { ChatSidebar } from '@features/chat/components/Sidebar/ChatSidebar';
import { ChatHeader } from '@features/chat/components/Main/ChatHeader';
import { MessageList } from '@features/chat/components/Main/MessageList';
import { ChatComposer } from '@features/chat/components/Composer/ChatComposer';
import { ToolProgressIndicator } from '@features/chat/components/workflows/ToolProgressIndicator';
import { KeyboardShortcutsDialog } from '@features/chat/components/dialogs/KeyboardShortcutsDialog';
import { GlobalSearchDialog } from '@features/chat/components/dialogs/GlobalSearchDialog';
import { TokenAnalyticsDialog } from '@features/chat/components/dialogs/TokenAnalyticsDialog';
import { EnhancedExportDialog } from '@features/chat/components/dialogs/EnhancedExportDialog';
import { BookmarksDialog } from '@features/chat/components/dialogs/BookmarksDialog';
import {
  UsageWarningBanner,
  useUsageMonitoring,
} from '@features/chat/components/tokens/UsageWarningBanner';
import { UsageWarningModal } from '@features/chat/components/dialogs/UsageWarningModal';
import { useUsageWarningStore } from '@shared/stores/usage-warning-store';
import { useUserUsage } from '@shared/stores/user-profile-store';
import { useNotificationStore } from '@shared/stores/notification-store';

// Chat hooks (reuse existing)
import { useChat } from '@features/chat/hooks/use-chat-interface';
import { useChatHistory } from '@features/chat/hooks/use-conversation-history';
import { useTools } from '@features/chat/hooks/use-tool-integration';
import { useExport } from '@features/chat/hooks/use-export-conversation';
import { useKeyboardShortcuts } from '@features/chat/hooks/use-keyboard-shortcuts';
import { useAIPreferences } from '@features/chat/hooks/use-ai-preferences';
import type { ChatSession, ChatMode } from '@features/chat/types';

const DEFAULT_TOKEN_LIMITS = {
  free: 10000,
  pro: 100000,
  enterprise: 500000,
} as const;

const FREE_TIER_DEFAULT_LIMIT = DEFAULT_TOKEN_LIMITS.free;

// Animated Counter for stats panel
const AnimatedCounter: React.FC<{
  value: number;
  format?: (val: number) => string;
}> = ({ value, format }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latest) => {
        queueMicrotask(() => setDisplayValue(latest));
      },
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span>{format ? format(displayValue) : Math.round(displayValue)}</span>
  );
};

// Collapsible right panel with workforce stats
const WorkforcePanel: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
}> = ({ isOpen, onToggle }) => {
  const metricsStore = useAgentMetricsStore();
  const { hiredEmployees, fetchHiredEmployees } = useWorkforceStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchHiredEmployees();
  }, [fetchHiredEmployees]);

  const stats = useMemo(
    () => ({
      totalAgents: metricsStore.totalAgents,
      activeAgents: metricsStore.activeAgents,
      completedTasks: metricsStore.completedTasks,
      failedTasks: metricsStore.failedTasks,
      tokensUsed: metricsStore.totalTokensUsed,
      successRate: metricsStore.getSuccessRate(),
      activeSessions: metricsStore.getActiveSessionsCount(),
    }),
    [metricsStore]
  );

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center border-l border-border bg-card/30 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="mb-2"
          aria-label="Open workforce panel"
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
            <Target className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-72 flex-shrink-0 flex-col border-l border-border bg-card/30">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Workforce</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7"
          aria-label="Close workforce panel"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Agents</span>
              </div>
              <p className="mt-1 text-lg font-bold">
                <AnimatedCounter value={stats.totalAgents} />
              </p>
              {stats.activeAgents > 0 && (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  <Zap className="mr-0.5 h-2.5 w-2.5 animate-pulse" />
                  {stats.activeAgents} active
                </Badge>
              )}
            </div>

            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs text-muted-foreground">Tasks</span>
              </div>
              <p className="mt-1 text-lg font-bold">
                <AnimatedCounter value={stats.completedTasks} />
              </p>
              {stats.activeSessions > 0 && (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  <Activity className="mr-0.5 h-2.5 w-2.5 animate-pulse" />
                  {stats.activeSessions} running
                </Badge>
              )}
            </div>

            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Tokens</span>
              </div>
              <p className="mt-1 text-lg font-bold">
                <AnimatedCounter
                  value={stats.tokensUsed}
                  format={(v) => {
                    const rounded = Math.round(v);
                    if (rounded >= 1000) return `${(rounded / 1000).toFixed(1)}k`;
                    return String(rounded);
                  }}
                />
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs text-muted-foreground">Success</span>
              </div>
              <p className="mt-1 text-lg font-bold">
                {stats.completedTasks + stats.failedTasks > 0 ? (
                  <>
                    <AnimatedCounter value={stats.successRate} />%
                  </>
                ) : (
                  '--'
                )}
              </p>
            </div>
          </div>

          {/* Active Employees */}
          {hiredEmployees.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Hired Employees
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  {hiredEmployees.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {hiredEmployees.slice(0, 5).map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{emp.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {emp.role}
                      </p>
                    </div>
                    {emp.is_active && (
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </div>
                ))}
                {hiredEmployees.length > 5 && (
                  <p className="text-center text-xs text-muted-foreground">
                    +{hiredEmployees.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="space-y-1.5">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Quick Links
            </h4>
            {[
              { label: 'Workforce', href: '/workforce', icon: Users },
              { label: 'Mission Control', href: '/mission-control', icon: Target },
              { label: 'VIBE Workspace', href: '/vibe', icon: Zap },
              { label: 'Marketplace', href: '/hire', icon: TrendingUp },
            ].map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => navigate(link.href)}
              >
                <link.icon className="mr-2 h-3.5 w-3.5" />
                {link.label}
                <ArrowRight className="ml-auto h-3 w-3" />
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export const DashboardHomePage: React.FC = () => {
  const navigate = useNavigate();
  const userUsage = useUserUsage();
  const aiPreferences = useAIPreferences();

  // Chat state - reuse exact same hooks as ChatPage
  const {
    messages: rawMessages,
    isLoading,
    error,
    activeTools,
    toolProgress,
    sendMessage,
    regenerateMessage,
    editMessage,
    deleteMessage,
    clearMessages,
  } = useChat(undefined); // No sessionId - uses current/new session

  const messages = useMemo(() => {
    return rawMessages.map((msg) => {
      let createdAt: Date;
      if (msg.createdAt instanceof Date) {
        createdAt = msg.createdAt;
      } else if (
        typeof msg.createdAt === 'string' ||
        typeof msg.createdAt === 'number'
      ) {
        createdAt = new Date(msg.createdAt);
      } else {
        createdAt = new Date();
      }
      if (isNaN(createdAt.getTime())) {
        createdAt = new Date();
      }
      return { ...msg, createdAt };
    });
  }, [rawMessages]);

  const {
    sessions,
    currentSession,
    isLoading: isLoadingSessions,
    createSession,
    renameSession,
    deleteSession,
    loadSessions,
    loadSession,
    toggleStarSession,
    togglePinSession,
    toggleArchiveSession,
    duplicateSession,
    shareSession,
  } = useChatHistory();

  const { availableTools, executeTool, activeTool, toolResults } = useTools();
  const {
    exportAsMarkdown,
    exportAsJSON,
    exportAsHTML,
    exportAsText,
    copyToClipboard,
    isExporting,
  } = useExport();

  // Local state
  const [chatSidebarOpen, setChatSidebarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('dashboard-chat-sidebar');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });
  const [rightPanelOpen, setRightPanelOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('dashboard-right-panel');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<ChatMode>('team');
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningThreshold, setWarningThreshold] = useState<85 | 95>(85);

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const { showError, showSuccess } = useNotificationStore();

  // Filter sessions
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.summary?.toLowerCase().includes(query) ||
        s.tags?.some((t) => t.toLowerCase().includes(query))
    );
  }, [sessions, searchQuery]);

  // Persist sidebar states
  useEffect(() => {
    localStorage.setItem(
      'dashboard-chat-sidebar',
      JSON.stringify(chatSidebarOpen)
    );
  }, [chatSidebarOpen]);

  useEffect(() => {
    localStorage.setItem(
      'dashboard-right-panel',
      JSON.stringify(rightPanelOpen)
    );
  }, [rightPanelOpen]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Create new session if none exists
  useEffect(() => {
    if (!currentSession) {
      createSession('New Chat').catch((err) => {
        console.error('Failed to create session:', err);
      });
    }
  }, [currentSession, createSession]);

  // Handlers
  const handleSendMessage = async (
    content: string,
    options?: { attachments?: File[]; employees?: string[] }
  ) => {
    if (!content.trim()) return;
    try {
      await sendMessage({
        content,
        attachments: options?.attachments,
        mode: selectedMode,
        tools: availableTools,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleNewChat = useCallback(() => {
    createSession('New Chat')
      .then((session) => {
        navigate(`/chat/${session.id}`);
      })
      .catch((err) => {
        console.error('Failed to create new chat:', err);
        showError('Unable to create a new chat. Please try again.', 'Chat Creation Failed');
      });
  }, [createSession, navigate, showError]);

  const handleSessionSelect = (session: ChatSession) => {
    navigate(`/chat/${session.id}`);
  };

  const handleSessionRename = (sessionId: string, newTitle: string) => {
    renameSession(sessionId, newTitle);
  };

  const handleSessionDelete = (sessionId: string) => {
    deleteSession(sessionId);
    if (currentSession?.id === sessionId) {
      navigate('/dashboard');
    }
  };

  const handleToolExecute = async (
    toolId: string,
    args?: Record<string, unknown>
  ) => {
    try {
      await executeTool(toolId, args);
    } catch (err) {
      console.error('Tool execution failed:', err);
    }
  };

  const handleShare = useCallback(async () => {
    if (!currentSession) return;
    try {
      await shareSession(currentSession.id);
      showSuccess('Share link generated successfully', 'Session Shared');
    } catch (err) {
      console.error('Failed to share session:', err);
      showError('Unable to generate share link.', 'Share Failed');
    }
  }, [currentSession, shareSession, showSuccess, showError]);

  const handleCopyLastMessage = useCallback(async () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      try {
        await navigator.clipboard.writeText(lastMessage.content);
        showSuccess('Message copied to clipboard', 'Copied');
      } catch (err) {
        showError('Unable to copy message.', 'Copy Failed');
      }
    }
  }, [messages, showSuccess, showError]);

  const handleRegenerateLastMessage = useCallback(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant');
    if (lastAssistant) {
      regenerateMessage(lastAssistant.id);
    }
  }, [messages, regenerateMessage]);

  const handleFocusComposer = useCallback(() => {
    composerRef.current?.focus();
  }, []);

  const { shortcuts } = useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onSearch: () => setGlobalSearchOpen(true),
    onShowShortcuts: () => setShortcutsDialogOpen(true),
    onToggleSidebar: () => setChatSidebarOpen(!chatSidebarOpen),
    onFocusComposer: handleFocusComposer,
    onCopyLastMessage: handleCopyLastMessage,
    onRegenerateLastMessage: handleRegenerateLastMessage,
  });

  // Token usage warnings
  const { usageData } = useUsageMonitoring(currentSession?.userId || null);
  const {
    updateUsage,
    shouldShowWarning,
    markWarningShown,
    usagePercentage,
    currentUsage,
    totalLimit,
  } = useUsageWarningStore();

  React.useEffect(() => {
    if (usageData.length > 0) {
      const totalUsed = usageData.reduce((sum, d) => sum + d.tokensUsed, 0);
      const limit = userUsage?.tokensLimit ?? FREE_TIER_DEFAULT_LIMIT;
      updateUsage(totalUsed, limit);
      if (shouldShowWarning(95)) {
        setWarningThreshold(95);
        setWarningModalOpen(true);
        markWarningShown(95);
      } else if (shouldShowWarning(85)) {
        setWarningThreshold(85);
        setWarningModalOpen(true);
        markWarningShown(85);
      }
    }
  }, [usageData, userUsage?.tokensLimit, updateUsage, shouldShowWarning, markWarningShown]);

  return (
    <div className="-mx-4 -mt-0 flex h-[calc(100vh-4rem)] sm:-mx-6 lg:-mx-8">
      {/* Left: Chat session sidebar */}
      <div
        className={cn(
          'border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out',
          chatSidebarOpen ? 'w-0 sm:w-64 md:w-72' : 'w-0',
          'overflow-hidden'
        )}
      >
        {chatSidebarOpen && (
          <ChatSidebar
            sessions={filteredSessions}
            currentSession={currentSession}
            searchQuery={searchQuery}
            isLoading={isLoadingSessions}
            onSearchChange={setSearchQuery}
            onNewChat={handleNewChat}
            onSessionSelect={handleSessionSelect}
            onSessionRename={handleSessionRename}
            onSessionDelete={handleSessionDelete}
            onSessionStar={toggleStarSession}
            onSessionPin={togglePinSession}
            onSessionArchive={toggleArchiveSession}
            onSessionShare={shareSession}
            onSessionDuplicate={duplicateSession}
            onToggleSidebar={() => setChatSidebarOpen(!chatSidebarOpen)}
          />
        )}
      </div>

      {/* Center: Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Chat Header */}
        <ChatHeader
          session={currentSession}
          onRename={(title) =>
            currentSession && handleSessionRename(currentSession.id, title)
          }
          onShare={handleShare}
          onExport={() => setExportDialogOpen(true)}
          onSettings={() => navigate('/settings')}
          onToggleSidebar={() => setChatSidebarOpen(!chatSidebarOpen)}
          onSearch={() => setGlobalSearchOpen(true)}
          onAnalytics={() => setAnalyticsOpen(true)}
          onBookmarks={() => setBookmarksOpen(true)}
        />

        {/* Usage Warning Banner */}
        {usageData.length > 0 && (
          <div className="border-b border-border px-4 py-2">
            <UsageWarningBanner usageData={usageData} />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onRegenerate={regenerateMessage}
            onEdit={editMessage}
            onDelete={deleteMessage}
            onToolExecute={handleToolExecute}
            toolResults={toolResults}
            activeTool={activeTool}
          />

          {activeTools && activeTools.length > 0 && (
            <div className="p-4">
              <ToolProgressIndicator
                activeTools={activeTools}
                toolProgress={toolProgress || {}}
              />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-4xl p-3 sm:p-4">
            <ChatComposer
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              availableTools={availableTools}
              onToolToggle={() => {}}
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
            />
          </div>
        </div>
      </div>

      {/* Right: Collapsible workforce panel */}
      <WorkforcePanel
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(!rightPanelOpen)}
      />

      {/* Dialogs */}
      <KeyboardShortcutsDialog
        open={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
        shortcuts={shortcuts}
      />
      <GlobalSearchDialog
        open={globalSearchOpen}
        onOpenChange={setGlobalSearchOpen}
      />
      <TokenAnalyticsDialog
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
      />
      <EnhancedExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        session={currentSession}
        messages={messages}
      />
      <BookmarksDialog open={bookmarksOpen} onOpenChange={setBookmarksOpen} />
      <UsageWarningModal
        open={warningModalOpen}
        onOpenChange={setWarningModalOpen}
        threshold={warningThreshold}
        currentUsage={currentUsage}
        totalLimit={totalLimit}
        usagePercentage={usagePercentage}
      />
    </div>
  );
};

const DashboardHomePageWithErrorBoundary: React.FC = () => (
  <ErrorBoundary componentName="DashboardHomePage" showReportDialog>
    <DashboardHomePage />
  </ErrorBoundary>
);

export default DashboardHomePageWithErrorBoundary;
