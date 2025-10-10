/**
 * Authentication Service
 * Wraps Supabase auth methods for the auth store
 */

import { supabase } from '@/lib/supabase-client';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
  plan?: string;
  user_metadata?: Record<string, any>;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}

class AuthService {
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      // Add timeout to prevent hanging on invalid tokens
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout - possible invalid token')), 3000)
      );

      const authPromise = supabase.auth.getUser();
      const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]);

      if (error) {
        return { user: null, error: error.message };
      }

      if (!user) {
        return { user: null, error: 'No user found' };
      }

      // Transform Supabase user to AuthUser
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar: user.user_metadata?.avatar_url,
        role: user.user_metadata?.role || 'user',
        plan: user.user_metadata?.plan || 'free',
        user_metadata: user.user_metadata,
      };

      return { user: authUser, error: null };
    } catch (error: any) {
      // On timeout or error, clear invalid auth data
      if (error.message?.includes('timeout')) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          // Ignore signout errors
        }
      }
      return { user: null, error: error.message || 'Failed to get user' };
    }
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Login failed' };
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        avatar: data.user.user_metadata?.avatar_url,
        role: data.user.user_metadata?.role || 'user',
        plan: data.user.user_metadata?.plan || 'free',
        user_metadata: data.user.user_metadata,
      };

      return { user: authUser, error: null };
    } catch (error: any) {
      return { user: null, error: error.message || 'Login failed' };
    }
  }

  async register(registerData: RegisterData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.name,
            name: registerData.name,
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Registration failed' };
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: registerData.name,
        role: 'user',
        plan: 'free',
        user_metadata: data.user.user_metadata,
      };

      return { user: authUser, error: null };
    } catch (error: any) {
      return { user: null, error: error.message || 'Registration failed' };
    }
  }

  async logout(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Logout failed' };
    }
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Password reset failed' };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Password update failed' };
    }
  }
}

export const authService = new AuthService();
export default authService;

