/**
 * NIS2 Risk Management Validation Schemas
 *
 * Zod schemas for validating risk and control inputs.
 */

import { z } from 'zod';

// =============================================================================
// Enum Schemas
// =============================================================================

export const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

export const riskStatusSchema = z.enum(['identified', 'assessed', 'treating', 'monitoring', 'closed']);

export const treatmentStrategySchema = z.enum(['mitigate', 'accept', 'transfer', 'avoid']);

export const controlTypeSchema = z.enum(['preventive', 'detective', 'corrective']);

export const controlStatusSchema = z.enum(['planned', 'implementing', 'operational', 'needs_improvement', 'retired']);

export const nis2CategorySchema = z.enum([
  'governance',
  'risk_management',
  'incident_handling',
  'business_continuity',
  'supply_chain',
  'reporting',
]);

// =============================================================================
// Scale Schemas
// =============================================================================

export const likelihoodScoreSchema = z.number().int().min(1).max(5);

export const impactScoreSchema = z.number().int().min(1).max(5);

export const effectivenessScoreSchema = z.number().int().min(0).max(100);

// =============================================================================
// Risk Schemas
// =============================================================================

export const createRiskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  category: nis2CategorySchema,
  likelihood_score: likelihoodScoreSchema,
  impact_score: impactScoreSchema,
  owner_id: z.string().uuid().optional(),
  treatment_strategy: treatmentStrategySchema.optional(),
  treatment_plan: z.string().max(2000).optional(),
  treatment_due_date: z.string().datetime().optional().or(z.literal('')),
  treatment_owner_id: z.string().uuid().optional(),
  tolerance_threshold: z.number().int().min(1).max(25).default(9),
});

export const updateRiskSchema = createRiskSchema.partial().extend({
  status: riskStatusSchema.optional(),
  review_date: z.string().datetime().optional().or(z.literal('')),
  residual_likelihood: likelihoodScoreSchema.optional(),
  residual_impact: impactScoreSchema.optional(),
  residual_risk_score: z.number().int().min(1).max(25).optional(),
  residual_risk_level: riskLevelSchema.optional(),
  combined_control_effectiveness: effectivenessScoreSchema.optional(),
  is_within_tolerance: z.boolean().optional(),
});

// =============================================================================
// Control Schemas
// =============================================================================

export const createControlSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  category: nis2CategorySchema,
  control_type: controlTypeSchema,
  implementation_status: controlStatusSchema.default('planned'),
  design_effectiveness: effectivenessScoreSchema.optional(),
  operational_effectiveness: effectivenessScoreSchema.optional(),
  evidence_requirements: z.array(z.string()).optional(),
  owner_id: z.string().uuid().optional(),
  next_review_date: z.string().datetime().optional().or(z.literal('')),
});

export const updateControlSchema = createControlSchema.partial().extend({
  last_evidence_date: z.string().datetime().optional(),
});

// =============================================================================
// Risk-Control Link Schemas
// =============================================================================

export const linkControlSchema = z.object({
  risk_id: z.string().uuid(),
  control_id: z.string().uuid(),
  effectiveness_score: effectivenessScoreSchema,
  effectiveness_rationale: z.string().max(1000).optional(),
  next_test_due: z.string().datetime().optional().or(z.literal('')),
});

export const updateLinkSchema = z.object({
  effectiveness_score: effectivenessScoreSchema.optional(),
  effectiveness_rationale: z.string().max(1000).optional(),
  next_test_due: z.string().datetime().optional().or(z.literal('')),
  last_tested_at: z.string().datetime().optional(),
  test_result: z.string().max(500).optional(),
});

// =============================================================================
// Assessment Schemas
// =============================================================================

export const createAssessmentSchema = z.object({
  risk_id: z.string().uuid(),
  likelihood_score: likelihoodScoreSchema,
  impact_score: impactScoreSchema,
  residual_likelihood: likelihoodScoreSchema.optional(),
  residual_impact: impactScoreSchema.optional(),
  assessment_notes: z.string().max(2000).optional(),
  treatment_strategy: treatmentStrategySchema.optional(),
});

// =============================================================================
// Evidence Schemas
// =============================================================================

export const createEvidenceSchema = z.object({
  control_id: z.string().uuid(),
  document_id: z.string().uuid().optional(),
  evidence_type: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  external_url: z.string().url().optional().or(z.literal('')),
  valid_from: z.string().datetime().optional().or(z.literal('')),
  valid_until: z.string().datetime().optional().or(z.literal('')),
});

// =============================================================================
// Filter Schemas
// =============================================================================

export const riskFiltersSchema = z.object({
  category: nis2CategorySchema.optional(),
  status: riskStatusSchema.optional(),
  inherent_level: riskLevelSchema.optional(),
  residual_level: riskLevelSchema.optional(),
  treatment_strategy: treatmentStrategySchema.optional(),
  owner_id: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
});

export const controlFiltersSchema = z.object({
  category: nis2CategorySchema.optional(),
  control_type: controlTypeSchema.optional(),
  implementation_status: controlStatusSchema.optional(),
  min_effectiveness: effectivenessScoreSchema.optional(),
  owner_id: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreateRiskInput = z.infer<typeof createRiskSchema>;
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>;
export type CreateControlInput = z.infer<typeof createControlSchema>;
export type UpdateControlInput = z.infer<typeof updateControlSchema>;
export type LinkControlInput = z.infer<typeof linkControlSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
export type RiskFilters = z.infer<typeof riskFiltersSchema>;
export type ControlFilters = z.infer<typeof controlFiltersSchema>;
