/**
 * Vibe Tool Orchestrator
 * Manages tool execution for AI employees with validation and security
 */

// Virtual file system for in-session files
export interface VirtualFile {
  path: string;
  content: string;
  type: string;
  lastModified: Date;
}

// Virtual file system storage
const virtualFileSystem: Map<string, VirtualFile> = new Map();

/**
 * Tool request from an AI agent
 */
// Updated: Jan 15th 2026 - Fixed any type
export interface ToolRequest {
  id: string;
  agent_name: string;
  tool_name: string;
  parameters: Record<string, unknown>;
  timestamp: Date;
  session_id: string;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  request_id: string;
  success: boolean;
  output?: unknown;
  error?: string;
  execution_time: number;
  metadata?: Record<string, unknown>;
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
      const output = await this.executeToolImpl(
        request.tool_name,
        request.parameters
      );

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
   * Execute tool implementation
   * Routes to specific tool handlers based on tool name
   *
   * @private
   */
  private async executeToolImpl(
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolName) {
      case 'Read':
        return this.executeRead(parameters);
      case 'Write':
        return this.executeWrite(parameters);
      case 'Edit':
        return this.executeEdit(parameters);
      case 'Bash':
        return this.executeBash(parameters);
      case 'Grep':
        return this.executeGrep(parameters);
      case 'Glob':
        return this.executeGlob(parameters);
      case 'WebSearch':
        return this.executeWebSearch(parameters);
      case 'WebFetch':
        return this.executeWebFetch(parameters);
      default:
        throw new Error(`Unsupported tool: ${toolName}`);
    }
  }

  /**
   * Execute Read tool - read file contents from virtual file system
   */
  private async executeRead(parameters: Record<string, unknown>): Promise<unknown> {
    const filePath = parameters.file_path as string;
    const offset = (parameters.offset as number) || 0;
    const limit = (parameters.limit as number) || -1;

    const file = virtualFileSystem.get(filePath);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }

    let content = file.content;

    // Apply offset and limit (line-based)
    if (offset > 0 || limit > 0) {
      const lines = content.split('\n');
      const startLine = offset;
      const endLine = limit > 0 ? startLine + limit : lines.length;
      content = lines.slice(startLine, endLine).join('\n');
    }

    return {
      file_path: filePath,
      content,
      type: file.type,
      lastModified: file.lastModified,
    };
  }

  /**
   * Execute Write tool - write content to virtual file system
   */
  private async executeWrite(parameters: Record<string, unknown>): Promise<unknown> {
    const filePath = parameters.file_path as string;
    const content = parameters.content as string;

    // Determine file type from extension
    const ext = filePath.split('.').pop()?.toLowerCase() || 'txt';
    const typeMap: Record<string, string> = {
      ts: 'text/typescript',
      tsx: 'text/typescript',
      js: 'text/javascript',
      jsx: 'text/javascript',
      json: 'application/json',
      html: 'text/html',
      css: 'text/css',
      md: 'text/markdown',
      txt: 'text/plain',
    };

    const file: VirtualFile = {
      path: filePath,
      content,
      type: typeMap[ext] || 'text/plain',
      lastModified: new Date(),
    };

    virtualFileSystem.set(filePath, file);

    return {
      success: true,
      file_path: filePath,
      bytes_written: content.length,
    };
  }

  /**
   * Execute Edit tool - find/replace in file
   */
  private async executeEdit(parameters: Record<string, unknown>): Promise<unknown> {
    const filePath = parameters.file_path as string;
    const oldString = parameters.old_string as string;
    const newString = parameters.new_string as string;
    const replaceAll = (parameters.replace_all as boolean) || false;

    const file = virtualFileSystem.get(filePath);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }

    let newContent: string;
    let replacements = 0;

    if (replaceAll) {
      const regex = new RegExp(this.escapeRegex(oldString), 'g');
      const matches = file.content.match(regex);
      replacements = matches?.length || 0;
      newContent = file.content.replace(regex, newString);
    } else {
      if (file.content.includes(oldString)) {
        newContent = file.content.replace(oldString, newString);
        replacements = 1;
      } else {
        throw new Error(`String not found in file: "${oldString.substring(0, 50)}..."`);
      }
    }

    // Update file
    virtualFileSystem.set(filePath, {
      ...file,
      content: newContent,
      lastModified: new Date(),
    });

    return {
      success: true,
      file_path: filePath,
      replacements,
    };
  }

  /**
   * Execute Bash tool - simulate command execution in browser
   * Note: Actual execution is sandboxed for security
   */
  private async executeBash(parameters: Record<string, unknown>): Promise<unknown> {
    const command = parameters.command as string;
    const timeout = (parameters.timeout as number) || 30000;

    // Parse common commands and simulate output
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];

    switch (cmd) {
      case 'ls':
        return this.simulateLs(parts.slice(1));
      case 'cat':
        return this.simulateCat(parts.slice(1));
      case 'pwd':
        return { output: '/vibe-workspace', exitCode: 0 };
      case 'echo':
        return { output: parts.slice(1).join(' '), exitCode: 0 };
      case 'mkdir':
        return { output: '', exitCode: 0, message: 'Directory created (simulated)' };
      case 'touch': {
        // Create empty file
        const touchPath = parts[1] || 'untitled';
        virtualFileSystem.set(touchPath, {
          path: touchPath,
          content: '',
          type: 'text/plain',
          lastModified: new Date(),
        });
        return { output: '', exitCode: 0 };
      }
      case 'rm': {
        const rmPath = parts[1];
        if (rmPath && virtualFileSystem.has(rmPath)) {
          virtualFileSystem.delete(rmPath);
          return { output: '', exitCode: 0 };
        }
        return { output: `rm: cannot remove '${rmPath}': No such file`, exitCode: 1 };
      }
      default:
        return {
          output: `Command '${cmd}' execution simulated in browser sandbox`,
          exitCode: 0,
          note: 'Full shell execution not available in browser environment',
        };
    }
  }

  /**
   * Simulate ls command
   */
  private simulateLs(args: string[]): { output: string; exitCode: number } {
    const path = args[0] || '.';
    const showAll = args.includes('-a') || args.includes('-la');
    const longFormat = args.includes('-l') || args.includes('-la');

    const files = Array.from(virtualFileSystem.values())
      .filter(f => {
        if (path === '.' || path === '/') return true;
        return f.path.startsWith(path);
      })
      .map(f => {
        const name = f.path.split('/').pop() || f.path;
        if (longFormat) {
          const size = f.content.length;
          const date = f.lastModified.toISOString().substring(0, 10);
          return `-rw-r--r-- 1 user user ${size.toString().padStart(8)} ${date} ${name}`;
        }
        return name;
      });

    return {
      output: files.length > 0 ? files.join('\n') : '',
      exitCode: 0,
    };
  }

  /**
   * Simulate cat command
   */
  private simulateCat(args: string[]): { output: string; exitCode: number } {
    const outputs: string[] = [];

    for (const path of args) {
      const file = virtualFileSystem.get(path);
      if (file) {
        outputs.push(file.content);
      } else {
        return { output: `cat: ${path}: No such file or directory`, exitCode: 1 };
      }
    }

    return { output: outputs.join('\n'), exitCode: 0 };
  }

  /**
   * Execute Grep tool - search for patterns in virtual files
   */
  private async executeGrep(parameters: Record<string, unknown>): Promise<unknown> {
    const pattern = parameters.pattern as string;
    const path = (parameters.path as string) || '.';
    const outputMode = (parameters.output_mode as string) || 'files_with_matches';

    const regex = new RegExp(pattern, 'gi');
    const matches: { file: string; line: number; content: string }[] = [];
    const filesWithMatches: string[] = [];

    for (const [filePath, file] of virtualFileSystem) {
      if (path !== '.' && !filePath.startsWith(path)) continue;

      const lines = file.content.split('\n');
      let fileHasMatch = false;

      lines.forEach((line, index) => {
        if (regex.test(line)) {
          fileHasMatch = true;
          matches.push({
            file: filePath,
            line: index + 1,
            content: line,
          });
        }
        regex.lastIndex = 0; // Reset regex state
      });

      if (fileHasMatch) {
        filesWithMatches.push(filePath);
      }
    }

    switch (outputMode) {
      case 'files_with_matches':
        return { files: filesWithMatches, count: filesWithMatches.length };
      case 'count':
        return { count: matches.length };
      case 'content':
      default:
        return { matches };
    }
  }

  /**
   * Execute Glob tool - find files matching pattern
   */
  private async executeGlob(parameters: Record<string, unknown>): Promise<unknown> {
    const pattern = parameters.pattern as string;
    const basePath = (parameters.path as string) || '.';

    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]')
      .replace(/{{GLOBSTAR}}/g, '.*');

    const regex = new RegExp(`^${regexPattern}$`);

    const matchingFiles = Array.from(virtualFileSystem.keys())
      .filter(filePath => {
        const relativePath = basePath === '.' ? filePath : filePath.replace(basePath + '/', '');
        return regex.test(relativePath) || regex.test(filePath);
      });

    return {
      files: matchingFiles,
      count: matchingFiles.length,
    };
  }

  /**
   * Execute WebSearch tool - search the web (requires backend)
   */
  private async executeWebSearch(parameters: Record<string, unknown>): Promise<unknown> {
    const query = parameters.query as string;

    // WebSearch requires server-side execution
    // Return a message indicating this limitation
    return {
      success: false,
      message: 'WebSearch requires server-side execution. Use the chat interface for web searches.',
      query,
    };
  }

  /**
   * Execute WebFetch tool - fetch URL content (requires backend)
   */
  private async executeWebFetch(parameters: Record<string, unknown>): Promise<unknown> {
    const url = parameters.url as string;

    // WebFetch requires server-side execution due to CORS
    return {
      success: false,
      message: 'WebFetch requires server-side execution due to CORS restrictions.',
      url,
    };
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    parameters: Record<string, unknown>
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

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

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

// Export virtual file system utilities for external integration
export const vibeVirtualFS = {
  /**
   * Get all files in the virtual file system
   */
  getFiles(): VirtualFile[] {
    return Array.from(virtualFileSystem.values());
  },

  /**
   * Get a specific file
   */
  getFile(path: string): VirtualFile | undefined {
    return virtualFileSystem.get(path);
  },

  /**
   * Check if a file exists
   */
  exists(path: string): boolean {
    return virtualFileSystem.has(path);
  },

  /**
   * Write a file to the virtual file system
   */
  writeFile(path: string, content: string, type?: string): void {
    virtualFileSystem.set(path, {
      path,
      content,
      type: type || 'text/plain',
      lastModified: new Date(),
    });
  },

  /**
   * Delete a file from the virtual file system
   */
  deleteFile(path: string): boolean {
    return virtualFileSystem.delete(path);
  },

  /**
   * Clear all files from the virtual file system
   */
  clear(): void {
    virtualFileSystem.clear();
  },

  /**
   * Get the size of the virtual file system
   */
  size(): number {
    return virtualFileSystem.size;
  },

  /**
   * Initialize the file system with starter files
   */
  initializeWorkspace(files: Array<{ path: string; content: string; type?: string }>): void {
    virtualFileSystem.clear();
    for (const file of files) {
      virtualFileSystem.set(file.path, {
        path: file.path,
        content: file.content,
        type: file.type || 'text/plain',
        lastModified: new Date(),
      });
    }
  },
};
