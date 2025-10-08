/**
 * Agent SDK Webhook Handler
 * Handles webhook events for the Agent SDK integration
 * Processes tool executions, webhook triggers, and agent events
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Signature',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      },
      body: '',
    };
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    const { type, data, metadata } = requestBody;

    console.log('[Agent SDK Webhook] Received event:', { type, metadata });

    // Verify webhook signature if provided
    const signature = event.headers['x-webhook-signature'];
    if (signature && !verifyWebhookSignature(event.body || '', signature)) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid webhook signature' }),
      };
    }

    // Route to appropriate handler based on event type
    switch (type) {
      case 'tool_execution':
        return await handleToolExecution(data, metadata);
      
      case 'webhook_trigger':
        return await handleWebhookTrigger(data, metadata);
      
      case 'agent_event':
        return await handleAgentEvent(data, metadata);
      
      case 'session_update':
        return await handleSessionUpdate(data, metadata);
      
      case 'analytics_event':
        return await handleAnalyticsEvent(data, metadata);
      
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: `Unknown event type: ${type}` }),
        };
    }

  } catch (error) {
    console.error('[Agent SDK Webhook] Error processing webhook:', error);
    
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
 * Handle tool execution events
 */
async function handleToolExecution(data: any, metadata: any) {
  try {
    const {
      session_id,
      tool_name,
      parameters,
      result,
      error,
      execution_time_ms
    } = data;

    console.log('[Agent SDK Webhook] Tool execution:', { session_id, tool_name });

    // Log tool execution
    const { data: executionData, error: executionError } = await supabase
      .from('agent_tool_executions')
      .insert({
        session_id,
        tool_name,
        parameters,
        result,
        error,
        execution_time_ms
      });

    if (executionError) {
      console.error('[Agent SDK Webhook] Error logging tool execution:', executionError);
    }

    // Update session with tool execution result
    if (session_id && result) {
      await updateSessionWithToolResult(session_id, tool_name, result);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Tool execution logged successfully'
      }),
    };

  } catch (error) {
    console.error('[Agent SDK Webhook] Tool execution error:', error);
    throw error;
  }
}

/**
 * Handle webhook trigger events
 */
async function handleWebhookTrigger(data: any, metadata: any) {
  try {
    const {
      webhook_id,
      session_id,
      trigger_event,
      payload,
      response_status,
      response_body,
      error,
      execution_time_ms,
      retry_count = 0
    } = data;

    console.log('[Agent SDK Webhook] Webhook trigger:', { webhook_id, trigger_event });

    // Log webhook execution
    const { data: executionData, error: executionError } = await supabase
      .from('agent_webhook_executions')
      .insert({
        webhook_id,
        session_id,
        trigger_event,
        payload,
        response_status,
        response_body,
        error,
        execution_time_ms,
        retry_count
      });

    if (executionError) {
      console.error('[Agent SDK Webhook] Error logging webhook execution:', executionError);
    }

    // Update webhook statistics
    if (webhook_id) {
      await updateWebhookStats(webhook_id, response_status, error);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Webhook execution logged successfully'
      }),
    };

  } catch (error) {
    console.error('[Agent SDK Webhook] Webhook trigger error:', error);
    throw error;
  }
}

/**
 * Handle agent events
 */
async function handleAgentEvent(data: any, metadata: any) {
  try {
    const { event_type, session_id, user_id, employee_id, event_data } = data;

    console.log('[Agent SDK Webhook] Agent event:', { event_type, session_id });

    // Log agent event to analytics
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('agent_analytics')
      .insert({
        session_id,
        user_id,
        employee_id,
        employee_role: event_data?.employee_role || 'Unknown',
        provider: event_data?.provider || 'openai',
        model: event_data?.model || 'gpt-4o-mini',
        prompt_tokens: event_data?.prompt_tokens || 0,
        completion_tokens: event_data?.completion_tokens || 0,
        total_tokens: event_data?.total_tokens || 0
      });

    if (analyticsError) {
      console.error('[Agent SDK Webhook] Error logging agent event:', analyticsError);
    }

    // Handle specific event types
    switch (event_type) {
      case 'session_started':
        await handleSessionStarted(session_id, user_id, employee_id, event_data);
        break;
      
      case 'session_ended':
        await handleSessionEnded(session_id, user_id, employee_id, event_data);
        break;
      
      case 'message_sent':
        await handleMessageSent(session_id, user_id, employee_id, event_data);
        break;
      
      case 'tool_used':
        await handleToolUsed(session_id, user_id, employee_id, event_data);
        break;
      
      default:
        console.log('[Agent SDK Webhook] Unknown agent event type:', event_type);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Agent event processed successfully'
      }),
    };

  } catch (error) {
    console.error('[Agent SDK Webhook] Agent event error:', error);
    throw error;
  }
}

/**
 * Handle session updates
 */
async function handleSessionUpdate(data: any, metadata: any) {
  try {
    const { session_id, updates } = data;

    console.log('[Agent SDK Webhook] Session update:', { session_id });

    // Update session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('agent_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', session_id);

    if (sessionError) {
      console.error('[Agent SDK Webhook] Error updating session:', sessionError);
      throw sessionError;
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Session updated successfully'
      }),
    };

  } catch (error) {
    console.error('[Agent SDK Webhook] Session update error:', error);
    throw error;
  }
}

/**
 * Handle analytics events
 */
async function handleAnalyticsEvent(data: any, metadata: any) {
  try {
    const {
      session_id,
      user_id,
      employee_id,
      employee_role,
      provider,
      model,
      prompt_tokens,
      completion_tokens,
      total_tokens
    } = data;

    console.log('[Agent SDK Webhook] Analytics event:', { session_id, total_tokens });

    // Log analytics data
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('agent_analytics')
      .insert({
        session_id,
        user_id,
        employee_id,
        employee_role,
        provider,
        model,
        prompt_tokens,
        completion_tokens,
        total_tokens
      });

    if (analyticsError) {
      console.error('[Agent SDK Webhook] Error logging analytics:', analyticsError);
      throw analyticsError;
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Analytics logged successfully'
      }),
    };

  } catch (error) {
    console.error('[Agent SDK Webhook] Analytics error:', error);
    throw error;
  }
}

/**
 * Update session with tool execution result
 */
async function updateSessionWithToolResult(sessionId: string, toolName: string, result: any) {
  try {
    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from('agent_sessions')
      .select('messages')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('[Agent SDK Webhook] Error fetching session:', sessionError);
      return;
    }

    // Add tool result to the last message
    const messages = session.messages || [];
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        lastMessage.tool_results = lastMessage.tool_results || [];
        lastMessage.tool_results.push({
          tool_name: toolName,
          result,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update session
    const { error: updateError } = await supabase
      .from('agent_sessions')
      .update({
        messages,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[Agent SDK Webhook] Error updating session with tool result:', updateError);
    }

  } catch (error) {
    console.error('[Agent SDK Webhook] Error updating session with tool result:', error);
  }
}

/**
 * Update webhook statistics
 */
async function updateWebhookStats(webhookId: string, responseStatus: number, error: string | null) {
  try {
    const isSuccess = responseStatus >= 200 && responseStatus < 300 && !error;
    
    const updateData: any = {
      last_triggered: new Date().toISOString()
    };

    if (isSuccess) {
      updateData.success_count = supabase.rpc('increment', { 
        table_name: 'agent_webhooks', 
        column_name: 'success_count', 
        id: webhookId 
      });
    } else {
      updateData.failure_count = supabase.rpc('increment', { 
        table_name: 'agent_webhooks', 
        column_name: 'failure_count', 
        id: webhookId 
      });
    }

    const { error: updateError } = await supabase
      .from('agent_webhooks')
      .update(updateData)
      .eq('id', webhookId);

    if (updateError) {
      console.error('[Agent SDK Webhook] Error updating webhook stats:', updateError);
    }

  } catch (error) {
    console.error('[Agent SDK Webhook] Error updating webhook stats:', error);
  }
}

/**
 * Handle session started event
 */
async function handleSessionStarted(sessionId: string, userId: string, employeeId: string, eventData: any) {
  console.log('[Agent SDK Webhook] Session started:', { sessionId, userId, employeeId });
  // Additional logic for session started events
}

/**
 * Handle session ended event
 */
async function handleSessionEnded(sessionId: string, userId: string, employeeId: string, eventData: any) {
  console.log('[Agent SDK Webhook] Session ended:', { sessionId, userId, employeeId });
  // Additional logic for session ended events
}

/**
 * Handle message sent event
 */
async function handleMessageSent(sessionId: string, userId: string, employeeId: string, eventData: any) {
  console.log('[Agent SDK Webhook] Message sent:', { sessionId, userId, employeeId });
  // Additional logic for message sent events
}

/**
 * Handle tool used event
 */
async function handleToolUsed(sessionId: string, userId: string, employeeId: string, eventData: any) {
  console.log('[Agent SDK Webhook] Tool used:', { sessionId, userId, employeeId, eventData });
  // Additional logic for tool used events
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.AGENT_SDK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('[Agent SDK Webhook] No webhook secret configured');
      return true; // Allow if no secret is configured
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('[Agent SDK Webhook] Signature verification error:', error);
    return false;
  }
}
