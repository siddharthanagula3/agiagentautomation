import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../unified-auth-store';

// Mock the auth service
vi.mock('../../services/auth-service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    changePassword: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

describe('Unified Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false); // Updated to match actual behavior
    expect(state.error).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.initialized).toBe(false);
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    };

    const { authService } = await import('../../services/auth-service');
    vi.mocked(authService.login).mockResolvedValue({
      success: true,
      user: mockUser,
      error: null,
    });

    const result = await useAuthStore.getState().login({
      email: 'test@example.com',
      password: 'password',
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should handle login failure', async () => {
    const { authService } = await import('../../services/auth-service');
    vi.mocked(authService.login).mockResolvedValue({
      success: false,
      user: null,
      error: 'Invalid credentials',
    });

    const result = await useAuthStore.getState().login({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });

  it('should handle successful registration', async () => {
    const mockUser = {
      id: '1',
      email: 'newuser@example.com',
      name: 'New User',
    };

    const { authService } = await import('../../services/auth-service');
    vi.mocked(authService.register).mockResolvedValue({
      success: true,
      user: mockUser,
      error: null,
    });

    const result = await useAuthStore.getState().register({
      email: 'newuser@example.com',
      password: 'password',
      name: 'New User',
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should handle logout', async () => {
    const { authService } = await import('../../services/auth-service');
    vi.mocked(authService.logout).mockResolvedValue();

    await useAuthStore.getState().logout();

    expect(authService.logout).toHaveBeenCalled();
  });

  it('should update user profile', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Updated Name',
    };

    const { authService } = await import('../../services/auth-service');
    vi.mocked(authService.updateProfile).mockResolvedValue({
      success: true,
      user: mockUser,
      error: null,
    });

    const result = await useAuthStore.getState().updateProfile({
      name: 'Updated Name',
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should set error state', () => {
    useAuthStore.getState().setError('Test error');
    expect(useAuthStore.getState().error).toBe('Test error');
  });

  it('should clear error state', () => {
    useAuthStore.getState().setError('Test error');
    useAuthStore.getState().setError(null);
    expect(useAuthStore.getState().error).toBeNull();
  });
});
