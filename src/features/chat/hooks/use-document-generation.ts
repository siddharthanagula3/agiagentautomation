/**
 * Document Generation Hook
 *
 * React hook for handling document generation in chat
 * Detects document requests and generates content using Claude
 */

import { useState, useCallback } from 'react';
import {
  documentGenerationService,
  type DocumentRequest,
  type GeneratedDocument,
} from '../services/document-generation-service';
import { useAuthStore } from '@shared/stores/authentication-store';
import { toast } from 'sonner';

interface UseDocumentGenerationReturn {
  isGenerating: boolean;
  error: string | null;
  generateDocument: (
    message: string,
    sessionId?: string
  ) => Promise<GeneratedDocument | null>;
  enhanceDocument: (
    content: string,
    enhancement: 'proofread' | 'expand' | 'summarize' | 'restructure',
    sessionId?: string
  ) => Promise<string | null>;
  isDocumentRequest: (message: string) => boolean;
}

export function useDocumentGeneration(): UseDocumentGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  /**
   * Check if a message is a document generation request
   */
  const isDocumentRequest = useCallback((message: string): boolean => {
    return documentGenerationService.isDocumentRequest(message);
  }, []);

  /**
   * Generate a document from a user message
   */
  const generateDocument = useCallback(
    async (
      message: string,
      sessionId?: string
    ): Promise<GeneratedDocument | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        // Parse the document request
        const request: DocumentRequest =
          documentGenerationService.parseDocumentRequest(message);

        // Generate the document
        const document = await documentGenerationService.generateDocument(
          request,
          user?.id,
          sessionId
        );

        toast.success('Document generated successfully');
        return document;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to generate document';
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [user?.id]
  );

  /**
   * Enhance an existing document
   */
  const enhanceDocument = useCallback(
    async (
      content: string,
      enhancement: 'proofread' | 'expand' | 'summarize' | 'restructure',
      sessionId?: string
    ): Promise<string | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const enhancedContent = await documentGenerationService.enhanceDocument(
          content,
          enhancement,
          user?.id,
          sessionId
        );

        const enhancementLabels = {
          proofread: 'Proofread',
          expand: 'Expanded',
          summarize: 'Summarized',
          restructure: 'Restructured',
        };

        toast.success(`${enhancementLabels[enhancement]} successfully`);
        return enhancedContent;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to enhance document';
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [user?.id]
  );

  return {
    isGenerating,
    error,
    generateDocument,
    enhanceDocument,
    isDocumentRequest,
  };
}
