/**
 * NIS2 Vendor Questionnaire System - Database Queries
 *
 * Server-side data fetching functions for questionnaires
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type {
  QuestionnaireTemplate,
  TemplateQuestion,
  VendorQuestionnaire,
  QuestionnaireAnswer,
  QuestionnaireDocument,
  AIExtraction,
  QuestionnaireSummary,
  QuestionnaireStats,
  VendorPortalData,
  TokenValidationResult,
  QuestionnaireFilters,
  QuestionnaireSort,
} from './types';

// ============================================================================
// TEMPLATE QUERIES
// ============================================================================

/**
 * Get all templates for the organization
 */
export async function getTemplates(
  organizationId?: string
): Promise<QuestionnaireTemplate[]> {
  const supabase = await createClient();

  let query = supabase
    .from('nis2_questionnaire_templates')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching templates:', error);
    throw new Error('Failed to fetch questionnaire templates');
  }

  return data || [];
}

/**
 * Get a single template by ID
 */
export async function getTemplate(templateId: string): Promise<QuestionnaireTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_questionnaire_templates')
    .select('*')
    .eq('id', templateId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching template:', error);
    throw new Error('Failed to fetch questionnaire template');
  }

  return data;
}

/**
 * Get template with its questions
 */
export async function getTemplateWithQuestions(
  templateId: string
): Promise<{ template: QuestionnaireTemplate; questions: TemplateQuestion[] } | null> {
  const supabase = await createClient();

  const [templateResult, questionsResult] = await Promise.all([
    supabase
      .from('nis2_questionnaire_templates')
      .select('*')
      .eq('id', templateId)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('nis2_template_questions')
      .select('*')
      .eq('template_id', templateId)
      .order('display_order', { ascending: true }),
  ]);

  if (templateResult.error) {
    if (templateResult.error.code === 'PGRST116') return null;
    throw new Error('Failed to fetch template');
  }

  if (questionsResult.error) {
    throw new Error('Failed to fetch template questions');
  }

  return {
    template: templateResult.data,
    questions: questionsResult.data || [],
  };
}

/**
 * Get questions for a template
 */
export async function getTemplateQuestions(templateId: string): Promise<TemplateQuestion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_template_questions')
    .select('*')
    .eq('template_id', templateId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching template questions:', error);
    throw new Error('Failed to fetch template questions');
  }

  return data || [];
}

// ============================================================================
// QUESTIONNAIRE QUERIES
// ============================================================================

/**
 * Get questionnaires with optional filtering
 */
export async function getQuestionnaires(
  filters?: QuestionnaireFilters,
  sort?: QuestionnaireSort,
  limit = 50,
  offset = 0
): Promise<{ data: QuestionnaireSummary[]; count: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('nis2_questionnaire_summary')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }
  if (filters?.vendor_id) {
    query = query.eq('vendor_id', filters.vendor_id);
  }
  if (filters?.template_id) {
    query = query.eq('template_id', filters.template_id);
  }
  if (filters?.due_date_from) {
    query = query.gte('due_date', filters.due_date_from);
  }
  if (filters?.due_date_to) {
    query = query.lte('due_date', filters.due_date_to);
  }
  if (filters?.search) {
    query = query.or(
      `vendor_name.ilike.%${filters.search}%,vendor_email.ilike.%${filters.search}%,vendor_company_name.ilike.%${filters.search}%`
    );
  }

  // Apply sorting
  const sortField = sort?.field || 'created_at';
  const sortDir = sort?.direction === 'asc' ? true : false;
  query = query.order(sortField, { ascending: sortDir });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching questionnaires:', error);
    throw new Error('Failed to fetch questionnaires');
  }

  return {
    data: data || [],
    count: count || 0,
  };
}

/**
 * Get a single questionnaire by ID
 */
export async function getQuestionnaire(
  questionnaireId: string
): Promise<VendorQuestionnaire | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_vendor_questionnaires')
    .select('*')
    .eq('id', questionnaireId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching questionnaire:', error);
    throw new Error('Failed to fetch questionnaire');
  }

  return data;
}

/**
 * Get questionnaire with all related data
 */
export async function getQuestionnaireWithDetails(
  questionnaireId: string
): Promise<{
  questionnaire: VendorQuestionnaire;
  template: QuestionnaireTemplate;
  questions: TemplateQuestion[];
  answers: QuestionnaireAnswer[];
  documents: QuestionnaireDocument[];
} | null> {
  const supabase = await createClient();

  const { data: questionnaire, error: qError } = await supabase
    .from('nis2_vendor_questionnaires')
    .select('*')
    .eq('id', questionnaireId)
    .single();

  if (qError || !questionnaire) {
    if (qError?.code === 'PGRST116') return null;
    throw new Error('Failed to fetch questionnaire');
  }

  const [templateResult, questionsResult, answersResult, documentsResult] = await Promise.all([
    supabase
      .from('nis2_questionnaire_templates')
      .select('*')
      .eq('id', questionnaire.template_id)
      .single(),
    supabase
      .from('nis2_template_questions')
      .select('*')
      .eq('template_id', questionnaire.template_id)
      .order('display_order', { ascending: true }),
    supabase
      .from('nis2_questionnaire_answers')
      .select('*')
      .eq('questionnaire_id', questionnaireId),
    supabase
      .from('nis2_questionnaire_documents')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('uploaded_at', { ascending: false }),
  ]);

  if (templateResult.error) throw new Error('Failed to fetch template');

  return {
    questionnaire,
    template: templateResult.data,
    questions: questionsResult.data || [],
    answers: answersResult.data || [],
    documents: documentsResult.data || [],
  };
}

/**
 * Get questionnaire statistics for organization
 */
export async function getQuestionnaireStats(
  organizationId?: string
): Promise<QuestionnaireStats | null> {
  const supabase = await createClient();

  let query = supabase
    .from('nis2_questionnaire_stats')
    .select('*');

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching questionnaire stats:', error);
    return null;
  }

  return data;
}

// ============================================================================
// ANSWER QUERIES
// ============================================================================

/**
 * Get answers for a questionnaire
 */
export async function getQuestionnaireAnswers(
  questionnaireId: string
): Promise<QuestionnaireAnswer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_questionnaire_answers')
    .select('*')
    .eq('questionnaire_id', questionnaireId);

  if (error) {
    console.error('Error fetching answers:', error);
    throw new Error('Failed to fetch questionnaire answers');
  }

  return data || [];
}

/**
 * Get a single answer
 */
export async function getAnswer(
  questionnaireId: string,
  questionId: string
): Promise<QuestionnaireAnswer | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_questionnaire_answers')
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .eq('question_id', questionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error('Failed to fetch answer');
  }

  return data;
}

// ============================================================================
// DOCUMENT QUERIES
// ============================================================================

/**
 * Get documents for a questionnaire
 */
export async function getQuestionnaireDocuments(
  questionnaireId: string
): Promise<QuestionnaireDocument[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_questionnaire_documents')
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw new Error('Failed to fetch questionnaire documents');
  }

  return data || [];
}

// ============================================================================
// AI EXTRACTION QUERIES
// ============================================================================

/**
 * Get AI extractions for a questionnaire
 */
export async function getAIExtractions(questionnaireId: string): Promise<AIExtraction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_ai_extractions')
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching AI extractions:', error);
    throw new Error('Failed to fetch AI extractions');
  }

  return data || [];
}

/**
 * Get latest extraction for a questionnaire
 */
export async function getLatestExtraction(
  questionnaireId: string
): Promise<AIExtraction | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_ai_extractions')
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error('Failed to fetch latest extraction');
  }

  return data;
}

// ============================================================================
// VENDOR PORTAL QUERIES (Token-based)
// ============================================================================

/**
 * Validate questionnaire access token
 * Uses service role to bypass RLS
 */
export async function validateQuestionnaireToken(
  token: string
): Promise<TokenValidationResult> {
  // Use service role client for public vendor portal pages (no auth session)
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc('validate_questionnaire_token', {
    token,
  });

  if (error) {
    console.error('Error validating token:', error);
    return {
      questionnaire_id: null,
      organization_name: null,
      vendor_name: null,
      template_name: null,
      status: null,
      is_valid: false,
      message: 'Failed to validate access link',
    };
  }

  return data?.[0] || {
    questionnaire_id: null,
    organization_name: null,
    vendor_name: null,
    template_name: null,
    status: null,
    is_valid: false,
    message: 'Invalid or expired access link',
  };
}

/**
 * Get vendor portal data by token
 * Returns all data needed for the vendor portal
 */
export async function getVendorPortalData(token: string): Promise<VendorPortalData | null> {
  // Use service role client for public vendor portal pages (no auth session)
  const supabase = createServiceRoleClient();

  // First validate the token
  const validation = await validateQuestionnaireToken(token);
  if (!validation.is_valid || !validation.questionnaire_id) {
    return null;
  }

  // Fetch all required data
  const { data: questionnaire, error: qError } = await supabase
    .from('nis2_vendor_questionnaires')
    .select('*')
    .eq('access_token', token)
    .single();

  if (qError || !questionnaire) {
    return null;
  }

  const [templateResult, questionsResult, answersResult, documentsResult, orgResult, vendorResult] =
    await Promise.all([
      supabase
        .from('nis2_questionnaire_templates')
        .select('*')
        .eq('id', questionnaire.template_id)
        .single(),
      supabase
        .from('nis2_template_questions')
        .select('*')
        .eq('template_id', questionnaire.template_id)
        .order('display_order', { ascending: true }),
      supabase
        .from('nis2_questionnaire_answers')
        .select('*')
        .eq('questionnaire_id', questionnaire.id),
      supabase
        .from('nis2_questionnaire_documents')
        .select('*')
        .eq('questionnaire_id', questionnaire.id)
        .order('uploaded_at', { ascending: false }),
      supabase
        .from('organizations')
        .select('name')
        .eq('id', questionnaire.organization_id)
        .single(),
      supabase
        .from('vendors')
        .select('name')
        .eq('id', questionnaire.vendor_id)
        .single(),
    ]);

  if (templateResult.error) {
    console.error('Error fetching template:', templateResult.error);
    return null;
  }

  return {
    questionnaire,
    template: templateResult.data,
    questions: questionsResult.data || [],
    answers: answersResult.data || [],
    documents: documentsResult.data || [],
    organization_name: orgResult.data?.name || 'Unknown Organization',
    vendor_company_name: vendorResult.data?.name || 'Unknown Vendor',
  };
}

// ============================================================================
// AGGREGATION QUERIES
// ============================================================================

/**
 * Get questionnaires pending review
 */
export async function getPendingReviewQuestionnaires(
  organizationId?: string
): Promise<QuestionnaireSummary[]> {
  return (
    await getQuestionnaires(
      {
        status: ['submitted'],
        ...(organizationId ? {} : {}),
      },
      { field: 'submitted_at', direction: 'asc' },
      50
    )
  ).data;
}

/**
 * Get overdue questionnaires
 */
export async function getOverdueQuestionnaires(
  organizationId?: string
): Promise<QuestionnaireSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from('nis2_questionnaire_summary')
    .select('*')
    .not('status', 'in', '("approved","submitted","expired")')
    .lt('due_date', new Date().toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching overdue questionnaires:', error);
    return [];
  }

  return data || [];
}

/**
 * Get questionnaire count by status
 */
export async function getQuestionnaireCountByStatus(
  organizationId?: string
): Promise<Record<string, number>> {
  const stats = await getQuestionnaireStats(organizationId);
  if (!stats) return {};

  return {
    draft: stats.draft_count,
    sent: stats.sent_count,
    in_progress: stats.in_progress_count,
    submitted: stats.submitted_count,
    approved: stats.approved_count,
    rejected: stats.rejected_count,
    expired: stats.expired_count,
  };
}
