import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('handles conditional classes', () => {
      const condition1 = true;
      const condition2 = false;
      const result = cn('base', condition1 ? 'conditional' : '', condition2 ? 'not-included' : '')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('not-included')
    })

    it('handles empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('filters out falsy values', () => {
      const result = cn('valid', null, undefined, '', 'also-valid')
      expect(result).toContain('valid')
      expect(result).toContain('also-valid')
      expect(result).not.toContain('null')
      expect(result).not.toContain('undefined')
    })
  })
})