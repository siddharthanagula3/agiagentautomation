/**
 * Tabbed LLM Chat Page
 * Modern chat interface with tabs for different LLM providers
 * Uses proper SDK implementations for each provider
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Skeleton } from '@shared/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import {
  Bot,
  Plus,
  MessageSquare,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Settings,
  Sparkles,
  Zap,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Brain,
  Globe,
  Search,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@shared/stores/unified-auth-store';
import { listPurchasedEmployees } from '@features/workforce/services/supabase-employees';
import { AI_EMPLOYEES } from '@/data/ai-employees';
import TabbedLLMChatInterface from '@features/chat/components/TabbedLLMChatInterface';
import { TokenUsageWarning } from '@features/chat/components/TokenUsageWarning';
import {
  unifiedLLMService,
  LLMProvider,
  UnifiedLLMError,
} from '@_core/api/llm/unified-llm-service';

interface PurchasedEmployee {
  id: string;
  name: string;
  role: string;
  provider: string;
  purchasedAt: string;
}

interface ChatSession {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  provider: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  messageCount: number;
  isActive: boolean;
}

const TabbedLLMChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // State management
  const [purchasedEmployees, setPurchasedEmployees] = useState<
    PurchasedEmployee[]
  >([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<PurchasedEmployee | null>(null);
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    totalTokens: 0,
    activeEmployees: 0,
  });

  // Load purchased employees and existing sessions
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Load purchased employees
        const employees = await listPurchasedEmployees(user.id);
        setPurchasedEmployees(employees);

        // Create chat sessions from purchased employees
        const employeeSessions: ChatSession[] = employees.map(
          (employee, index) => {
            // Find the AI employee details from the master list
            const aiEmployee = AI_EMPLOYEES.find(
              (emp) => emp.id === employee.employee_id
            );

            return {
              id: `session-${employee.id}`,
              employeeId: employee.id,
              employeeName: aiEmployee?.name || employee.employee_id, // Use AI employee name or fallback to ID
              employeeRole: aiEmployee?.role || employee.role,
              provider: employee.provider,
              lastMessage: 'Ready to help you with your tasks...',
              lastMessageTime: new Date(employee.purchased_at),
              messageCount: 0,
              isActive: index === 0, // Make first employee active
            };
          }
        );

        setChatSessions(employeeSessions);
        setSessionStats({
          totalSessions: employeeSessions.length,
          totalMessages: employeeSessions.reduce(
            (sum, session) => sum + session.messageCount,
            0
          ),
          totalTokens: 0,
          activeEmployees: employeeSessions.filter((s) => s.isActive).length,
        });
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load chat data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Handle starting a new chat
  const handleStartNewChat = async (employee: PurchasedEmployee) => {
    try {
      const sessionId = `session-${Date.now()}`;

      const newSession: ChatSession = {
        id: sessionId,
        employeeId: employee.id,
        employeeName: employee.name,
        employeeRole: employee.role,
        provider: employee.provider,
        messageCount: 0,
        isActive: true,
      };

      setChatSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(sessionId);
      setSelectedEmployee(employee);
      setIsSelectDialogOpen(false);

      toast.success(`Started new chat with ${employee.name}`);
    } catch (error) {
      console.error('Error starting new chat:', error);
      toast.error('Failed to start new chat');
    }
  };

  // Handle session selection
  const handleSessionSelect = (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setSelectedEmployee({
        id: session.employeeId,
        name: session.employeeName,
        role: session.employeeRole,
        provider: session.provider,
        purchasedAt: new Date().toISOString(),
      });
    }
  };

  // Handle session deletion
  const handleDeleteSession = (sessionId: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setSelectedEmployee(null);
    }
    toast.success('Chat session deleted');
  };

  // Get provider icon
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return <Brain className="h-4 w-4" />;
      case 'anthropic':
        return <Sparkles className="h-4 w-4" />;
      case 'google':
        return <Globe className="h-4 w-4" />;
      case 'perplexity':
        return <Search className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  // Get provider color
  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'bg-green-500';
      case 'anthropic':
        return 'bg-orange-500';
      case 'google':
        return 'bg-blue-500';
      case 'perplexity':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-80 border-r bg-background p-4">
          <Skeleton className="mb-4 h-8 w-32" />
          <Skeleton className="mb-4 h-10 w-full" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-96 w-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="flex w-80 flex-col border-r bg-background">
        {/* Header */}
        <div className="border-b p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-green-400 to-blue-500">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">AI Workforce Chat</h1>
              <p className="text-xs text-muted-foreground">
                Multi-LLM Interface
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted p-2">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Employees</span>
              </div>
              <div className="text-lg font-semibold">
                {purchasedEmployees.length}
              </div>
            </div>
            <div className="rounded-lg bg-muted p-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sessions</span>
              </div>
              <div className="text-lg font-semibold">
                {sessionStats.totalSessions}
              </div>
            </div>
            <div className="rounded-lg bg-muted p-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Messages</span>
              </div>
              <div className="text-lg font-semibold">
                {sessionStats.totalMessages}
              </div>
            </div>
            <div className="rounded-lg bg-muted p-2">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <div className="text-lg font-semibold">
                {sessionStats.activeEmployees}
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <Button
            onClick={() => setIsSelectDialogOpen(true)}
            className="w-full"
            disabled={purchasedEmployees.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Chat Sessions */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="mb-3 font-medium">Chat Sessions</h3>
          <div className="space-y-2">
            {chatSessions.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No chat sessions yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Start a conversation with your AI employees
                </p>
              </div>
            ) : (
              chatSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'cursor-pointer rounded-lg border p-3 transition-colors',
                    activeSessionId === session.id
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => handleSessionSelect(session.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-white',
                        getProviderColor(session.provider)
                      )}
                    >
                      {getProviderIcon(session.provider)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h4 className="truncate text-sm font-medium">
                          {session.employeeName}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {session.provider}
                        </Badge>
                      </div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        {session.employeeRole}
                      </p>
                      {session.lastMessage && (
                        <p className="truncate text-xs text-muted-foreground">
                          {session.lastMessage}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {session.messageCount} messages
                        </span>
                        {session.lastMessageTime && (
                          <>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {session.lastMessageTime.toLocaleTimeString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {activeSessionId && selectedEmployee ? (
          <TabbedLLMChatInterface
            conversationId={activeSessionId}
            userId={user?.id || ''}
            employeeId={selectedEmployee.id}
            employeeRole={selectedEmployee.role}
            employeeName={selectedEmployee.name}
            className="flex-1"
            onSessionCreated={(session) => {
              console.log('Session created:', session);
            }}
            onError={(error) => {
              console.error('Chat error:', error);
              toast.error(`Error: ${error.message}`);
            }}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-blue-500">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">
                Welcome to AI Workforce Chat
              </h2>
              <p className="mb-4 text-muted-foreground">
                Start a conversation with your AI employees using the latest
                multi-LLM interface
              </p>
              <Button onClick={() => setIsSelectDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Employee Selection Dialog */}
      <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogDescription>
              Select an AI employee to start a conversation with
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-96 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2">
            {purchasedEmployees.map((employee) => {
              // Find the AI employee details from the master list
              const aiEmployee = AI_EMPLOYEES.find(
                (emp) => emp.id === employee.employee_id
              );

              return (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50"
                  onClick={() =>
                    handleStartNewChat({
                      ...employee,
                      name: aiEmployee?.name || employee.employee_id,
                      role: aiEmployee?.role || employee.role,
                    })
                  }
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full text-white',
                        getProviderColor(employee.provider)
                      )}
                    >
                      {getProviderIcon(employee.provider)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {aiEmployee?.name || employee.employee_id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {aiEmployee?.role || employee.role}
                      </p>
                      <div className="mt-1 flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {employee.provider}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Purchased{' '}
                          {new Date(employee.purchased_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {purchasedEmployees.length === 0 && (
            <div className="py-8 text-center">
              <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No AI Employees Purchased
              </h3>
              <p className="mb-4 text-muted-foreground">
                You need to purchase AI employees from the marketplace first
              </p>
              <Button onClick={() => navigate('/marketplace')}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Go to Marketplace
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TabbedLLMChatPage;
