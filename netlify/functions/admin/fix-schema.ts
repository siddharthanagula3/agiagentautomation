import { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../utils/auth-middleware';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Updated: Nov 16th 2025 - Fixed unauthenticated schema modification endpoint
const authenticatedHandler: Handler = async (
  event: HandlerEvent & { user: { id: string; email?: string } },
  context: HandlerContext
) => {
  // Disable in production for security
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY_ENV === 'production') {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'Forbidden',
        message: 'Schema modification is disabled in production for security reasons',
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('[Fix Schema] Starting schema fix...');

    // Check current schema
    const { data: currentColumns, error: checkError } = await supabase.rpc(
      'check_columns',
      {
        table_name: 'purchased_employees',
      }
    );

    console.log('[Fix Schema] Current columns check:', {
      currentColumns,
      checkError,
    });

    // Add 'name' column if missing
    const { data: nameResult, error: nameError } =
      await supabase.rpc('add_name_column');
    console.log('[Fix Schema] Add name column result:', {
      nameResult,
      nameError,
    });

    // Add 'is_active' column if missing
    const { data: activeResult, error: activeError } = await supabase.rpc(
      'add_is_active_column'
    );
    console.log('[Fix Schema] Add is_active column result:', {
      activeResult,
      activeError,
    });

    // Verify final schema
    const { data: finalSchema, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'purchased_employees')
      .order('ordinal_position');

    console.log('[Fix Schema] Final schema:', { finalSchema, schemaError });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Schema fix completed',
        nameResult,
        activeResult,
        finalSchema,
      }),
    };
  } catch (error) {
    console.error('[Fix Schema] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fix schema',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Updated: Nov 16th 2025 - Fixed unauthenticated schema modification endpoint - require authentication
export const handler: Handler = withAuth(authenticatedHandler);
