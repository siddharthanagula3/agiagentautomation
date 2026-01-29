/**
 * GlobalSearchDialog - Search across all chat sessions and messages
 * Provides advanced filtering, result navigation, and search history
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Input } from '@shared/ui/input';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Label } from '@shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { Calendar } from '@shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import {
  Search,
  X,
  MessageSquare,
  Calendar as CalendarIcon,
  Filter,
  Loader2,
  FileText,
  User,
  Bot,
  Clock,
  History,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import {
  globalSearchService,
  type SearchResult,
  type SearchFilters,
  type SearchStats,
  type RecentSearch,
  type PopularSearch,
} from '../../services/global-search-service';
import { useAuthStore } from '@shared/stores/authentication-store';
import { format } from 'date-fns';
import ErrorBoundary from '@shared/components/ErrorBoundary';

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: GlobalSearchDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState<
    'all' | 'user' | 'assistant' | 'system'
  >('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [includeArchived, setIncludeArchived] = useState(false);

  // Search history and suggestions
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent and popular searches when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      loadSearchHistory();
    }
  }, [open, user?.id]);

  const loadSearchHistory = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingHistory(true);
    try {
      const [recent, popular] = await Promise.all([
        globalSearchService.getRecentSearches(user.id, 10),
        globalSearchService.getPopularSearches(10, 7),
      ]);
      setRecentSearches(recent);
      setPopularSearches(popular);
    } catch (error) {
      console.error('[GlobalSearch] Failed to load search history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id]);

  const handleClearHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      const deletedCount = await globalSearchService.clearSearchHistory(user.id);
      setRecentSearches([]);
      toast.success(`Cleared ${deletedCount} search${deletedCount !== 1 ? 'es' : ''} from history`);
    } catch (error) {
      console.error('[GlobalSearch] Failed to clear history:', error);
      toast.error('Failed to clear search history');
    }
  }, [user?.id]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!user?.id || !query.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const filters: SearchFilters = {
        query: query.trim(),
        role: roleFilter === 'all' ? undefined : roleFilter,
        startDate,
        endDate,
        includeArchived,
        limit: 50,
      };

      const searchResults = await globalSearchService.search(user.id, filters);
      setResults(searchResults.results);
      setStats(searchResults.stats);
    } catch (error) {
      console.error('[GlobalSearch] Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [user?.id, query, roleFilter, startDate, endDate, includeArchived]);

  // Debounced search with 300ms delay
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setStats(null);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search (300ms debounce)
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, roleFilter, startDate, endDate, includeArchived, handleSearch]);

  // Cleanup when dialog closes or component unmounts
  useEffect(() => {
    if (!open) {
      // Clear timeout when dialog closes
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [open]);

  const handleResultClick = (result: SearchResult) => {
    // Close dialog first
    onOpenChange(false);

    // Navigate to the chat session with optional message scroll target
    // The messageId is passed as a query parameter that the chat page can use
    // to scroll to and highlight the specific message after loading
    if (result.messageId) {
      navigate(
        `/chat/${result.sessionId}?highlightMessage=${result.messageId}`
      );
    } else {
      navigate(`/chat/${result.sessionId}`);
    }
  };

  const handleClearFilters = () => {
    setRoleFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setIncludeArchived(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setStats(null);
    setShowSuggestions(true);
    handleClearFilters();
  };

  const highlightMatch = (text: string, match: string) => {
    if (!match) return text;

    try {
      // Escape special regex characters to prevent errors
      const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escapedMatch})`, 'gi'));
      return (
        <>
          {parts.map((part, partIndex) =>
            part.toLowerCase() === match.toLowerCase() ? (
              <mark
                key={`highlight-${partIndex}-${part.slice(0, 10)}`}
                className="bg-yellow-200 font-semibold dark:bg-yellow-800/50"
              >
                {part}
              </mark>
            ) : (
              <span key={`text-${partIndex}`}>{part}</span>
            )
          )}
        </>
      );
    } catch (error) {
      // If regex fails for any reason, return plain text
      console.warn('[GlobalSearch] Highlight failed:', error);
      return text;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <User className="h-3.5 w-3.5" />;
      case 'assistant':
        return <Bot className="h-3.5 w-3.5" />;
      case 'system':
        return <FileText className="h-3.5 w-3.5" />;
      default:
        return <MessageSquare className="h-3.5 w-3.5" />;
    }
  };

  const activeFilterCount = [
    roleFilter !== 'all',
    startDate !== undefined,
    endDate !== undefined,
    includeArchived,
  ].filter(Boolean).length;

  return (
    <ErrorBoundary
      fallback={
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-h-[80vh] max-w-3xl p-0">
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Search className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
              <p className="text-sm font-medium">Search unavailable</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Something went wrong. Please close and try again.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-3xl p-0">
          <DialogHeader className="border-b px-6 pb-4 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Conversations
            </DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="border-b bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search messages and conversations..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-9"
                  autoFocus
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={handleClear}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center p-0 text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 space-y-4 rounded-lg border bg-background p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Role Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs">Message Type</Label>
                    <Select
                      value={roleFilter}
                      onValueChange={(
                        value: 'all' | 'user' | 'assistant' | 'system'
                      ) => setRoleFilter(value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All messages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All messages</SelectItem>
                        <SelectItem value="user">My messages</SelectItem>
                        <SelectItem value="assistant">AI responses</SelectItem>
                        <SelectItem value="system">System messages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label className="text-xs">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'h-9 w-full justify-start text-left font-normal',
                            !startDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {startDate
                            ? format(startDate, 'MMM d, yyyy')
                            : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label className="text-xs">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'h-9 w-full justify-start text-left font-normal',
                            !endDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {endDate
                            ? format(endDate, 'MMM d, yyyy')
                            : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="flex items-center justify-between border-t pt-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeArchived}
                      onChange={(e) => setIncludeArchived(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Include archived conversations
                    </span>
                  </label>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Search Stats */}
          {stats && (
            <div className="border-b bg-muted/20 px-6 py-2 text-xs text-muted-foreground">
              Found {stats.totalResults} results ({stats.sessionMatches}{' '}
              conversations, {stats.messageMatches} messages) in{' '}
              {stats.searchTime}ms
            </div>
          )}

          {/* Results */}
          <ScrollArea
            className="flex-1 px-6 py-4"
            style={{ maxHeight: '400px' }}
          >
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 && !query.trim() && showSuggestions ? (
              /* Show recent and popular searches when no query */
              <div className="space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <History className="h-4 w-4" />
                        Recent Searches
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearHistory}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Clear
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={`recent-${index}-${search.query}`}
                          onClick={() => handleSuggestionClick(search.query)}
                          className="group flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:border-primary/20"
                        >
                          <Clock className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                          <span className="max-w-[150px] truncate">
                            {search.query}
                          </span>
                          {search.resultCount > 0 && (
                            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                              {search.resultCount}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular/Trending Searches */}
                {popularSearches.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Trending Searches
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((search, index) => (
                        <button
                          key={`popular-${index}-${search.query}`}
                          onClick={() => handleSuggestionClick(search.query)}
                          className="group flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-sm transition-colors hover:bg-primary/10 hover:border-primary/30"
                        >
                          <TrendingUp className="h-3 w-3 text-primary/70 group-hover:text-primary" />
                          <span className="max-w-[150px] truncate">
                            {search.query}
                          </span>
                          <Badge variant="outline" className="ml-1 border-primary/20 px-1.5 py-0 text-[10px] text-primary/70">
                            {search.searchCount} searches
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state when no history */}
                {recentSearches.length === 0 && popularSearches.length === 0 && !isLoadingHistory && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">
                      Start typing to search
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Your search history will appear here
                    </p>
                  </div>
                )}

                {/* Loading history */}
                {isLoadingHistory && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            ) : results.length === 0 && query.trim() ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">
                  No results found
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Try different keywords or clear filters
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">
                  Start typing to search
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((result) => (
                  <button
                    key={`search-result-${result.type}-${result.sessionId}-${result.messageId || result.matchedText.slice(0, 20)}`}
                    onClick={() => handleResultClick(result)}
                    className="group w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                  >
                    {/* Header */}
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {result.type === 'session' ? (
                          <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          getRoleIcon(result.role || 'assistant')
                        )}
                        <span className="truncate text-sm font-medium">
                          {result.sessionTitle}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(result.createdAt, 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Content Preview with Highlighting */}
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                      {result.contextBefore && (
                        <span className="opacity-70">
                          ...{result.contextBefore}
                        </span>
                      )}
                      {highlightMatch(result.matchedText, query.trim())}
                      {result.contextAfter && (
                        <span className="opacity-70">
                          {result.contextAfter}...
                        </span>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {result.type === 'session' ? 'Title' : result.role}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="border-t bg-muted/20 px-6 py-3">
            <p className="text-center text-xs text-muted-foreground">
              Press{' '}
              <kbd className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100">
                Enter
              </kbd>{' '}
              to search,{' '}
              <kbd className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100">
                Esc
              </kbd>{' '}
              to close
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}
