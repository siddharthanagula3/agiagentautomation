import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { userId, sessionId, employeeId, employeeName, employeeRole, provider, subscriptionId, customerId } = JSON.parse(event.body || '{}');

    // If sessionId is provided, retrieve session details from Stripe
    if (sessionId && !employeeId) {
      console.log('[Manual Purchase] Retrieving session details from Stripe:', sessionId);
      
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const { userId: sessionUserId, employeeId: sessionEmployeeId, employeeName: sessionEmployeeName, employeeRole: sessionEmployeeRole, provider: sessionProvider } = session.metadata || {};
        
        if (sessionUserId && sessionEmployeeId && sessionEmployeeName && sessionEmployeeRole) {
          console.log('[Manual Purchase] Retrieved session metadata:', session.metadata);
          
          // Use session data
          const finalUserId = userId || sessionUserId;
          const finalEmployeeId = sessionEmployeeId;
          const finalEmployeeName = employeeName || sessionEmployeeName;
          const finalEmployeeRole = sessionEmployeeRole;
          const finalProvider = provider || sessionProvider || 'chatgpt';
          const finalSubscriptionId = subscriptionId || (session.subscription as string);
          const finalCustomerId = customerId || (session.customer as string);
          
          return await createPurchasedEmployee({
            userId: finalUserId,
            employeeId: finalEmployeeId,
            employeeName: finalEmployeeName,
            employeeRole: finalEmployeeRole,
            provider: finalProvider,
            // Note: Stripe columns will be added later via database migration
            // subscriptionId: finalSubscriptionId,
            // customerId: finalCustomerId,
          });
        } else {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'Session metadata missing required fields',
              metadata: session.metadata
            }),
          };
        }
      } catch (stripeError) {
        console.error('[Manual Purchase] Error retrieving session:', stripeError);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Failed to retrieve session details from Stripe' 
          }),
        };
      }
    }

    // Direct purchase with provided data
    if (!userId || !employeeId || !employeeName || !employeeRole) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: userId, employeeId, employeeName, employeeRole' 
        }),
      };
    }

    return await createPurchasedEmployee({
      userId,
      employeeId,
      employeeName,
      employeeRole,
      provider: provider || 'chatgpt',
      // Note: Stripe columns will be added later via database migration
      // subscriptionId,
      // customerId,
    });

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

async function createPurchasedEmployee(data: {
  userId: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  provider: string;
  // Note: Stripe columns will be added later via database migration
  // subscriptionId?: string;
  // customerId?: string;
}) {
  try {

    console.log('[Manual Purchase] Creating purchased employee record:', data);

    // Create purchased employee record (without Stripe columns for now)
    const { data: insertData, error } = await supabase
      .from('purchased_employees')
      .insert({
        user_id: data.userId,
        employee_id: data.employeeId,
        name: data.employeeName,
        role: data.employeeRole,
        provider: data.provider,
        is_active: true,
        // Note: Stripe columns will be added later via database migration
        // stripe_subscription_id: data.subscriptionId,
        // stripe_customer_id: data.customerId,
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

    console.log('[Manual Purchase] Successfully created purchased employee:', insertData);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        data: insertData[0]
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
}
