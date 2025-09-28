/**
 * Authentication flow store using Zustand
 * Handles authentication actions and flow state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface AuthFlowState {
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  isRefreshing: boolean;
  error: string | null;
}

export interface AuthFlowActions {
  setSigningIn: (signingIn: boolean) => void;
  setSigningUp: (signingUp: boolean) => void;
  setSigningOut: (signingOut: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export interface AuthFlowStore extends AuthFlowState, AuthFlowActions {}

const INITIAL_STATE: AuthFlowState = {
  isSigningIn: false,
  isSigningUp: false,
  isSigningOut: false,
  isRefreshing: false,
  error: null,
};

export const useAuthFlowStore = create<AuthFlowStore>()(
  devtools(
    immer((set) => ({
      ...INITIAL_STATE,

      setSigningIn: (signingIn: boolean) =>
        set((state) => {
          state.isSigningIn = signingIn;
        }),

      setSigningUp: (signingUp: boolean) =>
        set((state) => {
          state.isSigningUp = signingUp;
        }),

      setSigningOut: (signingOut: boolean) =>
        set((state) => {
          state.isSigningOut = signingOut;
        }),

      setRefreshing: (refreshing: boolean) =>
        set((state) => {
          state.isRefreshing = refreshing;
        }),

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
      name: 'Auth Flow Store',
    }
  )
);

// Selectors for optimized re-renders
export const useAuthFlow = () => useAuthFlowStore((state) => ({
  isSigningIn: state.isSigningIn,
  isSigningUp: state.isSigningUp,
  isSigningOut: state.isSigningOut,
  isRefreshing: state.isRefreshing,
  error: state.error,
}));

export const useAuthFlowError = () => useAuthFlowStore((state) => state.error);
