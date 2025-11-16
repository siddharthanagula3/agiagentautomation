/**
 * Settings Service
 * Manages user settings and preferences with full Supabase integration
 */

import { supabase } from '@shared/lib/supabase-client';
import { authService } from '@core/auth/authentication-manager';

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

  // Security
  two_factor_enabled?: boolean;
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
}

export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
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
        .single();

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
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
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

  /**
   * Enable 2FA
   */
  async enable2FA(): Promise<{
    error?: string;
    secret?: string;
    qrCode?: string;
  }> {
    try {
      // TODO: Implement TOTP 2FA
      // For now, just update the settings
      const { error } = await this.updateSettings({ two_factor_enabled: true });
      return { error };
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(): Promise<{ error?: string }> {
    try {
      const { error } = await this.updateSettings({
        two_factor_enabled: false,
      });
      return { error };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
