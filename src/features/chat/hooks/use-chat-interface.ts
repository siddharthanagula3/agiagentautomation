import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@shared/lib/supabase-client';
import { useChatStore } from '@shared/stores/chat-store';
import { chatPersistenceService } from '../services/conversation-storage';
import { chatStreamingService } from '../services/streaming-response-handler';
import type { ChatMessage, ChatMode, StreamingUpdate } from '../types';

interface SendMessageParams {
  content: string;
  attachments?: File[];
  mode?: ChatMode;
  model?: string;
  temperature?: number;
  tools?: unknown[];
}

export const useChat = (sessionId?: string) => {
  const { selectedModel } = useChatStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Get current user
  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  };

  // Load messages from database
  const loadMessages = useCallback(async (sid: string) => {
    try {
      setIsLoading(true);
      const loadedMessages =
        await chatPersistenceService.getSessionMessages(sid);

      // Ensure all message timestamps are valid Date objects
      const validatedMessages = loadedMessages.map((msg) => {
        let createdAt: Date;

        if (msg.createdAt instanceof Date) {
          createdAt = msg.createdAt;
        } else if (
          typeof msg.createdAt === 'string' ||
          typeof msg.createdAt === 'number'
        ) {
          createdAt = new Date(msg.createdAt);
        } else {
          createdAt = new Date();
        }

        // Validate date - if invalid, use current date
        if (isNaN(createdAt.getTime())) {
          console.warn('Invalid createdAt for message:', msg.id, msg.createdAt);
          createdAt = new Date();
        }

        return {
          ...msg,
          createdAt,
        };
      });

      // Sort messages by createdAt to ensure correct order (oldest first)
      const sortedMessages = validatedMessages.sort((a, b) => {
        const aTime =
          a.createdAt instanceof Date
            ? a.createdAt.getTime()
            : new Date(a.createdAt || Date.now()).getTime();
        const bTime =
          b.createdAt instanceof Date
            ? b.createdAt.getTime()
            : new Date(b.createdAt || Date.now()).getTime();

        // Handle invalid dates
        if (isNaN(aTime)) return 1;
        if (isNaN(bTime)) return -1;

        return aTime - bTime; // Oldest first
      });

      setMessages(sortedMessages);
      setError(null);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages');
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load messages for the current session
  useEffect(() => {
    if (sessionId) {
      loadMessages(sessionId);
    }
  }, [sessionId, loadMessages]);

  // Send message with streaming
  const sendMessage = useCallback(
    async ({
      content,
      attachments,
      mode = 'team',
      model = selectedModel || 'gpt-4o', // Use user's selected model or default to gpt-4o
      temperature = 0.7,
      tools = [],
    }: SendMessageParams) => {
      if (!content.trim()) return;

      setIsLoading(true);
      setError(null);
      setIsStreaming(true);
      setStreamingContent('');

      const user = await getCurrentUser();
      if (!user) {
        toast.error('You must be logged in to send messages');
        setIsLoading(false);
        return;
      }

      try {
        // Create user message
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

        // Add to UI immediately
        setMessages((prev) => [...prev, userMessage]);

        // Save to database
        if (sessionId) {
          await chatPersistenceService.saveMessage(sessionId, 'user', content);
        }

        // Create assistant message placeholder
        const assistantMessageId = crypto.randomUUID();
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
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

        // Stream the response
        const conversationHistory = [
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: 'user', content },
        ];

        let fullResponse = '';

        // Use streaming service
        for await (const update of chatStreamingService.streamMessage(
          conversationHistory,
          {
            sessionId,
            userId: user.id,
            provider: 'openai',
          }
        )) {
          if (update.type === 'content' && update.content) {
            fullResponse += update.content;
            setStreamingContent(fullResponse);

            // Update the assistant message in real-time
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            );
          } else if (update.type === 'error') {
            throw new Error(update.error);
          }
        }

        // Save assistant response to database
        if (sessionId && fullResponse) {
          await chatPersistenceService.saveMessage(
            sessionId,
            'assistant',
            fullResponse
          );
        }
      } catch (error) {
        const err = error as { message?: string };
        setError(err.message || 'Failed to send message');
        toast.error(err.message || 'Failed to send message');

        // Remove the placeholder assistant message on error (only empty ones)
        setMessages((prev) =>
          prev.filter((msg) => msg.role !== 'assistant' || msg.content !== '')
        );
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingContent('');
      }
    },
    [messages, sessionId, selectedModel]
  );

  // Regenerate last assistant message
  const regenerateMessage = useCallback(
    async (messageId: string) => {
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex === -1) return;

      // Find the user message before this assistant message
      const userMessageIndex = messageIndex - 1;
      if (userMessageIndex < 0) return;

      const userMessage = messages[userMessageIndex];
      if (userMessage.role !== 'user') return;

      // Remove the old assistant message
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      // Delete from database
      if (sessionId) {
        await chatPersistenceService.deleteMessage(messageId);
      }

      // Resend with same parameters
      await sendMessage({
        content: userMessage.content,
        mode: userMessage.metadata?.mode as ChatMode,
        model: userMessage.metadata?.model as string,
        temperature: userMessage.metadata?.temperature as number,
      });
    },
    [messages, sendMessage, sessionId]
  );

  // Edit a message
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

      // TODO: Update in database
      toast.success('Message updated');
    },
    []
  );

  // Delete a message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      // Delete from database
      if (sessionId) {
        try {
          await chatPersistenceService.deleteMessage(messageId);
          toast.success('Message deleted');
        } catch (error) {
          console.error('Failed to delete message:', error);
          toast.error('Failed to delete message');
        }
      }
    },
    [sessionId]
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    streamingContent,
    isStreaming,
    sendMessage,
    regenerateMessage,
    editMessage,
    deleteMessage,
    clearMessages,
  };
};
