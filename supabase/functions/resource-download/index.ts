// Resource Download Tracking Edge Function
// Tracks resource downloads and returns download URL

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface DownloadRequest {
  resourceId: string;
  userEmail?: string;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { resourceId, userEmail } = (await req.json()) as DownloadRequest;

    if (!resourceId) {
      return new Response(
        JSON.stringify({ error: 'Resource ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get resource details
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .eq('published', true)
      .single();

    if (resourceError || !resource) {
      return new Response(JSON.stringify({ error: 'Resource not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Track download
    const { error: trackError } = await supabase
      .from('resource_downloads')
      .insert({
        resource_id: resourceId,
        user_id: null, // Will be set by RLS if authenticated
        user_email: userEmail,
      });

    if (trackError) {
      console.error('Error tracking download:', trackError);
      // Continue anyway - don't fail the download
    }

    // Increment download count
    await supabase
      .from('resources')
      .update({ download_count: (resource.download_count || 0) + 1 })
      .eq('id', resourceId);

    // Return download URL
    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: resource.file_url,
        title: resource.title,
        type: resource.type,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in resource-download function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
