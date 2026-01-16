/**
 * Employee Thinking Indicator
 * Shows which AI employee is processing the message with animated thinking state
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Brain, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { employeeChatService } from '../../services/employee-chat-service';

interface EmployeeThinkingIndicatorProps {
  employeeName?: string;
  employeeAvatar?: string;
  message?: string;
  className?: string;
}

export const EmployeeThinkingIndicator: React.FC<
  EmployeeThinkingIndicatorProps
> = ({
  employeeName = 'AI Assistant',
  employeeAvatar,
  message = 'Analyzing your message and selecting best employee...',
  className,
}) => {
  const employeeInitials =
    employeeChatService.getEmployeeInitials(employeeName);
  const employeeColor = employeeChatService.getEmployeeAvatar(employeeName);

  return (
    <div className={cn('flex gap-4 px-4 py-6', className)}>
      {/* Employee Avatar */}
      <div className="flex-shrink-0">
        <div className="relative">
          <Avatar
            className="h-9 w-9 ring-2 ring-offset-1"
            style={{ ringColor: employeeColor }}
          >
            <AvatarImage
              src={
                typeof employeeAvatar === 'string' &&
                employeeAvatar.startsWith('/')
                  ? employeeAvatar
                  : undefined
              }
            />
            <AvatarFallback
              className="text-xs font-semibold text-white"
              style={{
                backgroundColor: employeeColor,
              }}
            >
              {employeeInitials}
            </AvatarFallback>
          </Avatar>
          {/* Animated pulse indicator */}
          <div
            className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full"
            style={{ backgroundColor: employeeColor }}
          >
            <div
              className="h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: employeeColor }}
            />
          </div>
        </div>
      </div>

      {/* Thinking Message */}
      <div className="flex-1">
        {/* Employee name */}
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="font-semibold" style={{ color: employeeColor }}>
            {employeeName
              .split('-')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: employeeColor }}
          >
            <Sparkles className="mr-0.5 inline-block h-2.5 w-2.5" />
            thinking
          </span>
        </div>

        {/* Thinking content */}
        <div className="inline-block rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Brain
              className="h-4 w-4 animate-pulse"
              style={{ color: employeeColor }}
            />
            <span className="text-sm text-muted-foreground">{message}</span>
            {/* Animated dots */}
            <div className="flex gap-1">
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0ms]"
                style={{ backgroundColor: employeeColor }}
              />
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:150ms]"
                style={{ backgroundColor: employeeColor }}
              />
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:300ms]"
                style={{ backgroundColor: employeeColor }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
