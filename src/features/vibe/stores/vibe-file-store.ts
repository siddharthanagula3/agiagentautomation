/**
 * Vibe File Store
 * State management for file uploads and references in VIBE interface
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
}

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface VibeFileState {
  // Files for current session
  files: Record<string, VibeFile>;

  // Upload progress tracking
  uploadProgress: Record<string, FileUploadProgress>;

  // Selected files for current message
  selectedFileIds: string[];

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  addFile: (file: VibeFile) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;

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
}

export const useVibeFileStore = create<VibeFileState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      files: {},
      uploadProgress: {},
      selectedFileIds: [],
      isLoading: false,
      error: null,

      // File actions
      addFile: (file) => {
        set((state) => {
          state.files[file.id] = file;
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
          state.error = null;
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
