/**
 * Agent Chat UI Component
 * Modern chat interface for OpenAI Agents SDK with tool execution and streaming
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Send,
  Bot,
  User,
  Loader2,
  Settings,
  Code,
  Search,
  FileText,
  Database,
  Globe,
  Zap,
  Copy,
  Check,
  RefreshCw,
  Square,
  Play,
  Wrench,
  Sparkles,
  Brain,
  Info,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  openAIAgentsService,
  type Message,
  type UserContext,
} from '@/services/openai-agents-service';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AgentChatUIProps {
  sessionId: string;
  userId: string;
  agentName: string;
  agentRole: string;
  agentCapabilities: string[];
  className?: string;
  onError?: (error: Error) => void;
  onSessionEnd?: () => void;
}

interface ToolExecution {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: any;
  output?: any;
  error?: string;
  timestamp: Date;
}

interface ConversationTopic {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const conversationTopics: ConversationTopic[] = [
  { value: 'general', label: 'General', icon: MessageSquare },
  { value: 'code', label: 'Code', icon: Code },
  { value: 'research', label: 'Research', icon: Search },
  { value: 'data', label: 'Data Analysis', icon: Database },
  { value: 'files', label: 'File Operations', icon: FileText },
  { value: 'web', label: 'Web Search', icon: Globe },
];

const AgentChatUI: React.FC<AgentChatUIProps> = ({
  sessionId,
  userId,
  agentName,
  agentRole,
  agentCapabilities,
  className,
  onError,
  onSessionEnd,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const [currentTopic, setCurrentTopic] = useState('general');
  const [showSettings, setShowSettings] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = openAIAgentsService.getConversationHistory(sessionId);
        setMessages(history);
      } catch (error) {
        console.error('Failed to load conversation history:', error);
      }
    };

    loadHistory();
  }, [sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isLoading || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setToolExecutions([]);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      // Create user context
      const context: UserContext = {
        userId,
        isProUser: true,
        metadata: {
          topic: currentTopic,
        },
      };

      // Check if we should stream or not
      const shouldStream = agentCapabilities.includes('streaming');

      if (shouldStream) {
        setIsStreaming(true);
        let fullResponse = '';
        const tempAssistantMessage: Message = {
          id: `temp-assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          agentName,
        };
        setMessages(prev => [...prev, tempAssistantMessage]);

        // Stream the response
        const stream = openAIAgentsService.streamMessage(
          sessionId,
          userMessage,
          context
        );

        for await (const chunk of stream) {
          fullResponse += chunk;
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content = fullResponse;
            }
            return updated;
          });
        }
        setIsStreaming(false);
      } else {
        // Non-streaming response
        const response = await openAIAgentsService.sendMessage(
          sessionId,
          userMessage,
          context
        );
        setMessages(prev => [...prev, response]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      onError?.(error as Error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Copy message to clipboard
  const copyToClipboard = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Toggle tool expansion
  const toggleToolExpansion = (toolId: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    if (messages.length < 2) return;

    const lastUserMessage = [...messages]
      .reverse()
      .find(m => m.role === 'user');
    if (!lastUserMessage) return;

    // Remove last assistant message
    setMessages(prev => {
      const filtered = prev.filter((_, index) => index !== prev.length - 1);
      return filtered;
    });

    // Resend the last user message
    setInput(lastUserMessage.content);
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  // Handle stop streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // Get tool icon
  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'web_search':
        return Globe;
      case 'code_interpreter':
        return Code;
      case 'data_analysis':
        return Database;
      case 'file_operations':
        return FileText;
      default:
        return Wrench;
    }
  };

  // Get tool status color
  const getToolStatusColor = (status: ToolExecution['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-gray-50 dark:bg-[#0d0e11]',
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-[#171717]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {agentName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {agentRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={currentTopic} onValueChange={setCurrentTopic}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conversationTopics.map(topic => {
                  const Icon = topic.icon;
                  return (
                    <SelectItem key={topic.value} value={topic.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {topic.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-400 to-pink-500">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Start a Conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Ask {agentName} anything. They're ready to help!
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600">
                      <Bot className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    'max-w-xl rounded-lg px-4 py-3',
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div>
                      <ReactMarkdown
                        className={cn(
                          'prose prose-sm max-w-none',
                          'prose-p:mb-2 prose-p:mt-0',
                          'prose-pre:bg-gray-900 prose-pre:text-gray-100',
                          'dark:prose-invert'
                        )}
                        components={{
                          code({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }) {
                            const match = /language-(\w+)/.exec(
                              className || ''
                            );
                            return !inline && match ? (
                              <SyntaxHighlighter
                                language={match[1]}
                                style={vscDarkPlus}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code
                                className="rounded bg-gray-100 px-1 py-0.5 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>

                      {/* Tool executions */}
                      {message.metadata?.toolsUsed &&
                        message.metadata.toolsUsed.length > 0 && (
                          <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                            <div className="mb-2 flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Tools Used:
                              </span>
                            </div>
                            <div className="space-y-2">
                              {message.metadata.toolsUsed.map(
                                (tool, toolIndex) => {
                                  const Icon = getToolIcon(tool);
                                  const toolExecution = toolExecutions.find(
                                    te => te.name === tool
                                  );
                                  const isExpanded = expandedTools.has(
                                    `${message.id}-${tool}`
                                  );

                                  return (
                                    <div
                                      key={toolIndex}
                                      className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50"
                                    >
                                      <button
                                        onClick={() =>
                                          toggleToolExpansion(
                                            `${message.id}-${tool}`
                                          )
                                        }
                                        className="flex w-full items-center gap-2 text-left"
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="h-3 w-3 text-gray-500" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3 text-gray-500" />
                                        )}
                                        <Icon className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium capitalize">
                                          {tool.replace('_', ' ')}
                                        </span>
                                        {toolExecution && (
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              'ml-auto text-xs',
                                              getToolStatusColor(
                                                toolExecution.status
                                              )
                                            )}
                                          >
                                            {toolExecution.status}
                                          </Badge>
                                        )}
                                      </button>

                                      {isExpanded && toolExecution && (
                                        <div className="mt-2 space-y-2 pl-9">
                                          {toolExecution.input && (
                                            <div className="text-xs">
                                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                                Input:
                                              </span>
                                              <pre className="mt-1 overflow-x-auto rounded border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                                                {JSON.stringify(
                                                  toolExecution.input,
                                                  null,
                                                  2
                                                )}
                                              </pre>
                                            </div>
                                          )}
                                          {toolExecution.output && (
                                            <div className="text-xs">
                                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                                Output:
                                              </span>
                                              <pre className="mt-1 overflow-x-auto rounded border border-gray-200 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                                                {JSON.stringify(
                                                  toolExecution.output,
                                                  null,
                                                  2
                                                )}
                                              </pre>
                                            </div>
                                          )}
                                          {toolExecution.error && (
                                            <div className="text-xs">
                                              <span className="font-medium text-red-600">
                                                Error:
                                              </span>
                                              <p className="mt-1 text-red-500">
                                                {toolExecution.error}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}

                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(message.id, message.content)
                          }
                          className="h-7 text-xs"
                        >
                          {copiedMessageId === message.id ? (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1 h-3 w-3" />
                              Copy
                            </>
                          )}
                        </Button>

                        {index === messages.length - 1 && !isStreaming && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRegenerate}
                            className="h-7 text-xs"
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Regenerate
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))
          )}

          {isStreaming && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Agent is thinking...</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStopStreaming}
                className="ml-2"
              >
                <Square className="mr-1 h-3 w-3" />
                Stop
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-[#171717]">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Ask ${agentName} anything...`}
            disabled={isLoading || isStreaming}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || isStreaming}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
          >
            {isLoading || isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Capabilities */}
        <div className="mx-auto mt-3 flex max-w-3xl flex-wrap gap-2">
          {agentCapabilities.slice(0, 5).map((capability, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {capability}
            </Badge>
          ))}
          {agentCapabilities.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{agentCapabilities.length - 5} more
            </Badge>
          )}
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent Settings</DialogTitle>
            <DialogDescription>
              Configure {agentName}'s behavior and capabilities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <h4 className="mb-2 text-sm font-medium">Model</h4>
              <Badge>GPT-4o</Badge>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">Capabilities</h4>
              <div className="flex flex-wrap gap-2">
                {agentCapabilities.map((capability, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">Session Info</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>Session ID: {sessionId}</p>
                <p>Messages: {messages.length}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onSessionEnd?.();
                setShowSettings(false);
              }}
            >
              End Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentChatUI;
