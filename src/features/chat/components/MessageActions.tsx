/**
 * Message Actions Menu
 * Provides edit, regenerate, copy, pin, and reaction options (ChatGPT/Claude style)
 */

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import { Button } from '@shared/ui/button';
import {
  MoreVertical,
  Copy,
  Edit,
  RotateCw,
  Pin,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Code,
  Check,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface MessageActionsProps {
  messageId: string;
  content: string;
  isUser: boolean;
  isPinned?: boolean;
  reactions?: Array<{ type: string; userId: string }>;
  onEdit?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onReact?: (
    messageId: string,
    reactionType: 'up' | 'down' | 'helpful'
  ) => void;
  className?: string;
}

export function MessageActions({
  messageId,
  content,
  isUser,
  isPinned,
  reactions = [],
  onEdit,
  onRegenerate,
  onDelete,
  onPin,
  onReact,
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = async () => {
    // Extract code blocks from content
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = content.match(codeBlockRegex);
    if (codeBlocks) {
      const code = codeBlocks
        .map((block) => block.replace(/```[a-z]*\n?/g, '').replace(/```$/g, ''))
        .join('\n\n');
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasUpvote = reactions.some((r) => r.type === 'up');
  const hasDownvote = reactions.some((r) => r.type === 'down');
  const hasHelpful = reactions.some((r) => r.type === 'helpful');

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Quick Actions (Always Visible) */}
      <div className="flex items-center gap-1">
        {/* Copy Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 w-7 p-0"
          title="Copy message"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Reaction Buttons (for assistant messages) */}
        {!isUser && onReact && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReact(messageId, 'up')}
              className={cn(
                'h-7 w-7 p-0',
                hasUpvote && 'bg-green-100 text-green-600 dark:bg-green-900/20'
              )}
              title="Good response"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReact(messageId, 'down')}
              className={cn(
                'h-7 w-7 p-0',
                hasDownvote && 'bg-red-100 text-red-600 dark:bg-red-900/20'
              )}
              title="Bad response"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      {/* More Actions Menu */}
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="More actions"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          {/* Edit (user messages only) */}
          {isUser && onEdit && (
            <>
              <DropdownMenuItem
                onClick={() => {
                  onEdit(messageId);
                  setDropdownOpen(false);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit message
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Regenerate (assistant messages only) */}
          {!isUser && onRegenerate && (
            <DropdownMenuItem
              onClick={() => {
                onRegenerate(messageId);
                setDropdownOpen(false);
              }}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Regenerate response
            </DropdownMenuItem>
          )}

          {/* Copy variations */}
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy text
          </DropdownMenuItem>

          {content.includes('```') && (
            <DropdownMenuItem onClick={handleCopyCode}>
              <Code className="mr-2 h-4 w-4" />
              Copy code only
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Pin */}
          {onPin && (
            <DropdownMenuItem
              onClick={() => {
                onPin(messageId);
                setDropdownOpen(false);
              }}
            >
              <Pin
                className={cn(
                  'mr-2 h-4 w-4',
                  isPinned && 'fill-current text-primary'
                )}
              />
              {isPinned ? 'Unpin message' : 'Pin message'}
            </DropdownMenuItem>
          )}

          {/* Mark as helpful (assistant messages only) */}
          {!isUser && onReact && (
            <DropdownMenuItem
              onClick={() => {
                onReact(messageId, 'helpful');
                setDropdownOpen(false);
              }}
              className={cn(hasHelpful && 'bg-blue-50 dark:bg-blue-900/20')}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              Mark as helpful
            </DropdownMenuItem>
          )}

          {/* Delete */}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('Delete this message?')) {
                    onDelete(messageId);
                  }
                  setDropdownOpen(false);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete message
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
