/**
 * Session Timeout Hook
 * Tracks user activity and enforces session timeout based on user preferences
 *
 * @module shared/hooks/useSessionTimeout
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuthStore } from '@shared/stores/authentication-store';
import { useUserSettings } from '@features/settings/hooks/use-settings-queries';
import { logger } from '@shared/lib/logger';

// Constants
const ACTIVITY_STORAGE_KEY = 'agi_last_activity';
const WARNING_TIME_BEFORE_TIMEOUT_MS = 2 * 60 * 1000; // Show warning 2 minutes before timeout
const ACTIVITY_CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds
const ACTIVITY_THROTTLE_MS = 5 * 1000; // Throttle activity updates to every 5 seconds
const DEFAULT_SESSION_TIMEOUT_MINUTES = 60; // Default 60 minutes if not set

// Events that indicate user activity
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'focus',
];

export interface SessionTimeoutState {
  /** Whether the session has timed out */
  isTimedOut: boolean;
  /** Whether we're in the warning period before timeout */
  isWarningActive: boolean;
  /** Seconds remaining until timeout (only meaningful when warning is active) */
  secondsUntilTimeout: number;
  /** The configured session timeout in minutes */
  timeoutMinutes: number;
  /** Last recorded activity timestamp */
  lastActivity: number;
}

export interface UseSessionTimeoutOptions {
  /** Whether to enable session timeout enforcement (default: true) */
  enabled?: boolean;
  /** Callback when session times out */
  onTimeout?: () => void;
  /** Callback when warning period starts */
  onWarning?: (secondsRemaining: number) => void;
  /** Callback when user activity extends the session during warning */
  onSessionExtended?: () => void;
}

export interface UseSessionTimeoutReturn extends SessionTimeoutState {
  /** Manually extend the session (reset activity timer) */
  extendSession: () => void;
  /** Force immediate logout */
  forceLogout: () => void;
}

/**
 * Get the last activity timestamp from localStorage
 */
function getLastActivity(): number {
  try {
    const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (stored) {
      const timestamp = parseInt(stored, 10);
      if (!isNaN(timestamp) && timestamp > 0) {
        return timestamp;
      }
    }
  } catch {
    // localStorage might not be available
  }
  return Date.now();
}

/**
 * Store the last activity timestamp in localStorage
 */
function setLastActivity(timestamp: number): void {
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, timestamp.toString());
  } catch {
    // localStorage might not be available
  }
}

/**
 * Clear the last activity timestamp from localStorage
 */
function clearLastActivity(): void {
  try {
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  } catch {
    // localStorage might not be available
  }
}

/**
 * Hook to track user activity and enforce session timeout
 *
 * Features:
 * - Tracks user activity (mouse, keyboard, touch, scroll)
 * - Compares against user's sessionTimeout preference from settings
 * - Shows warning before timeout
 * - Auto-logout when session expires
 * - Persists activity across tabs via localStorage
 *
 * @param options - Configuration options
 * @returns Session timeout state and controls
 *
 * @example
 * ```tsx
 * const { isWarningActive, secondsUntilTimeout, extendSession } = useSessionTimeout({
 *   onTimeout: () => navigate('/auth/login'),
 *   onWarning: (seconds) => console.log(`Session expires in ${seconds}s`),
 * });
 * ```
 */
export function useSessionTimeout(
  options: UseSessionTimeoutOptions = {}
): UseSessionTimeoutReturn {
  const {
    enabled = true,
    onTimeout,
    onWarning,
    onSessionExtended,
  } = options;

  const { user, logout, isAuthenticated } = useAuthStore();
  const { data: settings } = useUserSettings();

  // State
  const [state, setState] = useState<SessionTimeoutState>(() => ({
    isTimedOut: false,
    isWarningActive: false,
    secondsUntilTimeout: 0,
    timeoutMinutes: settings?.session_timeout ?? DEFAULT_SESSION_TIMEOUT_MINUTES,
    lastActivity: getLastActivity(),
  }));

  // Refs for cleanup and throttling
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityUpdateRef = useRef<number>(0);
  const wasWarningActiveRef = useRef<boolean>(false);
  const hasLoggedOutRef = useRef<boolean>(false);

  // Get timeout in milliseconds
  const timeoutMs = (settings?.session_timeout ?? DEFAULT_SESSION_TIMEOUT_MINUTES) * 60 * 1000;

  /**
   * Update last activity timestamp (throttled)
   */
  const updateActivity = useCallback(() => {
    const now = Date.now();

    // Throttle updates
    if (now - lastActivityUpdateRef.current < ACTIVITY_THROTTLE_MS) {
      return;
    }

    lastActivityUpdateRef.current = now;
    setLastActivity(now);

    setState((prev) => {
      // If we were in warning state and user became active, extend session
      if (prev.isWarningActive) {
        logger.debug('[SessionTimeout] User activity detected, extending session');
        onSessionExtended?.();
        return {
          ...prev,
          lastActivity: now,
          isWarningActive: false,
          secondsUntilTimeout: 0,
        };
      }
      return {
        ...prev,
        lastActivity: now,
      };
    });
  }, [onSessionExtended]);

  /**
   * Extend session manually
   */
  const extendSession = useCallback(() => {
    const now = Date.now();
    lastActivityUpdateRef.current = now;
    setLastActivity(now);
    hasLoggedOutRef.current = false;

    setState((prev) => ({
      ...prev,
      lastActivity: now,
      isWarningActive: false,
      isTimedOut: false,
      secondsUntilTimeout: 0,
    }));

    logger.debug('[SessionTimeout] Session extended manually');
    onSessionExtended?.();
  }, [onSessionExtended]);

  /**
   * Force immediate logout
   */
  const forceLogout = useCallback(async () => {
    if (hasLoggedOutRef.current) return;
    hasLoggedOutRef.current = true;

    logger.auth('[SessionTimeout] Force logout triggered');
    clearLastActivity();

    setState((prev) => ({
      ...prev,
      isTimedOut: true,
      isWarningActive: false,
    }));

    onTimeout?.();
    await logout();
  }, [logout, onTimeout]);

  /**
   * Check session timeout status
   */
  const checkTimeout = useCallback(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const lastActivity = getLastActivity();
    const now = Date.now();
    const elapsed = now - lastActivity;
    const timeRemaining = timeoutMs - elapsed;

    // Session has timed out
    if (timeRemaining <= 0) {
      if (!hasLoggedOutRef.current) {
        logger.auth('[SessionTimeout] Session timed out after inactivity');
        forceLogout();
      }
      return;
    }

    // Check if we should show warning
    const shouldShowWarning = timeRemaining <= WARNING_TIME_BEFORE_TIMEOUT_MS;
    const secondsRemaining = Math.ceil(timeRemaining / 1000);

    setState((prev) => {
      const newState = {
        ...prev,
        lastActivity,
        timeoutMinutes: settings?.session_timeout ?? DEFAULT_SESSION_TIMEOUT_MINUTES,
        isWarningActive: shouldShowWarning,
        secondsUntilTimeout: shouldShowWarning ? secondsRemaining : 0,
      };

      // Trigger warning callback when entering warning state
      if (shouldShowWarning && !wasWarningActiveRef.current) {
        wasWarningActiveRef.current = true;
        onWarning?.(secondsRemaining);
      } else if (!shouldShowWarning) {
        wasWarningActiveRef.current = false;
      }

      return newState;
    });
  }, [isAuthenticated, user, timeoutMs, settings?.session_timeout, forceLogout, onWarning]);

  /**
   * Set up activity event listeners
   */
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      return;
    }

    // Add activity listeners
    const handleActivity = () => {
      updateActivity();
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Also listen for storage events (cross-tab activity sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACTIVITY_STORAGE_KEY && e.newValue) {
        const newTimestamp = parseInt(e.newValue, 10);
        if (!isNaN(newTimestamp)) {
          setState((prev) => ({
            ...prev,
            lastActivity: newTimestamp,
            isWarningActive: false,
            secondsUntilTimeout: 0,
          }));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Initialize last activity on mount
    queueMicrotask(() => {
      updateActivity();
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [enabled, isAuthenticated, updateActivity]);

  /**
   * Set up timeout checking interval
   */
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      return;
    }

    // Initial check
    queueMicrotask(() => {
      checkTimeout();
    });

    // Set up interval for periodic checks
    checkIntervalRef.current = setInterval(checkTimeout, ACTIVITY_CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [enabled, isAuthenticated, checkTimeout]);

  /**
   * Set up countdown interval when warning is active
   */
  useEffect(() => {
    if (!state.isWarningActive) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    // Update countdown every second when warning is active
    countdownIntervalRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.isWarningActive) return prev;

        const newSeconds = prev.secondsUntilTimeout - 1;

        if (newSeconds <= 0) {
          // Time's up - trigger logout
          if (!hasLoggedOutRef.current) {
            forceLogout();
          }
          return {
            ...prev,
            secondsUntilTimeout: 0,
            isTimedOut: true,
          };
        }

        return {
          ...prev,
          secondsUntilTimeout: newSeconds,
        };
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [state.isWarningActive, forceLogout]);

  /**
   * Reset state when user logs out or in
   */
  useEffect(() => {
    if (!isAuthenticated) {
      hasLoggedOutRef.current = false;
      wasWarningActiveRef.current = false;
      clearLastActivity();
      queueMicrotask(() => {
        setState({
          isTimedOut: false,
          isWarningActive: false,
          secondsUntilTimeout: 0,
          timeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
          lastActivity: Date.now(),
        });
      });
    }
  }, [isAuthenticated]);

  /**
   * Update timeout when settings change
   */
  useEffect(() => {
    if (settings?.session_timeout) {
      queueMicrotask(() => {
        setState((prev) => ({
          ...prev,
          timeoutMinutes: settings.session_timeout!,
        }));
      });
    }
  }, [settings?.session_timeout]);

  return {
    ...state,
    extendSession,
    forceLogout,
  };
}

export default useSessionTimeout;
