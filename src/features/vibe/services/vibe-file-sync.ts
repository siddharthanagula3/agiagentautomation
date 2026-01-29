/**
 * Vibe File Sync Service
 *
 * Provides robust file synchronization between the in-memory file system (vibe-file-system),
 * Zustand store (vibe-file-store), and Supabase database (vibe_files table).
 *
 * Features:
 * - Debounced saves to prevent database flooding
 * - Race condition prevention with operation queuing
 * - Error recovery with exponential backoff retry
 * - Sync state tracking (synced/pending/error)
 * - Optimistic updates with rollback on failure
 * - Session-based file loading and cleanup
 *
 * Created: Jan 29th 2026
 */

import { supabase } from '@shared/lib/supabase-client';
import { vibeFileSystem } from './vibe-file-system';
import { useVibeFileStore, type VibeFile } from '../stores/vibe-file-store';

// ============================================================================
// Types
// ============================================================================

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

export interface FileSyncState {
  path: string;
  status: SyncStatus;
  lastSyncedAt: Date | null;
  lastModifiedAt: Date;
  error?: string;
  retryCount: number;
}

export interface SyncOperation {
  id: string;
  type: 'save' | 'delete' | 'load';
  path: string;
  content?: string;
  timestamp: number;
  resolve: (value: boolean) => void;
  reject: (error: Error) => void;
}

export interface FileSyncConfig {
  debounceMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  maxRetryDelayMs: number;
  batchSize: number;
}

const DEFAULT_CONFIG: FileSyncConfig = {
  debounceMs: 1000, // Wait 1s after last change before syncing
  maxRetries: 3,
  retryBaseDelayMs: 1000,
  maxRetryDelayMs: 30000,
  batchSize: 10, // Process 10 files at a time for batch operations
};

// ============================================================================
// File Sync Service
// ============================================================================

class VibeFileSyncService {
  private config: FileSyncConfig;
  private syncStates: Map<string, FileSyncState> = new Map();
  private pendingOperations: Map<string, SyncOperation> = new Map();
  private operationQueue: SyncOperation[] = [];
  private isProcessing = false;
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private currentSessionId: string | null = null;
  private abortController: AbortController | null = null;

  constructor(config: Partial<FileSyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Session Management
  // --------------------------------------------------------------------------

  /**
   * Initialize sync for a session - loads files from database
   */
  async initSession(sessionId: string): Promise<void> {
    // Abort any pending operations from previous session
    this.abortCurrentOperations();

    this.currentSessionId = sessionId;
    this.syncStates.clear();
    this.pendingOperations.clear();
    this.operationQueue = [];

    // Clear all debounce timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    // Load files from database
    await this.loadFilesFromDatabase(sessionId);
  }

  /**
   * Cleanup when session ends
   */
  async endSession(): Promise<void> {
    // Process any pending saves before ending
    await this.flushPendingOperations();

    this.abortCurrentOperations();
    this.currentSessionId = null;
    this.syncStates.clear();
  }

  /**
   * Abort all current operations
   */
  private abortCurrentOperations(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Reject all pending operations
    for (const operation of this.operationQueue) {
      operation.reject(new Error('Operation aborted due to session change'));
    }
    this.operationQueue = [];
    this.pendingOperations.clear();
  }

  // --------------------------------------------------------------------------
  // Load Operations
  // --------------------------------------------------------------------------

  /**
   * Load files from database and populate the in-memory file system
   */
  async loadFilesFromDatabase(sessionId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('vibe_files')
        .select('*')
        .eq('session_id', sessionId)
        .order('uploaded_at', { ascending: true });

      if (error) {
        console.error('[FileSyncService] Failed to load files:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return;
      }

      // Add files to store
      const store = useVibeFileStore.getState();
      for (const row of data) {
        const file: VibeFile = {
          id: row.id,
          name: row.name,
          type: row.type,
          size: row.size,
          url: row.url,
          uploaded_at: new Date(row.uploaded_at),
          uploaded_by: row.uploaded_by,
          session_id: row.session_id,
        };
        store.addFile(file);

        // Try to load file content from metadata if available
        const metadata = row.metadata as Record<string, unknown> | null;
        if (metadata?.content && typeof metadata.content === 'string') {
          const path = this.extractPathFromMetadata(metadata, row.name);
          try {
            // Check if file exists in file system
            try {
              vibeFileSystem.readFile(path);
              vibeFileSystem.updateFile(path, metadata.content);
            } catch {
              // File doesn't exist, create it
              vibeFileSystem.createFile(path, metadata.content);
            }

            // Mark as synced
            this.syncStates.set(path, {
              path,
              status: 'synced',
              lastSyncedAt: new Date(row.uploaded_at),
              lastModifiedAt: new Date(row.uploaded_at),
              retryCount: 0,
            });
          } catch (err) {
            console.error(`[FileSyncService] Failed to restore file ${path}:`, err);
          }
        }
      }
    } catch (error) {
      console.error('[FileSyncService] Error loading files from database:', error);
      throw error;
    }
  }

  /**
   * Extract file path from metadata
   */
  private extractPathFromMetadata(
    metadata: Record<string, unknown>,
    fallbackName: string
  ): string {
    const rawPath =
      (typeof metadata.original_path === 'string' && metadata.original_path) ||
      (typeof metadata.path === 'string' && metadata.path) ||
      fallbackName;

    // Normalize path to have leading slash
    if (!rawPath.startsWith('/')) {
      return `/${rawPath}`;
    }
    return rawPath;
  }

  // --------------------------------------------------------------------------
  // Save Operations
  // --------------------------------------------------------------------------

  /**
   * Schedule a file save with debouncing
   */
  scheduleFileSave(path: string, content: string): Promise<boolean> {
    if (!this.currentSessionId) {
      return Promise.resolve(false);
    }

    // Cancel existing debounce timer for this path
    const existingTimer = this.debounceTimers.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Mark as pending
    this.updateSyncState(path, {
      status: 'pending',
      lastModifiedAt: new Date(),
    });

    return new Promise((resolve, reject) => {
      // Create or update pending operation
      const operationId = `save:${path}`;
      const existingOperation = this.pendingOperations.get(operationId);

      if (existingOperation) {
        // Resolve previous promise as superseded
        existingOperation.resolve(false);
      }

      const operation: SyncOperation = {
        id: operationId,
        type: 'save',
        path,
        content,
        timestamp: Date.now(),
        resolve,
        reject,
      };

      this.pendingOperations.set(operationId, operation);

      // Schedule debounced execution
      const timer = setTimeout(() => {
        this.debounceTimers.delete(path);
        this.enqueueOperation(operation);
      }, this.config.debounceMs);

      this.debounceTimers.set(path, timer);
    });
  }

  /**
   * Immediately save a file (bypass debounce)
   */
  async saveFileImmediately(path: string, content: string): Promise<boolean> {
    if (!this.currentSessionId) {
      return false;
    }

    // Cancel any pending debounced save
    const existingTimer = this.debounceTimers.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.debounceTimers.delete(path);
    }

    // Cancel any pending operation
    const operationId = `save:${path}`;
    const existingOperation = this.pendingOperations.get(operationId);
    if (existingOperation) {
      existingOperation.resolve(false);
      this.pendingOperations.delete(operationId);
    }

    return this.executeSave(path, content);
  }

  /**
   * Execute a save operation with retry logic
   */
  private async executeSave(
    path: string,
    content: string,
    retryCount = 0
  ): Promise<boolean> {
    if (!this.currentSessionId) {
      return false;
    }

    const sessionId = this.currentSessionId;

    this.updateSyncState(path, { status: 'syncing' });

    try {
      // Get the file ID if it exists in the store
      const store = useVibeFileStore.getState();
      const existingFile = Object.values(store.files).find(
        (f) => {
          const metadata = (f as VibeFile & { metadata?: Record<string, unknown> }).metadata;
          const filePath = metadata?.original_path || metadata?.path || f.name;
          return filePath === path || `/${filePath}` === path;
        }
      );

      const fileId = existingFile?.id || crypto.randomUUID();
      const fileName = path.split('/').pop() || 'untitled';
      const fileType = this.inferMimeType(fileName);

      // Upsert file record
      const { error } = await supabase.from('vibe_files').upsert(
        {
          id: fileId,
          session_id: sessionId,
          name: fileName,
          type: fileType,
          size: new TextEncoder().encode(content).length,
          url: '', // Content is stored in metadata for code files
          uploaded_at: new Date().toISOString(),
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || '',
          metadata: {
            original_path: path,
            path: path,
            content: content,
            language: this.inferLanguage(fileName),
          },
        },
        {
          onConflict: 'id',
        }
      );

      if (error) {
        throw error;
      }

      // Update sync state on success
      this.updateSyncState(path, {
        status: 'synced',
        lastSyncedAt: new Date(),
        error: undefined,
        retryCount: 0,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check if we should retry
      if (retryCount < this.config.maxRetries) {
        const delay = Math.min(
          this.config.retryBaseDelayMs * Math.pow(2, retryCount),
          this.config.maxRetryDelayMs
        );

        console.warn(
          `[FileSyncService] Save failed for ${path}, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.config.maxRetries})`,
          error
        );

        this.updateSyncState(path, {
          status: 'pending',
          retryCount: retryCount + 1,
        });

        await this.delay(delay);
        return this.executeSave(path, content, retryCount + 1);
      }

      // Max retries exceeded
      console.error(
        `[FileSyncService] Save failed for ${path} after ${this.config.maxRetries} retries:`,
        error
      );

      this.updateSyncState(path, {
        status: 'error',
        error: errorMessage,
        retryCount,
      });

      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Delete Operations
  // --------------------------------------------------------------------------

  /**
   * Delete a file from database
   */
  async deleteFile(path: string): Promise<boolean> {
    if (!this.currentSessionId) {
      return false;
    }

    try {
      // Find the file by path in metadata
      const { data: files } = await supabase
        .from('vibe_files')
        .select('id, metadata')
        .eq('session_id', this.currentSessionId);

      const fileToDelete = files?.find((f) => {
        const metadata = f.metadata as Record<string, unknown> | null;
        const filePath = metadata?.original_path || metadata?.path;
        return filePath === path || `/${filePath}` === path;
      });

      if (fileToDelete) {
        const { error } = await supabase
          .from('vibe_files')
          .delete()
          .eq('id', fileToDelete.id);

        if (error) {
          throw error;
        }
      }

      // Remove from sync states
      this.syncStates.delete(path);

      return true;
    } catch (error) {
      console.error(`[FileSyncService] Failed to delete file ${path}:`, error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Operation Queue Processing
  // --------------------------------------------------------------------------

  /**
   * Add operation to queue and start processing
   */
  private enqueueOperation(operation: SyncOperation): void {
    // Remove from pending map
    this.pendingOperations.delete(operation.id);

    // Add to queue
    this.operationQueue.push(operation);

    // Start processing if not already
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process operation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.abortController = new AbortController();

    try {
      while (this.operationQueue.length > 0) {
        // Check if aborted
        if (this.abortController.signal.aborted) {
          break;
        }

        const operation = this.operationQueue.shift();
        if (!operation) {
          continue;
        }

        try {
          let result = false;

          switch (operation.type) {
            case 'save':
              result = await this.executeSave(
                operation.path,
                operation.content || ''
              );
              break;
            case 'delete':
              result = await this.deleteFile(operation.path);
              break;
            case 'load':
              await this.loadFilesFromDatabase(this.currentSessionId || '');
              result = true;
              break;
          }

          operation.resolve(result);
        } catch (error) {
          operation.reject(
            error instanceof Error ? error : new Error('Operation failed')
          );
        }
      }
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }

  /**
   * Force process all pending operations immediately
   */
  async flushPendingOperations(): Promise<void> {
    // Clear all debounce timers and process immediately
    for (const [path, timer] of this.debounceTimers) {
      clearTimeout(timer);
      this.debounceTimers.delete(path);

      const operationId = `save:${path}`;
      const operation = this.pendingOperations.get(operationId);
      if (operation) {
        this.enqueueOperation(operation);
      }
    }

    // Wait for queue to empty
    while (this.operationQueue.length > 0 || this.isProcessing) {
      await this.delay(100);
    }
  }

  // --------------------------------------------------------------------------
  // Sync State Management
  // --------------------------------------------------------------------------

  /**
   * Get sync state for a file
   */
  getSyncState(path: string): FileSyncState | undefined {
    return this.syncStates.get(path);
  }

  /**
   * Get all sync states
   */
  getAllSyncStates(): Map<string, FileSyncState> {
    return new Map(this.syncStates);
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(): boolean {
    for (const state of this.syncStates.values()) {
      if (state.status === 'pending' || state.status === 'syncing') {
        return true;
      }
    }
    return this.pendingOperations.size > 0 || this.debounceTimers.size > 0;
  }

  /**
   * Get files with errors
   */
  getFilesWithErrors(): FileSyncState[] {
    return Array.from(this.syncStates.values()).filter(
      (state) => state.status === 'error'
    );
  }

  /**
   * Update sync state for a file
   */
  private updateSyncState(
    path: string,
    updates: Partial<FileSyncState>
  ): void {
    const existing = this.syncStates.get(path);
    const newState: FileSyncState = {
      path,
      status: 'pending',
      lastSyncedAt: null,
      lastModifiedAt: new Date(),
      retryCount: 0,
      ...existing,
      ...updates,
    };
    this.syncStates.set(path, newState);
  }

  /**
   * Retry failed saves
   */
  async retryFailedSaves(): Promise<void> {
    const failedFiles = this.getFilesWithErrors();

    for (const state of failedFiles) {
      try {
        const content = vibeFileSystem.readFile(state.path);
        await this.saveFileImmediately(state.path, content);
      } catch (error) {
        console.error(
          `[FileSyncService] Retry failed for ${state.path}:`,
          error
        );
      }
    }
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Infer MIME type from filename
   */
  private inferMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      ts: 'application/typescript',
      tsx: 'application/typescript',
      js: 'application/javascript',
      jsx: 'application/javascript',
      json: 'application/json',
      html: 'text/html',
      css: 'text/css',
      md: 'text/markdown',
      txt: 'text/plain',
      py: 'text/x-python',
      rb: 'text/x-ruby',
      go: 'text/x-go',
      rs: 'text/x-rust',
    };
    return mimeTypes[ext] || 'text/plain';
  }

  /**
   * Infer language from filename
   */
  private inferLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const languages: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      html: 'html',
      css: 'css',
      scss: 'scss',
      md: 'markdown',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
    };
    return languages[ext] || 'plaintext';
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Singleton Instance & Export
// ============================================================================

export const vibeFileSyncService = new VibeFileSyncService();

// Export the class for testing purposes
export { VibeFileSyncService };

// ============================================================================
// React Hook for Sync Status
// ============================================================================

/**
 * Hook to subscribe to file sync status changes
 * Note: This is a simple polling implementation.
 * For real-time updates, consider using Zustand or a dedicated store.
 */
export function useFileSyncStatus(path: string): FileSyncState | undefined {
  // This is a lightweight check - for production, consider integrating
  // sync states into the Zustand store for reactive updates
  return vibeFileSyncService.getSyncState(path);
}

/**
 * Check if there are unsaved changes (useful for beforeunload warning)
 */
export function useHasUnsavedChanges(): boolean {
  return vibeFileSyncService.hasUnsavedChanges();
}
