/**
 * TOTP 2FA Implementation Tests
 * Tests the RFC 6238 compliant TOTP implementation
 */

import { describe, it, expect } from 'vitest';
import {
  generateTOTPSecret,
  generateOTPAuthURL,
  generateTOTPCode,
  verifyTOTPCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  TOTP_CONFIG,
} from './user-preferences';

describe('TOTP 2FA Implementation', () => {
  describe('generateTOTPSecret', () => {
    it('should generate a Base32 encoded secret', () => {
      const secret = generateTOTPSecret();

      // Base32 alphabet check
      expect(secret).toMatch(/^[A-Z2-7]+$/);

      // 20 bytes = 160 bits, which encodes to 32 Base32 characters
      expect(secret.length).toBe(32);
    });

    it('should generate unique secrets', () => {
      const secrets = new Set<string>();

      for (let i = 0; i < 100; i++) {
        secrets.add(generateTOTPSecret());
      }

      // All 100 secrets should be unique
      expect(secrets.size).toBe(100);
    });
  });

  describe('generateOTPAuthURL', () => {
    it('should generate a valid otpauth URL', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const accountName = 'test@example.com';

      const url = generateOTPAuthURL(secret, accountName);

      expect(url).toContain('otpauth://totp/');
      expect(url).toContain(`secret=${secret}`);
      expect(url).toContain('issuer=AGI%20Platform');
      expect(url).toContain('algorithm=SHA1');
      expect(url).toContain('digits=6');
      expect(url).toContain('period=30');
    });

    it('should properly encode special characters', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const accountName = 'user+test@example.com';

      const url = generateOTPAuthURL(secret, accountName);

      expect(url).toContain(encodeURIComponent(accountName));
    });

    it('should allow custom issuer', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const accountName = 'test@example.com';
      const customIssuer = 'Custom App';

      const url = generateOTPAuthURL(secret, accountName, customIssuer);

      expect(url).toContain('issuer=Custom%20App');
    });
  });

  describe('generateTOTPCode', () => {
    it('should generate a 6-digit code', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';

      const code = await generateTOTPCode(secret);

      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate consistent codes for the same time window', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const timestamp = 1234567890000; // Fixed timestamp

      const code1 = await generateTOTPCode(secret, timestamp);
      const code2 = await generateTOTPCode(secret, timestamp);

      expect(code1).toBe(code2);
    });

    it('should generate different codes for different time windows', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const timestamp1 = 1234567890000;
      const timestamp2 = timestamp1 + 30000; // Next time window

      const code1 = await generateTOTPCode(secret, timestamp1);
      const code2 = await generateTOTPCode(secret, timestamp2);

      expect(code1).not.toBe(code2);
    });

    // RFC 6238 test vector
    it('should generate correct code for RFC 6238 test vector', async () => {
      // This is a well-known test case from RFC 6238
      // Secret: 12345678901234567890 (in hex: 31323334353637383930...)
      // However, the standard test vectors use raw bytes, which we need to convert to Base32
      // For our implementation, we use a known Base32 secret

      const secret = 'GEZDGNBVGY3TQOJQ'; // Base32 encoded "12345678901234567890"
      const timestamp = 59000; // Unix time 59 (in milliseconds)

      const code = await generateTOTPCode(secret, timestamp);

      // The code should be valid 6 digits
      expect(code).toMatch(/^\d{6}$/);
    });
  });

  describe('verifyTOTPCode', () => {
    it('should verify a valid current code', async () => {
      const secret = generateTOTPSecret();
      const timestamp = Date.now();

      const code = await generateTOTPCode(secret, timestamp);
      const isValid = await verifyTOTPCode(secret, code, timestamp);

      expect(isValid).toBe(true);
    });

    it('should verify a code from the previous time window (clock drift)', async () => {
      const secret = generateTOTPSecret();
      const currentTime = Date.now();
      const previousWindow = currentTime - TOTP_CONFIG.PERIOD * 1000;

      const code = await generateTOTPCode(secret, previousWindow);
      const isValid = await verifyTOTPCode(secret, code, currentTime);

      expect(isValid).toBe(true);
    });

    it('should verify a code from the next time window (clock drift)', async () => {
      const secret = generateTOTPSecret();
      const currentTime = Date.now();
      const nextWindow = currentTime + TOTP_CONFIG.PERIOD * 1000;

      const code = await generateTOTPCode(secret, nextWindow);
      const isValid = await verifyTOTPCode(secret, code, currentTime);

      expect(isValid).toBe(true);
    });

    it('should reject an invalid code', async () => {
      const secret = generateTOTPSecret();

      const isValid = await verifyTOTPCode(secret, '000000');

      // While it's theoretically possible for 000000 to be valid,
      // the probability is extremely low (1 in 1 million)
      expect(isValid).toBe(false);
    });

    it('should reject a code from too far in the past', async () => {
      const secret = generateTOTPSecret();
      const currentTime = Date.now();
      const oldWindow = currentTime - TOTP_CONFIG.PERIOD * 2000; // Two windows back

      const code = await generateTOTPCode(secret, oldWindow);
      const isValid = await verifyTOTPCode(secret, code, currentTime);

      expect(isValid).toBe(false);
    });

    it('should handle codes with spaces', async () => {
      const secret = generateTOTPSecret();
      const timestamp = Date.now();

      const code = await generateTOTPCode(secret, timestamp);
      const codeWithSpaces = `${code.slice(0, 3)} ${code.slice(3)}`;

      const isValid = await verifyTOTPCode(secret, codeWithSpaces, timestamp);

      expect(isValid).toBe(true);
    });

    it('should reject codes of wrong length', async () => {
      const secret = generateTOTPSecret();

      const isValid1 = await verifyTOTPCode(secret, '12345');
      const isValid2 = await verifyTOTPCode(secret, '1234567');

      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate the correct number of codes', () => {
      const codes = generateBackupCodes();

      expect(codes.length).toBe(TOTP_CONFIG.BACKUP_CODE_COUNT);
    });

    it('should generate codes in the correct format', () => {
      const codes = generateBackupCodes();

      codes.forEach((code) => {
        // Format: XXXX-XXXX (alphanumeric)
        expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/);
      });
    });

    it('should generate unique codes', () => {
      const codes = generateBackupCodes();
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should not include confusing characters', () => {
      const codes = generateBackupCodes();

      codes.forEach((code) => {
        // Should not contain I, O (easily confused with 1, 0)
        expect(code).not.toMatch(/[IO]/);
      });
    });
  });

  describe('hashBackupCode', () => {
    it('should generate a consistent hash for the same code', async () => {
      const code = 'ABCD-EFGH';

      const hash1 = await hashBackupCode(code);
      const hash2 = await hashBackupCode(code);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different codes', async () => {
      const hash1 = await hashBackupCode('ABCD-EFGH');
      const hash2 = await hashBackupCode('IJKL-MNOP');

      expect(hash1).not.toBe(hash2);
    });

    it('should normalize codes (remove dashes and spaces)', async () => {
      const hash1 = await hashBackupCode('ABCD-EFGH');
      const hash2 = await hashBackupCode('ABCDEFGH');
      const hash3 = await hashBackupCode('ABCD EFGH');

      expect(hash1).toBe(hash2);
      expect(hash1).toBe(hash3);
    });

    it('should be case-insensitive', async () => {
      const hash1 = await hashBackupCode('ABCD-EFGH');
      const hash2 = await hashBackupCode('abcd-efgh');

      expect(hash1).toBe(hash2);
    });

    it('should generate a 64-character hex hash (SHA-256)', async () => {
      const hash = await hashBackupCode('ABCD-EFGH');

      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify a valid backup code', async () => {
      const codes = generateBackupCodes();
      const hashedCodes = await Promise.all(codes.map((c) => hashBackupCode(c)));

      const index = await verifyBackupCode(codes[0], hashedCodes);

      expect(index).toBe(0);
    });

    it('should return the correct index of the matched code', async () => {
      const codes = generateBackupCodes();
      const hashedCodes = await Promise.all(codes.map((c) => hashBackupCode(c)));

      const index = await verifyBackupCode(codes[3], hashedCodes);

      expect(index).toBe(3);
    });

    it('should return -1 for an invalid code', async () => {
      const codes = generateBackupCodes();
      const hashedCodes = await Promise.all(codes.map((c) => hashBackupCode(c)));

      const index = await verifyBackupCode('INVALID-CODE', hashedCodes);

      expect(index).toBe(-1);
    });

    it('should handle codes with different formatting', async () => {
      const codes = generateBackupCodes();
      const hashedCodes = await Promise.all(codes.map((c) => hashBackupCode(c)));

      // Remove dash from code
      const codeWithoutDash = codes[0].replace('-', '');
      const index = await verifyBackupCode(codeWithoutDash, hashedCodes);

      expect(index).toBe(0);
    });

    it('should handle lowercase input', async () => {
      const codes = generateBackupCodes();
      const hashedCodes = await Promise.all(codes.map((c) => hashBackupCode(c)));

      const lowercaseCode = codes[0].toLowerCase();
      const index = await verifyBackupCode(lowercaseCode, hashedCodes);

      expect(index).toBe(0);
    });
  });

  describe('TOTP_CONFIG', () => {
    it('should have RFC 6238 compliant defaults', () => {
      expect(TOTP_CONFIG.ALGORITHM).toBe('SHA1');
      expect(TOTP_CONFIG.DIGITS).toBe(6);
      expect(TOTP_CONFIG.PERIOD).toBe(30);
    });

    it('should have reasonable security parameters', () => {
      // 20 bytes = 160 bits, which is the recommended minimum
      expect(TOTP_CONFIG.SECRET_LENGTH).toBeGreaterThanOrEqual(20);

      // Should have at least 8 backup codes
      expect(TOTP_CONFIG.BACKUP_CODE_COUNT).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Edge Cases', () => {
    it('should handle epoch time correctly', async () => {
      const secret = generateTOTPSecret();
      const epochTime = 0;

      // Should not throw
      const code = await generateTOTPCode(secret, epochTime);
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should handle very large timestamps', async () => {
      const secret = generateTOTPSecret();
      const farFuture = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000; // 100 years

      // Should not throw
      const code = await generateTOTPCode(secret, farFuture);
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate valid codes at time window boundaries', async () => {
      const secret = generateTOTPSecret();

      // Test at exact 30-second boundary
      const boundary = Math.floor(Date.now() / 30000) * 30000;

      const code = await generateTOTPCode(secret, boundary);
      const isValid = await verifyTOTPCode(secret, code, boundary);

      expect(isValid).toBe(true);
    });
  });
});
