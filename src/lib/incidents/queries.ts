/**
 * Incident Reporting Queries
 *
 * Database operations for DORA Article 19 incident management
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Incident,
  IncidentReport,
  IncidentEvent,
  IncidentWithRelations,
  IncidentListItem,
  IncidentFilters,
  IncidentSortOptions,
  IncidentStats,
  PendingDeadline,
  CreateIncidentInput,
  UpdateIncidentInput,
  CreateReportInput,
  CreateEventInput,
  ReportType,
} from './types';
import { generateIncidentRef, calculateDeadline } from './types';

// ============================================================================
// List & Filter Incidents
// ============================================================================

export async function getIncidents(
  filters?: IncidentFilters,
  sort?: IncidentSortOptions
): Promise<{ data: IncidentListItem[]; count: number; error: string | null }> {
  const supabase = await createClient();

  let query = supabase
    .from('incidents')
    .select(`
      id,
      incident_ref,
      title,
      classification,
      incident_type,
      status,
      detection_datetime,
      created_at,
      vendor:vendors(name),
      reports:incident_reports(deadline, status)
    `, { count: 'exact' });

  // Apply filters
  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    query = query.in('status', statuses);
  }

  if (filters?.classification) {
    const classifications = Array.isArray(filters.classification)
      ? filters.classification
      : [filters.classification];
    query = query.in('classification', classifications);
  }

  if (filters?.incident_type) {
    const types = Array.isArray(filters.incident_type)
      ? filters.incident_type
      : [filters.incident_type];
    query = query.in('incident_type', types);
  }

  if (filters?.vendor_id) {
    query = query.eq('vendor_id', filters.vendor_id);
  }

  if (filters?.date_from) {
    query = query.gte('detection_datetime', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('detection_datetime', filters.date_to);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,incident_ref.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Apply sorting
  const sortField = sort?.field || 'detection_datetime';
  const sortDir = sort?.direction || 'desc';
  query = query.order(sortField, { ascending: sortDir === 'asc' });

  const { data, error, count } = await query;

  if (error) {
    console.error('[Incidents] Query error:', error);
    return { data: [], count: 0, error: error.message };
  }

  // Transform to list items
  const listItems: IncidentListItem[] = (data || []).map((incident) => {
    // Handle vendor - can be object, array with single element, or null
    const vendorData = incident.vendor;
    const vendor = Array.isArray(vendorData)
      ? (vendorData[0] as { name: string } | undefined)
      : (vendorData as { name: string } | null);
    const reports = (incident.reports as Array<{ deadline: string; status: string }>) || [];

    // Find next pending deadline
    const pendingReports = reports.filter(r => r.status !== 'submitted' && r.status !== 'acknowledged');
    const nextDeadline = pendingReports.length > 0
      ? pendingReports.reduce((min, r) => r.deadline < min ? r.deadline : min, pendingReports[0].deadline)
      : null;

    return {
      id: incident.id,
      incident_ref: incident.incident_ref,
      title: incident.title,
      classification: incident.classification,
      incident_type: incident.incident_type,
      status: incident.status,
      detection_datetime: incident.detection_datetime,
      vendor_name: vendor?.name || null,
      next_deadline: nextDeadline,
      reports_count: reports.length,
      created_at: incident.created_at,
    };
  });

  return { data: listItems, count: count || 0, error: null };
}

// ============================================================================
// Get Single Incident
// ============================================================================

export async function getIncidentById(id: string): Promise<{ data: IncidentWithRelations | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('incidents')
    .select(`
      *,
      vendor:vendors(id, name, lei),
      reports:incident_reports(*),
      events:incident_events(*),
      created_by_user:users!incidents_created_by_fkey(id, full_name, email)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Incidents] Get by ID error:', error);
    return { data: null, error: error.message };
  }

  return { data: data as IncidentWithRelations, error: null };
}

// ============================================================================
// Create Incident
// ============================================================================

export async function createIncident(
  input: CreateIncidentInput
): Promise<{ data: Incident | null; error: string | null }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Authentication required' };
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    return { data: null, error: 'Organization not found' };
  }

  const incidentRef = generateIncidentRef();

  const { data, error } = await supabase
    .from('incidents')
    .insert({
      organization_id: userData.organization_id,
      incident_ref: incidentRef,
      created_by: user.id,
      status: 'draft',
      ...input,
    })
    .select()
    .single();

  if (error) {
    console.error('[Incidents] Create error:', error);
    return { data: null, error: error.message };
  }

  // Create initial event
  await addIncidentEvent(data.id, {
    event_type: 'created',
    description: `Incident ${incidentRef} created`,
  });

  return { data: data as Incident, error: null };
}

// ============================================================================
// Update Incident
// ============================================================================

export async function updateIncident(
  id: string,
  input: UpdateIncidentInput
): Promise<{ data: Incident | null; error: string | null }> {
  const supabase = await createClient();

  // Get current incident to track changes
  const { data: oldIncident } = await supabase
    .from('incidents')
    .select('classification, classification_override, status')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('incidents')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Incidents] Update error:', error);
    return { data: null, error: error.message };
  }

  // Track status change
  if (input.status && input.status !== oldIncident?.status) {
    await addIncidentEvent(id, {
      event_type: 'updated',
      description: `Status changed to ${input.status}`,
      metadata: { new_status: input.status, old_status: oldIncident?.status },
    });
  }

  // Track classification change
  if (input.classification && input.classification !== oldIncident?.classification) {
    const isOverride = input.classification_override === true;
    const eventDescription = isOverride
      ? `Classification overridden from ${oldIncident?.classification} to ${input.classification}`
      : `Classification changed from ${oldIncident?.classification} to ${input.classification}`;

    await addIncidentEvent(id, {
      event_type: 'reclassified',
      description: eventDescription,
      metadata: {
        old_classification: oldIncident?.classification,
        new_classification: input.classification,
        was_override: oldIncident?.classification_override,
        is_override: isOverride,
        justification: isOverride ? input.classification_override_justification : undefined,
      },
    });
  }

  return { data: data as Incident, error: null };
}

// ============================================================================
// Delete Incident
// ============================================================================

export async function deleteIncident(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('incidents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Incidents] Delete error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ============================================================================
// Reports
// ============================================================================

export async function getIncidentReports(incidentId: string): Promise<{ data: IncidentReport[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Incidents] Get reports error:', error);
    return { data: [], error: error.message };
  }

  return { data: data as IncidentReport[], error: null };
}

export async function createIncidentReport(
  incidentId: string,
  input: CreateReportInput
): Promise<{ data: IncidentReport | null; error: string | null }> {
  const supabase = await createClient();

  // Get incident to calculate deadline
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .select('detection_datetime')
    .eq('id', incidentId)
    .single();

  if (incidentError || !incident) {
    return { data: null, error: 'Incident not found' };
  }

  // Check if report type already exists
  const { data: existingReports } = await supabase
    .from('incident_reports')
    .select('id, version')
    .eq('incident_id', incidentId)
    .eq('report_type', input.report_type)
    .order('version', { ascending: false })
    .limit(1);

  const version = existingReports && existingReports.length > 0
    ? existingReports[0].version + 1
    : 1;

  const deadline = calculateDeadline(
    new Date(incident.detection_datetime),
    input.report_type as ReportType
  );

  const { data, error } = await supabase
    .from('incident_reports')
    .insert({
      incident_id: incidentId,
      report_type: input.report_type,
      version,
      status: 'draft',
      deadline: deadline.toISOString(),
      report_content: input.report_content,
    })
    .select()
    .single();

  if (error) {
    console.error('[Incidents] Create report error:', error);
    return { data: null, error: error.message };
  }

  return { data: data as IncidentReport, error: null };
}

export async function updateIncidentReport(
  reportId: string,
  updates: Partial<IncidentReport>
): Promise<{ data: IncidentReport | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('incident_reports')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('[Incidents] Update report error:', error);
    return { data: null, error: error.message };
  }

  return { data: data as IncidentReport, error: null };
}

export async function submitIncidentReport(
  reportId: string
): Promise<{ data: IncidentReport | null; error: string | null }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('incident_reports')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      submitted_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select(`*, incident:incidents(id, incident_ref, status)`)
    .single();

  if (error) {
    console.error('[Incidents] Submit report error:', error);
    return { data: null, error: error.message };
  }

  // Update incident status based on report type
  const incident = data.incident as { id: string; incident_ref: string; status: string };
  const newStatus = data.report_type === 'initial' ? 'initial_submitted'
    : data.report_type === 'intermediate' ? 'intermediate_submitted'
    : 'final_submitted';

  await supabase
    .from('incidents')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', incident.id);

  // Add event
  await addIncidentEvent(incident.id, {
    event_type: 'report_submitted',
    description: `${data.report_type.charAt(0).toUpperCase() + data.report_type.slice(1)} report submitted`,
    metadata: { report_id: reportId, report_type: data.report_type },
  });

  return { data: data as IncidentReport, error: null };
}

// ============================================================================
// Events (Timeline)
// ============================================================================

export async function getIncidentEvents(incidentId: string): Promise<{ data: IncidentEvent[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('incident_events')
    .select('*')
    .eq('incident_id', incidentId)
    .order('event_datetime', { ascending: true });

  if (error) {
    console.error('[Incidents] Get events error:', error);
    return { data: [], error: error.message };
  }

  return { data: data as IncidentEvent[], error: null };
}

export async function addIncidentEvent(
  incidentId: string,
  input: CreateEventInput
): Promise<{ data: IncidentEvent | null; error: string | null }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('incident_events')
    .insert({
      incident_id: incidentId,
      event_type: input.event_type,
      description: input.description,
      metadata: input.metadata || {},
      user_id: user?.id,
      event_datetime: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[Incidents] Add event error:', error);
    return { data: null, error: error.message };
  }

  return { data: data as IncidentEvent, error: null };
}

// ============================================================================
// Statistics & Dashboard
// ============================================================================

export async function getIncidentStats(): Promise<{ data: IncidentStats | null; error: string | null }> {
  const supabase = await createClient();

  // Get all incidents for stats
  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('classification, incident_type, status, duration_hours');

  if (error) {
    console.error('[Incidents] Stats error:', error);
    return { data: null, error: error.message };
  }

  // Get pending/overdue reports
  const now = new Date().toISOString();
  const { data: reports } = await supabase
    .from('incident_reports')
    .select('deadline, status')
    .not('status', 'in', '("submitted","acknowledged")');

  const pendingReports = reports?.length || 0;
  const overdueReports = reports?.filter(r => r.deadline < now).length || 0;

  // Calculate stats
  const stats: IncidentStats = {
    total: incidents?.length || 0,
    by_status: {
      draft: 0,
      detected: 0,
      initial_submitted: 0,
      intermediate_submitted: 0,
      final_submitted: 0,
      closed: 0,
    },
    by_classification: {
      major: 0,
      significant: 0,
      minor: 0,
    },
    by_type: {
      cyber_attack: 0,
      system_failure: 0,
      human_error: 0,
      third_party_failure: 0,
      natural_disaster: 0,
      other: 0,
    },
    pending_reports: pendingReports,
    overdue_reports: overdueReports,
    avg_resolution_hours: null,
  };

  // Aggregate
  let totalDuration = 0;
  let durationCount = 0;

  for (const incident of incidents || []) {
    stats.by_status[incident.status as keyof typeof stats.by_status]++;
    stats.by_classification[incident.classification as keyof typeof stats.by_classification]++;
    stats.by_type[incident.incident_type as keyof typeof stats.by_type]++;

    if (incident.duration_hours) {
      totalDuration += incident.duration_hours;
      durationCount++;
    }
  }

  if (durationCount > 0) {
    stats.avg_resolution_hours = Math.round(totalDuration / durationCount);
  }

  return { data: stats, error: null };
}

export async function getPendingDeadlines(limit = 10): Promise<{ data: PendingDeadline[]; error: string | null }> {
  const supabase = await createClient();

  const now = new Date();

  const { data, error } = await supabase
    .from('incident_reports')
    .select(`
      id,
      report_type,
      deadline,
      status,
      incident:incidents(id, incident_ref, title)
    `)
    .not('status', 'in', '("submitted","acknowledged")')
    .order('deadline', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[Incidents] Pending deadlines error:', error);
    return { data: [], error: error.message };
  }

  const deadlines: PendingDeadline[] = (data || []).map(report => {
    // Handle incident - can be object or array with single element
    const incidentData = report.incident;
    const incident = Array.isArray(incidentData)
      ? (incidentData[0] as { id: string; incident_ref: string; title: string })
      : (incidentData as { id: string; incident_ref: string; title: string });
    const deadlineDate = new Date(report.deadline);
    const hoursRemaining = Math.round((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    return {
      incident_id: incident?.id || '',
      incident_ref: incident?.incident_ref || '',
      incident_title: incident?.title || '',
      report_type: report.report_type,
      deadline: report.deadline,
      hours_remaining: hoursRemaining,
      is_overdue: hoursRemaining < 0,
    };
  });

  return { data: deadlines, error: null };
}

// ============================================================================
// Helpers for Forms
// ============================================================================

export async function getServicesForIncident(): Promise<{ data: Array<{ id: string; name: string }>; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ict_services')
    .select('id, service_name')
    .order('service_name');

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: (data || []).map(s => ({ id: s.id, name: s.service_name })),
    error: null
  };
}

export async function getCriticalFunctionsForIncident(): Promise<{ data: Array<{ id: string; name: string }>; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('critical_functions')
    .select('id, function_name')
    .order('function_name');

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: (data || []).map(f => ({ id: f.id, name: f.function_name })),
    error: null
  };
}

export async function getVendorsForIncident(): Promise<{ data: Array<{ id: string; name: string }>; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vendors')
    .select('id, name')
    .order('name');

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}
