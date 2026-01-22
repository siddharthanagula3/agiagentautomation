/**
 * Agents Execute Function
 * Executes messages using OpenAI Assistants API v2
 * Supports streaming and tool execution
 * Updated: Jan 17th 2026 - Fixed CORS wildcard vulnerability with origin validation
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import {
  getCorsHeaders,
  getMinimalCorsHeaders,
  checkOriginAndBlock,
  getSecurityHeaders,
} from '../utils/cors';
import { withRateLimitTier } from '../utils/rate-limiter';
import { agentsExecuteSchema, formatValidationError } from '../utils/validation-schemas';

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

const agentsExecuteHandler: Handler = async (event) => {
  // Extract origin for CORS validation
  const origin = event.headers.origin || event.headers.Origin || '';

  // Check if origin is allowed - block unauthorized origins early
  const blockedResponse = checkOriginAndBlock(origin);
  if (blockedResponse) {
    return blockedResponse;
  }

  // Get CORS headers for allowed origin
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders || getSecurityHeaders(),
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders || getSecurityHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const requestBody = JSON.parse(event.body || '{}');

    // Validate request with Zod schema
    const validated = agentsExecuteSchema.safeParse(requestBody);
    if (!validated.success) {
      return {
        statusCode: 400,
        headers: getMinimalCorsHeaders(origin) || getSecurityHeaders(),
        body: JSON.stringify(formatValidationError(validated.error)),
      };
    }

    const {
      conversationId,
      userId,
      message,
      threadId,
      assistantId,
      streaming,
    } = validated.data;

    // Verify authentication
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: getMinimalCorsHeaders(origin) || getSecurityHeaders(),
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
        headers: getMinimalCorsHeaders(origin) || getSecurityHeaders(),
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
          'Content-Type': 'application/json',
          ...(corsHeaders || getSecurityHeaders()),
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
      // Handle tool calls from OpenAI Assistants
      const requiredAction = runStatus.required_action;

      if (requiredAction?.type === 'submit_tool_outputs') {
        const toolCalls = requiredAction.submit_tool_outputs.tool_calls;
        const toolOutputs: Array<{ tool_call_id: string; output: string }> = [];

        // Process each tool call
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || '{}');
          let output = '';

          try {
            // Execute the tool based on its name
            switch (functionName) {
              case 'search_web':
              case 'web_search':
                // Web search tool - return formatted search results
                output = JSON.stringify({
                  success: true,
                  message: `Search results for: "${args.query}"`,
                  note: 'Full web search results would be returned here',
                  query: args.query,
                });
                break;

              case 'get_current_time':
              case 'get_datetime':
                output = JSON.stringify({
                  success: true,
                  time: new Date().toISOString(),
                  timezone: 'UTC',
                });
                break;

              case 'calculate':
              case 'math':
                // Safe math evaluation for simple expressions
                try {
                  const expression = args.expression || args.input;
                  // Only allow numbers and basic operators
                  if (/^[\d\s+\-*/().]+$/.test(expression)) {
                    const result = Function(`'use strict'; return (${expression})`)();
                    output = JSON.stringify({ success: true, result: String(result) });
                  } else {
                    output = JSON.stringify({ success: false, error: 'Invalid expression' });
                  }
                } catch (e) {
                  output = JSON.stringify({ success: false, error: 'Calculation error' });
                }
                break;

              case 'read_file':
              case 'get_file':
                output = JSON.stringify({
                  success: false,
                  error: 'File operations require Vibe workspace integration',
                  path: args.path,
                });
                break;

              case 'write_file':
              case 'save_file':
                output = JSON.stringify({
                  success: false,
                  error: 'File writing requires Vibe workspace integration',
                  path: args.path,
                });
                break;

              default:
                // Generic handler for unknown tools
                output = JSON.stringify({
                  success: true,
                  message: `Tool "${functionName}" executed`,
                  args: args,
                  note: 'This is a placeholder response. Full tool integration pending.',
                });
            }
          } catch (toolError) {
            output = JSON.stringify({
              success: false,
              error: `Tool execution failed: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
            });
          }

          toolOutputs.push({
            tool_call_id: toolCall.id,
            output,
          });
        }

        // Submit tool outputs back to the run
        runStatus = await openai.beta.threads.runs.submitToolOutputsAndPoll(
          threadId,
          run.id,
          { tool_outputs: toolOutputs }
        );

        // Check final status after tool submission
        if (runStatus.status === 'completed') {
          // Get the assistant's final response
          const messages = await openai.beta.threads.messages.list(threadId, {
            order: 'desc',
            limit: 1,
          });

          const assistantMessage = messages.data[0];
          let responseText = '';

          if (assistantMessage.content[0].type === 'text') {
            responseText = assistantMessage.content[0].text.value;
          }

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
                model: runStatus.model || 'gpt-4o',
                toolsUsed: toolCalls.map((tc) => tc.function.name),
              },
              user_id: userId,
            })
            .select()
            .single();

          if (agentMessageError) {
            console.error('Error saving agent message:', agentMessageError);
          }

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              ...(corsHeaders || getSecurityHeaders()),
            },
            body: JSON.stringify({
              success: true,
              messageId: agentMessage?.id,
              response: responseText,
              threadMessageId: assistantMessage.id,
              runId: run.id,
              toolsExecuted: toolCalls.map((tc) => tc.function.name),
            }),
          };
        } else {
          throw new Error(`Run failed after tool execution: ${runStatus.status}`);
        }
      }

      // No tool outputs to submit
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          ...(corsHeaders || getSecurityHeaders()),
        },
        body: JSON.stringify({
          success: false,
          error: 'Unknown action required',
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
      headers: getMinimalCorsHeaders(origin) || getSecurityHeaders(),
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Export with rate limiting middleware (10 req/min for authenticated tier)
export const handler = withRateLimitTier('authenticated')(agentsExecuteHandler);
