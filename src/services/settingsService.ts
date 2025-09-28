import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type Settings = Database['public']['Tables']['settings']['Row'];

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    job_completed: boolean;
    job_failed: boolean;
    billing: boolean;
    security: boolean;
  };
  privacy: {
    profile_public: boolean;
    show_email: boolean;
    show_phone: boolean;
    show_location: boolean;
  };
  preferences: {
    default_job_type: string;
    auto_assign: boolean;
    max_concurrent_jobs: number;
    preferred_agents: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface SettingsUpdate {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  notifications?: Partial<UserSettings['notifications']>;
  privacy?: Partial<UserSettings['privacy']>;
  preferences?: Partial<UserSettings['preferences']>;
}

class SettingsService {
  async getSettings(userId: string): Promise<{ data: UserSettings | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, return default settings
          return { 
            data: this.getDefaultSettings(userId), 
            error: null 
          };
        }
        console.error('SettingsService: Error fetching settings:', error);
        return { data: null, error: error.message };
      }

      return { data: data as UserSettings, error: null };
    } catch (error) {
      console.error('SettingsService: Unexpected error:', error);
      return { data: null, error: 'Failed to fetch settings' };
    }
  }

  async updateSettings(userId: string, updates: SettingsUpdate): Promise<{ data: UserSettings | null; error: string | null }> {
    try {
      // First, get current settings
      const { data: currentSettings, error: fetchError } = await this.getSettings(userId);
      
      if (fetchError) {
        return { data: null, error: fetchError };
      }

      if (!currentSettings) {
        // Create new settings if none exist
        return await this.createSettings(userId, updates);
      }

      // Merge updates with current settings
      const mergedSettings = {
        ...currentSettings,
        ...updates,
        notifications: { ...currentSettings.notifications, ...updates.notifications },
        privacy: { ...currentSettings.privacy, ...updates.privacy },
        preferences: { ...currentSettings.preferences, ...updates.preferences },
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('settings')
        .update(mergedSettings)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('SettingsService: Error updating settings:', error);
        return { data: null, error: error.message };
      }

      return { data: data as UserSettings, error: null };
    } catch (error) {
      console.error('SettingsService: Unexpected error:', error);
      return { data: null, error: 'Failed to update settings' };
    }
  }

  async createSettings(userId: string, settings: SettingsUpdate = {}): Promise<{ data: UserSettings | null; error: string | null }> {
    try {
      const defaultSettings = this.getDefaultSettings(userId);
      const newSettings = {
        ...defaultSettings,
        ...settings,
        notifications: { ...defaultSettings.notifications, ...settings.notifications },
        privacy: { ...defaultSettings.privacy, ...settings.privacy },
        preferences: { ...defaultSettings.preferences, ...settings.preferences }
      };

      const { data, error } = await supabase
        .from('settings')
        .insert(newSettings)
        .select()
        .single();

      if (error) {
        console.error('SettingsService: Error creating settings:', error);
        return { data: null, error: error.message };
      }

      return { data: data as UserSettings, error: null };
    } catch (error) {
      console.error('SettingsService: Unexpected error:', error);
      return { data: null, error: 'Failed to create settings' };
    }
  }

  private getDefaultSettings(userId: string): UserSettings {
    return {
      id: '',
      user_id: userId,
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        sms: false,
        job_completed: true,
        job_failed: true,
        billing: true,
        security: true
      },
      privacy: {
        profile_public: false,
        show_email: false,
        show_phone: false,
        show_location: false
      },
      preferences: {
        default_job_type: 'general',
        auto_assign: false,
        max_concurrent_jobs: 5,
        preferred_agents: []
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async resetToDefaults(userId: string): Promise<{ data: UserSettings | null; error: string | null }> {
    try {
      const defaultSettings = this.getDefaultSettings(userId);
      
      const { data, error } = await supabase
        .from('settings')
        .upsert(defaultSettings)
        .select()
        .single();

      if (error) {
        console.error('SettingsService: Error resetting settings:', error);
        return { data: null, error: error.message };
      }

      return { data: data as UserSettings, error: null };
    } catch (error) {
      console.error('SettingsService: Unexpected error:', error);
      return { data: null, error: 'Failed to reset settings' };
    }
  }
}

export const settingsService = new SettingsService();
