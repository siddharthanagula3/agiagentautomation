// Updated: Nov 16th 2025 - Added error boundary
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Separator } from '@shared/ui/separator';
import { useChat } from '../hooks/use-chat-interface';
import { useChatHistory } from '../hooks/use-conversation-history';
import { useTools } from '../hooks/use-tool-integration';
import { useExport } from '../hooks/use-export-conversation';
import { useKeyboardShortcuts } from '../hooks/use-keyboard-shortcuts';
import { useAIPreferences } from '../hooks/use-ai-preferences';
import { ChatSidebar } from '../components/Sidebar/ChatSidebar';
import { ChatHeader } from '../components/Main/ChatHeader';
import { MessageList } from '../components/Main/MessageList';
import { ChatComposer } from '../components/Composer/ChatComposer';
import { ModeSelector } from '../components/Tools/ModeSelector';
import { KeyboardShortcutsDialog } from '../components/KeyboardShortcutsDialog';
import { ToolProgressIndicator } from '../components/ToolProgressIndicator';
import type { ChatSession, ChatMessage, ChatMode } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@shared/ui/dropdown-menu';
import { Button } from '@shared/ui/button';
import { FileText, FileJson, FileCode, Download } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  UsageWarningBanner,
  useUsageMonitoring,
} from '../components/UsageWarningBanner';
import { UsageWarningModal } from '../components/UsageWarningModal';
import { useUsageWarningStore } from '@shared/stores/usage-warning-store';
import ErrorBoundary from '@shared/components/ErrorBoundary';

const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();

  // Load user AI preferences (applies to LLM service on mount)
  const aiPreferences = useAIPreferences();

  // Chat state management
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
  } = useChat(sessionId);

  // Defensive: Ensure all message timestamps are valid Date objects
  const messages = React.useMemo(() => {
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

      // Validate date - if invalid, use current date
      if (isNaN(createdAt.getTime())) {
        console.warn(
          'Invalid createdAt for message in ChatInterface:',
          msg.id,
          msg.createdAt
        );
        createdAt = new Date();
      }

      return {
        ...msg,
        createdAt,
      };
    });
  }, [rawMessages]);

  const {
    sessions,
    currentSession,
    createSession,
    renameSession,
    deleteSession,
    searchSessions,
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
    generateShareLink,
    shareLink,
    isExporting,
  } = useExport();

  // Local state
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Persist sidebar state in localStorage
    const stored = localStorage.getItem('chat-sidebar-open');
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<ChatMode>('team');
  // Models are automatically managed by AI employees - each employee uses their configured model
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningThreshold, setWarningThreshold] = useState<85 | 95>(85);

  // Filter sessions based on search query
  const filteredSessions = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return sessions;
    }

    const query = searchQuery.toLowerCase();
    return sessions.filter((session) => {
      const titleMatch = session.title.toLowerCase().includes(query);
      const summaryMatch = session.summary?.toLowerCase().includes(query);
      const tagsMatch = session.tags?.some((tag) =>
        tag.toLowerCase().includes(query)
      );

      return titleMatch || summaryMatch || tagsMatch;
    });
  }, [sessions, searchQuery]);

  // Refs
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('chat-sidebar-open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load current session when sessionId changes
  useEffect(() => {
    if (sessionId && (!currentSession || currentSession.id !== sessionId)) {
      loadSession(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, currentSession]);

  // Create new session if none exists
  useEffect(() => {
    if (!currentSession && !sessionId) {
      createSession('New Chat')
        .then((session) => {
          navigate(`/chat/${session.id}`);
        })
        .catch((error) => {
          console.error('Failed to create session:', error);
        });
    }
  }, [currentSession, sessionId, createSession, navigate]);

  const handleSendMessage = async (
    content: string,
    options?: {
      attachments?: File[];
      employees?: string[];
    }
  ) => {
    if (!content.trim()) return;

    try {
      await sendMessage({
        content,
        attachments: options?.attachments,
        mode: selectedMode,
        // Model selection removed - AI employees use their configured models
        tools: availableTools,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleNewChat = () => {
    createSession('New Chat').then((session) => {
      navigate(`/chat/${session.id}`);
    });
  };

  const handleSessionSelect = (session: ChatSession) => {
    navigate(`/chat/${session.id}`);
  };

  const handleSessionRename = (sessionId: string, newTitle: string) => {
    renameSession(sessionId, newTitle);
  };

  const handleSessionDelete = (sessionId: string) => {
    deleteSession(sessionId);
    if (currentSession?.id === sessionId) {
      navigate('/chat');
    }
  };

  const handleToolExecute = async (
    toolId: string,
    args?: Record<string, unknown>
  ) => {
    try {
      await executeTool(toolId, args);
    } catch (error) {
      console.error('Tool execution failed:', error);
    }
  };

  const handleExport = async (
    format: 'markdown' | 'json' | 'html' | 'text'
  ) => {
    if (!currentSession) return;

    switch (format) {
      case 'markdown':
        await exportAsMarkdown(currentSession, messages);
        break;
      case 'json':
        await exportAsJSON(currentSession, messages);
        break;
      case 'html':
        await exportAsHTML(currentSession, messages);
        break;
      case 'text':
        await exportAsText(currentSession, messages);
        break;
    }
  };

  const handleShare = async () => {
    if (!currentSession) return;
    await shareSession(currentSession.id);
  };

  const handleCopyToClipboard = async () => {
    if (!currentSession) return;
    await copyToClipboard(currentSession, messages, 'markdown');
  };

  // Monitor token usage for warnings
  const { usageData } = useUsageMonitoring(currentSession?.userId || null);

  // Usage warning system
  const {
    updateUsage,
    shouldShowWarning,
    markWarningShown,
    usagePercentage,
    currentUsage,
    totalLimit,
  } = useUsageWarningStore();

  // Check for usage warnings and show modal
  React.useEffect(() => {
    if (usageData.length > 0) {
      const totalUsed = usageData.reduce((sum, d) => sum + d.tokensUsed, 0);
      const limit = 50000; // This should come from user's subscription plan

      updateUsage(totalUsed, limit);

      // Check for 95% warning first (more critical)
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
  }, [usageData, updateUsage, shouldShowWarning, markWarningShown]);

  // Keyboard shortcuts
  const handleCopyLastMessage = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      navigator.clipboard.writeText(lastMessage.content);
    }
  };

  const handleRegenerateLastMessage = () => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant');
    if (lastAssistantMessage) {
      regenerateMessage(lastAssistantMessage.id);
    }
  };

  const handleFocusComposer = () => {
    composerRef.current?.focus();
  };

  const handleShowSearch = () => {
    // TODO: Implement search modal
    setSearchQuery('');
  };

  const { shortcuts } = useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onSearch: handleShowSearch,
    onShowShortcuts: () => setShortcutsDialogOpen(true),
    onToggleSidebar: () => setSidebarOpen(!sidebarOpen),
    onFocusComposer: handleFocusComposer,
    onCopyLastMessage: handleCopyLastMessage,
    onRegenerateLastMessage: handleRegenerateLastMessage,
  });

  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-screen items-center justify-center bg-background p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Chat interface error</h2>
            <p className="mt-2 text-muted-foreground">
              Something went wrong with the chat interface. Please refresh the
              page.
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex h-screen bg-background">
        {/* Sidebar - Collapsible with smooth transition */}
        <div
          className={cn(
            'border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out',
            sidebarOpen ? 'w-0 sm:w-64 md:w-80' : 'w-0',
            'overflow-hidden' // Prevent content overflow when collapsed
          )}
        >
          {sidebarOpen && (
            <ChatSidebar
              sessions={filteredSessions}
              currentSession={currentSession}
              searchQuery={searchQuery}
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
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
          )}
        </div>

        {/* Main Chat Area - Optimized for full screen usage */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header - Compact and clean */}
          <ChatHeader
            session={currentSession}
            onRename={(title) =>
              currentSession && handleSessionRename(currentSession.id, title)
            }
            onShare={handleShare}
            onExport={() => handleExport('markdown')}
            onSettings={() => {
              navigate('/settings');
            }}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Usage Warning Banner */}
          {usageData.length > 0 && (
            <div className="border-b border-border px-4 py-2">
              <UsageWarningBanner usageData={usageData} />
            </div>
          )}

          {/* Message List - Maximum vertical space */}
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

            {/* Tool Progress Indicator - Shows active tools */}
            {activeTools && activeTools.length > 0 && (
              <div className="p-4">
                <ToolProgressIndicator
                  activeTools={activeTools}
                  toolProgress={toolProgress || {}}
                />
              </div>
            )}
          </div>

          {/* Composer - Sticky at bottom with backdrop */}
          <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto max-w-4xl p-3 sm:p-4">
              <ChatComposer
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                availableTools={availableTools}
                onToolToggle={(toolId) => {
                  // Tool toggle is handled by the ChatComposer component internally
                  // This callback can be used for future tool management features
                }}
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
              />
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Dialog */}
        <KeyboardShortcutsDialog
          open={shortcutsDialogOpen}
          onOpenChange={setShortcutsDialogOpen}
          shortcuts={shortcuts}
        />

        {/* Usage Warning Modal - Pops up at 85% and 95% */}
        <UsageWarningModal
          open={warningModalOpen}
          onOpenChange={setWarningModalOpen}
          threshold={warningThreshold}
          currentUsage={currentUsage}
          totalLimit={totalLimit}
          usagePercentage={usagePercentage}
        />
      </div>
    </ErrorBoundary>
  );
};

export default ChatPage;
