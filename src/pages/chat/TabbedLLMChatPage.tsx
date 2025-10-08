/**
 * Tabbed LLM Chat Page
 * Modern chat interface with tabs for different LLM providers
 * Uses proper SDK implementations for each provider
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/unified-auth-store';
import { listPurchasedEmployees } from '@/services/supabase-employees';
import { AI_EMPLOYEES } from '@/data/ai-employees';
import TabbedLLMChatInterface from '@/components/chat/TabbedLLMChatInterface';
import { 
  unifiedLLMService, 
  LLMProvider,
  UnifiedLLMError 
} from '@/services/llm-providers/unified-llm-service';

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
  const [purchasedEmployees, setPurchasedEmployees] = useState<PurchasedEmployee[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<PurchasedEmployee | null>(null);
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    totalTokens: 0,
    activeEmployees: 0
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
        const employeeSessions: ChatSession[] = employees.map((employee, index) => {
          // Find the AI employee details from the master list
          const aiEmployee = AI_EMPLOYEES.find(emp => emp.id === employee.employee_id);
          
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
        });
        
        setChatSessions(employeeSessions);
        setSessionStats({
          totalSessions: employeeSessions.length,
          totalMessages: employeeSessions.reduce((sum, session) => sum + session.messageCount, 0),
          totalTokens: 0,
          activeEmployees: employeeSessions.filter(s => s.isActive).length
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

      setChatSessions(prev => [newSession, ...prev]);
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
    const session = chatSessions.find(s => s.id === sessionId);
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
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
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
        return <Brain className="w-4 h-4" />;
      case 'anthropic':
        return <Sparkles className="w-4 h-4" />;
      case 'google':
        return <Globe className="w-4 h-4" />;
      case 'perplexity':
        return <Search className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
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
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-96 w-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-background flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">AI Workforce Chat</h1>
              <p className="text-xs text-muted-foreground">Multi-LLM Interface</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Employees</span>
              </div>
              <div className="text-lg font-semibold">{purchasedEmployees.length}</div>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sessions</span>
              </div>
              <div className="text-lg font-semibold">{sessionStats.totalSessions}</div>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Messages</span>
              </div>
              <div className="text-lg font-semibold">{sessionStats.totalMessages}</div>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <div className="text-lg font-semibold">{sessionStats.activeEmployees}</div>
            </div>
          </div>

          {/* New Chat Button */}
          <Button 
            onClick={() => setIsSelectDialogOpen(true)} 
            className="w-full"
            disabled={purchasedEmployees.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat Sessions */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-medium mb-3">Chat Sessions</h3>
          <div className="space-y-2">
            {chatSessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No chat sessions yet</p>
                <p className="text-xs text-muted-foreground">Start a conversation with your AI employees</p>
              </div>
            ) : (
              chatSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    activeSessionId === session.id 
                      ? "bg-primary/10 border-primary" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleSessionSelect(session.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white",
                      getProviderColor(session.provider)
                    )}>
                      {getProviderIcon(session.provider)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{session.employeeName}</h4>
                        <Badge variant="outline" className="text-xs">
                          {session.provider}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{session.employeeRole}</p>
                      {session.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {session.lastMessage}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {session.messageCount} messages
                        </span>
                        {session.lastMessageTime && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
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
      <div className="flex-1 flex flex-col">
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Welcome to AI Workforce Chat</h2>
              <p className="text-muted-foreground mb-4">
                Start a conversation with your AI employees using the latest multi-LLM interface
              </p>
              <Button onClick={() => setIsSelectDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {purchasedEmployees.map((employee) => {
              // Find the AI employee details from the master list
              const aiEmployee = AI_EMPLOYEES.find(emp => emp.id === employee.employee_id);
              
              return (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleStartNewChat({
                    ...employee,
                    name: aiEmployee?.name || employee.employee_id,
                    role: aiEmployee?.role || employee.role,
                  })}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-white",
                      getProviderColor(employee.provider)
                    )}>
                      {getProviderIcon(employee.provider)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {aiEmployee?.name || employee.employee_id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {aiEmployee?.role || employee.role}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {employee.provider}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Purchased {new Date(employee.purchased_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {purchasedEmployees.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No AI Employees Purchased</h3>
              <p className="text-muted-foreground mb-4">
                You need to purchase AI employees from the marketplace first
              </p>
              <Button onClick={() => navigate('/marketplace')}>
                <ShoppingCart className="w-4 h-4 mr-2" />
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
