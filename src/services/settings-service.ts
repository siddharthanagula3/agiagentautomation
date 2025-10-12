/**
 * Settings Service
 * Manages user settings and preferences
 */

import { supabase } from '@/lib/supabase-client';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
  plan?: string;
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  notifications?: boolean;
  emailNotifications?: boolean;
  language?: string;
  timezone?: string;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used?: string;
}

class SettingsService {
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar: user.user_metadata?.avatar_url,
        role: user.user_metadata?.role || 'user',
        plan: user.user_metadata?.plan || 'free',
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async updateProfile(
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.name,
          avatar_url: updates.avatar,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getUserSettings(): Promise<UserSettings> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user settings:', error);
        return {};
      }

      return {
        theme: data.theme,
        notifications: data.push_notifications,
        emailNotifications: data.email_notifications,
        language: data.language || 'en',
        timezone: data.timezone || 'America/New_York',
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      return {};
    }
  }

  async updateSettings(
    settings: UserSettings
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase.from('user_settings').upsert({
        id: user.id,
        theme: settings.theme,
        push_notifications: settings.notifications,
        email_notifications: settings.emailNotifications,
        language: settings.language,
        timezone: settings.timezone,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error updating user settings:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating user settings:', error);
      return { success: false, error: error.message };
    }
  }

  // Alias methods for compatibility
  async getProfile(): Promise<{ data: UserProfile | null; error?: string }> {
    try {
      const profile = await this.getUserProfile();
      return { data: profile };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async getSettings(): Promise<{ data: UserSettings; error?: string }> {
    try {
      const settings = await this.getUserSettings();
      return { data: settings };
    } catch (error: any) {
      return { data: {}, error: error.message };
    }
  }

  async getAPIKeys(): Promise<{ data: APIKey[]; error?: string }> {
    try {
      // For now, return empty array - API keys are stored in localStorage
      return { data: [] };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  }

  async uploadAvatar(file: File): Promise<{ data: string; error?: string }> {
    try {
      // For now, return a placeholder - implement file upload to Supabase Storage
      return { data: URL.createObjectURL(file), error: undefined };
    } catch (error: any) {
      return { data: '', error: error.message };
    }
  }

  async changePassword(newPassword: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async createAPIKey(
    name: string
  ): Promise<{ data: APIKey; error?: string; fullKey?: string }> {
    try {
      // Generate a random API key
      const key =
        'ak_' +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      const apiKey: APIKey = {
        id: Math.random().toString(36).substring(2, 15),
        name,
        key: key.substring(0, 8) + '...',
        created_at: new Date().toISOString(),
      };

      return { data: apiKey, fullKey: key };
    } catch (error: any) {
      return { data: {} as APIKey, error: error.message };
    }
  }

  async deleteAPIKey(keyId: string): Promise<{ error?: string }> {
    try {
      // For now, just return success - implement actual deletion
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async enable2FA(): Promise<{ error?: string }> {
    try {
      // For now, just return success - implement 2FA
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async disable2FA(): Promise<{ error?: string }> {
    try {
      // For now, just return success - implement 2FA
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }
}

const settingsService = new SettingsService();
export default settingsService;
export { settingsService };
