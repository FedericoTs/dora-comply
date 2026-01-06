/**
 * SOC2-to-RoI Mapping Types
 *
 * Type definitions for mapping parsed SOC2 reports to Register of Information data
 */

import type {
  ParsedSOC2Report,
  ExtractedSubserviceOrg,
  SOC2ReportType,
  SOC2Opinion,
} from '@/lib/ai/parsers/types';

// ============================================================================
// Extraction Result Types
// ============================================================================

/**
 * Status of SOC2 to RoI extraction
 */
export type ExtractionStatus = 'pending' | 'extracting' | 'completed' | 'failed' | 'partial';

/**
 * Data to UPDATE an existing vendor from SOC2 (not create new)
 * The vendor must already exist and be linked to the document.
 */
export interface VendorUpdateData {
  last_soc2_audit_firm?: string;
  last_soc2_audit_date?: string;
  soc2_report_type?: SOC2ReportType;
  soc2_opinion?: SOC2Opinion;
  confidence: number;
}

/**
 * @deprecated Use VendorUpdateData instead. Vendors should be registered before SOC2 parsing.
 */
export interface ExtractedVendorData {
  name: string;
  description?: string;
  headquarters_country?: string;
  source_type: 'soc2_extraction';
  source_document_id: string;
  last_soc2_audit_firm?: string;
  last_soc2_audit_date?: string;
  soc2_report_type?: SOC2ReportType;
  soc2_opinion?: SOC2Opinion;
  suggested_lei?: string;
  confidence: number;
}

/**
 * Result of extracting ICT service data from SOC2
 */
export interface ExtractedServiceData {
  service_name: string;
  service_type: IctServiceType;
  description?: string;
  system_boundaries?: string;
  infrastructure_components: string[];
  software_components: string[];

  // Data handling
  stores_data: boolean;
  data_categories: string[];

  // From trust services criteria
  trust_services_criteria: string[];

  source_type: 'soc2_extraction';
  source_document_id: string;
  confidence: number;
}

/**
 * Result of extracting subcontractor (4th party) data from SOC2
 */
export interface ExtractedSubcontractorData {
  subcontractor_name: string;
  service_description?: string;
  inclusion_method: 'inclusive' | 'carve_out';
  controls_supported: string[];
  has_own_soc2: boolean;
  soc2_location_reference?: string;

  // Derived fields
  tier_level: number;
  is_direct_subcontractor: boolean;
  service_type?: IctServiceType;

  source_type: 'soc2_extraction';
  source_document_id: string;
  confidence: number;
}

// ============================================================================
// Service Type Classification
// ============================================================================

/**
 * ESA ICT service types
 */
export type IctServiceType =
  | 'cloud_computing'
  | 'software_as_service'
  | 'platform_as_service'
  | 'infrastructure_as_service'
  | 'data_analytics'
  | 'data_management'
  | 'network_services'
  | 'security_services'
  | 'payment_services'
  | 'hardware'
  | 'other';

/**
 * Keywords for classifying service types
 */
export const SERVICE_TYPE_KEYWORDS: Record<IctServiceType, string[]> = {
  payment_services: ['payment', 'stripe', 'adyen', 'checkout', 'billing', 'fintech'],
  security_services: ['security', 'auth', 'okta', 'firewall', 'siem', 'identity', 'waf', 'iam'],
  data_analytics: ['analytics', 'bigquery', 'snowflake', 'databricks', 'looker', 'tableau', 'bi'],
  data_management: ['database', 'redis', 'mongodb', 'postgres', 'mysql', 'elasticsearch', 'dynamodb'],
  network_services: ['cdn', 'cloudflare', 'akamai', 'fastly', 'network', 'dns', 'load balancer'],
  platform_as_service: ['kubernetes', 'k8s', 'container', 'docker', 'heroku', 'ecs', 'openshift'],
  infrastructure_as_service: ['ec2', 'compute', 'vm', 'virtual', 'infrastructure', 'storage', 's3'],
  software_as_service: ['saas', 'software', 'application', 'platform', 'api', 'crm', 'erp'],
  cloud_computing: ['cloud', 'aws', 'azure', 'gcp', 'google cloud', 'alibaba cloud'],
  hardware: ['hardware', 'server', 'data center', 'colocation', 'physical'],
  other: [],
};

// ============================================================================
// Mapping Result Types
// ============================================================================

/**
 * Confidence scores for different extraction components
 */
export interface ConfidenceScores {
  vendorUpdate: number;
  services: number;
  subcontractors: number;
  overall: number;
}

/**
 * Factors that contribute to confidence calculation
 */
export interface ConfidenceFactors {
  hasSystemDescription: boolean;
  hasSubserviceOrgs: boolean;
  hasAuditMetadata: boolean;
  hasInfrastructureComponents: boolean;
  hasControlsExtracted: boolean;
}

/**
 * Warning generated during extraction
 */
export interface ExtractionWarning {
  field: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

/**
 * Details about the extraction process
 */
export interface ExtractionDetails {
  fieldsExtracted: string[];
  fieldsMissing: string[];
  warnings: ExtractionWarning[];
  processingTimeMs: number;
}

/**
 * Complete result of SOC2 to RoI mapping
 */
export interface SOC2ToRoiMappingResult {
  // Input identifiers
  parsedSoc2Id: string;
  documentId: string;
  organizationId: string;

  // Existing vendor (must be linked to document)
  existingVendorId: string;

  // Data to update on existing vendor
  vendorUpdate: VendorUpdateData;

  // Extracted data to CREATE
  services: ExtractedServiceData[];
  subcontractors: ExtractedSubcontractorData[];

  // Metadata
  status: ExtractionStatus;
  confidenceScores: ConfidenceScores;
  details: ExtractionDetails;

  // For UI preview
  roiTemplatesSuggested: RoiTemplateSuggestion[];
}

/**
 * Suggestion for which RoI template this data populates
 */
export interface RoiTemplateSuggestion {
  templateId: string;
  templateName: string;
  fieldsPopulated: number;
  totalFields: number;
  coverage: number;
  note?: string;
}

// ============================================================================
// Field Mapping Definitions
// ============================================================================

/**
 * Mapping from SOC2 field to RoI field
 */
export interface FieldMapping {
  soc2Field: string;
  soc2Path: string; // JSONPath-like path, e.g., "subserviceOrgs[0].name"
  roiTemplate: string;
  roiField: string;
  roiTable: string;
  roiColumn: string;
  transform?: (value: unknown) => unknown;
  required: boolean;
}

/**
 * All SOC2 to RoI field mappings
 */
export const SOC2_TO_ROI_FIELD_MAPPINGS: FieldMapping[] = [
  // Vendor (B_05.01)
  {
    soc2Field: 'serviceOrgName',
    soc2Path: 'serviceOrgName',
    roiTemplate: 'B_05.01',
    roiField: 'c0050',
    roiTable: 'vendors',
    roiColumn: 'name',
    required: true,
  },
  {
    soc2Field: 'auditFirm',
    soc2Path: 'auditFirm',
    roiTemplate: 'B_05.01',
    roiField: 'last_audit',
    roiTable: 'vendors',
    roiColumn: 'last_soc2_audit_firm',
    required: false,
  },
  {
    soc2Field: 'periodEnd',
    soc2Path: 'periodEnd',
    roiTemplate: 'B_05.01',
    roiField: 'last_audit_date',
    roiTable: 'vendors',
    roiColumn: 'last_soc2_audit_date',
    transform: (val) => (typeof val === 'string' ? val.split('T')[0] : null),
    required: false,
  },
  {
    soc2Field: 'reportType',
    soc2Path: 'reportType',
    roiTemplate: 'B_05.01',
    roiField: 'soc2_type',
    roiTable: 'vendors',
    roiColumn: 'soc2_report_type',
    required: false,
  },
  {
    soc2Field: 'opinion',
    soc2Path: 'opinion',
    roiTemplate: 'B_05.01',
    roiField: 'soc2_opinion',
    roiTable: 'vendors',
    roiColumn: 'soc2_opinion',
    required: false,
  },

  // ICT Service (B_02.02, B_04.01)
  {
    soc2Field: 'systemDescription',
    soc2Path: 'systemDescription',
    roiTemplate: 'B_02.02',
    roiField: 'service_description',
    roiTable: 'ict_services',
    roiColumn: 'description',
    required: false,
  },
  {
    soc2Field: 'systemBoundaries',
    soc2Path: 'systemBoundaries',
    roiTemplate: 'B_02.02',
    roiField: 'system_boundaries',
    roiTable: 'ict_services',
    roiColumn: 'system_boundaries',
    required: false,
  },
  {
    soc2Field: 'infrastructureComponents',
    soc2Path: 'infrastructureComponents',
    roiTemplate: 'B_02.02',
    roiField: 'infrastructure',
    roiTable: 'ict_services',
    roiColumn: 'infrastructure_components',
    required: false,
  },
  {
    soc2Field: 'softwareComponents',
    soc2Path: 'softwareComponents',
    roiTemplate: 'B_02.02',
    roiField: 'software',
    roiTable: 'ict_services',
    roiColumn: 'software_components',
    required: false,
  },

  // Subcontractors (B_05.02)
  {
    soc2Field: 'subserviceOrgs[].name',
    soc2Path: 'subserviceOrgs[*].name',
    roiTemplate: 'B_05.02',
    roiField: 'subcontractor_name',
    roiTable: 'subcontractors',
    roiColumn: 'subcontractor_name',
    required: true,
  },
  {
    soc2Field: 'subserviceOrgs[].serviceDescription',
    soc2Path: 'subserviceOrgs[*].serviceDescription',
    roiTemplate: 'B_05.02',
    roiField: 'service_description',
    roiTable: 'subcontractors',
    roiColumn: 'service_description',
    required: false,
  },
  {
    soc2Field: 'subserviceOrgs[].inclusionMethod',
    soc2Path: 'subserviceOrgs[*].inclusionMethod',
    roiTemplate: 'B_05.02',
    roiField: 'inclusion_method',
    roiTable: 'subcontractors',
    roiColumn: 'inclusion_method',
    required: false,
  },
  {
    soc2Field: 'subserviceOrgs[].hasOwnSoc2',
    soc2Path: 'subserviceOrgs[*].hasOwnSoc2',
    roiTemplate: 'B_05.02',
    roiField: 'has_own_soc2',
    roiTable: 'subcontractors',
    roiColumn: 'has_own_soc2',
    required: false,
  },
];

// ============================================================================
// Database Record Types
// ============================================================================

/**
 * Record to insert into soc2_roi_mappings table
 */
export interface Soc2RoiMappingRecord {
  id?: string;
  organization_id: string;
  parsed_soc2_id: string;
  document_id: string;
  extracted_vendor_id?: string | null;
  extracted_service_ids: string[];
  extracted_subcontractor_ids: string[];
  extraction_status: ExtractionStatus;
  extraction_confidence: number;
  extraction_details: ExtractionDetails;
  extracted_at: string;
  error_message?: string | null;
  is_confirmed: boolean;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  confirmation_notes?: string | null;
}

/**
 * Record to insert into soc2_roi_extracted_fields table
 */
export interface Soc2RoiExtractedFieldRecord {
  id?: string;
  mapping_id: string;
  soc2_field: string;
  soc2_value?: string | null;
  target_table: string;
  target_column: string;
  target_id?: string | null;
  roi_template?: string | null;
  confidence: number;
  needs_review: boolean;
  was_modified: boolean;
  final_value?: string | null;
}
