/**
 * SOC 2 Parser Types
 *
 * Type definitions for AI-extracted SOC 2 report data
 * Based on AICPA Trust Services Criteria (2017) structure
 */

// ============================================================================
// SOC 2 Report Enums
// ============================================================================

export type SOC2ReportType = 'type1' | 'type2';

export type SOC2Opinion = 'unqualified' | 'qualified' | 'adverse';

export type TestResult = 'operating_effectively' | 'exception' | 'not_tested';

export type InclusionMethod = 'inclusive' | 'carve_out';

export type ImpactLevel = 'low' | 'medium' | 'high';

export type DORAMapping = 'full' | 'partial' | 'none';

export type TrustServicesCriteria =
  | 'security'
  | 'availability'
  | 'processing_integrity'
  | 'confidentiality'
  | 'privacy';

// ============================================================================
// SOC 2 Trust Services Criteria Categories
// ============================================================================

export const TSC_CATEGORIES = {
  // Common Criteria (Security - required for all SOC 2 reports)
  CC1: 'Control Environment',
  CC2: 'Communication and Information',
  CC3: 'Risk Assessment',
  CC4: 'Monitoring Activities',
  CC5: 'Control Activities',
  CC6: 'Logical and Physical Access Controls',
  CC7: 'System Operations',
  CC8: 'Change Management',
  CC9: 'Risk Mitigation',

  // Additional criteria (optional based on scope)
  A: 'Availability',
  PI: 'Processing Integrity',
  C: 'Confidentiality',
  P: 'Privacy',
} as const;

export type TSCCategory = keyof typeof TSC_CATEGORIES;

// ============================================================================
// Extracted Control
// ============================================================================

export interface ExtractedSOC2Control {
  /** Control identifier, e.g., "CC6.1" or "CC1.1" */
  controlId: string;

  /** Control area/category, e.g., "Logical and Physical Access Controls" */
  controlArea: string;

  /** TSC category code */
  tscCategory: TSCCategory | string;

  /** Full control description */
  description: string;

  /** Test result from auditor (Type II only) */
  testResult: TestResult;

  /** Description of testing procedure performed */
  testingProcedure?: string;

  /** If exception, description of the exception */
  exceptionDescription?: string;

  /** Management's response to exception */
  managementResponse?: string;

  /** Location in document where found */
  location?: string;

  /** Confidence score for this extraction (0-1) */
  confidence: number;
}

// ============================================================================
// Exception Details
// ============================================================================

export interface ExtractedSOC2Exception {
  /** Related control ID */
  controlId: string;

  /** Control name/area */
  controlArea?: string;

  /** Detailed exception description */
  exceptionDescription: string;

  /** Nature of exception */
  exceptionType?:
    | 'design_deficiency'
    | 'operating_deficiency'
    | 'population_deviation';

  /** Management's response to the exception */
  managementResponse?: string;

  /** Remediation date if provided */
  remediationDate?: string;

  /** Whether remediation has been verified */
  remediationVerified?: boolean;

  /** Impact level assessment */
  impact: ImpactLevel;

  /** Location in document */
  location?: string;
}

// ============================================================================
// Subservice Organization (4th Party)
// ============================================================================

export interface ExtractedSubserviceOrg {
  /** Name of the subservice organization */
  name: string;

  /** Description of services provided */
  serviceDescription: string;

  /** How the subservice org is included in the report */
  inclusionMethod: InclusionMethod;

  /** Controls that rely on this subservice org */
  controlsSupported: string[];

  /** CUECs related to this subservice org if any */
  relatedCuecs?: string[];

  /** Whether they have their own SOC 2 report */
  hasOwnSoc2?: boolean;

  /** Location in document */
  location?: string;
}

// ============================================================================
// Complementary User Entity Controls (CUECs)
// ============================================================================

export interface ExtractedCUEC {
  /** CUEC identifier if provided */
  id?: string;

  /** Description of the control */
  description: string;

  /** Related service organization control */
  relatedControl?: string;

  /** What the customer must do */
  customerResponsibility: string;

  /** Category of CUEC */
  category?:
    | 'access_control'
    | 'authentication'
    | 'authorization'
    | 'monitoring'
    | 'data_protection'
    | 'incident_response'
    | 'other';

  /** Location in document */
  location?: string;
}

// ============================================================================
// Parsed SOC 2 Report (Complete)
// ============================================================================

export interface ParsedSOC2Report {
  // Report Metadata
  reportType: SOC2ReportType;
  auditFirm: string;
  auditFirmContact?: string;
  opinion: SOC2Opinion;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  reportDate: string; // ISO date

  // Service Organization Info
  serviceOrgName: string;
  serviceOrgDescription?: string;

  // Scope & Criteria
  trustServicesCriteria: TrustServicesCriteria[];
  systemDescription: string;
  systemBoundaries?: string;
  infrastructureComponents?: string[];
  softwareComponents?: string[];
  dataCategories?: string[];

  // Controls (All TSC controls found)
  controls: ExtractedSOC2Control[];

  // Exceptions (If any)
  exceptions: ExtractedSOC2Exception[];

  // Subservice Organizations (4th Parties)
  subserviceOrgs: ExtractedSubserviceOrg[];

  // Complementary User Entity Controls
  cuecs: ExtractedCUEC[];

  // Summary Statistics
  totalControls: number;
  controlsOperatingEffectively: number;
  controlsWithExceptions: number;
  controlsNotTested: number;

  // Confidence Scores
  confidenceScores: {
    overall: number;
    metadata: number;
    controls: number;
    exceptions: number;
    subserviceOrgs: number;
    cuecs: number;
  };

  // Processing Metadata
  parserVersion: string;
  processedAt: string;
  processingTimeMs: number;
}

// ============================================================================
// DORA Mapping Result
// ============================================================================

export interface SOC2ToDORAMapping {
  soc2ControlId: string;
  soc2ControlName: string;
  doraArticle: string;
  doraControlId: string;
  doraControlName: string;
  coverageLevel: DORAMapping;
  mappingNotes?: string;
  confidence: number;
}

// ============================================================================
// Gap Analysis Result
// ============================================================================

export interface DORAGapFromSOC2 {
  doraArticle: string;
  doraControlId: string;
  doraControlName: string;
  doraPillar: 'ICT_RISK' | 'INCIDENT' | 'RESILIENCE' | 'TPRM' | 'SHARING';
  coverageStatus: 'covered' | 'partial' | 'gap';
  coverageScore: number;
  soc2Evidence: {
    controlId: string;
    controlName: string;
    testResult: TestResult;
    mappingStrength: DORAMapping;
  }[];
  gapDescription?: string;
  recommendations?: string[];
}

// ============================================================================
// Database-Ready Output
// ============================================================================

export interface SOC2DatabaseRecord {
  document_id: string;
  report_type: SOC2ReportType;
  audit_firm: string;
  opinion: SOC2Opinion;
  period_start: string;
  period_end: string;
  criteria: TrustServicesCriteria[];
  system_description: string;
  controls: ExtractedSOC2Control[];
  exceptions: ExtractedSOC2Exception[];
  subservice_orgs: ExtractedSubserviceOrg[];
  cuecs: ExtractedCUEC[];
  raw_extraction: ParsedSOC2Report;
  confidence_scores: ParsedSOC2Report['confidenceScores'];
}
