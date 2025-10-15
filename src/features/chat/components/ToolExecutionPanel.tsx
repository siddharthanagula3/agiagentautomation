/**
 * Tool Execution Panel Component
 * Shows real-time tool execution status and logs
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { ScrollArea } from '@shared/ui/scroll-area';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type {
  ToolExecutionResult,
  ExecutionLog,
} from '@_core/api/tool-executor-service';

interface ToolExecutionPanelProps {
  execution: ToolExecutionResult;
  toolName: string;
  className?: string;
}

export const ToolExecutionPanel: React.FC<ToolExecutionPanelProps> = ({
  execution,
  toolName,
  className,
}) => {
  const getStatusIcon = () => {
    if (execution.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (execution.success)
      return 'bg-green-500/10 text-green-500 border-green-500/30';
    return 'bg-red-500/10 text-red-500 border-red-500/30';
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getLogIcon = (level: ExecutionLog['level']) => {
    switch (level) {
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'debug':
        return <Zap className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className={cn('border-2', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-base">{toolName}</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-xs', getStatusColor())}
                >
                  {execution.success ? 'Success' : 'Failed'}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatExecutionTime(execution.executionTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Output */}
        {execution.success && execution.output && (
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold">Output:</h4>
            <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
              {typeof execution.output === 'string'
                ? execution.output
                : JSON.stringify(execution.output, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {!execution.success && execution.error && (
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-red-500">Error:</h4>
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">
              {execution.error}
            </div>
          </div>
        )}

        {/* Execution Logs */}
        {execution.logs && execution.logs.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Execution Logs:</h4>
            <ScrollArea className="h-[200px] rounded-lg border bg-muted/50">
              <div className="space-y-2 p-3">
                {execution.logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 font-mono text-xs"
                  >
                    <span className="flex-shrink-0 text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    {getLogIcon(log.level)}
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Tool Execution List Component
 * Shows multiple tool executions
 */

interface ToolExecutionListProps {
  executions: Array<{
    id: string;
    toolName: string;
    result: ToolExecutionResult;
  }>;
  className?: string;
}

export const ToolExecutionList: React.FC<ToolExecutionListProps> = ({
  executions,
  className,
}) => {
  if (executions.length === 0) {
    return (
      <div className={cn('py-8 text-center', className)}>
        <Zap className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No tool executions yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {executions.map((execution) => (
        <ToolExecutionPanel
          key={execution.id}
          toolName={execution.toolName}
          execution={execution.result}
        />
      ))}
    </div>
  );
};

/**
 * Streaming Tool Execution Component
 * Shows tool execution in progress
 */

interface StreamingToolExecutionProps {
  toolName: string;
  progress?: number;
  currentStep?: string;
  className?: string;
}

export const StreamingToolExecution: React.FC<StreamingToolExecutionProps> = ({
  toolName,
  progress,
  currentStep,
  className,
}) => {
  return (
    <Card className={cn('border-2 border-blue-500/30', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-blue-500" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{toolName}</div>
            {currentStep && (
              <div className="mt-1 text-xs text-muted-foreground">
                {currentStep}
              </div>
            )}
            {progress !== undefined && (
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {progress.toFixed(0)}% complete
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
