/**
 * ESG (Environmental, Social, Governance) Module Types
 *
 * Types for vendor ESG assessments and sustainability tracking
 */

// ============================================
// Category and Metric Types
// ============================================

export interface ESGCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  weight: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type MetricType = 'numeric' | 'percentage' | 'boolean' | 'rating' | 'text';
export type TargetDirection = 'higher_better' | 'lower_better' | 'target';

export interface ESGMetric {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  unit: string | null;
  metric_type: MetricType;
  target_value: number | null;
  target_direction: TargetDirection | null;
  guidance: string | null;
  is_required: boolean;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Assessment Types
// ============================================

export type ESGRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AssessmentStatus = 'draft' | 'in_progress' | 'completed' | 'verified';
export type AssessmentPeriod = 'annual' | 'q1' | 'q2' | 'q3' | 'q4';

export interface VendorESGAssessment {
  id: string;
  vendor_id: string;
  assessment_year: number;
  assessment_period: AssessmentPeriod | null;

  // Scores
  overall_score: number | null;
  environmental_score: number | null;
  social_score: number | null;
  governance_score: number | null;

  // Classification
  esg_risk_level: ESGRiskLevel | null;

  // Metadata
  status: AssessmentStatus;
  assessed_by: string | null;
  assessed_at: string | null;
  verified_by: string | null;
  verified_at: string | null;

  // Summary
  notes: string | null;
  key_strengths: string[];
  improvement_areas: string[];

  // External data
  external_rating_provider: string | null;
  external_rating: string | null;
  external_rating_date: string | null;

  created_at: string;
  updated_at: string;
}

export interface VendorESGMetricValue {
  id: string;
  assessment_id: string;
  metric_id: string;

  // Values
  numeric_value: number | null;
  text_value: string | null;
  boolean_value: boolean | null;

  // Scoring
  score: number | null;

  // Evidence
  notes: string | null;
  evidence_document_ids: string[];
  source_url: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================
// Certification Types
// ============================================

export type CertificationType =
  | 'iso_14001'
  | 'iso_45001'
  | 'iso_26000'
  | 'bcorp'
  | 'leed'
  | 'carbon_neutral'
  | 'science_based_targets'
  | 'cdp'
  | 'gri'
  | 'sasb'
  | 'tcfd'
  | 'ungc'
  | 'ecovadis'
  | 'other';

export type CertificationStatus = 'active' | 'expired' | 'revoked' | 'pending';

export interface VendorESGCertification {
  id: string;
  vendor_id: string;
  certification_name: string;
  certification_type: CertificationType;
  issuing_body: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  certificate_url: string | null;
  document_id: string | null;
  status: CertificationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Commitment Types
// ============================================

export type CommitmentType =
  | 'net_zero'
  | 'carbon_reduction'
  | 'renewable_energy'
  | 'diversity_target'
  | 'supply_chain'
  | 'community'
  | 'other';

export type CommitmentStatus = 'on_track' | 'at_risk' | 'behind' | 'achieved' | 'abandoned';

export interface VendorESGCommitment {
  id: string;
  vendor_id: string;
  commitment_type: CommitmentType;
  title: string;
  description: string | null;
  target_date: string | null;
  target_value: string | null;
  current_progress: number | null;
  status: CommitmentStatus;
  source_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// History Types
// ============================================

export interface VendorESGHistory {
  id: string;
  vendor_id: string;
  assessment_date: string;
  overall_score: number | null;
  environmental_score: number | null;
  social_score: number | null;
  governance_score: number | null;
  esg_risk_level: ESGRiskLevel | null;
  scores_snapshot: Record<string, number> | null;
  created_at: string;
}

// ============================================
// Extended/Joined Types
// ============================================

export interface ESGCategoryWithMetrics extends ESGCategory {
  metrics: ESGMetric[];
}

export interface VendorESGAssessmentWithDetails extends VendorESGAssessment {
  metric_values: (VendorESGMetricValue & { metric: ESGMetric })[];
  assessed_by_user?: { full_name: string } | null;
  verified_by_user?: { full_name: string } | null;
}

export interface VendorESGProfile {
  vendor_id: string;
  vendor_name: string;
  latest_assessment: VendorESGAssessmentWithDetails | null;
  certifications: VendorESGCertification[];
  commitments: VendorESGCommitment[];
  history: VendorESGHistory[];
}

// ============================================
// Input Types
// ============================================

export interface CreateESGAssessmentInput {
  vendor_id: string;
  assessment_year: number;
  assessment_period?: AssessmentPeriod;
}

export interface SubmitESGAssessmentInput {
  assessment_id: string;
  metric_values: {
    metric_id: string;
    numeric_value?: number;
    text_value?: string;
    boolean_value?: boolean;
    notes?: string;
    source_url?: string;
  }[];
  notes?: string;
  key_strengths?: string[];
  improvement_areas?: string[];
  external_rating_provider?: string;
  external_rating?: string;
}

export interface CreateCertificationInput {
  vendor_id: string;
  certification_name: string;
  certification_type: CertificationType;
  issuing_body?: string;
  issue_date?: string;
  expiry_date?: string;
  certificate_url?: string;
  notes?: string;
}

export interface CreateCommitmentInput {
  vendor_id: string;
  commitment_type: CommitmentType;
  title: string;
  description?: string;
  target_date?: string;
  target_value?: string;
  current_progress?: number;
  source_url?: string;
  notes?: string;
}

// ============================================
// Stats Types
// ============================================

export interface ESGStats {
  total_vendors: number;
  assessed_vendors: number;
  average_score: number | null;
  average_environmental: number | null;
  average_social: number | null;
  average_governance: number | null;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

// ============================================
// Display Helpers
// ============================================

export const CERTIFICATION_LABELS: Record<CertificationType, string> = {
  iso_14001: 'ISO 14001 (Environmental Management)',
  iso_45001: 'ISO 45001 (Health & Safety)',
  iso_26000: 'ISO 26000 (Social Responsibility)',
  bcorp: 'B Corp Certification',
  leed: 'LEED Certification',
  carbon_neutral: 'Carbon Neutral Certification',
  science_based_targets: 'Science Based Targets (SBTi)',
  cdp: 'CDP Disclosure',
  gri: 'GRI Standards',
  sasb: 'SASB Standards',
  tcfd: 'TCFD Alignment',
  ungc: 'UN Global Compact',
  ecovadis: 'EcoVadis Rating',
  other: 'Other',
};

export const COMMITMENT_LABELS: Record<CommitmentType, string> = {
  net_zero: 'Net Zero Target',
  carbon_reduction: 'Carbon Reduction',
  renewable_energy: 'Renewable Energy',
  diversity_target: 'Diversity & Inclusion',
  supply_chain: 'Supply Chain Sustainability',
  community: 'Community Investment',
  other: 'Other',
};

export const COMMITMENT_STATUS_LABELS: Record<CommitmentStatus, string> = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  behind: 'Behind Schedule',
  achieved: 'Achieved',
  abandoned: 'Abandoned',
};
