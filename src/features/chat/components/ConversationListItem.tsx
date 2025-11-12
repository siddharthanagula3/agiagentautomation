/**
 * Conversation List Item with Star/Pin/Archive
 * Enhanced sidebar item (ChatGPT/Claude style)
 */

import React, { useState } from 'react';
import { Button } from '@shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import {
  MessageSquare,
  Star,
  Pin,
  Archive,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

export function ConversationListItem({
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
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-1 rounded-lg p-3 transition-all cursor-pointer',
        isActive
          ? 'bg-primary/10 border-l-2 border-primary'
          : 'hover:bg-muted/50',
        isPinned && 'border-l-2 border-yellow-500',
        isArchived && 'opacity-60'
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

          <span
            className="text-sm font-medium truncate"
            title={title}
          >
            {title}
          </span>

          {/* Indicators */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isPinned && (
              <Pin className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            )}
            {isStarred && (
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            )}
            {isArchived && (
              <Archive className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 w-6 p-0 flex-shrink-0',
                showActions || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            {onStar && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStar(); }}>
                <Star className={cn('mr-2 h-4 w-4', isStarred && 'fill-current text-yellow-500')} />
                {isStarred ? 'Unstar' : 'Star'}
              </DropdownMenuItem>
            )}

            {onPin && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(); }}>
                <Pin className={cn('mr-2 h-4 w-4', isPinned && 'fill-current text-yellow-500')} />
                {isPinned ? 'Unpin' : 'Pin to top'}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {onRename && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
            )}

            {onShare && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
            )}

            {onDuplicate && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {onArchive && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                <Archive className="mr-2 h-4 w-4" />
                {isArchived ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
            )}

            {onDelete && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this conversation?')) onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary */}
      {summary && (
        <p className="text-xs text-muted-foreground truncate pl-6">
          {summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pl-6">
        <span>{totalMessages} messages</span>
        <span title={updatedAt.toLocaleString()}>
          {formatDistanceToNow(updatedAt, { addSuffix: true })}
        </span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-6">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
