/**
 * Authentication Store Unit Tests
 * Tests for the Zustand authentication store state management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './authentication-store';
import type { AuthUser, AuthResponse } from '@core/auth/authentication-manager';

// Mock the auth service
vi.mock('@core/auth/authentication-manager', () => ({
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

// Mock the logger
vi.mock('@shared/lib/logger', () => ({
  logger: {
    auth: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock other stores that are cleaned up on logout
vi.mock('./workforce-store', () => ({
  useWorkforceStore: {
    getState: vi.fn(() => ({ reset: vi.fn() })),
  },
  cleanupWorkforceSubscription: vi.fn(),
}));

vi.mock('./mission-control-store', () => ({
  useMissionStore: {
    getState: vi.fn(() => ({ reset: vi.fn() })),
  },
  stopMissionCleanupInterval: vi.fn(),
}));

vi.mock('./notification-store', () => ({
  useNotificationStore: {
    getState: vi.fn(() => ({ clearAll: vi.fn() })),
  },
}));

vi.mock('./chat-store', () => ({
  useChatStore: {
    getState: vi.fn(() => ({ clearHistory: vi.fn() })),
  },
}));

vi.mock('./multi-agent-chat-store', () => ({
  useMultiAgentChatStore: {
    getState: vi.fn(() => ({ reset: vi.fn() })),
  },
}));

vi.mock('./usage-warning-store', () => ({
  useUsageWarningStore: {
    getState: vi.fn(() => ({ resetWarnings: vi.fn() })),
  },
}));

vi.mock('./artifact-store', () => ({
  useArtifactStore: {
    getState: vi.fn(() => ({ clearAllArtifacts: vi.fn() })),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Authentication Store', () => {
  let mockAuthService: typeof import('@core/auth/authentication-manager').authService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset the store state
    useAuthStore.getState().reset();

    // Import the mocked auth service
    const authModule = await import('@core/auth/authentication-manager');
    mockAuthService = authModule.authService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should start with correct initial state', () => {
      useAuthStore.getState().reset();
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.initialized).toBe(false);
    });
  });

  describe('Login', () => {
    const mockUser: AuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      plan: 'free',
    };

    it('should login successfully and update state', async () => {
      vi.mocked(mockAuthService.login).mockResolvedValue({
        user: mockUser,
        error: null,
      });

      const result = await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle login failure and set error', async () => {
      vi.mocked(mockAuthService.login).mockResolvedValue({
        user: null,
        error: 'Invalid credentials',
      });

      const result = await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should set loading state during login', async () => {
      let loadingDuringCall = false;

      vi.mocked(mockAuthService.login).mockImplementation(async () => {
        loadingDuringCall = useAuthStore.getState().isLoading;
        return { user: mockUser, error: null };
      });

      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(loadingDuringCall).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle unexpected errors during login', async () => {
      vi.mocked(mockAuthService.login).mockRejectedValue(
        new Error('Network error')
      );

      const result = await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('Register', () => {
    const mockUser: AuthUser = {
      id: 'user-456',
      email: 'newuser@example.com',
      name: 'New User',
      role: 'user',
      plan: 'free',
    };

    it('should register successfully and update state', async () => {
      vi.mocked(mockAuthService.register).mockResolvedValue({
        user: mockUser,
        error: null,
      });

      const result = await useAuthStore.getState().register({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle registration failure', async () => {
      vi.mocked(mockAuthService.register).mockResolvedValue({
        user: null,
        error: 'Email already exists',
      });

      const result = await useAuthStore.getState().register({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle unexpected registration errors', async () => {
      vi.mocked(mockAuthService.register).mockRejectedValue(
        new Error('Server error')
      );

      const result = await useAuthStore.getState().register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  describe('Logout', () => {
    it('should logout and reset state', async () => {
      // First, set authenticated state
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        plan: 'free',
      };

      vi.mocked(mockAuthService.login).mockResolvedValue({
        user: mockUser,
        error: null,
      });

      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Now logout
      vi.mocked(mockAuthService.logout).mockResolvedValue({ error: null });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.initialized).toBe(false);
    });

    it('should cleanup other stores on logout', async () => {
      const { cleanupWorkforceSubscription } = await import('./workforce-store');

      vi.mocked(mockAuthService.logout).mockResolvedValue({ error: null });

      await useAuthStore.getState().logout();

      expect(cleanupWorkforceSubscription).toHaveBeenCalled();
    });
  });

  describe('Fetch User', () => {
    it('should fetch current user successfully', async () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        plan: 'pro',
      };

      vi.mocked(mockAuthService.getCurrentUser).mockResolvedValue({
        user: mockUser,
        error: null,
      });

      await useAuthStore.getState().fetchUser();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle fetch user error', async () => {
      vi.mocked(mockAuthService.getCurrentUser).mockResolvedValue({
        user: null,
        error: 'Session expired',
      });

      await useAuthStore.getState().fetchUser();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Password Management', () => {
    it('should reset password successfully', async () => {
      vi.mocked(mockAuthService.resetPassword).mockResolvedValue({
        error: null,
      });

      const result = await useAuthStore
        .getState()
        .resetPassword('test@example.com');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle reset password failure', async () => {
      vi.mocked(mockAuthService.resetPassword).mockResolvedValue({
        error: 'User not found',
      });

      const result = await useAuthStore
        .getState()
        .resetPassword('nonexistent@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should update password successfully', async () => {
      vi.mocked(mockAuthService.updatePassword).mockResolvedValue({
        error: null,
      });

      const result = await useAuthStore
        .getState()
        .updatePassword('newpassword123');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should change password successfully', async () => {
      vi.mocked(mockAuthService.changePassword).mockResolvedValue({
        error: null,
      });

      const result = await useAuthStore
        .getState()
        .changePassword('oldpassword', 'newpassword');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle incorrect current password', async () => {
      vi.mocked(mockAuthService.changePassword).mockResolvedValue({
        error: 'Current password is incorrect',
      });

      const result = await useAuthStore
        .getState()
        .changePassword('wrongpassword', 'newpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current password is incorrect');
    });
  });

  describe('Profile Updates', () => {
    it('should update profile successfully', async () => {
      const updatedUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Updated Name',
        avatar: 'new-avatar.jpg',
        role: 'user',
        plan: 'pro',
      };

      vi.mocked(mockAuthService.updateProfile).mockResolvedValue({
        user: updatedUser,
        error: null,
      });

      const result = await useAuthStore.getState().updateProfile({
        name: 'Updated Name',
        avatar: 'new-avatar.jpg',
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      const state = useAuthStore.getState();
      expect(state.user?.name).toBe('Updated Name');
      expect(state.user?.avatar).toBe('new-avatar.jpg');
    });

    it('should handle profile update failure', async () => {
      vi.mocked(mockAuthService.updateProfile).mockResolvedValue({
        user: null,
        error: 'Update failed',
      });

      const result = await useAuthStore.getState().updateProfile({
        name: 'New Name',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('State Management Actions', () => {
    it('should update user directly', () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        plan: 'free',
      };

      useAuthStore.getState().updateUser(user);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set and clear error', () => {
      useAuthStore.getState().setError('Test error message');
      expect(useAuthStore.getState().error).toBe('Test error message');

      useAuthStore.getState().setError(null);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should reset state completely', () => {
      // Set some state
      const user: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        plan: 'free',
      };

      useAuthStore.getState().updateUser(user);
      useAuthStore.getState().setError('Some error');

      // Reset
      useAuthStore.getState().reset();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.initialized).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user in updateUser', () => {
      useAuthStore.getState().updateUser(null as unknown as AuthUser);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle non-Error exceptions in login', async () => {
      vi.mocked(mockAuthService.login).mockRejectedValue('String error');

      const result = await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('String error');
    });

    it('should handle non-Error exceptions in register', async () => {
      vi.mocked(mockAuthService.register).mockRejectedValue({ custom: 'error' });

      const result = await useAuthStore.getState().register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
      });

      expect(result.success).toBe(false);
      // Should stringify the object
      expect(result.error).toBeDefined();
    });
  });
});
