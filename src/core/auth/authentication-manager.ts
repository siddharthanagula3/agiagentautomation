/**
 * Authentication Service
 * Wraps Supabase auth methods for the auth store
 */

import { supabase } from '@shared/lib/supabase-client';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
  plan?: string;
  user_metadata?: Record<string, unknown>;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  company?: string;
  phone?: string;
  location?: string;
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
        setTimeout(
          () => reject(new Error('Auth timeout - possible invalid token')),
          3000
        )
      );

      const authPromise = supabase.auth.getUser();
      const {
        data: { user },
        error,
      } = await Promise.race([authPromise, timeoutPromise]);

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
    } catch (error) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      // On timeout or error, clear invalid auth data
      if (message?.includes('timeout')) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          // Ignore signout errors
        }
      }
      return { user: null, error: message };
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
        name:
          data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        avatar: data.user.user_metadata?.avatar_url,
        role: data.user.user_metadata?.role || 'user',
        plan: data.user.user_metadata?.plan || 'free',
        user_metadata: data.user.user_metadata,
      };

      return { user: authUser, error: null };
    } catch (error) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { user: null, error: message };
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
            company: registerData.company,
            phone: registerData.phone,
            location: registerData.location,
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
    } catch (error) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { user: null, error: message };
    }
  }

  async logout(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { error: message };
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
    } catch (error) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { error: message };
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
    } catch (error) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { error: message };
    }
  }

  async updateProfile(updates: Partial<AuthUser>): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.name,
          name: updates.name,
          avatar_url: updates.avatar,
          ...updates.user_metadata,
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Profile update failed' };
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        name:
          data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        avatar: data.user.user_metadata?.avatar_url,
        role: data.user.user_metadata?.role || 'user',
        plan: data.user.user_metadata?.plan || 'free',
        user_metadata: data.user.user_metadata,
      };

      return { user: authUser, error: null };
    } catch (error) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { user: null, error: message };
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ error: string | null }> {
    try {
      // First verify current password by attempting to sign in
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        return { error: 'No user found' };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        return { error: 'Current password is incorrect' };
      }

      // If current password is correct, update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      // Updated: Jan 15th 2026 - Fixed password change doesn't invalidate old sessions
      // Invalidate all existing sessions for security
      await supabase.auth.signOut({ scope: 'global' });

      return { error: null };
    } catch (error) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { error: message };
    }
  }
}

export const authService = new AuthService();
export default authService;
