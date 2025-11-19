/**
 * Retry Handler Utility
 * Implements exponential backoff with jitter for failed requests
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  shouldRetry: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('failed to fetch') ||
      message.includes('5') || // 500-599 status codes
      message.includes('rate limit')
    );
  },
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= opts.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (!opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= opts.maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelay
      );

      // Add jitter (randomness) to prevent thundering herd
      const jitter = Math.random() * exponentialDelay * 0.3;
      const delay = exponentialDelay + jitter;

      // Notify about retry
      opts.onRetry(attempt + 1, lastError);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      attempt++;
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error('Retry failed');
}

/**
 * Parse error messages into user-friendly text
 */
export function parseErrorMessage(error: Error | unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('failed to fetch')) {
    return 'Network connection lost. Please check your internet connection and try again.';
  }

  // Timeout errors
  if (message.includes('timeout')) {
    return 'Request timed out. The server took too long to respond. Please try again.';
  }

  // Rate limit errors
  if (message.includes('rate limit') || message.includes('429')) {
    return 'Too many requests. Please wait a moment before trying again.';
  }

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Authentication failed. Please log in again.';
  }

  // Permission errors
  if (message.includes('forbidden') || message.includes('403')) {
    return 'You do not have permission to perform this action.';
  }

  // Server errors
  if (message.includes('500') || message.includes('503') || message.includes('server error')) {
    return 'Server error occurred. Our team has been notified. Please try again later.';
  }

  // API key errors
  if (message.includes('api key')) {
    return 'API configuration error. Please contact support.';
  }

  // Default: return the original error message if it's user-friendly
  if (error.message.length < 200 && !message.includes('stack')) {
    return error.message;
  }

  return 'An error occurred while processing your request. Please try again.';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error | unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('failed to fetch') ||
    message.includes('rate limit') ||
    message.includes('500') ||
    message.includes('503')
  );
}
