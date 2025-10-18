import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
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
