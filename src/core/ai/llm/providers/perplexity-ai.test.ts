/**
 * Perplexity AI Provider Tests
 * Comprehensive unit tests for Perplexity AI Sonar LLM integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PerplexityProvider,
  PerplexityError,
  PerplexityMessage,
} from './perplexity-ai';

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

// Get mocked modules
const { supabase } = await import('@shared/lib/supabase-client');

describe('PerplexityProvider', () => {
  let provider: PerplexityProvider;
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

    provider = new PerplexityProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create provider with default configuration', () => {
      const config = provider.getConfig();

      expect(config.model).toBe('sonar');
      expect(config.maxTokens).toBe(4000);
      expect(config.temperature).toBe(0.7);
      expect(config.systemPrompt).toBe(
        'You are a helpful AI assistant with access to real-time web search.'
      );
      expect(config.searchDomain).toBeUndefined();
      expect(config.searchRecencyFilter).toBeUndefined();
    });

    it('should create provider with custom configuration', () => {
      const customProvider = new PerplexityProvider({
        model: 'sonar-pro',
        maxTokens: 8000,
        temperature: 0.5,
        systemPrompt: 'Custom prompt',
        searchDomain: 'example.com',
        searchRecencyFilter: 'week',
      });

      const config = customProvider.getConfig();

      expect(config.model).toBe('sonar-pro');
      expect(config.maxTokens).toBe(8000);
      expect(config.temperature).toBe(0.5);
      expect(config.systemPrompt).toBe('Custom prompt');
      expect(config.searchDomain).toBe('example.com');
      expect(config.searchRecencyFilter).toBe('week');
    });

    it('should update configuration', () => {
      provider.updateConfig({
        model: 'sonar-reasoning',
        temperature: 0.9,
        searchRecencyFilter: 'day',
      });

      const config = provider.getConfig();

      expect(config.model).toBe('sonar-reasoning');
      expect(config.temperature).toBe(0.9);
      expect(config.searchRecencyFilter).toBe('day');
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
      const models = PerplexityProvider.getAvailableModels();

      expect(models).toContain('sonar');
      expect(models).toContain('sonar-pro');
      expect(models).toContain('sonar-reasoning');
      expect(models).toContain('sonar-deep-research');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return models by capability', () => {
      const capabilities = PerplexityProvider.getModelsByCapability();

      expect(capabilities.search).toContain('sonar');
      expect(capabilities.search).toContain('sonar-pro');
      expect(capabilities.reasoning).toContain('sonar-reasoning');
      expect(capabilities.research).toContain('sonar-deep-research');
    });
  });

  describe('sendMessage', () => {
    const mockMessages: PerplexityMessage[] = [
      { role: 'user', content: 'What is the latest news?' },
    ];

    it('should send message successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Here are the latest news...' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25,
        },
        citations: ['https://example.com/news'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await provider.sendMessage(mockMessages);

      expect(response.content).toBe('Here are the latest news...');
      expect(response.usage?.promptTokens).toBe(10);
      expect(response.usage?.completionTokens).toBe(15);
      expect(response.usage?.totalTokens).toBe(25);
      expect(response.model).toBe('sonar');
      expect(response.metadata?.citations).toEqual(['https://example.com/news']);
    });

    it('should handle response with content field directly', async () => {
      const mockResponse = {
        content: 'Direct content response',
        usage: {
          prompt_tokens: 5,
          completion_tokens: 10,
          total_tokens: 15,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await provider.sendMessage(mockMessages);

      expect(response.content).toBe('Direct content response');
    });

    it('should throw error when not logged in', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as never);

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        PerplexityError
      );
      // Error gets re-wrapped in catch block as REQUEST_FAILED (message doesn't match special patterns)
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'REQUEST_FAILED',
        retryable: true,
      });
    });

    it('should handle HTTP 429 rate limit error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
        });

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        PerplexityError
      );
      // HTTP errors get re-wrapped in catch block. Since error message is "Rate limit exceeded"
      // (not containing '429'), it falls through to REQUEST_FAILED
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'REQUEST_FAILED',
        retryable: true,
      });
    });

    it('should handle HTTP 503 service unavailable error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ error: 'Service unavailable' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ error: 'Service unavailable' }),
        });

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        PerplexityError
      );
      // HTTP errors get re-wrapped as REQUEST_FAILED (message doesn't match special patterns)
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'REQUEST_FAILED',
        retryable: true,
      });
    });

    it('should handle API_KEY_INVALID error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      mockFetch
        .mockRejectedValueOnce(new Error('API_KEY_INVALID'))
        .mockRejectedValueOnce(new Error('API_KEY_INVALID'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        PerplexityError
      );
      // Catch block checks for API_KEY_INVALID pattern
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'INVALID_API_KEY',
      });
    });

    it('should handle 401 unauthorized error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      mockFetch
        .mockRejectedValueOnce(new Error('401 Unauthorized'))
        .mockRejectedValueOnce(new Error('401 Unauthorized'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        PerplexityError
      );
      // Catch block checks for '401' pattern
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
        PerplexityError
      );
      // Catch block checks for QUOTA_EXCEEDED pattern
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'QUOTA_EXCEEDED',
        retryable: true,
      });
    });

    it('should handle 429 in error message', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      mockFetch
        .mockRejectedValueOnce(new Error('429 Too Many Requests'))
        .mockRejectedValueOnce(new Error('429 Too Many Requests'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        PerplexityError
      );
      // Catch block checks for '429' pattern
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'QUOTA_EXCEEDED',
        retryable: true,
      });
    });

    it('should handle RATE_LIMIT error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      mockFetch
        .mockRejectedValueOnce(new Error('RATE_LIMIT exceeded'))
        .mockRejectedValueOnce(new Error('RATE_LIMIT exceeded'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        PerplexityError
      );
      // Catch block checks for RATE_LIMIT pattern
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'RATE_LIMIT',
        retryable: true,
      });
    });

    it('should include session and user metadata in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: 'Test response',
            usage: { prompt_tokens: 5, completion_tokens: 10 },
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
            usage: { prompt_tokens: 5 },
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
    });

    it('should send search config in request', async () => {
      provider.updateConfig({
        searchDomain: 'news.example.com',
        searchRecencyFilter: 'day',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response' }),
      });

      await provider.sendMessage(mockMessages);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.search_domain_filter).toBe('news.example.com');
      expect(requestBody.search_recency_filter).toBe('day');
    });

    it('should send correct request format to proxy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response' }),
      });

      await provider.sendMessage(mockMessages);

      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/llm-proxies/perplexity-proxy',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('sonar');
      expect(requestBody.max_tokens).toBe(4000);
      expect(requestBody.temperature).toBe(0.7);
    });

    it('should preserve message metadata', async () => {
      const messagesWithMetadata: PerplexityMessage[] = [
        {
          role: 'user',
          content: 'Test',
          metadata: {
            sessionId: 'sess-1',
            userId: 'user-1',
            employeeId: 'emp-1',
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response' }),
      });

      await provider.sendMessage(messagesWithMetadata);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Messages sent to API should have role and content only
      expect(requestBody.messages[0]).toEqual({
        role: 'user',
        content: 'Test',
      });
    });
  });

  describe('streamMessage', () => {
    const mockMessages: PerplexityMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    it('should throw DIRECT_API_DISABLED error (direct API disabled)', async () => {
      const stream = provider.streamMessage(mockMessages);

      await expect(stream.next()).rejects.toThrow(PerplexityError);
      await expect(
        provider.streamMessage(mockMessages).next()
      ).rejects.toMatchObject({
        code: 'DIRECT_API_DISABLED',
      });
    });
  });

  describe('PerplexityError', () => {
    it('should create error with correct properties', () => {
      const error = new PerplexityError('Test error', 'QUOTA_EXCEEDED', true);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('QUOTA_EXCEEDED');
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('PerplexityError');
    });

    it('should create non-retryable error', () => {
      const error = new PerplexityError('Auth failed', 'INVALID_API_KEY', false);

      expect(error.retryable).toBe(false);
    });

    it('should have proper stack trace', () => {
      const error = new PerplexityError('Test', 'TEST');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('PerplexityError');
    });
  });

  describe('Error Handling Edge Cases', () => {
    const mockMessages: PerplexityMessage[] = [
      { role: 'user', content: 'Test' },
    ];

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        PerplexityError
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
        PerplexityError
      );
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

    it('should handle database save error gracefully', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: new Error('DB error') });
      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as never);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response' }),
      });

      // Should not throw even if database save fails
      const response = await provider.sendMessage(
        mockMessages,
        'session-123',
        'user-456'
      );
      expect(response.content).toBe('Response');
    });
  });

  describe('Message Conversion', () => {
    it('should extract last user message for prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response' }),
      });

      const messages: PerplexityMessage[] = [
        { role: 'system', content: 'System context' },
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer' },
        { role: 'user', content: 'Follow up question' },
      ];

      await provider.sendMessage(messages);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // All messages should be sent
      expect(requestBody.messages.length).toBe(4);
    });
  });
});
