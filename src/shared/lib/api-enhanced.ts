/**
 * Enhanced API client with standardized error handling
 * Extends the existing API client with better error management
 */

import { apiClient, type APIResponse, type APIException } from './api';
import { toast } from 'sonner';

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
    const userMessage = this.getUserFriendlyMessage(error);
    toast.error(userMessage);
  }

  shouldRetry(error: APIException): boolean {
    // Retry on network errors and 5xx server errors
    return error.status === 0 || (error.status >= 500 && error.status < 600);
  }

  getRetryDelay(error: APIException, attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000;
    const maxDelay = 10000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = Math.random() * 1000;
    return delay + jitter;
  }

  private getUserFriendlyMessage(error: APIException): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your internet connection.';
      case 'TIMEOUT':
        return 'Request timed out. Please try again.';
      case 'AUTH_FAILED':
        return 'Authentication failed. Please log in again.';
      case 'REFRESH_FAILED':
        return 'Session expired. Please log in again.';
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.';
      case 'SERVER_ERROR':
        return 'Server error occurred. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
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

  shouldRetry(error: APIException): boolean {
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

  getHandler(code: string): ErrorHandler {
    return this.handlers.get(code) || this.defaultHandler;
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
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
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
          await new Promise(resolve => setTimeout(resolve, delay));
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
  ): Promise<APIResponse<T>> {
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
          await new Promise(resolve => setTimeout(resolve, delay));
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
  ): Promise<APIResponse<T>> {
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
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Request failed');
  }

  async delete<T = unknown>(endpoint: string): Promise<APIResponse<T>> {
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
          await new Promise(resolve => setTimeout(resolve, delay));
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

// Utility functions for error handling
export const handleAPIError = (error: unknown): string => {
  if (error instanceof APIException) {
    errorHandlers.handleError(error);
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
};

export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof APIException) {
    return errorHandlers.shouldRetry(error);
  }
  return false;
};

export const getRetryDelay = (error: unknown, attempt: number): number => {
  if (error instanceof APIException) {
    return errorHandlers.getRetryDelay(error, attempt);
  }
  return 1000 * Math.pow(2, attempt - 1);
};

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
