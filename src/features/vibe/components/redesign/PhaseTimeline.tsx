/**
 * PhaseTimeline - Visual progress indicator inspired by Cloudflare VibeSDK
 *
 * Displays the 7-phase development workflow:
 * 1. Describe → 2. Analyze → 3. Blueprint → 4. Implement → 5. Preview → 6. Iterate → 7. Deploy
 *
 * Features:
 * - Animated progress indicators
 * - Current phase highlighting
 * - File generation counter
 * - Time elapsed tracking
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@shared/lib/utils';
import {
  MessageSquare,
  Brain,
  FileCode,
  Code2,
  Eye,
  RefreshCw,
  Rocket,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@shared/ui/badge';
import { Progress } from '@shared/ui/progress';
import type {
  VibeSession,
  PhaseStatus,
} from '../../services/vibe-phase-orchestrator';

interface PhaseTimelineProps {
  session: VibeSession | null;
  className?: string;
  compact?: boolean;
}

interface PhaseDefinition {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  statusMatch: PhaseStatus[];
}

const phases: PhaseDefinition[] = [
  {
    id: 'describe',
    name: 'Describe',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Describe your app',
    statusMatch: ['idle', 'planning'],
  },
  {
    id: 'analyze',
    name: 'Analyze',
    icon: <Brain className="h-4 w-4" />,
    description: 'AI analyzes requirements',
    statusMatch: ['planning'],
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Generate architecture',
    statusMatch: ['generating_blueprint', 'blueprint_ready'],
  },
  {
    id: 'implement',
    name: 'Implement',
    icon: <Code2 className="h-4 w-4" />,
    description: 'Generate code',
    statusMatch: ['implementing', 'implemented'],
  },
  {
    id: 'preview',
    name: 'Preview',
    icon: <Eye className="h-4 w-4" />,
    description: 'Live preview',
    statusMatch: ['validating', 'validated'],
  },
  {
    id: 'iterate',
    name: 'Iterate',
    icon: <RefreshCw className="h-4 w-4" />,
    description: 'Refine & improve',
    statusMatch: [],
  },
  {
    id: 'deploy',
    name: 'Deploy',
    icon: <Rocket className="h-4 w-4" />,
    description: 'Deploy to production',
    statusMatch: ['deploying', 'deployed'],
  },
];

function getPhaseState(
  phase: PhaseDefinition,
  currentStatus: PhaseStatus,
  phaseIndex: number,
  currentPhaseIndex: number
): 'completed' | 'current' | 'upcoming' | 'error' {
  if (currentStatus === 'error') {
    // If error occurred, mark current phase as error
    if (
      phase.statusMatch.includes(currentStatus) ||
      phaseIndex === currentPhaseIndex
    ) {
      return 'error';
    }
  }

  if (phaseIndex < currentPhaseIndex) {
    return 'completed';
  }

  if (phase.statusMatch.includes(currentStatus)) {
    return 'current';
  }

  return 'upcoming';
}

function getCurrentPhaseIndex(status: PhaseStatus): number {
  for (let i = phases.length - 1; i >= 0; i--) {
    if (phases[i].statusMatch.includes(status)) {
      return i;
    }
  }
  return 0;
}

export function PhaseTimeline({
  session,
  className,
  compact = false,
}: PhaseTimelineProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentStatus = session?.phase.status || 'idle';
  const currentPhaseIndex = getCurrentPhaseIndex(currentStatus);

  // Update elapsed time
  useEffect(() => {
    if (!session?.phase.startedAt) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(session.phase.startedAt).getTime();

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.phase.startedAt]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <CompactTimeline
        session={session}
        currentPhaseIndex={currentPhaseIndex}
        elapsedTime={elapsedTime}
        formatTime={formatTime}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn('rounded-lg border border-border bg-card p-4', className)}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Development Progress</h3>
        <div className="flex items-center gap-2">
          {session?.filesGenerated !== undefined &&
            session.filesGenerated > 0 && (
              <Badge variant="secondary" className="gap-1">
                <FileCode className="h-3 w-3" />
                {session.filesGenerated}
                {session.totalFiles && ` / ${session.totalFiles}`} files
              </Badge>
            )}
          {elapsedTime > 0 && (
            <Badge variant="outline" className="tabular-nums">
              {formatTime(elapsedTime)}
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <Progress
          value={((currentPhaseIndex + 1) / phases.length) * 100}
          className="h-2"
        />
      </div>

      {/* Phase steps */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute left-4 top-0 h-full w-0.5 bg-border" />

        <div className="space-y-3">
          {phases.map((phase, index) => {
            const state = getPhaseState(
              phase,
              currentStatus,
              index,
              currentPhaseIndex
            );

            return (
              <div
                key={phase.id}
                className="relative flex items-center gap-3 pl-8"
              >
                {/* Icon circle */}
                <div
                  className={cn(
                    'absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                    state === 'completed' &&
                      'border-green-500 bg-green-500/10 text-green-500',
                    state === 'current' &&
                      'border-primary bg-primary/10 text-primary',
                    state === 'upcoming' &&
                      'border-muted-foreground/30 bg-muted text-muted-foreground',
                    state === 'error' &&
                      'border-destructive bg-destructive/10 text-destructive'
                  )}
                >
                  {state === 'completed' ? (
                    <Check className="h-4 w-4" />
                  ) : state === 'current' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : state === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    phase.icon
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        state === 'current' && 'text-primary',
                        state === 'completed' && 'text-green-500',
                        state === 'error' && 'text-destructive',
                        state === 'upcoming' && 'text-muted-foreground'
                      )}
                    >
                      {phase.name}
                    </span>
                    {state === 'current' && session?.currentFile && (
                      <span className="truncate text-xs text-muted-foreground">
                        {session.currentFile}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error message */}
      {currentStatus === 'error' && session?.phase.error && (
        <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{session.phase.error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact horizontal timeline for smaller spaces
 */
function CompactTimeline({
  session,
  currentPhaseIndex,
  elapsedTime,
  formatTime,
  className,
}: {
  session: VibeSession | null;
  currentPhaseIndex: number;
  elapsedTime: number;
  formatTime: (seconds: number) => string;
  className?: string;
}) {
  const currentStatus = session?.phase.status || 'idle';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Mini progress dots */}
      <div className="flex items-center gap-1">
        {phases.map((phase, index) => {
          const state = getPhaseState(
            phase,
            currentStatus,
            index,
            currentPhaseIndex
          );

          return (
            <div
              key={phase.id}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                state === 'completed' && 'bg-green-500',
                state === 'current' && 'animate-pulse bg-primary',
                state === 'upcoming' && 'bg-muted-foreground/30',
                state === 'error' && 'bg-destructive'
              )}
              title={phase.name}
            />
          );
        })}
      </div>

      {/* Current phase name */}
      <span className="text-xs text-muted-foreground">
        {phases[currentPhaseIndex]?.name || 'Ready'}
      </span>

      {/* File counter */}
      {session?.filesGenerated !== undefined && session.filesGenerated > 0 && (
        <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-xs">
          <FileCode className="h-2.5 w-2.5" />
          {session.filesGenerated}
        </Badge>
      )}

      {/* Timer */}
      {elapsedTime > 0 && (
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatTime(elapsedTime)}
        </span>
      )}
    </div>
  );
}

export default PhaseTimeline;
