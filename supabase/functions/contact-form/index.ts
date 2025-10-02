// Contact Form Submission Edge Function
// Handles contact form submissions, validates data, and stores in database

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone?: string;
  companySize?: string;
  message: string;
  source?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { firstName, lastName, email, company, phone, companySize, message, source } = await req.json() as ContactFormData;

    // Validate required fields
    if (!firstName || !lastName || !email || !company || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert contact submission
    const { data: submission, error: submissionError } = await supabase
      .from('contact_submissions')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        company,
        phone,
        company_size: companySize,
        message,
        source: source || 'contact_form',
        status: 'new'
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error inserting contact submission:', submissionError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit contact form' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a sales lead if company size indicates enterprise
    if (companySize && ['201-1000', '1000+'].includes(companySize)) {
      const { error: leadError } = await supabase
        .from('sales_leads')
        .insert({
          contact_submission_id: submission.id,
          email,
          company,
          lead_score: companySize === '1000+' ? 90 : 70,
          status: 'new',
          estimated_value: companySize === '1000+' ? 50000 : 20000,
          notes: `Auto-qualified from contact form. Company size: ${companySize}`
        });

      if (leadError) {
        console.error('Error creating sales lead:', leadError);
        // Don't fail the request, just log
      }
    }

    // TODO: Send notification email to sales team
    // TODO: Add to CRM if integrated

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contact form submitted successfully',
        id: submission.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in contact-form function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
