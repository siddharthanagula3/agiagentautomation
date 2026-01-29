/**
 * CreateBranchDialog - Dialog for creating a new conversation branch
 *
 * Features:
 * - Name the new branch
 * - Shows branch point info
 * - Creates branch and navigates to it
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { GitFork, Loader2 } from 'lucide-react';
import { conversationBranchingService } from '../../services/conversation-branching';
import { toast } from 'sonner';
import type { ChatSession } from '../../types';

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  messageId: string;
  messageIndex: number;
  userId: string;
  onBranchCreated: (newSession: ChatSession) => void;
}

export function CreateBranchDialog({
  open,
  onOpenChange,
  sessionId,
  messageId,
  messageIndex,
  userId,
  onBranchCreated,
}: CreateBranchDialogProps) {
  const [branchName, setBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const newSession = await conversationBranchingService.branchConversation(
        sessionId,
        messageId,
        userId,
        branchName.trim() || undefined
      );

      toast.success('Branch created successfully');
      onBranchCreated(newSession);
      onOpenChange(false);
      setBranchName('');
    } catch (error) {
      console.error('Failed to create branch:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create branch'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false);
      setBranchName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitFork className="h-5 w-5 text-primary" aria-hidden="true" />
            Create Branch
          </DialogTitle>
          <DialogDescription>
            Create a new conversation branch starting from message{' '}
            {messageIndex + 1}. You can continue the conversation in a different
            direction without affecting the original.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch Name (optional)</Label>
            <Input
              id="branch-name"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g., Alternative approach, Exploring option B..."
              disabled={isCreating}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  handleCreate();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Give your branch a descriptive name to help identify it later
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>What happens next:</strong>
            </p>
            <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
              <li>A new conversation will be created</li>
              <li>Messages up to and including message {messageIndex + 1} will be copied</li>
              <li>You can continue the conversation from that point</li>
              <li>The original conversation remains unchanged</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Creating...
              </>
            ) : (
              <>
                <GitFork className="mr-2 h-4 w-4" aria-hidden="true" />
                Create Branch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
