import { useState, useCallback, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  result?: unknown;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export const useChat = (employeeId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        // TODO: Load from API
        setMessages([]);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadChatHistory();
  }, [employeeId]);

  // Load available tools
  useEffect(() => {
    const loadTools = async () => {
      try {
        // TODO: Load from API
        setAvailableTools([]);
      } catch (error) {
        console.error('Failed to load tools:', error);
      }
    };

    loadTools();
  }, [employeeId]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // TODO: Send to API
      const response = await new Promise<ChatMessage>(resolve => {
        setTimeout(() => {
          resolve({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I received your message: "${inputMessage}". This is a placeholder response.`,
            timestamp: new Date(),
          });
        }, 1000);
      });

      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading]);

  const toggleTool = useCallback((toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    inputMessage,
    setInputMessage,
    availableTools,
    selectedTools,
    handleSendMessage,
    toggleTool,
    clearChat,
  };
};
