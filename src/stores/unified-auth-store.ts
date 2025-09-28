import { create } from 'zustand';
import { authService, AuthUser, LoginData, RegisterData } from '../services/authService';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (loginData: LoginData) => Promise<void>;
  register: (registerData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,

  login: async (loginData) => {
    set({ isLoading: true, error: null });
    try {
      const { user, error } = await authService.login(loginData);
      if (error) throw new Error(error);
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch (err) {
      const error = err as Error;
      set({ error: error.message, isLoading: false, isAuthenticated: false, user: null });
    }
  },

  register: async (registerData) => {
    set({ isLoading: true, error: null });
    try {
      const { user, error } = await authService.register(registerData);
      if (error) throw new Error(error);
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch (err) {
        const error = err as Error;
        set({ error: error.message, isLoading: false, isAuthenticated: false, user: null });
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
