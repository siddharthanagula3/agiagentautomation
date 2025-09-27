// Complete Tool Integrations for AI Employees
// Comprehensive integrations with N8N, OpenAI, Anthropic, Cursor, Replit, Claude, and more

import { completeMCPService } from '../services/complete-mcp-service';
import type { MCPToolResult, APIResponse } from '../types/complete-ai-employee';

// ========================================
// N8N WORKFLOW INTEGRATION
// ========================================

export interface N8NWorkflowConfig {
  workflowId: string;
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

export interface N8NWorkflowExecution {
  executionId: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  data: any;
  startedAt: string;
  finishedAt?: string;
  error?: string;
}

class N8NIntegration {
  private config: N8NWorkflowConfig;

  constructor(config: N8NWorkflowConfig) {
    this.config = config;
  }

  async executeWorkflow(
    workflowId: string,
    inputData: any,
    options: {
      waitForCompletion?: boolean;
      timeout?: number;
    } = {}
  ): Promise<APIResponse<N8NWorkflowExecution>> {
    try {
      const { waitForCompletion = true, timeout = 30000 } = options;

      // Start workflow execution
      const response = await fetch(`${this.config.baseUrl}/api/v1/executions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflowId,
          data: inputData
        })
      });

      if (!response.ok) {
        throw new Error(`N8N API error: ${response.statusText}`);
      }

      const execution = await response.json();

      if (waitForCompletion) {
        // Wait for completion
        return await this.waitForCompletion(execution.id, timeout);
      }

      return {
        success: true,
        data: execution,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async waitForCompletion(executionId: string, timeout: number): Promise<APIResponse<N8NWorkflowExecution>> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`${this.config.baseUrl}/api/v1/executions/${executionId}`, {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        });

        if (!response.ok) {
          throw new Error(`N8N API error: ${response.statusText}`);
        }

        const execution = await response.json();

        if (execution.status === 'success' || execution.status === 'error') {
          return {
            success: true,
            data: execution,
            timestamp: new Date().toISOString()
          };
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return {
      success: false,
      error: 'Workflow execution timeout',
      timestamp: new Date().toISOString()
    };
  }

  async getWorkflowStatus(executionId: string): Promise<APIResponse<N8NWorkflowExecution>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/executions/${executionId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`N8N API error: ${response.statusText}`);
      }

      const execution = await response.json();

      return {
        success: true,
        data: execution,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// ========================================
// OPENAI API INTEGRATION
// ========================================

export interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  organization?: string;
  timeout?: number;
}

export interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class OpenAIIntegration {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  async chatCompletion(request: OpenAIRequest): Promise<APIResponse<OpenAIResponse>> {
    try {
      const response = await fetch(`${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.config.organization && { 'OpenAI-Organization': this.config.organization })
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateText(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<APIResponse<string>> {
    try {
      const { model = 'gpt-4', temperature = 0.7, maxTokens = 1000 } = options;

      const request: OpenAIRequest = {
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        maxTokens
      };

      const response = await this.chatCompletion(request);

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.choices[0]?.message?.content || '',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to generate text',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateCode(
    prompt: string,
    language: string = 'javascript',
    options: {
      model?: string;
      temperature?: number;
    } = {}
  ): Promise<APIResponse<string>> {
    try {
      const codePrompt = `Generate ${language} code for the following request:\n\n${prompt}\n\nProvide only the code without explanations.`;
      
      return await this.generateText(codePrompt, {
        model: options.model || 'gpt-4',
        temperature: options.temperature || 0.3,
        maxTokens: 2000
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// ========================================
// ANTHROPIC CLAUDE INTEGRATION
// ========================================

export interface AnthropicConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface AnthropicRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  maxTokens: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stopReason: string;
  stopSequence?: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

class AnthropicIntegration {
  private config: AnthropicConfig;

  constructor(config: AnthropicConfig) {
    this.config = config;
  }

  async chatCompletion(request: AnthropicRequest): Promise<APIResponse<AnthropicResponse>> {
    try {
      const response = await fetch(`${this.config.baseUrl || 'https://api.anthropic.com/v1'}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateText(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<APIResponse<string>> {
    try {
      const { model = 'claude-3-sonnet-20240229', temperature = 0.7, maxTokens = 1000 } = options;

      const request: AnthropicRequest = {
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        maxTokens,
        temperature
      };

      const response = await this.chatCompletion(request);

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.content[0]?.text || '',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to generate text',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// ========================================
// CURSOR AGENT INTEGRATION
// ========================================

export interface CursorAgentConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

export interface CursorAgentRequest {
  task: string;
  context?: {
    files?: string[];
    codebase?: string;
    requirements?: string[];
  };
  options?: {
    language?: string;
    framework?: string;
    style?: string;
  };
}

export interface CursorAgentResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    code: string;
    files: Array<{
      name: string;
      content: string;
      language: string;
    }>;
    explanation: string;
    suggestions: string[];
  };
  error?: string;
}

class CursorAgentIntegration {
  private config: CursorAgentConfig;

  constructor(config: CursorAgentConfig) {
    this.config = config;
  }

  async executeTask(request: CursorAgentRequest): Promise<APIResponse<CursorAgentResponse>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Cursor Agent API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateCode(
    task: string,
    context?: {
      files?: string[];
      codebase?: string;
      requirements?: string[];
    }
  ): Promise<APIResponse<CursorAgentResponse>> {
    try {
      return await this.executeTask({
        task,
        context,
        options: {
          language: 'typescript',
          framework: 'react'
        }
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getTaskStatus(taskId: string): Promise<APIResponse<CursorAgentResponse>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Cursor Agent API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// ========================================
// REPLIT AGENT INTEGRATION
// ========================================

export interface ReplitAgentConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

export interface ReplitAgentRequest {
  prompt: string;
  language?: string;
  context?: {
    files?: string[];
    environment?: string;
    dependencies?: string[];
  };
}

export interface ReplitAgentResponse {
  executionId: string;
  status: 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  files?: Array<{
    name: string;
    content: string;
  }>;
}

class ReplitAgentIntegration {
  private config: ReplitAgentConfig;

  constructor(config: ReplitAgentConfig) {
    this.config = config;
  }

  async executeCode(request: ReplitAgentRequest): Promise<APIResponse<ReplitAgentResponse>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Replit Agent API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async runCode(
    code: string,
    language: string = 'python',
    context?: {
      files?: string[];
      environment?: string;
      dependencies?: string[];
    }
  ): Promise<APIResponse<ReplitAgentResponse>> {
    try {
      return await this.executeCode({
        prompt: code,
        language,
        context
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// ========================================
// CLAUDE CODE INTEGRATION
// ========================================

export interface ClaudeCodeConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

export interface ClaudeCodeRequest {
  code: string;
  operation: 'analyze' | 'refactor' | 'optimize' | 'debug' | 'document';
  context?: {
    language?: string;
    framework?: string;
    requirements?: string[];
  };
}

export interface ClaudeCodeResponse {
  operationId: string;
  status: 'completed' | 'failed';
  result?: {
    originalCode: string;
    processedCode: string;
    analysis: string;
    suggestions: string[];
    improvements: string[];
  };
  error?: string;
}

class ClaudeCodeIntegration {
  private config: ClaudeCodeConfig;

  constructor(config: ClaudeCodeConfig) {
    this.config = config;
  }

  async processCode(request: ClaudeCodeRequest): Promise<APIResponse<ClaudeCodeResponse>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Claude Code API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async analyzeCode(
    code: string,
    context?: {
      language?: string;
      framework?: string;
      requirements?: string[];
    }
  ): Promise<APIResponse<ClaudeCodeResponse>> {
    try {
      return await this.processCode({
        code,
        operation: 'analyze',
        context
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async refactorCode(
    code: string,
    context?: {
      language?: string;
      framework?: string;
      requirements?: string[];
    }
  ): Promise<APIResponse<ClaudeCodeResponse>> {
    try {
      return await this.processCode({
        code,
        operation: 'refactor',
        context
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async optimizeCode(
    code: string,
    context?: {
      language?: string;
      framework?: string;
      requirements?: string[];
    }
  ): Promise<APIResponse<ClaudeCodeResponse>> {
    try {
      return await this.processCode({
        code,
        operation: 'optimize',
        context
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// ========================================
// INTEGRATION MANAGER
// ========================================

export class ToolIntegrationManager {
  private n8n?: N8NIntegration;
  private openai?: OpenAIIntegration;
  private anthropic?: AnthropicIntegration;
  private cursorAgent?: CursorAgentIntegration;
  private replitAgent?: ReplitAgentIntegration;
  private claudeCode?: ClaudeCodeIntegration;

  constructor() {
    this.initializeIntegrations();
  }

  private initializeIntegrations() {
    // Initialize integrations based on environment variables
    if (import.meta.env.VITE_N8N_API_KEY) {
      this.n8n = new N8NIntegration({
        workflowId: import.meta.env.VITE_N8N_WORKFLOW_ID || '',
        apiKey: import.meta.env.VITE_N8N_API_KEY,
        baseUrl: import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678'
      });
    }

    if (import.meta.env.VITE_OPENAI_API_KEY) {
      this.openai = new OpenAIIntegration({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        baseUrl: import.meta.env.VITE_OPENAI_BASE_URL,
        organization: import.meta.env.VITE_OPENAI_ORGANIZATION
      });
    }

    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      this.anthropic = new AnthropicIntegration({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        baseUrl: import.meta.env.VITE_ANTHROPIC_BASE_URL
      });
    }

    if (import.meta.env.VITE_CURSOR_AGENT_API_KEY) {
      this.cursorAgent = new CursorAgentIntegration({
        apiKey: import.meta.env.VITE_CURSOR_AGENT_API_KEY,
        baseUrl: import.meta.env.VITE_CURSOR_AGENT_BASE_URL || 'https://api.cursor.sh'
      });
    }

    if (import.meta.env.VITE_REPLIT_AGENT_API_KEY) {
      this.replitAgent = new ReplitAgentIntegration({
        apiKey: import.meta.env.VITE_REPLIT_AGENT_API_KEY,
        baseUrl: import.meta.env.VITE_REPLIT_AGENT_BASE_URL || 'https://api.replit.com'
      });
    }

    if (import.meta.env.VITE_CLAUDE_CODE_API_KEY) {
      this.claudeCode = new ClaudeCodeIntegration({
        apiKey: import.meta.env.VITE_CLAUDE_CODE_API_KEY,
        baseUrl: import.meta.env.VITE_CLAUDE_CODE_BASE_URL || 'https://api.claude-code.com'
      });
    }
  }

  // N8N Methods
  async executeN8NWorkflow(workflowId: string, inputData: any): Promise<APIResponse<N8NWorkflowExecution>> {
    if (!this.n8n) {
      return {
        success: false,
        error: 'N8N integration not configured',
        timestamp: new Date().toISOString()
      };
    }
    return await this.n8n.executeWorkflow(workflowId, inputData);
  }

  // OpenAI Methods
  async generateTextWithOpenAI(prompt: string, options?: any): Promise<APIResponse<string>> {
    if (!this.openai) {
      return {
        success: false,
        error: 'OpenAI integration not configured',
        timestamp: new Date().toISOString()
      };
    }
    return await this.openai.generateText(prompt, options);
  }

  async generateCodeWithOpenAI(prompt: string, language?: string): Promise<APIResponse<string>> {
    if (!this.openai) {
      return {
        success: false,
        error: 'OpenAI integration not configured',
        timestamp: new Date().toISOString()
      };
    }
    return await this.openai.generateCode(prompt, language);
  }

  // Anthropic Methods
  async generateTextWithAnthropic(prompt: string, options?: any): Promise<APIResponse<string>> {
    if (!this.anthropic) {
      return {
        success: false,
        error: 'Anthropic integration not configured',
        timestamp: new Date().toISOString()
      };
    }
    return await this.anthropic.generateText(prompt, options);
  }

  // Cursor Agent Methods
  async executeCursorTask(task: string, context?: any): Promise<APIResponse<CursorAgentResponse>> {
    if (!this.cursorAgent) {
      return {
        success: false,
        error: 'Cursor Agent integration not configured',
        timestamp: new Date().toISOString()
      };
    }
    return await this.cursorAgent.executeTask({ task, context });
  }

  // Replit Agent Methods
  async executeReplitCode(code: string, language?: string, context?: any): Promise<APIResponse<ReplitAgentResponse>> {
    if (!this.replitAgent) {
      return {
        success: false,
        error: 'Replit Agent integration not configured',
        timestamp: new Date().toISOString()
      };
    }
    return await this.replitAgent.runCode(code, language, context);
  }

  // Claude Code Methods
  async processCodeWithClaude(code: string, operation: string, context?: any): Promise<APIResponse<ClaudeCodeResponse>> {
    if (!this.claudeCode) {
      return {
        success: false,
        error: 'Claude Code integration not configured',
        timestamp: new Date().toISOString()
      };
    }
    return await this.claudeCode.processCode({ code, operation: operation as any, context });
  }

  // Get available integrations
  getAvailableIntegrations(): string[] {
    const integrations: string[] = [];
    
    if (this.n8n) integrations.push('n8n');
    if (this.openai) integrations.push('openai');
    if (this.anthropic) integrations.push('anthropic');
    if (this.cursorAgent) integrations.push('cursor-agent');
    if (this.replitAgent) integrations.push('replit-agent');
    if (this.claudeCode) integrations.push('claude-code');
    
    return integrations;
  }
}

// Export singleton instance
export const toolIntegrationManager = new ToolIntegrationManager();

// Register MCP tools with integrations
export function registerToolIntegrations() {
  // Register N8N workflow tool
  completeMCPService.registerTool({
    name: 'n8n_workflow',
    description: 'Execute N8N workflow',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string' },
        inputData: { type: 'object' }
      },
      required: ['workflowId']
    }
  }, async (params) => {
    return await toolIntegrationManager.executeN8NWorkflow(params.workflowId, params.inputData);
  });

  // Register OpenAI text generation tool
  completeMCPService.registerTool({
    name: 'openai_generate_text',
    description: 'Generate text using OpenAI',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        model: { type: 'string' },
        temperature: { type: 'number' }
      },
      required: ['prompt']
    }
  }, async (params) => {
    return await toolIntegrationManager.generateTextWithOpenAI(params.prompt, {
      model: params.model,
      temperature: params.temperature
    });
  });

  // Register Anthropic text generation tool
  completeMCPService.registerTool({
    name: 'anthropic_generate_text',
    description: 'Generate text using Anthropic Claude',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        model: { type: 'string' },
        temperature: { type: 'number' }
      },
      required: ['prompt']
    }
  }, async (params) => {
    return await toolIntegrationManager.generateTextWithAnthropic(params.prompt, {
      model: params.model,
      temperature: params.temperature
    });
  });

  // Register Cursor Agent tool
  completeMCPService.registerTool({
    name: 'cursor_agent_task',
    description: 'Execute task using Cursor Agent',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string' },
        context: { type: 'object' }
      },
      required: ['task']
    }
  }, async (params) => {
    return await toolIntegrationManager.executeCursorTask(params.task, params.context);
  });

  // Register Replit Agent tool
  completeMCPService.registerTool({
    name: 'replit_agent_code',
    description: 'Execute code using Replit Agent',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        language: { type: 'string' },
        context: { type: 'object' }
      },
      required: ['code']
    }
  }, async (params) => {
    return await toolIntegrationManager.executeReplitCode(params.code, params.language, params.context);
  });

  // Register Claude Code tool
  completeMCPService.registerTool({
    name: 'claude_code_process',
    description: 'Process code using Claude Code',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        operation: { type: 'string' },
        context: { type: 'object' }
      },
      required: ['code', 'operation']
    }
  }, async (params) => {
    return await toolIntegrationManager.processCodeWithClaude(params.code, params.operation, params.context);
  });
}

// Initialize tool integrations
registerToolIntegrations();
