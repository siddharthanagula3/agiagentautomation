/**
 * Settings Validation Schemas Tests
 * Comprehensive tests for form validation with XSS sanitization
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  profileSettingsSchema,
  changePasswordSchema,
  notificationPreferencesSchema,
  securitySettingsSchema,
  systemSettingsSchema,
  createApiKeySchema,
  validateFormData,
} from './settings-validation';

// Helper to get error messages from Zod result (compatible with Zod v4)
function getErrorMessages(result: z.SafeParseReturnType<unknown, unknown>): string[] {
  if (result.success) return [];
  // Zod v4 uses issues instead of errors in some cases
  const issues = (result.error as { issues?: Array<{ message: string }> }).issues || [];
  return issues.map((issue) => issue.message);
}

function hasErrorContaining(result: z.SafeParseReturnType<unknown, unknown>, text: string): boolean {
  const messages = getErrorMessages(result);
  return messages.some((msg) => msg.toLowerCase().includes(text.toLowerCase()));
}

describe('Settings Validation Schemas', () => {
  describe('profileSettingsSchema', () => {
    it('should validate a valid profile', () => {
      const validProfile = {
        name: 'John Doe',
        phone: '+1 555-123-4567',
        timezone: 'America/New_York',
        language: 'en',
        bio: 'Software developer',
      };

      const result = profileSettingsSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });

    it('should reject empty name', () => {
      const invalidProfile = {
        name: '',
        timezone: 'America/New_York',
        language: 'en',
      };

      const result = profileSettingsSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should reject name shorter than 2 characters', () => {
      const invalidProfile = {
        name: 'J',
        timezone: 'America/New_York',
        language: 'en',
      };

      const result = profileSettingsSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should sanitize XSS attempts in name', () => {
      const xssProfile = {
        name: '<script>alert("xss")</script>John Doe',
        timezone: 'America/New_York',
        language: 'en',
      };

      const result = profileSettingsSchema.safeParse(xssProfile);
      expect(result.success).toBe(true);
      if (result.success) {
        // Should not contain script tags
        expect(result.data.name).not.toContain('<script>');
        expect(result.data.name).not.toContain('</script>');
      }
    });

    it('should encode XSS attempts in bio', () => {
      const xssProfile = {
        name: 'John Doe',
        timezone: 'America/New_York',
        language: 'en',
        bio: '<img src=x onerror=alert("xss")>Hello',
      };

      const result = profileSettingsSchema.safeParse(xssProfile);
      expect(result.success).toBe(true);
      if (result.success && result.data.bio) {
        // XSS should be HTML-encoded (< becomes &lt;)
        expect(result.data.bio).toContain('&lt;');
        expect(result.data.bio).not.toContain('<img');
      }
    });

    it('should reject invalid phone format', () => {
      const invalidProfile = {
        name: 'John Doe',
        phone: 'not-a-phone<script>',
        timezone: 'America/New_York',
        language: 'en',
      };

      const result = profileSettingsSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should accept valid phone formats', () => {
      const validFormats = [
        '+1 555-123-4567',
        '(555) 123-4567',
        '555.123.4567',
        '+44 20 7946 0958',
      ];

      for (const phone of validFormats) {
        const profile = {
          name: 'John Doe',
          phone,
          timezone: 'America/New_York',
          language: 'en',
        };
        const result = profileSettingsSchema.safeParse(profile);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid timezone', () => {
      const invalidProfile = {
        name: 'John Doe',
        timezone: 'Invalid/Timezone',
        language: 'en',
      };

      const result = profileSettingsSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should reject invalid language', () => {
      const invalidProfile = {
        name: 'John Doe',
        timezone: 'America/New_York',
        language: 'invalid',
      };

      const result = profileSettingsSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should enforce bio max length', () => {
      const longBio = 'a'.repeat(600);
      const invalidProfile = {
        name: 'John Doe',
        timezone: 'America/New_York',
        language: 'en',
        bio: longBio,
      };

      const result = profileSettingsSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate a strong password', () => {
      const validPassword = {
        newPassword: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      };

      const result = changePasswordSchema.safeParse(validPassword);
      expect(result.success).toBe(true);
    });

    it('should reject password without uppercase', () => {
      const weakPassword = {
        newPassword: 'securepass123!',
        confirmPassword: 'securepass123!',
      };

      const result = changePasswordSchema.safeParse(weakPassword);
      expect(result.success).toBe(false);
      expect(hasErrorContaining(result, 'uppercase')).toBe(true);
    });

    it('should reject password without lowercase', () => {
      const weakPassword = {
        newPassword: 'SECUREPASS123!',
        confirmPassword: 'SECUREPASS123!',
      };

      const result = changePasswordSchema.safeParse(weakPassword);
      expect(result.success).toBe(false);
      expect(hasErrorContaining(result, 'lowercase')).toBe(true);
    });

    it('should reject password without number', () => {
      const weakPassword = {
        newPassword: 'SecurePassword!',
        confirmPassword: 'SecurePassword!',
      };

      const result = changePasswordSchema.safeParse(weakPassword);
      expect(result.success).toBe(false);
      expect(hasErrorContaining(result, 'number')).toBe(true);
    });

    it('should reject password without special character', () => {
      const weakPassword = {
        newPassword: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      };

      const result = changePasswordSchema.safeParse(weakPassword);
      expect(result.success).toBe(false);
      expect(hasErrorContaining(result, 'special')).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const shortPassword = {
        newPassword: 'Pass1!',
        confirmPassword: 'Pass1!',
      };

      const result = changePasswordSchema.safeParse(shortPassword);
      expect(result.success).toBe(false);
      expect(hasErrorContaining(result, '8')).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const mismatchedPassword = {
        newPassword: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
      };

      const result = changePasswordSchema.safeParse(mismatchedPassword);
      expect(result.success).toBe(false);
      expect(hasErrorContaining(result, 'match')).toBe(true);
    });
  });

  describe('notificationPreferencesSchema', () => {
    it('should validate valid notification preferences', () => {
      const validPrefs = {
        email_notifications: true,
        push_notifications: false,
        workflow_alerts: true,
        employee_updates: true,
        system_maintenance: true,
        marketing_emails: false,
        weekly_reports: true,
        instant_alerts: true,
      };

      const result = notificationPreferencesSchema.safeParse(validPrefs);
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean values', () => {
      const invalidPrefs = {
        email_notifications: 'yes', // Should be boolean
        push_notifications: false,
        workflow_alerts: true,
        employee_updates: true,
        system_maintenance: true,
        marketing_emails: false,
        weekly_reports: true,
        instant_alerts: true,
      };

      const result = notificationPreferencesSchema.safeParse(invalidPrefs);
      expect(result.success).toBe(false);
    });
  });

  describe('securitySettingsSchema', () => {
    it('should validate valid security settings', () => {
      const validSettings = {
        two_factor_enabled: true,
        session_timeout: 60,
      };

      const result = securitySettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it('should reject session timeout below minimum', () => {
      const invalidSettings = {
        two_factor_enabled: false,
        session_timeout: 10, // Below 15 minute minimum
      };

      const result = securitySettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
      expect(hasErrorContaining(result, '15')).toBe(true);
    });

    it('should reject session timeout above maximum', () => {
      const invalidSettings = {
        two_factor_enabled: false,
        session_timeout: 2000, // Above 1440 minute maximum
      };

      const result = securitySettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
      expect(hasErrorContaining(result, '24') || hasErrorContaining(result, '1440')).toBe(true);
    });
  });

  describe('systemSettingsSchema', () => {
    it('should validate valid system settings', () => {
      const validSettings = {
        theme: 'dark',
        auto_save: true,
        debug_mode: false,
        analytics_enabled: true,
        cache_size: '1GB',
        backup_frequency: 'daily',
        retention_period: 30,
        max_concurrent_jobs: 10,
      };

      const result = systemSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it('should reject invalid theme', () => {
      const invalidSettings = {
        theme: 'purple', // Invalid theme
        auto_save: true,
        debug_mode: false,
        analytics_enabled: true,
        cache_size: '1GB',
        backup_frequency: 'daily',
        retention_period: 30,
        max_concurrent_jobs: 10,
      };

      const result = systemSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should reject invalid cache size', () => {
      const invalidSettings = {
        theme: 'dark',
        auto_save: true,
        debug_mode: false,
        analytics_enabled: true,
        cache_size: '8GB', // Invalid cache size
        backup_frequency: 'daily',
        retention_period: 30,
        max_concurrent_jobs: 10,
      };

      const result = systemSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should reject retention period out of range', () => {
      const invalidSettings = {
        theme: 'dark',
        auto_save: true,
        debug_mode: false,
        analytics_enabled: true,
        cache_size: '1GB',
        backup_frequency: 'daily',
        retention_period: 500, // Above 365 day maximum
        max_concurrent_jobs: 10,
      };

      const result = systemSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should reject max concurrent jobs out of range', () => {
      const invalidSettings = {
        theme: 'dark',
        auto_save: true,
        debug_mode: false,
        analytics_enabled: true,
        cache_size: '1GB',
        backup_frequency: 'daily',
        retention_period: 30,
        max_concurrent_jobs: 150, // Above 100 maximum
      };

      const result = systemSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });
  });

  describe('createApiKeySchema', () => {
    it('should validate a valid API key name', () => {
      const validKey = {
        name: 'Production API Key',
      };

      const result = createApiKeySchema.safeParse(validKey);
      expect(result.success).toBe(true);
    });

    it('should reject empty API key name', () => {
      const invalidKey = {
        name: '',
      };

      const result = createApiKeySchema.safeParse(invalidKey);
      expect(result.success).toBe(false);
    });

    it('should sanitize XSS in API key name', () => {
      const xssKey = {
        name: '<script>alert("xss")</script>MyKey',
      };

      const result = createApiKeySchema.safeParse(xssKey);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).not.toContain('<script>');
      }
    });

    it('should enforce max length', () => {
      const longName = {
        name: 'a'.repeat(150),
      };

      const result = createApiKeySchema.safeParse(longName);
      expect(result.success).toBe(false);
    });
  });

  describe('validateFormData utility', () => {
    it('should return success with valid data', () => {
      const validProfile = {
        name: 'John Doe',
        timezone: 'America/New_York',
        language: 'en',
      };

      const result = validateFormData(profileSettingsSchema, validProfile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });

    it('should return errors for invalid data', () => {
      const invalidProfile = {
        name: '',
        timezone: 'Invalid',
        language: 'xx',
      };

      const result = validateFormData(profileSettingsSchema, invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have errors
        expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      }
    });
  });
});
