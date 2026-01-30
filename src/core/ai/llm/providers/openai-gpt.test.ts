/**
 * OpenAI GPT Provider Tests
 * Comprehensive unit tests for OpenAI GPT LLM integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  OpenAIProvider,
  OpenAIError,
  OpenAIMessage,
} from './openai-gpt';

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

vi.mock('openai', () => ({
  default: class MockOpenAI {
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

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
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

    provider = new OpenAIProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create provider with default configuration', () => {
      const config = provider.getConfig();

      expect(config.model).toBe('gpt-4o');
      expect(config.maxTokens).toBe(4000);
      expect(config.temperature).toBe(0.7);
      expect(config.systemPrompt).toBe('You are a helpful AI assistant.');
      expect(config.tools).toEqual([]);
    });

    it('should create provider with custom configuration', () => {
      const customProvider = new OpenAIProvider({
        model: 'gpt-5.2',
        maxTokens: 8000,
        temperature: 0.5,
        systemPrompt: 'Custom prompt',
      });

      const config = customProvider.getConfig();

      expect(config.model).toBe('gpt-5.2');
      expect(config.maxTokens).toBe(8000);
      expect(config.temperature).toBe(0.5);
      expect(config.systemPrompt).toBe('Custom prompt');
    });

    it('should update configuration', () => {
      provider.updateConfig({
        model: 'o3',
        temperature: 0.9,
      });

      const config = provider.getConfig();

      expect(config.model).toBe('o3');
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
      const models = OpenAIProvider.getAvailableModels();

      expect(models).toContain('gpt-4o');
      expect(models).toContain('gpt-5.2');
      expect(models).toContain('o3');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return image models', () => {
      const models = OpenAIProvider.getImageModels();

      expect(models).toContain('gpt-image-1.5');
      expect(models).toContain('dall-e-3');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return video models', () => {
      const models = OpenAIProvider.getVideoModels();

      expect(models).toContain('sora-2');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return audio models', () => {
      const models = OpenAIProvider.getAudioModels();

      expect(models).toContain('whisper-1');
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('sendMessage', () => {
    const mockMessages: OpenAIMessage[] = [
      { role: 'user', content: 'Hello, how are you?' },
    ];

    it('should send message successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'I am doing well, thank you!' },
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

      expect(response.content).toBe('I am doing well, thank you!');
      expect(response.usage?.promptTokens).toBe(10);
      expect(response.usage?.completionTokens).toBe(15);
      expect(response.usage?.totalTokens).toBe(25);
      expect(response.model).toBe('gpt-4o');
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
        OpenAIError
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
        OpenAIError
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
        OpenAIError
      );

      // Check that the error has correct properties
      try {
        await provider.sendMessage(mockMessages);
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIError);
        expect((error as OpenAIError).code).toBe('RATE_LIMIT_EXCEEDED');
        expect((error as OpenAIError).retryable).toBe(true);
        expect((error as OpenAIError).statusCode).toBe(429);
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
        OpenAIError
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
        OpenAIError
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
            usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
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
      expect(response.usage?.completionTokens).toBe(0);
    });

    it('should include system messages in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
            usage: { prompt_tokens: 5 },
          }),
      });

      const messagesWithSystem: OpenAIMessage[] = [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'User message' },
      ];

      await provider.sendMessage(messagesWithSystem);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

      // OpenAI includes system messages in the messages array
      expect(requestBody.messages).toEqual([
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'User message' },
      ]);
    });

    it('should include tools in request when configured', async () => {
      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'test_tool',
            description: 'A test tool',
            parameters: { type: 'object', properties: {} },
          },
        },
      ];

      provider.updateConfig({ tools: tools as never });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
          }),
      });

      await provider.sendMessage(mockMessages);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.tools).toEqual(tools);
      expect(requestBody.tool_choice).toBe('auto');
    });

    it('should not include tools in request when empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
          }),
      });

      await provider.sendMessage(mockMessages);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.tools).toBeUndefined();
      expect(requestBody.tool_choice).toBeUndefined();
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
        '/.netlify/functions/llm-proxies/openai-proxy',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('gpt-4o');
      expect(requestBody.max_tokens).toBe(4000);
      expect(requestBody.temperature).toBe(0.7);
    });
  });

  describe('streamMessage', () => {
    const mockMessages: OpenAIMessage[] = [{ role: 'user', content: 'Hello' }];

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

    it('should throw NOT_AUTHENTICATED error when not logged in', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as never);

      const stream = provider.streamMessage(mockMessages);

      await expect(stream.next()).rejects.toThrow(OpenAIError);
    });

    it('should handle stream HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const stream = provider.streamMessage(mockMessages);

      await expect(stream.next()).rejects.toThrow(OpenAIError);
    });

    it('should handle stream rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit' }),
      });

      const stream = provider.streamMessage(mockMessages);

      // Streaming with rate limit will throw after retries
      await expect(stream.next()).rejects.toThrow(OpenAIError);
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

  describe('OpenAIError', () => {
    it('should create error with correct properties', () => {
      const error = new OpenAIError('Test error', 'PAYMENT_REQUIRED', false, 402);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('PAYMENT_REQUIRED');
      expect(error.retryable).toBe(false);
      expect(error.statusCode).toBe(402);
      expect(error.name).toBe('OpenAIError');
    });

    it('should create retryable error', () => {
      const error = new OpenAIError('Rate limited', 'RATE_LIMIT_EXCEEDED', true, 429);

      expect(error.retryable).toBe(true);
    });

    it('should have proper stack trace', () => {
      const error = new OpenAIError('Test', 'TEST');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('OpenAIError');
    });
  });

  describe('Error Handling Edge Cases', () => {
    const mockMessages: OpenAIMessage[] = [{ role: 'user', content: 'Test' }];

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        OpenAIError
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
        OpenAIError
      );
    });

    it('should handle auth session error', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      vi.mocked(supabase.auth.getSession)
        .mockRejectedValueOnce(new Error('Auth failed'))
        .mockRejectedValueOnce(new Error('Auth failed'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        OpenAIError
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
            choices: [{ message: { content: 'Response' } }],
            usage: { prompt_tokens: 5 },
          }),
      });

      await provider.sendMessage(mockMessages, undefined, 'user-123');

      expect(insertMock).not.toHaveBeenCalled();
    });
  });
});
