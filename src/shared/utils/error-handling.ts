/**
 * Standardized error handling utilities
 * Provides consistent error handling patterns across the codebase
 */

/**
 * Custom application error with additional metadata
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public retryable: boolean = false,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error codes for consistent error identification
 */
export const ErrorCodes = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',

  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Business logic errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  EMPLOYEE_NOT_FOUND: 'EMPLOYEE_NOT_FOUND',
  PLAN_GENERATION_FAILED: 'PLAN_GENERATION_FAILED',
  TASK_EXECUTION_FAILED: 'TASK_EXECUTION_FAILED',

  // Configuration errors
  API_KEY_ERROR: 'API_KEY_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',

  // Unknown
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) return error.retryable;
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('503') ||
      message.includes('429') ||
      message.includes('failed to fetch') ||
      message.includes('econnreset') ||
      message.includes('enotfound')
    );
  }
  return false;
}

/**
 * Get a user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError && error.userMessage) {
    return error.userMessage;
  }
  if (error instanceof Error) {
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
    if (
      message.includes('500') ||
      message.includes('503') ||
      message.includes('server error')
    ) {
      return 'Server error occurred. Please try again later.';
    }

    // API key errors
    if (message.includes('api key')) {
      return 'API configuration error. Please contact support.';
    }

    // Return original message if it's reasonably short and user-friendly
    if (error.message.length < 200 && !message.includes('stack')) {
      return error.message;
    }
  }
  return 'An unexpected error occurred';
}

/**
 * Get the technical error message for logging
 */
export function getTechnicalErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

/**
 * Create an AppError from an unknown error
 */
export function toAppError(error: unknown, defaultCode: ErrorCode = ErrorCodes.UNKNOWN): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const message = getTechnicalErrorMessage(error);
  const messageLower = message.toLowerCase();

  // Determine error code and retryable status
  let code = defaultCode;
  let statusCode = 500;
  let retryable = false;

  if (messageLower.includes('network') || messageLower.includes('failed to fetch')) {
    code = ErrorCodes.NETWORK_ERROR;
    statusCode = 0;
    retryable = true;
  } else if (messageLower.includes('timeout')) {
    code = ErrorCodes.TIMEOUT;
    statusCode = 408;
    retryable = true;
  } else if (messageLower.includes('rate limit') || messageLower.includes('429')) {
    code = ErrorCodes.RATE_LIMIT;
    statusCode = 429;
    retryable = true;
  } else if (messageLower.includes('unauthorized') || messageLower.includes('401')) {
    code = ErrorCodes.UNAUTHORIZED;
    statusCode = 401;
    retryable = false;
  } else if (messageLower.includes('forbidden') || messageLower.includes('403')) {
    code = ErrorCodes.FORBIDDEN;
    statusCode = 403;
    retryable = false;
  } else if (messageLower.includes('503')) {
    code = ErrorCodes.SERVICE_UNAVAILABLE;
    statusCode = 503;
    retryable = true;
  } else if (messageLower.includes('500') || messageLower.includes('server error')) {
    code = ErrorCodes.SERVER_ERROR;
    statusCode = 500;
    retryable = true;
  }

  return new AppError(message, code, statusCode, retryable, getErrorMessage(error));
}

/**
 * Execute a promise with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new AppError(timeoutMessage, ErrorCodes.TIMEOUT, 408, true, timeoutMessage)),
      timeoutMs
    );
  });
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Options for fetchWithTimeout
 */
export interface FetchWithTimeoutOptions {
  /** Timeout in milliseconds (default: 30000 = 30 seconds) */
  timeoutMs?: number;
  /** Custom timeout error message */
  timeoutMessage?: string;
  /** Additional fetch options */
  fetchOptions?: RequestInit;
}

/**
 * Fetch with proper timeout and abort handling
 * Uses AbortController to cancel the request on timeout, preventing resource leaks
 *
 * @param url - URL to fetch
 * @param options - Fetch options including timeout configuration
 * @returns Fetch Response
 * @throws AppError with TIMEOUT code on timeout
 *
 * @example
 * ```ts
 * const response = await fetchWithTimeout('https://api.example.com/data', {
 *   timeoutMs: 15000,
 *   fetchOptions: {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ query: 'test' })
 *   }
 * });
 * ```
 */
export async function fetchWithTimeout(
  url: string | URL,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 30000, // 30 seconds default
    timeoutMessage = `Request timed out after ${Math.round((options.timeoutMs || 30000) / 1000)}s`,
    fetchOptions = {},
  } = options;

  // Create AbortController for proper request cancellation
  const controller = new AbortController();
  const { signal } = controller;

  // Set up timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal,
    });
    return response;
  } catch (error) {
    // Check if this was an abort due to timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError(
        timeoutMessage,
        ErrorCodes.TIMEOUT,
        408,
        true,
        'The request took too long to complete. Please try again.'
      );
    }
    // Re-throw other errors (network errors, etc.)
    throw error;
  } finally {
    // Always clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
  }
}

/**
 * Timeout presets for common use cases
 */
export const TimeoutPresets = {
  /** Fast operations like simple API calls (10 seconds) */
  FAST: 10000,
  /** Standard API calls (30 seconds) */
  STANDARD: 30000,
  /** AI/LLM API calls that may take longer (60 seconds) */
  AI_REQUEST: 60000,
  /** Long-running operations like file uploads (120 seconds) */
  LONG_RUNNING: 120000,
  /** Search API calls (15 seconds) */
  SEARCH: 15000,
} as const;

/**
 * Options for retry with backoff
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  shouldRetry: isRetryableError,
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown = null;
  let attempt = 0;

  while (attempt <= opts.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        throw toAppError(error);
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= opts.maxRetries) {
        throw toAppError(error);
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
      opts.onRetry(attempt + 1, error);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      attempt++;
    }
  }

  // Should never reach here, but TypeScript needs this
  throw toAppError(lastError);
}

/**
 * Wrap an async function with standardized error handling
 */
export function withErrorHandling<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: {
    defaultErrorCode?: ErrorCode;
    onError?: (error: AppError) => void;
    rethrow?: boolean;
  }
): (...args: TArgs) => Promise<TResult> {
  const { defaultErrorCode = ErrorCodes.UNKNOWN, onError, rethrow = true } = options || {};

  return async (...args: TArgs): Promise<TResult> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = toAppError(error, defaultErrorCode);
      onError?.(appError);
      if (rethrow) {
        throw appError;
      }
      throw error;
    }
  };
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(
  json: string,
  fallback?: T
): { success: true; data: T } | { success: false; error: AppError } {
  try {
    const data = JSON.parse(json) as T;
    return { success: true, data };
  } catch (error) {
    if (fallback !== undefined) {
      return { success: true, data: fallback };
    }
    return {
      success: false,
      error: new AppError(
        `Failed to parse JSON: ${getTechnicalErrorMessage(error)}`,
        ErrorCodes.VALIDATION_ERROR,
        400,
        false,
        'Invalid data format received'
      ),
    };
  }
}
