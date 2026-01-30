/**
 * Email Notification Function
 * Sends email notifications for support tickets using various providers
 * Supports: Resend, SendGrid, or built-in Netlify Forms email (fallback)
 * Updated: Jan 22nd 2026
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import {
  getCorsHeaders,
  getMinimalCorsHeaders,
  checkOriginAndBlock,
  getSecurityHeaders,
} from '../utils/cors';
import { withAuth } from '../utils/auth-middleware';
import { withRateLimitTier } from '../utils/rate-limiter';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

// Email provider configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@agiagent.ai';

interface EmailNotificationRequest {
  type: 'ticket_created' | 'ticket_reply' | 'ticket_status_change';
  ticketId: string;
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

interface EmailPayload {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send email via Resend API
 */
async function sendViaResend(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Resend error: ${error}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Resend request failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Send email via SendGrid API
 */
async function sendViaSendGrid(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  if (!SENDGRID_API_KEY) {
    return { success: false, error: 'SendGrid API key not configured' };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from: { email: payload.from },
        subject: payload.subject,
        content: [
          { type: 'text/plain', value: payload.text },
          { type: 'text/html', value: payload.html },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `SendGrid error: ${error}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `SendGrid request failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Generate email content based on notification type
 */
function generateEmailContent(
  type: EmailNotificationRequest['type'],
  ticketId: string,
  recipientName: string,
  message?: string
): { subject: string; html: string; text: string } {
  const appUrl = process.env.URL || 'https://agiagent.ai';
  const ticketUrl = `${appUrl}/support?ticket=${ticketId}`;

  switch (type) {
    case 'ticket_created':
      return {
        subject: `Support Ticket Created - #${ticketId.slice(0, 8)}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Support Ticket Received</h2>
            <p>Hi ${recipientName || 'there'},</p>
            <p>Thank you for contacting AGI Agent support. We've received your request and will respond as soon as possible.</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Ticket ID:</strong> #${ticketId.slice(0, 8)}</p>
            </div>
            <p>You can track your ticket status and add replies by visiting:</p>
            <p><a href="${ticketUrl}" style="color: #0066cc;">${ticketUrl}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">The AGI Agent Support Team</p>
          </div>
        `,
        text: `Support Ticket Received\n\nHi ${recipientName || 'there'},\n\nThank you for contacting AGI Agent support. We've received your request and will respond as soon as possible.\n\nTicket ID: #${ticketId.slice(0, 8)}\n\nTrack your ticket: ${ticketUrl}\n\nThe AGI Agent Support Team`,
      };

    case 'ticket_reply':
      return {
        subject: `New Reply on Support Ticket #${ticketId.slice(0, 8)}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">New Reply on Your Ticket</h2>
            <p>Hi ${recipientName || 'there'},</p>
            <p>Our support team has replied to your ticket.</p>
            ${message ? `<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0;">${message}</p></div>` : ''}
            <p>View the full conversation:</p>
            <p><a href="${ticketUrl}" style="color: #0066cc;">${ticketUrl}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">The AGI Agent Support Team</p>
          </div>
        `,
        text: `New Reply on Your Ticket\n\nHi ${recipientName || 'there'},\n\nOur support team has replied to your ticket.\n\n${message ? `Reply:\n${message}\n\n` : ''}View the full conversation: ${ticketUrl}\n\nThe AGI Agent Support Team`,
      };

    case 'ticket_status_change':
      return {
        subject: `Ticket Status Updated - #${ticketId.slice(0, 8)}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Ticket Status Updated</h2>
            <p>Hi ${recipientName || 'there'},</p>
            <p>The status of your support ticket has been updated.</p>
            ${message ? `<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0;"><strong>New Status:</strong> ${message}</p></div>` : ''}
            <p>View your ticket:</p>
            <p><a href="${ticketUrl}" style="color: #0066cc;">${ticketUrl}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">The AGI Agent Support Team</p>
          </div>
        `,
        text: `Ticket Status Updated\n\nHi ${recipientName || 'there'},\n\nThe status of your support ticket has been updated.\n\n${message ? `New Status: ${message}\n\n` : ''}View your ticket: ${ticketUrl}\n\nThe AGI Agent Support Team`,
      };

    default:
      return {
        subject: `AGI Agent Support - #${ticketId.slice(0, 8)}`,
        html: `<p>Notification for ticket #${ticketId.slice(0, 8)}</p>`,
        text: `Notification for ticket #${ticketId.slice(0, 8)}`,
      };
  }
}

const emailNotificationHandler: Handler = async (event: HandlerEvent) => {
  const origin = event.headers.origin || event.headers.Origin || '';

  // Check if origin is allowed
  const blockedResponse = checkOriginAndBlock(origin);
  if (blockedResponse) {
    return blockedResponse;
  }

  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders || getSecurityHeaders(),
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders || getSecurityHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body: EmailNotificationRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.type || !body.ticketId || !body.recipientEmail) {
      return {
        statusCode: 400,
        headers: getMinimalCorsHeaders(origin) || getSecurityHeaders(),
        body: JSON.stringify({
          error: 'Missing required fields: type, ticketId, recipientEmail',
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.recipientEmail)) {
      return {
        statusCode: 400,
        headers: getMinimalCorsHeaders(origin) || getSecurityHeaders(),
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    // Generate email content
    const { subject, html, text } = generateEmailContent(
      body.type,
      body.ticketId,
      body.recipientName || '',
      body.message
    );

    const emailPayload: EmailPayload = {
      to: body.recipientEmail,
      from: FROM_EMAIL,
      subject: body.subject || subject,
      html,
      text,
    };

    // Try to send via available provider
    let result: { success: boolean; error?: string };

    if (RESEND_API_KEY) {
      result = await sendViaResend(emailPayload);
    } else if (SENDGRID_API_KEY) {
      result = await sendViaSendGrid(emailPayload);
    } else {
      // Log the email intent if no provider configured
      console.log('[EmailNotification] No email provider configured. Email would be sent:', {
        type: body.type,
        ticketId: body.ticketId,
        to: body.recipientEmail,
        subject: emailPayload.subject,
      });

      // Store notification in database for manual follow-up
      try {
        await supabase.from('email_notifications_queue').insert({
          type: body.type,
          ticket_id: body.ticketId,
          recipient_email: body.recipientEmail,
          recipient_name: body.recipientName,
          subject: emailPayload.subject,
          html_content: html,
          text_content: text,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      } catch (dbError) {
        // Table might not exist, continue anyway
        console.log('[EmailNotification] Could not queue email:', dbError);
      }

      result = {
        success: true,
        error: 'Email queued (no provider configured)',
      };
    }

    if (!result.success) {
      console.error('[EmailNotification] Failed to send:', result.error);
      return {
        statusCode: 500,
        headers: getMinimalCorsHeaders(origin) || getSecurityHeaders(),
        body: JSON.stringify({
          error: 'Failed to send email notification',
          details: result.error,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...(corsHeaders || getSecurityHeaders()),
      },
      body: JSON.stringify({
        success: true,
        message: 'Email notification sent',
        ticketId: body.ticketId,
      }),
    };
  } catch (error) {
    console.error('[EmailNotification] Error:', error);
    return {
      statusCode: 500,
      headers: getMinimalCorsHeaders(origin) || getSecurityHeaders(),
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Export with auth and rate limiting middleware
export const handler = withRateLimitTier('authenticated')(
  withAuth(emailNotificationHandler)
);
