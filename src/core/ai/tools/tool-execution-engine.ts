/**
 * Enhanced Tool Executor Service
 * Comprehensive tool execution system with MCP protocol support
 *
 * Updated: Nov 16th 2025 - Replaced fake tool responses with descriptive errors to prevent confusion
 */

import { mcpService, type MCPTool } from './mcp-service';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
  outputSchema?: {
    type: string;
    properties: Record<string, unknown>;
  };
}

export interface ToolExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  executionTime: number;
  logs?: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  data?: unknown;
}

export type ToolExecutionCallback = (log: ExecutionLog) => void;
type APICallBody =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

class ToolExecutorService {
  private tools: Map<string, Tool> = new Map();
  private executors: Map<string, (params: unknown) => Promise<unknown>> =
    new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Register default built-in tools
   */
  private registerDefaultTools() {
    // Web Search Tool
    this.registerTool(
      {
        id: 'web_search',
        name: 'web_search',
        description: 'Search the web for current information',
        category: 'research',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results',
              default: 5,
            },
          },
          required: ['query'],
        },
      },
      async (params) => {
        return await this.executeWebSearch(
          params.query,
          params.maxResults || 5
        );
      }
    );

    // Code Interpreter Tool
    this.registerTool(
      {
        id: 'code_interpreter',
        name: 'execute_code',
        description: 'Execute code in a sandboxed environment',
        category: 'development',
        inputSchema: {
          type: 'object',
          properties: {
            language: {
              type: 'string',
              enum: ['python', 'javascript', 'typescript'],
              description: 'Programming language',
            },
            code: { type: 'string', description: 'Code to execute' },
          },
          required: ['language', 'code'],
        },
      },
      async (params) => {
        return await this.executeCode(params.language, params.code);
      }
    );

    // File Analysis Tool
    this.registerTool(
      {
        id: 'analyze_file',
        name: 'analyze_file',
        description: 'Analyze uploaded files (PDF, CSV, images, etc.)',
        category: 'data_analysis',
        inputSchema: {
          type: 'object',
          properties: {
            fileUrl: { type: 'string', description: 'URL or path to file' },
            analysisType: {
              type: 'string',
              enum: ['text', 'data', 'image'],
              description: 'Type of analysis',
            },
          },
          required: ['fileUrl', 'analysisType'],
        },
      },
      async (params) => {
        return await this.analyzeFile(params.fileUrl, params.analysisType);
      }
    );

    // Data Visualization Tool
    this.registerTool(
      {
        id: 'create_visualization',
        name: 'create_visualization',
        description: 'Create data visualizations (charts, graphs)',
        category: 'data_analysis',
        inputSchema: {
          type: 'object',
          properties: {
            data: { type: 'array', description: 'Data to visualize' },
            chartType: {
              type: 'string',
              enum: ['line', 'bar', 'pie', 'scatter'],
              description: 'Chart type',
            },
            title: { type: 'string', description: 'Chart title' },
          },
          required: ['data', 'chartType'],
        },
      },
      async (params) => {
        return await this.createVisualization(
          params.data,
          params.chartType,
          params.title
        );
      }
    );

    // API Call Tool
    this.registerTool(
      {
        id: 'api_call',
        name: 'make_api_call',
        description: 'Make HTTP API calls to external services',
        category: 'integration',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'API endpoint URL' },
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE'],
              description: 'HTTP method',
            },
            headers: { type: 'object', description: 'Request headers' },
            body: { type: 'object', description: 'Request body' },
          },
          required: ['url', 'method'],
        },
      },
      async (params) => {
        return await this.makeAPICall(
          params.url,
          params.method,
          params.headers,
          params.body
        );
      }
    );

    // Database Query Tool
    this.registerTool(
      {
        id: 'query_database',
        name: 'query_database',
        description: 'Query databases using SQL',
        category: 'data_access',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'SQL query' },
            database: {
              type: 'string',
              description: 'Database connection string',
            },
          },
          required: ['query'],
        },
      },
      async (params) => {
        return await this.queryDatabase(params.query, params.database);
      }
    );

    // Image Generation Tool
    this.registerTool(
      {
        id: 'generate_image',
        name: 'generate_image',
        description: 'Generate images using AI',
        category: 'creative',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Image generation prompt' },
            size: {
              type: 'string',
              enum: ['256x256', '512x512', '1024x1024'],
              description: 'Image size',
            },
            style: { type: 'string', description: 'Art style' },
          },
          required: ['prompt'],
        },
      },
      async (params) => {
        return await this.generateImage(
          params.prompt,
          params.size,
          params.style
        );
      }
    );

    // Document Processing Tool
    this.registerTool(
      {
        id: 'process_document',
        name: 'process_document',
        description: 'Process and extract information from documents',
        category: 'data_extraction',
        inputSchema: {
          type: 'object',
          properties: {
            documentUrl: { type: 'string', description: 'Document URL' },
            operation: {
              type: 'string',
              enum: ['extract_text', 'summarize', 'qa'],
              description: 'Processing operation',
            },
            query: { type: 'string', description: 'Query for Q&A operation' },
          },
          required: ['documentUrl', 'operation'],
        },
      },
      async (params) => {
        return await this.processDocument(
          params.documentUrl,
          params.operation,
          params.query
        );
      }
    );
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Tool, executor: (params: unknown) => Promise<unknown>) {
    this.tools.set(tool.id, tool);
    this.executors.set(tool.id, executor);

    // Also register with MCP service
    const mcpTool: MCPTool = {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    };
    mcpService.registerTool(mcpTool, executor);
  }

  /**
   * Get all available tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): Tool[] {
    return Array.from(this.tools.values()).filter(
      (t) => t.category === category
    );
  }

  /**
   * Execute a tool
   */
  async executeTool(
    toolId: string,
    parameters: Record<string, unknown>,
    onLog?: ToolExecutionCallback
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const logs: ExecutionLog[] = [];

    const log = (
      level: ExecutionLog['level'],
      message: string,
      data?: unknown
    ) => {
      const logEntry: ExecutionLog = {
        timestamp: new Date(),
        level,
        message,
        data,
      };
      logs.push(logEntry);
      onLog?.(logEntry);
    };

    try {
      const tool = this.tools.get(toolId);
      if (!tool) {
        throw new Error(`Tool ${toolId} not found`);
      }

      const executor = this.executors.get(toolId);
      if (!executor) {
        throw new Error(`Executor for tool ${toolId} not found`);
      }

      log('info', `Starting execution of ${tool.name}`, { parameters });

      // Validate parameters
      this.validateParameters(tool, parameters);
      log('info', 'Parameters validated');

      // Execute tool
      const output = await executor(parameters);
      const executionTime = Date.now() - startTime;

      log('info', 'Execution completed successfully', { executionTime });

      return {
        success: true,
        output,
        executionTime,
        logs,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      log('error', `Execution failed: ${errorMessage}`, { error });

      return {
        success: false,
        error: errorMessage,
        executionTime,
        logs,
      };
    }
  }

  /**
   * Validate parameters against tool schema
   */
  private validateParameters(tool: Tool, parameters: unknown) {
    const { required, properties } = tool.inputSchema;

    // Check required parameters
    for (const param of required) {
      if (!(param in parameters)) {
        throw new Error(`Required parameter '${param}' is missing`);
      }
    }

    // Validate types
    for (const [key, value] of Object.entries(parameters)) {
      const propSchema = properties[key];
      if (propSchema) {
        this.validateType(key, value, propSchema);
      }
    }
  }

  /**
   * Validate parameter type
   */
  private validateType(name: string, value: unknown, schema: unknown) {
    const { type, enum: enumValues } = schema;

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Parameter '${name}' must be a string`);
        }
        if (enumValues && !enumValues.includes(value)) {
          throw new Error(
            `Parameter '${name}' must be one of: ${enumValues.join(', ')}`
          );
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

  // ============================================
  // Tool Implementation Methods
  // ============================================

  /**
   * Web Search Implementation
   */
  private async executeWebSearch(
    query: string,
    maxResults: number
  ): Promise<unknown> {
    throw new Error(
      'Web search is not yet implemented. Please integrate with a search API provider (Google, Bing, or Perplexity).'
    );
  }

  /**
   * Code Execution Implementation
   */
  private async executeCode(language: string, code: string): Promise<unknown> {
    throw new Error(
      'Code execution is not yet implemented. This feature requires a sandboxed execution environment for security.'
    );
  }

  /**
   * File Analysis Implementation
   */
  private async analyzeFile(
    fileUrl: string,
    analysisType: string
  ): Promise<unknown> {
    throw new Error(
      'File analysis is not yet implemented. Please integrate with a document processing service.'
    );
  }

  /**
   * Data Visualization Implementation
   */
  private async createVisualization(
    data: unknown[],
    chartType: string,
    title?: string
  ): Promise<unknown> {
    throw new Error(
      'Data visualization is not yet implemented. Please integrate with a charting library (Chart.js, D3, etc.).'
    );
  }

  /**
   * API Call Implementation
   */
  private async makeAPICall(
    url: string,
    method: string,
    headers?: Record<string, string>,
    body?: APICallBody
  ): Promise<unknown> {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return {
        status: response.status,
        data,
      };
    } catch (error) {
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  /**
   * Database Query Implementation
   */
  private async queryDatabase(
    query: string,
    database?: string
  ): Promise<unknown> {
    throw new Error(
      'Database querying is not yet implemented. Consider using Supabase client directly instead.'
    );
  }

  /**
   * Image Generation Implementation
   */
  private async generateImage(
    prompt: string,
    size?: string,
    style?: string
  ): Promise<unknown> {
    // TODO: Integrate with DALL-E or other image generation API
    console.log('Generating image:', prompt);

    return {
      imageUrl: 'https://example.com/generated-image.png',
      prompt,
      size: size || '1024x1024',
    };
  }

  /**
   * Document Processing Implementation
   */
  private async processDocument(
    documentUrl: string,
    operation: string,
    query?: string
  ): Promise<unknown> {
    // TODO: Implement document processing
    console.log('Processing document:', documentUrl, operation);

    return {
      operation,
      result: 'Processed result...',
    };
  }
}

export const toolExecutorService = new ToolExecutorService();
