/**
 * Agent Send API - Send messages to Agent SDK and handle responses
 * Processes user messages, forwards to Agent SDK, and persists responses
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    const {
      sessionId,
      message,
      userId,
      attachments = []
    } = requestBody;

    // Validate required fields
    if (!sessionId || !message || !userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: sessionId, message, userId' 
        }),
      };
    }

    console.log('[Agent Send] Processing message:', { sessionId, userId, messageLength: message.length });

    // Get session from database
    const { data: session, error: sessionError } = await supabase
      .from('agent_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      console.error('[Agent Send] Session not found:', sessionError);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Session not found' }),
      };
    }

    // Create user message record
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      metadata: {
        sessionId,
        userId,
        attachments: attachments.length
      }
    };

    // Add user message to session
    const updatedMessages = [...(session.messages || []), userMessage];

    // Update session with user message
    await supabase
      .from('agent_sessions')
      .update({
        messages: updatedMessages,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Process message through Agent SDK
    const agentResponse = await processMessageWithAgent(session, userMessage);

    // Create assistant message record
    const assistantMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: agentResponse.content,
      timestamp: new Date().toISOString(),
      metadata: {
        provider: agentResponse.provider,
        model: agentResponse.model,
        sessionId,
        userId,
        tools: agentResponse.tools?.map(t => t.name),
        webhook: agentResponse.webhook?.url,
        usage: agentResponse.usage
      }
    };

    // Add assistant message to session
    const finalMessages = [...updatedMessages, assistantMessage];

    // Update session with assistant response
    await supabase
      .from('agent_sessions')
      .update({
        messages: finalMessages,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Log analytics
    if (agentResponse.usage) {
      await logAnalytics(session, agentResponse.usage);
    }

    console.log('[Agent Send] Message processed successfully');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        response: agentResponse,
        message: 'Message processed successfully'
      }),
    };

  } catch (error) {
    console.error('[Agent Send] Error processing message:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

/**
 * Process message with Agent SDK
 */
async function processMessageWithAgent(session: any, userMessage: any): Promise<any> {
  const { config } = session;
  
  // Prepare messages for API
  const messages = prepareMessagesForAPI(session);
  
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
      return await processWithOpenAI(session, messages);
    case 'anthropic':
      return await processWithAnthropic(session, messages);
    case 'google':
      return await processWithGoogle(session, messages);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

/**
 * Process with OpenAI (ChatGPT) using Agent SDK patterns
 */
async function processWithOpenAI(session: any, messages: Array<{ role: string; content: string }>): Promise<any> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Use Netlify function for production, direct API for development
    const apiUrl = import.meta.env.PROD 
      ? '/.netlify/functions/agent-sdk-openai'
      : 'https://api.openai.com/v1/chat/completions';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!import.meta.env.PROD) {
      headers['Authorization'] = `Bearer ${openaiApiKey}`;
    }

    const requestBody = {
      model: session.config.model,
      messages,
      temperature: session.config.temperature,
      max_tokens: session.config.maxTokens,
      stream: false, // Disable streaming for now
      tools: session.config.tools.length > 0 ? formatToolsForOpenAI(session.config.tools) : undefined,
      tool_choice: session.config.tools.length > 0 ? 'auto' : undefined,
      metadata: {
        session_id: session.id,
        user_id: session.user_id,
        employee_id: session.employee_id,
        employee_role: session.employee_role
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Process tool calls if present
    let processedContent = data.choices[0].message.content || '';
    const tools = data.choices[0].message.tool_calls || [];

    if (tools.length > 0) {
      const toolResults = await executeTools(session, tools);
      processedContent += formatToolResults(toolResults);
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
      streaming: false
    };
  } catch (error) {
    console.error('[Agent Send] OpenAI processing error:', error);
    throw error;
  }
}

/**
 * Process with Anthropic (Claude) - Placeholder
 */
async function processWithAnthropic(session: any, messages: Array<{ role: string; content: string }>): Promise<any> {
  // Implementation for Anthropic Claude
  throw new Error('Anthropic integration coming soon');
}

/**
 * Process with Google (Gemini) - Placeholder
 */
async function processWithGoogle(session: any, messages: Array<{ role: string; content: string }>): Promise<any> {
  // Implementation for Google Gemini
  throw new Error('Google integration coming soon');
}

/**
 * Execute tools for the agent
 */
async function executeTools(session: any, toolCalls: any[]): Promise<any[]> {
  const results = [];

  for (const toolCall of toolCalls) {
    try {
      console.log('[Agent Send] Executing tool:', toolCall.function.name);
      
      // Execute tool based on type
      let result;
      switch (toolCall.function.name) {
        case 'web_search':
          result = await executeWebSearch(toolCall.function.arguments);
          break;
        case 'code_analysis':
          result = await executeCodeAnalysis(toolCall.function.arguments);
          break;
        case 'data_processing':
          result = await executeDataProcessing(toolCall.function.arguments);
          break;
        case 'content_generation':
          result = await executeContentGeneration(toolCall.function.arguments);
          break;
        case 'fetch_page':
          result = await executeFetchPage(toolCall.function.arguments);
          break;
        default:
          result = { error: `Unknown tool: ${toolCall.function.name}` };
      }

      results.push({
        tool_call_id: toolCall.id,
        tool_name: toolCall.function.name,
        result
      });

    } catch (error) {
      console.error('[Agent Send] Tool execution error:', error);
      results.push({
        tool_call_id: toolCall.id,
        tool_name: toolCall.function.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Execute web search tool
 */
async function executeWebSearch(args: any): Promise<any> {
  try {
    const { query, max_results = 5 } = JSON.parse(args);
    
    // Use a web search API (you can integrate with Google Search, Bing, etc.)
    // For now, return a mock result
    return {
      success: true,
      results: [
        {
          title: `Search results for: ${query}`,
          snippet: 'This is a mock search result. In production, integrate with a real search API.',
          url: 'https://example.com',
          relevance_score: 0.95
        }
      ],
      query,
      total_results: 1
    };
  } catch (error) {
    return { error: 'Failed to execute web search' };
  }
}

/**
 * Execute code analysis tool
 */
async function executeCodeAnalysis(args: any): Promise<any> {
  try {
    const { code, language, analysis_type = 'general' } = JSON.parse(args);
    
    // Mock code analysis
    return {
      success: true,
      analysis: {
        language,
        lines_of_code: code.split('\n').length,
        complexity_score: Math.random() * 10,
        suggestions: [
          'Consider adding error handling',
          'Optimize for performance',
          'Add documentation'
        ],
        issues: [],
        metrics: {
          cyclomatic_complexity: Math.floor(Math.random() * 20),
          maintainability_index: Math.floor(Math.random() * 100)
        }
      }
    };
  } catch (error) {
    return { error: 'Failed to analyze code' };
  }
}

/**
 * Execute data processing tool
 */
async function executeDataProcessing(args: any): Promise<any> {
  try {
    const { data, operation, parameters } = JSON.parse(args);
    
    // Mock data processing
    return {
      success: true,
      result: {
        operation,
        processed_records: Array.isArray(data) ? data.length : 1,
        summary: 'Data processed successfully',
        insights: [
          'Data quality: Good',
          'Missing values: 0',
          'Outliers detected: 2'
        ]
      }
    };
  } catch (error) {
    return { error: 'Failed to process data' };
  }
}

/**
 * Execute content generation tool
 */
async function executeContentGeneration(args: any): Promise<any> {
  try {
    const { content_type, topic, length = 'medium' } = JSON.parse(args);
    
    // Mock content generation
    return {
      success: true,
      content: {
        type: content_type,
        topic,
        length,
        generated_content: `This is a mock ${content_type} about ${topic}. In production, this would generate actual content.`,
        word_count: Math.floor(Math.random() * 500) + 100,
        readability_score: Math.floor(Math.random() * 100)
      }
    };
  } catch (error) {
    return { error: 'Failed to generate content' };
  }
}

/**
 * Execute fetch page tool (web content fetching)
 */
async function executeFetchPage(args: any): Promise<any> {
  try {
    const { url } = JSON.parse(args);
    
    // Call the fetch page endpoint
    const response = await fetch('/.netlify/functions/fetch-page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    return { 
      error: 'Failed to fetch page',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Format tools for OpenAI API
 */
function formatToolsForOpenAI(tools: any[]): any[] {
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
function formatToolResults(results: any[]): string {
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
function prepareMessagesForAPI(session: any): Array<{ role: string; content: string }> {
  // Implement context window management
  const maxMessages = Math.floor(session.config.contextWindow / 1000); // Rough estimate
  const recentMessages = (session.messages || []).slice(-maxMessages);
  
  return recentMessages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

/**
 * Log analytics for the agent session
 */
async function logAnalytics(session: any, usage: any): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('agent_analytics')
      .insert({
        session_id: session.id,
        user_id: session.user_id,
        employee_id: session.employee_id,
        employee_role: session.employee_role,
        provider: 'openai',
        model: session.config.model || 'gpt-4o-mini',
        prompt_tokens: usage.promptTokens || 0,
        completion_tokens: usage.completionTokens || 0,
        total_tokens: usage.totalTokens || 0,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('[Agent Send] Analytics logging error:', error);
    } else {
      console.log('[Agent Send] Analytics logged successfully');
    }
  } catch (error) {
    console.error('[Agent Send] Unexpected analytics error:', error);
  }
}
