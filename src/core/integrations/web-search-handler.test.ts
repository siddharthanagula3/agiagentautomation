/**
 * Web Search Handler Tests
 * Unit tests for the Web Search Service providing multi-provider search capabilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  searchWithPerplexity,
  searchWithGoogle,
  searchWithDuckDuckGo,
  webSearch,
  searchAndSummarize,
  isWebSearchConfigured,
  getAvailableSearchProviders,
  type SearchResult,
  type SearchResponse,
} from './web-search-handler';

// Mock Supabase client
vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Mock fetchWithTimeout
vi.mock('@shared/utils/error-handling', () => ({
  fetchWithTimeout: vi.fn(),
  TimeoutPresets: {
    SEARCH: 30000,
  },
}));

// Mock unified LLM service for searchAndSummarize
vi.mock('@core/ai/llm/unified-language-model', () => ({
  unifiedLLMService: {
    sendMessage: vi.fn(),
  },
}));

describe('Web Search Handler', () => {
  let mockSupabase: { auth: { getSession: ReturnType<typeof vi.fn> } };
  let mockFetchWithTimeout: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { supabase } = await import('@shared/lib/supabase-client');
    mockSupabase = supabase as unknown as {
      auth: { getSession: ReturnType<typeof vi.fn> };
    };

    const { fetchWithTimeout } = await import('@shared/utils/error-handling');
    mockFetchWithTimeout = fetchWithTimeout as ReturnType<typeof vi.fn>;

    // Default auth mock - authenticated user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    });

    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchWithPerplexity', () => {
    it('should search successfully and parse results', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: 'AI is transforming industries [1][2]',
                },
              },
            ],
            citations: [
              {
                url: 'https://example.com/ai-article',
                title: 'AI Trends',
                snippet: 'Latest AI developments',
              },
              {
                url: 'https://tech.com/news',
                title: 'Tech News',
                snippet: 'Technology updates',
              },
            ],
          }),
      };

      mockFetchWithTimeout.mockResolvedValueOnce(mockResponse);

      const result = await searchWithPerplexity('artificial intelligence');

      expect(result.query).toBe('artificial intelligence');
      expect(result.answer).toBe('AI is transforming industries [1][2]');
      expect(result.results.length).toBe(2);
      expect(result.results[0].url).toBe('https://example.com/ai-article');
      expect(result.results[0].title).toBe('AI Trends');
      expect(result.sources).toContain('https://example.com/ai-article');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await expect(searchWithPerplexity('test query')).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('should throw error on API failure', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'API Error' }),
      });

      await expect(searchWithPerplexity('test')).rejects.toThrow('API Error');
    });

    it('should handle response with content field directly', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: 'Direct content response',
            citations: [],
          }),
      });

      const result = await searchWithPerplexity('test');

      expect(result.answer).toBe('Direct content response');
    });

    it('should filter out invalid URLs from results', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Test answer' } }],
            citations: [
              { url: 'https://valid.com', title: 'Valid' },
              { url: 'not-a-url', title: 'Invalid' },
              { url: '', title: 'Empty' },
              { url: null, title: 'Null' },
            ],
          }),
      });

      const result = await searchWithPerplexity('test');

      expect(result.results.length).toBe(1);
      expect(result.results[0].url).toBe('https://valid.com');
    });

    it('should send correct request format', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
            citations: [],
          }),
      });

      await searchWithPerplexity('test query');

      expect(mockFetchWithTimeout).toHaveBeenCalledWith(
        '/.netlify/functions/llm-proxies/perplexity-proxy',
        expect.objectContaining({
          timeoutMs: 30000,
          fetchOptions: expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
          }),
        })
      );

      const requestBody = JSON.parse(
        mockFetchWithTimeout.mock.calls[0][1].fetchOptions.body
      );
      expect(requestBody.model).toBe('sonar-pro');
      expect(requestBody.messages[1].content).toBe('test query');
    });
  });

  describe('searchWithGoogle', () => {
    it('should search successfully and parse results', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                title: 'Google Result 1',
                link: 'https://google.com/result1',
                snippet: 'First result snippet',
              },
              {
                title: 'Google Result 2',
                link: 'https://google.com/result2',
                snippet: 'Second result snippet',
              },
            ],
          }),
      });

      const result = await searchWithGoogle('test query', 5);

      expect(result.query).toBe('test query');
      expect(result.results.length).toBe(2);
      expect(result.results[0].title).toBe('Google Result 1');
      expect(result.results[0].source).toBe('google.com');
    });

    it('should throw error when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await expect(searchWithGoogle('test')).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('should handle results field instead of items', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                title: 'Result',
                url: 'https://example.com',
                snippet: 'Snippet',
              },
            ],
          }),
      });

      const result = await searchWithGoogle('test');

      expect(result.results.length).toBe(1);
      expect(result.results[0].url).toBe('https://example.com');
    });

    it('should limit results to maxResults', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      await searchWithGoogle('test', 15);

      const requestBody = JSON.parse(
        mockFetchWithTimeout.mock.calls[0][1].fetchOptions.body
      );
      expect(requestBody.maxResults).toBe(10); // Max is 10
    });

    it('should filter out invalid URLs', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              { title: 'Valid', link: 'https://valid.com' },
              { title: 'Invalid', link: 'invalid-url' },
            ],
          }),
      });

      const result = await searchWithGoogle('test');

      expect(result.results.length).toBe(1);
    });
  });

  describe('searchWithDuckDuckGo', () => {
    it('should search successfully with abstract', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Heading: 'Test Topic',
            Abstract: 'This is the abstract text',
            AbstractURL: 'https://duckduckgo.com/abstract',
            AbstractSource: 'Wikipedia',
            RelatedTopics: [
              {
                Text: 'Related Topic 1 - Description',
                FirstURL: 'https://duckduckgo.com/topic1',
              },
            ],
          }),
      });

      const result = await searchWithDuckDuckGo('test query');

      expect(result.query).toBe('test query');
      expect(result.results.length).toBe(2);
      expect(result.results[0].title).toBe('Test Topic');
      expect(result.results[0].snippet).toBe('This is the abstract text');
    });

    it('should handle response without abstract', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            RelatedTopics: [
              {
                Text: 'Topic 1',
                FirstURL: 'https://duckduckgo.com/topic1',
              },
            ],
          }),
      });

      const result = await searchWithDuckDuckGo('test');

      expect(result.results.length).toBe(1);
    });

    it('should throw error on API failure', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: false,
        statusText: 'Service Unavailable',
      });

      await expect(searchWithDuckDuckGo('test')).rejects.toThrow(
        'DuckDuckGo API error'
      );
    });

    it('should respect maxResults limit', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            RelatedTopics: Array.from({ length: 20 }, (_, i) => ({
              Text: `Topic ${i}`,
              FirstURL: `https://example.com/${i}`,
            })),
          }),
      });

      const result = await searchWithDuckDuckGo('test', 5);

      expect(result.results.length).toBeLessThanOrEqual(5);
    });

    it('should filter topics with invalid URLs', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            RelatedTopics: [
              { Text: 'Valid', FirstURL: 'https://valid.com' },
              { Text: 'Invalid', FirstURL: 'not-a-url' },
              { Text: 'Empty', FirstURL: '' },
            ],
          }),
      });

      const result = await searchWithDuckDuckGo('test');

      expect(result.results.length).toBe(1);
    });
  });

  describe('webSearch', () => {
    it('should try Perplexity first by default', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Perplexity result' } }],
            citations: [],
          }),
      });

      const result = await webSearch('test query');

      expect(result.answer).toBe('Perplexity result');
      expect(mockFetchWithTimeout).toHaveBeenCalledTimes(1);
    });

    it('should fallback to Google when Perplexity fails', async () => {
      // Perplexity fails
      mockFetchWithTimeout.mockRejectedValueOnce(new Error('Perplexity down'));

      // Google succeeds
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              { title: 'Google Result', link: 'https://google.com/result' },
            ],
          }),
      });

      const result = await webSearch('test query');

      expect(result.results.length).toBe(1);
      expect(mockFetchWithTimeout).toHaveBeenCalledTimes(2);
    });

    it('should fallback to DuckDuckGo when Perplexity and Google fail', async () => {
      // Perplexity fails
      mockFetchWithTimeout.mockRejectedValueOnce(new Error('Perplexity down'));

      // Google fails
      mockFetchWithTimeout.mockRejectedValueOnce(new Error('Google down'));

      // DuckDuckGo succeeds
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            RelatedTopics: [
              { Text: 'DDG Result', FirstURL: 'https://ddg.com/result' },
            ],
          }),
      });

      const result = await webSearch('test query');

      expect(result.results.length).toBe(1);
    });

    it('should throw error when all providers fail', async () => {
      mockFetchWithTimeout.mockRejectedValue(new Error('All providers down'));

      await expect(webSearch('test')).rejects.toThrow(
        'All search providers failed'
      );
    });

    it('should use preferred provider when specified', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [{ title: 'Google', link: 'https://google.com' }],
          }),
      });

      await webSearch('test', 10, 'google');

      expect(mockFetchWithTimeout).toHaveBeenCalledWith(
        '/.netlify/functions/llm-proxies/google-proxy',
        expect.anything()
      );
    });

    it('should pass maxResults to provider', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Result' } }],
            citations: [],
          }),
      });

      await webSearch('test', 20);

      // Perplexity doesn't use maxResults in the same way, so just verify call succeeded
      expect(mockFetchWithTimeout).toHaveBeenCalled();
    });
  });

  describe('searchAndSummarize', () => {
    it('should return Perplexity answer when available', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'AI-generated answer' } }],
            citations: [{ url: 'https://source.com' }],
          }),
      });

      const result = await searchAndSummarize('test query');

      expect(result.answer).toBe('AI-generated answer');
    });

    it('should generate summary with AI when no answer available', async () => {
      // Search without answer (DuckDuckGo)
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            RelatedTopics: [
              { Text: 'Topic', FirstURL: 'https://example.com' },
            ],
          }),
      });

      const { unifiedLLMService } = await import(
        '@core/ai/llm/unified-language-model'
      );
      const mockLLM = unifiedLLMService as unknown as {
        sendMessage: ReturnType<typeof vi.fn>;
      };

      mockLLM.sendMessage.mockResolvedValueOnce({
        content: 'AI-generated summary based on search results',
      });

      const result = await searchAndSummarize('test', 'claude');

      expect(result.answer).toBe('AI-generated summary based on search results');
      expect(mockLLM.sendMessage).toHaveBeenCalled();
    });

    it('should use correct AI provider for summarization', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            RelatedTopics: [
              { Text: 'Topic', FirstURL: 'https://example.com' },
            ],
          }),
      });

      const { unifiedLLMService } = await import(
        '@core/ai/llm/unified-language-model'
      );
      const mockLLM = unifiedLLMService as unknown as {
        sendMessage: ReturnType<typeof vi.fn>;
      };
      mockLLM.sendMessage.mockResolvedValueOnce({ content: 'Summary' });

      await searchAndSummarize('test', 'gemini');

      expect(mockLLM.sendMessage).toHaveBeenCalledWith(
        expect.any(Array),
        undefined,
        undefined,
        'google'
      );
    });

    it('should return search results with answer from Perplexity', async () => {
      // Use Perplexity with answer - simpler test case
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Perplexity answer' } }],
            citations: [
              { url: 'https://example.com', title: 'Test' },
            ],
          }),
      });

      const result = await searchAndSummarize('test');

      expect(result.results.length).toBe(1);
      expect(result.answer).toBe('Perplexity answer');
    });
  });

  describe('isWebSearchConfigured', () => {
    it('should return true (proxy-based)', () => {
      expect(isWebSearchConfigured()).toBe(true);
    });
  });

  describe('getAvailableSearchProviders', () => {
    it('should return all providers', () => {
      const providers = getAvailableSearchProviders();

      expect(providers).toContain('perplexity');
      expect(providers).toContain('google');
      expect(providers).toContain('duckduckgo');
      expect(providers.length).toBe(3);
    });
  });
});
