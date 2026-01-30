// Settings Hooks - Public API

export {
  // Profile hooks
  useUserProfile,
  useUpdateProfile,
  useUploadAvatar,
  // Settings hooks
  useUserSettings,
  useUpdateSettings,
  // API keys hooks
  useAPIKeys,
  useCreateAPIKey,
  useDeleteAPIKey,
  // Security hooks
  useChangePassword,
  useToggle2FA,
  // Organization hooks
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  // Team hooks
  useTeamMembers,
  useInviteTeamMember,
  useRemoveTeamMember,
  useUpdateTeamMemberRole,
  // Activity hooks
  useUserActivity,
  // Audit logs hooks
  useAuditLogs,
  useAuditLogActions,
  // Combined/utility hooks
  useAllSettingsData,
  useInvalidateSettingsQueries,
  // Types
  type CreateAPIKeyResult,
  type ChangePasswordParams,
  type AllSettingsData,
  type OrganizationSettings,
  type TeamMember,
  type UserActivity,
  type AuditLogEntry,
  type AuditLogFilters,
} from './use-settings-queries';

// Re-export service types
export type { UserProfile, UserSettings, APIKey } from '../services/user-preferences';
