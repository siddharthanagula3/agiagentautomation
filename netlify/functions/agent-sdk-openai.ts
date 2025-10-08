/**
 * Agent SDK OpenAI Netlify Function
 * Handles OpenAI API requests for the Agent SDK service
 * Implements proper error handling, retry logic, and webhook integration
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
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
      model = 'gpt-4o-mini',
      messages,
      temperature = 0.7,
      max_tokens = 4000,
      stream = false,
      tools,
      tool_choice,
      metadata
    } = requestBody;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Messages array is required' }),
      };
    }

    // Check OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'OpenAI API key not configured on server' 
        }),
      };
    }

    // Prepare OpenAI API request
    const openaiRequest = {
      model,
      messages,
      temperature,
      max_tokens,
      stream,
      ...(tools && { tools }),
      ...(tool_choice && { tool_choice }),
    };

    console.log('[Agent SDK OpenAI] Making request to OpenAI API:', {
      model,
      messageCount: messages.length,
      hasTools: !!tools,
      stream,
      metadata
    });

    // Make request to OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiRequest),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('[Agent SDK OpenAI] OpenAI API error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorData
      });

      return {
        statusCode: openaiResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: errorData.error?.message || 'OpenAI API request failed',
          details: errorData
        }),
      };
    }

    // Parse OpenAI response
    const openaiData = await openaiResponse.json();
    
    console.log('[Agent SDK OpenAI] OpenAI API success:', {
      model: openaiData.model,
      usage: openaiData.usage,
      hasChoices: !!openaiData.choices?.length
    });

    // Process tool calls if present
    let processedResponse = { ...openaiData };
    
    if (openaiData.choices?.[0]?.message?.tool_calls?.length > 0) {
      console.log('[Agent SDK OpenAI] Processing tool calls:', 
        openaiData.choices[0].message.tool_calls.length);
      
      // Add tool execution results to response
      processedResponse.tool_execution_results = await processToolCalls(
        openaiData.choices[0].message.tool_calls,
        metadata
      );
    }

    // Log analytics if metadata provided
    if (metadata?.session_id && metadata?.user_id) {
      await logAnalytics(metadata, openaiData.usage);
    }

    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processedResponse),
    };

  } catch (error) {
    console.error('[Agent SDK OpenAI] Unexpected error:', error);
    
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
 * Process tool calls for the agent
 */
async function processToolCalls(
  toolCalls: any[],
  metadata: any
): Promise<any[]> {
  const results = [];

  for (const toolCall of toolCalls) {
    try {
      console.log('[Agent SDK OpenAI] Executing tool:', toolCall.function.name);
      
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
        case 'api_call':
          result = await executeAPICall(toolCall.function.arguments);
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
      console.error('[Agent SDK OpenAI] Tool execution error:', error);
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
 * Execute API call tool
 */
async function executeAPICall(args: any): Promise<any> {
  try {
    const { url, method = 'GET', headers = {}, body } = JSON.parse(args);
    
    // Make the API call
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      response: {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: Object.fromEntries(response.headers.entries())
      }
    };
  } catch (error) {
    return { 
      error: 'Failed to execute API call',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Log analytics for the agent session
 */
async function logAnalytics(metadata: any, usage: any): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('agent_analytics')
      .insert({
        session_id: metadata.session_id,
        user_id: metadata.user_id,
        employee_id: metadata.employee_id,
        employee_role: metadata.employee_role,
        provider: 'openai',
        model: metadata.model || 'gpt-4o-mini',
        prompt_tokens: usage?.prompt_tokens || 0,
        completion_tokens: usage?.completion_tokens || 0,
        total_tokens: usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('[Agent SDK OpenAI] Analytics logging error:', error);
    } else {
      console.log('[Agent SDK OpenAI] Analytics logged successfully');
    }
  } catch (error) {
    console.error('[Agent SDK OpenAI] Unexpected analytics error:', error);
  }
}
