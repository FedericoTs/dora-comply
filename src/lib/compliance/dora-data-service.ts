/**
 * DORA Compliance Data Service
 *
 * Single source of truth for DORA compliance data fetching and transformation.
 * Ensures consistency between vendor pages and document analysis pages.
 *
 * This service handles:
 * 1. Database schema to calculator interface mapping
 * 2. Data validation and normalization
 * 3. Consistent error handling
 */

import { calculateDORACompliance } from './dora-calculator';
import type { DORAComplianceResult } from './dora-types';
import { DORA_REQUIREMENTS } from './dora-requirements-data';

// =============================================================================
// Database Schema Types (matches parsed_soc2 table exactly)
// =============================================================================

/**
 * Control as stored in the database (parsed_soc2.controls JSONB)
 */
export interface DBParsedControl {
  controlId: string;
  tscCategory: string;
  description: string;
  testResult: 'operating_effectively' | 'exception' | 'not_tested';
  confidence: number;
  pageRef?: number;
  controlArea?: string;
  testingProcedure?: string;
  exceptionDescription?: string;
  location?: string;
}

/**
 * Exception as stored in the database (parsed_soc2.exceptions JSONB)
 */
export interface DBParsedException {
  controlId: string;
  exceptionDescription: string;
  exceptionType?: 'design_deficiency' | 'operating_deficiency' | 'population_deviation';
  impact?: 'low' | 'medium' | 'high';
  managementResponse?: string;
  remediationDate?: string;
  remediationVerified?: boolean;
  controlArea?: string;
  location?: string;
  pageRef?: number;
}

/**
 * Subservice organization as stored in the database
 */
export interface DBSubserviceOrg {
  name: string;
  serviceDescription: string;
  carveOut?: boolean;
  inclusionMethod?: 'inclusive' | 'carve_out';
  controlsSupported?: string[];
  hasOwnSoc2?: boolean;
  location?: string;
  pageRef?: number;
}

/**
 * CUEC as stored in the database
 */
export interface DBCUEC {
  id?: string;
  description: string;
  relatedControl?: string;
  customerResponsibility?: string;
  category?: string;
  location?: string;
  pageRef?: number;
}

/**
 * Full parsed SOC2 record as stored in database
 */
export interface DBParsedSOC2 {
  id: string;
  document_id: string;
  report_type: 'type1' | 'type2';
  audit_firm: string;
  opinion: 'unqualified' | 'qualified' | 'adverse';
  period_start: string;
  period_end: string;
  criteria?: string[];
  system_description?: string;
  controls: DBParsedControl[];
  exceptions: DBParsedException[];
  subservice_orgs: DBSubserviceOrg[];
  cuecs: DBCUEC[];
  confidence_score?: number;
  confidence_scores?: {
    overall: number;
    metadata: number;
    controls: number;
    exceptions: number;
    subserviceOrgs: number;
    cuecs: number;
  };
  created_at: string;
}

// =============================================================================
// Mapping Functions (DB Schema -> Calculator Interface)
// =============================================================================

/**
 * Transform database parsed SOC2 data to the format expected by calculateDORACompliance
 */
export function mapDBToCalculatorFormat(dbData: DBParsedSOC2) {
  return {
    id: dbData.id,
    document_id: dbData.document_id,
    report_type: dbData.report_type,
    audit_firm: dbData.audit_firm,
    opinion: dbData.opinion,
    period_start: dbData.period_start,
    period_end: dbData.period_end,
    // Map controls: controlId -> id, tscCategory -> category
    controls: (dbData.controls || []).map(c => ({
      id: c.controlId,
      category: c.tscCategory,
      description: c.description,
      testResult: c.testResult,
      pageRef: c.pageRef,
    })),
    // Map exceptions: exceptionDescription -> description
    exceptions: (dbData.exceptions || []).map(e => ({
      controlId: e.controlId,
      description: e.exceptionDescription,
      exceptionType: e.exceptionType,
      impact: e.impact,
      managementResponse: e.managementResponse,
      remediationDate: e.remediationDate,
      remediationVerified: e.remediationVerified,
    })),
    // Map subservice_orgs: serviceDescription -> services
    subservice_orgs: (dbData.subservice_orgs || []).map(s => ({
      name: s.name,
      services: s.serviceDescription,
    })),
    // Map cuecs
    cuecs: (dbData.cuecs || []).map(c => ({
      id: c.id || '',
      description: c.description,
    })),
    // Use overall confidence score
    confidence_score: dbData.confidence_scores?.overall || dbData.confidence_score || 0.85,
  };
}

/**
 * Calculate DORA compliance from database parsed SOC2 data
 * This is the primary function that should be used throughout the application
 */
export function calculateDORAFromDB(
  vendorId: string,
  vendorName: string,
  dbParsedSOC2: DBParsedSOC2,
  documentInfo: { id: string; name: string; type?: string }
): DORAComplianceResult {
  const mappedData = mapDBToCalculatorFormat(dbParsedSOC2);

  return calculateDORACompliance(
    vendorId,
    vendorName,
    mappedData,
    {
      id: documentInfo.id,
      name: documentInfo.name,
      type: documentInfo.type || 'soc2',
    }
  );
}

// =============================================================================
// Summary Statistics (for quick overview without full calculation)
// =============================================================================

export interface DORAQuickStats {
  totalControls: number;
  effectiveControls: number;
  exceptionControls: number;
  notTestedControls: number;
  effectivenessRate: number;
  exceptionCount: number;
  subserviceOrgCount: number;
  cuecCount: number;
  hasCriticalExceptions: boolean;
}

/**
 * Extract SOC 2 coverage by requirement ID from DORA compliance result
 * Used by the Gap Remediation component to show which requirements have SOC 2 evidence
 */
export function getSOC2CoverageByRequirement(
  doraCompliance: DORAComplianceResult
): Record<string, 'full' | 'partial' | 'none'> {
  const coverageMap: Record<string, 'full' | 'partial' | 'none'> = {};

  // Iterate through all pillars and their gaps
  for (const [, pillarScore] of Object.entries(doraCompliance.pillars)) {
    // Requirements with gaps have partial or no coverage
    for (const gap of pillarScore.gaps) {
      coverageMap[gap.requirementId] = gap.soc2Coverage;
    }
  }

  // For requirements not in gaps, assume full coverage
  // We need to get all requirement IDs and mark covered ones
  for (const req of DORA_REQUIREMENTS) {
    if (!(req.id in coverageMap)) {
      // If not in gaps, it's covered
      coverageMap[req.id] = 'full';
    }
  }

  return coverageMap;
}

/**
 * Get quick statistics from parsed SOC2 data without full DORA calculation
 */
export function getQuickStats(dbParsedSOC2: DBParsedSOC2): DORAQuickStats {
  const controls = dbParsedSOC2.controls || [];
  const exceptions = dbParsedSOC2.exceptions || [];

  const effectiveControls = controls.filter(c => c.testResult === 'operating_effectively').length;
  const exceptionControls = controls.filter(c => c.testResult === 'exception').length;
  const notTestedControls = controls.filter(c => c.testResult === 'not_tested').length;
  const totalControls = controls.length;

  const hasCriticalExceptions = exceptions.some(
    e => e.exceptionType === 'design_deficiency' || e.impact === 'high'
  );

  return {
    totalControls,
    effectiveControls,
    exceptionControls,
    notTestedControls,
    effectivenessRate: totalControls > 0 ? Math.round((effectiveControls / totalControls) * 100) : 0,
    exceptionCount: exceptions.length,
    subserviceOrgCount: (dbParsedSOC2.subservice_orgs || []).length,
    cuecCount: (dbParsedSOC2.cuecs || []).length,
    hasCriticalExceptions,
  };
}
