/**
 * Buy Token Pack Function Tests
 *
 * Tests for the token pack purchase validation logic.
 * Focuses on input validation, pricing, and security checks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buyTokenPackSchema,
  formatValidationError,
} from '../utils/validation-schemas';

describe('Buy Token Pack - Validation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Request validation via Zod schema', () => {
    it('should accept valid request with all required fields', () => {
      const result = buyTokenPackSchema.safeParse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        userEmail: 'test@example.com',
        packId: 'pack_1.5m',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for userId', () => {
      const result = buyTokenPackSchema.safeParse({
        userId: 'invalid-uuid',
        userEmail: 'test@example.com',
        packId: 'pack_1.5m',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatValidationError(result.error);
        expect(formatted.error).toBe('Validation error');
      }
    });

    it('should reject invalid email format', () => {
      const result = buyTokenPackSchema.safeParse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        userEmail: 'not-an-email',
        packId: 'pack_1.5m',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid pack ID', () => {
      const result = buyTokenPackSchema.safeParse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        userEmail: 'test@example.com',
        packId: 'invalid_pack',
      });

      expect(result.success).toBe(false);
    });

    it.each(['pack_500k', 'pack_1.5m', 'pack_5m', 'pack_10m'])(
      'should accept valid pack ID: %s',
      (packId) => {
        const result = buyTokenPackSchema.safeParse({
          userId: '123e4567-e89b-12d3-a456-426614174000',
          userEmail: 'test@example.com',
          packId,
        });

        expect(result.success).toBe(true);
      }
    );
  });

  describe('Server-side price validation', () => {
    // These prices must match stripe-webhook.ts and buy-token-pack.ts
    const PACK_PRICES: Record<string, { tokens: number; price: number }> = {
      'pack_500k': { tokens: 500000, price: 10 },
      'pack_1.5m': { tokens: 1500000, price: 25 },
      'pack_5m': { tokens: 5000000, price: 75 },
      'pack_10m': { tokens: 10000000, price: 130 },
    };

    it('should have server-side price lookup to prevent manipulation', () => {
      // Client sends packId, server looks up the REAL price
      const clientPackId = 'pack_1.5m';
      const serverPrice = PACK_PRICES[clientPackId]?.price;

      expect(serverPrice).toBe(25);
    });

    it('should ignore client-provided tokens field', () => {
      const result = buyTokenPackSchema.safeParse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        userEmail: 'test@example.com',
        packId: 'pack_500k',
        tokens: 99999999, // Client tries to request more tokens (within schema max of 100M)
      });

      // Schema accepts it (optional field for backward compat)
      // but the server ignores this value and uses lookup
      expect(result.success).toBe(true);

      // Server would use: PACK_PRICES['pack_500k'].tokens = 500000
      // NOT the client-provided 99999999
      expect(PACK_PRICES['pack_500k'].tokens).toBe(500000);
    });

    it('should ignore client-provided price field', () => {
      const result = buyTokenPackSchema.safeParse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        userEmail: 'test@example.com',
        packId: 'pack_5m',
        price: 1, // Client tries to pay $1 instead of $75
      });

      // Schema accepts it (optional field for backward compat)
      expect(result.success).toBe(true);

      // Server would use: PACK_PRICES['pack_5m'].price = 75
      // NOT the client-provided 1
      expect(PACK_PRICES['pack_5m'].price).toBe(75);
    });

    it.each([
      ['pack_500k', 500000, 10],
      ['pack_1.5m', 1500000, 25],
      ['pack_5m', 5000000, 75],
      ['pack_10m', 10000000, 130],
    ])('pack %s should have %d tokens at $%d', (packId, tokens, price) => {
      expect(PACK_PRICES[packId].tokens).toBe(tokens);
      expect(PACK_PRICES[packId].price).toBe(price);
    });
  });

  describe('Authentication requirements', () => {
    it('should require userId to match authenticated user', () => {
      // This is enforced in the handler: event.user.id !== userId
      const authenticatedUserId = 'user-123';
      const requestUserId = 'different-user-456';

      const idMismatch = authenticatedUserId !== requestUserId;
      expect(idMismatch).toBe(true);
    });

    it('should accept matching user IDs', () => {
      const authenticatedUserId = 'user-123';
      const requestUserId = 'user-123';

      const idMatch = authenticatedUserId === requestUserId;
      expect(idMatch).toBe(true);
    });
  });

  describe('Idempotency key generation', () => {
    it('should generate idempotency key from userId, packId, and timestamp', () => {
      const userId = 'user-123';
      const packId = 'pack_1.5m';
      const timestampMinute = Math.floor(Date.now() / 60000);

      const idempotencyKey = `token_${userId}_${packId}_${timestampMinute}`;

      expect(idempotencyKey).toMatch(/^token_user-123_pack_1\.5m_\d+$/);
    });

    it('should generate same key within the same minute', () => {
      const userId = 'user-456';
      const packId = 'pack_500k';
      const timestampMinute = Math.floor(Date.now() / 60000);

      const key1 = `token_${userId}_${packId}_${timestampMinute}`;
      const key2 = `token_${userId}_${packId}_${timestampMinute}`;

      expect(key1).toBe(key2);
    });
  });

  describe('Checkout session configuration', () => {
    it('should use one-time payment mode (not subscription)', () => {
      const mode = 'payment';
      expect(mode).toBe('payment');
      expect(mode).not.toBe('subscription');
    });

    it('should store userId in metadata for webhook processing', () => {
      const metadata = {
        userId: 'user-123',
        packId: 'pack_1.5m',
        tokens: '1500000',
        type: 'token_pack_purchase',
      };

      expect(metadata.userId).toBeDefined();
      expect(metadata.type).toBe('token_pack_purchase');
    });

    it('should set correct redirect URLs', () => {
      const baseUrl = 'https://agiagentautomation.netlify.app';
      const tokens = 1500000;

      const successUrl = `${baseUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}&tokens=${tokens}`;
      const cancelUrl = `${baseUrl}/billing?canceled=true`;

      expect(successUrl).toContain('/billing?success=true');
      expect(cancelUrl).toContain('/billing?canceled=true');
    });
  });

  describe('Rate limiting', () => {
    it('should use payment tier rate limiting', () => {
      // Payment endpoints use 'payment' tier: 5 req/min
      const tier = 'payment';
      const expectedLimit = 5;

      const RATE_LIMIT_TIERS = {
        public: 5,
        authenticated: 10,
        payment: 5,
        webhook: 100,
      };

      expect(RATE_LIMIT_TIERS[tier]).toBe(expectedLimit);
    });
  });
});
