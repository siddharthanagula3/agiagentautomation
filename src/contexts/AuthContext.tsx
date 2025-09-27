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
    let timeoutId: NodeJS.Timeout;

    // Check for existing session with timeout
    const checkSession = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Auth check timeout - setting loading to false');
            setLoading(false);
          }
        }, 2000); // 2 second timeout - very aggressive

        const { user: currentUser, error } = await authService.getCurrentUser();
        
        if (isMounted) {
          if (currentUser && !error) {
            setUser(currentUser);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (isMounted) {
          setLoading(false);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    checkSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        try {
          const { user: authUser, error } = await authService.getCurrentUser();
          if (authUser && !error && isMounted) {
            setUser(authUser);
          }
        } catch (error) {
          console.error('Error getting user:', error);
        }
      } else {
        setUser(null);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Login attempt started for:', email);
      setLoading(true);
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase not configured - using demo mode');
        setLoading(false);
        // Create a demo user for testing
        const demoUser = {
          id: 'demo-user-123',
          email: email,
          name: email.split('@')[0],
          avatar: '',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_active: true,
          preferences: {},
          phone: '',
          location: ''
        };
        setUser(demoUser);
        return { success: true };
      }
      
      // Add aggressive timeout to prevent infinite loading
      const loginTimeout = setTimeout(() => {
        console.warn('Login timeout - forcing loading to false');
        setLoading(false);
      }, 5000); // 5 second timeout for login
      
      // Use Promise.race to ensure timeout works
      const loginPromise = authService.login({ email, password });
      const timeoutPromise = new Promise<{ success: boolean; error: string }>((resolve) => {
        setTimeout(() => resolve({ success: false, error: 'Login timeout - please try again' }), 5000);
      });
      
      const result = await Promise.race([loginPromise, timeoutPromise]);
      
      clearTimeout(loginTimeout);
      console.log('Login result:', result);
      
      if (result.error || !result.user) {
        setLoading(false);
        return { success: false, error: result.error || 'Login failed' };
      }

      setUser(result.user);
      setLoading(false);
      console.log('Login successful');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
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
      setLoading(true);
      
      const { user: authUser, error } = await authService.register({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        company: userData.company,
        phone: userData.phone,
        location: userData.location,
      });
      
      if (error || !authUser) {
        return { success: false, error: error || 'Registration failed' };
      }

      setUser(authUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      const { user: updatedUser, error } = await authService.updateProfile(user.id, updates);
      
      if (error || !updatedUser) {
        return { success: false, error: error || 'Update failed' };
      }

      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Update failed. Please try again.' };
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