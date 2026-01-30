/**
 * Tool Integration Manager - Manages all tool integrations and executions
 * Provides a unified interface for agents to use various tools
 *
 * NOTE: This is the legacy tool manager. For new integrations, prefer using
 * the UnifiedToolRegistry from './unified-tool-registry.ts' which provides:
 * - Tool name aliasing for backwards compatibility
 * - Proper permission checks
 * - Bounded execution history
 *
 * @see UnifiedToolRegistry
 */

import { AgentType } from '../orchestration/reasoning/task-breakdown';
import {
  resolveToolName,
  type UserPermissionLevel,
  type CanonicalToolName,
  PERMISSION_LEVELS,
} from './types';

export type ToolCategory =
  | 'code'
  | 'data'
  | 'automation'
  | 'search'
  | 'file'
  | 'system'
  | 'ai';

export interface Tool {
  id: string;
  name: string;
  /** Aliases for backwards compatibility (e.g., "Read" for "file-reader") */
  aliases?: string[];
  description: string;
  category: ToolCategory;
  execute: (params: unknown) => Promise<unknown>;
  validate: (params: unknown) => ValidationResult;
  estimateCost: (params: unknown) => number;
  requiredPermissions: string[];
  supportedAgents: AgentType[];
  rateLimit?: RateLimit;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface ToolExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
  cost: number;
  toolId: string;
  timestamp: Date;
}

export interface RateLimit {
  maxRequests: number;
  windowMs: number;
}

export interface ToolUsageStats {
  toolId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalCost: number;
  averageExecutionTime: number;
}

/**
 * Configuration for bounded execution history
 */
export interface HistoryConfig {
  /** Maximum number of entries to keep (default: 1000) */
  maxEntries: number;
  /** Maximum age of entries in milliseconds (default: 24 hours) */
  maxAgeMs: number;
  /** Cleanup interval in milliseconds (default: 5 minutes) */
  cleanupIntervalMs: number;
}

const DEFAULT_HISTORY_CONFIG: HistoryConfig = {
  maxEntries: 1000,
  maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours
  cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
};

/**
 * ToolManager - Main class for managing tools
 *
 * Updated: Jan 30 2026 - Added bounded execution history, tool aliases, and proper permissions
 */
export class ToolManager {
  private tools: Map<string, Tool> = new Map();
  /** Alias to tool ID mapping for backwards compatibility */
  private aliasMap: Map<string, string> = new Map();
  private usageStats: Map<string, ToolUsageStats> = new Map();
  private rateLimitTracking: Map<string, RateLimitTracker> = new Map();
  /** Bounded execution history to prevent memory leaks */
  private executionHistory: ToolExecutionResult[] = [];
  private historyConfig: HistoryConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(historyConfig?: Partial<HistoryConfig>) {
    this.historyConfig = { ...DEFAULT_HISTORY_CONFIG, ...historyConfig };
    this.registerBuiltInTools();
    this.startHistoryCleanup();
  }

  /**
   * Start automatic cleanup of old history entries
   */
  private startHistoryCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupHistory();
    }, this.historyConfig.cleanupIntervalMs);
  }

  /**
   * Clean up old history entries to prevent memory leaks
   */
  private cleanupHistory(): void {
    const cutoff = new Date(Date.now() - this.historyConfig.maxAgeMs);
    this.executionHistory = this.executionHistory.filter(
      (h) => h.timestamp >= cutoff
    );

    // Also trim to max entries
    if (this.executionHistory.length > this.historyConfig.maxEntries) {
      const excess = this.executionHistory.length - this.historyConfig.maxEntries;
      this.executionHistory.splice(0, excess);
    }
  }

  /**
   * Destroy the manager and clean up resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.executionHistory = [];
    this.tools.clear();
    this.aliasMap.clear();
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.id)) {
      console.warn(`Tool ${tool.id} is already registered, updating...`);
    }

    this.tools.set(tool.id, tool);

    // Register aliases for backwards compatibility
    if (tool.aliases) {
      for (const alias of tool.aliases) {
        this.aliasMap.set(alias, tool.id);
        this.aliasMap.set(alias.toLowerCase(), tool.id);
      }
    }

    // Also map the tool name itself as an alias
    this.aliasMap.set(tool.name, tool.id);
    this.aliasMap.set(tool.name.toLowerCase(), tool.id);
    this.aliasMap.set(tool.id, tool.id); // Self-reference

    this.usageStats.set(tool.id, {
      toolId: tool.id,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalCost: 0,
      averageExecutionTime: 0,
    });

    if (tool.rateLimit) {
      this.rateLimitTracking.set(tool.id, {
        requests: [],
        limit: tool.rateLimit,
      });
    }
  }

  /**
   * Resolve a tool name or alias to the canonical tool ID
   */
  resolveToolId(nameOrAlias: string): string | null {
    // Check direct mapping
    if (this.aliasMap.has(nameOrAlias)) {
      return this.aliasMap.get(nameOrAlias)!;
    }

    // Check unified tool aliases
    const canonical = resolveToolName(nameOrAlias);
    if (canonical && this.tools.has(canonical)) {
      return canonical;
    }

    // Check if it's a direct tool ID
    if (this.tools.has(nameOrAlias)) {
      return nameOrAlias;
    }

    return null;
  }

  /**
   * Execute a tool by ID or alias
   *
   * @param toolIdOrAlias - Tool ID or any registered alias (e.g., "Read" or "file-reader")
   * @param params - Tool parameters
   * @param agent - Agent type requesting execution
   * @param userId - User ID for permission checking
   * @param userPermissionLevel - Optional user permission level for proper permission checking
   */
  async executeTool(
    toolIdOrAlias: string,
    params: Record<string, unknown>,
    agent: AgentType,
    userId: string,
    userPermissionLevel?: UserPermissionLevel
  ): Promise<ToolExecutionResult> {
    // Resolve alias to tool ID
    const resolvedId = this.resolveToolId(toolIdOrAlias);
    const toolId = resolvedId || toolIdOrAlias;

    const tool = this.tools.get(toolId);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolIdOrAlias}${toolIdOrAlias !== toolId ? ` (resolved to ${toolId})` : ''}. Available tools: ${Array.from(this.tools.keys()).join(', ')}`,
        executionTime: 0,
        cost: 0,
        toolId: toolIdOrAlias,
        timestamp: new Date(),
      };
    }

    // Validate tool supports this agent
    if (!tool.supportedAgents.includes(agent)) {
      return {
        success: false,
        error: `Tool ${tool.name} does not support agent ${agent}. Supported agents: ${tool.supportedAgents.join(', ')}`,
        executionTime: 0,
        cost: 0,
        toolId: tool.id,
        timestamp: new Date(),
      };
    }

    // Check permissions properly (not just return true)
    const permissionCheck = this.hasPermission(tool, userPermissionLevel);
    if (!permissionCheck.allowed) {
      return {
        success: false,
        error: permissionCheck.reason || `Permission denied for tool ${tool.name}`,
        executionTime: 0,
        cost: 0,
        toolId: tool.id,
        timestamp: new Date(),
      };
    }

    // Validate parameters
    const validation = tool.validate(params);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid parameters: ${validation.errors?.join(', ')}`,
        executionTime: 0,
        cost: 0,
        toolId: tool.id,
        timestamp: new Date(),
      };
    }

    // Check rate limits
    if (tool.rateLimit) {
      const rateLimitCheck = this.checkRateLimit(tool.id, userId);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: `Rate limit exceeded for tool ${tool.name}. ${rateLimitCheck.retryAfter ? `Retry after ${Math.ceil(rateLimitCheck.retryAfter / 1000)} seconds.` : ''}`,
          executionTime: 0,
          cost: 0,
          toolId: tool.id,
          timestamp: new Date(),
        };
      }
    }

    // Execute the tool
    const startTime = Date.now();
    let result: ToolExecutionResult;

    try {
      const toolResult = await tool.execute(params);
      const executionTime = Date.now() - startTime;
      const cost = tool.estimateCost(params);

      result = {
        success: true,
        result: toolResult,
        executionTime,
        cost,
        toolId: tool.id,
        timestamp: new Date(),
      };

      // Update stats
      this.updateStats(tool.id, true, executionTime, cost);
    } catch (error) {
      const executionTime = Date.now() - startTime;

      result = {
        success: false,
        error: (error as Error).message,
        executionTime,
        cost: 0,
        toolId: tool.id,
        timestamp: new Date(),
      };

      // Update stats
      this.updateStats(tool.id, false, executionTime, 0);
    }

    // Add to bounded history
    this.addToHistory(result);

    // Track rate limit
    if (tool.rateLimit) {
      this.trackRateLimit(tool.id, userId);
    }

    return result;
  }

  /**
   * Add result to bounded history
   */
  private addToHistory(result: ToolExecutionResult): void {
    this.executionHistory.push(result);

    // Trim if over max entries
    if (this.executionHistory.length > this.historyConfig.maxEntries) {
      const excess = this.executionHistory.length - this.historyConfig.maxEntries;
      this.executionHistory.splice(0, excess);
    }
  }

  /**
   * Check if a user has permission to use a tool
   *
   * Updated: Jan 30 2026 - Proper permission checking instead of always returning true
   */
  hasPermission(
    tool: Tool,
    userLevel?: UserPermissionLevel
  ): { allowed: boolean; reason?: string } {
    // If no permission level provided, use standard (backwards compatible)
    const level = userLevel || 'standard';
    const userPermissions = PERMISSION_LEVELS[level];

    // Check each required permission
    for (const required of tool.requiredPermissions) {
      // Normalize permission format (e.g., "file:read" vs "file_read")
      const normalizedRequired = required.replace('_', ':');

      if (!userPermissions.includes(normalizedRequired as typeof userPermissions[number])) {
        return {
          allowed: false,
          reason: `Missing permission: ${required}. Your level (${level}) has: ${userPermissions.join(', ')}`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Get available tools for an agent
   */
  getAvailableTools(agent: AgentType): Tool[] {
    return Array.from(this.tools.values()).filter((tool) =>
      tool.supportedAgents.includes(agent)
    );
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ToolCategory): Tool[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.category === category
    );
  }

  /**
   * Get tool by ID or alias
   *
   * Updated: Jan 30 2026 - Now supports alias resolution
   */
  getTool(toolIdOrAlias: string): Tool | undefined {
    // Try direct lookup first
    if (this.tools.has(toolIdOrAlias)) {
      return this.tools.get(toolIdOrAlias);
    }

    // Try alias resolution
    const resolvedId = this.resolveToolId(toolIdOrAlias);
    if (resolvedId) {
      return this.tools.get(resolvedId);
    }

    return undefined;
  }

  /**
   * Check if a tool exists by ID or alias
   */
  hasTool(toolIdOrAlias: string): boolean {
    return this.getTool(toolIdOrAlias) !== undefined;
  }

  /**
   * Get tool usage statistics
   */
  getUsageStats(toolId?: string): ToolUsageStats | Map<string, ToolUsageStats> {
    if (toolId) {
      const stats = this.usageStats.get(toolId);
      if (!stats) {
        throw new Error(`No stats found for tool ${toolId}`);
      }
      return stats;
    }
    return new Map(this.usageStats);
  }

  /**
   * Get execution history
   */
  getExecutionHistory(filter?: {
    toolId?: string;
    agent?: AgentType;
    success?: boolean;
    since?: Date;
  }): ToolExecutionResult[] {
    let history = [...this.executionHistory];

    if (filter) {
      if (filter.toolId) {
        history = history.filter((h) => h.toolId === filter.toolId);
      }
      if (filter.success !== undefined) {
        history = history.filter((h) => h.success === filter.success);
      }
      if (filter.since) {
        history = history.filter((h) => h.timestamp >= filter.since!);
      }
    }

    return history;
  }

  /**
   * Register all built-in tools
   *
   * Updated: Jan 30 2026 - Added aliases for backwards compatibility with employee MD files
   */
  private registerBuiltInTools(): void {
    // File System Tools
    this.registerTool({
      id: 'file-reader',
      name: 'File Reader',
      aliases: ['Read', 'read_files', 'file_reader'], // Employee MD uses "Read"
      description: 'Read file contents',
      category: 'file',
      execute: async (params: { path: string }) => {
        // Integration with filesystem API
        return { content: 'file content', path: params.path };
      },
      validate: (params) => {
        if (!params.path) {
          return { valid: false, errors: ['Path is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.01,
      requiredPermissions: ['file:read'],
      supportedAgents: [
        'claude-code',
        'cursor-agent',
        'replit-agent',
        'mcp-tool',
      ],
    });

    this.registerTool({
      id: 'file-writer',
      name: 'File Writer',
      aliases: ['Write', 'write_files', 'file_writer'], // Employee MD uses "Write"
      description: 'Write content to file',
      category: 'file',
      execute: async (params: { path: string; content: string }) => {
        // Integration with filesystem API
        return { success: true, path: params.path };
      },
      validate: (params) => {
        if (!params.path || !params.content) {
          return { valid: false, errors: ['Path and content are required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.02,
      requiredPermissions: ['file:write'],
      supportedAgents: ['cursor-agent', 'replit-agent', 'mcp-tool', 'claude-code'],
    });

    this.registerTool({
      id: 'file-editor',
      name: 'File Editor',
      aliases: ['Edit', 'delete_files'], // Employee MD uses "Edit"
      description: 'Edit file with find/replace',
      category: 'file',
      execute: async (params: { path: string; old_string: string; new_string: string }) => {
        // Integration with filesystem API
        return { success: true, path: params.path };
      },
      validate: (params) => {
        if (!params.path || !params.old_string) {
          return { valid: false, errors: ['Path and old_string are required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.02,
      requiredPermissions: ['file:write'],
      supportedAgents: ['cursor-agent', 'replit-agent', 'mcp-tool', 'claude-code'],
    });

    // Search Tools
    this.registerTool({
      id: 'pattern-search',
      name: 'Pattern Search',
      aliases: ['Grep', 'search_files'], // Employee MD uses "Grep"
      description: 'Search for patterns in files using regex',
      category: 'search',
      execute: async (params: { pattern: string; path?: string }) => {
        return { matches: [], pattern: params.pattern };
      },
      validate: (params) => {
        if (!params.pattern) {
          return { valid: false, errors: ['Pattern is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.01,
      requiredPermissions: ['file:read'],
      supportedAgents: ['claude-code', 'cursor-agent', 'replit-agent', 'mcp-tool'],
    });

    this.registerTool({
      id: 'file-finder',
      name: 'File Finder',
      aliases: ['Glob', 'list_files'], // Employee MD uses "Glob"
      description: 'Find files matching glob pattern',
      category: 'search',
      execute: async (params: { pattern: string; path?: string }) => {
        return { files: [], pattern: params.pattern };
      },
      validate: (params) => {
        if (!params.pattern) {
          return { valid: false, errors: ['Pattern is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.01,
      requiredPermissions: ['file:read'],
      supportedAgents: ['claude-code', 'cursor-agent', 'replit-agent', 'mcp-tool'],
    });

    // System Tools
    this.registerTool({
      id: 'bash-executor',
      name: 'Bash Executor',
      aliases: ['Bash', 'command-executor', 'code_runner'], // Employee MD uses "Bash"
      description: 'Execute bash commands',
      category: 'system',
      execute: async (params: { command: string }) => {
        // Integration with system execution
        return { output: '', exitCode: 0 };
      },
      validate: (params) => {
        if (!params.command) {
          return { valid: false, errors: ['Command is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.01,
      requiredPermissions: ['system:execute'],
      supportedAgents: ['bash-executor', 'replit-agent', 'claude-code'],
    });

    // Web Search Tools
    this.registerTool({
      id: 'web-search',
      name: 'Web Search',
      aliases: ['WebSearch', 'web_search'],
      description: 'Search the web for information',
      category: 'search',
      execute: async (params: { query: string }) => {
        // Integration with search API
        return { results: [], query: params.query };
      },
      validate: (params) => {
        if (!params.query) {
          return { valid: false, errors: ['Query is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.05,
      requiredPermissions: ['web:search'],
      supportedAgents: ['gemini-cli', 'web-search', 'claude-code'],
      rateLimit: { maxRequests: 100, windowMs: 60000 },
    });

    this.registerTool({
      id: 'web-fetch',
      name: 'Web Fetch',
      aliases: ['WebFetch'],
      description: 'Fetch content from a URL',
      category: 'search',
      execute: async (params: { url: string }) => {
        // Integration with fetch API
        return { content: '', url: params.url };
      },
      validate: (params) => {
        if (!params.url) {
          return { valid: false, errors: ['URL is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.03,
      requiredPermissions: ['web:fetch'],
      supportedAgents: [
        'gemini-cli',
        'web-search',
        'claude-code',
        'puppeteer-agent',
      ],
    });

    // Code Tools
    this.registerTool({
      id: 'code-analyzer',
      name: 'Code Analyzer',
      aliases: [],
      description: 'Analyze code for issues and improvements',
      category: 'code',
      execute: async (params: { code: string; language: string }) => {
        // Integration with code analysis
        return { issues: [], suggestions: [] };
      },
      validate: (params) => {
        if (!params.code) {
          return { valid: false, errors: ['Code is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.1,
      requiredPermissions: ['code:analyze'],
      supportedAgents: ['claude-code', 'cursor-agent'],
    });

    this.registerTool({
      id: 'code-generator',
      name: 'Code Generator',
      aliases: [],
      description: 'Generate code based on specifications',
      category: 'code',
      execute: async (params: { prompt: string; language: string }) => {
        // Integration with code generation
        return { code: '', language: params.language };
      },
      validate: (params) => {
        if (!params.prompt) {
          return { valid: false, errors: ['Prompt is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.15,
      requiredPermissions: ['code:generate'],
      supportedAgents: ['claude-code', 'cursor-agent', 'replit-agent'],
    });

    // Testing Tools
    this.registerTool({
      id: 'test-runner',
      name: 'Test Runner',
      aliases: [],
      description: 'Run tests and report results',
      category: 'code',
      execute: async (params: { testPath: string }) => {
        // Integration with test runner
        return { passed: 0, failed: 0, results: [] };
      },
      validate: (params) => {
        if (!params.testPath) {
          return { valid: false, errors: ['Test path is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.05,
      requiredPermissions: ['code:test'],
      supportedAgents: ['claude-code', 'replit-agent'],
    });

    this.registerTool({
      id: 'test-generator',
      name: 'Test Generator',
      aliases: [],
      description: 'Generate test cases for code',
      category: 'code',
      execute: async (params: { code: string; testType: string }) => {
        // Integration with test generation
        return { tests: '' };
      },
      validate: (params) => {
        if (!params.code) {
          return { valid: false, errors: ['Code is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.1,
      requiredPermissions: ['code:test'],
      supportedAgents: ['claude-code'],
    });

    // Automation Tools
    this.registerTool({
      id: 'puppeteer',
      name: 'Puppeteer',
      aliases: [],
      description: 'Browser automation and web scraping',
      category: 'automation',
      execute: async (params: { action: string; url?: string }) => {
        // Integration with Puppeteer
        return { success: true, data: {} };
      },
      validate: (params) => {
        if (!params.action) {
          return { valid: false, errors: ['Action is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.2,
      requiredPermissions: ['automation:browser'],
      supportedAgents: ['puppeteer-agent'],
    });

    // Data Tools
    this.registerTool({
      id: 'data-processor',
      name: 'Data Processor',
      aliases: [],
      description: 'Process and transform data',
      category: 'data',
      execute: async (params: { data: unknown; operation: string }) => {
        // Integration with data processing
        return { processedData: {} };
      },
      validate: (params) => {
        if (!params.data || !params.operation) {
          return { valid: false, errors: ['Data and operation are required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.05,
      requiredPermissions: ['data:process'],
      supportedAgents: ['claude-code', 'gemini-cli'],
    });

    this.registerTool({
      id: 'data-analyzer',
      name: 'Data Analyzer',
      aliases: ['analyzer'],
      description: 'Analyze data and generate insights',
      category: 'data',
      execute: async (params: { data: unknown }) => {
        // Integration with data analysis
        return { insights: [], statistics: {} };
      },
      validate: (params) => {
        if (!params.data) {
          return { valid: false, errors: ['Data is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.08,
      requiredPermissions: ['data:analyze'],
      supportedAgents: ['gemini-cli', 'claude-code'],
    });

    // AI Tools
    this.registerTool({
      id: 'content-generator',
      name: 'Content Generator',
      aliases: [],
      description: 'Generate various types of content',
      category: 'ai',
      execute: async (params: { prompt: string; type: string }) => {
        // Integration with content generation
        return { content: '' };
      },
      validate: (params) => {
        if (!params.prompt) {
          return { valid: false, errors: ['Prompt is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.1,
      requiredPermissions: ['ai:generate'],
      supportedAgents: ['gemini-cli', 'claude-code'],
    });

    this.registerTool({
      id: 'document-generator',
      name: 'Document Generator',
      aliases: [],
      description: 'Generate documentation',
      category: 'ai',
      execute: async (params: { code: string; format: string }) => {
        // Integration with documentation generation
        return { documentation: '' };
      },
      validate: (params) => {
        if (!params.code) {
          return { valid: false, errors: ['Code is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.1,
      requiredPermissions: ['ai:generate'],
      supportedAgents: ['claude-code'],
    });

    // Image Generator
    this.registerTool({
      id: 'image-generator',
      name: 'Image Generator',
      aliases: ['image_gen'],
      description: 'Generate images from text descriptions',
      category: 'ai',
      execute: async (params: { prompt: string; size?: string }) => {
        return { imageUrl: '', prompt: params.prompt };
      },
      validate: (params) => {
        if (!params.prompt) {
          return { valid: false, errors: ['Prompt is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.2,
      requiredPermissions: ['media:image'],
      supportedAgents: ['claude-code', 'gemini-cli'],
    });
  }

  /**
   * Check if rate limit is exceeded
   *
   * Updated: Jan 30 2026 - Per-user rate limiting and return retry time
   */
  private checkRateLimit(
    toolId: string,
    userId?: string
  ): { allowed: boolean; retryAfter?: number } {
    // Use user-specific key if userId provided
    const key = userId ? `${toolId}:${userId}` : toolId;
    let tracker = this.rateLimitTracking.get(key);

    // Fall back to tool-level tracker if no user-specific one
    if (!tracker) {
      tracker = this.rateLimitTracking.get(toolId);
    }

    if (!tracker) {
      return { allowed: true };
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

    return { allowed: true };
  }

  /**
   * Track rate limit request
   *
   * Updated: Jan 30 2026 - Per-user rate limiting
   */
  private trackRateLimit(toolId: string, userId?: string): void {
    const key = userId ? `${toolId}:${userId}` : toolId;
    let tracker = this.rateLimitTracking.get(key);

    // Create user-specific tracker if needed
    if (!tracker) {
      const toolTracker = this.rateLimitTracking.get(toolId);
      if (toolTracker) {
        tracker = { requests: [], limit: toolTracker.limit };
        this.rateLimitTracking.set(key, tracker);
      }
    }

    if (!tracker) return;

    tracker.requests.push(Date.now());
  }

  /**
   * Update usage statistics
   */
  private updateStats(
    toolId: string,
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

    // Update moving average for execution time
    stats.averageExecutionTime =
      (stats.averageExecutionTime * (stats.totalExecutions - 1) +
        executionTime) /
      stats.totalExecutions;

    this.usageStats.set(toolId, stats);
  }

  /**
   * Clear old execution history
   */
  clearOldHistory(olderThan: Date): void {
    this.executionHistory = this.executionHistory.filter(
      (h) => h.timestamp >= olderThan
    );
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

interface RateLimitTracker {
  requests: number[];
  limit: RateLimit;
}

// Export singleton instance
export const toolManager = new ToolManager();

// Export utility functions
export function executeTool(
  toolId: string,
  params: Record<string, unknown>,
  agent: AgentType,
  userId: string
): Promise<ToolExecutionResult> {
  return toolManager.executeTool(toolId, params, agent, userId);
}

export function getAvailableTools(agent: AgentType): Tool[] {
  return toolManager.getAvailableTools(agent);
}

export function registerCustomTool(tool: Tool): void {
  toolManager.registerTool(tool);
}

export function getToolStats(
  toolId?: string
): ToolUsageStats | Map<string, ToolUsageStats> {
  return toolManager.getUsageStats(toolId);
}
