/**
 * DeepSeek AI Provider Tests
 * Comprehensive unit tests for DeepSeek AI LLM integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DeepSeekProvider,
  DeepSeekError,
  DeepSeekMessage,
} from './deepseek-ai';

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

describe('DeepSeekProvider', () => {
  let provider: DeepSeekProvider;
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

    provider = new DeepSeekProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create provider with default configuration', () => {
      const config = provider.getConfig();

      expect(config.model).toBe('deepseek-chat');
      expect(config.maxTokens).toBe(4000);
      expect(config.temperature).toBe(0.7);
      expect(config.systemPrompt).toBe('You are a helpful AI assistant.');
    });

    it('should create provider with custom configuration', () => {
      const customProvider = new DeepSeekProvider({
        model: 'deepseek-reasoner',
        maxTokens: 8000,
        temperature: 0.5,
        systemPrompt: 'Custom prompt',
      });

      const config = customProvider.getConfig();

      expect(config.model).toBe('deepseek-reasoner');
      expect(config.maxTokens).toBe(8000);
      expect(config.temperature).toBe(0.5);
      expect(config.systemPrompt).toBe('Custom prompt');
    });

    it('should update configuration', () => {
      provider.updateConfig({
        model: 'deepseek-coder',
        temperature: 0.9,
      });

      const config = provider.getConfig();

      expect(config.model).toBe('deepseek-coder');
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
      const models = DeepSeekProvider.getAvailableModels();

      expect(models).toContain('deepseek-chat');
      expect(models).toContain('deepseek-reasoner');
      expect(models).toContain('deepseek-coder');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return models by capability', () => {
      const capabilities = DeepSeekProvider.getModelsByCapability();

      expect(capabilities.chat).toContain('deepseek-chat');
      expect(capabilities.reasoning).toContain('deepseek-reasoner');
      expect(capabilities.coding).toContain('deepseek-coder');
      expect(capabilities.tools).toContain('deepseek-chat');
    });
  });

  describe('sendMessage', () => {
    const mockMessages: DeepSeekMessage[] = [
      { role: 'user', content: 'Write a function to sort an array.' },
    ];

    it('should send message successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Here is the sorting function...' },
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

      expect(response.content).toBe('Here is the sorting function...');
      expect(response.usage?.promptTokens).toBe(10);
      expect(response.usage?.completionTokens).toBe(15);
      expect(response.usage?.totalTokens).toBe(25);
      expect(response.model).toBe('deepseek-chat');
    });

    it('should handle response with reasoning_content (deepseek-reasoner)', async () => {
      provider.updateConfig({ model: 'deepseek-reasoner' });

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Final answer',
              reasoning_content: 'Step 1: Analyze... Step 2: Solve...',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 50,
          total_tokens: 60,
        },
        id: 'response-456',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await provider.sendMessage(mockMessages);

      expect(response.content).toBe('Final answer');
      expect(response.metadata?.reasoningContent).toBe(
        'Step 1: Analyze... Step 2: Solve...'
      );
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
        DeepSeekError
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
        DeepSeekError
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
        DeepSeekError
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

    it('should include reasoningContent in saved metadata', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as never);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: 'Answer',
                  reasoning_content: 'Reasoning steps',
                },
              },
            ],
            usage: { prompt_tokens: 5 },
            id: 'resp-123',
          }),
      });

      await provider.sendMessage(mockMessages, 'session-123', 'user-456');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            reasoningContent: 'Reasoning steps',
          }),
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
        '/.netlify/functions/llm-proxies/deepseek-proxy',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('deepseek-chat');
      expect(requestBody.max_tokens).toBe(4000);
      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.stream).toBe(false);
    });
  });

  describe('streamMessage', () => {
    const mockMessages: DeepSeekMessage[] = [{ role: 'user', content: 'Hello' }];

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
      await expect(stream.next()).rejects.toThrow(DeepSeekError);
    });

    it('should handle stream HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const stream = provider.streamMessage(mockMessages);

      await expect(stream.next()).rejects.toThrow(DeepSeekError);
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

  describe('DeepSeekError', () => {
    it('should create error with correct properties', () => {
      const error = new DeepSeekError('Test error', 'REQUEST_FAILED', true);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('REQUEST_FAILED');
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('DeepSeekError');
    });

    it('should create non-retryable error', () => {
      const error = new DeepSeekError('Auth failed', 'NOT_AUTHENTICATED', false);

      expect(error.retryable).toBe(false);
    });

    it('should have proper stack trace', () => {
      const error = new DeepSeekError('Test', 'TEST');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('DeepSeekError');
    });
  });

  describe('Error Handling Edge Cases', () => {
    const mockMessages: DeepSeekMessage[] = [{ role: 'user', content: 'Test' }];

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        DeepSeekError
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
        DeepSeekError
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
