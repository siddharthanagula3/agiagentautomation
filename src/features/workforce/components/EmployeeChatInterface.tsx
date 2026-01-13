// AI Employee Chat Interface
// Demonstrates AI Employee interaction and tool execution

import React, { useState, useEffect, useRef } from 'react';
import { AIEmployee, ChatMessage, ToolResult } from '../../types';
import { createAIEmployeeExecutor } from '@core/ai/employees/employee-executor';

interface AIEmployeeChatProps {
  employee: AIEmployee;
  userId: string;
  onToolExecution?: (toolId: string, result: ToolResult) => void;
}

export const AIEmployeeChat: React.FC<AIEmployeeChatProps> = ({
  employee,
  userId,
  onToolExecution,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-001',
      session_id: 'session-001',
      sender_type: 'employee',
      sender_id: employee.id,
      message: `Hello! I'm ${employee.name}, your ${employee.role}. I'm here to help you with ${employee.capabilities.coreSkills.join(', ')}. What can I do for you today?`,
      message_type: 'text',
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, [employee]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      session_id: 'session-001',
      sender_type: 'user',
      sender_id: userId,
      message: inputMessage,
      message_type: 'text',
      metadata: {},
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Create execution context
      const executionContext = {
        userId,
        jobId: `job-${Date.now()}`,
        sessionId: 'session-001',
        timestamp: new Date().toISOString(),
        environment: 'development' as const,
      };

      // Create AI Employee executor
      const executor = createAIEmployeeExecutor(employee, executionContext);

      // Execute the task
      const result = await executor.executeTask(inputMessage);

      // Simulate typing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let responseMessage = '';
      let messageType: ChatMessage['message_type'] = 'text';

      if (result.success) {
        if (result.toolsUsed.length > 0) {
          responseMessage = `I've completed your request using ${result.toolsUsed.join(', ')}. Here's what I accomplished:\n\n${JSON.stringify(result.result, null, 2)}`;
          messageType = 'tool_result';

          // Notify parent component about tool execution
          if (onToolExecution) {
            onToolExecution(result.toolsUsed[0], {
              success: true,
              data: result.result,
              executionTime: result.executionTime,
              cost: result.cost,
              metadata: {},
            });
          }
        } else {
          responseMessage = `I understand your request: "${inputMessage}". However, I don't have the appropriate tools to complete this task. Could you please provide more specific instructions?`;
        }
      } else {
        responseMessage = `I encountered an error while processing your request: ${result.error}. Please try rephrasing your request or let me know if you need help with something else.`;
        messageType = 'system';
      }

      const employeeMessage: ChatMessage = {
        id: `employee-${Date.now()}`,
        session_id: 'session-001',
        sender_type: 'employee',
        sender_id: employee.id,
        message: responseMessage,
        message_type: messageType,
        metadata: {
          toolsUsed: result.toolsUsed,
          executionTime: result.executionTime,
          cost: result.cost,
          success: result.success,
        },
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, employeeMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        session_id: 'session-001',
        sender_type: 'employee',
        sender_id: employee.id,
        message: `I'm sorry, but I encountered an unexpected error: ${(error as Error).message}. Please try again.`,
        message_type: 'system',
        metadata: { error: true },
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border bg-background">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
            {employee.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{employee.name}</h3>
            <p className="text-sm text-muted-foreground">{employee.role}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`h-2 w-2 rounded-full ${employee.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'}`}
          ></div>
          <span className="text-xs capitalize text-muted-foreground">
            {employee.status}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-full rounded-lg px-4 py-2 sm:max-w-[80%] ${
                message.sender_type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.message_type === 'tool_result'
                    ? 'border border-green-200 bg-green-100 text-green-900'
                    : message.message_type === 'system'
                      ? 'border border-yellow-200 bg-yellow-100 text-yellow-900'
                      : 'bg-muted text-foreground'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.message}</div>
              {message.metadata?.toolsUsed && (
                <div className="mt-2 text-xs opacity-75">
                  🛠️ Tools used: {message.metadata.toolsUsed.join(', ')}
                </div>
              )}
              {message.metadata?.executionTime && (
                <div className="mt-1 text-xs opacity-75">
                  ⏱️ Execution time: {message.metadata.executionTime}ms
                </div>
              )}
              {message.metadata?.cost && (
                <div className="mt-1 text-xs opacity-75">
                  💰 Cost: ${message.metadata.cost.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-4 py-2 text-foreground">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-current"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-current"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <span className="ml-2 text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-muted/25 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${employee.name} to help you with something...`}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="h-11 min-w-[80px] rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>

        {/* Available Tools */}
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium">Available tools:</span>{' '}
          {employee.tools.map((tool) => tool.name).join(', ')}
        </div>
      </div>
    </div>
  );
};
