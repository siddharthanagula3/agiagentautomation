/**
 * Anthropic Claude Provider Tests
 * Comprehensive unit tests for Anthropic Claude LLM integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnthropicProvider,
  AnthropicError,
  AnthropicMessage,
} from './anthropic-claude';

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

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    static APIError = class extends Error {
      status: number;
      constructor(message: string, status: number) {
        super(message);
        this.status = status;
      }
    };
  },
}));

// Get mocked modules
const { supabase } = await import('@shared/lib/supabase-client');
const { toast } = await import('sonner');

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
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

    provider = new AnthropicProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create provider with default configuration', () => {
      const config = provider.getConfig();

      expect(config.model).toBe('claude-sonnet-4-5-20250929');
      expect(config.maxTokens).toBe(4000);
      expect(config.temperature).toBe(0.7);
      expect(config.systemPrompt).toBe('You are a helpful AI assistant.');
      expect(config.tools).toEqual([]);
      expect(config.computerUse).toBe(false);
      expect(config.extendedThinking).toBe(false);
    });

    it('should create provider with custom configuration', () => {
      const customProvider = new AnthropicProvider({
        model: 'claude-opus-4-5-20251101',
        maxTokens: 8000,
        temperature: 0.5,
        systemPrompt: 'Custom prompt',
        computerUse: true,
        extendedThinking: true,
      });

      const config = customProvider.getConfig();

      expect(config.model).toBe('claude-opus-4-5-20251101');
      expect(config.maxTokens).toBe(8000);
      expect(config.temperature).toBe(0.5);
      expect(config.systemPrompt).toBe('Custom prompt');
      expect(config.computerUse).toBe(true);
      expect(config.extendedThinking).toBe(true);
    });

    it('should update configuration', () => {
      provider.updateConfig({
        model: 'claude-haiku-4-5-20251001',
        temperature: 0.9,
      });

      const config = provider.getConfig();

      expect(config.model).toBe('claude-haiku-4-5-20251001');
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
      const models = AnthropicProvider.getAvailableModels();

      expect(models).toContain('claude-opus-4-5-20251101');
      expect(models).toContain('claude-sonnet-4-5-20250929');
      expect(models).toContain('claude-haiku-4-5-20251001');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return computer use models', () => {
      const models = AnthropicProvider.getComputerUseModels();

      expect(models).toContain('claude-sonnet-4-5-20250929');
      expect(models).toContain('claude-haiku-4-5-20251001');
      expect(models).toContain('claude-opus-4-5-20251101');
    });

    it('should return model aliases', () => {
      const aliases = AnthropicProvider.getModelAliases();

      expect(aliases['claude-opus-4-5']).toBe('claude-opus-4-5-20251101');
      expect(aliases['claude-sonnet-4-5']).toBe('claude-sonnet-4-5-20250929');
      expect(aliases['claude-haiku-4-5']).toBe('claude-haiku-4-5-20251001');
    });
  });

  describe('sendMessage', () => {
    const mockMessages: AnthropicMessage[] = [
      { role: 'user', content: 'Hello, how are you?' },
    ];

    it('should send message successfully', async () => {
      const mockResponse = {
        content: 'I am doing well, thank you!',
        usage: {
          input_tokens: 10,
          output_tokens: 15,
        },
        id: 'response-123',
        stop_reason: 'end_turn',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await provider.sendMessage(mockMessages);

      expect(response.content).toBe('I am doing well, thank you!');
      expect(response.usage?.inputTokens).toBe(10);
      expect(response.usage?.outputTokens).toBe(15);
      expect(response.usage?.totalTokens).toBe(25);
      expect(response.model).toBe('claude-sonnet-4-5-20250929');
    });

    it('should throw NOT_AUTHENTICATED error when not logged in', async () => {
      // Mock getSession twice because we call sendMessage twice
      vi.mocked(supabase.auth.getSession)
        .mockResolvedValueOnce({
          data: { session: null },
          error: null,
        } as never)
        .mockResolvedValueOnce({
          data: { session: null },
          error: null,
        } as never);

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        AnthropicError
      );
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'NOT_AUTHENTICATED',
      });
    });

    it('should handle HTTP 402 payment required error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 402,
          json: () => Promise.resolve({ error: 'Insufficient tokens' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 402,
          json: () => Promise.resolve({ error: 'Insufficient tokens' }),
        });

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        AnthropicError
      );
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'PAYMENT_REQUIRED',
        retryable: false,
        statusCode: 402,
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Insufficient Tokens',
        expect.objectContaining({
          description: expect.stringContaining('run out of AI tokens'),
        })
      );
    });

    it('should handle HTTP 429 rate limit error', async () => {
      // Mock many times for retry logic (max 4 retries + second call) = 8+ mocks
      const errorResponse = {
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      };
      mockFetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse);

      // Provider has retry logic - error thrown after max retries
      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        AnthropicError
      );

      // Check that the error has correct properties
      try {
        await provider.sendMessage(mockMessages);
      } catch (error) {
        expect(error).toBeInstanceOf(AnthropicError);
        expect((error as AnthropicError).code).toBe('RATE_LIMIT_EXCEEDED');
        expect((error as AnthropicError).retryable).toBe(true);
        expect((error as AnthropicError).statusCode).toBe(429);
      }
    }, 60000); // Increased timeout for retry delays

    it('should handle HTTP 504 gateway timeout error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 504,
          json: () => Promise.resolve({ error: 'Gateway timeout' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 504,
          json: () => Promise.resolve({ error: 'Gateway timeout' }),
        });

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        AnthropicError
      );
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'GATEWAY_TIMEOUT',
        retryable: true,
        statusCode: 504,
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Request Timeout',
        expect.any(Object)
      );
    });

    it('should handle HTTP 503 service unavailable (retryable)', async () => {
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
        AnthropicError
      );
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'HTTP_503',
        retryable: true,
      });
    });

    it('should include session and user metadata in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: 'Test response',
            usage: { input_tokens: 5, output_tokens: 10 },
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
            usage: { input_tokens: 5, output_tokens: 10 },
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
      expect(response.usage?.inputTokens).toBe(0);
      expect(response.usage?.outputTokens).toBe(0);
    });

    it('should filter system messages for Anthropic format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: 'Response',
            usage: { input_tokens: 5 },
          }),
      });

      const messagesWithSystem: AnthropicMessage[] = [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'User message' },
      ];

      await provider.sendMessage(messagesWithSystem);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

      // System messages should be in system field, not messages array
      expect(requestBody.messages).toEqual([
        { role: 'user', content: 'User message' },
      ]);
    });

    it('should include tools in request when configured', async () => {
      const tools = [
        {
          name: 'test_tool',
          description: 'A test tool',
          input_schema: { type: 'object', properties: {} },
        },
      ];

      provider.updateConfig({ tools: tools as never });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response' }),
      });

      await provider.sendMessage(mockMessages);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.tools).toEqual(tools);
    });

    it('should not include tools in request when empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: 'Response' }),
      });

      await provider.sendMessage(mockMessages);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.tools).toBeUndefined();
    });
  });

  describe('streamMessage', () => {
    const mockMessages: AnthropicMessage[] = [{ role: 'user', content: 'Hello' }];

    it('should yield chunks from simulated stream', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: 'Streamed response',
            usage: { input_tokens: 5, output_tokens: 10 },
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

    it('should throw NOT_AUTHENTICATED error when not logged in', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as never);

      const stream = provider.streamMessage(mockMessages);

      await expect(stream.next()).rejects.toThrow(AnthropicError);
    });

    it('should handle stream HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const stream = provider.streamMessage(mockMessages);

      await expect(stream.next()).rejects.toThrow(AnthropicError);
    });

    it('should handle stream rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit' }),
      });

      const stream = provider.streamMessage(mockMessages);

      // Streaming with rate limit will throw after retries
      await expect(stream.next()).rejects.toThrow(AnthropicError);
    });
  });

  describe('AnthropicError', () => {
    it('should create error with correct properties', () => {
      const error = new AnthropicError('Test error', 'PAYMENT_REQUIRED', false, 402);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('PAYMENT_REQUIRED');
      expect(error.retryable).toBe(false);
      expect(error.statusCode).toBe(402);
      expect(error.name).toBe('AnthropicError');
    });

    it('should create retryable error', () => {
      const error = new AnthropicError('Rate limited', 'RATE_LIMIT_EXCEEDED', true, 429);

      expect(error.retryable).toBe(true);
    });

    it('should have proper stack trace', () => {
      const error = new AnthropicError('Test', 'TEST');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AnthropicError');
    });
  });

  describe('Error Handling Edge Cases', () => {
    const mockMessages: AnthropicMessage[] = [{ role: 'user', content: 'Test' }];

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        AnthropicError
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
        AnthropicError
      );
    });

    it('should handle auth session error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      vi.mocked(supabase.auth.getSession)
        .mockRejectedValueOnce(new Error('Auth failed'))
        .mockRejectedValueOnce(new Error('Auth failed'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        AnthropicError
      );
      await expect(provider.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'NOT_AUTHENTICATED',
      });
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
            content: 'Response',
            usage: { input_tokens: 5 },
          }),
      });

      await provider.sendMessage(mockMessages, undefined, 'user-123');

      expect(insertMock).not.toHaveBeenCalled();
    });
  });
});
