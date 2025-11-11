import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChatLayout } from '@/layouts/ChatLayout';
import { ChatSidebar } from '@/features/chat/components/ChatSidebar';
import { ChatTopBar } from '@/features/chat/components/ChatTopBar';
import { EmployeeSelector } from '@/features/chat/components/EmployeeSelector';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { WorkingProcess } from '@/features/chat/components/WorkingProcess';
import { EmployeeWorkStream } from '@/features/chat/components/EmployeeWorkStream';
import { ChatInput } from '@/features/chat/components/ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/shared/stores/chat-store';
import { employeeService, AIEmployee } from '@/services/employeeService';
import { useAuthStore } from '@/shared/stores/authentication-store';
import '@/styles/chat-interface.css';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount?: number;
}

export function ChatInterface() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  // Bottom anchor to auto-scroll like ChatGPT
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Store hooks
  const {
    conversations,
    activeConversationId,
    sidebarOpen,
    activeEmployees,
    workingProcesses,
    checkpointHistory,
    toggleSidebar,
    selectEmployee,
    deselectEmployee,
    updateWorkingProcess,
    saveCheckpoint,
    restoreCheckpoint,
    createConversation,
    addMessage,
    setActiveConversation,
    updateConversation,
    sendMessage,
    isStreamingResponse,
    stopGeneration,
  } = useChatStore();

  const { user } = useAuthStore();

  // Local state
  const [employees, setEmployees] = useState<AIEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [sessionTitle, setSessionTitle] = useState('New Chat');

  // Load employees on mount
  useEffect(() => {
    const loadEmployees = async () => {
      if (user?.id) {
        try {
          const purchasedEmployees =
            await employeeService.getPurchasedEmployees(user.id);
          setEmployees(purchasedEmployees);
        } catch (error) {
          console.error('Error loading employees:', error);
        }
      }
      setIsLoading(false);
    };

    loadEmployees();
  }, [user?.id]);

  // Initialize or load conversation
  useEffect(() => {
    if (sessionId && conversations[sessionId]) {
      setActiveConversation(sessionId);
      setSessionTitle(conversations[sessionId].title);
    } else if (!sessionId) {
      // Create new conversation if no sessionId
      const newSessionId = createConversation('New Chat');
      navigate(`/chat/${newSessionId}`, { replace: true });
    }
  }, [
    sessionId,
    conversations,
    createConversation,
    setActiveConversation,
    navigate,
  ]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [
    conversations[activeConversationId || '']?.messages?.length,
    activeConversationId,
  ]);

  // Get current conversation
  const currentConversation = activeConversationId
    ? conversations[activeConversationId]
    : null;
  const messages = currentConversation?.messages || [];

  // Get chat sessions for sidebar
  const chatSessions: ChatSession[] = Object.values(conversations)
    .map((conv) => ({
      id: conv.id,
      title: conv.title,
      lastMessage:
        conv.messages[conv.messages.length - 1]?.content || 'No messages yet',
      timestamp: conv.metadata.updatedAt,
      unreadCount: 0,
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Event handlers
  const handleNewChat = () => {
    const newSessionId = createConversation('New Chat');
    navigate(`/chat/${newSessionId}`);
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveConversation(sessionId);
    navigate(`/chat/${sessionId}`);
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversationId) return;
    // Use store streaming pipeline for realistic assistant responses
    await sendMessage(activeConversationId, content);

    // Simulate AI response with working process
    if (activeEmployees.length > 0) {
      const employeeId = activeEmployees[0];
      const employee = employees.find((emp) => emp.id === employeeId);

      if (employee) {
        // Create working process
        const workingProcess = {
          employeeId,
          employeeName: employee.name,
          employeeAvatar: employee.avatar,
          employeeColor: employee.color,
          steps: [
            {
              id: '1',
              description: 'Analyzing your request...',
              type: 'thinking' as const,
              timestamp: new Date(),
              status: 'active' as const,
            },
            {
              id: '2',
              description: 'Generating response...',
              type: 'writing' as const,
              timestamp: new Date(),
              status: 'pending' as const,
            },
          ],
          currentStep: 1,
          status: 'working' as const,
          totalSteps: 2,
        };

        updateWorkingProcess(employeeId, workingProcess);

        // Simulate step progression
        setTimeout(() => {
          const updatedProcess = {
            ...workingProcess,
            steps: workingProcess.steps.map((step, index) => ({
              ...step,
              status:
                index === 0 ? ('completed' as const) : ('active' as const),
            })),
            currentStep: 2,
          };
          updateWorkingProcess(employeeId, updatedProcess);
        }, 1000);

        setTimeout(() => {
          const completedProcess = {
            ...workingProcess,
            steps: workingProcess.steps.map((step) => ({
              ...step,
              status: 'completed' as const,
            })),
            currentStep: 2,
            status: 'completed' as const,
          };
          updateWorkingProcess(employeeId, completedProcess);

          // Add AI response
          addMessage(activeConversationId, {
            conversationId: activeConversationId,
            role: 'assistant',
            content: `I understand you're asking about: "${content}". Let me help you with that. This is a simulated response from ${employee.name}.`,
            employeeId,
            employeeName: employee.name,
            employeeAvatar: employee.avatar,
            employeeColor: employee.color,
          });
        }, 2000);
      }
    }
  };

  const handleSelectEmployee = (employeeId: string) => {
    if (mode === 'single') {
      // Clear other selections
      activeEmployees.forEach((id) => deselectEmployee(id));
    }
    selectEmployee(employeeId);
  };

  const handleDeselectEmployee = (employeeId: string) => {
    deselectEmployee(employeeId);
  };

  const handleToggleMode = () => {
    setMode(mode === 'single' ? 'multi' : 'single');
    if (mode === 'single' && activeEmployees.length > 1) {
      // Keep only the first employee in single mode
      activeEmployees.slice(1).forEach((id) => deselectEmployee(id));
    }
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };

  const handleRestoreCheckpoint = () => {
    if (checkpointHistory.length > 0) {
      const latestCheckpoint = checkpointHistory[checkpointHistory.length - 1];
      restoreCheckpoint(latestCheckpoint.id);
    }
  };

  const handleUpdateTitle = (newTitle: string) => {
    setSessionTitle(newTitle);
    if (activeConversationId) {
      updateConversation(activeConversationId, { title: newTitle });
    }
  };

  const handleAddEmployee = () => {
    navigate('/marketplace');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading AI Employees...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ChatLayout
      sidebarOpen={sidebarOpen}
      sidebar={
        <ChatSidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          sessions={chatSessions}
          currentSessionId={activeConversationId || undefined}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          user={
            user
              ? {
                  name: user.user_metadata?.full_name || user.email || 'User',
                  email: user.email || '',
                  avatar: user.user_metadata?.avatar_url,
                  plan: 'Free',
                }
              : undefined
          }
        />
      }
      topBar={
        <ChatTopBar
          sessionTitle={sessionTitle}
          onNavigateToDashboard={handleNavigateToDashboard}
          onRestoreCheckpoint={handleRestoreCheckpoint}
          onUpdateTitle={handleUpdateTitle}
          hasCheckpoints={checkpointHistory.length > 0}
          checkpointCount={checkpointHistory.length}
        />
      }
    >
      {/* Employee Selector */}
      <EmployeeSelector
        employees={employees}
        selectedEmployees={activeEmployees}
        onSelectEmployee={handleSelectEmployee}
        onDeselectEmployee={handleDeselectEmployee}
        onAddEmployee={handleAddEmployee}
        mode={mode}
        onToggleMode={handleToggleMode}
      />

      {/* Messages Area (ChatGPT-like centered column) */}
      <ScrollArea className="chat-scroll-area flex-1">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
          {/* Messages */}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Working Processes */}
          {Array.from(workingProcesses.values()).map((process) => (
            <WorkingProcess key={process.employeeId} process={process} />
          ))}

          {/* Employee Work Streams */}
          {activeEmployees.map((employeeId) => {
            const employee = employees.find((emp) => emp.id === employeeId);
            const process = workingProcesses.get(employeeId);
            if (!employee) return null;

            // Map process steps into work stream items for rich display
            const mapWorkItemStatus = (
              s: 'pending' | 'active' | 'completed' | 'error'
            ): 'active' | 'completed' | 'error' =>
              s === 'pending' ? 'active' : s;
            const workItems = (process?.steps || []).map((step) => ({
              id: step.id,
              type:
                step.type === 'writing'
                  ? ('file_write' as const)
                  : step.type === 'executing'
                    ? ('command_exec' as const)
                    : step.type === 'analyzing'
                      ? ('code_analysis' as const)
                      : step.type === 'reading'
                        ? ('web_search' as const)
                        : ('thinking' as const),
              content: step.description,
              timestamp: step.timestamp,
              status: mapWorkItemStatus(step.status),
              details: step.details,
              filePath: step.filePath,
              command: step.command,
              output: step.output,
            }));

            return (
              <EmployeeWorkStream
                key={employeeId}
                employeeId={employeeId}
                employeeName={employee.name}
                employeeAvatar={employee.avatar}
                employeeColor={employee.color}
                workItems={workItems}
                isActive={process?.status === 'working'}
              />
            );
          })}

          {/* Bottom spacer and auto-scroll anchor */}
          <div className="h-24" />
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Chat Input (sticky bottom, centered) */}
      <div className="sticky bottom-0 z-10 w-full border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          <ChatInput
            onSubmit={handleSendMessage}
            selectedEmployees={activeEmployees}
            availableEmployees={employees}
            onSelectEmployee={handleSelectEmployee}
            onDeselectEmployee={handleDeselectEmployee}
            isStreaming={isStreamingResponse}
            onStop={stopGeneration}
            placeholder="Message"
          />
        </div>
      </div>
    </ChatLayout>
  );
}

export default ChatInterface;
