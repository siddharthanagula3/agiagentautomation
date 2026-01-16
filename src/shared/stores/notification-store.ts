/**
 * Notification store using Zustand
 * Handles app-wide notifications, alerts, and user messages
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Track auto-close timeouts to prevent memory leaks
const notificationTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent: boolean;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  metadata?: Record<string, unknown>;
  autoClose?: number; // ms until auto-close
  category?: string;
  priority: 'low' | 'medium' | 'high';
  source?: string; // Where the notification came from
}

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
}

export interface NotificationState {
  // Notifications (persistent)
  notifications: Record<string, Notification>;
  unreadCount: number;

  // Toasts (temporary)
  toasts: Record<string, Toast>;

  // Settings
  settings: {
    enableDesktopNotifications: boolean;
    enableSoundNotifications: boolean;
    enableEmailNotifications: boolean;
    muteAll: boolean;
    categories: {
      [key: string]: {
        enabled: boolean;
        desktop: boolean;
        sound: boolean;
        email: boolean;
      };
    };
  };

  // UI state
  isOpen: boolean;
  selectedCategory: string | null;

  // Permissions
  desktopPermission: 'default' | 'granted' | 'denied';
}

export interface NotificationActions {
  // Notification management
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => string;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearOld: (olderThan: number) => void; // Clear notifications older than X days

  // Toast management
  showToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Quick notification methods
  showSuccess: (
    message: string,
    title?: string,
    options?: Partial<Notification>
  ) => void;
  showError: (
    message: string,
    title?: string,
    options?: Partial<Notification>
  ) => void;
  showWarning: (
    message: string,
    title?: string,
    options?: Partial<Notification>
  ) => void;
  showInfo: (
    message: string,
    title?: string,
    options?: Partial<Notification>
  ) => void;

  // Settings
  updateSettings: (settings: Partial<NotificationState['settings']>) => void;
  setCategorySettings: (
    category: string,
    settings: NotificationState['settings']['categories'][string]
  ) => void;

  // UI state
  openNotifications: () => void;
  closeNotifications: () => void;
  toggleNotifications: () => void;
  setSelectedCategory: (category: string | null) => void;

  // Permissions
  requestDesktopPermission: () => Promise<NotificationPermission>;

  // System integration
  sendDesktopNotification: (notification: Notification) => void;
  playNotificationSound: () => void;

  // Utility
  getNotificationsByCategory: (category: string) => Notification[];
  getUnreadNotifications: () => Notification[];
  cleanup: () => void;
}

export interface NotificationStore
  extends NotificationState,
    NotificationActions {}

const DEFAULT_SETTINGS: NotificationState['settings'] = {
  enableDesktopNotifications: true,
  enableSoundNotifications: true,
  enableEmailNotifications: false,
  muteAll: false,
  categories: {
    system: { enabled: true, desktop: true, sound: true, email: false },
    auth: { enabled: true, desktop: true, sound: false, email: true },
    chat: { enabled: true, desktop: false, sound: true, email: false },
    workforce: { enabled: true, desktop: true, sound: true, email: false },
    employee: { enabled: true, desktop: false, sound: false, email: false },
    billing: { enabled: true, desktop: true, sound: true, email: true },
  },
};

const INITIAL_STATE: NotificationState = {
  notifications: {},
  unreadCount: 0,
  toasts: {},
  settings: DEFAULT_SETTINGS,
  isOpen: false,
  selectedCategory: null,
  desktopPermission: 'default',
};

const enableDevtools = import.meta.env.MODE !== 'production';

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...INITIAL_STATE,

        // Notification management
        addNotification: (
          notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>
        ) => {
          const id = crypto.randomUUID();
          const notification: Notification = {
            ...notificationData,
            id,
            timestamp: new Date(),
            read: false,
          };

          set((state) => {
            state.notifications[id] = notification;
            state.unreadCount += 1;
          });

          // Send desktop notification if enabled
          const { settings, sendDesktopNotification } = get();
          const categorySettings =
            settings.categories[notification.category || 'system'];

          if (
            !settings.muteAll &&
            settings.enableDesktopNotifications &&
            categorySettings?.desktop
          ) {
            sendDesktopNotification(notification);
          }

          // Play sound if enabled
          if (
            !settings.muteAll &&
            settings.enableSoundNotifications &&
            categorySettings?.sound
          ) {
            get().playNotificationSound();
          }

          // Auto-remove if specified (track timeout for cleanup)
          if (notification.autoClose) {
            const timeoutId = setTimeout(() => {
              notificationTimeouts.delete(id);
              get().removeNotification(id);
            }, notification.autoClose);
            notificationTimeouts.set(id, timeoutId);
          }

          return id;
        },

        updateNotification: (id: string, updates: Partial<Notification>) =>
          set((state) => {
            if (state.notifications[id]) {
              const wasUnread = !state.notifications[id].read;
              state.notifications[id] = {
                ...state.notifications[id],
                ...updates,
              };

              // Update unread count if read status changed
              if (wasUnread && updates.read === true) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              } else if (!wasUnread && updates.read === false) {
                state.unreadCount += 1;
              }
            }
          }),

        removeNotification: (id: string) =>
          set((state) => {
            const notification = state.notifications[id];
            if (notification) {
              // Clear any pending auto-close timeout
              const timeoutId = notificationTimeouts.get(id);
              if (timeoutId) {
                clearTimeout(timeoutId);
                notificationTimeouts.delete(id);
              }
              if (!notification.read) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
              delete state.notifications[id];
            }
          }),

        markAsRead: (id: string) => {
          get().updateNotification(id, { read: true });
        },

        markAllAsRead: () =>
          set((state) => {
            Object.values(state.notifications).forEach((notification) => {
              if (!notification.read) {
                notification.read = true;
              }
            });
            state.unreadCount = 0;
          }),

        clearAll: () =>
          set((state) => {
            // Clear all pending auto-close timeouts to prevent memory leaks
            notificationTimeouts.forEach((timeoutId) => {
              clearTimeout(timeoutId);
            });
            notificationTimeouts.clear();

            state.notifications = {};
            state.unreadCount = 0;
          }),

        clearOld: (olderThan: number) => {
          const cutoffDate = new Date(
            Date.now() - olderThan * 24 * 60 * 60 * 1000
          );

          set((state) => {
            let clearedUnread = 0;
            Object.entries(state.notifications).forEach(
              ([id, notification]) => {
                if (
                  notification.timestamp < cutoffDate &&
                  !notification.persistent
                ) {
                  if (!notification.read) clearedUnread++;
                  delete state.notifications[id];
                }
              }
            );
            state.unreadCount = Math.max(0, state.unreadCount - clearedUnread);
          });
        },

        // Toast management
        showToast: (toastData: Omit<Toast, 'id'>) => {
          const id = crypto.randomUUID();
          const toast: Toast = {
            ...toastData,
            id,
          };

          set((state) => {
            state.toasts[id] = toast;
          });

          // Auto-remove after duration - track timeout to prevent memory leaks
          const timeoutId = setTimeout(() => {
            // Clean up the timeout tracking
            toastTimeouts.delete(id);
            get().removeToast(id);
          }, toast.duration);

          // Track the timeout so it can be cleared on manual removal
          toastTimeouts.set(id, timeoutId);

          return id;
        },

        removeToast: (id: string) => {
          // Clear any pending auto-close timeout to prevent memory leaks
          const timeoutId = toastTimeouts.get(id);
          if (timeoutId) {
            clearTimeout(timeoutId);
            toastTimeouts.delete(id);
          }

          set((state) => {
            const toast = state.toasts[id];
            if (toast?.onClose) {
              toast.onClose();
            }
            delete state.toasts[id];
          });
        },

        clearToasts: () => {
          // Clear all pending auto-close timeouts to prevent memory leaks
          toastTimeouts.forEach((timeoutId) => {
            clearTimeout(timeoutId);
          });
          toastTimeouts.clear();

          set((state) => {
            Object.values(state.toasts).forEach((toast) => {
              if (toast.onClose) toast.onClose();
            });
            state.toasts = {};
          });
        },

        // Quick notification methods
        showSuccess: (message: string, title?: string, options = {}) => {
          get().addNotification({
            type: 'success',
            title: title || 'Success',
            message,
            priority: 'medium',
            persistent: false,
            autoClose: 5000,
            ...options,
          });
        },

        showError: (message: string, title?: string, options = {}) => {
          get().addNotification({
            type: 'error',
            title: title || 'Error',
            message,
            priority: 'high',
            persistent: true,
            ...options,
          });
        },

        showWarning: (message: string, title?: string, options = {}) => {
          get().addNotification({
            type: 'warning',
            title: title || 'Warning',
            message,
            priority: 'medium',
            persistent: true,
            ...options,
          });
        },

        showInfo: (message: string, title?: string, options = {}) => {
          get().addNotification({
            type: 'info',
            title: title || 'Info',
            message,
            priority: 'low',
            persistent: false,
            autoClose: 4000,
            ...options,
          });
        },

        // Settings
        updateSettings: (newSettings: Partial<NotificationState['settings']>) =>
          set((state) => {
            state.settings = { ...state.settings, ...newSettings };
          }),

        setCategorySettings: (
          category: string,
          categorySettings: NotificationState['settings']['categories'][string]
        ) =>
          set((state) => {
            state.settings.categories[category] = categorySettings;
          }),

        // UI state
        openNotifications: () =>
          set((state) => {
            state.isOpen = true;
          }),

        closeNotifications: () =>
          set((state) => {
            state.isOpen = false;
          }),

        toggleNotifications: () =>
          set((state) => {
            state.isOpen = !state.isOpen;
          }),

        setSelectedCategory: (category: string | null) =>
          set((state) => {
            state.selectedCategory = category;
          }),

        // Permissions
        requestDesktopPermission: async () => {
          if (!('Notification' in window)) {
            set((state) => {
              state.desktopPermission = 'denied';
            });
            return 'denied';
          }

          const permission = await Notification.requestPermission();

          set((state) => {
            state.desktopPermission = permission;
          });

          return permission;
        },

        // System integration
        sendDesktopNotification: (notification: Notification) => {
          const { desktopPermission } = get();

          if (desktopPermission === 'granted' && 'Notification' in window) {
            const desktopNotification = new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico', // Adjust path as needed
              badge: '/badge.png', // Adjust path as needed
              tag: notification.id,
              renotify: false,
              requireInteraction: notification.priority === 'high',
            });

            desktopNotification.onclick = () => {
              window.focus();
              get().openNotifications();
              get().markAsRead(notification.id);
              desktopNotification.close();
            };

            // Auto-close desktop notification
            setTimeout(() => {
              desktopNotification.close();
            }, 5000);
          }
        },

        playNotificationSound: () => {
          try {
            // Create a simple beep sound
            const audioContext = new (window.AudioContext ||
              (window as { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(
              0.2,
              audioContext.currentTime + 0.01
            );
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.currentTime + 0.3
            );

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
          } catch (error) {
            console.warn('Could not play notification sound:', error);
          }
        },

        // Utility
        getNotificationsByCategory: (category: string) => {
          const { notifications } = get();
          return Object.values(notifications).filter(
            (notification) => notification.category === category
          );
        },

        getUnreadNotifications: () => {
          const { notifications } = get();
          return Object.values(notifications).filter(
            (notification) => !notification.read
          );
        },

        cleanup: () => {
          // Clear all pending auto-close timeouts
          notificationTimeouts.forEach((timeoutId) => {
            clearTimeout(timeoutId);
          });
          notificationTimeouts.clear();

          // Clean up old notifications (older than 30 days)
          get().clearOld(30);

          // Clear all toasts
          get().clearToasts();
        },
      })),
      {
        name: 'agi-notification-store',
        version: 1,
        partialize: (state) => ({
          notifications: state.notifications,
          unreadCount: state.unreadCount,
          settings: state.settings,
        }),
      }
    ),
    {
      name: 'Notification Store',
      enabled: enableDevtools,
    }
  )
);

// Selectors for optimized re-renders
export const useNotifications = () =>
  useNotificationStore((state) =>
    Object.values(state.notifications).sort((a, b) => {
      const aTime =
        a.timestamp instanceof Date
          ? a.timestamp.getTime()
          : new Date(a.timestamp).getTime();
      const bTime =
        b.timestamp instanceof Date
          ? b.timestamp.getTime()
          : new Date(b.timestamp).getTime();
      return bTime - aTime;
    })
  );

export const useUnreadNotifications = () =>
  useNotificationStore((state) =>
    Object.values(state.notifications)
      .filter((n) => !n.read)
      .sort((a, b) => {
        const aTime =
          a.timestamp instanceof Date
            ? a.timestamp.getTime()
            : new Date(a.timestamp).getTime();
        const bTime =
          b.timestamp instanceof Date
            ? b.timestamp.getTime()
            : new Date(b.timestamp).getTime();
        return bTime - aTime;
      })
  );

export const useToasts = () =>
  useNotificationStore((state) => Object.values(state.toasts));
export const useUnreadCount = () =>
  useNotificationStore((state) => state.unreadCount);
export const useNotificationSettings = () =>
  useNotificationStore((state) => state.settings);
