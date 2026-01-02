/**
 * Incident Reporting Types
 *
 * DORA Article 19 - Major ICT-related incident reporting
 * Supports initial (4h), intermediate (72h), and final (1 month) reports
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export const INCIDENT_CLASSIFICATIONS = ['major', 'significant', 'minor'] as const;
export type IncidentClassification = typeof INCIDENT_CLASSIFICATIONS[number];

export const INCIDENT_TYPES = [
  'cyber_attack',
  'system_failure',
  'human_error',
  'third_party_failure',
  'natural_disaster',
  'other'
] as const;
export type IncidentType = typeof INCIDENT_TYPES[number];

export const INCIDENT_STATUSES = [
  'draft',
  'detected',
  'initial_submitted',
  'intermediate_submitted',
  'final_submitted',
  'closed'
] as const;
export type IncidentStatus = typeof INCIDENT_STATUSES[number];

export const REPORT_TYPES = ['initial', 'intermediate', 'final'] as const;
export type ReportType = typeof REPORT_TYPES[number];

export const REPORT_STATUSES = ['draft', 'ready', 'submitted', 'acknowledged'] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];

export const IMPACT_LEVELS = ['low', 'medium', 'high'] as const;
export type ImpactLevel = typeof IMPACT_LEVELS[number];

export const EVENT_TYPES = [
  'created',
  'classified',
  'reclassified',
  'escalated',
  'updated',
  'report_submitted',
  'report_acknowledged',
  'mitigation_started',
  'service_restored',
  'resolved',
  'closed'
] as const;
export type EventType = typeof EVENT_TYPES[number];

// ============================================================================
// Core Types
// ============================================================================

export interface Incident {
  id: string;
  organization_id: string;
  incident_ref: string;
  external_ref: string | null;
  classification: IncidentClassification;
  incident_type: IncidentType;
  status: IncidentStatus;

  // Timeline
  detection_datetime: string;
  occurrence_datetime: string | null;
  recovery_datetime: string | null;
  resolution_datetime: string | null;

  // Impact Assessment
  services_affected: string[];
  critical_functions_affected: string[];
  clients_affected_count: number | null;
  clients_affected_percentage: number | null;
  transactions_affected_count: number | null;
  transactions_value_affected: number | null;
  data_breach: boolean;
  data_records_affected: number | null;
  geographic_spread: string[];
  economic_impact: number | null;
  reputational_impact: ImpactLevel | null;
  duration_hours: number | null;

  // Details
  title: string;
  description: string | null;
  root_cause: string | null;
  remediation_actions: string | null;
  lessons_learned: string | null;

  // Classification Override (DORA audit trail)
  classification_calculated: IncidentClassification | null;
  classification_override: boolean;
  classification_override_justification: string | null;
  classification_override_at: string | null;
  classification_override_by: string | null;

  // Relations
  vendor_id: string | null;
  created_by: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface IncidentReport {
  id: string;
  incident_id: string;
  report_type: ReportType;
  version: number;
  status: ReportStatus;
  submitted_at: string | null;
  submitted_by: string | null;
  acknowledged_at: string | null;
  report_content: Record<string, unknown>;
  deadline: string;
  export_format: 'pdf' | 'xml' | 'json' | null;
  export_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentEvent {
  id: string;
  incident_id: string;
  event_type: EventType;
  event_datetime: string;
  description: string | null;
  user_id: string | null;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Extended Types with Relations
// ============================================================================

export interface IncidentWithRelations extends Incident {
  vendor?: {
    id: string;
    name: string;
    lei: string | null;
  } | null;
  reports?: IncidentReport[];
  events?: IncidentEvent[];
  created_by_user?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export interface IncidentListItem {
  id: string;
  incident_ref: string;
  title: string;
  classification: IncidentClassification;
  incident_type: IncidentType;
  status: IncidentStatus;
  detection_datetime: string;
  vendor_name: string | null;
  next_deadline: string | null;
  reports_count: number;
  created_at: string;
}

// ============================================================================
// Form/Input Types
// ============================================================================

export interface CreateIncidentInput {
  classification: IncidentClassification;
  incident_type: IncidentType;
  title: string;
  description?: string;
  detection_datetime: string;
  occurrence_datetime?: string;
  services_affected?: string[];
  critical_functions_affected?: string[];
  clients_affected_count?: number;
  clients_affected_percentage?: number;
  transactions_affected_count?: number;
  transactions_value_affected?: number;
  data_breach?: boolean;
  data_records_affected?: number;
  geographic_spread?: string[];
  economic_impact?: number;
  reputational_impact?: ImpactLevel;
  vendor_id?: string;
  root_cause?: string;
  remediation_actions?: string;
  // Classification override fields
  classification_calculated?: IncidentClassification;
  classification_override?: boolean;
  classification_override_justification?: string;
}

export interface UpdateIncidentInput extends Partial<CreateIncidentInput> {
  status?: IncidentStatus;
  recovery_datetime?: string;
  resolution_datetime?: string;
  lessons_learned?: string;
  duration_hours?: number;
}

export interface CreateReportInput {
  report_type: ReportType;
  report_content: Record<string, unknown>;
}

export interface CreateEventInput {
  event_type: EventType;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface IncidentFilters {
  status?: IncidentStatus | IncidentStatus[];
  classification?: IncidentClassification | IncidentClassification[];
  incident_type?: IncidentType | IncidentType[];
  vendor_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface IncidentSortOptions {
  field: 'detection_datetime' | 'created_at' | 'classification' | 'status';
  direction: 'asc' | 'desc';
}

// ============================================================================
// Dashboard/Stats Types
// ============================================================================

export interface IncidentStats {
  total: number;
  by_status: Record<IncidentStatus, number>;
  by_classification: Record<IncidentClassification, number>;
  by_type: Record<IncidentType, number>;
  pending_reports: number;
  overdue_reports: number;
  avg_resolution_hours: number | null;
}

export interface PendingDeadline {
  incident_id: string;
  incident_ref: string;
  incident_title: string;
  report_type: ReportType;
  deadline: string;
  hours_remaining: number;
  is_overdue: boolean;
}

// ============================================================================
// Classification Calculation Types
// ============================================================================

export interface ThresholdStatus {
  key: string;
  label: string;
  description: string;
  triggered: boolean;
  currentValue: string | number | boolean | null;
  thresholdValue: string | number;
  classification: 'major' | 'significant';
}

export interface ClassificationResult {
  calculated: IncidentClassification;
  triggeredThresholds: ThresholdStatus[];
  notTriggeredThresholds: ThresholdStatus[];
  requiresReporting: boolean;
  deadlines: {
    initial: Date | null;
    intermediate: Date | null;
    final: Date | null;
  } | null;
}

export interface ImpactData {
  clients_affected_count?: number;
  clients_affected_percentage?: number;
  transactions_affected_count?: number;
  transactions_value_affected?: number;
  duration_hours?: number;
  critical_functions_affected?: string[];
  data_breach?: boolean;
  data_records_affected?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getClassificationLabel(classification: IncidentClassification): string {
  const labels: Record<IncidentClassification, string> = {
    major: 'Major',
    significant: 'Significant',
    minor: 'Minor'
  };
  return labels[classification];
}

export function getClassificationColor(classification: IncidentClassification): string {
  const colors: Record<IncidentClassification, string> = {
    major: 'destructive',
    significant: 'warning',
    minor: 'secondary'
  };
  return colors[classification];
}

export function getStatusLabel(status: IncidentStatus): string {
  const labels: Record<IncidentStatus, string> = {
    draft: 'Draft',
    detected: 'Detected',
    initial_submitted: 'Initial Submitted',
    intermediate_submitted: 'Intermediate Submitted',
    final_submitted: 'Final Submitted',
    closed: 'Closed'
  };
  return labels[status];
}

export function getIncidentTypeLabel(type: IncidentType): string {
  const labels: Record<IncidentType, string> = {
    cyber_attack: 'Cyber Attack',
    system_failure: 'System Failure',
    human_error: 'Human Error',
    third_party_failure: 'Third-Party Failure',
    natural_disaster: 'Natural Disaster',
    other: 'Other'
  };
  return labels[type];
}

export function getReportTypeLabel(type: ReportType): string {
  const labels: Record<ReportType, string> = {
    initial: 'Initial Report',
    intermediate: 'Intermediate Report',
    final: 'Final Report'
  };
  return labels[type];
}

export function getReportDeadlineHours(type: ReportType): number {
  const hours: Record<ReportType, number> = {
    initial: 4,
    intermediate: 72,
    final: 720 // ~1 month (30 days)
  };
  return hours[type];
}

export function calculateDeadline(detectionDate: Date, reportType: ReportType): Date {
  const deadline = new Date(detectionDate);
  deadline.setHours(deadline.getHours() + getReportDeadlineHours(reportType));
  return deadline;
}

export function generateIncidentRef(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INC-${year}-${random}`;
}
