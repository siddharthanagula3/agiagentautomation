import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { unifiedLLMService } from '@_core/api/llm/unified-llm-service';
import type { ChatMessage, ChatMode, ToolCall } from '../types';

interface SendMessageParams {
  content: string;
  attachments?: File[];
  mode?: ChatMode;
  model?: string;
  temperature?: number;
  tools?: unknown[];
}

export const useChat = (sessionId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages for the current session
  useEffect(() => {
    if (sessionId) {
      loadMessages(sessionId);
    }
  }, [sessionId, loadMessages]);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      // TODO: Implement message loading from database
      setMessages([]);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages');
    }
  }, []);

  const sendMessage = useCallback(
    async ({
      content,
      attachments,
      mode = 'team',
      model = 'gpt-4-turbo',
      temperature = 0.7,
      tools = [],
    }: SendMessageParams) => {
      if (!content.trim()) return;

      setIsLoading(true);
      setError(null);

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        attachments: attachments?.map((file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
        })),
        createdAt: new Date(),
        metadata: {
          mode,
          model,
          temperature,
        },
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        // Create assistant message placeholder
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          createdAt: new Date(),
          metadata: {
            mode,
            model,
            temperature,
          },
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Send to LLM service
        const response = await unifiedLLMService.sendMessage(
          [
            ...messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user', content },
          ],
          sessionId,
          undefined, // userId
          'openai' // provider
        );

        // Update assistant message with response
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: response.content }
              : msg
          )
        );

        // TODO: Save messages to database
        // TODO: Handle tool calls if present
      } catch (error) {
        const err = error as { message?: string };
        setError(err.message || 'Failed to send message');
        toast({
          title: 'Failed to send message',
          description: err.message || 'Unknown error',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, sessionId]
  );

  const regenerateMessage = useCallback(async (messageId: string) => {
    // TODO: Implement message regeneration
    console.log('Regenerate message:', messageId);
  }, []);

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: newContent,
                isEdited: true,
                editedAt: new Date(),
              }
            : msg
        )
      );
    },
    []
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    regenerateMessage,
    editMessage,
    deleteMessage,
    clearMessages,
  };
};
