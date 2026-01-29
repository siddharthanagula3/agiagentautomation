import * as React from 'react';
import { cn } from '@shared/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  /**
   * Indicates the textarea has a validation error.
   * Sets aria-invalid for assistive technologies.
   */
  hasError?: boolean;
  /**
   * ID of the element that describes this textarea (error message, hint text).
   * Use aria-describedby for associating with multiple description elements.
   */
  errorMessageId?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, errorMessageId, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    // Combine error message ID with any existing aria-describedby
    const describedBy = [ariaDescribedBy, errorMessageId].filter(Boolean).join(' ') || undefined;
    
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:resize-y',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        ref={ref}
        aria-invalid={ariaInvalid ?? hasError ?? undefined}
        aria-describedby={describedBy}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
