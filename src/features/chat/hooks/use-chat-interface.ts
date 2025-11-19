import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@shared/lib/supabase-client';
import { useChatStore } from '@shared/stores/chat-store';
import { chatPersistenceService } from '../services/conversation-storage';
import { chatStreamingService } from '../services/streaming-response-handler';
import { employeeChatService } from '../services/employee-chat-service';
import {
  shouldPerformWebSearch,
  performWebSearch,
  isWebSearchAvailable,
} from '../services/web-search-integration';
import {
  chatToolRouter,
  type ToolType,
  type ToolRouterResult,
} from '../services/chat-tool-router';
import type { ChatMessage, ChatMode, StreamingUpdate } from '../types';
import type { SearchResponse } from '@core/integrations/web-search-handler';
import type { MediaGenerationResult } from '@core/integrations/media-generation-handler';
import type { GeneratedDocument } from '../services/document-generation-service';

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
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [activeTools, setActiveTools] = useState<ToolType[]>([]);
  const [toolProgress, setToolProgress] = useState<
    Record<ToolType, { status: string; progress?: number }>
  >({});

  // Get current user
  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  };

  /**
   * Stream text word-by-word for better UX
   * Simulates real-time streaming even when we have the full response
   */
  const streamText = async (
    text: string,
    onChunk: (chunk: string, accumulated: string) => void,
    delayMs: number = 30
  ): Promise<void> => {
    const words = text.split(' ');
    let accumulated = '';

    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
      accumulated += chunk;
      onChunk(chunk, accumulated);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
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

        // Updated: Nov 16th 2025 - Removed console statements for production
        // Validate date - if invalid, use current date
        if (isNaN(createdAt.getTime())) {
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

  // Send message with dynamic employee selection
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

        // UNIFIED TOOL ROUTER - Analyze and execute tools
        const toolIndicatorId = crypto.randomUUID();
        const toolIndicatorMessage: ChatMessage = {
          id: toolIndicatorId,
          role: 'assistant',
          content: '🔄 Analyzing your request and selecting tools...',
          createdAt: new Date(),
          metadata: {
            isToolProcessing: true,
          },
        };

        setMessages((prev) => [...prev, toolIndicatorMessage]);

        // Build conversation history
        const conversationHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Route and execute tools
        let toolRouterResult: ToolRouterResult | undefined;
        try {
          toolRouterResult = await chatToolRouter.routeAndExecuteTools(
            content,
            {
              userId: user.id,
              sessionId,
              conversationHistory,
              onProgress: (toolType, status, progress) => {
                setActiveTools((prev) => {
                  if (!prev.includes(toolType)) {
                    return [...prev, toolType];
                  }
                  return prev;
                });
                setToolProgress((prev) => ({
                  ...prev,
                  [toolType]: { status, progress },
                }));
              },
            }
          );

          console.log('[Chat] Tool router result:', {
            detectedTools: toolRouterResult.detectedTools,
            executionResults: toolRouterResult.executionResults.length,
            shouldContinueToLLM: toolRouterResult.shouldContinueToLLM,
          });

          // Remove tool indicator
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== toolIndicatorId)
          );

          // Display tool results
          for (const result of toolRouterResult.executionResults) {
            if (result.status === 'success' && result.data) {
              const toolResultMessageId = crypto.randomUUID();
              let toolResultMessage: ChatMessage;

              if (result.toolType === 'image-generation') {
                const imageData = result.data as MediaGenerationResult;
                toolResultMessage = {
                  id: toolResultMessageId,
                  role: 'assistant',
                  content: `Generated image: ${imageData.prompt}`,
                  createdAt: new Date(),
                  metadata: {
                    toolResult: true,
                    toolType: 'image-generation',
                    imageUrl: imageData.url,
                    imageData: imageData,
                  },
                };
              } else if (result.toolType === 'video-generation') {
                const videoData = result.data as MediaGenerationResult;
                toolResultMessage = {
                  id: toolResultMessageId,
                  role: 'assistant',
                  content: `Generated video: ${videoData.prompt}`,
                  createdAt: new Date(),
                  metadata: {
                    toolResult: true,
                    toolType: 'video-generation',
                    videoUrl: videoData.url,
                    thumbnailUrl: videoData.thumbnailUrl,
                    videoData: videoData,
                  },
                };
              } else if (result.toolType === 'document-creation') {
                const docData = result.data as GeneratedDocument;
                toolResultMessage = {
                  id: toolResultMessageId,
                  role: 'assistant',
                  content: docData.content,
                  createdAt: new Date(),
                  metadata: {
                    toolResult: true,
                    toolType: 'document-creation',
                    documentTitle: docData.title,
                    documentData: docData,
                  },
                };
              } else if (result.toolType === 'web-search') {
                const searchData = result.data as SearchResponse;
                toolResultMessage = {
                  id: toolResultMessageId,
                  role: 'assistant',
                  content:
                    searchData.answer ||
                    `Found ${searchData.results.length} search results`,
                  createdAt: new Date(),
                  metadata: {
                    toolResult: true,
                    toolType: 'web-search',
                    searchResults: searchData,
                  },
                };
              } else {
                // Generic tool result
                toolResultMessage = {
                  id: toolResultMessageId,
                  role: 'assistant',
                  content: `Tool executed: ${result.toolType}`,
                  createdAt: new Date(),
                  metadata: {
                    toolResult: true,
                    toolType: result.toolType,
                    toolData: result.data,
                  },
                };
              }

              setMessages((prev) => [...prev, toolResultMessage]);
            } else if (result.status === 'failed') {
              toast.error(`${result.toolType} failed: ${result.error}`);
            }
          }

          // Show suggestion if code generation detected
          if (toolRouterResult.suggestedRoute === '/vibe') {
            toast.info('For better code generation experience, try /vibe', {
              duration: 5000,
              action: {
                label: 'Go to Vibe',
                onClick: () => (window.location.href = '/vibe'),
              },
            });
          } else if (toolRouterResult.suggestedRoute === '/mission-control') {
            toast.info('For complex multi-step tasks, try Mission Control', {
              duration: 5000,
              action: {
                label: 'Go to Mission Control',
                onClick: () => (window.location.href = '/mission-control'),
              },
            });
          }

          // If tools handled everything, don't continue to LLM
          if (!toolRouterResult.shouldContinueToLLM) {
            setIsLoading(false);
            setIsStreaming(false);
            setActiveTools([]);
            setToolProgress({});
            return;
          }
        } catch (error) {
          console.error('[Chat] Tool router error:', error);
          // Remove tool indicator
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== toolIndicatorId)
          );
          // Continue to LLM even if tools fail
        }

        // Reset tool state
        setActiveTools([]);
        setToolProgress({});

        // Check if web search is needed (legacy support, now handled by tool router)
        let searchResults: SearchResponse | undefined;
        if (toolRouterResult?.executionResults) {
          const searchResult = toolRouterResult.executionResults.find(
            (r) => r.toolType === 'web-search'
          );
          if (searchResult && searchResult.status === 'success') {
            searchResults = searchResult.data as SearchResponse;
          }
        }

        // Create thinking indicator message
        const thinkingMessageId = crypto.randomUUID();
        const thinkingMessage: ChatMessage = {
          id: thinkingMessageId,
          role: 'assistant',
          content: '🤔 Analyzing your message and selecting best employee...',
          createdAt: new Date(),
          metadata: {
            isThinking: true,
          },
        };

        setMessages((prev) => [...prev, thinkingMessage]);

        // Enhance user message with tool results if available
        let enhancedContent = content;
        if (toolRouterResult?.enhancedContext) {
          enhancedContent = content + toolRouterResult.enhancedContext;
        }

        // Use employee chat service for dynamic selection
        const result = await employeeChatService.sendMessage(
          enhancedContent,
          conversationHistory,
          {
            userId: user.id,
            sessionId,
          }
        );

        // Remove thinking message
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== thinkingMessageId)
        );

        // Check if this was a multi-agent collaboration
        if (result.metadata.isMultiAgent && result.collaborationMessages) {
          // Store collaboration messages in metadata (collapsed by default)
          const collaborationData = result.collaborationMessages.map((collab) => ({
            employeeName: collab.employeeName,
            employeeAvatar: collab.employeeAvatar,
            content: collab.content,
            messageType: collab.messageType,
            to: collab.to,
          }));

          // Add final synthesized answer with streaming (includes collapsed contributions)
          const assistantMessageId = crypto.randomUUID();
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            createdAt: new Date(),
            metadata: {
              mode,
              model: result.metadata.model,
              temperature,
              employeeName: 'Supervisor',
              employeeId: 'supervisor',
              employeeAvatar: '#4f46e5', // Indigo for supervisor
              selectionReason: result.selectionReason,
              thinkingSteps: result.thinkingSteps,
              tokensUsed: result.metadata.tokensUsed,
              isMultiAgent: true,
              employeesInvolved: result.metadata.employeesInvolved,
              isSynthesis: true,
              collaborationMessages: collaborationData, // Store for expandable view
              searchResults, // Include search results if available
              isStreaming: true, // Mark as streaming
            },
          };

          // Add empty message to show typing indicator
          setMessages((prev) => [...prev, assistantMessage]);

          // Stream the synthesized response word-by-word
          await streamText(result.response, (chunk, accumulated) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: accumulated,
                    }
                  : msg
              )
            );
          });

          // Mark streaming as complete
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    metadata: {
                      ...msg.metadata,
                      isStreaming: false,
                    },
                  }
                : msg
            )
          );

          // Save only the final synthesized answer to database
          if (sessionId && result.response) {
            await chatPersistenceService.saveMessage(
              sessionId,
              'assistant',
              result.response
            );
          }
        } else {
          // Single employee response - STREAM IT!
          const assistantMessageId = crypto.randomUUID();

          // Create initial message with typing indicator
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            createdAt: new Date(),
            metadata: {
              mode,
              model: result.metadata.model,
              temperature,
              employeeName: result.selectedEmployee?.name,
              employeeId: result.selectedEmployee?.name,
              employeeAvatar: result.selectedEmployee
                ? employeeChatService.getEmployeeAvatar(
                    result.selectedEmployee.name
                  )
                : undefined,
              selectionReason: result.selectionReason,
              thinkingSteps: result.thinkingSteps,
              tokensUsed: result.metadata.tokensUsed,
              isMultiAgent: false,
              searchResults, // Include search results if available
              isStreaming: true, // Mark as streaming
            },
          };

          // Add empty message to show typing indicator
          setMessages((prev) => [...prev, assistantMessage]);

          // Stream the response word-by-word
          await streamText(result.response, (chunk, accumulated) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: accumulated,
                    }
                  : msg
              )
            );
          });

          // Mark streaming as complete
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    metadata: {
                      ...msg.metadata,
                      isStreaming: false,
                    },
                  }
                : msg
            )
          );

          // Save assistant response to database
          if (sessionId && result.response) {
            await chatPersistenceService.saveMessage(
              sessionId,
              'assistant',
              result.response
            );
          }
        }
      } catch (error) {
        const err = error as { message?: string };
        setError(err.message || 'Failed to send message');
        toast.error(err.message || 'Failed to send message');

        // Remove any thinking/placeholder messages on error
        setMessages((prev) =>
          prev.filter(
            (msg) =>
              msg.role !== 'assistant' ||
              (msg.content !== '' && !msg.metadata?.isThinking)
          )
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
    isSearching,
    searchQuery,
    activeTools,
    toolProgress,
    sendMessage,
    regenerateMessage,
    editMessage,
    deleteMessage,
    clearMessages,
  };
};
