/**
 * Enhanced AI Employee Service
 * Integrates provider-optimized system prompts and tools for AI employees
 * Based on latest documentation from OpenAI, Anthropic, Google, and Perplexity
 */

import { getProviderOptimizedPrompt, getProviderCapabilities } from '@/prompts/provider-optimized-prompts';
import { 
  getToolsForProvider, 
  formatToolsForOpenAI, 
  formatToolsForAnthropic, 
  formatToolsForGoogle, 
  formatToolsForPerplexity,
  ToolExecutor
} from '@/services/provider-tools-integration';
import { sendAIMessage } from '@/services/enhanced-ai-chat-service-v2';
import { streamAIResponse } from '@/services/enhanced-streaming-service';

export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  category: string;
  description: string;
  provider: 'openai' | 'anthropic' | 'google' | 'perplexity';
  price: number;
  avatar: string;
  skills: string[];
  specialty: string;
  fitLevel: 'excellent' | 'good';
  defaultTools?: string[];
}

export interface EmployeeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  toolCalls?: any[];
  toolResults?: any[];
}

export interface EmployeeResponse {
  content: string;
  toolCalls?: any[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  provider?: string;
}

export interface EmployeeConfig {
  employee: AIEmployee;
  enableTools?: boolean;
  enableStreaming?: boolean;
  temperature?: number;
  maxTokens?: number;
  customSystemPrompt?: string;
}

export class EnhancedAIEmployeeService {
  private toolExecutor: ToolExecutor;
  
  constructor() {
    this.toolExecutor = ToolExecutor.getInstance();
  }

  /**
   * Send message to AI employee with provider-optimized prompts and tools
   */
  async sendMessage(
    config: EmployeeConfig,
    messages: EmployeeMessage[],
    attachments?: any[]
  ): Promise<EmployeeResponse> {
    const { employee, enableTools = true, enableStreaming = false, ...chatConfig } = config;
    
    // Get provider-optimized system prompt
    const optimizedPrompt = getProviderOptimizedPrompt(employee.provider, employee.role);
    const systemPrompt = optimizedPrompt?.systemPrompt || this.getDefaultSystemPrompt(employee);
    
    // Get tools for the provider
    const tools = enableTools ? getToolsForProvider(employee.provider) : [];
    const formattedTools = this.formatToolsForProvider(employee.provider, tools);
    
    // Prepare messages with system prompt
    const messagesWithSystem = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.filter(m => m.role !== 'system')
    ];

    // Handle streaming vs non-streaming
    if (enableStreaming) {
      return this.handleStreamingResponse(employee, messagesWithSystem, formattedTools, chatConfig);
    } else {
      return this.handleRegularResponse(employee, messagesWithSystem, formattedTools, chatConfig);
    }
  }

  /**
   * Handle streaming response with tool execution
   */
  private async handleStreamingResponse(
    employee: AIEmployee,
    messages: EmployeeMessage[],
    tools: any[],
    config: any
  ): Promise<EmployeeResponse> {
    let finalContent = '';
    let toolCalls: any[] = [];
    
    try {
      await streamAIResponse(
        employee.provider,
        messages.map(m => ({ role: m.role, content: m.content })),
        (chunk) => {
          if (chunk.content) {
            finalContent += chunk.content;
          }
          
          if (chunk.isComplete) {
            // Process any tool calls in the final content
            const extractedToolCalls = this.extractToolCalls(finalContent);
            if (extractedToolCalls.length > 0) {
              toolCalls = extractedToolCalls;
              this.executeTools(extractedToolCalls);
            }
          }
        },
        {
          ...config,
          systemPrompt: this.getSystemPrompt(employee),
          enableTools: tools.length > 0,
          tools
        }
      );
      
      return {
        content: finalContent,
        toolCalls,
        provider: employee.provider
      };
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }

  /**
   * Handle regular response with tool execution
   */
  private async handleRegularResponse(
    employee: AIEmployee,
    messages: EmployeeMessage[],
    tools: any[],
    config: any
  ): Promise<EmployeeResponse> {
    try {
      const response = await sendAIMessage(
        employee.provider,
        messages.map(m => ({ role: m.role, content: m.content })),
        employee.role,
        attachments,
        {
          ...config,
          systemPrompt: this.getSystemPrompt(employee),
          enableTools: tools.length > 0,
          tools
        }
      );
      
      // Extract and execute tool calls
      const toolCalls = this.extractToolCalls(response.content);
      if (toolCalls.length > 0) {
        const toolResults = await this.executeTools(toolCalls);
        return {
          ...response,
          toolCalls,
          toolResults
        };
      }
      
      return response;
    } catch (error) {
      console.error('Regular response error:', error);
      throw error;
    }
  }

  /**
   * Extract tool calls from response content
   */
  private extractToolCalls(content: string): any[] {
    const toolCalls: any[] = [];
    
    // OpenAI format
    const openaiMatches = content.match(/<function_calls>[\s\S]*?<\/function_calls>/g);
    if (openaiMatches) {
      openaiMatches.forEach(match => {
        const toolMatch = match.match(/<invoke name="([^"]+)">[\s\S]*?<\/invoke>/g);
        if (toolMatch) {
          toolMatch.forEach(tool => {
            const nameMatch = tool.match(/name="([^"]+)"/);
            const paramMatches = tool.match(/<parameter name="([^"]+)">([^<]+)<\/parameter>/g);
            
            if (nameMatch) {
              const parameters: any = {};
              if (paramMatches) {
                paramMatches.forEach(param => {
                  const paramMatch = param.match(/name="([^"]+)">([^<]+)<\/parameter>/);
                  if (paramMatch) {
                    parameters[paramMatch[1]] = paramMatch[2];
                  }
                });
              }
              
              toolCalls.push({
                tool: nameMatch[1],
                parameters
              });
            }
          });
        }
      });
    }
    
    // Anthropic format
    const anthropicMatches = content.match(/<tool_invocation>[\s\S]*?<\/tool_invocation>/g);
    if (anthropicMatches) {
      anthropicMatches.forEach(match => {
        try {
          const jsonMatch = match.match(/<tool_invocation>([\s\S]*?)<\/tool_invocation>/);
          if (jsonMatch) {
            const toolCall = JSON.parse(jsonMatch[1]);
            toolCalls.push(toolCall);
          }
        } catch (e) {
          console.warn('Failed to parse Anthropic tool call:', e);
        }
      });
    }
    
    return toolCalls;
  }

  /**
   * Execute tools and return results
   */
  private async executeTools(toolCalls: any[]): Promise<any[]> {
    const results = [];
    
    for (const toolCall of toolCalls) {
      try {
        const result = await this.toolExecutor.executeTool(toolCall);
        results.push({
          tool: toolCall.tool,
          result,
          success: true
        });
      } catch (error) {
        results.push({
          tool: toolCall.tool,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }
    
    return results;
  }

  /**
   * Get system prompt for employee
   */
  private getSystemPrompt(employee: AIEmployee): string {
    const optimizedPrompt = getProviderOptimizedPrompt(employee.provider, employee.role);
    return optimizedPrompt?.systemPrompt || this.getDefaultSystemPrompt(employee);
  }

  /**
   * Get default system prompt for employee
   */
  private getDefaultSystemPrompt(employee: AIEmployee): string {
    return `You are ${employee.name}, a ${employee.role} specializing in ${employee.specialty}.

## YOUR EXPERTISE
${employee.skills.map(skill => `- ${skill}`).join('\n')}

## YOUR ROLE
${employee.description}

## COMMUNICATION STYLE
- Professional yet approachable
- Focused on delivering value
- Ask clarifying questions when needed
- Provide actionable solutions
- Share relevant examples and insights

## TOOLS AVAILABLE
${employee.defaultTools?.map(tool => `- ${tool}`).join('\n') || 'No specific tools configured'}

Remember: You are an expert in your field. Provide detailed, professional advice and solutions based on your expertise.`;
  }

  /**
   * Format tools for specific provider
   */
  private formatToolsForProvider(provider: string, tools: any[]): any[] {
    switch (provider) {
      case 'openai':
        return formatToolsForOpenAI(tools);
      case 'anthropic':
        return formatToolsForAnthropic(tools);
      case 'google':
        return formatToolsForGoogle(tools);
      case 'perplexity':
        return formatToolsForPerplexity(tools);
      default:
        return [];
    }
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(provider: string): string[] {
    return getProviderCapabilities(provider as any);
  }

  /**
   * Get available tools for provider
   */
  getAvailableTools(provider: string): any[] {
    return getToolsForProvider(provider as any);
  }

  /**
   * Test employee configuration
   */
  async testEmployee(config: EmployeeConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const testMessage: EmployeeMessage = {
        role: 'user',
        content: 'Hello! Can you introduce yourself and tell me about your capabilities?',
        timestamp: new Date()
      };

      const response = await this.sendMessage(config, [testMessage]);
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

// Export the service class
export const enhancedAIEmployeeService = new EnhancedAIEmployeeService();
