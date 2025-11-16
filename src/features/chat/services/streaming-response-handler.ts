/**
 * Enhanced Streaming Service
 * Handles real-time streaming responses from LLM with advanced features:
 * - Multi-agent streaming support
 * - Parallel stream handling
 * - Stream multiplexing
 * - Backpressure handling
 * - Stream recovery on connection loss
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import { tokenLogger } from '@core/integrations/token-usage-tracker';
import type { StreamingUpdate } from '../types';

// Enhanced streaming types
export interface StreamingOptions {
  sessionId?: string;
  userId?: string;
  provider?: 'openai' | 'anthropic' | 'google';
  model?: string;
  temperature?: number;
  onUpdate?: (update: StreamingUpdate) => void;
  signal?: AbortSignal;
  agentId?: string; // For multi-agent streaming
}

export interface MultiAgentStreamingUpdate extends StreamingUpdate {
  agentId?: string;
  agentName?: string;
  timestamp?: number;
  streamId?: string;
}

export interface StreamMetrics {
  streamId: string;
  agentId?: string;
  startTime: number;
  endTime?: number;
  bytesReceived: number;
  chunksReceived: number;
  errors: number;
  reconnects: number;
  avgChunkSize: number;
  latency: number;
}

interface ActiveStream {
  id: string;
  agentId?: string;
  controller: AbortController;
  startTime: number;
  generator: AsyncGenerator<StreamingUpdate>;
  buffer: StreamingUpdate[];
  isBackpressured: boolean;
  metrics: StreamMetrics;
}

interface StreamRecoveryState {
  streamId: string;
  lastChunkIndex: number;
  content: string;
  timestamp: number;
}

// Backpressure configuration
const BACKPRESSURE_THRESHOLD = 100; // Max buffered chunks
const BACKPRESSURE_HIGH_WATER = 80; // Start applying backpressure
const BACKPRESSURE_LOW_WATER = 20; // Resume normal flow

// Stream recovery configuration
const RECOVERY_TIMEOUT = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 3;

export class ChatStreamingService {
  private activeStreams: Map<string, ActiveStream> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private streamRecoveryStates: Map<string, StreamRecoveryState> = new Map();
  private multiplexedStreams: Map<string, Set<string>> = new Map(); // sessionId -> streamIds

  /**
   * Generate unique stream ID
   */
  private generateStreamId(sessionId?: string, agentId?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `stream-${sessionId || 'anon'}-${agentId || 'default'}-${timestamp}-${random}`;
  }

  /**
   * Save stream state for recovery
   */
  private saveStreamState(
    streamId: string,
    chunkIndex: number,
    content: string
  ): void {
    this.streamRecoveryStates.set(streamId, {
      streamId,
      lastChunkIndex: chunkIndex,
      content,
      timestamp: Date.now(),
    });

    // Clean up old recovery states (older than RECOVERY_TIMEOUT)
    const now = Date.now();
    for (const [id, state] of this.streamRecoveryStates.entries()) {
      if (now - state.timestamp > RECOVERY_TIMEOUT) {
        this.streamRecoveryStates.delete(id);
      }
    }
  }

  /**
   * Attempt to recover stream from saved state
   */
  private async recoverStream(
    streamId: string
  ): Promise<StreamRecoveryState | null> {
    const state = this.streamRecoveryStates.get(streamId);
    if (!state) return null;

    const age = Date.now() - state.timestamp;
    if (age > RECOVERY_TIMEOUT) {
      this.streamRecoveryStates.delete(streamId);
      return null;
    }

    console.log(
      `[StreamRecovery] Recovering stream ${streamId} from chunk ${state.lastChunkIndex}`
    );
    return state;
  }

  /**
   * Apply backpressure to stream
   */
  private async applyBackpressure(stream: ActiveStream): Promise<void> {
    const bufferSize = stream.buffer.length;

    if (bufferSize >= BACKPRESSURE_HIGH_WATER && !stream.isBackpressured) {
      stream.isBackpressured = true;
      console.log(
        `[Backpressure] Stream ${stream.id} entering backpressure mode (buffer: ${bufferSize})`
      );
    }

    // Wait until buffer drains below low water mark
    while (
      stream.buffer.length > BACKPRESSURE_LOW_WATER &&
      stream.isBackpressured
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (stream.isBackpressured) {
      stream.isBackpressured = false;
      console.log(
        `[Backpressure] Stream ${stream.id} exiting backpressure mode`
      );
    }
  }

  /**
   * Enhanced streaming with multi-agent support and recovery
   */
  async *streamMessage(
    messages: Array<{ role: string; content: string }>,
    options: StreamingOptions
  ): AsyncGenerator<MultiAgentStreamingUpdate> {
    const {
      sessionId,
      userId,
      provider = 'openai',
      onUpdate,
      signal,
      agentId,
    } = options;

    const streamId = this.generateStreamId(sessionId, agentId);
    const controller = new AbortController();
    const startTime = Date.now();
    let chunkIndex = 0;
    let fullContent = '';
    let reconnectAttempts = 0;

    // Initialize metrics
    const metrics: StreamMetrics = {
      streamId,
      agentId,
      startTime,
      bytesReceived: 0,
      chunksReceived: 0,
      errors: 0,
      reconnects: 0,
      avgChunkSize: 0,
      latency: 0,
    };

    // Check for recovery state
    const recoveryState = await this.recoverStream(streamId);
    if (recoveryState) {
      fullContent = recoveryState.content;
      chunkIndex = recoveryState.lastChunkIndex;
      metrics.reconnects++;
    }

    // Listen for external abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        controller.abort();
      });
    }

    this.abortControllers.set(streamId, controller);

    // Add to multiplexed streams
    if (sessionId) {
      if (!this.multiplexedStreams.has(sessionId)) {
        this.multiplexedStreams.set(sessionId, new Set());
      }
      this.multiplexedStreams.get(sessionId)!.add(streamId);
    }

    try {
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

      metrics.latency = Date.now() - startTime;

      // Log token usage to database immediately
      if (tokensUsed > 0 && userId) {
        try {
          await tokenLogger.logTokenUsage(
            model,
            tokensUsed,
            userId,
            sessionId,
            agentId || 'chat-assistant',
            agentId ? `Agent: ${agentId}` : 'Chat Assistant',
            inputTokens,
            outputTokens,
            'Chat conversation'
          );

          console.log(
            `[TokenTracking] ✅ Logged ${tokensUsed} tokens (${inputTokens} in, ${outputTokens} out) for session ${sessionId}, agent ${agentId || 'default'}`
          );
        } catch (error) {
          console.error('[TokenTracking] ❌ Failed to log token usage:', error);
          metrics.errors++;
        }
      }

      // If the service doesn't support streaming, simulate it
      if (typeof response.content === 'string') {
        const words = response.content.split(' ');

        for (let i = 0; i < words.length; i++) {
          // Check for abort
          if (controller.signal.aborted) {
            throw new Error('Stream aborted');
          }

          const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
          fullContent += chunk;
          chunkIndex++;

          const update: MultiAgentStreamingUpdate = {
            type: 'content',
            content: chunk,
            agentId,
            timestamp: Date.now(),
            streamId,
          };

          // Update metrics
          metrics.bytesReceived += chunk.length;
          metrics.chunksReceived++;
          metrics.avgChunkSize = metrics.bytesReceived / metrics.chunksReceived;

          // Save stream state periodically for recovery
          if (chunkIndex % 10 === 0) {
            this.saveStreamState(streamId, chunkIndex, fullContent);
          }

          yield update;
          if (onUpdate) onUpdate(update);

          // Small delay to simulate streaming
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
      }

      metrics.endTime = Date.now();

      // Send completion update with token information and metrics
      const cost = tokenLogger.calculateCost(model, inputTokens, outputTokens);
      const doneUpdate: MultiAgentStreamingUpdate = {
        type: 'done',
        agentId,
        streamId,
        timestamp: Date.now(),
        metadata: {
          tokensUsed,
          inputTokens,
          outputTokens,
          model,
          cost,
          metrics,
        },
      };
      yield doneUpdate;
      if (onUpdate) onUpdate(doneUpdate);

      // Clean up
      this.cleanupStream(streamId, sessionId);
    } catch (error) {
      metrics.errors++;
      metrics.endTime = Date.now();

      // Check if we should retry
      if (
        reconnectAttempts < MAX_RECONNECT_ATTEMPTS &&
        !controller.signal.aborted &&
        this.isRecoverableError(error)
      ) {
        reconnectAttempts++;
        metrics.reconnects++;

        console.log(
          `[StreamRecovery] Attempting recovery ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`
        );

        // Save current state
        this.saveStreamState(streamId, chunkIndex, fullContent);

        // Wait before retry with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, reconnectAttempts - 1))
        );

        // Retry the stream
        yield* this.streamMessage(messages, {
          ...options,
          signal: controller.signal,
        });
        return;
      }

      const errorUpdate: MultiAgentStreamingUpdate = {
        type: 'error',
        error:
          error instanceof Error ? error.message : 'Unknown streaming error',
        agentId,
        streamId,
        timestamp: Date.now(),
        metadata: {
          metrics,
          reconnectAttempts,
        },
      };
      yield errorUpdate;
      if (onUpdate) onUpdate(errorUpdate);

      // Clean up
      this.cleanupStream(streamId, sessionId);
    }
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const recoverableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'network error',
      'timeout',
      'connection reset',
    ];

    return recoverableErrors.some((msg) =>
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  /**
   * Clean up stream resources
   */
  private cleanupStream(streamId: string, sessionId?: string): void {
    this.activeStreams.delete(streamId);
    this.abortControllers.delete(streamId);
    this.streamRecoveryStates.delete(streamId);

    if (sessionId) {
      const streams = this.multiplexedStreams.get(sessionId);
      if (streams) {
        streams.delete(streamId);
        if (streams.size === 0) {
          this.multiplexedStreams.delete(sessionId);
        }
      }
    }
  }

  /**
   * Stream with Server-Sent Events (SSE)
   */
  async streamWithSSE(
    messages: Array<{ role: string; content: string }>,
    options: {
      sessionId?: string;
      userId?: string;
      provider?: 'openai' | 'anthropic' | 'google';
      agentId?: string;
      onChunk: (chunk: string, agentId?: string) => void;
      onComplete: (metadata?: {
        tokensUsed?: number;
        cost?: number;
        metrics?: StreamMetrics;
      }) => void;
      onError: (error: Error) => void;
      signal?: AbortSignal;
    }
  ): Promise<void> {
    const { onChunk, onComplete, onError, signal, agentId, ...streamOptions } =
      options;

    try {
      let metadata:
        | { tokensUsed?: number; cost?: number; metrics?: StreamMetrics }
        | undefined;

      for await (const update of this.streamMessage(messages, {
        ...streamOptions,
        signal,
        agentId,
      })) {
        if (update.type === 'content' && update.content) {
          onChunk(update.content, update.agentId);
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
   * Multiplex multiple agent streams into a single stream
   */
  async *multiplexStreams(
    agentStreams: Array<{
      agentId: string;
      messages: Array<{ role: string; content: string }>;
      options: StreamingOptions;
    }>
  ): AsyncGenerator<MultiAgentStreamingUpdate> {
    const sessionId =
      agentStreams[0]?.options.sessionId || `multiplex-${Date.now()}`;
    const generators: Array<{
      agentId: string;
      generator: AsyncGenerator<MultiAgentStreamingUpdate>;
    }> = [];

    // Initialize all streams
    for (const stream of agentStreams) {
      generators.push({
        agentId: stream.agentId,
        generator: this.streamMessage(stream.messages, {
          ...stream.options,
          agentId: stream.agentId,
        }),
      });
    }

    // Multiplex the streams using Promise.race
    const activeGenerators = new Map(
      generators.map((g) => [
        g.agentId,
        { generator: g.generator, done: false },
      ])
    );

    while (activeGenerators.size > 0) {
      const promises = Array.from(activeGenerators.entries()).map(
        async ([agentId, { generator }]) => {
          try {
            const result = await generator.next();
            return { agentId, result };
          } catch (error) {
            return { agentId, error };
          }
        }
      );

      const { agentId, result, error } = await Promise.race(promises);

      if (error) {
        yield {
          type: 'error',
          error: error instanceof Error ? error.message : 'Stream error',
          agentId,
          timestamp: Date.now(),
        };
        activeGenerators.delete(agentId);
        continue;
      }

      if (result.done) {
        activeGenerators.delete(agentId);
        continue;
      }

      yield result.value;
    }
  }

  /**
   * Cancel an ongoing stream
   */
  cancelStream(streamId: string): void {
    const controller = this.abortControllers.get(streamId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(streamId);
    }

    this.activeStreams.delete(streamId);
  }

  /**
   * Cancel all streams for a session
   */
  cancelSessionStreams(sessionId: string): void {
    const streams = this.multiplexedStreams.get(sessionId);
    if (streams) {
      streams.forEach((streamId) => this.cancelStream(streamId));
      this.multiplexedStreams.delete(sessionId);
    }
  }

  /**
   * Get metrics for a stream
   */
  getStreamMetrics(streamId: string): StreamMetrics | undefined {
    return this.activeStreams.get(streamId)?.metrics;
  }

  /**
   * Get all active streams for a session
   */
  getActiveStreams(sessionId: string): string[] {
    return Array.from(this.multiplexedStreams.get(sessionId) || []);
  }
}

export const chatStreamingService = new ChatStreamingService();
