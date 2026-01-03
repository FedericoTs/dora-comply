/**
 * DORA Compliance Scoring Types
 *
 * Based on EU Regulation 2022/2554 (Digital Operational Resilience Act)
 * Implements maturity-based scoring (L0-L4) instead of percentages
 */

// =============================================================================
// Maturity Levels (COBIT/CMMI-style)
// =============================================================================

export enum MaturityLevel {
  L0_NOT_PERFORMED = 0,      // No control exists
  L1_INFORMAL = 1,           // Ad-hoc, inconsistent
  L2_PLANNED = 2,            // Documented, department-level
  L3_WELL_DEFINED = 3,       // Standardized, organization-wide
  L4_QUANTITATIVE = 4        // Metrics-driven, continuous improvement
}

export const MaturityLevelLabels: Record<MaturityLevel, string> = {
  [MaturityLevel.L0_NOT_PERFORMED]: 'Not Performed',
  [MaturityLevel.L1_INFORMAL]: 'Informal',
  [MaturityLevel.L2_PLANNED]: 'Planned & Tracked',
  [MaturityLevel.L3_WELL_DEFINED]: 'Well-Defined',
  [MaturityLevel.L4_QUANTITATIVE]: 'Quantitatively Managed'
};

export const MaturityLevelDescriptions: Record<MaturityLevel, string> = {
  [MaturityLevel.L0_NOT_PERFORMED]: 'No evidence of control implementation',
  [MaturityLevel.L1_INFORMAL]: 'Ad-hoc processes, dependent on individual knowledge',
  [MaturityLevel.L2_PLANNED]: 'Documented procedures, department-level consistency',
  [MaturityLevel.L3_WELL_DEFINED]: 'Standardized across organization, regularly reviewed',
  [MaturityLevel.L4_QUANTITATIVE]: 'Metrics-driven with continuous improvement'
};

// =============================================================================
// DORA Pillars
// =============================================================================

export type DORAPillar =
  | 'ICT_RISK'    // Chapter II: ICT Risk Management (Art. 5-16)
  | 'INCIDENT'    // Chapter III: Incident Reporting (Art. 17-23)
  | 'TESTING'     // Chapter IV: Resilience Testing (Art. 24-27)
  | 'TPRM'        // Chapter V: Third-Party Risk (Art. 28-44)
  | 'SHARING';    // Chapter VI: Information Sharing (Art. 45)

export const DORAPillarLabels: Record<DORAPillar, string> = {
  ICT_RISK: 'ICT Risk Management',
  INCIDENT: 'Incident Reporting',
  TESTING: 'Resilience Testing',
  TPRM: 'Third-Party Risk Management',
  SHARING: 'Information Sharing'
};

export const DORAPillarChapters: Record<DORAPillar, string> = {
  ICT_RISK: 'Chapter II (Art. 5-16)',
  INCIDENT: 'Chapter III (Art. 17-23)',
  TESTING: 'Chapter IV (Art. 24-27)',
  TPRM: 'Chapter V (Art. 28-44)',
  SHARING: 'Chapter VI (Art. 45)'
};

// =============================================================================
// Database Types (matching Supabase schema)
// =============================================================================

export interface DORARequirement {
  id: string;
  article_number: string;
  article_title: string;
  chapter: string;
  pillar: DORAPillar;
  requirement_text: string;
  evidence_needed: string[];
  regulatory_reference?: string;
  is_mandatory: boolean;
  applies_to: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
}

export interface DORARequirementCriteria {
  id: string;
  requirement_id: string;
  criterion_code: string;
  criterion_text: string;
  evidence_type: 'document' | 'system_config' | 'log' | 'interview';
  validation_method: 'inspection' | 'observation' | 'reperformance' | 'inquiry';
  weight: number;
  created_at: string;
}

export interface SOC2ToDORAMapping {
  id: string;
  soc2_category: string;
  soc2_control_pattern: string | null;
  dora_requirement_id: string;
  mapping_strength: 'full' | 'partial' | 'none';
  coverage_percentage: number;
  gap_description: string | null;
  remediation_guidance: string | null;
  created_at: string;
  // Joined data
  dora_requirement?: DORARequirement;
}

export interface VendorDORACompliance {
  id: string;
  vendor_id: string;
  organization_id: string;
  assessment_date: string;

  // Pillar maturity levels
  pillar_ict_risk_maturity: MaturityLevel | null;
  pillar_incident_maturity: MaturityLevel | null;
  pillar_testing_maturity: MaturityLevel | null;
  pillar_tprm_maturity: MaturityLevel | null;
  pillar_sharing_maturity: MaturityLevel | null;

  // Overall assessment
  overall_maturity_level: MaturityLevel | null;
  overall_readiness_status: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
  estimated_remediation_months: number | null;

  // Evidence summary
  evidence_summary: {
    total: number;
    sufficient: number;
    partial: number;
    insufficient: number;
  };
  critical_gaps: string[];
  source_documents: string[];

  created_at: string;
  updated_at: string;
}

export interface VendorDORAEvidence {
  id: string;
  vendor_id: string;
  organization_id: string;
  requirement_id: string;

  // Evidence status
  design_status: 'validated' | 'partial' | 'missing' | 'not_applicable' | null;
  operating_status: 'validated' | 'partial' | 'missing' | 'not_tested' | null;

  // Maturity
  maturity_level: MaturityLevel | null;

  // Evidence sources
  evidence_sources: EvidenceSource[];

  // Gap details
  gap_type: 'design' | 'operational' | 'both' | 'none' | null;
  gap_description: string | null;
  remediation_priority: 'critical' | 'high' | 'medium' | 'low' | null;
  remediation_status: 'not_started' | 'in_progress' | 'completed' | 'verified';
  remediation_notes: string | null;

  // Verification
  verified_by: string | null;
  verified_at: string | null;
  verification_method: 'ai_extracted' | 'manual_review' | 'audit_report' | null;

  created_at: string;
  updated_at: string;

  // Joined data
  dora_requirement?: DORARequirement;
}

export interface EvidenceSource {
  documentId: string;
  documentName?: string;
  controlId: string;
  pageRef?: number;
  sectionRef?: string;
  extractedText?: string;
  confidence: number;
}

// =============================================================================
// Calculation Result Types
// =============================================================================

export interface PillarScore {
  pillar: DORAPillar;
  maturityLevel: MaturityLevel;
  percentageScore: number;  // 0-100 for UI display
  requirementsMet: number;
  requirementsTotal: number;
  gaps: GapItem[];
  status: 'compliant' | 'partial' | 'non_compliant';
}

export interface GapItem {
  requirementId: string;
  articleNumber: string;
  articleTitle: string;
  gapType: 'design' | 'operational' | 'both' | 'none';
  gapDescription: string;
  remediationGuidance: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedEffort: string;
  soc2Coverage: 'full' | 'partial' | 'none';
}

export interface DORAComplianceResult {
  vendorId: string;
  vendorName: string;
  assessmentDate: string;

  // Overall
  overallMaturity: MaturityLevel;
  overallStatus: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
  overallPercentage: number;

  // Per-pillar breakdown
  pillars: Record<DORAPillar, PillarScore>;

  // Gaps
  criticalGaps: GapItem[];
  allGaps: GapItem[];
  totalGaps: number;

  // Evidence summary
  evidenceSummary: {
    total: number;
    sufficient: number;
    partial: number;
    insufficient: number;
  };

  // Remediation estimate
  estimatedRemediationMonths: number;

  // Source data
  sourceDocuments: Array<{
    id: string;
    name: string;
    type: string;
    parsedAt: string;
  }>;
}

// =============================================================================
// Verification Types
// =============================================================================

export interface VerificationChecklistItem {
  id: string;
  category: 'control_count' | 'exceptions' | 'opinion' | 'spot_check' | 'subservices';
  label: string;
  description: string;
  extractedValue: string | number;
  expectedValue?: string | number;
  pdfPageRef?: number;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface VerificationResult {
  documentId: string;
  documentName: string;
  extractionConfidence: number;
  checklistItems: VerificationChecklistItem[];
  overallVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

// =============================================================================
// SOC 2 Control Categories for Mapping
// =============================================================================

export const SOC2Categories = {
  CC1: 'Control Environment',
  CC2: 'Communication and Information',
  CC3: 'Risk Assessment',
  CC4: 'Monitoring Activities',
  CC5: 'Control Activities',
  CC6: 'Logical and Physical Access Controls',
  CC7: 'System Operations',
  CC8: 'Change Management',
  CC9: 'Risk Mitigation',
  A: 'Availability',
  C: 'Confidentiality',
  PI: 'Processing Integrity',
  P: 'Privacy'
} as const;

export type SOC2Category = keyof typeof SOC2Categories;
