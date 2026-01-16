/**
 * GlobalSearchDialog - Search across all chat sessions and messages
 * Provides advanced filtering and result navigation
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/ui/popover';
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
} from 'lucide-react';
import {
  globalSearchService,
  type SearchResult,
  type SearchFilters,
  type SearchStats,
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
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant' | 'system'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [includeArchived, setIncludeArchived] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async () => {
    if (!user?.id || !query.trim()) return;

    setIsSearching(true);

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
  }, [user?.id, roleFilter, startDate, endDate, includeArchived]);

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

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the chat session
    navigate(`/chat/${result.sessionId}`);

    // Close dialog
    onOpenChange(false);

    // TODO: Scroll to specific message if messageId exists
    if (result.messageId) {
      // This could be implemented with a query parameter or hash
      // navigate(`/chat/${result.sessionId}#message-${result.messageId}`);
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
          {parts.map((part, i) =>
            part.toLowerCase() === match.toLowerCase() ? (
              <mark
                key={i}
                className="bg-yellow-200 dark:bg-yellow-800/50 font-semibold"
              >
                {part}
              </mark>
            ) : (
              part
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
          <DialogContent className="max-w-3xl max-h-[80vh] p-0">
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground opacity-30 mb-3" />
              <p className="text-sm font-medium">Search unavailable</p>
              <p className="text-xs text-muted-foreground mt-1">
                Something went wrong. Please close and try again.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Conversations
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
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
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 border rounded-lg bg-background space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Role Filter */}
                <div className="space-y-2">
                  <Label className="text-xs">Message Type</Label>
                  <Select
                    value={roleFilter}
                    onValueChange={(value: 'all' | 'user' | 'assistant' | 'system') => setRoleFilter(value)}
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
                          'w-full h-9 justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {startDate ? (
                          format(startDate, 'MMM d, yyyy')
                        ) : (
                          'Select date'
                        )}
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
                          'w-full h-9 justify-start text-left font-normal',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {endDate ? format(endDate, 'MMM d, yyyy') : 'Select date'}
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
              <div className="flex items-center justify-between pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Include archived conversations</span>
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
          <div className="px-6 py-2 text-xs text-muted-foreground border-b bg-muted/20">
            Found {stats.totalResults} results ({stats.sessionMatches} conversations,{' '}
            {stats.messageMatches} messages) in {stats.searchTime}ms
          </div>
        )}

        {/* Results */}
        <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: '400px' }}>
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground opacity-30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {query.trim() ? 'No results found' : 'Start typing to search'}
              </p>
              {query.trim() && (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Try different keywords or clear filters
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result, idx) => (
                <button
                  key={`${result.type}-${result.sessionId}-${result.messageId || idx}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {result.type === 'session' ? (
                        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        getRoleIcon(result.role || 'assistant')
                      )}
                      <span className="text-sm font-medium truncate">
                        {result.sessionTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(result.createdAt, 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  {/* Content Preview with Highlighting */}
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {result.contextBefore && (
                      <span className="opacity-70">...{result.contextBefore}</span>
                    )}
                    {highlightMatch(result.matchedText, query.trim())}
                    {result.contextAfter && (
                      <span className="opacity-70">{result.contextAfter}...</span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {result.type === 'session' ? 'Title' : result.role}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Enter</kbd> to search, <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Esc</kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
    </ErrorBoundary>
  );
}
