/**
 * Error Handling Utilities
 *
 * @deprecated This module re-exports from @shared/lib/error-utils for backward compatibility.
 * Please import directly from '@shared/lib/error-utils' for new code.
 *
 * Migration: Replace imports from '@shared/utils/error-handling' with '@shared/lib/error-utils'
 */

export {
  // Error types and codes
  ErrorCodes,
  type ErrorCode,
  AppError,
  TimeoutError,

  // Error detection and classification
  isRetryableError,
  getErrorMessage,
  parseErrorMessage,
  getTechnicalErrorMessage,
  toAppError,

  // Timeout utilities
  TimeoutPresets,
  withTimeout,
  fetchWithTimeout,
  type FetchWithTimeoutOptions,

  // Retry utilities
  type RetryOptions,
  type NormalizedRetryConfig,
  normalizeRetryConfig,
  computeBackoffMs,
  sleep,
  retryWithBackoff,
  getRetryDelay,

  // Error handling wrappers
  withErrorHandling,
  safeJsonParse,
} from '@shared/lib/error-utils';
