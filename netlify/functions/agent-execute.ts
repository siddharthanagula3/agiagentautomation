/**
 * Agent Execute Function
 * Handles agent execution requests and streaming responses
 * Implements OpenAI Agent SDK integration
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

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  model: string;
  persona: string;
  tools: string[];
  capabilities: string[];
  streaming: boolean;
  maxTokens: number;
  temperature: number;
}

interface ExecuteRequest {
  conversationId: string;
  userId: string;
  message: string;
  agentConfig: AgentConfig;
  attachments?: any[];
}

interface ExecuteResponse {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
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
    const { conversationId, userId, message, agentConfig, attachments }: ExecuteRequest = JSON.parse(event.body || '{}');

    if (!conversationId || !userId || !message || !agentConfig) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

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
    
    if (authError || !user || user.id !== userId) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid authentication' }),
      };
    }

    // Save user message to database
    const { data: userMessage, error: userMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        metadata: { attachments },
        user_id: userId,
      })
      .select()
      .single();

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Failed to save user message' }),
      };
    }

    // Create agent response using OpenAI API
    const agentResponse = await createAgentResponse(agentConfig, message, conversationId);

    // Save agent response to database
    const { data: agentMessage, error: agentMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: agentResponse.content,
        metadata: {
          model: agentConfig.model,
          tokens: agentResponse.tokens,
          agent_id: agentConfig.id,
        },
        user_id: userId,
      })
      .select()
      .single();

    if (agentMessageError) {
      console.error('Error saving agent message:', agentMessageError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Failed to save agent response' }),
      };
    }

    // Update conversation last activity
    await supabase
      .from('conversations')
      .update({ 
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    const response: ExecuteResponse = {
      success: true,
      messageId: agentMessage.id,
      response: agentResponse.content,
      streaming: agentConfig.streaming,
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
    console.error('Agent execute error:', error);
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

/**
 * Create agent response using OpenAI API
 */
async function createAgentResponse(agentConfig: AgentConfig, userMessage: string, conversationId: string) {
  const messages = [
    {
      role: 'system',
      content: `You are ${agentConfig.name}, a professional AI agent. ${agentConfig.persona}

Your capabilities include:
${agentConfig.capabilities.map(cap => `- ${cap}`).join('\n')}

Available tools:
${agentConfig.tools.map(tool => `- ${tool}`).join('\n')}

Respond naturally and helpfully to the user's request.`,
    },
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: agentConfig.model,
      messages,
      max_tokens: agentConfig.maxTokens,
      temperature: agentConfig.temperature,
      stream: false, // For now, we'll implement streaming separately
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.',
    tokens: data.usage?.total_tokens || 0,
  };
}
