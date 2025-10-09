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
      const { data: { user } } = await supabase.auth.getUser();
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

  async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
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
      const settings = localStorage.getItem('user_settings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      return {};
    }
  }

  async updateSettings(settings: UserSettings): Promise<{ success: boolean }> {
    try {
      localStorage.setItem('user_settings', JSON.stringify(settings));
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }
}

const settingsService = new SettingsService();
export default settingsService;
export { settingsService };

