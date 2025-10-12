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
export { useAuthStore } from './unified-auth-store';

// Chat Store - Chat conversations and messages
export { useChatStore } from './chat-store';

// Workforce Store - AI workforce and job management
export { useWorkforceStore } from './workforce-store';

// Employee Store - AI employee marketplace
export { useEmployeeStore } from './ai-employee-store';

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

// ========================================
// React Query Configuration
// ========================================

export { queryClient } from './query-client';

// ========================================
// Type Definitions
// ========================================

export * from './types';
