/**
 * Maturity History Types
 *
 * Type definitions for historical maturity tracking and trend analysis.
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type MaturityLevel = 0 | 1 | 2 | 3 | 4;

export const MATURITY_LABELS: Record<MaturityLevel, string> = {
  0: 'L0 - Not Performed',
  1: 'L1 - Informal',
  2: 'L2 - Planned & Tracked',
  3: 'L3 - Well-Defined',
  4: 'L4 - Quantitatively Managed',
};

export const MATURITY_SHORT_LABELS: Record<MaturityLevel, string> = {
  0: 'L0',
  1: 'L1',
  2: 'L2',
  3: 'L3',
  4: 'L4',
};

export const MATURITY_COLORS: Record<MaturityLevel, string> = {
  0: '#EF4444', // Red
  1: '#F97316', // Orange
  2: '#F59E0B', // Amber
  3: '#3B82F6', // Blue
  4: '#10B981', // Green
};

export type SnapshotType =
  | 'scheduled'
  | 'manual'
  | 'soc2_upload'
  | 'assessment'
  | 'remediation'
  | 'baseline';

export const SNAPSHOT_TYPE_LABELS: Record<SnapshotType, string> = {
  scheduled: 'Scheduled Snapshot',
  manual: 'Manual Snapshot',
  soc2_upload: 'SOC 2 Upload',
  assessment: 'Assessment Complete',
  remediation: 'Gap Remediation',
  baseline: 'Initial Baseline',
};

export type ChangeType =
  | 'maturity_level_change'
  | 'requirement_status_change'
  | 'evidence_added'
  | 'evidence_removed'
  | 'gap_identified'
  | 'gap_remediated'
  | 'assessment_completed'
  | 'score_recalculated';

export type DORAPllar =
  | 'ict_risk_management'
  | 'incident_reporting'
  | 'resilience_testing'
  | 'third_party_risk'
  | 'information_sharing';

export const PILLAR_LABELS: Record<DORAPllar, string> = {
  ict_risk_management: 'ICT Risk Management',
  incident_reporting: 'Incident Reporting',
  resilience_testing: 'Resilience Testing',
  third_party_risk: 'Third-Party Risk',
  information_sharing: 'Information Sharing',
};

export const PILLAR_WEIGHTS: Record<DORAPllar, number> = {
  ict_risk_management: 3,
  incident_reporting: 3,
  resilience_testing: 2,
  third_party_risk: 3,
  information_sharing: 1,
};

// =============================================================================
// DATABASE TYPES
// =============================================================================

export interface MaturitySnapshot {
  id: string;
  organization_id: string;
  vendor_id?: string | null;
  snapshot_type: SnapshotType;
  snapshot_date: string;

  // Overall maturity
  overall_maturity_level: MaturityLevel;
  overall_maturity_label: string;
  overall_readiness_percent: number;

  // Per-pillar maturity levels
  pillar_ict_risk_mgmt: MaturityLevel;
  pillar_incident_reporting: MaturityLevel;
  pillar_resilience_testing: MaturityLevel;
  pillar_third_party_risk: MaturityLevel;
  pillar_info_sharing: MaturityLevel;

  // Per-pillar percentages
  pillar_ict_risk_mgmt_percent: number;
  pillar_incident_reporting_percent: number;
  pillar_resilience_testing_percent: number;
  pillar_third_party_risk_percent: number;
  pillar_info_sharing_percent: number;

  // Gap metrics
  total_requirements: number;
  requirements_met: number;
  requirements_partial: number;
  requirements_not_met: number;
  critical_gaps_count: number;
  high_gaps_count: number;
  medium_gaps_count: number;
  low_gaps_count: number;

  // Details
  critical_gaps: CriticalGap[];
  estimated_remediation_weeks?: number | null;
  change_from_previous?: SnapshotChange | null;

  // Audit
  created_by?: string | null;
  created_at: string;
  notes?: string | null;
}

export interface CriticalGap {
  requirement_id: string;
  article: string;
  description: string;
  pillar: DORAPllar;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface SnapshotChange {
  overall_change: number;
  previous_overall: MaturityLevel;
  previous_date: string;
  pillar_changes: {
    ict_risk_mgmt: number;
    incident_reporting: number;
    resilience_testing: number;
    third_party_risk: number;
    info_sharing: number;
  };
  gaps_change: number;
}

export interface MaturityChangeLog {
  id: string;
  organization_id: string;
  vendor_id?: string | null;
  change_type: ChangeType;
  pillar?: DORAPllar | null;
  requirement_id?: string | null;
  previous_value: unknown;
  new_value: unknown;
  maturity_impact: number;
  changed_by?: string | null;
  changed_at: string;
  change_reason?: string | null;
  source?: string | null;
  related_document_id?: string | null;
  related_snapshot_id?: string | null;
}

export interface MaturitySnapshotSettings {
  id: string;
  organization_id: string;
  auto_snapshot_enabled: boolean;
  snapshot_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  snapshot_day_of_week?: number | null;
  snapshot_day_of_month?: number | null;
  notify_on_improvement: boolean;
  notify_on_regression: boolean;
  notify_threshold_change: number;
  retention_months: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface CreateSnapshotInput {
  vendor_id?: string;
  snapshot_type: SnapshotType;
  notes?: string;
}

export interface PillarScores {
  ict_risk_management: { level: MaturityLevel; percent: number };
  incident_reporting: { level: MaturityLevel; percent: number };
  resilience_testing: { level: MaturityLevel; percent: number };
  third_party_risk: { level: MaturityLevel; percent: number };
  information_sharing: { level: MaturityLevel; percent: number };
}

export interface GapCounts {
  total: number;
  met: number;
  partial: number;
  not_met: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface SnapshotData {
  overall_level: MaturityLevel;
  overall_percent: number;
  pillars: PillarScores;
  gaps: GapCounts;
  critical_gaps: CriticalGap[];
  estimated_weeks?: number;
}

// =============================================================================
// ANALYSIS TYPES
// =============================================================================

export interface TrendData {
  date: string;
  overall: MaturityLevel;
  percent: number;
  pillars: {
    ict_risk_mgmt: MaturityLevel;
    incident_reporting: MaturityLevel;
    resilience_testing: MaturityLevel;
    third_party_risk: MaturityLevel;
    info_sharing: MaturityLevel;
  };
}

export interface TrendAnalysis {
  snapshots: MaturitySnapshot[];
  trend_direction: 'improving' | 'stable' | 'declining';
  overall_change: number;
  days_analyzed: number;
  pillar_trends: Record<DORAPllar, 'improving' | 'stable' | 'declining'>;
  gaps_closed: number;
  gaps_opened: number;
  projected_l3_date?: string | null;
}

export interface MaturityComparison {
  current: MaturitySnapshot;
  previous: MaturitySnapshot;
  changes: {
    overall: number;
    percent: number;
    pillars: Record<string, number>;
    gaps: number;
  };
  improved_areas: string[];
  declined_areas: string[];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getMaturityLabel(level: MaturityLevel): string {
  return MATURITY_LABELS[level];
}

export function getMaturityColor(level: MaturityLevel): string {
  return MATURITY_COLORS[level];
}

export function getPillarLabel(pillar: DORAPllar): string {
  return PILLAR_LABELS[pillar];
}

export function calculateOverallFromPillars(pillars: PillarScores): MaturityLevel {
  const weights = PILLAR_WEIGHTS;
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [pillar, scores] of Object.entries(pillars)) {
    const weight = weights[pillar as DORAPllar];
    weightedSum += scores.level * weight;
    totalWeight += weight;
  }

  return Math.round(weightedSum / totalWeight) as MaturityLevel;
}

export function determineTrendDirection(
  snapshots: MaturitySnapshot[]
): 'improving' | 'stable' | 'declining' {
  if (snapshots.length < 2) return 'stable';

  const oldest = snapshots[snapshots.length - 1];
  const newest = snapshots[0];
  const change = newest.overall_maturity_level - oldest.overall_maturity_level;

  if (change > 0) return 'improving';
  if (change < 0) return 'declining';
  return 'stable';
}

export function formatMaturityChange(change: number): string {
  if (change > 0) return `+${change} level${change > 1 ? 's' : ''}`;
  if (change < 0) return `${change} level${change < -1 ? 's' : ''}`;
  return 'No change';
}
