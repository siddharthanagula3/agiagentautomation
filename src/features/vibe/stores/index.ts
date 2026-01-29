/**
 * Vibe Stores Index
 * Central export for all VIBE Zustand stores
 */

// Vibe Chat Store with optimized selectors
export {
  useVibeChatStore,
  // Optimized selectors
  useVibeMessages,
  useVibeStreamingState,
  useStreamingMessage,
  useVibeInputState,
  useVibeSessionState,
  useCurrentVibeSessionId,
  useCurrentSessionMetadata,
  useVibeLoading,
} from './vibe-chat-store';
export type { VibeChatState, SessionMetadata } from './vibe-chat-store';

// Vibe Agent Store with optimized selectors
export {
  useVibeAgentStore,
  // Optimized selectors
  useActiveAgentsRecord,
  usePrimaryAgent,
  useSupervisorModeState,
  useVibeActiveAgent,
  useActiveAgentsCount,
} from './vibe-agent-store';
export type { VibeAgentState } from './vibe-agent-store';

// Vibe File Store with optimized selectors
export {
  useVibeFileStore,
  // Optimized selectors
  useVibeFilesRecord,
  useSelectedFileIds,
  useUploadProgressRecord,
  useVibeFileLoadingState,
  useVibeFile,
  useFileUploadProgress,
  // Sync state selectors
  useSyncStatesRecord,
  useFileSyncState,
  useCurrentFileSessionId,
  useHasUnsavedFileChanges,
  useFilesWithSyncErrors,
  useSyncStatusSummary,
} from './vibe-file-store';
export type {
  VibeFileState,
  FileUploadProgress,
  FileSyncStatus,
  FileSyncState,
} from './vibe-file-store';

export { useVibeViewStore } from './vibe-view-store';
export type {
  ViewMode,
  EditorState,
  TerminalState,
  AppViewerState,
} from './vibe-view-store';
