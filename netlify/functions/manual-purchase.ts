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
    const { userId, employeeId, employeeRole, provider, subscriptionId, customerId } = JSON.parse(event.body || '{}');

    if (!userId || !employeeId || !employeeRole) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: userId, employeeId, employeeRole' 
        }),
      };
    }

    console.log('[Manual Purchase] Creating purchased employee record:', {
      userId,
      employeeId,
      employeeRole,
      provider: provider || 'chatgpt',
      subscriptionId,
      customerId
    });

    // Create purchased employee record
    const { data, error } = await supabase
      .from('purchased_employees')
      .insert({
        user_id: userId,
        employee_id: employeeId,
        role: employeeRole,
        provider: provider || 'chatgpt',
        is_active: true,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
      })
      .select();

    if (error) {
      console.error('[Manual Purchase] Failed to create purchased employee:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to create purchased employee record',
          details: error.message 
        }),
      };
    }

    console.log('[Manual Purchase] Successfully created purchased employee:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        data: data[0]
      }),
    };

  } catch (error) {
    console.error('[Manual Purchase] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
