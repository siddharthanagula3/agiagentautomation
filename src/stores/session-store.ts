/**
 * Session management store using Zustand
 * Handles authentication state, tokens, and session lifecycle
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface SessionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  refreshToken: string | null;
  sessionExpiresAt: Date | null;
  lastLoginAt: Date | null;
}

export interface SessionActions {
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTokens: (token: string, refreshToken: string, expiresAt: Date) => void;
  clearTokens: () => void;
  updateLastLogin: () => void;
  clearError: () => void;
  reset: () => void;
}

export interface SessionStore extends SessionState, SessionActions {}

const INITIAL_STATE: SessionState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
  refreshToken: null,
  sessionExpiresAt: null,
  lastLoginAt: null,
};

export const useSessionStore = create<SessionStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...INITIAL_STATE,

        setAuthenticated: (authenticated: boolean) =>
          set((state) => {
            state.isAuthenticated = authenticated;
          }),

        setLoading: (loading: boolean) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error: string | null) =>
          set((state) => {
            state.error = error;
          }),

        setTokens: (token: string, refreshToken: string, expiresAt: Date) =>
          set((state) => {
            state.token = token;
            state.refreshToken = refreshToken;
            state.sessionExpiresAt = expiresAt;
            state.isAuthenticated = true;
          }),

        clearTokens: () =>
          set((state) => {
            state.token = null;
            state.refreshToken = null;
            state.sessionExpiresAt = null;
            state.isAuthenticated = false;
          }),

        updateLastLogin: () =>
          set((state) => {
            state.lastLoginAt = new Date();
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
        name: 'agi-session-store',
        version: 1,
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          token: state.token,
          refreshToken: state.refreshToken,
          sessionExpiresAt: state.sessionExpiresAt,
          lastLoginAt: state.lastLoginAt,
        }),
      }
    ),
    {
      name: 'Session Store',
    }
  )
);

// Selectors for optimized re-renders
export const useSession = () => useSessionStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useSessionTokens = () => useSessionStore((state) => ({
  token: state.token,
  refreshToken: state.refreshToken,
  sessionExpiresAt: state.sessionExpiresAt,
}));
