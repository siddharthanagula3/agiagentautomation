// Streaming service - handles real-time streaming responses from LLM with token tracking
import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import { tokenLogger } from '@core/integrations/token-usage-tracker';
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
      const response = await unifiedLLMService.sendMessage(
        messages,
        sessionId,
        userId,
        provider
      );

      // Extract token usage from response (CRITICAL FOR BILLING!)
      const tokensUsed = response.usage?.totalTokens || 0;
      const inputTokens = response.usage?.promptTokens || 0;
      const outputTokens = response.usage?.completionTokens || 0;
      const model = response.model || options.model || 'gpt-4o';

      // Log token usage to database immediately
      if (tokensUsed > 0 && userId) {
        try {
          await tokenLogger.logTokenUsage(
            model,
            tokensUsed,
            userId,
            sessionId,
            'chat-assistant',
            'Chat Assistant',
            inputTokens,
            outputTokens,
            'Chat conversation'
          );

          console.log(
            `[TokenTracking] ✅ Logged ${tokensUsed} tokens (${inputTokens} in, ${outputTokens} out) for session ${sessionId}`
          );
        } catch (error) {
          console.error('[TokenTracking] ❌ Failed to log token usage:', error);
          // Don't throw - continue even if logging fails
        }
      } else {
        console.warn(
          `[TokenTracking] ⚠️ No tokens logged: tokensUsed=${tokensUsed}, userId=${userId}`
        );
      }

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

      // Send completion update with token information
      const cost = tokenLogger.calculateCost(model, inputTokens, outputTokens);
      const doneUpdate: StreamingUpdate = {
        type: 'done',
        metadata: {
          tokensUsed,
          inputTokens,
          outputTokens,
          model,
          cost,
        },
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
      onComplete: (metadata?: { tokensUsed?: number; cost?: number }) => void;
      onError: (error: Error) => void;
    }
  ): Promise<void> {
    const { onChunk, onComplete, onError, ...streamOptions } = options;

    try {
      let metadata: { tokensUsed?: number; cost?: number } | undefined;

      for await (const update of this.streamMessage(messages, streamOptions)) {
        if (update.type === 'content' && update.content) {
          onChunk(update.content);
        } else if (update.type === 'done') {
          metadata = update.metadata;
          onComplete(metadata);
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
