/**
 * GDPR Module Queries
 *
 * Database query functions for GDPR compliance tracking
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ProcessingActivity,
  DPIA,
  DPIAWithDetails,
  DPIARisk,
  DPIAMitigation,
  DataSubjectRequest,
  DSRWithDetails,
  DataBreach,
  BreachWithDetails,
  GDPRStats,
  DSRType,
} from './types';

// ============================================
// Processing Activities Queries
// ============================================

/**
 * Get all processing activities for an organization
 */
export async function getProcessingActivities(
  organizationId: string,
  options?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: ProcessingActivity[]; count: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('gdpr_processing_activities')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching processing activities:', error);
    throw new Error('Failed to fetch processing activities');
  }

  return { data: data || [], count: count || 0 };
}

/**
 * Get a single processing activity by ID
 */
export async function getProcessingActivity(
  activityId: string
): Promise<ProcessingActivity | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_processing_activities')
    .select('*')
    .eq('id', activityId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching processing activity:', error);
    throw new Error('Failed to fetch processing activity');
  }

  return data;
}

// ============================================
// DPIA Queries
// ============================================

/**
 * Get all DPIAs for an organization
 */
export async function getDPIAs(
  organizationId: string,
  options?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: DPIA[]; count: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('gdpr_dpias')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching DPIAs:', error);
    throw new Error('Failed to fetch DPIAs');
  }

  return { data: data || [], count: count || 0 };
}

/**
 * Get a DPIA with full details
 */
export async function getDPIAWithDetails(dpiaId: string): Promise<DPIAWithDetails | null> {
  const supabase = await createClient();

  // Get DPIA
  const { data: dpia, error: dpiaError } = await supabase
    .from('gdpr_dpias')
    .select('*')
    .eq('id', dpiaId)
    .single();

  if (dpiaError) {
    if (dpiaError.code === 'PGRST116') return null;
    console.error('Error fetching DPIA:', dpiaError);
    throw new Error('Failed to fetch DPIA');
  }

  // Get risks
  const { data: risks } = await supabase
    .from('gdpr_dpia_risks')
    .select('*')
    .eq('dpia_id', dpiaId)
    .order('order_index', { ascending: true });

  // Get mitigations
  const { data: mitigations } = await supabase
    .from('gdpr_dpia_mitigations')
    .select('*')
    .eq('dpia_id', dpiaId);

  // Get processing activity if linked
  let processingActivity = null;
  if (dpia.processing_activity_id) {
    const { data: activity } = await supabase
      .from('gdpr_processing_activities')
      .select('*')
      .eq('id', dpia.processing_activity_id)
      .single();
    processingActivity = activity;
  }

  // Get user names
  let approvedByUser = null;
  let createdByUser = null;

  if (dpia.approved_by) {
    const { data: user } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', dpia.approved_by)
      .single();
    approvedByUser = user;
  }

  if (dpia.created_by) {
    const { data: user } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', dpia.created_by)
      .single();
    createdByUser = user;
  }

  return {
    ...dpia,
    risks: risks || [],
    mitigations: mitigations || [],
    processing_activity: processingActivity,
    approved_by_user: approvedByUser,
    created_by_user: createdByUser,
  };
}

/**
 * Get DPIA risks
 */
export async function getDPIARisks(dpiaId: string): Promise<DPIARisk[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_dpia_risks')
    .select('*')
    .eq('dpia_id', dpiaId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching DPIA risks:', error);
    throw new Error('Failed to fetch DPIA risks');
  }

  return data || [];
}

/**
 * Get DPIA mitigations
 */
export async function getDPIAMitigations(dpiaId: string): Promise<DPIAMitigation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_dpia_mitigations')
    .select('*')
    .eq('dpia_id', dpiaId);

  if (error) {
    console.error('Error fetching DPIA mitigations:', error);
    throw new Error('Failed to fetch DPIA mitigations');
  }

  return data || [];
}

// ============================================
// DSR Queries
// ============================================

/**
 * Get all DSRs for an organization
 */
export async function getDSRs(
  organizationId: string,
  options?: {
    status?: string;
    type?: DSRType;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: DSRWithDetails[]; count: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('gdpr_data_subject_requests')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('received_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.type) {
    query = query.eq('request_type', options.type);
  }

  if (options?.search) {
    query = query.or(
      `reference_number.ilike.%${options.search}%,data_subject_name.ilike.%${options.search}%,data_subject_email.ilike.%${options.search}%`
    );
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching DSRs:', error);
    throw new Error('Failed to fetch DSRs');
  }

  // Enrich with user and vendor details
  const enrichedData: DSRWithDetails[] = [];
  for (const dsr of data || []) {
    let assignedToUser = null;
    let vendor = null;

    if (dsr.assigned_to) {
      const { data: user } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', dsr.assigned_to)
        .single();
      assignedToUser = user;
    }

    if (dsr.vendor_id) {
      const { data: v } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('id', dsr.vendor_id)
        .single();
      vendor = v;
    }

    enrichedData.push({
      ...dsr,
      assigned_to_user: assignedToUser,
      vendor,
    });
  }

  return { data: enrichedData, count: count || 0 };
}

/**
 * Get a single DSR by ID
 */
export async function getDSR(dsrId: string): Promise<DSRWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_data_subject_requests')
    .select('*')
    .eq('id', dsrId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching DSR:', error);
    throw new Error('Failed to fetch DSR');
  }

  let assignedToUser = null;
  let vendor = null;

  if (data.assigned_to) {
    const { data: user } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.assigned_to)
      .single();
    assignedToUser = user;
  }

  if (data.vendor_id) {
    const { data: v } = await supabase
      .from('vendors')
      .select('id, name')
      .eq('id', data.vendor_id)
      .single();
    vendor = v;
  }

  return {
    ...data,
    assigned_to_user: assignedToUser,
    vendor,
  };
}

/**
 * Get overdue DSRs
 */
export async function getOverdueDSRs(organizationId: string): Promise<DataSubjectRequest[]> {
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('gdpr_data_subject_requests')
    .select('*')
    .eq('organization_id', organizationId)
    .in('status', ['received', 'identity_verification', 'in_progress', 'extended'])
    .lt('response_due_date', today)
    .order('response_due_date', { ascending: true });

  if (error) {
    console.error('Error fetching overdue DSRs:', error);
    throw new Error('Failed to fetch overdue DSRs');
  }

  return data || [];
}

// ============================================
// Breach Queries
// ============================================

/**
 * Get all breaches for an organization
 */
export async function getBreaches(
  organizationId: string,
  options?: {
    status?: string;
    severity?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: BreachWithDetails[]; count: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('gdpr_breaches')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('detected_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.severity) {
    query = query.eq('severity', options.severity);
  }

  if (options?.search) {
    query = query.or(
      `reference_number.ilike.%${options.search}%,title.ilike.%${options.search}%,description.ilike.%${options.search}%`
    );
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching breaches:', error);
    throw new Error('Failed to fetch breaches');
  }

  // Enrich with vendor details
  const enrichedData: BreachWithDetails[] = [];
  for (const breach of data || []) {
    let vendor = null;
    let closedByUser = null;

    if (breach.vendor_id) {
      const { data: v } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('id', breach.vendor_id)
        .single();
      vendor = v;
    }

    if (breach.closed_by) {
      const { data: user } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', breach.closed_by)
        .single();
      closedByUser = user;
    }

    enrichedData.push({
      ...breach,
      vendor,
      closed_by_user: closedByUser,
    });
  }

  return { data: enrichedData, count: count || 0 };
}

/**
 * Get a single breach by ID
 */
export async function getBreach(breachId: string): Promise<BreachWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gdpr_breaches')
    .select('*')
    .eq('id', breachId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching breach:', error);
    throw new Error('Failed to fetch breach');
  }

  let vendor = null;
  let closedByUser = null;

  if (data.vendor_id) {
    const { data: v } = await supabase
      .from('vendors')
      .select('id, name')
      .eq('id', data.vendor_id)
      .single();
    vendor = v;
  }

  if (data.closed_by) {
    const { data: user } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.closed_by)
      .single();
    closedByUser = user;
  }

  return {
    ...data,
    vendor,
    closed_by_user: closedByUser,
  };
}

// ============================================
// Stats Queries
// ============================================

/**
 * Get GDPR compliance statistics
 */
export async function getGDPRStats(organizationId: string): Promise<GDPRStats> {
  const supabase = await createClient();

  // Processing Activities stats
  const { data: activities } = await supabase
    .from('gdpr_processing_activities')
    .select('status, requires_dpia, involves_international_transfer, involves_special_category')
    .eq('organization_id', organizationId);

  const activitiesStats = {
    total: activities?.length || 0,
    active: activities?.filter((a) => a.status === 'active').length || 0,
    requiring_dpia: activities?.filter((a) => a.requires_dpia).length || 0,
    with_international_transfer: activities?.filter((a) => a.involves_international_transfer).length || 0,
    with_special_category: activities?.filter((a) => a.involves_special_category).length || 0,
  };

  // DPIA stats
  const { data: dpias } = await supabase
    .from('gdpr_dpias')
    .select('status, overall_risk_level')
    .eq('organization_id', organizationId);

  const dpiaStats = {
    total: dpias?.length || 0,
    draft: dpias?.filter((d) => d.status === 'draft').length || 0,
    in_progress: dpias?.filter((d) => d.status === 'in_progress').length || 0,
    approved: dpias?.filter((d) => d.status === 'approved').length || 0,
    high_risk: dpias?.filter((d) => d.overall_risk_level === 'high' || d.overall_risk_level === 'very_high').length || 0,
  };

  // DSR stats
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { data: dsrs } = await supabase
    .from('gdpr_data_subject_requests')
    .select('status, request_type, response_due_date, response_date')
    .eq('organization_id', organizationId);

  const openStatuses = ['received', 'identity_verification', 'in_progress', 'extended'];

  const dsrByType: Record<DSRType, number> = {
    access: 0,
    rectification: 0,
    erasure: 0,
    restriction: 0,
    portability: 0,
    objection: 0,
    automated_decision: 0,
  };

  dsrs?.forEach((dsr) => {
    if (dsr.request_type in dsrByType) {
      dsrByType[dsr.request_type as DSRType]++;
    }
  });

  const dsrStats = {
    total: dsrs?.length || 0,
    open: dsrs?.filter((d) => openStatuses.includes(d.status)).length || 0,
    overdue: dsrs?.filter(
      (d) => openStatuses.includes(d.status) && d.response_due_date < today
    ).length || 0,
    completed_this_month: dsrs?.filter(
      (d) => d.status === 'completed' && d.response_date && d.response_date >= startOfMonth
    ).length || 0,
    by_type: dsrByType,
  };

  // Breach stats
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();

  const { data: breaches } = await supabase
    .from('gdpr_breaches')
    .select('status, detected_at, notify_authority')
    .eq('organization_id', organizationId);

  const openBreachStatuses = ['detected', 'investigating', 'contained', 'notified_authority', 'notified_subjects', 'resolved'];

  const breachStats = {
    total: breaches?.length || 0,
    open: breaches?.filter((b) => openBreachStatuses.includes(b.status) && b.status !== 'resolved').length || 0,
    this_year: breaches?.filter((b) => b.detected_at >= startOfYear).length || 0,
    requiring_notification: breaches?.filter((b) => b.notify_authority === true).length || 0,
  };

  return {
    processing_activities: activitiesStats,
    dpias: dpiaStats,
    dsr: dsrStats,
    breaches: breachStats,
  };
}
