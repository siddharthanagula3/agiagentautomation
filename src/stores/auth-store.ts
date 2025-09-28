/**
 * Authentication store using Zustand
 * Handles user authentication, session management, and user profile
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authService, type AuthUser } from '../services/authService';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  role: 'user' | 'admin' | 'moderator';
  permissions: string[];
  profile: {
    firstName: string;
    lastName: string;
    company?: string;
    bio?: string;
    timezone: string;
    preferences: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      marketingEmails: boolean;
    };
  };
  billing: {
    customerId?: string;
    subscriptionId?: string;
    subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing';
    trialEndsAt?: Date;
    currentPeriodEnd?: Date;
  };
  usage: {
    tokensUsed: number;
    tokensLimit: number;
    jobsCompleted: number;
    employeesPurchased: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // User data
  user: User | null;
  token: string | null;
  refreshToken: string | null;

  // Session info
  sessionExpiresAt: Date | null;
  lastLoginAt: Date | null;

  // Auth flow state
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  isRefreshing: boolean;
}

export interface AuthActions {
  // Authentication actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;

  // Password management
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;

  // User profile
  updateProfile: (updates: Partial<User['profile']>) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;

  // Session management
  checkSession: () => boolean;
  extendSession: () => void;

  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export interface AuthStore extends AuthState, AuthActions {}

const INITIAL_STATE: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  user: null,
  token: null,
  refreshToken: null,
  sessionExpiresAt: null,
  lastLoginAt: null,
  isSigningIn: false,
  isSigningUp: false,
  isSigningOut: false,
  isRefreshing: false,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...INITIAL_STATE,

        // Authentication actions
        signIn: async (email: string, password: string) => {
          set((state) => {
            state.isSigningIn = true;
            state.error = null;
          });

          try {
            const { user: authUser, error } = await authService.login({ email, password });
            
            if (error || !authUser) {
              throw new Error(error || 'Login failed');
            }

            // Convert AuthUser to User format
            const user: User = {
              id: authUser.id,
              email: authUser.email,
              name: authUser.name,
              avatar: authUser.avatar_url,
              plan: 'free', // Default plan
              role: authUser.role as 'user' | 'admin' | 'moderator',
              permissions: ['read', 'write'],
              profile: {
                firstName: authUser.name.split(' ')[0] || authUser.name,
                lastName: authUser.name.split(' ').slice(1).join(' ') || '',
                company: authUser.company,
                bio: '',
                timezone: 'UTC',
                preferences: authUser.preferences || {
                  emailNotifications: true,
                  pushNotifications: true,
                  marketingEmails: false,
                },
              },
              billing: {
                customerId: undefined,
                subscriptionId: undefined,
                subscriptionStatus: undefined,
                trialEndsAt: undefined,
                currentPeriodEnd: undefined,
              },
              usage: {
                tokensUsed: 0,
                tokensLimit: 1000,
                jobsCompleted: 0,
                employeesPurchased: 0,
              },
              createdAt: new Date(authUser.created_at),
              updatedAt: new Date(),
            };

            const token = 'auth-token-' + Date.now();
            const refreshToken = 'refresh-token-' + Date.now();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            set((state) => {
              state.isAuthenticated = true;
              state.user = user;
              state.token = token;
              state.refreshToken = refreshToken;
              state.sessionExpiresAt = expiresAt;
              state.lastLoginAt = new Date();
              state.isSigningIn = false;
              state.error = null;
            });
          } catch (error) {
            set((state) => {
              state.isSigningIn = false;
              state.error = error instanceof Error ? error.message : 'Failed to sign in';
            });
            throw error;
          }
        },

        signUp: async (email: string, password: string, name: string) => {
          set((state) => {
            state.isSigningUp = true;
            state.error = null;
          });

          try {
            const { user: authUser, error } = await authService.register({
              email,
              password,
              name,
            });
            
            if (error || !authUser) {
              throw new Error(error || 'Registration failed');
            }

            // Convert AuthUser to User format
            const user: User = {
              id: authUser.id,
              email: authUser.email,
              name: authUser.name,
              avatar: authUser.avatar_url,
              plan: 'free',
              role: authUser.role as 'user' | 'admin' | 'moderator',
              permissions: ['read', 'write'],
              profile: {
                firstName: authUser.name.split(' ')[0] || authUser.name,
                lastName: authUser.name.split(' ').slice(1).join(' ') || '',
                company: authUser.company,
                bio: '',
                timezone: 'UTC',
                preferences: authUser.preferences || {
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
              createdAt: new Date(authUser.created_at),
              updatedAt: new Date(),
            };

            set((state) => {
              state.isAuthenticated = true;
              state.user = user;
              state.token = 'auth-token-' + Date.now();
              state.refreshToken = 'refresh-token-' + Date.now();
              state.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
              state.lastLoginAt = new Date();
              state.isSigningUp = false;
              state.error = null;
            });
          } catch (error) {
            set((state) => {
              state.isSigningUp = false;
              state.error = error instanceof Error ? error.message : 'Failed to sign up';
            });
            throw error;
          }
        },

        signOut: async () => {
          set((state) => {
            state.isSigningOut = true;
          });

          try {
            await authService.logout();
            set((state) => {
              Object.assign(state, INITIAL_STATE);
            });
          } catch (error) {
            set((state) => {
              state.isSigningOut = false;
              state.error = error instanceof Error ? error.message : 'Failed to sign out';
            });
          }
        },

        refreshAuth: async () => {
          const { refreshToken, isRefreshing } = get();

          if (!refreshToken || isRefreshing) return;

          set((state) => {
            state.isRefreshing = true;
          });

          try {
            // Simulate token refresh
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const newToken = 'refreshed-jwt-token-' + Date.now();
            const newRefreshToken = 'refreshed-refresh-token-' + Date.now();
            const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            set((state) => {
              state.token = newToken;
              state.refreshToken = newRefreshToken;
              state.sessionExpiresAt = newExpiresAt;
              state.isRefreshing = false;
            });
          } catch (error) {
            set((state) => {
              state.isRefreshing = false;
              state.error = 'Session expired. Please sign in again.';
              // Clear auth state on refresh failure
              Object.assign(state, INITIAL_STATE);
            });
          }
        },

        // Password management
        requestPasswordReset: async (email: string) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          // In real app, this would trigger password reset email
        },

        resetPassword: async (token: string, newPassword: string) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          // In real app, this would validate token and update password
        },

        // User profile
        updateProfile: async (updates: Partial<User['profile']>) => {
          set((state) => {
            if (state.user) {
              state.user.profile = { ...state.user.profile, ...updates };
              state.user.updatedAt = new Date();
            }
          });
        },

        updateUser: async (updates: Partial<User>) => {
          set((state) => {
            if (state.user) {
              state.user = { ...state.user, ...updates, updatedAt: new Date() };
            }
          });
        },

        // Session management
        checkSession: () => {
          const { sessionExpiresAt } = get();
          return sessionExpiresAt ? new Date() < sessionExpiresAt : false;
        },

        extendSession: () => {
          set((state) => {
            if (state.sessionExpiresAt) {
              state.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            }
          });
        },

        // Utility actions
        setError: (error: string | null) =>
          set((state) => {
            state.error = error;
          }),

        clearError: () =>
          set((state) => {
            state.error = null;
          }),

        reset: () =>
          set((state) => {
            Object.assign(state, INITIAL_STATE);
          }),
      })),
      {
        name: 'agi-auth-store',
        version: 1,
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          sessionExpiresAt: state.sessionExpiresAt,
          lastLoginAt: state.lastLoginAt,
        }),
      }
    ),
    {
      name: 'Auth Store',
    }
  )
);

// Selectors for optimized re-renders
export const useAuth = () => useAuthStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  user: state.user,
  isLoading: state.isSigningIn || state.isSigningUp || state.isSigningOut || state.isRefreshing,
}));

export const useAuthError = () => useAuthStore((state) => state.error);
export const useUser = () => useAuthStore((state) => state.user);
export const useUserPlan = () => useAuthStore((state) => state.user?.plan);
export const useUserUsage = () => useAuthStore((state) => state.user?.usage);
export const useUserBilling = () => useAuthStore((state) => state.user?.billing);