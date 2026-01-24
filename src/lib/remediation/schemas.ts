/**
 * Remediation Schemas
 * Zod validation schemas for remediation forms
 */

import { z } from 'zod';

export const planStatusSchema = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
]);

export const actionStatusSchema = z.enum([
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'blocked',
  'completed',
  'cancelled',
]);

export const sourceTypeSchema = z.enum([
  'vendor_assessment',
  'nis2_risk',
  'dora_gap',
  'audit_finding',
  'questionnaire',
  'incident',
  'manual',
]);

export const actionTypeSchema = z.enum([
  'policy_update',
  'technical_control',
  'process_change',
  'training',
  'documentation',
  'vendor_engagement',
  'audit',
  'assessment',
  'procurement',
  'configuration',
  'monitoring',
  'other',
]);

export const prioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const frameworkSchema = z.enum([
  'nis2',
  'dora',
  'iso27001',
  'soc2',
  'gdpr',
  'general',
]);

export const evidenceTypeSchema = z.enum([
  'document',
  'screenshot',
  'url',
  'attestation',
  'report',
  'other',
]);

// ============================================================================
// Plan Schemas
// ============================================================================

export const createPlanSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  source_type: sourceTypeSchema,
  source_id: z.string().uuid().optional(),
  vendor_id: z.string().uuid().optional(),
  framework: frameworkSchema.optional(),
  priority: prioritySchema,
  risk_level: prioritySchema.optional(),
  target_date: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  estimated_cost: z.number().min(0).optional(),
  cost_currency: z.string().default('EUR'),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const updatePlanSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  framework: frameworkSchema.optional(),
  priority: prioritySchema.optional(),
  risk_level: prioritySchema.optional(),
  target_date: z.string().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  estimated_cost: z.number().min(0).optional(),
  actual_cost: z.number().min(0).optional(),
  cost_currency: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// ============================================================================
// Action Schemas
// ============================================================================

export const createActionSchema = z.object({
  plan_id: z.string().uuid(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  action_type: actionTypeSchema,
  priority: prioritySchema,
  due_date: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  assignee_id: z.string().uuid().optional(),
  reviewer_id: z.string().uuid().optional(),
  requires_evidence: z.boolean().default(false),
  evidence_description: z.string().optional(),
  control_id: z.string().uuid().optional(),
  requirement_reference: z.string().optional(),
  depends_on: z.array(z.string().uuid()).optional(),
});

export const updateActionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  action_type: actionTypeSchema.optional(),
  priority: prioritySchema.optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  actual_hours: z.number().min(0).optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  reviewer_id: z.string().uuid().nullable().optional(),
  requires_evidence: z.boolean().optional(),
  evidence_description: z.string().optional(),
  control_id: z.string().uuid().optional(),
  requirement_reference: z.string().optional(),
  depends_on: z.array(z.string().uuid()).optional(),
});

// ============================================================================
// Evidence Schemas
// ============================================================================

export const addEvidenceSchema = z.object({
  action_id: z.string().uuid(),
  evidence_type: evidenceTypeSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  document_id: z.string().uuid().optional(),
  external_url: z.string().url().optional(),
  attestation_text: z.string().optional(),
});

// ============================================================================
// Types
// ============================================================================

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
export type AddEvidenceInput = z.infer<typeof addEvidenceSchema>;
