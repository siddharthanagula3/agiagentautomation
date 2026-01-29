/**
 * User Profile Store Tests
 *
 * Tests for user profile state management including
 * user data, profile updates, and billing information.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUserProfileStore } from './user-profile-store';
import type { UserProfile } from './user-profile-store';

// Helper to create mock user profile
const createMockUserProfile = (
  overrides: Partial<UserProfile> = {}
): UserProfile => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  plan: 'free',
  role: 'user',
  permissions: ['read', 'write'],
  profile: {
    firstName: 'Test',
    lastName: 'User',
    timezone: 'UTC',
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
    },
    ...overrides.profile,
  },
  billing: {
    customerId: 'cus_test123',
    subscriptionStatus: 'active',
    ...overrides.billing,
  },
  usage: {
    tokensUsed: 50000,
    tokensLimit: 1000000,
    jobsCompleted: 10,
    employeesPurchased: 2,
    ...overrides.usage,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

describe('User Profile Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useUserProfileStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useUserProfileStore.getState();

      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should set user', () => {
      const { setUser } = useUserProfileStore.getState();
      const user = createMockUserProfile();

      setUser(user);

      const state = useUserProfileStore.getState();
      expect(state.user).toEqual(user);
    });

    it('should clear user when set to null', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile());
      setUser(null);

      expect(useUserProfileStore.getState().user).toBeNull();
    });

    it('should replace existing user', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile({ name: 'First User' }));
      setUser(createMockUserProfile({ name: 'Second User' }));

      expect(useUserProfileStore.getState().user?.name).toBe('Second User');
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', () => {
      const { setUser, updateProfile } = useUserProfileStore.getState();

      setUser(createMockUserProfile());

      vi.setSystemTime(new Date('2024-02-01'));
      updateProfile({ firstName: 'Updated', lastName: 'Name' });

      const state = useUserProfileStore.getState();
      expect(state.user?.profile.firstName).toBe('Updated');
      expect(state.user?.profile.lastName).toBe('Name');
      expect(state.user?.updatedAt).toEqual(new Date('2024-02-01'));
    });

    it('should handle partial profile update', () => {
      const { setUser, updateProfile } = useUserProfileStore.getState();

      setUser(createMockUserProfile());
      updateProfile({ company: 'New Company' });

      const state = useUserProfileStore.getState();
      expect(state.user?.profile.company).toBe('New Company');
      expect(state.user?.profile.firstName).toBe('Test'); // Unchanged
    });

    it('should do nothing if user is null', () => {
      const { updateProfile } = useUserProfileStore.getState();

      // Should not throw
      expect(() => {
        updateProfile({ firstName: 'Test' });
      }).not.toThrow();

      expect(useUserProfileStore.getState().user).toBeNull();
    });

    it('should update preferences', () => {
      const { setUser, updateProfile } = useUserProfileStore.getState();

      setUser(createMockUserProfile());
      updateProfile({
        preferences: {
          emailNotifications: false,
          pushNotifications: false,
          marketingEmails: true,
        },
      });

      const state = useUserProfileStore.getState();
      expect(state.user?.profile.preferences.emailNotifications).toBe(false);
      expect(state.user?.profile.preferences.marketingEmails).toBe(true);
    });
  });

  describe('updateUser', () => {
    it('should update user fields', () => {
      const { setUser, updateUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile());

      vi.setSystemTime(new Date('2024-02-01'));
      updateUser({ plan: 'pro', name: 'New Name' });

      const state = useUserProfileStore.getState();
      expect(state.user?.plan).toBe('pro');
      expect(state.user?.name).toBe('New Name');
      expect(state.user?.updatedAt).toEqual(new Date('2024-02-01'));
    });

    it('should update billing information', () => {
      const { setUser, updateUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile());
      updateUser({
        billing: {
          customerId: 'cus_new',
          subscriptionId: 'sub_123',
          subscriptionStatus: 'trialing',
          trialEndsAt: new Date('2024-03-01'),
        },
      });

      const state = useUserProfileStore.getState();
      expect(state.user?.billing.subscriptionStatus).toBe('trialing');
      expect(state.user?.billing.trialEndsAt).toEqual(new Date('2024-03-01'));
    });

    it('should update usage information', () => {
      const { setUser, updateUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile());
      updateUser({
        usage: {
          tokensUsed: 100000,
          tokensLimit: 1000000,
          jobsCompleted: 25,
          employeesPurchased: 5,
        },
      });

      const state = useUserProfileStore.getState();
      expect(state.user?.usage.tokensUsed).toBe(100000);
      expect(state.user?.usage.jobsCompleted).toBe(25);
    });

    it('should do nothing if user is null', () => {
      const { updateUser } = useUserProfileStore.getState();

      expect(() => {
        updateUser({ plan: 'pro' });
      }).not.toThrow();

      expect(useUserProfileStore.getState().user).toBeNull();
    });

    it('should update role and permissions', () => {
      const { setUser, updateUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile());
      updateUser({
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin'],
      });

      const state = useUserProfileStore.getState();
      expect(state.user?.role).toBe('admin');
      expect(state.user?.permissions).toContain('admin');
    });
  });

  describe('Loading State', () => {
    it('should set loading state', () => {
      const { setLoading } = useUserProfileStore.getState();

      setLoading(true);
      expect(useUserProfileStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useUserProfileStore.getState().isLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should set error', () => {
      const { setError } = useUserProfileStore.getState();

      setError('Failed to load user');
      expect(useUserProfileStore.getState().error).toBe('Failed to load user');
    });

    it('should clear error', () => {
      const { setError, clearError } = useUserProfileStore.getState();

      setError('Error');
      clearError();

      expect(useUserProfileStore.getState().error).toBeNull();
    });

    it('should set error to null', () => {
      const { setError } = useUserProfileStore.getState();

      setError('Error');
      setError(null);

      expect(useUserProfileStore.getState().error).toBeNull();
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      const { setUser, setLoading, setError, reset } =
        useUserProfileStore.getState();

      setUser(createMockUserProfile());
      setLoading(true);
      setError('Error');

      reset();

      const state = useUserProfileStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid updates', () => {
      const { setUser, updateUser, updateProfile } =
        useUserProfileStore.getState();

      setUser(createMockUserProfile());

      updateUser({ plan: 'pro' });
      updateProfile({ firstName: 'New' });
      updateUser({ name: 'Different' });
      updateProfile({ bio: 'Test bio' });

      const state = useUserProfileStore.getState();
      expect(state.user?.plan).toBe('pro');
      expect(state.user?.profile.firstName).toBe('New');
      expect(state.user?.name).toBe('Different');
      expect(state.user?.profile.bio).toBe('Test bio');
    });

    it('should preserve unrelated fields during updates', () => {
      const { setUser, updateProfile } = useUserProfileStore.getState();

      const originalUser = createMockUserProfile({
        id: 'original-id',
        email: 'original@test.com',
      });
      setUser(originalUser);

      updateProfile({ firstName: 'Updated' });

      const state = useUserProfileStore.getState();
      expect(state.user?.id).toBe('original-id');
      expect(state.user?.email).toBe('original@test.com');
    });

    it('should handle empty string updates', () => {
      const { setUser, updateProfile } = useUserProfileStore.getState();

      setUser(createMockUserProfile());
      updateProfile({ bio: '' });

      expect(useUserProfileStore.getState().user?.profile.bio).toBe('');
    });

    it('should handle undefined values in updates', () => {
      const { setUser, updateProfile } = useUserProfileStore.getState();

      setUser(createMockUserProfile());
      updateProfile({ company: undefined });

      // undefined should still be set
      expect(useUserProfileStore.getState().user?.profile.company).toBeUndefined();
    });
  });

  describe('Plan Types', () => {
    it('should support free plan', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile({ plan: 'free' }));
      expect(useUserProfileStore.getState().user?.plan).toBe('free');
    });

    it('should support pro plan', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile({ plan: 'pro' }));
      expect(useUserProfileStore.getState().user?.plan).toBe('pro');
    });

    it('should support enterprise plan', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile({ plan: 'enterprise' }));
      expect(useUserProfileStore.getState().user?.plan).toBe('enterprise');
    });
  });

  describe('Role Types', () => {
    it('should support user role', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile({ role: 'user' }));
      expect(useUserProfileStore.getState().user?.role).toBe('user');
    });

    it('should support admin role', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile({ role: 'admin' }));
      expect(useUserProfileStore.getState().user?.role).toBe('admin');
    });

    it('should support moderator role', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(createMockUserProfile({ role: 'moderator' }));
      expect(useUserProfileStore.getState().user?.role).toBe('moderator');
    });
  });

  describe('Subscription Status', () => {
    it('should handle active subscription', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(
        createMockUserProfile({
          billing: { subscriptionStatus: 'active' },
        })
      );
      expect(useUserProfileStore.getState().user?.billing.subscriptionStatus).toBe('active');
    });

    it('should handle canceled subscription', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(
        createMockUserProfile({
          billing: { subscriptionStatus: 'canceled' },
        })
      );
      expect(useUserProfileStore.getState().user?.billing.subscriptionStatus).toBe('canceled');
    });

    it('should handle past_due subscription', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(
        createMockUserProfile({
          billing: { subscriptionStatus: 'past_due' },
        })
      );
      expect(useUserProfileStore.getState().user?.billing.subscriptionStatus).toBe('past_due');
    });

    it('should handle trialing subscription', () => {
      const { setUser } = useUserProfileStore.getState();

      setUser(
        createMockUserProfile({
          billing: {
            subscriptionStatus: 'trialing',
            trialEndsAt: new Date('2024-03-01'),
          },
        })
      );
      const billing = useUserProfileStore.getState().user?.billing;
      expect(billing?.subscriptionStatus).toBe('trialing');
      expect(billing?.trialEndsAt).toEqual(new Date('2024-03-01'));
    });
  });
});
