/**
 * Tool System Exports
 *
 * Unified exports for the tool execution system.
 *
 * @module @core/ai/tools
 */

// Types
export type {
  ToolCategory,
  ToolPermission,
  UserPermissionLevel,
  CanonicalToolName,
  ToolParameterType,
  ToolParameter,
  ToolContext,
  ToolArtifact,
  ToolResult,
  UnifiedTool,
  ValidationResult,
  ToolCallStatus,
  ToolCall,
  ToolExecutionRequest,
  ExecutionHistoryConfig,
  ExecutionHistoryEntry,
  ToolUsageStats,
} from './types';

// Type constants and utilities
export {
  PERMISSION_LEVELS,
  TOOL_ALIASES,
  TOOL_DISPLAY_NAMES,
  DEFAULT_HISTORY_CONFIG,
  CommonParameterSchemas,
  resolveToolName,
  getToolDisplayName,
  hasToolPermission,
  getAccessibleToolPermissions,
  createToolCall,
} from './types';

// Unified registry
export {
  UnifiedToolRegistry,
  unifiedToolRegistry,
  executeTool,
  getTool,
  checkToolPermission,
  getAccessibleTools,
} from './unified-tool-registry';

// Legacy exports for backwards compatibility
export { toolManager, ToolManager } from './tool-registry-manager';
export { toolInvocationService } from './tool-invocation-handler';
