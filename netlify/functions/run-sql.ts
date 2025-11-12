import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  // SECURITY: Disabled arbitrary SQL execution endpoint
  // This endpoint is a critical SQL injection risk and should never be exposed
  // Use Supabase RPC functions with specific, validated inputs instead

  return {
    statusCode: 403,
    body: JSON.stringify({
      error: 'This endpoint has been disabled for security reasons',
      message: 'Arbitrary SQL execution is not allowed. Use specific RPC functions instead.',
    }),
  };

  // Original implementation preserved but disabled:
  /*
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { sql } = JSON.parse(event.body || '{}');

    if (!sql) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'SQL query required' }),
      };
    }

    console.log('[Run SQL] Executing:', sql);

    // Execute raw SQL using Supabase
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      console.error('[Run SQL] Error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'SQL execution failed',
          details: error.message,
        }),
      };
    }

    console.log('[Run SQL] Success:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data,
      }),
    };
  } catch (error) {
    console.error('[Run SQL] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to execute SQL',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
  */
};
