/**
 * Qwen AI Provider Tests
 * Comprehensive unit tests for Alibaba Qwen LLM integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  QwenProvider,
  QwenError,
  QwenMessage,
} from './qwen-ai';

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

describe('QwenProvider', () => {
  let provider: QwenProvider;
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

    provider = new QwenProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create provider with default configuration', () => {
      const config = provider.getConfig();

      expect(config.model).toBe('qwen-plus');
      expect(config.maxTokens).toBe(4000);
      expect(config.temperature).toBe(0.7);
      expect(config.systemPrompt).toBe('You are a helpful AI assistant.');
      expect(config.thinkingMode).toBe(false);
    });

    it('should create provider with custom configuration', () => {
      const customProvider = new QwenProvider({
        model: 'qwen3-max',
        maxTokens: 8000,
        temperature: 0.5,
        systemPrompt: 'Custom prompt',
        thinkingMode: true,
      });

      const config = customProvider.getConfig();

      expect(config.model).toBe('qwen3-max');
      expect(config.maxTokens).toBe(8000);
      expect(config.temperature).toBe(0.5);
      expect(config.systemPrompt).toBe('Custom prompt');
      expect(config.thinkingMode).toBe(true);
    });

    it('should update configuration', () => {
      provider.updateConfig({
        model: 'qwen3-coder-plus',
        temperature: 0.9,
      });

      const config = provider.getConfig();

      expect(config.model).toBe('qwen3-coder-plus');
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
      const models = QwenProvider.getAvailableModels();

      expect(models).toContain('qwen-plus');
      expect(models).toContain('qwen3-max');
      expect(models).toContain('qwen3-coder-plus');
      expect(models).toContain('qwq-plus');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return models by capability', () => {
      const capabilities = QwenProvider.getModelsByCapability();

      expect(capabilities.chat).toContain('qwen3-max');
      expect(capabilities.coding).toContain('qwen3-coder-plus');
      expect(capabilities.vision).toContain('qwen3-vl-plus');
      expect(capabilities.reasoning).toContain('qwq-plus');
    });

    it('should return image models', () => {
      const models = QwenProvider.getImageModels();

      expect(models).toContain('qwen-image-max');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return video models', () => {
      const models = QwenProvider.getVideoModels();

      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('sendMessage', () => {
    const mockMessages: QwenMessage[] = [
      { role: 'user', content: 'Write a Python function.' },
    ];

    it('should send message successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Here is the Python function...' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25,
        },
        id: 'response-123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await provider.sendMessage(mockMessages);

      expect(response.content).toBe('Here is the Python function...');
      expect(response.usage?.promptTokens).toBe(10);
      expect(response.usage?.completionTokens).toBe(15);
      expect(response.usage?.totalTokens).toBe(25);
      expect(response.model).toBe('qwen-plus');
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
        QwenError
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
        QwenError
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
        QwenError
      );
      // Error gets re-wrapped in catch block as REQUEST_FAILED
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'REQUEST_FAILED',
        retryable: true,
      });
    });

    it('should include session and user metadata in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Test response' } }],
            usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
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
            choices: [{ message: { content: 'Response' } }],
            usage: { prompt_tokens: 5 },
            id: 'resp-123',
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

    it('should send correct request format to proxy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
          }),
      });

      await provider.sendMessage(mockMessages);

      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/llm-proxies/qwen-proxy',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('qwen-plus');
      expect(requestBody.max_tokens).toBe(4000);
      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.stream).toBe(false);
    });

    it('should strip metadata from messages', async () => {
      const messagesWithMetadata: QwenMessage[] = [
        {
          role: 'user',
          content: 'Test',
          metadata: {
            sessionId: 'sess-1',
            userId: 'user-1',
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
          }),
      });

      await provider.sendMessage(messagesWithMetadata);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages[0]).toEqual({
        role: 'user',
        content: 'Test',
      });
    });
  });

  describe('streamMessage', () => {
    const mockMessages: QwenMessage[] = [{ role: 'user', content: 'Hello' }];

    it('should yield chunks from simulated stream', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Streamed response' } }],
            usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
          }),
      });

      const chunks: Array<{ content: string; done: boolean }> = [];
      for await (const chunk of provider.streamMessage(mockMessages)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(2);
      expect(chunks[0].content).toBe('Streamed response');
      expect(chunks[0].done).toBe(false);
      expect(chunks[1].content).toBe('');
      expect(chunks[1].done).toBe(true);
      expect(chunks[1].usage).toBeDefined();
    });

    it('should throw error when not logged in', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as never);

      const stream = provider.streamMessage(mockMessages);

      // Error gets re-wrapped as STREAMING_FAILED in catch block
      await expect(stream.next()).rejects.toThrow(QwenError);
    });

    it('should handle stream HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const stream = provider.streamMessage(mockMessages);

      await expect(stream.next()).rejects.toThrow(QwenError);
    });

    it('should save to database when sessionId and userId provided', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as never);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Streamed' } }],
            usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
          }),
      });

      const chunks = [];
      for await (const chunk of provider.streamMessage(
        mockMessages,
        'session-123',
        'user-456'
      )) {
        chunks.push(chunk);
      }

      expect(supabase.from).toHaveBeenCalledWith('agent_messages');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'session-123',
          user_id: 'user-456',
          content: 'Streamed',
        })
      );
    });
  });

  describe('QwenError', () => {
    it('should create error with correct properties', () => {
      const error = new QwenError('Test error', 'REQUEST_FAILED', true);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('REQUEST_FAILED');
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('QwenError');
    });

    it('should create non-retryable error', () => {
      const error = new QwenError('Auth failed', 'NOT_AUTHENTICATED', false);

      expect(error.retryable).toBe(false);
    });

    it('should have proper stack trace', () => {
      const error = new QwenError('Test', 'TEST');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('QwenError');
    });
  });

  describe('Error Handling Edge Cases', () => {
    const mockMessages: QwenMessage[] = [{ role: 'user', content: 'Test' }];

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        QwenError
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
        QwenError
      );
    });

    it('should not save to database when sessionId is missing', async () => {
      const insertMock = vi.fn();
      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as never);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
            usage: { prompt_tokens: 5 },
          }),
      });

      await provider.sendMessage(mockMessages, undefined, 'user-123');

      expect(insertMock).not.toHaveBeenCalled();
    });

    it('should handle database save error gracefully', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: new Error('DB error') });
      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as never);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
          }),
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
});
