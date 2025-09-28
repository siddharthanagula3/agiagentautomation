import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { MessageInput } from './MessageInput';
import { ToolsPanel } from './ToolsPanel';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';

interface AIEmployeeChatRefactoredProps {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  status?: 'online' | 'busy' | 'offline';
}

export const AIEmployeeChatRefactored: React.FC<AIEmployeeChatRefactoredProps> = ({
  employeeId,
  employeeName,
  employeeRole,
  status = 'online',
}) => {
  const {
    messages,
    isLoading,
    inputMessage,
    setInputMessage,
    availableTools,
    selectedTools,
    handleSendMessage,
    toggleTool,
    clearChat,
  } = useChat(employeeId);

  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);

  const handleSettingsClick = () => {
    setIsToolsPanelOpen(!isToolsPanelOpen);
  };

  const handleClearSelection = () => {
    selectedTools.forEach(toolId => toggleTool(toolId));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader
        employeeName={employeeName}
        employeeRole={employeeRole}
        status={status}
        onSettingsClick={handleSettingsClick}
      />
      
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col">
          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
          />
        </div>
        
        <MessageInput
          value={inputMessage}
          onChange={setInputMessage}
          onSend={handleSendMessage}
          isLoading={isLoading}
          placeholder={`Message ${employeeName}...`}
        />
      </div>
      
      <ToolsPanel
        tools={availableTools}
        selectedTools={selectedTools}
        onToggleTool={toggleTool}
        onClearSelection={handleClearSelection}
        isOpen={isToolsPanelOpen}
        onToggle={() => setIsToolsPanelOpen(!isToolsPanelOpen)}
      />
      
      {messages.length > 0 && (
        <div className="border-t border-border bg-card p-2">
          <Button
            onClick={clearChat}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        </div>
      )}
    </div>
  );
};