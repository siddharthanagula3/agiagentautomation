/**
 * Vibe Tool Orchestrator
 * Manages tool execution for AI employees with validation and security
 */

/**
 * Tool request from an AI agent
 */
export interface ToolRequest {
  id: string;
  agent_name: string;
  tool_name: string;
  parameters: Record<string, any>;
  timestamp: Date;
  session_id: string;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  request_id: string;
  success: boolean;
  output?: any;
  error?: string;
  execution_time: number;
  metadata?: Record<string, any>;
}

/**
 * Tool definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requiredPermissions?: string[];
}

/**
 * VibeToolOrchestrator
 * Coordinates tool execution for AI employees
 *
 * Features:
 * - Tool validation and security checks
 * - Permission-based access control
 * - Execution tracking and monitoring
 * - Error handling and logging
 */
export class VibeToolOrchestrator {
  private tools: Map<string, ToolDefinition> = new Map();
  private executionHistory: Map<string, ToolResult> = new Map();

  constructor() {
    this.initializeTools();
  }

  /**
   * Initialize available tools
   *
   * @private
   */
  private initializeTools(): void {
    // File system tools
    this.registerTool({
      name: 'Read',
      description: 'Read file contents',
      parameters: [
        {
          name: 'file_path',
          type: 'string',
          required: true,
          description: 'Path to file to read',
        },
        {
          name: 'offset',
          type: 'number',
          required: false,
          description: 'Line offset to start reading',
        },
        {
          name: 'limit',
          type: 'number',
          required: false,
          description: 'Number of lines to read',
        },
      ],
    });

    this.registerTool({
      name: 'Write',
      description: 'Write content to file',
      parameters: [
        {
          name: 'file_path',
          type: 'string',
          required: true,
          description: 'Path to file to write',
        },
        {
          name: 'content',
          type: 'string',
          required: true,
          description: 'Content to write',
        },
      ],
      requiredPermissions: ['write'],
    });

    this.registerTool({
      name: 'Edit',
      description: 'Edit file with find/replace',
      parameters: [
        {
          name: 'file_path',
          type: 'string',
          required: true,
          description: 'Path to file to edit',
        },
        {
          name: 'old_string',
          type: 'string',
          required: true,
          description: 'String to find',
        },
        {
          name: 'new_string',
          type: 'string',
          required: true,
          description: 'String to replace with',
        },
        {
          name: 'replace_all',
          type: 'boolean',
          required: false,
          description: 'Replace all occurrences',
        },
      ],
      requiredPermissions: ['write'],
    });

    this.registerTool({
      name: 'Bash',
      description: 'Execute bash command',
      parameters: [
        {
          name: 'command',
          type: 'string',
          required: true,
          description: 'Command to execute',
        },
        {
          name: 'timeout',
          type: 'number',
          required: false,
          description: 'Timeout in milliseconds',
        },
      ],
      requiredPermissions: ['execute'],
    });

    this.registerTool({
      name: 'Grep',
      description: 'Search for patterns in files',
      parameters: [
        {
          name: 'pattern',
          type: 'string',
          required: true,
          description: 'Search pattern (regex)',
        },
        {
          name: 'path',
          type: 'string',
          required: false,
          description: 'Path to search in',
        },
        {
          name: 'output_mode',
          type: 'string',
          required: false,
          description: 'Output mode (content, files_with_matches, count)',
        },
      ],
    });

    this.registerTool({
      name: 'Glob',
      description: 'Find files matching pattern',
      parameters: [
        {
          name: 'pattern',
          type: 'string',
          required: true,
          description: 'Glob pattern (e.g., **/*.ts)',
        },
        {
          name: 'path',
          type: 'string',
          required: false,
          description: 'Base path to search from',
        },
      ],
    });

    // Web tools
    this.registerTool({
      name: 'WebSearch',
      description: 'Search the web',
      parameters: [
        {
          name: 'query',
          type: 'string',
          required: true,
          description: 'Search query',
        },
        {
          name: 'allowed_domains',
          type: 'array',
          required: false,
          description: 'Allowed domains to search',
        },
      ],
      requiredPermissions: ['web_search'],
    });

    this.registerTool({
      name: 'WebFetch',
      description: 'Fetch URL content',
      parameters: [
        {
          name: 'url',
          type: 'string',
          required: true,
          description: 'URL to fetch',
        },
        {
          name: 'prompt',
          type: 'string',
          required: true,
          description: 'What to extract from the page',
        },
      ],
      requiredPermissions: ['web_fetch'],
    });
  }

  /**
   * Register a tool
   *
   * @param tool - Tool definition to register
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Execute a tool on behalf of an agent
   *
   * @param request - Tool execution request
   * @returns Tool execution result
   */
  async executeTool(request: ToolRequest): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Validate tool exists
      if (!this.isValidTool(request.tool_name)) {
        throw new Error(`Unknown tool: ${request.tool_name}`);
      }

      // Validate parameters
      this.validateParameters(request.tool_name, request.parameters);

      // Check permissions
      if (!this.hasPermission(request.agent_name, request.tool_name)) {
        throw new Error(
          `Agent ${request.agent_name} not authorized for tool ${request.tool_name}`
        );
      }

      // Execute tool (mock implementation - would integrate with actual tool execution)
      const output = await this.executeToolImpl(request.tool_name, request.parameters);

      const result: ToolResult = {
        request_id: request.id,
        success: true,
        output,
        execution_time: Date.now() - startTime,
      };

      // Store in history
      this.executionHistory.set(request.id, result);

      return result;
    } catch (error) {
      const result: ToolResult = {
        request_id: request.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time: Date.now() - startTime,
      };

      // Store in history
      this.executionHistory.set(request.id, result);

      return result;
    }
  }

  /**
   * Execute tool implementation (mock)
   *
   * @private
   */
  private async executeToolImpl(
    toolName: string,
    parameters: Record<string, any>
  ): Promise<any> {
    // Mock implementation - would integrate with actual tool execution engine
    // Simulate async execution
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      tool: toolName,
      result: 'Tool execution successful',
      parameters,
    };
  }

  /**
   * Check if tool is valid
   *
   * @private
   */
  private isValidTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Validate tool parameters
   *
   * @private
   */
  private validateParameters(
    toolName: string,
    parameters: Record<string, any>
  ): void {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Check required parameters
    for (const param of tool.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }

      // Type validation (basic)
      if (param.name in parameters) {
        const value = parameters[param.name];
        const actualType = Array.isArray(value) ? 'array' : typeof value;

        if (actualType !== param.type && param.type !== 'any') {
          throw new Error(
            `Invalid type for parameter ${param.name}: expected ${param.type}, got ${actualType}`
          );
        }
      }
    }
  }

  /**
   * Check if agent has permission to use tool
   *
   * @private
   */
  private hasPermission(agentName: string, toolName: string): boolean {
    const tool = this.tools.get(toolName);
    if (!tool) return false;

    // For now, all hired employees have access to all tools
    // In future, could implement role-based permissions
    return true;
  }

  /**
   * Get available tools for an agent
   *
   * @param agentName - Name of the agent
   * @returns Array of available tool definitions
   */
  getAvailableTools(agentName: string): ToolDefinition[] {
    const availableTools: ToolDefinition[] = [];

    for (const tool of this.tools.values()) {
      if (this.hasPermission(agentName, tool.name)) {
        availableTools.push(tool);
      }
    }

    return availableTools;
  }

  /**
   * Get tool definition
   *
   * @param toolName - Name of the tool
   * @returns Tool definition or undefined
   */
  getToolDefinition(toolName: string): ToolDefinition | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Get execution history
   *
   * @param sessionId - Optional session ID to filter by
   * @returns Array of tool results
   */
  getExecutionHistory(sessionId?: string): ToolResult[] {
    return Array.from(this.executionHistory.values());
  }

  /**
   * Get tool usage statistics
   *
   * @returns Statistics about tool usage
   */
  getStatistics(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    toolUsage: Record<string, number>;
  } {
    const results = Array.from(this.executionHistory.values());
    const toolUsage: Record<string, number> = {};

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      totalExecutions: results.length,
      successfulExecutions: successful,
      failedExecutions: failed,
      toolUsage,
    };
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory.clear();
  }
}

// Export singleton instance
export const vibeToolOrchestrator = new VibeToolOrchestrator();
