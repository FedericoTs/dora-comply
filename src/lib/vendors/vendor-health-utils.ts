/**
 * Centralized Vendor Health & KPI Calculations
 *
 * All vendor metrics should be calculated here to ensure consistency
 * across the application. Components should import and use these functions
 * rather than calculating metrics independently.
 */

import type { Vendor, VendorWithRelations } from './types';

// ============================================================================
// Types
// ============================================================================

export interface VendorHealthScores {
  /** Overall health score (0-100) */
  overall: number;
  /** Risk score from vendor record (0-100, null if not assessed) */
  risk: number | null;
  /** Compliance score (0-100) */
  compliance: number;
  /** Documentation score (0-100) */
  documentation: number;
  /** Contractual score (0-100) */
  contractual: number;
}

export interface VendorHealthDimension {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'good' | 'warning' | 'critical' | 'unknown';
  details: string;
}

export interface VendorHealthBreakdown {
  scores: VendorHealthScores;
  dimensions: VendorHealthDimension[];
  /** Individual component status for tooltips */
  components: {
    hasLei: boolean;
    leiVerified: boolean;
    hasAssessment: boolean;
    hasCriticalFunctions: boolean;
    hasMonitoring: boolean;
    hasContacts: boolean;
    hasDocuments: boolean;
    hasContracts: boolean;
    hasParsedSoc2: boolean;
    contactsCount: number;
    documentsCount: number;
    contractsCount: number;
  };
}

// ============================================================================
// Score Calculation Functions
// ============================================================================

/**
 * Calculate compliance score (0-100)
 * Based on: LEI status, assessment, critical functions, monitoring
 */
export function calculateComplianceScore(vendor: Vendor | VendorWithRelations): {
  score: number;
  components: {
    hasLei: boolean;
    leiVerified: boolean;
    hasAssessment: boolean;
    hasCriticalFunctions: boolean;
    hasMonitoring: boolean;
  };
} {
  const hasLei = !!vendor.lei;
  const leiVerified = !!vendor.lei_verified_at;
  const hasAssessment = !!vendor.last_assessment_date;
  const hasCriticalFunctions = (vendor.critical_functions?.length ?? 0) > 0;
  const hasMonitoring = vendor.monitoring_enabled ?? false;

  let score = 0;

  // LEI: 15 points base, +10 if verified = 25 total
  if (hasLei) score += 15;
  if (leiVerified) score += 10;

  // Assessment: 30 points
  if (hasAssessment) score += 30;

  // Critical functions defined (or not required): 25 points
  if (hasCriticalFunctions || !vendor.supports_critical_function) score += 25;

  // Monitoring enabled: 20 points
  if (hasMonitoring) score += 20;

  return {
    score,
    components: { hasLei, leiVerified, hasAssessment, hasCriticalFunctions, hasMonitoring },
  };
}

/**
 * Calculate documentation score (0-100)
 * Based on: contacts, documents, contracts, SOC 2 report
 */
export function calculateDocumentationScore(vendor: Vendor | VendorWithRelations): {
  score: number;
  components: {
    hasContacts: boolean;
    hasDocuments: boolean;
    hasContracts: boolean;
    hasParsedSoc2: boolean;
    contactsCount: number;
    documentsCount: number;
    contractsCount: number;
  };
} {
  // Type guard for VendorWithRelations fields
  const vendorWithRelations = vendor as VendorWithRelations;

  const contactsCount = vendorWithRelations.contacts?.length ?? 0;
  const documentsCount = vendorWithRelations.documents_count ?? 0;
  const contractsCount = vendorWithRelations.contracts_count ?? 0;
  const hasParsedSoc2 = vendorWithRelations.has_parsed_soc2 ?? false;

  const hasContacts = contactsCount > 0;
  const hasDocuments = documentsCount > 0;
  const hasContracts = contractsCount > 0;

  let score = 0;
  if (hasContacts) score += 25;
  if (hasDocuments) score += 25;
  if (hasContracts) score += 25;
  if (hasParsedSoc2) score += 25;

  return {
    score,
    components: {
      hasContacts,
      hasDocuments,
      hasContracts,
      hasParsedSoc2,
      contactsCount,
      documentsCount,
      contractsCount,
    },
  };
}

/**
 * Calculate contractual score (0-100)
 * Based on contract presence and completeness
 */
export function calculateContractualScore(vendor: Vendor | VendorWithRelations): number {
  const vendorWithRelations = vendor as VendorWithRelations;
  const contractsCount = vendorWithRelations.contracts_count ?? 0;

  // Simple scoring: 100 if has contracts, 0 if not
  // Could be expanded to consider contract completeness, expiry, etc.
  return contractsCount > 0 ? 100 : 0;
}

/**
 * Calculate overall health score (0-100)
 * Weighted average of risk, compliance, and documentation
 */
export function calculateOverallHealth(
  riskScore: number | null,
  complianceScore: number,
  documentationScore: number
): number {
  // Risk: 35% (default to 50 if not assessed)
  // Compliance: 35%
  // Documentation: 30%
  const effectiveRisk = riskScore ?? 50;

  return Math.round(
    effectiveRisk * 0.35 +
    complianceScore * 0.35 +
    documentationScore * 0.30
  );
}

/**
 * Get all vendor health scores and breakdown
 * This is the main function components should use
 */
export function getVendorHealthBreakdown(vendor: Vendor | VendorWithRelations): VendorHealthBreakdown {
  const complianceResult = calculateComplianceScore(vendor);
  const documentationResult = calculateDocumentationScore(vendor);
  const contractualScore = calculateContractualScore(vendor);

  const riskScore = vendor.risk_score ?? null;
  const complianceScore = complianceResult.score;
  const documentationScore = documentationResult.score;

  const overallScore = calculateOverallHealth(riskScore, complianceScore, documentationScore);

  // Build dimensions for breakdown display
  const dimensions: VendorHealthDimension[] = [
    {
      id: 'risk',
      label: 'Risk',
      score: riskScore ?? 0,
      maxScore: 100,
      percentage: riskScore ?? 0,
      status: riskScore === null ? 'unknown' :
              riskScore >= 70 ? 'good' :
              riskScore >= 40 ? 'warning' : 'critical',
      details: riskScore !== null ? `Risk score: ${riskScore}/100` : 'Not assessed',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      score: complianceScore,
      maxScore: 100,
      percentage: complianceScore,
      status: complianceScore >= 75 ? 'good' :
              complianceScore >= 50 ? 'warning' : 'critical',
      details: `LEI: ${complianceResult.components.hasLei ? '✓' : '✗'} | Assessment: ${complianceResult.components.hasAssessment ? '✓' : '✗'} | Monitoring: ${complianceResult.components.hasMonitoring ? '✓' : '✗'}`,
    },
    {
      id: 'documentation',
      label: 'Documentation',
      score: documentationScore,
      maxScore: 100,
      percentage: documentationScore,
      status: documentationScore >= 75 ? 'good' :
              documentationScore >= 50 ? 'warning' : 'critical',
      details: `Contacts: ${documentationResult.components.contactsCount} | Docs: ${documentationResult.components.documentsCount} | Contracts: ${documentationResult.components.contractsCount}`,
    },
    {
      id: 'contractual',
      label: 'Contractual',
      score: contractualScore,
      maxScore: 100,
      percentage: contractualScore,
      status: contractualScore >= 75 ? 'good' :
              contractualScore >= 50 ? 'warning' : 'critical',
      details: documentationResult.components.contractsCount > 0
        ? `${documentationResult.components.contractsCount} contract(s) on file`
        : 'No contracts on file',
    },
  ];

  return {
    scores: {
      overall: overallScore,
      risk: riskScore,
      compliance: complianceScore,
      documentation: documentationScore,
      contractual: contractualScore,
    },
    dimensions,
    components: {
      ...complianceResult.components,
      ...documentationResult.components,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get status color class based on score
 */
export function getScoreStatusColor(score: number | null, maxScore: number = 100): string {
  if (score === null) return 'text-muted-foreground';
  const percentage = (score / maxScore) * 100;
  if (percentage >= 70) return 'text-emerald-600';
  if (percentage >= 40) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Get status based on score percentage
 */
export function getScoreStatus(score: number | null, maxScore: number = 100): 'good' | 'warning' | 'critical' | 'unknown' {
  if (score === null) return 'unknown';
  const percentage = (score / maxScore) * 100;
  if (percentage >= 70) return 'good';
  if (percentage >= 40) return 'warning';
  return 'critical';
}
