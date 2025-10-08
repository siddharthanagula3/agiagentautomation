/**
 * Agent SDK Chat Page
 * Modern chat interface using OpenAI's Agent SDK
 * Follows OpenAI's design guidelines and best practices
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Bot,
  Plus,
  MessageSquare,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Settings,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Sparkles,
  Zap,
  Users,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/unified-auth-store';
import { listPurchasedEmployees } from '@/services/supabase-employees';
import { AgentSDKChatInterface } from '@/components/chat/AgentSDKChatInterface';
import { 
  agentSDKService, 
  type AgentSession, 
  type AgentError 
} from '@/services/agent-sdk-service';

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

const AgentSDKChatPage: React.FC = () => {
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

        // Load existing agent sessions
        const sessions = await agentSDKService.listUserSessions(user.id);
        
        // Convert to chat sessions format
        const chatSessionsData: ChatSession[] = sessions.map(session => ({
          id: session.id,
          employeeId: session.employeeId,
          employeeName: getEmployeeName(session.employeeId),
          employeeRole: session.employeeRole,
          provider: session.config.provider,
          lastMessage: session.messages[session.messages.length - 1]?.content,
          lastMessageTime: session.messages[session.messages.length - 1]?.timestamp,
          messageCount: session.messages.length,
          isActive: session.id === activeSessionId
        }));

        setChatSessions(chatSessionsData);

        // Calculate stats
        setSessionStats({
          totalSessions: sessions.length,
          totalMessages: sessions.reduce((sum, s) => sum + s.messages.length, 0),
          totalTokens: 0, // Will be calculated from analytics
          activeEmployees: employees.length
        });

        // Set first session as active if available
        if (chatSessionsData.length > 0 && !activeSessionId) {
          setActiveSessionId(chatSessionsData[0].id);
        }

      } catch (error) {
        console.error('[Agent SDK Chat Page] Error loading data:', error);
        toast.error('Failed to load chat data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, activeSessionId]);

  // Get employee name by ID
  const getEmployeeName = (employeeId: string): string => {
    const employee = purchasedEmployees.find(emp => emp.id === employeeId);
    return employee?.name || 'Unknown Employee';
  };

  // Handle starting new chat
  const handleStartNewChat = (employee: PurchasedEmployee) => {
    setSelectedEmployee(employee);
    setIsSelectDialogOpen(false);
    
    // Create new session
    createNewSession(employee);
  };

  // Create new agent session
  const createNewSession = async (employee: PurchasedEmployee) => {
    if (!user?.id) return;

    try {
      const session = await agentSDKService.createSession(
        user.id,
        employee.id,
        employee.role,
        {
          provider: employee.provider.toLowerCase() as 'openai' | 'anthropic' | 'google',
          model: getModelForProvider(employee.provider),
          temperature: 0.7,
          maxTokens: 4000,
          streaming: true
        }
      );

      // Add to chat sessions
      const newChatSession: ChatSession = {
        id: session.id,
        employeeId: employee.id,
        employeeName: employee.name,
        employeeRole: employee.role,
        provider: employee.provider,
        messageCount: 0,
        isActive: true
      };

      setChatSessions(prev => [newChatSession, ...prev]);
      setActiveSessionId(session.id);

      toast.success(`Started new chat with ${employee.name}`);
    } catch (error) {
      console.error('[Agent SDK Chat Page] Error creating session:', error);
      toast.error('Failed to start new chat');
    }
  };

  // Get model for provider
  const getModelForProvider = (provider: string): string => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'gpt-4o-mini';
      case 'anthropic':
        return 'claude-3-5-sonnet-20241022';
      case 'google':
        return 'gemini-2.0-flash';
      default:
        return 'gpt-4o-mini';
    }
  };

  // Handle session selection
  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setChatSessions(prev => prev.map(session => ({
      ...session,
      isActive: session.id === sessionId
    })));
  };

  // Handle session deletion
  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Remove from local state
      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // If this was the active session, select another one
      if (activeSessionId === sessionId) {
        const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
        setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
      }

      toast.success('Chat session deleted');
    } catch (error) {
      console.error('[Agent SDK Chat Page] Error deleting session:', error);
      toast.error('Failed to delete chat session');
    }
  };

  // Handle session creation callback
  const handleSessionCreated = (session: AgentSession) => {
    // Update the chat session with the new session data
    setChatSessions(prev => prev.map(chatSession => 
      chatSession.id === session.id 
        ? {
            ...chatSession,
            messageCount: session.messages.length,
            lastMessage: session.messages[session.messages.length - 1]?.content,
            lastMessageTime: session.messages[session.messages.length - 1]?.timestamp
          }
        : chatSession
    ));
  };

  // Handle errors
  const handleError = (error: AgentError) => {
    console.error('[Agent SDK Chat Page] Agent error:', error);
    toast.error(`Agent error: ${error.message}`);
  };

  // Get active session
  const activeSession = chatSessions.find(session => session.id === activeSessionId);
  const activeEmployee = activeSession ? purchasedEmployees.find(emp => emp.id === activeSession.employeeId) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">AI Workforce Chat</h1>
              </div>
              
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Agent SDK
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              {/* Stats */}
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{sessionStats.activeEmployees} Employees</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{sessionStats.totalSessions} Sessions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4" />
                  <span>{sessionStats.totalMessages} Messages</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/workforce')}
                variant="outline"
                size="sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Workforce
              </Button>

              <Button
                onClick={() => navigate('/marketplace')}
                variant="outline"
                size="sm"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Marketplace
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Sidebar - Chat Sessions */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardContent className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Chat Sessions</h2>
                  <Button
                    onClick={() => setIsSelectDialogOpen(true)}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  <AnimatePresence>
                    {chatSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all",
                          session.isActive
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        )}
                        onClick={() => handleSessionSelect(session.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                                <Bot className="w-3 h-3 text-white" />
                              </div>
                              <h3 className="font-medium text-sm truncate">
                                {session.employeeName}
                              </h3>
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-1">
                              {session.employeeRole}
                            </p>
                            
                            {session.lastMessage && (
                              <p className="text-xs text-gray-500 truncate">
                                {session.lastMessage}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {session.messageCount} messages
                              </span>
                              {session.lastMessageTime && (
                                <span className="text-xs text-gray-400">
                                  {session.lastMessageTime.toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteSession(session.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {chatSessions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No chat sessions yet</p>
                      <p className="text-xs">Start a conversation with your AI employees</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            {activeSession && activeEmployee ? (
              <AgentSDKChatInterface
                userId={user?.id || ''}
                employeeId={activeEmployee.id}
                employeeRole={activeEmployee.role}
                employeeName={activeEmployee.name}
                className="h-full"
                onSessionCreated={handleSessionCreated}
                onError={handleError}
              />
            ) : (
              <Card className="h-full">
                <CardContent className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Welcome to AI Workforce Chat
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start a conversation with your AI employees using the latest Agent SDK
                    </p>
                    <Button
                      onClick={() => setIsSelectDialogOpen(true)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Start New Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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
            {purchasedEmployees.map((employee) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleStartNewChat(employee)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.role}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {employee.provider}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Purchased {new Date(employee.purchasedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {purchasedEmployees.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No AI Employees Yet
              </h3>
              <p className="text-gray-600 mb-4">
                You need to purchase AI employees from the marketplace first
              </p>
              <Button
                onClick={() => {
                  setIsSelectDialogOpen(false);
                  navigate('/marketplace');
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
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

export default AgentSDKChatPage;
