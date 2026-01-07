/**
 * Resilience Testing Validation Schemas
 *
 * Zod schemas for testing form validation
 * DORA Chapter IV - Articles 24-27
 */

import { z } from 'zod';
import {
  PROGRAMME_STATUSES,
  TEST_TYPES,
  TEST_STATUSES,
  TEST_RESULTS,
  TESTER_TYPES,
  FINDING_SEVERITIES,
  FINDING_STATUSES,
  TLPT_FRAMEWORKS,
  TLPT_STATUSES,
  TESTING_DOCUMENT_TYPES,
} from './types';

// ============================================================================
// Base Schemas
// ============================================================================

export const programmeStatusSchema = z.enum(PROGRAMME_STATUSES);
export const testTypeSchema = z.enum(TEST_TYPES);
export const testStatusSchema = z.enum(TEST_STATUSES);
export const testResultSchema = z.enum(TEST_RESULTS);
export const testerTypeSchema = z.enum(TESTER_TYPES);
export const findingSeveritySchema = z.enum(FINDING_SEVERITIES);
export const findingStatusSchema = z.enum(FINDING_STATUSES);
export const tlptFrameworkSchema = z.enum(TLPT_FRAMEWORKS);
export const tlptStatusSchema = z.enum(TLPT_STATUSES);
export const testingDocumentTypeSchema = z.enum(TESTING_DOCUMENT_TYPES);

// Flexible date validation
const flexibleDateSchema = z.string().refine(
  (val) => !Number.isNaN(Date.parse(val)),
  { message: 'Invalid date' }
).optional();

const flexibleDatetimeSchema = z.string().refine(
  (val) => !Number.isNaN(Date.parse(val)),
  { message: 'Invalid datetime' }
).transform((val) => new Date(val).toISOString());

// ============================================================================
// Testing Programme Schemas
// ============================================================================

export const programmeSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  programme_ref: z.string(),
  name: z.string().min(1).max(255),
  year: z.number().int().min(2020).max(2100),
  status: programmeStatusSchema,
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  approval_date: z.string().nullable(),
  approved_by: z.string().uuid().nullable(),
  programme_manager: z.string().uuid().nullable(),
  description: z.string().nullable(),
  scope: z.string().nullable(),
  objectives: z.array(z.string()),
  risk_assessment_basis: z.string().nullable(),
  critical_systems_in_scope: z.array(z.string()),
  budget_allocated: z.number().min(0).nullable(),
  budget_spent: z.number().min(0),
  created_by: z.string().uuid().nullable(),
  created_at: flexibleDatetimeSchema,
  updated_at: flexibleDatetimeSchema,
});

export const createProgrammeSchema = z.object({
  name: z.string().min(1, 'Programme name is required').max(255, 'Name too long'),
  year: z.number().int().min(2020, 'Year must be 2020 or later').max(2100),
  description: z.string().optional(),
  scope: z.string().optional(),
  objectives: z.array(z.string()).optional().default([]),
  risk_assessment_basis: z.string().optional(),
  critical_systems_in_scope: z.array(z.string()).optional().default([]),
  budget_allocated: z.number().min(0).optional(),
  start_date: flexibleDateSchema,
  end_date: flexibleDateSchema,
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['end_date'],
  }
);

export const updateProgrammeSchema = createProgrammeSchema.partial().extend({
  status: programmeStatusSchema.optional(),
  approval_date: flexibleDateSchema,
  budget_spent: z.number().min(0).optional(),
});

// ============================================================================
// Resilience Test Schemas
// ============================================================================

export const testSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  programme_id: z.string().uuid().nullable(),
  test_ref: z.string(),
  name: z.string().min(1).max(255),
  test_type: testTypeSchema,
  status: testStatusSchema,
  planned_start_date: z.string().nullable(),
  planned_end_date: z.string().nullable(),
  actual_start_date: z.string().nullable(),
  actual_end_date: z.string().nullable(),
  description: z.string().nullable(),
  methodology: z.string().nullable(),
  scope_description: z.string().nullable(),
  systems_in_scope: z.array(z.string()),
  tester_type: testerTypeSchema.nullable(),
  tester_name: z.string().nullable(),
  tester_organization: z.string().nullable(),
  tester_certifications: z.array(z.string()),
  tester_independence_verified: z.boolean(),
  overall_result: testResultSchema.nullable(),
  executive_summary: z.string().nullable(),
  findings_count: z.number().int().min(0),
  critical_findings_count: z.number().int().min(0),
  high_findings_count: z.number().int().min(0),
  medium_findings_count: z.number().int().min(0),
  low_findings_count: z.number().int().min(0),
  estimated_cost: z.number().min(0).nullable(),
  actual_cost: z.number().min(0).nullable(),
  vendor_id: z.string().uuid().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: flexibleDatetimeSchema,
  updated_at: flexibleDatetimeSchema,
});

export const createTestSchema = z.object({
  name: z.string().min(1, 'Test name is required').max(255, 'Name too long'),
  test_type: testTypeSchema,
  programme_id: z.string().uuid().optional(),
  description: z.string().optional(),
  methodology: z.string().optional(),
  scope_description: z.string().optional(),
  systems_in_scope: z.array(z.string()).optional().default([]),
  planned_start_date: flexibleDateSchema,
  planned_end_date: flexibleDateSchema,
  tester_type: testerTypeSchema.optional(),
  tester_name: z.string().optional(),
  tester_organization: z.string().optional(),
  tester_certifications: z.array(z.string()).optional().default([]),
  estimated_cost: z.number().min(0).optional(),
  vendor_id: z.string().uuid().optional(),
}).refine(
  (data) => {
    if (data.planned_start_date && data.planned_end_date) {
      return new Date(data.planned_start_date) <= new Date(data.planned_end_date);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['planned_end_date'],
  }
);

export const updateTestSchema = createTestSchema.partial().extend({
  status: testStatusSchema.optional(),
  actual_start_date: flexibleDateSchema,
  actual_end_date: flexibleDateSchema,
  overall_result: testResultSchema.optional(),
  executive_summary: z.string().optional(),
  actual_cost: z.number().min(0).optional(),
  tester_independence_verified: z.boolean().optional(),
});

// ============================================================================
// Test Finding Schemas
// ============================================================================

export const findingSchema = z.object({
  id: z.string().uuid(),
  test_id: z.string().uuid(),
  finding_ref: z.string(),
  title: z.string().min(1).max(255),
  severity: findingSeveritySchema,
  status: findingStatusSchema,
  description: z.string().min(1),
  affected_systems: z.array(z.string()),
  cvss_score: z.number().min(0).max(10).nullable(),
  cve_ids: z.array(z.string()),
  cwe_ids: z.array(z.string()),
  recommendation: z.string().nullable(),
  remediation_plan: z.string().nullable(),
  remediation_owner: z.string().uuid().nullable(),
  remediation_deadline: z.string().nullable(),
  remediation_date: z.string().nullable(),
  remediation_evidence: z.string().nullable(),
  verified_by: z.string().uuid().nullable(),
  verified_date: z.string().nullable(),
  verification_notes: z.string().nullable(),
  risk_acceptance_reason: z.string().nullable(),
  risk_acceptance_approved_by: z.string().uuid().nullable(),
  risk_acceptance_date: z.string().nullable(),
  risk_acceptance_expiry: z.string().nullable(),
  created_at: flexibleDatetimeSchema,
  updated_at: flexibleDatetimeSchema,
});

export const createFindingSchema = z.object({
  test_id: z.string().uuid(),
  title: z.string().min(1, 'Finding title is required').max(255, 'Title too long'),
  severity: findingSeveritySchema,
  description: z.string().min(1, 'Description is required'),
  affected_systems: z.array(z.string()).optional().default([]),
  cvss_score: z.number().min(0).max(10).optional(),
  cve_ids: z.array(z.string()).optional().default([]),
  cwe_ids: z.array(z.string()).optional().default([]),
  recommendation: z.string().optional(),
  remediation_deadline: flexibleDateSchema,
});

export const updateFindingSchema = createFindingSchema.partial().omit({ test_id: true }).extend({
  status: findingStatusSchema.optional(),
  remediation_plan: z.string().optional(),
  remediation_owner: z.string().uuid().optional(),
  remediation_date: flexibleDateSchema,
  remediation_evidence: z.string().optional(),
  verification_notes: z.string().optional(),
  risk_acceptance_reason: z.string().optional(),
  risk_acceptance_expiry: flexibleDateSchema,
}).refine(
  (data) => {
    // If status is risk_accepted, reason must be provided
    if (data.status === 'risk_accepted' && !data.risk_acceptance_reason) {
      return false;
    }
    return true;
  },
  {
    message: 'Risk acceptance reason is required when accepting risk',
    path: ['risk_acceptance_reason'],
  }
);

// ============================================================================
// TLPT Engagement Schemas
// ============================================================================

export const tlptSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  programme_id: z.string().uuid().nullable(),
  tlpt_ref: z.string(),
  name: z.string().min(1).max(255),
  framework: tlptFrameworkSchema,
  status: tlptStatusSchema,
  scope_defined: z.boolean(),
  scope_definition_date: z.string().nullable(),
  scope_systems: z.array(z.string()),
  scope_critical_functions: z.array(z.string()),
  ti_provider: z.string().nullable(),
  ti_provider_accreditation: z.string().nullable(),
  ti_start_date: z.string().nullable(),
  ti_end_date: z.string().nullable(),
  ti_report_received: z.boolean(),
  ti_report_date: z.string().nullable(),
  rt_provider: z.string().nullable(),
  rt_provider_accreditation: z.string().nullable(),
  rt_start_date: z.string().nullable(),
  rt_end_date: z.string().nullable(),
  rt_report_received: z.boolean(),
  rt_report_date: z.string().nullable(),
  purple_team_session_date: z.string().nullable(),
  remediation_plan_date: z.string().nullable(),
  attestation_date: z.string().nullable(),
  attestation_reference: z.string().nullable(),
  last_tlpt_date: z.string().nullable(),
  next_tlpt_due: z.string().nullable(),
  scenarios_tested: z.number().int().min(0),
  scenarios_successful: z.number().int().min(0),
  findings_count: z.number().int().min(0),
  critical_findings_count: z.number().int().min(0),
  estimated_cost: z.number().min(0).nullable(),
  actual_cost: z.number().min(0).nullable(),
  regulator_notified: z.boolean(),
  regulator_notification_date: z.string().nullable(),
  regulator_reference: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: flexibleDatetimeSchema,
  updated_at: flexibleDatetimeSchema,
});

export const createTLPTSchema = z.object({
  name: z.string().min(1, 'TLPT name is required').max(255, 'Name too long'),
  framework: tlptFrameworkSchema.optional().default('tiber_eu'),
  programme_id: z.string().uuid().optional(),
  scope_systems: z.array(z.string()).optional().default([]),
  scope_critical_functions: z.array(z.string()).optional().default([]),
  estimated_cost: z.number().min(0).optional(),
  next_tlpt_due: flexibleDateSchema,
});

export const updateTLPTSchema = createTLPTSchema.partial().extend({
  status: tlptStatusSchema.optional(),
  scope_defined: z.boolean().optional(),
  scope_definition_date: flexibleDateSchema,
  ti_provider: z.string().optional(),
  ti_provider_accreditation: z.string().optional(),
  ti_start_date: flexibleDateSchema,
  ti_end_date: flexibleDateSchema,
  ti_report_received: z.boolean().optional(),
  ti_report_date: flexibleDateSchema,
  rt_provider: z.string().optional(),
  rt_provider_accreditation: z.string().optional(),
  rt_start_date: flexibleDateSchema,
  rt_end_date: flexibleDateSchema,
  rt_report_received: z.boolean().optional(),
  rt_report_date: flexibleDateSchema,
  purple_team_session_date: flexibleDateSchema,
  remediation_plan_date: flexibleDateSchema,
  attestation_date: flexibleDateSchema,
  attestation_reference: z.string().optional(),
  scenarios_tested: z.number().int().min(0).optional(),
  scenarios_successful: z.number().int().min(0).optional(),
  findings_count: z.number().int().min(0).optional(),
  critical_findings_count: z.number().int().min(0).optional(),
  actual_cost: z.number().min(0).optional(),
  regulator_notified: z.boolean().optional(),
  regulator_notification_date: flexibleDateSchema,
  regulator_reference: z.string().optional(),
  last_tlpt_date: flexibleDateSchema,
});

// ============================================================================
// Testing Document Schema
// ============================================================================

export const createTestingDocumentSchema = z.object({
  document_id: z.string().uuid(),
  document_type: testingDocumentTypeSchema,
  description: z.string().optional(),
  test_id: z.string().uuid().optional(),
  tlpt_id: z.string().uuid().optional(),
  programme_id: z.string().uuid().optional(),
}).refine(
  (data) => {
    // At least one parent reference must be provided
    return data.test_id || data.tlpt_id || data.programme_id;
  },
  {
    message: 'At least one parent reference (test_id, tlpt_id, or programme_id) is required',
  }
);

// ============================================================================
// Filter Schemas
// ============================================================================

export const testFiltersSchema = z.object({
  status: z.union([testStatusSchema, z.array(testStatusSchema)]).optional(),
  test_type: z.union([testTypeSchema, z.array(testTypeSchema)]).optional(),
  programme_id: z.string().uuid().optional(),
  vendor_id: z.string().uuid().optional(),
  date_from: flexibleDateSchema,
  date_to: flexibleDateSchema,
  search: z.string().optional(),
});

export const findingFiltersSchema = z.object({
  test_id: z.string().uuid().optional(),
  severity: z.union([findingSeveritySchema, z.array(findingSeveritySchema)]).optional(),
  status: z.union([findingStatusSchema, z.array(findingStatusSchema)]).optional(),
  search: z.string().optional(),
});

export const tlptFiltersSchema = z.object({
  status: z.union([tlptStatusSchema, z.array(tlptStatusSchema)]).optional(),
  framework: z.union([tlptFrameworkSchema, z.array(tlptFrameworkSchema)]).optional(),
  programme_id: z.string().uuid().optional(),
  compliance_status: z.enum(['compliant', 'due_soon', 'overdue', 'not_scheduled']).optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

export function validateProgrammeData(data: unknown) {
  return createProgrammeSchema.safeParse(data);
}

export function validateTestData(data: unknown) {
  return createTestSchema.safeParse(data);
}

export function validateFindingData(data: unknown) {
  return createFindingSchema.safeParse(data);
}

export function validateTLPTData(data: unknown) {
  return createTLPTSchema.safeParse(data);
}

// ============================================================================
// Tester Certification Validation (Article 27)
// ============================================================================

export const RECOGNIZED_CERTIFICATIONS = [
  // Penetration Testing
  'CREST CRT',
  'CREST CCT',
  'OSCP',
  'OSCE',
  'OSEP',
  'OSWE',
  'GPEN',
  'GXPN',
  'CEH',
  'CPENT',
  'LPT',
  // Red Team
  'CRTO',
  'CRTL',
  'GREM',
  // Cloud Security
  'CCSP',
  'CCSK',
  // General Security
  'CISSP',
  'CISM',
  'CISA',
  // Code Review
  'CSSLP',
  'GWEB',
  // UK Specific
  'CHECK Team Leader',
  'CHECK Team Member',
  'TIGER Scheme',
] as const;

export type RecognizedCertification = typeof RECOGNIZED_CERTIFICATIONS[number];

export function validateTesterCertifications(certifications: string[]): {
  valid: string[];
  unrecognized: string[];
} {
  const valid: string[] = [];
  const unrecognized: string[] = [];

  for (const cert of certifications) {
    const normalized = cert.toUpperCase().trim();
    const isRecognized = RECOGNIZED_CERTIFICATIONS.some(
      (rc) => rc.toUpperCase() === normalized || normalized.includes(rc.toUpperCase())
    );

    if (isRecognized) {
      valid.push(cert);
    } else {
      unrecognized.push(cert);
    }
  }

  return { valid, unrecognized };
}

/**
 * Check if external tester meets Article 27 requirements
 * Article 27 requires highest suitability, expertise, accreditations
 */
export function validateExternalTesterRequirements(
  testerType: 'internal' | 'external' | 'hybrid',
  certifications: string[],
  independenceVerified: boolean
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (testerType === 'external' || testerType === 'hybrid') {
    // External testers should have at least one recognized certification
    const { valid } = validateTesterCertifications(certifications);
    if (valid.length === 0) {
      issues.push('External testers should have at least one recognized certification (CREST, OSCP, etc.)');
    }

    // Independence must be verified for external testers
    if (!independenceVerified) {
      issues.push('Tester independence must be verified for external/hybrid testers');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// TLPT Compliance Validation
// ============================================================================

/**
 * Validate TLPT is following proper TIBER-EU phases
 */
export function validateTLPTPhaseProgress(tlpt: {
  status: string;
  scope_defined: boolean;
  ti_report_received: boolean;
  rt_report_received: boolean;
}): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Moving to threat_intelligence requires scope to be defined
  if (tlpt.status === 'threat_intelligence' && !tlpt.scope_defined) {
    issues.push('Scope must be defined before entering Threat Intelligence phase');
  }

  // Moving to red_team_test requires TI report
  if (tlpt.status === 'red_team_test' && !tlpt.ti_report_received) {
    issues.push('Threat Intelligence report must be received before Red Team phase');
  }

  // Moving to closure requires RT report
  if ((tlpt.status === 'closure' || tlpt.status === 'remediation') && !tlpt.rt_report_received) {
    issues.push('Red Team report must be received before Closure phase');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
