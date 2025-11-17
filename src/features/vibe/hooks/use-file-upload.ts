/**
 * File Upload Hook
 * Manages file uploads, selection, and references in VIBE interface
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useVibeFileStore } from '../stores/vibe-file-store';
import { useVibeChatStore } from '../stores/vibe-chat-store';
import { supabase } from '@shared/lib/supabase-client';
import type { VibeFile } from '../stores/vibe-file-store';

export interface FileUploadOptions {
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  autoSelect?: boolean; // Auto-select after upload
}

export interface UseFileUploadReturn {
  // State
  files: VibeFile[];
  selectedFiles: VibeFile[];
  uploadProgress: Map<string, number>;
  isUploading: boolean;
  error: string | null;

  // Actions
  uploadFile: (file: File, options?: FileUploadOptions) => Promise<void>;
  uploadFiles: (files: File[], options?: FileUploadOptions) => Promise<void>;
  selectFile: (fileId: string) => void;
  deselectFile: (fileId: string) => void;
  removeFile: (fileId: string) => Promise<void>;
  clearSelection: () => void;

  // Utilities
  isFileSelected: (fileId: string) => boolean;
  getFileById: (fileId: string) => VibeFile | undefined;
  filterFiles: (query: string) => VibeFile[];
}

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Hook for managing file uploads and references in VIBE interface
 *
 * Features:
 * - Upload files to Supabase Storage
 * - Track upload progress for multiple files
 * - Select/deselect files for message context
 * - Filter files by name
 * - Validate file size and type
 *
 * @example
 * ```tsx
 * const { uploadFile, selectFile, selectedFiles } = useFileUpload();
 *
 * const handleDrop = async (files: File[]) => {
 *   await uploadFiles(files, { autoSelect: true });
 * };
 * ```
 */
export function useFileUpload(): UseFileUploadReturn {
  const currentSessionId = useVibeChatStore((state) => state.currentSessionId);
  const {
    files: fileMap,
    selectedFileIds,
    uploadProgress,
    addFile,
    removeFile: removeFileFromStore,
    selectFile: selectFileInStore,
    deselectFile: deselectFileInStore,
    clearSelection: clearSelectionInStore,
    startUpload,
    updateUploadProgress,
    completeUpload,
    failUpload,
    clearUploadProgress,
    getFile,
    getSelectedFiles,
  } = useVibeFileStore();

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadAbortControllers = useRef<Map<string, AbortController>>(
    new Map()
  );

  // Updated: Nov 16th 2025 - Fixed memory leak by cleaning up abort controllers on unmount
  useEffect(() => {
    const controllers = uploadAbortControllers;
    return () => {
      // Abort all pending uploads and clear controllers on unmount
      controllers.current.forEach((controller) => {
        controller.abort();
      });
      controllers.current.clear();
    };
  }, []);

  // Get current user ID
  const getCurrentUserId = async (): Promise<string> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
  };

  /**
   * Validate file before upload
   */
  const validateFile = useCallback(
    (file: File, options?: FileUploadOptions): string | null => {
      const maxSize = options?.maxFileSize || DEFAULT_MAX_FILE_SIZE;

      if (file.size > maxSize) {
        return `File size exceeds maximum allowed size of ${
          maxSize / (1024 * 1024)
        }MB`;
      }

      if (options?.allowedTypes && options.allowedTypes.length > 0) {
        const isAllowed = options.allowedTypes.some((type) => {
          if (type.endsWith('/*')) {
            const prefix = type.slice(0, -2);
            return file.type.startsWith(prefix);
          }
          return file.type === type;
        });

        if (!isAllowed) {
          return `File type ${file.type} is not allowed`;
        }
      }

      return null;
    },
    []
  );

  /**
   * Upload a single file
   */
  const uploadFile = useCallback(
    async (file: File, options?: FileUploadOptions) => {
      const fileId = crypto.randomUUID();

      try {
        // Validate file
        const validationError = validateFile(file, options);
        if (validationError) {
          setError(validationError);
          failUpload(fileId, validationError);
          return;
        }

        // Get user ID and session ID
        const userId = await getCurrentUserId();
        const sessionId = currentSessionId || crypto.randomUUID();

        setIsUploading(true);
        setError(null);
        startUpload(fileId, file.name);

        // Create abort controller for this upload
        const abortController = new AbortController();
        uploadAbortControllers.current.set(fileId, abortController);

        // Upload to Supabase Storage
        const filePath = `vibe/${userId}/${sessionId}/${fileId}-${file.name}`;

        const { data, error: uploadError } = await supabase.storage
          .from('vibe-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Update progress to 90% (upload complete, getting URL)
        updateUploadProgress(fileId, 90);

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('vibe-files').getPublicUrl(filePath);

        // Update progress to 95% (saving metadata)
        updateUploadProgress(fileId, 95);

        // Save file metadata to database
        const vibeFile: VibeFile = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: publicUrl,
          uploaded_at: new Date(),
          uploaded_by: userId,
          session_id: sessionId,
        };

        const { error: dbError } = await supabase.from('vibe_files').insert({
          id: vibeFile.id,
          name: vibeFile.name,
          type: vibeFile.type,
          size: vibeFile.size,
          url: vibeFile.url,
          uploaded_at: vibeFile.uploaded_at.toISOString(),
          uploaded_by: vibeFile.uploaded_by,
          session_id: vibeFile.session_id,
        });

        if (dbError) throw dbError;

        // Complete upload
        completeUpload(fileId, vibeFile);

        // Auto-select if option is enabled
        if (options?.autoSelect) {
          selectFileInStore(fileId);
        }

        // Clean up abort controller
        uploadAbortControllers.current.delete(fileId);

        // Clear progress after a delay
        setTimeout(() => {
          clearUploadProgress(fileId);
        }, 2000);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload file';
        setError(errorMessage);
        failUpload(fileId, errorMessage);

        // Clean up abort controller
        uploadAbortControllers.current.delete(fileId);

        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [
      validateFile,
      currentSessionId,
      startUpload,
      updateUploadProgress,
      completeUpload,
      failUpload,
      clearUploadProgress,
      selectFileInStore,
    ]
  );

  /**
   * Upload multiple files
   */
  const uploadFiles = useCallback(
    async (files: File[], options?: FileUploadOptions) => {
      setIsUploading(true);
      setError(null);

      const uploadPromises = files.map((file) => uploadFile(file, options));

      try {
        await Promise.allSettled(uploadPromises);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload files';
        setError(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile]
  );

  /**
   * Remove a file (from storage and database)
   */
  const removeFile = useCallback(
    async (fileId: string) => {
      try {
        const file = getFile(fileId);
        if (!file) return;

        // Delete from storage
        const userId = file.uploaded_by;
        const sessionId = file.session_id;
        const filePath = `vibe/${userId}/${sessionId}/${fileId}-${file.name}`;

        await supabase.storage.from('vibe-files').remove([filePath]);

        // Delete from database
        await supabase.from('vibe_files').delete().eq('id', fileId);

        // Remove from store
        removeFileFromStore(fileId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to remove file';
        setError(errorMessage);
        throw err;
      }
    },
    [getFile, removeFileFromStore]
  );

  /**
   * Select a file for message context
   */
  const selectFile = useCallback(
    (fileId: string) => {
      selectFileInStore(fileId);
    },
    [selectFileInStore]
  );

  /**
   * Deselect a file
   */
  const deselectFile = useCallback(
    (fileId: string) => {
      deselectFileInStore(fileId);
    },
    [deselectFileInStore]
  );

  /**
   * Clear all selected files
   */
  const clearSelection = useCallback(() => {
    clearSelectionInStore();
  }, [clearSelectionInStore]);

  /**
   * Check if a file is selected
   */
  const isFileSelected = useCallback(
    (fileId: string): boolean => {
      return selectedFileIds.includes(fileId);
    },
    [selectedFileIds]
  );

  /**
   * Get file by ID
   */
  const getFileById = useCallback(
    (fileId: string): VibeFile | undefined => {
      return getFile(fileId);
    },
    [getFile]
  );

  /**
   * Filter files by name query
   */
  const filterFiles = useCallback(
    (query: string): VibeFile[] => {
      const allFiles = Array.from(fileMap.values());
      if (!query) return allFiles;

      const lowerQuery = query.toLowerCase();
      return allFiles.filter((file) =>
        file.name.toLowerCase().includes(lowerQuery)
      );
    },
    [fileMap]
  );

  // Convert Map to array for easier consumption
  const files = Array.from(fileMap.values());
  const selectedFiles = getSelectedFiles();

  // Convert upload progress Map to a simple Map<fileId, progress>
  const progressMap = new Map(
    Array.from(uploadProgress.entries()).map(([id, data]) => [
      id,
      data.progress,
    ])
  );

  return {
    // State
    files,
    selectedFiles,
    uploadProgress: progressMap,
    isUploading,
    error,

    // Actions
    uploadFile,
    uploadFiles,
    selectFile,
    deselectFile,
    removeFile,
    clearSelection,

    // Utilities
    isFileSelected,
    getFileById,
    filterFiles,
  };
}
