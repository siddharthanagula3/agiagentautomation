/**
 * Enhanced API client with standardized error handling
 *
 * This module provides an enhanced API client that wraps the base API client
 * with comprehensive error handling, retry logic, and user-friendly error messages.
 *
 * It uses the consolidated error utilities from @shared/lib/error-utils.
 */

import { apiClient, type APIResponse as BaseAPIResponse } from './api';
import { APIException } from '@shared/stores/query-client';
import { toast } from 'sonner';
import {
  isRetryableError,
  getRetryDelay,
  getErrorMessage,
} from './error-utils';

// Re-export APIResponse type from base api module
export type { APIResponse } from './api';

// Enhanced error types
export interface APIErrorDetails {
  code: string;
  message: string;
  status: number;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

export interface ErrorHandler {
  handle: (error: APIException) => void;
  shouldRetry: (error: APIException) => boolean;
  getRetryDelay: (error: APIException, attempt: number) => number;
}

// Default error handler
class DefaultErrorHandler implements ErrorHandler {
  handle(error: APIException): void {
    console.error('API Error:', error);

    // Show user-friendly error message
    const userMessage = getErrorMessage(error);
    toast.error(userMessage);
  }

  shouldRetry(error: APIException): boolean {
    return isRetryableError(error);
  }

  getRetryDelay(error: APIException, attempt: number): number {
    return getRetryDelay(attempt);
  }
}

// Custom error handler for specific use cases
class AuthErrorHandler implements ErrorHandler {
  handle(error: APIException): void {
    if (error.code === 'AUTH_FAILED' || error.code === 'REFRESH_FAILED') {
      // Clear auth state and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
    } else {
      toast.error('Authentication error. Please log in again.');
    }
  }

  shouldRetry(_error: APIException): boolean {
    return false; // Don't retry auth errors
  }

  getRetryDelay(): number {
    return 0;
  }
}

// Error handler registry
class ErrorHandlerRegistry {
  private handlers: Map<string, ErrorHandler> = new Map();
  private defaultHandler: ErrorHandler = new DefaultErrorHandler();

  register(code: string, handler: ErrorHandler): void {
    this.handlers.set(code, handler);
  }

  getHandler(code: string | undefined): ErrorHandler {
    return (code && this.handlers.get(code)) || this.defaultHandler;
  }

  handleError(error: APIException): void {
    const handler = this.getHandler(error.code);
    handler.handle(error);
  }

  shouldRetry(error: APIException): boolean {
    const handler = this.getHandler(error.code);
    return handler.shouldRetry(error);
  }

  getRetryDelay(error: APIException, attempt: number): number {
    const handler = this.getHandler(error.code);
    return handler.getRetryDelay(error, attempt);
  }
}

// Global error handler registry
export const errorHandlers = new ErrorHandlerRegistry();

// Register default handlers
errorHandlers.register('AUTH_FAILED', new AuthErrorHandler());
errorHandlers.register('REFRESH_FAILED', new AuthErrorHandler());

// Enhanced API client with error handling
export class EnhancedAPIClient {
  private baseClient = apiClient;
  private maxRetries = 3;

  async request<T = unknown>(
    endpoint: string,
    _options: RequestInit = {}
  ): Promise<BaseAPIResponse<T>> {
    let lastError: APIException | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.baseClient.get<T>(endpoint);
        return response;
      } catch (error) {
        lastError = error as APIException;

        // Handle the error
        errorHandlers.handleError(lastError);

        // Check if we should retry
        if (attempt < this.maxRetries && errorHandlers.shouldRetry(lastError)) {
          const delay = errorHandlers.getRetryDelay(lastError, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Request failed');
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<BaseAPIResponse<T>> {
    let lastError: APIException | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.baseClient.post<T>(endpoint, data);
        return response;
      } catch (error) {
        lastError = error as APIException;

        errorHandlers.handleError(lastError);

        if (attempt < this.maxRetries && errorHandlers.shouldRetry(lastError)) {
          const delay = errorHandlers.getRetryDelay(lastError, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Request failed');
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<BaseAPIResponse<T>> {
    let lastError: APIException | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.baseClient.put<T>(endpoint, data);
        return response;
      } catch (error) {
        lastError = error as APIException;

        errorHandlers.handleError(lastError);

        if (attempt < this.maxRetries && errorHandlers.shouldRetry(lastError)) {
          const delay = errorHandlers.getRetryDelay(lastError, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Request failed');
  }

  async delete<T = unknown>(endpoint: string): Promise<BaseAPIResponse<T>> {
    let lastError: APIException | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.baseClient.delete<T>(endpoint);
        return response;
      } catch (error) {
        lastError = error as APIException;

        errorHandlers.handleError(lastError);

        if (attempt < this.maxRetries && errorHandlers.shouldRetry(lastError)) {
          const delay = errorHandlers.getRetryDelay(lastError, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Request failed');
  }
}

// Enhanced API client instance
export const enhancedApiClient = new EnhancedAPIClient();

// Utility functions for error handling - now using consolidated utilities

/**
 * Handle API error and return user-friendly message
 */
export const handleAPIError = (error: unknown): string => {
  if (error instanceof APIException) {
    errorHandlers.handleError(error);
    return error.message;
  }

  return getErrorMessage(error);
};

/**
 * Check if an error is retryable
 * @deprecated Use isRetryableError from @shared/lib/error-utils instead
 */
export { isRetryableError } from './error-utils';

/**
 * Get retry delay for a given attempt
 * @deprecated Use getRetryDelay from @shared/lib/error-utils instead
 */
export { getRetryDelay } from './error-utils';

// React Query error handler
export const queryErrorHandler = (error: unknown) => {
  if (error instanceof APIException) {
    errorHandlers.handleError(error);
  } else {
    toast.error('An unexpected error occurred');
  }
};

// Mutation error handler
export const mutationErrorHandler = (error: unknown) => {
  if (error instanceof APIException) {
    errorHandlers.handleError(error);
  } else {
    toast.error('Operation failed. Please try again.');
  }
};
