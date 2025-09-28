import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type Notification = Database['public']['Tables']['notifications']['Row'];

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  user_id: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: {
    info: number;
    success: number;
    warning: number;
    error: number;
  };
}

class NotificationsService {
  async getNotifications(userId: string, limit: number = 50): Promise<{ data: NotificationData[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('NotificationsService: Error fetching notifications:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('NotificationsService: Unexpected error:', error);
      return { data: [], error: 'Failed to fetch notifications' };
    }
  }

  async getNotificationStats(userId: string): Promise<{ data: NotificationStats; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, is_read')
        .eq('user_id', userId);

      if (error) {
        console.error('NotificationsService: Error fetching stats:', error);
        return { 
          data: { total: 0, unread: 0, read: 0, byType: { info: 0, success: 0, warning: 0, error: 0 } }, 
          error: error.message 
        };
      }

      const stats: NotificationStats = {
        total: data?.length || 0,
        unread: data?.filter(n => !n.is_read).length || 0,
        read: data?.filter(n => n.is_read).length || 0,
        byType: {
          info: data?.filter(n => n.type === 'info').length || 0,
          success: data?.filter(n => n.type === 'success').length || 0,
          warning: data?.filter(n => n.type === 'warning').length || 0,
          error: data?.filter(n => n.type === 'error').length || 0,
        }
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('NotificationsService: Unexpected error:', error);
      return { 
        data: { total: 0, unread: 0, read: 0, byType: { info: 0, success: 0, warning: 0, error: 0 } }, 
        error: 'Failed to fetch notification stats' 
      };
    }
  }

  async markAsRead(notificationId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('NotificationsService: Error marking as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('NotificationsService: Unexpected error:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('NotificationsService: Error marking all as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('NotificationsService: Unexpected error:', error);
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  }

  async createNotification(userId: string, notification: Omit<NotificationData, 'id' | 'created_at' | 'user_id'>): Promise<{ data: NotificationData | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          is_read: notification.is_read,
          action_url: notification.action_url,
          metadata: notification.metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('NotificationsService: Error creating notification:', error);
        return { data: null, error: error.message };
      }

      return { data: data as NotificationData, error: null };
    } catch (error) {
      console.error('NotificationsService: Unexpected error:', error);
      return { data: null, error: 'Failed to create notification' };
    }
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('NotificationsService: Error deleting notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('NotificationsService: Unexpected error:', error);
      return { success: false, error: 'Failed to delete notification' };
    }
  }
}

export const notificationsService = new NotificationsService();
