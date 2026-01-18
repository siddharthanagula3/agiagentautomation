/**
 * VibeAgentTools - Tool-based agent system inspired by Cloudflare VibeSDK
 *
 * Key patterns from VibeSDK:
 * - Tool definitions with JSON Schema parameters
 * - Tool execution with result handling
 * - Agent behavior orchestration (phasic vs agentic)
 * - Built-in tools: read_files, write_files, execute_commands, web_search, etc.
 */

import { useSandboxManager } from './vibe-sandbox-manager';
import { useVibeOrchestrator } from './vibe-phase-orchestrator';

// ============================================================================
// TYPE DEFINITIONS (VibeSDK Patterns)
// ============================================================================

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (
    args: Record<string, unknown>,
    context: ToolContext
  ) => Promise<ToolResult>;
}

export interface ToolContext {
  sessionId: string;
  userId: string;
  sandboxId?: string;
  workingDirectory: string;
  abortSignal?: AbortSignal;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  data?: unknown;
  artifacts?: ToolArtifact[];
}

export interface ToolArtifact {
  type: 'file' | 'preview' | 'deployment' | 'screenshot';
  path?: string;
  url?: string;
  content?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: ToolResult;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================================================
// BUILT-IN TOOLS (VibeSDK Pattern)
// ============================================================================

/**
 * Read files from sandbox
 */
export const readFilesTool: ToolDefinition = {
  name: 'read_files',
  description: 'Read the contents of one or more files from the project',
  parameters: {
    paths: {
      type: 'array',
      description: 'Array of file paths to read',
      required: true,
      items: { type: 'string', description: 'File path' },
    },
  },
  execute: async (args, context) => {
    const paths = args.paths as string[];
    const sandboxManager = useSandboxManager.getState();

    if (!context.sandboxId) {
      return { success: false, error: 'No sandbox session active' };
    }

    const results: Record<string, string | null> = {};

    for (const path of paths) {
      const content = sandboxManager.readFile(context.sandboxId, path);
      results[path] = content ?? null;
    }

    const foundFiles = Object.entries(results)
      .filter(([, content]) => content !== null)
      .map(([path, content]) => `--- ${path} ---\n${content}`)
      .join('\n\n');

    const notFound = Object.entries(results)
      .filter(([, content]) => content === null)
      .map(([path]) => path);

    let output = foundFiles;
    if (notFound.length > 0) {
      output += `\n\nFiles not found: ${notFound.join(', ')}`;
    }

    return {
      success: true,
      output,
      data: results,
    };
  },
};

/**
 * Write files to sandbox
 */
export const writeFilesTool: ToolDefinition = {
  name: 'write_files',
  description: 'Write or update files in the project',
  parameters: {
    files: {
      type: 'array',
      description: 'Array of files to write',
      required: true,
      items: {
        type: 'object',
        description: 'File to write',
        properties: {
          path: { type: 'string', description: 'File path', required: true },
          content: {
            type: 'string',
            description: 'File content',
            required: true,
          },
        },
      },
    },
  },
  execute: async (args, context) => {
    const files = args.files as Array<{ path: string; content: string }>;
    const sandboxManager = useSandboxManager.getState();
    const orchestrator = useVibeOrchestrator.getState();

    if (!context.sandboxId) {
      return { success: false, error: 'No sandbox session active' };
    }

    const artifacts: ToolArtifact[] = [];
    const written: string[] = [];

    for (const file of files) {
      sandboxManager.writeFile(context.sandboxId, file.path, file.content);
      written.push(file.path);
      artifacts.push({
        type: 'file',
        path: file.path,
        content: file.content,
      });

      // Emit file generated event
      orchestrator.processEvent({
        type: 'file_generated',
        filePath: file.path,
        content: file.content,
      });
    }

    return {
      success: true,
      output: `Successfully wrote ${written.length} file(s):\n${written.join('\n')}`,
      artifacts,
    };
  },
};

/**
 * Delete files from sandbox
 */
export const deleteFilesTool: ToolDefinition = {
  name: 'delete_files',
  description: 'Delete files from the project',
  parameters: {
    paths: {
      type: 'array',
      description: 'Array of file paths to delete',
      required: true,
      items: { type: 'string', description: 'File path' },
    },
  },
  execute: async (args, context) => {
    const paths = args.paths as string[];
    const sandboxManager = useSandboxManager.getState();

    if (!context.sandboxId) {
      return { success: false, error: 'No sandbox session active' };
    }

    const deleted: string[] = [];

    for (const path of paths) {
      sandboxManager.deleteFile(context.sandboxId, path);
      deleted.push(path);
    }

    return {
      success: true,
      output: `Deleted ${deleted.length} file(s):\n${deleted.join('\n')}`,
    };
  },
};

/**
 * List files in sandbox
 */
export const listFilesTool: ToolDefinition = {
  name: 'list_files',
  description: 'List all files in the project or a specific directory',
  parameters: {
    directory: {
      type: 'string',
      description: 'Directory to list (optional, defaults to root)',
      required: false,
    },
  },
  execute: async (args, context) => {
    const directory = args.directory as string | undefined;
    const sandboxManager = useSandboxManager.getState();

    if (!context.sandboxId) {
      return { success: false, error: 'No sandbox session active' };
    }

    const files = sandboxManager.listFiles(context.sandboxId, directory);
    const fileList = files.map((f) => `${f.path} (${f.size} bytes)`).join('\n');

    return {
      success: true,
      output: `Found ${files.length} file(s):\n${fileList}`,
      data: files,
    };
  },
};

/**
 * Search files in sandbox
 */
export const searchFilesTool: ToolDefinition = {
  name: 'search_files',
  description: 'Search for text or patterns in project files',
  parameters: {
    query: {
      type: 'string',
      description: 'Search query (text or regex pattern)',
      required: true,
    },
    filePattern: {
      type: 'string',
      description: 'File pattern to search in (e.g., "*.tsx")',
      required: false,
    },
    caseSensitive: {
      type: 'boolean',
      description: 'Case-sensitive search',
      required: false,
    },
  },
  execute: async (args, context) => {
    const query = args.query as string;
    const filePattern = args.filePattern as string | undefined;
    const caseSensitive = args.caseSensitive as boolean | undefined;
    const sandboxManager = useSandboxManager.getState();

    if (!context.sandboxId) {
      return { success: false, error: 'No sandbox session active' };
    }

    const files = sandboxManager.listFiles(context.sandboxId);
    const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
    const results: Array<{ path: string; matches: string[] }> = [];

    for (const file of files) {
      // Filter by pattern if specified
      if (filePattern) {
        const pattern = filePattern.replace(/\*/g, '.*');
        if (!new RegExp(pattern).test(file.path)) {
          continue;
        }
      }

      const content = sandboxManager.readFile(context.sandboxId, file.path);
      if (!content) continue;

      const matches: string[] = [];
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (regex.test(line)) {
          matches.push(`Line ${index + 1}: ${line.trim()}`);
        }
        regex.lastIndex = 0; // Reset regex
      });

      if (matches.length > 0) {
        results.push({ path: file.path, matches });
      }
    }

    const output = results
      .map((r) => `${r.path}:\n${r.matches.map((m) => `  ${m}`).join('\n')}`)
      .join('\n\n');

    return {
      success: true,
      output: results.length > 0 ? output : 'No matches found',
      data: results,
    };
  },
};

/**
 * Deploy preview
 */
export const deployPreviewTool: ToolDefinition = {
  name: 'deploy_preview',
  description: 'Deploy the current project to a preview environment',
  parameters: {},
  execute: async (_args, context) => {
    const orchestrator = useVibeOrchestrator.getState();

    orchestrator.processEvent({ type: 'preview_ready', url: '/preview' });

    return {
      success: true,
      output: 'Preview deployed successfully',
      artifacts: [
        {
          type: 'preview',
          url: '/preview',
        },
      ],
    };
  },
};

/**
 * Git operations
 */
export const gitTool: ToolDefinition = {
  name: 'git',
  description: 'Execute git operations (commit, log, show, reset)',
  parameters: {
    operation: {
      type: 'string',
      description: 'Git operation to perform',
      required: true,
      enum: ['commit', 'log', 'show', 'reset', 'status'],
    },
    message: {
      type: 'string',
      description: 'Commit message (for commit operation)',
      required: false,
    },
    ref: {
      type: 'string',
      description: 'Git reference (commit hash, branch, etc.)',
      required: false,
    },
  },
  execute: async (args, _context) => {
    const operation = args.operation as string;
    const message = args.message as string | undefined;

    // Simulated git operations (in browser, we track changes in memory)
    switch (operation) {
      case 'status':
        return {
          success: true,
          output: 'On branch main\nChanges tracked in memory',
        };

      case 'commit':
        if (!message) {
          return { success: false, error: 'Commit message required' };
        }
        return {
          success: true,
          output: `Created commit: ${message}\nCommit hash: ${Date.now().toString(36)}`,
        };

      case 'log':
        return {
          success: true,
          output: 'Git history tracked in session state',
        };

      default:
        return {
          success: false,
          error: `Unknown git operation: ${operation}`,
        };
    }
  },
};

/**
 * Web search (for documentation lookup)
 */
export const webSearchTool: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web for documentation, examples, or solutions',
  parameters: {
    query: {
      type: 'string',
      description: 'Search query',
      required: true,
    },
  },
  execute: async (args, _context) => {
    const query = args.query as string;

    // This would integrate with a search API
    return {
      success: true,
      output: `Web search for: "${query}"\n\nNote: Web search integration pending. Use external documentation.`,
    };
  },
};

// ============================================================================
// TOOL REGISTRY
// ============================================================================

export const builtInTools: ToolDefinition[] = [
  readFilesTool,
  writeFilesTool,
  deleteFilesTool,
  listFilesTool,
  searchFilesTool,
  deployPreviewTool,
  gitTool,
  webSearchTool,
];

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  constructor(tools?: ToolDefinition[]) {
    // Register built-in tools
    for (const tool of builtInTools) {
      this.register(tool);
    }

    // Register additional tools
    if (tools) {
      for (const tool of tools) {
        this.register(tool);
      }
    }
  }

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool definitions for LLM prompt
   */
  getToolDefinitions(): Array<{
    name: string;
    description: string;
    parameters: Record<string, ToolParameter>;
  }> {
    return this.list().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /**
   * Execute a tool by name
   */
  async execute(
    name: string,
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.get(name);

    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${name}`,
      };
    }

    try {
      return await tool.execute(args, context);
    } catch (error) {
      return {
        success: false,
        error: `Tool execution failed: ${(error as Error).message}`,
      };
    }
  }
}

// ============================================================================
// AGENT EXECUTOR (VibeSDK Pattern)
// ============================================================================

export interface AgentExecutorOptions {
  sessionId: string;
  userId: string;
  sandboxId?: string;
  maxToolCalls?: number;
  onToolCall?: (call: ToolCall) => void;
  onToolResult?: (call: ToolCall, result: ToolResult) => void;
}

export class AgentExecutor {
  private registry: ToolRegistry;
  private options: Required<AgentExecutorOptions>;
  private toolCalls: ToolCall[] = [];
  private abortController: AbortController | null = null;

  constructor(options: AgentExecutorOptions, registry?: ToolRegistry) {
    this.registry = registry || new ToolRegistry();
    this.options = {
      sessionId: options.sessionId,
      userId: options.userId,
      sandboxId: options.sandboxId || '',
      maxToolCalls: options.maxToolCalls ?? 10,
      onToolCall: options.onToolCall ?? (() => {}),
      onToolResult: options.onToolResult ?? (() => {}),
    };
  }

  /**
   * Execute a single tool call
   */
  async executeToolCall(
    name: string,
    args: Record<string, unknown>
  ): Promise<ToolResult> {
    if (this.toolCalls.length >= this.options.maxToolCalls) {
      return {
        success: false,
        error: `Maximum tool calls (${this.options.maxToolCalls}) exceeded`,
      };
    }

    const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const call: ToolCall = {
      id: callId,
      name,
      arguments: args,
      status: 'running',
      startedAt: new Date(),
    };

    this.toolCalls.push(call);
    this.options.onToolCall(call);

    const context: ToolContext = {
      sessionId: this.options.sessionId,
      userId: this.options.userId,
      sandboxId: this.options.sandboxId,
      workingDirectory: '/',
      abortSignal: this.abortController?.signal,
    };

    const result = await this.registry.execute(name, args, context);

    call.status = result.success ? 'completed' : 'failed';
    call.result = result;
    call.completedAt = new Date();

    this.options.onToolResult(call, result);

    return result;
  }

  /**
   * Execute multiple tool calls in sequence
   */
  async executeToolCalls(
    calls: Array<{ name: string; arguments: Record<string, unknown> }>
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const call of calls) {
      const result = await this.executeToolCall(call.name, call.arguments);
      results.push(result);

      // Stop on failure
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Abort current execution
   */
  abort(): void {
    this.abortController?.abort();
  }

  /**
   * Get tool call history
   */
  getToolCalls(): ToolCall[] {
    return [...this.toolCalls];
  }

  /**
   * Get available tools
   */
  getAvailableTools(): ToolDefinition[] {
    return this.registry.list();
  }

  /**
   * Reset executor state
   */
  reset(): void {
    this.toolCalls = [];
    this.abortController = new AbortController();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const defaultToolRegistry = new ToolRegistry();

export function createAgentExecutor(
  options: AgentExecutorOptions
): AgentExecutor {
  return new AgentExecutor(options);
}

export default {
  ToolRegistry,
  AgentExecutor,
  builtInTools,
  createAgentExecutor,
};
