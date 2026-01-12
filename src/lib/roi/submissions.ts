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
      : new Date('2026-04-30'),
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
      : new Date('2026-04-30'),
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
      submission_deadline: '2026-04-30',
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
    submissionDeadline: new Date('2026-04-30'),
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

// ============================================================================
// Approval Workflow Functions
// ============================================================================

export type ApprovalStatus = 'pending_review' | 'reviewed' | 'pending_approval' | 'approved' | 'rejected';

export interface SubmissionApprovalInfo {
  approvalStatus: ApprovalStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  approvalNotes?: string;
}

/**
 * Fetch submission approval status
 */
export async function fetchSubmissionApproval(
  submissionId: string
): Promise<SubmissionApprovalInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('roi_submissions')
    .select(`
      approval_status,
      reviewed_by,
      reviewed_at,
      review_notes,
      approved_by,
      approved_at,
      approval_notes,
      reviewer:users!reviewed_by(full_name),
      approver:users!approved_by(full_name)
    `)
    .eq('id', submissionId)
    .single();

  if (error || !data) {
    console.error('Error fetching approval info:', error);
    return null;
  }

  // Handle Supabase join types - may be array or single object
  const reviewerData = Array.isArray(data.reviewer) ? data.reviewer[0] : data.reviewer;
  const approverData = Array.isArray(data.approver) ? data.approver[0] : data.approver;

  return {
    approvalStatus: (data.approval_status || 'pending_review') as ApprovalStatus,
    reviewedBy: data.reviewed_by,
    reviewedByName: reviewerData?.full_name,
    reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
    reviewNotes: data.review_notes,
    approvedBy: data.approved_by,
    approvedByName: approverData?.full_name,
    approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
    approvalNotes: data.approval_notes,
  };
}

/**
 * Submit submission for review
 * Called by data owner when data entry is complete
 */
export async function submitForReview(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('roi_submissions')
    .update({
      approval_status: 'pending_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) {
    console.error('Error submitting for review:', error);
    return { success: false, error: error.message };
  }

  await addSubmissionComment(submissionId, 'Submitted for data review', 'status_change');
  return { success: true };
}

/**
 * Mark submission as reviewed
 * Called by designated reviewer to confirm data accuracy
 */
export async function markAsReviewed(
  submissionId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check user has permission (admin or owner)
  const { data: userInfo } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (!userInfo || !['owner', 'admin', 'analyst'].includes(userInfo.role)) {
    return { success: false, error: 'Insufficient permissions to review' };
  }

  const { error } = await supabase
    .from('roi_submissions')
    .update({
      approval_status: 'reviewed',
      reviewed_by: userData.user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) {
    console.error('Error marking as reviewed:', error);
    return { success: false, error: error.message };
  }

  await addSubmissionComment(
    submissionId,
    `Data review completed${notes ? `: ${notes}` : ''}`,
    'status_change'
  );
  return { success: true };
}

/**
 * Submit for management approval
 * Called after review is complete
 */
export async function submitForApproval(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify review is complete
  const { data: submission } = await supabase
    .from('roi_submissions')
    .select('approval_status, reviewed_by')
    .eq('id', submissionId)
    .single();

  if (!submission?.reviewed_by) {
    return { success: false, error: 'Data review must be completed first' };
  }

  const { error } = await supabase
    .from('roi_submissions')
    .update({
      approval_status: 'pending_approval',
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) {
    console.error('Error submitting for approval:', error);
    return { success: false, error: error.message };
  }

  await addSubmissionComment(submissionId, 'Submitted for management approval', 'status_change');
  return { success: true };
}

/**
 * Approve submission for regulatory filing
 * Called by authorized management (owner/admin only)
 */
export async function approveSubmission(
  submissionId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check user has approval permission (owner or admin only)
  const { data: userInfo } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (!userInfo || !['owner', 'admin'].includes(userInfo.role)) {
    return { success: false, error: 'Only owners and administrators can approve submissions' };
  }

  // Verify review is complete
  const { data: submission } = await supabase
    .from('roi_submissions')
    .select('approval_status, reviewed_by')
    .eq('id', submissionId)
    .single();

  if (!submission?.reviewed_by) {
    return { success: false, error: 'Data review must be completed before approval' };
  }

  const { error } = await supabase
    .from('roi_submissions')
    .update({
      approval_status: 'approved',
      approved_by: userData.user.id,
      approved_at: new Date().toISOString(),
      approval_notes: notes || null,
      status: 'ready', // Mark as ready for submission
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) {
    console.error('Error approving submission:', error);
    return { success: false, error: error.message };
  }

  await addSubmissionComment(
    submissionId,
    `Management approval granted${notes ? `: ${notes}` : ''}`,
    'status_change'
  );
  return { success: true };
}

/**
 * Reject submission with feedback
 * Called by reviewer or approver when changes are needed
 */
export async function rejectSubmission(
  submissionId: string,
  reason: string,
  stage: 'review' | 'approval'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { success: false, error: 'Not authenticated' };
  }

  const updateData: Record<string, unknown> = {
    approval_status: 'rejected',
    updated_at: new Date().toISOString(),
  };

  if (stage === 'review') {
    updateData.review_notes = reason;
  } else {
    updateData.approval_notes = reason;
  }

  const { error } = await supabase
    .from('roi_submissions')
    .update(updateData)
    .eq('id', submissionId);

  if (error) {
    console.error('Error rejecting submission:', error);
    return { success: false, error: error.message };
  }

  await addSubmissionComment(
    submissionId,
    `${stage === 'review' ? 'Review' : 'Approval'} rejected: ${reason}`,
    'status_change'
  );
  return { success: true };
}

/**
 * Get approval status for checklist
 */
export async function getApprovalChecklistStatus(
  submissionId: string
): Promise<{ reviewComplete: boolean; approvalComplete: boolean }> {
  const approval = await fetchSubmissionApproval(submissionId);

  if (!approval) {
    return { reviewComplete: false, approvalComplete: false };
  }

  return {
    reviewComplete: !!approval.reviewedBy && approval.approvalStatus !== 'rejected',
    approvalComplete: !!approval.approvedBy && approval.approvalStatus === 'approved',
  };
}
