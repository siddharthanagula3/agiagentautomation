/**
 * Grok AI Provider Tests
 * Comprehensive unit tests for xAI Grok LLM integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GrokProvider,
  GrokError,
  GrokMessage,
} from './grok-ai';

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

describe('GrokProvider', () => {
  let provider: GrokProvider;
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

    provider = new GrokProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create provider with default configuration', () => {
      const config = provider.getConfig();

      expect(config.model).toBe('grok-4');
      expect(config.maxTokens).toBe(4000);
      expect(config.temperature).toBe(0.7);
      expect(config.systemPrompt).toBe(
        'You are Grok, an AI assistant with access to real-time information from X (Twitter).'
      );
      expect(config.includeRealTimeData).toBe(true);
    });

    it('should create provider with custom configuration', () => {
      const customProvider = new GrokProvider({
        model: 'grok-4-1-fast-reasoning',
        maxTokens: 8000,
        temperature: 0.5,
        systemPrompt: 'Custom prompt',
        includeRealTimeData: false,
        useAgentTools: true,
      });

      const config = customProvider.getConfig();

      expect(config.model).toBe('grok-4-1-fast-reasoning');
      expect(config.maxTokens).toBe(8000);
      expect(config.temperature).toBe(0.5);
      expect(config.systemPrompt).toBe('Custom prompt');
      expect(config.includeRealTimeData).toBe(false);
    });

    it('should update configuration', () => {
      provider.updateConfig({
        model: 'grok-3',
        temperature: 0.9,
        includeRealTimeData: false,
      });

      const config = provider.getConfig();

      expect(config.model).toBe('grok-3');
      expect(config.temperature).toBe(0.9);
      expect(config.includeRealTimeData).toBe(false);
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
      const models = GrokProvider.getAvailableModels();

      expect(models).toContain('grok-4');
      expect(models).toContain('grok-4-1-fast-reasoning');
      expect(models).toContain('grok-3');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return vision models', () => {
      const models = GrokProvider.getVisionModels();

      expect(models).toContain('grok-2-vision-1212');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return image models', () => {
      const models = GrokProvider.getImageModels();

      expect(models).toContain('grok-2-image-1212');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return agent models', () => {
      const models = GrokProvider.getAgentModels();

      expect(models).toContain('grok-4-1-fast-reasoning');
      expect(models).toContain('grok-4');
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('sendMessage', () => {
    const mockMessages: GrokMessage[] = [
      { role: 'user', content: 'What is trending on X?' },
    ];

    it('should send message successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Here are the trending topics...' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25,
        },
        id: 'response-123',
        sources: [
          { type: 'tweet', url: 'https://x.com/test', author: '@testuser' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await provider.sendMessage(mockMessages);

      expect(response.content).toBe('Here are the trending topics...');
      expect(response.usage?.promptTokens).toBe(10);
      expect(response.usage?.completionTokens).toBe(15);
      expect(response.usage?.totalTokens).toBe(25);
      expect(response.model).toBe('grok-4');
      expect(response.metadata?.sources).toHaveLength(1);
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
        GrokError
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
        GrokError
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
        GrokError
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

    it('should include realTimeDataUsed in metadata', async () => {
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
          }),
      });

      const response = await provider.sendMessage(
        mockMessages,
        'session-123',
        'user-456'
      );

      expect(response.metadata?.realTimeDataUsed).toBe(true);
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
        '/.netlify/functions/llm-proxies/grok-proxy',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('grok-4');
      expect(requestBody.max_tokens).toBe(4000);
      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.stream).toBe(false);
    });
  });

  describe('streamMessage', () => {
    const mockMessages: GrokMessage[] = [{ role: 'user', content: 'Hello' }];

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
      await expect(stream.next()).rejects.toThrow(GrokError);
    });

    it('should handle stream HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const stream = provider.streamMessage(mockMessages);

      await expect(stream.next()).rejects.toThrow(GrokError);
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

  describe('analyzeSocialMedia', () => {
    it('should analyze social media trends', async () => {
      const mockAnalysis = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Tech topics trending',
                sentiment: { positive: 60, negative: 20, neutral: 20 },
                trends: [{ topic: 'AI', volume: 10000, growth: '+50%' }],
                topPosts: [
                  { content: 'Great AI news', author: '@tech', engagement: 5000 },
                ],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 100 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalysis),
      });

      const result = await provider.analyzeSocialMedia({
        topic: 'artificial intelligence',
        timeframe: '24h',
        sentiment: true,
        trends: true,
      });

      expect(result.summary).toBe('Tech topics trending');
      expect(result.sentiment).toBeDefined();
      expect(result.trends).toBeDefined();
    });

    it('should handle parse error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Invalid JSON response' } }],
          }),
      });

      const result = await provider.analyzeSocialMedia({
        topic: 'test',
      });

      // Should return raw content as summary when parsing fails
      expect(result.summary).toBe('Invalid JSON response');
    });

    it('should handle JSON in markdown code blocks', async () => {
      const jsonContent = {
        summary: 'Analysis complete',
        sentiment: { positive: 70, negative: 15, neutral: 15 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: '```json\n' + JSON.stringify(jsonContent) + '\n```',
                },
              },
            ],
          }),
      });

      const result = await provider.analyzeSocialMedia({
        topic: 'test',
        sentiment: true,
      });

      expect(result.summary).toBe('Analysis complete');
      expect(result.sentiment?.positive).toBe(70);
    });
  });

  describe('GrokError', () => {
    it('should create error with correct properties', () => {
      const error = new GrokError('Test error', 'REQUEST_FAILED', true);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('REQUEST_FAILED');
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('GrokError');
    });

    it('should create non-retryable error', () => {
      const error = new GrokError('Auth failed', 'NOT_AUTHENTICATED', false);

      expect(error.retryable).toBe(false);
    });

    it('should have proper stack trace', () => {
      const error = new GrokError('Test', 'TEST');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('GrokError');
    });
  });

  describe('Error Handling Edge Cases', () => {
    const mockMessages: GrokMessage[] = [{ role: 'user', content: 'Test' }];

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.sendMessage(mockMessages)).rejects.toThrow(
        GrokError
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
        GrokError
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

  describe('Source Extraction', () => {
    const mockMessages: GrokMessage[] = [{ role: 'user', content: 'Test' }];

    it('should extract sources from response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
            sources: [
              { type: 'tweet', url: 'https://x.com/1', author: '@user1' },
              { type: 'trend', url: 'https://x.com/trend/1' },
            ],
          }),
      });

      const response = await provider.sendMessage(mockMessages);

      expect(response.metadata?.sources).toHaveLength(2);
      expect(response.metadata?.sources?.[0].type).toBe('tweet');
    });

    it('should return empty sources when not present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
          }),
      });

      const response = await provider.sendMessage(mockMessages);

      expect(response.metadata?.sources).toEqual([]);
    });
  });
});
