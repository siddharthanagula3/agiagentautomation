/**
 * Sentry Integration Utilities
 *
 * Provides helper functions for error tracking, breadcrumb logging,
 * and user context management with Sentry.
 */

import * as Sentry from '@sentry/react';

/**
 * Set user context for Sentry events
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}): void {
  Sentry.setUser(user);

  // Also store user ID in localStorage for persistence across page loads
  if (user.id) {
    localStorage.setItem('user_id', user.id);
  }
}

/**
 * Clear user context (call on logout)
 */
export function clearUser(): void {
  Sentry.setUser(null);
  localStorage.removeItem('user_id');
}

/**
 * Add a custom breadcrumb for user actions
 */
export function addBreadcrumb(
  message: string,
  category: 'ui.click' | 'navigation' | 'api' | 'user' | 'state' | 'error',
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Log a navigation event
 */
export function logNavigation(from: string, to: string): void {
  addBreadcrumb(`Navigated from ${from} to ${to}`, 'navigation', {
    from,
    to,
  });
}

/**
 * Log a user action (button click, form submit, etc.)
 */
export function logUserAction(
  action: string,
  element?: string,
  data?: Record<string, unknown>
): void {
  addBreadcrumb(`User action: ${action}`, 'ui.click', {
    element,
    ...data,
  });
}

/**
 * Log an API call
 */
export function logApiCall(
  method: string,
  url: string,
  status?: number,
  duration?: number
): void {
  addBreadcrumb(`${method} ${url}`, 'api', {
    method,
    url,
    status_code: status,
    duration_ms: duration,
  });
}

/**
 * Log state changes
 */
export function logStateChange(
  storeName: string,
  action: string,
  data?: Record<string, unknown>
): void {
  addBreadcrumb(`${storeName}: ${action}`, 'state', data);
}

/**
 * Capture a custom error with context
 */
export function captureError(
  error: Error | string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
    fingerprint?: string[];
  }
): string {
  const err = typeof error === 'string' ? new Error(error) : error;

  return Sentry.captureException(err, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'error',
    fingerprint: context?.fingerprint,
  });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): string {
  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set custom tags for all future events
 */
export function setTags(tags: Record<string, string>): void {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * Set extra context for all future events
 */
export function setContext(
  name: string,
  context: Record<string, unknown>
): void {
  Sentry.setContext(name, context);
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  operation: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({
    name,
    op: operation,
  });
}

/**
 * Wrap an async function with error tracking
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context?: {
    operation?: string;
    tags?: Record<string, string>;
  }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    captureError(error as Error, {
      tags: {
        operation: context?.operation || 'unknown',
        ...context?.tags,
      },
    });
    throw error;
  }
}

/**
 * Create a wrapped component error boundary using Sentry
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap components with Sentry profiling
 */
export const withProfiler = Sentry.withProfiler;

/**
 * Check if Sentry is initialized and enabled
 */
export function isSentryEnabled(): boolean {
  return !!import.meta.env.VITE_SENTRY_DSN && Sentry.isInitialized();
}

/**
 * Flush all pending events (useful before page unload)
 */
export async function flush(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

// Export Sentry for direct access when needed
export { Sentry };
