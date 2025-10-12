/**
 * Main application store using Zustand
 * Handles global app state, settings, and configuration
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de' | 'zh';
  autoSave: boolean;
  notifications: {
    desktop: boolean;
    sound: boolean;
    email: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
    dataSharing: boolean;
  };
  performance: {
    reducedMotion: boolean;
    lowQualityImages: boolean;
    preloadContent: boolean;
  };
}

export interface AppState {
  // Core app state
  initialized: boolean;
  loading: boolean;
  error: string | null;

  // Settings
  settings: AppSettings;

  // User session
  sessionId: string | null;
  lastActivity: Date | null;

  // Feature flags
  features: Record<string, boolean>;

  // App metadata
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
}

export interface AppActions {
  // Initialization
  initialize: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Settings management
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;

  // Session management
  startSession: () => void;
  endSession: () => void;
  updateActivity: () => void;

  // Feature flags
  setFeature: (feature: string, enabled: boolean) => void;
  isFeatureEnabled: (feature: string) => boolean;

  // Utility actions
  reset: () => void;
}

export interface AppStore extends AppState, AppActions {}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  autoSave: true,
  notifications: {
    desktop: true,
    sound: true,
    email: false,
  },
  privacy: {
    analytics: true,
    crashReporting: true,
    dataSharing: false,
  },
  performance: {
    reducedMotion: false,
    lowQualityImages: false,
    preloadContent: true,
  },
};

const INITIAL_STATE: AppState = {
  initialized: false,
  loading: false,
  error: null,
  settings: DEFAULT_SETTINGS,
  sessionId: null,
  lastActivity: null,
  features: {
    betaFeatures: false,
    advancedAnalytics: true,
    experimentalUI: false,
    voiceMode: true,
    realTimeCollab: false,
  },
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  buildNumber: import.meta.env.VITE_BUILD_NUMBER || 'dev',
  environment:
    (import.meta.env.MODE as 'development' | 'production' | 'test') ||
    'development',
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...INITIAL_STATE,

        // Initialization
        initialize: async () => {
          set(state => {
            state.loading = true;
            state.error = null;
          });

          try {
            // Simulate initialization
            await new Promise(resolve => setTimeout(resolve, 1000));

            set(state => {
              state.initialized = true;
              state.loading = false;
              state.sessionId = crypto.randomUUID();
              state.lastActivity = new Date();
            });
          } catch (error) {
            set(state => {
              state.loading = false;
              state.error =
                error instanceof Error
                  ? error.message
                  : 'Failed to initialize app';
            });
          }
        },

        setLoading: (loading: boolean) =>
          set(state => {
            state.loading = loading;
          }),

        setError: (error: string | null) =>
          set(state => {
            state.error = error;
          }),

        // Settings management
        updateSettings: (newSettings: Partial<AppSettings>) =>
          set(state => {
            state.settings = { ...state.settings, ...newSettings };
          }),

        resetSettings: () =>
          set(state => {
            state.settings = DEFAULT_SETTINGS;
          }),

        // Session management
        startSession: () =>
          set(state => {
            state.sessionId = crypto.randomUUID();
            state.lastActivity = new Date();
          }),

        endSession: () =>
          set(state => {
            state.sessionId = null;
            state.lastActivity = null;
          }),

        updateActivity: () =>
          set(state => {
            state.lastActivity = new Date();
          }),

        // Feature flags
        setFeature: (feature: string, enabled: boolean) =>
          set(state => {
            state.features[feature] = enabled;
          }),

        isFeatureEnabled: (feature: string) => {
          const { features } = get();
          return features[feature] ?? false;
        },

        // Utility actions
        reset: () =>
          set(state => {
            Object.assign(state, INITIAL_STATE);
          }),
      })),
      {
        name: 'agi-app-store',
        version: 1,
        partialize: state => ({
          settings: state.settings,
          features: state.features,
        }),
      }
    ),
    {
      name: 'App Store',
    }
  )
);

// Selectors for optimized re-renders
export const useAppLoading = () => useAppStore(state => state.loading);
export const useAppError = () => useAppStore(state => state.error);
export const useAppSettings = () => useAppStore(state => state.settings);
export const useAppFeatures = () => useAppStore(state => state.features);
export const useAppSession = () =>
  useAppStore(state => ({
    sessionId: state.sessionId,
    lastActivity: state.lastActivity,
  }));
