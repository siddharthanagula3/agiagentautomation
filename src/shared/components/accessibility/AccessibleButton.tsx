import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@shared/ui/button';
import { useAccessibility } from '@shared/hooks/useAccessibility';

interface AccessibleButtonProps extends ButtonProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  announceOnClick?: boolean;
  announceText?: string;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      children,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-expanded': ariaExpanded,
      'aria-pressed': ariaPressed,
      'aria-haspopup': ariaHaspopup,
      announceOnClick = false,
      announceText,
      onClick,
      ...props
    },
    ref
  ) => {
    const { announce, trackInteraction } = useAccessibility();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Track interaction for analytics
      trackInteraction('click', 'button', {
        buttonText: children,
        ariaLabel,
      });

      // Announce to screen readers if requested
      if (announceOnClick && announceText) {
        announce(announceText);
      }

      // Call original onClick handler
      onClick?.(event);
    };

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-pressed={ariaPressed}
        aria-haspopup={ariaHaspopup}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
