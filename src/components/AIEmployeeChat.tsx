import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  RefreshCw
} from 'lucide-react';
import { useAIEmployeeStore } from '@/stores/ai-employee-store';
import { mcpService } from '@/services/mcp-service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { AIEmployee } from '@/types/ai-employee';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: MCPToolCall[];
  reasoning?: string;
  status?: 'thinking' | 'working' | 'completed' | 'error';
}

interface MCPToolCall {
  tool: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

interface AIEmployeeChatProps {
  employeeId: string;
}

const AIEmployeeChat: React.FC<AIEmployeeChatProps> = ({ employeeId }) => {
  const { employees, loadEmployee } = useAIEmployeeStore();
  const [employee, setEmployee] = useState<AIEmployee | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState<unknown[]>([]);
  const [showTools, setShowTools] = useState(false);
  const [currentToolCalls, setCurrentToolCalls] = useState<MCPToolCall[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load employee data
  useEffect(() => {
    const loadEmployeeData = async () => {
      await loadEmployee(employeeId);
      const emp = employees[employeeId];
      if (emp) {
        setEmployee(emp);
        // Load available tools
        const tools = mcpService.listTools();
        setAvailableTools(tools);
        
        // Add welcome message
        setMessages([{
          id: 'welcome',
          type: 'assistant',
          content: `Hello! I'm ${emp.name}, your ${emp.role}. I'm here to help you with ${emp.category.replace('_', ' ')} tasks. I have access to ${tools.length} tools and can assist you with various projects. How can I help you today?`,
          timestamp: new Date()
        }]);
      }
    };
    
    loadEmployeeData();
  }, [employeeId, loadEmployee, employees]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message send
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI thinking and tool usage
      await processAIResponse(inputMessage);
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message');
    } finally {
      setIsLoading(false);
    }
  };

  // Process AI response with MCP tools
  const processAIResponse = async (userMessage: string) => {
    // Add thinking message
    const thinkingMessage: ChatMessage = {
      id: `thinking-${Date.now()}`,
      type: 'assistant',
      content: 'Let me analyze your request and determine the best approach...',
      timestamp: new Date(),
      status: 'thinking'
    };

    setMessages(prev => [...prev, thinkingMessage]);

    // Simulate reasoning and tool selection
    // TODO: Replace with actual AI response

    // Determine which tools to use based on the message
    const toolCalls = await determineToolCalls(userMessage);
    
    if (toolCalls.length > 0) {
      // Update thinking message with tool calls
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessage.id 
          ? { ...msg, content: 'I need to use some tools to help you with this. Let me execute them...', toolCalls, status: 'working' }
          : msg
      ));

      // Execute tool calls
      const results = await executeToolCalls(toolCalls);
      
      // Generate final response
      const finalResponse = await generateFinalResponse(userMessage, results);
      
      // Update with final response
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessage.id 
          ? { ...msg, content: finalResponse, toolCalls: results, status: 'completed' }
          : msg
      ));
    } else {
      // Direct response without tools
      const response = await generateDirectResponse(userMessage);
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessage.id 
          ? { ...msg, content: response, status: 'completed' }
          : msg
      ));
    }
  };

  // Determine which tools to use
  const determineToolCalls = async (message: string): Promise<MCPToolCall[]> => {
    const toolCalls: MCPToolCall[] = [];
    
    // Simple keyword-based tool selection (in real implementation, this would be AI-driven)
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('react') || lowerMessage.includes('component')) {
      toolCalls.push({
        tool: 'generate_react_component',
        parameters: {
          componentName: 'UserComponent',
          features: ['state', 'props', 'hooks'],
          styling: 'tailwind'
        },
        status: 'pending'
      });
    }
    
    if (lowerMessage.includes('api') || lowerMessage.includes('endpoint')) {
      toolCalls.push({
        tool: 'generate_api_endpoint',
        parameters: {
          endpointPath: '/api/users',
          httpMethod: 'GET',
          framework: 'express',
          database: 'postgresql'
        },
        status: 'pending'
      });
    }
    
    if (lowerMessage.includes('test') || lowerMessage.includes('testing')) {
      toolCalls.push({
        tool: 'generate_test_cases',
        parameters: {
          code: 'function example() { return true; }',
          testFramework: 'jest',
          testType: 'unit'
        },
        status: 'pending'
      });
    }
    
    if (lowerMessage.includes('data') || lowerMessage.includes('analyze')) {
      toolCalls.push({
        tool: 'analyze_data',
        parameters: {
          data: 'sample data',
          analysisType: 'descriptive',
          outputFormat: 'json'
        },
        status: 'pending'
      });
    }
    
    return toolCalls;
  };

  // Execute tool calls
  const executeToolCalls = async (toolCalls: MCPToolCall[]): Promise<MCPToolCall[]> => {
    const results: MCPToolCall[] = [];
    
    for (const toolCall of toolCalls) {
      try {
        toolCall.status = 'executing';
        setCurrentToolCalls(prev => [...prev, toolCall]);
        
        const result = await mcpService.callTool(toolCall.tool, toolCall.parameters);
        
        toolCall.result = result;
        toolCall.status = 'completed';
        results.push(toolCall);
        
        setCurrentToolCalls(prev => prev.filter(tc => tc.tool !== toolCall.tool));
      } catch (error: unknown) {
        toolCall.error = error.message;
        toolCall.status = 'failed';
        results.push(toolCall);
        
        setCurrentToolCalls(prev => prev.filter(tc => tc.tool !== toolCall.tool));
      }
    }
    
    return results;
  };

  // Generate final response
  const generateFinalResponse = async (userMessage: string, toolResults: MCPToolCall[]): Promise<string> => {
    // Simulate AI processing the tool results
    // TODO: Replace with actual AI response
    
    let response = `I've analyzed your request and used ${toolResults.length} tool(s) to help you:\n\n`;
    
    toolResults.forEach((result, index) => {
      if (result.status === 'completed') {
        response += `✅ **${result.tool}**: Successfully executed\n`;
        if (result.result) {
          response += `   Result: ${JSON.stringify(result.result).substring(0, 100)}...\n\n`;
        }
      } else {
        response += `❌ **${result.tool}**: Failed - ${result.error}\n\n`;
      }
    });
    
    response += `Based on the results, I can help you implement this solution. Would you like me to explain unknown specific part or help you with the next steps?`;
    
    return response;
  };

  // Generate direct response
  const generateDirectResponse = async (message: string): Promise<string> => {
    // Simulate AI processing
    // TODO: Replace with actual AI response
    
    return `I understand your request. As your ${employee?.role}, I can help you with this. Let me know if you'd like me to use unknown specific tools or if you need more details about how I can assist you.`;
  };

  // Handle tool selection
  const handleToolSelect = (tool: unknown) => {
    setInputMessage(prev => prev + `\n\nPlease use the ${tool.name} tool with appropriate parameters.`);
    setShowTools(false);
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{employee.name}</h2>
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
              Tools ({availableTools.length})
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
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
                  "flex",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cn(
                  "max-w-[80%] rounded-lg p-4",
                  message.type === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}>
                  <div className="flex items-center space-x-2 mb-2">
                    {message.type === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {message.type === 'user' ? 'You' : employee.name}
                    </span>
                    {message.status && (
                      <Badge variant="outline" className="text-xs">
                        {message.status}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Tool Calls */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium">Tools Used:</p>
                      {message.toolCalls.map((toolCall, index) => (
                        <div key={index} className="bg-background rounded p-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Wrench className="h-3 w-3" />
                            <span className="font-medium">{toolCall.tool}</span>
                            <Badge 
                              variant={toolCall.status === 'completed' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {toolCall.status}
                            </Badge>
                          </div>
                          {toolCall.error && (
                            <p className="text-red-500 text-xs mt-1">{toolCall.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Current Tool Executions */}
          {currentToolCalls.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Executing tools...</p>
              {currentToolCalls.map((toolCall, index) => (
                <div key={index} className="bg-muted rounded p-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">{toolCall.tool}</span>
                    <Badge variant="outline" className="text-xs">executing</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Tools Panel */}
      <AnimatePresence>
        {showTools && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t bg-card"
          >
            <div className="p-4">
              <h3 className="text-sm font-medium mb-3">Available Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableTools.map((tool, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleToolSelect(tool)}
                    className="justify-start"
                  >
                    <Wrench className="h-3 w-3 mr-2" />
                    {tool.name}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="border-t bg-card p-4">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask ${employee.name} anything...`}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
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
  );
};

export default AIEmployeeChat;
