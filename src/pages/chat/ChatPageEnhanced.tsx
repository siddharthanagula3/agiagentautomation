/**
 * Enhanced Chat Page - Full-featured AI Chat Interface
 * Includes: Streaming, Tools, Artifacts, Web Search, and more
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Particles } from '@/components/ui/particles';
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
  Paperclip,
  Mic,
  Send,
  Search,
  Code,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Play,
  Pause,
  StopCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { useAuthStore } from '@/stores/unified-auth-store';
import { AI_EMPLOYEES } from '@/data/ai-employees';
import { getEmployeeById, listPurchasedEmployees } from '@/services/supabase-employees';
import { createSession, listMessages, listSessions, sendMessage } from '@/services/supabase-chat';
import { sendAIMessage, isProviderConfigured, getConfiguredProviders } from '@/services/ai-chat-service';
import { streamAIResponse, type StreamChunk } from '@/services/streaming-service';
import { toolExecutorService, type Tool, type ToolExecutionResult } from '@/services/tool-executor-service';
import { artifactService, type Artifact } from '@/services/artifact-service';
import { webSearch, isWebSearchConfigured } from '@/services/web-search-service';
import { ToolsPanel } from '@/components/chat/ToolsPanel';

interface PurchasedEmployee {
  id: string;
  name: string;
  role: string;
  provider: string;
  purchasedAt: string;
}

interface ChatTab {
  id: string;
  employeeId: string;
  role: string;
  provider: string;
  messages: ChatMessage[];
  isActive: boolean;
  artifacts: Artifact[];
  enabledTools: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolExecution?: ToolExecutionResult;
  artifacts?: string[]; // Artifact IDs
}

const EnhancedChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [purchasedEmployees, setPurchasedEmployees] = useState<PurchasedEmployee[]>([]);
  const [activeTabs, setActiveTabs] = useState<ChatTab[]>([]);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [enableTools, setEnableTools] = useState(true);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [showArtifactPanel, setShowArtifactPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);

  // Initialize
  useEffect(() => {
    const providers = getConfiguredProviders();
    setConfiguredProviders(providers);
    
    // Load available tools
    const tools = toolExecutorService.getAllTools();
    setAvailableTools(tools);

    if (providers.length === 0) {
      toast.error('No AI providers configured', {
        duration: 10000,
        action: {
          label: 'Setup',
          onClick: () => navigate('/settings')
        }
      });
    }
  }, [navigate]);

  // Load purchased employees
  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const rows = await listPurchasedEmployees(user.id);
        if (!isMounted) return;

        const normalized = rows.map(r => ({
          id: r.employee_id,
          name: getEmployeeById(r.employee_id)?.role || '',
          role: getEmployeeById(r.employee_id)?.role || '',
          provider: r.provider,
          purchasedAt: r.purchased_at,
        }));
        setPurchasedEmployees(normalized);

        // Load recent sessions
        const sessions = await listSessions(user.id);
        if (!isMounted) return;

        if (sessions.length > 0) {
          const first = sessions[0];
          const msgs = await listMessages(user.id, first.id);

          setActiveTabs([{
            id: first.id,
            employeeId: first.employee_id,
            role: first.role,
            provider: first.provider,
            isActive: true,
            messages: msgs.map(m => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at)
            })),
            artifacts: [],
            enabledTools: [],
          }]);
          setSelectedTab(first.id);
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
        toast.error('Failed to load chat data');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTabs, streamingContent]);

  // Generate file previews
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setFilePreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  const handleStartChat = async (employee: PurchasedEmployee) => {
    try {
      const employeeData = getEmployeeById(employee.id);
      if (!employeeData) {
        toast.error('Employee data not found');
        return;
      }

      if (!isProviderConfigured(employee.provider)) {
        toast.error(`${employee.provider} not configured`);
        return;
      }

      const existingTab = activeTabs.find(tab => tab.employeeId === employee.id);
      if (existingTab) {
        setSelectedTab(existingTab.id);
        setIsSelectDialogOpen(false);
        return;
      }

      if (!user?.id) {
        navigate('/auth/login');
        return;
      }

      const session = await createSession(user.id, { 
        employeeId: employee.id, 
        role: employee.role, 
        provider: employee.provider 
      });

      const welcomeContent = `Hi! I'm your ${employee.role}. I'm powered by ${employee.provider} and ready to help! I have access to various tools and can create interactive artifacts for you.`;
      const welcomeMessage = await sendMessage(user.id, session.id, 'assistant', welcomeContent);

      const newTab: ChatTab = {
        id: session.id,
        employeeId: employee.id,
        role: employee.role,
        provider: employee.provider,
        isActive: true,
        messages: [{ 
          id: welcomeMessage.id, 
          role: 'assistant', 
          content: welcomeMessage.content, 
          timestamp: new Date(welcomeMessage.created_at) 
        }],
        artifacts: [],
        enabledTools: [],
      };

      setActiveTabs(prev => [...prev, newTab]);
      setSelectedTab(newTab.id);
      setIsSelectDialogOpen(false);
      toast.success(`Started chat with ${employee.role}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error(`Failed to start chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selectedTab || isSending) return;

    const activeTab = activeTabs.find(tab => tab.id === selectedTab);
    if (!activeTab) return;

    setIsSending(true);
    setStreamingContent('');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    // Add user message immediately
    setActiveTabs(prev => prev.map(tab => 
      tab.id === selectedTab 
        ? { ...tab, messages: [...tab.messages, userMessage] }
        : tab
    ));

    setMessage('');

    try {
      if (!user?.id) throw new Error('Not authenticated');

      // Save user message
      await sendMessage(user.id, selectedTab, 'user', userMessage.content);

      // Convert files to attachments
      const attachments = await Promise.all(
        files.filter(f => f.type.startsWith('image/')).map(async f => {
          const buf = await f.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          return { type: 'image' as const, mimeType: f.type, dataBase64: b64 };
        })
      );

      // Build conversation history
      const conversationHistory = activeTab.messages
        .filter(m => m.role !== 'tool')
        .map(m => ({ role: m.role, content: m.content }));
      conversationHistory.push({ role: 'user', content: userMessage.content });

      // Add system message for tools if enabled
      if (enableTools && activeTab.enabledTools.length > 0) {
        const selectedTools = availableTools.filter(t => activeTab.enabledTools.includes(t.id));
        const toolDescriptions = selectedTools
          .map(t => `- ${t.name}: ${t.description}`)
          .join('\n');
        conversationHistory.unshift({
          role: 'system',
          content: `You have access to these tools:\n${toolDescriptions}\n\nUse them when appropriate by responding with: USE_TOOL: toolName {"param": "value"}`
        });
      }

      // Handle streaming or regular response
      if (enableStreaming && !enableWebSearch) {
        // Streaming response
        setIsStreaming(true);
        let fullContent = '';

        const assistantMsgId = `msg-${Date.now() + 1}`;
        
        // Add placeholder streaming message
        setActiveTabs(prev => prev.map(tab => 
          tab.id === selectedTab 
            ? { 
                ...tab, 
                messages: [...tab.messages, {
                  id: assistantMsgId,
                  role: 'assistant',
                  content: '',
                  timestamp: new Date(),
                  isStreaming: true
                }]
              }
            : tab
        ));

        await streamAIResponse(
          activeTab.provider,
          conversationHistory,
          (chunk: StreamChunk) => {
            if (chunk.type === 'content' && chunk.content) {
              fullContent += chunk.content;
              setStreamingContent(fullContent);
              
              // Update the streaming message
              setActiveTabs(prev => prev.map(tab => 
                tab.id === selectedTab 
                  ? {
                      ...tab,
                      messages: tab.messages.map(m =>
                        m.id === assistantMsgId
                          ? { ...m, content: fullContent }
                          : m
                      )
                    }
                  : tab
              ));
            } else if (chunk.type === 'done') {
              setIsStreaming(false);
              
              // Finalize message
              setActiveTabs(prev => prev.map(tab => 
                tab.id === selectedTab 
                  ? {
                      ...tab,
                      messages: tab.messages.map(m =>
                        m.id === assistantMsgId
                          ? { ...m, isStreaming: false }
                          : m
                      )
                    }
                  : tab
              ));

              // Save to database
              sendMessage(user.id, selectedTab, 'assistant', fullContent);
              
              // Extract artifacts
              const artifacts = artifactService.extractArtifactsFromResponse(fullContent);
              if (artifacts.length > 0) {
                setActiveTabs(prev => prev.map(tab => 
                  tab.id === selectedTab 
                    ? { ...tab, artifacts: [...tab.artifacts, ...artifacts] }
                    : tab
                ));
                toast.success(`Created ${artifacts.length} artifact(s)`);
              }
            } else if (chunk.type === 'tool_call' && chunk.toolCall) {
              // Handle tool calls
              console.log('Tool call:', chunk.toolCall);
            }
          }
        );
      } else {
        // Regular response
        let response;
        
        if (enableWebSearch) {
          // Web search + AI summary
          const searchResponse = await webSearch(userMessage.content);
          const context = searchResponse.results
            .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}`)
            .join('\n\n');
          
          conversationHistory.push({
            role: 'system',
            content: `Search Results:\n${context}\n\nProvide an answer based on these results and cite sources using [1], [2], etc.`
          });

          response = await sendAIMessage(
            activeTab.provider,
            conversationHistory,
            activeTab.role,
            attachments
          );
        } else {
          response = await sendAIMessage(
            activeTab.provider,
            conversationHistory,
            activeTab.role,
            attachments
          );
        }

        const aiMessage: ChatMessage = { 
          id: `msg-${Date.now() + 1}`, 
          role: 'assistant', 
          content: response.content, 
          timestamp: new Date()
        };

        setActiveTabs(prev => prev.map(tab => 
          tab.id === selectedTab 
            ? { ...tab, messages: [...tab.messages, aiMessage] }
            : tab
        ));

        await sendMessage(user.id, selectedTab, 'assistant', response.content);

        // Extract artifacts
        const artifacts = artifactService.extractArtifactsFromResponse(response.content);
        if (artifacts.length > 0) {
          setActiveTabs(prev => prev.map(tab => 
            tab.id === selectedTab 
              ? { ...tab, artifacts: [...tab.artifacts, ...artifacts] }
              : tab
          ));
        }
      }

      setFiles([]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setActiveTabs(prev => prev.map(tab => 
        tab.id === selectedTab 
          ? { ...tab, messages: [...tab.messages, errorMessage] }
          : tab
      ));

      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [message, selectedTab, activeTabs, isSending, user, files, enableStreaming, enableTools, enableWebSearch, availableTools]);

  const handleCloseTab = (tabId: string) => {
    setActiveTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (selectedTab === tabId) {
      setSelectedTab(activeTabs[0]?.id || null);
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingContent('');
  };

  const handleToolsChange = (tools: string[]) => {
    if (!selectedTab) return;
    setActiveTabs(prev => prev.map(tab =>
      tab.id === selectedTab
        ? { ...tab, enabledTools: tools }
        : tab
    ));
  };

  const activeTabData = activeTabs.find(tab => tab.id === selectedTab);

  const renderMarkdown = (markdown: string): string => {
    let html = markdown;
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${code.trim()}</code></pre>`);
    for (let i = 6; i >= 1; i--) {
      const re = new RegExp(`^${'#'.repeat(i)}\s+(.+)$`, 'gm');
      html = html.replace(re, `<h${i}>$1</h${i}>`);
    }
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^---$/gm, '<hr />');
    html = html.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = `<p>${html}</p>`;
    return DOMPurify.sanitize(html);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col relative">
        <Particles className="absolute inset-0 pointer-events-none" quantity={30} staticity={50} ease={50} />
        <div className="mb-6 relative z-10">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex-1 flex gap-4 min-h-0 relative z-10">
          <div className="w-64 space-y-2">
            <Card className="backdrop-blur-xl bg-background/60 border-border/50">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="flex-1">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <div className="space-y-3">
                  <Skeleton className="h-20 w-3/4" />
                  <Skeleton className="h-20 w-2/3 ml-auto" />
                  <Skeleton className="h-20 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (purchasedEmployees.length === 0 && !activeTabs.length) {
    return (
      <div className="h-full flex items-center justify-center relative">
        <Particles className="absolute inset-0 pointer-events-none" quantity={30} staticity={50} ease={50} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="max-w-md backdrop-blur-xl bg-background/60 border-border/50">
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-3">No AI Employees</h2>
              <p className="text-muted-foreground mb-6">
                Hire AI employees from the marketplace to start chatting
              </p>
              <Button onClick={() => navigate('/marketplace')}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Go to Marketplace
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Particles Background */}
      <Particles className="absolute inset-0 pointer-events-none" quantity={30} staticity={50} ease={50} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Chat</h1>
            <p className="text-muted-foreground mt-1">
              Advanced AI chat with streaming, tools, and artifacts
              {configuredProviders.length > 0 && (
                <span className="ml-2 text-green-400">• {configuredProviders.join(', ')}</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEnableStreaming(!enableStreaming)}>
                  <Zap className="h-4 w-4 mr-2" />
                  Streaming {enableStreaming ? '✓' : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEnableTools(!enableTools)}>
                  <Code className="h-4 w-4 mr-2" />
                  Tools {enableTools ? '✓' : ''}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setEnableWebSearch(!enableWebSearch)}
                  disabled={!isWebSearchConfigured()}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Web Search {enableWebSearch ? '✓' : ''}
                  {!isWebSearchConfigured() && ' (Not configured)'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowToolPanel(!showToolPanel)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Tool Panel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowArtifactPanel(!showArtifactPanel)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Artifacts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* New Chat Button */}
            <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
              <Button onClick={() => setIsSelectDialogOpen(true)} className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Select AI Employee</DialogTitle>
                  <DialogDescription>Choose an AI employee to chat with</DialogDescription>
                </DialogHeader>
                <div className="mt-4 grid gap-3 max-h-[400px] overflow-y-auto">
                  {purchasedEmployees.map(emp => {
                    const empData = getEmployeeById(emp.id);
                    if (!empData) return null;
                    const configured = isProviderConfigured(emp.provider);
                    return (
                      <button
                        key={emp.id}
                        onClick={() => handleStartChat(emp)}
                        disabled={!configured}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors text-left",
                          !configured && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <img src={empData.avatar} alt={emp.role} className="w-12 h-12 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold">{emp.role}</div>
                          <div className="text-sm text-muted-foreground truncate">{empData.specialty}</div>
                        </div>
                        <Badge variant="outline">{emp.provider}{!configured && ' ⚠️'}</Badge>
                      </button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Chat Interface */}
      {activeTabs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex gap-4 min-h-0 relative z-10"
        >
          {/* Sidebar with Glassmorphism */}
          <div className="w-64 space-y-2">
            <Card className="backdrop-blur-xl bg-background/60 border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Active Chats</h3>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeTabs.map(tab => (
                      <motion.button
                        key={tab.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => setSelectedTab(tab.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 text-left",
                          selectedTab === tab.id
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "hover:bg-accent/50 hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Bot className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{tab.role}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                          className="ml-2 hover:text-destructive transition-colors"
                        >
                          ×
                        </button>
                      </motion.button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <Card className="flex-1 flex flex-col min-w-0">
            <CardContent className="p-6 flex flex-col h-full">
              {activeTabData && (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between pb-4 border-b mb-4">
                    <div className="flex items-center gap-3">
                      <Bot className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{activeTabData.role}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{activeTabData.provider}</Badge>
                          {enableTools && activeTabData.enabledTools.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {activeTabData.enabledTools.length} {activeTabData.enabledTools.length === 1 ? 'Tool' : 'Tools'}
                            </Badge>
                          )}
                          {enableWebSearch && <Badge variant="outline" className="text-xs">Web Search</Badge>}
                        </div>
                      </div>
                    </div>
                    {isStreaming && (
                      <Button variant="destructive" size="sm" onClick={handleStopStreaming}>
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    <AnimatePresence mode="popLayout">
                      {activeTabData.messages.map((msg, index) => (
                        <motion.div
                          key={msg.id}
                          initial={{
                            opacity: 0,
                            x: msg.role === 'user' ? 50 : -50,
                            y: 20
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            y: 0
                          }}
                          transition={{
                            duration: 0.4,
                            ease: [0.25, 0.1, 0.25, 1],
                            delay: index * 0.05
                          }}
                          className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "max-w-[80%] rounded-lg p-4 relative transition-all duration-200",
                              msg.role === 'user'
                                ? "bg-primary text-primary-foreground shadow-lg hover:shadow-xl"
                                : "backdrop-blur-xl bg-muted/80 border border-border/50 shadow-md hover:shadow-lg"
                            )}
                          >
                            {msg.isStreaming && (
                              <Loader2 className="h-3 w-3 animate-spin absolute top-2 right-2" />
                            )}
                            {msg.role === 'assistant' ? (
                              <div
                                className="prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                              />
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            )}
                            <span className="text-xs opacity-70 mt-1 block">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {isSending && !isStreaming && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="backdrop-blur-xl bg-muted/80 border border-border/50 rounded-lg p-4 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="flex gap-2 items-end">
                    <input ref={fileInputRef} type="file" accept="*/*" multiple className="hidden"
                      onChange={e => setFiles(Array.from(e.target.files || []))} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" disabled>
                      <Mic className="h-5 w-5" />
                    </Button>
                    <ToolsPanel
                      selectedTools={activeTabData.enabledTools}
                      onToolsChange={handleToolsChange}
                    />
                    <div className="flex-1">
                      {filePreviews.length > 0 && (
                        <div className="flex gap-2 mb-2">
                          {filePreviews.map((src, i) => (
                            <div key={i} className="relative w-16 h-16 rounded border overflow-hidden">
                              <img src={src} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={isSending ? "Sending..." : "Type your message..."}
                        disabled={isSending}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <Button onClick={handleSendMessage} disabled={isSending || !message.trim()} size="icon">
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Artifact Panel */}
          <AnimatePresence>
            {showArtifactPanel && activeTabData && activeTabData.artifacts.length > 0 && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="border-l pl-4"
              >
                <Card className="backdrop-blur-xl bg-background/60 border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Artifacts
                    </h3>
                    <div className="space-y-2">
                      {activeTabData.artifacts.map((artifact, index) => (
                        <motion.div
                          key={artifact.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
                        >
                          <div className="font-medium text-sm">{artifact.title}</div>
                          <div className="text-xs text-muted-foreground">{artifact.type}</div>
                          <div className="flex gap-1 mt-2">
                            <Button size="sm" variant="ghost" onClick={() => artifactService.exportArtifact(artifact)}>
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Share2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedChatPage;
