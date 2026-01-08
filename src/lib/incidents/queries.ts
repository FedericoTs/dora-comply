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
  IncidentStatsEnhanced,
  IncidentTrendPoint,
  ResponseMetrics,
  ThirdPartyIncidentSummary,
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
// Enhanced Dashboard Statistics (DORA Article 19 Metrics)
// ============================================================================

/**
 * Get 30-day incident trend data for dashboard sparkline
 */
export async function getIncidentTrendData(days = 30): Promise<{ data: IncidentTrendPoint[]; error: string | null }> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('classification, detection_datetime')
    .gte('detection_datetime', startDate.toISOString());

  if (error) {
    console.error('[Incidents] Trend data error:', error);
    return { data: [], error: error.message };
  }

  // Create date buckets for the last N days
  const trendMap = new Map<string, IncidentTrendPoint>();
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateKey = date.toISOString().split('T')[0];
    trendMap.set(dateKey, {
      date: dateKey,
      total: 0,
      major: 0,
      significant: 0,
      minor: 0,
    });
  }

  // Aggregate incidents by date
  for (const incident of incidents || []) {
    const dateKey = incident.detection_datetime.split('T')[0];
    const point = trendMap.get(dateKey);
    if (point) {
      point.total++;
      if (incident.classification === 'major') point.major++;
      else if (incident.classification === 'significant') point.significant++;
      else point.minor++;
    }
  }

  return { data: Array.from(trendMap.values()), error: null };
}

/**
 * Get response time metrics for DORA Article 19 compliance tracking
 */
export async function getResponseMetrics(): Promise<{ data: ResponseMetrics | null; error: string | null }> {
  const supabase = await createClient();

  // Get incidents with timing data (last 90 days for meaningful averages)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: incidents, error: incidentError } = await supabase
    .from('incidents')
    .select('detection_datetime, occurrence_datetime, resolution_datetime')
    .gte('created_at', ninetyDaysAgo.toISOString());

  if (incidentError) {
    console.error('[Incidents] Response metrics error:', incidentError);
    return { data: null, error: incidentError.message };
  }

  // Get report submission timing
  const { data: reports, error: reportError } = await supabase
    .from('incident_reports')
    .select('deadline, submitted_at, status')
    .gte('created_at', ninetyDaysAgo.toISOString());

  if (reportError) {
    console.error('[Incidents] Report metrics error:', reportError);
    return { data: null, error: reportError.message };
  }

  // Calculate mean time to detect (detection - occurrence)
  let totalDetectHours = 0;
  let detectCount = 0;
  for (const inc of incidents || []) {
    if (inc.occurrence_datetime && inc.detection_datetime) {
      const occurrenceDate = new Date(inc.occurrence_datetime);
      const detectionDate = new Date(inc.detection_datetime);
      const diffHours = (detectionDate.getTime() - occurrenceDate.getTime()) / (1000 * 60 * 60);
      if (diffHours >= 0) {
        totalDetectHours += diffHours;
        detectCount++;
      }
    }
  }

  // Calculate mean time to resolve (resolution - detection)
  let totalResolveHours = 0;
  let resolveCount = 0;
  for (const inc of incidents || []) {
    if (inc.resolution_datetime && inc.detection_datetime) {
      const detectionDate = new Date(inc.detection_datetime);
      const resolutionDate = new Date(inc.resolution_datetime);
      const diffHours = (resolutionDate.getTime() - detectionDate.getTime()) / (1000 * 60 * 60);
      if (diffHours >= 0) {
        totalResolveHours += diffHours;
        resolveCount++;
      }
    }
  }

  // Calculate on-time report rate
  let reportsOnTime = 0;
  let reportsLate = 0;
  let totalReportHours = 0;
  let reportCount = 0;

  for (const report of reports || []) {
    if (report.status === 'submitted' || report.status === 'acknowledged') {
      if (report.submitted_at && report.deadline) {
        const submittedDate = new Date(report.submitted_at);
        const deadlineDate = new Date(report.deadline);
        if (submittedDate <= deadlineDate) {
          reportsOnTime++;
        } else {
          reportsLate++;
        }
        // Track time from creation to submission (approximation for MTTR)
        const diffHours = (submittedDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60);
        totalReportHours += Math.abs(diffHours);
        reportCount++;
      }
    }
  }

  const totalSubmitted = reportsOnTime + reportsLate;
  const onTimeRate = totalSubmitted > 0 ? Math.round((reportsOnTime / totalSubmitted) * 100) : 100;

  const metrics: ResponseMetrics = {
    mean_time_to_detect_hours: detectCount > 0 ? Math.round(totalDetectHours / detectCount * 10) / 10 : null,
    mean_time_to_report_hours: reportCount > 0 ? Math.round(totalReportHours / reportCount * 10) / 10 : null,
    mean_time_to_resolve_hours: resolveCount > 0 ? Math.round(totalResolveHours / resolveCount * 10) / 10 : null,
    on_time_report_rate: onTimeRate,
    reports_on_time: reportsOnTime,
    reports_late: reportsLate,
  };

  return { data: metrics, error: null };
}

/**
 * Get third-party incident statistics for vendor correlation
 */
export async function getThirdPartyIncidentStats(): Promise<{ data: ThirdPartyIncidentSummary[]; error: string | null }> {
  const supabase = await createClient();

  // Get incidents linked to vendors (last 12 months)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('vendor_id, vendor:vendors(name)')
    .not('vendor_id', 'is', null)
    .gte('created_at', oneYearAgo.toISOString());

  if (error) {
    console.error('[Incidents] Third-party stats error:', error);
    return { data: [], error: error.message };
  }

  // Aggregate by vendor
  const vendorMap = new Map<string, { name: string; count: number }>();
  for (const incident of incidents || []) {
    if (incident.vendor_id) {
      const vendorData = incident.vendor;
      const vendor = Array.isArray(vendorData)
        ? (vendorData[0] as { name: string } | undefined)
        : (vendorData as { name: string } | null);
      const vendorName = vendor?.name || 'Unknown';

      const existing = vendorMap.get(incident.vendor_id);
      if (existing) {
        existing.count++;
      } else {
        vendorMap.set(incident.vendor_id, { name: vendorName, count: 1 });
      }
    }
  }

  // Sort by count descending
  const results: ThirdPartyIncidentSummary[] = Array.from(vendorMap.entries())
    .map(([vendor_id, data]) => ({
      vendor_id,
      vendor_name: data.name,
      incident_count: data.count,
    }))
    .sort((a, b) => b.incident_count - a.incident_count);

  return { data: results, error: null };
}

/**
 * Get enhanced incident statistics combining all metrics for dashboard
 */
export async function getIncidentStatsEnhanced(): Promise<{ data: IncidentStatsEnhanced | null; error: string | null }> {
  // Fetch all data in parallel
  const [baseStatsResult, trendResult, metricsResult, thirdPartyResult] = await Promise.all([
    getIncidentStats(),
    getIncidentTrendData(30),
    getResponseMetrics(),
    getThirdPartyIncidentStats(),
  ]);

  if (baseStatsResult.error || !baseStatsResult.data) {
    return { data: null, error: baseStatsResult.error || 'Failed to fetch base stats' };
  }

  const enhancedStats: IncidentStatsEnhanced = {
    ...baseStatsResult.data,
    trend_30d: trendResult.data || [],
    response_metrics: metricsResult.data || {
      mean_time_to_detect_hours: null,
      mean_time_to_report_hours: null,
      mean_time_to_resolve_hours: null,
      on_time_report_rate: 100,
      reports_on_time: 0,
      reports_late: 0,
    },
    third_party_count: thirdPartyResult.data?.length || 0,
    third_party_vendors: thirdPartyResult.data?.slice(0, 5) || [], // Top 5 vendors
  };

  return { data: enhancedStats, error: null };
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
