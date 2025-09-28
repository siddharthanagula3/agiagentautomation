/**
 * Custom hook for chat functionality using React Query
 * Handles message state, tool execution, and AI responses
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { mcpService } from '@/services/mcp-service';
import type { ChatMessage, MCPToolCall } from '@/components/chat/ChatMessage';

interface UseChatOptions {
  employeeId: string;
  initialMessages?: ChatMessage[];
}

export const useChat = ({ employeeId, initialMessages = [] }: UseChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [currentToolCalls, setCurrentToolCalls] = useState<MCPToolCall[]>([]);

  // Get available tools
  const { data: availableTools, isLoading: toolsLoading } = useQuery({
    queryKey: ['tools', employeeId],
    queryFn: () => mcpService.listTools(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

      // Process AI response
      return await processAIResponse(message);
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, response]);
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date(),
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  // Process AI response with tools
  const processAIResponse = async (userMessage: string): Promise<ChatMessage> => {
    // Add thinking message
    const thinkingMessage: ChatMessage = {
      id: `thinking-${Date.now()}`,
      type: 'assistant',
      content: 'Let me analyze your request and determine the best approach...',
      timestamp: new Date(),
      status: 'thinking'
    };

    setMessages(prev => [...prev, thinkingMessage]);

    // Simulate reasoning
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Determine tool calls
    const toolCalls = await determineToolCalls(userMessage);
    
    if (toolCalls.length > 0) {
      // Update thinking message
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessage.id 
          ? { ...msg, content: 'I need to use some tools to help you with this. Let me execute them...', toolCalls, status: 'working' }
          : msg
      ));

      // Execute tool calls
      const results = await executeToolCalls(toolCalls);
      
      // Generate final response
      const finalResponse = await generateFinalResponse(userMessage, results);
      
      return {
        ...thinkingMessage,
        content: finalResponse,
        toolCalls: results,
        status: 'completed'
      };
    } else {
      // Direct response
      const response = await generateDirectResponse(userMessage);
      return {
        ...thinkingMessage,
        content: response,
        status: 'completed'
      };
    }
  };

  // Determine which tools to use
  const determineToolCalls = async (message: string): Promise<MCPToolCall[]> => {
    const toolCalls: MCPToolCall[] = [];
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

  // Generate responses
  const generateFinalResponse = async (userMessage: string, toolResults: MCPToolCall[]): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let response = `I've analyzed your request and used ${toolResults.length} tool(s) to help you:\n\n`;
    
    toolResults.forEach((result) => {
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

  const generateDirectResponse = async (message: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `I understand your request. I can help you with this. Let me know if you'd like me to use any specific tools or if you need more details about how I can assist you.`;
  };

  // Send message
  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  }, [sendMessageMutation]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    currentToolCalls,
    availableTools: availableTools || [],
    toolsLoading,
    sendMessage,
    clearMessages,
    isSending: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
  };
};
