/**
 * ESA Validation Rules
 *
 * Field-level and cross-field validation rules for RoI templates
 */

import type { RoiTemplateId, ValidationSeverity } from '../types';

// ============================================================================
// Rule Types
// ============================================================================

export type RuleType =
  | 'required'
  | 'format'
  | 'maxLength'
  | 'minLength'
  | 'pattern'
  | 'enum'
  | 'range'
  | 'date'
  | 'reference'
  | 'unique'
  | 'custom';

export interface ValidationRule {
  type: RuleType;
  severity: ValidationSeverity;
  message: string;
  suggestion?: string;
  params?: Record<string, unknown>;
  validate: (value: unknown, row?: Record<string, unknown>, allRows?: Record<string, unknown>[]) => boolean;
}

export interface FieldRules {
  columnCode: string;
  description: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  rules: ValidationRule[];
}

export type TemplateRules = Record<string, FieldRules>;

// ============================================================================
// Common Validators
// ============================================================================

const validators = {
  required: (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  },

  maxLength: (value: unknown, max: number): boolean => {
    if (value === null || value === undefined) return true;
    return String(value).length <= max;
  },

  minLength: (value: unknown, min: number): boolean => {
    if (value === null || value === undefined) return true;
    return String(value).length >= min;
  },

  pattern: (value: unknown, pattern: RegExp): boolean => {
    if (value === null || value === undefined) return true;
    return pattern.test(String(value));
  },

  dateFormat: (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(String(value))) return false;
    const date = new Date(String(value));
    return !isNaN(date.getTime());
  },

  ebaEnum: (value: unknown, prefix: string): boolean => {
    if (value === null || value === undefined) return true;
    return String(value).startsWith(prefix);
  },

  lei: (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    const leiRegex = /^[A-Z0-9]{20}$/;
    return leiRegex.test(String(value));
  },

  number: (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    return !isNaN(Number(value));
  },

  positive: (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    return Number(value) >= 0;
  },

  boolean: (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    return typeof value === 'boolean' || value === 'true' || value === 'false';
  },
};

// ============================================================================
// Common Rules Factory
// ============================================================================

function requiredRule(description: string): ValidationRule {
  return {
    type: 'required',
    severity: 'error',
    message: `${description} is required`,
    suggestion: `Please provide a value for ${description}`,
    validate: validators.required,
  };
}

function maxLengthRule(max: number, description: string): ValidationRule {
  return {
    type: 'maxLength',
    severity: 'error',
    message: `${description} exceeds maximum length of ${max} characters`,
    suggestion: `Shorten the value to ${max} characters or less`,
    params: { max },
    validate: (value) => validators.maxLength(value, max),
  };
}

function dateFormatRule(description: string): ValidationRule {
  return {
    type: 'date',
    severity: 'error',
    message: `${description} must be in YYYY-MM-DD format`,
    suggestion: 'Enter date as YYYY-MM-DD (e.g., 2024-12-31)',
    validate: validators.dateFormat,
  };
}

function leiRule(description: string): ValidationRule {
  return {
    type: 'pattern',
    severity: 'error',
    message: `${description} must be a valid 20-character LEI code`,
    suggestion: 'LEI codes are exactly 20 alphanumeric characters (e.g., 529900HNOAA1KXQJUQ27)',
    validate: validators.lei,
  };
}

function ebaEnumRule(prefix: string, description: string): ValidationRule {
  return {
    type: 'enum',
    severity: 'error',
    message: `${description} must use EBA enumeration starting with ${prefix}`,
    suggestion: `Use a valid EBA code like ${prefix}x1`,
    params: { prefix },
    validate: (value) => validators.ebaEnum(value, prefix),
  };
}

function positiveNumberRule(description: string): ValidationRule {
  return {
    type: 'range',
    severity: 'warning',
    message: `${description} should be a positive number`,
    suggestion: 'Enter a positive numeric value',
    validate: (value) => validators.number(value) && validators.positive(value),
  };
}

// ============================================================================
// B_01.01 Rules - Entity Maintaining Register
// ============================================================================

export const B_01_01_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'LEI of entity maintaining register',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('LEI'),
      leiRule('LEI'),
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'Name of entity',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Entity name'),
      maxLengthRule(500, 'Entity name'),
    ],
  },
  c0030: {
    columnCode: 'c0030',
    description: 'Country of entity',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Country'),
      ebaEnumRule('eba_GA:', 'Country code'),
    ],
  },
  c0040: {
    columnCode: 'c0040',
    description: 'Type of entity',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Entity type'),
      ebaEnumRule('eba_CT:', 'Entity type'),
    ],
  },
  c0050: {
    columnCode: 'c0050',
    description: 'Competent Authority',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Competent authority'),
      maxLengthRule(200, 'Competent authority'),
    ],
  },
  c0060: {
    columnCode: 'c0060',
    description: 'Date of reporting',
    dataType: 'date',
    required: true,
    rules: [
      requiredRule('Reporting date'),
      dateFormatRule('Reporting date'),
    ],
  },
};

// ============================================================================
// B_01.02 Rules - Entities in Scope
// ============================================================================

export const B_01_02_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'LEI of entity',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('LEI'),
      leiRule('LEI'),
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'Name of entity',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Entity name'),
      maxLengthRule(500, 'Entity name'),
    ],
  },
  c0030: {
    columnCode: 'c0030',
    description: 'Country of entity',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Country'),
      ebaEnumRule('eba_GA:', 'Country code'),
    ],
  },
  c0040: {
    columnCode: 'c0040',
    description: 'Type of entity',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Entity type'),
      ebaEnumRule('eba_CT:', 'Entity type'),
    ],
  },
  c0070: {
    columnCode: 'c0070',
    description: 'Date of last update',
    dataType: 'date',
    required: true,
    rules: [
      requiredRule('Last update date'),
      dateFormatRule('Last update date'),
    ],
  },
  c0080: {
    columnCode: 'c0080',
    description: 'Date of integration',
    dataType: 'date',
    required: true,
    rules: [
      requiredRule('Integration date'),
      dateFormatRule('Integration date'),
    ],
  },
  c0100: {
    columnCode: 'c0100',
    description: 'Currency',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Currency'),
      ebaEnumRule('eba_CU:', 'Currency code'),
    ],
  },
};

// ============================================================================
// B_01.03 Rules - Branches
// ============================================================================

export const B_01_03_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Branch identification code',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Branch ID'),
      maxLengthRule(100, 'Branch ID'),
      {
        type: 'pattern',
        severity: 'warning',
        message: 'Branch ID should be alphanumeric with hyphens/underscores',
        validate: (value) => validators.pattern(value, /^[A-Za-z0-9_-]+$/),
      },
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'LEI of head office',
    dataType: 'string',
    required: true,
    rules: [requiredRule('Organization LEI'), leiRule('Organization LEI')],
  },
  c0030: {
    columnCode: 'c0030',
    description: 'Branch name',
    dataType: 'string',
    required: true,
    rules: [requiredRule('Branch name'), maxLengthRule(500, 'Branch name')],
  },
  c0040: {
    columnCode: 'c0040',
    description: 'Country of branch',
    dataType: 'string',
    required: true,
    rules: [requiredRule('Country'), ebaEnumRule('eba_GA:', 'Country code')],
  },
};

// ============================================================================
// B_02.01 Rules - Contracts Overview
// ============================================================================

export const B_02_01_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Contract reference number',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Contract reference'),
      maxLengthRule(100, 'Contract reference'),
      {
        type: 'pattern',
        severity: 'warning',
        message: 'Contract reference should contain only alphanumeric characters, hyphens, and underscores',
        validate: (value) => validators.pattern(value, /^[A-Za-z0-9_-]+$/),
      },
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'Type of contractual arrangement',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Contract type'),
      ebaEnumRule('eba_CO:', 'Contract type'),
    ],
  },
  c0040: {
    columnCode: 'c0040',
    description: 'Currency',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Currency'),
      ebaEnumRule('eba_CU:', 'Currency code'),
    ],
  },
  c0050: {
    columnCode: 'c0050',
    description: 'Annual expense',
    dataType: 'number',
    required: false,
    rules: [
      positiveNumberRule('Annual expense'),
    ],
  },
};

// ============================================================================
// B_02.02 Rules - Contract Details
// ============================================================================

export const B_02_02_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Contract reference number',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Contract reference'),
      maxLengthRule(100, 'Contract reference'),
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'LEI of entity using service',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Entity LEI'),
      leiRule('Entity LEI'),
    ],
  },
  c0030: {
    columnCode: 'c0030',
    description: 'Provider identification code',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Provider ID'),
    ],
  },
  c0040: {
    columnCode: 'c0040',
    description: 'Provider code type',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Provider code type'),
      ebaEnumRule('eba_qCO:', 'Provider code type'),
    ],
  },
  c0060: {
    columnCode: 'c0060',
    description: 'Type of ICT services',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Service type'),
      ebaEnumRule('eba_TA:', 'Service type'),
    ],
  },
  c0070: {
    columnCode: 'c0070',
    description: 'Start date',
    dataType: 'date',
    required: true,
    rules: [
      requiredRule('Start date'),
      dateFormatRule('Start date'),
    ],
  },
  c0120: {
    columnCode: 'c0120',
    description: 'Governing law country',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Governing law'),
      ebaEnumRule('eba_GA:', 'Governing law country'),
    ],
  },
  c0130: {
    columnCode: 'c0130',
    description: 'Service provision country',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Service country'),
      ebaEnumRule('eba_GA:', 'Service country'),
    ],
  },
  c0140: {
    columnCode: 'c0140',
    description: 'Storage of data',
    dataType: 'boolean',
    required: true,
    rules: [
      requiredRule('Data storage flag'),
      {
        type: 'custom',
        severity: 'error',
        message: 'Data storage must be true or false',
        validate: validators.boolean,
      },
    ],
  },
  c0170: {
    columnCode: 'c0170',
    description: 'Data sensitiveness',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Data sensitiveness'),
      ebaEnumRule('eba_ZZ:', 'Data sensitiveness'),
    ],
  },
};

// ============================================================================
// B_02.03 Rules - Linked Contractual Arrangements
// ============================================================================

export const B_02_03_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Contract reference number',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Contract reference'),
      maxLengthRule(100, 'Contract reference'),
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'Linked contract reference number',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Linked contract reference'),
      maxLengthRule(100, 'Linked contract reference'),
    ],
  },
  c0030: {
    columnCode: 'c0030',
    description: 'Type of link',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Link type'),
      ebaEnumRule('eba_LT:', 'Link type'),
    ],
  },
};

// ============================================================================
// B_03.01 Rules - Entity-Arrangement Links
// ============================================================================

export const B_03_01_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Contract reference number',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Contract reference'),
      maxLengthRule(100, 'Contract reference'),
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'LEI of entity using arrangement',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Entity LEI'),
      leiRule('Entity LEI'),
    ],
  },
  c0030: {
    columnCode: 'c0030',
    description: 'Entity uses arrangement flag',
    dataType: 'boolean',
    required: true,
    rules: [
      requiredRule('Uses arrangement flag'),
      {
        type: 'custom',
        severity: 'error',
        message: 'Uses arrangement must be true or false',
        validate: validators.boolean,
      },
    ],
  },
};

// ============================================================================
// B_03.02 Rules - Provider-Arrangement Links
// ============================================================================

export const B_03_02_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Contract reference number',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Contract reference'),
      maxLengthRule(100, 'Contract reference'),
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'Provider identification code',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Provider ID'),
    ],
  },
  c0030: {
    columnCode: 'c0030',
    description: 'Provider code type',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Provider code type'),
      ebaEnumRule('eba_qCO:', 'Provider code type'),
    ],
  },
};

// ============================================================================
// B_03.03 Rules - Intra-Group Provider Links
// ============================================================================

export const B_03_03_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Contract reference number',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Contract reference'),
      maxLengthRule(100, 'Contract reference'),
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'LEI of intra-group provider',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Group entity LEI'),
      leiRule('Group entity LEI'),
    ],
  },
  c0031: {
    columnCode: 'c0031',
    description: 'Intra-group arrangement flag',
    dataType: 'boolean',
    required: true,
    rules: [
      requiredRule('Intra-group flag'),
      {
        type: 'custom',
        severity: 'error',
        message: 'Intra-group flag must be true or false',
        validate: validators.boolean,
      },
    ],
  },
};

// ============================================================================
// B_04.01 Rules - Service Recipients
// ============================================================================

export const B_04_01_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Contract reference number',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Contract reference'),
      maxLengthRule(100, 'Contract reference'),
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'LEI of entity using service',
    dataType: 'string',
    required: true,
    rules: [requiredRule('Entity LEI'), leiRule('Entity LEI')],
  },
  c0030: {
    columnCode: 'c0030',
    description: 'Nature of entity',
    dataType: 'string',
    required: true,
    rules: [requiredRule('Entity nature'), ebaEnumRule('eba_BT:', 'Entity nature')],
  },
  c0040: {
    columnCode: 'c0040',
    description: 'Branch identification code',
    dataType: 'string',
    required: false,
    rules: [maxLengthRule(100, 'Branch code')],
  },
};

// ============================================================================
// B_05.01 Rules - ICT Providers
// ============================================================================

export const B_05_01_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Provider identification code',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Provider ID'),
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'Provider code type',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Provider code type'),
      ebaEnumRule('eba_qCO:', 'Provider code type'),
    ],
  },
  c0050: {
    columnCode: 'c0050',
    description: 'Legal name',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Legal name'),
      maxLengthRule(500, 'Legal name'),
    ],
  },
  c0070: {
    columnCode: 'c0070',
    description: 'Type of person',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Person type'),
      ebaEnumRule('eba_CT:', 'Person type'),
    ],
  },
  c0080: {
    columnCode: 'c0080',
    description: 'Headquarters country',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Headquarters country'),
      ebaEnumRule('eba_GA:', 'Headquarters country'),
    ],
  },
  c0090: {
    columnCode: 'c0090',
    description: 'Currency',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Currency'),
      ebaEnumRule('eba_CU:', 'Currency code'),
    ],
  },
};

// ============================================================================
// B_05.02 Rules - Subcontracting Chain
// ============================================================================

export const B_05_02_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Contract reference number',
    dataType: 'string',
    required: true,
    rules: [requiredRule('Contract reference'), maxLengthRule(100, 'Contract reference')],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'Type of ICT services',
    dataType: 'string',
    required: true,
    rules: [requiredRule('Service type'), ebaEnumRule('eba_TA:', 'Service type')],
  },
  c0030: {
    columnCode: 'c0030',
    description: 'Provider identification code',
    dataType: 'string',
    required: true,
    rules: [requiredRule('Provider ID'), maxLengthRule(100, 'Provider ID')],
  },
  c0040: {
    columnCode: 'c0040',
    description: 'Provider code type',
    dataType: 'string',
    required: true,
    rules: [requiredRule('Provider code type'), ebaEnumRule('eba_qCO:', 'Provider code type')],
  },
  c0050: {
    columnCode: 'c0050',
    description: 'Rank in subcontracting chain',
    dataType: 'number',
    required: true,
    rules: [
      requiredRule('Tier level'),
      {
        type: 'range',
        severity: 'error',
        message: 'Tier level must be 1-10',
        validate: (value) => {
          const num = Number(value);
          return Number.isInteger(num) && num >= 1 && num <= 10;
        },
      },
    ],
  },
  c0060: {
    columnCode: 'c0060',
    description: 'Subcontractor identification code',
    dataType: 'string',
    required: true,
    rules: [requiredRule('Subcontractor ID'), maxLengthRule(100, 'Subcontractor ID')],
  },
  c0070: {
    columnCode: 'c0070',
    description: 'Subcontractor code type',
    dataType: 'string',
    required: true,
    rules: [requiredRule('Subcontractor code type'), ebaEnumRule('eba_qCO:', 'Subcontractor code type')],
  },
};

// ============================================================================
// B_06.01 Rules - Critical Functions
// ============================================================================

export const B_06_01_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Function identifier',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Function ID'),
      maxLengthRule(100, 'Function ID'),
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'Licensed activity',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Licensed activity'),
    ],
  },
  c0030: {
    columnCode: 'c0030',
    description: 'Function name',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Function name'),
      maxLengthRule(500, 'Function name'),
    ],
  },
  c0040: {
    columnCode: 'c0040',
    description: 'LEI of financial entity',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Entity LEI'),
      leiRule('Entity LEI'),
    ],
  },
  c0050: {
    columnCode: 'c0050',
    description: 'Criticality assessment',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Criticality assessment'),
      ebaEnumRule('eba_ZZ:', 'Criticality assessment'),
    ],
  },
  c0070: {
    columnCode: 'c0070',
    description: 'Last assessment date',
    dataType: 'date',
    required: true,
    rules: [
      requiredRule('Assessment date'),
      dateFormatRule('Assessment date'),
    ],
  },
  c0100: {
    columnCode: 'c0100',
    description: 'Impact of discontinuing',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Impact level'),
      ebaEnumRule('eba_ZZ:', 'Impact level'),
    ],
  },
};

// ============================================================================
// B_07.01 Rules - Exit Arrangements
// ============================================================================

export const B_07_01_RULES: TemplateRules = {
  c0010: {
    columnCode: 'c0010',
    description: 'Contract reference number',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Contract reference'),
      maxLengthRule(100, 'Contract reference'),
    ],
  },
  c0020: {
    columnCode: 'c0020',
    description: 'Provider identification code',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Provider ID'),
    ],
  },
  c0030: {
    columnCode: 'c0030',
    description: 'Provider code type',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Provider code type'),
      ebaEnumRule('eba_qCO:', 'Provider code type'),
    ],
  },
  c0040: {
    columnCode: 'c0040',
    description: 'Type of ICT services',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Service type'),
      ebaEnumRule('eba_TA:', 'Service type'),
    ],
  },
  c0050: {
    columnCode: 'c0050',
    description: 'Substitutability',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Substitutability'),
      ebaEnumRule('eba_ZZ:', 'Substitutability'),
    ],
  },
  c0080: {
    columnCode: 'c0080',
    description: 'Exit plan exists',
    dataType: 'boolean',
    required: true,
    rules: [
      requiredRule('Exit plan flag'),
      {
        type: 'custom',
        severity: 'error',
        message: 'Exit plan must be true or false',
        validate: validators.boolean,
      },
    ],
  },
  c0090: {
    columnCode: 'c0090',
    description: 'Reintegration possibility',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Reintegration possibility'),
      ebaEnumRule('eba_ZZ:', 'Reintegration possibility'),
    ],
  },
  c0100: {
    columnCode: 'c0100',
    description: 'Impact of discontinuing',
    dataType: 'string',
    required: true,
    rules: [
      requiredRule('Impact level'),
      ebaEnumRule('eba_ZZ:', 'Impact level'),
    ],
  },
  c0110: {
    columnCode: 'c0110',
    description: 'Alternatives identified',
    dataType: 'boolean',
    required: true,
    rules: [
      requiredRule('Alternatives flag'),
      {
        type: 'custom',
        severity: 'error',
        message: 'Alternatives must be true or false',
        validate: validators.boolean,
      },
    ],
  },
};

// ============================================================================
// All Template Rules
// ============================================================================

export const TEMPLATE_RULES: Partial<Record<RoiTemplateId, TemplateRules>> = {
  'B_01.01': B_01_01_RULES,
  'B_01.02': B_01_02_RULES,
  'B_01.03': B_01_03_RULES,
  'B_02.01': B_02_01_RULES,
  'B_02.02': B_02_02_RULES,
  'B_02.03': B_02_03_RULES,
  'B_03.01': B_03_01_RULES,
  'B_03.02': B_03_02_RULES,
  'B_03.03': B_03_03_RULES,
  'B_04.01': B_04_01_RULES,
  'B_05.01': B_05_01_RULES,
  'B_05.02': B_05_02_RULES,
  'B_06.01': B_06_01_RULES,
  'B_07.01': B_07_01_RULES,
};

// ============================================================================
// Cross-Field Validation Rules
// ============================================================================

export interface CrossFieldRule {
  templateId: RoiTemplateId;
  name: string;
  description: string;
  severity: ValidationSeverity;
  validate: (rows: Record<string, unknown>[]) => { valid: boolean; errors: string[] };
}

// ============================================================================
// Cross-Template Validation Rules
// ============================================================================

export interface CrossTemplateRule {
  name: string;
  description: string;
  severity: ValidationSeverity;
  sourceTemplate: RoiTemplateId;
  targetTemplate: RoiTemplateId;
  sourceField: string;
  targetField: string;
  validate: (
    sourceData: Record<string, unknown>[],
    targetData: Record<string, unknown>[]
  ) => { valid: boolean; errors: string[] };
}

export const CROSS_TEMPLATE_RULES: CrossTemplateRule[] = [
  {
    name: 'contract_provider_exists',
    description: 'Contract providers must exist in B_05.01',
    severity: 'error',
    sourceTemplate: 'B_02.02',
    targetTemplate: 'B_05.01',
    sourceField: 'c0030',
    targetField: 'c0010',
    validate: (contracts, providers) => {
      const errors: string[] = [];
      const providerIds = new Set(providers.map(p => p.c0010 as string).filter(Boolean));

      contracts.forEach((contract, i) => {
        const providerId = contract.c0030 as string;
        if (providerId && !providerIds.has(providerId)) {
          errors.push(
            `B_02.02 Row ${i + 1}: Provider "${providerId}" not found in B_05.01 (ICT Providers). Add the provider first.`
          );
        }
      });

      return { valid: errors.length === 0, errors };
    },
  },
  {
    name: 'contract_entity_exists',
    description: 'Contract entities must exist in B_01.02',
    severity: 'error',
    sourceTemplate: 'B_02.02',
    targetTemplate: 'B_01.02',
    sourceField: 'c0020',
    targetField: 'c0010',
    validate: (contracts, entities) => {
      const errors: string[] = [];
      const entityLeis = new Set(entities.map(e => e.c0010 as string).filter(Boolean));

      contracts.forEach((contract, i) => {
        const entityLei = contract.c0020 as string;
        if (entityLei && !entityLeis.has(entityLei)) {
          errors.push(
            `B_02.02 Row ${i + 1}: Entity LEI "${entityLei}" not found in B_01.02 (Entities in Scope). Register the entity first.`
          );
        }
      });

      return { valid: errors.length === 0, errors };
    },
  },
  {
    name: 'linked_contract_exists',
    description: 'Linked contracts must exist in B_02.01',
    severity: 'error',
    sourceTemplate: 'B_02.03',
    targetTemplate: 'B_02.01',
    sourceField: 'c0020',
    targetField: 'c0010',
    validate: (links, contracts) => {
      const errors: string[] = [];
      const contractRefs = new Set(contracts.map(c => c.c0010 as string).filter(Boolean));

      links.forEach((link, i) => {
        const linkedRef = link.c0020 as string;
        const sourceRef = link.c0010 as string;

        if (linkedRef && !contractRefs.has(linkedRef)) {
          errors.push(
            `B_02.03 Row ${i + 1}: Linked contract "${linkedRef}" not found in B_02.01. Create the contract first.`
          );
        }
        if (sourceRef && !contractRefs.has(sourceRef)) {
          errors.push(
            `B_02.03 Row ${i + 1}: Source contract "${sourceRef}" not found in B_02.01.`
          );
        }
      });

      return { valid: errors.length === 0, errors };
    },
  },
  {
    name: 'branch_entity_exists',
    description: 'Branch head offices must exist in B_01.02',
    severity: 'error',
    sourceTemplate: 'B_01.03',
    targetTemplate: 'B_01.02',
    sourceField: 'c0020',
    targetField: 'c0010',
    validate: (branches, entities) => {
      const errors: string[] = [];
      const entityLeis = new Set(entities.map(e => e.c0010 as string).filter(Boolean));

      branches.forEach((branch, i) => {
        const headOfficeLei = branch.c0020 as string;
        if (headOfficeLei && !entityLeis.has(headOfficeLei)) {
          errors.push(
            `B_01.03 Row ${i + 1}: Head office LEI "${headOfficeLei}" not found in B_01.02. Register the entity first.`
          );
        }
      });

      return { valid: errors.length === 0, errors };
    },
  },
  {
    name: 'critical_function_entity_exists',
    description: 'Critical function entities must exist in B_01.02',
    severity: 'error',
    sourceTemplate: 'B_06.01',
    targetTemplate: 'B_01.02',
    sourceField: 'c0040',
    targetField: 'c0010',
    validate: (functions, entities) => {
      const errors: string[] = [];
      const entityLeis = new Set(entities.map(e => e.c0010 as string).filter(Boolean));

      functions.forEach((func, i) => {
        const entityLei = func.c0040 as string;
        if (entityLei && !entityLeis.has(entityLei)) {
          errors.push(
            `B_06.01 Row ${i + 1}: Entity LEI "${entityLei}" not found in B_01.02. Register the entity first.`
          );
        }
      });

      return { valid: errors.length === 0, errors };
    },
  },
  {
    name: 'exit_arrangement_contract_exists',
    description: 'Exit arrangements must reference existing contracts',
    severity: 'error',
    sourceTemplate: 'B_07.01',
    targetTemplate: 'B_02.01',
    sourceField: 'c0010',
    targetField: 'c0010',
    validate: (exits, contracts) => {
      const errors: string[] = [];
      const contractRefs = new Set(contracts.map(c => c.c0010 as string).filter(Boolean));

      exits.forEach((exit, i) => {
        const contractRef = exit.c0010 as string;
        if (contractRef && !contractRefs.has(contractRef)) {
          errors.push(
            `B_07.01 Row ${i + 1}: Contract "${contractRef}" not found in B_02.01. Create the contract first.`
          );
        }
      });

      return { valid: errors.length === 0, errors };
    },
  },
  {
    name: 'subcontracting_contract_exists',
    description: 'Subcontracting chains must reference existing contracts',
    severity: 'error',
    sourceTemplate: 'B_05.02',
    targetTemplate: 'B_02.01',
    sourceField: 'c0010',
    targetField: 'c0010',
    validate: (subcontracts, contracts) => {
      const errors: string[] = [];
      const contractRefs = new Set(contracts.map(c => c.c0010 as string).filter(Boolean));

      subcontracts.forEach((sub, i) => {
        const contractRef = sub.c0010 as string;
        if (contractRef && !contractRefs.has(contractRef)) {
          errors.push(
            `B_05.02 Row ${i + 1}: Contract "${contractRef}" not found in B_02.01.`
          );
        }
      });

      return { valid: errors.length === 0, errors };
    },
  },
  {
    name: 'maintaining_entity_in_scope',
    description: 'Entity maintaining register must be in entities scope',
    severity: 'warning',
    sourceTemplate: 'B_01.01',
    targetTemplate: 'B_01.02',
    sourceField: 'c0010',
    targetField: 'c0010',
    validate: (maintaining, entities) => {
      const errors: string[] = [];
      const entityLeis = new Set(entities.map(e => e.c0010 as string).filter(Boolean));

      maintaining.forEach((m, i) => {
        const lei = m.c0010 as string;
        if (lei && !entityLeis.has(lei)) {
          errors.push(
            `B_01.01 Row ${i + 1}: Entity maintaining register (${lei}) should also be included in B_01.02 (Entities in Scope).`
          );
        }
      });

      return { valid: errors.length === 0, errors };
    },
  },
];

export const CROSS_FIELD_RULES: CrossFieldRule[] = [
  {
    templateId: 'B_02.02',
    name: 'date_consistency',
    description: 'End date must be after start date',
    severity: 'error',
    validate: (rows) => {
      const errors: string[] = [];
      rows.forEach((row, i) => {
        const start = row.c0070 as string;
        const end = row.c0080 as string;
        if (start && end && new Date(start) >= new Date(end)) {
          errors.push(`Row ${i + 1}: End date (${end}) must be after start date (${start})`);
        }
      });
      return { valid: errors.length === 0, errors };
    },
  },
  {
    templateId: 'B_01.02',
    name: 'unique_lei',
    description: 'Each entity LEI must be unique',
    severity: 'error',
    validate: (rows) => {
      const errors: string[] = [];
      const leis = new Set<string>();
      rows.forEach((row, i) => {
        const lei = row.c0010 as string;
        if (lei) {
          if (leis.has(lei)) {
            errors.push(`Row ${i + 1}: Duplicate LEI found: ${lei}`);
          }
          leis.add(lei);
        }
      });
      return { valid: errors.length === 0, errors };
    },
  },
  {
    templateId: 'B_02.01',
    name: 'unique_contract_ref',
    description: 'Each contract reference must be unique',
    severity: 'error',
    validate: (rows) => {
      const errors: string[] = [];
      const refs = new Set<string>();
      rows.forEach((row, i) => {
        const ref = row.c0010 as string;
        if (ref) {
          if (refs.has(ref)) {
            errors.push(`Row ${i + 1}: Duplicate contract reference: ${ref}`);
          }
          refs.add(ref);
        }
      });
      return { valid: errors.length === 0, errors };
    },
  },
  {
    templateId: 'B_01.03',
    name: 'unique_branch_id',
    description: 'Each branch must have unique ID',
    severity: 'error',
    validate: (rows) => {
      const ids = new Set<string>();
      const errors: string[] = [];
      rows.forEach((row, i) => {
        const id = row.c0010 as string;
        if (id) {
          if (ids.has(id)) {
            errors.push(`Row ${i + 1}: Duplicate branch ID '${id}'`);
          }
          ids.add(id);
        }
      });
      return { valid: errors.length === 0, errors };
    },
  },
  {
    templateId: 'B_05.02',
    name: 'sequential_tiers',
    description: 'Tier levels should be sequential per contract',
    severity: 'warning',
    validate: (rows) => {
      const errors: string[] = [];
      const byContract = new Map<string, number[]>();
      rows.forEach(row => {
        const ref = row.c0010 as string;
        const tier = Number(row.c0050);
        if (ref && !isNaN(tier)) {
          if (!byContract.has(ref)) byContract.set(ref, []);
          byContract.get(ref)!.push(tier);
        }
      });
      byContract.forEach((tiers, ref) => {
        const sorted = [...tiers].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length; i++) {
          if (sorted[i] !== i + 1) {
            errors.push(`Contract ${ref}: Tiers should be sequential starting from 1 (found: ${sorted.join(', ')})`);
            break;
          }
        }
      });
      return { valid: errors.length === 0, errors };
    },
  },
];
