import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Wrench, 
  Workflow, 
  CheckCircle2, 
  AlertCircle,
  Code,
  FileText,
  Image,
  Database,
  Globe,
  Zap,
  Brain,
  MessageSquare,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Stop,
  Download,
  Copy,
  Share2,
  Bookmark,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Star,
  StarOff,
  StarHalf,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Trash2,
  Edit3,
  Save,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Clock,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Shield,
  Lock,
  Unlock,
  Key,
  Settings2,
  Palette,
  Type,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  ListOrdered,
  Quote,
  Code2,
  Terminal,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  CameraOff,
  Phone,
  PhoneOff,
  Mail,
  PhoneCall,
  MessageCircle,
  Bell,
  BellOff,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  Calendar,
  MapPin,
  Navigation,
  Compass,
  Home,
  Building,
  Building2,
  Factory,
  Warehouse,
  Store,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  Banknote,
  Coins,
  Receipt,
  Calculator,
  Percent
} from 'lucide-react';
import { useCompleteAIEmployeeStore } from '@/stores/complete-ai-employee-store';
import { useAuth } from '@/contexts/auth-hooks';
import { completeMCPService } from '@/services/complete-mcp-service';
import { completeRealtimeService } from '@/services/complete-realtime-service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { 
  AIEmployee, 
  ToolDefinition, 
  MCPToolCall, 
  MCPToolResult,
  ChatMessage,
  ExecutionHistory
} from '@/types/complete-ai-employee';

interface CompleteAIEmployeeChatProps {
  employeeId: string;
}

const CompleteAIEmployeeChat: React.FC<CompleteAIEmployeeChatProps> = ({ employeeId }) => {
  const { user } = useAuthStore();
  const { 
    employees, 
    getEmployeeById, 
    sendMessage, 
    getChatHistory,
    executeTool,
    getExecutionHistory
  } = useCompleteAIEmployeeStore();
  
  const [employee, setEmployee] = useState<AIEmployee | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isisLoading, setIsisLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [showTools, setShowTools] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load employee data
  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const emp = await getEmployeeById(employeeId);
        if (emp) {
          setEmployee(emp);
          setAvailableTools(emp.tools || []);
        }
      } catch (error) {
        console.error('Error isLoading employee:', error);
        toast.error('Failed to load employee data');
      }
    };

    loadEmployee();
  }, [employeeId, getEmployeeById]);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user?.id) return;
      
      try {
        const history = await getChatHistory(user.id, employeeId);
        setMessages(history);
      } catch (error) {
        console.error('Error isLoading chat history:', error);
      }
    };

    loadChatHistory();
  }, [user?.id, employeeId, getChatHistory]);

  // Load execution history
  useEffect(() => {
    const loadExecutionHistory = async () => {
      if (!user?.id) return;
      
      try {
        const history = await getExecutionHistory(user.id, employeeId);
        setExecutionHistory(history);
      } catch (error) {
        console.error('Error isLoading execution history:', error);
      }
    };

    loadExecutionHistory();
  }, [user?.id, employeeId, getExecutionHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user?.id || !employee) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      userId: user.id,
      employeeId
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsisLoading(true);

    try {
      const response = await sendMessage(user.id, employeeId, inputMessage);
      
      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data!]);
        
        // If the response contains tool calls, execute them
        if (response.data.toolCalls && response.data.toolCalls.length > 0) {
          setIsExecuting(true);
          
          for (const toolCall of response.data.toolCalls) {
            try {
              const result = await executeTool(user.id, employeeId, toolCall);
              
              if (result.success && result.data) {
                // Add tool execution result to messages
                const toolResultMessage: ChatMessage = {
                  id: `tool-${Date.now()}`,
                  role: 'assistant',
                  content: `Tool executed: ${toolCall.tool}`,
                  timestamp: new Date().toISOString(),
                  userId: user.id,
                  employeeId,
                  toolCall,
                  toolResult: result.data
                };
                
                setMessages(prev => [...prev, toolResultMessage]);
              }
            } catch (error) {
              console.error('Error executing tool:', error);
              toast.error(`Failed to execute tool: ${toolCall.tool}`);
            }
          }
          
          setIsExecuting(false);
        }
      } else {
        toast.error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsisLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'assistant':
        return <Bot className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>isLoading employee...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{employee.name}</h2>
              <p className="text-sm text-muted-foreground">{employee.role}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTools(!showTools)}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Tools
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-start space-x-2 ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {getMessageIcon(message.role)}
                      </div>
                      <div className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatTimestamp(message.timestamp)}
                        </p>
                        
                        {/* Tool execution display */}
                        {message.toolCall && (
                          <div className="mt-2 p-2 bg-background/50 rounded border">
                            <div className="flex items-center space-x-2 text-xs">
                              <Wrench className="h-3 w-3" />
                              <span>Executing: {message.toolCall.tool}</span>
                            </div>
                          </div>
                        )}
                        
                        {message.toolResult && (
                          <div className="mt-2 p-2 bg-background/50 rounded border">
                            <div className="flex items-center space-x-2 text-xs">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              <span>Tool completed</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isisLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isisLoading || isExecuting}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isisLoading || isExecuting}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tools Panel */}
        {showTools && (
          <div className="w-80 border-l bg-muted/50">
            <div className="p-4">
              <h3 className="font-semibold mb-4">Available Tools</h3>
              <div className="space-y-2">
                {availableTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-background"
                    onClick={() => setSelectedTool(tool.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <Wrench className="h-4 w-4" />
                      <span className="text-sm font-medium">{tool.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tool.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteAIEmployeeChat;
