/**
 * Tool Progress Indicator
 * Shows which tools are currently executing and their progress
 */

import React from 'react';
import {
  Loader2,
  Image,
  Video,
  FileText,
  Search,
  Users,
  Code,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { ToolType } from '../../services/chat-tool-router';

interface ToolProgressIndicatorProps {
  activeTools: ToolType[];
  toolProgress: Record<ToolType, { status: string; progress?: number }>;
  className?: string;
}

const toolIcons: Record<ToolType, React.ReactNode> = {
  'image-generation': <Image className="h-4 w-4" />,
  'video-generation': <Video className="h-4 w-4" />,
  'document-creation': <FileText className="h-4 w-4" />,
  'web-search': <Search className="h-4 w-4" />,
  'multi-agent': <Users className="h-4 w-4" />,
  'code-generation': <Code className="h-4 w-4" />,
  'general-chat': <MessageSquare className="h-4 w-4" />,
};

const toolNames: Record<ToolType, string> = {
  'image-generation': 'Image Generation',
  'video-generation': 'Video Generation',
  'document-creation': 'Document Creation',
  'web-search': 'Web Search',
  'multi-agent': 'Multi-Agent Collaboration',
  'code-generation': 'Code Generation',
  'general-chat': 'General Chat',
};

const toolColors: Record<ToolType, string> = {
  'image-generation': 'text-purple-500',
  'video-generation': 'text-pink-500',
  'document-creation': 'text-blue-500',
  'web-search': 'text-green-500',
  'multi-agent': 'text-orange-500',
  'code-generation': 'text-cyan-500',
  'general-chat': 'text-gray-500',
};

export const ToolProgressIndicator: React.FC<ToolProgressIndicatorProps> = ({
  activeTools,
  toolProgress,
  className,
}) => {
  if (activeTools.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 shadow-sm',
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Active Tools</span>
      </div>
      <div className="space-y-3">
        {activeTools.map((toolType) => {
          const progress = toolProgress[toolType];
          const icon = toolIcons[toolType];
          const name = toolNames[toolType];
          const color = toolColors[toolType];

          return (
            <div key={toolType} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={cn('flex-shrink-0', color)}>{icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{name}</span>
                    {progress?.progress !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(progress.progress)}%
                      </span>
                    )}
                  </div>
                  {progress?.status && (
                    <div className="text-xs text-muted-foreground">
                      {progress.status}
                    </div>
                  )}
                </div>
              </div>
              {progress?.progress !== undefined && (
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
