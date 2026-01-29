import * as React from 'react';

import { cn } from '@shared/lib/utils';

export interface InputProps extends React.ComponentProps<'input'> {
  /**
   * Indicates the input has a validation error.
   * Sets aria-invalid for assistive technologies.
   */
  hasError?: boolean;
  /**
   * ID of the element that describes this input (error message, hint text).
   * Use aria-describedby for associating with multiple description elements.
   */
  errorMessageId?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, errorMessageId, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    // Combine error message ID with any existing aria-describedby
    const describedBy = [ariaDescribedBy, errorMessageId].filter(Boolean).join(' ') || undefined;
    
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base',
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
Input.displayName = 'Input';

export { Input };
