/**
 * Chat Agent Page - OpenAI Assistant Style Chat Interface
 * Clean chat UI for AI Employees with all tools pre-configured
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  Copy, 
  RotateCcw,
  Loader2,
  Bot,
  User,
  FileText,
  Code,
  Search,
  Image as ImageIcon,
  X,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/unified-auth-store';
import { listPurchasedEmployees } from '@/services/supabase-employees';
import { sendAIMessage, isProviderConfigured } from '@/services/ai-chat-service';
import { createSession, sendMessage as saveMessage } from '@/services/supabase-chat';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface PurchasedEmployee {
  id: string;
  employee_id: string;
  name: string;
  role: string;
  description: string;
  provider: string;
  capabilities?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tools?: ToolExecution[];
  attachments?: Attachment[];
}

interface ToolExecution {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

const ChatAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // State
  const [employees, setEmployees] = useState<PurchasedEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<PurchasedEmployee | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load purchased employees
  useEffect(() => {
    const loadEmployees = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const data = await listPurchasedEmployees(user.id);
        setEmployees(data);
        
        // Check if employee ID is in URL params
        const employeeIdParam = searchParams.get('employee');
        
        if (data.length > 0) {
          let employeeToSelect = data[0];
          
          // Try to find employee from URL param or sessionId
          if (employeeIdParam) {
            const emp = data.find(e => e.employee_id === employeeIdParam);
            if (emp) employeeToSelect = emp;
          } else if (sessionId) {
            const emp = data.find(e => e.id === sessionId);
            if (emp) employeeToSelect = emp;
          }
          
          setSelectedEmployee(employeeToSelect);
          await initializeChat(employeeToSelect);
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
        toast.error('Failed to load AI employees');
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployees();
  }, [user?.id, sessionId, searchParams]);

  // Initialize chat session
  const initializeChat = async (employee: PurchasedEmployee) => {
    if (!user?.id) return;

    try {
      // Create new session
      const session = await createSession(user.id, {
        employeeId: employee.id,
        role: employee.role,
        provider: employee.provider
      });
      
      setCurrentSessionId(session.id);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Hello! I'm ${employee.name}, your ${employee.role}. I have access to various tools including file search, code interpreter, web browsing, and image generation. How can I assist you today?`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      
      // Save welcome message
      await saveMessage(user.id, session.id, 'assistant', welcomeMessage.content);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast.error('Failed to start chat session');
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || !selectedEmployee || isSending || !currentSessionId) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      attachments: attachments.map(f => ({
        id: `att-${Date.now()}`,
        name: f.name,
        type: f.type,
        size: f.size
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsSending(true);

    try {
      // Save user message
      await saveMessage(user.id!, currentSessionId, 'user', userMessage.content);

      // Simulate tool executions for demonstration
      const toolsToShow: ToolExecution[] = [];
      
      // Detect what tools might be needed based on content
      if (userMessage.content.toLowerCase().includes('search') || 
          userMessage.content.toLowerCase().includes('find')) {
        toolsToShow.push({
          name: 'File Search',
          status: 'completed'
        });
      }
      
      if (userMessage.content.toLowerCase().includes('code') || 
          userMessage.content.toLowerCase().includes('python') ||
          userMessage.content.toLowerCase().includes('javascript')) {
        toolsToShow.push({
          name: 'Code Interpreter',
          status: 'completed'
        });
      }

      // Get AI response
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      conversationHistory.push({
        role: 'user',
        content: userMessage.content
      });

      const response = await sendAIMessage(
        selectedEmployee.provider,
        conversationHistory,
        selectedEmployee.role
      );

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        tools: toolsToShow.length > 0 ? toolsToShow : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message
      await saveMessage(user.id!, currentSessionId, 'assistant', response.content);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Copy message
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  // Regenerate last response
  const regenerateLastResponse = async () => {
    if (messages.length < 2) return;
    
    // Remove last assistant message
    const newMessages = messages.slice(0, -1);
    setMessages(newMessages);
    
    // Get last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setInput(lastUserMessage.content);
      // Trigger send after setting input
      setTimeout(() => handleSend(), 100);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#212121]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading AI Employees...</p>
        </div>
      </div>
    );
  }

  if (!selectedEmployee) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#212121]">
        <div className="text-center">
          <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">No AI Employee Selected</h2>
          <p className="text-gray-400 mb-6">Purchase AI employees from the marketplace</p>
          <Button
            onClick={() => navigate('/marketplace')}
            className="bg-white text-black hover:bg-gray-200"
          >
            Browse Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#212121]">
      {/* Header */}
      <div className="bg-[#2a2a2a] border-b border-[#3a3a3a] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/workforce')}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="h-6 w-px bg-[#3a3a3a]" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-white font-medium">{selectedEmployee.name}</h1>
                <p className="text-xs text-gray-400">{selectedEmployee.role}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-[#3a3a3a] text-gray-400">
              Thread
            </Badge>
            <div className="text-xs text-gray-500">
              {new Date().toLocaleString('en-US', { 
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-4xl mx-auto py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={cn(
                  "group relative max-w-[85%] rounded-lg px-4 py-3",
                  message.role === 'user' 
                    ? 'bg-[#303030] text-white' 
                    : 'bg-transparent text-gray-100'
                )}
              >
                {/* Tool executions */}
                {message.tools && message.tools.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {message.tools.map((tool, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                        {tool.name === 'File Search' && <Search className="w-3 h-3" />}
                        {tool.name === 'Code Interpreter' && <Code className="w-3 h-3" />}
                        <span>{tool.name}</span>
                        {tool.status === 'completed' && (
                          <Badge variant="outline" className="text-xs border-green-800 text-green-400 h-4 px-1">
                            ✓
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Message content */}
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    className="prose prose-invert prose-sm max-w-none"
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="relative group/code">
                            <pre className="!bg-[#1a1a1a] !border !border-[#3a3a3a] rounded-md overflow-x-auto">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                            <button
                              onClick={() => copyMessage(String(children))}
                              className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity"
                            >
                              <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                            </button>
                          </div>
                        ) : (
                          <code className="bg-[#1a1a1a] px-1 py-0.5 rounded text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                      h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
                
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 bg-[#1a1a1a] px-2 py-1 rounded text-xs">
                        <FileText className="w-3 h-3" />
                        <span>{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Message actions */}
                <div className="absolute -bottom-5 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={() => copyMessage(message.content)}
                    className="p-1 hover:bg-[#3a3a3a] rounded text-gray-400 hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {message.role === 'assistant' && message === messages[messages.length - 1] && (
                    <button
                      onClick={regenerateLastResponse}
                      className="p-1 hover:bg-[#3a3a3a] rounded text-gray-400 hover:text-white"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isSending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-[#3a3a3a] bg-[#2a2a2a] p-4">
        <div className="max-w-4xl mx-auto">
          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1 rounded-full text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="text-gray-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Input */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your message..."
                className="w-full resize-none bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder-gray-500 pr-10 min-h-[44px] max-h-[200px]"
                rows={1}
                disabled={isSending}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-2 bottom-2 p-1 text-gray-400 hover:text-white"
                disabled={isSending}
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="bg-white text-black hover:bg-gray-200 disabled:opacity-50"
              size="sm"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Info text */}
          <p className="text-xs text-gray-500 mt-2 text-center">
            Playground messages can be viewed by anyone at your organization using the API.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatAgentPage;
