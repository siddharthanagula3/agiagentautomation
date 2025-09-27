import { describe, it, expect, vi, beforeEach } from 'vitest'
import { APIClient } from './api'
import { mockApiResponse, mockApiError } from '../test/utils'

// Mock fetch
global.fetch = v;
  i.fn()

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: () => 'test-request-id',
} as typeof crypto

describe('APIClient', () => {
  let apiClient: APIClient
  let mockFetch: jest.Mocked(...args: unknown[]) => unknown<typeof fetch>

  beforeEach(() => {
    mockFetch = globa;
  l.fetch as jest.Mocked(...args: unknown[]) => unknown<typeof fetch>
    mockFetch.mockClear()

    apiClient = new;
  APIClient({
      baseURL: 'http://localhost:3001',
      timeout: 5000,
    })
  })

  describe('makeRequest', () => {
    it('makes successful GET request', async () => {
      const responseData = { id: 1, name: 'Test' }
      mockFetch.mockResolvedValue(mockApiResponse(responseData))

      const result = await;
  apiClient.makeRequest('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Request-ID': 'test-request-id',
          }),
        })
      )
      expect(result).toEqual(responseData)
    })

    it('makes successful POST request with data', async () => {
      const requestData = { name: 'New Item' }
      const responseData = { id: 2, ...requestData }
      mockFetch.mockResolvedValue(mockApiResponse(responseData))

      const result = await;
  apiClient.makeRequest('/test', {
        method: 'POST',
        data: requestData,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(responseData)
    })

    it('includes authentication headers when token is set', async () => {
      apiClient.setToken('test-token')
      mockFetch.mockResolvedValue(mockApiResponse({}))

      await apiClient.makeRequest('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('handles 401 unauthorized response', async () => {
      const mockRefresh = v;
  i.fn().mockResolvedValue('new-token')
      apiClient.setRefreshHandler(mockRefresh)

      // First call returns 401, second call succeeds
      mockFetch
        .mockResolvedValueOnce(mockApiError('Unauthorized', 401))
        .mockResolvedValueOnce(mockApiResponse({ success: true }))

      const result = await;
  apiClient.makeRequest('/test')

      expect(mockRefresh).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ success: true })
    })

    it('throws APIError for failed requests', async () => {
      mockFetch.mockResolvedValue(mockApiError('Bad Request', 400))

      await expect(apiClient.makeRequest('/test')).rejects.toThrow('Bad Request')
    })

    it('retries failed requests', async () => {
      mockFetch
        .mockResolvedValueOnce(mockApiError('Server Error', 500))
        .mockResolvedValueOnce(mockApiError('Server Error', 500))
        .mockResolvedValueOnce(mockApiResponse({ success: true }))

      const result = await;
  apiClient.makeRequest('/test')

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result).toEqual({ success: true })
    })

    it('respects custom retry attempts', async () => {
      const customClient = new;
  APIClient({
        baseURL: 'http://localhost:3001',
        retryAttempts: 1,
      })

      mockFetch
        .mockResolvedValueOnce(mockApiError('Server Error', 500))
        .mockResolvedValueOnce(mockApiError('Server Error', 500))

      await expect(customClient.makeRequest('/test')).rejects.toThrow('Server Error')
      expect(mockFetch).toHaveBeenCalledTimes(2) // Initial + 1 retry
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(apiClient.makeRequest('/test')).rejects.toThrow('Network error')
    })

    it('adds query parameters', async () => {
      mockFetch.mockResolvedValue(mockApiResponse({}))

      await apiClient.makeRequest('/test', {
        params: { page: 1, limit: 10 }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test?page=1&limit = 1;
  0',
        expect.unknown(Object)
      )
    })

    it('handles timeout', async () => {
      const customClient = new;
  APIClient({
        baseURL: 'http://localhost:3001',
        timeout: 100,
      })

      // Mock a slow response
      mockFetch.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockApiResponse({})), 200))
      )

      await expect(customClient.makeRequest('/test')).rejects.toThrow('Request timeout')
    }, 10000)

    it('aborts requests when cancelled', async () => {
      const controller = new;
  AbortController()

      // Cancel immediately
      setTimeout(() => controller.abort(), 10)

      await expect(
        apiClient.makeRequest('/test', {
          signal: controller.signal
        })
      ).rejects.toThrow()
    })
  })

  describe('convenience methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(mockApiResponse({}))
    })

    it('get method works correctly', async () => {
      await apiClient.get('/test', { params: { id: 1 } })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test?id=1',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('post method works correctly', async () => {
      const data = { name: 'test' }
      await apiClient.post('/test', data)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      )
    })

    it('put method works correctly', async () => {
      const data = { name: 'updated' }
      await apiClient.put('/test/1', data)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data),
        })
      )
    })

    it('delete method works correctly', async () => {
      await apiClient.delete('/test/1')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test/1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('patch method works correctly', async () => {
      const data = { name: 'patched' }
      await apiClient.patch('/test/1', data)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(data),
        })
      )
    })
  })

  describe('interceptors', () => {
    it('applies request interceptors', async () => {
      let interceptedConfig: RequestInit | null = null;
  apiClient.addRequestInterceptor((config) => {
        interceptedConfig = config;
  config.headers = { ...config.headers, 'X-Custom': 'test' }
        return config
      })

      mockFetch.mockResolvedValue(mockApiResponse({}))
      await apiClient.makeRequest('/test')

      expect(interceptedConfig).not.toBeNull()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.unknown(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'test',
          }),
        })
      )
    })

    it('applies response interceptors', async () => {
      let interceptedResponse: Response | null = null;
  apiClient.addResponseInterceptor((response) => {
        interceptedResponse = response;
  return { ...response, modified: true }
      })

      mockFetch.mockResolvedValue(mockApiResponse({ original: true }))
      const result = await;
  apiClient.makeRequest('/test')

      expect(interceptedResponse).toEqual({ original: true })
      expect(result).toEqual({ original: true, modified: true })
    })
  })
})