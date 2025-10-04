import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type User = Database['public']['Tables']['users']['Row'];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  company?: string;
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
  company?: string;
  phone?: string;
  location?: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}

class AuthService {
  private isDemoMode(): boolean {
    return import.meta.env.VITE_DEMO_MODE === 'true';
  }

// Replace the existing login function in src/services/authService.ts with this:

async login(loginData: LoginData): Promise<AuthResponse> {
  try {
    // Handle demo mode separately at the top for clarity.
    if (this.isDemoMode()) {
      console.log('AuthService: Running in demo mode');
      if (loginData.email === 'demo@example.com' && loginData.password === 'demo123') {
        const demoUser: AuthUser = {
          id: 'demo-user-123',
          email: loginData.email,
          name: 'Demo User',
          avatar: '',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        };
        return { user: demoUser, error: null };
      }
      return { user: null, error: 'Invalid demo credentials. Use demo@example.com / demo123' };
    }

    // Single, direct call to Supabase for authentication.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    // If Supabase returns an error, immediately return it.
    if (error) {
      return { user: null, error: error.message };
    }

    // If there's no error, but also no user data, return a clear error message.
    if (!data || !data.user) {
      return { user: null, error: 'Authentication succeeded but no user data was found.' };
    }

    // Fetch the user's profile from the 'users' table.
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return { user: null, error: 'Failed to fetch user profile: ' + profileError.message };
    }

    // Ensure the profile is correctly typed before returning.
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

  } catch (err) {
    console.error('A critical error occurred in authService.login:', err);
    return { user: null, error: 'An unexpected server error occurred.' };
  }
}

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Check if we're in demo mode
      if (this.isDemoMode()) {
        console.log('AuthService: Registration in demo mode');
        return { user: null, error: 'Registration is disabled in demo mode. Please configure Supabase for full functionality.' };
      }

      console.log('AuthService: Starting registration for:', userData.email);

      // Sign up with metadata - this will trigger the database function to create the user profile
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            company: userData.company || '',
            phone: userData.phone || '',
            location: userData.location || '',
            role: 'user',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('AuthService: Registration error:', error.message);
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user data returned from signup' };
      }

      console.log('AuthService: User created in auth.users:', data.user.id);

      // Check if email confirmation is required
      if (!data.session) {
        console.log('AuthService: Email confirmation required for:', data.user.email);
        return {
          user: null,
          error: 'Registration successful! Please check your email and click the confirmation link to activate your account.'
        };
      }

      // Create user profile in database (no trigger, we handle it directly)
      console.log('AuthService: Creating user profile for:', data.user.id);
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          company: userData.company || null,
          phone: userData.phone || null,
          location: userData.location || null,
          role: 'user',
          avatar: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('AuthService: Failed to create profile:', createError);
        return { user: null, error: 'Account created but profile setup failed. Please try again or contact support.' };
      }

      const authUser: AuthUser = {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        avatar: newProfile.avatar,
        role: newProfile.role,
        created_at: newProfile.created_at,
        updated_at: newProfile.updated_at,
        last_login: newProfile.last_login,
        is_active: newProfile.is_active !== false,
        preferences: newProfile.preferences,
        phone: newProfile.phone,
        location: newProfile.location,
      };

      console.log('AuthService: Registration successful for:', authUser.email);
      return { user: authUser, error: null };
    } catch (error) {
      console.error('AuthService: Unexpected error during registration:', error);
      return { user: null, error: 'An unexpected error occurred during registration. Please try again.' };
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
      
      console.log('AuthService: Attempting to get current user from Supabase...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase connection timeout')), 8000);
      });
      
      const userPromise = supabase.auth.getUser();
      const { data: { user }, error } = await Promise.race([userPromise, timeoutPromise]);
      
      console.log('AuthService: Supabase getUser completed');

      if (error) {
        console.error('AuthService: Supabase getUser error:', error);
        console.log('AuthService: This may be a temporary Supabase connectivity issue');
        return { user: null, error: error.message };
      }

      if (!user) {
        console.log('AuthService: No user found in session');
        return { user: null, error: 'No user found' };
      }

      console.log('AuthService: User found:', user.email);

      // Get user profile with proper headers
      console.log('AuthService: Fetching user profile for ID:', user.id);
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('AuthService: Creating user profile for:', user.email);
          console.log('AuthService: Creating user profile with RLS-compliant data');
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: user.id, // This must match auth.uid() for RLS to work
              email: user.email || '',
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              avatar: user.user_metadata?.avatar_url || null,
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_active: true,
              phone: user.user_metadata?.phone || null,
              location: user.user_metadata?.location || null,
            })
            .select()
            .single();

          if (createError || !newProfile) {
            console.error('Profile creation error:', createError);
            console.log('AuthService: Falling back to basic user object');
            // Fallback to basic user object if profile creation fails
            const fallbackUser: AuthUser = {
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              avatar: user.user_metadata?.avatar_url || null,
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_login: null,
              is_active: true,
              preferences: null,
              phone: user.user_metadata?.phone || null,
              location: user.user_metadata?.location || null,
            };
            return { user: fallbackUser, error: null };
          }
          
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

          return { user: authUser, error: null };
        }
        return { user: null, error: 'Failed to fetch user profile: ' + profileError.message };
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
      console.error('AuthService getCurrentUser error:', error);
      if (error instanceof Error && error.message === 'Supabase connection timeout') {
        console.log('Supabase connection timed out - this may be a network issue');
        return { user: null, error: 'Connection timeout - please try again' };
      }
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
