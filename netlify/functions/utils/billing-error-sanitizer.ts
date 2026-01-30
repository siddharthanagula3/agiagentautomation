/**
 * Billing Error Sanitization Utility
 * SECURITY: Prevents exposure of internal error details in API responses
 *
 * Created: January 30, 2026
 *
 * This module provides:
 * 1. Error classification and mapping
 * 2. User-friendly message generation
 * 3. Unique error codes for debugging (logged server-side)
 * 4. Stripe-specific error handling
 */

import Stripe from 'stripe';

// =============================================================================
// ERROR CODES
// Unique codes for debugging - these are safe to expose to clients
// The actual error details are logged server-side
// =============================================================================

export const BILLING_ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'BILLING_AUTH_001',
  AUTH_INVALID: 'BILLING_AUTH_002',
  AUTH_EXPIRED: 'BILLING_AUTH_003',

  // Customer errors
  CUSTOMER_NOT_FOUND: 'BILLING_CUST_001',
  CUSTOMER_MISMATCH: 'BILLING_CUST_002',
  CUSTOMER_CREATE_FAILED: 'BILLING_CUST_003',

  // Subscription errors
  SUBSCRIPTION_CREATE_FAILED: 'BILLING_SUB_001',
  SUBSCRIPTION_NOT_FOUND: 'BILLING_SUB_002',
  SUBSCRIPTION_ALREADY_EXISTS: 'BILLING_SUB_003',
  SUBSCRIPTION_CANCEL_FAILED: 'BILLING_SUB_004',

  // Payment errors
  PAYMENT_FAILED: 'BILLING_PAY_001',
  PAYMENT_DECLINED: 'BILLING_PAY_002',
  PAYMENT_INVALID_CARD: 'BILLING_PAY_003',
  PAYMENT_INSUFFICIENT_FUNDS: 'BILLING_PAY_004',
  PAYMENT_EXPIRED_CARD: 'BILLING_PAY_005',

  // Billing portal errors
  PORTAL_CREATE_FAILED: 'BILLING_PORTAL_001',
  PORTAL_SESSION_INVALID: 'BILLING_PORTAL_002',

  // Token/pack errors
  TOKEN_PURCHASE_FAILED: 'BILLING_TOKEN_001',
  INVALID_PACK_ID: 'BILLING_TOKEN_002',
  PRICE_MISMATCH: 'BILLING_TOKEN_003',

  // Webhook errors
  WEBHOOK_SIGNATURE_INVALID: 'BILLING_HOOK_001',
  WEBHOOK_PROCESSING_FAILED: 'BILLING_HOOK_002',

  // Database errors
  DATABASE_ERROR: 'BILLING_DB_001',
  DATABASE_CONNECTION: 'BILLING_DB_002',

  // Validation errors
  VALIDATION_FAILED: 'BILLING_VAL_001',
  INVALID_INPUT: 'BILLING_VAL_002',

  // Rate limiting
  RATE_LIMITED: 'BILLING_RATE_001',

  // Generic errors
  INTERNAL_ERROR: 'BILLING_INT_001',
  SERVICE_UNAVAILABLE: 'BILLING_SVC_001',
  CONFIGURATION_ERROR: 'BILLING_CFG_001',
} as const;

export type BillingErrorCode = typeof BILLING_ERROR_CODES[keyof typeof BILLING_ERROR_CODES];

// =============================================================================
// USER-FRIENDLY ERROR MESSAGES
// These are safe to show to end users
// =============================================================================

const USER_FRIENDLY_MESSAGES: Record<BillingErrorCode, string> = {
  // Authentication
  [BILLING_ERROR_CODES.AUTH_REQUIRED]: 'Please log in to access billing features.',
  [BILLING_ERROR_CODES.AUTH_INVALID]: 'Your session has expired. Please log in again.',
  [BILLING_ERROR_CODES.AUTH_EXPIRED]: 'Your session has expired. Please log in again.',

  // Customer
  [BILLING_ERROR_CODES.CUSTOMER_NOT_FOUND]: 'Unable to find your billing information. Please contact support.',
  [BILLING_ERROR_CODES.CUSTOMER_MISMATCH]: 'You do not have permission to access this billing information.',
  [BILLING_ERROR_CODES.CUSTOMER_CREATE_FAILED]: 'Unable to set up your billing account. Please try again.',

  // Subscription
  [BILLING_ERROR_CODES.SUBSCRIPTION_CREATE_FAILED]: 'Unable to create your subscription. Please try again.',
  [BILLING_ERROR_CODES.SUBSCRIPTION_NOT_FOUND]: 'No active subscription found.',
  [BILLING_ERROR_CODES.SUBSCRIPTION_ALREADY_EXISTS]: 'You already have an active subscription.',
  [BILLING_ERROR_CODES.SUBSCRIPTION_CANCEL_FAILED]: 'Unable to cancel subscription. Please try again or contact support.',

  // Payment
  [BILLING_ERROR_CODES.PAYMENT_FAILED]: 'Payment processing failed. Please try again.',
  [BILLING_ERROR_CODES.PAYMENT_DECLINED]: 'Your payment was declined. Please check your card details.',
  [BILLING_ERROR_CODES.PAYMENT_INVALID_CARD]: 'Invalid card information. Please check your card details.',
  [BILLING_ERROR_CODES.PAYMENT_INSUFFICIENT_FUNDS]: 'Insufficient funds. Please use a different payment method.',
  [BILLING_ERROR_CODES.PAYMENT_EXPIRED_CARD]: 'Your card has expired. Please update your payment method.',

  // Portal
  [BILLING_ERROR_CODES.PORTAL_CREATE_FAILED]: 'Unable to open billing portal. Please try again.',
  [BILLING_ERROR_CODES.PORTAL_SESSION_INVALID]: 'Billing portal session is invalid. Please try again.',

  // Token/pack
  [BILLING_ERROR_CODES.TOKEN_PURCHASE_FAILED]: 'Unable to complete token purchase. Please try again.',
  [BILLING_ERROR_CODES.INVALID_PACK_ID]: 'Invalid token pack selected.',
  [BILLING_ERROR_CODES.PRICE_MISMATCH]: 'Pricing error. Please refresh and try again.',

  // Webhook
  [BILLING_ERROR_CODES.WEBHOOK_SIGNATURE_INVALID]: 'Invalid request signature.',
  [BILLING_ERROR_CODES.WEBHOOK_PROCESSING_FAILED]: 'Payment processing error. Your payment may still complete.',

  // Database
  [BILLING_ERROR_CODES.DATABASE_ERROR]: 'Service temporarily unavailable. Please try again.',
  [BILLING_ERROR_CODES.DATABASE_CONNECTION]: 'Service temporarily unavailable. Please try again.',

  // Validation
  [BILLING_ERROR_CODES.VALIDATION_FAILED]: 'Invalid request. Please check your input.',
  [BILLING_ERROR_CODES.INVALID_INPUT]: 'Invalid input provided. Please check and try again.',

  // Rate limiting
  [BILLING_ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',

  // Generic
  [BILLING_ERROR_CODES.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again.',
  [BILLING_ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.',
  [BILLING_ERROR_CODES.CONFIGURATION_ERROR]: 'System configuration error. Please contact support.',
};

// =============================================================================
// ERROR CLASSIFICATION
// Patterns to detect and classify errors
// =============================================================================

interface ErrorPattern {
  pattern: RegExp | string;
  code: BillingErrorCode;
}

const STRIPE_ERROR_PATTERNS: ErrorPattern[] = [
  // Card errors
  { pattern: /card_declined/i, code: BILLING_ERROR_CODES.PAYMENT_DECLINED },
  { pattern: /insufficient_funds/i, code: BILLING_ERROR_CODES.PAYMENT_INSUFFICIENT_FUNDS },
  { pattern: /expired_card/i, code: BILLING_ERROR_CODES.PAYMENT_EXPIRED_CARD },
  { pattern: /incorrect_cvc|invalid_cvc/i, code: BILLING_ERROR_CODES.PAYMENT_INVALID_CARD },
  { pattern: /incorrect_number|invalid_number/i, code: BILLING_ERROR_CODES.PAYMENT_INVALID_CARD },
  { pattern: /invalid_expiry/i, code: BILLING_ERROR_CODES.PAYMENT_INVALID_CARD },

  // Customer errors
  { pattern: /No such customer/i, code: BILLING_ERROR_CODES.CUSTOMER_NOT_FOUND },
  { pattern: /customer.*not found/i, code: BILLING_ERROR_CODES.CUSTOMER_NOT_FOUND },
  { pattern: /cus_[a-zA-Z0-9]+/i, code: BILLING_ERROR_CODES.CUSTOMER_NOT_FOUND },

  // Subscription errors
  { pattern: /No such subscription/i, code: BILLING_ERROR_CODES.SUBSCRIPTION_NOT_FOUND },
  { pattern: /subscription.*not found/i, code: BILLING_ERROR_CODES.SUBSCRIPTION_NOT_FOUND },
  { pattern: /already subscribed/i, code: BILLING_ERROR_CODES.SUBSCRIPTION_ALREADY_EXISTS },

  // Authentication errors
  { pattern: /Invalid API Key/i, code: BILLING_ERROR_CODES.CONFIGURATION_ERROR },
  { pattern: /authentication/i, code: BILLING_ERROR_CODES.AUTH_INVALID },

  // Rate limiting
  { pattern: /rate_limit/i, code: BILLING_ERROR_CODES.RATE_LIMITED },
  { pattern: /too many requests/i, code: BILLING_ERROR_CODES.RATE_LIMITED },
];

const DATABASE_ERROR_PATTERNS: ErrorPattern[] = [
  { pattern: /connection refused/i, code: BILLING_ERROR_CODES.DATABASE_CONNECTION },
  { pattern: /connection timeout/i, code: BILLING_ERROR_CODES.DATABASE_CONNECTION },
  { pattern: /ECONNREFUSED/i, code: BILLING_ERROR_CODES.DATABASE_CONNECTION },
  { pattern: /database.*error/i, code: BILLING_ERROR_CODES.DATABASE_ERROR },
  { pattern: /PGRST/i, code: BILLING_ERROR_CODES.DATABASE_ERROR },
  { pattern: /supabase/i, code: BILLING_ERROR_CODES.DATABASE_ERROR },
  { pattern: /postgres/i, code: BILLING_ERROR_CODES.DATABASE_ERROR },
];

const AUTH_ERROR_PATTERNS: ErrorPattern[] = [
  { pattern: /not authenticated/i, code: BILLING_ERROR_CODES.AUTH_REQUIRED },
  { pattern: /unauthorized/i, code: BILLING_ERROR_CODES.AUTH_INVALID },
  { pattern: /jwt.*expired/i, code: BILLING_ERROR_CODES.AUTH_EXPIRED },
  { pattern: /token.*expired/i, code: BILLING_ERROR_CODES.AUTH_EXPIRED },
  { pattern: /invalid.*token/i, code: BILLING_ERROR_CODES.AUTH_INVALID },
  { pattern: /forbidden/i, code: BILLING_ERROR_CODES.CUSTOMER_MISMATCH },
];

// =============================================================================
// SANITIZED ERROR RESPONSE INTERFACE
// =============================================================================

export interface SanitizedBillingError {
  error: string;
  code: BillingErrorCode;
  // requestId is optional - used for correlation with server logs
  requestId?: string;
}

// =============================================================================
// MAIN SANITIZATION FUNCTION
// =============================================================================

/**
 * Sanitize a billing error for safe client response
 *
 * @param error - The original error (can be Error, Stripe.Error, or unknown)
 * @param context - Context to help classify the error (e.g., 'portal', 'subscription')
 * @param requestId - Optional request ID for log correlation
 * @returns A sanitized error response safe for client consumption
 */
export function sanitizeBillingError(
  error: unknown,
  context?: 'portal' | 'subscription' | 'token' | 'webhook' | 'validation',
  requestId?: string
): SanitizedBillingError {
  // Get the error message for pattern matching
  const errorMessage = getErrorMessage(error);

  // Classify the error
  const code = classifyError(error, errorMessage, context);

  // Get user-friendly message
  const userMessage = USER_FRIENDLY_MESSAGES[code];

  return {
    error: userMessage,
    code,
    ...(requestId && { requestId }),
  };
}

/**
 * Extract error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Unknown error';
}

/**
 * Classify an error to determine the appropriate error code
 */
function classifyError(
  error: unknown,
  errorMessage: string,
  context?: string
): BillingErrorCode {
  // Check if it's a Stripe error first
  if (isStripeError(error)) {
    return classifyStripeError(error as Stripe.StripeRawError);
  }

  // Check patterns in order of specificity
  for (const { pattern, code } of AUTH_ERROR_PATTERNS) {
    if (matchPattern(errorMessage, pattern)) {
      return code;
    }
  }

  for (const { pattern, code } of STRIPE_ERROR_PATTERNS) {
    if (matchPattern(errorMessage, pattern)) {
      return code;
    }
  }

  for (const { pattern, code } of DATABASE_ERROR_PATTERNS) {
    if (matchPattern(errorMessage, pattern)) {
      return code;
    }
  }

  // Context-based fallbacks
  switch (context) {
    case 'portal':
      return BILLING_ERROR_CODES.PORTAL_CREATE_FAILED;
    case 'subscription':
      return BILLING_ERROR_CODES.SUBSCRIPTION_CREATE_FAILED;
    case 'token':
      return BILLING_ERROR_CODES.TOKEN_PURCHASE_FAILED;
    case 'webhook':
      return BILLING_ERROR_CODES.WEBHOOK_PROCESSING_FAILED;
    case 'validation':
      return BILLING_ERROR_CODES.VALIDATION_FAILED;
    default:
      return BILLING_ERROR_CODES.INTERNAL_ERROR;
  }
}

/**
 * Check if error is a Stripe error
 */
function isStripeError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'type' in error &&
    typeof (error as { type: unknown }).type === 'string' &&
    (error as { type: string }).type.includes('Stripe')
  );
}

/**
 * Classify a Stripe-specific error
 */
function classifyStripeError(error: Stripe.StripeRawError): BillingErrorCode {
  // Use Stripe's error code if available
  const stripeCode = error.code;

  if (stripeCode) {
    switch (stripeCode) {
      case 'card_declined':
        return BILLING_ERROR_CODES.PAYMENT_DECLINED;
      case 'expired_card':
        return BILLING_ERROR_CODES.PAYMENT_EXPIRED_CARD;
      case 'incorrect_cvc':
      case 'invalid_cvc':
      case 'incorrect_number':
      case 'invalid_number':
      case 'invalid_expiry_month':
      case 'invalid_expiry_year':
        return BILLING_ERROR_CODES.PAYMENT_INVALID_CARD;
      case 'insufficient_funds':
        return BILLING_ERROR_CODES.PAYMENT_INSUFFICIENT_FUNDS;
      case 'rate_limit':
        return BILLING_ERROR_CODES.RATE_LIMITED;
      case 'resource_missing':
        return BILLING_ERROR_CODES.CUSTOMER_NOT_FOUND;
    }
  }

  // Use Stripe's error type
  const stripeType = error.type;
  switch (stripeType) {
    case 'StripeCardError':
      return BILLING_ERROR_CODES.PAYMENT_FAILED;
    case 'StripeRateLimitError':
      return BILLING_ERROR_CODES.RATE_LIMITED;
    case 'StripeInvalidRequestError':
      return BILLING_ERROR_CODES.VALIDATION_FAILED;
    case 'StripeAuthenticationError':
      return BILLING_ERROR_CODES.CONFIGURATION_ERROR;
    case 'StripeAPIError':
    case 'StripeConnectionError':
      return BILLING_ERROR_CODES.SERVICE_UNAVAILABLE;
    default:
      return BILLING_ERROR_CODES.PAYMENT_FAILED;
  }
}

/**
 * Match a string against a pattern (RegExp or string)
 */
function matchPattern(text: string, pattern: RegExp | string): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(text);
  }
  return text.toLowerCase().includes(pattern.toLowerCase());
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Standardized error response type for Netlify functions
 */
interface BillingErrorResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Create a standardized error response for Netlify functions
 */
export function createBillingErrorResponse(
  statusCode: number,
  error: unknown,
  context?: 'portal' | 'subscription' | 'token' | 'webhook' | 'validation',
  requestId?: string,
  headers?: Record<string, string>
): BillingErrorResponse {
  const sanitized = sanitizeBillingError(error, context, requestId);

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(sanitized),
  };
}

/**
 * Detect if an error message contains potentially sensitive information
 * This is useful for logging purposes to determine if additional scrubbing is needed
 */
export function containsSensitiveInfo(message: string): boolean {
  const sensitivePatterns = [
    /cus_[a-zA-Z0-9]+/, // Stripe customer IDs
    /sub_[a-zA-Z0-9]+/, // Stripe subscription IDs
    /pi_[a-zA-Z0-9]+/, // Stripe payment intent IDs
    /ch_[a-zA-Z0-9]+/, // Stripe charge IDs
    /sk_[a-zA-Z0-9]+/, // Stripe secret keys
    /pk_[a-zA-Z0-9]+/, // Stripe publishable keys
    /whsec_[a-zA-Z0-9]+/, // Stripe webhook secrets
    /[a-zA-Z0-9-]+@[a-zA-Z0-9-]+\.[a-zA-Z]+/, // Email addresses
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card numbers
    /\b\d{3,4}\b.*cvc|cvv/i, // CVC/CVV codes
    /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*/, // JWT tokens
    /at\s+[\w/\\.-]+:\d+:\d+/, // Stack traces
    /Error:\s+at\s+/, // Stack trace start
    /node_modules/, // Internal paths
  ];

  return sensitivePatterns.some((pattern) => pattern.test(message));
}

/**
 * Scrub sensitive information from a message for safe logging
 * Note: The original message should still be logged securely server-side
 */
export function scrubSensitiveInfo(message: string): string {
  let scrubbed = message;

  // Replace Stripe IDs
  scrubbed = scrubbed.replace(/cus_[a-zA-Z0-9]+/g, 'cus_[REDACTED]');
  scrubbed = scrubbed.replace(/sub_[a-zA-Z0-9]+/g, 'sub_[REDACTED]');
  scrubbed = scrubbed.replace(/pi_[a-zA-Z0-9]+/g, 'pi_[REDACTED]');
  scrubbed = scrubbed.replace(/ch_[a-zA-Z0-9]+/g, 'ch_[REDACTED]');
  scrubbed = scrubbed.replace(/sk_[a-zA-Z0-9]+/g, 'sk_[REDACTED]');
  scrubbed = scrubbed.replace(/pk_[a-zA-Z0-9]+/g, 'pk_[REDACTED]');
  scrubbed = scrubbed.replace(/whsec_[a-zA-Z0-9]+/g, 'whsec_[REDACTED]');

  // Replace email addresses
  scrubbed = scrubbed.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL_REDACTED]'
  );

  // Replace potential card numbers
  scrubbed = scrubbed.replace(
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    '[CARD_REDACTED]'
  );

  // Replace JWT tokens
  scrubbed = scrubbed.replace(
    /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    '[JWT_REDACTED]'
  );

  // Remove stack traces
  scrubbed = scrubbed.replace(/\s+at\s+[\w/\\.-]+:\d+:\d+/g, '');
  scrubbed = scrubbed.replace(/\s+at\s+\S+\s+\([^)]+\)/g, '');

  return scrubbed;
}
