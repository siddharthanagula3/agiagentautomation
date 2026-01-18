/**
 * BookmarksDialog - View and manage bookmarked messages
 * Displays all saved messages with filtering and search
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Badge } from '@shared/ui/badge';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Textarea } from '@shared/ui/textarea';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import {
  Bookmark,
  Search,
  Trash2,
  Edit,
  ExternalLink,
  Tag,
  Calendar,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import {
  messageBookmarksService,
  type BookmarkedMessage,
} from '../../services/message-bookmarks-service';
import { useAuthStore } from '@shared/stores/authentication-store';
import { format } from 'date-fns';

interface BookmarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookmarksDialog({ open, onOpenChange }: BookmarksDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [bookmarks, setBookmarks] = useState<BookmarkedMessage[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<
    BookmarkedMessage[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  const loadBookmarks = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [userBookmarks, tags] = await Promise.all([
        messageBookmarksService.getUserBookmarks(user.id),
        messageBookmarksService.getUserBookmarkTags(user.id),
      ]);

      setBookmarks(userBookmarks);
      setFilteredBookmarks(userBookmarks);
      setAllTags(tags);
    } catch (error) {
      console.error('[Bookmarks] Failed to load:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (open && user?.id) {
      loadBookmarks();
    }
  }, [open, user?.id, loadBookmarks]);

  useEffect(() => {
    // Filter bookmarks by search query and tag
    let filtered = bookmarks;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.messageContent.toLowerCase().includes(query) ||
          b.sessionTitle.toLowerCase().includes(query) ||
          b.note?.toLowerCase().includes(query)
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((b) => b.tags.includes(selectedTag));
    }

    setFilteredBookmarks(filtered);
  }, [searchQuery, selectedTag, bookmarks]);

  const handleRemoveBookmark = async (messageId: string) => {
    if (!user?.id) return;

    try {
      await messageBookmarksService.removeBookmark(user.id, messageId);
      toast.success('Bookmark removed');
      await loadBookmarks();
    } catch (error) {
      console.error('[Bookmarks] Failed to remove:', error);
      toast.error('Failed to remove bookmark');
    }
  };

  const handleUpdateNote = async (messageId: string) => {
    if (!user?.id) return;

    try {
      await messageBookmarksService.updateBookmark(user.id, messageId, {
        note: editNote.trim() || undefined,
      });
      toast.success('Note updated');
      setEditingBookmark(null);
      setEditNote('');
      await loadBookmarks();
    } catch (error) {
      console.error('[Bookmarks] Failed to update:', error);
      toast.error('Failed to update note');
    }
  };

  const handleNavigateToMessage = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Bookmarked Messages
              </DialogTitle>
              <DialogDescription>
                {bookmarks.length} saved message
                {bookmarks.length !== 1 ? 's' : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="space-y-3 border-b px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <Button
                variant={selectedTag === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(null)}
                className="h-7"
              >
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                  className="h-7"
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Bookmarks List */}
        <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: '500px' }}>
          {filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bookmark className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">
                {bookmarks.length === 0
                  ? 'No bookmarks yet'
                  : 'No bookmarks match your filters'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {bookmarks.length === 0
                  ? 'Bookmark important messages to save them here'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <button
                        onClick={() =>
                          handleNavigateToMessage(bookmark.sessionId)
                        }
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {bookmark.sessionTitle}
                      </button>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingBookmark(bookmark.messageId);
                          setEditNote(bookmark.note || '');
                        }}
                        title="Edit note"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveBookmark(bookmark.messageId)}
                        title="Remove bookmark"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="space-y-3 pl-6">
                    <div className="line-clamp-3 text-sm text-muted-foreground">
                      {bookmark.messageContent}
                    </div>

                    {/* Note */}
                    {editingBookmark === bookmark.messageId ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Add a note about this bookmark..."
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateNote(bookmark.messageId)}
                          >
                            Save Note
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingBookmark(null);
                              setEditNote('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : bookmark.note ? (
                      <div className="rounded bg-muted p-2 text-xs italic">
                        {bookmark.note}
                      </div>
                    ) : null}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(bookmark.createdAt, 'MMM d, yyyy')}
                      </div>
                      {bookmark.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          {bookmark.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
