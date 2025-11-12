/**
 * Workflow Display Component
 * Visual representation of MetaGPT-style multi-agent workflows
 * Shows agent collaboration with artifacts, dependencies, and progress
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Progress } from '@shared/ui/progress';
import {  Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  FileText,
  Code,
  TestTube,
  Rocket,
  Palette,
  FileCode,
  ChevronDown,
  ChevronRight,
  Download,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  Workflow,
  WorkflowStep,
  Artifact,
  ArtifactType,
} from '@core/ai/orchestration/workflow-orchestration';

interface WorkflowDisplayProps {
  workflow: Workflow;
  onStepClick?: (step: WorkflowStep) => void;
  onArtifactClick?: (artifact: Artifact) => void;
  className?: string;
}

const ArtifactIcons: Record<ArtifactType, React.ComponentType<{ className?: string }>> = {
  prd: FileText,
  architecture: Code,
  design: Palette,
  code: FileCode,
  tests: TestTube,
  documentation: FileText,
  deployment: Rocket,
  report: FileText,
};

const StepStatusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  failed: AlertCircle,
  skipped: Circle,
};

export const WorkflowDisplay: React.FC<WorkflowDisplayProps> = ({
  workflow,
  onStepClick,
  onArtifactClick,
  className,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'skipped':
        return 'text-gray-400 dark:text-gray-600';
      default:
        return 'text-gray-400 dark:text-gray-500';
    }
  };

  const getWorkflowStatusColor = (status: Workflow['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  const progress = (() => {
    const completed = workflow.steps.filter(
      s => s.status === 'completed' || s.status === 'skipped'
    ).length;
    const total = workflow.steps.length;
    return total > 0 ? (completed / total) * 100 : 0;
  })();

  return (
    <Card className={cn('border-border bg-card', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{workflow.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {workflow.description}
              </p>
            </div>
          </div>
          <Badge className={getWorkflowStatusColor(workflow.status)}>
            {workflow.status}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {workflow.steps.filter(s => s.status === 'completed').length} of{' '}
              {workflow.steps.length} steps completed
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Timeline */}
        {workflow.startedAt && (
          <div className="mt-3 flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Started: {workflow.startedAt.toLocaleTimeString()}</span>
            {workflow.completedAt && (
              <span>
                Completed: {workflow.completedAt.toLocaleTimeString()} (
                {Math.round(
                  (workflow.completedAt.getTime() - workflow.startedAt.getTime()) /
                    1000
                )}
                s)
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {workflow.steps.map((step, index) => {
            const isExpanded = expandedSteps.has(step.id);
            const StatusIcon = StepStatusIcons[step.status];
            const stepArtifacts = workflow.artifacts.filter(a =>
              step.output?.some(o => o.id === a.id)
            );

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    'border transition-all cursor-pointer',
                    step.status === 'in_progress' &&
                      'border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/10',
                    step.status === 'completed' &&
                      'border-green-500/30 bg-green-50/30 dark:bg-green-900/10',
                    step.status === 'failed' && 'border-red-500/50',
                    isExpanded && 'ring-2 ring-primary/20'
                  )}
                  onClick={() => toggleStep(step.id)}
                >
                  <CardContent className="p-4">
                    {/* Step Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex items-center space-x-2">
                          <StatusIcon
                            className={cn(
                              'h-5 w-5',
                              getStepStatusColor(step.status),
                              step.status === 'in_progress' && 'animate-pulse'
                            )}
                          />
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold">{step.description}</h4>
                            <Badge variant="outline" className="text-xs">
                              {step.role.replace('_', ' ')}
                            </Badge>
                          </div>

                          {/* Agent Info */}
                          {step.agentId && (
                            <div className="flex items-center space-x-2 mt-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs text-white">
                                  AI
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">
                                {step.agentId}
                              </span>
                            </div>
                          )}

                          {/* Dependencies */}
                          {step.dependencies.length > 0 && !isExpanded && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Depends on: {step.dependencies.length} step(s)
                            </div>
                          )}

                          {/* Artifacts */}
                          {stepArtifacts.length > 0 && !isExpanded && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {stepArtifacts.map(artifact => {
                                const ArtifactIcon = ArtifactIcons[artifact.type];
                                return (
                                  <Badge
                                    key={artifact.id}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <ArtifactIcon className="mr-1 h-3 w-3" />
                                    {artifact.type}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(step.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 space-y-4"
                        >
                          {/* Dependencies */}
                          {step.dependencies.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2">
                                Dependencies
                              </h5>
                              <div className="space-y-1">
                                {step.dependencies.map(depId => {
                                  const depStep = workflow.steps.find(
                                    s => s.id === depId
                                  );
                                  return (
                                    <div
                                      key={depId}
                                      className="text-sm text-muted-foreground flex items-center space-x-2"
                                    >
                                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                                      <span>{depStep?.description || depId}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Artifacts */}
                          {stepArtifacts.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2">
                                Artifacts
                              </h5>
                              <div className="space-y-2">
                                {stepArtifacts.map(artifact => {
                                  const ArtifactIcon = ArtifactIcons[artifact.type];
                                  return (
                                    <Card
                                      key={artifact.id}
                                      className="border-border/50 bg-muted/30"
                                    >
                                      <CardContent className="p-3">
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-start space-x-2">
                                            <ArtifactIcon className="h-4 w-4 mt-0.5 text-primary" />
                                            <div>
                                              <div className="font-medium text-sm">
                                                {artifact.title}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {artifact.type} • v
                                                {artifact.metadata.version} •{' '}
                                                {artifact.metadata.status}
                                              </div>
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onArtifactClick?.(artifact);
                                            }}
                                          >
                                            <Download className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Timing */}
                          {step.startTime && (
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>
                                Started: {step.startTime.toLocaleTimeString()}
                              </div>
                              {step.endTime && (
                                <div>
                                  Completed: {step.endTime.toLocaleTimeString()} (
                                  {Math.round(
                                    (step.endTime.getTime() -
                                      step.startTime.getTime()) /
                                      1000
                                  )}
                                  s)
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Artifacts Summary */}
        {workflow.artifacts.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3">All Artifacts ({workflow.artifacts.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {workflow.artifacts.map(artifact => {
                const ArtifactIcon = ArtifactIcons[artifact.type];
                return (
                  <Card
                    key={artifact.id}
                    className="border-border/50 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onArtifactClick?.(artifact)}
                  >
                    <CardContent className="p-3 text-center">
                      <ArtifactIcon className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-xs font-medium">{artifact.type}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        v{artifact.metadata.version}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowDisplay;
