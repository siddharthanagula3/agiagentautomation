import { APIClient } from './api';

// Mock crypto for testing
global.crypto = {
  randomUUID: () => 'test-request-id',
} as typeof crypto;

describe('APIClient', () => {
  let apiClient: APIClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();

    apiClient = new APIClient({
      baseURL: 'http://localhost:3001',
      timeout: 5000,
    });
  });

  describe('GET requests', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle GET request errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });
  });

  describe('POST requests', () => {
    it('should make a successful POST request', async () => {
      const mockData = { name: 'test' };
      const mockResponse = { id: 1, ...mockData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await apiClient.post('/test', mockData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('PUT requests', () => {
    it('should make a successful PUT request', async () => {
      const mockData = { name: 'updated' };
      const mockResponse = { id: 1, ...mockData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await apiClient.put('/test/1', mockData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE requests', () => {
    it('should make a successful DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await apiClient.delete('/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Not found' }),
      } as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle timeout errors', async () => {
      const timeoutClient = new APIClient({
        baseURL: 'http://localhost:3001',
        timeout: 100,
      });

      mockFetch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(timeoutClient.get('/test')).rejects.toThrow('Request timeout');
    });
  });

  describe('Request headers', () => {
    it('should include default headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});