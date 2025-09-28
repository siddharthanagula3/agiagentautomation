/**
 * Final refactored AIEmployeeChat component
 * Demonstrates the use of all refactored components and hooks
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useEmployee } from '@/hooks/useEmployee';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ToolsPanel } from './ToolsPanel';
import { ChatInput } from './ChatInput';

interface AIEmployeeChatProps {
  employeeId: string;
}

const AIEmployeeChatFinal: React.FC<AIEmployeeChatProps> = ({ employeeId }) => {
  const [showTools, setShowTools] = useState(false);

  // Use the custom hooks for data fetching
  const { employee, isLoading: employeeLoading, error: employeeError } = useEmployee(employeeId);
  
  const {
    messages,
    currentToolCalls,
    availableTools,
    toolsLoading,
    sendMessage,
    clearMessages,
    isSending,
    error: chatError
  } = useChat({
    employeeId,
    initialMessages: employee ? [{
      id: 'welcome',
      type: 'assistant',
      content: `Hello! I'm ${employee.name}, your ${employee.role}. I'm here to help you with ${employee.category.replace('_', ' ')} tasks. I have access to ${availableTools.length} tools and can assist you with various projects. How can I help you today?`,
      timestamp: new Date()
    }] : []
  });

  // Handle tool selection
  const handleToolSelect = (tool: unknown) => {
    const toolName = (tool as { name: string }).name;
    sendMessage(`Please use the ${toolName} tool with appropriate parameters.`);
    setShowTools(false);
  };

  // Handle message send
  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    // This would be handled by the ChatInput component
  };

  // Loading state
  if (employeeLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (employeeError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Error Loading Employee</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {employeeError.message || 'Failed to load employee data'}
          </p>
        </div>
      </div>
    );
  }

  // No employee found
  if (!employee) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Employee Not Found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The requested employee could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader
        employee={employee}
        availableToolsCount={availableTools.length}
        showTools={showTools}
        onToggleTools={() => setShowTools(!showTools)}
      />

      <ChatMessageList
        messages={messages}
        currentToolCalls={currentToolCalls}
        employeeName={employee.name}
      />

      <ToolsPanel
        showTools={showTools}
        availableTools={availableTools}
        onToolSelect={handleToolSelect}
      />

      <ChatInput
        value=""
        onChange={handleInputChange}
        onSend={handleSendMessage}
        isLoading={isSending}
        placeholder={`Ask ${employee.name} anything...`}
      />
    </div>
  );
};

export default AIEmployeeChatFinal;
