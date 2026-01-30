/**
 * Account Lockout Service
 *
 * Prevents brute force attacks by tracking failed login attempts
 * and locking accounts after exceeding configurable thresholds.
 *
 * Security features:
 * - Tracks failed login attempts per email
 * - Locks accounts after N failed attempts (default: 5)
 * - Auto-unlocks after timeout period (default: 30 minutes)
 * - Provides admin override to unlock accounts
 * - Logs all lockout events for security audit
 * - In-memory fallback when database is unavailable
 */

import { supabase } from '@shared/lib/supabase-client';
import { logger } from '@shared/lib/logger';

/**
 * Configuration for account lockout policy
 */
export interface LockoutConfig {
  /** Maximum failed attempts before lockout (default: 5) */
  maxAttempts: number;
  /** Duration of lockout in minutes (default: 30) */
  lockoutDurationMinutes: number;
  /** Whether to log security events to database (default: true) */
  enableAuditLogging: boolean;
}

/**
 * Result of a lockout check
 */
export interface LockoutCheckResult {
  /** Whether the account is currently locked */
  isLocked: boolean;
  /** When the lockout expires (null if not locked) */
  lockedUntil: Date | null;
  /** Number of failed attempts so far */
  failedAttempts: number;
  /** Human-readable message */
  message: string;
}

/**
 * Result of recording a failed login attempt
 */
export interface FailedLoginResult {
  /** Whether the account is now locked */
  isLocked: boolean;
  /** Number of attempts remaining before lockout */
  attemptsRemaining: number;
  /** When the lockout expires (if locked) */
  lockedUntil: Date | null;
  /** Whether this attempt triggered the lockout */
  justLocked: boolean;
  /** Human-readable message */
  message: string;
}

/**
 * Security audit event types
 */
export type SecurityEventType =
  | 'login_failed'
  | 'login_success'
  | 'account_locked'
  | 'account_unlocked'
  | 'lockout_checked'
  | 'admin_unlock'
  | 'suspicious_activity';

/**
 * Security event severity levels
 */
export type SecuritySeverity = 'info' | 'warning' | 'critical';

/**
 * Security audit event details
 */
export interface SecurityEventDetails {
  eventType: SecurityEventType;
  email?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  severity?: SecuritySeverity;
}

/**
 * In-memory lockout tracking (fallback when DB unavailable)
 */
interface InMemoryLockoutEntry {
  failedAttempts: number;
  lockedUntil: number | null;
  lastFailedAt: number;
}

const DEFAULT_CONFIG: LockoutConfig = {
  maxAttempts: 5,
  lockoutDurationMinutes: 30,
  enableAuditLogging: true,
};

class AccountLockoutService {
  private config: LockoutConfig;
  private inMemoryStore: Map<string, InMemoryLockoutEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<LockoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupInterval();
  }

  /**
   * Update lockout configuration
   */
  updateConfig(config: Partial<LockoutConfig>): void {
    this.config = { ...this.config, ...config };
    logger.auth(`Account lockout config updated: max=${this.config.maxAttempts}, duration=${this.config.lockoutDurationMinutes}min`);
  }

  /**
   * Get current configuration
   */
  getConfig(): LockoutConfig {
    return { ...this.config };
  }

  /**
   * Check if an account is currently locked
   */
  async checkLockout(email: string): Promise<LockoutCheckResult> {
    const normalizedEmail = this.normalizeEmail(email);

    try {
      // Try database first
      const { data, error } = await supabase.rpc('check_account_lockout', {
        p_email: normalizedEmail,
      });

      if (error) {
        logger.warn('Database lockout check failed, using in-memory fallback:', error.message);
        return this.checkLockoutInMemory(normalizedEmail);
      }

      if (data && data.length > 0) {
        const result = data[0];
        const isLocked = result.is_locked === true;
        const lockedUntil = result.locked_until ? new Date(result.locked_until) : null;

        return {
          isLocked,
          lockedUntil,
          failedAttempts: result.failed_attempts || 0,
          message: isLocked
            ? `Account is locked until ${lockedUntil?.toLocaleString()}. Please try again later.`
            : 'Account is not locked.',
        };
      }

      return {
        isLocked: false,
        lockedUntil: null,
        failedAttempts: 0,
        message: 'Account is not locked.',
      };
    } catch (err) {
      logger.warn('Lockout check exception, using in-memory fallback:', err);
      return this.checkLockoutInMemory(normalizedEmail);
    }
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedLogin(
    email: string,
    details?: { ipAddress?: string; userAgent?: string }
  ): Promise<FailedLoginResult> {
    const normalizedEmail = this.normalizeEmail(email);

    try {
      // Record in database
      const { data, error } = await supabase.rpc('record_failed_login', {
        p_email: normalizedEmail,
        p_max_attempts: this.config.maxAttempts,
        p_lockout_duration_minutes: this.config.lockoutDurationMinutes,
      });

      if (error) {
        logger.warn('Database failed login record failed, using in-memory fallback:', error.message);
        return this.recordFailedLoginInMemory(normalizedEmail);
      }

      if (data && data.length > 0) {
        const result = data[0];
        const isLocked = result.is_locked === true;
        const justLocked = result.should_lock === true;
        const lockedUntil = result.locked_until ? new Date(result.locked_until) : null;
        const attemptsRemaining = result.attempts_remaining || 0;

        // Log security event
        if (this.config.enableAuditLogging) {
          const severity: SecuritySeverity = justLocked ? 'critical' : isLocked ? 'warning' : 'info';
          const eventType: SecurityEventType = justLocked ? 'account_locked' : 'login_failed';

          await this.logSecurityEvent({
            eventType,
            email: normalizedEmail,
            ipAddress: details?.ipAddress,
            userAgent: details?.userAgent,
            severity,
            details: {
              attemptsRemaining,
              isLocked,
              justLocked,
            },
          });
        }

        let message: string;
        if (justLocked) {
          message = `Account locked due to too many failed attempts. Try again after ${lockedUntil?.toLocaleString()}.`;
        } else if (isLocked) {
          message = `Account is locked. Try again after ${lockedUntil?.toLocaleString()}.`;
        } else if (attemptsRemaining <= 2) {
          message = `Invalid credentials. Warning: ${attemptsRemaining} attempt(s) remaining before account lockout.`;
        } else {
          message = 'Invalid credentials.';
        }

        return {
          isLocked,
          attemptsRemaining,
          lockedUntil,
          justLocked,
          message,
        };
      }

      // Fallback result
      return {
        isLocked: false,
        attemptsRemaining: this.config.maxAttempts - 1,
        lockedUntil: null,
        justLocked: false,
        message: 'Invalid credentials.',
      };
    } catch (err) {
      logger.warn('Failed login record exception, using in-memory fallback:', err);
      return this.recordFailedLoginInMemory(normalizedEmail);
    }
  }

  /**
   * Record a successful login (resets failed attempts)
   */
  async recordSuccessfulLogin(
    email: string,
    details?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);

    try {
      // Reset in database
      const { error } = await supabase.rpc('record_successful_login', {
        p_email: normalizedEmail,
      });

      if (error) {
        logger.warn('Database successful login record failed:', error.message);
      }

      // Always clear in-memory store
      this.inMemoryStore.delete(normalizedEmail);

      // Log security event
      if (this.config.enableAuditLogging) {
        await this.logSecurityEvent({
          eventType: 'login_success',
          email: normalizedEmail,
          userId: details?.userId,
          ipAddress: details?.ipAddress,
          userAgent: details?.userAgent,
          severity: 'info',
        });
      }
    } catch (err) {
      logger.warn('Successful login record exception:', err);
      // Still clear in-memory store
      this.inMemoryStore.delete(normalizedEmail);
    }
  }

  /**
   * Admin override to unlock an account
   */
  async adminUnlockAccount(
    email: string,
    adminDetails?: { adminUserId?: string; reason?: string }
  ): Promise<boolean> {
    const normalizedEmail = this.normalizeEmail(email);

    try {
      const { data, error } = await supabase.rpc('admin_unlock_account', {
        p_email: normalizedEmail,
      });

      if (error) {
        logger.error('Admin unlock failed:', error.message);
        return false;
      }

      // Always clear in-memory store
      this.inMemoryStore.delete(normalizedEmail);

      // Log security event
      if (this.config.enableAuditLogging) {
        await this.logSecurityEvent({
          eventType: 'admin_unlock',
          email: normalizedEmail,
          userId: adminDetails?.adminUserId,
          severity: 'warning',
          details: {
            adminUserId: adminDetails?.adminUserId,
            reason: adminDetails?.reason || 'Manual admin unlock',
          },
        });
      }

      logger.auth(`Account unlocked by admin: ${normalizedEmail}`);
      return data === true;
    } catch (err) {
      logger.error('Admin unlock exception:', err);
      // Still clear in-memory store as fallback
      this.inMemoryStore.delete(normalizedEmail);
      return true; // Allow unlock even if DB fails
    }
  }

  /**
   * Get lockout statistics for admin dashboard
   */
  async getLockoutStats(): Promise<{
    totalLockedAccounts: number;
    totalTrackedAccounts: number;
    recentLockouts: number;
    avgFailedAttempts: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_lockout_stats');

      if (error) {
        logger.warn('Failed to get lockout stats:', error.message);
        return this.getInMemoryStats();
      }

      if (data && data.length > 0) {
        const stats = data[0];
        return {
          totalLockedAccounts: stats.total_locked_accounts || 0,
          totalTrackedAccounts: stats.total_tracked_accounts || 0,
          recentLockouts: stats.recent_lockouts || 0,
          avgFailedAttempts: parseFloat(stats.avg_failed_attempts) || 0,
        };
      }

      return this.getInMemoryStats();
    } catch (err) {
      logger.warn('Lockout stats exception:', err);
      return this.getInMemoryStats();
    }
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEventDetails): Promise<string | null> {
    if (!this.config.enableAuditLogging) {
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('log_security_event', {
        p_event_type: event.eventType,
        p_email: event.email || null,
        p_user_id: event.userId || null,
        p_ip_address: event.ipAddress || null,
        p_user_agent: event.userAgent || null,
        p_details: event.details || null,
        p_severity: event.severity || 'info',
      });

      if (error) {
        logger.warn('Failed to log security event:', error.message);
        return null;
      }

      return data;
    } catch (err) {
      logger.warn('Security event logging exception:', err);
      return null;
    }
  }

  // ==================== Private Methods ====================

  /**
   * Normalize email for consistent lookups
   */
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * In-memory lockout check (fallback)
   */
  private checkLockoutInMemory(email: string): LockoutCheckResult {
    const entry = this.inMemoryStore.get(email);
    const now = Date.now();

    if (!entry) {
      return {
        isLocked: false,
        lockedUntil: null,
        failedAttempts: 0,
        message: 'Account is not locked.',
      };
    }

    // Check if lockout has expired
    if (entry.lockedUntil && entry.lockedUntil <= now) {
      // Reset the entry
      entry.failedAttempts = 0;
      entry.lockedUntil = null;
    }

    const isLocked = entry.lockedUntil !== null && entry.lockedUntil > now;
    const lockedUntil = entry.lockedUntil ? new Date(entry.lockedUntil) : null;

    return {
      isLocked,
      lockedUntil,
      failedAttempts: entry.failedAttempts,
      message: isLocked
        ? `Account is locked until ${lockedUntil?.toLocaleString()}. Please try again later.`
        : 'Account is not locked.',
    };
  }

  /**
   * In-memory failed login record (fallback)
   */
  private recordFailedLoginInMemory(email: string): FailedLoginResult {
    const now = Date.now();
    let entry = this.inMemoryStore.get(email);

    if (!entry) {
      entry = {
        failedAttempts: 1,
        lockedUntil: null,
        lastFailedAt: now,
      };
      this.inMemoryStore.set(email, entry);
    } else {
      // Check if lockout has expired
      if (entry.lockedUntil && entry.lockedUntil <= now) {
        entry.failedAttempts = 1;
        entry.lockedUntil = null;
      } else {
        entry.failedAttempts++;
      }
      entry.lastFailedAt = now;
    }

    // Check if should lock
    const shouldLock = entry.failedAttempts >= this.config.maxAttempts;
    if (shouldLock && !entry.lockedUntil) {
      entry.lockedUntil = now + this.config.lockoutDurationMinutes * 60 * 1000;
    }

    const isLocked = entry.lockedUntil !== null && entry.lockedUntil > now;
    const attemptsRemaining = Math.max(0, this.config.maxAttempts - entry.failedAttempts);
    const lockedUntil = entry.lockedUntil ? new Date(entry.lockedUntil) : null;

    let message: string;
    if (shouldLock && isLocked) {
      message = `Account locked due to too many failed attempts. Try again after ${lockedUntil?.toLocaleString()}.`;
    } else if (isLocked) {
      message = `Account is locked. Try again after ${lockedUntil?.toLocaleString()}.`;
    } else if (attemptsRemaining <= 2) {
      message = `Invalid credentials. Warning: ${attemptsRemaining} attempt(s) remaining before account lockout.`;
    } else {
      message = 'Invalid credentials.';
    }

    return {
      isLocked,
      attemptsRemaining,
      lockedUntil,
      justLocked: shouldLock,
      message,
    };
  }

  /**
   * Get in-memory stats (fallback)
   */
  private getInMemoryStats(): {
    totalLockedAccounts: number;
    totalTrackedAccounts: number;
    recentLockouts: number;
    avgFailedAttempts: number;
  } {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    let totalLocked = 0;
    let recentLockouts = 0;
    let totalAttempts = 0;

    for (const entry of this.inMemoryStore.values()) {
      if (entry.lockedUntil && entry.lockedUntil > now) {
        totalLocked++;
        if (entry.lastFailedAt > oneDayAgo) {
          recentLockouts++;
        }
      }
      totalAttempts += entry.failedAttempts;
    }

    const totalTracked = this.inMemoryStore.size;
    const avgAttempts = totalTracked > 0 ? totalAttempts / totalTracked : 0;

    return {
      totalLockedAccounts: totalLocked,
      totalTrackedAccounts: totalTracked,
      recentLockouts,
      avgFailedAttempts: avgAttempts,
    };
  }

  /**
   * Start cleanup interval for in-memory store
   */
  private startCleanupInterval(): void {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredEntries();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Clean up expired in-memory entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [email, entry] of this.inMemoryStore.entries()) {
      // Remove if last failed attempt was more than 24 hours ago and not locked
      const isOld = entry.lastFailedAt < now - 24 * 60 * 60 * 1000;
      const isUnlocked = !entry.lockedUntil || entry.lockedUntil <= now;

      if (isOld && isUnlocked) {
        this.inMemoryStore.delete(email);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.auth(`Cleaned up ${cleaned} expired lockout entries`);
    }
  }

  /**
   * Destroy the service (cleanup interval)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.inMemoryStore.clear();
  }
}

// Singleton instance
export const accountLockoutService = new AccountLockoutService();

// Export class for testing
export { AccountLockoutService };

// Export configuration presets
export const LOCKOUT_PRESETS = {
  /** Standard security (5 attempts, 30 min lockout) */
  STANDARD: {
    maxAttempts: 5,
    lockoutDurationMinutes: 30,
    enableAuditLogging: true,
  },
  /** High security (3 attempts, 60 min lockout) */
  HIGH_SECURITY: {
    maxAttempts: 3,
    lockoutDurationMinutes: 60,
    enableAuditLogging: true,
  },
  /** Relaxed (10 attempts, 15 min lockout) */
  RELAXED: {
    maxAttempts: 10,
    lockoutDurationMinutes: 15,
    enableAuditLogging: true,
  },
} as const;
