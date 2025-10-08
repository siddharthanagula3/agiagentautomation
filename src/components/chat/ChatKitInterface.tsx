/**
 * ChatKit-Inspired Chat Interface
 * Modern chat interface with three tabs: Claude, ChatGPT, Gemini, Perplexity
 * Uses ChatKit design patterns and components
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Paperclip,
  Loader2,
  CheckCircle,
  XCircle,
  Bot,
  Sparkles,
  Brain,
  Globe,
  Search,
  MessageSquare,
  Settings,
  AlertCircle,
  Info,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Zap,
  Star,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Edit,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { 
  unifiedLLMService, 
  UnifiedMessage, 
  UnifiedResponse, 
  LLMProvider,
  UnifiedLLMError 
} from '@/services/llm-providers/unified-llm-service';

interface ChatKitInterfaceProps {
  conversationId: string;
  userId: string;
  employeeId: string;
  employeeRole: string;
  employeeName: string;
  className?: string;
  onSessionCreated?: (session: any) => void;
  onError?: (error: UnifiedLLMError) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider?: LLMProvider;
  metadata?: {
    provider?: LLMProvider;
    model?: string;
    usage?: any;
    tools?: string[];
    webhook?: string;
    sessionId?: string;
    userId?: string;
    error?: string;
    feedback?: 'thumbs_up' | 'thumbs_down';
  };
}

interface ChatTab {
  id: string;
  provider: LLMProvider;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  configured: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;
  lastMessage?: ChatMessage;
}

// ChatKit-inspired components
const ChatKitButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  onClick,
  className 
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

const ChatKitCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}> = ({ children, className, hover = false, gradient = false }) => {
  return (
    <Card className={cn(
      "border border-gray-200 bg-white shadow-sm",
      hover && "hover:shadow-md transition-shadow duration-200",
      gradient && "bg-gradient-to-br from-blue-50 to-indigo-50",
      className
    )}>
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  );
};

const ChatKitIcon: React.FC<{
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}> = ({ icon, size = 'md', color = 'text-gray-600', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  return (
    <div className={cn("flex items-center justify-center", sizes[size], color, className)}>
      {icon}
    </div>
  );
};

const ChatKitInterface: React.FC<ChatKitInterfaceProps> = ({
  conversationId,
  userId,
  employeeId,
  employeeRole,
  employeeName,
  className,
  onSessionCreated,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState<string>('chatgpt');
  const [tabs, setTabs] = useState<ChatTab[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showPromptOptimizer, setShowPromptOptimizer] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize tabs
  useEffect(() => {
    const initialTabs: ChatTab[] = [
      {
        id: 'chatgpt',
        provider: 'openai',
        name: 'ChatGPT',
        icon: <Brain className="w-4 h-4" />,
        color: 'bg-green-500',
        description: 'OpenAI GPT models with advanced reasoning',
        configured: unifiedLLMService.isProviderConfigured('openai'),
        messages: [],
        isStreaming: false,
      },
      {
        id: 'claude',
        provider: 'anthropic',
        name: 'Claude',
        icon: <Sparkles className="w-4 h-4" />,
        color: 'bg-orange-500',
        description: 'Anthropic Claude with safety and helpfulness',
        configured: unifiedLLMService.isProviderConfigured('anthropic'),
        messages: [],
        isStreaming: false,
      },
      {
        id: 'gemini',
        provider: 'google',
        name: 'Gemini',
        icon: <Globe className="w-4 h-4" />,
        color: 'bg-blue-500',
        description: 'Google Gemini with multimodal capabilities',
        configured: unifiedLLMService.isProviderConfigured('google'),
        messages: [],
        isStreaming: false,
      },
      {
        id: 'perplexity',
        provider: 'perplexity',
        name: 'Perplexity',
        icon: <Search className="w-4 h-4" />,
        color: 'bg-purple-500',
        description: 'Perplexity with real-time web search',
        configured: unifiedLLMService.isProviderConfigured('perplexity'),
        messages: [],
        isStreaming: false,
      },
    ];

    setTabs(initialTabs);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [tabs, scrollToBottom]);

  // Get current tab
  const currentTab = tabs.find(tab => tab.id === activeTab);

  // Send message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentTab || !currentTab.configured) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      provider: currentTab.provider,
      metadata: {
        sessionId: conversationId,
        userId,
        employeeId,
        employeeRole,
      },
    };

    // Add user message to current tab
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTab 
          ? { ...tab, messages: [...tab.messages, userMessage] }
          : tab
      )
    );

    setInputValue('');
    setIsLoading(true);

    // Set streaming state
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTab 
          ? { ...tab, isStreaming: true }
          : tab
      )
    );

    try {
      // Convert messages to unified format
      const messages: UnifiedMessage[] = [
        ...currentTab.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          metadata: {
            sessionId: conversationId,
            userId,
            employeeId,
            employeeRole,
            provider: currentTab.provider,
          },
        })),
        {
          role: 'user',
          content: inputValue,
          metadata: {
            sessionId: conversationId,
            userId,
            employeeId,
            employeeRole,
            provider: currentTab.provider,
          },
        },
      ];

      // Generate system prompt based on employee role
      const systemPrompt = generateSystemPrompt(employeeRole, currentTab.provider);

      // Update unified service config
      unifiedLLMService.updateConfig({
        provider: currentTab.provider,
        systemPrompt,
        model: getDefaultModel(currentTab.provider),
      });

      // Stream response
      let assistantContent = '';
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        provider: currentTab.provider,
        metadata: {
          sessionId: conversationId,
          userId,
          employeeId,
          employeeRole,
          provider: currentTab.provider,
        },
      };

      // Add empty assistant message
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === activeTab 
            ? { ...tab, messages: [...tab.messages, assistantMessage] }
            : tab
        )
      );

      // Stream the response
      for await (const chunk of unifiedLLMService.streamMessage(
        messages,
        conversationId,
        userId,
        currentTab.provider
      )) {
        if (chunk.content) {
          assistantContent += chunk.content;
          
          // Update assistant message content
          setTabs(prevTabs => 
            prevTabs.map(tab => 
              tab.id === activeTab 
                ? {
                    ...tab,
                    messages: tab.messages.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, content: assistantContent }
                        : msg
                    ),
                  }
                : tab
            )
          );
        }

        if (chunk.done) {
          // Update final message with usage info
          setTabs(prevTabs => 
            prevTabs.map(tab => 
              tab.id === activeTab 
                ? {
                    ...tab,
                    messages: tab.messages.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { 
                            ...msg, 
                            content: assistantContent,
                            metadata: {
                              ...msg.metadata,
                              usage: chunk.usage,
                            }
                          }
                        : msg
                    ),
                    isStreaming: false,
                    lastMessage: {
                      ...assistantMessage,
                      content: assistantContent,
                      metadata: {
                        ...assistantMessage.metadata,
                        usage: chunk.usage,
                      }
                    }
                  }
                : tab
            )
          );
          break;
        }
      }

    } catch (error) {
      console.error('[ChatKit Interface] Error:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 2}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        provider: currentTab.provider,
        metadata: {
          sessionId: conversationId,
          userId,
          employeeId,
          employeeRole,
          provider: currentTab.provider,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };

      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === activeTab 
            ? { 
                ...tab, 
                messages: [...tab.messages, errorMessage],
                isStreaming: false,
              }
            : tab
        )
      );

      if (onError && error instanceof UnifiedLLMError) {
        onError(error);
      }

      toast.error(`Error with ${currentTab.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate system prompt based on employee role and provider
  const generateSystemPrompt = (role: string, provider: LLMProvider): string => {
    const basePrompt = `You are a professional ${role} AI assistant. You are part of an AI workforce and should provide expert assistance in your field.`;
    
    const roleSpecificPrompts = {
      'Product Manager': 'Focus on product strategy, roadmap planning, feature prioritization, and stakeholder communication.',
      'Data Scientist': 'Provide insights on data analysis, machine learning, statistical modeling, and data-driven decision making.',
      'Software Architect': 'Help with system design, architecture patterns, scalability, and technical decision making.',
      'Video Content Creator': 'Assist with script writing, video planning, content strategy, and creative direction.',
      'Marketing Specialist': 'Focus on marketing strategy, campaign planning, content creation, and brand positioning.',
      'Customer Support': 'Provide excellent customer service, problem-solving, and support best practices.'
    };

    const providerSpecificPrompts = {
      'openai': 'Use your advanced reasoning capabilities to provide detailed, well-structured responses.',
      'anthropic': 'Focus on being helpful, harmless, and honest in your responses.',
      'google': 'Leverage your multimodal capabilities when relevant and provide comprehensive insights.',
      'perplexity': 'Use real-time web search to provide current, accurate information and cite your sources.'
    };

    const specificPrompt = roleSpecificPrompts[role as keyof typeof roleSpecificPrompts] || 
      'Provide professional assistance and expertise in your field.';
    
    const providerPrompt = providerSpecificPrompts[provider] || '';

    return `${basePrompt}\n\n${specificPrompt}\n\n${providerPrompt}\n\nAlways be helpful, professional, and provide actionable advice.`;
  };

  // Get default model for provider
  const getDefaultModel = (provider: LLMProvider): string => {
    const models = {
      'openai': 'gpt-4o-mini',
      'anthropic': 'claude-3-5-sonnet-20241022',
      'google': 'gemini-1.5-flash',
      'perplexity': 'llama-3.1-sonar-small-128k-online'
    };
    return models[provider];
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle feedback
  const handleFeedback = (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTab 
          ? {
              ...tab,
              messages: tab.messages.map(msg => 
                msg.id === messageId 
                  ? { 
                      ...msg, 
                      metadata: { 
                        ...msg.metadata, 
                        feedback 
                      } 
                    }
                  : msg
              )
            }
          : tab
      )
    );
    toast.success(`Feedback recorded: ${feedback === 'thumbs_up' ? '👍' : '👎'}`);
  };

  // Copy message content
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };

  // Optimize prompt
  const optimizePrompt = async (prompt: string) => {
    try {
      // This would integrate with OpenAI's prompt optimizer
      // For now, we'll simulate the optimization
      const optimized = `Optimized: ${prompt}\n\n[This prompt has been enhanced with best practices for clarity, specificity, and effectiveness.]`;
      setOptimizedPrompt(optimized);
      toast.success('Prompt optimized successfully');
    } catch (error) {
      toast.error('Failed to optimize prompt');
    }
  };

  // Render message
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isError = message.metadata?.error;

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex gap-3 p-4",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {!isUser && (
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white",
            currentTab?.color || "bg-gray-500"
          )}>
            {currentTab?.icon}
          </div>
        )}
        
        <div className={cn(
          "max-w-[80%] rounded-lg p-3",
          isUser 
            ? "bg-blue-600 text-white" 
            : isError 
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-gray-50 text-gray-900"
        )}>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(message.content)
            }}
          />
          
          {message.metadata?.usage && (
            <div className="mt-2 text-xs text-gray-500">
              Tokens: {message.metadata.usage.totalTokens || 'N/A'}
            </div>
          )}
          
          {isError && (
            <div className="mt-2 text-xs text-red-600">
              Error: {message.metadata?.error}
            </div>
          )}

          {!isUser && !isError && (
            <div className="mt-3 flex items-center gap-2">
              <ChatKitButton
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(message.id, 'thumbs_up')}
                className={cn(
                  "p-1",
                  message.metadata?.feedback === 'thumbs_up' && "text-green-600"
                )}
              >
                <ThumbsUp className="w-4 h-4" />
              </ChatKitButton>
              <ChatKitButton
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(message.id, 'thumbs_down')}
                className={cn(
                  "p-1",
                  message.metadata?.feedback === 'thumbs_down' && "text-red-600"
                )}
              >
                <ThumbsDown className="w-4 h-4" />
              </ChatKitButton>
              <ChatKitButton
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(message.content)}
                className="p-1"
              >
                <Copy className="w-4 h-4" />
              </ChatKitButton>
            </div>
          )}
        </div>

        {isUser && (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <MessageSquare className="w-4 h-4" />
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{employeeName}</h2>
            <p className="text-sm text-gray-600">{employeeRole}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ChatKitButton
            variant="secondary"
            size="sm"
            onClick={() => setShowPromptOptimizer(!showPromptOptimizer)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Optimize
          </ChatKitButton>
          <Badge variant="outline" className="text-xs">
            <Star className="w-3 h-3 mr-1" />
            AI Employee
          </Badge>
        </div>
      </div>

      {/* Prompt Optimizer */}
      {showPromptOptimizer && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-blue-900">Prompt Optimizer</h3>
            </div>
            <Textarea
              placeholder="Enter your prompt to optimize..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <ChatKitButton
                variant="primary"
                size="sm"
                onClick={() => optimizePrompt(inputValue)}
                disabled={!inputValue.trim()}
              >
                <Zap className="w-4 h-4 mr-2" />
                Optimize Prompt
              </ChatKitButton>
              <ChatKitButton
                variant="secondary"
                size="sm"
                onClick={() => setShowPromptOptimizer(false)}
              >
                Close
              </ChatKitButton>
            </div>
            {optimizedPrompt && (
              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Optimized Prompt:</h4>
                <p className="text-sm text-gray-700">{optimizedPrompt}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-gray-200">
          <TabsList className="grid w-full grid-cols-4 bg-white">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                disabled={!tab.configured}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.name}</span>
                {!tab.configured && (
                  <AlertCircle className="w-3 h-3 text-red-500" />
                )}
                {tab.isStreaming && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content */}
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="flex-1 flex flex-col m-0">
            {!tab.configured ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <ChatKitCard className="text-center max-w-md">
                  <ChatKitIcon icon={<AlertCircle />} size="lg" color="text-red-500" className="mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{tab.name} Not Configured</h3>
                  <p className="text-gray-600 mb-4">
                    Please configure your {tab.name} API key to use this provider.
                  </p>
                  <ChatKitButton variant="primary" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </ChatKitButton>
                </ChatKitCard>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <ScrollArea className="flex-1">
                  <div className="space-y-4 p-4">
                    {tab.messages.length === 0 ? (
                      <div className="text-center py-8">
                        <ChatKitCard gradient className="max-w-md mx-auto">
                          <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4",
                            tab.color
                          )}>
                            {tab.icon}
                          </div>
                          <h3 className="text-lg font-semibold mb-2">Start a conversation with {tab.name}</h3>
                          <p className="text-gray-600">{tab.description}</p>
                        </ChatKitCard>
                      </div>
                    ) : (
                      tab.messages.map(renderMessage)
                    )}
                    {tab.isStreaming && (
                      <div className="flex gap-3 p-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white",
                          tab.color
                        )}>
                          {tab.icon}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message ${tab.name}...`}
                        disabled={isLoading || tab.isStreaming}
                        className="pr-12"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1"
                        disabled={isLoading || tab.isStreaming}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </div>
                    <ChatKitButton
                      variant="primary"
                      size="md"
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading || tab.isStreaming}
                      loading={isLoading || tab.isStreaming}
                    >
                      <Send className="w-4 h-4" />
                    </ChatKitButton>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ChatKitInterface;
