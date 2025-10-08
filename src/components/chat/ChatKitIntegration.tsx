/**
 * ChatKit Integration Component
 * Implements OpenAI ChatKit web component following official patterns
 * Based on: https://github.com/openai/openai-chatkit-starter-app
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bot,
  Settings,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Square,
  RotateCcw,
  Star,
  Crown,
  Wrench,
  Brain,
  Globe,
  Search,
  ArrowLeft,
  Users,
  MessageSquare,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/unified-auth-store';
import { listPurchasedEmployees } from '@/services/supabase-employees';
import { getChatGPTAIEmployeePrompt, getStarterPromptsForRole, getGreetingMessageForRole } from '@/prompts/chatgpt-ai-employee-prompts';

// Declare the ChatKit web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'openai-chatkit': {
        workflowId: string;
        sessionId?: string;
        theme?: 'light' | 'dark' | 'auto';
        placeholder?: string;
        greeting?: string;
        starterPrompts?: string[];
        onSessionCreated?: (event: CustomEvent) => void;
        onMessageSent?: (event: CustomEvent) => void;
        onMessageReceived?: (event: CustomEvent) => void;
        onError?: (event: CustomEvent) => void;
        className?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

// Check if ChatKit is available
const isChatKitAvailable = () => {
  return typeof window !== 'undefined' && 
         window.ChatKit && 
         window.ChatKit.loaded !== false;
};

interface PurchasedEmployee {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar_url?: string;
  created_at: string;
  status: 'active' | 'inactive';
  capabilities: string[];
  pricing: {
    monthly: number;
    yearly: number;
  };
  usage_stats: {
    messages_sent: number;
    last_used: string;
    total_sessions: number;
  };
}

interface ChatKitIntegrationProps {
  className?: string;
}

const ChatKitIntegration: React.FC<ChatKitIntegrationProps> = ({ className }) => {
  const { user } = useAuthStore();
  const chatkitRef = useRef<any>(null);
  
  const [employees, setEmployees] = useState<PurchasedEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<PurchasedEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Load purchased employees
  useEffect(() => {
    const loadEmployees = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const data = await listPurchasedEmployees(user.id);
        setEmployees(data);
        
        // Auto-select first employee if available
        if (data.length > 0 && !selectedEmployee) {
          setSelectedEmployee(data[0]);
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
        setError('Failed to load AI employees');
        toast.error('Failed to load AI employees');
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployees();
  }, [user?.id, selectedEmployee]);

  // Generate session ID when employee is selected
  useEffect(() => {
    if (selectedEmployee && !sessionId) {
      const newSessionId = `chatkit-${selectedEmployee.id}-${Date.now()}`;
      setSessionId(newSessionId);
    }
  }, [selectedEmployee, sessionId]);

  // Handle employee selection
  const handleEmployeeSelect = (employee: PurchasedEmployee) => {
    setSelectedEmployee(employee);
    const newSessionId = `chatkit-${employee.id}-${Date.now()}`;
    setSessionId(newSessionId);
    setIsSessionActive(false);
    toast.success(`Switched to ${employee.name}`);
  };

  // Handle ChatKit events
  const handleSessionCreated = (event: CustomEvent) => {
    console.log('ChatKit session created:', event.detail);
    setIsSessionActive(true);
    toast.success('Chat session started');
  };

  const handleMessageSent = (event: CustomEvent) => {
    console.log('Message sent:', event.detail);
  };

  const handleMessageReceived = (event: CustomEvent) => {
    console.log('Message received:', event.detail);
  };

  const handleError = (event: CustomEvent) => {
    console.error('ChatKit error:', event.detail);
    setError(event.detail.message || 'An error occurred');
    toast.error('Chat session error occurred');
  };

  // Get ChatKit configuration for selected employee
  const getChatKitConfig = () => {
    if (!selectedEmployee) return null;

    const employeePrompt = getChatGPTAIEmployeePrompt(selectedEmployee.role);
    if (!employeePrompt) return null;

    return {
      workflowId: process.env.VITE_CHATKIT_WORKFLOW_ID || 'default-workflow',
      sessionId: sessionId || undefined,
      theme: 'auto' as const,
      placeholder: `Message ${selectedEmployee.name}...`,
      greeting: employeePrompt.greetingMessage,
      starterPrompts: employeePrompt.starterPrompts,
    };
  };

  const chatKitConfig = getChatKitConfig();

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading AI agents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Error Loading Agents</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No AI Agents Found</h2>
              <p className="text-gray-600 mb-4">
                You need to purchase AI employees from the marketplace to start using the ChatKit interface.
              </p>
              <Button onClick={() => window.location.href = '/marketplace'}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-screen bg-gray-50", className)}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">ChatKit AI Assistant</h1>
                <p className="text-sm text-gray-600">
                  Advanced ChatGPT-powered AI Employee interface
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Show employee selector
                const selector = document.getElementById('employee-selector');
                if (selector) {
                  selector.style.display = 'block';
                }
              }}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Switch Agent
            </Button>
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              ChatKit
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Agent Info */}
          {selectedEmployee && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedEmployee.name}</h3>
                  <p className="text-sm text-gray-600">{selectedEmployee.role}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{selectedEmployee.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={selectedEmployee.status === 'active' ? 'default' : 'secondary'}>
                    {selectedEmployee.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Messages</span>
                  <span className="font-medium">{selectedEmployee?.usage_stats?.messages_sent ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sessions</span>
                  <span className="font-medium">{selectedEmployee?.usage_stats?.total_sessions ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Capabilities */}
          {selectedEmployee && (
            <div className="p-6 flex-1">
              <h4 className="font-medium text-gray-900 mb-3">Capabilities</h4>
              <div className="flex flex-wrap gap-2">
                {(selectedEmployee.capabilities || []).map((capability, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ChatKit Interface */}
        <div className="flex-1 flex flex-col">
          {!isChatKitAvailable() ? (
            <div className="flex-1 flex items-center justify-center">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold mb-2">ChatKit Not Available</h2>
                  <p className="text-gray-600 mb-4">
                    The ChatKit script is not available. Please use the regular chat interface instead.
                  </p>
                  <Button onClick={() => window.location.href = '/chat'}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Go to Regular Chat
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : chatKitConfig ? (
            <div className="flex-1">
              <openai-chatkit
                ref={chatkitRef}
                workflowId={chatKitConfig.workflowId}
                sessionId={chatKitConfig.sessionId}
                theme={chatKitConfig.theme}
                placeholder={chatKitConfig.placeholder}
                greeting={chatKitConfig.greeting}
                starterPrompts={chatKitConfig.starterPrompts}
                onSessionCreated={handleSessionCreated}
                onMessageSent={handleMessageSent}
                onMessageReceived={handleMessageReceived}
                onError={handleError}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Select an AI Agent</h2>
                <p className="text-gray-600 mb-4">
                  Choose an AI agent to start a ChatKit conversation
                </p>
                <Button onClick={() => {
                  const selector = document.getElementById('employee-selector');
                  if (selector) {
                    selector.style.display = 'block';
                  }
                }}>
                  <Users className="w-4 h-4 mr-2" />
                  Select Agent
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Selector (Hidden by default) */}
      <div
        id="employee-selector"
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        style={{ display: 'none' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.style.display = 'none';
          }
        }}
      >
        <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Select AI Agent</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const selector = document.getElementById('employee-selector');
                  if (selector) {
                    selector.style.display = 'none';
                  }
                }}
              >
                ×
              </Button>
            </div>
            
            <div className="grid gap-4">
              {employees.map((employee) => (
                <Card
                  key={employee.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedEmployee?.id === employee.id && "ring-2 ring-purple-500"
                  )}
                  onClick={() => {
                    handleEmployeeSelect(employee);
                    const selector = document.getElementById('employee-selector');
                    if (selector) {
                      selector.style.display = 'none';
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-600">{employee.role}</p>
                        <p className="text-xs text-gray-500 mt-1">{employee.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {employee.status}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {(employee?.usage_stats?.messages_sent ?? 0)} messages
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatKitIntegration;
