import React, { useRef, useCallback } from 'react';
import { useScreenReader, useAriaId } from '../../hooks/useAccessibility';
import { cn } from '@/lib/utils';

interface AccessibleFormProps {
  onSubmit: (event: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;

  // Validation
  errors?: Record<string, string>;
  isSubmitting?: boolean;

  // ARIA attributes
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  onSubmit,
  children,
  className,
  errors = {},
  isSubmitting = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const { announceError, announceSuccess } = useScreenReader();
  const errorSummaryId = useAriaId('error-summary');

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();

      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        const errorMessage = `Form has ${errorKeys.length} error${errorKeys.length > 1 ? 's' : ''}`;
        announceError(errorMessage);

        // Focus first error field
        const firstErrorField = formRef.current?.querySelector(
          `[name="${errorKeys[0]}"]`
        ) as HTMLElement;
        if (firstErrorField) {
          firstErrorField.focus();
        }
        return;
      }

      try {
        onSubmit(event);
      } catch (error) {
        announceError(
          'Form submission failed. Please check your input and try again.'
        );
      }
    },
    [onSubmit, errors, announceError]
  );

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(className)}
      noValidate
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={hasErrors ? errorSummaryId : undefined}
    >
      {/* Error Summary */}
      {hasErrors && (
        <div
          id={errorSummaryId}
          className="mb-6 rounded-md border border-red-300 bg-red-50 p-4"
          role="alert"
          aria-labelledby="error-summary-title"
        >
          <h2
            id="error-summary-title"
            className="mb-2 text-lg font-semibold text-red-800"
          >
            There are {Object.keys(errors).length} error
            {Object.keys(errors).length > 1 ? 's' : ''} in this form
          </h2>
          <ul className="list-inside list-disc space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>
                <a
                  href={`#${field}`}
                  className="text-red-700 underline hover:text-red-900"
                  onClick={e => {
                    e.preventDefault();
                    const element = document.querySelector(
                      `[name="${field}"]`
                    ) as HTMLElement;
                    element?.focus();
                  }}
                >
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {children}
    </form>
  );
};

interface AccessibleFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  description?: string;
  className?: string;
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  label,
  name,
  error,
  required = false,
  children,
  description,
  className,
}) => {
  const fieldId = useAriaId(`field-${name}`);
  const errorId = useAriaId(`error-${name}`);
  const descriptionId = useAriaId(`desc-${name}`);

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          'block text-sm font-medium',
          error ? 'text-red-700' : 'text-gray-700'
        )}
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-label="required">
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descriptionId} className="text-sm text-gray-600">
          {description}
        </p>
      )}

      <div>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          name,
          'aria-required': required,
          'aria-invalid': !!error,
          'aria-describedby':
            [description && descriptionId, error && errorId]
              .filter(Boolean)
              .join(' ') || undefined,
          className: cn(
            'w-full',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          ),
        })}
      </div>

      {error && (
        <div
          id={errorId}
          role="alert"
          className="flex items-start gap-1 text-sm text-red-600"
        >
          <span aria-hidden="true" className="font-bold text-red-500">
            ×
          </span>
          {error}
        </div>
      )}
    </div>
  );
};

export default AccessibleForm;
