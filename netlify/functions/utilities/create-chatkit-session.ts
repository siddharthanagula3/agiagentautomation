/**
 * ChatKit Session Creation Endpoint
 * Creates a ChatKit session for AI Employee conversations
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getSafeCorsHeaders, checkOriginAndBlock } from '../utils/cors';
import { withAuth } from '../utils/auth-middleware';

interface CreateSessionRequest {
  employeeId: string;
  workflowId: string;
  userId: string;
  employeeName: string;
}

// Updated: Nov 16th 2025 - Fixed missing auth on ChatKit session creation by adding withAuth wrapper
const chatkitHandler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Get secure CORS headers
  const origin = event.headers.origin;

  // Check origin and block if unauthorized
  const blockedResponse = checkOriginAndBlock(origin);
  if (blockedResponse) {
    return blockedResponse;
  }

  const headers = getSafeCorsHeaders(origin);

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
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
      const errorData = await response.json().catch((err) => {
        console.error('[ChatKit] Failed to parse OpenAI error response:', err);
        return {};
      });
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

// Updated: Nov 16th 2025 - Fixed missing auth on ChatKit session creation
// Export handler with authentication middleware to prevent unauthorized access
export const handler = withAuth(chatkitHandler);
