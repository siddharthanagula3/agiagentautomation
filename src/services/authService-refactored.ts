/**
 * Refactored authentication service with cleaner separation of concerns
 * Handles Supabase authentication with demo mode fallback
 */

import { supabase } from '../integrations/supabase/client';
import type { AuthUser } from '../types/auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
  location?: string;
}

export interface AuthResult {
  user: AuthUser | null;
  error: string | null;
}

class AuthService {
  private isDemoMode(): boolean {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return !supabaseUrl || 
           !supabaseKey || 
           supabaseUrl.includes('your_supabase_url_here') || 
           supabaseKey.includes('your_supabase_anon_key_here');
  }

  private createDemoUser(email: string): AuthUser {
    return {
      id: 'demo-user-id',
      email,
      name: 'Demo User',
      role: 'user',
      avatar_url: '',
      created_at: new Date().toISOString(),
      preferences: {},
      phone: '',
      location: ''
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Demo mode fallback
      if (this.isDemoMode()) {
        if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
          return {
            user: this.createDemoUser(credentials.email),
            error: null
          };
        } else {
          return {
            user: null,
            error: 'Demo mode active. Use demo@example.com / demo123 to login, or configure Supabase for full functionality.'
          };
        }
      }

      // Real Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Login failed' };
      }

      // Get or create user profile
      const { user: profileUser, error: profileError } = await this.getCurrentUser();
      
      if (profileError) {
        // If profile doesn't exist, create it
        const newUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || data.user.email || 'User',
          role: 'user',
          avatar_url: data.user.user_metadata?.avatar_url || '',
          created_at: data.user.created_at || new Date().toISOString(),
          preferences: data.user.user_metadata?.preferences || {},
          phone: data.user.user_metadata?.phone || '',
          location: data.user.user_metadata?.location || ''
        };

        return { user: newUser, error: null };
      }

      return { user: profileUser, error: null };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async register(userData: RegisterData): Promise<AuthResult> {
    try {
      // Demo mode fallback
      if (this.isDemoMode()) {
        return {
          user: this.createDemoUser(userData.email),
          error: null
        };
      }

      // Real Supabase registration
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            company: userData.company,
            phone: userData.phone,
            location: userData.location,
          }
        }
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Registration failed' };
      }

      // Create user profile
      const newUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: userData.name,
        role: 'user',
        avatar_url: '',
        created_at: new Date().toISOString(),
        preferences: {},
        phone: userData.phone || '',
        location: userData.location || ''
      };

      return { user: newUser, error: null };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async getCurrentUser(): Promise<AuthResult> {
    try {
      // Demo mode fallback
      if (this.isDemoMode()) {
        return {
          user: this.createDemoUser('demo@example.com'),
          error: null
        };
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return { user: null, error: error.message };
      }

      if (!user) {
        return { user: null, error: 'No active session' };
      }

      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // If profile doesn't exist, create a basic one
        const basicUser: AuthUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || 'User',
          role: 'user',
          avatar_url: user.user_metadata?.avatar_url || '',
          created_at: user.created_at || new Date().toISOString(),
          preferences: user.user_metadata?.preferences || {},
          phone: user.user_metadata?.phone || '',
          location: user.user_metadata?.location || ''
        };

        return { user: basicUser, error: null };
      }

      return { user: profile, error: null };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to get user'
      };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isDemoMode()) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }

  async updateProfile(updates: Partial<AuthUser>): Promise<AuthResult> {
    try {
      // Demo mode fallback
      if (this.isDemoMode()) {
        return {
          user: this.createDemoUser('demo@example.com'),
          error: null
        };
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { user: null, error: 'No active session' };
      }

      // Update user profile in database
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data, error: null };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Profile update failed'
      };
    }
  }
}

export const authService = new AuthService();
