/**
 * AgentChatUI - Advanced AI Agent Interface
 * Implements OpenAI's Custom ChatKit design patterns
 * Features: streaming, tools, multi-agent orchestration, rich message types
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Settings,
  Bot,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  Search,
  Code,
  Image,
  FileText,
  Sparkles,
  Zap,
  Brain,
  Globe,
  Wrench,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash2,
  Edit,
  Star,
  StarOff,
  Circle,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { useTheme } from '@/components/theme-provider';
import { agentChatService, type AgentConfig, type Message } from '@/services/agent-chat-service';

// Types

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'code';
  url?: string;
  content?: string;
  size?: number;
}

interface ToolAction {
  id: string;
  name: string;
  description: string;
  parameters: any;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
}

interface AgentChatUIProps {
  conversationId: string;
  userId: string;
  agentConfig: AgentConfig;
  className?: string;
  onSessionCreated?: (session: any) => void;
  onError?: (error: Error) => void;
}

// Icon Component matching ChatKit design
const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    agent: Bot,
    analytics: Brain,
    atom: Sparkles,
    batch: Zap,
    bolt: Zap,
    'book-open': FileText,
    'book-closed': FileText,
    'book-clock': Clock,
    bug: AlertCircle,
    calendar: Clock,
    chart: Brain,
    check: CheckCircle,
    'check-circle': CheckCircle,
    'check-circle-filled': CheckCircle,
    'chevron-left': ChevronDown,
    'chevron-right': ChevronDown,
    'circle-question': AlertCircle,
    compass: Globe,
    confetti: Sparkles,
    cube: Bot,
    desktop: Bot,
    document: FileText,
    'dots-horizontal': MoreHorizontal,
    'dots-vertical': MoreHorizontal,
    'empty-circle': Circle,
    'external-link': ExternalLink,
    globe: Globe,
    keys: Settings,
    lab: Wrench,
    images: Image,
    info: AlertCircle,
    lifesaver: AlertCircle,
    lightbulb: Sparkles,
    mail: FileText,
    'map-pin': Globe,
    maps: Globe,
    mobile: Bot,
    name: User,
    notebook: FileText,
    'notebook-pencil': Edit,
    'page-blank': FileText,
    phone: Bot,
    play: Play,
    plus: Plus,
    profile: User,
    'profile-card': User,
    reload: RotateCcw,
    star: Star,
    'star-filled': Star,
    search: Search,
    sparkle: Sparkles,
    'sparkle-double': Sparkles,
    'square-code': Code,
    'square-image': Image,
    'square-text': FileText,
    suitcase: FileText,
    'settings-slider': Settings,
    user: User,
    wreath: Star,
    write: Edit,
    'write-alt': Edit,
    'write-alt2': Edit,
  };

  const IconComponent = iconMap[name] || Bot;
  return <IconComponent className={className} />;
};

// Button Component matching ChatKit design
interface ButtonProps {
  label?: string;
  color?: 'primary' | 'secondary';
  submit?: boolean;
  onClickAction?: () => void;
  iconStart?: string;
  iconEnd?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const ChatKitButton: React.FC<ButtonProps> = ({
  label,
  color = 'primary',
  submit = false,
  onClickAction,
  iconStart,
  iconEnd,
  disabled = false,
  loading = false,
  className,
  children,
}) => {
  const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const colorClasses = {
    primary: "bg-black text-white hover:bg-gray-800 focus:ring-gray-500",
    secondary: "bg-white text-black border border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
  };

  return (
    <button
      type={submit ? 'submit' : 'button'}
      onClick={onClickAction}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        colorClasses[color],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {iconStart && <Icon name={iconStart} className="w-4 h-4 mr-2" />}
      {children || label}
      {iconEnd && <Icon name={iconEnd} className="w-4 h-4 ml-2" />}
    </button>
  );
};

// Message Item Component
const MessageItem: React.FC<{
  message: Message;
  isStreaming?: boolean;
  onToolAction?: (action: ToolAction) => void;
}> = ({ message, isStreaming = false, onToolAction }) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const renderContent = () => {
    if (message.role === 'user') {
      return (
        <div className="prose prose-sm max-w-none">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      );
    }

    if (message.role === 'assistant') {
      return (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeHighlight]}
            components={{
              h1: ({ children }) => <h1 className={cn("text-lg font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>{children}</h1>,
              h2: ({ children }) => <h2 className={cn("text-base font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>{children}</h2>,
              h3: ({ children }) => <h3 className={cn("text-sm font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>{children}</h3>,
              p: ({ children }) => <p className={cn("text-sm mb-2", isDark ? "text-gray-200" : "text-gray-700")}>{children}</p>,
              code: ({ children, className, inline }) => {
                if (inline) {
                  return <code className={cn("px-1.5 py-0.5 rounded text-xs font-mono", isDark ? "bg-gray-700 text-green-400" : "bg-gray-100 text-green-600")}>{children}</code>;
                }
                return (
                  <pre className={cn("p-3 rounded-lg overflow-x-auto mb-2", isDark ? "bg-gray-900 border border-gray-700" : "bg-gray-50 border border-gray-300")}>
                    <code className={cn("text-xs font-mono", isDark ? "text-green-400" : "text-green-600")}>{children}</code>
                  </pre>
                );
              },
              ul: ({ children }) => <ul className={cn("list-disc list-inside mb-2 text-sm", isDark ? "text-gray-200" : "text-gray-700")}>{children}</ul>,
              ol: ({ children }) => <ol className={cn("list-decimal list-inside mb-2 text-sm", isDark ? "text-gray-200" : "text-gray-700")}>{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className={cn("border-l-4 border-blue-500 pl-3 italic mb-2 text-sm", isDark ? "text-gray-300 bg-gray-800/50" : "text-gray-600 bg-gray-100/50")}>
                  {children}
                </blockquote>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("underline", isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500")}
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      );
    }

    if (message.role === 'tool' && message.metadata?.tool) {
      const tool = message.metadata.tool;
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Tool: {tool.name}</span>
            <Badge variant={tool.status === 'completed' ? 'default' : 'secondary'}>
              {tool.status}
            </Badge>
          </div>
          
          {tool.parameters && (
            <div className="text-xs text-gray-600">
              <strong>Parameters:</strong> {JSON.stringify(tool.parameters, null, 2)}
            </div>
          )}
          
          {tool.result && (
            <div className="text-sm">
              <strong>Result:</strong> {JSON.stringify(tool.result, null, 2)}
            </div>
          )}
        </div>
      );
    }

    return <div className="text-sm">{message.content}</div>;
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      case 'sent':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'streaming':
        return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 p-4",
        message.role === 'user' ? "justify-end" : "justify-start"
      )}
    >
      {message.role !== 'user' && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Icon name="agent" className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={cn(
        "max-w-[80%] rounded-lg p-3",
        message.role === 'user' 
          ? "bg-blue-500 text-white" 
          : isDark 
            ? "bg-gray-800 text-gray-100" 
            : "bg-white text-gray-900 border border-gray-200"
      )}>
        {renderContent()}
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-xs opacity-70">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
          
          {message.metadata?.tokens && (
            <span className="text-xs opacity-70">
              {message.metadata.tokens} tokens
            </span>
          )}
        </div>
      </div>
      
      {message.role === 'user' && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
};

// Composer Component
const Composer: React.FC<{
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
}> = ({ onSendMessage, disabled = false, placeholder = "Type your message..." }) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !disabled) {
      onSendMessage(content.trim(), attachments);
      setContent('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const attachment: Attachment = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          size: file.size,
        };
        setAttachments(prev => [...prev, attachment]);
      });
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map(attachment => (
            <Badge key={attachment.id} variant="secondary" className="flex items-center gap-1">
              <Icon name={attachment.type === 'image' ? 'images' : 'document'} className="w-3 h-3" />
              {attachment.name}
              <button
                onClick={() => setAttachments(prev => prev.filter(a => a.id !== attachment.id))}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>
        
        <div className="flex gap-1">
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="file-upload">
            <ChatKitButton
              iconStart="document"
              color="secondary"
              className="p-2"
            />
          </label>
          
          <ChatKitButton
            iconStart={isRecording ? "mic-off" : "mic"}
            color="secondary"
            onClickAction={() => setIsRecording(!isRecording)}
            className="p-2"
          />
          
          <ChatKitButton
            iconStart="send"
            color="primary"
            submit
            disabled={!content.trim() || disabled}
            className="p-2"
          />
        </div>
      </form>
    </div>
  );
};

// Tool Panel Component
const ToolPanel: React.FC<{
  tools: string[];
  onToolInvoke?: (toolName: string, parameters: any) => void;
  className?: string;
}> = ({ tools, onToolInvoke, className }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("border-t border-gray-200", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">Available Tools</span>
          <Badge variant="secondary">{tools?.length || 0}</Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {(tools || []).map(tool => (
                <div key={tool} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Icon name="wrench" className="w-4 h-4 text-gray-500" />
                    <span className="text-sm capitalize">{tool.replace('_', ' ')}</span>
                  </div>
                  <ChatKitButton
                    label="Invoke"
                    color="secondary"
                    size="sm"
                    onClickAction={() => onToolInvoke?.(tool, {})}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main AgentChatUI Component
const AgentChatUI: React.FC<AgentChatUIProps> = ({
  conversationId,
  userId,
  agentConfig,
  className,
  onSessionCreated,
  onError,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        setIsLoading(true);
        
        // Load existing messages
        const existingMessages = await agentChatService.getMessages(conversationId);
        
        if (existingMessages.length === 0) {
          // Create initial system message for new conversations
          const systemMessage: Message = {
            id: 'system-1',
            role: 'system',
            content: `You are ${agentConfig.name}, a professional AI agent. ${agentConfig.persona}`,
            timestamp: new Date(),
            status: 'sent',
          };
          
          setMessages([systemMessage]);
        } else {
          setMessages(existingMessages);
        }
        
        // Create session
        const session = {
          id: conversationId,
          agentId: agentConfig.id,
          userId,
          config: agentConfig,
          createdAt: new Date(),
        };
        
        onSessionCreated?.(session);
        
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConversation();
  }, [conversationId, userId, agentConfig, onSessionCreated, onError]);

  // Send message
  const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sending',
      metadata: { attachments },
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    try {
      if (agentConfig.streaming) {
        // Use streaming
        await agentChatService.streamMessage(
          conversationId,
          content,
          agentConfig,
          (chunk) => {
            if (chunk.type === 'start') {
              // Message started streaming
              setMessages(prev => [...prev, {
                id: chunk.messageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                status: 'streaming',
                metadata: { model: agentConfig.model },
              }]);
            } else if (chunk.type === 'content') {
              // Append content
              setMessages(prev => prev.map(msg => 
                msg.id === chunk.messageId 
                  ? { ...msg, content: msg.content + chunk.content }
                  : msg
              ));
            }
          },
          (message) => {
            // Message complete
            setMessages(prev => prev.map(msg => 
              msg.id === message.id 
                ? { ...message, status: 'sent' }
                : msg
            ));
            setIsStreaming(false);
          },
          (error) => {
            setError(error.message);
            onError?.(error);
            setIsStreaming(false);
          }
        );
      } else {
        // Use non-streaming
        const agentMessage = await agentChatService.sendMessage(
          conversationId,
          content,
          agentConfig,
          attachments
        );
        
        setMessages(prev => [...prev, agentMessage]);
        setIsStreaming(false);
      }

    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
      setIsStreaming(false);
    }
  };

  // Handle tool invocation
  const handleToolInvoke = async (toolName: string, parameters: any) => {
    const toolMessage: Message = {
      id: `tool-${Date.now()}`,
      role: 'tool',
      content: `Invoking tool: ${toolName}`,
      timestamp: new Date(),
      status: 'sending',
      metadata: {
        tool: {
          name: toolName,
          parameters,
          status: 'running',
        },
      },
    };

    setMessages(prev => [...prev, toolMessage]);

    try {
      const toolExecution = await agentChatService.invokeTool(
        conversationId,
        toolName,
        parameters
      );

      // Update message with result
      setMessages(prev => prev.map(msg => 
        msg.id === toolMessage.id 
          ? {
              ...msg,
              status: 'sent',
              metadata: {
                ...msg.metadata,
                tool: {
                  ...msg.metadata?.tool!,
                  status: toolExecution.status,
                  result: toolExecution.result,
                },
              },
            }
          : msg
      ));

    } catch (err) {
      const error = err as Error;
      
      // Update message with error
      setMessages(prev => prev.map(msg => 
        msg.id === toolMessage.id 
          ? {
              ...msg,
              status: 'error',
              metadata: {
                ...msg.metadata,
                tool: {
                  ...msg.metadata?.tool!,
                  status: 'error',
                  result: { error: error.message },
                },
              },
            }
          : msg
      ));
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <ChatKitButton
              label="Retry"
              iconStart="reload"
              onClickAction={() => window.location.reload()}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
              <Icon name="agent" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{agentConfig.name}</h2>
              <p className="text-sm text-gray-600">{agentConfig.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">{agentConfig.model}</Badge>
            {agentConfig.streaming && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Streaming
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {(messages || []).map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isStreaming={isStreaming && message.role === 'assistant'}
            />
          ))}
          
          {isStreaming && (
            <div className="flex gap-3 p-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                <Icon name="agent" className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">Agent is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Tool Panel */}
      <ToolPanel
        tools={agentConfig.tools}
        onToolInvoke={handleToolInvoke}
      />

      {/* Composer */}
      <Composer
        onSendMessage={handleSendMessage}
        disabled={isLoading || isStreaming}
        placeholder={`Message ${agentConfig.name}...`}
      />
    </div>
  );
};

export default AgentChatUI;
