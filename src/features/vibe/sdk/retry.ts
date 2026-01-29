/**
 * Retry utilities from VibeSDK
 *
 * @deprecated This module re-exports from @shared/lib/error-utils for backward compatibility.
 * Please import directly from '@shared/lib/error-utils' for new code.
 *
 * Original source: https://github.com/nichochar/vibing-ai/blob/main/sdk/src/retry.ts
 */

export {
  type RetryOptions as RetryConfig,
  type NormalizedRetryConfig,
  normalizeRetryConfig,
  computeBackoffMs,
  sleep,
} from '@shared/lib/error-utils';
