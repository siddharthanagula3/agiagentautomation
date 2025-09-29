/**
 * Tool Execution Panel Component
 * Shows real-time tool execution status and logs
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolExecutionResult, ExecutionLog } from '@/services/tool-executor-service';

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
    if (execution.success) return 'bg-green-500/10 text-green-500 border-green-500/30';
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
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn('text-xs', getStatusColor())}>
                  {execution.success ? 'Success' : 'Failed'}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
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
            <h4 className="text-sm font-semibold mb-2">Output:</h4>
            <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto">
              {typeof execution.output === 'string'
                ? execution.output
                : JSON.stringify(execution.output, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {!execution.success && execution.error && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2 text-red-500">Error:</h4>
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm">
              {execution.error}
            </div>
          </div>
        )}

        {/* Execution Logs */}
        {execution.logs && execution.logs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Execution Logs:</h4>
            <ScrollArea className="h-[200px] rounded-lg border bg-muted/50">
              <div className="p-3 space-y-2">
                {execution.logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs font-mono"
                  >
                    <span className="text-muted-foreground flex-shrink-0">
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
      <div className={cn('text-center py-8', className)}>
        <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
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
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{toolName}</div>
            {currentStep && (
              <div className="text-xs text-muted-foreground mt-1">{currentStep}</div>
            )}
            {progress !== undefined && (
              <div className="mt-2">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
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
