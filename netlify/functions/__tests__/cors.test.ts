/**
 * CORS Utility Tests
 *
 * Tests for CORS handling in Netlify Functions.
 * Ensures proper origin validation, header generation, and security.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isAllowedOrigin,
  getCorsHeaders,
  getMinimalCorsHeaders,
  getSecurityHeaders,
  getSafeCorsHeaders,
  checkOriginAndBlock,
} from '../utils/cors';

describe('CORS Utility', () => {
  beforeEach(() => {
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAllowedOrigin', () => {
    describe('Production domains', () => {
      it('should allow main production domain', () => {
        expect(isAllowedOrigin('https://agiagentautomation.netlify.app')).toBe(true);
      });

      it('should allow custom domain', () => {
        expect(isAllowedOrigin('https://agiagentautomation.com')).toBe(true);
      });

      it('should allow www subdomain', () => {
        expect(isAllowedOrigin('https://www.agiagentautomation.com')).toBe(true);
      });
    });

    describe('Development domains', () => {
      it('should allow localhost:5173', () => {
        expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
      });

      it('should allow localhost:8888', () => {
        expect(isAllowedOrigin('http://localhost:8888')).toBe(true);
      });

      it('should allow 127.0.0.1:5173', () => {
        expect(isAllowedOrigin('http://127.0.0.1:5173')).toBe(true);
      });

      it('should allow 127.0.0.1:8888', () => {
        expect(isAllowedOrigin('http://127.0.0.1:8888')).toBe(true);
      });
    });

    describe('Netlify deploy previews and branch deploys', () => {
      it('should allow deploy preview URLs', () => {
        expect(isAllowedOrigin('https://deploy-preview-123--agiagentautomation.netlify.app')).toBe(true);
      });

      it('should allow branch deploy URLs', () => {
        expect(isAllowedOrigin('https://feature-branch--agiagentautomation.netlify.app')).toBe(true);
      });

      it('should allow complex branch names', () => {
        expect(isAllowedOrigin('https://fix-cors-issue--agiagentautomation.netlify.app')).toBe(true);
      });
    });

    describe('Security - Subdomain spoofing prevention', () => {
      it('should reject subdomain spoofing attempts', () => {
        // SECURITY: Attacker could create agiagentautomation-evil.netlify.app
        expect(isAllowedOrigin('https://agiagentautomation-evil.netlify.app')).toBe(false);
      });

      it('should reject prefix spoofing attempts', () => {
        expect(isAllowedOrigin('https://fake-agiagentautomation.netlify.app')).toBe(false);
      });

      it('should reject entirely different Netlify apps', () => {
        expect(isAllowedOrigin('https://malicious-site.netlify.app')).toBe(false);
      });
    });

    describe('Invalid origins', () => {
      it('should reject undefined origin', () => {
        expect(isAllowedOrigin(undefined)).toBe(false);
      });

      it('should reject empty string origin', () => {
        expect(isAllowedOrigin('')).toBe(false);
      });

      it('should reject random external domains', () => {
        expect(isAllowedOrigin('https://evil-site.com')).toBe(false);
        expect(isAllowedOrigin('https://google.com')).toBe(false);
        expect(isAllowedOrigin('https://attacker.io')).toBe(false);
      });

      it('should reject wrong port on localhost', () => {
        expect(isAllowedOrigin('http://localhost:3000')).toBe(false);
        expect(isAllowedOrigin('http://localhost:4000')).toBe(false);
      });

      it('should reject HTTPS for localhost', () => {
        expect(isAllowedOrigin('https://localhost:5173')).toBe(false);
      });

      it('should reject HTTP for production domains', () => {
        expect(isAllowedOrigin('http://agiagentautomation.com')).toBe(false);
      });
    });
  });

  describe('getCorsHeaders', () => {
    it('should return CORS headers for allowed origin', () => {
      const headers = getCorsHeaders('http://localhost:5173');

      expect(headers).not.toBeNull();
      expect(headers!['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
      expect(headers!['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization, X-Requested-With');
      expect(headers!['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
      expect(headers!['Access-Control-Allow-Credentials']).toBe('true');
      expect(headers!['Vary']).toBe('Origin');
    });

    it('should return null for unauthorized origin', () => {
      const headers = getCorsHeaders('https://evil-site.com');

      expect(headers).toBeNull();
    });

    it('should return null for undefined origin', () => {
      const headers = getCorsHeaders(undefined);

      expect(headers).toBeNull();
    });

    it('should include production domain in headers', () => {
      const headers = getCorsHeaders('https://agiagentautomation.netlify.app');

      expect(headers).not.toBeNull();
      expect(headers!['Access-Control-Allow-Origin']).toBe('https://agiagentautomation.netlify.app');
    });
  });

  describe('getMinimalCorsHeaders', () => {
    it('should return CORS + security headers for allowed origin', () => {
      const headers = getMinimalCorsHeaders('http://localhost:5173');

      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
      expect(headers['Vary']).toBe('Origin');
      // Should include security headers
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
    });

    it('should return only security headers for unauthorized origin', () => {
      const headers = getMinimalCorsHeaders('https://evil-site.com');

      // Should NOT have CORS headers
      expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
      // Should have security headers
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
    });
  });

  describe('getSecurityHeaders', () => {
    it('should return all security headers', () => {
      const headers = getSecurityHeaders();

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
    });
  });

  describe('getSafeCorsHeaders', () => {
    it('should return combined CORS and security headers for allowed origin', () => {
      const headers = getSafeCorsHeaders('http://localhost:5173');

      // CORS headers
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
      expect(headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
      // Security headers
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
    });

    it('should return only security headers for unauthorized origin', () => {
      const headers = getSafeCorsHeaders('https://evil-site.com');

      // Should NOT have CORS headers
      expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
      expect(headers['Access-Control-Allow-Methods']).toBeUndefined();
      // Should have security headers
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
    });

    it('should be safe to spread in response (never null)', () => {
      const allowedHeaders = getSafeCorsHeaders('http://localhost:5173');
      const unauthorizedHeaders = getSafeCorsHeaders('https://evil-site.com');
      const undefinedHeaders = getSafeCorsHeaders(undefined);

      // All should be objects that can be safely spread
      expect(typeof allowedHeaders).toBe('object');
      expect(typeof unauthorizedHeaders).toBe('object');
      expect(typeof undefinedHeaders).toBe('object');

      // Spreading should work without errors
      const response1 = { ...allowedHeaders };
      const response2 = { ...unauthorizedHeaders };
      const response3 = { ...undefinedHeaders };

      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
      expect(response3).toBeDefined();
    });
  });

  describe('checkOriginAndBlock', () => {
    it('should return null for allowed origins', () => {
      expect(checkOriginAndBlock('http://localhost:5173')).toBeNull();
      expect(checkOriginAndBlock('https://agiagentautomation.netlify.app')).toBeNull();
    });

    it('should return 403 response for unauthorized origin', () => {
      const result = checkOriginAndBlock('https://evil-site.com');

      expect(result).not.toBeNull();
      expect(result!.statusCode).toBe(403);
      expect(JSON.parse(result!.body)).toEqual({
        error: 'Forbidden',
        message: 'Origin not allowed',
      });
    });

    it('should return 403 response for undefined origin', () => {
      const result = checkOriginAndBlock(undefined);

      expect(result).not.toBeNull();
      expect(result!.statusCode).toBe(403);
    });

    it('should include security headers in blocked response', () => {
      const result = checkOriginAndBlock('https://evil-site.com');

      expect(result!.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(result!.headers['X-Frame-Options']).toBe('DENY');
    });

    it('should log warning for blocked origins', () => {
      checkOriginAndBlock('https://evil-site.com');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[CORS] Blocked request from unauthorized origin:'),
        'https://evil-site.com'
      );
    });
  });
});
