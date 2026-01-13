# Web Search Integration Documentation

## Overview

The AGI Agent Automation platform now features comprehensive web search capabilities integrated directly into the chat interface. This allows AI employees to access real-time information from the web to provide accurate, up-to-date answers to user queries.

## Features

### 1. Automatic Search Detection

The system automatically detects when a user query requires web search based on:

- **Explicit search commands**: "search for", "find information about", "look up", "google"
- **Current events queries**: "what's the latest", "recent news", "breaking news"
- **Factual questions**: "when did", "who is", "what is", "how many"
- **Real-time information**: "weather", "stock price", "exchange rate"

### 2. Multi-Provider Support

The web search handler supports multiple search providers with automatic fallback:

1. **Perplexity AI** (Recommended)
   - Provides AI-generated summaries with citations
   - Best for comprehensive research queries
   - Requires: `VITE_PERPLEXITY_API_KEY`

2. **Google Custom Search**
   - High-quality, relevant results
   - Excellent for specific factual queries
   - Requires: `VITE_GOOGLE_API_KEY` and `VITE_GOOGLE_CX`

3. **DuckDuckGo** (Free, no API key required)
   - Always available as fallback
   - Good for general queries
   - Privacy-focused

### 3. Rich Search Results Display

Search results are displayed with:

- **Titles and snippets**: Clear preview of each result
- **Source citations**: Links to original sources
- **Timestamps**: When results were fetched
- **AI summaries**: Perplexity-generated answers with citations
- **Domain favicons**: Visual identification of sources
- **Publication dates**: When content was published

### 4. Seamless Integration

- **Automatic triggering**: No manual search command needed
- **Inline display**: Results appear directly in chat
- **Context awareness**: AI uses search results to answer questions
- **Source attribution**: Responses cite specific sources

## Architecture

### Components

1. **Web Search Handler** (`/src/core/integrations/web-search-handler.ts`)
   - Core search functionality
   - Multi-provider support
   - Result formatting

2. **Web Search Integration** (`/src/features/chat/services/web-search-integration.ts`)
   - Search detection logic
   - Query extraction
   - Context formatting for LLM

3. **Tool Execution Handler** (`/src/features/chat/services/tool-execution-handler.ts`)
   - Web search tool registration
   - Execution management
   - Error handling

4. **Search Results Component** (`/src/features/chat/components/SearchResults.tsx`)
   - UI for displaying results
   - Source cards
   - AI summary display
   - Compact view option

5. **Message Bubble** (`/src/features/chat/components/MessageBubble.tsx`)
   - Integrated search results display
   - Seamless inline rendering

### Data Flow

```
User Query
    ↓
Search Detection (use-chat-interface.ts)
    ↓
[Trigger Search if needed]
    ↓
Web Search Handler (web-search-handler.ts)
    ↓
[Try Perplexity → Google → DuckDuckGo]
    ↓
Format Results
    ↓
Pass to AI Employee
    ↓
Generate Response with Citations
    ↓
Display in Chat with Search Results
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Perplexity AI (Recommended)
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key

# Google Custom Search (Optional)
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_GOOGLE_CX=your_custom_search_engine_id

# No configuration needed for DuckDuckGo (always available)
```

### Getting API Keys

**Perplexity AI:**

1. Visit https://www.perplexity.ai/
2. Sign up for an account
3. Go to Settings → API
4. Generate an API key

**Google Custom Search:**

1. Visit https://console.cloud.google.com/
2. Create a new project
3. Enable "Custom Search API"
4. Create credentials (API Key)
5. Visit https://cse.google.com/
6. Create a custom search engine
7. Get your Search Engine ID (CX)

## Usage Examples

### Example 1: Current Events

**User:** "What's the latest news about AI?"

**System:**

1. Detects search trigger: "latest news"
2. Performs web search: "latest news about AI"
3. Displays search results with recent articles
4. AI summarizes findings with source citations

### Example 2: Factual Questions

**User:** "When was ChatGPT released?"

**System:**

1. Detects factual question pattern
2. Searches for: "when was ChatGPT released"
3. Shows results from reliable sources
4. AI provides precise answer: "November 30, 2022"

### Example 3: Real-time Data

**User:** "What's the weather in San Francisco?"

**System:**

1. Detects real-time query: "weather"
2. Searches for current weather data
3. Displays results with current conditions
4. AI provides formatted weather information

### Example 4: Explicit Search

**User:** "Search for best practices in React development"

**System:**

1. Detects explicit search command
2. Performs comprehensive web search
3. Shows multiple relevant results
4. AI synthesizes information from sources

## UI Components

### SearchResults Component

Displays complete search results with:

- Query header with timestamp
- AI-generated summary (if available)
- Numbered result cards
- Source links with favicons
- Expandable snippets

```tsx
<SearchResults searchResponse={searchResponse} showAnswer={true} />
```

### CompactSearchResults Component

Inline display for space-constrained areas:

- Compact result badges
- Quick source links
- Minimal visual footprint

```tsx
<CompactSearchResults searchResponse={searchResponse} />
```

### SearchingIndicator Component

Shows search in progress:

- Animated search icon
- Current query display
- Loading state

```tsx
<SearchingIndicator query="latest AI news" />
```

## Integration with AI Employees

### How AI Employees Use Search Results

1. **Automatic Context Injection**
   - Search results are automatically added to conversation context
   - LLM receives formatted summaries and sources
   - Enables accurate, current responses

2. **Source Citation**
   - AI responses include numbered citations [1], [2], etc.
   - Citations link to original sources
   - Transparent information attribution

3. **Verification**
   - AI can cross-reference multiple sources
   - Identifies conflicting information
   - Provides confidence levels

## Best Practices

### For Users

1. **Be Specific**: More specific queries yield better results
   - ✅ "What was Tesla's stock price on January 1, 2024?"
   - ❌ "Tesla stock"

2. **Use Natural Language**: No need for special syntax
   - ✅ "When is the next presidential election?"
   - ❌ "search: next presidential election date"

3. **Request Recent Information**: Explicitly mention timeframes
   - ✅ "Latest developments in quantum computing this year"
   - ✅ "News from the past week about SpaceX"

### For Developers

1. **Extend Search Indicators**: Add domain-specific triggers

   ```typescript
   // In web-search-integration.ts
   const SEARCH_INDICATORS = {
     // Add custom indicators
     custom: ['find docs on', 'API reference for'],
   };
   ```

2. **Customize Result Display**: Modify SearchResults component
   - Add filtering options
   - Implement result ranking
   - Add bookmark functionality

3. **Enhance Detection Logic**: Improve `shouldPerformWebSearch()`
   - Add machine learning-based detection
   - Consider user preferences
   - Track search patterns

## Performance Considerations

1. **Caching**: Search results are not currently cached (future enhancement)
2. **Rate Limiting**: Respect API provider rate limits
3. **Timeout Handling**: 30-second timeout for searches
4. **Graceful Degradation**: Falls back to next provider on failure

## Future Enhancements

- [ ] Result caching for frequently asked questions
- [ ] User preference for search provider
- [ ] Advanced filtering (date range, domain, content type)
- [ ] Image and video search results
- [ ] News aggregation from specific sources
- [ ] Scholarly article search integration
- [ ] Search history and bookmarks
- [ ] Export search results
- [ ] Multi-language search support
- [ ] Voice search integration

## Troubleshooting

### Search Not Triggering

**Issue**: Web search doesn't activate automatically

**Solutions**:

1. Check if query matches detection patterns
2. Try explicit search command: "search for..."
3. Verify API keys are configured
4. Check browser console for errors

### No Results Returned

**Issue**: Search completes but shows no results

**Solutions**:

1. Try different search provider
2. Refine query to be more specific
3. Check network connectivity
4. Verify API key validity

### Rate Limit Errors

**Issue**: "Rate limit exceeded" error

**Solutions**:

1. Wait for rate limit reset
2. Use alternative search provider
3. Upgrade API plan
4. Implement request throttling

### Results Not Displaying

**Issue**: Search completes but results don't show

**Solutions**:

1. Check MessageBubble component integration
2. Verify searchResults metadata is passed
3. Check browser console for rendering errors
4. Clear browser cache and reload

## API Reference

### `shouldPerformWebSearch(message: string): boolean`

Determines if a message requires web search.

**Parameters:**

- `message`: User's chat message

**Returns:** `true` if search is needed, `false` otherwise

### `performWebSearch(message: string, options?): Promise<SearchResponse>`

Performs web search for given query.

**Parameters:**

- `message`: Search query
- `options.maxResults`: Maximum results (default: 10)
- `options.provider`: Specific provider to use

**Returns:** Promise resolving to SearchResponse

### `formatSearchResultsForContext(searchResponse): string`

Formats search results for LLM context.

**Parameters:**

- `searchResponse`: SearchResponse object

**Returns:** Formatted context string

## Support

For issues, questions, or contributions:

- GitHub Issues: [Link to repo issues]
- Documentation: `/docs`
- Examples: `/examples`

## Changelog

**v1.1.0 (Jan 2026)**

- Enhanced security with CORS origin whitelist validation
- JWT verification via Supabase `auth.getUser()` in rate limiter
- Added DeepSeek and Qwen as alternative LLM providers for search synthesis
- Token enforcement with pre-flight balance checks
- Employee memory context integration for personalized search results

**v1.0.0 (Nov 2025)**

- Initial web search integration
- Multi-provider support (Perplexity, Google, DuckDuckGo)
- Automatic search detection
- Rich results display with citations

## License

Same as parent project (AGI Agent Automation)
