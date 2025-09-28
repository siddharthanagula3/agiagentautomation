import React, { useState, useEffect, ReactNode } from 'react';
import { authService, type AuthUser } from '../services/authService';
import { AuthContext, type AuthContextType } from './auth-context';
import { supabase } from '../integrations/supabase/client';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let subscription: any;

    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const hasValidCredentials = supabaseUrl && 
                                supabaseKey && 
                                !supabaseUrl.includes('your_supabase_url_here') && 
                                !supabaseKey.includes('your_supabase_anon_key_here');

    // If no valid credentials, immediately set loading to false for demo mode
    if (!hasValidCredentials) {
      console.log('No valid Supabase credentials - running in demo mode');
      setLoading(false);
      return;
    }

    // Check for existing user session
    const checkExistingSession = async () => {
      try {
        console.log('🔍 Checking existing session...');
        const { data: { user: existingUser } } = await supabase.auth.getUser();
        
        if (existingUser && isMounted) {
          console.log('✅ Existing user found:', existingUser.email);
          setUser(existingUser);
          setLoading(false);
          return;
        }
        
        console.log('ℹ️ No existing session found');
        setLoading(false);
      } catch (error) {
        console.log('❌ Error checking existing session:', error);
        setLoading(false);
      }
    };

    // Run the session check
    checkExistingSession();

    // Set up auth state change listener
    if (hasValidCredentials && typeof supabase?.auth?.onAuthStateChange === 'function') {
      try {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 Auth state changed:', event, session?.user?.email);
          
          if (!isMounted) return;

          if (session?.user) {
            try {
              const { user: authUser, error } = await authService.getCurrentUser();
              if (authUser && !error && isMounted) {
                console.log('✅ User authenticated:', authUser.email);
                setUser(authUser);
              }
            } catch (error) {
              console.error('❌ Error getting user:', error);
            }
          } else {
            console.log('🚪 User signed out');
            setUser(null);
          }
        });
        subscription = data?.subscription;
      } catch (error) {
        console.error('❌ Error setting up auth listener:', error);
      }
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Login attempt started for:', email);
      setLoading(true);
      
      // Check if Supabase is configured properly
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const hasValidCredentials = supabaseUrl && 
                                  supabaseKey && 
                                  !supabaseUrl.includes('your_supabase_url_here') && 
                                  !supabaseKey.includes('your_supabase_anon_key_here');

      // Demo mode fallback
      if (!hasValidCredentials) {
        if (email === 'demo@example.com' && password === 'demo123') {
          console.log('🎭 Demo mode login successful');
          const demoUser: AuthUser = {
            id: 'demo-user-id',
            email: 'demo@example.com',
            name: 'Demo User',
            role: 'user',
            company: 'Demo Company',
            preferences: {},
            phone: '',
            location: ''
          };
          setUser(demoUser);
          setLoading(false);
          return { success: true };
        } else {
          return { 
            success: false, 
            error: 'Demo mode active. Use demo@example.com / demo123 to login, or configure Supabase for full functionality.' 
          };
        }
      }
      
      const { user: authUser, error } = await authService.login({ email, password });
      
      console.log('🔐 Login result:', { authUser: !!authUser, error });
      
      if (error || !authUser) {
        setLoading(false);
        return { success: false, error: error || 'Login failed' };
      }

      console.log('✅ Login successful, setting user state');
      setUser(authUser);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoading(false);
      return { success: false, error: 'Login failed. Please try again.' };
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
      console.log('📝 Registration attempt started for:', userData.email);
      setLoading(true);
      
      const { user: authUser, error } = await authService.register(userData);
      
      if (error || !authUser) {
        setLoading(false);
        return { success: false, error: error || 'Registration failed' };
      }

      setUser(authUser);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error('❌ Registration error:', error);
      setLoading(false);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Logout started');
      setLoading(true);
      
      await authService.logout();
      setUser(null);
      setLoading(false);
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('👤 Profile update started');
      
      const { user: updatedUser, error } = await authService.updateProfile(updates);
      
      if (error || !updatedUser) {
        return { success: false, error: error || 'Profile update failed' };
      }

      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return { success: false, error: 'Profile update failed. Please try again.' };
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};