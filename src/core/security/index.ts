/**
 * Security Module Index
 *
 * Central export point for all security utilities.
 * Import security functions from this file for consistent access.
 *
 * @example
 * import {
 *   detectPromptInjection,
 *   sanitizeEmployeeInput,
 *   checkApiAbuse
 * } from '@core/security';
 */

// Prompt injection detection
export {
  detectPromptInjection,
  sanitizePromptInput,
  validatePromptInput,
  checkUserInput,
  logInjectionAttempt,
  type InjectionDetectionResult,
} from './prompt-injection-detector';

// Employee-specific input sanitization
export {
  sanitizeEmployeeInput,
  applySandwichDefense,
  buildSecureMessages,
  validateEmployeeOutput,
  defaultEmployeeInputConfig,
  EMPLOYEE_SPECIFIC_PATTERNS,
  OUTPUT_LEAKAGE_PATTERNS,
  type SanitizationResult,
  type EmployeeInputConfig,
  type OutputValidationResult,
} from './employee-input-sanitizer';

// API abuse prevention
export {
  checkApiAbuse,
  trackRequestStart,
  trackRequestEnd,
  detectAbusePatterns,
  cleanupOldMetrics,
  getUserUsageStats,
  REQUEST_LIMITS,
  type ApiUsageMetrics,
  type AbusePrevention,
} from './api-abuse-prevention';

// Gradual rollout (feature flags)
export { isFeatureEnabled, type FeatureFlag } from './gradual-rollout';

// Account lockout (brute force protection)
export {
  accountLockoutService,
  AccountLockoutService,
  LOCKOUT_PRESETS,
  type LockoutConfig,
  type LockoutCheckResult,
  type FailedLoginResult,
  type SecurityEventType,
  type SecuritySeverity,
  type SecurityEventDetails,
} from '@core/auth/account-lockout-service';
