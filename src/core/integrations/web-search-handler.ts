/**
 * Web Search Service - Perplexity-style Search Integration
 * Provides real-time web search capabilities
 */

import { fetchWithTimeout, TimeoutPresets } from '@shared/utils/error-handling';

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GOOGLE_CX = import.meta.env.VITE_GOOGLE_CX || '';

/**
 * Validates if a value is a valid URL string
 */
function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely extracts hostname from URL, returns fallback if invalid
 */
function safeGetHostname(url: string, fallback: string = 'unknown'): string {
  try {
    return new URL(url).hostname;
  } catch {
    return fallback;
  }
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  publishedDate?: string;
  favicon?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string; // AI-generated answer based on search results
  sources?: string[]; // URLs of sources used in answer
  timestamp: Date;
}

/**
 * Search using Perplexity API (recommended)
 */
export async function searchWithPerplexity(
  query: string
): Promise<SearchResponse> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured');
  }

  try {
    const response = await fetchWithTimeout('https://api.perplexity.ai/chat/completions', {
      timeoutMs: TimeoutPresets.SEARCH,
      timeoutMessage: 'Perplexity search timed out',
      fetchOptions: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant that provides accurate, cited information from the web. Always cite your sources.',
            },
            {
              role: 'user',
              content: query,
            },
          ],
          temperature: 0.2,
          max_tokens: 1000,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    // Extract citations/sources from the response
    const citationRegex = /\[(\d+)\]/g;
    const citations = Array.from(answer.matchAll(citationRegex), (m) =>
      parseInt(m[1])
    );
    const sources = data.citations || [];

    // Parse results, filtering out entries with invalid URLs
    const results: SearchResult[] = sources
      .filter(
        (source: unknown): source is { url: string; title?: string; snippet?: string; publishedDate?: string } =>
          source !== null &&
          typeof source === 'object' &&
          isValidUrl((source as Record<string, unknown>).url)
      )
      .map((source, index: number) => ({
        title: (source.title as string) || `Source ${index + 1}`,
        url: source.url,
        snippet: (source.snippet as string) || '',
        source: safeGetHostname(source.url),
        publishedDate: source.publishedDate as string | undefined,
      }));

    // Extract valid source URLs
    const validSourceUrls = sources
      .filter(
        (s: unknown): s is { url: string } =>
          s !== null && typeof s === 'object' && isValidUrl((s as Record<string, unknown>).url)
      )
      .map((s) => s.url);

    return {
      query,
      results,
      answer,
      sources: validSourceUrls,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Perplexity search error:', error);
    throw error;
  }
}

/**
 * Search using Google Custom Search API (fallback)
 */
export async function searchWithGoogle(
  query: string,
  maxResults: number = 10
): Promise<SearchResponse> {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    throw new Error('Google Search API credentials not configured');
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', GOOGLE_API_KEY);
    url.searchParams.append('cx', GOOGLE_CX);
    url.searchParams.append('q', query);
    url.searchParams.append('num', Math.min(maxResults, 10).toString());

    const response = await fetchWithTimeout(url.toString(), {
      timeoutMs: TimeoutPresets.SEARCH,
      timeoutMessage: 'Google Search timed out',
    });

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Filter and map results, excluding items with invalid URLs
    const results: SearchResult[] = (data.items || [])
      .filter(
        (item: unknown): item is { link: string; title?: string; snippet?: string; pagemap?: { metatags?: Array<Record<string, string>> } } =>
          item !== null &&
          typeof item === 'object' &&
          isValidUrl((item as Record<string, unknown>).link)
      )
      .map((item) => {
        const hostname = safeGetHostname(item.link);
        return {
          title: (item.title as string) || '',
          url: item.link,
          snippet: (item.snippet as string) || '',
          source: hostname,
          publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
          favicon: `https://www.google.com/s2/favicons?domain=${hostname}`,
        };
      });

    return {
      query,
      results,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Google search error:', error);
    throw error;
  }
}

/**
 * Search using DuckDuckGo (free, no API key required)
 */
export async function searchWithDuckDuckGo(
  query: string,
  maxResults: number = 10
): Promise<SearchResponse> {
  try {
    // Using DuckDuckGo's instant answer API
    const url = new URL('https://api.duckduckgo.com/');
    url.searchParams.append('q', query);
    url.searchParams.append('format', 'json');
    url.searchParams.append('no_html', '1');
    url.searchParams.append('skip_disambig', '1');

    const response = await fetchWithTimeout(url.toString(), {
      timeoutMs: TimeoutPresets.SEARCH,
      timeoutMessage: 'DuckDuckGo search timed out',
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.statusText}`);
    }

    const data = await response.json();

    const results: SearchResult[] = [];

    // Add abstract if available and URL is valid
    if (data.Abstract && isValidUrl(data.AbstractURL)) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.Abstract,
        source: data.AbstractSource || safeGetHostname(data.AbstractURL),
      });
    }

    // Add related topics with valid URLs
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, maxResults - 1)) {
        if (topic.Text && isValidUrl(topic.FirstURL)) {
          results.push({
            title: topic.Text.split(' - ')[0],
            url: topic.FirstURL,
            snippet: topic.Text,
            source: safeGetHostname(topic.FirstURL),
          });
        }
      }
    }

    return {
      query,
      results,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    throw error;
  }
}

/**
 * Main search function that tries providers in order
 */
export async function webSearch(
  query: string,
  maxResults: number = 10,
  preferredProvider?: 'perplexity' | 'google' | 'duckduckgo'
): Promise<SearchResponse> {
  const providers = preferredProvider
    ? [preferredProvider]
    : ['perplexity', 'google', 'duckduckgo'];

  for (const provider of providers) {
    try {
      switch (provider) {
        case 'perplexity':
          if (PERPLEXITY_API_KEY) {
            return await searchWithPerplexity(query);
          }
          break;

        case 'google':
          if (GOOGLE_API_KEY && GOOGLE_CX) {
            return await searchWithGoogle(query, maxResults);
          }
          break;

        case 'duckduckgo':
          return await searchWithDuckDuckGo(query, maxResults);
      }
    } catch (error) {
      console.warn(`Search with ${provider} failed:`, error);
      // Continue to next provider
    }
  }

  throw new Error('All search providers failed');
}

/**
 * Search and summarize using AI
 */
export async function searchAndSummarize(
  query: string,
  aiProvider: 'chatgpt' | 'claude' | 'gemini' = 'claude'
): Promise<SearchResponse> {
  // First, get search results
  const searchResponse = await webSearch(query);

  if (searchResponse.answer) {
    // Perplexity already provides an answer
    return searchResponse;
  }

  // If no answer, generate one using AI
  try {
    const { unifiedLLMService } = await import(
      '@core/ai/llm/unified-language-model'
    );

    const context = searchResponse.results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`)
      .join('\n\n');

    const prompt = `Based on the following search results, provide a comprehensive answer to the query: "${query}"\n\nSearch Results:\n${context}\n\nProvide a well-structured answer and cite your sources using [1], [2], etc.`;

    const provider =
      aiProvider === 'chatgpt'
        ? 'openai'
        : aiProvider === 'claude'
          ? 'anthropic'
          : 'google';

    const aiResponse = await unifiedLLMService.sendMessage(
      [
        {
          role: 'system',
          content:
            'You are a helpful assistant that provides accurate, cited information.',
        },
        { role: 'user', content: prompt },
      ],
      undefined,
      undefined,
      provider
    );

    return {
      ...searchResponse,
      answer: aiResponse.content,
      sources: searchResponse.results.map((r) => r.url),
    };
  } catch (error) {
    console.error('Failed to generate AI summary:', error);
    return searchResponse;
  }
}

/**
 * Check if web search is configured
 */
export function isWebSearchConfigured(): boolean {
  return !!(PERPLEXITY_API_KEY || (GOOGLE_API_KEY && GOOGLE_CX));
}

/**
 * Get available search providers
 */
export function getAvailableSearchProviders(): string[] {
  const providers: string[] = [];

  if (PERPLEXITY_API_KEY) providers.push('perplexity');
  if (GOOGLE_API_KEY && GOOGLE_CX) providers.push('google');
  providers.push('duckduckgo'); // Always available

  return providers;
}
