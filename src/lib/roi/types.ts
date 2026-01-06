/**
 * RoI Engine Type Definitions
 *
 * Types matching ESA DORA Register of Information templates
 * Column codes follow ESA naming convention (c0010, c0020, etc.)
 */

// ============================================================================
// Template Identifiers
// ============================================================================

export type RoiTemplateId =
  | 'B_01.01' // Entity maintaining register
  | 'B_01.02' // Entities in scope
  | 'B_01.03' // Branches
  | 'B_02.01' // Contractual arrangements overview
  | 'B_02.02' // Contractual arrangements details
  | 'B_02.03' // Linked arrangements
  | 'B_03.01' // Entity-arrangement links
  | 'B_03.02' // Provider-arrangement links
  | 'B_03.03' // Intra-group provider links
  | 'B_04.01' // Service recipients
  | 'B_05.01' // ICT providers
  | 'B_05.02' // Subcontracting
  | 'B_06.01' // Critical functions
  | 'B_07.01' // Exit arrangements
  | 'B_99.01'; // Lookup values

export interface RoiTemplate {
  id: RoiTemplateId;
  name: string;
  description: string;
  esaReference: string;
  columnCount: number;
}

// ============================================================================
// B_01.01 - Entity Maintaining Register
// ============================================================================

export interface B_01_01_Row {
  c0010: string; // LEI of entity maintaining register
  c0020: string; // Name of entity
  c0030: string; // Country (ISO 3166-1 alpha-2)
  c0040: string; // Type of entity (EBA enumeration)
  c0050: string; // Competent authority
  c0060: string; // Date of reporting (YYYY-MM-DD)
}

// ============================================================================
// B_01.02 - Entities in Scope
// ============================================================================

export interface B_01_02_Row {
  c0010: string; // LEI of entity
  c0020: string; // Name of entity
  c0030: string; // Country (ISO 3166-1 alpha-2)
  c0040: string; // Type of entity
  c0050: string | null; // Hierarchy within group
  c0060: string | null; // LEI of direct parent
  c0070: string; // Date of last update (YYYY-MM-DD)
  c0080: string; // Date of integration (YYYY-MM-DD)
  c0090: string | null; // Date of deletion (YYYY-MM-DD)
  c0100: string; // Currency (ISO 4217)
  c0110: number | null; // Total assets value
}

// ============================================================================
// B_01.03 - Branches
// ============================================================================

export interface B_01_03_Row {
  c0010: string; // Branch identification code
  c0020: string; // LEI of head office
  c0030: string; // Branch name
  c0040: string; // Country (ISO 3166-1 alpha-2)
}

// ============================================================================
// B_02.01 - Contractual Arrangements Overview
// ============================================================================

export interface B_02_01_Row {
  c0010: string; // Contract reference number
  c0020: string; // Type of arrangement (EBA enum)
  c0030: string | null; // Overarching arrangement reference
  c0040: string; // Currency (ISO 4217)
  c0050: number | null; // Annual expense/cost
}

// ============================================================================
// B_02.02 - Contractual Arrangements Details
// ============================================================================

export interface B_02_02_Row {
  c0010: string; // Contract reference number
  c0020: string; // LEI of entity using service
  c0030: string; // Provider identification code
  c0040: string; // Provider code type (LEI, etc.)
  c0050: string | null; // Function identifier
  c0060: string; // Type of ICT services
  c0070: string; // Start date (YYYY-MM-DD)
  c0080: string | null; // End date (YYYY-MM-DD)
  c0090: string | null; // Reason for termination
  c0100: number | null; // Entity notice period (days)
  c0110: number | null; // Provider notice period (days)
  c0120: string; // Governing law country
  c0130: string; // Service provision country
  c0140: boolean; // Storage of data
  c0150: string | null; // Data storage location
  c0160: string | null; // Data processing location
  c0170: string; // Data sensitiveness (Low/Medium/High)
  c0180: string | null; // Level of reliance
}

// ============================================================================
// B_02.03 - Linked Contractual Arrangements
// ============================================================================

export interface B_02_03_Row {
  c0010: string; // Contract reference number
  c0020: string; // Linked contract reference
  c0030: boolean; // Link flag
}

// ============================================================================
// B_03.01 - Entity-Arrangement Links
// ============================================================================

export interface B_03_01_Row {
  c0010: string; // Contract reference number
  c0020: string; // LEI of signing entity
  c0030: boolean; // Link flag
}

// ============================================================================
// B_03.02 - Provider-Arrangement Links
// ============================================================================

export interface B_03_02_Row {
  c0010: string; // Contract reference number
  c0020: string; // Provider identification code
  c0030: string; // Provider code type
}

// ============================================================================
// B_03.03 - Intra-Group Provider Links
// ============================================================================

export interface B_03_03_Row {
  c0010: string; // Contract reference number
  c0020: string; // LEI of intra-group provider
  c0031: boolean; // Link flag
}

// ============================================================================
// B_04.01 - Service Recipients
// ============================================================================

export interface B_04_01_Row {
  c0010: string; // Contract reference number
  c0020: string; // LEI of entity using service
  c0030: string; // Nature of entity (EBA enum)
  c0040: string | null; // Branch identification code
}

// ============================================================================
// B_05.01 - ICT Third-Party Service Providers
// ============================================================================

export interface B_05_01_Row {
  c0010: string; // Provider identification code
  c0020: string; // Provider code type
  c0030: string | null; // Additional identification code
  c0040: string | null; // Additional code type
  c0050: string; // Legal name
  c0060: string | null; // Name in Latin alphabet
  c0070: string; // Type of person (Legal/Natural)
  c0080: string; // Headquarters country
  c0090: string; // Currency (ISO 4217)
  c0100: number | null; // Total annual expense
  c0110: string | null; // Ultimate parent ID
  c0120: string | null; // Parent code type
}

// ============================================================================
// B_05.02 - Subcontracting Chain
// ============================================================================

export interface B_05_02_Row {
  c0010: string; // Contract reference number
  c0020: string; // Type of ICT services
  c0030: string; // Provider identification code
  c0040: string; // Provider code type
  c0050: number; // Rank in chain
  c0060: string; // Subcontractor identification code
  c0070: string; // Subcontractor code type
}

// ============================================================================
// B_06.01 - Critical or Important Functions
// ============================================================================

export interface B_06_01_Row {
  c0010: string; // Function identifier
  c0020: string; // Licensed activity
  c0030: string; // Function name
  c0040: string; // LEI of financial entity
  c0050: string; // Criticality assessment (Critical/Important)
  c0060: string | null; // Reasons for criticality
  c0070: string; // Last assessment date (YYYY-MM-DD)
  c0080: number | null; // RTO (hours)
  c0090: number | null; // RPO (hours)
  c0100: string; // Impact of discontinuing (Low/Medium/High)
}

// ============================================================================
// B_07.01 - Exit Arrangements
// ============================================================================

export interface B_07_01_Row {
  c0010: string; // Contract reference number
  c0020: string; // Provider identification code
  c0030: string; // Provider code type
  c0040: string; // Type of ICT services
  c0050: string; // Substitutability
  c0060: string | null; // Reason if not substitutable
  c0070: string | null; // Last audit date (YYYY-MM-DD)
  c0080: boolean; // Exit plan exists
  c0090: string; // Possibility of reintegration
  c0100: string; // Impact of discontinuing
  c0110: boolean; // Alternatives identified
  c0120: string | null; // Alternative provider ID
}

// ============================================================================
// Row Type Union
// ============================================================================

export type RoiRow =
  | B_01_01_Row
  | B_01_02_Row
  | B_01_03_Row
  | B_02_01_Row
  | B_02_02_Row
  | B_02_03_Row
  | B_03_01_Row
  | B_03_02_Row
  | B_03_03_Row
  | B_04_01_Row
  | B_05_01_Row
  | B_05_02_Row
  | B_06_01_Row
  | B_07_01_Row;

// ============================================================================
// Template Metadata
// ============================================================================

export const ROI_TEMPLATES: Record<RoiTemplateId, RoiTemplate> = {
  'B_01.01': {
    id: 'B_01.01',
    name: 'Entity Maintaining Register',
    description: 'Information about the entity maintaining the register of information',
    esaReference: 'RT.01.01',
    columnCount: 6,
  },
  'B_01.02': {
    id: 'B_01.02',
    name: 'Entities in Scope',
    description: 'Financial entities within the scope of the register',
    esaReference: 'RT.01.02',
    columnCount: 11,
  },
  'B_01.03': {
    id: 'B_01.03',
    name: 'Branches',
    description: 'Branches of financial entities',
    esaReference: 'RT.01.03',
    columnCount: 4,
  },
  'B_02.01': {
    id: 'B_02.01',
    name: 'Contractual Arrangements Overview',
    description: 'Overview of contractual arrangements with ICT providers',
    esaReference: 'RT.02.01',
    columnCount: 5,
  },
  'B_02.02': {
    id: 'B_02.02',
    name: 'Contractual Arrangements Details',
    description: 'Detailed information on contractual arrangements',
    esaReference: 'RT.02.02',
    columnCount: 18,
  },
  'B_02.03': {
    id: 'B_02.03',
    name: 'Linked Arrangements',
    description: 'Links between contractual arrangements',
    esaReference: 'RT.02.03',
    columnCount: 3,
  },
  'B_03.01': {
    id: 'B_03.01',
    name: 'Entity-Arrangement Links',
    description: 'Links between entities and contractual arrangements',
    esaReference: 'RT.03.01',
    columnCount: 3,
  },
  'B_03.02': {
    id: 'B_03.02',
    name: 'Provider-Arrangement Links',
    description: 'Links between providers and contractual arrangements',
    esaReference: 'RT.03.02',
    columnCount: 3,
  },
  'B_03.03': {
    id: 'B_03.03',
    name: 'Intra-Group Provider Links',
    description: 'Intra-group ICT service provider links',
    esaReference: 'RT.03.03',
    columnCount: 3,
  },
  'B_04.01': {
    id: 'B_04.01',
    name: 'Service Recipients',
    description: 'Entities making use of ICT services',
    esaReference: 'RT.04.01',
    columnCount: 4,
  },
  'B_05.01': {
    id: 'B_05.01',
    name: 'ICT Providers',
    description: 'ICT third-party service providers',
    esaReference: 'RT.05.01',
    columnCount: 12,
  },
  'B_05.02': {
    id: 'B_05.02',
    name: 'Subcontracting',
    description: 'Subcontracting chain information',
    esaReference: 'RT.05.02',
    columnCount: 7,
  },
  'B_06.01': {
    id: 'B_06.01',
    name: 'Critical Functions',
    description: 'Critical or important functions',
    esaReference: 'RT.06.01',
    columnCount: 10,
  },
  'B_07.01': {
    id: 'B_07.01',
    name: 'Exit Arrangements',
    description: 'Assessment for substitutability and exit arrangements',
    esaReference: 'RT.07.01',
    columnCount: 12,
  },
  'B_99.01': {
    id: 'B_99.01',
    name: 'Lookup Values',
    description: 'ESA enumeration lookup values',
    esaReference: 'RT.99.01',
    columnCount: 0,
  },
};

// ============================================================================
// Validation Result Types
// ============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationError {
  templateId: RoiTemplateId;
  rowIndex: number;
  columnCode: string;
  severity: ValidationSeverity;
  rule: string;
  message: string;
  value: unknown;
  suggestion?: string;
}

export interface TemplateValidationResult {
  templateId: RoiTemplateId;
  rowCount: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  isValid: boolean;
}

export interface RoiValidationResult {
  isValid: boolean;
  overallScore: number; // 0-100
  templateResults: Record<RoiTemplateId, TemplateValidationResult>;
  totalErrors: number;
  totalWarnings: number;
  completeness: Record<RoiTemplateId, number>; // 0-100 per template
}

// ============================================================================
// Export Package Types
// ============================================================================

export interface RoiPackageParameters {
  entityId: string; // LEI with prefix (e.g., "rs:LEI123...")
  refPeriod: string; // YYYY-MM-DD
  baseCurrency: string; // e.g., "iso4217:EUR"
  decimalsInteger: number;
  decimalsMonetary: number;
}

export interface RoiExportResult {
  success: boolean;
  packagePath?: string;
  errors?: string[];
  templateFiles: {
    templateId: RoiTemplateId;
    fileName: string;
    rowCount: number;
  }[];
  metadata: {
    generatedAt: string;
    generatedBy: string;
    version: string;
  };
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface RoiTemplateStatus {
  templateId: RoiTemplateId;
  name: string;
  rowCount: number;
  completeness: number; // 0-100
  errorCount: number;
  warningCount: number;
  lastUpdated: string | null;
}

export interface RoiDashboardData {
  overallCompleteness: number;
  overallScore: number;
  templateStatuses: RoiTemplateStatus[];
  recentErrors: ValidationError[];
  lastExport: {
    date: string;
    version: string;
  } | null;
  deadline: string; // April 30, 2025
  daysUntilDeadline: number;
}

// ============================================================================
// Action-Oriented Dashboard Types
// ============================================================================

export type NextActionType =
  | 'validation_error'
  | 'missing_data'
  | 'review_needed'
  | 'quick_win'
  | 'ai_populate';

export type ActionPriority = 'high' | 'medium' | 'low';

export interface NextAction {
  id: string;
  type: NextActionType;
  priority: ActionPriority;
  title: string;
  description: string;
  templateId?: RoiTemplateId;
  fieldPath?: string;
  estimatedMinutes: number;
  actionUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PopulatableDocument {
  documentId: string;
  fileName: string;
  vendorName: string;
  vendorId: string;
  parsedAt: Date;
  fieldsAvailable: number;
  templateBreakdown: {
    templateId: RoiTemplateId;
    fieldCount: number;
    fieldNames: string[];
  }[];
  isPopulated: boolean;
  populatedAt?: Date;
}

export type TemplateFilterStatus = 'all' | 'needs_attention' | 'in_progress' | 'complete';

export interface TemplateWithStatus extends RoiTemplateStatus {
  status: TemplateFilterStatus;
  group: 'entity' | 'contracts' | 'links' | 'providers' | 'functions' | 'exit';
}
