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
import { supabase } from '@shared/lib/supabase-client';
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

// ============================================================================
// ORGANIZATION SETTINGS HOOKS
// ============================================================================

/**
 * Organization settings structure
 */
export interface OrganizationSettings {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  billingEmail: string | null;
  plan: 'free' | 'team' | 'enterprise';
  memberCount: number;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
  settings: {
    allowMemberInvites: boolean;
    requireEmailVerification: boolean;
    defaultRole: 'member' | 'admin' | 'viewer';
    allowedDomains: string[];
    enforceSSO: boolean;
    auditLogRetention: number;
    dataRetention: number;
  };
}

/**
 * Fetch organization settings
 *
 * @param organizationId - Optional organization ID (uses user's org if not provided)
 * @returns UseQueryResult with OrganizationSettings or null
 */
export function useOrganizationSettings(
  organizationId?: string
): UseQueryResult<OrganizationSettings | null, Error> {
  return useQuery<OrganizationSettings | null, Error>({
    queryKey: ['settings', 'organization', organizationId ?? 'current'],
    queryFn: async (): Promise<OrganizationSettings | null> => {
      // Try to get organization from database
      let query = supabase.from('organizations').select('*');

      if (organizationId) {
        query = query.eq('id', organizationId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          logger.warn('[useOrganizationSettings] Organizations table does not exist');
          return null;
        }
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logo_url,
        description: data.description,
        website: data.website,
        billingEmail: data.billing_email,
        plan: data.plan || 'free',
        memberCount: data.member_count || 1,
        maxMembers: data.max_members || 5,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        settings: data.settings || {
          allowMemberInvites: true,
          requireEmailVerification: true,
          defaultRole: 'member',
          allowedDomains: [],
          enforceSSO: false,
          auditLogRetention: 90,
          dataRetention: 365,
        },
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    meta: {
      errorMessage: 'Failed to load organization settings',
    },
  });
}

/**
 * Update organization settings mutation
 *
 * @returns UseMutationResult for updating organization settings
 */
export function useUpdateOrganizationSettings(): UseMutationResult<
  Partial<OrganizationSettings>,
  Error,
  { organizationId: string; updates: Partial<OrganizationSettings> }
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<
    Partial<OrganizationSettings>,
    Error,
    { organizationId: string; updates: Partial<OrganizationSettings> }
  >({
    mutationFn: async ({ organizationId, updates }) => {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: updates.name,
          description: updates.description,
          website: updates.website,
          billing_email: updates.billingEmail,
          settings: updates.settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);

      if (error) throw error;
      return updates;
    },
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['settings', 'organization', organizationId],
      });
      toast.success('Organization settings updated');
    },
    onError: (error: Error) => {
      logger.error('Failed to update organization settings:', error);
      toast.error('Failed to update organization settings');
    },
  });
}

// ============================================================================
// TEAM MEMBERS HOOKS
// ============================================================================

/**
 * Team member structure
 */
export interface TeamMember {
  id: string;
  userId: string;
  organizationId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  invitedAt: string | null;
  joinedAt: string | null;
  lastActiveAt: string | null;
  permissions: string[];
}

/**
 * Fetch team members for an organization
 *
 * @param organizationId - The organization ID
 * @returns UseQueryResult with array of TeamMember
 */
export function useTeamMembers(
  organizationId: string | undefined
): UseQueryResult<TeamMember[], Error> {
  return useQuery<TeamMember[], Error>({
    queryKey: ['settings', 'team', organizationId ?? ''],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('organization_members')
        .select(
          `
          id,
          user_id,
          organization_id,
          role,
          status,
          invited_at,
          joined_at,
          last_active_at,
          permissions,
          users:user_id (
            email,
            display_name,
            avatar_url
          )
        `
        )
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          logger.warn('[useTeamMembers] Organization members table does not exist');
          return [];
        }
        throw error;
      }

      return (data || []).map((member) => {
        const user = member.users as { email: string; display_name: string; avatar_url: string | null } | null;
        return {
          id: member.id,
          userId: member.user_id,
          organizationId: member.organization_id,
          email: user?.email || '',
          name: user?.display_name || '',
          avatarUrl: user?.avatar_url || null,
          role: member.role || 'member',
          status: member.status || 'active',
          invitedAt: member.invited_at,
          joinedAt: member.joined_at,
          lastActiveAt: member.last_active_at,
          permissions: member.permissions || [],
        };
      });
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    meta: {
      errorMessage: 'Failed to load team members',
    },
  });
}

/**
 * Invite team member mutation
 *
 * @returns UseMutationResult for inviting a team member
 */
export function useInviteTeamMember(): UseMutationResult<
  TeamMember,
  Error,
  { organizationId: string; email: string; role: TeamMember['role'] }
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<
    TeamMember,
    Error,
    { organizationId: string; email: string; role: TeamMember['role'] }
  >({
    mutationFn: async ({ organizationId, email, role }) => {
      const { data, error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          email,
          role,
          status: 'pending',
          invited_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        organizationId: data.organization_id,
        email: email,
        name: '',
        avatarUrl: null,
        role: data.role,
        status: 'pending',
        invitedAt: data.invited_at,
        joinedAt: null,
        lastActiveAt: null,
        permissions: [],
      };
    },
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['settings', 'team', organizationId],
      });
      toast.success('Invitation sent successfully');
    },
    onError: (error: Error) => {
      logger.error('Failed to invite team member:', error);
      toast.error(error.message || 'Failed to send invitation');
    },
  });
}

/**
 * Remove team member mutation
 *
 * @returns UseMutationResult for removing a team member
 */
export function useRemoveTeamMember(): UseMutationResult<
  void,
  Error,
  { memberId: string; organizationId: string }
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<void, Error, { memberId: string; organizationId: string }>({
    mutationFn: async ({ memberId }) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['settings', 'team', organizationId],
      });
      toast.success('Team member removed');
    },
    onError: (error: Error) => {
      logger.error('Failed to remove team member:', error);
      toast.error('Failed to remove team member');
    },
  });
}

/**
 * Update team member role mutation
 *
 * @returns UseMutationResult for updating team member role
 */
export function useUpdateTeamMemberRole(): UseMutationResult<
  void,
  Error,
  { memberId: string; organizationId: string; role: TeamMember['role'] }
> {
  const queryClient: QueryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { memberId: string; organizationId: string; role: TeamMember['role'] }
  >({
    mutationFn: async ({ memberId, role }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['settings', 'team', organizationId],
      });
      toast.success('Member role updated');
    },
    onError: (error: Error) => {
      logger.error('Failed to update team member role:', error);
      toast.error('Failed to update role');
    },
  });
}

// ============================================================================
// USER ACTIVITY HOOKS
// ============================================================================

/**
 * User activity record
 */
export interface UserActivity {
  id: string;
  userId: string;
  type:
    | 'login'
    | 'logout'
    | 'settings_change'
    | 'api_call'
    | 'chat_session'
    | 'employee_hire'
    | 'payment'
    | 'other';
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/**
 * Fetch user activity history
 *
 * @param userId - Optional user ID (uses current user if not provided)
 * @param limit - Maximum number of records
 * @returns UseQueryResult with array of UserActivity
 */
export function useUserActivity(
  userId?: string,
  limit: number = 50
): UseQueryResult<UserActivity[], Error> {
  return useQuery<UserActivity[], Error>({
    queryKey: ['settings', 'activity', userId ?? 'current', limit],
    queryFn: async (): Promise<UserActivity[]> => {
      const { data: authUser } = await supabase.auth.getUser();
      const targetUserId = userId || authUser.user?.id;

      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          logger.warn('[useUserActivity] User activity table does not exist');
          return [];
        }
        throw error;
      }

      return (data || []).map((activity) => ({
        id: activity.id,
        userId: activity.user_id,
        type: activity.type || 'other',
        description: activity.description || '',
        ipAddress: activity.ip_address,
        userAgent: activity.user_agent,
        metadata: activity.metadata || {},
        createdAt: activity.created_at,
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Failed to load user activity',
    },
  });
}

// ============================================================================
// AUDIT LOGS HOOKS
// ============================================================================

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    email: string;
    name: string;
  };
}

/**
 * Audit log filter options
 */
export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Fetch audit logs
 *
 * @param filters - Filter options for audit logs
 * @returns UseQueryResult with array of AuditLogEntry
 */
export function useAuditLogs(
  filters?: AuditLogFilters
): UseQueryResult<AuditLogEntry[], Error> {
  const {
    userId,
    action,
    resourceType,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = filters || {};

  return useQuery<AuditLogEntry[], Error>({
    queryKey: [
      'audit',
      'logs',
      { userId, action, resourceType, startDate: startDate?.toISOString(), endDate: endDate?.toISOString(), limit, offset },
    ],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          logger.warn('[useAuditLogs] Audit logs table does not exist');
          return [];
        }
        throw error;
      }

      return (data || []).map((log) => ({
        id: log.id,
        userId: log.user_id,
        action: log.action,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        details: (log.details as Record<string, unknown>) || {},
        ipAddress: log.ip_address,
        createdAt: log.created_at,
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Failed to load audit logs',
    },
  });
}

/**
 * Get audit log actions (for filter dropdown)
 *
 * @returns UseQueryResult with array of action strings
 */
export function useAuditLogActions(): UseQueryResult<string[], Error> {
  return useQuery<string[], Error>({
    queryKey: ['audit', 'actions'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action')
        .limit(1000);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }

      const actions = new Set<string>();
      (data || []).forEach((row) => {
        if (row.action) actions.add(row.action);
      });

      return Array.from(actions).sort();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    meta: {
      errorMessage: 'Failed to load audit log actions',
    },
  });
}
