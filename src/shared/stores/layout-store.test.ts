/**
 * Layout Store Tests
 *
 * Tests for the UI state management including modals,
 * sidebar, theme, and dashboard settings.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUIStore } from './layout-store';
import type { UIState } from './layout-store';

describe('Layout Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useUIStore.getState().reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useUIStore.getState();

      expect(state.sidebarOpen).toBe(true);
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.theme).toBe('system');
    });

    it('should have all modals closed initially', () => {
      const state = useUIStore.getState();

      expect(state.modals.createEmployee).toBe(false);
      expect(state.modals.createProject).toBe(false);
      expect(state.modals.settings).toBe(false);
      expect(state.modals.billing).toBe(false);
      expect(state.modals.help).toBe(false);
    });

    it('should have default chat interface state', () => {
      const state = useUIStore.getState();

      expect(state.chatInterface.showTools).toBe(false);
      expect(state.chatInterface.selectedTools).toEqual([]);
      expect(state.chatInterface.currentConversation).toBeNull();
    });

    it('should have default dashboard state', () => {
      const state = useUIStore.getState();

      expect(state.dashboard.viewMode).toBe('grid');
      expect(state.dashboard.filters).toEqual({});
      expect(state.dashboard.sortBy).toBe('createdAt');
      expect(state.dashboard.sortOrder).toBe('desc');
    });

    it('should have notifications enabled by default', () => {
      const state = useUIStore.getState();

      expect(state.notifications.enabled).toBe(true);
      expect(state.notifications.sound).toBe(true);
      expect(state.notifications.desktop).toBe(true);
    });
  });

  describe('Sidebar Actions', () => {
    it('should toggle sidebar', () => {
      const { toggleSidebar } = useUIStore.getState();

      expect(useUIStore.getState().sidebarOpen).toBe(true);

      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should set sidebar open state', () => {
      const { setSidebarOpen } = useUIStore.getState();

      setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should set sidebar collapsed state', () => {
      const { setSidebarCollapsed } = useUIStore.getState();

      setSidebarCollapsed(true);
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      setSidebarCollapsed(false);
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('Modal Actions', () => {
    it('should open modal', () => {
      const { openModal } = useUIStore.getState();

      openModal('settings');
      expect(useUIStore.getState().modals.settings).toBe(true);
    });

    it('should close modal', () => {
      const { openModal, closeModal } = useUIStore.getState();

      openModal('settings');
      expect(useUIStore.getState().modals.settings).toBe(true);

      closeModal('settings');
      expect(useUIStore.getState().modals.settings).toBe(false);
    });

    it('should close all modals', () => {
      const { openModal, closeAllModals } = useUIStore.getState();

      // Open multiple modals
      openModal('settings');
      openModal('billing');
      openModal('help');

      expect(useUIStore.getState().modals.settings).toBe(true);
      expect(useUIStore.getState().modals.billing).toBe(true);
      expect(useUIStore.getState().modals.help).toBe(true);

      closeAllModals();

      const modals = useUIStore.getState().modals;
      expect(modals.settings).toBe(false);
      expect(modals.billing).toBe(false);
      expect(modals.help).toBe(false);
      expect(modals.createEmployee).toBe(false);
      expect(modals.createProject).toBe(false);
    });

    it('should handle opening same modal multiple times', () => {
      const { openModal } = useUIStore.getState();

      openModal('settings');
      openModal('settings');
      openModal('settings');

      expect(useUIStore.getState().modals.settings).toBe(true);
    });

    it('should handle closing already closed modal', () => {
      const { closeModal } = useUIStore.getState();

      closeModal('settings');
      expect(useUIStore.getState().modals.settings).toBe(false);
    });
  });

  describe('Theme Actions', () => {
    it('should set theme to light', () => {
      const { setTheme } = useUIStore.getState();

      setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
    });

    it('should set theme to dark', () => {
      const { setTheme } = useUIStore.getState();

      setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
    });

    it('should set theme to system', () => {
      const { setTheme } = useUIStore.getState();

      setTheme('dark');
      setTheme('system');
      expect(useUIStore.getState().theme).toBe('system');
    });
  });

  describe('Chat Interface Actions', () => {
    it('should toggle chat tools', () => {
      const { toggleChatTools } = useUIStore.getState();

      expect(useUIStore.getState().chatInterface.showTools).toBe(false);

      toggleChatTools();
      expect(useUIStore.getState().chatInterface.showTools).toBe(true);

      toggleChatTools();
      expect(useUIStore.getState().chatInterface.showTools).toBe(false);
    });

    it('should set selected tools', () => {
      const { setSelectedTools } = useUIStore.getState();

      setSelectedTools(['Read', 'Write', 'Bash']);
      expect(useUIStore.getState().chatInterface.selectedTools).toEqual([
        'Read',
        'Write',
        'Bash',
      ]);
    });

    it('should handle empty tools array', () => {
      const { setSelectedTools } = useUIStore.getState();

      setSelectedTools(['Read']);
      setSelectedTools([]);
      expect(useUIStore.getState().chatInterface.selectedTools).toEqual([]);
    });

    it('should set current conversation', () => {
      const { setCurrentConversation } = useUIStore.getState();

      setCurrentConversation('conv-123');
      expect(useUIStore.getState().chatInterface.currentConversation).toBe(
        'conv-123'
      );
    });

    it('should clear current conversation', () => {
      const { setCurrentConversation } = useUIStore.getState();

      setCurrentConversation('conv-123');
      setCurrentConversation(null);
      expect(useUIStore.getState().chatInterface.currentConversation).toBeNull();
    });
  });

  describe('Dashboard Actions', () => {
    it('should set view mode to grid', () => {
      const { setViewMode } = useUIStore.getState();

      setViewMode('list');
      setViewMode('grid');
      expect(useUIStore.getState().dashboard.viewMode).toBe('grid');
    });

    it('should set view mode to list', () => {
      const { setViewMode } = useUIStore.getState();

      setViewMode('list');
      expect(useUIStore.getState().dashboard.viewMode).toBe('list');
    });

    it('should set filters', () => {
      const { setFilters } = useUIStore.getState();

      const filters = { status: 'active', category: 'work' };
      setFilters(filters);
      expect(useUIStore.getState().dashboard.filters).toEqual(filters);
    });

    it('should clear filters', () => {
      const { setFilters } = useUIStore.getState();

      setFilters({ status: 'active' });
      setFilters({});
      expect(useUIStore.getState().dashboard.filters).toEqual({});
    });

    it('should set sort by field', () => {
      const { setSortBy } = useUIStore.getState();

      setSortBy('name');
      expect(useUIStore.getState().dashboard.sortBy).toBe('name');
    });

    it('should set sort order', () => {
      const { setSortOrder } = useUIStore.getState();

      setSortOrder('asc');
      expect(useUIStore.getState().dashboard.sortOrder).toBe('asc');

      setSortOrder('desc');
      expect(useUIStore.getState().dashboard.sortOrder).toBe('desc');
    });
  });

  describe('Notification Actions', () => {
    it('should toggle notification enabled', () => {
      const { setNotificationEnabled } = useUIStore.getState();

      setNotificationEnabled(false);
      expect(useUIStore.getState().notifications.enabled).toBe(false);

      setNotificationEnabled(true);
      expect(useUIStore.getState().notifications.enabled).toBe(true);
    });

    it('should toggle notification sound', () => {
      const { setNotificationSound } = useUIStore.getState();

      setNotificationSound(false);
      expect(useUIStore.getState().notifications.sound).toBe(false);
    });

    it('should toggle desktop notifications', () => {
      const { setDesktopNotifications } = useUIStore.getState();

      setDesktopNotifications(false);
      expect(useUIStore.getState().notifications.desktop).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state to initial values', () => {
      const {
        setSidebarOpen,
        openModal,
        setTheme,
        setSelectedTools,
        setViewMode,
        setNotificationEnabled,
        reset,
      } = useUIStore.getState();

      // Modify various state
      setSidebarOpen(false);
      openModal('settings');
      setTheme('dark');
      setSelectedTools(['Read']);
      setViewMode('list');
      setNotificationEnabled(false);

      // Reset
      reset();

      const state = useUIStore.getState();
      expect(state.sidebarOpen).toBe(true);
      expect(state.modals.settings).toBe(false);
      expect(state.theme).toBe('system');
      expect(state.chatInterface.selectedTools).toEqual([]);
      expect(state.dashboard.viewMode).toBe('grid');
      expect(state.notifications.enabled).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid state changes', () => {
      const { toggleSidebar, setTheme, openModal } = useUIStore.getState();

      // Rapid toggles
      toggleSidebar();
      toggleSidebar();
      toggleSidebar();
      setTheme('dark');
      setTheme('light');
      setTheme('dark');
      openModal('settings');
      openModal('billing');

      const state = useUIStore.getState();
      expect(state.sidebarOpen).toBe(false);
      expect(state.theme).toBe('dark');
      expect(state.modals.settings).toBe(true);
      expect(state.modals.billing).toBe(true);
    });

    it('should preserve unrelated state during updates', () => {
      const { setTheme, setSortBy, setNotificationSound } =
        useUIStore.getState();

      setTheme('dark');
      setSortBy('name');
      setNotificationSound(false);

      const state = useUIStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.dashboard.sortBy).toBe('name');
      expect(state.notifications.sound).toBe(false);
      // Unmodified state should remain
      expect(state.sidebarOpen).toBe(true);
      expect(state.dashboard.viewMode).toBe('grid');
    });

    it('should handle complex filter objects', () => {
      const { setFilters } = useUIStore.getState();

      const complexFilters = {
        status: 'active',
        tags: ['urgent', 'important'],
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        nested: { deep: { value: true } },
      };

      setFilters(complexFilters);
      expect(useUIStore.getState().dashboard.filters).toEqual(complexFilters);
    });
  });
});
