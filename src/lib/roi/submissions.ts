'use server';

/**
 * RoI Submission Server Actions
 *
 * Server-side functions for submission management
 */

import { createClient } from '@/lib/supabase/server';
import type { RoiTemplateId } from './types';
import {
  SUBMISSION_CHECKLIST_TEMPLATE,
  type SubmissionStatus,
  type Submission,
  type SubmissionComment,
  type SubmissionChecklist,
  type ChecklistItem,
} from './submissions-types';

/**
 * Fetch all submissions for the organization
 */
export async function fetchSubmissions(): Promise<Submission[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('roi_submissions')
    .select(`
      *,
      created_by_user:users!created_by(full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    organizationId: row.organization_id,
    status: row.status as SubmissionStatus,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    createdByName: row.created_by_user?.full_name,
    validationErrors: row.validation_errors || 0,
    validationWarnings: row.validation_warnings || 0,
    packageUrl: row.package_url,
    submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
    esaConfirmationNumber: row.esa_confirmation_number,
    notes: row.notes,
    reportingPeriod: row.reporting_period || '2025-Q1',
    submissionDeadline: row.submission_deadline
      ? new Date(row.submission_deadline)
      : new Date('2025-04-30'),
  }));
}

/**
 * Fetch a single submission by ID
 */
export async function fetchSubmission(submissionId: string): Promise<Submission | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('roi_submissions')
    .select(`
      *,
      created_by_user:users!created_by(full_name)
    `)
    .eq('id', submissionId)
    .single();

  if (error || !data) {
    console.error('Error fetching submission:', error);
    return null;
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    status: data.status as SubmissionStatus,
    createdAt: new Date(data.created_at),
    createdBy: data.created_by,
    createdByName: data.created_by_user?.full_name,
    validationErrors: data.validation_errors || 0,
    validationWarnings: data.validation_warnings || 0,
    packageUrl: data.package_url,
    submittedAt: data.submitted_at ? new Date(data.submitted_at) : undefined,
    esaConfirmationNumber: data.esa_confirmation_number,
    notes: data.notes,
    reportingPeriod: data.reporting_period || '2025-Q1',
    submissionDeadline: data.submission_deadline
      ? new Date(data.submission_deadline)
      : new Date('2025-04-30'),
  };
}

/**
 * Create a new submission draft
 */
export async function createSubmissionDraft(
  reportingPeriod: string = '2025-Q1'
): Promise<Submission | null> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('roi_submissions')
    .insert({
      status: 'draft',
      created_by: userData.user.id,
      reporting_period: reportingPeriod,
      submission_deadline: '2025-04-30',
      validation_errors: 0,
      validation_warnings: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating submission:', error);
    return null;
  }

  // Add system comment
  await addSubmissionComment(data.id, 'Submission draft created', 'system');

  return {
    id: data.id,
    organizationId: data.organization_id,
    status: 'draft',
    createdAt: new Date(data.created_at),
    createdBy: data.created_by,
    validationErrors: 0,
    validationWarnings: 0,
    reportingPeriod,
    submissionDeadline: new Date('2025-04-30'),
  };
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  additionalData?: Partial<{
    validationErrors: number;
    validationWarnings: number;
    packageUrl: string;
    esaConfirmationNumber: string;
    notes: string;
  }>
): Promise<boolean> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    status,
    ...additionalData,
  };

  if (status === 'submitted') {
    updateData.submitted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('roi_submissions')
    .update(updateData)
    .eq('id', submissionId);

  if (error) {
    console.error('Error updating submission:', error);
    return false;
  }

  // Add status change comment
  await addSubmissionComment(
    submissionId,
    `Status changed to ${status}`,
    'status_change'
  );

  return true;
}

/**
 * Fetch submission comments
 */
export async function fetchSubmissionComments(
  submissionId: string
): Promise<SubmissionComment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('roi_submission_comments')
    .select(`
      *,
      user:users!user_id(full_name)
    `)
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    submissionId: row.submission_id,
    userId: row.user_id,
    userName: row.user?.full_name || 'System',
    content: row.content,
    createdAt: new Date(row.created_at),
    type: row.type as SubmissionComment['type'],
  }));
}

/**
 * Add a comment to a submission
 */
export async function addSubmissionComment(
  submissionId: string,
  content: string,
  type: SubmissionComment['type'] = 'comment'
): Promise<boolean> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { error } = await supabase
    .from('roi_submission_comments')
    .insert({
      submission_id: submissionId,
      user_id: userData.user.id,
      content,
      type,
    });

  if (error) {
    console.error('Error adding comment:', error);
    return false;
  }

  return true;
}

/**
 * Generate submission checklist with current status
 */
export async function generateSubmissionChecklist(
  templateStats: { templateId: RoiTemplateId; completeness: number; errorCount?: number }[]
): Promise<SubmissionChecklist> {
  const statsMap = new Map(
    templateStats.map(s => [s.templateId, s])
  );

  const items: ChecklistItem[] = SUBMISSION_CHECKLIST_TEMPLATE.map(template => {
    let isComplete = false;

    // Check template-based items
    if (template.templateId) {
      const stats = statsMap.get(template.templateId);
      if (stats) {
        isComplete = stats.completeness === 100 && (stats.errorCount ?? 0) === 0;
      }
    }

    // Check validation items
    if (template.id === 'validation-errors') {
      const totalErrors = templateStats.reduce((sum, s) => sum + (s.errorCount ?? 0), 0);
      isComplete = totalErrors === 0;
    }

    if (template.id === 'validation-cross-ref') {
      // Cross-reference validation - check if all referenced templates exist
      const requiredTemplates = ['B_01.01', 'B_02.01', 'B_03.01'] as RoiTemplateId[];
      isComplete = requiredTemplates.every(id => {
        const stats = statsMap.get(id);
        return stats && stats.completeness > 0;
      });
    }

    return {
      ...template,
      isComplete,
      errorCount: template.templateId
        ? statsMap.get(template.templateId)?.errorCount
        : undefined,
    };
  });

  const completedCount = items.filter(i => i.isComplete).length;
  const requiredItems = items.filter(i => i.isRequired);
  const requiredComplete = requiredItems.every(i => i.isComplete);

  return {
    items,
    completedCount,
    totalCount: items.length,
    isComplete: requiredComplete,
  };
}
