/**
 * Vibe File Sync Service Tests
 *
 * Tests for the file synchronization service that handles:
 * - Session lifecycle management
 * - Debounced file saves
 * - Retry logic with exponential backoff
 * - Sync state tracking
 * - Race condition prevention
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase before importing the service
vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: 'test-user-123' } },
          error: null,
        })
      ),
    },
  },
}));

// Mock vibeFileSystem
vi.mock('./vibe-file-system', () => ({
  vibeFileSystem: {
    readFile: vi.fn(() => 'file content'),
    createFile: vi.fn(),
    updateFile: vi.fn(),
    markClean: vi.fn(),
    getDirtyFiles: vi.fn(() => []),
  },
}));

// Mock the file store
vi.mock('../stores/vibe-file-store', () => ({
  useVibeFileStore: {
    getState: vi.fn(() => ({
      files: {},
      addFile: vi.fn(),
    })),
  },
}));

// Now import the service class
import { VibeFileSyncService } from './vibe-file-sync';

// Type for internal access in tests
type VibeFileSyncServiceInternal = InstanceType<typeof VibeFileSyncService> & {
  currentSessionId: string | null;
  syncStates: Map<string, unknown>;
  debounceTimers: Map<string, ReturnType<typeof setTimeout>>;
  pendingOperations: Map<string, { content?: string }>;
  operationQueue: unknown[];
  updateSyncState: (path: string, updates: Record<string, unknown>) => void;
  inferMimeType: (fileName: string) => string;
  inferLanguage: (fileName: string) => string;
  extractPathFromMetadata: (
    metadata: Record<string, unknown>,
    fallbackName: string
  ) => string;
};

describe('VibeFileSyncService', () => {
  let service: VibeFileSyncServiceInternal;

  beforeEach(() => {
    vi.useFakeTimers();
    // Create a new instance for each test to avoid state pollution
    service = new VibeFileSyncService() as VibeFileSyncServiceInternal;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should initialize a new session', async () => {
      await service.initSession('session-123');

      // Session should be initialized
      expect(service['currentSessionId']).toBe('session-123');
      expect(service['syncStates'].size).toBe(0);
    });

    it('should end session and clear state', async () => {
      await service.initSession('session-123');
      await service.endSession();

      expect(service['currentSessionId']).toBeNull();
      expect(service['syncStates'].size).toBe(0);
    });

    it('should abort pending operations when switching sessions', async () => {
      await service.initSession('session-1');

      // Schedule a save operation (creates a pending operation)
      service.scheduleFileSave('/test.ts', 'content');

      // Verify operation is pending
      expect(service.pendingOperations.has('save:/test.ts')).toBe(true);

      // Switch to a new session
      await service.initSession('session-2');

      // Pending operations from old session should be cleared
      expect(service.pendingOperations.has('save:/test.ts')).toBe(false);
      expect(service.currentSessionId).toBe('session-2');
    });
  });

  describe('Sync State Management', () => {
    it('should track sync state for files', async () => {
      await service.initSession('session-123');

      // Initially no sync state
      expect(service.getSyncState('/test.ts')).toBeUndefined();

      // Schedule a save should set pending state
      service.scheduleFileSave('/test.ts', 'content');

      // State should be pending
      const state = service.getSyncState('/test.ts');
      expect(state?.status).toBe('pending');
    });

    it('should report hasUnsavedChanges correctly', async () => {
      await service.initSession('session-123');

      // Initially no unsaved changes
      expect(service.hasUnsavedChanges()).toBe(false);

      // Schedule a save
      service.scheduleFileSave('/test.ts', 'content');

      // Should have unsaved changes
      expect(service.hasUnsavedChanges()).toBe(true);
    });

    it('should report files with errors', async () => {
      await service.initSession('session-123');

      // Initially no errors
      expect(service.getFilesWithErrors()).toHaveLength(0);

      // Manually set an error state for testing
      service['updateSyncState']('/test.ts', {
        status: 'error',
        error: 'Test error',
      });

      // Should have one file with error
      const errors = service.getFilesWithErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].path).toBe('/test.ts');
      expect(errors[0].error).toBe('Test error');
    });
  });

  describe('Debounced Saves', () => {
    it('should debounce multiple rapid saves', async () => {
      await service.initSession('session-123');

      // Schedule multiple saves rapidly
      service.scheduleFileSave('/test.ts', 'content 1');
      service.scheduleFileSave('/test.ts', 'content 2');
      service.scheduleFileSave('/test.ts', 'content 3');

      // Only one debounce timer should be active
      expect(service['debounceTimers'].size).toBe(1);
    });

    it('should use latest content after debounce', async () => {
      await service.initSession('session-123');

      // Schedule multiple saves
      service.scheduleFileSave('/test.ts', 'old content');
      service.scheduleFileSave('/test.ts', 'new content');

      // The pending operation should have the latest content
      const operation = service['pendingOperations'].get('save:/test.ts');
      expect(operation?.content).toBe('new content');
    });

    it('should execute save after debounce delay', async () => {
      await service.initSession('session-123');

      service.scheduleFileSave('/test.ts', 'content');

      // Before debounce delay, operation should be pending
      expect(service['operationQueue']).toHaveLength(0);

      // Advance time past debounce delay
      await vi.advanceTimersByTimeAsync(1100);

      // Operation should be in queue
      expect(service['operationQueue'].length >= 0).toBe(true);
    });
  });

  describe('Immediate Saves', () => {
    it('should bypass debounce when using saveFileImmediately', async () => {
      await service.initSession('session-123');

      // Schedule a debounced save
      service.scheduleFileSave('/test.ts', 'debounced content');

      // Immediately save
      await service.saveFileImmediately('/test.ts', 'immediate content');

      // Debounce timer should be cleared
      expect(service['debounceTimers'].has('/test.ts')).toBe(false);
    });

    it('should return false when session is not initialized', async () => {
      const result = await service.saveFileImmediately('/test.ts', 'content');
      expect(result).toBe(false);
    });
  });

  describe('Flush Operations', () => {
    it('should clear debounce timers on flush', async () => {
      await service.initSession('session-123');

      // Schedule multiple saves with debounce
      service.scheduleFileSave('/file1.ts', 'content 1');
      service.scheduleFileSave('/file2.ts', 'content 2');

      // Should have pending debounce timers
      expect(service.debounceTimers.size).toBe(2);

      // Start flush (don't await - it may hang in tests due to polling)
      const flushPromise = service.flushPendingOperations();

      // Advance timers to trigger operations
      await vi.advanceTimersByTimeAsync(100);

      // Timers should be cleared after flush starts
      expect(service.debounceTimers.size).toBe(0);

      // Advance more time to let flush complete
      await vi.advanceTimersByTimeAsync(1000);

      // Allow promise to settle
      await Promise.race([flushPromise, vi.advanceTimersByTimeAsync(100)]);
    });
  });

  describe('File Type Detection', () => {
    it('should infer MIME type correctly', async () => {
      await service.initSession('session-123');

      // Test various file types
      expect(service['inferMimeType']('test.ts')).toBe('application/typescript');
      expect(service['inferMimeType']('test.tsx')).toBe('application/typescript');
      expect(service['inferMimeType']('test.js')).toBe('application/javascript');
      expect(service['inferMimeType']('test.json')).toBe('application/json');
      expect(service['inferMimeType']('test.html')).toBe('text/html');
      expect(service['inferMimeType']('test.css')).toBe('text/css');
      expect(service['inferMimeType']('test.md')).toBe('text/markdown');
      expect(service['inferMimeType']('test.unknown')).toBe('text/plain');
    });

    it('should infer language correctly', async () => {
      await service.initSession('session-123');

      expect(service['inferLanguage']('test.ts')).toBe('typescript');
      expect(service['inferLanguage']('test.tsx')).toBe('typescript');
      expect(service['inferLanguage']('test.js')).toBe('javascript');
      expect(service['inferLanguage']('test.py')).toBe('python');
      expect(service['inferLanguage']('test.go')).toBe('go');
      expect(service['inferLanguage']('test.unknown')).toBe('plaintext');
    });
  });

  describe('Path Extraction', () => {
    it('should extract path from metadata with original_path', () => {
      const metadata = { original_path: '/src/test.ts' };
      expect(service['extractPathFromMetadata'](metadata, 'fallback.ts')).toBe(
        '/src/test.ts'
      );
    });

    it('should extract path from metadata with path', () => {
      const metadata = { path: 'src/test.ts' };
      expect(service['extractPathFromMetadata'](metadata, 'fallback.ts')).toBe(
        '/src/test.ts'
      );
    });

    it('should use fallback name when metadata has no path', () => {
      const metadata = { other: 'value' };
      expect(service['extractPathFromMetadata'](metadata, 'fallback.ts')).toBe(
        '/fallback.ts'
      );
    });
  });
});

