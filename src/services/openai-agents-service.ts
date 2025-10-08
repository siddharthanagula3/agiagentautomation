/**
 * OpenAI Agents Service
 * Implements custom agent orchestration using the OpenAI SDK
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { supabase } from '@/lib/supabase-client';
import type { PurchasedEmployee } from '@/types/employee';

// Agent configuration interface
export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  instructions: string;
  model?: string;
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
}

// Tool definition interface
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
    execute?: (args: any) => Promise<any>;
  };
}

// Agent interface
export interface Agent {
  id: string;
  name: string;
  instructions: string;
  model: string;
  tools: ToolDefinition[];
  temperature: number;
  maxTokens: number;
}

// Conversation state interface
export interface ConversationState {
  conversationId: string;
  agentId: string;
  userId: string;
  messages: Message[];
  currentAgent?: string;
  metadata?: Record<string, any>;
}

// Message interface
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
  tools?: string[];
  metadata?: Record<string, any>;
}

// Agent session interface
export interface AgentSession {
  sessionId: string;
  agent: Agent;
  conversationState: ConversationState;
}

// User context for dependency injection
export interface UserContext {
  userId: string;
  userName?: string;
  isProUser: boolean;
  organizationId?: string;
  metadata?: Record<string, any>;
}

class OpenAIAgentsService {
  private openai: OpenAI;
  private agents: Map<string, Agent> = new Map();
  private sessions: Map<string, AgentSession> = new Map();
  private activeConversations: Map<string, ConversationState> = new Map();
  private toolExecutors: Map<string, (args: any) => Promise<any>> = new Map();

  constructor() {
    // Initialize OpenAI client
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // For client-side usage
    });
    console.log('OpenAI Agents Service initialized');
  }

  /**
   * Create an agent from an AI employee configuration
   */
  createAgentFromEmployee(employee: PurchasedEmployee): Agent {
    const tools = this.createAgentTools(employee.capabilities || []);
    
    const agent: Agent = {
      id: employee.id,
      name: employee.name,
      instructions: this.generateInstructions(employee),
      model: 'gpt-4o',
      tools,
      temperature: 0.7,
      maxTokens: 4000,
    };

    // Store agent for later reference
    this.agents.set(agent.id, agent);

    return agent;
  }

  /**
   * Generate instructions for an agent based on employee data
   */
  private generateInstructions(employee: PurchasedEmployee): string {
    const baseInstructions = `
You are ${employee.name}, a professional ${employee.role}.
${employee.description}

Your core responsibilities:
${(employee.capabilities || []).map(cap => `- ${cap}`).join('\n')}

Guidelines:
- Provide expert assistance in your field of expertise
- Be professional, helpful, and accurate
- Use tools when necessary to complete tasks
- Ask clarifying questions when needed
- Maintain context throughout the conversation
- Provide actionable insights and recommendations
    `.trim();

    return baseInstructions;
  }

  /**
   * Create tools for an agent based on capabilities
   */
  private createAgentTools(capabilities: string[]): ToolDefinition[] {
    const tools: ToolDefinition[] = [];

    // Web Search Tool
    if (capabilities.some(cap => cap.toLowerCase().includes('research') || cap.toLowerCase().includes('search'))) {
      const toolName = 'web_search';
      tools.push({
        type: 'function',
        function: {
          name: toolName,
          description: 'Search the web for information',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of results to return',
                default: 5,
              },
            },
            required: ['query'],
          },
        },
      });

      // Register executor
      this.toolExecutors.set(toolName, async ({ query, maxResults = 5 }) => {
        return `Search results for "${query}": [simulated ${maxResults} results]`;
      });
    }

    // Code Interpreter Tool
    if (capabilities.some(cap => cap.toLowerCase().includes('code') || cap.toLowerCase().includes('programming'))) {
      const toolName = 'code_interpreter';
      tools.push({
        type: 'function',
        function: {
          name: toolName,
          description: 'Execute code and return results',
          parameters: {
            type: 'object',
            properties: {
              language: {
                type: 'string',
                description: 'Programming language',
              },
              code: {
                type: 'string',
                description: 'Code to execute',
              },
            },
            required: ['language', 'code'],
          },
        },
      });

      // Register executor
      this.toolExecutors.set(toolName, async ({ language, code }) => {
        return `Code executed successfully: [${language}] ${code.substring(0, 50)}...`;
      });
    }

    // Data Analysis Tool
    if (capabilities.some(cap => cap.toLowerCase().includes('data') || cap.toLowerCase().includes('analysis'))) {
      const toolName = 'data_analysis';
      tools.push({
        type: 'function',
        function: {
          name: toolName,
          description: 'Analyze data and provide insights',
          parameters: {
            type: 'object',
            properties: {
              data: {
                type: 'string',
                description: 'Data to analyze',
              },
              analysisType: {
                type: 'string',
                description: 'Type of analysis to perform',
              },
            },
            required: ['data', 'analysisType'],
          },
        },
      });

      // Register executor
      this.toolExecutors.set(toolName, async ({ data, analysisType }) => {
        return `Analysis complete: ${analysisType} on provided data`;
      });
    }

    return tools;
  }

  /**
   * Start a new agent session
   */
  async startSession(
    userId: string,
    agentId: string,
    agent: Agent
  ): Promise<AgentSession> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const conversationState: ConversationState = {
      conversationId,
      agentId,
      userId,
      messages: [],
      currentAgent: agent.name,
      metadata: {
        startTime: new Date(),
        model: agent.model,
      },
    };

    const session: AgentSession = {
      sessionId,
      agent,
      conversationState,
    };

    this.sessions.set(sessionId, session);
    this.activeConversations.set(conversationId, conversationState);

    // Store session in database
    await this.storeSessionInDB(session);

    return session;
  }

  /**
   * Send a message to an agent and get response
   */
  async sendMessage(
    sessionId: string,
    message: string,
    context?: UserContext
  ): Promise<Message> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add user message to conversation
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    session.conversationState.messages.push(userMessage);

    try {
      // Prepare messages for OpenAI
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: session.agent.instructions,
        },
        ...session.conversationState.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
      ];

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: session.agent.model,
        messages,
        tools: session.agent.tools.length > 0 ? session.agent.tools : undefined,
        temperature: session.agent.temperature,
        max_tokens: session.agent.maxTokens,
      });

      const response = completion.choices[0]?.message;
      const toolsUsed: string[] = [];

      // Handle tool calls if any
      if (response?.tool_calls) {
        for (const toolCall of response.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          const executor = this.toolExecutors.get(toolName);
          
          if (executor) {
            toolsUsed.push(toolName);
            await executor(toolArgs);
          }
        }
      }

      // Create assistant message from result
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response?.content || 'No response generated',
        timestamp: new Date(),
        agentName: session.agent.name,
        tools: toolsUsed,
        metadata: {
          model: session.agent.model,
          toolCalls: response?.tool_calls?.length || 0,
        },
      };

      // Add assistant message to conversation
      session.conversationState.messages.push(assistantMessage);

      // Store messages in database
      await this.storeMessageInDB(session.conversationState.conversationId, userMessage);
      await this.storeMessageInDB(session.conversationState.conversationId, assistantMessage);

      return assistantMessage;
    } catch (error) {
      console.error('Error running agent:', error);
      throw error;
    }
  }

  /**
   * Stream a response from an agent
   */
  async *streamMessage(
    sessionId: string,
    message: string,
    context?: UserContext
  ): AsyncGenerator<string, void, unknown> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add user message to conversation
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    session.conversationState.messages.push(userMessage);

    try {
      // Prepare messages for OpenAI
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: session.agent.instructions,
        },
        ...session.conversationState.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
      ];

      // Stream from OpenAI
      const stream = await this.openai.chat.completions.create({
        model: session.agent.model,
        messages,
        tools: session.agent.tools.length > 0 ? session.agent.tools : undefined,
        temperature: session.agent.temperature,
        max_tokens: session.agent.maxTokens,
        stream: true,
      });

      let fullContent = '';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          yield delta;
        }
      }

      // Create and store the complete assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
        agentName: session.agent.name,
      };

      session.conversationState.messages.push(assistantMessage);
      await this.storeMessageInDB(session.conversationState.conversationId, userMessage);
      await this.storeMessageInDB(session.conversationState.conversationId, assistantMessage);
    } catch (error) {
      console.error('Error streaming from agent:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): Message[] {
    const conversation = this.activeConversations.get(conversationId);
    return conversation?.messages || [];
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): AgentSession[] {
    const userSessions: AgentSession[] = [];
    this.sessions.forEach(session => {
      if (session.conversationState.userId === userId) {
        userSessions.push(session);
      }
    });
    return userSessions;
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Update session end time in database
      await this.updateSessionEndTime(sessionId);
      
      // Remove from active sessions
      this.sessions.delete(sessionId);
      this.activeConversations.delete(session.conversationState.conversationId);
    }
  }

  /**
   * Store session in database
   */
  private async storeSessionInDB(session: AgentSession): Promise<void> {
    const { error } = await supabase.from('agent_sessions').insert({
      session_id: session.sessionId,
      conversation_id: session.conversationState.conversationId,
      user_id: session.conversationState.userId,
      agent_id: session.conversationState.agentId,
      agent_name: session.agent.name,
      metadata: session.conversationState.metadata,
      started_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error storing session:', error);
    }
  }

  /**
   * Store message in database
   */
  private async storeMessageInDB(conversationId: string, message: Message): Promise<void> {
    const { error } = await supabase.from('agent_messages').insert({
      message_id: message.id,
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      agent_name: message.agentName,
      metadata: message.metadata,
      created_at: message.timestamp.toISOString(),
    });

    if (error) {
      console.error('Error storing message:', error);
    }
  }

  /**
   * Update session end time
   */
  private async updateSessionEndTime(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('agent_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error updating session end time:', error);
    }
  }

  /**
   * Load session from database
   */
  async loadSession(sessionId: string): Promise<AgentSession | null> {
    const { data: sessionData, error: sessionError } = await supabase
      .from('agent_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return null;
    }

    // Load messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', sessionData.conversation_id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error loading messages:', messagesError);
    }

    // Recreate conversation state
    const conversationState: ConversationState = {
      conversationId: sessionData.conversation_id,
      agentId: sessionData.agent_id,
      userId: sessionData.user_id,
      messages: messages?.map(msg => ({
        id: msg.message_id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        agentName: msg.agent_name,
        metadata: msg.metadata,
      })) || [],
      currentAgent: sessionData.agent_name,
      metadata: sessionData.metadata,
    };

    // Recreate agent (would need to fetch employee data)
    const agent = this.agents.get(sessionData.agent_id);
    if (!agent) {
      console.warn('Agent not found in cache, need to recreate');
      return null;
    }

    const session: AgentSession = {
      sessionId,
      agent,
      conversationState,
    };

    this.sessions.set(sessionId, session);
    this.activeConversations.set(conversationState.conversationId, conversationState);

    return session;
  }
}

// Export singleton instance
export const openAIAgentsService = new OpenAIAgentsService();
