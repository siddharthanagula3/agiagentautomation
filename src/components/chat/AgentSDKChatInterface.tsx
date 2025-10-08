/**
 * Agent SDK Chat Interface
 * Modern chat interface following OpenAI's design guidelines
 * Implements conversational flow, context awareness, and tool integration
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  Wrench,
  Webhook,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { 
  agentSDKService, 
  type AgentMessage, 
  type AgentResponse, 
  type AgentSession,
  type AgentTool,
  AgentError 
} from '@/services/agent-sdk-service';

interface AgentSDKChatInterfaceProps {
  userId: string;
  employeeId: string;
  employeeRole: string;
  employeeName: string;
  className?: string;
  onSessionCreated?: (session: AgentSession) => void;
  onError?: (error: AgentError) => void;
}

export const AgentSDKChatInterface: React.FC<AgentSDKChatInterfaceProps> = ({
  userId,
  employeeId,
  employeeRole,
  employeeName,
  className,
  onSessionCreated,
  onError
}) => {
  // State management
  const [session, setSession] = useState<AgentSession | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AgentTool | null>(null);
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
        const newSession = await agentSDKService.createSession(
          userId,
          employeeId,
          employeeRole,
          {
            provider: 'openai',
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 4000,
            streaming: true,
            tools: getDefaultTools(employeeRole),
            systemPrompt: generateSystemPrompt(employeeRole, employeeName)
          }
        );

        setSession(newSession);
        setMessages(newSession.messages);
        
        // Add welcome message
        const welcomeMessage: AgentMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `Hello! I'm ${employeeName}, your ${employeeRole}. I'm here to help you with professional assistance in my field. How can I assist you today?`,
          timestamp: new Date(),
          metadata: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            sessionId: newSession.id,
            userId
          }
        };

        setMessages([welcomeMessage]);
        onSessionCreated?.(newSession);

        toast.success(`Connected to ${employeeName}`);
      } catch (error) {
        console.error('[Agent SDK Chat] Session initialization error:', error);
        const agentError = error instanceof AgentError ? error : new AgentError(
          'Failed to initialize chat session',
          'SESSION_INIT_ERROR'
        );
        onError?.(agentError);
        toast.error('Failed to initialize chat session');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [userId, employeeId, employeeRole, employeeName, onSessionCreated, onError]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !session || isLoading) return;

    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      metadata: {
        sessionId: session.id,
        userId,
        attachments: attachments.length
      }
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Send message through Agent SDK
      const response = await agentSDKService.sendMessage(
        session.id,
        userMessage.content,
        attachments
      );

      // Add assistant response
      const assistantMessage: AgentMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          provider: response.provider,
          model: response.model,
          sessionId: session.id,
          userId,
          tools: response.tools?.map(t => t.name),
          webhook: response.webhook?.url
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Show tool execution results if any
      if (response.tools && response.tools.length > 0) {
        toast.success(`Executed ${response.tools.length} tool(s)`);
      }

    } catch (error) {
      console.error('[Agent SDK Chat] Message sending error:', error);
      
      const agentError = error instanceof AgentError ? error : new AgentError(
        'Failed to send message',
        'MESSAGE_SEND_ERROR'
      );
      
      onError?.(agentError);
      
      // Add error message
      const errorMessage: AgentMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${agentError.message}. Please try again.`,
        timestamp: new Date(),
        metadata: {
          sessionId: session.id,
          userId,
          error: true
        }
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setAttachments([]);
    }
  }, [inputValue, session, isLoading, attachments, userId, onError]);

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
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');
  };

  // Get message icon
  const getMessageIcon = (message: AgentMessage) => {
    if (message.metadata?.error) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    
    if (message.role === 'user') {
      return <User className="w-5 h-5 text-blue-500" />;
    }
    
    return <Bot className="w-5 h-5 text-green-500" />;
  };

  // Get message status
  const getMessageStatus = (message: AgentMessage) => {
    if (message.metadata?.error) {
      return <Badge variant="destructive" className="text-xs">Error</Badge>;
    }
    
    if (message.metadata?.tools?.length) {
      return <Badge variant="secondary" className="text-xs">
        <Wrench className="w-3 h-3 mr-1" />
        {message.metadata.tools.length} tool(s)
      </Badge>;
    }
    
    if (message.metadata?.webhook) {
      return <Badge variant="outline" className="text-xs">
        <Webhook className="w-3 h-3 mr-1" />
        Webhook
      </Badge>;
    }
    
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  if (isLoading && !session) {
    return (
      <Card className={cn("w-full h-[600px] flex items-center justify-center", className)}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-600">Initializing chat with {employeeName}...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full h-[600px] flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{employeeName}</h3>
            <p className="text-sm text-gray-600">{employeeRole}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isTyping && (
            <Badge variant="outline" className="text-xs">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Typing...
            </Badge>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Export Chat
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="w-4 h-4 mr-2" />
                Share Session
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
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
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "flex items-start space-x-3",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role !== 'user' && (
                  <div className="flex-shrink-0">
                    {getMessageIcon(message)}
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === 'user'
                      ? "bg-blue-500 text-white"
                      : message.metadata?.error
                      ? "bg-red-50 text-red-900 border border-red-200"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(message.content)
                    }}
                  />
                  
                  <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {getMessageStatus(message)}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    {getMessageIcon(message)}
                  </div>
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
                <Bot className="w-5 h-5 text-green-500" />
              </div>
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
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
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                {file.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0"
                  onClick={() => removeAttachment(index)}
                >
                  <XCircle className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${employeeName}...`}
              className="min-h-[60px] max-h-[120px] resize-none"
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
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
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
              <p className="text-sm text-gray-600">{session?.config.model}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Temperature</label>
              <p className="text-sm text-gray-600">{session?.config.temperature}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Available Tools</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {session?.config.tools.map((tool, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tool.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

/**
 * Get default tools for employee role
 */
function getDefaultTools(employeeRole: string): AgentTool[] {
  const baseTools: AgentTool[] = [
    {
      id: 'web_search',
      name: 'web_search',
      description: 'Search the web for current information',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          max_results: { type: 'number', description: 'Maximum number of results' }
        },
        required: ['query']
      }
    }
  ];

  const roleSpecificTools: Record<string, AgentTool[]> = {
    'Product Manager': [
      {
        id: 'market_analysis',
        name: 'market_analysis',
        description: 'Analyze market trends and competition',
        type: 'function',
        parameters: {
          type: 'object',
          properties: {
            market: { type: 'string', description: 'Market to analyze' },
            timeframe: { type: 'string', description: 'Analysis timeframe' }
          },
          required: ['market']
        }
      }
    ],
    'Data Scientist': [
      {
        id: 'data_analysis',
        name: 'data_analysis',
        description: 'Perform statistical analysis on data',
        type: 'function',
        parameters: {
          type: 'object',
          properties: {
            data: { type: 'string', description: 'Data to analyze' },
            analysis_type: { type: 'string', description: 'Type of analysis' }
          },
          required: ['data']
        }
      }
    ],
    'Software Architect': [
      {
        id: 'code_analysis',
        name: 'code_analysis',
        description: 'Analyze code quality and architecture',
        type: 'function',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Code to analyze' },
            language: { type: 'string', description: 'Programming language' }
          },
          required: ['code', 'language']
        }
      }
    ]
  };

  return [...baseTools, ...(roleSpecificTools[employeeRole] || [])];
}

/**
 * Generate system prompt for employee role
 */
function generateSystemPrompt(employeeRole: string, employeeName: string): string {
  return `You are ${employeeName}, a professional ${employeeRole} AI assistant. You are part of an AI workforce and should provide expert assistance in your field. 

Guidelines:
- Be conversational and natural in your responses
- Provide actionable, professional advice
- Use your expertise to help solve problems
- Be context-aware and remember the conversation
- Use tools when appropriate to enhance your responses
- Maintain a helpful and professional tone

You have access to various tools to help you provide better assistance. Use them when relevant to the user's needs.`;
}
