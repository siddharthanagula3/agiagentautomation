/**
 * Central store exports for AGI Agent Automation
 * State management using Zustand for client state and React Query for server state
 */

// ========================================
// Zustand Stores
// ========================================

// Global Settings Store - Global application settings and feature flags
export { useAppStore, type AppStore } from './global-settings-store';

// Auth Store - Authentication and user management (unified)
export { useAuthStore } from './authentication-store';

// Chat Store - Chat conversations and messages
export { useChatStore } from './chat-store';

// Workforce Store - AI workforce and job management
export { useWorkforceStore } from './workforce-store';

// Notification Store - App notifications and toasts
export { useNotificationStore } from './notification-store';

// Layout Store - UI layout and theme management
export { useUIStore } from './layout-store';

// User Profile Store
export { useUserProfileStore } from './user-profile-store';

// Agent Metrics Store - Real-time metrics from agent activity
export {
  useAgentMetricsStore,
  type ChatSession,
  type AgentMetrics,
} from './agent-metrics-store';

// Multi-Agent Chat Store - Multi-participant chat management
export {
  useMultiAgentChatStore,
  type MultiAgentConversation,
  type ChatMessage,
  type ConversationParticipant,
} from './multi-agent-chat-store';

// Company Hub Store - Workspace collaboration
export { useCompanyHubStore } from './company-hub-store';

// Artifact Store - Code artifacts and generated content
export { useArtifactStore } from './artifact-store';

// Usage Warning Store - Token usage warnings and limits
export { useUsageWarningStore } from './usage-warning-store';

// Mission Control Store - Mission orchestration state
export {
  useMissionStore,
  useMissionStatus,
  useMissionPlan,
  useActiveEmployees,
  useMissionMessages,
} from './mission-control-store';

// ========================================
// React Query Configuration
// ========================================

export { queryClient } from './query-client';

// ========================================
// Type Definitions
// ========================================

export * from '@shared/types/store-types';
