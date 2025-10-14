/**
 * Modern Chat Interface
 * Inspired by Cursor, Replit, Lovable, and other modern AI platforms
 * Features: To-do lists, task management, agent-like functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Checkbox } from '@shared/ui/checkbox';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { Progress } from '@shared/ui/progress';
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
} from '@shared/ui/dropdown-menu';
import {
  CheckCircle,
  Circle,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Play,
  Pause,
  Square,
  Clock,
  Zap,
  Brain,
  Code,
  FileText,
  Search,
  Settings,
  BarChart3,
  DollarSign,
  Users,
  Activity,
  Target,
  CheckSquare,
  List,
  Calendar,
  Timer,
  AlertCircle,
  Info,
  Sparkles,
  Bot,
  Send,
  Loader2,
  ChevronDown,
  ChevronRight,
  Star,
  Flag,
  Tag,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  tokenTrackingService,
  type TokenUsage,
} from '@features/billing/services/token-tracking-service';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assignee?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  subtasks?: Task[];
  parentId?: string;
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  aiGenerated?: boolean;
  aiProvider?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tasks?: Task[];
  tokenUsage?: TokenUsage;
  isStreaming?: boolean;
  metadata?: unknown;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  provider: string;
  isActive: boolean;
  currentTask?: string;
  status: 'idle' | 'working' | 'thinking' | 'error';
}

const ModernChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('chat');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [tokenStats, setTokenStats] = useState<unknown>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize agents
  useEffect(() => {
    const initialAgents: Agent[] = [
      {
        id: 'agent-1',
        name: 'Code Assistant',
        role: 'Software Engineer',
        description: 'Helps with coding, debugging, and code review',
        capabilities: [
          'Code Generation',
          'Debugging',
          'Code Review',
          'Documentation',
        ],
        provider: 'openai',
        isActive: true,
        status: 'idle',
      },
      {
        id: 'agent-2',
        name: 'Product Manager',
        role: 'Product Manager',
        description: 'Assists with product strategy and planning',
        capabilities: ['Strategy', 'Planning', 'Analysis', 'Roadmapping'],
        provider: 'anthropic',
        isActive: true,
        status: 'idle',
      },
      {
        id: 'agent-3',
        name: 'Data Analyst',
        role: 'Data Scientist',
        description: 'Helps with data analysis and insights',
        capabilities: ['Data Analysis', 'Visualization', 'Statistics', 'ML'],
        provider: 'google',
        isActive: true,
        status: 'idle',
      },
    ];
    setAgents(initialAgents);
  }, []);

  // Load token statistics
  useEffect(() => {
    const stats = tokenTrackingService.getTokenStats();
    setTokenStats(stats);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response with task generation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const aiResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I understand you want to work on: "${inputMessage}". Let me break this down into actionable tasks.`,
        timestamp: new Date(),
        tasks: generateTasksFromMessage(inputMessage),
        tokenUsage: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          inputTokens: Math.floor(inputMessage.length / 4),
          outputTokens: Math.floor(inputMessage.length / 3),
          totalTokens:
            Math.floor(inputMessage.length / 4) +
            Math.floor(inputMessage.length / 3),
          inputCost: 0.0001,
          outputCost: 0.0002,
          totalCost: 0.0003,
          timestamp: new Date(),
        },
      };

      setMessages(prev => [...prev, aiResponse]);

      // Add generated tasks
      if (aiResponse.tasks) {
        setTasks(prev => [...prev, ...aiResponse.tasks!]);
      }

      // Update token tracking
      if (aiResponse.tokenUsage) {
        tokenTrackingService.calculateTokenUsage(
          aiResponse.tokenUsage.provider,
          aiResponse.tokenUsage.model,
          aiResponse.tokenUsage.inputTokens,
          aiResponse.tokenUsage.outputTokens
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTasksFromMessage = (message: string): Task[] => {
    // Simple task generation logic - in production, this would use AI
    const words = message.toLowerCase().split(' ');
    const tasks: Task[] = [];

    if (words.includes('website') || words.includes('web')) {
      tasks.push({
        id: `task-${Date.now()}-1`,
        title: 'Design website layout',
        description: 'Create wireframes and mockups for the website',
        status: 'pending',
        priority: 'high',
        category: 'Design',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['design', 'website'],
        estimatedTime: 120,
        aiGenerated: true,
      });
    }

    if (words.includes('code') || words.includes('programming')) {
      tasks.push({
        id: `task-${Date.now()}-2`,
        title: 'Write code implementation',
        description: 'Implement the core functionality',
        status: 'pending',
        priority: 'high',
        category: 'Development',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['coding', 'development'],
        estimatedTime: 180,
        aiGenerated: true,
      });
    }

    if (words.includes('test') || words.includes('testing')) {
      tasks.push({
        id: `task-${Date.now()}-3`,
        title: 'Write tests',
        description: 'Create unit and integration tests',
        status: 'pending',
        priority: 'medium',
        category: 'Testing',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['testing', 'quality'],
        estimatedTime: 90,
        aiGenerated: true,
      });
    }

    return tasks;
  };

  const handleTaskStatusChange = (taskId: string, status: Task['status']) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status, updatedAt: new Date() } : task
      )
    );
  };

  const handleTaskPriorityChange = (
    taskId: string,
    priority: Task['priority']
  ) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, priority, updatedAt: new Date() } : task
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus =
      filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority =
      filterPriority === 'all' || task.priority === filterPriority;
    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-500 bg-green-50 border-green-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAgentStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'working':
        return 'text-green-500 bg-green-50';
      case 'thinking':
        return 'text-yellow-500 bg-yellow-50';
      case 'error':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">AI Workspace</h1>
            </div>
            <Badge variant="outline" className="text-xs">
              {agents.filter(a => a.isActive).length} Agents Active
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <div className="flex w-80 flex-col border-r bg-muted/30">
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="flex flex-1 flex-col"
          >
            <TabsList className="m-2 grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="text-xs">
                <MessageSquare className="mr-1 h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs">
                <CheckSquare className="mr-1 h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="agents" className="text-xs">
                <Bot className="mr-1 h-4 w-4" />
                Agents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex flex-1 flex-col">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Recent Conversations</h3>
                  <div className="space-y-1">
                    {messages.slice(-3).map((msg, index) => (
                      <div
                        key={msg.id}
                        className="rounded-lg border bg-background p-2 text-sm"
                      >
                        <div className="truncate font-medium">
                          {msg.role === 'user' ? 'You' : 'AI Assistant'}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="flex flex-1 flex-col">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Tasks</h3>
                    <Button size="sm" onClick={() => setShowTaskDialog(true)}>
                      <Plus className="mr-1 h-4 w-4" />
                      New
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-8"
                    />

                    <div className="flex gap-1">
                      <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="rounded border bg-background px-2 py-1 text-xs"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <select
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                        className="rounded border bg-background px-2 py-1 text-xs"
                      >
                        <option value="all">All Priority</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {filteredTasks.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border bg-background p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={task.status === 'completed'}
                          onCheckedChange={checked =>
                            handleTaskStatusChange(
                              task.id,
                              checked ? 'completed' : 'pending'
                            )
                          }
                        />

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="truncate text-sm font-medium">
                              {task.title}
                            </h4>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                getPriorityColor(task.priority)
                              )}
                            >
                              {task.priority}
                            </Badge>
                          </div>

                          {task.description && (
                            <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{task.category}</span>
                            {task.estimatedTime && (
                              <>
                                <span>•</span>
                                <span>{task.estimatedTime}m</span>
                              </>
                            )}
                            {task.aiGenerated && (
                              <>
                                <span>•</span>
                                <Badge variant="secondary" className="text-xs">
                                  <Sparkles className="mr-1 h-3 w-3" />
                                  AI
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditingTask(task)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-500"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="agents" className="flex flex-1 flex-col">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <h3 className="font-medium">AI Agents</h3>
                  <div className="space-y-2">
                    {agents.map(agent => (
                      <div
                        key={agent.id}
                        className="rounded-lg border bg-background p-3"
                      >
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium">
                              {agent.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {agent.role}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              getAgentStatusColor(agent.status)
                            )}
                          >
                            {agent.status}
                          </Badge>
                        </div>

                        <p className="mb-2 text-xs text-muted-foreground">
                          {agent.description}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 3).map(capability => (
                            <Badge
                              key={capability}
                              variant="secondary"
                              className="text-xs"
                            >
                              {capability}
                            </Badge>
                          ))}
                          {agent.capabilities.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{agent.capabilities.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Chat Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <AnimatePresence>
              {messages.map(message => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg p-4',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'border bg-muted'
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {message.role === 'assistant' && (
                        <Bot className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      {message.tokenUsage && (
                        <Badge variant="outline" className="text-xs">
                          {message.tokenUsage.totalTokens} tokens
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm">{message.content}</p>

                    {message.tasks && message.tasks.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          Generated Tasks:
                        </div>
                        {message.tasks.map(task => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 rounded bg-background/50 p-2"
                          >
                            <Circle className="h-3 w-3" />
                            <span className="text-xs">{task.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {task.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-2 rounded-lg border bg-muted p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask AI to help with your tasks..."
                className="max-h-[120px] min-h-[60px] flex-1 resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="h-[60px] w-[60px]"
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
      </div>

      {/* Analytics Panel */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 400 }}
            exit={{ width: 0 }}
            className="border-l bg-muted/30 p-4"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Token Analytics</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnalytics(false)}
                >
                  ×
                </Button>
              </div>

              {tokenStats && (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-sm font-medium">Total Usage</div>
                    <div className="text-2xl font-bold">
                      {tokenStats.totalTokens.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">tokens</div>
                  </div>

                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-sm font-medium">Total Cost</div>
                    <div className="text-2xl font-bold">
                      ${tokenStats.totalCost.toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground">USD</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">By Provider</div>
                    {Object.entries(tokenStats.providerBreakdown).map(
                      ([provider, stats]) => (
                        <div
                          key={provider}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="capitalize">{provider}</span>
                          <div className="text-right">
                            <div>{stats.tokens.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              ${stats.cost.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernChatInterface;
