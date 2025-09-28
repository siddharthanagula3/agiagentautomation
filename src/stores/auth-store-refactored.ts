/**
 * Refactored authentication store using separated concerns
 * Combines session, user profile, and auth flow stores
 */

import { useSessionStore } from './session-store';
import { useUserProfileStore } from './user-profile-store';
import { useAuthFlowStore } from './auth-flow-store';
import type { UserProfile } from './user-profile-store';

// Combined auth store interface
export interface AuthStore {
  // Session state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  refreshToken: string | null;
  sessionExpiresAt: Date | null;
  lastLoginAt: Date | null;

  // User data
  user: UserProfile | null;

  // Auth flow state
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  isRefreshing: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile['profile']>) => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  checkSession: () => boolean;
  extendSession: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Custom hook that combines all stores
export const useAuthStore = (): AuthStore => {
  const sessionStore = useSessionStore();
  const userProfileStore = useUserProfileStore();
  const authFlowStore = useAuthFlowStore();

  return {
    // Session state
    isAuthenticated: sessionStore.isAuthenticated,
    isLoading: sessionStore.isLoading,
    error: sessionStore.error,
    token: sessionStore.token,
    refreshToken: sessionStore.refreshToken,
    sessionExpiresAt: sessionStore.sessionExpiresAt,
    lastLoginAt: sessionStore.lastLoginAt,

    // User data
    user: userProfileStore.user,

    // Auth flow state
    isSigningIn: authFlowStore.isSigningIn,
    isSigningUp: authFlowStore.isSigningUp,
    isSigningOut: authFlowStore.isSigningOut,
    isRefreshing: authFlowStore.isRefreshing,

    // Actions
    signIn: async (email: string, password: string) => {
      authFlowStore.setSigningIn(true);
      sessionStore.setError(null);

      try {
        // Simulate API call
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (email === 'demo@example.com' && password === 'password') {
              resolve(null);
            } else {
              reject(new Error('Invalid credentials'));
            }
          }, 1000);
        });

        // Mock user data
        const mockUser: UserProfile = {
          id: '1',
          email,
          name: 'Demo User',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email,
          plan: 'pro',
          role: 'user',
          permissions: ['read', 'write', 'purchase'],
          profile: {
            firstName: 'Demo',
            lastName: 'User',
            company: 'AGI Corp',
            bio: 'AI enthusiast and automation expert',
            timezone: 'UTC',
            preferences: {
              emailNotifications: true,
              pushNotifications: true,
              marketingEmails: false,
            },
          },
          billing: {
            customerId: 'cus_demo123',
            subscriptionId: 'sub_demo123',
            subscriptionStatus: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          usage: {
            tokensUsed: 2500,
            tokensLimit: 10000,
            jobsCompleted: 45,
            employeesPurchased: 3,
          },
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        };

        const token = 'mock-jwt-token-' + Date.now();
        const refreshToken = 'mock-refresh-token-' + Date.now();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        sessionStore.setTokens(token, refreshToken, expiresAt);
        sessionStore.updateLastLogin();
        userProfileStore.setUser(mockUser);
        authFlowStore.setSigningIn(false);
      } catch (error) {
        authFlowStore.setSigningIn(false);
        const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
        sessionStore.setError(errorMessage);
        throw error;
      }
    },

    signUp: async (email: string, password: string, name: string) => {
      authFlowStore.setSigningUp(true);
      sessionStore.setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockUser: UserProfile = {
          id: crypto.randomUUID(),
          email,
          name,
          plan: 'free',
          role: 'user',
          permissions: ['read', 'write'],
          profile: {
            firstName: name.split(' ')[0] || name,
            lastName: name.split(' ').slice(1).join(' ') || '',
            timezone: 'UTC',
            preferences: {
              emailNotifications: true,
              pushNotifications: true,
              marketingEmails: true,
            },
          },
          billing: {
            subscriptionStatus: 'trialing',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          usage: {
            tokensUsed: 0,
            tokensLimit: 1000,
            jobsCompleted: 0,
            employeesPurchased: 0,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        sessionStore.setTokens('mock-jwt-token-' + Date.now(), 'mock-refresh-token-' + Date.now(), new Date(Date.now() + 24 * 60 * 60 * 1000));
        sessionStore.updateLastLogin();
        userProfileStore.setUser(mockUser);
        authFlowStore.setSigningUp(false);
      } catch (error) {
        authFlowStore.setSigningUp(false);
        const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
        sessionStore.setError(errorMessage);
        throw error;
      }
    },

    signOut: async () => {
      authFlowStore.setSigningOut(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        sessionStore.reset();
        userProfileStore.reset();
        authFlowStore.reset();
      } catch (error) {
        authFlowStore.setSigningOut(false);
        const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
        sessionStore.setError(errorMessage);
      }
    },

    refreshAuth: async () => {
      const { refreshToken } = sessionStore;
      if (!refreshToken || authFlowStore.isRefreshing) return;

      authFlowStore.setRefreshing(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newToken = 'refreshed-jwt-token-' + Date.now();
        const newRefreshToken = 'refreshed-refresh-token-' + Date.now();
        const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        sessionStore.setTokens(newToken, newRefreshToken, newExpiresAt);
        authFlowStore.setRefreshing(false);
      } catch (error) {
        authFlowStore.setRefreshing(false);
        sessionStore.setError('Session expired. Please sign in again.');
        sessionStore.reset();
        userProfileStore.reset();
        authFlowStore.reset();
      }
    },

    updateProfile: async (updates: Partial<UserProfile['profile']>) => {
      userProfileStore.updateProfile(updates);
    },

    updateUser: async (updates: Partial<UserProfile>) => {
      userProfileStore.updateUser(updates);
    },

    checkSession: () => {
      const { sessionExpiresAt } = sessionStore;
      return sessionExpiresAt ? new Date() < sessionExpiresAt : false;
    },

    extendSession: () => {
      if (sessionStore.sessionExpiresAt) {
        const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        sessionStore.setTokens(
          sessionStore.token || '',
          sessionStore.refreshToken || '',
          newExpiresAt
        );
      }
    },

    setError: (error: string | null) => {
      sessionStore.setError(error);
    },

    clearError: () => {
      sessionStore.clearError();
    },

    reset: () => {
      sessionStore.reset();
      userProfileStore.reset();
      authFlowStore.reset();
    },
  };
};

// Convenience selectors
export const useAuth = () => {
  const store = useAuthStore();
  return {
    isAuthenticated: store.isAuthenticated,
    user: store.user,
    isLoading: store.isLoading,
  };
};

export const useAuthError = () => useSessionStore((state) => state.error);
export const useUser = () => useUserProfileStore((state) => state.user);
export const useUserPlan = () => useUserProfileStore((state) => state.user?.plan);
export const useUserUsage = () => useUserProfileStore((state) => state.user?.usage);
export const useUserBilling = () => useUserProfileStore((state) => state.user?.billing);
