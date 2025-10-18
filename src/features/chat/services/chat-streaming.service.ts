// Streaming service - handles real-time streaming responses from LLM
import { unifiedLLMService } from '@_core/api/llm/unified-llm-service';
import type { StreamingUpdate } from '../types';

export class ChatStreamingService {
  /**
   * Send a message and stream the response
   */
  async *streamMessage(
    messages: Array<{ role: string; content: string }>,
    options: {
      sessionId?: string;
      userId?: string;
      provider?: 'openai' | 'anthropic' | 'google';
      model?: string;
      temperature?: number;
      onUpdate?: (update: StreamingUpdate) => void;
    }
  ): AsyncGenerator<StreamingUpdate> {
    const { sessionId, userId, provider = 'openai', onUpdate } = options;

    try {
      // Start streaming from the LLM service
      let fullContent = '';

      // Use the unified LLM service's streaming capability
      // Note: This is a simplified version - you may need to adapt based on your LLM service implementation
      const response = await unifiedLLMService.sendMessage(
        messages,
        sessionId,
        userId,
        provider
      );

      // If the service doesn't support streaming, simulate it
      if (typeof response.content === 'string') {
        // Simulate streaming by chunking the response
        const words = response.content.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
          fullContent += chunk;

          const update: StreamingUpdate = {
            type: 'content',
            content: chunk,
          };

          yield update;
          if (onUpdate) onUpdate(update);

          // Small delay to simulate streaming
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
      }

      // Send completion update
      const doneUpdate: StreamingUpdate = {
        type: 'done',
      };
      yield doneUpdate;
      if (onUpdate) onUpdate(doneUpdate);
    } catch (error) {
      const errorUpdate: StreamingUpdate = {
        type: 'error',
        error:
          error instanceof Error ? error.message : 'Unknown streaming error',
      };
      yield errorUpdate;
      if (onUpdate) onUpdate(errorUpdate);
    }
  }

  /**
   * Stream with Server-Sent Events (SSE)
   * This method is for when you want to use SSE instead of async generators
   */
  async streamWithSSE(
    messages: Array<{ role: string; content: string }>,
    options: {
      sessionId?: string;
      userId?: string;
      provider?: 'openai' | 'anthropic' | 'google';
      onChunk: (chunk: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ): Promise<void> {
    const { onChunk, onComplete, onError, ...streamOptions } = options;

    try {
      for await (const update of this.streamMessage(messages, streamOptions)) {
        if (update.type === 'content' && update.content) {
          onChunk(update.content);
        } else if (update.type === 'done') {
          onComplete();
        } else if (update.type === 'error') {
          throw new Error(update.error);
        }
      }
    } catch (error) {
      onError(
        error instanceof Error ? error : new Error('Unknown streaming error')
      );
    }
  }

  /**
   * Cancel an ongoing stream
   * This is a placeholder - actual implementation would need to track active streams
   */
  cancelStream(streamId: string): void {
    console.log('Cancelling stream:', streamId);
    // TODO: Implement stream cancellation logic
  }
}

export const chatStreamingService = new ChatStreamingService();
