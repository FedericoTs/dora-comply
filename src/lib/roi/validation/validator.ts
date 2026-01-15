/**
 * RoI Validator
 *
 * Validates template data against ESA rules
 */

import type {
  RoiTemplateId,
  ValidationError,
  TemplateValidationResult,
  RoiValidationResult,
} from '../types';
import {
  TEMPLATE_RULES,
  CROSS_FIELD_RULES,
  CROSS_TEMPLATE_RULES,
  type FieldRules,
} from './rules';

// ============================================================================
// Single Field Validation
// ============================================================================

function validateField(
  value: unknown,
  fieldRules: FieldRules,
  row: Record<string, unknown>,
  rowIndex: number,
  templateId: RoiTemplateId
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const rule of fieldRules.rules) {
    const isValid = rule.validate(value, row);

    if (!isValid) {
      errors.push({
        templateId,
        rowIndex,
        columnCode: fieldRules.columnCode,
        severity: rule.severity,
        rule: rule.type,
        message: rule.message,
        value,
        suggestion: rule.suggestion,
      });
    }
  }

  return errors;
}

// ============================================================================
// Row Validation
// ============================================================================

function validateRow(
  row: Record<string, unknown>,
  rowIndex: number,
  templateId: RoiTemplateId,
  templateRules: Record<string, FieldRules>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [columnCode, fieldRules] of Object.entries(templateRules)) {
    const value = row[columnCode];
    const fieldErrors = validateField(value, fieldRules, row, rowIndex, templateId);
    errors.push(...fieldErrors);
  }

  return errors;
}

// ============================================================================
// Template Validation
// ============================================================================

export function validateTemplate(
  templateId: RoiTemplateId,
  data: Record<string, unknown>[]
): TemplateValidationResult {
  const templateRules = TEMPLATE_RULES[templateId];

  // Templates without rules are considered valid
  if (!templateRules) {
    return {
      templateId,
      rowCount: data.length,
      errors: [],
      warnings: [],
      isValid: true,
    };
  }

  const allErrors: ValidationError[] = [];

  // Validate each row
  data.forEach((row, index) => {
    const rowErrors = validateRow(row, index, templateId, templateRules);
    allErrors.push(...rowErrors);
  });

  // Apply cross-field rules
  const crossFieldRules = CROSS_FIELD_RULES.filter(r => r.templateId === templateId);
  for (const rule of crossFieldRules) {
    const result = rule.validate(data);
    if (!result.valid) {
      result.errors.forEach((message, i) => {
        allErrors.push({
          templateId,
          rowIndex: i,
          columnCode: '*',
          severity: rule.severity,
          rule: rule.name,
          message,
          value: null,
        });
      });
    }
  }

  // Separate errors and warnings
  const errors = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning' || e.severity === 'info');

  return {
    templateId,
    rowCount: data.length,
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

// ============================================================================
// Full RoI Validation
// ============================================================================

export async function validateRoi(
  templateData: Record<RoiTemplateId, Record<string, unknown>[]>
): Promise<RoiValidationResult> {
  const templateResults: Record<string, TemplateValidationResult> = {};
  let totalErrors = 0;
  let totalWarnings = 0;
  const completeness: Record<string, number> = {};

  const templates = Object.keys(templateData) as RoiTemplateId[];

  for (const templateId of templates) {
    const data = templateData[templateId];
    const result = validateTemplate(templateId, data);

    templateResults[templateId] = result;
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    // Calculate completeness
    const templateRules = TEMPLATE_RULES[templateId];
    if (templateRules && data.length > 0) {
      const requiredFields = Object.values(templateRules).filter(f => f.required);
      let filledCount = 0;
      let totalRequired = 0;

      data.forEach(row => {
        requiredFields.forEach(field => {
          totalRequired++;
          const value = row[field.columnCode];
          if (value !== null && value !== undefined && value !== '') {
            filledCount++;
          }
        });
      });

      completeness[templateId] = totalRequired > 0
        ? Math.round((filledCount / totalRequired) * 100)
        : 100;
    } else {
      completeness[templateId] = data.length > 0 ? 100 : 0;
    }
  }

  // Run cross-template validation
  const crossTemplateErrors = validateCrossTemplate(templateData);
  totalErrors += crossTemplateErrors.errors.length;
  totalWarnings += crossTemplateErrors.warnings.length;

  // Add cross-template errors to relevant template results
  crossTemplateErrors.errors.forEach(error => {
    const result = templateResults[error.templateId];
    if (result) {
      result.errors.push(error);
      result.isValid = false;
    }
  });
  crossTemplateErrors.warnings.forEach(warning => {
    const result = templateResults[warning.templateId];
    if (result) {
      result.warnings.push(warning);
    }
  });

  // Calculate overall score (100 - error penalty)
  const errorPenalty = Math.min(totalErrors * 5, 100); // Each error = 5% penalty, max 100%
  const warningPenalty = Math.min(totalWarnings * 1, 20); // Each warning = 1% penalty, max 20%
  const overallScore = Math.max(0, 100 - errorPenalty - warningPenalty);

  const isValid = totalErrors === 0;

  return {
    isValid,
    overallScore,
    templateResults: templateResults as Record<RoiTemplateId, TemplateValidationResult>,
    totalErrors,
    totalWarnings,
    completeness: completeness as Record<RoiTemplateId, number>,
  };
}

// ============================================================================
// Cross-Template Validation
// ============================================================================

interface CrossTemplateValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
}

function validateCrossTemplate(
  templateData: Record<RoiTemplateId, Record<string, unknown>[]>
): CrossTemplateValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  for (const rule of CROSS_TEMPLATE_RULES) {
    const sourceData = templateData[rule.sourceTemplate] || [];
    const targetData = templateData[rule.targetTemplate] || [];

    // Skip if source template has no data
    if (sourceData.length === 0) continue;

    const result = rule.validate(sourceData, targetData);

    if (!result.valid) {
      result.errors.forEach((message) => {
        const validationError: ValidationError = {
          templateId: rule.sourceTemplate,
          rowIndex: 0,
          columnCode: rule.sourceField,
          severity: rule.severity,
          rule: rule.name,
          message,
          value: null,
          suggestion: `Ensure ${rule.targetTemplate} contains the referenced data`,
        };

        if (rule.severity === 'error') {
          errors.push(validationError);
        } else {
          warnings.push(validationError);
        }
      });
    }
  }

  return { errors, warnings };
}

// ============================================================================
// Quick Validation (just check if valid, don't return full details)
// ============================================================================

export function quickValidate(
  templateId: RoiTemplateId,
  data: Record<string, unknown>[]
): { isValid: boolean; errorCount: number; warningCount: number } {
  const result = validateTemplate(templateId, data);
  return {
    isValid: result.isValid,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
  };
}

// ============================================================================
// AI Suggestion Enhancement
// ============================================================================

export interface EnhancedError extends ValidationError {
  aiSuggestion?: string;
  fixAction?: {
    type: 'auto' | 'manual';
    description: string;
    value?: unknown;
  };
}

export function enhanceErrorsWithSuggestions(
  errors: ValidationError[]
): EnhancedError[] {
  return errors.map(error => {
    const enhanced: EnhancedError = { ...error };

    // Add AI-style suggestions based on error type
    switch (error.rule) {
      case 'required':
        enhanced.aiSuggestion = `This field is mandatory for ESA submission. Check your source data for the missing ${error.columnCode} value.`;
        enhanced.fixAction = {
          type: 'manual',
          description: `Navigate to the source record and add the missing ${error.columnCode} value`,
        };
        break;

      case 'format':
      case 'date':
        enhanced.aiSuggestion = `The value "${error.value}" doesn't match the expected format. Dates must be YYYY-MM-DD.`;
        if (typeof error.value === 'string' && error.value.includes('/')) {
          // Try to suggest corrected format
          const parts = error.value.split('/');
          if (parts.length === 3) {
            enhanced.fixAction = {
              type: 'auto',
              description: 'Convert date format',
              value: `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`,
            };
          }
        }
        break;

      case 'pattern':
        if (error.columnCode === 'c0010' && error.message.includes('LEI')) {
          enhanced.aiSuggestion = `LEI codes must be exactly 20 alphanumeric characters. You can look up valid LEI codes at gleif.org`;
        }
        break;

      case 'enum':
        enhanced.aiSuggestion = `The value must be from the ESA enumeration. Check the EBA Data Point Model for valid codes.`;
        break;

      case 'unique':
        enhanced.aiSuggestion = `Duplicate values are not allowed. Consider using a unique identifier or removing the duplicate entry.`;
        break;

      default:
        enhanced.aiSuggestion = error.suggestion || `Review and correct the value for ${error.columnCode}`;
    }

    return enhanced;
  });
}
