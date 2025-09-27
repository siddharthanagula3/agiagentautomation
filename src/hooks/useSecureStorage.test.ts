import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSecureStorage } from './useSecureStorage'
import { mockLocalStorage } from '../test/utils'

// Mock the security manager
const mockEncrypt = vi.fn((data: string) => `encrypted_${data}`)
const mockDecrypt = vi.fn((data: string) => data.replace('encrypted_', ''))

vi.mock('../lib/security', () => ({
  securityManager: {
    encrypt: mockEncrypt,
    decrypt: mockDecrypt,
  },
}))

describe('useSecureStorage', () => {
  let mockStorage: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    mockStorage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', { value: mockStorage })
    Object.defineProperty(window, 'sessionStorage', { value: mockStorage })
    vi.clearAllMocks()
  })

  it('returns default value when no stored value exists', () => {
    const { result } = renderHook(() =>
      useSecureStorage('test-key', 'default-value')
    )

    expect(result.current[0]).toBe('default-value')
  })

  it('stores and retrieves values with encryption', () => {
    const { result } = renderHook(() =>
      useSecureStorage('test-key', '', { encrypt: true })
    )

    act(() => {
      result.current[1]('test-value')
    })

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'test-key',
      expect.stringContaining('encrypted')
    )
    expect(result.current[0]).toBe('test-value')
  })

  it('stores and retrieves values without encryption', () => {
    const { result } = renderHook(() =>
      useSecureStorage('test-key', '', { encrypt: false })
    )

    act(() => {
      result.current[1]('test-value')
    })

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'test-key',
      '"test-value"'
    )
    expect(mockEncrypt).not.toHaveBeenCalled()
    expect(result.current[0]).toBe('test-value')
  })

  it('handles TTL expiration', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    // Mock stored data with expired TTL
    const expiredData = {
      value: 'expired-value',
      ttl: now - 1000, // Expired 1 second ago
    }

    mockStorage.getItem.mockReturnValue(JSON.stringify(expiredData))

    const { result } = renderHook(() =>
      useSecureStorage('test-key', 'default-value', { ttl: 5000 })
    )

    expect(result.current[0]).toBe('default-value')
    expect(mockStorage.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('returns non-expired values with TTL', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    // Mock stored data with valid TTL
    const validData = {
      value: 'valid-value',
      ttl: now + 5000, // Expires in 5 seconds
    }

    mockStorage.getItem.mockReturnValue(JSON.stringify(validData))

    const { result } = renderHook(() =>
      useSecureStorage('test-key', 'default-value', { ttl: 10000 })
    )

    expect(result.current[0]).toBe('valid-value')
    expect(mockStorage.removeItem).not.toHaveBeenCalled()
  })

  it('uses sessionStorage when specified', () => {
    const sessionMock = mockLocalStorage()
    Object.defineProperty(window, 'sessionStorage', { value: sessionMock })

    const { result } = renderHook(() =>
      useSecureStorage('test-key', 'default-value', { storage: 'sessionStorage' })
    )

    act(() => {
      result.current[1]('session-value')
    })

    expect(sessionMock.setItem).toHaveBeenCalled()
    expect(mockStorage.setItem).not.toHaveBeenCalled()
  })

  it('removes values correctly', () => {
    const { result } = renderHook(() =>
      useSecureStorage('test-key', 'default-value')
    )

    act(() => {
      result.current[1]('test-value')
    })

    expect(result.current[0]).toBe('test-value')

    act(() => {
      result.current[2]() // Remove value
    })

    expect(result.current[0]).toBe('default-value')
    expect(mockStorage.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('handles function updates', () => {
    const { result } = renderHook(() =>
      useSecureStorage('test-key', 10)
    )

    act(() => {
      result.current[1]((prev) => prev + 5)
    })

    expect(result.current[0]).toBe(15)
  })

  it('handles storage errors gracefully', () => {
    // Mock storage error
    mockStorage.getItem.mockImplementation(() => {
      throw new Error('Storage error')
    })

    const { result } = renderHook(() =>
      useSecureStorage('test-key', 'default-value')
    )

    expect(result.current[0]).toBe('default-value')
  })

  it('handles decryption errors gracefully', () => {
    mockDecrypt.mockImplementation(() => {
      throw new Error('Decryption failed')
    })

    const encryptedData = {
      encrypted: true,
      data: 'encrypted_data',
    }

    mockStorage.getItem.mockReturnValue(JSON.stringify(encryptedData))

    const { result } = renderHook(() =>
      useSecureStorage('test-key', 'default-value', { encrypt: true })
    )

    expect(result.current[0]).toBe('default-value')
  })

  it('works with complex objects', () => {
    const complexObject = {
      name: 'Test User',
      settings: {
        theme: 'dark',
        notifications: true,
      },
      tags: ['user', 'premium'],
    }

    const { result } = renderHook(() =>
      useSecureStorage('user-data', {})
    )

    act(() => {
      result.current[1](complexObject)
    })

    expect(result.current[0]).toEqual(complexObject)
  })
})

describe('useSecureSessionStorage', () => {
  it('uses sessionStorage by default', () => {
    const sessionMock = mockLocalStorage()
    Object.defineProperty(window, 'sessionStorage', { value: sessionMock })

    const { useSecureSessionStorage } = await import('./useSecureStorage')

    const { result } = renderHook(() =>
      useSecureSessionStorage('test-key', 'default-value')
    )

    act(() => {
      result.current[1]('session-value')
    })

    expect(sessionMock.setItem).toHaveBeenCalled()
  })
})

describe('useTemporaryStorage', () => {
  it('sets TTL correctly', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const sessionMock = mockLocalStorage()
    Object.defineProperty(window, 'sessionStorage', { value: sessionMock })

    const { useTemporaryStorage } = await import('./useSecureStorage')

    const { result } = renderHook(() =>
      useTemporaryStorage('test-key', 'default-value', 30) // 30 minutes
    )

    act(() => {
      result.current[1]('temp-value')
    })

    const storedData = JSON.parse(sessionMock.setItem.mock.calls[0][1])
    expect(storedData.ttl).toBe(now + 30 * 60 * 1000) // 30 minutes in ms
  })
})