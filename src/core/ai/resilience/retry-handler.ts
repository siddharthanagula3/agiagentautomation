/**
 * Retry Handler with Exponential Backoff
 *
 * Provides automatic retry logic for failed operations with configurable
 * backoff strategies and error handling.
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error, nextDelay: number) => void;
}

export interface RetryState {
  attempt: number;
  maxAttempts: number;
  lastError: Error | null;
  nextRetryDelay: number;
  isRetrying: boolean;
}

export class RetryHandler {
  private readonly maxAttempts: number;
  private readonly initialDelay: number;
  private readonly maxDelay: number;
  private readonly backoffMultiplier: number;
  private readonly retryableErrors: (error: Error) => boolean;
  private readonly onRetry?: (
    attempt: number,
    error: Error,
    nextDelay: number
  ) => void;

  constructor(options: RetryOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 3;
    this.initialDelay = options.initialDelay ?? 2000; // 2 seconds
    this.maxDelay = options.maxDelay ?? 32000; // 32 seconds
    this.backoffMultiplier = options.backoffMultiplier ?? 2;
    this.retryableErrors =
      options.retryableErrors ?? this.defaultRetryableErrors;
    this.onRetry = options.onRetry;
  }

  /**
   * Execute an async function with retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.initialDelay;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.retryableErrors(lastError)) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === this.maxAttempts) {
          throw lastError;
        }

        // Calculate next delay with exponential backoff
        const nextDelay = Math.min(delay, this.maxDelay);

        // Notify about retry
        this.onRetry?.(attempt, lastError, nextDelay);

        // Wait before retrying
        await this.sleep(nextDelay);

        // Increase delay for next attempt
        delay *= this.backoffMultiplier;
      }
    }

    throw lastError || new Error('Retry failed with unknown error');
  }

  /**
   * Execute with retry and return state updates via callback
   */
  async executeWithState<T>(
    fn: () => Promise<T>,
    onStateChange: (state: RetryState) => void
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.initialDelay;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        // Update state: attempting
        onStateChange({
          attempt,
          maxAttempts: this.maxAttempts,
          lastError,
          nextRetryDelay: delay,
          isRetrying: attempt > 1,
        });

        const result = await fn();

        // Update state: success
        onStateChange({
          attempt,
          maxAttempts: this.maxAttempts,
          lastError: null,
          nextRetryDelay: 0,
          isRetrying: false,
        });

        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.retryableErrors(lastError)) {
          onStateChange({
            attempt,
            maxAttempts: this.maxAttempts,
            lastError,
            nextRetryDelay: 0,
            isRetrying: false,
          });
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === this.maxAttempts) {
          onStateChange({
            attempt,
            maxAttempts: this.maxAttempts,
            lastError,
            nextRetryDelay: 0,
            isRetrying: false,
          });
          throw lastError;
        }

        // Calculate next delay
        const nextDelay = Math.min(delay, this.maxDelay);

        // Update state: will retry
        onStateChange({
          attempt,
          maxAttempts: this.maxAttempts,
          lastError,
          nextRetryDelay: nextDelay,
          isRetrying: true,
        });

        // Notify about retry
        this.onRetry?.(attempt, lastError, nextDelay);

        // Wait before retrying
        await this.sleep(nextDelay);

        // Increase delay for next attempt
        delay *= this.backoffMultiplier;
      }
    }

    throw lastError || new Error('Retry failed with unknown error');
  }

  /**
   * Default logic to determine if an error is retryable
   */
  private defaultRetryableErrors(error: Error): boolean {
    // Network errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT')
    ) {
      return true;
    }

    // Rate limiting (429)
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return true;
    }

    // Server errors (5xx)
    if (
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503')
    ) {
      return true;
    }

    // Timeout errors
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return true;
    }

    return false;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a retry handler with common presets
 */
export function createRetryHandler(
  preset: 'default' | 'aggressive' | 'conservative' = 'default'
): RetryHandler {
  switch (preset) {
    case 'aggressive':
      return new RetryHandler({
        maxAttempts: 5,
        initialDelay: 1000,
        maxDelay: 60000,
        backoffMultiplier: 2,
      });

    case 'conservative':
      return new RetryHandler({
        maxAttempts: 2,
        initialDelay: 5000,
        maxDelay: 15000,
        backoffMultiplier: 1.5,
      });

    case 'default':
    default:
      return new RetryHandler({
        maxAttempts: 3,
        initialDelay: 2000,
        maxDelay: 16000,
        backoffMultiplier: 2,
      });
  }
}

/**
 * Convenience function to retry an async operation
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const handler = new RetryHandler(options);
  return handler.execute(fn);
}

/**
 * Message queue for failed operations
 */
export interface QueuedMessage {
  id: string;
  sessionId: string;
  content: string;
  provider: string;
  model: string;
  timestamp: number;
  attempts: number;
  lastError?: string;
}

export class MessageRetryQueue {
  private queue: Map<string, QueuedMessage> = new Map();
  private retryHandler: RetryHandler;
  private isProcessing = false;

  constructor(retryOptions?: RetryOptions) {
    this.retryHandler = new RetryHandler(retryOptions);
  }

  /**
   * Add a failed message to the retry queue
   */
  enqueue(message: Omit<QueuedMessage, 'attempts'>): void {
    const queuedMessage: QueuedMessage = {
      ...message,
      attempts: 0,
    };

    this.queue.set(message.id, queuedMessage);
    this.processQueue();
  }

  /**
   * Remove a message from the queue
   */
  dequeue(messageId: string): void {
    this.queue.delete(messageId);
  }

  /**
   * Get all queued messages
   */
  getQueue(): QueuedMessage[] {
    return Array.from(this.queue.values());
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * Clear the entire queue
   */
  clear(): void {
    this.queue.clear();
  }

  /**
   * Process the retry queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.size === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      for (const [messageId, message] of this.queue.entries()) {
        // Skip if already retrying
        if (message.attempts >= 3) {
          continue;
        }

        // Increment attempts
        message.attempts++;
        this.queue.set(messageId, message);

        try {
          // Attempt to send the message
          // This would call your actual send function
          // await sendMessage(message);

          // If successful, remove from queue
          this.queue.delete(messageId);
        } catch (error) {
          // Update error info
          message.lastError = (error as Error).message;
          this.queue.set(messageId, message);

          // If max attempts reached, remove from queue
          if (message.attempts >= 3) {
            this.queue.delete(messageId);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Retry a specific message
   */
  async retryMessage(
    messageId: string,
    sendFn: (message: QueuedMessage) => Promise<void>
  ): Promise<void> {
    const message = this.queue.get(messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found in queue`);
    }

    await this.retryHandler.execute(async () => {
      await sendFn(message);
      this.queue.delete(messageId);
    });
  }

  /**
   * Retry all queued messages
   */
  async retryAll(
    sendFn: (message: QueuedMessage) => Promise<void>
  ): Promise<void> {
    const messages = Array.from(this.queue.values());

    for (const message of messages) {
      try {
        await this.retryMessage(message.id, sendFn);
      } catch (error) {
        console.error(`Failed to retry message ${message.id}:`, error);
      }
    }
  }
}

/**
 * Hook-friendly retry queue manager
 */
export class RetryQueueManager {
  private static instance: MessageRetryQueue | null = null;

  static getInstance(): MessageRetryQueue {
    if (!this.instance) {
      this.instance = new MessageRetryQueue({
        maxAttempts: 3,
        initialDelay: 2000,
        maxDelay: 16000,
        backoffMultiplier: 2,
      });
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}
