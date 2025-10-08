import { create } from 'zustand';
import { authService, AuthUser, LoginData, RegisterData } from '../services/authService';
import { logger } from '@/lib/logger';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
  login: (loginData: LoginData) => Promise<{ success: boolean; error: string | null }>;
  register: (registerData: RegisterData) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<void>;
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
      const { user, error } = await authService.getCurrentUser();
      if (error) {
        logger.debug('No existing session:', error);
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        logger.auth('Restored user session:', user?.email);
        set({ user, isAuthenticated: !!user, isLoading: false });
      }
    } catch (error) {
      logger.error('Initialization error:', error);
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
}));

// Auto-initialize the store when imported
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
}
