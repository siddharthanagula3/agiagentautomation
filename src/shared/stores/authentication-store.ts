import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  authService,
  AuthResponse,
  AuthUser,
  LoginData,
  RegisterData,
} from '@core/auth/authentication-manager';
import { logger } from '@shared/lib/logger';

// Import cleanup function for workforce subscription
import { cleanupWorkforceSubscription } from './workforce-store';

/**
 * Central cleanup function to reset all stores on logout
 * Prevents data leaks between user sessions
 */
async function cleanupAllStores(): Promise<void> {
  try {
    // Dynamically import stores to avoid circular dependencies
    const [
      { useWorkforceStore },
      { useMissionStore, stopMissionCleanupInterval },
      { useNotificationStore },
      { useChatStore },
      { useMultiAgentChatStore },
      { useUsageWarningStore },
      { useArtifactStore },
    ] = await Promise.all([
      import('./workforce-store'),
      import('./mission-control-store'),
      import('./notification-store'),
      import('./chat-store'),
      import('./multi-agent-chat-store'),
      import('./usage-warning-store'),
      import('./artifact-store'),
    ]);

    // Reset all stores with proper existence checks and logging
    useWorkforceStore.getState().reset();
    useMissionStore.getState().reset();
    useNotificationStore.getState().clearAll();

    // Chat store cleanup
    const chatState = useChatStore.getState();
    if (typeof chatState.clearHistory === 'function') {
      chatState.clearHistory();
    } else if (typeof chatState.reset === 'function') {
      chatState.reset();
    } else {
      logger.auth('Warning: Chat store has no clearHistory or reset method');
    }

    // Multi-agent chat store cleanup
    const multiAgentState = useMultiAgentChatStore.getState();
    if (typeof multiAgentState.reset === 'function') {
      multiAgentState.reset();
    } else {
      logger.auth('Warning: Multi-agent chat store has no reset method');
    }

    // Usage warning store cleanup
    const usageState = useUsageWarningStore.getState();
    if (typeof usageState.resetWarnings === 'function') {
      usageState.resetWarnings();
    } else if (typeof usageState.reset === 'function') {
      usageState.reset();
    } else {
      logger.auth('Warning: Usage warning store has no reset method');
    }

    // Artifact store cleanup
    const artifactState = useArtifactStore.getState();
    if (typeof artifactState.clearAllArtifacts === 'function') {
      artifactState.clearAllArtifacts();
    } else if (typeof artifactState.reset === 'function') {
      artifactState.reset();
    } else {
      logger.auth('Warning: Artifact store has no clearAllArtifacts or reset method');
    }

    // Stop mission cleanup interval
    stopMissionCleanupInterval();

    // Cleanup real-time subscriptions
    cleanupWorkforceSubscription();

    // Clear persisted data from localStorage
    const keysToRemove = [
      'agi-chat-store',
      'agi-notification-store',
      'agi-multi-agent-chat-store',
      'agi-usage-warning-store',
      'agi-artifact-store',
    ];
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore localStorage errors
      }
    });

    logger.auth('All stores cleaned up on logout');
  } catch (error) {
    logger.error('Error cleaning up stores on logout:', error);
  }
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
  login: (
    loginData: LoginData
  ) => Promise<{ success: boolean; error: string | null }>;
  register: (
    registerData: RegisterData
  ) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error: string | null }>;
  updatePassword: (
    newPassword: string
  ) => Promise<{ success: boolean; error: string | null }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error: string | null }>;
  updateProfile: (
    updates: Partial<AuthUser>
  ) => Promise<{ success: boolean; error: string | null }>;
}

// SECURITY FIX: Only enable devtools in development, not production
const enableDevtools = import.meta.env.MODE !== 'production';

export const useAuthStore = create<AuthState>()(
  devtools(
    immer((set, get) => ({
      user: null,
      isLoading: true,
      error: null,
      isAuthenticated: false,
      initialized: false,

      initialize: async () => {
        if (get().initialized) return;

        logger.auth('Initializing auth state...');
        set({ isLoading: true, initialized: true });

        try {
          const timeoutPromise = new Promise<AuthResponse>((resolve) =>
            setTimeout(
              () =>
                resolve({
                  user: null,
                  error: 'Auth initialization timeout',
                }),
              5000
            )
          );

          const result = await Promise.race([
            authService.getCurrentUser(),
            timeoutPromise,
          ]);

          if (!result) {
            logger.debug('Initialization skipped: empty auth response');
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          const { user, error } = result;

          if (error) {
            logger.debug('No existing session:', error);
            // Clear any invalid auth data from localStorage
            try {
              localStorage.removeItem('supabase.auth.token');
              localStorage.removeItem('sb-lywdzvfibhzbljrgovwr-auth-token');
            } catch (e) {
              logger.debug('Could not clear localStorage');
            }
            set({ user: null, isAuthenticated: false, isLoading: false });
          } else {
            logger.auth('Restored user session:', user?.email);
            set({ user, isAuthenticated: !!user, isLoading: false });
          }
        } catch (error) {
          logger.error('Initialization error:', error);
          // Clear any invalid auth data
          try {
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('sb-lywdzvfibhzbljrgovwr-auth-token');
          } catch (e) {
            logger.debug('Could not clear localStorage');
          }
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      login: async (loginData) => {
        set({ isLoading: true, error: null });
        try {
          const { user, error } = await authService.login(loginData);
          if (error) {
            set({
              error,
              isLoading: false,
              isAuthenticated: false,
              user: null,
            });
            return { success: false, error };
          }
          set({ user, isAuthenticated: !!user, isLoading: false });
          return { success: true, error: null };
        } catch (err: unknown) {
          // TYPESCRIPT FIX: Properly handle unknown error type
          const error = err instanceof Error ? err.message : String(err);
          set({ error, isLoading: false, isAuthenticated: false, user: null });
          return { success: false, error };
        }
      },

      register: async (registerData) => {
        set({ isLoading: true, error: null });
        try {
          const { user, error } = await authService.register(registerData);
          if (error) {
            set({
              error,
              isLoading: false,
              isAuthenticated: false,
              user: null,
            });
            return { success: false, error };
          }
          set({ user, isAuthenticated: !!user, isLoading: false });
          return { success: true, error: null };
        } catch (err: unknown) {
          // TYPESCRIPT FIX: Properly handle unknown error type
          const error = err instanceof Error ? err.message : String(err);
          set({ error, isLoading: false, isAuthenticated: false, user: null });
          return { success: false, error };
        }
      },

      logout: async () => {
        set({ isLoading: true });

        // Clean up all stores to prevent data leaks between sessions
        await cleanupAllStores();

        // Logout from auth service
        await authService.logout();

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          initialized: false,
        });

        logger.auth('User logged out, all stores reset');
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const { user, error } = await authService.getCurrentUser();
          if (error) {
            set({ user: null, isAuthenticated: false, isLoading: false });
          } else {
            set({ user, isAuthenticated: !!user, isLoading: false });
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (user: AuthUser) => {
        set({ user, isAuthenticated: !!user });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      reset: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
          initialized: false,
        });
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await authService.resetPassword(email);
          if (error) {
            set({ error, isLoading: false });
            return { success: false, error };
          }
          set({ isLoading: false });
          return { success: true, error: null };
        } catch (err: unknown) {
          // TYPESCRIPT FIX: Properly handle unknown error type
          const error = err instanceof Error ? err.message : String(err);
          set({ error, isLoading: false });
          return { success: false, error };
        }
      },

      updatePassword: async (newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await authService.updatePassword(newPassword);
          if (error) {
            set({ error, isLoading: false });
            return { success: false, error };
          }
          set({ isLoading: false });
          return { success: true, error: null };
        } catch (err: unknown) {
          // TYPESCRIPT FIX: Properly handle unknown error type
          const error = err instanceof Error ? err.message : String(err);
          set({ error, isLoading: false });
          return { success: false, error };
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await authService.changePassword(
            currentPassword,
            newPassword
          );
          if (error) {
            set({ error, isLoading: false });
            return { success: false, error };
          }
          set({ isLoading: false });
          return { success: true, error: null };
        } catch (err: unknown) {
          // TYPESCRIPT FIX: Properly handle unknown error type
          const error = err instanceof Error ? err.message : String(err);
          set({ error, isLoading: false });
          return { success: false, error };
        }
      },

      updateProfile: async (updates: Partial<AuthUser>) => {
        set({ isLoading: true, error: null });
        try {
          const { user, error } = await authService.updateProfile(updates);
          if (error) {
            set({ error, isLoading: false });
            return { success: false, error };
          }
          set({ user, isAuthenticated: !!user, isLoading: false });
          return { success: true, error: null };
        } catch (err: unknown) {
          // TYPESCRIPT FIX: Properly handle unknown error type
          const error = err instanceof Error ? err.message : String(err);
          set({ error, isLoading: false });
          return { success: false, error };
        }
      },
    })),
    { name: 'AuthStore', enabled: enableDevtools }
  )
);

// Auto-initialize the store when imported
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
}
