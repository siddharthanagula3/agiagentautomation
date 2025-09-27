/**
 * Central store exports for AGI Agent Automation
 * State management using Zustand for client state and React Query for server state
 */

// ========================================
// Zustand Stores
// ========================================

// App Store - Global application state
export {
  useAppStore,
  useAppLoading,
  useAppError,
  useAppSettings,
  useAppFeatures,
  useAppSession,
  type AppStore,
  type AppState,
  type AppActions,
  type AppSettings
} from './app-store';

// Auth Store - Authentication and user management
export {
  useAuthStore,
  useAuth,
  useAuthError,
  useUser,
  useUserPlan,
  useUserUsage,
  useUserBilling,
  type AuthStore,
  type AuthState,
  type AuthActions,
  type User
} from './auth-store';

// Chat Store - Chat conversations and messages
export {
  useChatStore,
  useActiveConversation,
  useConversationsList,
  useChatModels,
  useSelectedModel,
  useChatLoading,
  useChatError,
  type ChatStore,
  type ChatState,
  type ChatActions,
  type Message,
  type Conversation,
  type ToolCall,
  type Citation,
  type Attachment
} from './chat-store';

// Workforce Store - AI workforce and job management
export {
  useWorkforceStore,
  useWorkforceJobs,
  useWorkforceWorkers,
  useWorkforceStats,
  useWorkforceLoading,
  useWorkforceError,
  type WorkforceStore,
  type WorkforceState,
  type WorkforceActions,
  type WorkforceWorker,
  type JobTemplate
} from './workforce-store';

// Employee Store - AI employee marketplace
export {
  useEmployeeStore,
  useEmployees,
  useOwnedEmployees,
  useFavoritedEmployees,
  useEmployeeCategories,
  useCart,
  useEmployeeLoading,
  useEmployeeError,
  type EmployeeStore,
  type EmployeeState,
  type EmployeeActions,
  type EmployeeReview,
  type EmployeePurchase,
  type EmployeeCategory,
  type SortOption,
  type FilterOption
} from './employee-store';

// Notification Store - App notifications and toasts
export {
  useNotificationStore,
  useNotifications,
  useUnreadNotifications,
  useToasts,
  useUnreadCount,
  useNotificationSettings,
  type NotificationStore,
  type NotificationState,
  type NotificationActions,
  type Notification,
  type Toast
} from './notification-store';

// UI Store - UI state and theme management
export {
  useUIStore,
  useSidebar,
  useTheme,
  useModals,
  useDrawers,
  useResponsive,
  useCommandPalette,
  useGlobalLoading,
  usePreferences,
  type UIStore,
  type UIState,
  type UIActions,
  type Modal,
  type Drawer
} from './ui-store';

// ========================================
// React Query Configuration
// ========================================

export {
  queryClient,
  QueryProvider,
  queryKeys,
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  invalidateQueries,
  prefetchQuery,
  setQueryData,
  optimisticUpdate,
  backgroundSync,
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type APIResponse,
  type APIError,
  type PaginationParams
} from './query-client';

// ========================================
// API Hooks
// ========================================

export {
  // Auth hooks
  useAuthUser,
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,

  // Employee hooks
  useEmployees as useEmployeesQuery,
  useInfiniteEmployees,
  useEmployee as useEmployeeQuery,
  useEmployeeReviews,
  useOwnedEmployees as useOwnedEmployeesQuery,
  usePurchaseEmployeeMutation,
  useAddEmployeeReviewMutation,

  // Workforce hooks
  useWorkforceJobs as useWorkforceJobsQuery,
  useWorkforceJob as useWorkforceJobQuery,
  useWorkforceStats as useWorkforceStatsQuery,
  useCreateJobMutation,
  useJobActionMutation,

  // Chat hooks
  useConversations as useConversationsQuery,
  useConversation as useConversationQuery,
  useMessages,
  useChatModels as useChatModelsQuery,
  useSendMessageMutation,
  useCreateConversationMutation,

  // Billing hooks
  useSubscription,
  useUsage,
  useInvoices,
  usePaymentMethods,

  // System hooks
  useSystemHealth,
  useFeatureFlags,

  // Upload hooks
  useUploadFileMutation,

  // Utility hooks
  useOptimisticMutation,
  useBackgroundSync
} from './api-hooks';

// ========================================
// Type Definitions
// ========================================

export * from './types';

// ========================================
// Store Provider Component
// ========================================

import React from 'react';
import { QueryProvider } from './query-client';

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * Root store provider that wraps the app with all necessary providers
 * Includes React Query provider with dev tools
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  return React.createElement(QueryProvider, null, children);
};

// ========================================
// Store Initialization
// ========================================

/**
 * Initialize all stores with default data
 * Should be called once at app startup
 */
export const initializeStores = async () => {
  // Initialize app store
  const { useAppStore } = await import('./app-store');
  const appStore = useAppStore.getState();
  if (!appStore.initialized) {
    await appStore.initialize();
  }

  // Set up responsive breakpoint detection
  const { useUIStore } = await import('./ui-store');
  const uiStore = useUIStore.getState();
  const updateBreakpoint = () => {
    const width = window.innerWidth;
    if (width < 640) uiStore.setBreakpoint('xs');
    else if (width < 768) uiStore.setBreakpoint('sm');
    else if (width < 1024) uiStore.setBreakpoint('md');
    else if (width < 1280) uiStore.setBreakpoint('lg');
    else if (width < 1536) uiStore.setBreakpoint('xl');
    else uiStore.setBreakpoint('2xl');
  };

  // Initial breakpoint detection
  updateBreakpoint();

  // Listen for window resize
  window.addEventListener('resize', updateBreakpoint);

  // Request notification permissions if needed
  const { useNotificationStore } = await import('./notification-store');
  const notificationStore = useNotificationStore.getState();
  if (notificationStore.settings.enableDesktopNotifications) {
    await notificationStore.requestDesktopPermission();
  }

  console.log('✅ Stores initialized successfully');
};

// ========================================
// Store Cleanup
// ========================================

/**
 * Clean up stores and remove listeners
 * Should be called on app unmount
 */
export const cleanupStores = async () => {
  // Clean up old notifications
  const { useNotificationStore } = await import('./notification-store');
  const notificationStore = useNotificationStore.getState();
  notificationStore.cleanup();

  // Clear React Query cache if needed
  const { queryClient } = await import('./query-client');
  queryClient.clear();

  console.log('✅ Stores cleaned up successfully');
};