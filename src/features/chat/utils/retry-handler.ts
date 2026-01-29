/**
 * Retry Handler Utility
 *
 * @deprecated This module re-exports from @shared/lib/error-utils for backward compatibility.
 * Please import directly from '@shared/lib/error-utils' for new code.
 *
 * Migration: Replace imports from '@features/chat/utils/retry-handler' with '@shared/lib/error-utils'
 */

export {
  // Retry utilities
  type RetryOptions,
  retryWithBackoff,

  // Error message utilities
  parseErrorMessage,
  getErrorMessage,

  // Error detection
  isRetryableError,
} from '@shared/lib/error-utils';
