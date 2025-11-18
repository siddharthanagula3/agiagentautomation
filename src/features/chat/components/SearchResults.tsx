/**
 * SearchResults Component
 * Displays web search results with titles, snippets, and source citations
 */

import React from 'react';
import { ExternalLink, Search, Clock, Globe } from 'lucide-react';
import { Card } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { cn } from '@shared/lib/utils';
import type { SearchResult, SearchResponse } from '@core/integrations/web-search-handler';

interface SearchResultsProps {
  searchResponse: SearchResponse;
  className?: string;
  showAnswer?: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchResponse,
  className,
  showAnswer = true,
}) => {
  const { query, results, answer, sources, timestamp } = searchResponse;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Query Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        <span className="font-medium">Search results for:</span>
        <span className="font-semibold text-foreground">"{query}"</span>
        {timestamp && (
          <div className="ml-auto flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-xs">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* AI-Generated Answer (if available from Perplexity) */}
      {showAnswer && answer && (
        <Card className="border-primary/20 bg-primary/5 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                AI Summary
              </Badge>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm leading-relaxed">{answer}</p>
            </div>
            {sources && sources.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Sources:
                </span>
                {sources.slice(0, 5).map((source, idx) => (
                  <a
                    key={idx}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    [{idx + 1}]
                  </a>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Search Results List */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">
            {results.length} {results.length === 1 ? 'result' : 'results'} found
          </div>
          <div className="space-y-2">
            {results.map((result, index) => (
              <SearchResultCard key={index} result={result} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {results.length === 0 && !answer && (
        <Card className="p-6 text-center">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-sm text-muted-foreground">
            No search results found for "{query}"
          </p>
        </Card>
      )}
    </div>
  );
};

interface SearchResultCardProps {
  result: SearchResult;
  index: number;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, index }) => {
  const { title, url, snippet, source, publishedDate, favicon } = result;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 no-underline"
      >
        <div className="space-y-2">
          {/* Result Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Favicon or Globe Icon */}
              <div className="mt-0.5 flex-shrink-0">
                {favicon ? (
                  <img
                    src={favicon}
                    alt=""
                    className="h-4 w-4 rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Title and Source */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {title}
                </h3>
                {source && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{source}</span>
                    {publishedDate && (
                      <>
                        <span>•</span>
                        <span>{new Date(publishedDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Result Number and External Link */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="text-xs">
                {index + 1}
              </Badge>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>

          {/* Snippet */}
          {snippet && (
            <p className="text-sm text-muted-foreground line-clamp-3 pl-7">
              {snippet}
            </p>
          )}

          {/* URL */}
          <div className="flex items-center gap-2 pl-7">
            <span className="text-xs text-muted-foreground/70 truncate">
              {url}
            </span>
          </div>
        </div>
      </a>
    </Card>
  );
};

/**
 * Compact Search Results Component for inline display
 */
export const CompactSearchResults: React.FC<SearchResultsProps> = ({
  searchResponse,
  className,
}) => {
  const { query, results } = searchResponse;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Search className="h-3 w-3" />
        <span>Searched for: {query}</span>
        <Badge variant="secondary" className="text-xs">
          {results.length} results
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {results.slice(0, 5).map((result, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            asChild
          >
            <a href={result.url} target="_blank" rel="noopener noreferrer">
              <span className="flex items-center gap-1.5">
                <span className="truncate max-w-[200px]">{result.title}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </span>
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
};

/**
 * Searching Indicator Component
 */
export const SearchingIndicator: React.FC<{
  query?: string;
  className?: string;
}> = ({ query, className }) => {
  return (
    <div className={cn('flex items-center gap-3 p-4', className)}>
      <div className="relative">
        <Search className="h-5 w-5 text-primary animate-pulse" />
        <div className="absolute inset-0 animate-ping">
          <Search className="h-5 w-5 text-primary opacity-20" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium">
          Searching the web{query ? ` for "${query}"` : ''}...
        </div>
        <div className="text-xs text-muted-foreground">
          Finding the most relevant information
        </div>
      </div>
    </div>
  );
};
