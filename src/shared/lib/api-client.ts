/**
 * Alternative API Client with Supabase Integration
 *
 * This module provides a simpler API client that uses Supabase for authentication
 * and includes payment-related error handling (402 responses).
 *
 * NOTE: This client is NOT currently used in the codebase.
 * The primary API client is @shared/lib/api.ts
 *
 * Use cases where this might be preferred:
 * - Direct Supabase auth token handling
 * - Simpler API without retry/interceptor complexity
 * - Payment-required error handling with notifications
 */

import { supabase } from '@shared/lib/supabase-client';
import { toast } from 'sonner';
import { useNotificationStore } from '@shared/stores/notification-store';
import type { ApiResponse } from '@shared/types';

/**
 * Custom error class for API exceptions with status codes
 */
export class APIClientException extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'APIClientException';
    this.status = status;
    this.code = code;
  }
}

/**
 * Handle 402 Payment Required responses by showing upgrade notification
 */
function handlePaymentRequired(): void {
  const { addNotification } = useNotificationStore.getState();

  addNotification({
    type: 'warning',
    title: 'Upgrade Required',
    message:
      'This feature requires a paid plan. Please upgrade to continue using premium features.',
    priority: 'high',
    persistent: true,
    category: 'billing',
    actionLabel: 'Upgrade Now',
    actionUrl: '/billing',
    onAction: () => {
      window.location.href = '/billing';
    },
  });
}

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };
    }

    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Handle HTTP response errors with specific handling for common status codes
   */
  private async handleResponseError(
    response: Response,
    context: string
  ): Promise<never> {
    // Handle 402 Payment Required specifically
    if (response.status === 402) {
      handlePaymentRequired();
      throw new APIClientException(
        'Payment required - please upgrade your plan',
        402,
        'PAYMENT_REQUIRED'
      );
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      throw new APIClientException(
        'Authentication required - please sign in',
        401,
        'UNAUTHORIZED'
      );
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      throw new APIClientException(
        'You do not have permission to perform this action',
        403,
        'FORBIDDEN'
      );
    }

    // Handle 429 Rate Limited
    if (response.status === 429) {
      throw new APIClientException(
        'Too many requests - please try again later',
        429,
        'RATE_LIMITED'
      );
    }

    // Generic error for other status codes
    throw new APIClientException(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }

  private handleError(error: unknown, context: string): string {
    console.error(`API Error in ${context}:`, error);

    let errorMessage = 'An unexpected error occurred';

    if (error instanceof APIClientException) {
      errorMessage = error.message;
      // Don't show toast for 402 - notification is already shown
      if (error.status !== 402) {
        toast.error(errorMessage);
      }
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
      toast.error(errorMessage);
    } else if (typeof error === 'string') {
      errorMessage = error;
      toast.error(errorMessage);
    } else {
      toast.error(errorMessage);
    }

    return errorMessage;
  }

  async get<T>(
    url: string,
    context: string = 'GET request'
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        await this.handleResponseError(response, context);
      }

      const data = await response.json();
      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.handleError(error, context);
      return { data: null, error: errorMessage, success: false };
    }
  }

  async post<T>(
    url: string,
    body: unknown,
    context: string = 'POST request'
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        await this.handleResponseError(response, context);
      }

      const data = await response.json();
      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.handleError(error, context);
      return { data: null, error: errorMessage, success: false };
    }
  }

  async put<T>(
    url: string,
    body: unknown,
    context: string = 'PUT request'
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        await this.handleResponseError(response, context);
      }

      const data = await response.json();
      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.handleError(error, context);
      return { data: null, error: errorMessage, success: false };
    }
  }

  async delete<T>(
    url: string,
    context: string = 'DELETE request'
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        await this.handleResponseError(response, context);
      }

      const data = await response.json();
      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.handleError(error, context);
      return { data: null, error: errorMessage, success: false };
    }
  }

  // Supabase-specific methods
  async supabaseQuery<T>(
    table: string,
    query: unknown,
    context: string = 'Supabase query'
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.handleError(error, context);
      return { data: null, error: errorMessage, success: false };
    }
  }
}

export const apiClient = new ApiClient();
