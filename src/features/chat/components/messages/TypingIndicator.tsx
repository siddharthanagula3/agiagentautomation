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
        'bg-muted/50 flex items-center gap-2 rounded-lg px-4 py-3',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <div className="bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
        <div className="bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
        <div className="bg-primary h-2 w-2 animate-bounce rounded-full" />
      </div>
      <span className="text-muted-foreground text-sm">
        {agentName} is typing...
      </span>
    </div>
  );
};
