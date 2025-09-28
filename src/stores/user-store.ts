/**
 * User State Management Store using Zustand
 * Handles user profile, preferences, and account information
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  company?: string;
  role: 'user' | 'admin' | 'super_admin';
  plan: 'free' | 'pro' | 'enterprise';
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
    };
  };
  billing: {
    customerId?: string;
    subscriptionId?: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    currentPeriodEnd?: Date;
    trialEndsAt?: Date;
  };
  usage: {
    tokensUsed: number;
    tokensLimit: number;
    employeesHired: number;
    projectsCompleted: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  lastActive: Date | null;
}

export interface UserActions {
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateLastActive: () => void;
  clearError: () => void;
  reset: () => void;
}

export interface UserStore extends UserState, UserActions {}

const INITIAL_STATE: UserState = {
  profile: null,
  isLoading: false,
  error: null,
  lastActive: null,
};

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...INITIAL_STATE,

        setProfile: (profile: UserProfile | null) =>
          set((state) => {
            state.profile = profile;
            if (profile) {
              state.lastActive = new Date();
            }
          }),

        updateProfile: (updates: Partial<UserProfile>) =>
          set((state) => {
            if (state.profile) {
              state.profile = { ...state.profile, ...updates, updatedAt: new Date() };
            }
          }),

        setLoading: (loading: boolean) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error: string | null) =>
          set((state) => {
            state.error = error;
          }),

        updateLastActive: () =>
          set((state) => {
            state.lastActive = new Date();
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
        name: 'agi-user-store',
        version: 1,
        partialize: (state) => ({
          profile: state.profile,
          lastActive: state.lastActive,
        }),
      }
    ),
    {
      name: 'User Store',
    }
  )
);

// Selectors for optimized re-renders
export const useUser = () => useUserStore((state) => state.profile);
export const useUserLoading = () => useUserStore((state) => state.isLoading);
export const useUserError = () => useUserStore((state) => state.error);
export const useUserPlan = () => useUserStore((state) => state.profile?.plan);
export const useUserUsage = () => useUserStore((state) => state.profile?.usage);
export const useUserBilling = () => useUserStore((state) => state.profile?.billing);
