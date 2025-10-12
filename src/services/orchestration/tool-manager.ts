/**
 * Tool Integration Manager - Manages all tool integrations and executions
 * Provides a unified interface for agents to use various tools
 */

import { AgentType } from '../reasoning/task-decomposer';

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
  description: string;
  category: ToolCategory;
  execute: (params: any) => Promise<any>;
  validate: (params: any) => ValidationResult;
  estimateCost: (params: any) => number;
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
  result?: any;
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
 * ToolManager - Main class for managing tools
 */
export class ToolManager {
  private tools: Map<string, Tool> = new Map();
  private usageStats: Map<string, ToolUsageStats> = new Map();
  private rateLimitTracking: Map<string, RateLimitTracker> = new Map();
  private executionHistory: ToolExecutionResult[] = [];

  constructor() {
    this.registerBuiltInTools();
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool ${tool.id} is already registered`);
    }

    this.tools.set(tool.id, tool);
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

    console.log(`✅ Tool registered: ${tool.name}`);
  }

  /**
   * Execute a tool
   */
  async executeTool(
    toolId: string,
    params: any,
    agent: AgentType,
    userId: string
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return {
        success: false,
        error: `Tool ${toolId} not found`,
        executionTime: 0,
        cost: 0,
        toolId,
        timestamp: new Date(),
      };
    }

    // Validate tool supports this agent
    if (!tool.supportedAgents.includes(agent)) {
      return {
        success: false,
        error: `Tool ${toolId} does not support agent ${agent}`,
        executionTime: 0,
        cost: 0,
        toolId,
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
        toolId,
        timestamp: new Date(),
      };
    }

    // Check rate limits
    if (tool.rateLimit) {
      const rateLimitOk = this.checkRateLimit(toolId);
      if (!rateLimitOk) {
        return {
          success: false,
          error: `Rate limit exceeded for tool ${toolId}`,
          executionTime: 0,
          cost: 0,
          toolId,
          timestamp: new Date(),
        };
      }
    }

    // Execute the tool
    const startTime = Date.now();
    let result: ToolExecutionResult;

    try {
      console.log(`🔧 Executing tool: ${tool.name}...`);

      const toolResult = await tool.execute(params);
      const executionTime = Date.now() - startTime;
      const cost = tool.estimateCost(params);

      result = {
        success: true,
        result: toolResult,
        executionTime,
        cost,
        toolId,
        timestamp: new Date(),
      };

      // Update stats
      this.updateStats(toolId, true, executionTime, cost);
    } catch (error) {
      const executionTime = Date.now() - startTime;

      result = {
        success: false,
        error: (error as Error).message,
        executionTime,
        cost: 0,
        toolId,
        timestamp: new Date(),
      };

      // Update stats
      this.updateStats(toolId, false, executionTime, 0);
    }

    // Add to history
    this.executionHistory.push(result);

    // Track rate limit
    if (tool.rateLimit) {
      this.trackRateLimit(toolId);
    }

    return result;
  }

  /**
   * Get available tools for an agent
   */
  getAvailableTools(agent: AgentType): Tool[] {
    return Array.from(this.tools.values()).filter(tool =>
      tool.supportedAgents.includes(agent)
    );
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ToolCategory): Tool[] {
    return Array.from(this.tools.values()).filter(
      tool => tool.category === category
    );
  }

  /**
   * Get tool by ID
   */
  getTool(toolId: string): Tool | undefined {
    return this.tools.get(toolId);
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
        history = history.filter(h => h.toolId === filter.toolId);
      }
      if (filter.success !== undefined) {
        history = history.filter(h => h.success === filter.success);
      }
      if (filter.since) {
        history = history.filter(h => h.timestamp >= filter.since!);
      }
    }

    return history;
  }

  /**
   * Register all built-in tools
   */
  private registerBuiltInTools(): void {
    // File System Tools
    this.registerTool({
      id: 'file-reader',
      name: 'File Reader',
      description: 'Read file contents',
      category: 'file',
      execute: async (params: { path: string }) => {
        // Integration with filesystem API
        return { content: 'file content', path: params.path };
      },
      validate: params => {
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
      id: 'file-editor',
      name: 'File Editor',
      description: 'Edit file contents',
      category: 'file',
      execute: async (params: { path: string; content: string }) => {
        // Integration with filesystem API
        return { success: true, path: params.path };
      },
      validate: params => {
        if (!params.path || !params.content) {
          return { valid: false, errors: ['Path and content are required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.02,
      requiredPermissions: ['file:write'],
      supportedAgents: ['cursor-agent', 'replit-agent', 'mcp-tool'],
    });

    // Web Search Tools
    this.registerTool({
      id: 'web-search',
      name: 'Web Search',
      description: 'Search the web for information',
      category: 'search',
      execute: async (params: { query: string }) => {
        // Integration with search API
        return { results: [], query: params.query };
      },
      validate: params => {
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
      description: 'Fetch content from a URL',
      category: 'search',
      execute: async (params: { url: string }) => {
        // Integration with fetch API
        return { content: '', url: params.url };
      },
      validate: params => {
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
      description: 'Analyze code for issues and improvements',
      category: 'code',
      execute: async (params: { code: string; language: string }) => {
        // Integration with code analysis
        return { issues: [], suggestions: [] };
      },
      validate: params => {
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
      description: 'Generate code based on specifications',
      category: 'code',
      execute: async (params: { prompt: string; language: string }) => {
        // Integration with code generation
        return { code: '', language: params.language };
      },
      validate: params => {
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
      description: 'Run tests and report results',
      category: 'code',
      execute: async (params: { testPath: string }) => {
        // Integration with test runner
        return { passed: 0, failed: 0, results: [] };
      },
      validate: params => {
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
      description: 'Generate test cases for code',
      category: 'code',
      execute: async (params: { code: string; testType: string }) => {
        // Integration with test generation
        return { tests: '' };
      },
      validate: params => {
        if (!params.code) {
          return { valid: false, errors: ['Code is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.1,
      requiredPermissions: ['code:test'],
      supportedAgents: ['claude-code'],
    });

    // System Tools
    this.registerTool({
      id: 'bash-executor',
      name: 'Bash Executor',
      description: 'Execute bash commands',
      category: 'system',
      execute: async (params: { command: string }) => {
        // Integration with system execution
        return { output: '', exitCode: 0 };
      },
      validate: params => {
        if (!params.command) {
          return { valid: false, errors: ['Command is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.01,
      requiredPermissions: ['system:execute'],
      supportedAgents: ['bash-executor', 'replit-agent'],
    });

    // Automation Tools
    this.registerTool({
      id: 'puppeteer',
      name: 'Puppeteer',
      description: 'Browser automation and web scraping',
      category: 'automation',
      execute: async (params: { action: string; url?: string }) => {
        // Integration with Puppeteer
        return { success: true, data: {} };
      },
      validate: params => {
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
      description: 'Process and transform data',
      category: 'data',
      execute: async (params: { data: any; operation: string }) => {
        // Integration with data processing
        return { processedData: {} };
      },
      validate: params => {
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
      id: 'analyzer',
      name: 'Data Analyzer',
      description: 'Analyze data and generate insights',
      category: 'data',
      execute: async (params: { data: any }) => {
        // Integration with data analysis
        return { insights: [], statistics: {} };
      },
      validate: params => {
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
      description: 'Generate various types of content',
      category: 'ai',
      execute: async (params: { prompt: string; type: string }) => {
        // Integration with content generation
        return { content: '' };
      },
      validate: params => {
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
      description: 'Generate documentation',
      category: 'ai',
      execute: async (params: { code: string; format: string }) => {
        // Integration with documentation generation
        return { documentation: '' };
      },
      validate: params => {
        if (!params.code) {
          return { valid: false, errors: ['Code is required'] };
        }
        return { valid: true };
      },
      estimateCost: () => 0.1,
      requiredPermissions: ['ai:generate'],
      supportedAgents: ['claude-code'],
    });

    console.log(`✅ Registered ${this.tools.size} built-in tools`);
  }

  /**
   * Check if rate limit is exceeded
   */
  private checkRateLimit(toolId: string): boolean {
    const tracker = this.rateLimitTracking.get(toolId);
    if (!tracker) return true;

    const now = Date.now();
    const windowStart = now - tracker.limit.windowMs;

    // Remove old requests
    tracker.requests = tracker.requests.filter(time => time > windowStart);

    return tracker.requests.length < tracker.limit.maxRequests;
  }

  /**
   * Track rate limit request
   */
  private trackRateLimit(toolId: string): void {
    const tracker = this.rateLimitTracking.get(toolId);
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
      h => h.timestamp >= olderThan
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
  params: any,
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
