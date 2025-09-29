/**
 * Settings Service - Handles all settings-related operations with Supabase
 */

import { supabase } from '@/integrations/supabase/client';

// Types
export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  // Notifications
  email_notifications: boolean;
  push_notifications: boolean;
  workflow_alerts: boolean;
  employee_updates: boolean;
  system_maintenance: boolean;
  marketing_emails: boolean;
  weekly_reports: boolean;
  instant_alerts: boolean;
  // Security
  two_factor_enabled: boolean;
  session_timeout: number;
  // System
  theme: 'dark' | 'light' | 'auto';
  auto_save: boolean;
  debug_mode: boolean;
  analytics_enabled: boolean;
  // Advanced
  cache_size: string;
  backup_frequency: string;
  retention_period: number;
  max_concurrent_jobs: number;
  created_at: string;
  updated_at: string;
}

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  last_used_at?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  last_activity: string;
  created_at: string;
  expires_at?: string;
}

// Profile Functions
export const settingsService = {
  // Get user profile
  async getProfile(): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const newProfile: Partial<UserProfile> = {
          id: user.id,
          name: user.user_metadata?.name || user.email || 'User',
          timezone: 'America/New_York',
          language: 'en'
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        return { data: createdProfile, error: createError };
      }

      return { data, error };
    } catch (error) {
      console.error('Error getting profile:', error);
      return { data: null, error };
    }
  },

  // Update user profile
  async updateProfile(updates: Partial<UserProfile>): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  },

  // Upload avatar
  async uploadAvatar(file: File): Promise<{ data: string | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);

      if (uploadError) {
        return { data: null, error: uploadError };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await this.updateProfile({ avatar_url: publicUrl });

      return { data: publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return { data: null, error };
    }
  },

  // Settings Functions
  async getSettings(): Promise<{ data: UserSettings | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Settings don't exist, create default
        const defaultSettings: Partial<UserSettings> = {
          id: user.id,
          email_notifications: true,
          push_notifications: true,
          workflow_alerts: true,
          employee_updates: false,
          system_maintenance: true,
          marketing_emails: false,
          weekly_reports: true,
          instant_alerts: true,
          two_factor_enabled: false,
          session_timeout: 30,
          theme: 'dark',
          auto_save: true,
          debug_mode: false,
          analytics_enabled: true,
          cache_size: '1GB',
          backup_frequency: 'daily',
          retention_period: 30,
          max_concurrent_jobs: 10
        };

        const { data: createdSettings, error: createError } = await supabase
          .from('user_settings')
          .insert(defaultSettings)
          .select()
          .single();

        return { data: createdSettings, error: createError };
      }

      return { data, error };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { data: null, error };
    }
  },

  async updateSettings(updates: Partial<UserSettings>): Promise<{ data: UserSettings | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { data: null, error };
    }
  },

  // API Keys Functions
  async getAPIKeys(): Promise<{ data: APIKey[]; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('Error getting API keys:', error);
      return { data: [], error };
    }
  },

  async createAPIKey(name: string): Promise<{ data: APIKey | null; error: any; fullKey?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Generate a random API key
      const fullKey = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const keyPrefix = fullKey.substring(0, 12);
      
      // In production, you should hash the key before storing
      const keyHash = fullKey; // TODO: Hash this in production

      const newKey = {
        user_id: user.id,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        is_active: true
      };

      const { data, error } = await supabase
        .from('user_api_keys')
        .insert(newKey)
        .select()
        .single();

      return { data, error, fullKey };
    } catch (error) {
      console.error('Error creating API key:', error);
      return { data: null, error };
    }
  },

  async deleteAPIKey(keyId: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'Not authenticated' };
      }

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('user_api_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .eq('user_id', user.id);

      return { error };
    } catch (error) {
      console.error('Error deleting API key:', error);
      return { error };
    }
  },

  // Session Functions
  async getSessions(): Promise<{ data: UserSession[]; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('Error getting sessions:', error);
      return { data: [], error };
    }
  },

  async deleteSession(sessionId: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      return { error };
    } catch (error) {
      console.error('Error deleting session:', error);
      return { error };
    }
  },

  // Password Functions
  async changePassword(newPassword: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      return { error };
    } catch (error) {
      console.error('Error changing password:', error);
      return { error };
    }
  },

  // 2FA Functions (Note: Supabase doesn't have built-in 2FA yet, this is a placeholder)
  async enable2FA(): Promise<{ data: any; error: any }> {
    // This would integrate with Supabase's 2FA once available
    // For now, just update the setting
    try {
      const result = await this.updateSettings({ two_factor_enabled: true });
      return result;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return { data: null, error };
    }
  },

  async disable2FA(): Promise<{ data: any; error: any }> {
    try {
      const result = await this.updateSettings({ two_factor_enabled: false });
      return result;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return { data: null, error };
    }
  },
};

export default settingsService;
