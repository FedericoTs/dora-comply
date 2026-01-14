'use client';

/**
 * Validated Field Component
 *
 * Field wrapper with inline validation, suggestions, and auto-fix capabilities
 */

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ValidationMessage, ValidationIndicator } from './validation-message';
import { cn } from '@/lib/utils';
import {
  validateField,
  type ValidationResult,
  type ValidationSeverity,
} from '@/lib/roi/field-validators';

interface ValidatedFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  fieldType?: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  showValidation?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  customValidation?: (value: string) => ValidationResult | null;
  children?: ReactNode;
}

export function ValidatedField({
  id,
  label,
  value,
  onChange,
  fieldType,
  required = false,
  placeholder,
  description,
  disabled = false,
  className,
  inputClassName,
  showValidation = true,
  validateOnBlur = true,
  validateOnChange = false,
  customValidation,
  children,
}: ValidatedFieldProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [touched, setTouched] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const runValidation = useCallback((val: string) => {
    if (customValidation) {
      const result = customValidation(val);
      if (result) {
        setValidation(result);
        return;
      }
    }

    if (fieldType) {
      const result = validateField(val, fieldType, { required });
      setValidation(result);
    } else if (required && !val) {
      setValidation({
        isValid: false,
        severity: 'error',
        message: 'This field is required',
      });
    } else {
      setValidation(null);
    }
  }, [customValidation, fieldType, required]);

  // Validate on mount if value exists
  // Intentional: need to validate initial value on mount
  useEffect(() => {
    if (value && showValidation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runValidation(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsDirty(true);

    if (validateOnChange && showValidation) {
      runValidation(newValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (validateOnBlur && showValidation) {
      runValidation(value);
    }
  };

  const handleAutoFix = () => {
    if (validation?.autoFix) {
      const fixedValue = validation.autoFix();
      if (fixedValue !== null) {
        onChange(fixedValue);
        runValidation(fixedValue);
      }
    }
  };

  const showValidationMessage = showValidation && touched && validation && !validation.isValid;
  const hasError = validation && !validation.isValid && validation.severity === 'error';
  const hasWarning = validation && !validation.isValid && validation.severity === 'warning';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className={cn(hasError && 'text-destructive')}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showValidation && touched && validation && (
          <ValidationIndicator
            isValid={validation.isValid}
            severity={validation.severity}
          />
        )}
      </div>

      {children || (
        <Input
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            inputClassName,
            hasError && 'border-destructive focus-visible:ring-destructive',
            hasWarning && 'border-amber-500 focus-visible:ring-amber-500'
          )}
        />
      )}

      {description && !showValidationMessage && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {showValidationMessage && (
        <ValidationMessage
          severity={validation.severity}
          message={validation.message}
          suggestion={validation.suggestion}
          canAutoFix={!!validation.autoFix}
          onAutoFix={handleAutoFix}
        />
      )}
    </div>
  );
}

/**
 * Field group with shared validation state
 */
interface ValidatedFieldGroupProps {
  children: ReactNode;
  className?: string;
}

export function ValidatedFieldGroup({ children, className }: ValidatedFieldGroupProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}
