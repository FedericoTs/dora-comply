/**
 * Remediation Module
 * Export all remediation-related functionality
 */

// Types
export * from './types';

// Schemas (Zod validation)
export {
  planStatusSchema,
  actionStatusSchema,
  sourceTypeSchema,
  actionTypeSchema,
  prioritySchema,
  frameworkSchema,
  evidenceTypeSchema,
  createPlanSchema,
  updatePlanSchema,
  createActionSchema,
  updateActionSchema,
  addEvidenceSchema,
} from './schemas';

// Type exports from schemas
export type {
  CreatePlanInput as CreatePlanSchemaInput,
  UpdatePlanInput as UpdatePlanSchemaInput,
  CreateActionInput as CreateActionSchemaInput,
  UpdateActionInput as UpdateActionSchemaInput,
  AddEvidenceInput as AddEvidenceSchemaInput,
} from './schemas';

// Queries (server-side data fetching)
export * from './queries';

// Actions (server mutations)
export {
  createRemediationPlan,
  updateRemediationPlan,
  updatePlanStatus,
  deleteRemediationPlan,
  createRemediationAction,
  updateRemediationAction,
  updateActionStatus,
  reorderActions,
  deleteRemediationAction,
  addActionComment,
  addEvidence,
  verifyEvidence,
  deleteEvidence,
  bulkUpdateActionStatus,
  bulkAssignActions,
} from './actions';

// Input types from actions
export type {
  CreatePlanInput,
  UpdatePlanInput,
  CreateActionInput,
  UpdateActionInput,
  AddEvidenceInput,
} from './actions';
