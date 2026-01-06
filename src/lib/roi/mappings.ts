/**
 * RoI Column Mappings
 *
 * Maps database columns to ESA column codes for xBRL-CSV export
 */

import type { RoiTemplateId } from './types';

// ============================================================================
// ESA Enumeration Values
// ============================================================================

/**
 * EBA entity types for c0040 in B_01.01, B_01.02
 */
export const EBA_ENTITY_TYPES: Record<string, string> = {
  credit_institution: 'eba_CT:x1',
  investment_firm: 'eba_CT:x2',
  payment_institution: 'eba_CT:x3',
  electronic_money_institution: 'eba_CT:x4',
  insurance_undertaking: 'eba_CT:x5',
  reinsurance_undertaking: 'eba_CT:x6',
  ucits_management_company: 'eba_CT:x7',
  aifm: 'eba_CT:x8',
  crypto_asset_service_provider: 'eba_CT:x9',
  other: 'eba_CT:x12',
};

/**
 * ISO 3166-1 alpha-2 country codes with EBA prefix
 */
export const EBA_COUNTRY_CODES: Record<string, string> = {
  AL: 'eba_GA:AL',
  AT: 'eba_GA:AT',
  BE: 'eba_GA:BE',
  BG: 'eba_GA:BG',
  HR: 'eba_GA:HR',
  CY: 'eba_GA:CY',
  CZ: 'eba_GA:CZ',
  DK: 'eba_GA:DK',
  EE: 'eba_GA:EE',
  FI: 'eba_GA:FI',
  FR: 'eba_GA:FR',
  DE: 'eba_GA:DE',
  GR: 'eba_GA:GR',
  HU: 'eba_GA:HU',
  IS: 'eba_GA:IS',
  IE: 'eba_GA:IE',
  IT: 'eba_GA:IT',
  LV: 'eba_GA:LV',
  LI: 'eba_GA:LI',
  LT: 'eba_GA:LT',
  LU: 'eba_GA:LU',
  MT: 'eba_GA:MT',
  NL: 'eba_GA:NL',
  NO: 'eba_GA:NO',
  PL: 'eba_GA:PL',
  PT: 'eba_GA:PT',
  RO: 'eba_GA:RO',
  SK: 'eba_GA:SK',
  SI: 'eba_GA:SI',
  ES: 'eba_GA:ES',
  SE: 'eba_GA:SE',
  GB: 'eba_GA:GB',
  US: 'eba_GA:US',
  CH: 'eba_GA:CH',
};

/**
 * Contract arrangement types for B_02.01 c0020
 */
export const EBA_CONTRACT_TYPES: Record<string, string> = {
  standalone: 'eba_CO:x1',
  overarching: 'eba_CO:x2',
  subsequent: 'eba_CO:x3',
  associated: 'eba_CO:x4',
};

/**
 * ICT service types for B_02.02 c0060
 */
export const EBA_SERVICE_TYPES: Record<string, string> = {
  cloud_computing: 'eba_TA:S01',
  software_as_service: 'eba_TA:S02',
  platform_as_service: 'eba_TA:S03',
  infrastructure_as_service: 'eba_TA:S04',
  data_analytics: 'eba_TA:S05',
  data_management: 'eba_TA:S06',
  network_services: 'eba_TA:S07',
  security_services: 'eba_TA:S08',
  payment_services: 'eba_TA:S09',
  hardware: 'eba_TA:x28',
  other: 'eba_TA:x99',
};

/**
 * Provider identification code types for B_02.02 c0040, etc.
 */
export const EBA_CODE_TYPES: Record<string, string> = {
  lei: 'eba_qCO:qx2000',
  national_id: 'eba_qCO:qx2001',
  eic: 'eba_qCO:qx2002',
  other: 'eba_qCO:qx2099',
};

/**
 * Data sensitiveness levels for B_02.02 c0170
 */
export const EBA_SENSITIVENESS: Record<string, string> = {
  low: 'eba_ZZ:x791',
  medium: 'eba_ZZ:x792',
  high: 'eba_ZZ:x793',
};

/**
 * Entity nature for B_04.01 c0030
 */
export const EBA_ENTITY_NATURE: Record<string, string> = {
  financial_entity: 'eba_BT:x21',
  branch: 'eba_BT:x22',
  subsidiary: 'eba_BT:x23',
  other: 'eba_BT:x28',
};

/**
 * Person types for B_05.01 c0070
 */
export const EBA_PERSON_TYPES: Record<string, string> = {
  legal: 'eba_CT:x212',
  natural: 'eba_CT:x213',
};

/**
 * Substitutability levels for B_07.01 c0050
 */
export const EBA_SUBSTITUTABILITY: Record<string, string> = {
  not_substitutable: 'eba_ZZ:x959',
  highly_complex: 'eba_ZZ:x960',
  medium_complexity: 'eba_ZZ:x961',
  easily_substitutable: 'eba_ZZ:x962',
};

/**
 * Reintegration possibility for B_07.01 c0090
 */
export const EBA_REINTEGRATION: Record<string, string> = {
  easy: 'eba_ZZ:x963',
  difficult: 'eba_ZZ:x964',
  highly_complex: 'eba_ZZ:x965',
};

/**
 * Impact levels for B_06.01 c0100, B_07.01 c0100
 */
export const EBA_IMPACT_LEVELS: Record<string, string> = {
  low: 'eba_ZZ:x0',
  medium: 'eba_ZZ:x1',
  high: 'eba_ZZ:x2',
};

/**
 * Criticality assessment for B_06.01 c0050
 */
export const EBA_CRITICALITY: Record<string, string> = {
  critical: 'eba_ZZ:x794',
  important: 'eba_ZZ:x795',
};

/**
 * Currency codes with ISO 4217 prefix
 */
export const ISO_CURRENCY_CODES: Record<string, string> = {
  EUR: 'eba_CU:ALL',
  USD: 'eba_CU:USD',
  GBP: 'eba_CU:GBP',
  CHF: 'eba_CU:CHF',
};

/**
 * Responsible person types for B_01.02
 */
export const EBA_ROLE_TYPES: Record<string, string> = {
  ict_risk_manager: 'eba_RP:x21',
  dpo: 'eba_RP:x22',
  compliance_officer: 'eba_RP:x23',
  ciso: 'eba_RP:x24',
  other: 'eba_RP:x99',
};

// ============================================================================
// Column Mapping Types
// ============================================================================

export interface ColumnMapping {
  esaCode: string;
  dbColumn: string;
  dbTable: string;
  description: string;
  transform?: (value: unknown) => unknown;
  required: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  enumeration?: Record<string, string>;
}

export type TemplateMapping = Record<string, ColumnMapping>;

// ============================================================================
// Database to ESA Column Mappings
// ============================================================================

/**
 * B_01.01 - Entity Maintaining Register
 * Source: organizations table
 */
export const B_01_01_MAPPING: TemplateMapping = {
  c0010: {
    esaCode: 'c0010',
    dbColumn: 'lei',
    dbTable: 'organizations',
    description: 'LEI of entity maintaining register',
    required: true,
    dataType: 'string',
  },
  c0020: {
    esaCode: 'c0020',
    dbColumn: 'name',
    dbTable: 'organizations',
    description: 'Name of entity',
    required: true,
    dataType: 'string',
  },
  c0030: {
    esaCode: 'c0030',
    dbColumn: 'jurisdiction',
    dbTable: 'organizations',
    description: 'Country of entity',
    required: true,
    dataType: 'enum',
    enumeration: EBA_COUNTRY_CODES,
  },
  c0040: {
    esaCode: 'c0040',
    dbColumn: 'entity_type',
    dbTable: 'organizations',
    description: 'Type of entity',
    required: true,
    dataType: 'enum',
    enumeration: EBA_ENTITY_TYPES,
  },
  c0050: {
    esaCode: 'c0050',
    dbColumn: 'competent_authorities',
    dbTable: 'organizations',
    description: 'Competent Authority',
    required: true,
    dataType: 'string',
    transform: (val) => Array.isArray(val) ? val[0] : val,
  },
  c0060: {
    esaCode: 'c0060',
    dbColumn: 'created_at',
    dbTable: 'organizations',
    description: 'Date of reporting',
    required: true,
    dataType: 'date',
    transform: (val) => formatDate(val as string | Date),
  },
};

/**
 * B_01.02 - Entities in Scope
 * Source: organizations table
 */
export const B_01_02_MAPPING: TemplateMapping = {
  c0010: {
    esaCode: 'c0010',
    dbColumn: 'lei',
    dbTable: 'organizations',
    description: 'LEI of entity',
    required: true,
    dataType: 'string',
  },
  c0020: {
    esaCode: 'c0020',
    dbColumn: 'name',
    dbTable: 'organizations',
    description: 'Name of entity',
    required: true,
    dataType: 'string',
  },
  c0030: {
    esaCode: 'c0030',
    dbColumn: 'jurisdiction',
    dbTable: 'organizations',
    description: 'Country of entity',
    required: true,
    dataType: 'enum',
    enumeration: EBA_COUNTRY_CODES,
  },
  c0040: {
    esaCode: 'c0040',
    dbColumn: 'entity_type',
    dbTable: 'organizations',
    description: 'Type of entity',
    required: true,
    dataType: 'enum',
    enumeration: EBA_ENTITY_TYPES,
  },
  c0050: {
    esaCode: 'c0050',
    dbColumn: 'group_structure',
    dbTable: 'organizations',
    description: 'Hierarchy within group',
    required: false,
    dataType: 'string',
  },
  c0060: {
    esaCode: 'c0060',
    dbColumn: 'parent_entity_lei',
    dbTable: 'organizations',
    description: 'LEI of direct parent',
    required: false,
    dataType: 'string',
  },
  c0070: {
    esaCode: 'c0070',
    dbColumn: 'updated_at',
    dbTable: 'organizations',
    description: 'Date of last update',
    required: true,
    dataType: 'date',
    transform: (val) => formatDate(val as string | Date),
  },
  c0080: {
    esaCode: 'c0080',
    dbColumn: 'created_at',
    dbTable: 'organizations',
    description: 'Date of integration',
    required: true,
    dataType: 'date',
    transform: (val) => formatDate(val as string | Date),
  },
  c0090: {
    esaCode: 'c0090',
    dbColumn: 'deleted_at',
    dbTable: 'organizations',
    description: 'Date of deletion',
    required: false,
    dataType: 'date',
    transform: (val) => val ? formatDate(val as string | Date) : null,
  },
  c0100: {
    esaCode: 'c0100',
    dbColumn: 'currency',
    dbTable: 'organizations',
    description: 'Currency',
    required: true,
    dataType: 'enum',
    enumeration: ISO_CURRENCY_CODES,
  },
  c0110: {
    esaCode: 'c0110',
    dbColumn: 'total_assets',
    dbTable: 'organizations',
    description: 'Total assets value',
    required: false,
    dataType: 'number',
  },
};

/**
 * B_01.03 - Branches
 * Source: organization_branches table
 */
export const B_01_03_MAPPING: TemplateMapping = {
  c0010: {
    esaCode: 'c0010',
    dbColumn: 'branch_id',
    dbTable: 'organization_branches',
    description: 'Branch identification code',
    required: true,
    dataType: 'string',
  },
  c0020: {
    esaCode: 'c0020',
    dbColumn: 'organization_lei',
    dbTable: 'organization_branches',
    description: 'LEI of head office',
    required: true,
    dataType: 'string',
  },
  c0030: {
    esaCode: 'c0030',
    dbColumn: 'branch_name',
    dbTable: 'organization_branches',
    description: 'Branch name',
    required: true,
    dataType: 'string',
  },
  c0040: {
    esaCode: 'c0040',
    dbColumn: 'country_code',
    dbTable: 'organization_branches',
    description: 'Country of branch',
    required: true,
    dataType: 'enum',
    enumeration: EBA_COUNTRY_CODES,
  },
};

/**
 * B_02.01 - Contractual Arrangements Overview
 * Source: contracts table
 */
export const B_02_01_MAPPING: TemplateMapping = {
  c0010: {
    esaCode: 'c0010',
    dbColumn: 'contract_ref',
    dbTable: 'contracts',
    description: 'Contract reference number',
    required: true,
    dataType: 'string',
  },
  c0020: {
    esaCode: 'c0020',
    dbColumn: 'contract_type',
    dbTable: 'contracts',
    description: 'Type of arrangement',
    required: true,
    dataType: 'enum',
    enumeration: EBA_CONTRACT_TYPES,
    transform: (val) => mapContractType(val as string),
  },
  c0030: {
    esaCode: 'c0030',
    dbColumn: 'parent_contract_ref',
    dbTable: 'contracts',
    description: 'Overarching arrangement reference',
    required: false,
    dataType: 'string',
  },
  c0040: {
    esaCode: 'c0040',
    dbColumn: 'currency',
    dbTable: 'contracts',
    description: 'Currency',
    required: true,
    dataType: 'enum',
    enumeration: ISO_CURRENCY_CODES,
  },
  c0050: {
    esaCode: 'c0050',
    dbColumn: 'annual_value',
    dbTable: 'contracts',
    description: 'Annual expense/cost',
    required: false,
    dataType: 'number',
  },
};

/**
 * B_02.02 - Contractual Arrangements Details
 * Source: contracts + ict_services tables
 */
export const B_02_02_MAPPING: TemplateMapping = {
  c0010: {
    esaCode: 'c0010',
    dbColumn: 'contract_ref',
    dbTable: 'contracts',
    description: 'Contract reference number',
    required: true,
    dataType: 'string',
  },
  c0020: {
    esaCode: 'c0020',
    dbColumn: 'organization_lei',
    dbTable: 'contracts',
    description: 'LEI of entity using service',
    required: true,
    dataType: 'string',
  },
  c0030: {
    esaCode: 'c0030',
    dbColumn: 'vendor_lei',
    dbTable: 'vendors',
    description: 'Provider identification code',
    required: true,
    dataType: 'string',
  },
  c0040: {
    esaCode: 'c0040',
    dbColumn: '_computed', // Always LEI for providers with LEI
    dbTable: 'vendors',
    description: 'Provider code type',
    required: true,
    dataType: 'enum',
    enumeration: EBA_CODE_TYPES,
    transform: () => 'eba_qCO:qx2000', // Default to LEI
  },
  c0050: {
    esaCode: 'c0050',
    dbColumn: 'id', // The ict_service ID is the function identifier
    dbTable: 'ict_services',
    description: 'Function identifier',
    required: false,
    dataType: 'string',
  },
  c0060: {
    esaCode: 'c0060',
    dbColumn: 'service_type',
    dbTable: 'ict_services',
    description: 'Type of ICT services',
    required: true,
    dataType: 'enum',
    enumeration: EBA_SERVICE_TYPES,
  },
  c0070: {
    esaCode: 'c0070',
    dbColumn: 'effective_date',
    dbTable: 'contracts',
    description: 'Start date',
    required: true,
    dataType: 'date',
    transform: (val) => formatDate(val as string | Date),
  },
  c0080: {
    esaCode: 'c0080',
    dbColumn: 'expiry_date',
    dbTable: 'contracts',
    description: 'End date',
    required: false,
    dataType: 'date',
    transform: (val) => val ? formatDate(val as string | Date) : null,
  },
  c0090: {
    esaCode: 'c0090',
    dbColumn: '_computed', // Not stored in current schema
    dbTable: 'contracts',
    description: 'Reason for termination',
    required: false,
    dataType: 'string',
  },
  c0100: {
    esaCode: 'c0100',
    dbColumn: 'termination_notice_days',
    dbTable: 'contracts',
    description: 'Entity notice period (days)',
    required: false,
    dataType: 'number',
  },
  c0110: {
    esaCode: 'c0110',
    dbColumn: '_computed', // Provider notice not in current schema
    dbTable: 'contracts',
    description: 'Provider notice period (days)',
    required: false,
    dataType: 'number',
  },
  c0120: {
    esaCode: 'c0120',
    dbColumn: '_computed', // Governing law derived from vendor country
    dbTable: 'contracts',
    description: 'Governing law country',
    required: true,
    dataType: 'enum',
    enumeration: EBA_COUNTRY_CODES,
  },
  c0130: {
    esaCode: 'c0130',
    dbColumn: '_computed', // Derived from vendor headquarters
    dbTable: 'ict_services',
    description: 'Service provision country',
    required: true,
    dataType: 'enum',
    enumeration: EBA_COUNTRY_CODES,
  },
  c0140: {
    esaCode: 'c0140',
    dbColumn: 'processes_personal_data', // Fixed: actual column name
    dbTable: 'ict_services',
    description: 'Storage of data',
    required: true,
    dataType: 'boolean',
  },
  c0150: {
    esaCode: 'c0150',
    dbColumn: '_computed', // Requires service_data_locations join
    dbTable: 'service_data_locations',
    description: 'Data storage location',
    required: false,
    dataType: 'enum',
    enumeration: EBA_COUNTRY_CODES,
  },
  c0160: {
    esaCode: 'c0160',
    dbColumn: '_computed', // Requires service_data_locations join
    dbTable: 'service_data_locations',
    description: 'Data processing location',
    required: false,
    dataType: 'enum',
    enumeration: EBA_COUNTRY_CODES,
  },
  c0170: {
    esaCode: 'c0170',
    dbColumn: '_computed', // Computed from criticality_level
    dbTable: 'ict_services',
    description: 'Data sensitiveness',
    required: true,
    dataType: 'enum',
    enumeration: EBA_SENSITIVENESS,
  },
  c0180: {
    esaCode: 'c0180',
    dbColumn: 'criticality_level',
    dbTable: 'ict_services',
    description: 'Level of reliance',
    required: false,
    dataType: 'string',
  },
};

/**
 * B_04.01 - Service Recipients
 * Source: ict_services + contracts + organizations tables
 * Links contracts to entities (organization/branches) using the services
 */
export const B_04_01_MAPPING: TemplateMapping = {
  c0010: {
    esaCode: 'c0010',
    dbColumn: 'contract_ref',
    dbTable: 'contracts',
    description: 'Contractual arrangement reference number',
    required: true,
    dataType: 'string',
  },
  c0020: {
    esaCode: 'c0020',
    dbColumn: 'entity_lei',
    dbTable: 'organizations',
    description: 'Entity LEI (organization using the service)',
    required: true,
    dataType: 'string',
  },
  c0030: {
    esaCode: 'c0030',
    dbColumn: 'entity_nature',
    dbTable: 'organizations',
    description: 'Nature of the entity',
    required: true,
    dataType: 'enum',
    enumeration: EBA_ENTITY_NATURE,
  },
  c0040: {
    esaCode: 'c0040',
    dbColumn: 'branch_code',
    dbTable: 'organization_branches',
    description: 'Branch identification code',
    required: false,
    dataType: 'string',
  },
};

/**
 * B_05.01 - ICT Providers
 * Source: vendors table
 * Note: Some columns are computed at query time and marked readonly
 */
export const B_05_01_MAPPING: TemplateMapping = {
  c0010: {
    esaCode: 'c0010',
    dbColumn: 'lei',
    dbTable: 'vendors',
    description: 'Provider identification code',
    required: true,
    dataType: 'string',
  },
  c0020: {
    esaCode: 'c0020',
    dbColumn: '_computed', // Computed from LEI presence
    dbTable: 'vendors',
    description: 'Provider code type',
    required: true,
    dataType: 'enum',
    enumeration: EBA_CODE_TYPES,
    transform: () => 'eba_qCO:qx2000',
  },
  c0030: {
    esaCode: 'c0030',
    dbColumn: 'registration_number',
    dbTable: 'vendors',
    description: 'Additional identification code',
    required: false,
    dataType: 'string',
  },
  c0040: {
    esaCode: 'c0040',
    dbColumn: '_computed', // Computed from registration_number presence
    dbTable: 'vendors',
    description: 'Additional code type',
    required: false,
    dataType: 'enum',
    enumeration: EBA_CODE_TYPES,
  },
  c0050: {
    esaCode: 'c0050',
    dbColumn: 'name',
    dbTable: 'vendors',
    description: 'Legal name',
    required: true,
    dataType: 'string',
  },
  c0060: {
    esaCode: 'c0060',
    dbColumn: 'name', // Uses same column as c0050 (no separate Latin name column)
    dbTable: 'vendors',
    description: 'Name in Latin alphabet',
    required: false,
    dataType: 'string',
  },
  c0070: {
    esaCode: 'c0070',
    dbColumn: '_computed', // Always legal person
    dbTable: 'vendors',
    description: 'Type of person',
    required: true,
    dataType: 'enum',
    enumeration: EBA_PERSON_TYPES,
    transform: () => 'eba_CT:x212', // Default to legal person
  },
  c0080: {
    esaCode: 'c0080',
    dbColumn: 'headquarters_country',
    dbTable: 'vendors',
    description: 'Headquarters country',
    required: true,
    dataType: 'enum',
    enumeration: EBA_COUNTRY_CODES,
  },
  c0090: {
    esaCode: 'c0090',
    dbColumn: 'expense_currency',
    dbTable: 'vendors',
    description: 'Currency',
    required: true,
    dataType: 'enum',
    enumeration: ISO_CURRENCY_CODES,
    transform: () => 'eba_CU:ALL', // Default to EUR
  },
  c0100: {
    esaCode: 'c0100',
    dbColumn: 'total_annual_expense',
    dbTable: 'vendors',
    description: 'Total annual expense',
    required: false,
    dataType: 'number',
  },
  c0110: {
    esaCode: 'c0110',
    dbColumn: 'ultimate_parent_lei',
    dbTable: 'vendors',
    description: 'Ultimate parent ID',
    required: false,
    dataType: 'string',
  },
  c0120: {
    esaCode: 'c0120',
    dbColumn: 'parent_lei_type',
    dbTable: 'vendors',
    description: 'Parent code type',
    required: false,
    dataType: 'enum',
    enumeration: EBA_CODE_TYPES,
  },
};

/**
 * B_06.01 - Critical Functions
 * Source: critical_functions table
 */
export const B_06_01_MAPPING: TemplateMapping = {
  c0010: {
    esaCode: 'c0010',
    dbColumn: 'function_code',
    dbTable: 'critical_functions',
    description: 'Function identifier',
    required: true,
    dataType: 'string',
  },
  c0020: {
    esaCode: 'c0020',
    dbColumn: 'function_category',
    dbTable: 'critical_functions',
    description: 'Licensed activity',
    required: true,
    dataType: 'string',
  },
  c0030: {
    esaCode: 'c0030',
    dbColumn: 'function_name',
    dbTable: 'critical_functions',
    description: 'Function name',
    required: true,
    dataType: 'string',
  },
  c0040: {
    esaCode: 'c0040',
    dbColumn: 'organization_lei',
    dbTable: 'critical_functions',
    description: 'LEI of financial entity',
    required: true,
    dataType: 'string',
  },
  c0050: {
    esaCode: 'c0050',
    dbColumn: 'is_critical',
    dbTable: 'critical_functions',
    description: 'Criticality assessment',
    required: true,
    dataType: 'enum',
    enumeration: EBA_CRITICALITY,
    transform: (val) => val ? 'eba_ZZ:x794' : 'eba_ZZ:x795',
  },
  c0060: {
    esaCode: 'c0060',
    dbColumn: 'criticality_rationale',
    dbTable: 'critical_functions',
    description: 'Reasons for criticality',
    required: false,
    dataType: 'string',
  },
  c0070: {
    esaCode: 'c0070',
    dbColumn: 'updated_at',
    dbTable: 'critical_functions',
    description: 'Last assessment date',
    required: true,
    dataType: 'date',
    transform: (val) => formatDate(val as string | Date),
  },
  c0080: {
    esaCode: 'c0080',
    dbColumn: 'rto_hours',
    dbTable: 'ict_services',
    description: 'Recovery time objective (hours)',
    required: false,
    dataType: 'number',
  },
  c0090: {
    esaCode: 'c0090',
    dbColumn: 'rpo_hours',
    dbTable: 'ict_services',
    description: 'Recovery point objective (hours)',
    required: false,
    dataType: 'number',
  },
  c0100: {
    esaCode: 'c0100',
    dbColumn: 'impact_level',
    dbTable: 'critical_functions',
    description: 'Impact of discontinuing',
    required: true,
    dataType: 'enum',
    enumeration: EBA_IMPACT_LEVELS,
  },
};

/**
 * B_07.01 - Exit Arrangements
 * Source: contracts + vendors tables
 */
export const B_07_01_MAPPING: TemplateMapping = {
  c0010: {
    esaCode: 'c0010',
    dbColumn: 'contract_ref',
    dbTable: 'contracts',
    description: 'Contract reference number',
    required: true,
    dataType: 'string',
  },
  c0020: {
    esaCode: 'c0020',
    dbColumn: 'vendor_lei',
    dbTable: 'vendors',
    description: 'Provider identification code',
    required: true,
    dataType: 'string',
  },
  c0030: {
    esaCode: 'c0030',
    dbColumn: 'vendor_lei_type',
    dbTable: 'vendors',
    description: 'Provider code type',
    required: true,
    dataType: 'enum',
    enumeration: EBA_CODE_TYPES,
    transform: () => 'eba_qCO:qx2000',
  },
  c0040: {
    esaCode: 'c0040',
    dbColumn: 'service_type',
    dbTable: 'ict_services',
    description: 'Type of ICT services',
    required: true,
    dataType: 'enum',
    enumeration: EBA_SERVICE_TYPES,
  },
  c0050: {
    esaCode: 'c0050',
    dbColumn: 'substitutability',
    dbTable: 'function_service_mapping',
    description: 'Substitutability',
    required: true,
    dataType: 'enum',
    enumeration: EBA_SUBSTITUTABILITY,
  },
  c0060: {
    esaCode: 'c0060',
    dbColumn: 'substitutability_reason',
    dbTable: 'function_service_mapping',
    description: 'Reason if not substitutable',
    required: false,
    dataType: 'string',
  },
  c0070: {
    esaCode: 'c0070',
    dbColumn: 'last_audit_date',
    dbTable: 'vendors',
    description: 'Last audit date',
    required: false,
    dataType: 'date',
    transform: (val) => val ? formatDate(val as string | Date) : null,
  },
  c0080: {
    esaCode: 'c0080',
    dbColumn: 'has_exit_plan',
    dbTable: 'contracts',
    description: 'Exit plan exists',
    required: true,
    dataType: 'boolean',
  },
  c0090: {
    esaCode: 'c0090',
    dbColumn: 'reintegration_possibility',
    dbTable: 'contracts',
    description: 'Possibility of reintegration',
    required: true,
    dataType: 'enum',
    enumeration: EBA_REINTEGRATION,
  },
  c0100: {
    esaCode: 'c0100',
    dbColumn: 'discontinuing_impact',
    dbTable: 'ict_services',
    description: 'Impact of discontinuing',
    required: true,
    dataType: 'enum',
    enumeration: EBA_IMPACT_LEVELS,
  },
  c0110: {
    esaCode: 'c0110',
    dbColumn: 'has_alternative',
    dbTable: 'contracts',
    description: 'Alternatives identified',
    required: true,
    dataType: 'boolean',
  },
  c0120: {
    esaCode: 'c0120',
    dbColumn: 'alternative_provider_id',
    dbTable: 'contracts',
    description: 'Alternative provider ID',
    required: false,
    dataType: 'string',
  },
};

// ============================================================================
// All Template Mappings
// ============================================================================

export const TEMPLATE_MAPPINGS: Record<RoiTemplateId, TemplateMapping | null> = {
  'B_01.01': B_01_01_MAPPING,
  'B_01.02': B_01_02_MAPPING,
  'B_01.03': B_01_03_MAPPING,
  'B_02.01': B_02_01_MAPPING,
  'B_02.02': B_02_02_MAPPING,
  'B_02.03': null, // Link table, generated from relationships
  'B_03.01': null, // Link table, generated from relationships
  'B_03.02': null, // Link table, generated from relationships
  'B_03.03': null, // Link table, generated from relationships
  'B_04.01': B_04_01_MAPPING,
  'B_05.01': B_05_01_MAPPING,
  'B_05.02': null, // Subcontracting, generated from subcontractors table
  'B_06.01': B_06_01_MAPPING,
  'B_07.01': B_07_01_MAPPING,
  'B_99.01': null, // Lookup table, not exported
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

/**
 * Map internal contract type to EBA enumeration
 */
function mapContractType(type: string): string {
  const mapping: Record<string, string> = {
    master_agreement: 'eba_CO:x2', // Overarching
    service_agreement: 'eba_CO:x1', // Standalone
    sla: 'eba_CO:x3', // Subsequent
    nda: 'eba_CO:x4', // Associated
    dpa: 'eba_CO:x4', // Associated
    amendment: 'eba_CO:x3', // Subsequent
    statement_of_work: 'eba_CO:x3', // Subsequent
    other: 'eba_CO:x1', // Standalone
  };
  return mapping[type] || 'eba_CO:x1';
}

/**
 * Get column order for a template (ESA-compliant ordering)
 */
export function getColumnOrder(templateId: RoiTemplateId): string[] {
  const orders: Record<RoiTemplateId, string[]> = {
    'B_01.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060'],
    'B_01.02': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110'],
    'B_01.03': ['c0010', 'c0020', 'c0030', 'c0040'],
    'B_02.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050'],
    'B_02.02': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110', 'c0120', 'c0130', 'c0140', 'c0150', 'c0160', 'c0170', 'c0180'],
    'B_02.03': ['c0010', 'c0020', 'c0030'],
    'B_03.01': ['c0010', 'c0020', 'c0030'],
    'B_03.02': ['c0010', 'c0020', 'c0030'],
    'B_03.03': ['c0010', 'c0020', 'c0031'],
    'B_04.01': ['c0010', 'c0020', 'c0030', 'c0040'],
    'B_05.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110', 'c0120'],
    'B_05.02': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070'],
    'B_06.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100'],
    'B_07.01': ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110', 'c0120'],
    'B_99.01': [],
  };
  return orders[templateId] || [];
}

/**
 * Get ESA file name for a template
 */
export function getTemplateFileName(templateId: RoiTemplateId): string {
  return `${templateId.toLowerCase().replace('.', '_')}.csv`;
}

/**
 * Get column mappings for a template as an array
 */
export function getColumnMappings(templateId: RoiTemplateId): ColumnMapping[] {
  const mapping = TEMPLATE_MAPPINGS[templateId];
  if (!mapping) {
    return [];
  }
  // Convert Record<string, ColumnMapping> to ColumnMapping[]
  return Object.values(mapping);
}
