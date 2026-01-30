import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AccountLockoutService,
  LOCKOUT_PRESETS,
  type LockoutConfig,
} from './account-lockout-service';

// Mock Supabase client
vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// Mock logger
vi.mock('@shared/lib/logger', () => ({
  logger: {
    auth: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AccountLockoutService', () => {
  let service: AccountLockoutService;
  let mockSupabase: { rpc: ReturnType<typeof vi.fn> };

  const testConfig: LockoutConfig = {
    maxAttempts: 5,
    lockoutDurationMinutes: 30,
    enableAuditLogging: false, // Disable for faster tests
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const { supabase } = await import('@shared/lib/supabase-client');
    mockSupabase = supabase as { rpc: ReturnType<typeof vi.fn> };

    // Create fresh service instance for each test
    service = new AccountLockoutService(testConfig);
  });

  afterEach(() => {
    service.destroy();
    vi.useRealTimers();
  });

  describe('checkLockout', () => {
    it('should return not locked for new email', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ is_locked: false, locked_until: null, failed_attempts: 0 }],
        error: null,
      });

      const result = await service.checkLockout('test@example.com');

      expect(result.isLocked).toBe(false);
      expect(result.lockedUntil).toBeNull();
      expect(result.failedAttempts).toBe(0);
    });

    it('should return locked status when account is locked', async () => {
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      mockSupabase.rpc.mockResolvedValue({
        data: [{ is_locked: true, locked_until: lockedUntil, failed_attempts: 5 }],
        error: null,
      });

      const result = await service.checkLockout('locked@example.com');

      expect(result.isLocked).toBe(true);
      expect(result.lockedUntil).toBeTruthy();
      expect(result.message).toContain('locked');
    });

    it('should normalize email to lowercase', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ is_locked: false, locked_until: null, failed_attempts: 0 }],
        error: null,
      });

      await service.checkLockout('TEST@EXAMPLE.COM');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_account_lockout', {
        p_email: 'test@example.com',
      });
    });

    it('should fall back to in-memory when database fails', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await service.checkLockout('test@example.com');

      expect(result.isLocked).toBe(false);
      expect(result.failedAttempts).toBe(0);
    });
  });

  describe('recordFailedLogin', () => {
    it('should record first failed attempt', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            is_locked: false,
            attempts_remaining: 4,
            locked_until: null,
            should_lock: false,
          },
        ],
        error: null,
      });

      const result = await service.recordFailedLogin('test@example.com');

      expect(result.isLocked).toBe(false);
      expect(result.attemptsRemaining).toBe(4);
      expect(result.justLocked).toBe(false);
    });

    it('should warn when few attempts remaining', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            is_locked: false,
            attempts_remaining: 2,
            locked_until: null,
            should_lock: false,
          },
        ],
        error: null,
      });

      const result = await service.recordFailedLogin('test@example.com');

      expect(result.attemptsRemaining).toBe(2);
      expect(result.message).toContain('Warning');
      expect(result.message).toContain('2 attempt(s) remaining');
    });

    it('should lock account after max attempts', async () => {
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            is_locked: true,
            attempts_remaining: 0,
            locked_until: lockedUntil,
            should_lock: true,
          },
        ],
        error: null,
      });

      const result = await service.recordFailedLogin('test@example.com');

      expect(result.isLocked).toBe(true);
      expect(result.justLocked).toBe(true);
      expect(result.attemptsRemaining).toBe(0);
      expect(result.message).toContain('locked');
    });

    it('should use in-memory fallback when database fails', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Record 5 failed attempts
      for (let i = 0; i < 4; i++) {
        await service.recordFailedLogin('test@example.com');
      }
      const result = await service.recordFailedLogin('test@example.com');

      expect(result.isLocked).toBe(true);
      expect(result.justLocked).toBe(true);
    });
  });

  describe('recordSuccessfulLogin', () => {
    it('should call database to reset failed attempts', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await service.recordSuccessfulLogin('test@example.com', {
        userId: 'user-123',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('record_successful_login', {
        p_email: 'test@example.com',
      });
    });

    it('should clear in-memory store on successful login', async () => {
      // First, simulate failed attempts in memory
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await service.recordFailedLogin('test@example.com');
      await service.recordFailedLogin('test@example.com');

      // Now record successful login
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
      await service.recordSuccessfulLogin('test@example.com');

      // Check lockout should return clean state
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      const result = await service.checkLockout('test@example.com');

      expect(result.failedAttempts).toBe(0);
    });
  });

  describe('adminUnlockAccount', () => {
    it('should unlock account via database', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });

      const result = await service.adminUnlockAccount('locked@example.com', {
        adminUserId: 'admin-123',
        reason: 'User request',
      });

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('admin_unlock_account', {
        p_email: 'locked@example.com',
      });
    });

    it('should clear in-memory store on admin unlock', async () => {
      // First, lock the account in memory
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      for (let i = 0; i < 5; i++) {
        await service.recordFailedLogin('test@example.com');
      }

      // Admin unlock
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });
      await service.adminUnlockAccount('test@example.com');

      // Check lockout should return clean state
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      const result = await service.checkLockout('test@example.com');

      expect(result.isLocked).toBe(false);
    });
  });

  describe('getLockoutStats', () => {
    it('should return stats from database', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            total_locked_accounts: 5,
            total_tracked_accounts: 100,
            recent_lockouts: 3,
            avg_failed_attempts: 2.5,
          },
        ],
        error: null,
      });

      const stats = await service.getLockoutStats();

      expect(stats.totalLockedAccounts).toBe(5);
      expect(stats.totalTrackedAccounts).toBe(100);
      expect(stats.recentLockouts).toBe(3);
      expect(stats.avgFailedAttempts).toBe(2.5);
    });

    it('should return in-memory stats when database fails', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const stats = await service.getLockoutStats();

      expect(stats.totalLockedAccounts).toBe(0);
      expect(stats.totalTrackedAccounts).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultService = new AccountLockoutService();
      const config = defaultService.getConfig();

      expect(config.maxAttempts).toBe(5);
      expect(config.lockoutDurationMinutes).toBe(30);
      expect(config.enableAuditLogging).toBe(true);

      defaultService.destroy();
    });

    it('should allow configuration updates', () => {
      service.updateConfig({ maxAttempts: 3, lockoutDurationMinutes: 60 });
      const config = service.getConfig();

      expect(config.maxAttempts).toBe(3);
      expect(config.lockoutDurationMinutes).toBe(60);
    });
  });

  describe('in-memory lockout expiration', () => {
    it('should auto-expire lockout after duration', async () => {
      // Use in-memory by forcing DB error
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Lock the account
      for (let i = 0; i < 5; i++) {
        await service.recordFailedLogin('test@example.com');
      }

      // Verify locked
      let result = await service.checkLockout('test@example.com');
      expect(result.isLocked).toBe(true);

      // Advance time past lockout duration
      vi.advanceTimersByTime(31 * 60 * 1000);

      // Should be unlocked now
      result = await service.checkLockout('test@example.com');
      expect(result.isLocked).toBe(false);
    });
  });

  describe('LOCKOUT_PRESETS', () => {
    it('should have STANDARD preset', () => {
      expect(LOCKOUT_PRESETS.STANDARD).toEqual({
        maxAttempts: 5,
        lockoutDurationMinutes: 30,
        enableAuditLogging: true,
      });
    });

    it('should have HIGH_SECURITY preset', () => {
      expect(LOCKOUT_PRESETS.HIGH_SECURITY).toEqual({
        maxAttempts: 3,
        lockoutDurationMinutes: 60,
        enableAuditLogging: true,
      });
    });

    it('should have RELAXED preset', () => {
      expect(LOCKOUT_PRESETS.RELAXED).toEqual({
        maxAttempts: 10,
        lockoutDurationMinutes: 15,
        enableAuditLogging: true,
      });
    });
  });
});

describe('AccountLockoutService Integration', () => {
  let service: AccountLockoutService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Create service with in-memory only (simulate DB unavailable)
    service = new AccountLockoutService({
      maxAttempts: 3,
      lockoutDurationMinutes: 15,
      enableAuditLogging: false,
    });
  });

  afterEach(() => {
    service.destroy();
    vi.useRealTimers();
  });

  it('should handle complete lockout flow in-memory', async () => {
    const { supabase } = await import('@shared/lib/supabase-client');
    const mockSupabase = supabase as { rpc: ReturnType<typeof vi.fn> };

    // Force in-memory mode
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Database unavailable' },
    });

    // First attempt
    let result = await service.recordFailedLogin('user@test.com');
    expect(result.isLocked).toBe(false);
    expect(result.attemptsRemaining).toBe(2);

    // Second attempt
    result = await service.recordFailedLogin('user@test.com');
    expect(result.isLocked).toBe(false);
    expect(result.attemptsRemaining).toBe(1);
    expect(result.message).toContain('Warning');

    // Third attempt - should lock
    result = await service.recordFailedLogin('user@test.com');
    expect(result.isLocked).toBe(true);
    expect(result.justLocked).toBe(true);
    expect(result.attemptsRemaining).toBe(0);

    // Verify check returns locked
    const checkResult = await service.checkLockout('user@test.com');
    expect(checkResult.isLocked).toBe(true);

    // Advance time past lockout
    vi.advanceTimersByTime(16 * 60 * 1000);

    // Should be unlocked
    const finalCheck = await service.checkLockout('user@test.com');
    expect(finalCheck.isLocked).toBe(false);
  });

  it('should handle successful login resetting lockout counter', async () => {
    const { supabase } = await import('@shared/lib/supabase-client');
    const mockSupabase = supabase as { rpc: ReturnType<typeof vi.fn> };

    // Force in-memory mode
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Database unavailable' },
    });

    // Two failed attempts
    await service.recordFailedLogin('user@test.com');
    await service.recordFailedLogin('user@test.com');

    // Successful login
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    await service.recordSuccessfulLogin('user@test.com');

    // Force in-memory mode again
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Database unavailable' },
    });

    // New failed attempt should start fresh
    const result = await service.recordFailedLogin('user@test.com');
    expect(result.attemptsRemaining).toBe(2);
  });
});
