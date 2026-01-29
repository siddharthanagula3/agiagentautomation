/**
 * Settings Service
 * Manages user settings and preferences with full Supabase integration
 * Includes TOTP 2FA authentication support
 */

import { supabase } from '@shared/lib/supabase-client';
import { authService } from '@core/auth/authentication-manager';

// =============================================================================
// TOTP 2FA Configuration
// =============================================================================

/**
 * TOTP Configuration Constants
 * RFC 6238 compliant TOTP parameters
 */
const TOTP_CONFIG = {
  /** Issuer name shown in authenticator apps */
  ISSUER: 'AGI Platform',
  /** Algorithm for HMAC (SHA1 is most compatible with authenticator apps) */
  ALGORITHM: 'SHA1',
  /** Number of digits in TOTP code */
  DIGITS: 6,
  /** Time step in seconds (standard is 30) */
  PERIOD: 30,
  /** Number of backup codes to generate */
  BACKUP_CODE_COUNT: 8,
  /** Length of backup codes */
  BACKUP_CODE_LENGTH: 8,
  /** Secret key length in bytes (20 bytes = 160 bits, recommended) */
  SECRET_LENGTH: 20,
} as const;

/**
 * Base32 alphabet for encoding TOTP secrets
 * RFC 4648 compliant
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// =============================================================================
// TOTP Types
// =============================================================================

export interface TOTPSetupResult {
  /** Base32 encoded secret for manual entry */
  secret: string;
  /** otpauth:// URL for QR code generation */
  otpauthUrl: string;
  /** Backup codes for recovery */
  backupCodes: string[];
}

export interface TwoFactorStatus {
  /** Whether 2FA is currently enabled */
  enabled: boolean;
  /** When 2FA was enabled */
  enabledAt?: string;
  /** Number of backup codes remaining */
  backupCodesRemaining?: number;
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  role?: string;
  plan?: string;
}

export interface UserSettings {
  // Notification preferences
  email_notifications?: boolean;
  push_notifications?: boolean;
  workflow_alerts?: boolean;
  employee_updates?: boolean;
  system_maintenance?: boolean;
  marketing_emails?: boolean;
  weekly_reports?: boolean;
  instant_alerts?: boolean;

  // Security - 2FA
  two_factor_enabled?: boolean;
  totp_secret?: string;
  totp_enabled_at?: string;
  backup_codes?: string[];
  backup_codes_generated_at?: string;
  backup_codes_used?: number;
  session_timeout?: number;

  // System preferences
  theme?: 'light' | 'dark' | 'auto';
  auto_save?: boolean;
  debug_mode?: boolean;
  analytics_enabled?: boolean;

  // Advanced settings
  cache_size?: string;
  backup_frequency?: string;
  retention_period?: number;
  max_concurrent_jobs?: number;

  // AI preferences
  default_ai_provider?: 'openai' | 'anthropic' | 'google' | 'perplexity';
  default_ai_model?: string;
  prefer_streaming?: boolean;
  ai_temperature?: number;
  ai_max_tokens?: number;
}

export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
}

// =============================================================================
// TOTP Utility Functions
// =============================================================================

/**
 * Encode a Uint8Array to Base32 string
 * RFC 4648 compliant encoding
 */
function encodeBase32(buffer: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Decode a Base32 string to Uint8Array
 * RFC 4648 compliant decoding
 */
function decodeBase32(input: string): Uint8Array {
  // Remove any spaces and convert to uppercase
  const cleanInput = input.replace(/\s/g, '').toUpperCase();

  const output: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleanInput.length; i++) {
    const char = cleanInput[i];
    const index = BASE32_ALPHABET.indexOf(char);

    if (index === -1) {
      // Skip padding characters
      if (char === '=') continue;
      throw new Error(`Invalid Base32 character: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

/**
 * Generate a cryptographically secure random secret for TOTP
 * Returns a Base32 encoded string suitable for authenticator apps
 */
function generateTOTPSecret(): string {
  const buffer = new Uint8Array(TOTP_CONFIG.SECRET_LENGTH);
  crypto.getRandomValues(buffer);
  return encodeBase32(buffer);
}

/**
 * Generate an otpauth:// URL for QR code generation
 * Compatible with Google Authenticator, Authy, 1Password, etc.
 */
function generateOTPAuthURL(
  secret: string,
  accountName: string,
  issuer: string = TOTP_CONFIG.ISSUER
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);

  return (
    `otpauth://totp/${encodedIssuer}:${encodedAccount}` +
    `?secret=${secret}` +
    `&issuer=${encodedIssuer}` +
    `&algorithm=${TOTP_CONFIG.ALGORITHM}` +
    `&digits=${TOTP_CONFIG.DIGITS}` +
    `&period=${TOTP_CONFIG.PERIOD}`
  );
}

/**
 * Generate HMAC-SHA1 hash using Web Crypto API
 */
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

/**
 * Generate a TOTP code for the given secret and time
 * RFC 6238 compliant implementation
 */
async function generateTOTPCode(
  secret: string,
  timestamp: number = Date.now()
): Promise<string> {
  // Calculate time counter (number of time steps since epoch)
  const timeStep = Math.floor(timestamp / 1000 / TOTP_CONFIG.PERIOD);

  // Convert counter to 8-byte big-endian buffer
  const timeBuffer = new Uint8Array(8);
  let counter = timeStep;
  for (let i = 7; i >= 0; i--) {
    timeBuffer[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }

  // Decode the Base32 secret
  const keyBuffer = decodeBase32(secret);

  // Calculate HMAC-SHA1
  const hmac = await hmacSha1(keyBuffer, timeBuffer);

  // Dynamic truncation (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  // Generate digits
  const otp = code % Math.pow(10, TOTP_CONFIG.DIGITS);
  return otp.toString().padStart(TOTP_CONFIG.DIGITS, '0');
}

/**
 * Verify a TOTP code with time drift tolerance
 * Allows codes from previous and next time windows for clock skew
 */
async function verifyTOTPCode(
  secret: string,
  code: string,
  timestamp: number = Date.now()
): Promise<boolean> {
  // Normalize the input code
  const normalizedCode = code.replace(/\s/g, '').trim();

  if (normalizedCode.length !== TOTP_CONFIG.DIGITS) {
    return false;
  }

  // Check current, previous, and next time windows (allows for clock drift)
  const timeOffsets = [0, -1, 1]; // Current, previous, next

  for (const offset of timeOffsets) {
    const adjustedTime = timestamp + offset * TOTP_CONFIG.PERIOD * 1000;
    const expectedCode = await generateTOTPCode(secret, adjustedTime);

    // Constant-time comparison to prevent timing attacks
    if (constantTimeCompare(normalizedCode, expectedCode)) {
      return true;
    }
  }

  return false;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate secure random backup codes
 * Returns array of human-readable codes in format XXXX-XXXX
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  const charset = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I, O to avoid confusion

  for (let i = 0; i < TOTP_CONFIG.BACKUP_CODE_COUNT; i++) {
    const buffer = new Uint8Array(TOTP_CONFIG.BACKUP_CODE_LENGTH);
    crypto.getRandomValues(buffer);

    let code = '';
    for (let j = 0; j < buffer.length; j++) {
      code += charset[buffer[j] % charset.length];
      // Add dash in the middle for readability
      if (j === 3) code += '-';
    }

    codes.push(code);
  }

  return codes;
}

/**
 * Hash a backup code for secure storage
 * Uses SHA-256 for hashing
 */
async function hashBackupCode(code: string): Promise<string> {
  // Normalize the code (remove dashes and spaces, uppercase)
  const normalizedCode = code.replace(/[-\s]/g, '').toUpperCase();

  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedCode);
  const hash = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify a backup code against stored hashes
 * Returns the index of the matched code or -1 if not found
 */
async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<number> {
  const inputHash = await hashBackupCode(code);

  for (let i = 0; i < hashedCodes.length; i++) {
    if (constantTimeCompare(inputHash, hashedCodes[i])) {
      return i;
    }
  }

  return -1;
}

class SettingsService {
  /**
   * Get user profile from database
   */
  async getProfile(): Promise<{ data: UserProfile | null; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // Fetch profile from user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return { data: null, error: error.message };
      }

      return {
        data: {
          id: user.id,
          email: user.email,
          name: data?.name,
          avatar_url: data?.avatar_url,
          phone: data?.phone,
          bio: data?.bio,
          timezone: data?.timezone || 'America/New_York',
          language: data?.language || 'en',
          role: data?.role,
          plan: data?.plan,
        },
      };
    } catch (error) {
      console.error('Error getting profile:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    profile: Partial<UserProfile>
  ): Promise<{ error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { error } = await supabase.from('user_profiles').upsert({
        id: user.id,
        name: profile.name,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
        bio: profile.bio,
        timezone: profile.timezone,
        language: profile.language,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error updating profile:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user settings from database
   */
  async getSettings(): Promise<{ data: UserSettings; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: {}, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        return { data: {}, error: error.message };
      }

      // Return default values if no settings found
      if (!data) {
        return {
          data: {
            email_notifications: true,
            push_notifications: true,
            workflow_alerts: true,
            employee_updates: true,
            system_maintenance: true,
            marketing_emails: false,
            weekly_reports: true,
            instant_alerts: true,
            two_factor_enabled: false,
            session_timeout: 60,
            theme: 'dark',
            auto_save: true,
            debug_mode: false,
            analytics_enabled: true,
            cache_size: '1GB',
            backup_frequency: 'daily',
            retention_period: 30,
            max_concurrent_jobs: 10,
            default_ai_provider: 'openai',
            default_ai_model: 'gpt-4o',
            prefer_streaming: true,
            ai_temperature: 0.7,
            ai_max_tokens: 4000,
          },
        };
      }

      return { data: data as UserSettings };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        data: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(
    settings: Partial<UserSettings>
  ): Promise<{ error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { error } = await supabase.from('user_settings').upsert({
        id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error updating settings:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Error updating settings:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload avatar to Supabase Storage
   */
  async uploadAvatar(file: File): Promise<{ data: string; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: '', error: 'User not authenticated' };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return { data: '', error: uploadError.message };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profile with new avatar URL
      await this.updateProfile({ avatar_url: publicUrl });

      return { data: publicUrl };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return {
        data: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(newPassword: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Error changing password:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Error changing password:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user API keys
   */
  async getAPIKeys(): Promise<{ data: APIKey[]; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        return { data: [], error: error.message };
      }

      return { data: data as APIKey[] };
    } catch (error) {
      console.error('Error getting API keys:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create new API key
   */
  async createAPIKey(
    name: string
  ): Promise<{ data: APIKey | null; error?: string; fullKey?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // Generate secure API key
      const fullKey = `ak_${this.generateSecureToken(32)}`;
      const keyPrefix = fullKey.substring(0, 12);

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name,
          key_prefix: keyPrefix,
          key_hash: await this.hashKey(fullKey),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating API key:', error);
        return { data: null, error: error.message };
      }

      return { data: data as APIKey, fullKey };
    } catch (error) {
      console.error('Error creating API key:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete API key
   */
  async deleteAPIKey(keyId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) {
        console.error('Error deleting API key:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Error deleting API key:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ===========================================================================
  // Two-Factor Authentication (TOTP) Methods
  // ===========================================================================

  /**
   * Get the current 2FA status for the user
   */
  async get2FAStatus(): Promise<{ data: TwoFactorStatus; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return {
          data: { enabled: false },
          error: 'User not authenticated',
        };
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('two_factor_enabled, totp_enabled_at, backup_codes, backup_codes_used')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching 2FA status:', error);
        return { data: { enabled: false }, error: error.message };
      }

      const backupCodesRemaining = data?.backup_codes
        ? data.backup_codes.length - (data.backup_codes_used || 0)
        : 0;

      return {
        data: {
          enabled: data?.two_factor_enabled || false,
          enabledAt: data?.totp_enabled_at,
          backupCodesRemaining,
        },
      };
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      return {
        data: { enabled: false },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Initialize 2FA setup - generates secret and backup codes
   * The user must verify a code before 2FA is fully enabled
   *
   * Returns:
   * - secret: Base32 encoded secret for manual entry
   * - otpauthUrl: URL for QR code generation (use a QR library to render)
   * - backupCodes: Recovery codes (SHOW ONLY ONCE - they are hashed before storage)
   */
  async setup2FA(): Promise<{
    data?: TOTPSetupResult;
    error?: string;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      // Check if 2FA is already enabled
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('two_factor_enabled')
        .eq('id', user.id)
        .maybeSingle();

      if (existingSettings?.two_factor_enabled) {
        return { error: 'Two-factor authentication is already enabled' };
      }

      // Generate new TOTP secret
      const secret = generateTOTPSecret();

      // Generate otpauth URL for QR code
      const accountName = user.email || user.id;
      const otpauthUrl = generateOTPAuthURL(secret, accountName);

      // Generate backup codes
      const backupCodes = generateBackupCodes();

      // Hash backup codes for storage
      const hashedBackupCodes = await Promise.all(
        backupCodes.map((code) => hashBackupCode(code))
      );

      // Store the secret and hashed backup codes (not yet enabled)
      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          totp_secret: secret,
          backup_codes: hashedBackupCodes,
          backup_codes_generated_at: new Date().toISOString(),
          backup_codes_used: 0,
          // Note: two_factor_enabled stays false until verify2FA is called
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Error storing 2FA setup:', updateError);
        return { error: updateError.message };
      }

      return {
        data: {
          secret,
          otpauthUrl,
          backupCodes, // Plain text - show to user only once!
        },
      };
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify a TOTP code and complete 2FA enablement
   * Must be called after setup2FA with a valid code from the authenticator app
   */
  async verify2FA(code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Fetch the stored secret
      const { data: settings, error: fetchError } = await supabase
        .from('user_settings')
        .select('totp_secret, two_factor_enabled')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching 2FA settings:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (!settings?.totp_secret) {
        return {
          success: false,
          error: 'No 2FA setup found. Please call setup2FA first.',
        };
      }

      if (settings.two_factor_enabled) {
        return {
          success: false,
          error: 'Two-factor authentication is already enabled',
        };
      }

      // Verify the provided code
      const isValid = await verifyTOTPCode(settings.totp_secret, code);

      if (!isValid) {
        return {
          success: false,
          error: 'Invalid verification code. Please try again.',
        };
      }

      // Enable 2FA
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          two_factor_enabled: true,
          totp_enabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error enabling 2FA:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate a TOTP code (for login verification)
   * Also accepts backup codes for recovery
   */
  async validateTOTPCode(code: string): Promise<{
    valid: boolean;
    usedBackupCode?: boolean;
    error?: string;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { valid: false, error: 'User not authenticated' };
      }

      const { data: settings, error: fetchError } = await supabase
        .from('user_settings')
        .select('totp_secret, two_factor_enabled, backup_codes, backup_codes_used')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching 2FA settings:', fetchError);
        return { valid: false, error: fetchError.message };
      }

      if (!settings?.two_factor_enabled || !settings.totp_secret) {
        return { valid: false, error: 'Two-factor authentication is not enabled' };
      }

      // First, try to verify as a TOTP code
      const isTOTPValid = await verifyTOTPCode(settings.totp_secret, code);

      if (isTOTPValid) {
        return { valid: true, usedBackupCode: false };
      }

      // If TOTP fails, try backup codes
      if (settings.backup_codes && settings.backup_codes.length > 0) {
        const backupCodeIndex = await verifyBackupCode(code, settings.backup_codes);

        if (backupCodeIndex !== -1) {
          // Mark the backup code as used by incrementing the counter
          // (We don't remove codes from array to maintain audit trail)
          const { error: updateError } = await supabase
            .from('user_settings')
            .update({
              backup_codes_used: (settings.backup_codes_used || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating backup code usage:', updateError);
          }

          return { valid: true, usedBackupCode: true };
        }
      }

      return { valid: false, error: 'Invalid code' };
    } catch (error) {
      console.error('Error validating TOTP code:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Disable 2FA (requires valid TOTP code or backup code for security)
   */
  async disable2FA(code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Verify the code before disabling
      const { valid, error: validationError } = await this.validateTOTPCode(code);

      if (!valid) {
        return {
          success: false,
          error: validationError || 'Invalid verification code',
        };
      }

      // Disable 2FA and clear sensitive data
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          two_factor_enabled: false,
          totp_secret: null,
          totp_enabled_at: null,
          backup_codes: null,
          backup_codes_generated_at: null,
          backup_codes_used: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error disabling 2FA:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Regenerate backup codes (requires valid TOTP code)
   * Returns new backup codes - show only once!
   */
  async regenerateBackupCodes(totpCode: string): Promise<{
    backupCodes?: string[];
    error?: string;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      // Verify TOTP code first
      const { data: settings, error: fetchError } = await supabase
        .from('user_settings')
        .select('totp_secret, two_factor_enabled')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) {
        return { error: fetchError.message };
      }

      if (!settings?.two_factor_enabled || !settings.totp_secret) {
        return { error: 'Two-factor authentication is not enabled' };
      }

      const isValid = await verifyTOTPCode(settings.totp_secret, totpCode);

      if (!isValid) {
        return { error: 'Invalid verification code' };
      }

      // Generate new backup codes
      const backupCodes = generateBackupCodes();
      const hashedBackupCodes = await Promise.all(
        backupCodes.map((code) => hashBackupCode(code))
      );

      // Store new hashed backup codes
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          backup_codes: hashedBackupCodes,
          backup_codes_generated_at: new Date().toISOString(),
          backup_codes_used: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        return { error: updateError.message };
      }

      return { backupCodes };
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * @deprecated Use setup2FA() and verify2FA() instead
   * Legacy method for backwards compatibility - now initiates full 2FA setup
   */
  async enable2FA(): Promise<{
    error?: string;
    secret?: string;
    otpauthUrl?: string;
    backupCodes?: string[];
  }> {
    const result = await this.setup2FA();
    if (result.error) {
      return { error: result.error };
    }
    return {
      secret: result.data?.secret,
      otpauthUrl: result.data?.otpauthUrl,
      backupCodes: result.data?.backupCodes,
    };
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(length: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length];
    }
    return result;
  }

  /**
   * Hash API key for storage
   */
  private async hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

const settingsService = new SettingsService();
export default settingsService;
export { settingsService };

// Export TOTP utility functions for use in authentication flows
export {
  generateTOTPSecret,
  generateOTPAuthURL,
  generateTOTPCode,
  verifyTOTPCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  TOTP_CONFIG,
};

// Export types
export type { TOTPSetupResult, TwoFactorStatus };
