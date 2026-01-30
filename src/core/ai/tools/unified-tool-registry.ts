/**
 * Unified Tool Registry
 *
 * Consolidated tool management system that:
 * - Supports tool name aliasing for backwards compatibility
 * - Implements proper permission checks
 * - Uses bounded execution history to prevent memory leaks
 * - Provides a unified interface for all tool implementations
 *
 * @module @core/ai/tools/unified-tool-registry
 */

import { z } from 'zod';
import type {
  UnifiedTool,
  ToolContext,
  ToolResult,
  ToolCall,
  ToolCallStatus,
  ToolUsageStats,
  ToolCategory,
  ToolPermission,
  CanonicalToolName,
  UserPermissionLevel,
  ExecutionHistoryEntry,
  ExecutionHistoryConfig,
  ValidationResult,
} from './types';
import {
  TOOL_ALIASES,
  TOOL_DISPLAY_NAMES,
  resolveToolName,
  hasToolPermission,
  createToolCall,
  DEFAULT_HISTORY_CONFIG,
  CommonParameterSchemas,
} from './types';

// ============================================================================
// BOUNDED EXECUTION HISTORY
// ============================================================================

/**
 * Bounded execution history with automatic cleanup
 * Prevents memory leaks by limiting entries and removing old ones
 */
class BoundedExecutionHistory {
  private entries: ExecutionHistoryEntry[] = [];
  private config: ExecutionHistoryConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: ExecutionHistoryConfig = DEFAULT_HISTORY_CONFIG) {
    this.config = config;
    this.startCleanupTimer();
  }

  /**
   * Add an entry to history
   */
  add(entry: ExecutionHistoryEntry): void {
    this.entries.push(entry);

    // Trim if over max entries
    if (this.entries.length > this.config.maxEntries) {
      const excess = this.entries.length - this.config.maxEntries;
      this.entries.splice(0, excess);
    }
  }

  /**
   * Get all entries, optionally filtered
   */
  getAll(filter?: {
    toolId?: CanonicalToolName;
    userId?: string;
    sessionId?: string;
    status?: ToolCallStatus;
    since?: Date;
  }): ExecutionHistoryEntry[] {
    let results = [...this.entries];

    if (filter) {
      if (filter.toolId) {
        results = results.filter(
          (e) => e.call.canonicalName === filter.toolId
        );
      }
      if (filter.userId) {
        results = results.filter((e) => e.userId === filter.userId);
      }
      if (filter.sessionId) {
        results = results.filter((e) => e.sessionId === filter.sessionId);
      }
      if (filter.status) {
        results = results.filter((e) => e.call.status === filter.status);
      }
      if (filter.since) {
        results = results.filter((e) => e.timestamp >= filter.since!);
      }
    }

    return results;
  }

  /**
   * Get entry by call ID
   */
  getById(callId: string): ExecutionHistoryEntry | undefined {
    return this.entries.find((e) => e.call.id === callId);
  }

  /**
   * Update an entry's call status
   */
  updateCall(callId: string, updates: Partial<ToolCall>): void {
    const entry = this.entries.find((e) => e.call.id === callId);
    if (entry) {
      Object.assign(entry.call, updates);
    }
  }

  /**
   * Get entry count
   */
  get size(): number {
    return this.entries.length;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Remove entries older than maxAgeMs
   */
  cleanup(): number {
    const cutoff = Date.now() - this.config.maxAgeMs;
    const cutoffDate = new Date(cutoff);
    const before = this.entries.length;

    this.entries = this.entries.filter((e) => e.timestamp >= cutoffDate);

    return before - this.entries.length;
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Stop cleanup timer (for cleanup on destroy)
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.entries = [];
  }
}

// ============================================================================
// UNIFIED TOOL REGISTRY
// ============================================================================

/**
 * UnifiedToolRegistry
 *
 * Central registry for all tools with:
 * - Tool name aliasing
 * - Permission-based access control
 * - Bounded execution history
 * - Usage statistics tracking
 */
export class UnifiedToolRegistry {
  private tools: Map<CanonicalToolName, UnifiedTool> = new Map();
  private history: BoundedExecutionHistory;
  private usageStats: Map<CanonicalToolName, ToolUsageStats> = new Map();
  private rateLimitTracking: Map<
    string,
    { requests: number[]; limit: { maxRequests: number; windowMs: number } }
  > = new Map();

  constructor(historyConfig?: ExecutionHistoryConfig) {
    this.history = new BoundedExecutionHistory(historyConfig);
    this.registerBuiltInTools();
  }

  // ==========================================================================
  // TOOL REGISTRATION
  // ==========================================================================

  /**
   * Register a tool
   */
  registerTool(tool: UnifiedTool): void {
    if (this.tools.has(tool.id)) {
      console.warn(`Tool ${tool.id} is already registered, updating...`);
    }

    this.tools.set(tool.id, tool);

    // Initialize usage stats
    if (!this.usageStats.has(tool.id)) {
      this.usageStats.set(tool.id, {
        toolId: tool.id,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalCost: 0,
        averageExecutionTime: 0,
      });
    }

    // Initialize rate limit tracking
    if (tool.rateLimit) {
      const key = `${tool.id}`;
      this.rateLimitTracking.set(key, {
        requests: [],
        limit: tool.rateLimit,
      });
    }
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolId: CanonicalToolName): boolean {
    return this.tools.delete(toolId);
  }

  // ==========================================================================
  // TOOL LOOKUP (with alias resolution)
  // ==========================================================================

  /**
   * Get a tool by name or alias
   */
  getTool(nameOrAlias: string): UnifiedTool | undefined {
    const canonical = resolveToolName(nameOrAlias);
    if (!canonical) return undefined;
    return this.tools.get(canonical);
  }

  /**
   * Get a tool by canonical ID
   */
  getToolById(id: CanonicalToolName): UnifiedTool | undefined {
    return this.tools.get(id);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): UnifiedTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ToolCategory): UnifiedTool[] {
    return this.getAllTools().filter((t) => t.category === category);
  }

  /**
   * Get tools accessible to a user based on permission level
   */
  getAccessibleTools(userLevel: UserPermissionLevel): UnifiedTool[] {
    return this.getAllTools().filter(
      (tool) =>
        tool.isActive && hasToolPermission(userLevel, tool.requiredPermissions)
    );
  }

  /**
   * Check if a tool name/alias is valid
   */
  isValidTool(nameOrAlias: string): boolean {
    const canonical = resolveToolName(nameOrAlias);
    return canonical !== null && this.tools.has(canonical);
  }

  // ==========================================================================
  // PERMISSION CHECKING
  // ==========================================================================

  /**
   * Check if a user has permission to use a tool
   */
  hasPermission(
    nameOrAlias: string,
    userLevel: UserPermissionLevel
  ): { allowed: boolean; reason?: string } {
    const tool = this.getTool(nameOrAlias);

    if (!tool) {
      return { allowed: false, reason: `Tool not found: ${nameOrAlias}` };
    }

    if (!tool.isActive) {
      return { allowed: false, reason: `Tool is currently disabled: ${tool.name}` };
    }

    if (!hasToolPermission(userLevel, tool.requiredPermissions)) {
      return {
        allowed: false,
        reason: `Insufficient permissions. Required: ${tool.requiredPermissions.join(', ')}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check rate limit for a tool
   */
  private checkRateLimit(
    tool: UnifiedTool,
    userId: string
  ): { allowed: boolean; retryAfter?: number } {
    if (!tool.rateLimit) {
      return { allowed: true };
    }

    const key = `${tool.id}:${userId}`;
    let tracker = this.rateLimitTracking.get(key);

    if (!tracker) {
      tracker = { requests: [], limit: tool.rateLimit };
      this.rateLimitTracking.set(key, tracker);
    }

    const now = Date.now();
    const windowStart = now - tracker.limit.windowMs;

    // Remove old requests
    tracker.requests = tracker.requests.filter((time) => time > windowStart);

    if (tracker.requests.length >= tracker.limit.maxRequests) {
      const oldestRequest = tracker.requests[0];
      const retryAfter = oldestRequest + tracker.limit.windowMs - now;
      return { allowed: false, retryAfter };
    }

    // Track this request
    tracker.requests.push(now);
    return { allowed: true };
  }

  // ==========================================================================
  // TOOL EXECUTION
  // ==========================================================================

  /**
   * Execute a tool with full validation and permission checking
   */
  async executeTool(
    nameOrAlias: string,
    parameters: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolCall> {
    const call = createToolCall(nameOrAlias, parameters);

    // Add to history
    this.history.add({
      call,
      userId: context.userId,
      sessionId: context.sessionId,
      agentName: context.agentName,
      timestamp: new Date(),
    });

    try {
      // Resolve tool
      const tool = this.getTool(nameOrAlias);
      if (!tool) {
        return this.failCall(call, `Tool not found: ${nameOrAlias}`);
      }

      // Check permissions
      const permCheck = this.hasPermission(nameOrAlias, context.permissionLevel);
      if (!permCheck.allowed) {
        return this.failCall(call, permCheck.reason || 'Permission denied');
      }

      // Check rate limit
      const rateCheck = this.checkRateLimit(tool, context.userId);
      if (!rateCheck.allowed) {
        return this.failCall(
          call,
          `Rate limit exceeded. Retry after ${Math.ceil((rateCheck.retryAfter || 0) / 1000)} seconds`
        );
      }

      // Validate parameters
      const validation = tool.validate(parameters);
      if (!validation.valid) {
        return this.failCall(
          call,
          `Invalid parameters: ${validation.errors?.join(', ')}`
        );
      }

      // Mark as running
      call.status = 'running';
      this.history.updateCall(call.id, { status: 'running' });

      // Execute
      const startTime = Date.now();
      const result = await tool.execute(parameters, context);
      const executionTime = Date.now() - startTime;

      // Update call with result
      call.status = result.success ? 'completed' : 'failed';
      call.result = {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime,
        },
      };
      call.completedAt = new Date();

      // Update history
      this.history.updateCall(call.id, {
        status: call.status,
        result: call.result,
        completedAt: call.completedAt,
      });

      // Update stats
      this.updateStats(tool.id, result.success, executionTime, tool.estimateCost(parameters));

      return call;
    } catch (error) {
      return this.failCall(
        call,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Fail a call and update history
   */
  private failCall(call: ToolCall, error: string): ToolCall {
    call.status = 'failed';
    call.error = error;
    call.completedAt = new Date();
    call.result = {
      success: false,
      error,
      metadata: {
        executionTime: call.startedAt
          ? Date.now() - call.startedAt.getTime()
          : 0,
      },
    };

    this.history.updateCall(call.id, {
      status: 'failed',
      error,
      completedAt: call.completedAt,
      result: call.result,
    });

    return call;
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Update usage statistics
   */
  private updateStats(
    toolId: CanonicalToolName,
    success: boolean,
    executionTime: number,
    cost: number
  ): void {
    const stats = this.usageStats.get(toolId);
    if (!stats) return;

    stats.totalExecutions++;
    if (success) {
      stats.successfulExecutions++;
    } else {
      stats.failedExecutions++;
    }

    stats.totalCost += cost;
    stats.lastExecutedAt = new Date();

    // Update moving average for execution time
    stats.averageExecutionTime =
      (stats.averageExecutionTime * (stats.totalExecutions - 1) + executionTime) /
      stats.totalExecutions;

    this.usageStats.set(toolId, stats);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(toolId?: CanonicalToolName): ToolUsageStats | ToolUsageStats[] {
    if (toolId) {
      const stats = this.usageStats.get(toolId);
      if (!stats) {
        throw new Error(`No stats found for tool ${toolId}`);
      }
      return stats;
    }
    return Array.from(this.usageStats.values());
  }

  // ==========================================================================
  // EXECUTION HISTORY
  // ==========================================================================

  /**
   * Get execution history with optional filters
   */
  getExecutionHistory(filter?: {
    toolId?: CanonicalToolName;
    userId?: string;
    sessionId?: string;
    status?: ToolCallStatus;
    since?: Date;
  }): ExecutionHistoryEntry[] {
    return this.history.getAll(filter);
  }

  /**
   * Get a specific execution by call ID
   */
  getExecution(callId: string): ExecutionHistoryEntry | undefined {
    return this.history.getById(callId);
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.history.clear();
  }

  /**
   * Get history size
   */
  getHistorySize(): number {
    return this.history.size;
  }

  // ==========================================================================
  // BUILT-IN TOOLS
  // ==========================================================================

  /**
   * Register all built-in tools
   */
  private registerBuiltInTools(): void {
    // File Reader
    this.registerTool(createFileReaderTool());

    // File Writer
    this.registerTool(createFileWriterTool());

    // File Editor
    this.registerTool(createFileEditorTool());

    // Pattern Search (Grep)
    this.registerTool(createPatternSearchTool());

    // File Finder (Glob)
    this.registerTool(createFileFinderTool());

    // Command Executor (Bash)
    this.registerTool(createCommandExecutorTool());

    // Web Search
    this.registerTool(createWebSearchTool());

    // Web Fetch
    this.registerTool(createWebFetchTool());

    // Code Analyzer
    this.registerTool(createCodeAnalyzerTool());

    // Code Generator
    this.registerTool(createCodeGeneratorTool());
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Destroy the registry and clean up resources
   */
  destroy(): void {
    this.history.destroy();
    this.tools.clear();
    this.usageStats.clear();
    this.rateLimitTracking.clear();
  }
}

// ============================================================================
// BUILT-IN TOOL FACTORY FUNCTIONS
// ============================================================================

function createFileReaderTool(): UnifiedTool {
  const schema = z.object({
    file_path: CommonParameterSchemas.filePath,
    offset: CommonParameterSchemas.offset,
    limit: CommonParameterSchemas.limit,
  });

  return {
    id: 'file-reader',
    name: 'File Reader',
    aliases: ['Read', 'read_files', 'file_reader'],
    description: 'Read file contents from the workspace',
    category: 'file',
    requiredPermissions: ['file:read'],
    parameters: {
      file_path: {
        name: 'file_path',
        type: 'string',
        description: 'Path to the file to read',
        required: true,
      },
      offset: {
        name: 'offset',
        type: 'number',
        description: 'Line offset to start reading from',
        required: false,
      },
      limit: {
        name: 'limit',
        type: 'number',
        description: 'Number of lines to read',
        required: false,
      },
    },
    parameterSchema: schema,
    execute: async (params, context): Promise<ToolResult> => {
      // Stub implementation - actual implementation in vibe-tool-orchestrator
      return {
        success: true,
        output: `File read simulation for ${(params as { file_path: string }).file_path}`,
        data: { path: (params as { file_path: string }).file_path, content: '' },
      };
    },
    validate: (params): ValidationResult => {
      const result = schema.safeParse(params);
      return {
        valid: result.success,
        errors: result.success ? undefined : [result.error.message],
      };
    },
    estimateCost: () => 0.01,
    isActive: true,
  };
}

function createFileWriterTool(): UnifiedTool {
  const schema = z.object({
    file_path: CommonParameterSchemas.filePath,
    content: CommonParameterSchemas.content,
  });

  return {
    id: 'file-writer',
    name: 'File Writer',
    aliases: ['Write', 'write_files', 'file_writer'],
    description: 'Write content to a file in the workspace',
    category: 'file',
    requiredPermissions: ['file:write'],
    parameters: {
      file_path: {
        name: 'file_path',
        type: 'string',
        description: 'Path to the file to write',
        required: true,
      },
      content: {
        name: 'content',
        type: 'string',
        description: 'Content to write to the file',
        required: true,
      },
    },
    parameterSchema: schema,
    execute: async (params, context): Promise<ToolResult> => {
      return {
        success: true,
        output: `File written to ${(params as { file_path: string }).file_path}`,
      };
    },
    validate: (params): ValidationResult => {
      const result = schema.safeParse(params);
      return {
        valid: result.success,
        errors: result.success ? undefined : [result.error.message],
      };
    },
    estimateCost: () => 0.02,
    isActive: true,
  };
}

function createFileEditorTool(): UnifiedTool {
  const schema = z.object({
    file_path: CommonParameterSchemas.filePath,
    old_string: z.string().min(1),
    new_string: z.string(),
    replace_all: z.boolean().optional(),
  });

  return {
    id: 'file-editor',
    name: 'File Editor',
    aliases: ['Edit', 'delete_files'],
    description: 'Edit file with find/replace operations',
    category: 'file',
    requiredPermissions: ['file:write'],
    parameters: {
      file_path: {
        name: 'file_path',
        type: 'string',
        description: 'Path to the file to edit',
        required: true,
      },
      old_string: {
        name: 'old_string',
        type: 'string',
        description: 'String to find and replace',
        required: true,
      },
      new_string: {
        name: 'new_string',
        type: 'string',
        description: 'Replacement string',
        required: true,
      },
      replace_all: {
        name: 'replace_all',
        type: 'boolean',
        description: 'Replace all occurrences',
        required: false,
        default: false,
      },
    },
    parameterSchema: schema,
    execute: async (params, context): Promise<ToolResult> => {
      return {
        success: true,
        output: `File edited: ${(params as { file_path: string }).file_path}`,
      };
    },
    validate: (params): ValidationResult => {
      const result = schema.safeParse(params);
      return {
        valid: result.success,
        errors: result.success ? undefined : [result.error.message],
      };
    },
    estimateCost: () => 0.02,
    isActive: true,
  };
}

function createPatternSearchTool(): UnifiedTool {
  const schema = z.object({
    pattern: CommonParameterSchemas.pattern,
    path: z.string().optional(),
    output_mode: z.enum(['content', 'files_with_matches', 'count']).optional(),
  });

  return {
    id: 'pattern-search',
    name: 'Pattern Search',
    aliases: ['Grep', 'search_files'],
    description: 'Search for patterns in files using regex',
    category: 'search',
    requiredPermissions: ['file:read'],
    parameters: {
      pattern: {
        name: 'pattern',
        type: 'string',
        description: 'Search pattern (regex)',
        required: true,
      },
      path: {
        name: 'path',
        type: 'string',
        description: 'Path to search in',
        required: false,
      },
      output_mode: {
        name: 'output_mode',
        type: 'string',
        description: 'Output mode (content, files_with_matches, count)',
        required: false,
        enum: ['content', 'files_with_matches', 'count'],
      },
    },
    parameterSchema: schema,
    execute: async (params, context): Promise<ToolResult> => {
      return {
        success: true,
        output: `Pattern search for: ${(params as { pattern: string }).pattern}`,
        data: { matches: [] },
      };
    },
    validate: (params): ValidationResult => {
      const result = schema.safeParse(params);
      return {
        valid: result.success,
        errors: result.success ? undefined : [result.error.message],
      };
    },
    estimateCost: () => 0.01,
    isActive: true,
  };
}

function createFileFinderTool(): UnifiedTool {
  const schema = z.object({
    pattern: z.string().min(1),
    path: z.string().optional(),
  });

  return {
    id: 'file-finder',
    name: 'File Finder',
    aliases: ['Glob', 'list_files'],
    description: 'Find files matching a glob pattern',
    category: 'search',
    requiredPermissions: ['file:read'],
    parameters: {
      pattern: {
        name: 'pattern',
        type: 'string',
        description: 'Glob pattern (e.g., **/*.ts)',
        required: true,
      },
      path: {
        name: 'path',
        type: 'string',
        description: 'Base path to search from',
        required: false,
      },
    },
    parameterSchema: schema,
    execute: async (params, context): Promise<ToolResult> => {
      return {
        success: true,
        output: `Files found for pattern: ${(params as { pattern: string }).pattern}`,
        data: { files: [] },
      };
    },
    validate: (params): ValidationResult => {
      const result = schema.safeParse(params);
      return {
        valid: result.success,
        errors: result.success ? undefined : [result.error.message],
      };
    },
    estimateCost: () => 0.01,
    isActive: true,
  };
}

function createCommandExecutorTool(): UnifiedTool {
  const schema = z.object({
    command: CommonParameterSchemas.command,
    timeout: CommonParameterSchemas.timeout,
  });

  return {
    id: 'command-executor',
    name: 'Command Executor',
    aliases: ['Bash', 'bash-executor', 'code_runner', 'git', 'deploy_preview'],
    description: 'Execute shell commands in a sandboxed environment',
    category: 'system',
    requiredPermissions: ['system:execute'],
    parameters: {
      command: {
        name: 'command',
        type: 'string',
        description: 'Command to execute',
        required: true,
      },
      timeout: {
        name: 'timeout',
        type: 'number',
        description: 'Timeout in milliseconds (max 600000)',
        required: false,
        default: 30000,
        validation: { max: 600000 },
      },
    },
    parameterSchema: schema,
    execute: async (params, context): Promise<ToolResult> => {
      return {
        success: true,
        output: 'Command execution simulated in browser sandbox',
        data: { exitCode: 0 },
      };
    },
    validate: (params): ValidationResult => {
      const result = schema.safeParse(params);
      return {
        valid: result.success,
        errors: result.success ? undefined : [result.error.message],
      };
    },
    estimateCost: () => 0.01,
    isActive: true,
  };
}

function createWebSearchTool(): UnifiedTool {
  const schema = z.object({
    query: CommonParameterSchemas.query,
    maxResults: z.number().min(1).max(50).optional(),
  });

  return {
    id: 'web-search',
    name: 'Web Search',
    aliases: ['WebSearch', 'web_search'],
    description: 'Search the web for information',
    category: 'web',
    requiredPermissions: ['web:search'],
    parameters: {
      query: {
        name: 'query',
        type: 'string',
        description: 'Search query',
        required: true,
      },
      maxResults: {
        name: 'maxResults',
        type: 'number',
        description: 'Maximum results to return',
        required: false,
        default: 10,
      },
    },
    parameterSchema: schema,
    execute: async (params, context): Promise<ToolResult> => {
      return {
        success: true,
        output: `Web search for: ${(params as { query: string }).query}`,
        data: { results: [] },
      };
    },
    validate: (params): ValidationResult => {
      const result = schema.safeParse(params);
      return {
        valid: result.success,
        errors: result.success ? undefined : [result.error.message],
      };
    },
    estimateCost: () => 0.05,
    rateLimit: { maxRequests: 100, windowMs: 60000 },
    isActive: true,
  };
}

function createWebFetchTool(): UnifiedTool {
  const schema = z.object({
    url: z.string().url(),
    prompt: z.string().optional(),
  });

  return {
    id: 'web-fetch',
    name: 'Web Fetch',
    aliases: ['WebFetch'],
    description: 'Fetch content from a URL',
    category: 'web',
    requiredPermissions: ['web:fetch'],
    parameters: {
      url: {
        name: 'url',
        type: 'string',
        description: 'URL to fetch',
        required: true,
      },
      prompt: {
        name: 'prompt',
        type: 'string',
        description: 'What to extract from the page',
        required: false,
      },
    },
    parameterSchema: schema,
    execute: async (params, context): Promise<ToolResult> => {
      return {
        success: true,
        output: `Fetched URL: ${(params as { url: string }).url}`,
        data: { content: '' },
      };
    },
    validate: (params): ValidationResult => {
      const result = schema.safeParse(params);
      return {
        valid: result.success,
        errors: result.success ? undefined : [result.error.message],
      };
    },
    estimateCost: () => 0.03,
    isActive: true,
  };
}

function createCodeAnalyzerTool(): UnifiedTool {
  const schema = z.object({
    code: z.string().min(1),
    language: z.string().optional(),
  });

  return {
    id: 'code-analyzer',
    name: 'Code Analyzer',
    aliases: [],
    description: 'Analyze code for issues and improvements',
    category: 'code',
    requiredPermissions: ['code:analyze'],
    parameters: {
      code: {
        name: 'code',
        type: 'string',
        description: 'Code to analyze',
        required: true,
      },
      language: {
        name: 'language',
        type: 'string',
        description: 'Programming language',
        required: false,
      },
    },
    parameterSchema: schema,
    execute: async (params, context): Promise<ToolResult> => {
      return {
        success: true,
        output: 'Code analysis complete',
        data: { issues: [], suggestions: [] },
      };
    },
    validate: (params): ValidationResult => {
      const result = schema.safeParse(params);
      return {
        valid: result.success,
        errors: result.success ? undefined : [result.error.message],
      };
    },
    estimateCost: () => 0.1,
    isActive: true,
  };
}

function createCodeGeneratorTool(): UnifiedTool {
  const schema = z.object({
    prompt: z.string().min(1),
    language: z.string().optional(),
  });

  return {
    id: 'code-generator',
    name: 'Code Generator',
    aliases: [],
    description: 'Generate code based on specifications',
    category: 'code',
    requiredPermissions: ['code:generate'],
    parameters: {
      prompt: {
        name: 'prompt',
        type: 'string',
        description: 'Description of code to generate',
        required: true,
      },
      language: {
        name: 'language',
        type: 'string',
        description: 'Target programming language',
        required: false,
      },
    },
    parameterSchema: schema,
    execute: async (params, context): Promise<ToolResult> => {
      return {
        success: true,
        output: 'Code generation complete',
        data: { code: '' },
      };
    },
    validate: (params): ValidationResult => {
      const result = schema.safeParse(params);
      return {
        valid: result.success,
        errors: result.success ? undefined : [result.error.message],
      };
    },
    estimateCost: () => 0.15,
    isActive: true,
  };
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global unified tool registry instance
 */
export const unifiedToolRegistry = new UnifiedToolRegistry();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Execute a tool using the global registry
 */
export function executeTool(
  nameOrAlias: string,
  parameters: Record<string, unknown>,
  context: ToolContext
): Promise<ToolCall> {
  return unifiedToolRegistry.executeTool(nameOrAlias, parameters, context);
}

/**
 * Get a tool by name or alias
 */
export function getTool(nameOrAlias: string): UnifiedTool | undefined {
  return unifiedToolRegistry.getTool(nameOrAlias);
}

/**
 * Check if a user has permission to use a tool
 */
export function checkToolPermission(
  nameOrAlias: string,
  userLevel: UserPermissionLevel
): { allowed: boolean; reason?: string } {
  return unifiedToolRegistry.hasPermission(nameOrAlias, userLevel);
}

/**
 * Get all tools accessible to a user
 */
export function getAccessibleTools(userLevel: UserPermissionLevel): UnifiedTool[] {
  return unifiedToolRegistry.getAccessibleTools(userLevel);
}

/**
 * Resolve a tool name alias to its canonical name
 */
export { resolveToolName, getToolDisplayName } from './types';
