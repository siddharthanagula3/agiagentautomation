/**
 * Agent SDK ChatUI - OpenAI's Agent SDK Chat Interface
 * Follows OpenAI's design guidelines and best practices
 * Implements conversational flow, context awareness, and tool integration
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Textarea } from '@shared/ui/textarea';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Separator } from '@shared/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@shared/ui/dropdown-menu';
import {
  Bot,
  Send,
  Loader2,
  AlertCircle,
  Paperclip,
  Mic,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Sparkles,
  Zap,
  Code,
  FileText,
  Image as ImageIcon,
  Search,
  Settings,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Tool,
  Webhook,
  ExternalLink,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { useAuthStore } from '@shared/stores/unified-auth-store';

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    provider?: string;
    model?: string;
    tools?: string[];
    webhook?: string;
    sessionId?: string;
    userId?: string;
    error?: boolean;
    toolResults?: unknown[];
  };
}

interface AgentSDKChatUIProps {
  conversationId: string;
  userId: string;
  employeeId: string;
  employeeRole: string;
  employeeName: string;
  className?: string;
  onSessionCreated?: (session: unknown) => void;
  onError?: (error: unknown) => void;
}

export const AgentSDKChatUI: React.FC<AgentSDKChatUIProps> = ({
  conversationId,
  userId,
  employeeId,
  employeeRole,
  employeeName,
  className,
  onSessionCreated,
  onError,
}) => {
  // State management
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);

        // Create new agent session
        const response = await fetch('/.netlify/functions/agent-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            employeeId,
            employeeRole,
            employeeName,
            config: {
              provider: 'openai',
              model: 'gpt-4o-mini',
              temperature: 0.7,
              maxTokens: 4000,
              streaming: true,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create agent session');
        }

        const { session } = await response.json();
        setSessionId(session.id);

        // Add welcome message
        const welcomeMessage: AgentMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `Hello! I'm ${employeeName}, your ${employeeRole}. I'm here to help you with professional assistance in my field. How can I assist you today?`,
          timestamp: new Date(),
          metadata: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            sessionId: session.id,
            userId,
          },
        };

        setMessages([welcomeMessage]);
        onSessionCreated?.(session);

        toast.success(`Connected to ${employeeName}`);
      } catch (error) {
        console.error(
          '[Agent SDK ChatUI] Session initialization error:',
          error
        );
        onError?.(error);
        toast.error('Failed to initialize chat session');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [
    userId,
    employeeId,
    employeeRole,
    employeeName,
    onSessionCreated,
    onError,
  ]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !sessionId || isLoading) return;

    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      metadata: {
        sessionId,
        userId,
        attachments: attachments.length,
      },
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Send message through Agent SDK
      const response = await fetch('/.netlify/functions/agent-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
          userId,
          attachments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const { response: agentResponse } = await response.json();

      // Add assistant response
      const assistantMessage: AgentMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: agentResponse.content,
        timestamp: new Date(),
        metadata: {
          provider: agentResponse.provider,
          model: agentResponse.model,
          sessionId,
          userId,
          tools: agentResponse.tools?.map(t => t.name),
          webhook: agentResponse.webhook?.url,
          toolResults: agentResponse.toolResults,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show tool execution results if any
      if (agentResponse.tools && agentResponse.tools.length > 0) {
        toast.success(`Executed ${agentResponse.tools.length} tool(s)`);
      }
    } catch (error) {
      console.error('[Agent SDK ChatUI] Message sending error:', error);

      onError?.(error);

      // Add error message
      const errorMessage: AgentMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        metadata: {
          sessionId,
          userId,
          error: true,
        },
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setAttachments([]);
    }
  }, [inputValue, sessionId, isLoading, attachments, userId, onError]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file attachment
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Format message content
  const formatMessageContent = (content: string) => {
    // Sanitize HTML content
    const sanitized = DOMPurify.sanitize(content);

    // Convert markdown-like formatting to HTML
    return sanitized
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>'
      )
      .replace(/\n/g, '<br>');
  };

  // Get message icon
  const getMessageIcon = (message: AgentMessage) => {
    if (message.metadata?.error) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }

    if (message.role === 'user') {
      return <User className="h-5 w-5 text-blue-500" />;
    }

    return <Bot className="h-5 w-5 text-green-500" />;
  };

  // Get message status
  const getMessageStatus = (message: AgentMessage) => {
    if (message.metadata?.error) {
      return (
        <Badge variant="destructive" className="text-xs">
          Error
        </Badge>
      );
    }

    if (message.metadata?.tools?.length) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Tool className="mr-1 h-3 w-3" />
          {message.metadata.tools.length} tool(s)
        </Badge>
      );
    }

    if (message.metadata?.webhook) {
      return (
        <Badge variant="outline" className="text-xs">
          <Webhook className="mr-1 h-3 w-3" />
          Webhook
        </Badge>
      );
    }

    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  // Copy message content
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };

  if (isLoading && !sessionId) {
    return (
      <Card
        className={cn(
          'flex h-[600px] w-full items-center justify-center',
          className
        )}
      >
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-600">
            Initializing chat with {employeeName}...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('flex h-[600px] w-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{employeeName}</h3>
            <p className="text-sm text-gray-600">{employeeRole}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isTyping && (
            <Badge variant="outline" className="text-xs">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Typing...
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export Chat
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share Session
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  'flex items-start space-x-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role !== 'user' && (
                  <div className="flex-shrink-0">{getMessageIcon(message)}</div>
                )}

                <div
                  className={cn(
                    'group max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.metadata?.error
                        ? 'border border-red-200 bg-red-50 text-red-900'
                        : 'bg-gray-100 text-gray-900'
                  )}
                >
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(message.content),
                    }}
                  />

                  <div className="mt-2 flex items-center justify-between text-xs opacity-70">
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    <div className="flex items-center space-x-2">
                      {getMessageStatus(message)}
                      {message.role === 'assistant' && (
                        <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyMessage(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tool Results */}
                  {message.metadata?.toolResults &&
                    message.metadata.toolResults.length > 0 && (
                      <div className="mt-2 border-t border-gray-200 pt-2">
                        <div className="mb-1 text-xs text-gray-600">
                          Tool Results:
                        </div>
                        {message.metadata.toolResults.map((result, index) => (
                          <div
                            key={index}
                            className="rounded bg-gray-50 p-2 text-xs"
                          >
                            <div className="font-medium">
                              {result.tool_name}
                            </div>
                            <div className="text-gray-600">
                              {result.error
                                ? `Error: ${result.error}`
                                : 'Success'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0">{getMessageIcon(message)}</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming response */}
          {streamingResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start space-x-3"
            >
              <div className="flex-shrink-0">
                <Bot className="h-5 w-5 text-green-500" />
              </div>
              <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-2 text-gray-900">
                <div className="prose prose-sm max-w-none">
                  {streamingResponse}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="border-t bg-gray-50 px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <FileText className="mr-1 h-3 w-3" />
                {file.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0"
                  onClick={() => removeAttachment(index)}
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${employeeName}...`}
              className="max-h-[120px] min-h-[60px] resize-none"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileAttachment}
              className="hidden"
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
            <DialogDescription>
              Configure your chat experience with {employeeName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Model</label>
              <p className="text-sm text-gray-600">gpt-4o-mini</p>
            </div>

            <div>
              <label className="text-sm font-medium">Temperature</label>
              <p className="text-sm text-gray-600">0.7</p>
            </div>

            <div>
              <label className="text-sm font-medium">Available Tools</label>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  Web Search
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Code Analysis
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Data Processing
                </Badge>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AgentSDKChatUI;
