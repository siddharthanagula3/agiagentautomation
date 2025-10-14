import { describe, it, expect } from 'vitest';
import {
  getFallbackAvatar,
  getAvatarUrl,
  getAIEmployeeAvatar,
  isDiceBearUrl,
  getFallbackForDiceBear,
} from './avatar-utils';

describe('Avatar Utils', () => {
  describe('getFallbackAvatar', () => {
    it('should return a consistent avatar for the same seed', () => {
      const avatar1 = getFallbackAvatar('test-seed');
      const avatar2 = getFallbackAvatar('test-seed');
      expect(avatar1).toBe(avatar2);
    });

    it('should return different avatars for different seeds', () => {
      const avatar1 = getFallbackAvatar('seed1');
      const avatar2 = getFallbackAvatar('seed2');
      expect(avatar1).not.toBe(avatar2);
    });

    it('should return a valid DiceBear URL', () => {
      const avatar = getFallbackAvatar('test');
      expect(avatar).toContain('api.dicebear.com');
      expect(avatar).toContain('bottts');
      expect(avatar).toContain('backgroundColor');
    });

    it('should handle empty string seed', () => {
      const avatar = getFallbackAvatar('');
      expect(avatar).toBeDefined();
      expect(avatar).toContain('api.dicebear.com');
    });

    it('should handle special characters in seed', () => {
      const avatar = getFallbackAvatar('test@#$%^&*()');
      expect(avatar).toBeDefined();
      expect(avatar).toContain('api.dicebear.com');
    });
  });

  describe('getAvatarUrl', () => {
    it('should return fallback avatar when useFallback is true', () => {
      const url = getAvatarUrl('test-seed', true);
      expect(url).toContain('api.dicebear.com');
      expect(url).toContain('bottts');
    });

    it('should return DiceBear URL when useFallback is false', () => {
      const url = getAvatarUrl('test-seed', false);
      expect(url).toContain('api.dicebear.com');
      expect(url).toContain('bottts');
      expect(url).toContain('seed=test-seed');
    });

    it('should default to not using fallback', () => {
      const url = getAvatarUrl('test-seed');
      expect(url).toContain('api.dicebear.com');
      expect(url).toContain('seed=test-seed');
    });

    it('should URL encode the seed', () => {
      const url = getAvatarUrl('test seed with spaces');
      expect(url).toContain('seed=test%20seed%20with%20spaces');
    });
  });

  describe('getAIEmployeeAvatar', () => {
    it('should create consistent seed from employee name', () => {
      const avatar1 = getAIEmployeeAvatar('John Doe');
      const avatar2 = getAIEmployeeAvatar('John Doe');
      expect(avatar1).toBe(avatar2);
    });

    it('should handle names with special characters', () => {
      const avatar = getAIEmployeeAvatar('John-Doe_123');
      expect(avatar).toContain('api.dicebear.com');
    });

    it('should convert to lowercase and replace non-alphanumeric characters', () => {
      const avatar = getAIEmployeeAvatar('John Doe & Associates');
      expect(avatar).toContain('seed=john-doe---associates');
    });

    it('should use fallback when specified', () => {
      const avatar = getAIEmployeeAvatar('Test Employee', true);
      expect(avatar).toContain('api.dicebear.com');
      expect(avatar).toContain('bottts');
    });
  });

  describe('isDiceBearUrl', () => {
    it('should return true for DiceBear URLs', () => {
      const diceBearUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=test';
      expect(isDiceBearUrl(diceBearUrl)).toBe(true);
    });

    it('should return false for non-DiceBear URLs', () => {
      const otherUrl = 'https://example.com/avatar.jpg';
      expect(isDiceBearUrl(otherUrl)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isDiceBearUrl('')).toBe(false);
    });

    it('should handle URLs with different DiceBear versions', () => {
      const url = 'https://api.dicebear.com/6.x/bottts/svg?seed=test';
      expect(isDiceBearUrl(url)).toBe(true);
    });
  });

  describe('getFallbackForDiceBear', () => {
    it('should extract seed from DiceBear URL and return fallback', () => {
      const diceBearUrl =
        'https://api.dicebear.com/7.x/bottts/svg?seed=test-seed';
      const fallback = getFallbackForDiceBear(diceBearUrl);
      expect(fallback).toContain('api.dicebear.com');
      expect(fallback).toContain('bottts');
    });

    it('should handle URL without seed parameter', () => {
      const diceBearUrl = 'https://api.dicebear.com/7.x/bottts/svg';
      const fallback = getFallbackForDiceBear(diceBearUrl);
      expect(fallback).toContain('api.dicebear.com');
    });

    it('should handle malformed URLs', () => {
      const malformedUrl = 'not-a-url';
      const fallback = getFallbackForDiceBear(malformedUrl);
      expect(fallback).toContain('api.dicebear.com');
    });

    it('should use default seed when no seed is found', () => {
      const urlWithoutSeed =
        'https://api.dicebear.com/7.x/bottts/svg?other=param';
      const fallback = getFallbackForDiceBear(urlWithoutSeed);
      expect(fallback).toContain('api.dicebear.com');
    });
  });

  describe('Integration tests', () => {
    it('should provide consistent avatar generation workflow', () => {
      const employeeName = 'AI Assistant';
      const avatar = getAIEmployeeAvatar(employeeName);

      expect(avatar).toContain('api.dicebear.com');
      expect(avatar).toContain('bottts');
      expect(isDiceBearUrl(avatar)).toBe(true);
    });

    it('should handle fallback workflow correctly', () => {
      const originalUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=test';
      const fallbackUrl = getFallbackForDiceBear(originalUrl);

      expect(isDiceBearUrl(fallbackUrl)).toBe(true);
      expect(fallbackUrl).toContain('bottts');
    });
  });
});
