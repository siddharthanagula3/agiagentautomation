/**
 * ChatKit Integration Component
 * Implements OpenAI ChatKit web component following official patterns
 * Based on: https://github.com/openai/openai-chatkit-starter-app
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Skeleton } from '@shared/ui/skeleton';
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
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@shared/stores/unified-auth-store';
import { listPurchasedEmployees } from '@features/workforce/services/supabase-employees';
import {
  getChatGPTAIEmployeePrompt,
  getStarterPromptsForRole,
  getGreetingMessageForRole,
} from '@/prompts/chatgpt-ai-employee-prompts';

interface ChatKitGlobal {
  loaded?: boolean;
}

type ChatKitElementProps = React.HTMLAttributes<HTMLElement> & {
  workflowId: string;
  sessionId?: string;
  theme?: 'light' | 'dark' | 'auto';
  placeholder?: string;
  greeting?: string;
  starterPrompts?: string[];
  onSessionCreated?: (event: CustomEvent<Record<string, unknown>>) => void;
  onMessageSent?: (event: CustomEvent<Record<string, unknown>>) => void;
  onMessageReceived?: (event: CustomEvent<Record<string, unknown>>) => void;
  onError?: (event: CustomEvent<{ message?: string }>) => void;
};

declare global {
  interface Window {
    ChatKit?: ChatKitGlobal;
  }
}

const OpenAIChatKitElement = React.forwardRef<HTMLElement, ChatKitElementProps>(
  ({ children, ...rest }, ref) =>
    React.createElement('openai-chatkit', { ...rest, ref }, children)
);

OpenAIChatKitElement.displayName = 'OpenAIChatKitElement';

type SessionCreatedDetail = Record<string, unknown>;
type MessageEventDetail = Record<string, unknown>;
type ChatKitErrorDetail = { message?: string } & Record<string, unknown>;

// Check if ChatKit is available
const isChatKitAvailable = () => {
  return (
    typeof window !== 'undefined' &&
    window.ChatKit !== undefined &&
    window.ChatKit.loaded !== false
  );
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

const ChatKitIntegration: React.FC<ChatKitIntegrationProps> = ({
  className,
}) => {
  const { user } = useAuthStore();
  const chatkitRef = useRef<HTMLElement | null>(null);

  const [employees, setEmployees] = useState<PurchasedEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] =
    useState<PurchasedEmployee | null>(null);
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
  const handleSessionCreated = (event: CustomEvent<SessionCreatedDetail>) => {
    console.log('ChatKit session created:', event.detail);
    setIsSessionActive(true);
    toast.success('Chat session started');
  };

  const handleMessageSent = (event: CustomEvent<MessageEventDetail>) => {
    console.log('Message sent:', event.detail);
  };

  const handleMessageReceived = (event: CustomEvent<MessageEventDetail>) => {
    console.log('Message received:', event.detail);
  };

  const handleError = (event: CustomEvent<ChatKitErrorDetail>) => {
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
      <div className="flex h-screen flex-col bg-gray-50">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading AI agents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col bg-gray-50">
        <div className="flex flex-1 items-center justify-center">
          <Card className="mx-auto max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h2 className="mb-2 text-lg font-semibold">
                Error Loading Agents
              </h2>
              <p className="mb-4 text-gray-600">{error}</p>
              <Button onClick={() => window.location.reload()}>
                <RotateCcw className="mr-2 h-4 w-4" />
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
      <div className="flex h-screen flex-col bg-gray-50">
        <div className="flex flex-1 items-center justify-center">
          <Card className="mx-auto max-w-md">
            <CardContent className="p-6 text-center">
              <Bot className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h2 className="mb-2 text-lg font-semibold">No AI Agents Found</h2>
              <p className="mb-4 text-gray-600">
                You need to purchase AI employees from the marketplace to start
                using the ChatKit interface.
              </p>
              <Button onClick={() => (window.location.href = '/marketplace')}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex h-screen flex-col bg-gray-50', className)}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="h-6 w-px bg-gray-300" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  ChatKit AI Assistant
                </h1>
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
              <Users className="h-4 w-4" />
              Switch Agent
            </Button>

            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              ChatKit
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="flex w-80 flex-col border-r border-gray-200 bg-white">
          {/* Agent Info */}
          {selectedEmployee && (
            <div className="border-b border-gray-200 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-400 to-pink-500">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedEmployee.role}
                  </p>
                </div>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                {selectedEmployee.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <Badge
                    variant={
                      selectedEmployee.status === 'active'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {selectedEmployee.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Messages</span>
                  <span className="font-medium">
                    {selectedEmployee?.usage_stats?.messages_sent ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sessions</span>
                  <span className="font-medium">
                    {selectedEmployee?.usage_stats?.total_sessions ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Capabilities */}
          {selectedEmployee && (
            <div className="flex-1 p-6">
              <h4 className="mb-3 font-medium text-gray-900">Capabilities</h4>
              <div className="flex flex-wrap gap-2">
                {(selectedEmployee.capabilities || []).map(
                  (capability, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {capability}
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* ChatKit Interface */}
        <div className="flex flex-1 flex-col">
          {!isChatKitAvailable() ? (
            <div className="flex flex-1 items-center justify-center">
              <Card className="mx-auto max-w-md">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
                  <h2 className="mb-2 text-lg font-semibold">
                    ChatKit Not Available
                  </h2>
                  <p className="mb-4 text-gray-600">
                    The ChatKit script is not available. Please use the regular
                    chat interface instead.
                  </p>
                  <Button onClick={() => (window.location.href = '/chat')}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Go to Regular Chat
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : chatKitConfig ? (
            <div className="flex-1">
              <OpenAIChatKitElement
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
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-400 to-pink-500">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h2 className="mb-2 text-xl font-semibold">
                  Select an AI Agent
                </h2>
                <p className="mb-4 text-gray-600">
                  Choose an AI agent to start a ChatKit conversation
                </p>
                <Button
                  onClick={() => {
                    const selector =
                      document.getElementById('employee-selector');
                    if (selector) {
                      selector.style.display = 'block';
                    }
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        style={{ display: 'none' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.style.display = 'none';
          }
        }}
      >
        <Card className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
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
                    'cursor-pointer transition-all duration-200 hover:shadow-md',
                    selectedEmployee?.id === employee.id &&
                      'ring-2 ring-purple-500'
                  )}
                  onClick={() => {
                    handleEmployeeSelect(employee);
                    const selector =
                      document.getElementById('employee-selector');
                    if (selector) {
                      selector.style.display = 'none';
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-400 to-pink-500">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {employee.name}
                        </h3>
                        <p className="text-sm text-gray-600">{employee.role}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {employee.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {employee.status}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {employee?.usage_stats?.messages_sent ?? 0} messages
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
