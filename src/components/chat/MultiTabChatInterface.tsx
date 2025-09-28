/**
 * Advanced Multi-Tab Chat Interface
 * Real-time messaging with AI employees, tool execution visualization, and collaboration features
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Plus,
  X,
  Search,
  MoreVertical,
  Pin,
  Archive,
  Trash2,
  Download,
  Share,
  Settings,
  Users,
  Bot,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Paperclip,
  Mic,
  Image as ImageIcon,
  File,
  Code,
  BarChart3,
  Globe,
  Database,
  Brain,
  Cpu,
  Activity,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ExternalLink,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Filter,
  Calendar,
  Sparkles,
  Shield,
  Target,
  TrendingUp,
  Briefcase,
  Award,
  GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import MessageComposer from '../MessageComposer';

// Types and Interfaces
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'ai_employee' | 'system';
  content: string;
  messageType: 'text' | 'file' | 'image' | 'voice' | 'tool_execution' | 'system_notification';
  metadata?: {
    toolExecution?: ToolExecutionMetadata;
    fileInfo?: FileMetadata;
    voiceInfo?: VoiceMetadata;
    mentionedUsers?: string[];
    replyTo?: string;
  };
  timestamp: Date;
  editedAt?: Date;
  reactions: MessageReaction[];
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isPrivate?: boolean;
}

export interface ToolExecutionMetadata {
  toolId: string;
  toolName: string;
  operation: string;
  parameters: Record<string, any>;
  result?: any;
  status: 'executing' | 'completed' | 'failed';
  executionTime?: number;
  cost?: number;
  error?: string;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
  thumbnailUrl?: string;
}

export interface VoiceMetadata {
  duration: number;
  waveformData: number[];
  transcription?: string;
  isPlaying?: boolean;
}

export interface MessageReaction {
  id: string;
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  participants: ConversationParticipant[];
  lastMessage?: ChatMessage;
  lastActivity: Date;
  isActive: boolean;
  isPinned: boolean;
  isArchived: boolean;
  unreadCount: number;
  tags: string[];
  context?: ConversationContext;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'busy' | 'offline';
  isTyping?: boolean;
  lastSeen?: Date;
  permissions: string[];
}

export interface ConversationContext {
  projectId?: string;
  workflowId?: string;
  taskId?: string;
  relatedDocuments?: string[];
  objectives?: string[];
}

export interface ChatTab {
  id: string;
  conversationId: string;
  title: string;
  participant: ConversationParticipant;
  isActive: boolean;
  hasUnread: boolean;
  isPinned: boolean;
}

interface MultiTabChatInterfaceProps {
  className?: string;
  onConversationCreate?: (conversation: Conversation) => void;
  onMessageSend?: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
}

// Sample data - replace with real API calls
const sampleConversations: Conversation[] = [
  {
    id: 'conv-001',
    title: 'Sarah Chen - Data Analysis',
    participants: [
      {
        id: 'emp-001',
        name: 'Sarah Chen',
        role: 'Data Scientist',
        avatar: '/avatars/sarah.jpg',
        status: 'online',
        isTyping: false,
        permissions: ['read', 'write', 'execute_tools']
      }
    ],
    lastMessage: {
      id: 'msg-001',
      conversationId: 'conv-001',
      senderId: 'emp-001',
      senderType: 'ai_employee',
      content: 'I\'ve completed the customer segmentation analysis. The results show 5 distinct customer groups with varying purchasing behaviors.',
      messageType: 'text',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      reactions: [],
      status: 'read'
    },
    lastActivity: new Date(Date.now() - 5 * 60 * 1000),
    isActive: true,
    isPinned: true,
    isArchived: false,
    unreadCount: 0,
    tags: ['analysis', 'customer-data'],
    context: {
      projectId: 'proj-001',
      objectives: ['Analyze customer segments', 'Identify purchasing patterns']
    }
  },
  {
    id: 'conv-002',
    title: 'Marcus Rodriguez - Web Development',
    participants: [
      {
        id: 'emp-002',
        name: 'Marcus Rodriguez',
        role: 'Full-Stack Developer',
        avatar: '/avatars/marcus.jpg',
        status: 'busy',
        isTyping: true,
        permissions: ['read', 'write', 'execute_tools']
      }
    ],
    lastMessage: {
      id: 'msg-002',
      conversationId: 'conv-002',
      senderId: 'user-001',
      senderType: 'user',
      content: 'Can you help me implement user authentication for the new dashboard?',
      messageType: 'text',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      reactions: [],
      status: 'read'
    },
    lastActivity: new Date(Date.now() - 2 * 60 * 1000),
    isActive: false,
    isPinned: false,
    isArchived: false,
    unreadCount: 2,
    tags: ['development', 'authentication'],
    context: {
      projectId: 'proj-002',
      objectives: ['Implement authentication', 'Secure user dashboard']
    }
  }
];

const sampleMessages: ChatMessage[] = [
  {
    id: 'msg-001',
    conversationId: 'conv-001',
    senderId: 'user-001',
    senderType: 'user',
    content: 'Hi Sarah, can you analyze our customer data and identify different segments?',
    messageType: 'text',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    reactions: [],
    status: 'read'
  },
  {
    id: 'msg-002',
    conversationId: 'conv-001',
    senderId: 'emp-001',
    senderType: 'ai_employee',
    content: 'I\'ll help you with customer segmentation analysis. Let me start by examining the data structure and running some initial analysis.',
    messageType: 'text',
    timestamp: new Date(Date.now() - 58 * 60 * 1000),
    reactions: [
      { id: 'r1', userId: 'user-001', emoji: '👍', timestamp: new Date(Date.now() - 57 * 60 * 1000) }
    ],
    status: 'read'
  },
  {
    id: 'msg-003',
    conversationId: 'conv-001',
    senderId: 'emp-001',
    senderType: 'ai_employee',
    content: 'Running customer segmentation analysis...',
    messageType: 'tool_execution',
    metadata: {
      toolExecution: {
        toolId: 'data-analysis',
        toolName: 'Customer Segmentation',
        operation: 'segment_customers',
        parameters: {
          dataset: 'customer_data.csv',
          algorithm: 'k-means',
          clusters: 5
        },
        status: 'completed',
        executionTime: 45000,
        cost: 0.15,
        result: {
          segments: 5,
          silhouette_score: 0.72,
          clusters: [
            { name: 'High-Value Regulars', size: 1250, avg_spend: 890 },
            { name: 'Bargain Hunters', size: 2100, avg_spend: 120 },
            { name: 'Occasional Buyers', size: 1800, avg_spend: 340 }
          ]
        }
      }
    },
    timestamp: new Date(Date.now() - 50 * 60 * 1000),
    reactions: [],
    status: 'read'
  },
  {
    id: 'msg-004',
    conversationId: 'conv-001',
    senderId: 'emp-001',
    senderType: 'ai_employee',
    content: 'Perfect! I\'ve completed the customer segmentation analysis. The results show 5 distinct customer groups with varying purchasing behaviors. Here\'s what I found:\n\n• **High-Value Regulars** (1,250 customers): Average spend $890\n• **Bargain Hunters** (2,100 customers): Average spend $120\n• **Occasional Buyers** (1,800 customers): Average spend $340\n\nThe silhouette score of 0.72 indicates good cluster quality. Would you like me to dive deeper into any specific segment?',
    messageType: 'text',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    reactions: [
      { id: 'r2', userId: 'user-001', emoji: '🎉', timestamp: new Date(Date.now() - 4 * 60 * 1000) },
      { id: 'r3', userId: 'user-001', emoji: '⭐', timestamp: new Date(Date.now() - 4 * 60 * 1000) }
    ],
    status: 'read'
  }
];

export const MultiTabChatInterface: React.FC<MultiTabChatInterfaceProps> = ({
  className,
  onConversationCreate,
  onMessageSend
}) => {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>(sampleConversations);
  const [activeTab, setActiveTab] = useState<string>('conv-001');
  const [tabs, setTabs] = useState<ChatTab[]>([
    {
      id: 'tab-001',
      conversationId: 'conv-001',
      title: 'Sarah Chen',
      participant: sampleConversations[0].participants[0],
      isActive: true,
      hasUnread: false,
      isPinned: true
    }
  ]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    'conv-001': sampleMessages
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab, scrollToBottom]);

  // Simulated typing indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          if (Math.random() > 0.7) {
            updated[convId] = [];
          }
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleTabCreate = useCallback((conversation: Conversation) => {
    const participant = conversation.participants[0];
    const newTab: ChatTab = {
      id: `tab-${Date.now()}`,
      conversationId: conversation.id,
      title: participant.name,
      participant,
      isActive: false,
      hasUnread: conversation.unreadCount > 0,
      isPinned: conversation.isPinned
    };

    setTabs(prev => {
      const existingTab = prev.find(tab => tab.conversationId === conversation.id);
      if (existingTab) {
        return prev.map(tab => ({
          ...tab,
          isActive: tab.id === existingTab.id
        }));
      }
      return [...prev.map(tab => ({ ...tab, isActive: false })), { ...newTab, isActive: true }];
    });

    setActiveTab(conversation.id);
    onConversationCreate?.(conversation);
  }, [onConversationCreate]);

  const handleTabClose = useCallback((tabId: string) => {
    setTabs(prev => {
      const updatedTabs = prev.filter(tab => tab.id !== tabId);
      const closedTab = prev.find(tab => tab.id === tabId);
      
      if (closedTab?.isActive && updatedTabs.length > 0) {
        updatedTabs[0].isActive = true;
        setActiveTab(updatedTabs[0].conversationId);
      } else if (updatedTabs.length === 0) {
        setActiveTab('');
      }
      
      return updatedTabs;
    });
  }, []);

  const handleTabSwitch = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
    
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTab(tab.conversationId);
      
      // Mark messages as read
      setMessages(prev => ({
        ...prev,
        [tab.conversationId]: prev[tab.conversationId]?.map(msg => ({
          ...msg,
          status: msg.status === 'delivered' ? 'read' : msg.status
        })) || []
      }));
      
      // Clear unread indicator
      setTabs(prevTabs => prevTabs.map(t => t.id === tabId ? { ...t, hasUnread: false } : t));
    }
  }, [tabs]);

  const handleMessageSend = useCallback(async (content: string, options: any) => {
    if (!activeTab || !content.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: activeTab,
      senderId: 'user-001',
      senderType: 'user',
      content,
      messageType: 'text',
      timestamp: new Date(),
      reactions: [],
      status: 'sending'
    };

    // Add message to UI immediately
    setMessages(prev => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), newMessage]
    }));

    // Simulate sending and AI response
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
        )
      }));

      // Simulate AI typing
      setTypingUsers(prev => ({
        ...prev,
        [activeTab]: ['ai-employee']
      }));

      // Simulate AI response after delay
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          conversationId: activeTab,
          senderId: 'emp-001',
          senderType: 'ai_employee',
          content: `I understand you're asking about "${content.slice(0, 50)}...". Let me help you with that. I'll analyze this request and provide you with a comprehensive response.`,
          messageType: 'text',
          timestamp: new Date(),
          reactions: [],
          status: 'sent'
        };

        setMessages(prev => ({
          ...prev,
          [activeTab]: [...prev[activeTab], aiResponse]
        }));

        setTypingUsers(prev => ({
          ...prev,
          [activeTab]: []
        }));
      }, 2000);
    }, 1000);

    onMessageSend?.(newMessage);
  }, [activeTab, onMessageSend]);

  const activeConversation = conversations.find(conv => conv.id === activeTab);
  const activeMessages = messages[activeTab] || [];
  const activeTypingUsers = typingUsers[activeTab] || [];

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [conversations, searchQuery]);

  return (
    <div className={cn(
      'flex h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
      isFullscreen && 'fixed inset-0 z-50',
      className
    )}>
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-800/50 border-r border-slate-700/50 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Conversations</h2>
                  <div className="flex items-center space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>New Conversation</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Filter Conversations</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {filteredConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeTab}
                      onClick={() => handleTabCreate(conversation)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Tab Bar */}
        {tabs.length > 0 && (
          <div className="flex items-center bg-slate-800/30 border-b border-slate-700/50 px-4 min-h-[60px]">
            <div className="flex items-center space-x-1 flex-1 overflow-x-auto">
              {tabs.map((tab) => (
                <ChatTabItem
                  key={tab.id}
                  tab={tab}
                  onClick={() => handleTabSwitch(tab.id)}
                  onClose={() => handleTabClose(tab.id)}
                />
              ))}
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Sidebar</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-slate-400 hover:text-white"
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Chat Content */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={activeConversation.participants[0].avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {activeConversation.participants[0].name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white">{activeConversation.participants[0].name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        activeConversation.participants[0].status === 'online' ? 'bg-green-500' :
                        activeConversation.participants[0].status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                      )} />
                      <span className="text-sm text-slate-400 capitalize">
                        {activeConversation.participants[0].status}
                        {activeTypingUsers.length > 0 && ' • typing...'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {activeConversation.participants[0].role}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem className="text-slate-300">
                        <Pin className="h-4 w-4 mr-2" />
                        Pin Conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300">
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300">
                        <Download className="h-4 w-4 mr-2" />
                        Export Chat
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem className="text-red-400">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {activeMessages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isConsecutive={
                      index > 0 && 
                      activeMessages[index - 1].senderId === message.senderId &&
                      (message.timestamp.getTime() - activeMessages[index - 1].timestamp.getTime()) < 5 * 60 * 1000
                    }
                    conversation={activeConversation}
                  />
                ))}
                
                {/* Typing Indicator */}
                {activeTypingUsers.length > 0 && (
                  <TypingIndicator users={activeTypingUsers} />
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Composer */}
            <div className="border-t border-slate-700/50">
              <MessageComposer
                onSendMessage={handleMessageSend}
                placeholder={`Message ${activeConversation.participants[0].name}...`}
                employees={activeConversation.participants.map(p => ({
                  id: p.id,
                  name: p.name,
                  role: p.role,
                  avatar: p.avatar,
                  status: p.status as any,
                  specialties: []
                }))}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">No conversation selected</h3>
                <p className="text-slate-400">Choose a conversation from the sidebar to start chatting</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Conversation Item Component
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isActive, onClick }) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(diff / (1000 * 60))}m`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2',
        isActive ? 'bg-slate-700/50 border-l-2 border-blue-500' : 'hover:bg-slate-700/30'
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={conversation.participants[0].avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {conversation.participants[0].name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-800",
            conversation.participants[0].status === 'online' ? 'bg-green-500' :
            conversation.participants[0].status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-white truncate">{conversation.participants[0].name}</h4>
              {conversation.isPinned && <Pin className="h-3 w-3 text-blue-400" />}
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-slate-400">{formatTime(conversation.lastActivity)}</span>
              {conversation.unreadCount > 0 && (
                <Badge className="bg-blue-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                  {conversation.unreadCount}
                </Badge>
              )}
            </div>
          </div>
          
          {conversation.lastMessage && (
            <p className="text-sm text-slate-400 truncate mt-1">
              {conversation.lastMessage.senderType === 'user' ? 'You: ' : ''}
              {conversation.lastMessage.messageType === 'tool_execution' ? 
                '🔧 Tool execution' : 
                conversation.lastMessage.content
              }
            </p>
          )}
          
          {conversation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {conversation.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Chat Tab Item Component
interface ChatTabItemProps {
  tab: ChatTab;
  onClick: () => void;
  onClose: () => void;
}

const ChatTabItem: React.FC<ChatTabItemProps> = ({ tab, onClick, onClose }) => {
  return (
    <div
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-t-lg cursor-pointer transition-all duration-200 group',
        'border-b-2 min-w-[120px] max-w-[200px]',
        tab.isActive 
          ? 'bg-slate-700/50 border-blue-500 text-white' 
          : 'bg-slate-800/30 border-transparent text-slate-400 hover:bg-slate-700/30 hover:text-white'
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="w-6 h-6">
          <AvatarImage src={tab.participant.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
            {tab.participant.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-slate-800",
          tab.participant.status === 'online' ? 'bg-green-500' :
          tab.participant.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
        )} />
      </div>
      
      <span className="text-sm font-medium truncate flex-1">{tab.title}</span>
      
      {tab.hasUnread && (
        <div className="w-2 h-2 bg-blue-500 rounded-full" />
      )}
      
      {tab.isPinned && (
        <Pin className="h-3 w-3 text-blue-400" />
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="w-4 h-4 p-0 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  isConsecutive: boolean;
  conversation: Conversation;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isConsecutive, conversation }) => {
  const [showReactions, setShowReactions] = useState(false);
  const isUser = message.senderType === 'user';
  const sender = conversation.participants.find(p => p.id === message.senderId);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending': return <Clock className="h-3 w-3 text-slate-500" />;
      case 'sent': return <CheckCircle className="h-3 w-3 text-slate-400" />;
      case 'delivered': return <CheckCircle className="h-3 w-3 text-blue-400" />;
      case 'read': return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'failed': return <AlertCircle className="h-3 w-3 text-red-400" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-end space-x-2',
        isUser ? 'justify-end' : 'justify-start',
        isConsecutive && 'mt-1'
      )}
    >
      {!isUser && !isConsecutive && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={sender?.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
            {sender?.name.split(' ').map(n => n[0]).join('') || 'AI'}
          </AvatarFallback>
        </Avatar>
      )}
      
      {!isUser && isConsecutive && <div className="w-8" />}
      
      <div className={cn('max-w-[70%] group', isUser && 'flex flex-col items-end')}>
        {!isUser && !isConsecutive && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-white">{sender?.name}</span>
            <span className="text-xs text-slate-400">{formatTime(message.timestamp)}</span>
          </div>
        )}
        
        <div
          className={cn(
            'rounded-2xl px-4 py-2 relative',
            isUser 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
              : 'bg-slate-700 text-white',
            message.messageType === 'tool_execution' && 'border-l-4 border-yellow-500'
          )}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {message.messageType === 'tool_execution' && message.metadata?.toolExecution ? (
            <ToolExecutionMessage execution={message.metadata.toolExecution} />
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
          )}
          
          {/* Message Actions */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  'absolute top-0 flex items-center space-x-1 bg-slate-800 rounded-lg p-1 shadow-lg',
                  isUser ? '-left-20' : '-right-20'
                )}
              >
                <Button variant="ghost" size="icon" className="w-6 h-6 text-slate-400 hover:text-white">
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="w-6 h-6 text-slate-400 hover:text-white">
                  <Heart className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="w-6 h-6 text-slate-400 hover:text-white">
                  <Copy className="h-3 w-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex items-center space-x-1 mt-1">
            {message.reactions.reduce((acc, reaction) => {
              const existing = acc.find(r => r.emoji === reaction.emoji);
              if (existing) {
                existing.count++;
              } else {
                acc.push({ emoji: reaction.emoji, count: 1 });
              }
              return acc;
            }, [] as Array<{ emoji: string; count: number }>).map((reaction) => (
              <button
                key={reaction.emoji}
                className="flex items-center space-x-1 bg-slate-700 rounded-full px-2 py-1 text-xs hover:bg-slate-600 transition-colors"
              >
                <span>{reaction.emoji}</span>
                <span className="text-slate-300">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
        
        {isUser && (
          <div className="flex items-center space-x-1 mt-1">
            <span className="text-xs text-slate-400">{formatTime(message.timestamp)}</span>
            {getStatusIcon()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Tool Execution Message Component
interface ToolExecutionMessageProps {
  execution: ToolExecutionMetadata;
}

const ToolExecutionMessage: React.FC<ToolExecutionMessageProps> = ({ execution }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = () => {
    switch (execution.status) {
      case 'executing': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = () => {
    switch (execution.status) {
      case 'executing': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-3">
      {/* Tool Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="font-medium">{execution.toolName}</span>
          <div className={cn('flex items-center space-x-1', getStatusColor())}>
            {getStatusIcon()}
            <span className="text-xs capitalize">{execution.status}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-white p-1"
        >
          {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Execution Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="bg-slate-800 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Operation:</span>
                  <span className="ml-2 text-white">{execution.operation}</span>
                </div>
                {execution.executionTime && (
                  <div>
                    <span className="text-slate-400">Duration:</span>
                    <span className="ml-2 text-white">{(execution.executionTime / 1000).toFixed(1)}s</span>
                  </div>
                )}
                {execution.cost && (
                  <div>
                    <span className="text-slate-400">Cost:</span>
                    <span className="ml-2 text-white">${execution.cost.toFixed(3)}</span>
                  </div>
                )}
              </div>
              
              {execution.result && (
                <div>
                  <span className="text-slate-400 text-xs">Result:</span>
                  <pre className="mt-1 bg-slate-900 rounded p-2 text-xs text-green-400 overflow-x-auto">
                    {JSON.stringify(execution.result, null, 2)}
                  </pre>
                </div>
              )}
              
              {execution.error && (
                <div>
                  <span className="text-red-400 text-xs">Error:</span>
                  <p className="mt-1 text-red-300 text-xs">{execution.error}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Typing Indicator Component
interface TypingIndicatorProps {
  users: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-2"
    >
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
          AI
        </AvatarFallback>
      </Avatar>
      <div className="bg-slate-700 rounded-2xl px-4 py-2">
        <div className="flex space-x-1">
          <motion.div
            className="w-2 h-2 bg-slate-400 rounded-full"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-slate-400 rounded-full"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-slate-400 rounded-full"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default MultiTabChatInterface;