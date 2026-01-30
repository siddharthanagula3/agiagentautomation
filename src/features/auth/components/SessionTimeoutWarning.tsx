/**
 * Session Timeout Warning Dialog
 * Displays a warning to users when their session is about to expire
 *
 * @module features/auth/components/SessionTimeoutWarning
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@shared/ui/alert-dialog';
import { Clock, LogOut } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export interface SessionTimeoutWarningProps {
  /** Whether the warning dialog is visible */
  isOpen: boolean;
  /** Seconds remaining until session expires */
  secondsRemaining: number;
  /** Callback when user chooses to extend the session */
  onExtendSession: () => void;
  /** Callback when user chooses to logout */
  onLogout: () => void;
}

/**
 * Format seconds into MM:SS display
 */
function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Session Timeout Warning Dialog Component
 *
 * Displays a modal warning when the user's session is about to expire,
 * giving them the option to extend their session or log out immediately.
 *
 * Features:
 * - Countdown timer showing time remaining
 * - Visual urgency indicator (color changes as time decreases)
 * - Option to extend session (stay logged in)
 * - Option to log out immediately
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * <SessionTimeoutWarning
 *   isOpen={isWarningActive}
 *   secondsRemaining={secondsUntilTimeout}
 *   onExtendSession={extendSession}
 *   onLogout={forceLogout}
 * />
 * ```
 */
export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  isOpen,
  secondsRemaining,
  onExtendSession,
  onLogout,
}) => {
  // Track if we're in critical time (last 30 seconds)
  const isCritical = secondsRemaining <= 30;
  const isUrgent = secondsRemaining <= 60;

  // Prevent dialog from being dismissed by clicking outside or pressing escape
  // User must explicitly choose an action
  const handleOpenChange = (open: boolean) => {
    // Only allow closing through explicit actions
    if (!open) {
      // Dialog would close - extend session by default (safer option)
      onExtendSession();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                isCritical
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : isUrgent
                    ? 'bg-orange-100 dark:bg-orange-900/30'
                    : 'bg-yellow-100 dark:bg-yellow-900/30'
              )}
            >
              <Clock
                className={cn(
                  'h-6 w-6',
                  isCritical
                    ? 'text-red-600 dark:text-red-400'
                    : isUrgent
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                )}
              />
            </div>
            <div>
              <AlertDialogTitle className="text-xl">
                Session Expiring Soon
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-base">
            Your session will expire due to inactivity. You will be automatically
            logged out in:
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Countdown Display */}
        <div className="py-6">
          <div
            className={cn(
              'text-center text-5xl font-bold font-mono tabular-nums',
              isCritical
                ? 'text-red-600 dark:text-red-400 animate-pulse'
                : isUrgent
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-yellow-600 dark:text-yellow-400'
            )}
            role="timer"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatTimeRemaining(secondsRemaining)}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {isCritical
              ? 'Session ending very soon!'
              : isUrgent
                ? 'Less than a minute remaining'
                : 'Minutes remaining'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-1000 ease-linear',
              isCritical
                ? 'bg-red-500'
                : isUrgent
                  ? 'bg-orange-500'
                  : 'bg-yellow-500'
            )}
            style={{
              // Assume 120 seconds (2 min) warning period
              width: `${Math.min(100, (secondsRemaining / 120) * 100)}%`,
            }}
            role="progressbar"
            aria-valuenow={secondsRemaining}
            aria-valuemin={0}
            aria-valuemax={120}
            aria-label="Time remaining until session expires"
          />
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log Out Now
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onExtendSession}
            className={cn(
              'flex items-center gap-2',
              isCritical && 'animate-pulse'
            )}
            autoFocus
          >
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>

        {/* Keyboard shortcut hint */}
        <p className="text-xs text-center text-muted-foreground mt-2">
          Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">Enter</kbd> to stay logged in
        </p>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionTimeoutWarning;
