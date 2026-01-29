/**
 * BranchNavigator - Conversation branch tree visualization and navigation
 *
 * Features:
 * - Visual branch tree display
 * - Navigate between branches
 * - Show branch point indicators
 * - Create and name branches
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shared/ui/tooltip';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { ScrollArea } from '@shared/ui/scroll-area';
import {
  GitBranch,
  GitFork,
  ChevronRight,
  Pencil,
  Trash2,
  ExternalLink,
  History,
  FolderTree,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  conversationBranchingService,
  type ConversationBranchWithDetails,
  type BranchHistoryEntry,
} from '../services/conversation-branching';
import { toast } from 'sonner';

interface BranchNavigatorProps {
  sessionId: string;
  userId: string;
  onNavigateToBranch: (sessionId: string) => void;
  className?: string;
}

export function BranchNavigator({
  sessionId,
  userId,
  onNavigateToBranch,
  className,
}: BranchNavigatorProps) {
  const [branches, setBranches] = useState<ConversationBranchWithDetails[]>([]);
  const [branchHistory, setBranchHistory] = useState<BranchHistoryEntry[]>([]);
  const [isBranch, setIsBranch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBranch, setEditingBranch] = useState<ConversationBranchWithDetails | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Load branch data
  const loadBranchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [branchesResult, historyResult, isBranchResult] = await Promise.all([
        conversationBranchingService.getBranchesForSession(sessionId),
        conversationBranchingService.getBranchHistory(sessionId),
        conversationBranchingService.isBranchSession(sessionId),
      ]);

      setBranches(branchesResult);
      setBranchHistory(historyResult);
      setIsBranch(isBranchResult);
    } catch (error) {
      console.error('Failed to load branch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadBranchData();
  }, [loadBranchData]);

  // Handle branch name update
  const handleUpdateBranchName = async () => {
    if (!editingBranch || !newBranchName.trim()) return;

    try {
      await conversationBranchingService.updateBranchName(
        editingBranch.id,
        newBranchName.trim()
      );
      toast.success('Branch name updated');
      setEditingBranch(null);
      setNewBranchName('');
      loadBranchData();
    } catch (error) {
      toast.error('Failed to update branch name');
      console.error(error);
    }
  };

  // Handle branch deletion
  const handleDeleteBranch = async (branch: ConversationBranchWithDetails) => {
    try {
      await conversationBranchingService.deleteBranch(branch.id);
      toast.success('Branch removed');
      loadBranchData();
    } catch (error) {
      toast.error('Failed to remove branch');
      console.error(error);
    }
  };

  // Count total branches (including nested)
  const totalBranches = branches.length;
  const hasHistory = branchHistory.length > 1;

  // If no branches and not a branch itself, don't show
  if (!isLoading && totalBranches === 0 && !isBranch) {
    return null;
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 gap-1.5 text-xs',
                    (totalBranches > 0 || isBranch) && 'text-primary',
                    className
                  )}
                  aria-label={`${totalBranches} branches`}
                >
                  <GitBranch className="h-4 w-4" aria-hidden="true" />
                  {totalBranches > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {totalBranches}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              {totalBranches > 0
                ? `${totalBranches} branch${totalBranches > 1 ? 'es' : ''}`
                : isBranch
                  ? 'View branch history'
                  : 'No branches'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <PopoverContent className="w-80 p-0" align="start">
          <div className="border-b border-border p-3">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-medium">Conversation Branches</h3>
            </div>
            {isBranch && (
              <p className="mt-1 text-xs text-muted-foreground">
                This is a branched conversation
              </p>
            )}
          </div>

          <ScrollArea className="max-h-80">
            {/* Branch History (Ancestors) */}
            {hasHistory && (
              <div className="border-b border-border p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <History className="h-3 w-3" aria-hidden="true" />
                  Branch History
                </div>
                <div className="space-y-1">
                  {branchHistory
                    .slice()
                    .reverse()
                    .map((entry, index) => {
                      const isLast = index === branchHistory.length - 1;
                      const isCurrent = entry.sessionId === sessionId;

                      return (
                        <div
                          key={entry.sessionId}
                          className="flex items-center gap-2"
                        >
                          {/* Tree connector */}
                          <div className="flex w-4 flex-shrink-0 items-center justify-center">
                            {index > 0 && (
                              <div className="h-full w-px bg-border" />
                            )}
                          </div>
                          <ChevronRight
                            className={cn(
                              'h-3 w-3 flex-shrink-0',
                              isCurrent ? 'text-primary' : 'text-muted-foreground'
                            )}
                            aria-hidden="true"
                          />
                          <button
                            onClick={() => {
                              if (!isCurrent) {
                                onNavigateToBranch(entry.sessionId);
                                setIsPopoverOpen(false);
                              }
                            }}
                            disabled={isCurrent}
                            className={cn(
                              'truncate text-xs transition-colors',
                              isCurrent
                                ? 'cursor-default font-medium text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {entry.branchName || (isLast ? 'Root' : `Branch ${entry.depth}`)}
                            {isCurrent && ' (current)'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Direct Branches */}
            {branches.length > 0 && (
              <div className="p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <GitFork className="h-3 w-3" aria-hidden="true" />
                  Branches from this conversation
                </div>
                <div className="space-y-2">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="group flex items-start gap-2 rounded-lg border border-border bg-card p-2 transition-colors hover:bg-muted/50"
                    >
                      <GitBranch
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => {
                            onNavigateToBranch(branch.childSessionId);
                            setIsPopoverOpen(false);
                          }}
                          className="block truncate text-left text-sm font-medium text-foreground hover:text-primary"
                        >
                          {branch.branchName ||
                            branch.childSession?.title ||
                            'Untitled Branch'}
                        </button>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(branch.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBranch(branch);
                                  setNewBranchName(branch.branchName || '');
                                }}
                                aria-label="Rename branch"
                              >
                                <Pencil className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rename</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToBranch(branch.childSessionId);
                                  setIsPopoverOpen(false);
                                }}
                                aria-label="Open branch"
                              >
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Open</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBranch(branch);
                                }}
                                aria-label="Remove branch"
                              >
                                <Trash2 className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && branches.length === 0 && !hasHistory && (
              <div className="p-6 text-center">
                <GitFork className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No branches yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Branch from any message to explore alternate paths
                </p>
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Rename Dialog */}
      <Dialog
        open={editingBranch !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingBranch(null);
            setNewBranchName('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Branch</DialogTitle>
            <DialogDescription>
              Give this branch a descriptive name to help identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="branch-name">Branch Name</Label>
            <Input
              id="branch-name"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="e.g., Alternative approach"
              className="mt-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateBranchName();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingBranch(null);
                setNewBranchName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateBranchName} disabled={!newBranchName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Branch indicator badge to show on conversation list items
 */
interface BranchIndicatorProps {
  sessionId: string;
  compact?: boolean;
  className?: string;
}

export function BranchIndicator({
  sessionId,
  compact = false,
  className,
}: BranchIndicatorProps) {
  const [branchCount, setBranchCount] = useState(0);
  const [isBranch, setIsBranch] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [count, isBranchResult] = await Promise.all([
        conversationBranchingService.countBranches(sessionId),
        conversationBranchingService.isBranchSession(sessionId),
      ]);
      setBranchCount(count);
      setIsBranch(isBranchResult);
    };

    loadData();
  }, [sessionId]);

  if (branchCount === 0 && !isBranch) {
    return null;
  }

  if (compact) {
    return (
      <GitBranch
        className={cn('h-3 w-3 text-primary', className)}
        aria-label={`${branchCount} branches`}
      />
    );
  }

  return (
    <Badge
      variant="secondary"
      className={cn('h-5 gap-1 px-1.5 text-[10px]', className)}
    >
      <GitBranch className="h-3 w-3" aria-hidden="true" />
      {branchCount > 0 && branchCount}
      {isBranch && branchCount === 0 && 'branch'}
    </Badge>
  );
}

/**
 * Message branch indicator - shows when branches exist at a message
 */
interface MessageBranchIndicatorProps {
  messageId: string;
  onBranchClick?: (branches: ConversationBranchWithDetails[]) => void;
  className?: string;
}

export function MessageBranchIndicator({
  messageId,
  onBranchClick,
  className,
}: MessageBranchIndicatorProps) {
  const [branches, setBranches] = useState<ConversationBranchWithDetails[]>([]);

  useEffect(() => {
    const loadBranches = async () => {
      const result = await conversationBranchingService.getBranchesAtMessage(messageId);
      setBranches(result);
    };

    loadBranches();
  }, [messageId]);

  if (branches.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onBranchClick?.(branches)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary transition-colors hover:bg-primary/20',
              className
            )}
            aria-label={`${branches.length} branch${branches.length > 1 ? 'es' : ''} from this message`}
          >
            <GitFork className="h-3 w-3" aria-hidden="true" />
            {branches.length}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {branches.length} branch{branches.length > 1 ? 'es' : ''} from this message
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
