/**
 * MCP (Model Context Protocol) Service
 * Stub implementation for tool registration and execution
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

class MCPService {
  private tools: Map<string, MCPTool> = new Map();
  private executors: Map<string, (params: unknown) => Promise<unknown>> =
    new Map();

  /**
   * Register a tool with the MCP service
   */
  registerTool(tool: MCPTool, executor: (params: unknown) => Promise<unknown>) {
    this.tools.set(tool.name, tool);
    this.executors.set(tool.name, executor);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool by name
   */
  async executeTool(toolName: string, params: unknown): Promise<unknown> {
    const executor = this.executors.get(toolName);
    if (!executor) {
      throw new Error(`Tool ${toolName} not found`);
    }
    return await executor(params);
  }
}

export const mcpService = new MCPService();
