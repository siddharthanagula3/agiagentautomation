import { describe, it, expect } from 'vitest';
import { cn } from '@shared/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const condition = true;
    const falseCondition = false;
    expect(cn('base', condition && 'conditional')).toBe('base conditional');
    expect(cn('base', falseCondition && 'conditional')).toBe('base');
  });

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });

  it('should handle empty strings', () => {
    expect(cn('base', '')).toBe('base');
  });

  it('should handle complex conditional logic', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe(
      'base active'
    );
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
