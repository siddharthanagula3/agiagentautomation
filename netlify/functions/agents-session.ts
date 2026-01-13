/**
 * Agents Session Function
 * Creates or retrieves an OpenAI Agents SDK session
 * Uses OpenAI Assistants API v2 for agent orchestration
 * Updated: Jan 10th 2026 - Added CORS validation, rate limiting, and Zod validation
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { withAuth } from './utils/auth-middleware';
import { withRateLimit } from './utils/rate-limiter';
import { getCorsHeaders, getMinimalCorsHeaders } from './utils/cors';
import {
  agentsSessionSchema,
  formatValidationError,
} from './utils/validation-schemas';

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

interface SessionResponse {
  success: boolean;
  conversationId?: string;
  threadId?: string;
  assistantId?: string;
  error?: string;
}

// Updated: Jan 10th 2026 - Refactored to use withAuth middleware
const authenticatedHandler = async (
  event: HandlerEvent & { user: { id: string; email?: string } },
  context: HandlerContext
) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: getMinimalCorsHeaders(origin),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // SECURITY: Validate request body with Zod schema
    const parseResult = agentsSessionSchema.safeParse(
      JSON.parse(event.body || '{}')
    );

    if (!parseResult.success) {
      return {
        statusCode: 400,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { userId, employeeId, employeeName, employeeRole, capabilities, sessionId } =
      parseResult.data;

    // Verify userId matches authenticated user (withAuth already verified JWT)
    if (event.user.id !== userId) {
      return {
        statusCode: 403,
        headers: getMinimalCorsHeaders(origin),
        body: JSON.stringify({ error: 'Forbidden: User ID mismatch' }),
      };
    }

    // Check if session exists
    // Use .maybeSingle() to avoid 406 errors when conversation doesn't exist
    if (sessionId) {
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle();

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
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(response),
        };
      }
    }

    // Create OpenAI Assistant for this employee
    const assistant = await openai.beta.assistants.create({
      name: employeeName,
      description: `AI Employee - ${employeeRole || 'General Assistant'}`,
      instructions: `You are ${employeeName}, a professional ${employeeRole || 'assistant'}.

Your capabilities include:
${(capabilities || []).map((cap) => `- ${cap}`).join('\n')}

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
        employeeRole: employeeRole || '',
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
          employeeRole: employeeRole || '',
          threadId: thread.id,
          assistantId: assistant.id,
          capabilities: capabilities || [],
        },
      })
      .select()
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      return {
        statusCode: 500,
        headers: getMinimalCorsHeaders(origin),
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
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Session creation error:', error);
    return {
      statusCode: 500,
      headers: getMinimalCorsHeaders(origin),
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Updated: Jan 10th 2026 - Added withAuth and withRateLimit middleware
export const handler: Handler = withAuth(withRateLimit(authenticatedHandler));
