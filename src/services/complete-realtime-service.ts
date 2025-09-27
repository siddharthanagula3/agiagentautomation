// Complete Real-time Service for AI Employees
// Comprehensive real-time updates, notifications, and live data synchronization

import { supabase } from '../integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import type {
  EmployeeEvent,
  EmployeeNotification,
  ChatMessage,
  ToolExecution,
  JobAssignment,
  PerformanceMetrics,
  APIResponse
} from '../types/complete-ai-employee';

export interface RealtimeSubscription {
  id: string;
  channel: RealtimeChannel;
  event: string;
  callback: (data: unknown) => void;
  isActive: boolean;
  createdAt: string;
}

export interface NotificationConfig {
  enabled: boolean;
  types: string[];
  channels: ('push' | 'email' | 'sms' | 'in-app')[];
  frequency: 'immediate' | 'batched' | 'daily';
  quietHours?: {
    start: string;
    end: string;
  };
}

export interface RealtimeStats {
  activeConnections: number;
  totalSubscriptions: number;
  messagesPerSecond: number;
  lastActivity: string;
  uptime: number;
}

class CompleteRealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private notificationConfig: NotificationConfig;
  private isInitialized = false;
  private stats: RealtimeStats = {
    activeConnections: 0,
    totalSubscriptions: 0,
    messagesPerSecond: 0,
    lastActivity: new Date().toISOString(),
    uptime: 0
  };

  constructor() {
    this.notificationConfig = {
      enabled: true,
      types: ['employee_update', 'tool_execution', 'chat_message', 'performance_update'],
      channels: ['in-app', 'push'],
      frequency: 'immediate'
    };
    this.initializeService();
  }

  // Initialize the real-time service
  private async initializeService() {
    if (this.isInitialized) return;
    
    try {
      // Set up global event listeners
      this.setupGlobalEventListeners();
      
      // Initialize stats tracking
      this.startStatsTracking();
      
      this.isInitialized = true;
      console.log('✅ Real-time service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize real-time service:', error);
    }
  }

  // ========================================
  // EMPLOYEE UPDATES
  // ========================================

  // Subscribe to employee updates
  subscribeToEmployeeUpdates(
    employeeId: string,
    callback: (data: EmployeeEvent) => void
  ): string {
    const subscriptionId = `employee_${employeeId}_${Date.now()}`;
    
    const channel = supabase
      .channel(`employee_${employeeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_employees',
        filter: `id=eq.${employeeId}`
      }, (payload) => {
        const event: EmployeeEvent = {
          type: 'employee_updated',
          employeeId,
          data: payload,
          timestamp: new Date().toISOString()
        };
        callback(event);
        this.updateStats();
      })
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      event: 'employee_updated',
      callback,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.updateStats();

    return subscriptionId;
  }

  // Subscribe to all employees updates
  subscribeToAllEmployeesUpdates(
    callback: (data: EmployeeEvent) => void
  ): string {
    const subscriptionId = `all_employees_${Date.now()}`;
    
    const channel = supabase
      .channel('all_employees')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_employees'
      }, (payload) => {
        const event: EmployeeEvent = {
          type: 'employee_updated',
          employeeId: payload.new?.id || payload.old?.id,
          data: payload,
          timestamp: new Date().toISOString()
        };
        callback(event);
        this.updateStats();
      })
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      event: 'all_employees_updated',
      callback,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.updateStats();

    return subscriptionId;
  }

  // ========================================
  // CHAT MESSAGES
  // ========================================

  // Subscribe to chat messages
  subscribeToChatMessages(
    employeeId: string,
    userId: string,
    callback: (data: ChatMessage) => void
  ): string {
    const subscriptionId = `chat_${employeeId}_${userId}_${Date.now()}`;
    
    const channel = supabase
      .channel(`chat_${employeeId}_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `employee_id=eq.${employeeId}`
      }, (payload) => {
        const message = payload.new as ChatMessage;
        callback(message);
        this.updateStats();
      })
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      event: 'chat_message',
      callback,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.updateStats();

    return subscriptionId;
  }

  // Subscribe to all chat messages for user
  subscribeToUserChatMessages(
    userId: string,
    callback: (data: ChatMessage) => void
  ): string {
    const subscriptionId = `user_chat_${userId}_${Date.now()}`;
    
    const channel = supabase
      .channel(`user_chat_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const message = payload.new as ChatMessage;
        callback(message);
        this.updateStats();
      })
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      event: 'user_chat_message',
      callback,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.updateStats();

    return subscriptionId;
  }

  // ========================================
  // TOOL EXECUTIONS
  // ========================================

  // Subscribe to tool executions
  subscribeToToolExecutions(
    employeeId: string,
    callback: (data: ToolExecution) => void
  ): string {
    const subscriptionId = `tool_exec_${employeeId}_${Date.now()}`;
    
    const channel = supabase
      .channel(`tool_exec_${employeeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tool_executions',
        filter: `employee_id=eq.${employeeId}`
      }, (payload) => {
        const execution = payload.new as ToolExecution;
        callback(execution);
        this.updateStats();
      })
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      event: 'tool_execution',
      callback,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.updateStats();

    return subscriptionId;
  }

  // Subscribe to all tool executions
  subscribeToAllToolExecutions(
    callback: (data: ToolExecution) => void
  ): string {
    const subscriptionId = `all_tool_exec_${Date.now()}`;
    
    const channel = supabase
      .channel('all_tool_executions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tool_executions'
      }, (payload) => {
        const execution = payload.new as ToolExecution;
        callback(execution);
        this.updateStats();
      })
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      event: 'all_tool_execution',
      callback,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.updateStats();

    return subscriptionId;
  }

  // ========================================
  // JOB ASSIGNMENTS
  // ========================================

  // Subscribe to job assignments
  subscribeToJobAssignments(
    employeeId: string,
    callback: (data: JobAssignment) => void
  ): string {
    const subscriptionId = `job_assign_${employeeId}_${Date.now()}`;
    
    const channel = supabase
      .channel(`job_assign_${employeeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'job_assignments',
        filter: `employee_id=eq.${employeeId}`
      }, (payload) => {
        const assignment = payload.new as JobAssignment;
        callback(assignment);
        this.updateStats();
      })
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      event: 'job_assignment',
      callback,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.updateStats();

    return subscriptionId;
  }

  // ========================================
  // PERFORMANCE UPDATES
  // ========================================

  // Subscribe to performance updates
  subscribeToPerformanceUpdates(
    employeeId: string,
    callback: (data: PerformanceMetrics) => void
  ): string {
    const subscriptionId = `perf_${employeeId}_${Date.now()}`;
    
    const channel = supabase
      .channel(`perf_${employeeId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ai_employees',
        filter: `id=eq.${employeeId}`
      }, (payload) => {
        if (payload.new?.performance) {
          const performance = payload.new.performance as PerformanceMetrics;
          callback(performance);
          this.updateStats();
        }
      })
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      event: 'performance_update',
      callback,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.updateStats();

    return subscriptionId;
  }

  // ========================================
  // NOTIFICATIONS
  // ========================================

  // Subscribe to notifications
  subscribeToNotifications(
    userId: string,
    callback: (data: EmployeeNotification) => void
  ): string {
    const subscriptionId = `notifications_${userId}_${Date.now()}`;
    
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const notification = payload.new as EmployeeNotification;
        callback(notification);
        this.updateStats();
      })
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      event: 'notification',
      callback,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.updateStats();

    return subscriptionId;
  }

  // Send notification
  async sendNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<APIResponse<EmployeeNotification>> {
    try {
      const notification: EmployeeNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: type as unknown,
        title,
        message,
        data,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notifications')
        .insert(notification);

      if (error) throw error;

      return {
        success: true,
        data: notification,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // CUSTOM EVENTS
  // ========================================

  // Subscribe to custom events
  subscribeToCustomEvents(
    eventName: string,
    callback: (data: unknown) => void
  ): string {
    const subscriptionId = `custom_${eventName}_${Date.now()}`;
    
    const channel = supabase
      .channel(`custom_${eventName}`)
      .on('broadcast', {
        event: eventName
      }, (payload) => {
        callback(payload);
        this.updateStats();
      })
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      event: eventName,
      callback,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.updateStats();

    return subscriptionId;
  }

  // Broadcast custom event
  async broadcastEvent(
    eventName: string,
    data: unknown
  ): Promise<APIResponse<boolean>> {
    try {
      const channel = supabase.channel(`broadcast_${eventName}`);
      
      await channel.send({
        type: 'broadcast',
        event: eventName,
        payload: data
      });

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // SUBSCRIPTION MANAGEMENT
  // ========================================

  // Unsubscribe from subscription
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (subscription) {
      subscription.channel.unsubscribe();
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
      this.updateStats();
      return true;
    }
    
    return false;
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll(): void {
    this.subscriptions.forEach(subscription => {
      subscription.channel.unsubscribe();
      subscription.isActive = false;
    });
    this.subscriptions.clear();
    this.updateStats();
  }

  // Get active subscriptions
  getActiveSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
  }

  // Get subscription by ID
  getSubscription(subscriptionId: string): RealtimeSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  // ========================================
  // CONFIGURATION
  // ========================================

  // Update notification configuration
  updateNotificationConfig(config: Partial<NotificationConfig>): void {
    this.notificationConfig = {
      ...this.notificationConfig,
      ...config
    };
  }

  // Get notification configuration
  getNotificationConfig(): NotificationConfig {
    return this.notificationConfig;
  }

  // ========================================
  // STATS AND MONITORING
  // ========================================

  // Get real-time stats
  getStats(): RealtimeStats {
    return { ...this.stats };
  }

  // Update stats
  private updateStats(): void {
    this.stats.activeConnections = this.subscriptions.size;
    this.stats.totalSubscriptions = this.subscriptions.size;
    this.stats.lastActivity = new Date().toISOString();
  }

  // Start stats tracking
  private startStatsTracking(): void {
    setInterval(() => {
      this.stats.uptime = Date.now() - this.stats.uptime;
    }, 1000);
  }

  // ========================================
  // GLOBAL EVENT LISTENERS
  // ========================================

  // Setup global event listeners
  private setupGlobalEventListeners(): void {
    // Listen for connection status changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        this.unsubscribeAll();
      }
    });

    // Listen for network status changes
    window.addEventListener('online', () => {
      this.broadcastEvent('network_status', { status: 'online' });
    });

    window.addEventListener('offline', () => {
      this.broadcastEvent('network_status', { status: 'offline' });
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      this.broadcastEvent('visibility_change', { 
        visible: !document.hidden 
      });
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  // Check if subscription is active
  isSubscriptionActive(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    return subscription?.isActive || false;
  }

  // Get subscription count
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  // Cleanup inactive subscriptions
  cleanupInactiveSubscriptions(): void {
    this.subscriptions.forEach((subscription, id) => {
      if (!subscription.isActive) {
        this.subscriptions.delete(id);
      }
    });
  }

  // Reconnect all subscriptions
  async reconnectAll(): Promise<void> {
    const activeSubscriptions = Array.from(this.subscriptions.values());
    
    // Clear existing subscriptions
    this.unsubscribeAll();
    
    // Recreate subscriptions
    for (const subscription of activeSubscriptions) {
      // This would need to be implemented based on the specific subscription type
      console.log('Reconnecting subscription:', subscription.id);
    }
  }

  // ========================================
  // ERROR HANDLING
  // ========================================

  // Handle subscription errors
  private handleSubscriptionError(subscriptionId: string, error: unknown): void {
    console.error(`Subscription error for ${subscriptionId}:`, error);
    
    // Attempt to reconnect
    setTimeout(() => {
      this.reconnectAll();
    }, 5000);
  }

  // ========================================
  // CLEANUP
  // ========================================

  // Cleanup service
  cleanup(): void {
    this.unsubscribeAll();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const completeRealtimeService = new CompleteRealtimeService();
