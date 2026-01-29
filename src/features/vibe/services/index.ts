/**
 * Vibe Services Index
 * Central export for all VIBE services
 */

export { vibeAgentRouter } from './vibe-agent-router';
export { vibeComplexityAnalyzer } from './vibe-complexity-analyzer';
export { vibeExecutionCoordinator } from './vibe-execution-coordinator';
export { messagePool } from './vibe-message-pool';
export { vibeCollaborationProtocol } from './vibe-collaboration-protocol';
export { vibeToolOrchestrator } from './vibe-tool-orchestrator';
export { vibeFileManager } from './vibe-file-manager';
export {
  vibeFileSyncService,
  useFileSyncStatus,
  useHasUnsavedChanges,
  type SyncStatus,
  type FileSyncState,
  type FileSyncConfig,
} from './vibe-file-sync';
