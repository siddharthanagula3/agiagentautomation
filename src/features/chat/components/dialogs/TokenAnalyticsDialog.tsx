/**
 * TokenAnalyticsDialog - Modal wrapper for Token Analytics Dashboard
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { TokenAnalyticsDashboard } from '../tokens/TokenAnalyticsDashboard';

interface TokenAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TokenAnalyticsDialog({
  open,
  onOpenChange,
}: TokenAnalyticsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl p-0">
        <DialogHeader className="px-6 pb-0 pt-6">
          <DialogTitle className="sr-only">Token Usage Analytics</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          <TokenAnalyticsDashboard />
        </div>
      </DialogContent>
    </Dialog>
  );
}
