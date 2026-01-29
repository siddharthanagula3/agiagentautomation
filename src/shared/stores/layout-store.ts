/**
 * UI State Management Store using Zustand
 * Handles all UI-related state (modals, sidebar, theme, etc.)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

export interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modal states
  modals: {
    createEmployee: boolean;
    createProject: boolean;
    settings: boolean;
    billing: boolean;
    help: boolean;
  };

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Chat interface
  chatInterface: {
    showTools: boolean;
    selectedTools: string[];
    currentConversation: string | null;
  };

  // Dashboard layout
  dashboard: {
    viewMode: 'grid' | 'list';
    filters: Record<string, unknown>;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };

  // Notifications
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
}

export interface UIActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Modal actions
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;

  // Theme actions
  setTheme: (theme: UIState['theme']) => void;

  // Chat interface actions
  toggleChatTools: () => void;
  setSelectedTools: (tools: string[]) => void;
  setCurrentConversation: (conversationId: string | null) => void;

  // Dashboard actions
  setViewMode: (mode: UIState['dashboard']['viewMode']) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;

  // Notification actions
  setNotificationEnabled: (enabled: boolean) => void;
  setNotificationSound: (sound: boolean) => void;
  setDesktopNotifications: (desktop: boolean) => void;

  // Utility actions
  reset: () => void;
}

export type UIStore = UIState & UIActions;

/** Modal key type for type-safe modal access */
export type ModalKey = keyof UIState['modals'];

/** View mode type for dashboard */
export type ViewMode = UIState['dashboard']['viewMode'];

/** Sort order type */
export type SortOrder = 'asc' | 'desc';

const INITIAL_STATE: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  modals: {
    createEmployee: false,
    createProject: false,
    settings: false,
    billing: false,
    help: false,
  },
  theme: 'system',
  chatInterface: {
    showTools: false,
    selectedTools: [],
    currentConversation: null,
  },
  dashboard: {
    viewMode: 'grid',
    filters: {},
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
  },
};

const enableDevtools = import.meta.env.MODE !== 'production';

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...INITIAL_STATE,

        // Sidebar actions
        toggleSidebar: () =>
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          }),

        setSidebarOpen: (open: boolean) =>
          set((state) => {
            state.sidebarOpen = open;
          }),

        setSidebarCollapsed: (collapsed: boolean) =>
          set((state) => {
            state.sidebarCollapsed = collapsed;
          }),

        // Modal actions
        openModal: (modal: keyof UIState['modals']) =>
          set((state) => {
            state.modals[modal] = true;
          }),

        closeModal: (modal: keyof UIState['modals']) =>
          set((state) => {
            state.modals[modal] = false;
          }),

        closeAllModals: () =>
          set((state) => {
            Object.keys(state.modals).forEach((key) => {
              state.modals[key as keyof UIState['modals']] = false;
            });
          }),

        // Theme actions
        setTheme: (theme: UIState['theme']) =>
          set((state) => {
            state.theme = theme;
          }),

        // Chat interface actions
        toggleChatTools: () =>
          set((state) => {
            state.chatInterface.showTools = !state.chatInterface.showTools;
          }),

        setSelectedTools: (tools: string[]) =>
          set((state) => {
            state.chatInterface.selectedTools = tools;
          }),

        setCurrentConversation: (conversationId: string | null) =>
          set((state) => {
            state.chatInterface.currentConversation = conversationId;
          }),

        // Dashboard actions
        setViewMode: (mode: UIState['dashboard']['viewMode']) =>
          set((state) => {
            state.dashboard.viewMode = mode;
          }),

        setFilters: (filters: Record<string, unknown>) =>
          set((state) => {
            state.dashboard.filters = filters;
          }),

        setSortBy: (sortBy: string) =>
          set((state) => {
            state.dashboard.sortBy = sortBy;
          }),

        setSortOrder: (order: 'asc' | 'desc') =>
          set((state) => {
            state.dashboard.sortOrder = order;
          }),

        // Notification actions
        setNotificationEnabled: (enabled: boolean) =>
          set((state) => {
            state.notifications.enabled = enabled;
          }),

        setNotificationSound: (sound: boolean) =>
          set((state) => {
            state.notifications.sound = sound;
          }),

        setDesktopNotifications: (desktop: boolean) =>
          set((state) => {
            state.notifications.desktop = desktop;
          }),

        // Utility actions
        reset: () =>
          set((state) => {
            Object.assign(state, INITIAL_STATE);
          }),
      })),
      {
        name: 'agi-ui-store',
        version: 1,
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          dashboard: state.dashboard,
          notifications: state.notifications,
        }),
      }
    ),
    {
      name: 'UI Store',
      enabled: enableDevtools,
    }
  )
);

// Selectors for optimized re-renders
export const useSidebar = () =>
  useUIStore(
    useShallow((state) => ({
      sidebarOpen: state.sidebarOpen,
      sidebarCollapsed: state.sidebarCollapsed,
    }))
  );

export const useModals = () => useUIStore(useShallow((state) => state.modals));
export const useTheme = () => useUIStore((state) => state.theme);
export const useChatInterface = () =>
  useUIStore(useShallow((state) => state.chatInterface));
export const useDashboard = () =>
  useUIStore(useShallow((state) => state.dashboard));
export const useNotifications = () =>
  useUIStore(useShallow((state) => state.notifications));
