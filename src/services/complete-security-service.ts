// Complete Security Service for AI Employees
// Comprehensive security, validation, and access control

import { supabase } from '../integrations/supabase/client';
import type { 
  APIResponse, 
  EmployeeError,
  ValidationResult,
  ValidationError
} from '../types/complete-ai-employee';

export interface SecurityConfig {
  maxToolExecutionsPerHour: number;
  maxChatMessagesPerHour: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
  enableRateLimiting: boolean;
  enableAuditLogging: boolean;
  enableDataEncryption: boolean;
}

export interface AccessControl {
  userId: string;
  permissions: string[];
  roles: string[];
  restrictions: string[];
  expiresAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface RateLimit {
  userId: string;
  action: string;
  count: number;
  windowStart: string;
  windowEnd: string;
  blocked: boolean;
}

export interface SecurityViolation {
  id: string;
  userId: string;
  type: 'rate_limit' | 'unauthorized_access' | 'invalid_input' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, unknown>;
  timestamp: string;
  resolved: boolean;
}

class CompleteSecurityService {
  private config: SecurityConfig;
  private rateLimits: Map<string, RateLimit> = new Map();
  private auditLogs: AuditLog[] = [];
  private violations: SecurityViolation[] = [];
  private isInitialized = false;

  constructor() {
    this.config = {
      maxToolExecutionsPerHour: 100,
      maxChatMessagesPerHour: 500,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['.txt', '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'],
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      enableRateLimiting: true,
      enableAuditLogging: true,
      enableDataEncryption: true
    };
    this.initializeService();
  }

  // Initialize the security service
  private async initializeService() {
    if (this.isInitialized) return;
    
    try {
      // Set up security monitoring
      this.setupSecurityMonitoring();
      
      // Initialize rate limiting
      this.initializeRateLimiting();
      
      this.isInitialized = true;
      // Security service initialized
    } catch (error) {
      console.error('❌ Failed to initialize security service:', error);
    }
  }

  // ========================================
  // ACCESS CONTROL
  // ========================================

  // Check user permissions
  async checkPermission(
    userId: string,
    action: string,
    resource: string
  ): Promise<APIResponse<boolean>> {
    try {
      // Get user access control
      const accessControl = await this.getUserAccessControl(userId);
      
      if (!accessControl.success || !accessControl.data) {
        return {
          success: false,
          error: 'Access control not found',
          timestamp: new Date().toISOString()
        };
      }

      const hasPermission = accessControl.data.permissions.includes(action) ||
                           accessControl.data.roles.includes('admin') ||
                           accessControl.data.roles.includes('super_admin');

      // Log access attempt
      await this.logAuditEvent({
        userId,
        action: `check_permission_${action}`,
        resource,
        resourceId: resource,
        details: { hasPermission },
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
        success: hasPermission
      });

      return {
        success: true,
        data: hasPermission,
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

  // Get user access control
  async getUserAccessControl(userId: string): Promise<APIResponse<AccessControl>> {
    try {
      const { data, error } = await supabase
        .from('user_access_control')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as AccessControl,
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

  // Update user permissions
  async updateUserPermissions(
    userId: string,
    permissions: string[],
    roles: string[]
  ): Promise<APIResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('user_access_control')
        .upsert({
          user_id: userId,
          permissions,
          roles,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Log permission update
      await this.logAuditEvent({
        userId,
        action: 'update_permissions',
        resource: 'user_access_control',
        resourceId: userId,
        details: { permissions, roles },
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
        success: true
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
  // RATE LIMITING
  // ========================================

  // Check rate limit
  async checkRateLimit(
    userId: string,
    action: string
  ): Promise<APIResponse<boolean>> {
    try {
      if (!this.config.enableRateLimiting) {
        return {
          success: true,
          data: true,
          timestamp: new Date().toISOString()
        };
      }

      const rateLimitKey = `${userId}_${action}`;
      const now = new Date();
      const windowStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      // Get current rate limit
      let rateLimit = this.rateLimits.get(rateLimitKey);
      
      if (!rateLimit || new Date(rateLimit.windowStart) < windowStart) {
        // Create new rate limit window
        rateLimit = {
          userId,
          action,
          count: 0,
          windowStart: now.toISOString(),
          windowEnd: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
          blocked: false
        };
      }

      // Check if user is blocked
      if (rateLimit.blocked) {
        await this.logSecurityViolation({
          userId,
          type: 'rate_limit',
          severity: 'medium',
          description: `Rate limit exceeded for action: ${action}`,
          details: { action, count: rateLimit.count }
        });

        return {
          success: false,
          error: 'Rate limit exceeded',
          timestamp: new Date().toISOString()
        };
      }

      // Increment count
      rateLimit.count++;
      
      // Check if limit exceeded
      const maxCount = this.getMaxCountForAction(action);
      if (rateLimit.count > maxCount) {
        rateLimit.blocked = true;
        
        await this.logSecurityViolation({
          userId,
          type: 'rate_limit',
          severity: 'high',
          description: `Rate limit exceeded for action: ${action}`,
          details: { action, count: rateLimit.count, maxCount }
        });

        return {
          success: false,
          error: 'Rate limit exceeded',
          timestamp: new Date().toISOString()
        };
      }

      // Update rate limit
      this.rateLimits.set(rateLimitKey, rateLimit);

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

  // Get max count for action
  private getMaxCountForAction(action: string): number {
    switch (action) {
      case 'tool_execution':
        return this.config.maxToolExecutionsPerHour;
      case 'chat_message':
        return this.config.maxChatMessagesPerHour;
      default:
        return 100;
    }
  }

  // ========================================
  // INPUT VALIDATION
  // ========================================

  // Validate input
  validateInput(
    data: unknown,
    schema: Record<string, unknown>
  ): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED'
        });
        continue;
      }

      // Skip validation if value is not provided and not required
      if (value === undefined || value === null) continue;

      // Check type
      if (rules.type && typeof value !== rules.type) {
        errors.push({
          field,
          message: `${field} must be of type ${rules.type}`,
          code: 'INVALID_TYPE'
        });
      }

      // Check min/max length
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.minLength} characters`,
          code: 'MIN_LENGTH'
        });
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({
          field,
          message: `${field} must be at most ${rules.maxLength} characters`,
          code: 'MAX_LENGTH'
        });
      }

      // Check min/max values
      if (rules.min !== undefined && value < rules.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.min}`,
          code: 'MIN_VALUE'
        });
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push({
          field,
          message: `${field} must be at most ${rules.max}`,
          code: 'MAX_VALUE'
        });
      }

      // Check pattern
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} format is invalid`,
          code: 'INVALID_PATTERN'
        });
      }

      // Check enum values
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({
          field,
          message: `${field} must be one of: ${rules.enum.join(', ')}`,
          code: 'INVALID_ENUM'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitize input
  sanitizeInput(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove potentially dangerous characters
      return data
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: unknown = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return data;
  }

  // ========================================
  // FILE SECURITY
  // ========================================

  // Validate file upload
  validateFileUpload(file: File): ValidationResult {
    const errors: ValidationError[] = [];

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push({
        field: 'file',
        message: `File size must be less than ${this.config.maxFileSize / (1024 * 1024)}MB`,
        code: 'FILE_TOO_LARGE'
      });
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.config.allowedFileTypes.includes(fileExtension)) {
      errors.push({
        field: 'file',
        message: `File type ${fileExtension} is not allowed`,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Check file name
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push({
        field: 'file',
        message: 'File name contains invalid characters',
        code: 'INVALID_FILE_NAME'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Scan file for malware
  async scanFile(file: File): Promise<APIResponse<boolean>> {
    try {
      // In a real implementation, this would use a malware scanning service
      // For now, we'll do basic checks
      
      // Check file signature
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // Basic file signature validation
      const isValidSignature = this.validateFileSignature(uint8Array, file.type);
      
      if (!isValidSignature) {
        await this.logSecurityViolation({
          userId: 'system',
          type: 'suspicious_activity',
          severity: 'high',
          description: 'Suspicious file upload detected',
          details: { fileName: file.name, fileType: file.type, fileSize: file.size }
        });

        return {
          success: false,
          error: 'File failed security scan',
          timestamp: new Date().toISOString()
        };
      }

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

  // Validate file signature
  private validateFileSignature(uint8Array: Uint8Array, mimeType: string): boolean {
    // Basic file signature validation
    const signatures: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47]],
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
      'text/plain': [] // No specific signature for text files
    };

    const expectedSignature = signatures[mimeType];
    if (!expectedSignature || expectedSignature.length === 0) {
      return true; // No signature to validate
    }

    for (const signature of expectedSignature) {
      if (signature.every((byte, index) => uint8Array[index] === byte)) {
        return true;
      }
    }

    return false;
  }

  // ========================================
  // AUDIT LOGGING
  // ========================================

  // Log audit event
  async logAuditEvent(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      if (!this.config.enableAuditLogging) return;

      const auditLog: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...event,
        timestamp: new Date().toISOString()
      };

      // Store in memory
      this.auditLogs.push(auditLog);

      // Store in database
      await supabase
        .from('audit_logs')
        .insert(auditLog);

      // Keep only last 1000 logs in memory
      if (this.auditLogs.length > 1000) {
        this.auditLogs = this.auditLogs.slice(-1000);
      }
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  // Get audit logs
  async getAuditLogs(
    userId?: string,
    action?: string,
    limit: number = 100
  ): Promise<APIResponse<AuditLog[]>> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data as AuditLog[],
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
  // SECURITY VIOLATIONS
  // ========================================

  // Log security violation
  async logSecurityViolation(violation: Omit<SecurityViolation, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityViolation: SecurityViolation = {
        id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...violation,
        timestamp: new Date().toISOString()
      };

      // Store in memory
      this.violations.push(securityViolation);

      // Store in database
      await supabase
        .from('security_violations')
        .insert(securityViolation);

      // Keep only last 500 violations in memory
      if (this.violations.length > 500) {
        this.violations = this.violations.slice(-500);
      }
    } catch (error) {
      console.error('Error logging security violation:', error);
    }
  }

  // Get security violations
  async getSecurityViolations(
    userId?: string,
    type?: string,
    severity?: string,
    limit: number = 100
  ): Promise<APIResponse<SecurityViolation[]>> {
    try {
      let query = supabase
        .from('security_violations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (severity) {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data as SecurityViolation[],
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
  // SECURITY MONITORING
  // ========================================

  // Setup security monitoring
  private setupSecurityMonitoring(): void {
    // Monitor for suspicious activity
    setInterval(() => {
      this.monitorSuspiciousActivity();
    }, 60000); // Check every minute

    // Clean up old rate limits
    setInterval(() => {
      this.cleanupRateLimits();
    }, 300000); // Clean up every 5 minutes
  }

  // Monitor suspicious activity
  private async monitorSuspiciousActivity(): Promise<void> {
    try {
      // Check for high frequency of violations
      const recentViolations = this.violations.filter(
        v => new Date(v.timestamp).getTime() > Date.now() - 60 * 60 * 1000 // Last hour
      );

      if (recentViolations.length > 10) {
        await this.logSecurityViolation({
          userId: 'system',
          type: 'suspicious_activity',
          severity: 'critical',
          description: 'High frequency of security violations detected',
          details: { violationCount: recentViolations.length }
        });
      }
    } catch (error) {
      console.error('Error monitoring suspicious activity:', error);
    }
  }

  // Cleanup rate limits
  private cleanupRateLimits(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [key, rateLimit] of this.rateLimits.entries()) {
      if (new Date(rateLimit.windowStart) < oneHourAgo) {
        this.rateLimits.delete(key);
      }
    }
  }

  // Initialize rate limiting
  private initializeRateLimiting(): void {
    // Load existing rate limits from database
    this.loadRateLimits();
  }

  // Load rate limits from database
  private async loadRateLimits(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('rate_limits')
        .select('*')
        .gte('window_end', new Date().toISOString());

      if (error) throw error;

      if (data) {
        data.forEach(rateLimit => {
          this.rateLimits.set(
            `${rateLimit.user_id}_${rateLimit.action}`,
            rateLimit as RateLimit
          );
        });
      }
    } catch (error) {
      console.error('Error loading rate limits:', error);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  // Get client IP
  private getClientIP(): string {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1';
  }

  // Get user agent
  private getUserAgent(): string {
    return navigator.userAgent;
  }

  // Get security config
  getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Update security config
  updateSecurityConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get security stats
  getSecurityStats(): {
    totalViolations: number;
    recentViolations: number;
    activeRateLimits: number;
    auditLogsCount: number;
  } {
    const recentViolations = this.violations.filter(
      v => new Date(v.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    );

    return {
      totalViolations: this.violations.length,
      recentViolations: recentViolations.length,
      activeRateLimits: this.rateLimits.size,
      auditLogsCount: this.auditLogs.length
    };
  }

  // ========================================
  // CLEANUP
  // ========================================

  // Cleanup service
  cleanup(): void {
    this.rateLimits.clear();
    this.auditLogs.length = 0;
    this.violations.length = 0;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const completeSecurityService = new CompleteSecurityService();
