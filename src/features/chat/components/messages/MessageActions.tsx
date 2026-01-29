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
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shared/ui/tooltip';
import { Button } from '@shared/ui/button';
import {
  MoreVertical,
  Copy,
  Edit,
  RotateCw,
  Pin,
  Trash2,
  Code,
  Check,
  SmilePlus,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  useReactions,
  REACTION_EMOJIS,
  type ReactionSummary,
} from '../../hooks/use-message-reactions';

interface MessageActionsProps {
  messageId: string;
  content: string;
  isUser: boolean;
  isPinned?: boolean;
  onEdit?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  className?: string;
}

/**
 * Reaction button with count and tooltip showing users who reacted
 */
function ReactionBadge({
  reaction,
  onToggle,
  disabled,
}: {
  reaction: ReactionSummary;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            disabled={disabled}
            className={cn(
              'h-6 px-1.5 py-0 text-xs gap-1 rounded-full',
              reaction.userReacted
                ? 'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20'
                : 'bg-muted/50 hover:bg-muted'
            )}
          >
            <span>{reaction.emoji}</span>
            <span className="font-medium">{reaction.count}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs">
            {reaction.userReacted ? 'You' : ''}
            {reaction.userReacted && reaction.count > 1 ? ' and ' : ''}
            {reaction.count > 1
              ? `${reaction.count - (reaction.userReacted ? 1 : 0)} other${reaction.count > 2 || (!reaction.userReacted && reaction.count > 1) ? 's' : ''}`
              : !reaction.userReacted
                ? '1 person'
                : ''}
            {' reacted with '}
            {reaction.emoji}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Reaction picker popover
 */
function ReactionPicker({
  onSelect,
  disabled,
}: {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title="Add reaction"
          disabled={disabled}
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        align="start"
        side="top"
        sideOffset={8}
      >
        <div className="flex gap-1">
          {REACTION_EMOJIS.map(({ emoji, label }) => (
            <TooltipProvider key={emoji} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-muted hover:scale-110 transition-transform"
                    onClick={() => {
                      onSelect(emoji);
                      setOpen(false);
                    }}
                  >
                    {emoji}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Display existing reactions with counts
 */
function ReactionsDisplay({
  reactions,
  onToggle,
  isToggling,
}: {
  reactions: ReactionSummary[];
  onToggle: (emoji: string) => void;
  isToggling: boolean;
}) {
  if (reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => (
        <ReactionBadge
          key={reaction.emoji}
          reaction={reaction}
          onToggle={() => onToggle(reaction.emoji)}
          disabled={isToggling}
        />
      ))}
    </div>
  );
}

export function MessageActions({
  messageId,
  content,
  isUser,
  isPinned,
  onEdit,
  onRegenerate,
  onDelete,
  onPin,
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Use the reactions hook
  const { reactions, toggle, isToggling } = useReactions(messageId);

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

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Main actions row */}
      <div className="flex items-center gap-1">
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

          {/* Reaction Picker */}
          <ReactionPicker onSelect={toggle} disabled={isToggling} />
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

            {/* Delete */}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setShowDeleteDialog(true);
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

      {/* Reactions display */}
      <ReactionsDisplay
        reactions={reactions}
        onToggle={toggle}
        isToggling={isToggling}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              message from the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(messageId);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
