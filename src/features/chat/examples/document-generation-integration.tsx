/**
 * Document Generation Integration Example
 *
 * This file demonstrates how to integrate the document generation feature
 * into the chat interface. It shows:
 * 1. Detecting document requests
 * 2. Generating documents with Claude
 * 3. Rendering documents with enhanced markdown
 * 4. Providing download options
 */

import React, { useState, useCallback } from 'react';
import { useDocumentGeneration } from '../hooks/use-document-generation';
import { DocumentMessage } from '../components/DocumentMessage';
import type { GeneratedDocument } from '../services/document-generation-service';
import type { ChatMessage } from '../types';

/**
 * Example: Enhanced Chat Hook with Document Generation
 *
 * This shows how to integrate document generation into your existing chat hook
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useEnhancedChatWithDocuments(sessionId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { isGenerating, generateDocument, enhanceDocument, isDocumentRequest } =
    useDocumentGeneration();

  /**
   * Send message handler with document generation support
   */
  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sessionId,
        role: 'user',
        content,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsLoading(true);

      try {
        // Check if this is a document generation request
        if (isDocumentRequest(content)) {
          // Generate document using Claude
          const document = await generateDocument(content, sessionId);

          if (document) {
            // Add assistant message with document
            const assistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              sessionId,
              role: 'assistant',
              content: document.content,
              createdAt: new Date(),
              metadata: {
                isDocument: true,
                documentTitle: document.title,
                model: document.metadata.model,
                tokensUsed: document.metadata.tokensUsed,
                // Store full document metadata
                documentData: document,
              },
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
        } else {
          // Regular chat message processing
          // ... your existing chat logic here
        }
      } catch (error) {
        console.error('Failed to process message:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isDocumentRequest, generateDocument]
  );

  /**
   * Enhance document handler
   */
  const handleEnhanceDocument = useCallback(
    async (
      messageId: string,
      enhancement: 'proofread' | 'expand' | 'summarize' | 'restructure'
    ) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message || !message.metadata?.isDocument) return;

      const enhancedContent = await enhanceDocument(
        message.content,
        enhancement,
        sessionId
      );

      if (enhancedContent) {
        // Update the message with enhanced content
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: enhancedContent,
                  metadata: {
                    ...m.metadata,
                    enhanced: enhancement,
                  },
                }
              : m
          )
        );
      }
    },
    [messages, enhanceDocument, sessionId]
  );

  return {
    messages,
    isLoading: isLoading || isGenerating,
    sendMessage,
    handleEnhanceDocument,
  };
}

/**
 * Example: Document-Aware Message Renderer
 *
 * This shows how to render messages with document support
 */
export const DocumentAwareMessageRenderer: React.FC<{
  message: ChatMessage;
  onEnhance?: (
    enhancement: 'proofread' | 'expand' | 'summarize' | 'restructure'
  ) => void;
  isEnhancing?: boolean;
}> = ({ message, onEnhance, isEnhancing }) => {
  // Check if this message contains a document
  if (message.metadata?.isDocument && message.metadata?.documentData) {
    const document = message.metadata.documentData as GeneratedDocument;

    return (
      <DocumentMessage
        document={document}
        onEnhance={onEnhance}
        isEnhancing={isEnhancing}
      />
    );
  }

  // Regular message rendering
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {message.content}
    </div>
  );
};

/**
 * Example: Complete Chat Interface with Document Generation
 *
 * This shows a complete example of integrating everything
 */
export const ChatInterfaceWithDocuments: React.FC<{
  sessionId?: string;
}> = ({ sessionId }) => {
  const { messages, isLoading, sendMessage, handleEnhanceDocument } =
    useEnhancedChatWithDocuments(sessionId);
  const [input, setInput] = useState('');
  const [enhancingMessageId, setEnhancingMessageId] = useState<string | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await sendMessage(input);
    setInput('');
  };

  const handleEnhance = async (
    messageId: string,
    enhancement: 'proofread' | 'expand' | 'summarize' | 'restructure'
  ) => {
    setEnhancingMessageId(messageId);
    await handleEnhanceDocument(messageId, enhancement);
    setEnhancingMessageId(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <DocumentAwareMessageRenderer
            key={message.id}
            message={message}
            onEnhance={
              message.metadata?.isDocument
                ? (enhancement) => handleEnhance(message.id, enhancement)
                : undefined
            }
            isEnhancing={enhancingMessageId === message.id}
          />
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or request a document..."
            className="flex-1 rounded-lg border px-4 py-2"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-primary px-6 py-2 text-primary-foreground"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Try: "Create a report on AI trends", "Write a proposal for...", or
          "Generate documentation for..."
        </p>
      </form>
    </div>
  );
};

/**
 * Integration Steps:
 *
 * 1. Import the document generation hook:
 *    import { useDocumentGeneration } from './hooks/use-document-generation';
 *
 * 2. Use the hook in your chat component:
 *    const { isGenerating, generateDocument, isDocumentRequest } = useDocumentGeneration();
 *
 * 3. Check for document requests before sending to regular chat:
 *    if (isDocumentRequest(message)) {
 *      const document = await generateDocument(message, sessionId);
 *      // Add document to messages
 *    }
 *
 * 4. Render documents with DocumentMessage component:
 *    {message.metadata?.isDocument && (
 *      <DocumentMessage document={message.metadata.documentData} />
 *    )}
 *
 * 5. Add document metadata to your message type:
 *    metadata?: {
 *      isDocument?: boolean;
 *      documentTitle?: string;
 *      documentData?: GeneratedDocument;
 *    }
 */
