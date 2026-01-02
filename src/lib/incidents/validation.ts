/**
 * Incident Validation Schemas
 *
 * Zod schemas for incident form validation
 */

import { z } from 'zod';
import {
  INCIDENT_CLASSIFICATIONS,
  INCIDENT_TYPES,
  INCIDENT_STATUSES,
  REPORT_TYPES,
  REPORT_STATUSES,
  IMPACT_LEVELS,
  EVENT_TYPES,
  calculateDeadline,
} from './types';
import type {
  ImpactData,
  ClassificationResult,
  ThresholdStatus,
  IncidentClassification,
} from './types';

// ============================================================================
// Base Schemas
// ============================================================================

export const incidentClassificationSchema = z.enum(INCIDENT_CLASSIFICATIONS);
export const incidentTypeSchema = z.enum(INCIDENT_TYPES);
export const incidentStatusSchema = z.enum(INCIDENT_STATUSES);
export const reportTypeSchema = z.enum(REPORT_TYPES);
export const reportStatusSchema = z.enum(REPORT_STATUSES);
export const impactLevelSchema = z.enum(IMPACT_LEVELS);
export const eventTypeSchema = z.enum(EVENT_TYPES);

// ============================================================================
// Incident Schemas
// ============================================================================

export const incidentSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  incident_ref: z.string(),
  external_ref: z.string().nullable(),
  classification: incidentClassificationSchema,
  incident_type: incidentTypeSchema,
  status: incidentStatusSchema,
  detection_datetime: z.string().datetime(),
  occurrence_datetime: z.string().datetime().nullable(),
  recovery_datetime: z.string().datetime().nullable(),
  resolution_datetime: z.string().datetime().nullable(),
  services_affected: z.array(z.string()),
  critical_functions_affected: z.array(z.string()),
  clients_affected_count: z.number().int().min(0).nullable(),
  clients_affected_percentage: z.number().min(0).max(100).nullable(),
  transactions_affected_count: z.number().int().min(0).nullable(),
  transactions_value_affected: z.number().min(0).nullable(),
  data_breach: z.boolean(),
  data_records_affected: z.number().int().min(0).nullable(),
  geographic_spread: z.array(z.string()),
  economic_impact: z.number().min(0).nullable(),
  reputational_impact: impactLevelSchema.nullable(),
  duration_hours: z.number().min(0).nullable(),
  title: z.string().min(1).max(255),
  description: z.string().nullable(),
  root_cause: z.string().nullable(),
  remediation_actions: z.string().nullable(),
  lessons_learned: z.string().nullable(),
  vendor_id: z.string().uuid().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createIncidentSchema = z.object({
  classification: incidentClassificationSchema,
  incident_type: incidentTypeSchema,
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  detection_datetime: z.string().datetime({ message: 'Invalid detection date' }),
  occurrence_datetime: z.string().datetime().optional(),
  services_affected: z.array(z.string()).optional().default([]),
  critical_functions_affected: z.array(z.string()).optional().default([]),
  clients_affected_count: z.number().int().min(0).optional(),
  clients_affected_percentage: z.number().min(0).max(100).optional(),
  transactions_affected_count: z.number().int().min(0).optional(),
  transactions_value_affected: z.number().min(0).optional(),
  data_breach: z.boolean().optional().default(false),
  data_records_affected: z.number().int().min(0).optional(),
  geographic_spread: z.array(z.string()).optional().default([]),
  economic_impact: z.number().min(0).optional(),
  reputational_impact: impactLevelSchema.optional(),
  vendor_id: z.string().uuid().optional(),
  root_cause: z.string().optional(),
  remediation_actions: z.string().optional(),
  // Classification override fields
  classification_calculated: incidentClassificationSchema.optional(),
  classification_override: z.boolean().optional().default(false),
  classification_override_justification: z.string().optional(),
}).refine(
  (data) => {
    // If override is true, justification must be at least 50 characters
    if (data.classification_override && (!data.classification_override_justification || data.classification_override_justification.length < 50)) {
      return false;
    }
    return true;
  },
  {
    message: 'Override justification must be at least 50 characters when overriding classification',
    path: ['classification_override_justification'],
  }
);

export const updateIncidentSchema = createIncidentSchema.partial().extend({
  status: incidentStatusSchema.optional(),
  recovery_datetime: z.string().datetime().optional(),
  resolution_datetime: z.string().datetime().optional(),
  lessons_learned: z.string().optional(),
  duration_hours: z.number().min(0).optional(),
});

// ============================================================================
// Report Schemas
// ============================================================================

export const reportContentSchema = z.record(z.string(), z.unknown());

export const createReportSchema = z.object({
  report_type: reportTypeSchema,
  report_content: reportContentSchema,
});

export const updateReportSchema = z.object({
  status: reportStatusSchema.optional(),
  report_content: reportContentSchema.optional(),
});

// ============================================================================
// Event Schemas
// ============================================================================

export const createEventSchema = z.object({
  event_type: eventTypeSchema,
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// Filter Schemas
// ============================================================================

export const incidentFiltersSchema = z.object({
  status: z.union([incidentStatusSchema, z.array(incidentStatusSchema)]).optional(),
  classification: z.union([incidentClassificationSchema, z.array(incidentClassificationSchema)]).optional(),
  incident_type: z.union([incidentTypeSchema, z.array(incidentTypeSchema)]).optional(),
  vendor_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

export function validateIncidentData(data: unknown) {
  return createIncidentSchema.safeParse(data);
}

export function validateReportContent(content: unknown) {
  return reportContentSchema.safeParse(content);
}

// ============================================================================
// Classification Validation Rules (DORA Article 19)
// ============================================================================

export const CLASSIFICATION_THRESHOLDS = {
  major: {
    clients_affected_percentage: 10,
    transactions_value_affected: 1000000, // €1M
    duration_hours: 2,
    critical_functions_count: 1,
    data_breach: true,
  },
  significant: {
    clients_affected_percentage: 5,
    transactions_value_affected: 100000, // €100K
    duration_hours: 4,
    critical_functions_count: 0,
    data_breach: false,
  },
} as const;

export function suggestClassification(data: {
  clients_affected_percentage?: number;
  transactions_value_affected?: number;
  duration_hours?: number;
  critical_functions_affected?: string[];
  data_breach?: boolean;
}): 'major' | 'significant' | 'minor' {
  const major = CLASSIFICATION_THRESHOLDS.major;
  const significant = CLASSIFICATION_THRESHOLDS.significant;

  // Check for major incident criteria
  if (
    (data.clients_affected_percentage && data.clients_affected_percentage >= major.clients_affected_percentage) ||
    (data.transactions_value_affected && data.transactions_value_affected >= major.transactions_value_affected) ||
    (data.duration_hours && data.duration_hours >= major.duration_hours) ||
    (data.critical_functions_affected && data.critical_functions_affected.length >= major.critical_functions_count) ||
    data.data_breach === true
  ) {
    return 'major';
  }

  // Check for significant incident criteria
  if (
    (data.clients_affected_percentage && data.clients_affected_percentage >= significant.clients_affected_percentage) ||
    (data.transactions_value_affected && data.transactions_value_affected >= significant.transactions_value_affected) ||
    (data.duration_hours && data.duration_hours >= significant.duration_hours)
  ) {
    return 'significant';
  }

  return 'minor';
}

/**
 * Comprehensive classification calculation with detailed threshold analysis
 * Returns full ClassificationResult with triggered/not-triggered thresholds
 */
export function calculateClassification(
  data: ImpactData,
  detectionDateTime?: string
): ClassificationResult {
  const major = CLASSIFICATION_THRESHOLDS.major;
  const significant = CLASSIFICATION_THRESHOLDS.significant;

  const allThresholds: ThresholdStatus[] = [
    // Major thresholds
    {
      key: 'data_breach',
      label: 'Data Breach',
      description: 'Any data breach automatically triggers Major classification',
      triggered: data.data_breach === true,
      currentValue: data.data_breach ?? false,
      thresholdValue: 'Any breach',
      classification: 'major',
    },
    {
      key: 'critical_functions',
      label: 'Critical Functions',
      description: 'One or more critical functions affected',
      triggered: (data.critical_functions_affected?.length ?? 0) >= major.critical_functions_count,
      currentValue: data.critical_functions_affected?.length ?? 0,
      thresholdValue: `≥${major.critical_functions_count}`,
      classification: 'major',
    },
    {
      key: 'clients_percentage_major',
      label: 'Client Impact (Major)',
      description: `≥${major.clients_affected_percentage}% of clients affected`,
      triggered: (data.clients_affected_percentage ?? 0) >= major.clients_affected_percentage,
      currentValue: data.clients_affected_percentage ?? null,
      thresholdValue: `≥${major.clients_affected_percentage}%`,
      classification: 'major',
    },
    {
      key: 'transaction_value_major',
      label: 'Transaction Value (Major)',
      description: `≥€${(major.transactions_value_affected / 1000000).toFixed(0)}M in transactions affected`,
      triggered: (data.transactions_value_affected ?? 0) >= major.transactions_value_affected,
      currentValue: data.transactions_value_affected ?? null,
      thresholdValue: `≥€${(major.transactions_value_affected / 1000000).toFixed(0)}M`,
      classification: 'major',
    },
    {
      key: 'duration_major',
      label: 'Duration (Major)',
      description: `≥${major.duration_hours} hours of service disruption`,
      triggered: (data.duration_hours ?? 0) >= major.duration_hours,
      currentValue: data.duration_hours ?? null,
      thresholdValue: `≥${major.duration_hours}h`,
      classification: 'major',
    },
    // Significant thresholds
    {
      key: 'clients_percentage_significant',
      label: 'Client Impact (Significant)',
      description: `≥${significant.clients_affected_percentage}% of clients affected`,
      triggered: (data.clients_affected_percentage ?? 0) >= significant.clients_affected_percentage && (data.clients_affected_percentage ?? 0) < major.clients_affected_percentage,
      currentValue: data.clients_affected_percentage ?? null,
      thresholdValue: `≥${significant.clients_affected_percentage}%`,
      classification: 'significant',
    },
    {
      key: 'transaction_value_significant',
      label: 'Transaction Value (Significant)',
      description: `≥€${(significant.transactions_value_affected / 1000).toFixed(0)}K in transactions affected`,
      triggered: (data.transactions_value_affected ?? 0) >= significant.transactions_value_affected && (data.transactions_value_affected ?? 0) < major.transactions_value_affected,
      currentValue: data.transactions_value_affected ?? null,
      thresholdValue: `≥€${(significant.transactions_value_affected / 1000).toFixed(0)}K`,
      classification: 'significant',
    },
    {
      key: 'duration_significant',
      label: 'Duration (Significant)',
      description: `≥${significant.duration_hours} hours of service disruption`,
      triggered: (data.duration_hours ?? 0) >= significant.duration_hours && (data.duration_hours ?? 0) < major.duration_hours,
      currentValue: data.duration_hours ?? null,
      thresholdValue: `≥${significant.duration_hours}h`,
      classification: 'significant',
    },
  ];

  const triggeredThresholds = allThresholds.filter(t => t.triggered);
  const notTriggeredThresholds = allThresholds.filter(t => !t.triggered);

  // Determine classification based on triggered thresholds
  let calculated: IncidentClassification = 'minor';

  const hasMajorTrigger = triggeredThresholds.some(t => t.classification === 'major');
  const hasSignificantTrigger = triggeredThresholds.some(t => t.classification === 'significant');

  if (hasMajorTrigger) {
    calculated = 'major';
  } else if (hasSignificantTrigger) {
    calculated = 'significant';
  }

  // Calculate deadlines if detection time is provided
  let deadlines: ClassificationResult['deadlines'] = null;
  if (detectionDateTime && (calculated === 'major' || calculated === 'significant')) {
    const detectionDate = new Date(detectionDateTime);
    deadlines = {
      initial: calculated === 'major' ? calculateDeadline(detectionDate, 'initial') : null,
      intermediate: calculateDeadline(detectionDate, 'intermediate'),
      final: null, // Final deadline is based on resolution, not detection
    };
  }

  return {
    calculated,
    triggeredThresholds,
    notTriggeredThresholds,
    requiresReporting: calculated === 'major' || calculated === 'significant',
    deadlines,
  };
}

/**
 * Format threshold value for display
 */
export function formatThresholdValue(threshold: ThresholdStatus): string {
  if (threshold.currentValue === null || threshold.currentValue === undefined) {
    return 'Not provided';
  }

  if (typeof threshold.currentValue === 'boolean') {
    return threshold.currentValue ? 'Yes' : 'No';
  }

  if (threshold.key.includes('transaction_value')) {
    const value = threshold.currentValue as number;
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  }

  if (threshold.key.includes('percentage')) {
    return `${threshold.currentValue}%`;
  }

  if (threshold.key.includes('duration')) {
    return `${threshold.currentValue}h`;
  }

  return String(threshold.currentValue);
}
