/**
 * ChatKit Session Creation Endpoint
 * Creates a ChatKit session for AI Employee conversations
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface CreateSessionRequest {
  employeeId: string;
  workflowId: string;
  userId: string;
  employeeName: string;
}

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const {
      employeeId,
      workflowId,
      userId,
      employeeName,
    }: CreateSessionRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!employeeId || !workflowId || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: employeeId, workflowId, userId',
        }),
      };
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Create ChatKit session with OpenAI API
    const response = await fetch(
      'https://api.openai.com/v1/realtime/sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          metadata: {
            employee_id: employeeId,
            employee_name: employeeName,
            user_id: userId,
            created_at: new Date().toISOString(),
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API Error:', response.status, errorData);

      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: 'Failed to create ChatKit session',
          details: errorData,
        }),
      };
    }

    const sessionData = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        session_id: sessionData.id,
        client_secret: sessionData.client_secret,
        expires_at: sessionData.expires_at,
        employee_id: employeeId,
        employee_name: employeeName,
      }),
    };
  } catch (error) {
    console.error('Create ChatKit session error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };
