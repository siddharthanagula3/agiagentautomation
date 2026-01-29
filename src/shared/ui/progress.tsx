import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@shared/lib/utils';

interface ProgressProps extends React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
> {
  indicatorClassName?: string;
  /**
   * Accessible label for the progress bar.
   * Required for screen reader users to understand what is loading.
   */
  'aria-label'?: string;
  /**
   * ID of the element that labels this progress bar.
   */
  'aria-labelledby'?: string;
  /**
   * Custom description for the current progress value.
   * Announced by screen readers when the value changes.
   */
  valueLabel?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, valueLabel, ...props }, ref) => {
  const normalizedValue = Math.min(Math.max(value || 0, 0), 100);
  const defaultValueLabel = `${normalizedValue}% complete`;
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800',
        className
      )}
      value={normalizedValue}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedValue}
      aria-valuetext={valueLabel || defaultValueLabel}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full bg-primary transition-all duration-300 ease-in-out',
          indicatorClassName
        )}
        style={{ width: `${normalizedValue}%` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
