/**
 * Google Gemini Provider Tests
 * Comprehensive unit tests for Google Gemini LLM integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GoogleProvider,
  GoogleError,
  GoogleMessage,
} from './google-gemini';

// Mock external dependencies
vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('@shared/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContentStream: vi.fn(),
    },
  })),
}));

// Get mocked modules
const { supabase } = await import('@shared/lib/supabase-client');

describe('GoogleProvider', () => {
  let provider: GoogleProvider;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default auth mock
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    } as never);

    // Setup fetch mock
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    provider = new GoogleProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create provider with default configuration', () => {
      const config = provider.getConfig();

      expect(config.model).toBe('gemini-2.0-flash');
      expect(config.maxTokens).toBe(4000);
      expect(config.temperature).toBe(0.7);
      expect(config.systemPrompt).toBe('You are a helpful AI assistant.');
    });

    it('should create provider with custom configuration', () => {
      const customProvider = new GoogleProvider({
        model: 'gemini-2.5-pro',
        maxTokens: 8000,
        temperature: 0.5,
        systemPrompt: 'Custom prompt',
        thinkingMode: 'high',
      });

      const config = customProvider.getConfig();

      expect(config.model).toBe('gemini-2.5-pro');
      expect(config.maxTokens).toBe(8000);
      expect(config.temperature).toBe(0.5);
      expect(config.systemPrompt).toBe('Custom prompt');
      expect(config.thinkingMode).toBe('high');
    });

    it('should update configuration', () => {
      provider.updateConfig({
        model: 'gemini-3-pro-preview',
        temperature: 0.9,
      });

      const config = provider.getConfig();

      expect(config.model).toBe('gemini-3-pro-preview');
      expect(config.temperature).toBe(0.9);
      expect(config.maxTokens).toBe(4000); // Unchanged
    });

    it('should return configuration copy to prevent mutation', () => {
      const config1 = provider.getConfig();
      const config2 = provider.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('isConfigured', () => {
    it('should always return true (proxy-based)', () => {
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe('Static Methods', () => {
    it('should return available models', () => {
      const models = GoogleProvider.getAvailableModels();

      expect(models).toContain('gemini-2.0-flash');
      expect(models).toContain('gemini-2.5-pro');
      expect(models).toContain('gemini-3-pro-preview');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return image models', () => {
      const models = GoogleProvider.getImageModels();

      expect(models).toContain('imagen-4.0-generate-001');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return video models', () => {
      const models = GoogleProvider.getVideoModels();

      expect(models).toContain('veo-3.1-generate-preview');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return audio models', () => {
      const models = GoogleProvider.getAudioModels();

      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('sendMessage', () => {
    const mockMessages: GoogleMessage[] = [
      { role: 'user', content: 'Hello, how are you?' },
    ];

    it('should send message successfully', async () => {
      const mockResponse = {
        content: 'I am doing well, thank you!',
        usage: {
          promptTokenCount: 10,
          candidatesTokenCount: 15,
          totalTokenCount: 25,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await provider.sendMessage(mockMessages);

      expect(response.content).toBe('I am doing well, thank you!');
      expect(response.usage?.promptTokens).toBe(10);
      expect(response.usage?.completionTokens).toBe(15);
      expect(response.usage?.totalTokens).toBe(25);
      expect(response.model).toBe('gemini-2.0-flash');
    });

    it('should handle response with candidates format', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Response from Gemini' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 30,
          totalTokenCount: 50,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await provider.sendMessage(mockMessages);

      expect(response.content).toBe('Response from Gemini');
    });

    it('should throw error when not logged in', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as never);

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        GoogleError
      );
      // Error gets re-wrapped in catch block as REQUEST_FAILED
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'REQUEST_FAILED',
        retryable: true,
      });
    });

    it('should handle HTTP 429 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      });

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        GoogleError
      );
      // Error gets re-wrapped in catch block as REQUEST_FAILED
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'REQUEST_FAILED',
        retryable: true,
      });
    });

    it('should handle HTTP 503 service unavailable error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'Service unavailable' }),
      });

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        GoogleError
      );
      // Error gets re-wrapped in catch block as REQUEST_FAILED
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'REQUEST_FAILED',
        retryable: true,
      });
    });

    it('should handle HTTP 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        GoogleError
      );
    });

    it('should handle API_KEY_INVALID error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      mockFetch
        .mockRejectedValueOnce(new Error('API_KEY_INVALID'))
        .mockRejectedValueOnce(new Error('API_KEY_INVALID'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        GoogleError
      );
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'INVALID_API_KEY',
      });
    });

    it('should handle QUOTA_EXCEEDED error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      mockFetch
        .mockRejectedValueOnce(new Error('QUOTA_EXCEEDED'))
        .mockRejectedValueOnce(new Error('QUOTA_EXCEEDED'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        GoogleError
      );
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'QUOTA_EXCEEDED',
        retryable: true,
      });
    });

    it('should handle SAFETY filter error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      mockFetch
        .mockRejectedValueOnce(new Error('SAFETY blocked content'))
        .mockRejectedValueOnce(new Error('SAFETY blocked content'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        GoogleError
      );
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'SAFETY_FILTER',
        retryable: false,
      });
    });

    it('should include session and user metadata in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: 'Test response',
            usage: { promptTokenCount: 5, candidatesTokenCount: 10 },
          }),
      });

      const response = await provider.sendMessage(
        mockMessages,
        'session-123',
        'user-456'
      );

      expect(response.sessionId).toBe('session-123');
      expect(response.userId).toBe('user-456');
    });

    it('should save message to database when sessionId and userId provided', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as never);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: 'Response',
            usage: { promptTokenCount: 5 },
          }),
      });

      await provider.sendMessage(mockMessages, 'session-123', 'user-456');

      expect(supabase.from).toHaveBeenCalledWith('agent_messages');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'session-123',
          user_id: 'user-456',
          role: 'assistant',
          content: 'Response',
        })
      );
    });

    it('should handle empty response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const response = await provider.sendMessage(mockMessages);

      expect(response.content).toBe('');
      expect(response.usage?.promptTokens).toBe(0);
      expect(response.usage?.completionTokens).toBe(0);
      expect(response.usage?.totalTokens).toBe(0);
    });

    it('should send correct request format to proxy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response' }),
      });

      await provider.sendMessage(mockMessages);

      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/llm-proxies/google-proxy',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('gemini-2.0-flash');
      expect(requestBody.max_tokens).toBe(4000);
      expect(requestBody.temperature).toBe(0.7);
    });
  });

  describe('streamMessage', () => {
    const mockMessages: GoogleMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    it('should throw DIRECT_API_DISABLED error (direct API disabled)', async () => {
      const stream = provider.streamMessage(mockMessages);

      await expect(stream.next()).rejects.toThrow(GoogleError);
      await expect(
        provider.streamMessage(mockMessages).next()
      ).rejects.toMatchObject({
        code: 'DIRECT_API_DISABLED',
      });
    });
  });

  describe('Message Conversion', () => {
    it('should convert messages to Gemini format with system prompt', async () => {
      provider.updateConfig({ systemPrompt: 'You are a helpful bot.' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response' }),
      });

      const messages: GoogleMessage[] = [
        { role: 'system', content: 'Additional system context' },
        { role: 'user', content: 'User question' },
        { role: 'assistant', content: 'Previous response' },
        { role: 'user', content: 'Follow up' },
      ];

      await provider.sendMessage(messages);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

      // Check that system prompt is included
      expect(requestBody.system).toBe('You are a helpful bot.');
    });
  });

  describe('GoogleError', () => {
    it('should create error with correct properties', () => {
      const error = new GoogleError('Test error', 'SAFETY_FILTER', false);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('SAFETY_FILTER');
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('GoogleError');
    });

    it('should create retryable error', () => {
      const error = new GoogleError('Rate limited', 'HTTP_429', true);

      expect(error.retryable).toBe(true);
    });

    it('should have proper stack trace', () => {
      const error = new GoogleError('Test', 'TEST');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('GoogleError');
    });
  });

  describe('Error Handling Edge Cases', () => {
    const mockMessages: GoogleMessage[] = [
      { role: 'user', content: 'Test' },
    ];

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        GoogleError
      );
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'REQUEST_FAILED',
        retryable: true,
      });
    });

    it('should handle JSON parse error in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        GoogleError
      );
    });

    it('should handle malformed usage data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: 'Response',
            usage: { prompt_tokens: 'invalid' }, // Invalid type
          }),
      });

      const response = await provider.sendMessage(mockMessages);

      // Should handle gracefully with fallback values
      expect(response.usage).toBeDefined();
    });

    it('should not save to database when sessionId is missing', async () => {
      const insertMock = vi.fn();
      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as never);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response' }),
      });

      await provider.sendMessage(mockMessages, undefined, 'user-123');

      expect(insertMock).not.toHaveBeenCalled();
    });

    it('should not save to database when userId is missing', async () => {
      const insertMock = vi.fn();
      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as never);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response' }),
      });

      await provider.sendMessage(mockMessages, 'session-123', undefined);

      expect(insertMock).not.toHaveBeenCalled();
    });
  });
});
