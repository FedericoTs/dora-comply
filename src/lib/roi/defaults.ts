/**
 * Smart Defaults Generator for RoI Templates
 *
 * Provides sensible default values when creating new records
 * to reduce friction and ensure valid data
 */

import type { RoiTemplateId } from './types';

export interface DefaultsContext {
  organizationLei?: string;
  organizationId?: string;
  userId?: string;
}

/**
 * Get smart defaults for a template
 * Returns ESA column codes with appropriate default values
 */
export function getSmartDefaults(
  templateId: RoiTemplateId,
  context: DefaultsContext = {}
): Record<string, unknown> {
  const today = new Date().toISOString().split('T')[0];

  const defaults: Partial<Record<RoiTemplateId, Record<string, unknown>>> = {
    // B_01.01 - Entity Maintaining Register
    'B_01.01': {
      c0010: context.organizationLei || '', // LEI
      c0060: today, // Date of reporting
    },

    // B_01.02 - Entities in Scope
    'B_01.02': {
      c0010: context.organizationLei || '', // LEI
      c0070: today, // Last update date
      c0080: today, // Integration date
      c0100: 'iso4217:EUR', // Currency
    },

    // B_01.03 - Branches
    'B_01.03': {
      c0020: context.organizationLei || '', // Head office LEI
    },

    // B_02.01 - Contractual Arrangements Overview
    'B_02.01': {
      c0020: 'eba_CO:x1', // Standalone arrangement
      c0040: 'iso4217:EUR', // Currency
    },

    // B_02.02 - Contractual Arrangements Details
    'B_02.02': {
      c0040: 'eba_qCO:qx2000', // LEI code type
      c0070: today, // Start date
      c0140: false, // Stores data
      c0170: 'eba_ZZ:x791', // Low sensitivity (safer default)
    },

    // B_04.01 - Service Recipients
    'B_04.01': {
      c0020: context.organizationLei || '', // Entity LEI
      c0030: 'eba_BT:x21', // Financial entity nature
    },

    // B_05.01 - ICT Providers (vendors table)
    // Required DB columns: name (NOT NULL)
    'B_05.01': {
      c0010: '', // LEI (can be empty initially)
      c0020: 'eba_qCO:qx2000', // LEI code type
      c0050: 'New ICT Provider', // Name - REQUIRED in DB
      c0070: 'eba_CT:x212', // Legal person
      c0090: 'iso4217:EUR', // Currency
    },

    // B_05.02 - Subcontracting
    'B_05.02': {
      c0040: 'eba_qCO:qx2000', // LEI code type
    },

    // B_06.01 - Critical Functions (critical_functions table)
    // Required DB columns: function_name (NOT NULL)
    'B_06.01': {
      c0030: 'New Critical Function', // Function name - REQUIRED in DB
      c0040: context.organizationLei || '', // Entity LEI
      c0050: 'eba_ZZ:x795', // Important (not critical - safer default)
      c0070: today, // Assessment date
      c0100: 'eba_ZZ:x1', // Medium impact (balanced default)
    },

    // B_07.01 - Exit Arrangements
    'B_07.01': {
      c0030: 'eba_qCO:qx2000', // LEI code type
      c0050: 'eba_ZZ:x961', // Medium complexity substitutability
      c0080: false, // No exit plan yet
      c0090: 'eba_ZZ:x964', // Difficult reintegration
      c0100: 'eba_ZZ:x1', // Medium impact
      c0110: false, // No alternatives identified
    },
  };

  return defaults[templateId] || {};
}

/**
 * Get required fields for a template
 * Used to validate minimum data before insert
 */
export function getRequiredFields(templateId: RoiTemplateId): string[] {
  const required: Partial<Record<RoiTemplateId, string[]>> = {
    'B_01.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050'],
    'B_01.02': ['c0010', 'c0020', 'c0030', 'c0040'],
    'B_01.03': ['c0010', 'c0020', 'c0030', 'c0040'],
    'B_02.01': ['c0010', 'c0020', 'c0040'],
    'B_02.02': ['c0010', 'c0020', 'c0030', 'c0060', 'c0070'],
    'B_05.01': ['c0010', 'c0050', 'c0070', 'c0080'],
    'B_06.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050'],
    'B_07.01': ['c0010', 'c0020', 'c0040', 'c0050'],
  };

  return required[templateId] || [];
}

/**
 * Transform ESA column codes to database column values
 * Reverse of the GET transformation
 */
export function transformEsaToDb(
  templateId: RoiTemplateId,
  esaRecord: Record<string, unknown>
): Record<string, unknown> {
  const dbRecord: Record<string, unknown> = {};

  // Template-specific transformations
  const transformations: Partial<Record<RoiTemplateId, Record<string, (v: unknown) => unknown>>> = {
    'B_05.01': {
      // Vendor fields
      c0010: (v) => v, // LEI
      c0050: (v) => v, // Name
      c0080: (v) => extractCountryCode(v as string), // Headquarters country
      c0100: (v) => v, // Total annual expense
      c0110: (v) => v, // Ultimate parent LEI
    },
    'B_02.01': {
      // Contract fields
      c0010: (v) => v, // Contract ref
      c0020: (v) => mapEbaToContractType(v as string), // Type
      c0040: (v) => extractCurrencyCode(v as string), // Currency
      c0050: (v) => v, // Annual value
    },
    'B_06.01': {
      // Critical function fields
      c0010: (v) => v, // Function code
      c0020: (v) => v, // Category
      c0030: (v) => v, // Name
      c0050: (v) => (v as string)?.includes('x794'), // Is critical
      c0060: (v) => v, // Rationale
      c0080: (v) => v, // RTO
      c0090: (v) => v, // RPO
      c0100: (v) => mapEbaToImpactLevel(v as string), // Impact
    },
  };

  const templateTransform = transformations[templateId];
  if (templateTransform) {
    for (const [esaCode, transform] of Object.entries(templateTransform)) {
      if (esaCode in esaRecord) {
        dbRecord[esaCodeToDbColumn(templateId, esaCode)] = transform(esaRecord[esaCode]);
      }
    }
  }

  return dbRecord;
}

// Helper to extract country code from EBA format (e.g., "eba_GA:DE" -> "DE")
function extractCountryCode(value: string): string {
  if (!value) return '';
  const match = value.match(/eba_GA:(\w+)/);
  return match ? match[1] : value;
}

// Helper to extract currency code from ISO format
function extractCurrencyCode(value: string): string {
  if (!value) return 'EUR';
  const match = value.match(/iso4217:(\w+)|eba_CU:(\w+)/);
  return match ? (match[1] || match[2]) : value;
}

// Map EBA contract type to internal type
function mapEbaToContractType(value: string): string {
  const mapping: Record<string, string> = {
    'eba_CO:x1': 'service_agreement',
    'eba_CO:x2': 'master_agreement',
    'eba_CO:x3': 'amendment',
    'eba_CO:x4': 'nda',
  };
  return mapping[value] || 'other';
}

// Map EBA impact level to internal level
function mapEbaToImpactLevel(value: string): string {
  const mapping: Record<string, string> = {
    'eba_ZZ:x0': 'low',
    'eba_ZZ:x1': 'medium',
    'eba_ZZ:x2': 'high',
  };
  return mapping[value] || 'medium';
}

// Map ESA column code to database column
function esaCodeToDbColumn(templateId: RoiTemplateId, esaCode: string): string {
  const mappings: Partial<Record<RoiTemplateId, Record<string, string>>> = {
    'B_05.01': {
      c0010: 'lei',
      c0050: 'name',
      c0080: 'headquarters_country',
      c0100: 'total_annual_expense',
      c0110: 'ultimate_parent_lei',
    },
    'B_02.01': {
      c0010: 'contract_ref',
      c0020: 'contract_type',
      c0040: 'currency',
      c0050: 'annual_value',
    },
    'B_06.01': {
      c0010: 'function_code',
      c0020: 'function_category',
      c0030: 'function_name',
      c0050: 'is_critical',
      c0060: 'criticality_rationale',
      c0080: 'function_rto_hours',
      c0090: 'function_rpo_hours',
      c0100: 'impact_level',
    },
  };

  return mappings[templateId]?.[esaCode] || esaCode;
}
