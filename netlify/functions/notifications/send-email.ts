/**
 * Email Notification Service
 * Sends transactional emails using Resend API
 * Supports ticket creation, status updates, and reply notifications
 *
 * Created: January 2026
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { z } from 'zod';
import { withAuth, AuthenticatedEvent } from '../utils/auth-middleware';
import { checkRateLimitWithTier } from '../utils/rate-limiter';
import { getSafeCorsHeaders, checkOriginAndBlock } from '../utils/cors';

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AGI Agent <noreply@agiagentautomation.com>';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@agiagentautomation.com';
const APP_NAME = 'AGI Agent Automation';
const APP_URL = process.env.VITE_APP_URL || 'https://agiagentautomation.com';

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Email notification types
 */
const emailTypeSchema = z.enum([
  'ticket_created',
  'ticket_status_update',
  'ticket_reply',
]);

/**
 * Base email request schema
 */
const baseEmailSchema = z.object({
  type: emailTypeSchema,
  to: z.string().email('Invalid email address'),
  ticketId: z.string().min(1, 'Ticket ID is required').max(100, 'Ticket ID too long'),
  ticketSubject: z.string().min(1, 'Subject is required').max(500, 'Subject too long'),
});

/**
 * Ticket created email schema
 */
const ticketCreatedSchema = baseEmailSchema.extend({
  type: z.literal('ticket_created'),
  ticketNumber: z.string().optional(),
});

/**
 * Ticket status update email schema
 */
const ticketStatusUpdateSchema = baseEmailSchema.extend({
  type: z.literal('ticket_status_update'),
  previousStatus: z.string().min(1).max(50),
  newStatus: z.string().min(1).max(50),
  statusMessage: z.string().max(1000).optional(),
});

/**
 * Ticket reply notification schema
 */
const ticketReplySchema = baseEmailSchema.extend({
  type: z.literal('ticket_reply'),
  replyPreview: z.string().max(500, 'Reply preview too long'),
  isStaffReply: z.boolean(),
  replierName: z.string().max(100).optional(),
});

/**
 * Combined email request schema using discriminated union
 */
const emailRequestSchema = z.discriminatedUnion('type', [
  ticketCreatedSchema,
  ticketStatusUpdateSchema,
  ticketReplySchema,
]);

type EmailRequest = z.infer<typeof emailRequestSchema>;

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

/**
 * Common email styles
 */
const getEmailStyles = () => `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .card {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 32px;
    margin: 20px 0;
  }
  .header {
    text-align: center;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
    margin-bottom: 24px;
  }
  .logo {
    font-size: 24px;
    font-weight: bold;
    color: #6366f1;
  }
  h1 {
    color: #1f2937;
    font-size: 24px;
    margin: 0 0 16px 0;
  }
  h2 {
    color: #374151;
    font-size: 18px;
    margin: 0 0 12px 0;
  }
  p {
    margin: 0 0 16px 0;
    color: #4b5563;
  }
  .ticket-info {
    background-color: #f9fafb;
    border-radius: 6px;
    padding: 16px;
    margin: 20px 0;
  }
  .ticket-info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .ticket-info-row:last-child {
    border-bottom: none;
  }
  .ticket-info-label {
    font-weight: 600;
    color: #6b7280;
    font-size: 14px;
  }
  .ticket-info-value {
    color: #1f2937;
    font-size: 14px;
  }
  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .status-open { background-color: #dbeafe; color: #1d4ed8; }
  .status-in_progress { background-color: #fef3c7; color: #d97706; }
  .status-resolved { background-color: #d1fae5; color: #059669; }
  .status-closed { background-color: #e5e7eb; color: #6b7280; }
  .button {
    display: inline-block;
    padding: 12px 24px;
    background-color: #6366f1;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
    margin: 16px 0;
  }
  .button:hover {
    background-color: #4f46e5;
  }
  .reply-preview {
    background-color: #f0f9ff;
    border-left: 4px solid #3b82f6;
    padding: 16px;
    margin: 20px 0;
    border-radius: 0 6px 6px 0;
  }
  .footer {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #eee;
    margin-top: 24px;
    font-size: 12px;
    color: #9ca3af;
  }
  .footer a {
    color: #6366f1;
    text-decoration: none;
  }
`;

/**
 * Generate ticket created email HTML
 */
function generateTicketCreatedEmail(data: z.infer<typeof ticketCreatedSchema>): string {
  const ticketNumber = data.ticketNumber || data.ticketId.slice(0, 8).toUpperCase();
  const ticketUrl = `${APP_URL}/dashboard/support/tickets/${data.ticketId}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Ticket Created - ${APP_NAME}</title>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">${APP_NAME}</div>
      </div>

      <h1>We've Received Your Request</h1>
      <p>Thank you for contacting us. We've created a support ticket for your request and our team will review it shortly.</p>

      <div class="ticket-info">
        <div class="ticket-info-row">
          <span class="ticket-info-label">Ticket Number</span>
          <span class="ticket-info-value">#${ticketNumber}</span>
        </div>
        <div class="ticket-info-row">
          <span class="ticket-info-label">Subject</span>
          <span class="ticket-info-value">${escapeHtml(data.ticketSubject)}</span>
        </div>
        <div class="ticket-info-row">
          <span class="ticket-info-label">Status</span>
          <span class="ticket-info-value"><span class="status-badge status-open">Open</span></span>
        </div>
        <div class="ticket-info-row">
          <span class="ticket-info-label">Created</span>
          <span class="ticket-info-value">${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
        </div>
      </div>

      <p>You can track the progress of your ticket and add additional comments by clicking the button below:</p>

      <center>
        <a href="${ticketUrl}" class="button">View Ticket</a>
      </center>

      <p style="font-size: 14px; color: #6b7280;">
        <strong>What happens next?</strong><br>
        Our support team typically responds within 24-48 hours. You'll receive an email notification when we reply to your ticket.
      </p>

      <div class="footer">
        <p>This email was sent by ${APP_NAME}</p>
        <p><a href="${APP_URL}">Visit our website</a> | <a href="${APP_URL}/support">Help Center</a></p>
        <p>If you didn't submit this ticket, please contact us at ${SUPPORT_EMAIL}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate ticket status update email HTML
 */
function generateStatusUpdateEmail(data: z.infer<typeof ticketStatusUpdateSchema>): string {
  const ticketNumber = data.ticketId.slice(0, 8).toUpperCase();
  const ticketUrl = `${APP_URL}/dashboard/support/tickets/${data.ticketId}`;
  const newStatusClass = `status-${data.newStatus.toLowerCase().replace(' ', '_')}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Status Updated - ${APP_NAME}</title>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">${APP_NAME}</div>
      </div>

      <h1>Ticket Status Updated</h1>
      <p>The status of your support ticket has been updated.</p>

      <div class="ticket-info">
        <div class="ticket-info-row">
          <span class="ticket-info-label">Ticket Number</span>
          <span class="ticket-info-value">#${ticketNumber}</span>
        </div>
        <div class="ticket-info-row">
          <span class="ticket-info-label">Subject</span>
          <span class="ticket-info-value">${escapeHtml(data.ticketSubject)}</span>
        </div>
        <div class="ticket-info-row">
          <span class="ticket-info-label">Previous Status</span>
          <span class="ticket-info-value"><span class="status-badge status-${data.previousStatus.toLowerCase().replace(' ', '_')}">${escapeHtml(formatStatus(data.previousStatus))}</span></span>
        </div>
        <div class="ticket-info-row">
          <span class="ticket-info-label">New Status</span>
          <span class="ticket-info-value"><span class="status-badge ${newStatusClass}">${escapeHtml(formatStatus(data.newStatus))}</span></span>
        </div>
      </div>

      ${data.statusMessage ? `
      <div class="reply-preview">
        <h2>Message from Support</h2>
        <p style="margin: 0;">${escapeHtml(data.statusMessage)}</p>
      </div>
      ` : ''}

      <center>
        <a href="${ticketUrl}" class="button">View Ticket</a>
      </center>

      <div class="footer">
        <p>This email was sent by ${APP_NAME}</p>
        <p><a href="${APP_URL}">Visit our website</a> | <a href="${APP_URL}/support">Help Center</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate reply notification email HTML
 */
function generateReplyNotificationEmail(data: z.infer<typeof ticketReplySchema>): string {
  const ticketNumber = data.ticketId.slice(0, 8).toUpperCase();
  const ticketUrl = `${APP_URL}/dashboard/support/tickets/${data.ticketId}`;
  const replierLabel = data.isStaffReply ? 'Support Team' : (data.replierName || 'User');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Reply on Your Ticket - ${APP_NAME}</title>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">${APP_NAME}</div>
      </div>

      <h1>${data.isStaffReply ? 'Support Team Replied' : 'New Reply on Your Ticket'}</h1>
      <p>There's a new reply on your support ticket.</p>

      <div class="ticket-info">
        <div class="ticket-info-row">
          <span class="ticket-info-label">Ticket Number</span>
          <span class="ticket-info-value">#${ticketNumber}</span>
        </div>
        <div class="ticket-info-row">
          <span class="ticket-info-label">Subject</span>
          <span class="ticket-info-value">${escapeHtml(data.ticketSubject)}</span>
        </div>
        <div class="ticket-info-row">
          <span class="ticket-info-label">Reply From</span>
          <span class="ticket-info-value">${escapeHtml(replierLabel)}</span>
        </div>
      </div>

      <div class="reply-preview">
        <h2>Reply Preview</h2>
        <p style="margin: 0;">${escapeHtml(data.replyPreview)}${data.replyPreview.length >= 500 ? '...' : ''}</p>
      </div>

      <center>
        <a href="${ticketUrl}" class="button">View Full Conversation</a>
      </center>

      <div class="footer">
        <p>This email was sent by ${APP_NAME}</p>
        <p><a href="${APP_URL}">Visit our website</a> | <a href="${APP_URL}/support">Help Center</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Escape HTML to prevent XSS in email content
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/**
 * Format status for display
 */
function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Generate plain text version of email
 */
function generatePlainText(type: string, data: EmailRequest): string {
  const ticketNumber = data.ticketId.slice(0, 8).toUpperCase();
  const ticketUrl = `${APP_URL}/dashboard/support/tickets/${data.ticketId}`;

  switch (type) {
    case 'ticket_created':
      return `
${APP_NAME} - Support Ticket Created

Thank you for contacting us. We've created a support ticket for your request.

Ticket Number: #${ticketNumber}
Subject: ${data.ticketSubject}
Status: Open

View your ticket: ${ticketUrl}

Our support team typically responds within 24-48 hours.

---
${APP_NAME}
${APP_URL}
      `.trim();

    case 'ticket_status_update': {
      const statusData = data as z.infer<typeof ticketStatusUpdateSchema>;
      return `
${APP_NAME} - Ticket Status Updated

The status of your support ticket has been updated.

Ticket Number: #${ticketNumber}
Subject: ${data.ticketSubject}
Previous Status: ${formatStatus(statusData.previousStatus)}
New Status: ${formatStatus(statusData.newStatus)}
${statusData.statusMessage ? `\nMessage: ${statusData.statusMessage}` : ''}

View your ticket: ${ticketUrl}

---
${APP_NAME}
${APP_URL}
      `.trim();
    }

    case 'ticket_reply': {
      const replyData = data as z.infer<typeof ticketReplySchema>;
      const replierLabel = replyData.isStaffReply ? 'Support Team' : (replyData.replierName || 'User');
      return `
${APP_NAME} - New Reply on Your Ticket

There's a new reply on your support ticket.

Ticket Number: #${ticketNumber}
Subject: ${data.ticketSubject}
Reply From: ${replierLabel}

Reply Preview:
${replyData.replyPreview}${replyData.replyPreview.length >= 500 ? '...' : ''}

View the full conversation: ${ticketUrl}

---
${APP_NAME}
${APP_URL}
      `.trim();
    }

    default:
      return '';
  }
}

/**
 * Get email subject based on type
 */
function getEmailSubject(type: string, data: EmailRequest): string {
  const ticketNumber = data.ticketId.slice(0, 8).toUpperCase();

  switch (type) {
    case 'ticket_created':
      return `[#${ticketNumber}] We've received your support request`;
    case 'ticket_status_update':
      return `[#${ticketNumber}] Your ticket status has been updated`;
    case 'ticket_reply':
      return `[#${ticketNumber}] New reply on your support ticket`;
    default:
      return `[#${ticketNumber}] Support ticket update`;
  }
}

/**
 * Send email via Resend API
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('[Email] RESEND_API_KEY not configured');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        text,
        headers: {
          'X-Entity-Ref-ID': crypto.randomUUID(),
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Email] Resend API error:', response.status, errorData);
      return {
        success: false,
        error: `Failed to send email: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();
    console.log('[Email] Successfully sent email:', result.id);

    return {
      success: true,
      messageId: result.id,
    };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// HANDLER
// =============================================================================

const sendEmailHandler = async (
  event: AuthenticatedEvent,
  context: HandlerContext
) => {
  const origin = event.headers['origin'] || event.headers['Origin'];
  const headers = getSafeCorsHeaders(origin);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...headers, ...SECURITY_HEADERS },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Check origin
  const originBlock = checkOriginAndBlock(origin);
  if (originBlock) {
    return originBlock;
  }

  // Rate limiting - use 'authenticated' tier (10 req/min)
  const rateLimitResult = await checkRateLimitWithTier(event, 'authenticated');
  if (!rateLimitResult.success) {
    return {
      statusCode: rateLimitResult.statusCode || 429,
      headers: {
        ...headers,
        ...SECURITY_HEADERS,
        'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '',
        'Retry-After': rateLimitResult.reset
          ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
          : '60',
      },
      body: rateLimitResult.body || JSON.stringify({ error: 'Rate limit exceeded' }),
    };
  }

  try {
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validationResult = emailRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.warn('[Email] Validation failed:', validationResult.error.flatten());
      return {
        statusCode: 400,
        headers: { ...headers, ...SECURITY_HEADERS },
        body: JSON.stringify({
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        }),
      };
    }

    const data = validationResult.data;
    console.log('[Email] Processing email request:', {
      type: data.type,
      to: data.to.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
      ticketId: data.ticketId,
    });

    // Generate email content based on type
    let html: string;
    switch (data.type) {
      case 'ticket_created':
        html = generateTicketCreatedEmail(data);
        break;
      case 'ticket_status_update':
        html = generateStatusUpdateEmail(data);
        break;
      case 'ticket_reply':
        html = generateReplyNotificationEmail(data);
        break;
      default:
        return {
          statusCode: 400,
          headers: { ...headers, ...SECURITY_HEADERS },
          body: JSON.stringify({ error: 'Invalid email type' }),
        };
    }

    const subject = getEmailSubject(data.type, data);
    const text = generatePlainText(data.type, data);

    // Send the email
    const result = await sendEmail(data.to, subject, html, text);

    if (!result.success) {
      console.error('[Email] Failed to send email:', result.error);
      return {
        statusCode: 500,
        headers: { ...headers, ...SECURITY_HEADERS },
        body: JSON.stringify({
          error: 'Failed to send email',
          message: result.error,
        }),
      };
    }

    console.log('[Email] Email sent successfully:', {
      messageId: result.messageId,
      type: data.type,
      ticketId: data.ticketId,
    });

    return {
      statusCode: 200,
      headers: { ...headers, ...SECURITY_HEADERS },
      body: JSON.stringify({
        success: true,
        messageId: result.messageId,
      }),
    };
  } catch (error) {
    console.error('[Email] Unexpected error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, ...SECURITY_HEADERS },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export const handler: Handler = withAuth(sendEmailHandler);
