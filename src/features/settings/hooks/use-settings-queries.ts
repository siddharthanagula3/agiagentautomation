/**
 * Settings React Query Hooks
 * Server state management for user settings and profile using React Query
 *
 * @module features/settings/hooks/use-settings-queries
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
  type QueryClient,
} from '@tanstack/react-query';
import { queryKeys } from '@shared/stores/query-client';
import settingsService, {
  type UserProfile,
  type UserSettings,
  type APIKey,
} from '../services/user-preferences';
import { toast } from 'sonner';
import { logger } from '@shared/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * API key creation result
 */
export interface CreateAPIKeyResult {
  apiKey: APIKey;
  fullKey: string;
}

/**
 * Password change parameters
 */
export interface ChangePasswordParams {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Optimistic update context for profile mutations
 */
interface ProfileMutationContext {
  previousProfile: UserProfile | null | undefined;
}

/**
 * Optimistic update context for settings mutations
 */
interface SettingsMutationContext {
  previousSettings: UserSettings | undefined;
}

/**
 * Combined settings data result
 */
export interface AllSettingsData {
  profile: UserProfile | null | undefined;
  settings: UserSettings | undefined;
  apiKeys: APIKey[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch user profile
 *
 * @returns UseQueryResult with UserProfile or null
 */
export function useUserProfile(): UseQueryResult<UserProfile | null, Error> {
  return useQuery<UserProfile | null, Error>({
    queryKey: queryKeys.settings.profile(),
    queryFn: async (): Promise<UserProfile | null> => {
      const { data, error } = await settingsService.getProfile();
      if (error) {
        logger.error('[SettingsQuery] Profile error:', error);
        return null;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - profile rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: 'Failed to load user profile',
    },
  });
}

/**
 * Fetch user settings
 *
 * @returns UseQueryResult with UserSettings
 */
export function useUserSettings(): UseQueryResult<UserSettings, Error> {
  return useQuery<UserSettings, Error>({
    queryKey: queryKeys.settings.preferences(),
    queryFn: async (): Promise<UserSettings> => {
      const { data, error } = await settingsService.getSettings();
      if (error) {
        logger.error('[SettingsQuery] Settings error:', error);
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
    meta: {
      errorMessage: 'Failed to load user settings',
    },
  });
}

/**
 * Fetch API keys
 *
 * @returns UseQueryResult with array of APIKey
 */
export function useAPIKeys(): UseQueryResult<APIKey[], Error> {
  return useQuery<APIKey[], Error>({
    queryKey: queryKeys.settings.apiKeys(),
    queryFn: async (): Promise<APIKey[]> => {
      const { data, error } = await settingsService.getAPIKeys();
      if (error) {
        logger.error('[SettingsQuery] API keys error:', error);
        return [];
      }
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Failed to load API keys',
    },
  });
}

/**
 * Update user profile mutation
 *
 * @returns UseMutationResult for updating user profile
 */
export function useUpdateProfile(): UseMutationResult<
  Partial<UserProfile>,
  Error,
  Partial<UserProfile>,
  ProfileMutationContext
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<
    Partial<UserProfile>,
    Error,
    Partial<UserProfile>,
    ProfileMutationContext
  >({
    mutationFn: async (
      profile: Partial<UserProfile>
    ): Promise<Partial<UserProfile>> => {
      const { error } = await settingsService.updateProfile(profile);
      if (error) {
        throw new Error(error);
      }
      return profile;
    },
    onMutate: async (
      newProfile: Partial<UserProfile>
    ): Promise<ProfileMutationContext> => {
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
    onSuccess: (): void => {
      toast.success('Profile updated successfully');
    },
    onError: (
      error: Error,
      _variables: Partial<UserProfile>,
      context: ProfileMutationContext | undefined
    ): void => {
      // Rollback on error
      if (context?.previousProfile !== undefined) {
        queryClient.setQueryData(
          queryKeys.settings.profile(),
          context.previousProfile
        );
      }
      logger.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    },
    onSettled: (): void => {
      // Always refetch after mutation
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.profile(),
      });
    },
  });
}

/**
 * Update user settings mutation
 *
 * @returns UseMutationResult for updating user settings
 */
export function useUpdateSettings(): UseMutationResult<
  Partial<UserSettings>,
  Error,
  Partial<UserSettings>,
  SettingsMutationContext
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<
    Partial<UserSettings>,
    Error,
    Partial<UserSettings>,
    SettingsMutationContext
  >({
    mutationFn: async (
      settings: Partial<UserSettings>
    ): Promise<Partial<UserSettings>> => {
      const { error } = await settingsService.updateSettings(settings);
      if (error) {
        throw new Error(error);
      }
      return settings;
    },
    onMutate: async (
      newSettings: Partial<UserSettings>
    ): Promise<SettingsMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.settings.preferences(),
      });

      const previousSettings = queryClient.getQueryData<UserSettings>(
        queryKeys.settings.preferences()
      );

      queryClient.setQueryData<UserSettings>(
        queryKeys.settings.preferences(),
        (old) =>
          old ? { ...old, ...newSettings } : (newSettings as UserSettings)
      );

      return { previousSettings };
    },
    onSuccess: (): void => {
      toast.success('Settings updated successfully');
    },
    onError: (
      error: Error,
      _variables: Partial<UserSettings>,
      context: SettingsMutationContext | undefined
    ): void => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          queryKeys.settings.preferences(),
          context.previousSettings
        );
      }
      logger.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    },
    onSettled: (): void => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.preferences(),
      });
    },
  });
}

/**
 * Upload avatar mutation
 *
 * @returns UseMutationResult for uploading avatar
 */
export function useUploadAvatar(): UseMutationResult<string, Error, File> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<string, Error, File>({
    mutationFn: async (file: File): Promise<string> => {
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
    onSuccess: (url: string): void => {
      // Update profile with new avatar URL
      queryClient.setQueryData<UserProfile | null>(
        queryKeys.settings.profile(),
        (old) => (old ? { ...old, avatar_url: url } : null)
      );
      toast.success('Avatar uploaded successfully');
    },
    onError: (error: Error): void => {
      logger.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload avatar');
    },
  });
}

/**
 * Change password mutation
 *
 * @returns UseMutationResult for changing password
 */
export function useChangePassword(): UseMutationResult<
  void,
  Error,
  ChangePasswordParams
> {
  return useMutation<void, Error, ChangePasswordParams>({
    mutationFn: async ({
      newPassword,
      confirmPassword,
    }: ChangePasswordParams): Promise<void> => {
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
    onSuccess: (): void => {
      toast.success('Password changed successfully');
    },
    onError: (error: Error): void => {
      logger.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    },
  });
}

/**
 * Create API key mutation
 *
 * @returns UseMutationResult for creating API key
 */
export function useCreateAPIKey(): UseMutationResult<
  CreateAPIKeyResult,
  Error,
  string
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<CreateAPIKeyResult, Error, string>({
    mutationFn: async (name: string): Promise<CreateAPIKeyResult> => {
      if (!name.trim()) {
        throw new Error('Please enter a name for the API key');
      }

      const { data, error, fullKey } = await settingsService.createAPIKey(name);
      if (error || !data) {
        throw new Error(error || 'Failed to create API key');
      }

      return { apiKey: data, fullKey: fullKey || '' };
    },
    onSuccess: ({ apiKey }: CreateAPIKeyResult): void => {
      // Add to cache
      queryClient.setQueryData<APIKey[]>(queryKeys.settings.apiKeys(), (old) =>
        old ? [apiKey, ...old] : [apiKey]
      );
      toast.success('API key generated successfully');
    },
    onError: (error: Error): void => {
      logger.error('Error generating API key:', error);
      toast.error(error.message || 'Failed to generate API key');
    },
  });
}

/**
 * Delete API key mutation
 *
 * @returns UseMutationResult for deleting API key
 */
export function useDeleteAPIKey(): UseMutationResult<string, Error, string> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: async (keyId: string): Promise<string> => {
      const { error } = await settingsService.deleteAPIKey(keyId);
      if (error) {
        throw new Error(error);
      }
      return keyId;
    },
    onSuccess: (keyId: string): void => {
      // Remove from cache
      queryClient.setQueryData<APIKey[]>(queryKeys.settings.apiKeys(), (old) =>
        old?.filter((k) => k.id !== keyId)
      );
      toast.success('API key deleted successfully');
    },
    onError: (error: Error): void => {
      logger.error('Error deleting API key:', error);
      toast.error(error.message || 'Failed to delete API key');
    },
  });
}

/**
 * Toggle 2FA mutation
 *
 * @returns UseMutationResult for toggling 2FA
 */
export function useToggle2FA(): UseMutationResult<
  boolean,
  Error,
  boolean,
  SettingsMutationContext
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<boolean, Error, boolean, SettingsMutationContext>({
    mutationFn: async (enabled: boolean): Promise<boolean> => {
      const { error } = enabled
        ? await settingsService.enable2FA()
        : await settingsService.disable2FA();

      if (error) {
        throw new Error(error);
      }
      return enabled;
    },
    onMutate: async (enabled: boolean): Promise<SettingsMutationContext> => {
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
    onSuccess: (enabled: boolean): void => {
      toast.success(`2FA ${enabled ? 'enabled' : 'disabled'} successfully`);
    },
    onError: (
      error: Error,
      enabled: boolean,
      context: SettingsMutationContext | undefined
    ): void => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          queryKeys.settings.preferences(),
          context.previousSettings
        );
      }
      logger.error('Error toggling 2FA:', error);
      toast.error(
        error.message || `Failed to ${enabled ? 'enable' : 'disable'} 2FA`
      );
    },
  });
}

/**
 * Invalidate all settings queries
 *
 * @returns Callback function to invalidate all settings queries
 */
export function useInvalidateSettingsQueries(): () => void {
  const queryClient: QueryClient = useQueryClient();

  return (): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all() });
  };
}

/**
 * Combined hook for loading all settings data at once
 * Useful for settings page initialization
 *
 * @returns AllSettingsData with combined query results
 */
export function useAllSettingsData(): AllSettingsData {
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
    refetch: (): void => {
      profileQuery.refetch();
      settingsQuery.refetch();
      apiKeysQuery.refetch();
    },
  };
}
