/**
 * Chat Agent Page
 * Advanced AI agent interface using OpenAI's Agent SDK
 * Implements the exact interface from the OpenAI platform
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Bot,
  Plus,
  MessageSquare,
  Loader2,
  AlertCircle,
  Settings,
  Play,
  Square,
  RotateCcw,
  Code,
  Search,
  FileText,
  Database,
  Globe,
  Wrench,
  Copy,
  Download,
  Upload,
  Terminal,
  Brain,
  Sparkles,
  Activity,
  ChevronRight,
  Save,
  Edit,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/unified-auth-store';
import { listPurchasedEmployees } from '@/services/supabase-employees';
import { openAIAgentsService, type AgentSession, type AgentConfig } from '@/services/openai-agents-service';
import AgentChatUI from '@/components/chat/AgentChatUI';

interface PurchasedEmployee {
  id: string;
  employee_id: string;
  name: string;
  role: string;
  description: string;
  avatar_url?: string;
  created_at: string;
  status: 'active' | 'inactive';
  capabilities?: string[];
  provider?: string;
}

interface ToolDefinition {
  name: string;
  description: string;
  enabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
  category: 'local' | 'function' | 'custom' | 'image';
}

const availableTools: ToolDefinition[] = [
  {
    name: 'Web Search',
    description: 'Search the web for information',
    enabled: true,
    icon: Globe,
    category: 'local',
  },
  {
    name: 'Code Interpreter',
    description: 'Execute code and return results',
    enabled: true,
    icon: Code,
    category: 'function',
  },
  {
    name: 'File Search',
    description: 'Search through uploaded files',
    enabled: true,
    icon: FileText,
    category: 'local',
  },
  {
    name: 'Image Generation',
    description: 'Generate images from text descriptions',
    enabled: false,
    icon: Sparkles,
    category: 'image',
  },
  {
    name: 'Data Analysis',
    description: 'Analyze data and provide insights',
    enabled: true,
    icon: Database,
    category: 'function',
  },
  {
    name: 'Custom Function',
    description: 'Custom tool implementation',
    enabled: false,
    icon: Wrench,
    category: 'custom',
  },
];

const ChatAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // State
  const [employees, setEmployees] = useState<PurchasedEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<PurchasedEmployee | null>(null);
  const [agentSession, setAgentSession] = useState<AgentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPromptDialog, setShowNewPromptDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('hosted');
  
  // Agent configuration state
  const [agentName, setAgentName] = useState('gpt-4o');
  const [model, setModel] = useState('gpt-4o');
  const [agentInstructions, setAgentInstructions] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>(['Web Search']);
  const [isDraft, setIsDraft] = useState(true);

  // Get employee ID from query params
  const employeeIdFromParams = searchParams.get('employee');

  // Load purchased employees
  useEffect(() => {
    const loadEmployees = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const data = await listPurchasedEmployees(user.id);
        setEmployees(data);
        
        // Select employee from URL param or first available
        if (data.length > 0) {
          let employeeToSelect = data[0];
          
          // If employee ID in URL, try to find it
          if (employeeIdFromParams) {
            const foundEmployee = data.find(emp => emp.id === employeeIdFromParams);
            if (foundEmployee) {
              employeeToSelect = foundEmployee;
            }
          }
          
          setSelectedEmployee(employeeToSelect);
          setAgentName(employeeToSelect.name);
          setAgentInstructions(
            `You are ${employeeToSelect.name}, a professional ${employeeToSelect.role}. ${employeeToSelect.description}`
          );
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
        toast.error('Failed to load AI employees');
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployees();
  }, [user?.id, employeeIdFromParams]);

  // Create agent session when employee is selected
  useEffect(() => {
    if (selectedEmployee && user?.id && !agentSession) {
      createAgentSession();
    }
  }, [selectedEmployee, user?.id]);

  // Create agent session
  const createAgentSession = async () => {
    if (!selectedEmployee || !user?.id) return;

    try {
      setIsLoading(true);
      
      // Create agent from employee
      const agent = openAIAgentsService.createAgentFromEmployee(selectedEmployee);
      
      // Start session
      const session = await openAIAgentsService.startSession(
        user.id,
        selectedEmployee.id,
        agent
      );
      
      setAgentSession(session);
      
      // Update URL if needed
      if (!sessionId) {
        navigate(`/chat-agent/${session.sessionId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error creating agent session:', error);
      toast.error('Failed to create agent session');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tool toggle
  const handleToolToggle = (toolName: string) => {
    setSelectedTools(prev => {
      if (prev.includes(toolName)) {
        return prev.filter(t => t !== toolName);
      }
      return [...prev, toolName];
    });
  };

  // Handle save configuration
  const handleSaveConfiguration = () => {
    setIsDraft(false);
    toast.success('Agent configuration saved');
  };

  // Handle add new prompt
  const handleAddNewPrompt = () => {
    setShowNewPromptDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-[#0d0e11] dark:bg-[#0d0e11] bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400 dark:text-gray-400 text-gray-600" />
            <p className="text-gray-400 dark:text-gray-400 text-gray-600">Loading AI agents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0d0e11]">
      {/* Header */}
      <div className="bg-[#171717] border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium text-white">AGI Agent Automation</h1>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-gray-400">Chat Agent</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
              onClick={() => navigate('/workforce')}
            >
              Back to Workforce
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Configuration */}
        <div className="w-80 bg-[#171717] border-r border-gray-800 flex flex-col">
          {/* New Prompt Button */}
          <div className="p-4 border-b border-gray-800">
            <Button 
              className="w-full bg-white text-black hover:bg-gray-200 justify-start"
              onClick={handleAddNewPrompt}
            >
              <Plus className="w-4 h-4 mr-2" />
              New prompt
            </Button>
          </div>

          {/* Model Configuration */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Model Name */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Model</label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="bg-[#0d0e11] border-gray-700 text-white"
                    placeholder="Agent name"
                  />
                  {isDraft && (
                    <Badge variant="outline" className="text-gray-400 border-gray-600">
                      Draft
                    </Badge>
                  )}
                </div>
              </div>

              {/* Variables */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Variables</label>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">text</span>
                    <span className="text-xs text-gray-600">format:</span>
                    <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                      text
                    </Badge>
                    <span className="text-xs text-gray-600">effect:</span>
                    <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                      high
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <span>verbosity:</span>
                    <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                      medium
                    </Badge>
                    <span>store:</span>
                    <Badge variant="outline" className="text-xs border-gray-700 text-blue-400">
                      true
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tools Section */}
              <div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-[#0d0e11] border border-gray-700">
                    <TabsTrigger value="hosted" className="data-[state=active]:bg-gray-800">
                      Hosted
                    </TabsTrigger>
                    <TabsTrigger value="local" className="data-[state=active]:bg-gray-800">
                      Local
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="hosted" className="space-y-3 mt-4">
                    <div className="space-y-2">
                      {availableTools.filter(t => t.category !== 'local').map((tool) => {
                        const Icon = tool.icon;
                        const isSelected = selectedTools.includes(tool.name);
                        return (
                          <div
                            key={tool.name}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all",
                              isSelected
                                ? "bg-gray-800 border-gray-600"
                                : "bg-[#0d0e11] border-gray-700 hover:border-gray-600"
                            )}
                            onClick={() => handleToolToggle(tool.name)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded flex items-center justify-center",
                                isSelected ? "bg-gray-700" : "bg-gray-800"
                              )}>
                                <Icon className="w-4 h-4 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">
                                    {tool.name}
                                  </span>
                                  {!tool.enabled && (
                                    <Badge variant="outline" className="text-xs border-gray-700 text-gray-500">
                                      Coming soon
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {tool.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="local" className="space-y-3 mt-4">
                    <div className="space-y-2">
                      {availableTools.filter(t => t.category === 'local').map((tool) => {
                        const Icon = tool.icon;
                        const isSelected = selectedTools.includes(tool.name);
                        return (
                          <div
                            key={tool.name}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all",
                              isSelected
                                ? "bg-gray-800 border-gray-600"
                                : "bg-[#0d0e11] border-gray-700 hover:border-gray-600"
                            )}
                            onClick={() => handleToolToggle(tool.name)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded flex items-center justify-center",
                                isSelected ? "bg-gray-700" : "bg-gray-800"
                              )}>
                                <Icon className="w-4 h-4 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <span className="text-sm font-medium text-white">
                                  {tool.name}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  {tool.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Developer Message */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
                  Developer message
                </label>
                <Textarea
                  value={agentInstructions}
                  onChange={(e) => setAgentInstructions(e.target.value)}
                  placeholder="You are a research assistant and reliable information. In all your responses, provide accurate information and, when appropriate, cite your sources."
                  className="min-h-[120px] bg-[#0d0e11] border-gray-700 text-white placeholder:text-gray-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-white text-black hover:bg-gray-200"
                  onClick={handleSaveConfiguration}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-700 text-gray-400 hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Side - Chat Interface */}
        <div className="flex-1 flex flex-col bg-[#0d0e11]">
          {/* Chat Header */}
          <div className="bg-[#171717] border-b border-gray-800 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Topic:</span>
                <Select defaultValue="general">
                  <SelectTrigger className="w-40 h-8 bg-[#0d0e11] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="data">Data Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-400 hover:text-white"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  View Traces
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-400 hover:text-white"
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Console
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Content */}
          {agentSession && selectedEmployee ? (
            <AgentChatUI
              sessionId={agentSession.sessionId}
              userId={user?.id || ''}
              agentName={selectedEmployee.name}
              agentRole={selectedEmployee.role}
              agentCapabilities={selectedEmployee.capabilities || []}
              className="flex-1"
              onError={(error) => {
                console.error('Chat error:', error);
                toast.error(`Error: ${error.message}`);
              }}
              onSessionEnd={() => {
                openAIAgentsService.endSession(agentSession.sessionId);
                setAgentSession(null);
                navigate('/workforce');
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-gray-600" />
                </div>
                <h2 className="text-xl font-medium text-white mb-2">Your conversation will appear here</h2>
                <p className="text-gray-500 max-w-md">
                  Configure your agent on the left and start chatting. Your AI employee is ready to assist!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Prompt Dialog */}
      <Dialog open={showNewPromptDialog} onOpenChange={setShowNewPromptDialog}>
        <DialogContent className="bg-[#171717] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Agent Prompt</DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure a new agent with specific instructions and tools
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Agent Name</label>
              <Input
                placeholder="e.g., Research Assistant"
                className="bg-[#0d0e11] border-gray-700 text-white"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Instructions</label>
              <Textarea
                placeholder="Describe what this agent should do..."
                className="min-h-[100px] bg-[#0d0e11] border-gray-700 text-white"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Model</label>
              <Select defaultValue="gpt-4o">
                <SelectTrigger className="bg-[#0d0e11] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNewPromptDialog(false)}
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowNewPromptDialog(false);
                toast.success('New agent prompt created');
              }}
              className="bg-white text-black hover:bg-gray-200"
            >
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatAgentPage;
