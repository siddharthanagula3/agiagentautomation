import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './unified-auth-store';

// Mock the auth service
vi.mock('../services/auth-service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    changePassword: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

describe('Unified Auth Store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false); // Reset function sets loading to false
    expect(result.current.error).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.initialized).toBe(false);
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      avatar: null,
      role: 'user',
      plan: 'free',
      user_metadata: {},
    };

    const { authService } = await import('../services/auth-service');
    vi.mocked(authService.login).mockResolvedValue({
      user: mockUser,
      error: null,
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      const response = await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(response.success).toBe(true);
      expect(response.error).toBeNull();
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle login failure', async () => {
    const { authService } = await import('../services/auth-service');
    vi.mocked(authService.login).mockResolvedValue({
      user: null,
      error: 'Invalid credentials',
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      const response = await result.current.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid credentials');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle successful registration', async () => {
    const mockUser = {
      id: '1',
      email: 'newuser@example.com',
      name: 'New User',
      avatar: null,
      role: 'user',
      plan: 'free',
      user_metadata: {},
    };

    const { authService } = await import('../services/auth-service');
    vi.mocked(authService.register).mockResolvedValue({
      user: mockUser,
      error: null,
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      const response = await result.current.register({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      });
      expect(response.success).toBe(true);
      expect(response.error).toBeNull();
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle logout', async () => {
    const { authService } = await import('../services/auth-service');
    vi.mocked(authService.logout).mockResolvedValue();

    const { result } = renderHook(() => useAuthStore());

    // First set a user
    act(() => {
      result.current.updateUser({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        role: 'user',
        plan: 'free',
        user_metadata: {},
      });
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should handle password reset', async () => {
    const { authService } = await import('../services/auth-service');
    vi.mocked(authService.resetPassword).mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      const response = await result.current.resetPassword('test@example.com');
      expect(response.success).toBe(true);
      expect(response.error).toBeNull();
    });

    expect(authService.resetPassword).toHaveBeenCalledWith('test@example.com');
  });

  it('should handle profile update', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Updated Name',
      avatar: 'avatar-url',
      role: 'user',
      plan: 'free',
      user_metadata: {},
    };

    const { authService } = await import('../services/auth-service');
    vi.mocked(authService.updateProfile).mockResolvedValue({
      user: mockUser,
      error: null,
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      const response = await result.current.updateProfile({
        name: 'Updated Name',
        avatar: 'avatar-url',
      });
      expect(response.success).toBe(true);
      expect(response.error).toBeNull();
    });

    expect(result.current.user).toEqual(mockUser);
    expect(authService.updateProfile).toHaveBeenCalledWith({
      name: 'Updated Name',
      avatar: 'avatar-url',
    });
  });

  it('should handle error state management', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBeNull();
  });
});
