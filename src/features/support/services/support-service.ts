/**
 * Support Service
 * Handles support tickets, FAQs, and help center functionality
 */

import { supabase } from '@shared/lib/supabase-client';

// =============================================================================
// EMAIL NOTIFICATION TYPES
// =============================================================================

interface TicketCreatedEmailData {
  type: 'ticket_created';
  to: string;
  ticketId: string;
  ticketSubject: string;
  ticketNumber?: string;
}

interface TicketStatusUpdateEmailData {
  type: 'ticket_status_update';
  to: string;
  ticketId: string;
  ticketSubject: string;
  previousStatus: string;
  newStatus: string;
  statusMessage?: string;
}

interface TicketReplyEmailData {
  type: 'ticket_reply';
  to: string;
  ticketId: string;
  ticketSubject: string;
  replyPreview: string;
  isStaffReply: boolean;
  replierName?: string;
}

type EmailNotificationData =
  | TicketCreatedEmailData
  | TicketStatusUpdateEmailData
  | TicketReplyEmailData;

export interface SupportTicket {
  id: string;
  user_id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  display_order: number;
  is_published: boolean;
}

class SupportService {
  /**
   * Submit a new support ticket
   */
  async submitTicket(ticket: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<{ data: SupportTicket | null; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id,
          name: ticket.name,
          email: ticket.email,
          subject: ticket.subject,
          message: ticket.message,
          status: 'open',
          priority: 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating support ticket:', error);
        return { data: null, error: error.message };
      }

      // Send email notification via Netlify function
      await this.sendTicketNotification(ticket.email, data.id, ticket.subject);

      return { data: data as SupportTicket };
    } catch (error) {
      console.error('Error submitting ticket:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's support tickets
   */
  async getUserTickets(): Promise<{
    data: SupportTicket[];
    error?: string;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        return { data: [], error: error.message };
      }

      return { data: data as SupportTicket[] };
    } catch (error) {
      console.error('Error getting tickets:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get a specific ticket with replies
   */
  async getTicket(ticketId: string): Promise<{
    ticket: SupportTicket | null;
    replies: TicketReply[];
    error?: string;
  }> {
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .maybeSingle();

      if (ticketError) {
        console.error('Error fetching ticket:', ticketError);
        return {
          ticket: null,
          replies: [],
          error: ticketError.message,
        };
      }

      if (!ticket) {
        return {
          ticket: null,
          replies: [],
          error: 'Ticket not found',
        };
      }

      const { data: replies, error: repliesError } = await supabase
        .from('support_ticket_replies')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (repliesError) {
        console.error('Error fetching replies:', repliesError);
      }

      return {
        ticket: ticket as SupportTicket,
        replies: (replies as TicketReply[]) || [],
      };
    } catch (error) {
      console.error('Error getting ticket:', error);
      return {
        ticket: null,
        replies: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add a reply to a ticket
   */
  async addReply(
    ticketId: string,
    message: string
  ): Promise<{ data: TicketReply | null; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('support_ticket_replies')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message,
          is_staff: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding reply:', error);
        return { data: null, error: error.message };
      }

      // Update ticket's updated_at timestamp
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      return { data: data as TicketReply };
    } catch (error) {
      console.error('Error adding reply:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all FAQs
   */
  async getFAQs(): Promise<{ data: FAQ[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_published', true)
        .order('category')
        .order('display_order');

      if (error) {
        console.error('Error fetching FAQs:', error);
        return { data: [], error: error.message };
      }

      return { data: data as FAQ[] };
    } catch (error) {
      console.error('Error getting FAQs:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search FAQs
   */
  async searchFAQs(query: string): Promise<{ data: FAQ[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_published', true)
        .or(
          `question.ilike.%${query}%,answer.ilike.%${query}%,category.ilike.%${query}%`
        )
        .order('category')
        .order('display_order');

      if (error) {
        console.error('Error searching FAQs:', error);
        return { data: [], error: error.message };
      }

      return { data: data as FAQ[] };
    } catch (error) {
      console.error('Error searching FAQs:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send ticket notification email via Netlify function
   * Supports multiple notification types: ticket_created, ticket_status_update, ticket_reply
   */
  private async sendTicketNotification(
    email: string,
    ticketId: string,
    subject?: string
  ): Promise<void> {
    await this.sendEmailNotification({
      type: 'ticket_created',
      to: email,
      ticketId,
      ticketSubject: subject || 'Support Ticket',
    });
  }

  /**
   * Send email notification via Netlify function
   * Generic method that supports all email notification types
   */
  async sendEmailNotification(data: EmailNotificationData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Get the current session for authentication
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.warn('[Support Service] No session for email notification, skipping');
        return { success: false, error: 'Not authenticated' };
      }

      // Call the Netlify function
      const response = await fetch('/.netlify/functions/notifications/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Support Service] Email notification failed:', response.status, errorData);
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
        };
      }

      const result = await response.json();
      console.log('[Support Service] Email notification sent:', result.messageId);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('[Support Service] Error sending email notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send ticket status update notification
   */
  async sendStatusUpdateNotification(
    ticketId: string,
    email: string,
    subject: string,
    previousStatus: string,
    newStatus: string,
    statusMessage?: string
  ): Promise<void> {
    await this.sendEmailNotification({
      type: 'ticket_status_update',
      to: email,
      ticketId,
      ticketSubject: subject,
      previousStatus,
      newStatus,
      statusMessage,
    });
  }

  /**
   * Send ticket reply notification
   */
  async sendReplyNotification(
    ticketId: string,
    email: string,
    subject: string,
    replyPreview: string,
    isStaffReply: boolean,
    replierName?: string
  ): Promise<void> {
    await this.sendEmailNotification({
      type: 'ticket_reply',
      to: email,
      ticketId,
      ticketSubject: subject,
      replyPreview: replyPreview.slice(0, 500), // Limit preview length
      isStaffReply,
      replierName,
    });
  }
}

const supportService = new SupportService();
export default supportService;
export { supportService };
