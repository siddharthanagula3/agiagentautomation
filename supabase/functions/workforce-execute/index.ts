// Supabase Edge Function for Workforce Execution
// Handles AI workforce orchestration and task execution

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { task, agents, tools } = await req.json();

    // Create execution record
    const { data: execution, error: execError } = await supabaseClient
      .from('workforce_executions')
      .insert({
        user_id: user.id,
        task_description: task,
        status: 'pending',
        agents_assigned: agents,
        tools_used: tools,
      })
      .select()
      .single();

    if (execError) throw execError;

    // Record analytics
    await supabaseClient.rpc('record_analytics_event', {
      p_user_id: user.id,
      p_event_type: 'workforce_execution_started',
      p_event_data: { execution_id: execution.id, task, agents, tools },
    });

    // Return execution ID for client-side tracking
    return new Response(
      JSON.stringify({
        execution_id: execution.id,
        status: 'started',
        message: 'Workforce execution initiated',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
