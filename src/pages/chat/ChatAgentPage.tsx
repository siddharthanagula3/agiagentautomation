/**
 * Chat Agent Page
 * Advanced AI agent interface using OpenAI's Agent SDK
 * Implements streaming, tools, and multi-agent orchestration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  ArrowLeft,
  Star,
  Crown,
  Wrench,
  Play,
  Square,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/unified-auth-store';
import { listPurchasedEmployees } from '@/services/supabase-employees';
import AgentChatUI from '@/components/chat/AgentChatUI';
import { 
  unifiedLLMService, 
  LLMProvider,
  UnifiedLLMError 
} from '@/services/llm-providers/unified-llm-service';

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

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  model: string;
  persona: string;
  tools: string[];
  capabilities: string[];
  streaming: boolean;
  maxTokens: number;
  temperature: number;
}

const ChatAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { user } = useAuthStore();
  
  const [employees, setEmployees] = useState<PurchasedEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<PurchasedEmployee | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);

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

  // Generate session ID if not provided
  useEffect(() => {
    if (!activeSessionId && selectedEmployee) {
      const newSessionId = `agent-${selectedEmployee.id}-${Date.now()}`;
      setActiveSessionId(newSessionId);
    }
  }, [activeSessionId, selectedEmployee]);

  // Create agent config from selected employee
  useEffect(() => {
    if (selectedEmployee) {
      const config: AgentConfig = {
        id: selectedEmployee.id,
        name: selectedEmployee.name,
        description: selectedEmployee.description,
        model: 'gpt-4o',
        persona: `You are ${selectedEmployee.name}, a professional ${selectedEmployee.role}. You are part of an AI workforce and should provide expert assistance in your field.`,
        tools: ['web_search', 'code_interpreter', 'file_upload', 'data_analysis'],
        capabilities: selectedEmployee.capabilities,
        streaming: true,
        maxTokens: 4000,
        temperature: 0.7,
      };
      setAgentConfig(config);
    }
  }, [selectedEmployee]);

  // Handle employee selection
  const handleEmployeeSelect = (employee: PurchasedEmployee) => {
    setSelectedEmployee(employee);
    setShowEmployeeSelector(false);
    
    // Generate new session ID for the selected employee
    const newSessionId = `agent-${employee.id}-${Date.now()}`;
    setActiveSessionId(newSessionId);
    
    // Update URL
    navigate(`/chat-agent/${newSessionId}`, { replace: true });
    
    toast.success(`Switched to ${employee.name}`);
  };

  // Handle session creation
  const handleSessionCreated = (session: any) => {
    console.log('Agent session created:', session);
    toast.success('Agent session started');
  };

  // Handle errors
  const handleError = (error: UnifiedLLMError) => {
    console.error('Agent error:', error);
    toast.error(`Agent error: ${error.message}`);
  };

  // Get provider status
  const getProviderStatus = () => {
    const providers: LLMProvider[] = ['openai', 'anthropic', 'google', 'perplexity'];
    const status = providers.map(provider => ({
      provider,
      configured: unifiedLLMService.isProviderConfigured(provider),
    }));
    
    const configuredCount = status.filter(s => s.configured).length;
    return { status, configuredCount, total: providers.length };
  };

  const providerStatus = getProviderStatus();

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
                You need to purchase AI employees from the marketplace to start using the advanced agent interface.
              </p>
              <Button onClick={() => navigate('/marketplace')}>
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/workforce')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Workforce
            </Button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Chat Agent</h1>
                <p className="text-sm text-gray-600">
                  Advanced AI agent interface with streaming, tools, and multi-agent orchestration
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmployeeSelector(true)}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Switch Agent
            </Button>
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              Advanced
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Agent Info */}
          {selectedEmployee && agentConfig && (
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
                  <span className="text-gray-600">Model</span>
                  <span className="font-medium">{agentConfig.model}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Streaming</span>
                  <span className="font-medium">{agentConfig.streaming ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tools</span>
                  <span className="font-medium">{agentConfig.tools.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Agent Tools */}
          {agentConfig && (
            <div className="p-6 border-b border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Available Tools</h4>
              <div className="space-y-2">
                {agentConfig.tools.map((tool, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 capitalize">{tool.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Provider Status */}
          <div className="p-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Provider Status</h4>
            <div className="space-y-2">
              {providerStatus.status.map(({ provider, configured }) => (
                <div key={provider} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {provider === 'openai' && <Brain className="w-4 h-4 text-green-500" />}
                    {provider === 'anthropic' && <Sparkles className="w-4 h-4 text-orange-500" />}
                    {provider === 'google' && <Globe className="w-4 h-4 text-blue-500" />}
                    {provider === 'perplexity' && <Search className="w-4 h-4 text-purple-500" />}
                    <span className="text-sm capitalize">{provider}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {configured ? (
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {configured ? 'Ready' : 'Not configured'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          {selectedEmployee && (
            <div className="p-6 flex-1">
              <h4 className="font-medium text-gray-900 mb-3">Capabilities</h4>
              <div className="flex flex-wrap gap-2">
                {selectedEmployee.capabilities.map((capability, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {activeSessionId && selectedEmployee && agentConfig ? (
            <AgentChatUI
              conversationId={activeSessionId}
              userId={user?.id || ''}
              agentConfig={agentConfig}
              className="flex-1"
              onSessionCreated={handleSessionCreated}
              onError={handleError}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Select an AI Agent</h2>
                <p className="text-gray-600 mb-4">
                  Choose an AI agent to start an advanced conversation
                </p>
                <Button onClick={() => setShowEmployeeSelector(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Select Agent
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Selector Dialog */}
      <Dialog open={showEmployeeSelector} onOpenChange={setShowEmployeeSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select AI Agent</DialogTitle>
            <DialogDescription>
              Choose an AI agent to start an advanced conversation with
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {employees.map((employee) => (
              <Card
                key={employee.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  selectedEmployee?.id === employee.id && "ring-2 ring-purple-500"
                )}
                onClick={() => handleEmployeeSelect(employee)}
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
                        {employee.usage_stats.messages_sent} messages
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatAgentPage;
