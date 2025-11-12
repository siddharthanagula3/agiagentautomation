// src/shared/hooks/useFormValidation.ts
// React hook for form validation using Zod schemas

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { formatZodErrors } from '@shared/utils/validation-schemas';

interface ValidationState<T> {
  data: Partial<T>;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
}

interface UseFormValidationReturn<T> {
  // State
  data: Partial<T>;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;

  // Methods
  setValue: (field: keyof T, value: unknown) => void;
  setValues: (values: Partial<T>) => void;
  validate: () => boolean;
  validateField: (field: keyof T) => boolean;
  reset: () => void;
  getFieldError: (field: keyof T) => string | undefined;
  hasError: (field: keyof T) => boolean;
}

/**
 * Custom hook for form validation using Zod schemas
 *
 * @example
 * const { data, errors, setValue, validate } = useFormValidation(loginSchema, {
 *   email: '',
 *   password: ''
 * });
 *
 * const handleSubmit = () => {
 *   if (validate()) {
 *     // Submit form
 *   }
 * };
 */
export function useFormValidation<T extends z.ZodTypeAny>(
  schema: T,
  initialData: Partial<z.infer<T>> = {}
): UseFormValidationReturn<z.infer<T>> {
  type DataType = z.infer<T>;

  const [state, setState] = useState<ValidationState<DataType>>({
    data: initialData,
    errors: {},
    isValid: false,
    isDirty: false,
  });

  /**
   * Set a single field value
   */
  const setValue = useCallback((field: keyof DataType, value: unknown) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      isDirty: true,
      // Clear error for this field when value changes
      errors: { ...prev.errors, [field]: '' },
    }));
  }, []);

  /**
   * Set multiple field values at once
   */
  const setValues = useCallback((values: Partial<DataType>) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, ...values },
      isDirty: true,
    }));
  }, []);

  /**
   * Validate entire form
   */
  const validate = useCallback((): boolean => {
    try {
      schema.parse(state.data);
      setState((prev) => ({
        ...prev,
        errors: {},
        isValid: true,
      }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          if (field && !errorMap[field]) {
            errorMap[field] = err.message;
          }
        });
        setState((prev) => ({
          ...prev,
          errors: errorMap,
          isValid: false,
        }));
      }
      return false;
    }
  }, [schema, state.data]);

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof DataType): boolean => {
      try {
        // Create a temporary object with just this field
        const fieldSchema = schema.pick({ [field]: true });
        fieldSchema.parse({ [field]: state.data[field] });

        setState((prev) => ({
          ...prev,
          errors: { ...prev.errors, [field]: '' },
        }));
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessage = error.errors[0]?.message || 'Invalid value';
          setState((prev) => ({
            ...prev,
            errors: { ...prev.errors, [field as string]: errorMessage },
          }));
        }
        return false;
      }
    },
    [schema, state.data]
  );

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setState({
      data: initialData,
      errors: {},
      isValid: false,
      isDirty: false,
    });
  }, [initialData]);

  /**
   * Get error message for a specific field
   */
  const getFieldError = useCallback(
    (field: keyof DataType): string | undefined => {
      return state.errors[field as string];
    },
    [state.errors]
  );

  /**
   * Check if a field has an error
   */
  const hasError = useCallback(
    (field: keyof DataType): boolean => {
      return !!state.errors[field as string];
    },
    [state.errors]
  );

  return {
    data: state.data,
    errors: state.errors,
    isValid: state.isValid,
    isDirty: state.isDirty,
    setValue,
    setValues,
    validate,
    validateField,
    reset,
    getFieldError,
    hasError,
  };
}

/**
 * Hook for async validation (e.g., checking if email exists)
 */
export function useAsyncValidation<T>(
  validationFn: (data: T) => Promise<boolean>,
  debounceMs = 500
) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = useCallback(
    async (data: T): Promise<boolean> => {
      setIsValidating(true);
      setValidationError(null);

      try {
        const isValid = await validationFn(data);
        if (!isValid) {
          setValidationError('Validation failed');
        }
        return isValid;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Validation error';
        setValidationError(message);
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [validationFn]
  );

  return { validate, isValidating, validationError };
}

/**
 * Utility to create field props for controlled inputs
 */
export function createFieldProps<T>(
  field: keyof T,
  value: unknown,
  setValue: (field: keyof T, value: unknown) => void,
  error?: string
) {
  return {
    value: value ?? '',
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      setValue(field, e.target.value);
    },
    error: !!error,
    helperText: error,
  };
}
