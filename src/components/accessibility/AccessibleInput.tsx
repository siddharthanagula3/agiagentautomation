import React, { forwardRef, useId } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useAriaAttributes } from '@/hooks/useAccessibility';

interface AccessibleInputProps
  extends Omit<InputProps, 'aria-label' | 'aria-describedby'> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  announceChanges?: boolean;
}

const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      label,
      description,
      error,
      required = false,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      announceChanges = false,
      onChange,
      ...props
    },
    ref
  ) => {
    const { announce, trackInteraction } = useAccessibility();
    const { setAriaDescribedBy } = useAriaAttributes();
    const inputId = useId();
    const labelId = `${inputId}-label`;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      // Track interaction
      trackInteraction('input', 'text', {
        fieldName: label,
        value: event.target.value,
      });

      // Announce changes to screen readers if requested
      if (announceChanges && event.target.value) {
        announce(`${label} updated to ${event.target.value}`);
      }

      // Call original onChange handler
      onChange?.(event);
    };

    const handleFocus = () => {
      trackInteraction('focus', 'input', {
        fieldName: label,
      });
    };

    const handleBlur = () => {
      trackInteraction('blur', 'input', {
        fieldName: label,
      });
    };

    // Build aria-describedby attribute
    const describedBy = [
      description && descriptionId,
      error && errorId,
      ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} id={labelId}>
          {label}
          {required && (
            <span className="ml-1 text-destructive" aria-label="required">
              *
            </span>
          )}
        </Label>

        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        <Input
          ref={ref}
          id={inputId}
          aria-label={ariaLabel || label}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

export default AccessibleInput;
