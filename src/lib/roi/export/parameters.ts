/**
 * Parameters CSV Generator
 *
 * Generates the parameters.csv file for xBRL-CSV packages
 */

import type { RoiPackageParameters } from '../types';

// ============================================================================
// Parameters CSV Structure
// ============================================================================

/**
 * ESA parameters.csv format:
 *
 * name,value
 * entityID,rs:LEI123456789012345678
 * refPeriod,2024-12-31
 * baseCurrency,iso4217:EUR
 * decimalsInteger,0
 * decimalsMonetary,-3
 */

// ============================================================================
// Generator
// ============================================================================

export function generateParametersCsv(params: RoiPackageParameters): string {
  const lines: string[] = [
    'name,value',
    `entityID,${params.entityId}`,
    `refPeriod,${params.refPeriod}`,
    `baseCurrency,${params.baseCurrency}`,
    `decimalsInteger,${params.decimalsInteger}`,
    `decimalsMonetary,${params.decimalsMonetary}`,
  ];

  return lines.join('\n') + '\n';
}

// ============================================================================
// Default Parameters
// ============================================================================

export function getDefaultParameters(lei: string, reportingDate?: string): RoiPackageParameters {
  // Default to end of current year if no date provided
  const refPeriod = reportingDate || new Date().toISOString().split('T')[0];

  return {
    entityId: `rs:${lei}`,
    refPeriod,
    baseCurrency: 'iso4217:EUR',
    decimalsInteger: 0,
    decimalsMonetary: -3, // Thousands
  };
}

// ============================================================================
// Parser
// ============================================================================

export function parseParametersCsv(csv: string): Partial<RoiPackageParameters> {
  const lines = csv.trim().split('\n');
  const params: Partial<RoiPackageParameters> = {};

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const [name, value] = lines[i].split(',');

    switch (name) {
      case 'entityID':
        params.entityId = value;
        break;
      case 'refPeriod':
        params.refPeriod = value;
        break;
      case 'baseCurrency':
        params.baseCurrency = value;
        break;
      case 'decimalsInteger':
        params.decimalsInteger = parseInt(value, 10);
        break;
      case 'decimalsMonetary':
        params.decimalsMonetary = parseInt(value, 10);
        break;
    }
  }

  return params;
}

// ============================================================================
// Validation
// ============================================================================

export function validateParameters(params: RoiPackageParameters): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Entity ID validation
  if (!params.entityId) {
    errors.push('entityID is required');
  } else if (!params.entityId.startsWith('rs:')) {
    errors.push('entityID must start with "rs:"');
  } else {
    const lei = params.entityId.replace('rs:', '');
    if (!/^[A-Z0-9]{20}$/.test(lei)) {
      errors.push('entityID must contain a valid 20-character LEI');
    }
  }

  // Reference period validation
  if (!params.refPeriod) {
    errors.push('refPeriod is required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(params.refPeriod)) {
    errors.push('refPeriod must be in YYYY-MM-DD format');
  }

  // Base currency validation
  if (!params.baseCurrency) {
    errors.push('baseCurrency is required');
  } else if (!params.baseCurrency.startsWith('iso4217:')) {
    errors.push('baseCurrency must start with "iso4217:"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
