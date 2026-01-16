import React from 'react';
import { cn } from '@shared/lib/utils';

interface TypingIndicatorProps {
  agentName?: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  agentName = 'AI Assistant',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
      </div>
      <span className="text-sm text-muted-foreground">
        {agentName} is typing...
      </span>
    </div>
  );
};
