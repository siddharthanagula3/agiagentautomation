/**
 * Vibe File Store
 * State management for file uploads and references in VIBE interface
 *
 * Updated: Jan 29th 2026 - Added sync status tracking
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

export interface VibeFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: Date;
  uploaded_by: string;
  session_id: string;
  metadata?: Record<string, unknown>;
}

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

/**
 * Sync status for tracking file synchronization with database
 */
export type FileSyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

export interface FileSyncState {
  path: string;
  status: FileSyncStatus;
  lastSyncedAt: Date | null;
  lastModifiedAt: Date;
  error?: string;
  retryCount: number;
}

export interface VibeFileState {
  // Files for current session
  files: Record<string, VibeFile>;

  // Upload progress tracking
  uploadProgress: Record<string, FileUploadProgress>;

  // Selected files for current message
  selectedFileIds: string[];

  // Sync status tracking (path -> sync state)
  syncStates: Record<string, FileSyncState>;

  // Current session ID for sync operations
  currentSessionId: string | null;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  addFile: (file: VibeFile) => void;
  addFiles: (files: VibeFile[]) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  setFiles: (files: VibeFile[]) => void;

  // Session actions
  setCurrentSessionId: (sessionId: string | null) => void;

  // Sync state actions
  updateSyncState: (path: string, state: Partial<FileSyncState>) => void;
  clearSyncState: (path: string) => void;
  clearAllSyncStates: () => void;

  // Selection actions
  selectFile: (fileId: string) => void;
  deselectFile: (fileId: string) => void;
  clearSelection: () => void;
  setSelectedFiles: (fileIds: string[]) => void;

  // Upload progress actions
  startUpload: (fileId: string, fileName: string) => void;
  updateUploadProgress: (fileId: string, progress: number) => void;
  completeUpload: (fileId: string, file: VibeFile) => void;
  failUpload: (fileId: string, error: string) => void;
  clearUploadProgress: (fileId: string) => void;

  // Utility actions
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  getFile: (fileId: string) => VibeFile | undefined;
  getSelectedFiles: () => VibeFile[];
  hasUnsavedChanges: () => boolean;
  getFilesWithSyncErrors: () => FileSyncState[];

  // Reset
  reset: () => void;
}

const initialState = {
  files: {} as Record<string, VibeFile>,
  uploadProgress: {} as Record<string, FileUploadProgress>,
  selectedFileIds: [] as string[],
  syncStates: {} as Record<string, FileSyncState>,
  currentSessionId: null as string | null,
  isLoading: false,
  error: null as string | null,
};

export const useVibeFileStore = create<VibeFileState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      ...initialState,

      // File actions
      addFile: (file) => {
        set((state) => {
          state.files[file.id] = file;
          state.error = null;
        });
      },

      addFiles: (files) => {
        set((state) => {
          for (const file of files) {
            state.files[file.id] = file;
          }
          state.error = null;
        });
      },

      removeFile: (fileId) => {
        set((state) => {
          delete state.files[fileId];
          state.selectedFileIds = state.selectedFileIds.filter(
            (id) => id !== fileId
          );
        });
      },

      clearFiles: () => {
        set((state) => {
          state.files = {};
          state.selectedFileIds = [];
          state.uploadProgress = {};
          state.syncStates = {};
          state.error = null;
        });
      },

      setFiles: (files) => {
        set((state) => {
          state.files = {};
          for (const file of files) {
            state.files[file.id] = file;
          }
        });
      },

      // Session actions
      setCurrentSessionId: (sessionId) => {
        set((state) => {
          state.currentSessionId = sessionId;
        });
      },

      // Sync state actions
      updateSyncState: (path, updates) => {
        set((state) => {
          const existing = state.syncStates[path];
          state.syncStates[path] = {
            path,
            status: 'pending',
            lastSyncedAt: null,
            lastModifiedAt: new Date(),
            retryCount: 0,
            ...existing,
            ...updates,
          };
        });
      },

      clearSyncState: (path) => {
        set((state) => {
          delete state.syncStates[path];
        });
      },

      clearAllSyncStates: () => {
        set((state) => {
          state.syncStates = {};
        });
      },

      // Selection actions
      selectFile: (fileId) => {
        set((state) => {
          if (!state.selectedFileIds.includes(fileId)) {
            state.selectedFileIds.push(fileId);
          }
        });
      },

      deselectFile: (fileId) => {
        set((state) => {
          state.selectedFileIds = state.selectedFileIds.filter(
            (id) => id !== fileId
          );
        });
      },

      clearSelection: () => {
        set((state) => {
          state.selectedFileIds = [];
        });
      },

      setSelectedFiles: (fileIds) => {
        set((state) => {
          state.selectedFileIds = fileIds;
        });
      },

      // Upload progress actions
      startUpload: (fileId, fileName) => {
        set((state) => {
          state.uploadProgress[fileId] = {
            fileId,
            fileName,
            progress: 0,
            status: 'uploading',
          };
        });
      },

      updateUploadProgress: (fileId, progress) => {
        set((state) => {
          const upload = state.uploadProgress[fileId];
          if (upload) {
            upload.progress = progress;
          }
        });
      },

      completeUpload: (fileId, file) => {
        set((state) => {
          const upload = state.uploadProgress[fileId];
          if (upload) {
            upload.status = 'completed';
            upload.progress = 100;
          }
          state.files[file.id] = file;
        });
      },

      failUpload: (fileId, error) => {
        set((state) => {
          const upload = state.uploadProgress[fileId];
          if (upload) {
            upload.status = 'failed';
            upload.error = error;
          }
          state.error = error;
        });
      },

      clearUploadProgress: (fileId) => {
        set((state) => {
          delete state.uploadProgress[fileId];
        });
      },

      // Utility actions
      setLoading: (isLoading) => {
        set((state) => {
          state.isLoading = isLoading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      getFile: (fileId) => {
        return get().files[fileId];
      },

      getSelectedFiles: () => {
        const { files, selectedFileIds } = get();
        return selectedFileIds
          .map((id) => files[id])
          .filter((file): file is VibeFile => file !== undefined);
      },

      hasUnsavedChanges: () => {
        const { syncStates } = get();
        return Object.values(syncStates).some(
          (state) => state.status === 'pending' || state.status === 'syncing'
        );
      },

      getFilesWithSyncErrors: () => {
        const { syncStates } = get();
        return Object.values(syncStates).filter(
          (state) => state.status === 'error'
        );
      },

      // Reset
      reset: () => {
        set(() => ({ ...initialState }));
      },
    })),
    { name: 'VibeFileStore' }
  )
);

// ============================================================================
// SELECTOR HOOKS (optimized with useShallow to prevent stale closures)
// ============================================================================

/**
 * Selector for files record - returns stable reference
 */
export const useVibeFilesRecord = () =>
  useVibeFileStore((state) => state.files);

/**
 * Selector for selected file IDs - returns stable reference when selection hasn't changed
 */
export const useSelectedFileIds = () =>
  useVibeFileStore((state) => state.selectedFileIds);

/**
 * Selector for upload progress record - returns stable reference
 */
export const useUploadProgressRecord = () =>
  useVibeFileStore((state) => state.uploadProgress);

/**
 * Selector for file loading and error state - uses useShallow for multi-value selection
 */
export const useVibeFileLoadingState = () =>
  useVibeFileStore(
    useShallow((state) => ({
      isLoading: state.isLoading,
      error: state.error,
    }))
  );

/**
 * Selector for a specific file by ID - returns stable reference when file hasn't changed
 */
export const useVibeFile = (fileId: string) =>
  useVibeFileStore((state) => state.files[fileId]);

/**
 * Selector for a specific upload progress by ID
 */
export const useFileUploadProgress = (fileId: string) =>
  useVibeFileStore((state) => state.uploadProgress[fileId]);

/**
 * Selector for sync states record - returns stable reference
 */
export const useSyncStatesRecord = () =>
  useVibeFileStore((state) => state.syncStates);

/**
 * Selector for a specific file sync state by path
 */
export const useFileSyncState = (path: string) =>
  useVibeFileStore((state) => state.syncStates[path]);

/**
 * Selector for current session ID
 */
export const useCurrentFileSessionId = () =>
  useVibeFileStore((state) => state.currentSessionId);

/**
 * Selector for checking if there are unsaved changes
 */
export const useHasUnsavedFileChanges = () =>
  useVibeFileStore((state) => state.hasUnsavedChanges());

/**
 * Selector for files with sync errors
 */
export const useFilesWithSyncErrors = () =>
  useVibeFileStore((state) => state.getFilesWithSyncErrors());

/**
 * Selector for sync status summary - uses useShallow for multi-value selection
 */
export const useSyncStatusSummary = () =>
  useVibeFileStore(
    useShallow((state) => {
      const syncStates = Object.values(state.syncStates);
      return {
        total: syncStates.length,
        synced: syncStates.filter((s) => s.status === 'synced').length,
        pending: syncStates.filter((s) => s.status === 'pending').length,
        syncing: syncStates.filter((s) => s.status === 'syncing').length,
        error: syncStates.filter((s) => s.status === 'error').length,
      };
    })
  );
