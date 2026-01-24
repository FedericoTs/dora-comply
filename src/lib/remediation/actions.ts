/**
 * Remediation Server Actions
 * Server-side mutations for remediation plans and actions
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization, getCurrentUserContext } from '@/lib/auth/organization';
import { revalidatePath } from 'next/cache';
import type {
  PlanStatus,
  ActionStatus,
  SourceType,
  ActionType,
  Priority,
  Framework,
  EvidenceType,
} from './types';

// ============================================================================
// Plan Actions
// ============================================================================

export interface CreatePlanInput {
  title: string;
  description?: string;
  source_type: SourceType;
  source_id?: string;
  vendor_id?: string;
  framework?: Framework;
  priority: Priority;
  risk_level?: Priority;
  target_date?: string;
  owner_id?: string;
  estimated_cost?: number;
  cost_currency?: string;
  tags?: string[];
  notes?: string;
}

export async function createRemediationPlan(input: CreatePlanInput): Promise<{ success: boolean; planId?: string; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();
  const user = await getCurrentUserContext();

  if (!organizationId || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Generate plan reference
  const { data: refData } = await supabase.rpc('generate_plan_ref', {
    p_org_id: organizationId,
  });

  const planRef = refData || `REM-${new Date().getFullYear()}-001`;

  const { data, error } = await supabase
    .from('remediation_plans')
    .insert({
      organization_id: organizationId,
      plan_ref: planRef,
      title: input.title,
      description: input.description,
      source_type: input.source_type,
      source_id: input.source_id,
      vendor_id: input.vendor_id,
      framework: input.framework,
      priority: input.priority,
      risk_level: input.risk_level,
      target_date: input.target_date,
      owner_id: input.owner_id,
      estimated_cost: input.estimated_cost,
      cost_currency: input.cost_currency || 'EUR',
      tags: input.tags,
      notes: input.notes,
      created_by: user.userId,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating remediation plan:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/remediation');
  return { success: true, planId: data.id };
}

export interface UpdatePlanInput {
  id: string;
  title?: string;
  description?: string;
  framework?: Framework;
  priority?: Priority;
  risk_level?: Priority;
  target_date?: string;
  owner_id?: string | null;
  estimated_cost?: number;
  actual_cost?: number;
  cost_currency?: string;
  tags?: string[];
  notes?: string;
}

export async function updateRemediationPlan(input: UpdatePlanInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  const { id, ...updates } = input;

  const { error } = await supabase
    .from('remediation_plans')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error updating remediation plan:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/remediation');
  revalidatePath(`/remediation/${id}`);
  return { success: true };
}

export async function updatePlanStatus(
  planId: string,
  status: PlanStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();
  const user = await getCurrentUserContext();

  if (!organizationId || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  const updateData: Record<string, unknown> = { status };

  // Handle status-specific fields
  if (status === 'approved') {
    updateData.approver_id = user.userId;
    updateData.approved_at = new Date().toISOString();
    updateData.approval_notes = notes;
  } else if (status === 'in_progress' && !updateData.started_at) {
    updateData.started_at = new Date().toISOString();
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('remediation_plans')
    .update(updateData)
    .eq('id', planId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error updating plan status:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/remediation');
  revalidatePath(`/remediation/${planId}`);
  return { success: true };
}

export async function deleteRemediationPlan(planId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  // Soft delete
  const { error } = await supabase
    .from('remediation_plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error deleting remediation plan:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/remediation');
  return { success: true };
}

// ============================================================================
// Action Actions
// ============================================================================

export interface CreateActionInput {
  plan_id: string;
  title: string;
  description?: string;
  action_type: ActionType;
  priority: Priority;
  due_date?: string;
  estimated_hours?: number;
  assignee_id?: string;
  reviewer_id?: string;
  requires_evidence?: boolean;
  evidence_description?: string;
  control_id?: string;
  requirement_reference?: string;
  depends_on?: string[];
}

export async function createRemediationAction(input: CreateActionInput): Promise<{ success: boolean; actionId?: string; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();
  const user = await getCurrentUserContext();

  if (!organizationId || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get the plan reference for action ref generation
  const { data: plan } = await supabase
    .from('remediation_plans')
    .select('plan_ref')
    .eq('id', input.plan_id)
    .eq('organization_id', organizationId)
    .single();

  if (!plan) {
    return { success: false, error: 'Plan not found' };
  }

  // Generate action reference
  const { data: refData } = await supabase.rpc('generate_action_ref', {
    p_plan_ref: plan.plan_ref,
    p_org_id: organizationId,
  });

  const actionRef = refData || `${plan.plan_ref}-A01`;

  // Get max sort order for this plan
  const { data: maxSort } = await supabase
    .from('remediation_actions')
    .select('sort_order')
    .eq('plan_id', input.plan_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const sortOrder = (maxSort?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from('remediation_actions')
    .insert({
      organization_id: organizationId,
      plan_id: input.plan_id,
      action_ref: actionRef,
      title: input.title,
      description: input.description,
      action_type: input.action_type,
      priority: input.priority,
      status: 'backlog',
      sort_order: sortOrder,
      due_date: input.due_date,
      estimated_hours: input.estimated_hours,
      assignee_id: input.assignee_id,
      reviewer_id: input.reviewer_id,
      requires_evidence: input.requires_evidence || false,
      evidence_description: input.evidence_description,
      control_id: input.control_id,
      requirement_reference: input.requirement_reference,
      depends_on: input.depends_on,
      created_by: user.userId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating remediation action:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/remediation');
  revalidatePath(`/remediation/${input.plan_id}`);
  return { success: true, actionId: data.id };
}

export interface UpdateActionInput {
  id: string;
  title?: string;
  description?: string;
  action_type?: ActionType;
  priority?: Priority;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  assignee_id?: string | null;
  reviewer_id?: string | null;
  requires_evidence?: boolean;
  evidence_description?: string;
  control_id?: string;
  requirement_reference?: string;
  depends_on?: string[];
}

export async function updateRemediationAction(input: UpdateActionInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  const { id, ...updates } = input;

  const { data, error } = await supabase
    .from('remediation_actions')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select('plan_id')
    .single();

  if (error) {
    console.error('Error updating remediation action:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/remediation');
  if (data?.plan_id) {
    revalidatePath(`/remediation/${data.plan_id}`);
  }
  return { success: true };
}

export async function updateActionStatus(
  actionId: string,
  status: ActionStatus,
  blockedReason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();
  const user = await getCurrentUserContext();

  if (!organizationId || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get current action state
  const { data: currentAction } = await supabase
    .from('remediation_actions')
    .select('status, plan_id')
    .eq('id', actionId)
    .eq('organization_id', organizationId)
    .single();

  if (!currentAction) {
    return { success: false, error: 'Action not found' };
  }

  const updateData: Record<string, unknown> = { status };

  // Handle status-specific fields
  if (status === 'blocked') {
    updateData.blocked_reason = blockedReason;
  } else {
    updateData.blocked_reason = null;
  }

  if (status === 'in_progress' && currentAction.status === 'todo') {
    updateData.started_at = new Date().toISOString();
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('remediation_actions')
    .update(updateData)
    .eq('id', actionId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error updating action status:', error);
    return { success: false, error: error.message };
  }

  // Add status change comment
  await supabase.from('remediation_action_comments').insert({
    action_id: actionId,
    content: `Status changed from ${currentAction.status} to ${status}`,
    comment_type: 'status_change',
    old_status: currentAction.status,
    new_status: status,
    author_id: user.userId,
  });

  revalidatePath('/remediation');
  revalidatePath(`/remediation/${currentAction.plan_id}`);
  return { success: true };
}

export async function reorderActions(
  planId: string,
  actionIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  // Update sort_order for each action
  const updates = actionIds.map((id, index) =>
    supabase
      .from('remediation_actions')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('organization_id', organizationId)
  );

  const results = await Promise.all(updates);
  const errors = results.filter(r => r.error);

  if (errors.length > 0) {
    console.error('Error reordering actions:', errors);
    return { success: false, error: 'Failed to reorder some actions' };
  }

  revalidatePath('/remediation');
  revalidatePath(`/remediation/${planId}`);
  return { success: true };
}

export async function deleteRemediationAction(actionId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get plan_id before delete
  const { data: action } = await supabase
    .from('remediation_actions')
    .select('plan_id')
    .eq('id', actionId)
    .eq('organization_id', organizationId)
    .single();

  const { error } = await supabase
    .from('remediation_actions')
    .delete()
    .eq('id', actionId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error deleting remediation action:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/remediation');
  if (action?.plan_id) {
    revalidatePath(`/remediation/${action.plan_id}`);
  }
  return { success: true };
}

// ============================================================================
// Comment Actions
// ============================================================================

export async function addActionComment(
  actionId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUserContext();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase.from('remediation_action_comments').insert({
    action_id: actionId,
    content,
    comment_type: 'comment',
    author_id: user.userId,
  });

  if (error) {
    console.error('Error adding comment:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// Evidence Actions
// ============================================================================

export interface AddEvidenceInput {
  action_id: string;
  evidence_type: EvidenceType;
  title: string;
  description?: string;
  document_id?: string;
  external_url?: string;
  attestation_text?: string;
}

export async function addEvidence(input: AddEvidenceInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();
  const user = await getCurrentUserContext();

  if (!organizationId || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase.from('remediation_evidence').insert({
    organization_id: organizationId,
    action_id: input.action_id,
    evidence_type: input.evidence_type,
    title: input.title,
    description: input.description,
    document_id: input.document_id,
    external_url: input.external_url,
    attestation_text: input.attestation_text,
    uploaded_by: user.userId,
  });

  if (error) {
    console.error('Error adding evidence:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function verifyEvidence(
  evidenceId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();
  const user = await getCurrentUserContext();

  if (!organizationId || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('remediation_evidence')
    .update({
      verified_at: new Date().toISOString(),
      verified_by: user.userId,
    })
    .eq('id', evidenceId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error verifying evidence:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteEvidence(evidenceId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('remediation_evidence')
    .delete()
    .eq('id', evidenceId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error deleting evidence:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// Bulk Actions
// ============================================================================

export async function bulkUpdateActionStatus(
  actionIds: string[],
  status: ActionStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('remediation_actions')
    .update({ status })
    .in('id', actionIds)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error bulk updating actions:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/remediation');
  return { success: true };
}

export async function bulkAssignActions(
  actionIds: string[],
  assigneeId: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('remediation_actions')
    .update({ assignee_id: assigneeId })
    .in('id', actionIds)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error bulk assigning actions:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/remediation');
  return { success: true };
}
