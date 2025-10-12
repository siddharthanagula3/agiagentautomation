/**
 * Tabbed LLM Chat Interface
 * Provides tabs for different LLM providers (Anthropic, OpenAI, Google, Perplexity)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Paperclip,
  Loader2,
  CheckCircle,
  XCircle,
  Wrench,
  Webhook,
  Bot,
  Sparkles,
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
  Zap,
  Brain,
  Globe,
  MessageSquare,
  Settings,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { TokenUsageWarning } from './TokenUsageWarning';
import {
  unifiedLLMService,
  UnifiedMessage,
  UnifiedResponse,
  LLMProvider,
  UnifiedLLMError,
} from '@/services/llm-providers/unified-llm-service';

interface TabbedLLMChatInterfaceProps {
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

const TabbedLLMChatInterface: React.FC<TabbedLLMChatInterfaceProps> = ({
  conversationId,
  userId,
  employeeId,
  employeeRole,
  employeeName,
  className,
  onSessionCreated,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState<string>('openai');
  const [tabs, setTabs] = useState<ChatTab[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize tabs
  useEffect(() => {
    const initialTabs: ChatTab[] = [
      {
        id: 'openai',
        provider: 'openai',
        name: 'ChatGPT',
        icon: <Brain className="h-4 w-4" />,
        color: 'bg-green-500',
        description: 'OpenAI GPT models with advanced reasoning',
        configured: unifiedLLMService.isProviderConfigured('openai'),
        messages: [],
        isStreaming: false,
      },
      {
        id: 'anthropic',
        provider: 'anthropic',
        name: 'Claude',
        icon: <Sparkles className="h-4 w-4" />,
        color: 'bg-orange-500',
        description: 'Anthropic Claude with safety and helpfulness',
        configured: unifiedLLMService.isProviderConfigured('anthropic'),
        messages: [],
        isStreaming: false,
      },
      {
        id: 'google',
        provider: 'google',
        name: 'Gemini',
        icon: <Globe className="h-4 w-4" />,
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
        icon: <Search className="h-4 w-4" />,
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
        tab.id === activeTab ? { ...tab, isStreaming: true } : tab
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
      const systemPrompt = generateSystemPrompt(
        employeeRole,
        currentTab.provider
      );

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
                            },
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
                      },
                    },
                  }
                : tab
            )
          );
          break;
        }
      }
    } catch (error) {
      console.error('[Tabbed LLM Chat] Error:', error);

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

      toast.error(
        `Error with ${currentTab.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Generate system prompt based on employee role and provider
  const generateSystemPrompt = (
    role: string,
    provider: LLMProvider
  ): string => {
    const basePrompt = `You are a professional ${role} AI assistant. You are part of an AI workforce and should provide expert assistance in your field.`;

    const roleSpecificPrompts = {
      'Product Manager':
        'Focus on product strategy, roadmap planning, feature prioritization, and stakeholder communication.',
      'Data Scientist':
        'Provide insights on data analysis, machine learning, statistical modeling, and data-driven decision making.',
      'Software Architect':
        'Help with system design, architecture patterns, scalability, and technical decision making.',
      'Video Content Creator':
        'Assist with script writing, video planning, content strategy, and creative direction.',
      'Marketing Specialist':
        'Focus on marketing strategy, campaign planning, content creation, and brand positioning.',
      'Customer Support':
        'Provide excellent customer service, problem-solving, and support best practices.',
    };

    const providerSpecificPrompts = {
      openai:
        'Use your advanced reasoning capabilities to provide detailed, well-structured responses.',
      anthropic:
        'Focus on being helpful, harmless, and honest in your responses.',
      google:
        'Leverage your multimodal capabilities when relevant and provide comprehensive insights.',
      perplexity:
        'Use real-time web search to provide current, accurate information and cite your sources.',
    };

    const specificPrompt =
      roleSpecificPrompts[role as keyof typeof roleSpecificPrompts] ||
      'Provide professional assistance and expertise in your field.';

    const providerPrompt = providerSpecificPrompts[provider] || '';

    return `${basePrompt}\n\n${specificPrompt}\n\n${providerPrompt}\n\nAlways be helpful, professional, and provide actionable advice.`;
  };

  // Get default model for provider
  const getDefaultModel = (provider: LLMProvider): string => {
    const models = {
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-5-sonnet-20241022',
      google: 'gemini-1.5-flash',
      perplexity: 'llama-3.1-sonar-small-128k-online',
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
          'flex gap-3 p-4',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {!isUser && (
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-white',
              currentTab?.color || 'bg-gray-500'
            )}
          >
            {currentTab?.icon}
          </div>
        )}

        <div
          className={cn(
            'max-w-[80%] rounded-lg p-3',
            isUser
              ? 'bg-primary text-primary-foreground'
              : isError
                ? 'border border-destructive/20 bg-destructive/10 text-destructive'
                : 'bg-muted'
          )}
        >
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(message.content),
            }}
          />

          {message.metadata?.usage && (
            <div className="mt-2 text-xs text-muted-foreground">
              Tokens: {message.metadata.usage.totalTokens || 'N/A'}
            </div>
          )}

          {isError && (
            <div className="mt-2 text-xs text-destructive">
              Error: {message.metadata?.error}
            </div>
          )}
        </div>

        {isUser && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <MessageSquare className="h-4 w-4" />
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-blue-500">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">{employeeName}</h2>
            <p className="text-sm text-muted-foreground">{employeeRole}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Zap className="mr-1 h-3 w-3" />
            Multi-LLM
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col"
      >
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
                disabled={!tab.configured}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.name}</span>
                {!tab.configured && (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                )}
                {tab.isStreaming && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content */}
        {tabs.map(tab => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="m-0 flex flex-1 flex-col"
          >
            {!tab.configured ? (
              <div className="flex flex-1 items-center justify-center p-8">
                <div className="text-center">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    {tab.name} Not Configured
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    Please configure your {tab.name} API key to use this
                    provider.
                  </p>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {tab.messages.length === 0 ? (
                      <div className="py-8 text-center">
                        <div
                          className={cn(
                            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-white',
                            tab.color
                          )}
                        >
                          {tab.icon}
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">
                          Start a conversation with {tab.name}
                        </h3>
                        <p className="text-muted-foreground">
                          {tab.description}
                        </p>
                      </div>
                    ) : (
                      tab.messages.map(renderMessage)
                    )}
                    {tab.isStreaming && (
                      <div className="flex gap-3 p-4">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-white',
                            tab.color
                          )}
                        >
                          {tab.icon}
                        </div>
                        <div className="rounded-lg bg-muted p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Token Usage Warning */}
                <TokenUsageWarning
                  provider={tab.provider}
                  className="mx-4 mb-2"
                />

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Message ${tab.name}...`}
                      disabled={isLoading || tab.isStreaming}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        !inputValue.trim() || isLoading || tab.isStreaming
                      }
                      size="icon"
                    >
                      {isLoading || tab.isStreaming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
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

export default TabbedLLMChatInterface;
