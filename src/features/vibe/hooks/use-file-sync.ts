/**
 * useFileSync Hook
 *
 * Manages file synchronization lifecycle for VIBE sessions.
 * Handles session initialization, file saving, and cleanup with proper
 * race condition prevention and error recovery.
 *
 * Created: Jan 29th 2026
 */

import { useEffect, useCallback, useRef } from 'react';
import { vibeFileSyncService, type SyncStatus } from '../services/vibe-file-sync';
import { vibeFileSystem } from '../services/vibe-file-system';
import {
  useVibeFileStore,
  useHasUnsavedFileChanges,
  useSyncStatusSummary,
  type FileSyncState,
} from '../stores/vibe-file-store';

export interface UseFileSyncOptions {
  /**
   * Session ID to sync files for
   */
  sessionId: string | null;

  /**
   * Enable automatic save on file changes in vibeFileSystem
   */
  autoSave?: boolean;

  /**
   * Debounce delay for auto-save (ms)
   */
  debounceMs?: number;

  /**
   * Callback when sync status changes
   */
  onSyncStatusChange?: (path: string, status: SyncStatus) => void;

  /**
   * Callback when sync error occurs
   */
  onSyncError?: (path: string, error: string) => void;
}

export interface UseFileSyncReturn {
  /**
   * Whether there are unsaved changes
   */
  hasUnsavedChanges: boolean;

  /**
   * Summary of sync statuses
   */
  syncSummary: {
    total: number;
    synced: number;
    pending: number;
    syncing: number;
    error: number;
  };

  /**
   * Save a file immediately (bypass debounce)
   */
  saveFile: (path: string, content: string) => Promise<boolean>;

  /**
   * Schedule a file save with debouncing
   */
  scheduleFileSave: (path: string, content: string) => Promise<boolean>;

  /**
   * Force save all pending files
   */
  saveAllPending: () => Promise<void>;

  /**
   * Retry failed saves
   */
  retryFailed: () => Promise<void>;

  /**
   * Get sync state for a specific file
   */
  getSyncState: (path: string) => FileSyncState | undefined;

  /**
   * Check if session is initialized
   */
  isInitialized: boolean;

  /**
   * Loading state during initialization
   */
  isLoading: boolean;

  /**
   * Error during initialization
   */
  initError: string | null;
}

/**
 * Hook for managing file synchronization in VIBE sessions
 *
 * @example
 * ```tsx
 * const {
 *   hasUnsavedChanges,
 *   saveFile,
 *   saveAllPending,
 *   syncSummary
 * } = useFileSync({
 *   sessionId: currentSessionId,
 *   autoSave: true,
 *   onSyncError: (path, error) => toast.error(`Failed to save ${path}: ${error}`)
 * });
 *
 * // Use beforeunload to warn about unsaved changes
 * useEffect(() => {
 *   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
 *     if (hasUnsavedChanges) {
 *       e.preventDefault();
 *       e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
 *     }
 *   };
 *   window.addEventListener('beforeunload', handleBeforeUnload);
 *   return () => window.removeEventListener('beforeunload', handleBeforeUnload);
 * }, [hasUnsavedChanges]);
 * ```
 */
export function useFileSync(options: UseFileSyncOptions): UseFileSyncReturn {
  const { sessionId, autoSave = true, onSyncStatusChange, onSyncError } = options;

  const hasUnsavedChanges = useHasUnsavedFileChanges();
  const syncSummary = useSyncStatusSummary();
  const { updateSyncState, setCurrentSessionId, setLoading, setError, error } =
    useVibeFileStore();

  const isInitializedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const previousSessionIdRef = useRef<string | null>(null);

  // Initialize sync service when session changes
  useEffect(() => {
    const initSession = async () => {
      // Skip if no session or same session
      if (!sessionId) {
        isInitializedRef.current = false;
        return;
      }

      if (sessionId === previousSessionIdRef.current && isInitializedRef.current) {
        return;
      }

      // If there was a previous session, end it first
      if (previousSessionIdRef.current && previousSessionIdRef.current !== sessionId) {
        try {
          await vibeFileSyncService.endSession();
        } catch (err) {
          console.warn('[useFileSync] Error ending previous session:', err);
        }
      }

      previousSessionIdRef.current = sessionId;
      isLoadingRef.current = true;
      setLoading(true);
      setCurrentSessionId(sessionId);

      try {
        await vibeFileSyncService.initSession(sessionId);
        isInitializedRef.current = true;
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize sync';
        setError(errorMessage);
        console.error('[useFileSync] Failed to initialize session:', err);
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    };

    initSession();

    // Cleanup on unmount
    return () => {
      // Don't end session on unmount if we're just re-rendering
      // The session will be ended when switching to a new session
    };
  }, [sessionId, setLoading, setCurrentSessionId, setError]);

  // Auto-save integration with vibeFileSystem
  useEffect(() => {
    if (!autoSave || !sessionId || !isInitializedRef.current) {
      return;
    }

    // Subscribe to file system changes by polling dirty files
    // In a production implementation, you might want to use a more
    // efficient event-based approach if vibeFileSystem supports it
    const checkDirtyFiles = async () => {
      const dirtyFiles = vibeFileSystem.getDirtyFiles();

      for (const path of dirtyFiles) {
        try {
          const content = vibeFileSystem.readFile(path);
          await vibeFileSyncService.scheduleFileSave(path, content);

          // Update sync state in store
          updateSyncState(path, { status: 'pending', lastModifiedAt: new Date() });

          if (onSyncStatusChange) {
            onSyncStatusChange(path, 'pending');
          }
        } catch (err) {
          console.error(`[useFileSync] Failed to schedule save for ${path}:`, err);
          if (onSyncError) {
            onSyncError(path, err instanceof Error ? err.message : 'Unknown error');
          }
        }
      }
    };

    const intervalId = setInterval(checkDirtyFiles, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoSave, sessionId, updateSyncState, onSyncStatusChange, onSyncError]);

  // Save file immediately
  const saveFile = useCallback(
    async (path: string, content: string): Promise<boolean> => {
      if (!sessionId || !isInitializedRef.current) {
        console.warn('[useFileSync] Cannot save: session not initialized');
        return false;
      }

      try {
        updateSyncState(path, { status: 'syncing' });
        if (onSyncStatusChange) {
          onSyncStatusChange(path, 'syncing');
        }

        const result = await vibeFileSyncService.saveFileImmediately(path, content);

        if (result) {
          updateSyncState(path, { status: 'synced', lastSyncedAt: new Date() });
          if (onSyncStatusChange) {
            onSyncStatusChange(path, 'synced');
          }
          // Mark file as clean in file system
          vibeFileSystem.markClean(path);
        } else {
          updateSyncState(path, { status: 'error', error: 'Save failed' });
          if (onSyncError) {
            onSyncError(path, 'Save failed');
          }
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        updateSyncState(path, { status: 'error', error: errorMessage });
        if (onSyncError) {
          onSyncError(path, errorMessage);
        }
        return false;
      }
    },
    [sessionId, updateSyncState, onSyncStatusChange, onSyncError]
  );

  // Schedule file save with debouncing
  const scheduleFileSave = useCallback(
    async (path: string, content: string): Promise<boolean> => {
      if (!sessionId || !isInitializedRef.current) {
        console.warn('[useFileSync] Cannot schedule save: session not initialized');
        return false;
      }

      try {
        updateSyncState(path, { status: 'pending', lastModifiedAt: new Date() });
        if (onSyncStatusChange) {
          onSyncStatusChange(path, 'pending');
        }

        const result = await vibeFileSyncService.scheduleFileSave(path, content);

        if (result) {
          updateSyncState(path, { status: 'synced', lastSyncedAt: new Date() });
          if (onSyncStatusChange) {
            onSyncStatusChange(path, 'synced');
          }
          vibeFileSystem.markClean(path);
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        updateSyncState(path, { status: 'error', error: errorMessage });
        if (onSyncError) {
          onSyncError(path, errorMessage);
        }
        return false;
      }
    },
    [sessionId, updateSyncState, onSyncStatusChange, onSyncError]
  );

  // Force save all pending files
  const saveAllPending = useCallback(async (): Promise<void> => {
    if (!isInitializedRef.current) {
      return;
    }

    try {
      await vibeFileSyncService.flushPendingOperations();
    } catch (err) {
      console.error('[useFileSync] Failed to save all pending:', err);
    }
  }, []);

  // Retry failed saves
  const retryFailed = useCallback(async (): Promise<void> => {
    if (!isInitializedRef.current) {
      return;
    }

    try {
      await vibeFileSyncService.retryFailedSaves();
    } catch (err) {
      console.error('[useFileSync] Failed to retry failed saves:', err);
    }
  }, []);

  // Get sync state for a file
  const getSyncState = useCallback((path: string): FileSyncState | undefined => {
    return vibeFileSyncService.getSyncState(path);
  }, []);

  return {
    hasUnsavedChanges,
    syncSummary,
    saveFile,
    scheduleFileSave,
    saveAllPending,
    retryFailed,
    getSyncState,
    isInitialized: isInitializedRef.current,
    isLoading: isLoadingRef.current,
    initError: error,
  };
}
