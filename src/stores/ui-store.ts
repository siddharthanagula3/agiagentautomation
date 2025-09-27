/**
 * UI store using Zustand
 * Handles UI-specific state like modals, sidebars, themes, etc.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Modal {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  persistent?: boolean;
  onClose?: () => void;
}

export interface Drawer {
  id: string;
  type: string;
  side: 'left' | 'right' | 'top' | 'bottom';
  props?: Record<string, unknown>;
  persistent?: boolean;
  onClose?: () => void;
}

export interface UIState {
  // Layout
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  headerVisible: boolean;
  footerVisible: boolean;

  // Theme and appearance
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'sm' | 'base' | 'lg';
  density: 'compact' | 'comfortable' | 'spacious';
  reducedMotion: boolean;

  // Modals
  modals: Record<string, Modal>;
  modalStack: string[]; // Track modal order for z-index

  // Drawers
  drawers: Record<string, Drawer>;
  activeDrawers: string[];

  // Loading states
  globalLoading: boolean;
  loadingMessage: string;

  // Focus management
  focusedElement: string | null;
  focusTrap: boolean;

  // Responsive breakpoints
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Command palette
  commandPaletteOpen: boolean;
  commandQuery: string;

  // Quick actions
  quickActionsOpen: boolean;

  // Preferences
  animations: boolean;
  soundEffects: boolean;
  keyboardShortcuts: boolean;
  tooltips: boolean;
  confirmDestructive: boolean;

  // Developer tools
  devToolsOpen: boolean;
  debugMode: boolean;
}

export interface UIActions {
  // Layout
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setHeaderVisible: (visible: boolean) => void;
  setFooterVisible: (visible: boolean) => void;

  // Theme and appearance
  setTheme: (theme: UIState['theme']) => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: UIState['fontSize']) => void;
  setDensity: (density: UIState['density']) => void;
  setReducedMotion: (reduced: boolean) => void;

  // Modals
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  closeTopModal: () => void;

  // Drawers
  openDrawer: (drawer: Omit<Drawer, 'id'>) => string;
  closeDrawer: (id: string) => void;
  closeAllDrawers: () => void;

  // Loading states
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Focus management
  setFocusedElement: (element: string | null) => void;
  setFocusTrap: (trapped: boolean) => void;

  // Responsive
  setBreakpoint: (breakpoint: UIState['breakpoint']) => void;
  updateResponsiveFlags: () => void;

  // Command palette
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setCommandQuery: (query: string) => void;

  // Quick actions
  toggleQuickActions: () => void;

  // Preferences
  updatePreferences: (preferences: Partial<Pick<UIState, 'animations' | 'soundEffects' | 'keyboardShortcuts' | 'tooltips' | 'confirmDestructive'>>) => void;

  // Developer tools
  toggleDevTools: () => void;
  setDebugMode: (enabled: boolean) => void;

  // Utility
  reset: () => void;
  exportSettings: () => string;
  importSettings: (settings: string) => void;
}

export interface UIStore extends UIState, UIActions {}

const INITIAL_STATE: UIState = {
  // Layout
  sidebarOpen: true,
  sidebarCollapsed: false,
  headerVisible: true,
  footerVisible: true,

  // Theme and appearance
  theme: 'system',
  primaryColor: '#0ea5e9', // sky-500
  fontSize: 'base',
  density: 'comfortable',
  reducedMotion: false,

  // Modals
  modals: {},
  modalStack: [],

  // Drawers
  drawers: {},
  activeDrawers: [],

  // Loading states
  globalLoading: false,
  loadingMessage: '',

  // Focus management
  focusedElement: null,
  focusTrap: false,

  // Responsive breakpoints
  breakpoint: 'lg',
  isMobile: false,
  isTablet: false,
  isDesktop: true,

  // Command palette
  commandPaletteOpen: false,
  commandQuery: '',

  // Quick actions
  quickActionsOpen: false,

  // Preferences
  animations: true,
  soundEffects: true,
  keyboardShortcuts: true,
  tooltips: true,
  confirmDestructive: true,

  // Developer tools
  devToolsOpen: false,
  debugMode: false,
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...INITIAL_STATE,

        // Layout
        toggleSidebar: () =>
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          }),

        setSidebarOpen: (open: boolean) =>
          set((state) => {
            state.sidebarOpen = open;
          }),

        toggleSidebarCollapsed: () =>
          set((state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
          }),

        setSidebarCollapsed: (collapsed: boolean) =>
          set((state) => {
            state.sidebarCollapsed = collapsed;
          }),

        setHeaderVisible: (visible: boolean) =>
          set((state) => {
            state.headerVisible = visible;
          }),

        setFooterVisible: (visible: boolean) =>
          set((state) => {
            state.footerVisible = visible;
          }),

        // Theme and appearance
        setTheme: (theme: UIState['theme']) =>
          set((state) => {
            state.theme = theme;
          }),

        setPrimaryColor: (color: string) =>
          set((state) => {
            state.primaryColor = color;
          }),

        setFontSize: (size: UIState['fontSize']) =>
          set((state) => {
            state.fontSize = size;
          }),

        setDensity: (density: UIState['density']) =>
          set((state) => {
            state.density = density;
          }),

        setReducedMotion: (reduced: boolean) =>
          set((state) => {
            state.reducedMotion = reduced;
          }),

        // Modals
        openModal: (modalData: Omit<Modal, 'id'>) => {
          const id = crypto.randomUUID();

          set((state) => {
            const modal: Modal = {
              ...modalData,
              id,
            };

            state.modals[id] = modal;
            state.modalStack.push(id);
          });

          return id;
        },

        closeModal: (id: string) =>
          set((state) => {
            const modal = state.modals[id];
            if (modal) {
              if (modal.onClose) {
                modal.onClose();
              }
              delete state.modals[id];
              state.modalStack = state.modalStack.filter((modalId) => modalId !== id);
            }
          }),

        closeAllModals: () =>
          set((state) => {
            Object.values(state.modals).forEach((modal) => {
              if (modal.onClose) modal.onClose();
            });
            state.modals = {};
            state.modalStack = [];
          }),

        closeTopModal: () => {
          const { modalStack } = get();
          if (modalStack.length > 0) {
            const topModalId = modalStack[modalStack.length - 1];
            get().closeModal(topModalId);
          }
        },

        // Drawers
        openDrawer: (drawerData: Omit<Drawer, 'id'>) => {
          const id = crypto.randomUUID();

          set((state) => {
            const drawer: Drawer = {
              ...drawerData,
              id,
            };

            state.drawers[id] = drawer;
            state.activeDrawers.push(id);
          });

          return id;
        },

        closeDrawer: (id: string) =>
          set((state) => {
            const drawer = state.drawers[id];
            if (drawer) {
              if (drawer.onClose) {
                drawer.onClose();
              }
              delete state.drawers[id];
              state.activeDrawers = state.activeDrawers.filter((drawerId) => drawerId !== id);
            }
          }),

        closeAllDrawers: () =>
          set((state) => {
            Object.values(state.drawers).forEach((drawer) => {
              if (drawer.onClose) drawer.onClose();
            });
            state.drawers = {};
            state.activeDrawers = [];
          }),

        // Loading states
        setGlobalLoading: (loading: boolean, message = '') =>
          set((state) => {
            state.globalLoading = loading;
            state.loadingMessage = message;
          }),

        // Focus management
        setFocusedElement: (element: string | null) =>
          set((state) => {
            state.focusedElement = element;
          }),

        setFocusTrap: (trapped: boolean) =>
          set((state) => {
            state.focusTrap = trapped;
          }),

        // Responsive
        setBreakpoint: (breakpoint: UIState['breakpoint']) =>
          set((state) => {
            state.breakpoint = breakpoint;
            get().updateResponsiveFlags();
          }),

        updateResponsiveFlags: () =>
          set((state) => {
            const { breakpoint } = state;
            state.isMobile = breakpoint === 'xs' || breakpoint === 'sm';
            state.isTablet = breakpoint === 'md';
            state.isDesktop = breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
          }),

        // Command palette
        openCommandPalette: () =>
          set((state) => {
            state.commandPaletteOpen = true;
            state.commandQuery = '';
          }),

        closeCommandPalette: () =>
          set((state) => {
            state.commandPaletteOpen = false;
            state.commandQuery = '';
          }),

        setCommandQuery: (query: string) =>
          set((state) => {
            state.commandQuery = query;
          }),

        // Quick actions
        toggleQuickActions: () =>
          set((state) => {
            state.quickActionsOpen = !state.quickActionsOpen;
          }),

        // Preferences
        updatePreferences: (preferences) =>
          set((state) => {
            Object.assign(state, preferences);
          }),

        // Developer tools
        toggleDevTools: () =>
          set((state) => {
            state.devToolsOpen = !state.devToolsOpen;
          }),

        setDebugMode: (enabled: boolean) =>
          set((state) => {
            state.debugMode = enabled;
          }),

        // Utility
        reset: () =>
          set((state) => {
            Object.assign(state, INITIAL_STATE);
          }),

        exportSettings: () => {
          const { theme, primaryColor, fontSize, density, animations, soundEffects, keyboardShortcuts, tooltips, confirmDestructive } = get();
          return JSON.stringify({
            theme,
            primaryColor,
            fontSize,
            density,
            animations,
            soundEffects,
            keyboardShortcuts,
            tooltips,
            confirmDestructive,
          });
        },

        importSettings: (settingsJson: string) => {
          try {
            const settings = JSON.parse(settingsJson);
            set((state) => {
              Object.assign(state, settings);
            });
          } catch (error) {
            console.error('Failed to import settings:', error);
          }
        },
      })),
      {
        name: 'agi-ui-store',
        version: 1,
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          primaryColor: state.primaryColor,
          fontSize: state.fontSize,
          density: state.density,
          reducedMotion: state.reducedMotion,
          animations: state.animations,
          soundEffects: state.soundEffects,
          keyboardShortcuts: state.keyboardShortcuts,
          tooltips: state.tooltips,
          confirmDestructive: state.confirmDestructive,
        }),
      }
    ),
    {
      name: 'UI Store',
    }
  )
);

// Selectors for optimized re-renders
export const useSidebar = () => useUIStore((state) => ({
  isOpen: state.sidebarOpen,
  isCollapsed: state.sidebarCollapsed,
}));

export const useTheme = () => useUIStore((state) => ({
  theme: state.theme,
  primaryColor: state.primaryColor,
  fontSize: state.fontSize,
  density: state.density,
  reducedMotion: state.reducedMotion,
}));

export const useModals = () => useUIStore((state) => ({
  modals: Object.values(state.modals),
  modalStack: state.modalStack,
  hasModals: state.modalStack.length > 0,
}));

export const useDrawers = () => useUIStore((state) => ({
  drawers: Object.values(state.drawers),
  activeDrawers: state.activeDrawers,
  hasDrawers: state.activeDrawers.length > 0,
}));

export const useResponsive = () => useUIStore((state) => ({
  breakpoint: state.breakpoint,
  isMobile: state.isMobile,
  isTablet: state.isTablet,
  isDesktop: state.isDesktop,
}));

export const useCommandPalette = () => useUIStore((state) => ({
  isOpen: state.commandPaletteOpen,
  query: state.commandQuery,
}));

export const useGlobalLoading = () => useUIStore((state) => ({
  isLoading: state.globalLoading,
  message: state.loadingMessage,
}));

export const usePreferences = () => useUIStore((state) => ({
  animations: state.animations,
  soundEffects: state.soundEffects,
  keyboardShortcuts: state.keyboardShortcuts,
  tooltips: state.tooltips,
  confirmDestructive: state.confirmDestructive,
}));