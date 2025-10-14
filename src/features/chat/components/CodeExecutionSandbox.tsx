import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import {
  Play,
  Square,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Terminal,
  Code,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  Cpu,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';

export interface CodeExecutionResult {
  id: string;
  code: string;
  language: 'python' | 'javascript' | 'typescript' | 'bash';
  status: 'running' | 'success' | 'error' | 'cancelled';
  output?: string;
  error?: string;
  logs?: string[];
  executionTime?: number;
  memoryUsage?: number;
  timestamp: Date;
}

interface CodeExecutionSandboxProps {
  execution: CodeExecutionResult;
  onRerun?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const CodeExecutionSandbox: React.FC<CodeExecutionSandboxProps> = ({
  execution,
  onRerun,
  onCancel,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  type TabKey = 'output' | 'logs' | 'code';
  const [activeTab, setActiveTab] = useState<TabKey>('output');

  const handleTabChange = (value: string) => {
    if (value === 'output' || value === 'logs' || value === 'code') {
      setActiveTab(value);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(execution.code);
    toast.success('Code copied to clipboard');
  };

  const handleDownload = () => {
    const ext =
      execution.language === 'python'
        ? 'py'
        : execution.language === 'bash'
          ? 'sh'
          : 'js';
    const blob = new Blob([execution.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_${execution.id}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded');
  };

  const getStatusIcon = () => {
    switch (execution.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (execution.status) {
      case 'running':
        return 'bg-blue-500/10 border-blue-500/50 text-blue-500';
      case 'success':
        return 'bg-green-500/10 border-green-500/50 text-green-500';
      case 'error':
        return 'bg-red-500/10 border-red-500/50 text-red-500';
      case 'cancelled':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('my-3', className)}
    >
      <Card
        className={cn(
          'overflow-hidden border-2 transition-all',
          getStatusColor()
        )}
      >
        {/* Header */}
        <div className="border-b border-border/50 bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">Code Execution</h4>
                  <Badge variant="outline" className="text-xs">
                    {execution.language}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getStatusIcon()}
                    <span className="text-xs font-medium capitalize">
                      {execution.status}
                    </span>
                  </div>
                </div>
                {(execution.executionTime !== undefined ||
                  execution.memoryUsage !== undefined) && (
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    {execution.executionTime !== undefined && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {execution.executionTime.toFixed(2)}ms
                      </div>
                    )}
                    {execution.memoryUsage !== undefined && (
                      <div className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {(execution.memoryUsage / 1024 / 1024).toFixed(2)}MB
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {execution.status === 'running' && onCancel && (
                <Button variant="destructive" size="sm" onClick={onCancel}>
                  <Square className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              )}
              {execution.status !== 'running' && onRerun && (
                <Button variant="outline" size="sm" onClick={onRerun}>
                  <Play className="mr-1 h-3 w-3" />
                  Rerun
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            'transition-all duration-300',
            isExpanded ? 'max-h-[600px]' : 'max-h-[300px]'
          )}
        >
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="output" className="flex-1">
                <FileText className="mr-1 h-3 w-3" />
                Output
              </TabsTrigger>
              <TabsTrigger value="code" className="flex-1">
                <Code className="mr-1 h-3 w-3" />
                Code
              </TabsTrigger>
              {execution.logs && execution.logs.length > 0 && (
                <TabsTrigger value="logs" className="flex-1">
                  <Terminal className="mr-1 h-3 w-3" />
                  Logs ({execution.logs.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="output" className="m-0 p-0">
              <div className="max-h-[500px] overflow-y-auto p-4">
                {execution.status === 'running' && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Executing code...</span>
                  </div>
                )}
                {execution.status === 'success' && execution.output && (
                  <pre className="whitespace-pre-wrap rounded-lg border bg-background/50 p-3 font-mono text-sm">
                    {execution.output}
                  </pre>
                )}
                {execution.status === 'error' && execution.error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                      <pre className="flex-1 whitespace-pre-wrap font-mono text-sm text-red-500">
                        {execution.error}
                      </pre>
                    </div>
                  </div>
                )}
                {execution.status === 'cancelled' && (
                  <div className="text-sm text-muted-foreground">
                    Execution was cancelled
                  </div>
                )}
                {!execution.output &&
                  !execution.error &&
                  execution.status === 'success' && (
                    <div className="text-sm italic text-muted-foreground">
                      No output
                    </div>
                  )}
              </div>
            </TabsContent>

            <TabsContent value="code" className="m-0 p-0">
              <div className="max-h-[500px] overflow-y-auto p-4">
                <pre className="whitespace-pre-wrap rounded-lg border bg-background/50 p-3 font-mono text-sm">
                  <code>{execution.code}</code>
                </pre>
              </div>
            </TabsContent>

            {execution.logs && execution.logs.length > 0 && (
              <TabsContent value="logs" className="m-0 p-0">
                <div className="max-h-[500px] space-y-1 overflow-y-auto p-4">
                  {execution.logs.map((log, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded border bg-background/50 p-2 font-mono text-sm text-muted-foreground"
                    >
                      <span className="mr-2 text-xs text-muted-foreground/70">
                        [{idx + 1}]
                      </span>
                      {log}
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Card>
    </motion.div>
  );
};

export default CodeExecutionSandbox;
