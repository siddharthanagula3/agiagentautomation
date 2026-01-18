/**
 * ChatHeader - Clean, minimal header
 *
 * Redesigned with:
 * - Essential actions only (sidebar, title, search, menu)
 * - Secondary actions in overflow menu
 * - Clean visual hierarchy
 */

import React from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import {
  Menu,
  Share2,
  Download,
  Settings,
  Edit3,
  Check,
  X,
  Search,
  BarChart3,
  Bookmark,
  MoreHorizontal,
  FileDown,
  Trash2,
} from 'lucide-react';
import type { ChatSession } from '../../types';
import { ThemeToggle } from '@shared/ui/theme-toggle';

interface ChatHeaderProps {
  session: ChatSession | null;
  onRename: (title: string) => void;
  onShare: () => void;
  onExport: () => void;
  onSettings: () => void;
  onToggleSidebar: () => void;
  onSearch?: () => void;
  onAnalytics?: () => void;
  onBookmarks?: () => void;
  onDelete?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  session,
  onRename,
  onShare,
  onExport,
  onSettings,
  onToggleSidebar,
  onSearch,
  onAnalytics,
  onBookmarks,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(session?.title || '');

  React.useEffect(() => {
    setEditTitle(session?.title || '');
  }, [session?.title]);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== session?.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(session?.title || '');
    setIsEditing(false);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: Sidebar toggle + Title */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {isEditing ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') handleCancel();
              }}
              className="h-8 max-w-xs"
              autoFocus
              aria-label="Chat title"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRename}
              className="h-8 w-8 flex-shrink-0"
              aria-label="Confirm rename"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8 flex-shrink-0"
              aria-label="Cancel rename"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="group flex min-w-0 items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted"
            aria-label={`Edit chat title: ${session?.title || 'New Chat'}`}
          >
            <h1 className="truncate text-sm font-semibold">
              {session?.title || 'New Chat'}
            </h1>
            <Edit3
              className="h-3 w-3 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Search - Primary action */}
        {onSearch && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearch}
            className="hidden gap-2 sm:flex"
            aria-label="Search conversations"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="hidden text-xs text-muted-foreground lg:inline">
              ⌘K
            </span>
          </Button>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onSearch && (
              <DropdownMenuItem onClick={onSearch} className="sm:hidden">
                <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                Search
              </DropdownMenuItem>
            )}

            {onBookmarks && (
              <DropdownMenuItem onClick={onBookmarks}>
                <Bookmark className="mr-2 h-4 w-4" aria-hidden="true" />
                Bookmarks
              </DropdownMenuItem>
            )}

            {onAnalytics && (
              <DropdownMenuItem onClick={onAnalytics}>
                <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
                Analytics
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Share
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onExport}>
              <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
              Export
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onSettings}>
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              Settings
            </DropdownMenuItem>

            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Delete Chat
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
