// MCP (Model Context Protocol) Service
// This service implements MCP for AI Employee tool interactions

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params?: unknown;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPToolCall {
  tool: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

class MCPService {
  private tools: Map<string, MCPTool> = new Map();
  private callbacks: Map<string, (...args: unknown[]) => unknown> = new Map();

  // Register a tool with MCP
  registerTool(tool: MCPTool, handler: (...args: unknown[]) => unknown) {
    this.tools.set(tool.name, tool);
    this.callbacks.set(tool.name, handler);
  }

  // List available tools
  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  // Call a tool via MCP
  async callTool(toolName: string, parameters: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    const handler = this.callbacks.get(toolName);
    if (!handler) {
      throw new Error(`Handler for tool ${toolName} not found`);
    }

    // Validate parameters against schema
    this.validateParameters(tool, parameters);

    try {
      const result = await handler(parameters);
      return result;
    } catch (error: unknown) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  // Validate parameters against tool schema
  private validateParameters(tool: MCPTool, parameters: Record<string, unknown>) {
    const { required, properties } = tool.inputSchema;
    
    // Check required parameters
    for (const param of required) {
      if (!(param in parameters)) {
        throw new Error(`Required parameter '${param}' is missing`);
      }
    }

    // Validate parameter types
    for (const [key, value] of Object.entries(parameters)) {
      const paramSchema = properties[key];
      if (paramSchema) {
        this.validateParameterType(key, value, paramSchema);
      }
    }
  }

  // Validate parameter type
  private validateParameterType(name: string, value: unknown, schema: unknown) {
    const { type } = schema;
    
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Parameter '${name}' must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`Parameter '${name}' must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Parameter '${name}' must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Parameter '${name}' must be an array`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          throw new Error(`Parameter '${name}' must be an object`);
        }
        break;
    }
  }

  // Process MCP request
  async processRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: this.listTools()
            }
          };

        case 'tools/call': { const { name, arguments: args } = request.params;
          const result = await this.callTool(name, args);
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result)
                }
              ]
            }
          };

        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: 'Method not found'
            }
          };
      }
    } catch (error: unknown) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error.message
        }
      };
    }
  }
}

export const mcpService = new MCPService();
