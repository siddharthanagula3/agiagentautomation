/**
 * Web Search Service - Perplexity-style Search Integration
 * Provides real-time web search capabilities
 *
 * SECURITY: All API calls are routed through Netlify proxy functions
 * to keep API keys secure on the server side. Never expose API keys client-side.
 */

import { fetchWithTimeout, TimeoutPresets } from '@shared/utils/error-handling';
import { supabase } from '@shared/lib/supabase-client';

// SECURITY: API keys removed - all calls go through authenticated proxies
// Provider availability is determined by proxy configuration, not client-side keys

/**
 * Helper function to get the current Supabase session token
 * Required for authenticated API proxy calls
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('[WebSearch] Failed to get auth token:', error);
    return null;
  }
}

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
 * SECURITY: Routes through Netlify proxy to keep API keys secure
 */
export async function searchWithPerplexity(
  query: string
): Promise<SearchResponse> {
  // SECURITY: Get auth token for authenticated proxy calls
  const authToken = await getAuthToken();
  if (!authToken) {
    throw new Error(
      'User not authenticated. Please log in to use search features.'
    );
  }

  try {
    const response = await fetchWithTimeout(
      '/.netlify/functions/llm-proxies/perplexity-proxy',
      {
        timeoutMs: TimeoutPresets.SEARCH,
        timeoutMessage: 'Perplexity search timed out',
        fetchOptions: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
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
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Perplexity API error: ${response.statusText}`
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || data.content || '';

    // Extract citations/sources from the response
    const citationRegex = /\[(\d+)\]/g;
    const citations = Array.from(answer.matchAll(citationRegex), (m) =>
      parseInt(m[1])
    );
    const sources = data.citations || [];

    // Parse results, filtering out entries with invalid URLs
    const results: SearchResult[] = sources
      .filter(
        (
          source: unknown
        ): source is {
          url: string;
          title?: string;
          snippet?: string;
          publishedDate?: string;
        } =>
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
          s !== null &&
          typeof s === 'object' &&
          isValidUrl((s as Record<string, unknown>).url)
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
 * SECURITY: Routes through Netlify proxy to keep API keys secure
 */
export async function searchWithGoogle(
  query: string,
  maxResults: number = 10
): Promise<SearchResponse> {
  // SECURITY: Get auth token for authenticated proxy calls
  const authToken = await getAuthToken();
  if (!authToken) {
    throw new Error(
      'User not authenticated. Please log in to use search features.'
    );
  }

  try {
    // SECURITY: Route through Google proxy instead of direct API call
    const response = await fetchWithTimeout(
      '/.netlify/functions/llm-proxies/google-proxy',
      {
        timeoutMs: TimeoutPresets.SEARCH,
        timeoutMessage: 'Google Search timed out',
        fetchOptions: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            action: 'search',
            query,
            maxResults: Math.min(maxResults, 10),
          }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Google Search API error: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Filter and map results, excluding items with invalid URLs
    const results: SearchResult[] = (data.items || data.results || [])
      .filter(
        (
          item: unknown
        ): item is {
          link?: string;
          url?: string;
          title?: string;
          snippet?: string;
          pagemap?: { metatags?: Array<Record<string, string>> };
        } =>
          item !== null &&
          typeof item === 'object' &&
          (isValidUrl((item as Record<string, unknown>).link) ||
            isValidUrl((item as Record<string, unknown>).url))
      )
      .map((item) => {
        const url = item.link || item.url || '';
        const hostname = safeGetHostname(url);
        return {
          title: (item.title as string) || '',
          url,
          snippet: (item.snippet as string) || '',
          source: hostname,
          publishedDate:
            item.pagemap?.metatags?.[0]?.['article:published_time'],
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
 * SECURITY: All providers route through authenticated Netlify proxies
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
          // SECURITY: Perplexity proxy handles API key on server side
          return await searchWithPerplexity(query);

        case 'google':
          // SECURITY: Google proxy handles API key on server side
          return await searchWithGoogle(query, maxResults);

        case 'duckduckgo':
          // DuckDuckGo doesn't require API keys
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
    const { unifiedLLMService } =
      await import('@core/ai/llm/unified-language-model');

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
 * SECURITY: Returns true since proxies handle API keys server-side
 */
export function isWebSearchConfigured(): boolean {
  // Web search is always available through authenticated proxies
  // DuckDuckGo is always available as a fallback (no API key required)
  return true;
}

/**
 * Get available search providers
 * SECURITY: Provider availability determined by server-side proxy configuration
 */
export function getAvailableSearchProviders(): string[] {
  // All providers are available through authenticated proxies
  // Actual availability depends on server-side API key configuration
  return ['perplexity', 'google', 'duckduckgo'];
}
