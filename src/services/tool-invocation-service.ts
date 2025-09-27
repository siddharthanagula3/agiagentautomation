import { supabase } from '../integrations/supabase/client';
import type { ToolDefinition, ToolType, IntegrationType } from '../types/ai-employee';

// Tool Invocation Service
// Handles the execution of tools by AI employees
class ToolInvocationService {
  private toolRegistry: Map<string, ToolDefinition> = new Map();
  private integrationHandlers: Map<IntegrationType, Function> = new Map();

  constructor() {
    this.initializeIntegrationHandlers();
  }

  // Initialize integration handlers for different tool types
  private initializeIntegrationHandlers() {
    // N8N Workflow Integration
    this.integrationHandlers.set('n8n_workflow', this.executeN8NWorkflow.bind(this));
    
    // OpenAI API Integration
    this.integrationHandlers.set('openai_api', this.executeOpenAIAPI.bind(this));
    
    // Anthropic API Integration
    this.integrationHandlers.set('anthropic_api', this.executeAnthropicAPI.bind(this));
    
    // Cursor Agent Integration
    this.integrationHandlers.set('cursor_agent', this.executeCursorAgent.bind(this));
    
    // Replit Agent Integration
    this.integrationHandlers.set('replit_agent', this.executeReplitAgent.bind(this));
    
    // Claude Code Integration
    this.integrationHandlers.set('claude_code', this.executeClaudeCode.bind(this));
    
    // Custom API Integration
    this.integrationHandlers.set('custom_api', this.executeCustomAPI.bind(this));
    
    // Webhook Integration
    this.integrationHandlers.set('webhook', this.executeWebhook.bind(this));
    
    // Database Integration
    this.integrationHandlers.set('database', this.executeDatabaseOperation.bind(this));
    
    // File System Integration
    this.integrationHandlers.set('file_system', this.executeFileSystemOperation.bind(this));
  }

  // Register a new tool
  async registerTool(tool: ToolDefinition) {
    this.toolRegistry.set(tool.id, tool);
    
    // Store in database
    try {
      const { error } = await supabase
        .from('ai_tools')
        .upsert({
          id: tool.id,
          name: tool.name,
          type: tool.type,
          description: tool.description,
          parameters: tool.parameters,
          invocation_pattern: tool.invocationPattern,
          integration_type: tool.integrationType,
          config: tool.config,
          is_active: tool.isActive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Execute a tool
  async executeTool(toolId: string, parameters: Record<string, any>, context?: any) {
    const tool = this.toolRegistry.get(toolId);
    if (!tool) {
      return { success: false, error: 'Tool not found', result: null };
    }

    if (!tool.isActive) {
      return { success: false, error: 'Tool is not active', result: null };
    }

    try {
      // Validate parameters
      const validationResult = this.validateParameters(tool, parameters);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error, result: null };
      }

      // Get the appropriate integration handler
      const handler = this.integrationHandlers.get(tool.integrationType);
      if (!handler) {
        return { success: false, error: 'Integration handler not found', result: null };
      }

      // Execute the tool
      const result = await handler(tool, parameters, context);
      
      // Log the execution
      await this.logToolExecution(toolId, parameters, result, context);
      
      return { success: true, error: null, result };
    } catch (error: any) {
      return { success: false, error: error.message, result: null };
    }
  }

  // Validate tool parameters
  private validateParameters(tool: ToolDefinition, parameters: Record<string, any>) {
    for (const param of tool.parameters) {
      if (param.required && !(param.name in parameters)) {
        return { valid: false, error: `Required parameter '${param.name}' is missing` };
      }
      
      if (param.name in parameters) {
        const value = parameters[param.name];
        const type = typeof value;
        
        if (param.type === 'array' && !Array.isArray(value)) {
          return { valid: false, error: `Parameter '${param.name}' must be an array` };
        }
        
        if (param.type === 'object' && (type !== 'object' || Array.isArray(value))) {
          return { valid: false, error: `Parameter '${param.name}' must be an object` };
        }
        
        if (param.type === 'number' && type !== 'number') {
          return { valid: false, error: `Parameter '${param.name}' must be a number` };
        }
        
        if (param.type === 'boolean' && type !== 'boolean') {
          return { valid: false, error: `Parameter '${param.name}' must be a boolean` };
        }
        
        if (param.type === 'string' && type !== 'string') {
          return { valid: false, error: `Parameter '${param.name}' must be a string` };
        }
      }
    }
    
    return { valid: true, error: null };
  }

  // N8N Workflow Execution
  private async executeN8NWorkflow(tool: ToolDefinition, parameters: Record<string, any>, context?: any) {
    const { n8nWorkflowId, n8nApiKey, n8nBaseUrl } = tool.config;
    
    if (!n8nWorkflowId || !n8nApiKey || !n8nBaseUrl) {
      throw new Error('N8N configuration is incomplete');
    }

    const response = await fetch(`${n8nBaseUrl}/api/v1/workflows/${n8nWorkflowId}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${n8nApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parameters,
        context: context || {}
      })
    });

    if (!response.ok) {
      throw new Error(`N8N workflow execution failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // OpenAI API Execution
  private async executeOpenAIAPI(tool: ToolDefinition, parameters: Record<string, any>, context?: any) {
    const { apiKey, model, temperature, maxTokens } = tool.config;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gpt-4',
        messages: parameters.messages || [],
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 1000,
        ...parameters
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API call failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Anthropic API Execution
  private async executeAnthropicAPI(tool: ToolDefinition, parameters: Record<string, any>, context?: any) {
    const { apiKey, model, maxTokens } = tool.config;
    
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: maxTokens || 1000,
        ...parameters
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API call failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Cursor Agent Execution
  private async executeCursorAgent(tool: ToolDefinition, parameters: Record<string, any>, context?: any) {
    // Cursor Agent integration - this would typically involve
    // sending requests to Cursor's API or using their SDK
    const { cursorApiKey, cursorEndpoint } = tool.config;
    
    if (!cursorApiKey || !cursorEndpoint) {
      throw new Error('Cursor Agent configuration is incomplete');
    }

    const response = await fetch(cursorEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cursorApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...parameters,
        context: context || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Cursor Agent execution failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Replit Agent Execution
  private async executeReplitAgent(tool: ToolDefinition, parameters: Record<string, any>, context?: any) {
    // Replit Agent integration
    const { replitApiKey, replitEndpoint } = tool.config;
    
    if (!replitApiKey || !replitEndpoint) {
      throw new Error('Replit Agent configuration is incomplete');
    }

    const response = await fetch(replitEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replitApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...parameters,
        context: context || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Replit Agent execution failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Claude Code Execution
  private async executeClaudeCode(tool: ToolDefinition, parameters: Record<string, any>, context?: any) {
    // Claude Code integration - similar to Anthropic but for code-specific tasks
    return this.executeAnthropicAPI(tool, parameters, context);
  }

  // Custom API Execution
  private async executeCustomAPI(tool: ToolDefinition, parameters: Record<string, any>, context?: any) {
    const { apiUrl, apiKey, method = 'POST' } = tool.config;
    
    if (!apiUrl) {
      throw new Error('Custom API URL is required');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method,
      headers,
      body: JSON.stringify({
        ...parameters,
        context: context || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Custom API call failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Webhook Execution
  private async executeWebhook(tool: ToolDefinition, parameters: Record<string, any>, context?: any) {
    const { webhookUrl, method = 'POST' } = tool.config;
    
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    const response = await fetch(webhookUrl, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...parameters,
        context: context || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook execution failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Database Operation Execution
  private async executeDatabaseOperation(tool: ToolDefinition, parameters: Record<string, any>, context?: any) {
    const { operation, table, query } = tool.config;
    
    if (!operation) {
      throw new Error('Database operation is required');
    }

    let result;
    switch (operation) {
      case 'select':
        result = await supabase.from(table).select(parameters.select || '*');
        break;
      case 'insert':
        result = await supabase.from(table).insert(parameters.data);
        break;
      case 'update':
        result = await supabase.from(table).update(parameters.data).eq(parameters.column, parameters.value);
        break;
      case 'delete':
        result = await supabase.from(table).delete().eq(parameters.column, parameters.value);
        break;
      case 'custom':
        result = await supabase.rpc(query, parameters);
        break;
      default:
        throw new Error(`Unsupported database operation: ${operation}`);
    }

    if (result.error) {
      throw new Error(`Database operation failed: ${result.error.message}`);
    }

    return result.data;
  }

  // File System Operation Execution
  private async executeFileSystemOperation(tool: ToolDefinition, parameters: Record<string, any>, context?: any) {
    const { operation, path } = tool.config;
    
    if (!operation || !path) {
      throw new Error('File system operation and path are required');
    }

    // This would typically involve server-side file operations
    // For security reasons, this should be carefully controlled
    throw new Error('File system operations are not implemented for security reasons');
  }

  // Log tool execution
  private async logToolExecution(toolId: string, parameters: Record<string, any>, result: any, context?: any) {
    try {
      await supabase.from('tool_executions').insert({
        tool_id: toolId,
        parameters,
        result,
        context,
        executed_at: new Date().toISOString(),
        success: true
      });
    } catch (error) {
      console.error('Failed to log tool execution:', error);
    }
  }

  // Get tool by ID
  async getTool(toolId: string) {
    const tool = this.toolRegistry.get(toolId);
    if (tool) {
      return { data: tool, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('id', toolId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get all tools
  async getAllTools() {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get tools by type
  async getToolsByType(type: ToolType) {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get tools by integration type
  async getToolsByIntegrationType(integrationType: IntegrationType) {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('integration_type', integrationType)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
}

export const toolInvocationService = new ToolInvocationService();
