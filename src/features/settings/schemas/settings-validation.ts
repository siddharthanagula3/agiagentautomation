/**
 * Settings Form Validation Schemas
 * Comprehensive Zod schemas for all settings forms with XSS sanitization
 *
 * @module features/settings/schemas/settings-validation
 */

import { z } from 'zod';
import { sanitizeUserInput, sanitizeURL } from '@shared/utils/html-sanitizer';

// ============================================================================
// XSS SANITIZATION TRANSFORMERS
// ============================================================================

/**
 * Transform that sanitizes and validates URLs
 */
const sanitizedUrl = z
  .string()
  .optional()
  .transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const sanitized = sanitizeURL(val);
    return sanitized || undefined;
  });

// ============================================================================
// PROFILE SETTINGS SCHEMA
// ============================================================================

export const profileSettingsSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform((val) => sanitizeUserInput(val, 100)),

  phone: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      // Remove any HTML/script attempts and validate phone format
      const sanitized = sanitizeUserInput(val, 20);
      return sanitized;
    })
    .pipe(
      z
        .string()
        .regex(
          /^[+]?[\d\s\-().]*$/,
          'Phone number can only contain digits, spaces, +, -, (, and )'
        )
        .optional()
    ),

  timezone: z.enum(
    [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Australia/Sydney',
    ],
    { errorMap: () => ({ message: 'Please select a valid timezone' }) }
  ),

  language: z.enum(['en', 'es', 'fr', 'de', 'zh', 'ja'], {
    errorMap: () => ({ message: 'Please select a valid language' }),
  }),

  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      return sanitizeUserInput(val, 500);
    }),

  avatar_url: sanitizedUrl,
});

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;

// ============================================================================
// SECURITY SETTINGS SCHEMA
// ============================================================================

/**
 * Password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

export const changePasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const securitySettingsSchema = z.object({
  two_factor_enabled: z.boolean(),
  session_timeout: z
    .number()
    .int('Session timeout must be a whole number')
    .min(15, 'Session timeout must be at least 15 minutes')
    .max(1440, 'Session timeout cannot exceed 24 hours'),
});

export type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;

// ============================================================================
// NOTIFICATION PREFERENCES SCHEMA
// ============================================================================

export const notificationPreferencesSchema = z.object({
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  workflow_alerts: z.boolean(),
  employee_updates: z.boolean(),
  system_maintenance: z.boolean(),
  marketing_emails: z.boolean(),
  weekly_reports: z.boolean(),
  instant_alerts: z.boolean(),
});

export type NotificationPreferencesFormData = z.infer<
  typeof notificationPreferencesSchema
>;

// ============================================================================
// APPEARANCE SETTINGS SCHEMA
// ============================================================================

export const appearanceSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'auto'], {
    errorMap: () => ({ message: 'Please select a valid theme' }),
  }),
  auto_save: z.boolean(),
  debug_mode: z.boolean(),
  analytics_enabled: z.boolean(),
});

export type AppearanceSettingsFormData = z.infer<
  typeof appearanceSettingsSchema
>;

// ============================================================================
// ADVANCED SETTINGS SCHEMA
// ============================================================================

export const advancedSettingsSchema = z.object({
  cache_size: z.enum(['256MB', '512MB', '1GB', '2GB', '4GB'], {
    errorMap: () => ({ message: 'Please select a valid cache size' }),
  }),
  backup_frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly'], {
    errorMap: () => ({ message: 'Please select a valid backup frequency' }),
  }),
  retention_period: z
    .number()
    .int('Retention period must be a whole number')
    .min(1, 'Retention period must be at least 1 day')
    .max(365, 'Retention period cannot exceed 365 days'),
  max_concurrent_jobs: z
    .number()
    .int('Must be a whole number')
    .min(1, 'Must allow at least 1 concurrent job')
    .max(100, 'Cannot exceed 100 concurrent jobs'),
});

export type AdvancedSettingsFormData = z.infer<typeof advancedSettingsSchema>;

// ============================================================================
// API KEY SCHEMA
// ============================================================================

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'API key name is required')
    .max(100, 'API key name must be less than 100 characters')
    .transform((val) => sanitizeUserInput(val, 100)),
});

export type CreateApiKeyFormData = z.infer<typeof createApiKeySchema>;

// ============================================================================
// COMBINED SYSTEM SETTINGS SCHEMA
// ============================================================================

export const systemSettingsSchema = appearanceSettingsSchema.merge(
  advancedSettingsSchema
);

export type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;

// ============================================================================
// FULL USER SETTINGS SCHEMA (for complete settings update)
// ============================================================================

export const fullUserSettingsSchema = z.object({
  // Notification preferences
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  workflow_alerts: z.boolean().optional(),
  employee_updates: z.boolean().optional(),
  system_maintenance: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  weekly_reports: z.boolean().optional(),
  instant_alerts: z.boolean().optional(),

  // Security
  two_factor_enabled: z.boolean().optional(),
  session_timeout: z.number().int().min(15).max(1440).optional(),

  // Appearance
  theme: z.enum(['dark', 'light', 'auto']).optional(),
  auto_save: z.boolean().optional(),
  debug_mode: z.boolean().optional(),
  analytics_enabled: z.boolean().optional(),

  // Advanced
  cache_size: z.enum(['256MB', '512MB', '1GB', '2GB', '4GB']).optional(),
  backup_frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
  retention_period: z.number().int().min(1).max(365).optional(),
  max_concurrent_jobs: z.number().int().min(1).max(100).optional(),
});

export type FullUserSettingsFormData = z.infer<typeof fullUserSettingsSchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate form data against a schema with detailed error messages
 * Compatible with Zod v4
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  // Zod v4 uses issues property
  const issues = (result.error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues || [];

  for (const issue of issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  // If no path-based errors found, add a root error
  if (Object.keys(errors).length === 0 && issues.length > 0) {
    errors['_root'] = issues[0].message;
  }

  return { success: false, errors };
}

/**
 * Get first error message from Zod error
 * Compatible with Zod v4
 */
export function getFirstError(error: z.ZodError): string {
  const issues = (error as { issues?: Array<{ message: string }> }).issues || [];
  return issues[0]?.message || 'Validation failed';
}

/**
 * Transform Zod errors to react-hook-form format
 */
export function zodErrorsToFormErrors(
  error: z.ZodError
): Record<string, { message: string }> {
  const formErrors: Record<string, { message: string }> = {};

  for (const zodError of error.errors) {
    const path = zodError.path.join('.');
    if (path && !formErrors[path]) {
      formErrors[path] = { message: zodError.message };
    }
  }

  return formErrors;
}
