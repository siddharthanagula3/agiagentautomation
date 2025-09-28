import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAIEmployeeStore } from '@/stores/ai-employee-store';
import { mcpService } from '@/services/mcp-service';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ToolsPanel } from './ToolsPanel';
import { ChatInput } from './ChatInput';
import type { AIEmployee } from '@/types/ai-employee';
import type { ChatMessage, MCPToolCall } from './ChatMessage';

interface AIEmployeeChatProps {
  employeeId: string;
}

const AIEmployeeChatRefactored: React.FC<AIEmployeeChatProps> = ({ employeeId }) => {
  const { employees, loadEmployee } = useAIEmployeeStore();
  const [employee, setEmployee] = useState<AIEmployee | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState<unknown[]>([]);
  const [showTools, setShowTools] = useState(false);
  const [currentToolCalls, setCurrentToolCalls] = useState<MCPToolCall[]>([]);

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
    await new Promise(resolve => setTimeout(resolve, 1000));

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
        toolCall.error = error instanceof Error ? error.message : 'Unknown error';
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    
    response += `Based on the results, I can help you implement this solution. Would you like me to explain any specific part or help you with the next steps?`;
    
    return response;
  };

  // Generate direct response
  const generateDirectResponse = async (message: string): Promise<string> => {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return `I understand your request. As your ${employee?.role}, I can help you with this. Let me know if you'd like me to use any specific tools or if you need more details about how I can assist you.`;
  };

  // Handle tool selection
  const handleToolSelect = (tool: unknown) => {
    setInputMessage(prev => prev + `\n\nPlease use the ${(tool as { name: string }).name} tool with appropriate parameters.`);
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
      <ChatHeader
        employee={employee}
        availableToolsCount={availableTools.length}
        showTools={showTools}
        onToggleTools={() => setShowTools(!showTools)}
      />

      <ChatMessageList
        messages={messages}
        currentToolCalls={currentToolCalls}
        employeeName={employee.name}
      />

      <ToolsPanel
        showTools={showTools}
        availableTools={availableTools}
        onToolSelect={handleToolSelect}
      />

      <ChatInput
        value={inputMessage}
        onChange={setInputMessage}
        onSend={handleSendMessage}
        isLoading={isLoading}
        placeholder={`Ask ${employee.name} anything...`}
      />
    </div>
  );
};

export default AIEmployeeChatRefactored;
