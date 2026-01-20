/**
 * NIS2 Vendor Questionnaire System - Zod Schemas
 *
 * Validation schemas for questionnaire forms and API inputs
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const questionnaireStatusSchema = z.enum([
  'draft',
  'sent',
  'in_progress',
  'submitted',
  'approved',
  'rejected',
  'expired',
]);

export const answerSourceSchema = z.enum([
  'manual',
  'ai_extracted',
  'ai_confirmed',
  'ai_modified',
]);

export const questionTypeSchema = z.enum([
  'text',
  'textarea',
  'select',
  'multiselect',
  'boolean',
  'date',
  'number',
  'file',
]);

export const extractionStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const documentTypeSchema = z.enum([
  'soc2',
  'iso27001',
  'policy',
  'certificate',
  'other',
]);

export const nis2CategorySchema = z.enum([
  'policies',
  'incident_handling',
  'business_continuity',
  'supply_chain',
  'access_control',
  'cryptography',
  'vulnerability_management',
  'security_awareness',
  'asset_management',
  'hr_security',
]);

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const questionOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
});

export const validationRulesSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  required: z.boolean().optional(),
});

// ============================================================================
// TEMPLATE SCHEMAS
// ============================================================================

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional(),
  nis2_categories: z.array(nis2CategorySchema).optional().default([]),
  is_default: z.boolean().optional().default(false),
  estimated_completion_minutes: z.number().int().min(5).max(480).optional().default(30),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const createQuestionSchema = z.object({
  template_id: z.string().uuid(),
  question_text: z.string().min(1, 'Question text is required').max(2000),
  help_text: z.string().max(2000).optional(),
  question_type: questionTypeSchema.optional().default('text'),
  options: z.array(questionOptionSchema).optional().default([]),
  is_required: z.boolean().optional().default(true),
  validation_rules: validationRulesSchema.optional().default({}),
  ai_extraction_enabled: z.boolean().optional().default(true),
  ai_extraction_keywords: z.array(z.string()).optional().default([]),
  ai_extraction_prompt: z.string().max(2000).optional(),
  ai_confidence_threshold: z.number().min(0).max(1).optional().default(0.6),
  category: nis2CategorySchema,
  subcategory: z.string().max(100).optional(),
  display_order: z.number().int().min(0),
  section_title: z.string().max(255).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial().omit({ template_id: true });

// ============================================================================
// QUESTIONNAIRE SCHEMAS
// ============================================================================

export const sendQuestionnaireSchema = z.object({
  vendor_id: z.string().uuid(),
  template_id: z.string().uuid(),
  vendor_email: z.string().email('Valid email is required'),
  vendor_name: z.string().max(255).optional(),
  vendor_contact_name: z.string().max(255).optional(),
  due_date: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: 'Invalid date format' }
  ),
  send_email: z.boolean().optional().default(true),
});

export const reviewQuestionnaireSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  review_notes: z.string().max(2000).optional(),
});

// ============================================================================
// ANSWER SCHEMAS
// ============================================================================

export const submitAnswerSchema = z.object({
  questionnaire_id: z.string().uuid(),
  question_id: z.string().uuid(),
  answer_text: z.string().optional(),
  answer_json: z.unknown().optional(),
  source: answerSourceSchema.optional().default('manual'),
  vendor_confirmed: z.boolean().optional().default(false),
});

export const bulkSubmitAnswersSchema = z.object({
  questionnaire_id: z.string().uuid(),
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    answer_text: z.string().optional(),
    answer_json: z.unknown().optional(),
    source: answerSourceSchema.optional().default('manual'),
    vendor_confirmed: z.boolean().optional().default(false),
  })),
});

export const confirmAIAnswerSchema = z.object({
  questionnaire_id: z.string().uuid(),
  question_id: z.string().uuid(),
  confirmed: z.boolean(),
  modified_answer: z.string().optional(),
});

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

export const uploadDocumentSchema = z.object({
  questionnaire_id: z.string().uuid(),
  file_name: z.string().min(1).max(255),
  file_size: z.number().int().min(1).max(50 * 1024 * 1024), // Max 50MB
  file_type: z.string().min(1).max(100),
  document_type: documentTypeSchema,
  document_type_other: z.string().max(100).optional(),
});

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const questionnaireFiltersSchema = z.object({
  status: z.array(questionnaireStatusSchema).optional(),
  vendor_id: z.string().uuid().optional(),
  template_id: z.string().uuid().optional(),
  due_date_from: z.string().optional(),
  due_date_to: z.string().optional(),
  search: z.string().max(255).optional(),
});

export const questionnaireSortSchema = z.object({
  field: z.enum(['created_at', 'due_date', 'progress_percentage', 'vendor_name', 'status']),
  direction: z.enum(['asc', 'desc']),
});

// ============================================================================
// VENDOR PORTAL SCHEMAS
// ============================================================================

export const vendorPortalTokenSchema = z.object({
  token: z.string().uuid(),
});

export const vendorSubmitQuestionnaireSchema = z.object({
  questionnaire_id: z.string().uuid(),
  confirm_completion: z.boolean().refine(
    (val) => val === true,
    { message: 'You must confirm that all answers are complete and accurate' }
  ),
});

// ============================================================================
// AI EXTRACTION SCHEMAS
// ============================================================================

export const startExtractionSchema = z.object({
  questionnaire_id: z.string().uuid(),
  document_ids: z.array(z.string().uuid()).min(1),
});

export const extractedAnswerSchema = z.object({
  question_id: z.string().uuid(),
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  citation: z.string(),
  extraction_notes: z.string().optional(),
});

export const extractionSummarySchema = z.object({
  total_questions: z.number().int().min(0),
  total_extracted: z.number().int().min(0),
  high_confidence_count: z.number().int().min(0),
  medium_confidence_count: z.number().int().min(0),
  low_confidence_count: z.number().int().min(0),
  avg_confidence: z.number().min(0).max(1),
  document_pages_processed: z.number().int().min(0),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Use z.input for form types (before defaults applied), z.infer for validated output
export type CreateTemplateInput = z.input<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.input<typeof updateTemplateSchema>;
export type CreateQuestionInput = z.input<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.input<typeof updateQuestionSchema>;
export type SendQuestionnaireInput = z.input<typeof sendQuestionnaireSchema>;
export type ReviewQuestionnaireInput = z.input<typeof reviewQuestionnaireSchema>;
export type SubmitAnswerInput = z.input<typeof submitAnswerSchema>;
export type BulkSubmitAnswersInput = z.input<typeof bulkSubmitAnswersSchema>;
export type ConfirmAIAnswerInput = z.input<typeof confirmAIAnswerSchema>;
export type UploadDocumentInput = z.input<typeof uploadDocumentSchema>;
export type QuestionnaireFilters = z.infer<typeof questionnaireFiltersSchema>;
export type QuestionnaireSort = z.infer<typeof questionnaireSortSchema>;
export type VendorSubmitInput = z.infer<typeof vendorSubmitQuestionnaireSchema>;
export type StartExtractionInput = z.infer<typeof startExtractionSchema>;
export type ExtractedAnswer = z.infer<typeof extractedAnswerSchema>;
export type ExtractionSummary = z.infer<typeof extractionSummarySchema>;
