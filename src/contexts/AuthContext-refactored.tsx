/**
 * Refactored AuthContext with cleaner separation of concerns
 * Uses the refactored auth service and separated stores
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService-refactored';
import { useSessionStore } from '../stores/session-store';
import { useUserProfileStore } from '../stores/user-profile-store';
import { useAuthFlowStore } from '../stores/auth-flow-store';
import { supabase } from '../integrations/supabase/client';
import type { AuthUser } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
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
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const sessionStore = useSessionStore();
  const userProfileStore = useUserProfileStore();
  const authFlowStore = useAuthFlowStore();

  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { user, error } = await authService.getCurrentUser();
        
        if (user && !error) {
          sessionStore.setAuthenticated(true);
          userProfileStore.setUser(user);
        } else {
          sessionStore.setAuthenticated(false);
          userProfileStore.setUser(null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        sessionStore.setAuthenticated(false);
        userProfileStore.setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [sessionStore, userProfileStore]);

  // Set up auth state change listener
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const hasValidCredentials = supabaseUrl && 
                                supabaseKey && 
                                !supabaseUrl.includes('your_supabase_url_here') && 
                                !supabaseKey.includes('your_supabase_anon_key_here');

    if (!hasValidCredentials) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user) {
        try {
          const { user, error } = await authService.getCurrentUser();
          if (user && !error) {
            sessionStore.setAuthenticated(true);
            userProfileStore.setUser(user);
          } else {
            sessionStore.setAuthenticated(false);
            userProfileStore.setUser(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          sessionStore.setAuthenticated(false);
          userProfileStore.setUser(null);
        }
      } else {
        sessionStore.setAuthenticated(false);
        userProfileStore.setUser(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [sessionStore, userProfileStore]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      authFlowStore.setSigningIn(true);
      sessionStore.setError(null);

      const { user, error } = await authService.login({ email, password });

      if (error || !user) {
        authFlowStore.setSigningIn(false);
        return { success: false, error: error || 'Login failed' };
      }

      sessionStore.setAuthenticated(true);
      userProfileStore.setUser(user);
      authFlowStore.setSigningIn(false);
      
      return { success: true };
    } catch (error) {
      authFlowStore.setSigningIn(false);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      sessionStore.setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    company?: string;
    phone?: string;
    location?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      authFlowStore.setSigningUp(true);
      sessionStore.setError(null);

      const { user, error } = await authService.register(userData);

      if (error || !user) {
        authFlowStore.setSigningUp(false);
        return { success: false, error: error || 'Registration failed' };
      }

      sessionStore.setAuthenticated(true);
      userProfileStore.setUser(user);
      authFlowStore.setSigningUp(false);
      
      return { success: true };
    } catch (error) {
      authFlowStore.setSigningUp(false);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      sessionStore.setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      authFlowStore.setSigningOut(true);
      
      await authService.logout();
      
      sessionStore.reset();
      userProfileStore.reset();
      authFlowStore.reset();
    } catch (error) {
      console.error('Logout error:', error);
      authFlowStore.setSigningOut(false);
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user, error } = await authService.updateProfile(updates);
      
      if (error || !user) {
        return { success: false, error: error || 'Profile update failed' };
      }

      userProfileStore.setUser(user);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    user: userProfileStore.user,
    login,
    register,
    logout,
    updateProfile,
    loading: loading || authFlowStore.isSigningIn || authFlowStore.isSigningUp || authFlowStore.isSigningOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
