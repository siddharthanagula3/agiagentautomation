import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Terminal,
  Code,
  Database,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessStep {
  id: string;
  description: string;
  type: 'thinking' | 'writing' | 'executing' | 'reading' | 'analyzing';
  details?: string;
  timestamp: Date;
  status: 'pending' | 'active' | 'completed' | 'error';
  filePath?: string;
  command?: string;
  output?: string;
}

interface WorkingProcess {
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  employeeColor?: string;
  steps: ProcessStep[];
  currentStep: number;
  status: 'idle' | 'working' | 'completed' | 'error';
  totalSteps: number;
}

interface WorkingProcessProps {
  process: WorkingProcess;
}

export function WorkingProcess({ process }: WorkingProcessProps) {
  const [isOpen, setIsOpen] = useState(true);

  const getStepIcon = (type: ProcessStep['type']) => {
    switch (type) {
      case 'writing':
        return <FileText className="h-4 w-4" />;
      case 'executing':
        return <Terminal className="h-4 w-4" />;
      case 'analyzing':
        return <Code className="h-4 w-4" />;
      case 'reading':
        return <Database className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStepColor = (status: ProcessStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'active':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusIcon = (status: ProcessStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <Clock className="h-4 w-4 animate-spin text-blue-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={process.employeeAvatar} />
              <AvatarFallback
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: process.employeeColor || '#6366f1' }}
              >
                {process.employeeName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {process.employeeName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {process.status === 'working'
                  ? 'Working...'
                  : process.status === 'completed'
                    ? 'Completed'
                    : process.status === 'error'
                      ? 'Error'
                      : 'Idle'}
              </div>
            </div>
          </div>

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 dark:text-gray-400"
              >
                <span className="mr-2 text-sm font-medium">
                  Processed {process.currentStep} step
                  {process.currentStep !== 1 ? 's' : ''}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* Steps */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="space-y-3 p-4">
            {process.steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-start space-x-3 rounded-lg p-3 transition-colors',
                  getStepColor(step.status)
                )}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center space-x-2">
                    {getStepIcon(step.type)}
                    <span className="text-sm font-medium">
                      {step.description}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {step.type}
                    </Badge>
                  </div>

                  {step.filePath && (
                    <div className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                      <FileText className="mr-1 inline h-3 w-3" />
                      {step.filePath}
                    </div>
                  )}

                  {step.command && (
                    <div className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                      <Terminal className="mr-1 inline h-3 w-3" />
                      {step.command}
                    </div>
                  )}

                  {step.details && (
                    <div className="mt-2 rounded bg-gray-100 p-2 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {step.details}
                    </div>
                  )}

                  {step.output && (
                    <div className="mt-2 rounded bg-gray-900 p-2 font-mono text-xs text-gray-700 text-green-400 dark:bg-gray-900 dark:text-gray-300">
                      <Terminal className="mr-1 inline h-3 w-3" />
                      {step.output}
                    </div>
                  )}

                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {step.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
