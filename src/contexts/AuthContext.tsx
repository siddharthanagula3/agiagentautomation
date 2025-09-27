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

    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Comprehensive diagnostic for live site
    console.log('🔍 COMPREHENSIVE DIAGNOSTIC FOR LIVE SITE');
    console.log('==========================================');
    
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set');
    
    if (supabaseUrl) {
      console.log('URL Value:', supabaseUrl);
      console.log('URL Valid:', !supabaseUrl.includes('your_supabase_url_here'));
      console.log('URL Format:', supabaseUrl.startsWith('https://') ? '✅ Correct' : '❌ Incorrect');
    } else {
      console.log('❌ CRITICAL: VITE_SUPABASE_URL is missing');
    }
    
    if (supabaseKey) {
      console.log('Key Value:', supabaseKey.substring(0, 20) + '...');
      console.log('Key Valid:', !supabaseKey.includes('your_supabase_anon_key_here'));
      console.log('Key Format:', supabaseKey.startsWith('eyJ') ? '✅ Correct' : '❌ Incorrect');
    } else {
      console.log('❌ CRITICAL: VITE_SUPABASE_ANON_KEY is missing');
    }
    
    const hasValidCredentials = supabaseUrl && 
                                supabaseKey && 
                                !supabaseUrl.includes('your_supabase_url_here') && 
                                !supabaseKey.includes('your_supabase_anon_key_here');
    
    console.log('Valid Credentials:', hasValidCredentials ? '✅ Yes' : '❌ No');
    
    if (!hasValidCredentials) {
      console.log('⚠️  MODE: Demo Mode (No Backend)');
      console.log('🎯 CAUSE: Missing or invalid environment variables');
      console.log('🔧 SOLUTION: Configure Netlify environment variables');
      console.log('');
      console.log('📋 NETLIFY SETUP INSTRUCTIONS:');
      console.log('1. Go to https://app.netlify.com');
      console.log('2. Select your site: agiagentautomation');
      console.log('3. Go to Site Settings → Environment Variables');
      console.log('4. Click "Add variable"');
      console.log('5. Add Variable 1:');
      console.log('   Name: VITE_SUPABASE_URL');
      console.log('   Value: https://lywdzvfibhzbljrgovwr.supabase.co');
      console.log('6. Add Variable 2:');
      console.log('   Name: VITE_SUPABASE_ANON_KEY');
      console.log('   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw');
      console.log('7. Click "Save" for each variable');
      console.log('8. Go to Deploys tab');
      console.log('9. Click "Trigger deploy" → "Deploy site"');
      console.log('10. Wait 2-3 minutes for deployment');
    } else {
      console.log('✅ MODE: Production Mode (Real Backend)');
      console.log('🎯 CAUSE: Environment variables are correctly configured');
      console.log('🔧 NEXT: Check for other issues (network, Supabase status, etc.)');
    }

    // If no valid credentials, immediately set loading to false for demo mode
    if (!hasValidCredentials) {
      console.log('No valid Supabase credentials - running in demo mode');
      setLoading(false);
      return;
    }

    // Check for existing session with timeout
    const checkSession = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Auth check timeout - setting loading to false');
            setLoading(false);
          }
        }, 5000); // 5 second timeout for initial auth check

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

    // Only set up auth listener if we have valid credentials
    let subscription: any = null;
    
    if (hasValidCredentials && typeof supabase?.auth?.onAuthStateChange === 'function') {
      try {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
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
        subscription = data?.subscription;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Login attempt started for:', email);
      setLoading(true);
      
      // Check if Supabase is configured properly
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const hasValidCredentials = supabaseUrl && 
                                  supabaseKey && 
                                  !supabaseUrl.includes('your_supabase_url_here') && 
                                  !supabaseKey.includes('your_supabase_anon_key_here');
      
      if (!hasValidCredentials) {
        console.warn('Supabase not configured - using demo mode');
        setLoading(false);
        
        // Check for demo credentials
        if (email === 'demo@example.com' && password === 'demo123') {
          // Create a demo user for testing
          const demoUser = {
            id: 'demo-user-123',
            email: email,
            name: 'Demo User',
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
        } else {
          return { 
            success: false, 
            error: 'Demo mode active. Use demo@example.com / demo123 to login, or configure Supabase for full functionality.' 
          };
        }
      }
      
      // Simple timeout to prevent infinite loading
      const loginTimeout = setTimeout(() => {
        console.warn('Login timeout - forcing loading to false');
        setLoading(false);
        clearTimeout(loginTimeout);
      }, 8000); // 8 second timeout for login
      
      const { user: authUser, error } = await authService.login({ email, password });
      
      clearTimeout(loginTimeout);
      console.log('Login result:', { authUser: !!authUser, error });
      
      if (error || !authUser) {
        setLoading(false);
        return { success: false, error: error || 'Login failed' };
      }

      setUser(authUser);
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