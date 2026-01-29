import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';

import { cn } from '@shared/lib/utils';
import { buttonVariants } from './button-variants';

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Screen reader label for icon-only buttons.
   * Required when button has no visible text content.
   */
  'aria-label'?: string;
  /**
   * Indicates the button is in a loading state.
   * Sets aria-busy and aria-disabled for assistive technologies.
   */
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, type = 'button', disabled, 'aria-label': ariaLabel, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    // Determine if this is an icon-only button (no text children)
    const hasTextContent = React.Children.toArray(children).some(
      child => typeof child === 'string' && child.trim() !== ''
    );
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={asChild ? undefined : type}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        aria-busy={isLoading || undefined}
        aria-disabled={disabled || isLoading || undefined}
        {...props}
      >
        {children}
        {isLoading && (
          <span className="sr-only">Loading, please wait</span>
        )}
        {!hasTextContent && !ariaLabel && (
          <span className="sr-only">Button</span>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button };
