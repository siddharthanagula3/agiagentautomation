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
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      console.log('🔐 AuthService: Starting login for:', loginData.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        console.log('❌ AuthService: Supabase auth error:', error.message);
        return { user: null, error: error.message };
      }

      if (!data.user) {
        console.log('❌ AuthService: No user data returned from Supabase');
        return { user: null, error: 'No user data returned' };
      }

      console.log('✅ AuthService: Supabase auth successful, fetching profile for:', data.user.id);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.log('⚠️ AuthService: Profile error:', profileError.message, 'Code:', profileError.code);
        
        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
          console.log('🔧 AuthService: Creating user profile for:', data.user.email);
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

          if (createError) {
            console.log('❌ AuthService: Profile creation failed:', createError.message);
            return { user: null, error: `Failed to create user profile: ${createError.message}` };
          }
          
          if (!newProfile) {
            console.log('❌ AuthService: No profile data returned after creation');
            return { user: null, error: 'Failed to create user profile - no data returned' };
          }
          
          console.log('✅ AuthService: Profile created successfully');
          
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

          return { user: authUser, error: null };
        }
        
        console.log('❌ AuthService: Failed to fetch user profile:', profileError.message);
        return { user: null, error: `Failed to fetch user profile: ${profileError.message}` };
      }

      console.log('✅ AuthService: Profile found:', profile.name);
      
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

      console.log('✅ AuthService: Login completed successfully');
      return { user: authUser, error: null };
    } catch (error) {
      console.error('❌ AuthService: Unexpected error:', error);
      return { user: null, error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user data returned' };
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
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      console.error('Service error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async getCurrentUser(): Promise<AuthResponse> {
    try {
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
