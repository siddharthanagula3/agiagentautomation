/**
 * Agents Execute Function
 * Executes messages using OpenAI Assistants API v2
 * Supports streaming and tool execution
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

interface ExecuteRequest {
  conversationId: string;
  userId: string;
  message: string;
  threadId: string;
  assistantId: string;
  streaming?: boolean;
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
      conversationId,
      userId,
      message,
      threadId,
      assistantId,
      streaming,
    }: ExecuteRequest = JSON.parse(event.body || '{}');

    if (!conversationId || !userId || !message || !threadId || !assistantId) {
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

    // Add message to thread
    const threadMessage = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
    });

    // Save user message to database
    const { data: userMessage, error: userMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        metadata: {
          threadMessageId: threadMessage.id,
        },
        user_id: userId,
      })
      .select()
      .single();

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
    }

    // Run the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    // Updated: Nov 16th 2025 - Fixed infinite loop risk by adding max poll attempts
    // Poll for completion (for non-streaming) with timeout protection
    let runStatus = run;
    const MAX_POLL_ATTEMPTS = 120; // 2 minutes maximum (120 seconds)
    let pollAttempts = 0;

    while (
      (runStatus.status === 'queued' ||
      runStatus.status === 'in_progress') &&
      pollAttempts < MAX_POLL_ATTEMPTS
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      pollAttempts++;
    }

    // Check if we timed out
    if (pollAttempts >= MAX_POLL_ATTEMPTS) {
      throw new Error(`Agent execution timeout after ${MAX_POLL_ATTEMPTS} seconds`);
    }

    if (runStatus.status === 'completed') {
      // Get the assistant's messages
      const messages = await openai.beta.threads.messages.list(threadId, {
        order: 'desc',
        limit: 1,
      });

      const assistantMessage = messages.data[0];
      let responseText = '';

      if (assistantMessage.content[0].type === 'text') {
        responseText = assistantMessage.content[0].text.value;
      }

      // Updated: Nov 16th 2025 - Fixed hardcoded model in agent metadata
      // Use actual model from run status instead of hardcoding
      // Save assistant response to database
      const { data: agentMessage, error: agentMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: responseText,
          metadata: {
            threadMessageId: assistantMessage.id,
            runId: run.id,
            model: runStatus.model || 'gpt-4o', // Use actual model from response
          },
          user_id: userId,
        })
        .select()
        .single();

      if (agentMessageError) {
        console.error('Error saving agent message:', agentMessageError);
      }

      // Update conversation last activity
      await supabase
        .from('conversations')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          messageId: agentMessage?.id,
          response: responseText,
          threadMessageId: assistantMessage.id,
          runId: run.id,
        }),
      };
    } else if (runStatus.status === 'failed') {
      throw new Error(
        `Run failed: ${runStatus.last_error?.message || 'Unknown error'}`
      );
    } else if (runStatus.status === 'requires_action') {
      // Handle tool calls (for future enhancement)
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Tool calls not yet implemented',
          requiresAction: true,
          runId: run.id,
        }),
      };
    } else {
      throw new Error(`Unexpected run status: ${runStatus.status}`);
    }
  } catch (error) {
    console.error('Agents execute error:', error);
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
