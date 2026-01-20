/**
 * NIS2 Vendor Questionnaire System - Server Actions
 *
 * Server-side mutations for questionnaire management
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createTemplateSchema,
  updateTemplateSchema,
  createQuestionSchema,
  updateQuestionSchema,
  sendQuestionnaireSchema,
  reviewQuestionnaireSchema,
  submitAnswerSchema,
  bulkSubmitAnswersSchema,
  confirmAIAnswerSchema,
  uploadDocumentSchema,
  type CreateTemplateInput,
  type CreateQuestionInput,
  type SendQuestionnaireInput,
} from './schemas';
import type {
  QuestionnaireTemplate,
  TemplateQuestion,
  VendorQuestionnaire,
  QuestionnaireAnswer,
  QuestionnaireDocument,
} from './types';
import { getDefaultQuestionsWithOrder } from './questions-library';
import {
  sendEmail,
  generateQuestionnaireInviteEmail,
  generateQuestionnaireReminderEmail,
  generateQuestionnaireSubmittedEmail,
} from '@/lib/email';

// ============================================================================
// RESULT TYPES
// ============================================================================

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  return {
    userId: user.id,
    organizationId: userData?.organization_id,
  };
}

// ============================================================================
// TEMPLATE ACTIONS
// ============================================================================

/**
 * Create a new questionnaire template
 */
export async function createTemplate(
  input: CreateTemplateInput
): Promise<ActionResult<QuestionnaireTemplate>> {
  try {
    const parsed = createTemplateSchema.parse(input);
    const { userId, organizationId } = await getCurrentUser();

    if (!organizationId) {
      return { success: false, error: 'No organization found' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('nis2_questionnaire_templates')
      .insert({
        organization_id: organizationId,
        name: parsed.name,
        description: parsed.description,
        nis2_categories: parsed.nis2_categories,
        is_default: parsed.is_default,
        estimated_completion_minutes: parsed.estimated_completion_minutes,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return { success: false, error: 'Failed to create template' };
    }

    revalidatePath('/questionnaires/templates');
    return { success: true, data };
  } catch (error) {
    console.error('Create template error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template',
    };
  }
}

/**
 * Create template with default NIS2 questions
 */
export async function createTemplateWithDefaultQuestions(
  input: CreateTemplateInput
): Promise<ActionResult<{ template: QuestionnaireTemplate; questionCount: number }>> {
  try {
    const templateResult = await createTemplate(input);
    if (!templateResult.success || !templateResult.data) {
      return { success: false, error: templateResult.error };
    }

    const template = templateResult.data;
    const supabase = await createClient();

    // Get default questions
    const questions = getDefaultQuestionsWithOrder(template.id);

    // Insert all questions
    const { error: questionsError } = await supabase
      .from('nis2_template_questions')
      .insert(questions);

    if (questionsError) {
      console.error('Error inserting questions:', questionsError);
      // Rollback template creation
      await supabase.from('nis2_questionnaire_templates').delete().eq('id', template.id);
      return { success: false, error: 'Failed to create default questions' };
    }

    revalidatePath('/questionnaires/templates');
    return {
      success: true,
      data: { template, questionCount: questions.length },
    };
  } catch (error) {
    console.error('Create template with questions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template',
    };
  }
}

/**
 * Update an existing template
 */
export async function updateTemplate(
  templateId: string,
  input: Partial<CreateTemplateInput>
): Promise<ActionResult<QuestionnaireTemplate>> {
  try {
    const parsed = updateTemplateSchema.parse(input);
    await getCurrentUser();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('nis2_questionnaire_templates')
      .update(parsed)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return { success: false, error: 'Failed to update template' };
    }

    revalidatePath('/questionnaires/templates');
    revalidatePath(`/questionnaires/templates/${templateId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Update template error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update template',
    };
  }
}

/**
 * Delete a template (soft delete)
 */
export async function deleteTemplate(templateId: string): Promise<ActionResult> {
  try {
    await getCurrentUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from('nis2_questionnaire_templates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      return { success: false, error: 'Failed to delete template' };
    }

    revalidatePath('/questionnaires/templates');
    return { success: true };
  } catch (error) {
    console.error('Delete template error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete template',
    };
  }
}

// ============================================================================
// QUESTION ACTIONS
// ============================================================================

/**
 * Add a question to a template
 */
export async function addQuestion(
  input: CreateQuestionInput
): Promise<ActionResult<TemplateQuestion>> {
  try {
    const parsed = createQuestionSchema.parse(input);
    await getCurrentUser();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('nis2_template_questions')
      .insert(parsed)
      .select()
      .single();

    if (error) {
      console.error('Error adding question:', error);
      return { success: false, error: 'Failed to add question' };
    }

    revalidatePath(`/questionnaires/templates/${input.template_id}`);
    return { success: true, data };
  } catch (error) {
    console.error('Add question error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add question',
    };
  }
}

/**
 * Update a question
 */
export async function updateQuestion(
  questionId: string,
  input: Partial<CreateQuestionInput>
): Promise<ActionResult<TemplateQuestion>> {
  try {
    const parsed = updateQuestionSchema.parse(input);
    await getCurrentUser();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('nis2_template_questions')
      .update(parsed)
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating question:', error);
      return { success: false, error: 'Failed to update question' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Update question error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update question',
    };
  }
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string): Promise<ActionResult> {
  try {
    await getCurrentUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from('nis2_template_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      console.error('Error deleting question:', error);
      return { success: false, error: 'Failed to delete question' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete question error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete question',
    };
  }
}

/**
 * Reorder questions in a template
 */
export async function reorderQuestions(
  templateId: string,
  questionIds: string[]
): Promise<ActionResult> {
  try {
    await getCurrentUser();
    const supabase = await createClient();

    // Update display_order for each question
    const updates = questionIds.map((id, index) =>
      supabase
        .from('nis2_template_questions')
        .update({ display_order: index })
        .eq('id', id)
        .eq('template_id', templateId)
    );

    await Promise.all(updates);

    revalidatePath(`/questionnaires/templates/${templateId}`);
    return { success: true };
  } catch (error) {
    console.error('Reorder questions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder questions',
    };
  }
}

// ============================================================================
// QUESTIONNAIRE ACTIONS
// ============================================================================

/**
 * Send a questionnaire to a vendor
 */
export async function sendQuestionnaire(
  input: SendQuestionnaireInput
): Promise<ActionResult<VendorQuestionnaire>> {
  try {
    const parsed = sendQuestionnaireSchema.parse(input);
    const { userId, organizationId } = await getCurrentUser();

    if (!organizationId) {
      return { success: false, error: 'No organization found' };
    }

    const supabase = await createClient();

    // Get question count from template
    const { count: questionCount } = await supabase
      .from('nis2_template_questions')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', parsed.template_id);

    // Create the questionnaire
    const { data, error } = await supabase
      .from('nis2_vendor_questionnaires')
      .insert({
        organization_id: organizationId,
        vendor_id: parsed.vendor_id,
        template_id: parsed.template_id,
        vendor_email: parsed.vendor_email,
        vendor_name: parsed.vendor_name,
        vendor_contact_name: parsed.vendor_contact_name,
        due_date: parsed.due_date,
        questions_total: questionCount || 0,
        status: parsed.send_email ? 'sent' : 'draft',
        sent_at: parsed.send_email ? new Date().toISOString() : null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating questionnaire:', error);
      return { success: false, error: 'Failed to create questionnaire' };
    }

    // Send email notification if send_email is true
    if (parsed.send_email && data.access_token) {
      try {
        // Get template details for email
        const { data: template } = await supabase
          .from('nis2_questionnaire_templates')
          .select('name, estimated_completion_minutes')
          .eq('id', parsed.template_id)
          .single();

        // Get organization name for email
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single();

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nis2comply.io';

        const emailContent = generateQuestionnaireInviteEmail({
          vendorName: parsed.vendor_contact_name || parsed.vendor_name || '',
          companyName: org?.name || 'Our company',
          templateName: template?.name || 'NIS2 Security Questionnaire',
          estimatedMinutes: template?.estimated_completion_minutes || 30,
          dueDate: parsed.due_date,
          accessToken: data.access_token,
          baseUrl,
        });

        await sendEmail({
          to: parsed.vendor_email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      } catch (emailError) {
        console.error('Failed to send questionnaire email:', emailError);
        // Don't fail the whole operation if email fails
      }
    }

    revalidatePath('/questionnaires');
    return { success: true, data };
  } catch (error) {
    console.error('Send questionnaire error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send questionnaire',
    };
  }
}

/**
 * Resend questionnaire email
 */
export async function resendQuestionnaireEmail(
  questionnaireId: string
): Promise<ActionResult> {
  try {
    const { organizationId } = await getCurrentUser();
    const supabase = await createClient();

    // Get current questionnaire details
    const { data: questionnaire } = await supabase
      .from('nis2_vendor_questionnaires')
      .select(`
        *,
        template:nis2_questionnaire_templates(name, estimated_completion_minutes)
      `)
      .eq('id', questionnaireId)
      .single();

    if (!questionnaire) {
      return { success: false, error: 'Questionnaire not found' };
    }

    // Generate new access token
    const newToken = crypto.randomUUID();

    // Update questionnaire status and generate new token
    const { error } = await supabase
      .from('nis2_vendor_questionnaires')
      .update({
        access_token: newToken,
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        sent_at: new Date().toISOString(),
        reminder_count: (questionnaire.reminder_count || 0) + 1,
        last_reminder_at: new Date().toISOString(),
        status: questionnaire.status === 'draft' ? 'sent' : questionnaire.status,
      })
      .eq('id', questionnaireId);

    if (error) {
      console.error('Error resending questionnaire:', error);
      return { success: false, error: 'Failed to resend questionnaire' };
    }

    // Send reminder email
    try {
      // Get organization name
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nis2comply.io';

      const emailContent = generateQuestionnaireReminderEmail({
        vendorName: questionnaire.vendor_contact_name || questionnaire.vendor_name || '',
        companyName: org?.name || 'Our company',
        templateName: questionnaire.template?.name || 'NIS2 Security Questionnaire',
        progressPercentage: questionnaire.progress_percentage || 0,
        dueDate: questionnaire.due_date,
        accessToken: newToken,
        baseUrl,
      });

      await sendEmail({
        to: questionnaire.vendor_email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (emailError) {
      console.error('Failed to send reminder email:', emailError);
      // Don't fail the whole operation if email fails
    }

    revalidatePath('/questionnaires');
    return { success: true };
  } catch (error) {
    console.error('Resend questionnaire error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend questionnaire',
    };
  }
}

/**
 * Review a submitted questionnaire
 */
export async function reviewQuestionnaire(
  questionnaireId: string,
  input: { status: 'approved' | 'rejected'; review_notes?: string }
): Promise<ActionResult> {
  try {
    const parsed = reviewQuestionnaireSchema.parse(input);
    const { userId } = await getCurrentUser();

    const supabase = await createClient();

    const { error } = await supabase
      .from('nis2_vendor_questionnaires')
      .update({
        status: parsed.status,
        review_notes: parsed.review_notes,
        reviewer_id: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', questionnaireId);

    if (error) {
      console.error('Error reviewing questionnaire:', error);
      return { success: false, error: 'Failed to review questionnaire' };
    }

    revalidatePath('/questionnaires');
    revalidatePath(`/questionnaires/${questionnaireId}`);
    return { success: true };
  } catch (error) {
    console.error('Review questionnaire error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to review questionnaire',
    };
  }
}

/**
 * Delete a questionnaire (only drafts)
 */
export async function deleteQuestionnaire(questionnaireId: string): Promise<ActionResult> {
  try {
    await getCurrentUser();
    const supabase = await createClient();

    // Only allow deleting drafts
    const { data: questionnaire } = await supabase
      .from('nis2_vendor_questionnaires')
      .select('status')
      .eq('id', questionnaireId)
      .single();

    if (questionnaire?.status !== 'draft') {
      return { success: false, error: 'Only draft questionnaires can be deleted' };
    }

    const { error } = await supabase
      .from('nis2_vendor_questionnaires')
      .delete()
      .eq('id', questionnaireId);

    if (error) {
      console.error('Error deleting questionnaire:', error);
      return { success: false, error: 'Failed to delete questionnaire' };
    }

    revalidatePath('/questionnaires');
    return { success: true };
  } catch (error) {
    console.error('Delete questionnaire error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete questionnaire',
    };
  }
}

// ============================================================================
// VENDOR PORTAL ACTIONS (Token-based, no auth required)
// ============================================================================

/**
 * Start questionnaire (vendor marks as in_progress)
 */
export async function startQuestionnaire(token: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: questionnaire, error: fetchError } = await supabase
      .from('nis2_vendor_questionnaires')
      .select('id, status, token_expires_at')
      .eq('access_token', token)
      .single();

    if (fetchError || !questionnaire) {
      return { success: false, error: 'Invalid access link' };
    }

    if (new Date(questionnaire.token_expires_at) < new Date()) {
      return { success: false, error: 'Access link has expired' };
    }

    if (questionnaire.status === 'in_progress') {
      return { success: true }; // Already started
    }

    if (questionnaire.status !== 'sent') {
      return { success: false, error: 'Questionnaire cannot be started' };
    }

    const { error } = await supabase
      .from('nis2_vendor_questionnaires')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', questionnaire.id);

    if (error) {
      return { success: false, error: 'Failed to start questionnaire' };
    }

    return { success: true };
  } catch (error) {
    console.error('Start questionnaire error:', error);
    return { success: false, error: 'Failed to start questionnaire' };
  }
}

/**
 * Save answer (vendor portal)
 */
export async function saveAnswer(
  token: string,
  input: {
    question_id: string;
    answer_text?: string;
    answer_json?: unknown;
    source?: 'manual' | 'ai_extracted' | 'ai_confirmed' | 'ai_modified';
    vendor_confirmed?: boolean;
  }
): Promise<ActionResult<QuestionnaireAnswer>> {
  try {
    const supabase = await createClient();

    // Validate token and get questionnaire
    const { data: questionnaire, error: fetchError } = await supabase
      .from('nis2_vendor_questionnaires')
      .select('id, status, token_expires_at')
      .eq('access_token', token)
      .single();

    if (fetchError || !questionnaire) {
      return { success: false, error: 'Invalid access link' };
    }

    if (new Date(questionnaire.token_expires_at) < new Date()) {
      return { success: false, error: 'Access link has expired' };
    }

    if (!['sent', 'in_progress', 'rejected'].includes(questionnaire.status)) {
      return { success: false, error: 'Questionnaire cannot be edited' };
    }

    // Upsert answer
    const { data, error } = await supabase
      .from('nis2_questionnaire_answers')
      .upsert(
        {
          questionnaire_id: questionnaire.id,
          question_id: input.question_id,
          answer_text: input.answer_text,
          answer_json: input.answer_json,
          source: input.source || 'manual',
          vendor_confirmed: input.vendor_confirmed || false,
          vendor_confirmed_at: input.vendor_confirmed
            ? new Date().toISOString()
            : null,
        },
        {
          onConflict: 'questionnaire_id,question_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving answer:', error);
      return { success: false, error: 'Failed to save answer' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Save answer error:', error);
    return { success: false, error: 'Failed to save answer' };
  }
}

/**
 * Submit questionnaire (vendor portal)
 */
export async function submitQuestionnaire(
  token: string,
  confirmCompletion: boolean
): Promise<ActionResult> {
  try {
    if (!confirmCompletion) {
      return { success: false, error: 'You must confirm completion' };
    }

    const supabase = await createClient();

    // Get full questionnaire details for notification
    const { data: questionnaire, error: fetchError } = await supabase
      .from('nis2_vendor_questionnaires')
      .select(`
        *,
        template:nis2_questionnaire_templates(name),
        organization:organizations(name)
      `)
      .eq('access_token', token)
      .single();

    if (fetchError || !questionnaire) {
      return { success: false, error: 'Invalid access link' };
    }

    if (new Date(questionnaire.token_expires_at) < new Date()) {
      return { success: false, error: 'Access link has expired' };
    }

    if (!['in_progress', 'rejected'].includes(questionnaire.status)) {
      return { success: false, error: 'Questionnaire cannot be submitted' };
    }

    // Check if all required questions are answered
    const { count: answeredCount } = await supabase
      .from('nis2_questionnaire_answers')
      .select('*', { count: 'exact', head: true })
      .eq('questionnaire_id', questionnaire.id)
      .not('answer_text', 'is', null);

    if ((answeredCount || 0) < questionnaire.questions_total) {
      return {
        success: false,
        error: `Please answer all questions (${answeredCount}/${questionnaire.questions_total} completed)`,
      };
    }

    const { error } = await supabase
      .from('nis2_vendor_questionnaires')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', questionnaire.id);

    if (error) {
      return { success: false, error: 'Failed to submit questionnaire' };
    }

    // Send notification to company about submission
    try {
      // Get creator's email (the person who sent the questionnaire)
      const { data: creator } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', questionnaire.created_by)
        .single();

      if (creator?.email) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nis2comply.io';

        const emailContent = generateQuestionnaireSubmittedEmail({
          recipientName: creator.full_name || '',
          vendorName: questionnaire.vendor_contact_name || questionnaire.vendor_name || '',
          vendorCompany: questionnaire.vendor_company_name || '',
          templateName: questionnaire.template?.name || 'NIS2 Security Questionnaire',
          questionsTotal: questionnaire.questions_total,
          questionsAiFilled: questionnaire.questions_ai_filled || 0,
          questionnaireId: questionnaire.id,
          baseUrl,
        });

        await sendEmail({
          to: creator.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    } catch (emailError) {
      console.error('Failed to send submission notification:', emailError);
      // Don't fail the whole operation if email fails
    }

    return { success: true };
  } catch (error) {
    console.error('Submit questionnaire error:', error);
    return { success: false, error: 'Failed to submit questionnaire' };
  }
}

// ============================================================================
// DOCUMENT ACTIONS
// ============================================================================

/**
 * Register uploaded document
 */
export async function registerDocument(
  token: string,
  input: {
    file_name: string;
    file_size: number;
    file_type: string;
    storage_path: string;
    document_type: 'soc2' | 'iso27001' | 'policy' | 'certificate' | 'other';
    document_type_other?: string;
  }
): Promise<ActionResult<QuestionnaireDocument>> {
  try {
    const supabase = await createClient();

    // Validate token
    const { data: questionnaire, error: fetchError } = await supabase
      .from('nis2_vendor_questionnaires')
      .select('id, status, token_expires_at')
      .eq('access_token', token)
      .single();

    if (fetchError || !questionnaire) {
      return { success: false, error: 'Invalid access link' };
    }

    if (new Date(questionnaire.token_expires_at) < new Date()) {
      return { success: false, error: 'Access link has expired' };
    }

    const { data, error } = await supabase
      .from('nis2_questionnaire_documents')
      .insert({
        questionnaire_id: questionnaire.id,
        file_name: input.file_name,
        file_size: input.file_size,
        file_type: input.file_type,
        storage_path: input.storage_path,
        document_type: input.document_type,
        document_type_other: input.document_type_other,
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering document:', error);
      return { success: false, error: 'Failed to register document' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Register document error:', error);
    return { success: false, error: 'Failed to register document' };
  }
}

/**
 * Delete document
 */
export async function deleteDocument(
  token: string,
  documentId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Validate token
    const { data: questionnaire, error: fetchError } = await supabase
      .from('nis2_vendor_questionnaires')
      .select('id')
      .eq('access_token', token)
      .single();

    if (fetchError || !questionnaire) {
      return { success: false, error: 'Invalid access link' };
    }

    const { error } = await supabase
      .from('nis2_questionnaire_documents')
      .delete()
      .eq('id', documentId)
      .eq('questionnaire_id', questionnaire.id);

    if (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: 'Failed to delete document' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete document error:', error);
    return { success: false, error: 'Failed to delete document' };
  }
}

// ============================================================================
// FLAG ACTIONS
// ============================================================================

/**
 * Flag an answer for review
 */
export async function flagAnswer(
  questionnaireId: string,
  questionId: string,
  reason: string
): Promise<ActionResult> {
  try {
    await getCurrentUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from('nis2_questionnaire_answers')
      .update({
        is_flagged: true,
        flag_reason: reason,
      })
      .eq('questionnaire_id', questionnaireId)
      .eq('question_id', questionId);

    if (error) {
      return { success: false, error: 'Failed to flag answer' };
    }

    revalidatePath(`/questionnaires/${questionnaireId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to flag answer' };
  }
}

/**
 * Unflag an answer
 */
export async function unflagAnswer(
  questionnaireId: string,
  questionId: string
): Promise<ActionResult> {
  try {
    await getCurrentUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from('nis2_questionnaire_answers')
      .update({
        is_flagged: false,
        flag_reason: null,
      })
      .eq('questionnaire_id', questionnaireId)
      .eq('question_id', questionId);

    if (error) {
      return { success: false, error: 'Failed to unflag answer' };
    }

    revalidatePath(`/questionnaires/${questionnaireId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to unflag answer' };
  }
}
