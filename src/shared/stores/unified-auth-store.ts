import { create } from 'zustand';
import {
  authService,
  AuthResponse,
  AuthUser,
  LoginData,
  RegisterData,
} from '@_core/security/auth-service';
import { logger } from '@shared/lib/logger';

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

export const useAuthStore = create<AuthState>((set, get) => ({
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
        set({ error, isLoading: false, isAuthenticated: false, user: null });
        return { success: false, error };
      }
      set({ user, isAuthenticated: !!user, isLoading: false });
      return { success: true, error: null };
    } catch (err) {
      const error = (err as Error).message;
      set({ error, isLoading: false, isAuthenticated: false, user: null });
      return { success: false, error };
    }
  },

  register: async (registerData) => {
    set({ isLoading: true, error: null });
    try {
      const { user, error } = await authService.register(registerData);
      if (error) {
        set({ error, isLoading: false, isAuthenticated: false, user: null });
        return { success: false, error };
      }
      set({ user, isAuthenticated: !!user, isLoading: false });
      return { success: true, error: null };
    } catch (err) {
      const error = (err as Error).message;
      set({ error, isLoading: false, isAuthenticated: false, user: null });
      return { success: false, error };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await authService.logout();
    set({ user: null, isAuthenticated: false, isLoading: false });
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
    } catch (err) {
      const error = (err as Error).message;
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
    } catch (err) {
      const error = (err as Error).message;
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
    } catch (err) {
      const error = (err as Error).message;
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
    } catch (err) {
      const error = (err as Error).message;
      set({ error, isLoading: false });
      return { success: false, error };
    }
  },
}));

// Auto-initialize the store when imported
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
}
