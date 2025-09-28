// Tool Invocation Service
// Handles tool execution for AI Employees

import { ToolInvocation, ToolResult, ExecutionContext, ValidationResult } from '../../types';

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  cost: number;
  metadata: Record<string, any>;
}

export class ToolInvocationService {
  private toolRegistry: Map<string, ToolHandler> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Register a tool handler
   */
  registerTool(toolId: string, handler: ToolHandler): void {
    this.toolRegistry.set(toolId, handler);
  }

  /**
   * Execute a tool invocation
   */
  async invokeTool(
    toolId: string,
    parameters: Record<string, any>,
    context: ExecutionContext
  ): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // Validate tool exists
      const handler = this.toolRegistry.get(toolId);
      if (!handler) {
        throw new Error(`Tool '${toolId}' not found`);
      }

      // Validate parameters
      const validation = await this.validateParameters(toolId, parameters);
      if (!validation.isValid) {
        throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
      }

      // Execute tool
      const result = await handler.execute(parameters, context);
      
      const executionTime = Date.now() - startTime;
      
      // Log execution
      await this.logExecution(toolId, parameters, result, executionTime, context);

      return {
        success: true,
        data: result,
        executionTime,
        cost: this.calculateCost(toolId, executionTime),
        metadata: {
          toolId,
          parameters,
          context,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Log error
      await this.logError(toolId, parameters, error as Error, executionTime, context);

      return {
        success: false,
        error: (error as Error).message,
        executionTime,
        cost: 0,
        metadata: {
          toolId,
          parameters,
          context,
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Validate tool parameters
   */
  private async validateParameters(toolId: string, parameters: Record<string, any>): Promise<ValidationResult> {
    const handler = this.toolRegistry.get(toolId);
    if (!handler) {
      return {
        isValid: false,
        errors: [`Tool '${toolId}' not found`],
        warnings: []
      };
    }

    return await handler.validate(parameters);
  }

  /**
   * Calculate tool execution cost
   */
  private calculateCost(toolId: string, executionTime: number): number {
    // Base cost per tool execution
    const baseCosts: Record<string, number> = {
      'generate_code': 0.01,
      'analyze_data': 0.005,
      'create_design': 0.02,
      'send_email': 0.001,
      'create_document': 0.01,
      'web_search': 0.002,
      'file_upload': 0.001,
      'api_call': 0.005
    };

    const baseCost = baseCosts[toolId] || 0.01;
    const timeMultiplier = Math.max(1, executionTime / 1000); // Cost increases with execution time
    
    return baseCost * timeMultiplier;
  }

  /**
   * Log tool execution
   */
  private async logExecution(
    toolId: string,
    parameters: Record<string, any>,
    result: any,
    executionTime: number,
    context: ExecutionContext
  ): Promise<void> {
    try {
      // This would typically log to a database or analytics service
      console.log('Tool execution logged:', {
        toolId,
        parameters,
        result,
        executionTime,
        context,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log tool execution:', error);
    }
  }

  /**
   * Log tool execution error
   */
  private async logError(
    toolId: string,
    parameters: Record<string, any>,
    error: Error,
    executionTime: number,
    context: ExecutionContext
  ): Promise<void> {
    try {
      console.error('Tool execution error logged:', {
        toolId,
        parameters,
        error: error.message,
        executionTime,
        context,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log tool execution error:', logError);
    }
  }

  /**
   * Register default tools
   */
  private registerDefaultTools(): void {
    // Code Generation Tool
    this.registerTool('generate_code', {
      name: 'Code Generator',
      description: 'Generate code based on specifications',
      validate: async (params) => {
        const errors: string[] = [];
        if (!params.language) errors.push('Language is required');
        if (!params.requirements) errors.push('Requirements are required');
        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      },
      execute: async (params, context) => {
        // Simulate code generation
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          code: `// Generated ${params.language} code\n// Requirements: ${params.requirements}\n\nfunction example() {\n  return "Hello World";\n}`,
          language: params.language,
          lines: 5,
          complexity: 'simple'
        };
      }
    });

    // Data Analysis Tool
    this.registerTool('analyze_data', {
      name: 'Data Analyzer',
      description: 'Analyze datasets and generate insights',
      validate: async (params) => {
        const errors: string[] = [];
        if (!params.data) errors.push('Data is required');
        if (!params.analysisType) errors.push('Analysis type is required');
        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      },
      execute: async (params, context) => {
        // Simulate data analysis
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          insights: [
            'Data shows positive trend over time',
            'Key metrics improved by 15%',
            'Recommendation: Continue current strategy'
          ],
          charts: ['trend_chart.png', 'distribution.png'],
          summary: 'Analysis completed successfully'
        };
      }
    });

    // Email Tool
    this.registerTool('send_email', {
      name: 'Email Sender',
      description: 'Send emails to recipients',
      validate: async (params) => {
        const errors: string[] = [];
        if (!params.to) errors.push('Recipient email is required');
        if (!params.subject) errors.push('Subject is required');
        if (!params.body) errors.push('Email body is required');
        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      },
      execute: async (params, context) => {
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          messageId: `msg_${Date.now()}`,
          status: 'sent',
          recipient: params.to,
          timestamp: new Date().toISOString()
        };
      }
    });

    // Web Search Tool
    this.registerTool('web_search', {
      name: 'Web Search',
      description: 'Search the web for information',
      validate: async (params) => {
        const errors: string[] = [];
        if (!params.query) errors.push('Search query is required');
        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      },
      execute: async (params, context) => {
        // Simulate web search
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
          results: [
            {
              title: 'Search Result 1',
              url: 'https://example.com/1',
              snippet: 'Relevant information about the search query'
            },
            {
              title: 'Search Result 2',
              url: 'https://example.com/2',
              snippet: 'More relevant information'
            }
          ],
          totalResults: 2,
          searchTime: '0.5s'
        };
      }
    });

    // File Upload Tool
    this.registerTool('file_upload', {
      name: 'File Uploader',
      description: 'Upload files to storage',
      validate: async (params) => {
        const errors: string[] = [];
        if (!params.file) errors.push('File is required');
        if (!params.filename) errors.push('Filename is required');
        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      },
      execute: async (params, context) => {
        // Simulate file upload
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
          fileId: `file_${Date.now()}`,
          url: `https://storage.example.com/files/${params.filename}`,
          size: params.file?.size || 0,
          type: params.file?.type || 'unknown'
        };
      }
    });
  }
}

export interface ToolHandler {
  name: string;
  description: string;
  validate: (parameters: Record<string, any>) => Promise<ValidationResult>;
  execute: (parameters: Record<string, any>, context: ExecutionContext) => Promise<any>;
}

export const toolInvocationService = new ToolInvocationService();
