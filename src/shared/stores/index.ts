/**
 * Central store exports for AGI Agent Automation
 * State management using Zustand for client state and React Query for server state
 */

// ========================================
// Zustand Stores
// ========================================

// App Store - Global application state
export { useAppStore, type AppStore } from './app-store';

// Auth Store - Authentication and user management (unified)
export { useAuthStore } from './authentication-store';

// Chat Store - Chat conversations and messages
export { useChatStore } from './chat-store';

// Workforce Store - AI workforce and job management
export { useWorkforceStore } from './employee-management-store';

// Notification Store - App notifications and toasts
export { useNotificationStore } from './notification-store';

// UI Store - UI state and theme management
export { useUIStore } from './ui-store';

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

// Company Hub Store (Multi-Agent Workspace) - Workspace collaboration
export { useCompanyHubStore } from './multi-agent-workspace-store';

// Artifact Store - Code artifacts and generated content
export { useArtifactStore } from './artifact-store';

// Usage Warning Store - Token usage warnings and limits
export { useUsageWarningStore } from './usage-warning-store';

// Employee Metrics Store - Employee performance tracking
export { useEmployeeMetricsStore } from './employee-metrics-store';

// Mission Control Store - Mission orchestration state
export {
  useMissionStore,
  useMissionStatus,
  useMissionTasks,
  useMissionEmployees,
  useMissionMessages,
} from './mission-control-store';

// ========================================
// React Query Configuration
// ========================================

export { queryClient } from './query-client';

// ========================================
// Type Definitions
// ========================================

export * from './types';
