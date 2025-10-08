/**
 * Agent Session API - Create and manage Agent SDK sessions
 * Handles session creation, retrieval, and management for ChatGPT-powered AI Employees
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
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  try {
    // Parse request body for POST/PUT requests
    const requestBody = event.body ? JSON.parse(event.body) : {};
    const { method } = event;

    // Route to appropriate handler
    switch (method) {
      case 'GET':
        return await handleGetSession(event);
      case 'POST':
        return await handleCreateSession(requestBody);
      case 'PUT':
        return await handleUpdateSession(requestBody);
      case 'DELETE':
        return await handleDeleteSession(requestBody);
      default:
        return {
          statusCode: 405,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

  } catch (error) {
    console.error('[Agent Session] Error:', error);
    
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
 * Handle GET request - Retrieve session
 */
async function handleGetSession(event: HandlerEvent) {
  const sessionId = event.queryStringParameters?.sessionId;
  const userId = event.queryStringParameters?.userId;

  if (!sessionId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Session ID is required' }),
    };
  }

  try {
    // Get session from database
    const { data: session, error } = await supabase
      .from('agent_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('[Agent Session] Error fetching session:', error);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Session not found' }),
      };
    }

    // Verify user access (RLS should handle this, but double-check)
    if (userId && session.user_id !== userId) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session }),
    };

  } catch (error) {
    console.error('[Agent Session] Error in handleGetSession:', error);
    throw error;
  }
}

/**
 * Handle POST request - Create new session
 */
async function handleCreateSession(requestBody: any) {
  const {
    userId,
    employeeId,
    employeeRole,
    employeeName,
    config = {}
  } = requestBody;

  // Validate required fields
  if (!userId || !employeeId || !employeeRole) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Missing required fields: userId, employeeId, employeeRole' 
      }),
    };
  }

  try {
    // Generate session ID
    const sessionId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Default configuration
    const defaultConfig = {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 4000,
      streaming: true,
      contextWindow: 128000,
      systemPrompt: generateSystemPrompt(employeeRole, employeeName),
      tools: getDefaultTools(employeeRole),
      webhooks: [],
      ...config
    };

    // Create session record
    const sessionData = {
      id: sessionId,
      user_id: userId,
      employee_id: employeeId,
      employee_role: employeeRole,
      config: defaultConfig,
      messages: [],
      metadata: {
        version: '1.0.0',
        sdk: 'openai-agent-sdk',
        employeeName: employeeName || employeeRole,
        channel: 'ai_employees'
      }
    };

    // Insert into database
    const { data: session, error } = await supabase
      .from('agent_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('[Agent Session] Error creating session:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Failed to create session',
          details: error.message 
        }),
      };
    }

    console.log('[Agent Session] Session created:', sessionId);

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        session,
        message: 'Session created successfully' 
      }),
    };

  } catch (error) {
    console.error('[Agent Session] Error in handleCreateSession:', error);
    throw error;
  }
}

/**
 * Handle PUT request - Update session
 */
async function handleUpdateSession(requestBody: any) {
  const { sessionId, updates } = requestBody;

  if (!sessionId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Session ID is required' }),
    };
  }

  try {
    // Update session in database
    const { data: session, error } = await supabase
      .from('agent_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('[Agent Session] Error updating session:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Failed to update session',
          details: error.message 
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        session,
        message: 'Session updated successfully' 
      }),
    };

  } catch (error) {
    console.error('[Agent Session] Error in handleUpdateSession:', error);
    throw error;
  }
}

/**
 * Handle DELETE request - Delete session
 */
async function handleDeleteSession(requestBody: any) {
  const { sessionId } = requestBody;

  if (!sessionId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Session ID is required' }),
    };
  }

  try {
    // Delete session from database
    const { error } = await supabase
      .from('agent_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('[Agent Session] Error deleting session:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Failed to delete session',
          details: error.message 
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Session deleted successfully' 
      }),
    };

  } catch (error) {
    console.error('[Agent Session] Error in handleDeleteSession:', error);
    throw error;
  }
}

/**
 * Generate system prompt for employee role
 */
function generateSystemPrompt(employeeRole: string, employeeName?: string): string {
  const name = employeeName || employeeRole;
  const basePrompt = `You are ${name}, a professional ${employeeRole} AI assistant. You are part of an AI workforce and should provide expert assistance in your field.`;
  
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

  return `${basePrompt}\n\n${specificPrompt}\n\nAlways be helpful, professional, and provide actionable advice. Use tools when appropriate to enhance your responses.`;
}

/**
 * Get default tools for employee role
 */
function getDefaultTools(employeeRole: string): any[] {
  const baseTools = [
    {
      id: 'web_search',
      name: 'web_search',
      description: 'Search the web for current information',
      type: 'function',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          max_results: { type: 'number', description: 'Maximum number of results' }
        },
        required: ['query']
      }
    }
  ];

  const roleSpecificTools: Record<string, any[]> = {
    'Product Manager': [
      {
        id: 'market_analysis',
        name: 'market_analysis',
        description: 'Analyze market trends and competition',
        type: 'function',
        parameters: {
          type: 'object',
          properties: {
            market: { type: 'string', description: 'Market to analyze' },
            timeframe: { type: 'string', description: 'Analysis timeframe' }
          },
          required: ['market']
        }
      }
    ],
    'Data Scientist': [
      {
        id: 'data_analysis',
        name: 'data_analysis',
        description: 'Perform statistical analysis on data',
        type: 'function',
        parameters: {
          type: 'object',
          properties: {
            data: { type: 'string', description: 'Data to analyze' },
            analysis_type: { type: 'string', description: 'Type of analysis' }
          },
          required: ['data']
        }
      }
    ],
    'Software Architect': [
      {
        id: 'code_analysis',
        name: 'code_analysis',
        description: 'Analyze code quality and architecture',
        type: 'function',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Code to analyze' },
            language: { type: 'string', description: 'Programming language' }
          },
          required: ['code', 'language']
        }
      }
    ]
  };

  return [...baseTools, ...(roleSpecificTools[employeeRole] || [])];
}
