/**
 * ConversationListItem - Clean, minimal conversation item
 *
 * Redesigned with:
 * - Minimal default state (title + time only)
 * - Indicators shown subtly
 * - Actions on hover
 * - Progressive disclosure
 */

import React, { useState, useCallback, memo } from 'react';
import { Button } from '@shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui/alert-dialog';
import {
  Star,
  Pin,
  Archive,
  MoreHorizontal,
  Edit,
  Trash2,
  Share2,
  Copy,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListItemProps {
  id: string;
  title: string;
  summary?: string;
  updatedAt: Date;
  totalMessages: number;
  isActive: boolean;
  isStarred?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  tags?: string[];
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
}

export const ConversationListItem = memo(function ConversationListItem({
  id,
  title,
  summary,
  updatedAt,
  totalMessages,
  isActive,
  isStarred,
  isPinned,
  isArchived,
  tags = [],
  onClick,
  onRename,
  onDelete,
  onStar,
  onPin,
  onArchive,
  onShare,
  onDuplicate,
}: ConversationListItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteDialog(true);
    },
    []
  );

  const handleConfirmDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.();
      setShowDeleteDialog(false);
    },
    [onDelete]
  );

  return (
    <>
      <div
        className={cn(
          'group relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors',
          isActive
            ? 'bg-primary/10 text-foreground'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          isArchived && 'opacity-50'
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`${title}${isStarred ? ', starred' : ''}${isPinned ? ', pinned' : ''}${isArchived ? ', archived' : ''}`}
        aria-current={isActive ? 'true' : undefined}
        onKeyDown={handleKeyDown}
      >
        {/* Pin indicator - subtle left border */}
        {isPinned && (
          <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-yellow-500" />
        )}

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm" title={title}>
              {title}
            </span>
            {isStarred && (
              <Star
                className="h-3 w-3 flex-shrink-0 fill-yellow-500 text-yellow-500"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Time - always visible but subtle */}
          <div className="text-[11px] text-muted-foreground/70">
            {formatDistanceToNow(updatedAt, { addSuffix: true })}
          </div>
        </div>

        {/* Actions Menu - show on hover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100',
                isActive && 'opacity-100'
              )}
              onClick={(e) => e.stopPropagation()}
              aria-label="Conversation options"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44">
            {onPin && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onPin();
                }}
              >
                <Pin
                  className={cn(
                    'mr-2 h-4 w-4',
                    isPinned && 'fill-current text-yellow-500'
                  )}
                  aria-hidden="true"
                />
                {isPinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
            )}

            {onStar && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onStar();
                }}
              >
                <Star
                  className={cn(
                    'mr-2 h-4 w-4',
                    isStarred && 'fill-current text-yellow-500'
                  )}
                  aria-hidden="true"
                />
                {isStarred ? 'Unstar' : 'Star'}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {onRename && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRename();
                }}
              >
                <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                Rename
              </DropdownMenuItem>
            )}

            {onDuplicate && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
              >
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                Duplicate
              </DropdownMenuItem>
            )}

            {onShare && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
              >
                <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Share
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {onArchive && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive();
                }}
              >
                <Archive className="mr-2 h-4 w-4" aria-hidden="true" />
                {isArchived ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
            )}

            {onDelete && (
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{title}" and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
