/**
 * React Query configuration and setup
 * Handles server state management and API caching
 */

import React from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useNotificationStore } from './notification-store';

// Configure query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: How long unused data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry configuration
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },

      // Retry delay (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus
      refetchOnWindowFocus: false,

      // Refetch on network reconnect
      refetchOnReconnect: true,

      // Enable background refetch
      refetchInterval: false,

      // Error handling
      throwOnError: false,

      // Suspense mode
      suspense: false,
    },
    mutations: {
      // Global retry for mutations
      retry: 1,
      retryDelay: 1000,

      // Error handling
      throwOnError: false,
    },
  },
});

// Query client provider wrapper with dev tools
interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children,
    React.createElement(ReactQueryDevtools, {
      initialIsOpen: false,
      buttonPosition: 'bottom-right',
    })
  );
};

// Query keys factory for consistent key management
export const queryKeys = {
  // Authentication
  auth: {
    user: () => ['auth', 'user'] as const,
    session: () => ['auth', 'session'] as const,
    permissions: () => ['auth', 'permissions'] as const,
  },

  // Chat
  chat: {
    all: () => ['chat'] as const,
    conversations: () => ['chat', 'conversations'] as const,
    conversation: (id: string) => ['chat', 'conversation', id] as const,
    sessions: (userId: string) => ['chat', 'sessions', userId] as const,
    session: (sessionId: string) => ['chat', 'session', sessionId] as const,
    messages: (conversationId: string) =>
      ['chat', 'messages', conversationId] as const,
    messageCount: (sessionId: string) =>
      ['chat', 'messageCount', sessionId] as const,
    models: () => ['chat', 'models'] as const,
    search: (userId: string, query: string) =>
      ['chat', 'search', userId, query] as const,
  },

  // Employees / Marketplace
  employees: {
    all: () => ['employees'] as const,
    list: (filters?: unknown) => ['employees', 'list', filters] as const,
    detail: (id: string) => ['employees', 'detail', id] as const,
    reviews: (id: string) => ['employees', 'reviews', id] as const,
    categories: () => ['employees', 'categories'] as const,
    owned: () => ['employees', 'owned'] as const,
    favorites: () => ['employees', 'favorites'] as const,
    marketplace: (filters?: {
      category?: string;
      search?: string;
      sortBy?: string;
    }) => ['employees', 'marketplace', filters] as const,
    purchased: (userId: string) => ['employees', 'purchased', userId] as const,
  },

  // Workforce
  workforce: {
    all: () => ['workforce'] as const,
    jobs: () => ['workforce', 'jobs'] as const,
    job: (id: string) => ['workforce', 'job', id] as const,
    workers: () => ['workforce', 'workers'] as const,
    worker: (id: string) => ['workforce', 'worker', id] as const,
    templates: () => ['workforce', 'templates'] as const,
    stats: () => ['workforce', 'stats'] as const,
    hired: (userId: string) => ['workforce', 'hired', userId] as const,
  },

  // Billing
  billing: {
    all: () => ['billing'] as const,
    subscription: () => ['billing', 'subscription'] as const,
    plan: (userId: string) => ['billing', 'plan', userId] as const,
    invoices: () => ['billing', 'invoices'] as const,
    paymentMethods: () => ['billing', 'payment-methods'] as const,
    usage: () => ['billing', 'usage'] as const,
    tokenBalance: (userId: string) =>
      ['billing', 'tokenBalance', userId] as const,
    tokenUsage: (userId: string) => ['billing', 'tokenUsage', userId] as const,
    analytics: (userId: string, timeRange: string) =>
      ['billing', 'analytics', userId, timeRange] as const,
  },

  // Settings
  settings: {
    all: () => ['settings'] as const,
    profile: (userId?: string) => ['settings', 'profile', userId] as const,
    preferences: (userId?: string) =>
      ['settings', 'preferences', userId] as const,
    apiKeys: (userId?: string) => ['settings', 'apiKeys', userId] as const,
    notifications: () => ['settings', 'notifications'] as const,
  },

  // System
  system: {
    health: () => ['system', 'health'] as const,
    config: () => ['system', 'config'] as const,
    features: () => ['system', 'features'] as const,
  },
} as const;

// Re-export ApiError from shared types for convenience
export type { ApiError as APIError } from '@shared/types';

// Custom error class
export class APIException extends Error {
  code?: string;
  status?: number;
  details?: unknown;

  constructor(error: APIError) {
    super(error.message);
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
    this.name = 'APIException';
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

// Re-export ApiResponse from shared types
// Note: The shared ApiResponse is slightly different but compatible
import type { ApiError, ApiResponse as SharedApiResponse } from '@shared/types';

// Extended API response type for query client with pagination meta
export interface APIResponse<T = unknown>
  extends Omit<SharedApiResponse<T>, 'data'> {
  data: T;
  errors?: string[];
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  perPage?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Base fetch function with error handling
export const apiFetch = async <T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  // Get auth token from localStorage (in real app, this would come from auth store)
  const token = localStorage.getItem('auth_token');

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(fullUrl, config);

    // Handle 402 Payment Required specifically
    if (response.status === 402) {
      handlePaymentRequired();
      throw new APIException({
        message: 'Payment required - please upgrade your plan',
        status: 402,
        code: 'PAYMENT_REQUIRED',
      });
    }

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        throw new APIException({
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        });
      }

      const text = await response.text();
      return {
        data: text as T,
        success: true,
      };
    }

    const data: APIResponse<T> = await response.json();

    if (!response.ok) {
      throw new APIException({
        message:
          data.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        details: data.errors || data,
      });
    }

    return data;
  } catch (error) {
    if (error instanceof APIException) {
      throw error;
    }

    // Network or parsing error
    throw new APIException({
      message:
        error instanceof Error ? error.message : 'Network error occurred',
      code: 'NETWORK_ERROR',
    });
  }
};

// Utility functions for common API patterns
export const apiGet = <T = unknown>(
  url: string,
  params?: Record<string, unknown>
) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const urlWithParams = searchParams.toString()
    ? `${url}?${searchParams.toString()}`
    : url;

  return apiFetch<T>(urlWithParams, { method: 'GET' });
};

export const apiPost = <T = unknown>(url: string, data?: unknown) =>
  apiFetch<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = <T = unknown>(url: string, data?: unknown) =>
  apiFetch<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPatch = <T = unknown>(url: string, data?: unknown) =>
  apiFetch<T>(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = <T = unknown>(url: string) =>
  apiFetch<T>(url, { method: 'DELETE' });

// Utility to invalidate related queries
export const invalidateQueries = (patterns: (keyof typeof queryKeys)[]) => {
  patterns.forEach((pattern) => {
    queryClient.invalidateQueries({
      queryKey: [pattern],
      exact: false,
    });
  });
};

// Prefetch utility
export const prefetchQuery = <T = unknown>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: { staleTime?: number }
) => {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
  });
};

// Set query data utility
export const setQueryData = <T = unknown>(
  queryKey: readonly unknown[],
  data: T | ((old: T | undefined) => T)
) => {
  queryClient.setQueryData(queryKey, data);
};

// Optimistic update utilities
export const optimisticUpdate = <T = unknown>(
  queryKey: readonly unknown[],
  updater: (old: T | undefined) => T,
  rollbackFn?: () => void
) => {
  // Store previous data for rollback
  const previousData = queryClient.getQueryData<T>(queryKey);

  // Optimistically update
  queryClient.setQueryData(queryKey, updater);

  // Return rollback function
  return () => {
    if (rollbackFn) rollbackFn();
    queryClient.setQueryData(queryKey, previousData);
  };
};

// Background sync utility
export const backgroundSync = (queryKey: readonly unknown[]) => {
  return queryClient.refetchQueries({
    queryKey,
    type: 'active',
  });
};

// Export commonly used hooks for convenience
export {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
