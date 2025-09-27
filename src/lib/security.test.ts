import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SecurityManager } from './security'

// Mock DOMPurify
const mockSanitize = vi.fn((html: string) => html.replace(/<script[^>]*>.*?<\/script>/gi, ''))

vi.mock('dompurify', () => ({
  default: {
    sanitize: mockSanitize,
    addHook: vi.fn(),
    removeHook: vi.fn(),
  },
}))

describe('SecurityManager', () => {
  let securityManager: SecurityManager

  beforeEach(() => {
    securityManager = new SecurityManager()
    vi.clearAllMocks()
  })

  describe('sanitizeHtml', () => {
    it('sanitizes malicious HTML', () => {
      const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p>'
      const result = securityManager.sanitizeHtml(maliciousHtml)

      expect(mockSanitize).toHaveBeenCalledWith(maliciousHtml, expect.any(Object))
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>Safe content</p>')
    })

    it('handles empty input', () => {
      const result = securityManager.sanitizeHtml('')
      expect(result).toBe('')
    })

    it('handles null input', () => {
      const result = securityManager.sanitizeHtml(null as unknown)
      expect(result).toBe('')
    })
  })

  describe('sanitizeInput', () => {
    it('trims whitespace', () => {
      const input = '  test input  '
      const result = securityManager.sanitizeInput(input)
      expect(result).toBe('test input')
    })

    it('removes null bytes', () => {
      const input = 'test\x00input'
      const result = securityManager.sanitizeInput(input)
      expect(result).toBe('testinput')
    })

    it('handles empty input', () => {
      const result = securityManager.sanitizeInput('')
      expect(result).toBe('')
    })

    it('handles null input', () => {
      const result = securityManager.sanitizeInput(null as unknown)
      expect(result).toBe('')
    })
  })

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name+tag@example.com',
        'test123@domain.co.uk',
        'firstname-lastname@example.org',
      ]

      validEmails.forEach(email => {
        expect(securityManager.validateEmail(email)).toBe(true)
      })
    })

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@.com',
        'test@com',
        '',
        null,
        undefined,
      ]

      invalidEmails.forEach(email => {
        expect(securityManager.validateEmail(email as string)).toBe(false)
      })
    })
  })

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      const strongPasswords = [
        'MyStr0ng!Password',
        'C0mplex#Pass123',
        'Secure$Password1',
      ]

      strongPasswords.forEach(password => {
        const result = securityManager.validatePassword(password)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('rejects weak passwords', () => {
      const testCases = [
        { password: 'short', expectedErrors: ['length', 'uppercase', 'number', 'special'] },
        { password: 'nouppercase123!', expectedErrors: ['uppercase'] },
        { password: 'NOLOWERCASE123!', expectedErrors: ['lowercase'] },
        { password: 'NoNumbers!', expectedErrors: ['number'] },
        { password: 'NoSpecialChars123', expectedErrors: ['special'] },
        { password: '', expectedErrors: ['length', 'uppercase', 'lowercase', 'number', 'special'] },
      ]

      testCases.forEach(({ password, expectedErrors }) => {
        const result = securityManager.validatePassword(password)
        expect(result.isValid).toBe(false)
        expectedErrors.forEach(error => {
          expect(result.errors.some(e => e.includes(error))).toBe(true)
        })
      })
    })
  })

  describe('generateCSP', () => {
    it('generates correct CSP string', () => {
      const csp = securityManager.generateCSP()

      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self'")
      expect(csp).toContain("style-src 'self'")
      expect(csp).toContain("object-src 'none'")
    })
  })

  describe('hash', () => {
    it('generates consistent hashes', async () => {
      const input = 'test string'
      const hash1 = await securityManager.hash(input)
      const hash2 = await securityManager.hash(input)

      expect(hash1).toBe(hash2)
      expect(hash1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex format
    })

    it('generates different hashes for different inputs', async () => {
      const hash1 = await securityManager.hash('input1')
      const hash2 = await securityManager.hash('input2')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('encrypt/decrypt', () => {
    it('encrypts and decrypts data correctly', () => {
      const plaintext = 'sensitive data'
      const encrypted = securityManager.encrypt(plaintext)
      const decrypted = securityManager.decrypt(encrypted)

      expect(encrypted).not.toBe(plaintext)
      expect(decrypted).toBe(plaintext)
    })

    it('generates different ciphertext for same input', () => {
      const plaintext = 'sensitive data'
      const encrypted1 = securityManager.encrypt(plaintext)
      const encrypted2 = securityManager.encrypt(plaintext)

      expect(encrypted1).not.toBe(encrypted2)

      // But both should decrypt to the same plaintext
      expect(securityManager.decrypt(encrypted1)).toBe(plaintext)
      expect(securityManager.decrypt(encrypted2)).toBe(plaintext)
    })

    it('throws error for invalid encrypted data', () => {
      expect(() => securityManager.decrypt('invalid-data')).toThrow()
    })
  })

  describe('secureStorage', () => {
    it('stores and retrieves encrypted data', () => {
      const key = 'test-key'
      const value = 'sensitive value'

      securityManager.secureStorage.setItem(key, value)
      const retrieved = securityManager.secureStorage.getItem(key)

      expect(retrieved).toBe(value)
    })

    it('handles non-existent keys', () => {
      const result = securityManager.secureStorage.getItem('non-existent')
      expect(result).toBeNull()
    })

    it('removes items correctly', () => {
      const key = 'test-key'
      const value = 'test value'

      securityManager.secureStorage.setItem(key, value)
      expect(securityManager.secureStorage.getItem(key)).toBe(value)

      securityManager.secureStorage.removeItem(key)
      expect(securityManager.secureStorage.getItem(key)).toBeNull()
    })

    it('clears all items', () => {
      securityManager.secureStorage.setItem('key1', 'value1')
      securityManager.secureStorage.setItem('key2', 'value2')

      securityManager.secureStorage.clear()

      expect(securityManager.secureStorage.getItem('key1')).toBeNull()
      expect(securityManager.secureStorage.getItem('key2')).toBeNull()
    })
  })

  describe('detectSuspiciousActivity', () => {
    it('detects multiple failed login attempts', () => {
      const activities = [
        { type: 'login_failed', timestamp: Date.now() - 1000, ip: '192.168.1.1' },
        { type: 'login_failed', timestamp: Date.now() - 500, ip: '192.168.1.1' },
        { type: 'login_failed', timestamp: Date.now(), ip: '192.168.1.1' },
      ]

      const result = securityManager.detectSuspiciousActivity(activities)
      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('Multiple failed login attempts')
    })

    it('detects rapid requests', () => {
      const activities = Array.from({ length: 15 }, (_, i) => ({
        type: 'api_request',
        timestamp: Date.now() - (i * 100), // 15 requests in 1.5 seconds
        ip: '192.168.1.1',
      }))

      const result = securityManager.detectSuspiciousActivity(activities)
      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('High frequency requests')
    })

    it('returns false for normal activity', () => {
      const activities = [
        { type: 'login_success', timestamp: Date.now() - 10000, ip: '192.168.1.1' },
        { type: 'api_request', timestamp: Date.now() - 5000, ip: '192.168.1.1' },
      ]

      const result = securityManager.detectSuspiciousActivity(activities)
      expect(result.isSuspicious).toBe(false)
      expect(result.reasons).toHaveLength(0)
    })
  })
})