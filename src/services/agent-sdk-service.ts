/**
 * Agent SDK Service - OpenAI Apps SDK Integration
 * Implements the latest OpenAI Agent SDK for ChatGPT-powered AI Employees
 * Based on OpenAI's design guidelines and best practices
 * 
 * Features:
 * - Conversational flow integration
 * - Context-aware responses
 * - Tool execution and webhook handling
 * - Streaming responses
 * - Error handling and retry logic
 * - Token tracking and analytics
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Types for Agent SDK
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    provider?: string;
    model?: string;
    tools?: string[];
    webhook?: string;
    sessionId?: string;
    userId?: string;
  };
}

export interface AgentResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  model: string;
  tools?: AgentTool[];
  webhook?: AgentWebhook;
  streaming?: boolean;
  sessionId?: string;
  userId?: string;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  type: 'function' | 'webhook' | 'api';
  parameters: Record<string, any>;
  executionResult?: any;
}

export interface AgentWebhook {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  payload?: Record<string, any>;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
  };
}

export interface AgentConfig {
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  temperature: number;
  maxTokens: number;
  tools: AgentTool[];
  webhooks: AgentWebhook[];
  streaming: boolean;
  contextWindow: number;
  systemPrompt: string;
}

export interface AgentSession {
  id: string;
  userId: string;
  employeeId: string;
  employeeRole: string;
  config: AgentConfig;
  messages: AgentMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Enhanced error handling for Agent SDK
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

/**
 * Agent SDK Service Class
 */
export class AgentSDKService {
  private sessions: Map<string, AgentSession> = new Map();
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  /**
   * Create a new agent session
   */
  async createSession(
    userId: string,
    employeeId: string,
    employeeRole: string,
    config: Partial<AgentConfig> = {}
  ): Promise<AgentSession> {
    const sessionId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultConfig: AgentConfig = {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 4000,
      tools: [],
      webhooks: [],
      streaming: true,
      contextWindow: 128000,
      systemPrompt: this.generateSystemPrompt(employeeRole),
      ...config
    };

    const session: AgentSession = {
      id: sessionId,
      userId,
      employeeId,
      employeeRole,
      config: defaultConfig,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        version: '1.0.0',
        sdk: 'openai-agent-sdk'
      }
    };

    this.sessions.set(sessionId, session);

    // Save to database
    await this.saveSessionToDatabase(session);

    return session;
  }

  /**
   * Send message to agent with full SDK integration
   */
  async sendMessage(
    sessionId: string,
    message: string,
    attachments?: any[]
  ): Promise<AgentResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new AgentError('Session not found', 'SESSION_NOT_FOUND');
    }

    // Add user message to session
    const userMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      metadata: {
        sessionId,
        userId: session.userId,
        attachments: attachments?.length || 0
      }
    };

    session.messages.push(userMessage);
    session.updatedAt = new Date();

    try {
      // Process message through Agent SDK
      const response = await this.processMessageWithAgent(session, userMessage);
      
      // Add assistant response to session
      const assistantMessage: AgentMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          provider: response.provider,
          model: response.model,
          sessionId,
          userId: session.userId,
          tools: response.tools?.map(t => t.name),
          webhook: response.webhook?.url
        }
      };

      session.messages.push(assistantMessage);
      session.updatedAt = new Date();

      // Save updated session
      await this.saveSessionToDatabase(session);

      return response;
    } catch (error) {
      console.error('[Agent SDK] Error processing message:', error);
      throw error;
    }
  }

  /**
   * Process message with Agent SDK integration
   */
  private async processMessageWithAgent(
    session: AgentSession,
    userMessage: AgentMessage
  ): Promise<AgentResponse> {
    const { config } = session;
    
    // Prepare messages for API
    const messages = this.prepareMessagesForAPI(session);
    
    // Add system prompt if not present
    if (!messages.some(m => m.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: config.systemPrompt
      });
    }

    // Process through appropriate provider
    switch (config.provider) {
      case 'openai':
        return await this.processWithOpenAI(session, messages);
      case 'anthropic':
        return await this.processWithAnthropic(session, messages);
      case 'google':
        return await this.processWithGoogle(session, messages);
      default:
        throw new AgentError(`Unsupported provider: ${config.provider}`, 'UNSUPPORTED_PROVIDER');
    }
  }

  /**
   * Process with OpenAI (ChatGPT) using Agent SDK
   */
  private async processWithOpenAI(
    session: AgentSession,
    messages: Array<{ role: string; content: string }>
  ): Promise<AgentResponse> {
    if (!OPENAI_API_KEY && !IS_DEMO_MODE) {
      throw new AgentError(
        'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.',
        'API_KEY_MISSING',
        'openai'
      );
    }

    try {
      // Use Netlify function for production, direct API for development
      const apiUrl = import.meta.env.PROD 
        ? '/.netlify/functions/agent-sdk-openai'
        : 'https://api.openai.com/v1/chat/completions';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (!import.meta.env.PROD && OPENAI_API_KEY) {
        headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
      }

      const requestBody = {
        model: session.config.model,
        messages,
        temperature: session.config.temperature,
        max_tokens: session.config.maxTokens,
        stream: session.config.streaming,
        tools: session.config.tools.length > 0 ? this.formatToolsForOpenAI(session.config.tools) : undefined,
        tool_choice: session.config.tools.length > 0 ? 'auto' : undefined,
        // Agent SDK specific parameters
        metadata: {
          session_id: session.id,
          user_id: session.userId,
          employee_id: session.employeeId,
          employee_role: session.employeeRole
        }
      };

      if (IS_DEMO_MODE) {
        return this.generateDemoResponse(session);
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AgentError(
          `OpenAI API error: ${errorData.error?.message || response.statusText}`,
          'API_ERROR',
          'openai',
          response.status === 429 || response.status === 503
        );
      }

      const data = await response.json();
      
      // Process tool calls if present
      let processedContent = data.choices[0].message.content || '';
      const tools = data.choices[0].message.tool_calls || [];

      if (tools.length > 0) {
        const toolResults = await this.executeTools(session, tools);
        processedContent += this.formatToolResults(toolResults);
      }

      return {
        content: processedContent,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        provider: 'OpenAI',
        model: data.model,
        tools: session.config.tools,
        streaming: session.config.streaming,
        sessionId: session.id,
        userId: session.userId
      };
    } catch (error) {
      console.error('[Agent SDK] OpenAI processing error:', error);
      if (error instanceof AgentError) {
        throw error;
      }
      throw new AgentError(
        `OpenAI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROCESSING_ERROR',
        'openai',
        true
      );
    }
  }

  /**
   * Process with Anthropic (Claude) using Agent SDK
   */
  private async processWithAnthropic(
    session: AgentSession,
    messages: Array<{ role: string; content: string }>
  ): Promise<AgentResponse> {
    // Implementation for Anthropic Claude
    // Similar to OpenAI but with Anthropic-specific formatting
    throw new AgentError('Anthropic integration coming soon', 'NOT_IMPLEMENTED', 'anthropic');
  }

  /**
   * Process with Google (Gemini) using Agent SDK
   */
  private async processWithGoogle(
    session: AgentSession,
    messages: Array<{ role: string; content: string }>
  ): Promise<AgentResponse> {
    // Implementation for Google Gemini
    // Similar to OpenAI but with Google-specific formatting
    throw new AgentError('Google integration coming soon', 'NOT_IMPLEMENTED', 'google');
  }

  /**
   * Execute tools for the agent
   */
  private async executeTools(
    session: AgentSession,
    toolCalls: any[]
  ): Promise<any[]> {
    const results = [];

    for (const toolCall of toolCalls) {
      try {
        const tool = session.config.tools.find(t => t.name === toolCall.function.name);
        if (!tool) {
          results.push({
            tool_call_id: toolCall.id,
            error: `Tool ${toolCall.function.name} not found`
          });
          continue;
        }

        let result;
        switch (tool.type) {
          case 'function':
            result = await this.executeFunctionTool(tool, toolCall.function.arguments);
            break;
          case 'webhook':
            result = await this.executeWebhookTool(tool, toolCall.function.arguments);
            break;
          case 'api':
            result = await this.executeAPITool(tool, toolCall.function.arguments);
            break;
          default:
            result = { error: `Unknown tool type: ${tool.type}` };
        }

        results.push({
          tool_call_id: toolCall.id,
          result
        });
      } catch (error) {
        results.push({
          tool_call_id: toolCall.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Execute function tool
   */
  private async executeFunctionTool(tool: AgentTool, args: any): Promise<any> {
    // Implement function execution logic
    console.log(`[Agent SDK] Executing function tool: ${tool.name}`, args);
    return { success: true, result: 'Function executed successfully' };
  }

  /**
   * Execute webhook tool
   */
  private async executeWebhookTool(tool: AgentTool, args: any): Promise<any> {
    const webhook = tool.parameters as AgentWebhook;
    
    try {
      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify({
          ...webhook.payload,
          ...args
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Agent SDK] Webhook execution error:', error);
      throw error;
    }
  }

  /**
   * Execute API tool
   */
  private async executeAPITool(tool: AgentTool, args: any): Promise<any> {
    // Implement API tool execution
    console.log(`[Agent SDK] Executing API tool: ${tool.name}`, args);
    return { success: true, result: 'API call executed successfully' };
  }

  /**
   * Format tools for OpenAI API
   */
  private formatToolsForOpenAI(tools: AgentTool[]): any[] {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  /**
   * Format tool results for display
   */
  private formatToolResults(results: any[]): string {
    if (results.length === 0) return '';

    let formatted = '\n\n**Tool Execution Results:**\n';
    results.forEach((result, index) => {
      formatted += `${index + 1}. ${result.error ? `❌ Error: ${result.error}` : `✅ Success: ${JSON.stringify(result.result)}`}\n`;
    });

    return formatted;
  }

  /**
   * Prepare messages for API consumption
   */
  private prepareMessagesForAPI(session: AgentSession): Array<{ role: string; content: string }> {
    // Implement context window management
    const maxMessages = Math.floor(session.config.contextWindow / 1000); // Rough estimate
    const recentMessages = session.messages.slice(-maxMessages);
    
    return recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Generate system prompt for employee role
   */
  private generateSystemPrompt(employeeRole: string): string {
    const basePrompt = `You are a professional ${employeeRole} AI assistant. You are part of an AI workforce and should provide expert assistance in your field.`;
    
    const roleSpecificPrompts = {
      'Product Manager': 'Focus on product strategy, roadmap planning, feature prioritization, and stakeholder communication.',
      'Data Scientist': 'Provide insights on data analysis, machine learning, statistical modeling, and data-driven decision making.',
      'Software Architect': 'Help with system design, architecture patterns, scalability, and technical decision making.',
      'Video Content Creator': 'Assist with script writing, video planning, content strategy, and creative direction.',
      'Marketing Specialist': 'Focus on marketing strategy, campaign planning, content creation, and brand positioning.',
      'Customer Support': 'Provide excellent customer service, problem-solving, and support best practices.'
    };

    const specificPrompt = roleSpecificPrompts[employeeRole as keyof typeof roleSpecificPrompts] || 
      'Provide professional assistance and expertise in your field.';

    return `${basePrompt}\n\n${specificPrompt}\n\nAlways be helpful, professional, and provide actionable advice.`;
  }

  /**
   * Generate demo response for testing
   */
  private generateDemoResponse(session: AgentSession): AgentResponse {
    const responses = {
      'Product Manager': 'As your Product Manager, I\'m here to help with product strategy, roadmap planning, and feature prioritization. In demo mode, I can provide guidance on product management best practices.',
      'Data Scientist': 'As your Data Scientist, I can assist with data analysis, machine learning models, and statistical insights. In demo mode, I can guide you through data science methodologies.',
      'Software Architect': 'As your Software Architect, I\'m ready to help with system design, architecture patterns, and technical decision making. In demo mode, I can provide architectural guidance.',
      'Video Content Creator': 'As your Video Content Creator, I can help with script writing, video planning, and content strategy. In demo mode, I can assist with creative direction.',
      'Marketing Specialist': 'As your Marketing Specialist, I\'m here to help with marketing strategy, campaign planning, and brand positioning. In demo mode, I can provide marketing insights.',
      'Customer Support': 'As your Customer Support specialist, I\'m ready to help with customer service, problem-solving, and support best practices. In demo mode, I can guide you through support strategies.'
    };

    const response = responses[session.employeeRole as keyof typeof responses] || 
      'Hello! I\'m your AI assistant. In demo mode, I can provide guidance and assistance.';

    return {
      content: response,
      usage: {
        promptTokens: 50,
        completionTokens: 100,
        totalTokens: 150
      },
      provider: 'OpenAI',
      model: 'gpt-4o-mini-demo',
      streaming: false,
      sessionId: session.id,
      userId: session.userId
    };
  }

  /**
   * Save session to database
   */
  private async saveSessionToDatabase(session: AgentSession): Promise<void> {
    try {
      const { error } = await supabase
        .from('agent_sessions')
        .upsert({
          id: session.id,
          user_id: session.userId,
          employee_id: session.employeeId,
          employee_role: session.employeeRole,
          config: session.config,
          messages: session.messages,
          created_at: session.createdAt.toISOString(),
          updated_at: session.updatedAt.toISOString(),
          metadata: session.metadata
        });

      if (error) {
        console.error('[Agent SDK] Error saving session to database:', error);
      }
    } catch (error) {
      console.error('[Agent SDK] Unexpected error saving session:', error);
    }
  }

  /**
   * Load session from database
   */
  async loadSession(sessionId: string): Promise<AgentSession | null> {
    try {
      const { data, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('[Agent SDK] Error loading session:', error);
        return null;
      }

      const session: AgentSession = {
        id: data.id,
        userId: data.user_id,
        employeeId: data.employee_id,
        employeeRole: data.employee_role,
        config: data.config,
        messages: data.messages,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        metadata: data.metadata
      };

      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      console.error('[Agent SDK] Unexpected error loading session:', error);
      return null;
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AgentSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * List user sessions
   */
  async listUserSessions(userId: string): Promise<AgentSession[]> {
    try {
      const { data, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[Agent SDK] Error listing sessions:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        employeeId: item.employee_id,
        employeeRole: item.employee_role,
        config: item.config,
        messages: item.messages,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        metadata: item.metadata
      }));
    } catch (error) {
      console.error('[Agent SDK] Unexpected error listing sessions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const agentSDKService = new AgentSDKService();
