import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '../ui/button';
import { useScreenReader, useKeyboardNavigation } from '../../hooks/useAccessibility';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends ButtonProps {
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  isLoading?: boolean;
  loadingText?: string;

  // Event handlers
  onActivate?: () => void;

  // Visual indicators for screen readers
  visuallyHidden?: boolean;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    onClick,
    onActivate,
    isLoading = false,
    loadingText = 'Loading',
    visuallyHidden = false,
    className,
    disabled,
    ...props
  }, ref) => {
    const { announceError } = useScreenReader();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      try {
        onClick?.(event);
        onActivate?.();
      } catch (error) {
        announceError('Action failed. Please try again.');
        console.error('Button action failed:', error);
      }
    };

    const { handleKeyDown } = useKeyboardNavigation({
      onEnter: onActivate,
      onSpace: onActivate,
    });

    const isDisabled = disabled || isLoading;

    return (
      <Button
        ref={ref}
        className={cn(
          visuallyHidden && 'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50',
          className
        )}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...(isLoading && {
          'aria-label': loadingText,
        })}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span
              className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-current"
              aria-hidden="true"
            />
            {loadingText}
          </span>
        ) : (
          children
        )}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;