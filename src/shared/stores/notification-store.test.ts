/**
 * Notification Store Tests
 *
 * Tests for app-wide notification management including toasts,
 * persistent notifications, and settings.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useNotificationStore,
  type Notification,
  type Toast,
} from './notification-store';

describe('Notification Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useNotificationStore.getState().clearAll();
    useNotificationStore.getState().clearToasts();
    vi.useFakeTimers();
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Notification Management', () => {
    describe('addNotification', () => {
      it('should add a notification with auto-generated id and timestamp', () => {
        const { addNotification } = useNotificationStore.getState();

        const id = addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
          priority: 'medium',
          persistent: false,
        });

        const state = useNotificationStore.getState();
        expect(state.notifications[id]).toBeDefined();
        expect(state.notifications[id].title).toBe('Test');
        expect(state.notifications[id].read).toBe(false);
        expect(state.notifications[id].timestamp).toBeInstanceOf(Date);
      });

      it('should increment unread count', () => {
        const { addNotification } = useNotificationStore.getState();

        expect(useNotificationStore.getState().unreadCount).toBe(0);

        addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
          priority: 'medium',
          persistent: false,
        });

        expect(useNotificationStore.getState().unreadCount).toBe(1);
      });

      it('should auto-close notification if autoClose is specified', () => {
        const { addNotification, removeNotification } =
          useNotificationStore.getState();

        const id = addNotification({
          type: 'info',
          title: 'Test',
          message: 'Auto-closing',
          priority: 'medium',
          persistent: false,
          autoClose: 5000,
        });

        expect(useNotificationStore.getState().notifications[id]).toBeDefined();

        // Advance time past autoClose
        vi.advanceTimersByTime(5001);

        expect(
          useNotificationStore.getState().notifications[id]
        ).toBeUndefined();
      });
    });

    describe('updateNotification', () => {
      it('should update notification properties', () => {
        const { addNotification, updateNotification } =
          useNotificationStore.getState();

        const id = addNotification({
          type: 'info',
          title: 'Original',
          message: 'Original message',
          priority: 'medium',
          persistent: false,
        });

        updateNotification(id, { title: 'Updated' });

        expect(useNotificationStore.getState().notifications[id].title).toBe(
          'Updated'
        );
      });

      it('should update unread count when marking as read', () => {
        const { addNotification, updateNotification } =
          useNotificationStore.getState();

        const id = addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test',
          priority: 'medium',
          persistent: false,
        });

        expect(useNotificationStore.getState().unreadCount).toBe(1);

        updateNotification(id, { read: true });

        expect(useNotificationStore.getState().unreadCount).toBe(0);
      });

      it('should handle non-existent notification gracefully', () => {
        const { updateNotification } = useNotificationStore.getState();

        // Should not throw
        expect(() => {
          updateNotification('nonexistent', { title: 'Test' });
        }).not.toThrow();
      });
    });

    describe('removeNotification', () => {
      it('should remove notification', () => {
        const { addNotification, removeNotification } =
          useNotificationStore.getState();

        const id = addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test',
          priority: 'medium',
          persistent: false,
        });

        removeNotification(id);

        expect(
          useNotificationStore.getState().notifications[id]
        ).toBeUndefined();
      });

      it('should decrement unread count for unread notifications', () => {
        const { addNotification, removeNotification } =
          useNotificationStore.getState();

        const id = addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test',
          priority: 'medium',
          persistent: false,
        });

        expect(useNotificationStore.getState().unreadCount).toBe(1);

        removeNotification(id);

        expect(useNotificationStore.getState().unreadCount).toBe(0);
      });

      it('should not decrement unread count for read notifications', () => {
        const { addNotification, updateNotification, removeNotification } =
          useNotificationStore.getState();

        const id = addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test',
          priority: 'medium',
          persistent: false,
        });

        updateNotification(id, { read: true });
        expect(useNotificationStore.getState().unreadCount).toBe(0);

        removeNotification(id);
        expect(useNotificationStore.getState().unreadCount).toBe(0);
      });
    });

    describe('markAsRead', () => {
      it('should mark notification as read', () => {
        const { addNotification, markAsRead } = useNotificationStore.getState();

        const id = addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test',
          priority: 'medium',
          persistent: false,
        });

        markAsRead(id);

        expect(useNotificationStore.getState().notifications[id].read).toBe(
          true
        );
      });
    });

    describe('markAllAsRead', () => {
      it('should mark all notifications as read', () => {
        const { addNotification, markAllAsRead } =
          useNotificationStore.getState();

        addNotification({
          type: 'info',
          title: 'Test 1',
          message: 'Test',
          priority: 'medium',
          persistent: false,
        });

        addNotification({
          type: 'warning',
          title: 'Test 2',
          message: 'Test',
          priority: 'high',
          persistent: false,
        });

        markAllAsRead();

        const state = useNotificationStore.getState();
        expect(state.unreadCount).toBe(0);
        Object.values(state.notifications).forEach((n) => {
          expect(n.read).toBe(true);
        });
      });
    });

    describe('clearAll', () => {
      it('should remove all notifications', () => {
        const { addNotification, clearAll } = useNotificationStore.getState();

        addNotification({
          type: 'info',
          title: 'Test 1',
          message: 'Test',
          priority: 'medium',
          persistent: false,
        });

        addNotification({
          type: 'warning',
          title: 'Test 2',
          message: 'Test',
          priority: 'high',
          persistent: false,
        });

        clearAll();

        const state = useNotificationStore.getState();
        expect(Object.keys(state.notifications)).toHaveLength(0);
        expect(state.unreadCount).toBe(0);
      });
    });

    describe('clearOld', () => {
      it('should clear notifications older than specified days', () => {
        const { addNotification, clearOld } = useNotificationStore.getState();
        const now = new Date();

        // Add a notification
        const id = addNotification({
          type: 'info',
          title: 'Old',
          message: 'Old notification',
          priority: 'medium',
          persistent: false,
        });

        // Manually set the timestamp to 10 days ago
        useNotificationStore.setState((state) => {
          state.notifications[id].timestamp = new Date(
            now.getTime() - 10 * 24 * 60 * 60 * 1000
          );
          return state;
        });

        // Clear notifications older than 7 days
        clearOld(7);

        expect(
          useNotificationStore.getState().notifications[id]
        ).toBeUndefined();
      });

      it('should not clear persistent notifications', () => {
        const { addNotification, clearOld } = useNotificationStore.getState();
        const now = new Date();

        const id = addNotification({
          type: 'info',
          title: 'Old Persistent',
          message: 'Old persistent notification',
          priority: 'medium',
          persistent: true,
        });

        // Manually set the timestamp to 10 days ago
        useNotificationStore.setState((state) => {
          state.notifications[id].timestamp = new Date(
            now.getTime() - 10 * 24 * 60 * 60 * 1000
          );
          return state;
        });

        clearOld(7);

        // Persistent notification should remain
        expect(useNotificationStore.getState().notifications[id]).toBeDefined();
      });
    });
  });

  describe('Toast Management', () => {
    describe('showToast', () => {
      it('should show toast with auto-generated id', () => {
        const { showToast } = useNotificationStore.getState();

        const id = showToast({
          type: 'success',
          message: 'Test toast',
          duration: 3000,
        });

        const state = useNotificationStore.getState();
        expect(state.toasts[id]).toBeDefined();
        expect(state.toasts[id].message).toBe('Test toast');
      });

      it('should auto-remove toast after duration', () => {
        const { showToast } = useNotificationStore.getState();

        const id = showToast({
          type: 'success',
          message: 'Test toast',
          duration: 3000,
        });

        expect(useNotificationStore.getState().toasts[id]).toBeDefined();

        vi.advanceTimersByTime(3001);

        expect(useNotificationStore.getState().toasts[id]).toBeUndefined();
      });
    });

    describe('removeToast', () => {
      it('should remove toast', () => {
        const { showToast, removeToast } = useNotificationStore.getState();

        const id = showToast({
          type: 'success',
          message: 'Test toast',
          duration: 5000,
        });

        removeToast(id);

        expect(useNotificationStore.getState().toasts[id]).toBeUndefined();
      });

      it('should call onClose callback when removing', () => {
        const { showToast, removeToast } = useNotificationStore.getState();
        const onClose = vi.fn();

        const id = showToast({
          type: 'success',
          message: 'Test toast',
          duration: 5000,
          onClose,
        });

        removeToast(id);

        expect(onClose).toHaveBeenCalled();
      });
    });

    describe('clearToasts', () => {
      it('should remove all toasts', () => {
        const { showToast, clearToasts } = useNotificationStore.getState();

        showToast({ type: 'success', message: 'Toast 1', duration: 5000 });
        showToast({ type: 'error', message: 'Toast 2', duration: 5000 });

        clearToasts();

        expect(
          Object.keys(useNotificationStore.getState().toasts)
        ).toHaveLength(0);
      });

      it('should call onClose for all toasts', () => {
        const { showToast, clearToasts } = useNotificationStore.getState();
        const onClose1 = vi.fn();
        const onClose2 = vi.fn();

        showToast({
          type: 'success',
          message: 'Toast 1',
          duration: 5000,
          onClose: onClose1,
        });
        showToast({
          type: 'error',
          message: 'Toast 2',
          duration: 5000,
          onClose: onClose2,
        });

        clearToasts();

        expect(onClose1).toHaveBeenCalled();
        expect(onClose2).toHaveBeenCalled();
      });
    });
  });

  describe('Quick Notification Methods', () => {
    describe('showSuccess', () => {
      it('should create success notification with defaults', () => {
        const { showSuccess } = useNotificationStore.getState();

        showSuccess('Success message');

        const state = useNotificationStore.getState();
        const notifications = Object.values(state.notifications);
        expect(notifications).toHaveLength(1);
        expect(notifications[0].type).toBe('success');
        expect(notifications[0].title).toBe('Success');
        expect(notifications[0].message).toBe('Success message');
        expect(notifications[0].priority).toBe('medium');
        expect(notifications[0].persistent).toBe(false);
      });

      it('should allow custom title', () => {
        const { showSuccess } = useNotificationStore.getState();

        showSuccess('Success message', 'Custom Title');

        const notifications = Object.values(
          useNotificationStore.getState().notifications
        );
        expect(notifications[0].title).toBe('Custom Title');
      });
    });

    describe('showError', () => {
      it('should create error notification with high priority and persistent', () => {
        const { showError } = useNotificationStore.getState();

        showError('Error message');

        const notifications = Object.values(
          useNotificationStore.getState().notifications
        );
        expect(notifications[0].type).toBe('error');
        expect(notifications[0].priority).toBe('high');
        expect(notifications[0].persistent).toBe(true);
      });
    });

    describe('showWarning', () => {
      it('should create warning notification', () => {
        const { showWarning } = useNotificationStore.getState();

        showWarning('Warning message');

        const notifications = Object.values(
          useNotificationStore.getState().notifications
        );
        expect(notifications[0].type).toBe('warning');
        expect(notifications[0].priority).toBe('medium');
        expect(notifications[0].persistent).toBe(true);
      });
    });

    describe('showInfo', () => {
      it('should create info notification with auto-close', () => {
        const { showInfo } = useNotificationStore.getState();

        showInfo('Info message');

        const notifications = Object.values(
          useNotificationStore.getState().notifications
        );
        expect(notifications[0].type).toBe('info');
        expect(notifications[0].priority).toBe('low');
        expect(notifications[0].persistent).toBe(false);
        expect(notifications[0].autoClose).toBe(4000);
      });
    });
  });

  describe('Settings Management', () => {
    describe('updateSettings', () => {
      it('should update settings', () => {
        const { updateSettings } = useNotificationStore.getState();

        updateSettings({ muteAll: true });

        expect(useNotificationStore.getState().settings.muteAll).toBe(true);
      });

      it('should merge with existing settings', () => {
        const { updateSettings } = useNotificationStore.getState();

        updateSettings({ enableDesktopNotifications: false });

        const settings = useNotificationStore.getState().settings;
        expect(settings.enableDesktopNotifications).toBe(false);
        expect(settings.enableSoundNotifications).toBe(true); // Unchanged
      });
    });

    describe('setCategorySettings', () => {
      it('should set category-specific settings', () => {
        const { setCategorySettings } = useNotificationStore.getState();

        setCategorySettings('custom', {
          enabled: true,
          desktop: false,
          sound: true,
          email: false,
        });

        const settings = useNotificationStore.getState().settings;
        expect(settings.categories['custom']).toEqual({
          enabled: true,
          desktop: false,
          sound: true,
          email: false,
        });
      });
    });
  });

  describe('UI State Management', () => {
    describe('openNotifications/closeNotifications/toggleNotifications', () => {
      it('should manage isOpen state', () => {
        const { openNotifications, closeNotifications, toggleNotifications } =
          useNotificationStore.getState();

        expect(useNotificationStore.getState().isOpen).toBe(false);

        openNotifications();
        expect(useNotificationStore.getState().isOpen).toBe(true);

        closeNotifications();
        expect(useNotificationStore.getState().isOpen).toBe(false);

        toggleNotifications();
        expect(useNotificationStore.getState().isOpen).toBe(true);

        useNotificationStore.getState().toggleNotifications();
        expect(useNotificationStore.getState().isOpen).toBe(false);
      });
    });

    describe('setSelectedCategory', () => {
      it('should set selected category', () => {
        const { setSelectedCategory } = useNotificationStore.getState();

        setSelectedCategory('billing');
        expect(useNotificationStore.getState().selectedCategory).toBe(
          'billing'
        );

        setSelectedCategory(null);
        expect(useNotificationStore.getState().selectedCategory).toBeNull();
      });
    });
  });

  describe('Utility Functions', () => {
    describe('getNotificationsByCategory', () => {
      it('should filter notifications by category', () => {
        const { addNotification, getNotificationsByCategory } =
          useNotificationStore.getState();

        addNotification({
          type: 'info',
          title: 'System',
          message: 'System notification',
          priority: 'medium',
          persistent: false,
          category: 'system',
        });

        addNotification({
          type: 'info',
          title: 'Billing',
          message: 'Billing notification',
          priority: 'medium',
          persistent: false,
          category: 'billing',
        });

        const systemNotifications = useNotificationStore
          .getState()
          .getNotificationsByCategory('system');
        expect(systemNotifications).toHaveLength(1);
        expect(systemNotifications[0].title).toBe('System');
      });
    });

    describe('getUnreadNotifications', () => {
      it('should return only unread notifications', () => {
        const { addNotification, markAsRead, getUnreadNotifications } =
          useNotificationStore.getState();

        const id1 = addNotification({
          type: 'info',
          title: 'Unread',
          message: 'Unread notification',
          priority: 'medium',
          persistent: false,
        });

        addNotification({
          type: 'info',
          title: 'Will be read',
          message: 'Read notification',
          priority: 'medium',
          persistent: false,
        });

        markAsRead(id1);

        const unread = useNotificationStore.getState().getUnreadNotifications();
        expect(unread).toHaveLength(1);
        expect(unread[0].title).toBe('Will be read');
      });
    });

    describe('cleanup', () => {
      it('should clear old notifications and toasts', () => {
        const { addNotification, showToast, cleanup } =
          useNotificationStore.getState();

        addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test',
          priority: 'medium',
          persistent: false,
        });

        showToast({
          type: 'success',
          message: 'Toast',
          duration: 5000,
        });

        // Should not throw
        expect(() => {
          cleanup();
        }).not.toThrow();

        // Toasts should be cleared
        expect(
          Object.keys(useNotificationStore.getState().toasts)
        ).toHaveLength(0);
      });
    });
  });
});
