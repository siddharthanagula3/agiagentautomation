import { describe, it, expect } from 'vitest';
import { cn } from '@shared/lib/utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isInactive = false;
      expect(cn('base', isActive && 'conditional')).toBe('base conditional');
      expect(cn('base', isInactive && 'conditional')).toBe('base');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid');
    });

    it('should handle empty strings', () => {
      expect(cn('base', '', 'valid')).toBe('base valid');
    });

    it('should handle complex conditional logic', () => {
      const isActive = true;
      const isDisabled = false;
      expect(
        cn('base', isActive && 'active', isDisabled && 'disabled', 'always')
      ).toBe('base active always');
    });

    it('should handle Tailwind class conflicts', () => {
      // This tests that tailwind-merge is working correctly
      expect(cn('p-2 p-4')).toBe('p-4'); // Last one should win
      expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('should handle objects with boolean values', () => {
      expect(
        cn({
          class1: true,
          class2: false,
          class3: true,
        })
      ).toBe('class1 class3');
    });
  });
});
