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

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}

class AuthService {
  private isDemoMode(): boolean {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return !supabaseUrl || 
           !supabaseKey || 
           supabaseUrl.includes('your_supabase_url_here') || 
           supabaseKey.includes('your_supabase_anon_key_here');
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      console.log('AuthService: Starting login for', loginData.email);
      
      // Add timeout protection for login
      const loginTimeout = setTimeout(() => {
        console.warn('AuthService: Login timeout - this should not happen');
      }, 10000); // 10 second timeout
      
      // Check if we're in demo mode
      if (this.isDemoMode()) {
        console.log('AuthService: Running in demo mode');
        // Only allow demo credentials in demo mode
        if (loginData.email === 'demo@example.com' && loginData.password === 'demo123') {
          const demoUser: AuthUser = {
            id: 'demo-user-123',
            email: loginData.email,
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
          clearTimeout(loginTimeout);
          return { user: demoUser, error: null };
        }
        clearTimeout(loginTimeout);
        return { user: null, error: 'Invalid demo credentials. Use demo@example.com / demo123' };
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      console.log('AuthService: Supabase auth result', { hasData: !!data, hasError: !!error, error: error?.message });

      if (error) {
        console.log('AuthService: Login error', error.message);
        clearTimeout(loginTimeout);
        return { user: null, error: error.message };
      }

      if (!data.user) {
        clearTimeout(loginTimeout);
        return { user: null, error: 'No user data returned' };
      }

      // Get user profile
      console.log('AuthService: Fetching user profile for', data.user.id);
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      console.log('AuthService: Profile fetch result', { hasProfile: !!profile, hasError: !!profileError, error: profileError?.message });

      if (profileError) {
        console.log('AuthService: Profile error details:', profileError);
        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
          console.log('AuthService: Creating user profile for:', data.user.email);
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              role: 'user',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError || !newProfile) {
            console.log('AuthService: Profile creation failed:', createError);
            return { user: null, error: 'Failed to create user profile: ' + (createError?.message || 'Unknown error') };
          }
          
          // Use the newly created profile
          const authUser: AuthUser = {
            id: newProfile.id,
            email: newProfile.email,
            name: newProfile.name,
            avatar: newProfile.avatar,
            role: newProfile.role,
            created_at: newProfile.created_at,
            updated_at: newProfile.updated_at,
            last_login: newProfile.last_login,
            is_active: newProfile.is_active,
            preferences: newProfile.preferences,
            phone: newProfile.phone,
            location: newProfile.location,
          };

          clearTimeout(loginTimeout);
          return { user: authUser, error: null };
        }
        clearTimeout(loginTimeout);
        return { user: null, error: 'Failed to fetch user profile' };
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

      return { user: authUser, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Check if we're in demo mode
      if (this.isDemoMode()) {
        console.log('AuthService: Registration in demo mode');
        return { user: null, error: 'Registration is disabled in demo mode. Please configure Supabase for full functionality.' };
      }
      
      // Add timeout protection for registration
      const registrationTimeout = setTimeout(() => {
        console.warn('Registration timeout - this should not happen');
      }, 10000); // 10 second timeout
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });
      
      clearTimeout(registrationTimeout);

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user data returned' };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('AuthService: Email confirmation required for:', data.user.email);
        return { 
          user: null, 
          error: 'Please check your email and click the confirmation link to complete registration.' 
        };
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          location: userData.location,
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) {
        return { user: null, error: 'Failed to create user profile' };
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

      return { user: authUser, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  async logout(): Promise<{ error: string | null }> {
    try {
      // Check if we're in demo mode
      if (this.isDemoMode()) {
        console.log('AuthService: Logout in demo mode');
        return { error: null };
      }
      
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async getCurrentUser(): Promise<AuthResponse> {
    try {
      // Check if we're in demo mode
      if (this.isDemoMode()) {
        console.log('AuthService: getCurrentUser - Demo mode, no user session');
        return { user: null, error: 'No session in demo mode' };
      }
      
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        return { user: null, error: error.message };
      }

      if (!user) {
        return { user: null, error: 'No user found' };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return { user: null, error: 'Failed to fetch user profile' };
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

      return { user: authUser, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { user: null, error: error.message };
      }

      const authUser: AuthUser = {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        role: data.role,
        created_at: data.created_at,
        updated_at: data.updated_at,
        last_login: data.last_login,
        is_active: data.is_active,
        preferences: data.preferences,
        phone: data.phone,
        location: data.location,
      };

      return { user: authUser, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  async deleteAccount(userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }
}

export const authService = new AuthService();
