import { create } from 'zustand';
import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type User = Database['public']['Tables']['users']['Row'];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
  preferences?: any;
  phone?: string;
  location?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  location?: string;
}

interface AuthState {
  // State
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Login action
  login: async (data: LoginData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (!authData.user) {
        set({ isLoading: false, error: 'Authentication succeeded but no user data was found.' });
        return { success: false, error: 'Authentication succeeded but no user data was found.' };
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        set({ isLoading: false, error: 'Failed to fetch user profile: ' + profileError.message });
        return { success: false, error: 'Failed to fetch user profile: ' + profileError.message };
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_login: profile.last_login,
        is_active: profile.is_active,
        preferences: profile.preferences,
        phone: profile.phone,
        location: profile.location,
      };

      set({ 
        user: authUser, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Register action
  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (!authData.user) {
        set({ isLoading: false, error: 'No user data returned' });
        return { success: false, error: 'No user data returned' };
      }

      // Check if email confirmation is required
      if (authData.user && !authData.session) {
        set({ isLoading: false, error: null });
        return { 
          success: true, 
          error: 'Please check your email and click the confirmation link to complete registration.' 
        };
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          phone: data.phone,
          location: data.location,
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) {
        set({ isLoading: false, error: 'Failed to create user profile' });
        return { success: false, error: 'Failed to create user profile' };
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_login: profile.last_login,
        is_active: profile.is_active,
        preferences: profile.preferences,
        phone: profile.phone,
        location: profile.location,
      };

      set({ 
        user: authUser, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Logout action
  logout: async () => {
    set({ isLoading: true });
    
    try {
      await supabase.auth.signOut();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: null 
      });
    } catch (error) {
      set({ isLoading: false, error: 'Logout failed' });
    }
  },

  // Check session action
  checkSession: async () => {
    set({ isLoading: true });
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false, 
          error: null 
        });
        return;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false, 
          error: null 
        });
        return;
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_login: profile.last_login,
        is_active: profile.is_active,
        preferences: profile.preferences,
        phone: profile.phone,
        location: profile.location,
      };

      set({ 
        user: authUser, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      });
    } catch (error) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: null 
      });
    }
  },

  // Clear error action
  clearError: () => set({ error: null }),

  // Set loading action
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
