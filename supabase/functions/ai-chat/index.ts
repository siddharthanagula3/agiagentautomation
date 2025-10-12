// Supabase Edge Function for AI Chat
// Handles AI chat requests with streaming support

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Parse request body
    const {
      messages,
      provider = 'gemini',
      model,
      sessionId,
    } = await req.json();

    // Check rate limit
    const { data: rateLimitOk } = await supabaseClient.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_resource: 'ai_chat',
      p_limit: 100,
      p_window_seconds: 3600,
    });

    if (!rateLimitOk) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      });
    }

    // Record analytics event
    await supabaseClient.rpc('record_analytics_event', {
      p_user_id: user.id,
      p_event_type: 'ai_chat_request',
      p_event_data: { provider, model, message_count: messages.length },
    });

    // Route to appropriate AI provider
    let response: string;
    switch (provider) {
      case 'anthropic':
        response = await callAnthropic(messages, model);
        break;
      case 'google':
      case 'gemini':
        response = await callGemini(messages, model);
        break;
      case 'openai':
        response = await callOpenAI(messages, model);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Save message to database if sessionId provided
    if (sessionId) {
      await supabaseClient.from('chat_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: response,
      });
    }

    return new Response(JSON.stringify({ response, provider, model }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function callAnthropic(
  messages: any[],
  model = 'claude-3-5-sonnet-20241022'
): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('Anthropic API key not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages,
    }),
  });

  const data = await response.json();
  return data.content[0].text;
}

async function callGemini(
  messages: any[],
  model = 'gemini-2.0-flash'
): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) throw new Error('Google API key not configured');

  const contents = messages.map((msg: any) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(messages: any[], model = 'gpt-4'): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
