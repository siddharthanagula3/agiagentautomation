import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Separator } from '@shared/ui/separator';
import { useChat } from '../hooks/useChat';
import { useChatHistory } from '../hooks/useChatHistory';
import { useTools } from '../hooks/useTools';
import { useExport } from '../hooks/useExport';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<ChatMode>('team');
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');
  const [temperature, setTemperature] = useState(0.7);

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
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-80' : 'w-0'} border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300`}
      >
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
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
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

        {/* Message List */}
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

        {/* Composer */}
        <div className="border-t border-border bg-card/50 p-4 backdrop-blur-sm">
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

      {/* Model & Settings Panel (Optional) */}
      {selectedMode === 'team' && (
        <div className="w-80 border-l border-border bg-card/50 p-4 backdrop-blur-sm">
          <div className="space-y-4">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              temperature={temperature}
              onTemperatureChange={setTemperature}
            />

            <Separator />

            <ModeSelector
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
              availableModes={['team', 'engineer', 'research', 'race', 'solo']}
            />

            {/* Export Options */}
            {currentSession && messages.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Export Chat</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={isExporting}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() => handleExport('markdown')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Markdown (.md)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('html')}>
                        <FileCode className="mr-2 h-4 w-4" />
                        HTML (.html)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('json')}>
                        <FileJson className="mr-2 h-4 w-4" />
                        JSON (.json)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('text')}>
                        <FileText className="mr-2 h-4 w-4" />
                        Plain Text (.txt)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleCopyToClipboard}>
                        Copy to Clipboard
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
