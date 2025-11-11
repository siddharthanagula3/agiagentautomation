import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Separator } from '@shared/ui/separator';
import { useChat } from '../hooks/use-chat-interface';
import { useChatHistory } from '../hooks/use-conversation-history';
import { useTools } from '../hooks/use-tool-integration';
import { useExport } from '../hooks/use-export-conversation';
import { ChatSidebar } from '../components/Sidebar/ChatSidebar';
import { ChatHeader } from '../components/Main/ChatHeader';
import { MessageList } from '../components/Main/MessageList';
import { ChatComposer } from '../components/Composer/ChatComposer';
import { ModelSelector } from '../components/Main/ModelSelector';
import { ModeSelector } from '../components/Tools/ModeSelector';
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
import { cn } from '@/lib/utils';

const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();

  // Chat state management
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    regenerateMessage,
    editMessage,
    deleteMessage,
    clearMessages,
  } = useChat(sessionId);

  const {
    sessions,
    currentSession,
    createSession,
    renameSession,
    deleteSession,
    searchSessions,
    loadSessions,
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
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');
  const [temperature, setTemperature] = useState(0.7);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('chat-sidebar-open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Create new session if none exists
  useEffect(() => {
    if (!currentSession && !sessionId) {
      createSession('New Chat').then((session) => {
        navigate(`/chat/${session.id}`);
      });
    }
  }, [currentSession, sessionId, createSession, navigate]);

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim()) return;

    try {
      await sendMessage({
        content,
        attachments,
        mode: selectedMode,
        model: selectedModel,
        temperature,
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
    await generateShareLink(currentSession.id);
  };

  const handleCopyToClipboard = async () => {
    if (!currentSession) return;
    await copyToClipboard(currentSession, messages, 'markdown');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Collapsible with smooth transition */}
      <div
        className={cn(
          'border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-80 md:w-80' : 'w-0',
          'overflow-hidden' // Prevent content overflow when collapsed
        )}
      >
        {sidebarOpen && (
          <ChatSidebar
            sessions={sessions}
            currentSession={currentSession}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewChat={handleNewChat}
            onSessionSelect={handleSessionSelect}
            onSessionRename={handleSessionRename}
            onSessionDelete={handleSessionDelete}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
      </div>

      {/* Main Chat Area - Optimized for full screen usage */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header - Compact and clean */}
        <ChatHeader
          session={currentSession}
          onRename={(title) =>
            currentSession && handleSessionRename(currentSession.id, title)
          }
          onShare={handleShare}
          onExport={() => handleExport('markdown')}
          onSettings={() => {
            /* TODO: Implement settings */
          }}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

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
        </div>

        {/* Composer - Sticky at bottom with backdrop */}
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-4xl p-4">
            <ChatComposer
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              availableTools={availableTools}
              onToolToggle={(toolId) => {
                /* TODO: Implement tool toggle */
              }}
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
