import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth-service';

// Mock Supabase client
vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

describe('AuthService', () => {
  let mockSupabase: unknown;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { supabase } = await import('@shared/lib/supabase-client');
    mockSupabase = supabase;
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          role: 'user',
          plan: 'free',
        },
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result.user).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        avatar: undefined,
        role: 'user',
        plan: 'free',
        user_metadata: mockUser.user_metadata,
      });
      expect(result.error).toBeNull();
    });

    it('should return error when no user found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result.user).toBeNull();
      expect(result.error).toBe('No user found');
    });

    it('should handle Supabase errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Network error' },
      });

      const result = await authService.getCurrentUser();

      expect(result.user).toBeNull();
      expect(result.error).toBe('Network error');
    });

    it('should handle timeout errors', async () => {
      mockSupabase.auth.getUser.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Auth timeout - possible invalid token')),
              100
            )
          )
      );

      const result = await authService.getCurrentUser();

      expect(result.user).toBeNull();
      expect(result.error).toContain('timeout');
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          role: 'user',
          plan: 'free',
        },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        avatar: undefined,
        role: 'user',
        plan: 'free',
        user_metadata: mockUser.user_metadata,
      });
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.user).toBeNull();
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'newuser@example.com',
        user_metadata: {
          full_name: 'New User',
          company: 'Test Company',
        },
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        company: 'Test Company',
      });

      expect(result.user).toEqual({
        id: '1',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user',
        plan: 'free',
        user_metadata: mockUser.user_metadata,
      });
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'New User',
            name: 'New User',
            company: 'Test Company',
            phone: undefined,
            location: undefined,
          },
        },
      });
    });

    it('should handle registration errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      });

      const result = await authService.register({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      });

      expect(result.user).toBeNull();
      expect(result.error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await authService.logout();

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' },
      });

      const result = await authService.logout();

      expect(result.error).toBe('Logout failed');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      const result = await authService.resetPassword('test@example.com');

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );
    });

    it('should handle reset password errors', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'User not found' },
      });

      const result = await authService.resetPassword('nonexistent@example.com');

      expect(result.error).toBe('User not found');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: null,
      });

      const result = await authService.updatePassword('newpassword123');

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });

    it('should handle update password errors', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Password too weak' },
      });

      const result = await authService.updatePassword('weak');

      expect(result.error).toBe('Password too weak');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Updated Name',
          avatar_url: 'new-avatar.jpg',
        },
      };

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.updateProfile({
        name: 'Updated Name',
        avatar: 'new-avatar.jpg',
      });

      expect(result.user).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Updated Name',
        avatar: 'new-avatar.jpg',
        role: 'user',
        plan: 'free',
        user_metadata: mockUser.user_metadata,
      });
      expect(result.error).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        error: null,
      });

      const result = await authService.changePassword(
        'oldpassword',
        'newpassword'
      );

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'oldpassword',
      });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword',
      });
    });

    it('should handle incorrect current password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      const result = await authService.changePassword(
        'wrongpassword',
        'newpassword'
      );

      expect(result.error).toBe('Current password is incorrect');
    });
  });
});
