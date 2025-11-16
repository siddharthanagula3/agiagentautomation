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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Terminal</h3>
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
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Clear
        </Button>
      </div>

      {/* Terminal Output */}
      <ScrollArea className="flex-1">
        <div
          ref={scrollRef}
          className="p-4 font-mono text-sm space-y-4 bg-gray-950 text-gray-100"
        >
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center py-12">
              <div>
                <TerminalIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  No commands executed yet
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Command output will appear here as agents work
                </p>
              </div>
            </div>
          ) : (
            history.map((cmd) => (
              <div
                key={cmd.id}
                className="group border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors"
              >
                {/* Command Header */}
                <div className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-800">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {cmd.status === 'running' && (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                    )}
                    {cmd.status === 'completed' && cmd.exitCode === 0 && (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    )}
                    {cmd.status === 'failed' && (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="text-blue-400 truncate">$ {cmd.command}</span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {cmd.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(cmd.output, cmd.id)}
                    className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copied === cmd.id ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>

                {/* Output */}
                <div className="p-3 bg-black/40">
                  <pre className="whitespace-pre-wrap text-xs text-gray-300 leading-relaxed">
                    {cmd.output}
                  </pre>
                  {cmd.status === 'completed' && cmd.exitCode !== undefined && (
                    <div className="mt-2 pt-2 border-t border-gray-800">
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
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-muted/30">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="text-lg font-bold text-green-600">{successCount}</div>
            <div className="text-muted-foreground">Success</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{runningCount}</div>
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
