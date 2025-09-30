/**
 * Multi-Tab Chat Interface Component
 * Advanced chat interface with multiple tabs, real-time messaging, tool execution visualization, and AI employee interactions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Paperclip,
  Mic,
  MicOff,
  Image,
  File,
  Download,
  Share,
  Copy,
  Edit3,
  Trash2,
  MoreHorizontal,
  Settings,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Search,
  Filter,
  Bookmark,
  BookmarkPlus,
  Star,
  StarOff,
  Zap,
  Brain,
  Target,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Users,
  MessageSquare,
  Activity,
  Code,
  FileText,
  BarChart3,
  Globe,
  Database,
  Cpu,
  Network,
  Mail,
  Calendar,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  StopCircle,
  SkipForward,
  Rewind,
  FastForward,
  RotateCcw,
  Save,
  Upload,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface ChatTab {
  id: string;
  title: string;
  type: 'individual' | 'team' | 'workflow';
  employeeId?: string;
  workflowId?: string;
  teamId?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive?: boolean;
  isPinned?: boolean;
  isTyping?: boolean;
  participants: ChatParticipant[];
  metadata?: {
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
    department?: string;
    project?: string;
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'tool_execution' | 'workflow_update';
  content: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  senderRole?: string;
  status?: 'sending' | 'delivered' | 'read' | 'processing' | 'completed' | 'error';
  attachments?: MessageAttachment[];
  toolExecution?: ToolExecution;
  workflowUpdate?: WorkflowUpdate;
  metadata?: {
    edited?: boolean;
    editedAt?: Date;
    replyTo?: string;
    threadId?: string;
    mentions?: string[];
    reactions?: MessageReaction[];
  };
}

interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'document' | 'code' | 'data';
  url: string;
  size: number;
  preview?: string;
}

interface ToolExecution {
  id: string;
  toolName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  progress?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  logs?: ExecutionLog[];
}

interface WorkflowUpdate {
  id: string;
  workflowName: string;
  status: 'started' | 'step_completed' | 'completed' | 'failed' | 'paused';
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  progress?: number;
  details?: string;
}

interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  data?: any;
}

interface ChatParticipant {
  id: string;
  name: string;
  role: string;
  type: 'user' | 'ai_employee';
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  lastSeen?: Date;
}

interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

interface MultiTabChatInterfaceProps {
  className?: string;
  initialTabs?: ChatTab[];
  maxTabs?: number;
  allowTabCreation?: boolean;
  showParticipants?: boolean;
  enableVoiceMessages?: boolean;
  enableFileAttachments?: boolean;
  enableToolExecution?: boolean;
  onTabChange?: (tabId: string) => void;
  onMessageSend?: (tabId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  onTabCreate?: (tab: Omit<ChatTab, 'id'>) => void;
  onTabClose?: (tabId: string) => void;
}

export const MultiTabChatInterface: React.FC<MultiTabChatInterfaceProps> = ({
  className,
  initialTabs = [],
  maxTabs = 10,
  allowTabCreation = true,
  showParticipants = true,
  enableVoiceMessages = true,
  enableFileAttachments = true,
  enableToolExecution = true,
  onTabChange,
  onMessageSend,
  onTabCreate,
  onTabClose
}) => {
  // State management
  const [tabs, setTabs] = useState<ChatTab[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState<string>(initialTabs[0]?.id || '');
  const [messages, setMessages] = useState<Map<string, ChatMessage[]>>(new Map());
  const [messageInput, setMessageInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mutedTabs, setMutedTabs] = useState<Set<string>>(new Set());
  const [showNewTabDialog, setShowNewTabDialog] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const [threadMessages, setThreadMessages] = useState<Map<string, ChatMessage[]>>(new Map());
  const [activeThread, setActiveThread] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Get active tab
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const activeMessages = messages.get(activeTabId) || [];

  // Load messages for active tab
  const { data: loadedMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', activeTabId],
    queryFn: async () => {
      if (!activeTabId) return [];
      // Return empty messages by default (no mock generator)
      return [] as ChatMessage[];
    },
    enabled: !!activeTabId,
    staleTime: 30 * 1000
  });

  // Update messages when loaded (prevent infinite loop by using a ref)
  const loadedMessagesRef = useRef<ChatMessage[] | null>(null);
  useEffect(() => {
    if (loadedMessages && activeTabId && loadedMessages !== loadedMessagesRef.current) {
      loadedMessagesRef.current = loadedMessages;
      setMessages(prev => new Map(prev.set(activeTabId, loadedMessages)));
    }
  }, [loadedMessages, activeTabId]);

  // Scroll to bottom on new messages (debounced to prevent excessive scrolling)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [activeMessages.length]); // Only depend on length, not the entire array

  // Auto-focus input
  useEffect(() => {
    if (inputRef.current && !isFullscreen) {
      inputRef.current.focus();
    }
  }, [activeTabId, isFullscreen]);

  // Removed sample message generator

  // Message handlers
  const handleSendMessage = useCallback(async () => {
    // Capture current values to avoid closure issues
    const currentInput = messageInput;
    const currentTabId = activeTabId;
    
    if (!currentInput.trim() || !currentTabId) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: currentInput.trim(),
      timestamp: new Date(),
      senderId: 'user-1',
      senderName: 'You',
      status: 'sending'
    };

    // Add message optimistically
    setMessages(prev => new Map(prev.set(currentTabId, [...(prev.get(currentTabId) || []), newMessage])));
    setMessageInput('');

    // Notify parent
    onMessageSend?.(currentTabId, newMessage);

    try {
      // Simulate sending
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update status
      setMessages(prev => {
        const tabMessages = prev.get(currentTabId) || [];
        const updatedMessages = tabMessages.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'delivered' as const } : msg
        );
        return new Map(prev.set(currentTabId, updatedMessages));
      });

      // Simulate AI response after a delay
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'assistant',
          content: generateAIResponse(currentInput),
          timestamp: new Date(),
          senderId: 'ai-assistant',
          senderName: 'AI Assistant',
          senderRole: 'General Assistant',
          status: 'delivered'
        };

        setMessages(prev => new Map(prev.set(currentTabId, [...(prev.get(currentTabId) || []), aiResponse])));
      }, 1000 + Math.random() * 2000);

    } catch (error) {
      // Handle error
      setMessages(prev => {
        const tabMessages = prev.get(currentTabId) || [];
        const updatedMessages = tabMessages.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'error' as const } : msg
        );
        return new Map(prev.set(currentTabId, updatedMessages));
      });
      toast.error('Failed to send message');
    }
  }, [messageInput, activeTabId, onMessageSend]);

  const generateAIResponse = (userMessage: string): string => {
    return '';
  };

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Tab management
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    onTabChange?.(tabId);
    
    // Mark messages as read
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, unreadCount: 0 } : tab
    ));
  }, [onTabChange]);

  const handleTabClose = useCallback((tabId: string) => {
    if (tabs.length <= 1) return;
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    setMessages(prev => {
      const newMessages = new Map(prev);
      newMessages.delete(tabId);
      return newMessages;
    });
    
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      setActiveTabId(remainingTabs[0]?.id || '');
    }
    
    onTabClose?.(tabId);
  }, [tabs, activeTabId, onTabClose]);

  const handleNewTab = useCallback((tabData: Omit<ChatTab, 'id'>) => {
    if (tabs.length >= maxTabs) {
      toast.error(`Maximum ${maxTabs} tabs allowed`);
      return;
    }

    const newTab: ChatTab = {
      ...tabData,
      id: `tab-${Date.now()}`
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setShowNewTabDialog(false);
    onTabCreate?.(tabData);
  }, [tabs, maxTabs, onTabCreate]);

  // Message actions
  const handleMessageEdit = useCallback((messageId: string, newContent: string) => {
    const currentTabId = activeTabId;
    setMessages(prev => {
      const tabMessages = prev.get(currentTabId) || [];
      const updatedMessages = tabMessages.map(msg =>
        msg.id === messageId 
          ? { 
              ...msg, 
              content: newContent,
              metadata: { 
                ...msg.metadata, 
                edited: true, 
                editedAt: new Date() 
              }
            }
          : msg
      );
      return new Map(prev.set(currentTabId, updatedMessages));
    });
  }, [activeTabId]);

  const handleMessageDelete = useCallback((messageId: string) => {
    const currentTabId = activeTabId;
    setMessages(prev => {
      const tabMessages = prev.get(currentTabId) || [];
      const updatedMessages = tabMessages.filter(msg => msg.id !== messageId);
      return new Map(prev.set(currentTabId, updatedMessages));
    });
  }, [activeTabId]);

  const handleMessageReaction = useCallback((messageId: string, emoji: string) => {
    const currentTabId = activeTabId;
    setMessages(prev => {
      const tabMessages = prev.get(currentTabId) || [];
      const updatedMessages = tabMessages.map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.metadata?.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === emoji && r.userId === 'user-1');
          
          if (existingReaction) {
            // Remove reaction
            return {
              ...msg,
              metadata: {
                ...msg.metadata,
                reactions: reactions.filter(r => !(r.emoji === emoji && r.userId === 'user-1'))
              }
            };
          } else {
            // Add reaction
            return {
              ...msg,
              metadata: {
                ...msg.metadata,
                reactions: [
                  ...reactions,
                  { emoji, userId: 'user-1', userName: 'You', timestamp: new Date() }
                ]
              }
            };
          }
        }
        return msg;
      });
      return new Map(prev.set(currentTabId, updatedMessages));
    });
  }, [activeTabId]);

  const handleFileDrop = useCallback((files: FileList) => {
    if (!enableFileAttachments) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`File ${file.name} is too large (max 10MB)`);
        return;
      }

      const attachment: MessageAttachment = {
        id: `file-${Date.now()}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file),
        size: file.size
      };

      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'user',
        content: `Uploaded ${file.name}`,
        timestamp: new Date(),
        senderId: 'user-1',
        senderName: 'You',
        status: 'delivered',
        attachments: [attachment]
      };

      setMessages(prev => new Map(prev.set(activeTabId, [...(prev.get(activeTabId) || []), message])));
    });
  }, [activeTabId, enableFileAttachments]);

  // Voice recording
  const toggleRecording = useCallback(() => {
    if (!enableVoiceMessages) return;
    
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.info('Recording started...');
    } else {
      toast.success('Voice message recorded');
      // Here you would process the voice recording
    }
  }, [isRecording, enableVoiceMessages]);

  return (
    <div className={cn(
      "flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden",
      isFullscreen && "fixed inset-0 z-50 rounded-none border-0",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center space-x-4 flex-1">
          {/* Tab Navigation */}
          <div className="flex items-center space-x-1 max-w-2xl overflow-x-auto">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                layout
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 whitespace-nowrap group",
                  activeTabId === tab.id
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50",
                  tab.isPinned && "border-l-2 border-l-yellow-500"
                )}
              >
                {tab.type === 'individual' && <Bot className="h-4 w-4" />}
                {tab.type === 'team' && <Users className="h-4 w-4" />}
                {tab.type === 'workflow' && <Zap className="h-4 w-4" />}
                
                <span className="max-w-32 truncate">{tab.title}</span>
                
                {tab.unreadCount > 0 && (
                  <Badge className="h-5 w-5 p-0 text-xs bg-red-500 text-white flex items-center justify-center">
                    {tab.unreadCount > 99 ? '99+' : tab.unreadCount}
                  </Badge>
                )}
                
                {tab.isTyping && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                
                {tabs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabClose(tab.id);
                    }}
                    className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </motion.button>
            ))}
            
            {allowTabCreation && tabs.length < maxTabs && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewTabDialog(true)}
                className="text-slate-400 hover:text-white px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  "text-slate-400 hover:text-white",
                  showSearch && "text-blue-400"
                )}
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search Messages</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-slate-400 hover:text-white"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
              <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-slate-300">
                <Bookmark className="h-4 w-4 mr-2" />
                View Bookmarks
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300">
                <Download className="h-4 w-4 mr-2" />
                Export Chat
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-700/50 bg-slate-800/30 overflow-hidden"
          >
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(false)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages List */}
          <ScrollArea className="flex-1 p-4">
            {messagesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex space-x-3 animate-pulse">
                    <div className="w-8 h-8 bg-slate-700 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-700 rounded w-1/4" />
                      <div className="h-16 bg-slate-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Start a conversation</h3>
                  <p className="text-slate-400">Send a message to begin chatting with AI employees</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activeMessages.map((message) => (
                  <MessageComponent
                    key={message.id}
                    message={message}
                    onEdit={handleMessageEdit}
                    onDelete={handleMessageDelete}
                    onReaction={handleMessageReaction}
                    onPin={(messageId) => setPinnedMessages(prev => new Set(prev.add(messageId)))}
                    isPinned={pinnedMessages.has(message.id)}
                    isSelected={selectedMessages.has(message.id)}
                    onSelect={(messageId) => {
                      setSelectedMessages(prev => {
                        const newSelection = new Set(prev);
                        if (newSelection.has(messageId)) {
                          newSelection.delete(messageId);
                        } else {
                          newSelection.add(messageId);
                        }
                        return newSelection;
                      });
                    }}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  placeholder={`Message ${activeTab?.title || 'AI Employee'}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[44px] max-h-32 resize-none bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400 pr-24"
                  disabled={!activeTabId}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      handleFileDrop(files);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                />
                
                {/* Input Actions */}
                <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                  {enableFileAttachments && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-8 h-8 p-0 text-slate-400 hover:text-white"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Attach File</TooltipContent>
                    </Tooltip>
                  )}
                  
                  {enableVoiceMessages && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleRecording}
                          className={cn(
                            "w-8 h-8 p-0",
                            isRecording ? "text-red-400 hover:text-red-300" : "text-slate-400 hover:text-white"
                          )}
                        >
                          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isRecording ? 'Stop Recording' : 'Voice Message'}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || !activeTabId}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Input Hints */}
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              {activeTab?.type === 'individual' && (
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>{activeTab.participants[0]?.name} is online</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Participants Sidebar */}
        <AnimatePresence>
          {showParticipants && activeTab && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-slate-700/50 bg-slate-800/30 overflow-hidden"
            >
              <ParticipantsPanel tab={activeTab} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFileDrop(e.target.files);
          }
        }}
      />

      {/* New Tab Dialog */}
      <Dialog open={showNewTabDialog} onOpenChange={setShowNewTabDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Chat</DialogTitle>
            <DialogDescription className="text-slate-400">
              Start a new conversation with an AI employee or team
            </DialogDescription>
          </DialogHeader>
          <NewTabForm onSubmit={handleNewTab} onCancel={() => setShowNewTabDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Message Component
interface MessageComponentProps {
  message: ChatMessage;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onPin: (messageId: string) => void;
  isPinned: boolean;
  isSelected: boolean;
  onSelect: (messageId: string) => void;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  onEdit,
  onDelete,
  onReaction,
  onPin,
  isPinned,
  isSelected,
  onSelect
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showReactions, setShowReactions] = useState(false);

  const isUser = message.type === 'user';
  const reactions = message.metadata?.reactions || [];
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof reactions>);

  const handleSaveEdit = () => {
    onEdit(message.id, editContent);
    setIsEditing(false);
  };

  const quickReactions = ['👍', '❤️', '😊', '🎉', '👏', '🔥'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative p-3 rounded-lg transition-all duration-200",
        isSelected && "bg-blue-500/10 border border-blue-500/30",
        isPinned && "border-l-4 border-l-yellow-500",
        isUser ? "ml-12 bg-blue-500/10" : "mr-12 bg-slate-800/50"
      )}
    >
      <div className={cn("flex space-x-3", isUser && "flex-row-reverse space-x-reverse")}>
        {/* Avatar */}
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.type === 'user' ? undefined : `/avatars/${message.senderId}.png`} />
          <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className={cn("flex items-center space-x-2 mb-1", isUser && "flex-row-reverse space-x-reverse")}>
            <span className="text-sm font-medium text-white">{message.senderName}</span>
            {message.senderRole && (
              <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                {message.senderRole}
              </Badge>
            )}
            <span className="text-xs text-slate-500">
              {message.timestamp.toLocaleTimeString()}
            </span>
            {message.metadata?.edited && (
              <span className="text-xs text-slate-500">(edited)</span>
            )}
          </div>

          {/* Message Body */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="bg-slate-700/30 border-slate-600/30 text-white"
                autoFocus
              />
              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              {/* Tool Execution */}
              {message.toolExecution && (
                <ToolExecutionComponent execution={message.toolExecution} />
              )}

              {/* Workflow Update */}
              {message.workflowUpdate && (
                <WorkflowUpdateComponent update={message.workflowUpdate} />
              )}

              {/* Text Content */}
              <div className="text-slate-300 whitespace-pre-wrap break-words">
                {message.content}
              </div>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment) => (
                    <AttachmentComponent key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              )}

              {/* Status */}
              {message.status && (
                <div className="flex items-center space-x-1 mt-1">
                  {message.status === 'sending' && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
                  {message.status === 'delivered' && <CheckCircle className="h-3 w-3 text-green-400" />}
                  {message.status === 'error' && <AlertCircle className="h-3 w-3 text-red-400" />}
                  {message.status === 'processing' && <Clock className="h-3 w-3 text-yellow-400" />}
                </div>
              )}

              {/* Reactions */}
              {Object.keys(groupedReactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      onClick={() => onReaction(message.id, emoji)}
                      className="h-6 px-2 text-xs bg-slate-700/50 hover:bg-slate-700"
                    >
                      {emoji} {reactionList.length}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Message Actions */}
        <div className={cn(
          "flex items-start space-x-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser && "flex-row-reverse space-x-reverse"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-6 h-6 p-0 text-slate-400 hover:text-white">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700" align={isUser ? "end" : "start"}>
              <DropdownMenuItem onClick={() => onSelect(message.id)} className="text-slate-300">
                <CheckCircle className="h-4 w-4 mr-2" />
                Select
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPin(message.id)} className="text-slate-300">
                <BookmarkPlus className="h-4 w-4 mr-2" />
                {isPinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowReactions(!showReactions)} className="text-slate-300">
                <Star className="h-4 w-4 mr-2" />
                React
              </DropdownMenuItem>
              {isUser && (
                <>
                  <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-slate-300">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(message.id)} className="text-red-400">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Reactions */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-0 right-8 bg-slate-800 border border-slate-700 rounded-lg p-1 flex space-x-1 shadow-lg z-10"
              >
                {quickReactions.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onReaction(message.id, emoji);
                      setShowReactions(false);
                    }}
                    className="w-8 h-8 p-0 text-lg hover:bg-slate-700"
                  >
                    {emoji}
                  </Button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Tool Execution Component
interface ToolExecutionComponentProps {
  execution: ToolExecution;
}

const ToolExecutionComponent: React.FC<ToolExecutionComponentProps> = ({ execution }) => {
  const [showLogs, setShowLogs] = useState(false);

  const getStatusIcon = () => {
    switch (execution.status) {
      case 'queued': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusColor = () => {
    switch (execution.status) {
      case 'queued': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'running': return 'border-blue-500/30 bg-blue-500/10';
      case 'completed': return 'border-green-500/30 bg-green-500/10';
      case 'failed': return 'border-red-500/30 bg-red-500/10';
    }
  };

  return (
    <Card className={cn("border-2 mb-3", getStatusColor())}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-sm text-white">{execution.toolName}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {execution.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {execution.progress !== undefined && execution.status === 'running' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Progress</span>
              <span>{execution.progress}%</span>
            </div>
            <Progress value={execution.progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500">Started:</span>
            <p className="text-slate-300">{execution.startTime.toLocaleTimeString()}</p>
          </div>
          {execution.endTime && (
            <div>
              <span className="text-slate-500">Duration:</span>
              <p className="text-slate-300">
                {Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 1000)}s
              </p>
            </div>
          )}
        </div>

        {execution.output && (
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-2">Output:</div>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(execution.output, null, 2)}
            </pre>
          </div>
        )}

        {execution.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="text-xs text-red-400 mb-1">Error:</div>
            <p className="text-xs text-red-300">{execution.error}</p>
          </div>
        )}

        {execution.logs && execution.logs.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogs(!showLogs)}
              className="text-slate-400 hover:text-white text-xs"
            >
              {showLogs ? 'Hide' : 'Show'} Logs ({execution.logs.length})
            </Button>
            <AnimatePresence>
              {showLogs && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 bg-slate-800/50 rounded-lg p-3 max-h-32 overflow-y-auto"
                >
                  <div className="space-y-1">
                    {execution.logs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-2 text-xs">
                        <span className="text-slate-500 w-16 flex-shrink-0">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                          log.level === 'error' && "bg-red-500",
                          log.level === 'warning' && "bg-yellow-500",
                          log.level === 'info' && "bg-blue-500",
                          log.level === 'debug' && "bg-slate-500"
                        )} />
                        <span className="text-slate-300 flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Workflow Update Component
interface WorkflowUpdateComponentProps {
  update: WorkflowUpdate;
}

const WorkflowUpdateComponent: React.FC<WorkflowUpdateComponentProps> = ({ update }) => {
  const getStatusIcon = () => {
    switch (update.status) {
      case 'started': return <PlayCircle className="h-4 w-4 text-blue-400" />;
      case 'step_completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'paused': return <PauseCircle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = () => {
    switch (update.status) {
      case 'started': return 'border-blue-500/30 bg-blue-500/10';
      case 'step_completed': return 'border-green-500/30 bg-green-500/10';
      case 'completed': return 'border-green-500/30 bg-green-500/10';
      case 'failed': return 'border-red-500/30 bg-red-500/10';
      case 'paused': return 'border-yellow-500/30 bg-yellow-500/10';
    }
  };

  return (
    <Card className={cn("border-2 mb-3", getStatusColor())}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-white">{update.workflowName}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {update.status.replace('_', ' ')}
          </Badge>
        </div>

        {update.details && (
          <p className="text-sm text-slate-300 mb-3">{update.details}</p>
        )}

        {update.currentStep && (
          <div className="text-xs text-slate-400 mb-2">
            Current Step: <span className="text-slate-300">{update.currentStep}</span>
          </div>
        )}

        {update.totalSteps && update.completedSteps !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Progress</span>
              <span>{update.completedSteps}/{update.totalSteps} steps</span>
            </div>
            <Progress 
              value={(update.completedSteps / update.totalSteps) * 100} 
              className="h-2" 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Attachment Component
interface AttachmentComponentProps {
  attachment: MessageAttachment;
}

const AttachmentComponent: React.FC<AttachmentComponentProps> = ({ attachment }) => {
  const getFileIcon = () => {
    switch (attachment.type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'data': return <BarChart3 className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="bg-slate-700/30 border-slate-600/30">
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-600/30 rounded-lg flex items-center justify-center">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{attachment.name}</p>
            <p className="text-xs text-slate-400">{formatFileSize(attachment.size)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-slate-400 hover:text-white flex-shrink-0"
          >
            <a href={attachment.url} download={attachment.name}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
        
        {attachment.type === 'image' && attachment.preview && (
          <div className="mt-3">
            <img
              src={attachment.preview}
              alt={attachment.name}
              className="max-w-full h-auto rounded-lg"
              style={{ maxHeight: '200px' }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Participants Panel Component
interface ParticipantsPanelProps {
  tab: ChatTab;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ tab }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-white">Participants</h3>
        <p className="text-xs text-slate-400 mt-1">{tab.participants.length} members</p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {tab.participants.map((participant) => (
            <div key={participant.id} className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                    {participant.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800",
                  participant.status === 'online' && "bg-green-400",
                  participant.status === 'away' && "bg-yellow-400",
                  participant.status === 'busy' && "bg-red-400",
                  participant.status === 'offline' && "bg-slate-500"
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{participant.name}</p>
                <p className="text-xs text-slate-400 truncate">{participant.role}</p>
              </div>
              
              <Badge variant="outline" className={cn(
                "text-xs",
                participant.type === 'ai_employee' ? "border-purple-500/30 text-purple-400" : "border-blue-500/30 text-blue-400"
              )}>
                {participant.type === 'ai_employee' ? 'AI' : 'Human'}
              </Badge>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

// New Tab Form Component
interface NewTabFormProps {
  onSubmit: (tab: Omit<ChatTab, 'id'>) => void;
  onCancel: () => void;
}

const NewTabForm: React.FC<NewTabFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'individual' as 'individual' | 'team' | 'workflow',
    employeeId: '',
    teamId: '',
    workflowId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTab: Omit<ChatTab, 'id'> = {
      title: formData.title,
      type: formData.type,
      unreadCount: 0,
      participants: [
        {
          id: 'user-1',
          name: 'You',
          role: 'User',
          type: 'user',
          status: 'online'
        },
        {
          id: formData.employeeId || 'ai-assistant',
          name: formData.title || 'AI Assistant',
          role: 'Assistant',
          type: 'ai_employee',
          status: 'online'
        }
      ],
      ...(formData.employeeId && { employeeId: formData.employeeId }),
      ...(formData.teamId && { teamId: formData.teamId }),
      ...(formData.workflowId && { workflowId: formData.workflowId })
    };

    onSubmit(newTab);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <Label className="text-slate-300">Chat Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter chat title..."
          className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
          required
        />
      </div>
      
      <div>
        <Label className="text-slate-300">Chat Type</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger className="mt-1 bg-slate-700/30 border-slate-600/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="individual">Individual AI Employee</SelectItem>
            <SelectItem value="team">Team Chat</SelectItem>
            <SelectItem value="workflow">Workflow Discussion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.type === 'individual' && (
        <div>
          <Label className="text-slate-300">AI Employee</Label>
          <Select 
            value={formData.employeeId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
          >
            <SelectTrigger className="mt-1 bg-slate-700/30 border-slate-600/30 text-white">
              <SelectValue placeholder="Select an AI employee..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="ai-analyst">Data Analyst AI</SelectItem>
              <SelectItem value="ai-developer">Software Engineer AI</SelectItem>
              <SelectItem value="ai-designer">UX Designer AI</SelectItem>
              <SelectItem value="ai-marketer">Marketing Manager AI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.title.trim()}>
          Create Chat
        </Button>
      </div>
    </form>
  );
};

export default MultiTabChatInterface;