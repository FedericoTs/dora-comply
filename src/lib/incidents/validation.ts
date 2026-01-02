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
});

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
