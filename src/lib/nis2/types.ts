/**
 * NIS2 Risk Management Types
 *
 * Types for the risk register, controls, assessments, and heat map visualization.
 * Aligned with database schema (019_nis2_risk_management.sql).
 */

import type { NIS2Category } from '../compliance/nis2-types';

// =============================================================================
// Enums (matching database enums)
// =============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RiskStatus = 'identified' | 'assessed' | 'treating' | 'monitoring' | 'closed';

export type TreatmentStrategy = 'mitigate' | 'accept' | 'transfer' | 'avoid';

export type ControlType = 'preventive' | 'detective' | 'corrective';

export type ControlStatus = 'planned' | 'implementing' | 'operational' | 'needs_improvement' | 'retired';

// =============================================================================
// Scale Types
// =============================================================================

export type LikelihoodScore = 1 | 2 | 3 | 4 | 5;
export type ImpactScore = 1 | 2 | 3 | 4 | 5;
export type EffectivenessScore = number; // 0-100

// =============================================================================
// Labels and Descriptions
// =============================================================================

export const RISK_LEVEL_CONFIG: Record<RiskLevel, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  minScore: number;
  maxScore: number;
}> = {
  low: {
    label: 'Low',
    color: '#10B981',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    minScore: 1,
    maxScore: 4,
  },
  medium: {
    label: 'Medium',
    color: '#F59E0B',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    minScore: 5,
    maxScore: 9,
  },
  high: {
    label: 'High',
    color: '#F97316',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    minScore: 10,
    maxScore: 15,
  },
  critical: {
    label: 'Critical',
    color: '#EF4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    minScore: 16,
    maxScore: 25,
  },
};

export const LIKELIHOOD_SCALE: Record<LikelihoodScore, {
  label: string;
  description: string;
  frequency: string;
}> = {
  1: {
    label: 'Rare',
    description: 'May occur only in exceptional circumstances',
    frequency: '< 1% per year',
  },
  2: {
    label: 'Unlikely',
    description: 'Could occur at some time',
    frequency: '1-10% per year',
  },
  3: {
    label: 'Possible',
    description: 'Might occur at some time',
    frequency: '10-50% per year',
  },
  4: {
    label: 'Likely',
    description: 'Will probably occur in most circumstances',
    frequency: '50-90% per year',
  },
  5: {
    label: 'Almost Certain',
    description: 'Expected to occur in most circumstances',
    frequency: '> 90% per year',
  },
};

export const IMPACT_SCALE: Record<ImpactScore, {
  label: string;
  description: string;
  financial: string;
  operational: string;
}> = {
  1: {
    label: 'Negligible',
    description: 'Minimal impact on operations or reputation',
    financial: '< €10K',
    operational: '< 1 hour downtime',
  },
  2: {
    label: 'Minor',
    description: 'Limited impact, easily recoverable',
    financial: '€10K - €100K',
    operational: '1-8 hours downtime',
  },
  3: {
    label: 'Moderate',
    description: 'Significant impact requiring management attention',
    financial: '€100K - €1M',
    operational: '8-24 hours downtime',
  },
  4: {
    label: 'Major',
    description: 'Serious impact on business objectives',
    financial: '€1M - €10M',
    operational: '1-7 days downtime',
  },
  5: {
    label: 'Catastrophic',
    description: 'Severe impact threatening business viability',
    financial: '> €10M',
    operational: '> 7 days downtime',
  },
};

export const EFFECTIVENESS_SCALE: Record<number, {
  label: string;
  description: string;
}> = {
  0: {
    label: 'None',
    description: 'No controls implemented',
  },
  25: {
    label: 'Minimal',
    description: 'Basic controls, not tested',
  },
  50: {
    label: 'Partial',
    description: 'Controls exist, partially effective',
  },
  75: {
    label: 'Substantial',
    description: 'Well-designed, operationally effective',
  },
  100: {
    label: 'Optimal',
    description: 'Fully effective, regularly tested',
  },
};

export const TREATMENT_STRATEGY_CONFIG: Record<TreatmentStrategy, {
  label: string;
  description: string;
  icon: string;
}> = {
  mitigate: {
    label: 'Mitigate',
    description: 'Implement additional controls to reduce risk',
    icon: 'shield',
  },
  accept: {
    label: 'Accept',
    description: 'Risk is within tolerance, monitor only',
    icon: 'check',
  },
  transfer: {
    label: 'Transfer',
    description: 'Shift risk via insurance or outsourcing',
    icon: 'arrow-right',
  },
  avoid: {
    label: 'Avoid',
    description: 'Eliminate the activity causing risk',
    icon: 'x',
  },
};

export const RISK_STATUS_CONFIG: Record<RiskStatus, {
  label: string;
  color: string;
  description: string;
}> = {
  identified: {
    label: 'Identified',
    color: 'text-slate-600',
    description: 'Risk has been identified but not yet assessed',
  },
  assessed: {
    label: 'Assessed',
    color: 'text-blue-600',
    description: 'Risk has been assessed with likelihood and impact',
  },
  treating: {
    label: 'Treating',
    color: 'text-amber-600',
    description: 'Treatment actions are in progress',
  },
  monitoring: {
    label: 'Monitoring',
    color: 'text-emerald-600',
    description: 'Risk is being actively monitored',
  },
  closed: {
    label: 'Closed',
    color: 'text-slate-400',
    description: 'Risk has been resolved or accepted',
  },
};

export const CONTROL_TYPE_CONFIG: Record<ControlType, {
  label: string;
  description: string;
  color: string;
}> = {
  preventive: {
    label: 'Preventive',
    description: 'Reduces likelihood of risk occurring',
    color: 'text-blue-600',
  },
  detective: {
    label: 'Detective',
    description: 'Identifies when risk has occurred',
    color: 'text-amber-600',
  },
  corrective: {
    label: 'Corrective',
    description: 'Reduces impact after risk occurs',
    color: 'text-emerald-600',
  },
};

// =============================================================================
// Core Entity Types
// =============================================================================

export interface NIS2Risk {
  id: string;
  organization_id: string;
  reference_code: string;
  title: string;
  description: string | null;
  category: NIS2Category;

  // Inherent risk
  likelihood_score: LikelihoodScore;
  impact_score: ImpactScore;
  inherent_risk_score: number;
  inherent_risk_level: RiskLevel;

  // Residual risk
  residual_likelihood: LikelihoodScore | null;
  residual_impact: ImpactScore | null;
  residual_risk_score: number | null;
  residual_risk_level: RiskLevel | null;
  combined_control_effectiveness: number | null;

  // Treatment
  treatment_strategy: TreatmentStrategy | null;
  treatment_plan: string | null;
  treatment_due_date: string | null;
  treatment_owner_id: string | null;

  // Status
  status: RiskStatus;
  review_date: string | null;
  last_assessed_at: string | null;

  // Tolerance
  is_within_tolerance: boolean | null;
  tolerance_threshold: number;

  // Ownership
  owner_id: string | null;

  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Joined fields (from views)
  control_count?: number;
  avg_control_effectiveness?: number;
}

export interface NIS2Control {
  id: string;
  organization_id: string;
  reference_code: string;
  title: string;
  description: string | null;
  category: NIS2Category;

  // Control details
  control_type: ControlType;
  implementation_status: ControlStatus;

  // Effectiveness
  design_effectiveness: number | null;
  operational_effectiveness: number | null;
  overall_effectiveness: number;

  // Evidence
  evidence_requirements: string[] | null;
  last_evidence_date: string | null;
  next_review_date: string | null;

  // Ownership
  owner_id: string | null;

  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Joined fields
  linked_risk_count?: number;
}

export interface NIS2RiskControl {
  id: string;
  risk_id: string;
  control_id: string;
  effectiveness_score: number;
  effectiveness_rationale: string | null;
  last_tested_at: string | null;
  next_test_due: string | null;
  test_result: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  // Joined control details
  control?: NIS2Control;
}

export interface NIS2RiskAssessment {
  id: string;
  risk_id: string;
  organization_id: string;
  assessment_date: string;

  // Inherent
  likelihood_score: LikelihoodScore;
  impact_score: ImpactScore;
  inherent_risk_score: number;
  inherent_risk_level: RiskLevel;

  // Residual
  residual_likelihood: LikelihoodScore | null;
  residual_impact: ImpactScore | null;
  residual_risk_score: number | null;
  residual_risk_level: RiskLevel | null;
  combined_control_effectiveness: number | null;

  // Context
  assessor_id: string | null;
  assessment_notes: string | null;
  treatment_strategy: TreatmentStrategy | null;

  created_at: string;
}

export interface NIS2ControlEvidence {
  id: string;
  control_id: string;
  document_id: string | null;
  evidence_type: string;
  title: string;
  description: string | null;
  external_url: string | null;
  valid_from: string | null;
  valid_until: string | null;
  created_by: string | null;
  created_at: string;
}

// =============================================================================
// Input Types - Defined in schema.ts via Zod
// =============================================================================
// Note: CreateRiskInput, UpdateRiskInput, CreateControlInput, UpdateControlInput,
// and LinkControlInput are exported from schema.ts using z.infer.

// =============================================================================
// Summary and Stats Types
// =============================================================================

export interface RiskSummary {
  total_risks: number;
  critical_inherent: number;
  high_inherent: number;
  medium_inherent: number;
  low_inherent: number;
  critical_residual: number;
  high_residual: number;
  medium_residual: number;
  low_residual: number;
  not_assessed: number;
  avg_inherent_score: number | null;
  avg_residual_score: number | null;
  avg_control_effectiveness: number | null;
}

export interface AggregateRiskPosition {
  // Average position on the matrix
  avg_likelihood: number;
  avg_impact: number;
  avg_score: number;
  risk_level: RiskLevel;

  // Distribution
  by_level: Record<RiskLevel, number>;

  // Target comparison
  target_score: number;
  gap_to_target: number;
  is_within_tolerance: boolean;

  // Trend (compared to previous period)
  trend: 'improving' | 'stable' | 'worsening';
  change_from_previous: number;
}

export interface CategoryRiskSummary {
  category: NIS2Category;
  total_risks: number;
  avg_inherent_score: number;
  avg_residual_score: number;
  critical_count: number;
  high_count: number;
}

// =============================================================================
// Heat Map Types
// =============================================================================

export interface HeatMapCell {
  likelihood: LikelihoodScore;
  impact: ImpactScore;
  score: number;
  level: RiskLevel;
  risks: {
    id: string;
    reference_code: string;
    title: string;
    category: NIS2Category;
  }[];
  risk_count: number;
  is_current_position: boolean;
  is_target_position: boolean;
  is_above_tolerance: boolean;
}

export type HeatMapData = HeatMapCell[][];

export interface HeatMapConfig {
  view: 'inherent' | 'residual';
  show_aggregate_position: boolean;
  show_target_position: boolean;
  tolerance_threshold: number;
  filter_category?: NIS2Category;
}

// =============================================================================
// Guidance Types
// =============================================================================

export interface RemediationAction {
  action: string;
  reduces_likelihood: boolean;
  reduces_impact: boolean;
  expected_reduction: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  linked_control_id?: string;
  linked_control_title?: string;
}

export interface RiskGuidance {
  risk_id: string;
  risk_title: string;
  current_position: {
    likelihood: LikelihoodScore;
    impact: ImpactScore;
    score: number;
    level: RiskLevel;
  };
  target_position: {
    likelihood: LikelihoodScore;
    impact: ImpactScore;
    score: number;
    level: RiskLevel;
  };
  recommended_actions: RemediationAction[];
  estimated_time_to_target: string;
}

// =============================================================================
// Filter Types (defined in schema.ts via Zod)
// =============================================================================
// Note: RiskFilters and ControlFilters are exported from schema.ts
// using z.infer to derive types from Zod schemas.
