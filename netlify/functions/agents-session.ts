/**
 * Agents Session Function
 * Creates or retrieves an OpenAI Agents SDK session
 * Uses OpenAI Assistants API v2 for agent orchestration
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Updated: Nov 16th 2025 - Fixed missing environment variable validation
// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

interface SessionRequest {
  userId: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  capabilities: string[];
  sessionId?: string;
}

interface SessionResponse {
  success: boolean;
  conversationId?: string;
  threadId?: string;
  assistantId?: string;
  error?: string;
}

export const handler: Handler = async (event) => {
  // Handle CORS
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const {
      userId,
      employeeId,
      employeeName,
      employeeRole,
      capabilities,
      sessionId,
    }: SessionRequest = JSON.parse(event.body || '{}');

    if (!userId || !employeeId || !employeeName) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Verify authentication
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user || user.id !== userId) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid authentication' }),
      };
    }

    // Check if session exists
    if (sessionId) {
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (existingConversation) {
        const response: SessionResponse = {
          success: true,
          conversationId: existingConversation.id,
          threadId: existingConversation.metadata?.threadId,
          assistantId: existingConversation.metadata?.assistantId,
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
    }

    // Create OpenAI Assistant for this employee
    const assistant = await openai.beta.assistants.create({
      name: employeeName,
      description: `AI Employee - ${employeeRole}`,
      instructions: `You are ${employeeName}, a professional ${employeeRole}.

Your capabilities include:
${capabilities.map((cap) => `- ${cap}`).join('\n')}

Respond naturally and professionally. Use your tools when needed to help the user achieve their goals.
Always be helpful, accurate, and concise.`,
      model: 'gpt-4o',
      tools: [{ type: 'code_interpreter' }, { type: 'file_search' }],
    });

    // Create OpenAI Thread
    const thread = await openai.beta.threads.create({
      metadata: {
        userId,
        employeeId,
        employeeName,
        employeeRole,
      },
    });

    // Create conversation in Supabase
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: `Chat with ${employeeName}`,
        metadata: {
          employeeId,
          employeeName,
          employeeRole,
          threadId: thread.id,
          assistantId: assistant.id,
          capabilities,
        },
      })
      .select()
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Failed to create conversation' }),
      };
    }

    const response: SessionResponse = {
      success: true,
      conversationId: conversation.id,
      threadId: thread.id,
      assistantId: assistant.id,
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
    console.error('Session creation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
