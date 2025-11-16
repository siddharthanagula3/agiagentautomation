/**
 * WorkingProcessSection - MGX-style expandable working process display
 * Shows step-by-step what the agent is doing with action buttons
 */

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import {
  ChevronDown,
  Sparkles,
  FileText,
  Terminal,
  Code,
  Play,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

export interface WorkingStep {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  action?: {
    type: 'file' | 'command' | 'code' | 'tool';
    label: string;
    onClick: () => void;
    metadata?: Record<string, any>;
  };
  timestamp?: Date;
  result?: string;
}

interface WorkingProcessSectionProps {
  steps: WorkingStep[];
  className?: string;
  defaultOpen?: boolean;
}

const statusIcons = {
  pending: <div className="w-2 h-2 rounded-full bg-gray-300" />,
  in_progress: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  completed: <Check className="w-4 h-4 text-green-500" />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,
};

const actionIcons = {
  file: FileText,
  command: Terminal,
  code: Code,
  tool: Play,
};

export function WorkingProcessSection({
  steps,
  className,
  defaultOpen = true,
}: WorkingProcessSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (steps.length === 0) {
    return null;
  }

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalCount = steps.length;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('border-b border-gray-200 dark:border-gray-800', className)}
    >
      <div className="p-4 bg-background">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left group">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Working Process</span>
              {totalCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {completedCount}/{totalCount}
                </Badge>
              )}
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>

        {/* Steps */}
        <CollapsibleContent className="mt-4">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3 group">
                {/* Status Indicator */}
                <div className="flex flex-col items-center gap-1 pt-1.5">
                  {statusIcons[step.status]}
                  {index < steps.length - 1 && (
                    <div className="w-px h-full min-h-[20px] bg-gray-200 dark:bg-gray-800" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0 pb-3">
                  <p
                    className={cn(
                      'text-sm',
                      step.status === 'completed'
                        ? 'text-muted-foreground'
                        : 'text-foreground'
                    )}
                  >
                    {step.description}
                  </p>

                  {/* Action Button */}
                  {step.action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 mt-1.5 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={step.action.onClick}
                    >
                      {React.createElement(
                        actionIcons[step.action.type],
                        { className: 'w-3.5 h-3.5' }
                      )}
                      {step.action.label}
                    </Button>
                  )}

                  {/* Result */}
                  {step.result && step.status === 'completed' && (
                    <div className="mt-1.5 p-2 bg-muted/50 rounded text-xs text-muted-foreground font-mono">
                      {step.result}
                    </div>
                  )}

                  {/* Timestamp */}
                  {step.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.timestamp.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
