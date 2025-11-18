/**
 * Web Search Integration Service
 * Detects when web search is needed and performs searches automatically
 */

import { webSearch, type SearchResponse } from '@core/integrations/web-search-handler';

/**
 * Keywords and patterns that indicate a need for web search
 */
const SEARCH_INDICATORS = {
  // Explicit search commands
  explicit: [
    'search for',
    'search the web',
    'find information',
    'look up',
    'google',
    'web search',
  ],

  // Questions about current events/news
  current: [
    "what's the latest",
    'recent news',
    'current events',
    'breaking news',
    'today',
    'this week',
    'this month',
    'this year',
    'right now',
  ],

  // Questions requiring factual verification
  factual: [
    'when did',
    'when was',
    'when is',
    'who is',
    'who was',
    'what is',
    'what was',
    'where is',
    'where was',
    'how many',
    'statistics',
    'data on',
    'price of',
    'cost of',
  ],

  // Real-time information
  realtime: [
    'weather',
    'stock price',
    'exchange rate',
    'time in',
    'score',
    'results',
  ],
};

/**
 * Detects if a message requires web search
 */
export function shouldPerformWebSearch(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Check explicit search indicators
  if (SEARCH_INDICATORS.explicit.some((keyword) => lowerMessage.includes(keyword))) {
    return true;
  }

  // Check current events indicators
  if (SEARCH_INDICATORS.current.some((keyword) => lowerMessage.includes(keyword))) {
    return true;
  }

  // Check factual questions
  if (SEARCH_INDICATORS.factual.some((keyword) => lowerMessage.startsWith(keyword))) {
    return true;
  }

  // Check real-time information requests
  if (SEARCH_INDICATORS.realtime.some((keyword) => lowerMessage.includes(keyword))) {
    return true;
  }

  // Check if message is a question about specific topics that likely need current data
  const questionPatterns = [
    /what(?:'s| is) the (?:latest|current|newest)/i,
    /when (?:did|was|is) .+ (?:release|launch|announce)/i,
    /how much (?:does|is)/i,
    /who won/i,
    /latest .+ (?:news|update|version)/i,
  ];

  if (questionPatterns.some((pattern) => pattern.test(message))) {
    return true;
  }

  return false;
}

/**
 * Extracts the search query from a message
 */
export function extractSearchQuery(message: string): string {
  let query = message;

  // Remove explicit search commands
  const searchCommands = ['search for', 'search', 'google', 'find information about', 'look up'];
  for (const command of searchCommands) {
    const regex = new RegExp(`^${command}\\s+`, 'i');
    query = query.replace(regex, '');
  }

  // Remove common filler words from the beginning
  query = query.replace(/^(?:please|can you|could you|would you)\s+/i, '');

  return query.trim();
}

/**
 * Performs a web search based on user message
 */
export async function performWebSearch(
  message: string,
  options?: {
    maxResults?: number;
    provider?: 'perplexity' | 'google' | 'duckduckgo';
  }
): Promise<SearchResponse> {
  const query = extractSearchQuery(message);
  const maxResults = options?.maxResults || 10;
  const provider = options?.provider;

  if (import.meta.env.DEV) {
    console.log(`[WebSearchIntegration] Performing search for: "${query}"`);
  }

  try {
    const searchResponse = await webSearch(query, maxResults, provider);

    if (import.meta.env.DEV) {
      console.log(
        `[WebSearchIntegration] Search completed: ${searchResponse.results.length} results found`
      );
    }

    return searchResponse;
  } catch (error) {
    console.error('[WebSearchIntegration] Search failed:', error);
    throw error;
  }
}

/**
 * Formats search results into a context string for LLM
 */
export function formatSearchResultsForContext(searchResponse: SearchResponse): string {
  const { query, results, answer } = searchResponse;

  let context = `# Web Search Results for: "${query}"\n\n`;

  // Include AI-generated answer if available (from Perplexity)
  if (answer) {
    context += `## AI Summary:\n${answer}\n\n`;
  }

  // Include search results
  context += `## Search Results:\n\n`;

  results.forEach((result, index) => {
    context += `### [${index + 1}] ${result.title}\n`;
    context += `**Source:** ${result.url}\n`;
    if (result.source) {
      context += `**Domain:** ${result.source}\n`;
    }
    if (result.publishedDate) {
      context += `**Date:** ${new Date(result.publishedDate).toLocaleDateString()}\n`;
    }
    context += `**Snippet:** ${result.snippet}\n\n`;
  });

  context += `\n\n**Note:** Please use the above search results to provide an accurate, well-cited answer to the user's question. Include source citations in your response using [1], [2], etc.`;

  return context;
}

/**
 * Enhanced message with search results injected
 */
export interface EnhancedMessage {
  content: string;
  searchResults?: SearchResponse;
  searchQuery?: string;
}

/**
 * Enhances a user message with web search results if needed
 */
export async function enhanceMessageWithSearch(
  message: string,
  options?: {
    forceSearch?: boolean;
    maxResults?: number;
    provider?: 'perplexity' | 'google' | 'duckduckgo';
  }
): Promise<EnhancedMessage> {
  const needsSearch = options?.forceSearch || shouldPerformWebSearch(message);

  if (!needsSearch) {
    return { content: message };
  }

  try {
    const searchResponse = await performWebSearch(message, {
      maxResults: options?.maxResults,
      provider: options?.provider,
    });

    const searchContext = formatSearchResultsForContext(searchResponse);

    // Combine original message with search context
    const enhancedContent = `${message}\n\n---\n\n${searchContext}`;

    return {
      content: enhancedContent,
      searchResults: searchResponse,
      searchQuery: extractSearchQuery(message),
    };
  } catch (error) {
    console.error('[WebSearchIntegration] Failed to enhance message with search:', error);
    // Return original message if search fails
    return {
      content: message,
      searchQuery: extractSearchQuery(message),
    };
  }
}

/**
 * Checks if web search is configured and available
 */
export function isWebSearchAvailable(): boolean {
  const hasPerplexity = !!import.meta.env.VITE_PERPLEXITY_API_KEY;
  const hasGoogle =
    !!import.meta.env.VITE_GOOGLE_API_KEY &&
    !!import.meta.env.VITE_GOOGLE_CX;
  // DuckDuckGo is always available as it doesn't require API keys

  return hasPerplexity || hasGoogle || true; // true because DDG is free
}

/**
 * Get the available search provider
 */
export function getPreferredSearchProvider(): 'perplexity' | 'google' | 'duckduckgo' {
  if (import.meta.env.VITE_PERPLEXITY_API_KEY) {
    return 'perplexity';
  }
  if (import.meta.env.VITE_GOOGLE_API_KEY && import.meta.env.VITE_GOOGLE_CX) {
    return 'google';
  }
  return 'duckduckgo';
}
