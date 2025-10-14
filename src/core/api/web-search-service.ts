/**
 * Web Search Service - Perplexity-style Search Integration
 * Provides real-time web search capabilities
 */

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GOOGLE_CX = import.meta.env.VITE_GOOGLE_CX || '';

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
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
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
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    // Extract citations/sources from the response
    const citationRegex = /\[(\d+)\]/g;
    const citations = Array.from(answer.matchAll(citationRegex), m =>
      parseInt(m[1])
    );
    const sources = data.citations || [];

    // Parse results
    const results: SearchResult[] = sources.map(
      (source: any, index: number) => ({
        title: source.title || `Source ${index + 1}`,
        url: source.url,
        snippet: source.snippet || '',
        source: new URL(source.url).hostname,
        publishedDate: source.publishedDate,
      })
    );

    return {
      query,
      results,
      answer,
      sources: sources.map((s: any) => s.url),
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

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.statusText}`);
    }

    const data = await response.json();

    const results: SearchResult[] = (data.items || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      source: new URL(item.link).hostname,
      publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(item.link).hostname}`,
    }));

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

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.statusText}`);
    }

    const data = await response.json();

    const results: SearchResult[] = [];

    // Add abstract if available
    if (data.Abstract) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.Abstract,
        source: data.AbstractSource,
      });
    }

    // Add related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, maxResults - 1)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0],
            url: topic.FirstURL,
            snippet: topic.Text,
            source: new URL(topic.FirstURL).hostname,
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
    const { sendAIMessage } = await import('./ai-chat-service');

    const context = searchResponse.results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`)
      .join('\n\n');

    const prompt = `Based on the following search results, provide a comprehensive answer to the query: "${query}"\n\nSearch Results:\n${context}\n\nProvide a well-structured answer and cite your sources using [1], [2], etc.`;

    const aiResponse = await sendAIMessage(aiProvider, [
      { role: 'user', content: prompt },
    ]);

    return {
      ...searchResponse,
      answer: aiResponse.content,
      sources: searchResponse.results.map(r => r.url),
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
