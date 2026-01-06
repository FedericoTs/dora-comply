/**
 * Field-level validators for RoI templates
 *
 * Provides validation rules and fix suggestions for all RoI fields
 */

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationResult {
  isValid: boolean;
  severity: ValidationSeverity;
  message: string;
  suggestion?: string;
  autoFix?: () => string | null;
}

export interface FieldValidator {
  name: string;
  validate: (value: string, context?: Record<string, unknown>) => ValidationResult;
}

// LEI Code Validator (20 alphanumeric characters with checksum)
export const leiValidator: FieldValidator = {
  name: 'LEI Code',
  validate: (value: string): ValidationResult => {
    if (!value) {
      return {
        isValid: false,
        severity: 'error',
        message: 'LEI code is required for DORA reporting',
        suggestion: 'Obtain an LEI from an authorized LEI issuer (www.gleif.org)',
      };
    }

    const cleanValue = value.toUpperCase().replace(/\s/g, '');

    if (cleanValue.length !== 20) {
      return {
        isValid: false,
        severity: 'error',
        message: `LEI must be exactly 20 characters (currently ${cleanValue.length})`,
        autoFix: () => cleanValue.length < 20 ? null : cleanValue.substring(0, 20),
      };
    }

    if (!/^[A-Z0-9]{20}$/.test(cleanValue)) {
      return {
        isValid: false,
        severity: 'error',
        message: 'LEI must contain only letters (A-Z) and numbers (0-9)',
        autoFix: () => cleanValue.replace(/[^A-Z0-9]/g, ''),
      };
    }

    // Basic checksum validation (ISO 17442)
    if (!validateLeiChecksum(cleanValue)) {
      return {
        isValid: false,
        severity: 'warning',
        message: 'LEI checksum validation failed - please verify the code',
        suggestion: 'Double-check the LEI code against your registration documents',
      };
    }

    return { isValid: true, severity: 'info', message: 'Valid LEI code' };
  },
};

// Country Code Validator (ISO 3166-1 alpha-2)
export const countryCodeValidator: FieldValidator = {
  name: 'Country Code',
  validate: (value: string): ValidationResult => {
    if (!value) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Country code is required',
      };
    }

    const cleanValue = value.toUpperCase().trim();

    if (cleanValue.length !== 2) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Country code must be 2 letters (ISO 3166-1 alpha-2)',
        autoFix: () => cleanValue.length > 2 ? cleanValue.substring(0, 2) : null,
      };
    }

    if (!/^[A-Z]{2}$/.test(cleanValue)) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Country code must contain only letters',
        autoFix: () => cleanValue.replace(/[^A-Z]/g, ''),
      };
    }

    return { isValid: true, severity: 'info', message: 'Valid country code' };
  },
};

// Date Validator (ISO 8601 format)
export const dateValidator: FieldValidator = {
  name: 'Date',
  validate: (value: string, context?: Record<string, unknown>): ValidationResult => {
    if (!value) {
      return {
        isValid: false,
        severity: context?.required ? 'error' : 'warning',
        message: 'Date is not specified',
      };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Date must be in YYYY-MM-DD format',
        autoFix: () => {
          // Try to parse and reformat common date formats
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
          return null;
        },
      };
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Invalid date',
      };
    }

    // Check for future dates in certain contexts
    if (context?.noFuture && date > new Date()) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Date cannot be in the future',
        autoFix: () => new Date().toISOString().split('T')[0],
      };
    }

    return { isValid: true, severity: 'info', message: 'Valid date' };
  },
};

// Currency Amount Validator
export const currencyValidator: FieldValidator = {
  name: 'Currency Amount',
  validate: (value: string): ValidationResult => {
    if (!value) {
      return {
        isValid: true, // Often optional
        severity: 'info',
        message: 'Amount not specified',
      };
    }

    const cleanValue = value.replace(/[,\s]/g, '').replace(/€|\$/g, '');
    const numValue = parseFloat(cleanValue);

    if (isNaN(numValue)) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Invalid number format',
        autoFix: () => {
          const match = value.match(/[\d.]+/);
          return match ? match[0] : null;
        },
      };
    }

    if (numValue < 0) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Amount cannot be negative',
        autoFix: () => Math.abs(numValue).toString(),
      };
    }

    return { isValid: true, severity: 'info', message: 'Valid amount' };
  },
};

// Contract Reference Validator
export const contractRefValidator: FieldValidator = {
  name: 'Contract Reference',
  validate: (value: string): ValidationResult => {
    if (!value) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Contract reference is required',
        suggestion: 'Enter a unique identifier for this contractual arrangement',
      };
    }

    if (value.length < 3) {
      return {
        isValid: false,
        severity: 'warning',
        message: 'Contract reference seems too short',
        suggestion: 'Use a meaningful reference that identifies this contract',
      };
    }

    if (value.length > 50) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Contract reference is too long (max 50 characters)',
        autoFix: () => value.substring(0, 50),
      };
    }

    return { isValid: true, severity: 'info', message: 'Valid contract reference' };
  },
};

// Email Validator
export const emailValidator: FieldValidator = {
  name: 'Email',
  validate: (value: string): ValidationResult => {
    if (!value) {
      return {
        isValid: true,
        severity: 'info',
        message: 'Email not specified',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Invalid email format',
        autoFix: () => value.trim().toLowerCase(),
      };
    }

    return { isValid: true, severity: 'info', message: 'Valid email' };
  },
};

// URL Validator
export const urlValidator: FieldValidator = {
  name: 'URL',
  validate: (value: string): ValidationResult => {
    if (!value) {
      return {
        isValid: true,
        severity: 'info',
        message: 'URL not specified',
      };
    }

    try {
      new URL(value.startsWith('http') ? value : `https://${value}`);
      return { isValid: true, severity: 'info', message: 'Valid URL' };
    } catch {
      return {
        isValid: false,
        severity: 'error',
        message: 'Invalid URL format',
        autoFix: () => value.startsWith('http') ? value : `https://${value}`,
      };
    }
  },
};

// Percentage Validator (0-100)
export const percentageValidator: FieldValidator = {
  name: 'Percentage',
  validate: (value: string): ValidationResult => {
    if (!value) {
      return {
        isValid: true,
        severity: 'info',
        message: 'Percentage not specified',
      };
    }

    const cleanValue = value.replace(/%/g, '').trim();
    const numValue = parseFloat(cleanValue);

    if (isNaN(numValue)) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Invalid percentage format',
      };
    }

    if (numValue < 0 || numValue > 100) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Percentage must be between 0 and 100',
        autoFix: () => Math.max(0, Math.min(100, numValue)).toString(),
      };
    }

    return { isValid: true, severity: 'info', message: 'Valid percentage' };
  },
};

// Helper function for LEI checksum validation
function validateLeiChecksum(lei: string): boolean {
  // Convert letters to numbers (A=10, B=11, etc.)
  const converted = lei.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return (code - 55).toString();
    }
    return char;
  }).join('');

  // ISO 7064 Mod 97-10 checksum
  let remainder = converted;
  while (remainder.length > 2) {
    const block = remainder.substring(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.substring(9);
  }

  return parseInt(remainder, 10) % 97 === 1;
}

// Get validator for a field type
export function getFieldValidator(fieldType: string): FieldValidator | null {
  const validators: Record<string, FieldValidator> = {
    lei: leiValidator,
    country: countryCodeValidator,
    date: dateValidator,
    currency: currencyValidator,
    contract_ref: contractRefValidator,
    email: emailValidator,
    url: urlValidator,
    percentage: percentageValidator,
  };

  return validators[fieldType] || null;
}

// Validate a field value
export function validateField(
  value: string,
  fieldType: string,
  context?: Record<string, unknown>
): ValidationResult {
  const validator = getFieldValidator(fieldType);
  if (!validator) {
    return { isValid: true, severity: 'info', message: 'No validation rules' };
  }
  return validator.validate(value, context);
}
