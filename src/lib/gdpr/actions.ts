'use server';

/**
 * GDPR Module Server Actions
 *
 * Server actions for GDPR compliance operations
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  CreateProcessingActivityInput,
  CreateDPIAInput,
  CreateDSRInput,
  CreateBreachInput,
  ProcessingActivity,
  DPIA,
  DataSubjectRequest,
  DataBreach,
  DPIARisk,
  DPIAMitigation,
  RiskLevel,
  DSRStatus,
  BreachStatus,
  DPIAStatus,
  ActivityStatus,
} from './types';

// ============================================
// Helper Functions
// ============================================

async function getOrganizationId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) throw new Error('No organization found');

  return profile.organization_id;
}

async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ============================================
// Processing Activity Actions
// ============================================

export async function createProcessingActivity(
  input: CreateProcessingActivityInput
): Promise<ProcessingActivity> {
  const supabase = await createClient();
  const organizationId = await getOrganizationId();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('gdpr_processing_activities')
    .insert({
      organization_id: organizationId,
      created_by: userId,
      ...input,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating processing activity:', error);
    throw new Error('Failed to create processing activity');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/processing-activities');
  return data;
}

export async function updateProcessingActivity(
  activityId: string,
  updates: Partial<ProcessingActivity>
): Promise<ProcessingActivity> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_processing_activities')
    .update(updates)
    .eq('id', activityId)
    .select()
    .single();

  if (error) {
    console.error('Error updating processing activity:', error);
    throw new Error('Failed to update processing activity');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/processing-activities');
  revalidatePath(`/data-protection/processing-activities/${activityId}`);
  return data;
}

export async function updateProcessingActivityStatus(
  activityId: string,
  status: ActivityStatus
): Promise<void> {
  const supabase = await createClient();
  const userId = await getUserId();

  const { error } = await supabase
    .from('gdpr_processing_activities')
    .update({
      status,
      last_reviewed_at: status === 'active' ? new Date().toISOString() : undefined,
      last_reviewed_by: status === 'active' ? userId : undefined,
    })
    .eq('id', activityId);

  if (error) {
    console.error('Error updating activity status:', error);
    throw new Error('Failed to update activity status');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/processing-activities');
}

export async function deleteProcessingActivity(activityId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('gdpr_processing_activities')
    .delete()
    .eq('id', activityId);

  if (error) {
    console.error('Error deleting processing activity:', error);
    throw new Error('Failed to delete processing activity');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/processing-activities');
}

// ============================================
// DPIA Actions
// ============================================

export async function createDPIA(input: CreateDPIAInput): Promise<DPIA> {
  const supabase = await createClient();
  const organizationId = await getOrganizationId();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('gdpr_dpias')
    .insert({
      organization_id: organizationId,
      created_by: userId,
      ...input,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating DPIA:', error);
    throw new Error('Failed to create DPIA');
  }

  // Link to processing activity if specified
  if (input.processing_activity_id) {
    await supabase
      .from('gdpr_processing_activities')
      .update({ dpia_id: data.id })
      .eq('id', input.processing_activity_id);
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/dpias');
  return data;
}

export async function updateDPIA(dpiaId: string, updates: Partial<DPIA>): Promise<DPIA> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_dpias')
    .update(updates)
    .eq('id', dpiaId)
    .select()
    .single();

  if (error) {
    console.error('Error updating DPIA:', error);
    throw new Error('Failed to update DPIA');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/dpias');
  revalidatePath(`/data-protection/dpias/${dpiaId}`);
  return data;
}

export async function updateDPIAStatus(dpiaId: string, status: DPIAStatus): Promise<void> {
  const supabase = await createClient();
  const userId = await getUserId();

  const updateData: Record<string, unknown> = { status };

  if (status === 'approved') {
    updateData.approved_by = userId;
    updateData.approved_at = new Date().toISOString();
  }

  const { error } = await supabase.from('gdpr_dpias').update(updateData).eq('id', dpiaId);

  if (error) {
    console.error('Error updating DPIA status:', error);
    throw new Error('Failed to update DPIA status');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/dpias');
  revalidatePath(`/data-protection/dpias/${dpiaId}`);
}

export async function deleteDPIA(dpiaId: string): Promise<void> {
  const supabase = await createClient();

  // First unlink from any processing activities
  await supabase
    .from('gdpr_processing_activities')
    .update({ dpia_id: null })
    .eq('dpia_id', dpiaId);

  const { error } = await supabase.from('gdpr_dpias').delete().eq('id', dpiaId);

  if (error) {
    console.error('Error deleting DPIA:', error);
    throw new Error('Failed to delete DPIA');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/dpias');
}

// DPIA Risk Actions
export async function addDPIARisk(
  dpiaId: string,
  risk: {
    title: string;
    description?: string;
    risk_category?: string;
    likelihood: RiskLevel;
    impact: RiskLevel;
  }
): Promise<DPIARisk> {
  const supabase = await createClient();

  // Calculate inherent risk level
  const riskMatrix: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3, very_high: 4 };
  const likelihoodScore = riskMatrix[risk.likelihood];
  const impactScore = riskMatrix[risk.impact];
  const combinedScore = likelihoodScore * impactScore;

  let inherentRiskLevel: RiskLevel = 'low';
  if (combinedScore >= 12) inherentRiskLevel = 'very_high';
  else if (combinedScore >= 8) inherentRiskLevel = 'high';
  else if (combinedScore >= 4) inherentRiskLevel = 'medium';

  // Get max order_index
  const { data: existing } = await supabase
    .from('gdpr_dpia_risks')
    .select('order_index')
    .eq('dpia_id', dpiaId)
    .order('order_index', { ascending: false })
    .limit(1);

  const orderIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  const { data, error } = await supabase
    .from('gdpr_dpia_risks')
    .insert({
      dpia_id: dpiaId,
      ...risk,
      inherent_risk_level: inherentRiskLevel,
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding DPIA risk:', error);
    throw new Error('Failed to add DPIA risk');
  }

  revalidatePath(`/data-protection/dpias/${dpiaId}`);
  return data;
}

export async function updateDPIARisk(
  riskId: string,
  updates: Partial<DPIARisk>
): Promise<DPIARisk> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_dpia_risks')
    .update(updates)
    .eq('id', riskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating DPIA risk:', error);
    throw new Error('Failed to update DPIA risk');
  }

  revalidatePath(`/data-protection/dpias/${data.dpia_id}`);
  return data;
}

export async function deleteDPIARisk(riskId: string): Promise<void> {
  const supabase = await createClient();

  // Get dpia_id before deletion for revalidation
  const { data: risk } = await supabase
    .from('gdpr_dpia_risks')
    .select('dpia_id')
    .eq('id', riskId)
    .single();

  const { error } = await supabase.from('gdpr_dpia_risks').delete().eq('id', riskId);

  if (error) {
    console.error('Error deleting DPIA risk:', error);
    throw new Error('Failed to delete DPIA risk');
  }

  if (risk) {
    revalidatePath(`/data-protection/dpias/${risk.dpia_id}`);
  }
}

// DPIA Mitigation Actions
export async function addDPIAMitigation(
  dpiaId: string,
  mitigation: {
    title: string;
    description?: string;
    mitigation_type?: string;
    risk_id?: string;
    responsible_party?: string;
    implementation_date?: string;
  }
): Promise<DPIAMitigation> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_dpia_mitigations')
    .insert({
      dpia_id: dpiaId,
      ...mitigation,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding DPIA mitigation:', error);
    throw new Error('Failed to add DPIA mitigation');
  }

  revalidatePath(`/data-protection/dpias/${dpiaId}`);
  return data;
}

export async function updateDPIAMitigation(
  mitigationId: string,
  updates: Partial<DPIAMitigation>
): Promise<DPIAMitigation> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_dpia_mitigations')
    .update(updates)
    .eq('id', mitigationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating DPIA mitigation:', error);
    throw new Error('Failed to update DPIA mitigation');
  }

  revalidatePath(`/data-protection/dpias/${data.dpia_id}`);
  return data;
}

export async function deleteDPIAMitigation(mitigationId: string): Promise<void> {
  const supabase = await createClient();

  // Get dpia_id before deletion for revalidation
  const { data: mitigation } = await supabase
    .from('gdpr_dpia_mitigations')
    .select('dpia_id')
    .eq('id', mitigationId)
    .single();

  const { error } = await supabase.from('gdpr_dpia_mitigations').delete().eq('id', mitigationId);

  if (error) {
    console.error('Error deleting DPIA mitigation:', error);
    throw new Error('Failed to delete DPIA mitigation');
  }

  if (mitigation) {
    revalidatePath(`/data-protection/dpias/${mitigation.dpia_id}`);
  }
}

// ============================================
// DSR Actions
// ============================================

export async function createDSR(input: CreateDSRInput): Promise<DataSubjectRequest> {
  const supabase = await createClient();
  const organizationId = await getOrganizationId();
  const userId = await getUserId();

  // Calculate due date (30 days from receipt, or from now if not specified)
  const receivedAt = input.received_at ? new Date(input.received_at) : new Date();
  const dueDate = new Date(receivedAt);
  dueDate.setDate(dueDate.getDate() + 30);

  const { data, error } = await supabase
    .from('gdpr_data_subject_requests')
    .insert({
      organization_id: organizationId,
      created_by: userId,
      received_at: receivedAt.toISOString(),
      response_due_date: dueDate.toISOString().split('T')[0],
      ...input,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating DSR:', error);
    throw new Error('Failed to create DSR');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/dsr');
  return data;
}

export async function updateDSR(
  dsrId: string,
  updates: Partial<DataSubjectRequest>
): Promise<DataSubjectRequest> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_data_subject_requests')
    .update(updates)
    .eq('id', dsrId)
    .select()
    .single();

  if (error) {
    console.error('Error updating DSR:', error);
    throw new Error('Failed to update DSR');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/dsr');
  revalidatePath(`/data-protection/dsr/${dsrId}`);
  return data;
}

export async function updateDSRStatus(dsrId: string, status: DSRStatus): Promise<void> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status };

  if (status === 'completed' || status === 'refused') {
    updateData.response_date = new Date().toISOString();
  }

  const { error } = await supabase
    .from('gdpr_data_subject_requests')
    .update(updateData)
    .eq('id', dsrId);

  if (error) {
    console.error('Error updating DSR status:', error);
    throw new Error('Failed to update DSR status');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/dsr');
}

export async function extendDSR(
  dsrId: string,
  extensionReason: string,
  newDueDate: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('gdpr_data_subject_requests')
    .update({
      status: 'extended',
      extension_applied: true,
      extension_reason: extensionReason,
      extended_due_date: newDueDate,
    })
    .eq('id', dsrId);

  if (error) {
    console.error('Error extending DSR:', error);
    throw new Error('Failed to extend DSR');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/dsr');
}

export async function assignDSR(dsrId: string, assigneeId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('gdpr_data_subject_requests')
    .update({ assigned_to: assigneeId })
    .eq('id', dsrId);

  if (error) {
    console.error('Error assigning DSR:', error);
    throw new Error('Failed to assign DSR');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/dsr');
}

export async function deleteDSR(dsrId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('gdpr_data_subject_requests').delete().eq('id', dsrId);

  if (error) {
    console.error('Error deleting DSR:', error);
    throw new Error('Failed to delete DSR');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/dsr');
}

// ============================================
// Breach Actions
// ============================================

export async function createBreach(input: CreateBreachInput): Promise<DataBreach> {
  const supabase = await createClient();
  const organizationId = await getOrganizationId();
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('gdpr_breaches')
    .insert({
      organization_id: organizationId,
      created_by: userId,
      ...input,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating breach:', error);
    throw new Error('Failed to create breach');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/breaches');
  return data;
}

export async function updateBreach(
  breachId: string,
  updates: Partial<DataBreach>
): Promise<DataBreach> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_breaches')
    .update(updates)
    .eq('id', breachId)
    .select()
    .single();

  if (error) {
    console.error('Error updating breach:', error);
    throw new Error('Failed to update breach');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/breaches');
  revalidatePath(`/data-protection/breaches/${breachId}`);
  return data;
}

export async function updateBreachStatus(breachId: string, status: BreachStatus): Promise<void> {
  const supabase = await createClient();
  const userId = await getUserId();

  const updateData: Record<string, unknown> = { status };

  if (status === 'closed') {
    updateData.closed_at = new Date().toISOString();
    updateData.closed_by = userId;
  }

  if (status === 'contained') {
    updateData.containment_date = new Date().toISOString();
  }

  if (status === 'notified_authority') {
    updateData.authority_notified_at = new Date().toISOString();
  }

  if (status === 'notified_subjects') {
    updateData.data_subjects_notified_at = new Date().toISOString();
  }

  const { error } = await supabase.from('gdpr_breaches').update(updateData).eq('id', breachId);

  if (error) {
    console.error('Error updating breach status:', error);
    throw new Error('Failed to update breach status');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/breaches');
}

export async function notifyAuthorityForBreach(
  breachId: string,
  authorityReference?: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('gdpr_breaches')
    .update({
      status: 'notified_authority',
      notify_authority: true,
      authority_notified_at: new Date().toISOString(),
      authority_reference: authorityReference,
    })
    .eq('id', breachId);

  if (error) {
    console.error('Error notifying authority:', error);
    throw new Error('Failed to update breach notification status');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/breaches');
}

export async function deleteBreach(breachId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('gdpr_breaches').delete().eq('id', breachId);

  if (error) {
    console.error('Error deleting breach:', error);
    throw new Error('Failed to delete breach');
  }

  revalidatePath('/data-protection');
  revalidatePath('/data-protection/breaches');
}
