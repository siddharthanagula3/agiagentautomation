/**
 * AudioVisualizer - Real-time audio waveform visualization component
 *
 * Features:
 * - Shows waveform bars during recording
 * - Animated bars based on audio levels
 * - Recording duration timer display
 * - Responsive design with smooth animations
 * - Pause/resume visual feedback
 */

import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@shared/lib/utils';
import { Mic, Pause } from 'lucide-react';

export interface AudioVisualizerProps {
  /** Audio levels array (0-1 range for each bar) */
  audioLevels: number[];
  /** Recording duration in seconds */
  duration: number;
  /** Whether recording is currently active */
  isRecording: boolean;
  /** Whether recording is paused */
  isPaused: boolean;
  /** Number of bars to display */
  barCount?: number;
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Format duration in MM:SS format
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const AudioVisualizer = React.memo(function AudioVisualizer({
  audioLevels,
  duration,
  isRecording,
  isPaused,
  barCount = 32,
  className,
  size = 'md',
}: AudioVisualizerProps) {
  // Track animation time with state to avoid impure Date.now() in useMemo
  const [animationTime, setAnimationTime] = useState(0);

  // Update animation time in effect when recording and not paused
  useEffect(() => {
    if (isRecording && !isPaused && audioLevels.length === 0) {
      const interval = setInterval(() => {
        setAnimationTime((t) => t + 0.1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isRecording, isPaused, audioLevels.length]);

  // Generate bars to display
  const bars = useMemo(() => {
    // If we have audio levels, use them
    if (audioLevels.length > 0) {
      // Resample to match barCount if needed
      if (audioLevels.length === barCount) {
        return audioLevels;
      }

      const resampled: number[] = [];
      const ratio = audioLevels.length / barCount;

      for (let i = 0; i < barCount; i++) {
        const startIdx = Math.floor(i * ratio);
        const endIdx = Math.floor((i + 1) * ratio);
        let sum = 0;
        for (let j = startIdx; j < endIdx && j < audioLevels.length; j++) {
          sum += audioLevels[j];
        }
        resampled.push(sum / (endIdx - startIdx));
      }

      return resampled;
    }

    // Generate idle animation bars when not actively receiving audio
    return Array.from({ length: barCount }, (_, i) => {
      if (isPaused) {
        // Static bars when paused
        return 0.1 + Math.sin(i * 0.3) * 0.1;
      }
      // Subtle idle animation when recording but no levels
      // Use animationTime state instead of impure Date.now()
      return 0.1 + Math.sin(animationTime * 2 + i * 0.3) * 0.15;
    });
  }, [audioLevels, barCount, isPaused, animationTime]);

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 'h-8',
      barWidth: 'w-0.5',
      gap: 'gap-0.5',
      maxHeight: 24,
      timerText: 'text-xs',
      iconSize: 'h-3 w-3',
    },
    md: {
      height: 'h-12',
      barWidth: 'w-1',
      gap: 'gap-0.5',
      maxHeight: 40,
      timerText: 'text-sm',
      iconSize: 'h-4 w-4',
    },
    lg: {
      height: 'h-16',
      barWidth: 'w-1.5',
      gap: 'gap-1',
      maxHeight: 56,
      timerText: 'text-base',
      iconSize: 'h-5 w-5',
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2',
        className
      )}
    >
      {/* Recording indicator */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center justify-center rounded-full',
            isRecording && !isPaused
              ? 'animate-pulse bg-destructive'
              : 'bg-muted-foreground/30',
            size === 'sm' && 'h-5 w-5',
            size === 'md' && 'h-6 w-6',
            size === 'lg' && 'h-8 w-8'
          )}
        >
          {isPaused ? (
            <Pause className={cn(config.iconSize, 'text-muted-foreground')} />
          ) : (
            <Mic className={cn(config.iconSize, 'text-white')} />
          )}
        </div>
      </div>

      {/* Waveform visualization */}
      <div
        className={cn(
          'flex flex-1 items-center justify-center',
          config.height,
          config.gap
        )}
      >
        {bars.map((level, index) => {
          // Calculate bar height based on level
          const minHeight = 4;
          const height = Math.max(minHeight, level * config.maxHeight);

          return (
            <div
              key={index}
              className={cn(
                config.barWidth,
                'rounded-full transition-all duration-75',
                isRecording && !isPaused
                  ? 'bg-destructive'
                  : 'bg-muted-foreground/40'
              )}
              style={{
                height: `${height}px`,
                opacity: isPaused ? 0.5 : 0.7 + level * 0.3,
              }}
            />
          );
        })}
      </div>

      {/* Duration timer */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'font-mono font-medium tabular-nums',
            config.timerText,
            isRecording && !isPaused
              ? 'text-destructive'
              : 'text-muted-foreground'
          )}
        >
          {formatDuration(duration)}
        </span>
      </div>
    </div>
  );
});

export default AudioVisualizer;
