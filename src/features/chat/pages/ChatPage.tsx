import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Separator } from '@shared/ui/separator';
import { useChat } from '../hooks/useChat';
import { useChatHistory } from '../hooks/useChatHistory';
import { useTools } from '../hooks/useTools';
import { ChatSidebar } from '../components/Sidebar/ChatSidebar';
import { ChatHeader } from '../components/Main/ChatHeader';
import { MessageList } from '../components/Main/MessageList';
import { ChatComposer } from '../components/Composer/ChatComposer';
import { ModelSelector } from '../components/Main/ModelSelector';
import { ModeSelector } from '../components/Tools/ModeSelector';
import type { ChatSession, ChatMessage, ChatMode } from '../types';

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
      const newSession = createSession('New Chat');
      navigate(`/chat/${newSession.id}`);
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
    const newSession = createSession('New Chat');
    navigate(`/chat/${newSession.id}`);
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
          onShare={() => {
            /* TODO: Implement share */
          }}
          onExport={() => {
            /* TODO: Implement export */
          }}
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
              availableModes={['team', 'engineer', 'research', 'race']}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
