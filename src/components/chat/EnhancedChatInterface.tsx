/**
 * Enhanced Chat Interface - Inspired by bolt.new and Cursor
 * Features: Assistant selector, Plan view, Thinking indicators, File support, Model selection
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bot,
  Send,
  Paperclip,
  X,
  Check,
  Loader2,
  Brain,
  Code,
  Search,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Circle,
  Play,
  Settings,
  Image as ImageIcon,
  FileText,
  Upload,
  Zap,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/components/theme-provider';
import { TokenUsageWarning } from './TokenUsageWarning';

// AI Assistant Types
interface AIAssistant {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic' | 'google' | 'perplexity';
  icon: React.ReactNode;
  color: string;
  models: string[];
  defaultModel: string;
  capabilities: string[];
  isActive?: boolean;
  isLegacy?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isThinking?: boolean;
  reasoning?: string;
  plan?: TodoItem[];
  attachments?: Attachment[];
  metadata?: {
    model?: string;
    provider?: string;
    usage?: any;
  };
}

interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  substeps?: TodoItem[];
}

interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

interface EnhancedChatInterfaceProps {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  provider: string;
  userId: string;
  className?: string;
}

const AI_ASSISTANTS: AIAssistant[] = [
  {
    id: 'claude-agent',
    name: 'Claude Agent',
    description: 'Advanced reasoning and code generation',
    provider: 'anthropic',
    icon: <Brain className="h-4 w-4" />,
    color: 'text-blue-500',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-5-sonnet-20241022',
    capabilities: ['reasoning', 'planning', 'coding', 'analysis'],
    isActive: true,
  },
  {
    id: 'codex',
    name: 'Codex',
    description: 'Specialized code generation and debugging',
    provider: 'openai',
    icon: <Code className="h-4 w-4" />,
    color: 'text-green-500',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    defaultModel: 'gpt-4o',
    capabilities: ['coding', 'debugging', 'refactoring'],
  },
  {
    id: 'gemini-agent',
    name: 'Gemini Pro',
    description: 'Multi-modal AI with vision capabilities',
    provider: 'google',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'text-purple-500',
    models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-2.0-flash-exp',
    capabilities: ['vision', 'reasoning', 'multimodal'],
  },
  {
    id: 'perplexity-agent',
    name: 'Perplexity Search',
    description: 'Real-time web search and research',
    provider: 'perplexity',
    icon: <Search className="h-4 w-4" />,
    color: 'text-orange-500',
    models: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online'],
    defaultModel: 'llama-3.1-sonar-large-128k-online',
    capabilities: ['search', 'research', 'real-time'],
  },
];

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  employeeId,
  employeeName,
  employeeRole,
  provider,
  userId,
  className,
}) => {
  const { actualTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant>(
    AI_ASSISTANTS.find(a => a.provider === provider) || AI_ASSISTANTS[0]
  );
  const [selectedModel, setSelectedModel] = useState(selectedAssistant.defaultModel);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlan, setShowPlan] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<TodoItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Handle assistant change
  const handleAssistantChange = (assistant: AIAssistant) => {
    setSelectedAssistant(assistant);
    setSelectedModel(assistant.defaultModel);
    toast.success(`Switched to ${assistant.name}`);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: attachments.map((file, idx) => ({
        id: `att-${idx}`,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        name: file.name,
        url: URL.createObjectURL(file),
        mimeType: file.type,
        size: file.size,
      })),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Simulate AI response with thinking and planning
      const thinkingMessage: ChatMessage = {
        id: `msg-${Date.now()}-thinking`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isThinking: true,
        isStreaming: true,
        metadata: {
          provider: selectedAssistant.provider,
          model: selectedModel,
        },
      };

      setMessages(prev => [...prev, thinkingMessage]);

      // Simulate thinking delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate plan
      const plan: TodoItem[] = [
        {
          id: 'step-1',
          content: 'Analyze the request',
          status: 'completed',
        },
        {
          id: 'step-2',
          content: 'Generate response',
          status: 'in_progress',
        },
        {
          id: 'step-3',
          content: 'Validate output',
          status: 'pending',
        },
      ];

      setCurrentPlan(plan);

      // Update message with plan
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessage.id
          ? { ...msg, plan, isThinking: false, reasoning: 'Processing your request...' }
          : msg
      ));

      // Simulate response generation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Final response
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: `As ${employeeName} (${employeeRole}), I understand your request. Here's my response:\n\n` +
                `I'm using ${selectedAssistant.name} with the ${selectedModel} model to provide you with the best assistance.\n\n` +
                `**Key Points:**\n` +
                `- Capability: ${selectedAssistant.capabilities.join(', ')}\n` +
                `- Provider: ${selectedAssistant.provider}\n` +
                `- Model: ${selectedModel}\n\n` +
                `How can I help you further?`,
        timestamp: new Date(),
        plan: plan.map(item => ({ ...item, status: 'completed' as const })),
        metadata: {
          provider: selectedAssistant.provider,
          model: selectedModel,
        },
      };

      // Remove thinking message and add final response
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id).concat(assistantMessage));
      setCurrentPlan(assistantMessage.plan || []);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Assistant Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {selectedAssistant.icon}
                <span className="font-medium">{selectedAssistant.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedAssistant.isActive && 'ACTIVE'}
                  {selectedAssistant.isLegacy && 'LEGACY'}
                </Badge>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel>Select AI Assistant</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {AI_ASSISTANTS.map((assistant) => (
                <DropdownMenuItem
                  key={assistant.id}
                  onClick={() => handleAssistantChange(assistant)}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer",
                    selectedAssistant.id === assistant.id && "bg-accent"
                  )}
                >
                  <div className={cn("mt-1", assistant.color)}>
                    {assistant.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{assistant.name}</span>
                      {assistant.isActive && (
                        <Badge variant="default" className="text-xs">ACTIVE</Badge>
                      )}
                      {assistant.isLegacy && (
                        <Badge variant="outline" className="text-xs">LEGACY</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {assistant.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {assistant.capabilities.map(cap => (
                        <Badge key={cap} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {selectedAssistant.id === assistant.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Model Selector */}
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectedAssistant.models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPlan(!showPlan)}
          >
            <Play className="h-4 w-4 mr-2" />
            {showPlan ? 'Hide' : 'Show'} Plan
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Token Usage Warning */}
          <div className="px-6 pt-4">
            <TokenUsageWarning 
              provider={selectedAssistant.provider}
            />
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 py-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    {selectedAssistant.icon && (
                      <div className={cn("w-8 h-8", selectedAssistant.color)}>
                        {React.cloneElement(selectedAssistant.icon as React.ReactElement, { className: "h-8 w-8" })}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Chat with {employeeName}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    I'm your {employeeRole} powered by {selectedAssistant.name}. 
                    Ask me anything!
                  </p>
                  <div className="flex flex-wrap gap-2 mt-6">
                    {selectedAssistant.capabilities.map(cap => (
                      <Badge key={cap} variant="outline">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    assistantName={employeeName}
                    assistantIcon={selectedAssistant.icon}
                    theme={actualTheme}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border bg-card/30 backdrop-blur-sm p-6">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg group"
                  >
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span className="text-sm">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Paperclip className="h-5 w-5" />
              </Button>

              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${employeeName}...`}
                  className="min-h-[60px] max-h-[200px] resize-none pr-12"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || (!input.trim() && attachments.length === 0)}
                  size="icon"
                  className="absolute bottom-2 right-2 h-8 w-8"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2 text-center">
              {selectedAssistant.name} can make mistakes. Verify important information.
            </p>
          </div>
        </div>

        {/* Plan Panel */}
        <AnimatePresence>
          {showPlan && currentPlan.length > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border bg-card/30 backdrop-blur-sm overflow-hidden"
            >
              <div className="p-6 h-full">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Plan
                </h3>
                <div className="space-y-3">
                  {currentPlan.map((item) => (
                    <PlanItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble: React.FC<{
  message: ChatMessage;
  assistantName: string;
  assistantIcon: React.ReactNode;
  theme: string;
}> = ({ message, assistantName, assistantIcon, theme }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex gap-4", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-primary" : "bg-accent"
      )}>
        {isUser ? (
          <span className="text-primary-foreground font-semibold">U</span>
        ) : (
          <div className="text-accent-foreground">{assistantIcon}</div>
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 space-y-2", isUser && "items-end")}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? 'You' : assistantName}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>

        {/* Thinking Indicator */}
        {message.isThinking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}

        {/* Reasoning */}
        {message.reasoning && !message.isThinking && (
          <div className="bg-accent/50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Brain className="h-3 w-3" />
              <span className="text-xs font-medium">Reasoning</span>
            </div>
            <p className="text-foreground">{message.reasoning}</p>
          </div>
        )}

        {/* Main Content */}
        {message.content && (
          <div className={cn(
            "rounded-lg px-4 py-3",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-accent text-accent-foreground"
          )}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={theme === 'dark' ? vscDarkPlus : vs}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={cn("px-1 py-0.5 rounded bg-muted", className)} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <div key={att.id} className="relative group">
                {att.type === 'image' ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="max-w-xs rounded-lg border border-border"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{att.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        {message.metadata && (
          <div className="text-xs text-muted-foreground">
            {message.metadata.model && `Model: ${message.metadata.model}`}
          </div>
        )}
      </div>
    </div>
  );
};

// Plan Item Component
const PlanItem: React.FC<{ item: TodoItem }> = ({ item }) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        {getStatusIcon()}
        <span className={cn(
          "text-sm flex-1",
          item.status === 'completed' && "line-through text-muted-foreground"
        )}>
          {item.content}
        </span>
      </div>
      {item.substeps && item.substeps.length > 0 && (
        <div className="ml-6 space-y-1">
          {item.substeps.map((substep) => (
            <PlanItem key={substep.id} item={substep} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedChatInterface;

