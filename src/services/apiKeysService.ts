import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type ApiKey = Database['public']['Tables']['api_keys']['Row'];

export interface ApiKeyData {
  id: string;
  user_id: string;
  name: string;
  key: string;
  permissions: string[];
  last_used?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyStats {
  total: number;
  active: number;
  expired: number;
  unused: number;
  totalUsage: number;
}

export interface ApiKeyUsage {
  key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time: number;
  created_at: string;
}

class ApiKeysService {
  async getApiKeys(userId: string): Promise<{ data: ApiKeyData[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('ApiKeysService: Error fetching API keys:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('ApiKeysService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch API keys' };
    }
  }

  async getApiKeyStats(userId: string): Promise<{ data: ApiKeyStats; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('is_active, expires_at, last_used')
        .eq('user_id', userId);

      if (error) {
        console.error('ApiKeysService: Error fetching stats:', error);
        return { 
          data: { total: 0, active: 0, expired: 0, unused: 0, totalUsage: 0 }, 
          error: error.message 
        };
      }

      const now = new Date();
      const stats: ApiKeyStats = {
        total: data?.length || 0,
        active: data?.filter(k => k.is_active && (!k.expires_at || new Date(k.expires_at) > now)).length || 0,
        expired: data?.filter(k => k.expires_at && new Date(k.expires_at) <= now).length || 0,
        unused: data?.filter(k => !k.last_used).length || 0,
        totalUsage: 0 // This would need to be calculated from usage logs
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('ApiKeysService: Unexpected error:', error);
      return { 
        data: { total: 0, active: 0, expired: 0, unused: 0, totalUsage: 0 }, 
        error: 'Failed to fetch API key stats' 
      };
    }
  }

  async createApiKey(userId: string, name: string, permissions: string[] = ['read']): Promise<{ data: ApiKeyData | null; error: string | null }> {
    try {
      const key = this.generateApiKey();
      
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          name,
          key,
          permissions,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('ApiKeysService: Error creating API key:', error);
        return { data: null, error: error.message };
      }

      return { data: data as ApiKeyData, error: null };
    } catch (error) {
      console.error('ApiKeysService: Unexpected error:', error);
      return { data: null, error: 'Failed to create API key' };
    }
  }

  async updateApiKey(keyId: string, updates: Partial<Pick<ApiKeyData, 'name' | 'permissions' | 'is_active' | 'expires_at'>>): Promise<{ data: ApiKeyData | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId)
        .select()
        .single();

      if (error) {
        console.error('ApiKeysService: Error updating API key:', error);
        return { data: null, error: error.message };
      }

      return { data: data as ApiKeyData, error: null };
    } catch (error) {
      console.error('ApiKeysService: Unexpected error:', error);
      return { data: null, error: 'Failed to update API key' };
    }
  }

  async deleteApiKey(keyId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) {
        console.error('ApiKeysService: Error deleting API key:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('ApiKeysService: Unexpected error:', error);
      return { success: false, error: 'Failed to delete API key' };
    }
  }

  async regenerateApiKey(keyId: string): Promise<{ data: ApiKeyData | null; error: string | null }> {
    try {
      const newKey = this.generateApiKey();
      
      const { data, error } = await supabase
        .from('api_keys')
        .update({
          key: newKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId)
        .select()
        .single();

      if (error) {
        console.error('ApiKeysService: Error regenerating API key:', error);
        return { data: null, error: error.message };
      }

      return { data: data as ApiKeyData, error: null };
    } catch (error) {
      console.error('ApiKeysService: Unexpected error:', error);
      return { data: null, error: 'Failed to regenerate API key' };
    }
  }

  async getApiKeyUsage(keyId: string, limit: number = 100): Promise<{ data: ApiKeyUsage[]; error: string | null }> {
    try {
      // This would typically come from a usage tracking table
      // For now, return empty array as usage tracking isn't implemented yet
      return { data: [], error: null };
    } catch (error) {
      console.error('ApiKeysService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch API key usage' };
    }
  }

  private generateApiKey(): string {
    const prefix = 'ak_';
    const randomPart = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return prefix + randomPart;
  }

  async validateApiKey(key: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('user_id, is_active, expires_at')
        .eq('key', key)
        .single();

      if (error || !data) {
        return { valid: false, error: 'Invalid API key' };
      }

      if (!data.is_active) {
        return { valid: false, error: 'API key is inactive' };
      }

      if (data.expires_at && new Date(data.expires_at) <= new Date()) {
        return { valid: false, error: 'API key has expired' };
      }

      return { valid: true, userId: data.user_id };
    } catch (error) {
      console.error('ApiKeysService: Unexpected error:', error);
      return { valid: false, error: 'Failed to validate API key' };
    }
  }
}

export const apiKeysService = new ApiKeysService();
