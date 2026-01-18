/**
 * Settings React Query Hooks
 * Server state management for user settings and profile using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/stores/query-client';
import settingsService, {
  UserProfile,
  UserSettings,
  APIKey,
} from '../services/user-preferences';
import { toast } from 'sonner';

/**
 * Fetch user profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.settings.profile(),
    queryFn: async (): Promise<UserProfile | null> => {
      const { data, error } = await settingsService.getProfile();
      if (error) {
        console.error('[SettingsQuery] Profile error:', error);
        return null;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - profile rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch user settings
 */
export function useUserSettings() {
  return useQuery({
    queryKey: queryKeys.settings.preferences(),
    queryFn: async (): Promise<UserSettings> => {
      const { data, error } = await settingsService.getSettings();
      if (error) {
        console.error('[SettingsQuery] Settings error:', error);
        // Return default settings on error
        return {
          email_notifications: true,
          push_notifications: true,
          workflow_alerts: true,
          employee_updates: true,
          system_maintenance: true,
          marketing_emails: false,
          weekly_reports: true,
          instant_alerts: true,
          two_factor_enabled: false,
          session_timeout: 60,
          theme: 'dark',
          auto_save: true,
          debug_mode: false,
          analytics_enabled: true,
          cache_size: '1GB',
          backup_frequency: 'daily',
          retention_period: 30,
          max_concurrent_jobs: 10,
          default_ai_provider: 'openai',
          default_ai_model: 'gpt-4o',
          prefer_streaming: true,
          ai_temperature: 0.7,
          ai_max_tokens: 4000,
        };
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch API keys
 */
export function useAPIKeys() {
  return useQuery({
    queryKey: queryKeys.settings.apiKeys(),
    queryFn: async (): Promise<APIKey[]> => {
      const { data, error } = await settingsService.getAPIKeys();
      if (error) {
        console.error('[SettingsQuery] API keys error:', error);
        return [];
      }
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Update user profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Partial<UserProfile>) => {
      const { error } = await settingsService.updateProfile(profile);
      if (error) {
        throw new Error(error);
      }
      return profile;
    },
    onMutate: async (newProfile) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.settings.profile(),
      });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<UserProfile | null>(
        queryKeys.settings.profile()
      );

      // Optimistically update
      queryClient.setQueryData<UserProfile | null>(
        queryKeys.settings.profile(),
        (old) => (old ? { ...old, ...newProfile } : null)
      );

      return { previousProfile };
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousProfile !== undefined) {
        queryClient.setQueryData(
          queryKeys.settings.profile(),
          context.previousProfile
        );
      }
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.profile(),
      });
    },
  });
}

/**
 * Update user settings mutation
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const { error } = await settingsService.updateSettings(settings);
      if (error) {
        throw new Error(error);
      }
      return settings;
    },
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.settings.preferences(),
      });

      const previousSettings = queryClient.getQueryData<UserSettings>(
        queryKeys.settings.preferences()
      );

      queryClient.setQueryData<UserSettings>(
        queryKeys.settings.preferences(),
        (old) => (old ? { ...old, ...newSettings } : newSettings)
      );

      return { previousSettings };
    },
    onSuccess: () => {
      toast.success('Settings updated successfully');
    },
    onError: (error, _variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          queryKeys.settings.preferences(),
          context.previousSettings
        );
      }
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.preferences(),
      });
    },
  });
}

/**
 * Upload avatar mutation
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const { data: url, error } = await settingsService.uploadAvatar(file);
      if (error) {
        throw new Error(error);
      }
      return url;
    },
    onSuccess: (url) => {
      // Update profile with new avatar URL
      queryClient.setQueryData<UserProfile | null>(
        queryKeys.settings.profile(),
        (old) => (old ? { ...old, avatar_url: url } : null)
      );
      toast.success('Avatar uploaded successfully');
    },
    onError: (error) => {
      console.error('Error uploading avatar:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload avatar'
      );
    },
  });
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({
      newPassword,
      confirmPassword,
    }: {
      newPassword: string;
      confirmPassword: string;
    }) => {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const { error } = await settingsService.changePassword(newPassword);
      if (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      console.error('Error changing password:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to change password'
      );
    },
  });
}

/**
 * Create API key mutation
 */
export function useCreateAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!name.trim()) {
        throw new Error('Please enter a name for the API key');
      }

      const { data, error, fullKey } = await settingsService.createAPIKey(name);
      if (error || !data) {
        throw new Error(error || 'Failed to create API key');
      }

      return { apiKey: data, fullKey: fullKey || '' };
    },
    onSuccess: ({ apiKey }) => {
      // Add to cache
      queryClient.setQueryData<APIKey[]>(queryKeys.settings.apiKeys(), (old) =>
        old ? [apiKey, ...old] : [apiKey]
      );
      toast.success('API key generated successfully');
    },
    onError: (error) => {
      console.error('Error generating API key:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate API key'
      );
    },
  });
}

/**
 * Delete API key mutation
 */
export function useDeleteAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await settingsService.deleteAPIKey(keyId);
      if (error) {
        throw new Error(error);
      }
      return keyId;
    },
    onSuccess: (keyId) => {
      // Remove from cache
      queryClient.setQueryData<APIKey[]>(queryKeys.settings.apiKeys(), (old) =>
        old?.filter((k) => k.id !== keyId)
      );
      toast.success('API key deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting API key:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete API key'
      );
    },
  });
}

/**
 * Toggle 2FA mutation
 */
export function useToggle2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = enabled
        ? await settingsService.enable2FA()
        : await settingsService.disable2FA();

      if (error) {
        throw new Error(error);
      }
      return enabled;
    },
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.settings.preferences(),
      });

      const previousSettings = queryClient.getQueryData<UserSettings>(
        queryKeys.settings.preferences()
      );

      queryClient.setQueryData<UserSettings>(
        queryKeys.settings.preferences(),
        (old) => (old ? { ...old, two_factor_enabled: enabled } : old)
      );

      return { previousSettings };
    },
    onSuccess: (enabled) => {
      toast.success(`2FA ${enabled ? 'enabled' : 'disabled'} successfully`);
    },
    onError: (error, enabled, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          queryKeys.settings.preferences(),
          context.previousSettings
        );
      }
      console.error('Error toggling 2FA:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${enabled ? 'enable' : 'disable'} 2FA`
      );
    },
  });
}

/**
 * Invalidate all settings queries
 */
export function useInvalidateSettingsQueries() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all() });
  };
}

/**
 * Combined hook for loading all settings data at once
 * Useful for settings page initialization
 */
export function useAllSettingsData() {
  const profileQuery = useUserProfile();
  const settingsQuery = useUserSettings();
  const apiKeysQuery = useAPIKeys();

  return {
    profile: profileQuery.data,
    settings: settingsQuery.data,
    apiKeys: apiKeysQuery.data ?? [],
    isLoading:
      profileQuery.isLoading ||
      settingsQuery.isLoading ||
      apiKeysQuery.isLoading,
    isError:
      profileQuery.isError || settingsQuery.isError || apiKeysQuery.isError,
    error: profileQuery.error || settingsQuery.error || apiKeysQuery.error,
    refetch: () => {
      profileQuery.refetch();
      settingsQuery.refetch();
      apiKeysQuery.refetch();
    },
  };
}
