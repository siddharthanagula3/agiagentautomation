/**
 * TerminalView - Command execution history and output
 * Shows commands run by agents with color-coded output
 */

import React, { useRef, useEffect, useState } from 'react';
import { useVibeViewStore } from '../../stores/vibe-view-store';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

export function TerminalView() {
  const { terminalState, clearTerminalHistory } = useVibeViewStore();
  const [copied, setCopied] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const history = terminalState.history;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const successCount = history.filter(
    (c) => c.status === 'completed' && c.exitCode === 0
  ).length;
  const runningCount = history.filter((c) => c.status === 'running').length;
  const failedCount = history.filter((c) => c.status === 'failed').length;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Terminal</h3>
          <Badge variant="secondary" className="text-xs">
            {history.length} commands
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearTerminalHistory}
          disabled={history.length === 0}
          className="h-8"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      {/* Terminal Output */}
      <ScrollArea className="flex-1">
        <div
          ref={scrollRef}
          className="space-y-4 bg-gray-950 p-4 font-mono text-sm text-gray-100"
        >
          {history.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12 text-center">
              <div>
                <TerminalIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
                <p className="text-sm text-gray-400">
                  No commands executed yet
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Command output will appear here as agents work
                </p>
              </div>
            </div>
          ) : (
            history.map((cmd) => (
              <div
                key={cmd.id}
                className="group overflow-hidden rounded-lg border border-gray-800 transition-colors hover:border-gray-700"
              >
                {/* Command Header */}
                <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 p-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {cmd.status === 'running' && (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-400" />
                    )}
                    {cmd.status === 'completed' && cmd.exitCode === 0 && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                    )}
                    {cmd.status === 'failed' && (
                      <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                    )}
                    <span className="truncate text-blue-400">
                      $ {cmd.command}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {cmd.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(cmd.output, cmd.id)}
                    className="h-7 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {copied === cmd.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                {/* Output */}
                <div className="bg-black/40 p-3">
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300">
                    {cmd.output}
                  </pre>
                  {cmd.status === 'completed' && cmd.exitCode !== undefined && (
                    <div className="mt-2 border-t border-gray-800 pt-2">
                      <span
                        className={cn(
                          'text-xs',
                          cmd.exitCode === 0 ? 'text-green-400' : 'text-red-400'
                        )}
                      >
                        Exit code: {cmd.exitCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 bg-muted/30 p-3 dark:border-gray-800">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="text-lg font-bold text-green-600">
              {successCount}
            </div>
            <div className="text-muted-foreground">Success</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {runningCount}
            </div>
            <div className="text-muted-foreground">Running</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{failedCount}</div>
            <div className="text-muted-foreground">Failed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
