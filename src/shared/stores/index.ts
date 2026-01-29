/**
 * Central store exports for AGI Agent Automation
 * State management using Zustand for client state and React Query for server state
 */

// ========================================
// Zustand Stores
// ========================================

// Global Settings Store - Global application settings and feature flags
export {
  useAppStore,
  type AppStore,
  type AppState,
  type AppActions,
  type AppSettings,
  type AppEnvironment,
} from './global-settings-store';

// Auth Store - Authentication and user management (unified)
export { useAuthStore, type AuthState, type AuthResult } from './authentication-store';

// Chat Store - Chat conversations and messages
export {
  useChatStore,
  type ChatStore,
  type ChatState,
  type ChatActions,
  type Conversation,
  type Message,
  type ChatModel,
  type ToolCall,
  type Citation,
  type Attachment,
  type MessageReaction,
  type WorkingProcess,
  type ProcessStep,
  type Checkpoint,
} from './chat-store';

// Workforce Store - AI workforce and job management
export {
  useWorkforceStore,
  type HiredEmployee,
  type HireEmployeeParams,
  type WorkforceState,
  setupWorkforceSubscription,
  cleanupWorkforceSubscription,
  isWorkforceSubscriptionActive,
} from './workforce-store';

// Notification Store - App notifications and toasts
export {
  useNotificationStore,
  type NotificationStore,
  type NotificationState,
  type NotificationActions,
  type Notification,
  type Toast,
} from './notification-store';

// Layout Store - UI layout and theme management
export {
  useUIStore,
  type UIStore,
  type UIState,
  type UIActions,
  type ModalKey,
  type ViewMode,
  type SortOrder,
} from './layout-store';

// User Profile Store
export {
  useUserProfileStore,
  useUser,
  useUserPlan,
  useUserUsage,
  useUserBilling,
  useUserProfile,
  useUserProfileDetails,
  useUserProfileLoading,
  useUserProfileError,
  type UserProfile,
  type UserProfileState,
  type UserProfileActions,
  type UserProfileStore,
} from './user-profile-store';

// Agent Metrics Store - Real-time metrics from agent activity
export {
  useAgentMetricsStore,
  type ChatSession as AgentChatSession,
  type AgentMetrics,
  type AgentMetricsState,
  type AgentActivityType,
  type SessionStatusType,
} from './agent-metrics-store';

// Multi-Agent Chat Store - Multi-participant chat management
export {
  useMultiAgentChatStore,
  type MultiAgentChatStore,
  type MultiAgentChatState,
  type MultiAgentChatActions,
  type MultiAgentConversation,
  type ChatMessage as MultiAgentChatMessage,
  type ConversationParticipant,
  type MessageDeliveryStatus,
  type ParticipantType,
  type ToolCall as MultiAgentToolCall,
  type ThinkingStep,
  type Attachment as MultiAgentAttachment,
  type MessageReaction as MultiAgentMessageReaction,
  type TypingIndicator,
  type AgentPresence,
  type SyncConflict,
} from './multi-agent-chat-store';

// Company Hub Store - Workspace collaboration
export {
  useCompanyHubStore,
  type CompanyHubStore,
  type CompanyHubState,
  type CompanyHubActions,
  type CompanyHubSession,
  type AgentAssignment,
  type HubMessage,
  type UpsellRequest,
} from './company-hub-store';

// Artifact Store - Code artifacts and generated content
export { useArtifactStore, type ArtifactState } from './artifact-store';

// Usage Warning Store - Token usage warnings and limits
export {
  useUsageWarningStore,
  type UsageWarningState,
} from './usage-warning-store';

// Mission Control Store - Mission orchestration state
export {
  useMissionStore,
  useMissionStatus,
  useMissionPlan,
  useActiveEmployees,
  useMissionMessages,
  useCollaborativeMode,
  useEmployee,
  useCurrentMissionId,
  startMissionCleanupInterval,
  stopMissionCleanupInterval,
  type MissionState,
  type MissionStateData,
  type Task,
  type ActiveEmployee,
  type EmployeeLogEntry,
  type MissionMessage,
  type MissionStatusType,
  type EmployeeStatusType,
  type LogEntryType,
  type MissionModeType,
} from './mission-control-store';

// Multi-Agent Chat Store Selectors
export {
  useActiveConversation,
  useConversationMessages,
  useConversationParticipants,
  useTypingIndicators,
  useAgentPresence,
  useSyncState,
  useActiveConversationId,
  useConversations,
  useSearchAndFilters,
  useChatLoadingState,
} from './multi-agent-chat-store';

// Company Hub Store Selectors
export {
  useActiveSession,
  useAssignedAgentsRecord,
  useAssignedAgents,
  useAssignedAgent,
  useTokenUsage,
  useHubMessages,
  usePendingUpsell,
  useOrchestrationStatus,
  useActiveSessionId,
  useUpsellQueue,
  useLastUpdate,
} from './company-hub-store';

// Chat Store Selectors
export {
  useConversationsRecord,
  useActiveChatConversation,
  useActiveChatConversationId,
  useChatStreamingState,
  useSelectedChatModel,
  useAvailableChatModels,
  useChatSearchAndFilters,
  useWorkingProcesses,
  useChatActiveEmployees,
  useCheckpointState,
  useChatSidebarOpen,
} from './chat-store';

// Notification Store Selectors
export {
  useNotificationsRecord,
  useNotifications,
  useUnreadNotifications,
  useToastsRecord,
  useToasts,
  useUnreadCount,
  useNotificationSettings,
  useNotificationUIState,
} from './notification-store';

// Layout Store Selectors
export {
  useSidebar,
  useModals,
  useTheme,
  useChatInterface,
  useDashboard,
  useNotifications as useUINotifications,
} from './layout-store';

// Global Settings Store Selectors
export {
  useAppLoading,
  useAppError,
  useAppSettings,
  useAppFeatures,
  useAppSession,
} from './global-settings-store';

// ========================================
// React Query Configuration
// ========================================

export {
  queryClient,
  queryKeys,
  useQuery,
  useMutation,
  useInfiniteQuery,
} from './query-client';

// ========================================
// Type Definitions
// ========================================

export * from '@shared/types/store-types';
