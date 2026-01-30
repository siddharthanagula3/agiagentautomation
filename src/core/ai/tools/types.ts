/**
 * Unified Tool Types
 *
 * Consolidated type definitions for the tool execution system.
 * Resolves tool name aliasing between different naming conventions:
 * - Employee MD files: "Read", "Write", "Grep", "Glob", "Bash", "Edit"
 * - Registry IDs: "file-reader", "file-editor", "web-search", etc.
 * - Vibe agent: "read_files", "write_files", etc.
 *
 * @module @core/ai/tools/types
 */

import { z } from 'zod';

// ============================================================================
// TOOL CATEGORIES AND PERMISSIONS
// ============================================================================

/**
 * Tool category for grouping related tools
 */
export type ToolCategory =
  | 'file' // File system operations (read, write, edit)
  | 'search' // Search operations (grep, glob, web search)
  | 'code' // Code operations (analyze, generate, test)
  | 'system' // System operations (bash, process management)
  | 'data' // Data operations (process, analyze)
  | 'automation' // Automation (puppeteer, browser)
  | 'ai' // AI operations (content generation)
  | 'web' // Web operations (fetch, search)
  | 'media'; // Media generation (image, video)

/**
 * Permission levels for tool access
 */
export type ToolPermission =
  | 'file:read' // Read files
  | 'file:write' // Write/edit files
  | 'system:execute' // Execute system commands
  | 'web:search' // Web search
  | 'web:fetch' // Fetch URLs
  | 'code:analyze' // Analyze code
  | 'code:generate' // Generate code
  | 'code:test' // Run tests
  | 'data:process' // Process data
  | 'data:analyze' // Analyze data
  | 'automation:browser' // Browser automation
  | 'ai:generate' // AI content generation
  | 'media:image' // Image generation
  | 'media:video'; // Video generation

/**
 * User permission level determines which tools are accessible
 */
export type UserPermissionLevel = 'basic' | 'standard' | 'admin';

/**
 * Permission configuration mapping user levels to allowed permissions
 */
export const PERMISSION_LEVELS: Record<UserPermissionLevel, ToolPermission[]> =
  {
    basic: ['file:read', 'web:search', 'code:analyze', 'data:analyze'],
    standard: [
      'file:read',
      'file:write',
      'web:search',
      'web:fetch',
      'code:analyze',
      'code:generate',
      'code:test',
      'data:process',
      'data:analyze',
      'ai:generate',
      'media:image',
    ],
    admin: [
      'file:read',
      'file:write',
      'system:execute',
      'web:search',
      'web:fetch',
      'code:analyze',
      'code:generate',
      'code:test',
      'data:process',
      'data:analyze',
      'automation:browser',
      'ai:generate',
      'media:image',
      'media:video',
    ],
  };

// ============================================================================
// TOOL NAME ALIASING
// ============================================================================

/**
 * Canonical tool names used internally
 */
export type CanonicalToolName =
  | 'file-reader'
  | 'file-writer'
  | 'file-editor'
  | 'pattern-search' // grep
  | 'file-finder' // glob
  | 'command-executor' // bash
  | 'web-search'
  | 'web-fetch'
  | 'code-analyzer'
  | 'code-generator'
  | 'test-runner'
  | 'test-generator'
  | 'data-processor'
  | 'data-analyzer'
  | 'content-generator'
  | 'document-generator'
  | 'image-generator'
  | 'video-generator'
  | 'puppeteer';

/**
 * Tool alias mapping - maps various naming conventions to canonical names
 * Key: alias, Value: canonical name
 */
export const TOOL_ALIASES: Record<string, CanonicalToolName> = {
  // Claude Code / Employee MD style (PascalCase)
  Read: 'file-reader',
  Write: 'file-writer',
  Edit: 'file-editor',
  Grep: 'pattern-search',
  Glob: 'file-finder',
  Bash: 'command-executor',
  WebSearch: 'web-search',
  WebFetch: 'web-fetch',

  // Vibe SDK style (snake_case)
  read_files: 'file-reader',
  write_files: 'file-writer',
  delete_files: 'file-editor',
  list_files: 'file-finder',
  search_files: 'pattern-search',
  web_search: 'web-search',
  deploy_preview: 'command-executor',
  git: 'command-executor',

  // Chat tool router style (kebab-case)
  'file-reader': 'file-reader',
  'file-writer': 'file-writer',
  'file-editor': 'file-editor',
  'pattern-search': 'pattern-search',
  'file-finder': 'file-finder',
  'command-executor': 'command-executor',
  'web-search': 'web-search',
  'web-fetch': 'web-fetch',
  'code-analyzer': 'code-analyzer',
  'code-generator': 'code-generator',
  'test-runner': 'test-runner',
  'test-generator': 'test-generator',
  'data-processor': 'data-processor',
  'data-analyzer': 'data-analyzer',
  'content-generator': 'content-generator',
  'document-generator': 'document-generator',
  'image-generator': 'image-generator',
  'video-generator': 'video-generator',
  puppeteer: 'puppeteer',

  // Tool execution handler style (snake_case with shorter names)
  code_runner: 'command-executor',
  image_gen: 'image-generator',
  file_reader: 'file-reader',
  file_writer: 'file-writer',

  // Legacy aliases
  analyzer: 'data-analyzer',
  'bash-executor': 'command-executor',
};

/**
 * Reverse mapping for getting primary display name from canonical name
 */
export const TOOL_DISPLAY_NAMES: Record<CanonicalToolName, string> = {
  'file-reader': 'Read',
  'file-writer': 'Write',
  'file-editor': 'Edit',
  'pattern-search': 'Grep',
  'file-finder': 'Glob',
  'command-executor': 'Bash',
  'web-search': 'Web Search',
  'web-fetch': 'Web Fetch',
  'code-analyzer': 'Code Analyzer',
  'code-generator': 'Code Generator',
  'test-runner': 'Test Runner',
  'test-generator': 'Test Generator',
  'data-processor': 'Data Processor',
  'data-analyzer': 'Data Analyzer',
  'content-generator': 'Content Generator',
  'document-generator': 'Document Generator',
  'image-generator': 'Image Generator',
  'video-generator': 'Video Generator',
  puppeteer: 'Puppeteer',
};

/**
 * Resolve a tool name alias to its canonical name
 */
export function resolveToolName(
  nameOrAlias: string
): CanonicalToolName | null {
  const canonical = TOOL_ALIASES[nameOrAlias];
  if (canonical) return canonical;

  // Check if it's already a canonical name
  if (Object.values(TOOL_ALIASES).includes(nameOrAlias as CanonicalToolName)) {
    return nameOrAlias as CanonicalToolName;
  }

  return null;
}

/**
 * Get the display name for a tool
 */
export function getToolDisplayName(nameOrAlias: string): string {
  const canonical = resolveToolName(nameOrAlias);
  if (!canonical) return nameOrAlias;
  return TOOL_DISPLAY_NAMES[canonical] || nameOrAlias;
}

// ============================================================================
// TOOL PARAMETER TYPES
// ============================================================================

/**
 * Parameter type for tool inputs
 */
export type ToolParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object';

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  name: string;
  type: ToolParameterType;
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
  items?: ToolParameter; // For array types
  properties?: Record<string, ToolParameter>; // For object types
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: unknown) => boolean;
  };
}

// ============================================================================
// TOOL CONTEXT AND RESULT TYPES
// ============================================================================

/**
 * Context provided to tool execution
 */
export interface ToolContext {
  /** Session ID for the current execution */
  sessionId: string;
  /** User ID of the requester */
  userId: string;
  /** User's permission level */
  permissionLevel: UserPermissionLevel;
  /** Optional sandbox ID for isolated execution */
  sandboxId?: string;
  /** Working directory for file operations */
  workingDirectory: string;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
  /** Agent/employee name requesting the tool */
  agentName?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Artifact produced by tool execution
 */
export interface ToolArtifact {
  type: 'file' | 'preview' | 'deployment' | 'screenshot' | 'image' | 'video';
  path?: string;
  url?: string;
  content?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Result of tool execution
 */
export interface ToolResult {
  /** Whether execution succeeded */
  success: boolean;
  /** Human-readable output message */
  output?: string;
  /** Error message if failed */
  error?: string;
  /** Structured data result */
  data?: unknown;
  /** Artifacts produced (files, images, etc.) */
  artifacts?: ToolArtifact[];
  /** Execution metadata */
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
    cost?: number;
  };
}

// ============================================================================
// UNIFIED TOOL INTERFACE
// ============================================================================

/**
 * Unified tool definition interface
 * This is the canonical interface all tools should implement
 */
export interface UnifiedTool {
  /** Canonical tool identifier (kebab-case) */
  id: CanonicalToolName;
  /** Human-readable name */
  name: string;
  /** Aliases for backwards compatibility */
  aliases: string[];
  /** Tool description */
  description: string;
  /** Tool category */
  category: ToolCategory;
  /** Required permissions to use this tool */
  requiredPermissions: ToolPermission[];
  /** Parameter definitions */
  parameters: Record<string, ToolParameter>;
  /** Zod schema for parameter validation */
  parameterSchema: z.ZodSchema;
  /** Tool execution function */
  execute: (params: unknown, context: ToolContext) => Promise<ToolResult>;
  /** Parameter validation function */
  validate: (params: unknown) => ValidationResult;
  /** Cost estimation function */
  estimateCost: (params: unknown) => number;
  /** Rate limit configuration */
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  /** Whether the tool is currently active/available */
  isActive: boolean;
}

/**
 * Validation result for tool parameters
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// ============================================================================
// TOOL CALL AND EXECUTION TYPES
// ============================================================================

/**
 * Status of a tool call
 */
export type ToolCallStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Tool call record
 */
export interface ToolCall {
  /** Unique call identifier */
  id: string;
  /** Tool name (may be alias or canonical) */
  name: string;
  /** Canonical tool name (resolved from alias) */
  canonicalName: CanonicalToolName | null;
  /** Call arguments */
  arguments: Record<string, unknown>;
  /** Current status */
  status: ToolCallStatus;
  /** Execution result */
  result?: ToolResult;
  /** Error if failed */
  error?: string;
  /** Timestamp when call started */
  startedAt?: Date;
  /** Timestamp when call completed */
  completedAt?: Date;
}

/**
 * Tool execution request
 */
export interface ToolExecutionRequest {
  /** Request identifier */
  id: string;
  /** Tool name (may be alias) */
  toolName: string;
  /** Execution parameters */
  parameters: Record<string, unknown>;
  /** Execution context */
  context: ToolContext;
  /** Priority (higher = more urgent) */
  priority?: number;
  /** Request timestamp */
  timestamp: Date;
}

// ============================================================================
// EXECUTION HISTORY TYPES
// ============================================================================

/**
 * Configuration for bounded execution history
 */
export interface ExecutionHistoryConfig {
  /** Maximum number of entries to keep */
  maxEntries: number;
  /** Maximum age of entries in milliseconds */
  maxAgeMs: number;
  /** Cleanup interval in milliseconds */
  cleanupIntervalMs: number;
}

/**
 * Default execution history configuration
 */
export const DEFAULT_HISTORY_CONFIG: ExecutionHistoryConfig = {
  maxEntries: 1000,
  maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours
  cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
};

/**
 * Execution history entry
 */
export interface ExecutionHistoryEntry {
  /** Tool call record */
  call: ToolCall;
  /** User ID who made the request */
  userId: string;
  /** Session ID */
  sessionId: string;
  /** Agent/employee name */
  agentName?: string;
  /** Entry timestamp */
  timestamp: Date;
}

// ============================================================================
// TOOL USAGE STATISTICS
// ============================================================================

/**
 * Tool usage statistics
 */
export interface ToolUsageStats {
  toolId: CanonicalToolName;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalCost: number;
  averageExecutionTime: number;
  lastExecutedAt?: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user has permission to use a tool
 */
export function hasToolPermission(
  userLevel: UserPermissionLevel,
  requiredPermissions: ToolPermission[]
): boolean {
  const userPermissions = PERMISSION_LEVELS[userLevel];
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Get all tools a user has access to based on their permission level
 */
export function getAccessibleToolPermissions(
  userLevel: UserPermissionLevel
): ToolPermission[] {
  return PERMISSION_LEVELS[userLevel];
}

/**
 * Create a ToolCall from a request
 */
export function createToolCall(
  name: string,
  args: Record<string, unknown>
): ToolCall {
  return {
    id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    canonicalName: resolveToolName(name),
    arguments: args,
    status: 'pending',
    startedAt: new Date(),
  };
}

// ============================================================================
// ZOD SCHEMAS FOR COMMON PARAMETER TYPES
// ============================================================================

/**
 * Common parameter schemas for reuse
 */
export const CommonParameterSchemas = {
  filePath: z.string().min(1).describe('File path'),
  content: z.string().describe('File content'),
  pattern: z.string().min(1).describe('Search pattern'),
  query: z.string().min(1).describe('Search query'),
  command: z.string().min(1).describe('Command to execute'),
  timeout: z.number().min(0).max(600000).optional().describe('Timeout in ms'),
  limit: z.number().min(1).max(10000).optional().describe('Result limit'),
  offset: z.number().min(0).optional().describe('Result offset'),
};
