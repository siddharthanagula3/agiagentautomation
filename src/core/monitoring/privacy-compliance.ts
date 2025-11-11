/**
 * Privacy and GDPR Compliance Service
 * Handles data privacy, consent management, and GDPR compliance
 */

import { supabase } from '@shared/lib/supabase-client';
import { monitoringService } from './system-monitor';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdParty: boolean;
}

interface DataSubjectRequest {
  id: string;
  userId: string;
  type:
    | 'access'
    | 'rectification'
    | 'erasure'
    | 'portability'
    | 'restriction'
    | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  details: unknown;
}

interface PrivacyConfig {
  enableConsentManagement: boolean;
  enableDataSubjectRequests: boolean;
  enableDataRetention: boolean;
  enableDataAnonymization: boolean;
  retentionPeriodDays: number;
  enableAuditLogging: boolean;
}

class PrivacyService {
  private isInitialized = false;
  private config: PrivacyConfig;
  private consentPreferences: ConsentPreferences | null = null;

  constructor() {
    this.config = {
      enableConsentManagement: true,
      enableDataSubjectRequests: true,
      enableDataRetention: true,
      enableDataAnonymization: true,
      retentionPeriodDays: 2555, // 7 years
      enableAuditLogging: true,
    };
  }

  /**
   * Initialize privacy service
   */
  initialize(config?: Partial<PrivacyConfig>): void {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };

    if (this.config.enableConsentManagement) {
      this.loadConsentPreferences();
    }

    if (this.config.enableDataRetention) {
      this.setupDataRetention();
    }

    this.isInitialized = true;

    console.log('PrivacyService initialized with config:', this.config);
    monitoringService.trackEvent('privacy_service_initialized', this.config);
  }

  /**
   * Load consent preferences from localStorage
   */
  private loadConsentPreferences(): void {
    try {
      const stored = localStorage.getItem('privacy_consent');
      if (stored) {
        this.consentPreferences = JSON.parse(stored);
      } else {
        // Default consent preferences
        this.consentPreferences = {
          essential: true,
          analytics: false,
          marketing: false,
          personalization: false,
          thirdParty: false,
        };
      }
    } catch (error) {
      console.error('Error loading consent preferences:', error);
      this.consentPreferences = {
        essential: true,
        analytics: false,
        marketing: false,
        personalization: false,
        thirdParty: false,
      };
    }
  }

  /**
   * Save consent preferences
   */
  saveConsentPreferences(preferences: ConsentPreferences): void {
    this.consentPreferences = preferences;
    localStorage.setItem('privacy_consent', JSON.stringify(preferences));

    // Log consent change
    if (this.config.enableAuditLogging) {
      this.logConsentChange(preferences);
    }

    monitoringService.trackEvent('consent_preferences_updated', preferences);
  }

  /**
   * Get current consent preferences
   */
  getConsentPreferences(): ConsentPreferences | null {
    return this.consentPreferences;
  }

  /**
   * Check if user has consented to a specific category
   */
  hasConsent(category: keyof ConsentPreferences): boolean {
    return this.consentPreferences?.[category] || false;
  }

  /**
   * Request data access (GDPR Article 15)
   */
  async requestDataAccess(userId: string): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: this.generateRequestId(),
      userId,
      type: 'access',
      status: 'pending',
      requestedAt: new Date(),
      details: {
        requestedData: 'all',
        format: 'json',
      },
    };

    try {
      await this.createDataSubjectRequest(request);
      monitoringService.trackEvent('data_access_requested', {
        userId,
        requestId: request.id,
      });
      return request;
    } catch (error) {
      monitoringService.captureError(error as Error, {
        context: 'data_access_request',
        userId,
      });
      throw error;
    }
  }

  /**
   * Request data rectification (GDPR Article 16)
   */
  async requestDataRectification(
    userId: string,
    dataToRectify: Record<string, unknown>
  ): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: this.generateRequestId(),
      userId,
      type: 'rectification',
      status: 'pending',
      requestedAt: new Date(),
      details: {
        dataToRectify,
        reason: 'inaccurate_data',
      },
    };

    try {
      await this.createDataSubjectRequest(request);
      monitoringService.trackEvent('data_rectification_requested', {
        userId,
        requestId: request.id,
      });
      return request;
    } catch (error) {
      monitoringService.captureError(error as Error, {
        context: 'data_rectification_request',
        userId,
      });
      throw error;
    }
  }

  /**
   * Request data erasure (GDPR Article 17 - Right to be forgotten)
   */
  async requestDataErasure(
    userId: string,
    reason?: string
  ): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: this.generateRequestId(),
      userId,
      type: 'erasure',
      status: 'pending',
      requestedAt: new Date(),
      details: {
        reason: reason || 'user_request',
        scope: 'all_personal_data',
      },
    };

    try {
      await this.createDataSubjectRequest(request);
      monitoringService.trackEvent('data_erasure_requested', {
        userId,
        requestId: request.id,
      });
      return request;
    } catch (error) {
      monitoringService.captureError(error as Error, {
        context: 'data_erasure_request',
        userId,
      });
      throw error;
    }
  }

  /**
   * Request data portability (GDPR Article 20)
   */
  async requestDataPortability(
    userId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: this.generateRequestId(),
      userId,
      type: 'portability',
      status: 'pending',
      requestedAt: new Date(),
      details: {
        format,
        requestedData: 'all',
      },
    };

    try {
      await this.createDataSubjectRequest(request);
      monitoringService.trackEvent('data_portability_requested', {
        userId,
        requestId: request.id,
      });
      return request;
    } catch (error) {
      monitoringService.captureError(error as Error, {
        context: 'data_portability_request',
        userId,
      });
      throw error;
    }
  }

  /**
   * Create data subject request in database
   */
  private async createDataSubjectRequest(
    request: DataSubjectRequest
  ): Promise<void> {
    const { error } = await supabase.from('data_subject_requests').insert({
      id: request.id,
      user_id: request.userId,
      type: request.type,
      status: request.status,
      requested_at: request.requestedAt.toISOString(),
      details: request.details,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  /**
   * Get data subject requests for a user
   */
  async getDataSubjectRequests(userId: string): Promise<DataSubjectRequest[]> {
    try {
      const { data, error } = await supabase
        .from('data_subject_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        status: row.status,
        requestedAt: new Date(row.requested_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        details: row.details,
      }));
    } catch (error) {
      monitoringService.captureError(error as Error, {
        context: 'get_data_subject_requests',
        userId,
      });
      throw error;
    }
  }

  /**
   * Process data subject request
   */
  async processDataSubjectRequest(
    requestId: string,
    action: 'approve' | 'reject'
  ): Promise<void> {
    try {
      const status = action === 'approve' ? 'completed' : 'rejected';
      const completedAt =
        action === 'approve' ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('data_subject_requests')
        .update({
          status,
          completed_at: completedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      monitoringService.trackEvent('data_subject_request_processed', {
        requestId,
        action,
        status,
      });
    } catch (error) {
      monitoringService.captureError(error as Error, {
        context: 'process_data_subject_request',
        requestId,
        action,
      });
      throw error;
    }
  }

  /**
   * Anonymize user data
   */
  async anonymizeUserData(userId: string): Promise<void> {
    try {
      // Anonymize user profile
      await supabase
        .from('user_profiles')
        .update({
          name: 'Anonymized User',
          email: `anonymized_${userId}@example.com`,
          avatar: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Anonymize chat messages
      await supabase
        .from('chat_messages')
        .update({
          message: '[Message content anonymized]',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // Anonymize audit logs
      await supabase
        .from('audit_logs')
        .update({
          user_id: `anonymized_${userId}`,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      monitoringService.trackEvent('user_data_anonymized', { userId });
    } catch (error) {
      monitoringService.captureError(error as Error, {
        context: 'anonymize_user_data',
        userId,
      });
      throw error;
    }
  }

  /**
   * Delete user data completely
   */
  async deleteUserData(userId: string): Promise<void> {
    try {
      // Delete user data from all tables
      const tables = [
        'user_profiles',
        'user_settings',
        'chat_messages',
        'chat_sessions',
        'purchased_employees',
        'audit_logs',
        'data_subject_requests',
      ];

      for (const table of tables) {
        await supabase.from(table).delete().eq('user_id', userId);
      }

      monitoringService.trackEvent('user_data_deleted', { userId });
    } catch (error) {
      monitoringService.captureError(error as Error, {
        context: 'delete_user_data',
        userId,
      });
      throw error;
    }
  }

  /**
   * Setup data retention policies
   */
  private setupDataRetention(): void {
    // Schedule data retention cleanup
    setInterval(
      () => {
        this.cleanupExpiredData();
      },
      24 * 60 * 60 * 1000
    ); // Run daily
  }

  /**
   * Clean up expired data
   */
  private async cleanupExpiredData(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(
        cutoffDate.getDate() - this.config.retentionPeriodDays
      );

      // Clean up old audit logs
      await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      // Clean up old chat messages
      await supabase
        .from('chat_messages')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      // Clean up old backup metadata
      await supabase
        .from('backup_metadata')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      monitoringService.trackEvent('expired_data_cleaned', {
        cutoffDate: cutoffDate.toISOString(),
        retentionPeriodDays: this.config.retentionPeriodDays,
      });
    } catch (error) {
      monitoringService.captureError(error as Error, {
        context: 'cleanup_expired_data',
      });
    }
  }

  /**
   * Log consent change
   */
  private async logConsentChange(
    preferences: ConsentPreferences
  ): Promise<void> {
    try {
      await supabase.from('privacy_audit_log').insert({
        event_type: 'consent_change',
        user_id: 'anonymous', // Could be actual user ID if available
        details: preferences,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging consent change:', error);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get privacy configuration
   */
  getConfig(): PrivacyConfig {
    return { ...this.config };
  }

  /**
   * Update privacy configuration
   */
  updateConfig(newConfig: Partial<PrivacyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    monitoringService.trackEvent('privacy_config_updated', newConfig);
  }

  /**
   * Export user data
   */
  async exportUserData(userId: string): Promise<unknown> {
    try {
      const userData: unknown = {};

      // Export user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      userData.profile = profile;

      // Export user settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', userId)
        .single();
      userData.settings = settings;

      // Export chat sessions
      const { data: chatSessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId);
      userData.chatSessions = chatSessions;

      // Export purchased employees
      const { data: purchasedEmployees } = await supabase
        .from('purchased_employees')
        .select('*')
        .eq('user_id', userId);
      userData.purchasedEmployees = purchasedEmployees;

      monitoringService.trackEvent('user_data_exported', { userId });
      return userData;
    } catch (error) {
      monitoringService.captureError(error as Error, {
        context: 'export_user_data',
        userId,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const privacyService = new PrivacyService();
