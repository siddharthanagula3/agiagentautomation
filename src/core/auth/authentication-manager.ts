/**
 * Authentication Service
 * Wraps Supabase auth methods for the auth store
 *
 * Security features:
 * - Account lockout after failed login attempts (brute force protection)
 * - Security audit logging
 * - Session timeout handling
 */

import { supabase } from '@shared/lib/supabase-client';
import {
  accountLockoutService,
  type LockoutCheckResult,
  type FailedLoginResult,
} from './account-lockout-service';
import { logger } from '@shared/lib/logger';

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
  /** Optional: IP address for security logging */
  ipAddress?: string;
  /** Optional: User agent for security logging */
  userAgent?: string;
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
  /** Lockout information if account is locked */
  lockout?: LockoutCheckResult;
  /** Remaining attempts before lockout (on failed login) */
  attemptsRemaining?: number;
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
      // SECURITY: Check if account is locked before attempting login
      const lockoutCheck = await accountLockoutService.checkLockout(loginData.email);
      if (lockoutCheck.isLocked) {
        logger.auth(`Login blocked - account locked: ${loginData.email}`);
        return {
          user: null,
          error: lockoutCheck.message,
          lockout: lockoutCheck,
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        // SECURITY: Record failed login attempt
        const failedResult = await accountLockoutService.recordFailedLogin(
          loginData.email,
          {
            ipAddress: loginData.ipAddress,
            userAgent: loginData.userAgent,
          }
        );

        logger.auth(`Login failed for ${loginData.email}: ${error.message}`);

        // Return enhanced error with lockout info
        return {
          user: null,
          error: failedResult.isLocked ? failedResult.message : error.message,
          attemptsRemaining: failedResult.attemptsRemaining,
          lockout: failedResult.isLocked
            ? {
                isLocked: true,
                lockedUntil: failedResult.lockedUntil,
                failedAttempts: 0,
                message: failedResult.message,
              }
            : undefined,
        };
      }

      if (!data.user) {
        // SECURITY: Record failed login attempt
        const failedResult = await accountLockoutService.recordFailedLogin(
          loginData.email,
          {
            ipAddress: loginData.ipAddress,
            userAgent: loginData.userAgent,
          }
        );

        return {
          user: null,
          error: failedResult.isLocked ? failedResult.message : 'Login failed',
          attemptsRemaining: failedResult.attemptsRemaining,
        };
      }

      // SECURITY: Record successful login (resets failed attempts)
      await accountLockoutService.recordSuccessfulLogin(loginData.email, {
        userId: data.user.id,
        ipAddress: loginData.ipAddress,
        userAgent: loginData.userAgent,
      });

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

      logger.auth(`Login successful: ${loginData.email}`);
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

      // SECURITY: Check lockout status before password verification
      // This prevents users from using password change as a lockout bypass
      const lockoutCheck = await accountLockoutService.checkLockout(user.email);
      if (lockoutCheck.isLocked) {
        return { error: lockoutCheck.message };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        // SECURITY: Record failed attempt for password verification too
        // This prevents using password change as a way to brute force
        await accountLockoutService.recordFailedLogin(user.email);
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

  /**
   * Check if an account is locked
   */
  async checkAccountLockout(email: string): Promise<LockoutCheckResult> {
    return accountLockoutService.checkLockout(email);
  }

  /**
   * Admin unlock an account
   */
  async adminUnlockAccount(
    email: string,
    adminDetails?: { adminUserId?: string; reason?: string }
  ): Promise<boolean> {
    return accountLockoutService.adminUnlockAccount(email, adminDetails);
  }

  /**
   * Get lockout statistics for admin dashboard
   */
  async getLockoutStats(): Promise<{
    totalLockedAccounts: number;
    totalTrackedAccounts: number;
    recentLockouts: number;
    avgFailedAttempts: number;
  }> {
    return accountLockoutService.getLockoutStats();
  }
}

export const authService = new AuthService();
export default authService;

// Re-export lockout types for convenience
export type { LockoutCheckResult, FailedLoginResult } from './account-lockout-service';
export { accountLockoutService, LOCKOUT_PRESETS } from './account-lockout-service';
