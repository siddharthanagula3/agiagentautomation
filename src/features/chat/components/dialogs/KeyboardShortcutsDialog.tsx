/**
 * Keyboard Shortcuts Dialog
 * Displays all available keyboard shortcuts in a modal
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@shared/ui/dialog';
import { Badge } from '@shared/ui/badge';
import { Separator } from '@shared/ui/separator';
import { Keyboard } from 'lucide-react';
import type { KeyboardShortcut } from '../hooks/use-keyboard-shortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys: string[] = [];

    if (shortcut.ctrl || shortcut.meta) {
      keys.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.shift) {
      keys.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.alt) {
      keys.push(isMac ? '⌥' : 'Alt');
    }
    keys.push(shortcut.key);

    return keys;
  };

  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    conversation: 'Conversations',
    message: 'Messages',
    ui: 'User Interface',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(
            ([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {categoryLabels[category] || category}
                </h3>

                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <span className="text-sm text-foreground">
                        {shortcut.description}
                      </span>

                      <div className="flex items-center gap-1">
                        {formatShortcut(shortcut).map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <Badge
                              variant="outline"
                              className="min-w-[32px] justify-center font-mono text-xs"
                            >
                              {key}
                            </Badge>
                            {keyIndex < formatShortcut(shortcut).length - 1 && (
                              <span className="text-xs text-muted-foreground">
                                +
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {Object.keys(groupedShortcuts).indexOf(category) <
                  Object.keys(groupedShortcuts).length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            )
          )}
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p>
            <strong>Tip:</strong> Press{' '}
            <Badge variant="outline" className="font-mono">
              {isMac ? '⌘' : 'Ctrl'}
            </Badge>{' '}
            +{' '}
            <Badge variant="outline" className="font-mono">
              /
            </Badge>{' '}
            anytime to view these shortcuts
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
