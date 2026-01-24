/**
 * Multi-Domain Risk Assessment Types
 *
 * Types for assessing vendors across multiple risk domains
 * (Security, Privacy, Compliance, Operational, Financial)
 */

// ============================================
// Risk Domain Types
// ============================================

export interface RiskDomain {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  weight: number;
  is_active: boolean;
  is_system: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DomainAssessmentCriterion {
  id: string;
  domain_id: string;
  name: string;
  description: string | null;
  guidance: string | null;
  weight: number;
  max_score: number;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Assessment Types
// ============================================

export type MaturityLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AssessmentStatus = 'pending' | 'in_progress' | 'completed' | 'needs_review';

export interface VendorDomainAssessment {
  id: string;
  vendor_id: string;
  domain_id: string;
  score: number | null;
  maturity_level: MaturityLevel | null;
  risk_level: RiskLevel | null;
  assessed_by: string | null;
  assessed_at: string | null;
  notes: string | null;
  key_findings: string[];
  recommendations: string[];
  next_assessment_date: string | null;
  status: AssessmentStatus;
  created_at: string;
  updated_at: string;
}

export interface VendorDomainScore {
  id: string;
  assessment_id: string;
  criterion_id: string;
  score: number;
  notes: string | null;
  evidence_document_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface AssessmentHistoryEntry {
  id: string;
  vendor_id: string;
  domain_id: string;
  score: number | null;
  maturity_level: MaturityLevel | null;
  risk_level: RiskLevel | null;
  assessed_by: string | null;
  assessed_at: string;
  scores_snapshot: Record<string, number> | null;
  created_at: string;
}

// ============================================
// Extended/Joined Types
// ============================================

export interface RiskDomainWithCriteria extends RiskDomain {
  criteria: DomainAssessmentCriterion[];
}

export interface VendorDomainAssessmentWithDetails extends VendorDomainAssessment {
  domain: RiskDomain;
  scores: (VendorDomainScore & { criterion: DomainAssessmentCriterion })[];
  assessed_by_user?: { full_name: string } | null;
}

export interface VendorRiskProfile {
  vendor_id: string;
  vendor_name: string;
  overall_score: number | null;
  overall_risk_level: RiskLevel | null;
  assessments: VendorDomainAssessmentWithDetails[];
  last_assessed_at: string | null;
  domains_assessed: number;
  domains_total: number;
}

// ============================================
// Input Types
// ============================================

export interface CreateDomainInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  weight: number;
}

export interface UpdateDomainInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  weight?: number;
  is_active?: boolean;
  order_index?: number;
}

export interface CreateCriterionInput {
  domain_id: string;
  name: string;
  description?: string;
  guidance?: string;
  weight: number;
  max_score?: number;
}

export interface UpdateCriterionInput {
  name?: string;
  description?: string;
  guidance?: string;
  weight?: number;
  max_score?: number;
  is_active?: boolean;
  order_index?: number;
}

export interface StartAssessmentInput {
  vendor_id: string;
  domain_id: string;
}

export interface SubmitAssessmentInput {
  assessment_id: string;
  scores: {
    criterion_id: string;
    score: number;
    notes?: string;
    evidence_document_ids?: string[];
  }[];
  notes?: string;
  key_findings?: string[];
  recommendations?: string[];
  next_assessment_date?: string;
}

export interface UpdateAssessmentInput {
  notes?: string;
  key_findings?: string[];
  recommendations?: string[];
  next_assessment_date?: string;
  status?: AssessmentStatus;
}

// ============================================
// Summary/Stats Types
// ============================================

export interface DomainAssessmentStats {
  total_vendors: number;
  assessed_vendors: number;
  pending_assessments: number;
  overdue_assessments: number;
  average_score: number | null;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface VendorAssessmentSummary {
  vendor_id: string;
  vendor_name: string;
  domains: {
    domain_id: string;
    domain_name: string;
    score: number | null;
    risk_level: RiskLevel | null;
    status: AssessmentStatus;
    last_assessed: string | null;
  }[];
  overall_score: number | null;
  overall_risk: RiskLevel | null;
}
