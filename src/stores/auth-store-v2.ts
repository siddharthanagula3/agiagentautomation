/**
 * Enhanced Authentication Store using Zustand
 * Replaces AuthContext with centralized auth state management
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authService } from '../services/authService-refactored';
import { useUserStore } from './user-store';
import { useSessionStore } from './session-store';
import { useAuthFlowStore } from './auth-flow-store';
import type { AuthUser } from '../types/auth';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  sessionExpiresAt: Date | null;
  lastLoginAt: Date | null;
}

export interface AuthActions {
  // Authentication actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    company?: string;
    phone?: string;
    location?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  
  // Password management
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  // User profile
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  
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
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...INITIAL_STATE,

        login: async (email: string, password: string) => {
          try {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            const { user, error } = await authService.login({ email, password });

            if (error || !user) {
              set((state) => {
                state.isLoading = false;
                state.error = error || 'Login failed';
              });
              return { success: false, error: error || 'Login failed' };
            }

            // Set auth state
            set((state) => {
              state.isAuthenticated = true;
              state.user = user;
              state.token = 'mock-jwt-token-' + Date.now();
              state.refreshToken = 'mock-refresh-token-' + Date.now();
              state.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
              state.lastLoginAt = new Date();
              state.isLoading = false;
              state.error = null;
            });

            return { success: true };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });
            return { success: false, error: errorMessage };
          }
        },

        register: async (userData) => {
          try {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            const { user, error } = await authService.register(userData);

            if (error || !user) {
              set((state) => {
                state.isLoading = false;
                state.error = error || 'Registration failed';
              });
              return { success: false, error: error || 'Registration failed' };
            }

            // Set auth state
            set((state) => {
              state.isAuthenticated = true;
              state.user = user;
              state.token = 'mock-jwt-token-' + Date.now();
              state.refreshToken = 'mock-refresh-token-' + Date.now();
              state.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
              state.lastLoginAt = new Date();
              state.isLoading = false;
              state.error = null;
            });

            return { success: true };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Registration failed';
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });
            return { success: false, error: errorMessage };
          }
        },

        logout: async () => {
          try {
            set((state) => {
              state.isLoading = true;
            });

            await authService.logout();

            set((state) => {
              Object.assign(state, INITIAL_STATE);
            });
          } catch (error) {
            console.error('Logout error:', error);
            set((state) => {
              state.isLoading = false;
              state.error = 'Logout failed';
            });
          }
        },

        refreshAuth: async () => {
          const { refreshToken } = get();
          if (!refreshToken) return;

          try {
            set((state) => {
              state.isLoading = true;
            });

            // Simulate token refresh
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const newToken = 'refreshed-jwt-token-' + Date.now();
            const newRefreshToken = 'refreshed-refresh-token-' + Date.now();
            const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            set((state) => {
              state.token = newToken;
              state.refreshToken = newRefreshToken;
              state.sessionExpiresAt = newExpiresAt;
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.isLoading = false;
              state.error = 'Session expired. Please sign in again.';
              Object.assign(state, INITIAL_STATE);
            });
          }
        },

        requestPasswordReset: async (email: string) => {
          try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return { success: true };
          } catch (error) {
            return { success: false, error: 'Failed to send reset email' };
          }
        },

        resetPassword: async (token: string, newPassword: string) => {
          try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return { success: true };
          } catch (error) {
            return { success: false, error: 'Failed to reset password' };
          }
        },

        updateProfile: async (updates: Partial<AuthUser>) => {
          try {
            const { user, error } = await authService.updateProfile(updates);
            
            if (error || !user) {
              return { success: false, error: error || 'Profile update failed' };
            }

            set((state) => {
              state.user = user;
            });

            return { success: true };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
            return { success: false, error: errorMessage };
          }
        },

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
        name: 'agi-auth-store-v2',
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
      name: 'Auth Store V2',
    }
  )
);

// Selectors for optimized re-renders
export const useAuth = () => useAuthStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  user: state.user,
  isLoading: state.isLoading,
}));

export const useAuthError = () => useAuthStore((state) => state.error);
export const useAuthUser = () => useAuthStore((state) => state.user);
