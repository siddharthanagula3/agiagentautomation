/**
 * Agent Stream Function
 * Handles streaming agent responses using Server-Sent Events
 * Implements OpenAI Agent SDK streaming integration
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

interface StreamRequest {
  conversationId: string;
  userId: string;
  message: string;
  agentConfig: AgentConfig;
  messageId?: string;
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
    const { conversationId, userId, message, agentConfig, messageId }: StreamRequest = JSON.parse(event.body || '{}');

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

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create agent message placeholder
          const { data: agentMessage, error: agentMessageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: '',
              metadata: {
                model: agentConfig.model,
                agent_id: agentConfig.id,
                streaming: true,
              },
              user_id: userId,
            })
            .select()
            .single();

          if (agentMessageError) {
            throw new Error('Failed to create agent message');
          }

          // Send initial message
          controller.enqueue(`data: ${JSON.stringify({
            type: 'message_start',
            messageId: agentMessage.id,
            timestamp: new Date().toISOString(),
          })}\n\n`);

          // Create OpenAI streaming request
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
              content: message,
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
              stream: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body reader available');
          }

          let fullContent = '';
          let tokenCount = 0;

          // Process streaming response
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  // Stream complete
                  controller.enqueue(`data: ${JSON.stringify({
                    type: 'message_complete',
                    messageId: agentMessage.id,
                    content: fullContent,
                    tokens: tokenCount,
                    timestamp: new Date().toISOString(),
                  })}\n\n`);
                  
                  // Update message in database
                  await supabase
                    .from('messages')
                    .update({
                      content: fullContent,
                      metadata: {
                        model: agentConfig.model,
                        agent_id: agentConfig.id,
                        tokens: tokenCount,
                        streaming: false,
                      },
                    })
                    .eq('id', agentMessage.id);

                  // Update conversation last activity
                  await supabase
                    .from('conversations')
                    .update({ 
                      last_activity_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', conversationId);

                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    fullContent += content;
                    tokenCount++;

                    // Send content chunk
                    controller.enqueue(`data: ${JSON.stringify({
                      type: 'content_delta',
                      messageId: agentMessage.id,
                      content,
                      timestamp: new Date().toISOString(),
                    })}\n\n`);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming data:', parseError);
                }
              }
            }
          }

        } catch (error) {
          console.error('Streaming error:', error);
          
          controller.enqueue(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          })}\n\n`);
          
          controller.close();
        }
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body: stream,
    };

  } catch (error) {
    console.error('Agent stream error:', error);
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
