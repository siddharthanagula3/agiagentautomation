/**
 * Server-Sent Events (SSE) Handler
 *
 * Provides native SSE streaming support for real-time LLM responses.
 * Handles connection management, reconnection logic, and error recovery.
 */

export interface SSEMessage {
  type: 'content' | 'done' | 'error' | 'ping';
  content?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SSEOptions {
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  onMessage: (message: SSEMessage) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export class SSEHandler {
  private eventSource: EventSource | null = null;
  private abortController: AbortController | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectDelay: number;
  private readonly shouldReconnect: boolean;
  private isClosed = false;

  constructor(private options: SSEOptions) {
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 3;
    this.reconnectDelay = options.reconnectDelay ?? 2000;
    this.shouldReconnect = options.reconnect ?? true;
  }

  /**
   * Start the SSE connection
   */
  async connect(): Promise<void> {
    if (this.isClosed) {
      throw new Error('SSEHandler is closed. Create a new instance.');
    }

    this.abortController = new AbortController();

    try {
      // Use fetch with streaming for better control than EventSource
      const response = await fetch(this.options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...this.options.headers,
        },
        body: JSON.stringify(this.options.body),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      this.options.onOpen?.();
      this.reconnectAttempts = 0;

      // Process the stream
      await this.processStream(response.body);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Connection was intentionally closed
        return;
      }

      this.handleError(error as Error);
    }
  }

  /**
   * Process the SSE stream
   */
  private async processStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          this.options.onMessage({
            type: 'done',
          });
          this.options.onClose?.();
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === '') continue;

          // Parse SSE format: "data: {...}"
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove "data: " prefix

            // Handle special SSE messages
            if (data === '[DONE]') {
              this.options.onMessage({ type: 'done' });
              continue;
            }

            if (data === 'ping') {
              this.options.onMessage({ type: 'ping' });
              continue;
            }

            // Parse JSON data
            try {
              const parsed = JSON.parse(data);
              this.handleParsedData(parsed);
            } catch (parseError) {
              // If not JSON, treat as plain text content
              this.options.onMessage({
                type: 'content',
                content: data,
              });
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Handle parsed SSE data
   */
  private handleParsedData(data: any): void {
    // OpenAI format
    if (data.choices?.[0]?.delta?.content) {
      this.options.onMessage({
        type: 'content',
        content: data.choices[0].delta.content,
        metadata: { usage: data.usage },
      });
      return;
    }

    // Anthropic format
    if (data.type === 'content_block_delta' && data.delta?.text) {
      this.options.onMessage({
        type: 'content',
        content: data.delta.text,
      });
      return;
    }

    // Google Gemini format
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      this.options.onMessage({
        type: 'content',
        content: data.candidates[0].content.parts[0].text,
      });
      return;
    }

    // Generic format
    if (data.content) {
      this.options.onMessage({
        type: 'content',
        content: data.content,
        metadata: data.metadata,
      });
      return;
    }

    // Error format
    if (data.error) {
      this.options.onMessage({
        type: 'error',
        error: data.error.message || JSON.stringify(data.error),
      });
      return;
    }

    // Unknown format - pass through
    console.warn('Unknown SSE data format:', data);
  }

  /**
   * Handle connection errors with reconnection logic
   */
  private handleError(error: Error): void {
    console.error('SSE connection error:', error);

    this.options.onError?.(error);

    // Attempt reconnection if enabled
    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts; // Exponential backoff

      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        if (!this.isClosed) {
          this.connect();
        }
      }, delay);
    } else {
      this.options.onMessage({
        type: 'error',
        error: `Connection failed after ${this.reconnectAttempts} attempts: ${error.message}`,
      });
    }
  }

  /**
   * Close the SSE connection
   */
  close(): void {
    this.isClosed = true;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.options.onClose?.();
  }

  /**
   * Check if connection is active
   */
  isConnected(): boolean {
    return !this.isClosed && this.abortController !== null;
  }
}

/**
 * Convenience function to create and start an SSE connection
 */
export async function createSSEConnection(options: SSEOptions): Promise<SSEHandler> {
  const handler = new SSEHandler(options);
  await handler.connect();
  return handler;
}

/**
 * Generator-based SSE streaming (for use with async iterators)
 */
export async function* streamSSE(
  url: string,
  options: {
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
  }
): AsyncGenerator<SSEMessage> {
  const messages: SSEMessage[] = [];
  let resolver: ((value: SSEMessage) => void) | null = null;
  let isDone = false;
  let error: Error | null = null;

  const handler = new SSEHandler({
    url,
    headers: options.headers,
    body: options.body,
    onMessage: (message) => {
      if (resolver) {
        resolver(message);
        resolver = null;
      } else {
        messages.push(message);
      }

      if (message.type === 'done' || message.type === 'error') {
        isDone = true;
      }
    },
    onError: (err) => {
      error = err;
      isDone = true;
    },
  });

  await handler.connect();

  try {
    while (!isDone || messages.length > 0) {
      // Get next message from queue
      if (messages.length > 0) {
        const message = messages.shift()!;
        yield message;

        if (message.type === 'done' || message.type === 'error') {
          break;
        }
      } else {
        // Wait for next message
        const message = await new Promise<SSEMessage>((resolve) => {
          resolver = resolve;
        });

        yield message;

        if (message.type === 'done' || message.type === 'error') {
          break;
        }
      }
    }

    if (error) {
      throw error;
    }
  } finally {
    handler.close();
  }
}
