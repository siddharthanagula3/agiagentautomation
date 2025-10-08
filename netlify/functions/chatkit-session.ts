/**
 * ChatKit Session Endpoint
 * Creates and manages ChatKit sessions following OpenAI patterns
 * Based on: https://github.com/openai/openai-chatkit-starter-app
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

interface SessionRequest {
  workflowId: string;
  userId: string;
  employeeId?: string;
  employeeRole?: string;
  sessionId?: string;
}

interface SessionResponse {
  sessionId: string;
  workflowId: string;
  status: 'created' | 'existing';
  createdAt: string;
  expiresAt: string;
  metadata?: any;
}

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Verify user authentication
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid authentication' }),
      };
    }

    if (event.httpMethod === 'GET') {
      // Get existing sessions
      const { data: sessions, error } = await supabase
        .from('chatkit_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Failed to fetch sessions');
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessions: sessions || [] }),
      };
    }

    // POST - Create new session
    const { workflowId, employeeId, employeeRole, sessionId }: SessionRequest = JSON.parse(event.body || '{}');

    if (!workflowId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing required field: workflowId' }),
      };
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `chatkit-${workflowId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('chatkit_sessions')
      .select('*')
      .eq('session_id', finalSessionId)
      .eq('user_id', user.id)
      .single();

    if (existingSession) {
      const response: SessionResponse = {
        sessionId: existingSession.session_id,
        workflowId: existingSession.workflow_id,
        status: 'existing',
        createdAt: existingSession.created_at,
        expiresAt: existingSession.expires_at,
        metadata: existingSession.metadata,
      };

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      };
    }

    // Create new session
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const { data: newSession, error: sessionError } = await supabase
      .from('chatkit_sessions')
      .insert({
        session_id: finalSessionId,
        user_id: user.id,
        workflow_id: workflowId,
        employee_id: employeeId,
        employee_role: employeeRole,
        status: 'active',
        metadata: {
          created_via: 'chatkit-integration',
          employee_id: employeeId,
          employee_role: employeeRole,
        },
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Failed to create session' }),
      };
    }

    // Create OpenAI ChatKit session
    try {
      const openaiResponse = await fetch(`${OPENAI_BASE_URL}/chatkit/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          session_id: finalSessionId,
          metadata: {
            user_id: user.id,
            employee_id: employeeId,
            employee_role: employeeRole,
          },
        }),
      });

      if (!openaiResponse.ok) {
        console.warn('OpenAI ChatKit session creation failed:', openaiResponse.status);
        // Continue with local session creation
      }
    } catch (openaiError) {
      console.warn('OpenAI ChatKit session creation error:', openaiError);
      // Continue with local session creation
    }

    const response: SessionResponse = {
      sessionId: newSession.session_id,
      workflowId: newSession.workflow_id,
      status: 'created',
      createdAt: newSession.created_at,
      expiresAt: newSession.expires_at,
      metadata: newSession.metadata,
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('ChatKit session error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
