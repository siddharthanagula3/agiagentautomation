/**
 * Enhanced Chat Interface Component
 * Integrates task division, streaming responses, and intelligent caching
 */

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { ScrollArea } from '@shared/ui/scroll-area';
import {
  Bot,
  User,
  Loader2,
  Wrench,
  CheckCircle,
  AlertCircle,
  Brain,
  Zap,
  Target,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { MessageInput } from './MessageInput';
import { TaskDivision, type Task } from './TaskDivision';
import { useUIStore } from '@shared/stores/ui-store';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'thinking' | 'working' | 'completed' | 'error';
  taskPlan?: Task[];
  isStreaming?: boolean;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface ChatInterfaceEnhancedProps {
  employeeId: string;
  employeeName: string;
  className?: string;
}

export const ChatInterfaceEnhanced: React.FC<ChatInterfaceEnhancedProps> = ({
  employeeId,
  employeeName,
  className,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTaskPlan, setCurrentTaskPlan] = useState<Task[]>([]);
  const [isTaskPlanApproved, setIsTaskPlanApproved] = useState(false);
  const [isTaskExecutionRunning, setIsTaskExecutionRunning] = useState(false);
  const [isTaskExecutionPaused, setIsTaskExecutionPaused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { chatInterface } = useUIStore();

  // Fetch available tools
  const { data: availableTools = [] } = useQuery<Tool[]>({
    queryKey: ['tools', employeeId],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        {
          id: '1',
          name: 'Web Search',
          description: 'Search the web for information',
          category: 'research',
        },
        {
          id: '2',
          name: 'Code Analysis',
          description: 'Analyze and review code',
          category: 'development',
        },
        {
          id: '3',
          name: 'Data Processing',
          description: 'Process and analyze data',
          category: 'analytics',
        },
        {
          id: '4',
          name: 'Content Generation',
          description: 'Generate written content',
          category: 'writing',
        },
        {
          id: '5',
          name: 'Image Analysis',
          description: 'Analyze and describe images',
          category: 'vision',
        },
        {
          id: '6',
          name: 'API Integration',
          description: 'Connect to external APIs',
          category: 'integration',
        },
      ];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Load conversation history
  const { data: conversationHistory } = useQuery<ChatMessage[]>({
    queryKey: ['conversation', employeeId],
    queryFn: async () => {
      // Load from localStorage or API
      const stored = localStorage.getItem(`conversation-${employeeId}`);
      if (stored) {
        return JSON.parse(stored).map((msg: unknown) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
      return [];
    },
    onSuccess: data => {
      if (data.length > 0) {
        setMessages(data);
      } else {
        // Add welcome message
        setMessages([
          {
            id: 'welcome',
            type: 'assistant',
            content: `Hello! I'm ${employeeName}, your AI assistant. I can help you with various tasks using my specialized tools. What would you like to work on today?`,
            timestamp: new Date(),
          },
        ]);
      }
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversation to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(
        `conversation-${employeeId}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, employeeId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate task plan
      const taskPlan: Task[] = generateTaskPlan(message);
      setCurrentTaskPlan(taskPlan);

      return {
        response: `I've analyzed your request and created a plan with ${taskPlan.length} tasks. Please review and approve the plan to proceed.`,
        taskPlan,
      };
    },
    onSuccess: data => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        status: 'completed',
        taskPlan: data.taskPlan,
      };

      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: error => {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date(),
        status: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  // Generate task plan based on user input
  const generateTaskPlan = (input: string): Task[] => {
    const lowerInput = input.toLowerCase();
    const tasks: Task[] = [];

    if (lowerInput.includes('website') || lowerInput.includes('web')) {
      tasks.push({
        id: '1',
        title: 'Research Website Requirements',
        description:
          'Analyze the website requirements and gather necessary information',
        type: 'simple',
        status: 'pending',
        estimatedTime: 15,
        assignedEmployee: 'Research Assistant',
      });

      tasks.push({
        id: '2',
        title: 'Design Website Structure',
        description: 'Create the website structure and navigation',
        type: 'medium',
        status: 'pending',
        estimatedTime: 30,
        assignedEmployee: 'Web Designer',
        dependencies: ['1'],
      });

      tasks.push({
        id: '3',
        title: 'Implement Website',
        description: 'Build the website using modern technologies',
        type: 'reasoning',
        status: 'pending',
        estimatedTime: 120,
        assignedEmployee: 'Web Developer',
        dependencies: ['2'],
      });
    } else if (lowerInput.includes('data') || lowerInput.includes('analysis')) {
      tasks.push({
        id: '1',
        title: 'Data Collection',
        description: 'Gather and collect relevant data',
        type: 'simple',
        status: 'pending',
        estimatedTime: 20,
        assignedEmployee: 'Data Collector',
      });

      tasks.push({
        id: '2',
        title: 'Data Analysis',
        description: 'Analyze the collected data for insights',
        type: 'reasoning',
        status: 'pending',
        estimatedTime: 45,
        assignedEmployee: 'Data Analyst',
        dependencies: ['1'],
      });
    } else {
      tasks.push({
        id: '1',
        title: 'Task Analysis',
        description: 'Analyze the request and determine the best approach',
        type: 'simple',
        status: 'pending',
        estimatedTime: 10,
        assignedEmployee: 'Task Coordinator',
      });
    }

    return tasks;
  };

  const handleSendMessage = (
    message: string,
    attachments?: unknown[],
    tools?: Tool[]
  ) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Send to AI
    sendMessageMutation.mutate(message);
  };

  const handleApproveTaskPlan = () => {
    setIsTaskPlanApproved(true);
    setIsTaskExecutionRunning(true);

    // Simulate task execution
    executeTasks();
  };

  const handleRejectTaskPlan = () => {
    setCurrentTaskPlan([]);
    setIsTaskPlanApproved(false);
  };

  const handlePauseTasks = () => {
    setIsTaskExecutionPaused(true);
    setIsTaskExecutionRunning(false);
  };

  const handleResumeTasks = () => {
    setIsTaskExecutionPaused(false);
    setIsTaskExecutionRunning(true);
  };

  const handleResetTasks = () => {
    setCurrentTaskPlan([]);
    setIsTaskPlanApproved(false);
    setIsTaskExecutionRunning(false);
    setIsTaskExecutionPaused(false);
  };

  const executeTasks = async () => {
    for (const task of currentTaskPlan) {
      if (isTaskExecutionPaused) break;

      // Update task status to running
      setCurrentTaskPlan(prev =>
        prev.map(t =>
          t.id === task.id ? { ...t, status: 'running' as const } : t
        )
      );

      // Simulate task execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update task status to completed
      setCurrentTaskPlan(prev =>
        prev.map(t =>
          t.id === task.id
            ? {
                ...t,
                status: 'completed' as const,
                result: `Task "${t.title}" completed successfully.`,
              }
            : t
        )
      );
    }

    setIsTaskExecutionRunning(false);
  };

  const getStatusIcon = (status?: ChatMessage['status']) => {
    switch (status) {
      case 'thinking':
        return <Brain className="h-4 w-4 animate-pulse text-blue-600" />;
      case 'working':
        return <Wrench className="h-4 w-4 animate-spin text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex h-screen flex-col bg-background', className)}>
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-purple-600">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{employeeName}</h2>
              <p className="text-sm text-muted-foreground">AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {availableTools.length} tools available
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg p-4',
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="mb-2 flex items-center space-x-2">
                  {message.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {message.type === 'user' ? 'You' : employeeName}
                  </span>
                  {message.status && getStatusIcon(message.status)}
                </div>

                <div className="whitespace-pre-wrap">{message.content}</div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {sendMessageMutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Analyzing your request...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Task Division */}
      {currentTaskPlan.length > 0 && (
        <div className="border-t bg-card p-4">
          <TaskDivision
            tasks={currentTaskPlan}
            onApprove={handleApproveTaskPlan}
            onReject={handleRejectTaskPlan}
            onStart={handleResumeTasks}
            onPause={handlePauseTasks}
            onReset={handleResetTasks}
            isRunning={isTaskExecutionRunning}
            isPaused={isTaskExecutionPaused}
          />
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
        placeholder={`Ask ${employeeName} anything...`}
        showTools={chatInterface.showTools}
        availableTools={availableTools}
        onToolSelect={tool => {
          setInputValue(prev => prev + `\n\nPlease use the ${tool.name} tool.`);
        }}
      />
    </div>
  );
};
