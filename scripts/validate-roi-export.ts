/**
 * DORA RoI Export Validation Script
 *
 * This script validates RoI exports against ESA requirements before submission.
 * Based on ESA taxonomy 4.0 and validation rules.
 */

// ESA Enumeration Formats
export const ESA_ENUMERATIONS = {
  // Country codes (eba_GA:XX)
  countries: {
    format: 'eba_GA:{code}',
    validCodes: ['DE', 'AT', 'BE', 'BG', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'GR',
                 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO',
                 'SK', 'SI', 'ES', 'SE', 'HR', 'IS', 'LI', 'NO', 'GB', 'US', 'CH']
  },

  // Entity types (eba_TA:XX)
  entityTypes: {
    format: 'eba_TA:{code}',
    validCodes: ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10']
  },

  // Identifier types (eba_qCO:qxXXXX)
  identifierTypes: {
    format: 'eba_qCO:{code}',
    validCodes: ['qx2000', 'qx2001', 'qx2002', 'qx2003', 'qx2004', 'qx2005', 'qx0']
    // qx2000 = LEI, qx2001 = National code, qx2002 = EUID, etc.
  },

  // Contractual arrangement types (eba_CO:XX)
  contractTypes: {
    format: 'eba_CO:{code}',
    validCodes: ['x1', 'x2', 'x3', 'x4', 'x5']
  },

  // Service types (eba_TA:TA4)
  serviceTypes: {
    format: 'eba_TA:{code}',
    validCodes: ['TA4'] // ICT services
  },

  // Boolean (eba_BT:xXX)
  booleans: {
    format: 'eba_BT:{code}',
    validCodes: ['x28', 'x29'] // x28 = true, x29 = false
  },

  // Substitutability levels (eba_ZZ:ZZ110)
  substitutability: {
    format: 'eba_ZZ:{code}',
    validCodes: ['x791', 'x792', 'x793', 'x794']
  },

  // Reintegration possibility (eba_ZZ:ZZ112)
  reintegration: {
    format: 'eba_ZZ:{code}',
    validCodes: ['x795', 'x796', 'x797']
  }
};

// LEI Validation (ISO 17442)
export function validateLEI(lei: string): { valid: boolean; error?: string } {
  if (!lei || lei.length !== 20) {
    return { valid: false, error: 'LEI must be exactly 20 characters' };
  }

  if (!/^[A-Z0-9]+$/.test(lei)) {
    return { valid: false, error: 'LEI must contain only uppercase letters and digits' };
  }

  // MOD 97-10 checksum validation
  const converted = lei.split('').map(char => {
    const code = char.charCodeAt(0);
    return code >= 65 ? (code - 55).toString() : char;
  }).join('');

  let remainder = '';
  for (const char of converted) {
    remainder = (parseInt(remainder + char, 10) % 97).toString();
  }

  if (parseInt(remainder, 10) !== 1) {
    return { valid: false, error: 'LEI checksum validation failed' };
  }

  return { valid: true };
}

// Date format validation (YYYY-MM-DD)
export function validateDate(dateStr: string): { valid: boolean; error?: string } {
  if (!dateStr) return { valid: true }; // Optional dates

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { valid: false, error: `Invalid date format: ${dateStr}. Expected YYYY-MM-DD` };
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, error: `Invalid date: ${dateStr}` };
  }

  return { valid: true };
}

// ESA Column Headers by Template
export const ESA_TEMPLATE_COLUMNS: Record<string, string[]> = {
  'b_01.01': ['c0010', 'c0020', 'c0030'],
  'b_01.02': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110', 'c0120', 'c0130', 'c0140', 'c0150', 'c0160', 'c0170', 'c0180'],
  'b_02.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110', 'c0120', 'c0130', 'c0140', 'c0150', 'c0160', 'c0170', 'c0180', 'c0190', 'c0200'],
  'b_02.02': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110', 'c0120', 'c0130', 'c0140', 'c0150', 'c0160', 'c0170', 'c0180'],
  'b_03.01': ['c0010', 'c0020', 'c0030'],
  'b_03.02': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100'],
  'b_04.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110', 'c0120'],
  'b_05.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080'],
  'b_05.02': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080'],
  'b_06.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100'],
  'b_07.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060'],
  'b_99.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080'],
  'b_99.02': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060']
};

// Required fields by template (c0010 is usually the primary key)
export const REQUIRED_FIELDS: Record<string, string[]> = {
  'b_01.01': ['c0010'],
  'b_01.02': ['c0010', 'c0020', 'c0040', 'c0050'],
  'b_02.01': ['c0010', 'c0020', 'c0040'],
  'b_02.02': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050'],
  'b_03.01': ['c0010', 'c0020'],
  'b_03.02': ['c0010', 'c0020', 'c0030'],
  'b_04.01': ['c0010', 'c0020', 'c0030'],
  'b_05.01': ['c0010', 'c0020', 'c0030'],
  'b_05.02': ['c0010', 'c0020', 'c0030'],
  'b_06.01': ['c0010', 'c0020', 'c0030'],
  'b_07.01': ['c0010', 'c0020', 'c0030'],
  'b_99.01': ['c0010', 'c0020', 'c0030'],
  'b_99.02': ['c0010', 'c0020']
};

// Validation Error Types
export interface ValidationError {
  code: string;
  severity: 'error' | 'warning';
  template: string;
  row?: number;
  column?: string;
  message: string;
  value?: string;
}

// Validate a single CSV file
export function validateTemplate(
  templateId: string,
  headers: string[],
  rows: Record<string, string>[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const expectedColumns = ESA_TEMPLATE_COLUMNS[templateId];
  const requiredFields = REQUIRED_FIELDS[templateId] || [];

  // Check column headers
  if (!expectedColumns) {
    errors.push({
      code: '720',
      severity: 'error',
      template: templateId,
      message: `Unknown template: ${templateId}`
    });
    return errors;
  }

  // Verify headers match expected columns
  const missingColumns = expectedColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    errors.push({
      code: '808',
      severity: 'error',
      template: templateId,
      message: `Missing columns: ${missingColumns.join(', ')}`
    });
  }

  // Check for primary key (c0010) uniqueness
  const primaryKeys = new Set<string>();
  rows.forEach((row, index) => {
    const pk = row['c0010'];
    if (pk) {
      if (primaryKeys.has(pk)) {
        errors.push({
          code: '806',
          severity: 'warning',
          template: templateId,
          row: index + 1,
          column: 'c0010',
          message: `Duplicate primary key: ${pk}`,
          value: pk
        });
      }
      primaryKeys.add(pk);
    }
  });

  // Validate each row
  rows.forEach((row, index) => {
    // Check required fields
    requiredFields.forEach(field => {
      const value = row[field];
      if (value === null || value === undefined || value === '') {
        errors.push({
          code: 'v8886_m',
          severity: 'warning',
          template: templateId,
          row: index + 1,
          column: field,
          message: `Missing required field: ${field}`
        });
      }
    });

    // Validate LEI fields
    Object.entries(row).forEach(([col, value]) => {
      if (value && col.includes('lei') || (value && value.length === 20 && /^[A-Z0-9]+$/.test(value))) {
        const leiResult = validateLEI(value);
        if (!leiResult.valid) {
          errors.push({
            code: 'VR_71',
            severity: 'warning',
            template: templateId,
            row: index + 1,
            column: col,
            message: `Invalid LEI: ${leiResult.error}`,
            value: value
          });
        }
      }
    });

    // Validate date fields
    Object.entries(row).forEach(([col, value]) => {
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const dateResult = validateDate(value);
        if (!dateResult.valid) {
          errors.push({
            code: 'v8850_m',
            severity: 'warning',
            template: templateId,
            row: index + 1,
            column: col,
            message: dateResult.error || 'Invalid date',
            value: value
          });
        }
      }
    });
  });

  return errors;
}

// Validate cross-template references
export function validateReferences(
  templates: Record<string, Record<string, string>[]>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // B_03.01 contracts should reference providers from B_02.02
  if (templates['b_03.01'] && templates['b_02.02']) {
    const providerLEIs = new Set(templates['b_02.02'].map(r => r['c0010']));
    templates['b_03.01'].forEach((row, index) => {
      const providerRef = row['c0020']; // Provider reference
      if (providerRef && !providerLEIs.has(providerRef)) {
        errors.push({
          code: '807',
          severity: 'error',
          template: 'b_03.01',
          row: index + 1,
          column: 'c0020',
          message: `Foreign key constraint: Provider ${providerRef} not found in B_02.02`,
          value: providerRef
        });
      }
    });
  }

  // B_04.01 services should reference contracts from B_03.01
  if (templates['b_04.01'] && templates['b_03.01']) {
    const contractIds = new Set(templates['b_03.01'].map(r => r['c0010']));
    templates['b_04.01'].forEach((row, index) => {
      const contractRef = row['c0020']; // Contract reference
      if (contractRef && !contractIds.has(contractRef)) {
        errors.push({
          code: '807',
          severity: 'error',
          template: 'b_04.01',
          row: index + 1,
          column: 'c0020',
          message: `Foreign key constraint: Contract ${contractRef} not found in B_03.01`,
          value: contractRef
        });
      }
    });
  }

  // B_07.01 should reference both functions (B_06.01) and services (B_04.01)
  if (templates['b_07.01']) {
    const functionIds = templates['b_06.01']
      ? new Set(templates['b_06.01'].map(r => r['c0010']))
      : new Set();
    const serviceIds = templates['b_04.01']
      ? new Set(templates['b_04.01'].map(r => r['c0010']))
      : new Set();

    templates['b_07.01'].forEach((row, index) => {
      const functionRef = row['c0020'];
      const serviceRef = row['c0030'];

      if (functionRef && functionIds.size > 0 && !functionIds.has(functionRef)) {
        errors.push({
          code: '807',
          severity: 'error',
          template: 'b_07.01',
          row: index + 1,
          column: 'c0020',
          message: `Foreign key constraint: Function ${functionRef} not found in B_06.01`,
          value: functionRef
        });
      }

      if (serviceRef && serviceIds.size > 0 && !serviceIds.has(serviceRef)) {
        errors.push({
          code: '807',
          severity: 'error',
          template: 'b_07.01',
          row: index + 1,
          column: 'c0030',
          message: `Foreign key constraint: Service ${serviceRef} not found in B_04.01`,
          value: serviceRef
        });
      }
    });
  }

  return errors;
}

// Full validation suite
export function validateRoIPackage(
  templates: Record<string, { headers: string[]; rows: Record<string, string>[] }>
): {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    errorsByTemplate: Record<string, number>;
    errorsByCode: Record<string, number>;
  };
} {
  const allErrors: ValidationError[] = [];

  // Validate each template
  Object.entries(templates).forEach(([templateId, { headers, rows }]) => {
    const templateErrors = validateTemplate(templateId, headers, rows);
    allErrors.push(...templateErrors);
  });

  // Validate cross-references
  const rowsOnly = Object.fromEntries(
    Object.entries(templates).map(([id, { rows }]) => [id, rows])
  );
  const refErrors = validateReferences(rowsOnly);
  allErrors.push(...refErrors);

  // Separate errors and warnings
  const errors = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');

  // Generate summary
  const errorsByTemplate: Record<string, number> = {};
  const errorsByCode: Record<string, number> = {};

  allErrors.forEach(e => {
    errorsByTemplate[e.template] = (errorsByTemplate[e.template] || 0) + 1;
    errorsByCode[e.code] = (errorsByCode[e.code] || 0) + 1;
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      errorsByTemplate,
      errorsByCode
    }
  };
}

// Export for use in API routes
const roiExportValidator = {
  validateLEI,
  validateDate,
  validateTemplate,
  validateReferences,
  validateRoIPackage,
  ESA_ENUMERATIONS,
  ESA_TEMPLATE_COLUMNS,
  REQUIRED_FIELDS
};

export default roiExportValidator;
