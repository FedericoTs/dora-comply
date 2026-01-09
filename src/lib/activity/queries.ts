/**
 * Activity Log Queries
 *
 * Server-side data fetching for activity log entries.
 * Used for dashboard recent activity and audit trails.
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface ActivityLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  entity_name?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
  user_id?: string | null;
  user_email?: string | null;
}

export type ActivityType = 'success' | 'warning' | 'info' | 'security';

// Security event types for audit compliance
export type SecurityEventType =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'mfa_enrolled'
  | 'mfa_unenrolled'
  | 'mfa_challenge_success'
  | 'mfa_challenge_failed'
  | 'session_created'
  | 'session_revoked'
  | 'role_changed'
  | 'permission_changed'
  | 'api_key_created'
  | 'api_key_revoked';

// Compliance event types
export type ComplianceEventType =
  | 'roi_submitted'
  | 'roi_validated'
  | 'roi_exported'
  | 'incident_created'
  | 'incident_classified'
  | 'incident_reported'
  | 'incident_closed'
  | 'test_completed'
  | 'finding_documented'
  | 'remediation_completed'
  | 'maturity_assessed'
  | 'framework_enabled';

// Entity types for filtering
export type AuditEntityType =
  | 'auth'
  | 'vendor'
  | 'document'
  | 'contract'
  | 'incident'
  | 'roi'
  | 'testing'
  | 'compliance'
  | 'organization'
  | 'user';

// Audit trail filters
export interface AuditTrailFilters {
  entityType?: AuditEntityType;
  action?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Paginated result
export interface PaginatedAuditResult {
  entries: ActivityLogEntry[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getCurrentUserOrganization(): Promise<string | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  return userData?.organization_id || null;
}

/**
 * Map activity action to display type for UI styling
 */
export function mapActivityType(action: string): ActivityType {
  // Security events (authentication, authorization)
  const securityActions = [
    'login', 'logout', 'password_change', 'password_reset',
    'mfa_enrolled', 'mfa_unenrolled', 'mfa_challenge',
    'session_created', 'session_revoked',
    'role_changed', 'permission_changed',
    'api_key_created', 'api_key_revoked',
  ];
  if (securityActions.some(sa => action.includes(sa))) {
    return 'security';
  }

  if (action.startsWith('create') || action.includes('success') || action.includes('complete')) {
    return 'success';
  }
  if (action.startsWith('delete') || action.includes('error') || action.includes('fail')) {
    return 'warning';
  }
  return 'info';
}

/**
 * Format activity title from action and entity type
 */
export function formatActivityTitle(action: string, entityType: string): string {
  const actionMap: Record<string, string> = {
    'create': 'Created',
    'update': 'Updated',
    'delete': 'Deleted',
    'upload': 'Uploaded',
    'download': 'Downloaded',
    'export': 'Exported',
    'import': 'Imported',
    'verify': 'Verified',
    'approve': 'Approved',
    'reject': 'Rejected',
  };

  const entityMap: Record<string, string> = {
    'vendor': 'vendor',
    'contract': 'contract',
    'document': 'document',
    'ict_service': 'ICT service',
    'critical_function': 'critical function',
    'incident': 'incident',
    'roi': 'RoI template',
    'user': 'user',
    'organization': 'organization',
  };

  const formattedAction = actionMap[action] || action.charAt(0).toUpperCase() + action.slice(1);
  const formattedEntity = entityMap[entityType] || entityType.replace(/_/g, ' ');

  return `${formattedAction} ${formattedEntity}`;
}

/**
 * Format relative time string
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get recent activity log entries for dashboard
 */
export async function getRecentActivity(limit: number = 5): Promise<ActivityLogEntry[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('activity_log')
    .select('id, action, entity_type, entity_id, entity_name, details, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get activity log error:', error);
    return [];
  }

  return (data || []).map(entry => ({
    id: entry.id,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    entity_name: entry.entity_name,
    details: entry.details as Record<string, unknown> | null,
    created_at: entry.created_at,
  }));
}

/**
 * Log an activity entry
 */
export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string,
  entityName?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    details,
  });
}

// ============================================================================
// Security Event Logging
// ============================================================================

/**
 * Log a security event (authentication, authorization, etc.)
 */
export async function logSecurityEvent(
  event: SecurityEventType,
  details?: Record<string, unknown>,
  userId?: string,
  userEmail?: string
): Promise<void> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  // For security events, we may not have an organization context (e.g., login)
  // In that case, try to get org from the user being affected
  let orgId = organizationId;

  if (!orgId && userId) {
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();
    orgId = userData?.organization_id || null;
  }

  // Get current user if not provided
  let currentUserId = userId;
  let currentUserEmail = userEmail;

  if (!currentUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id;
    currentUserEmail = user?.email;
  }

  // Log even without organization for security audit purposes
  await supabase.from('activity_log').insert({
    organization_id: orgId,
    user_id: currentUserId,
    action: event,
    entity_type: 'auth',
    entity_name: currentUserEmail || 'Unknown user',
    details: {
      ...details,
      user_email: currentUserEmail,
      ip_address: details?.ip_address,
      user_agent: details?.user_agent,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log a compliance event (RoI, incidents, testing, etc.)
 */
export async function logComplianceEvent(
  event: ComplianceEventType,
  entityId?: string,
  entityName?: string,
  details?: Record<string, unknown>
): Promise<void> {
  // Map compliance events to entity types
  const entityTypeMap: Record<ComplianceEventType, AuditEntityType> = {
    roi_submitted: 'roi',
    roi_validated: 'roi',
    roi_exported: 'roi',
    incident_created: 'incident',
    incident_classified: 'incident',
    incident_reported: 'incident',
    incident_closed: 'incident',
    test_completed: 'testing',
    finding_documented: 'testing',
    remediation_completed: 'testing',
    maturity_assessed: 'compliance',
    framework_enabled: 'compliance',
  };

  await logActivity(event, entityTypeMap[event], entityId, entityName, details);
}

// ============================================================================
// Enhanced Audit Trail Queries
// ============================================================================

/**
 * Get paginated audit trail with filters
 */
export async function getAuditTrail(
  filters: AuditTrailFilters = {},
  page: number = 1,
  pageSize: number = 25
): Promise<PaginatedAuditResult> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { entries: [], totalCount: 0, pageCount: 0, currentPage: page };
  }

  // Build base query
  let query = supabase
    .from('activity_log')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId);

  // Apply filters
  if (filters.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }

  if (filters.action) {
    query = query.ilike('action', `%${filters.action}%`);
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom.toISOString());
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo.toISOString());
  }

  if (filters.search) {
    query = query.or(
      `entity_name.ilike.%${filters.search}%,action.ilike.%${filters.search}%`
    );
  }

  // Get total count first
  const { count: totalCount } = await query;

  // Apply pagination and ordering
  const offset = (page - 1) * pageSize;
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Get audit trail error:', error);
    return { entries: [], totalCount: 0, pageCount: 0, currentPage: page };
  }

  const entries = (data || []).map(entry => ({
    id: entry.id,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    entity_name: entry.entity_name,
    details: entry.details as Record<string, unknown> | null,
    created_at: entry.created_at,
    user_id: entry.user_id,
    user_email: (entry.details as Record<string, unknown>)?.user_email as string | undefined,
  }));

  return {
    entries,
    totalCount: totalCount || 0,
    pageCount: Math.ceil((totalCount || 0) / pageSize),
    currentPage: page,
  };
}

/**
 * Get security-related activity for audit
 */
export async function getSecurityAuditTrail(
  limit: number = 50
): Promise<ActivityLogEntry[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'auth')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get security audit trail error:', error);
    return [];
  }

  return (data || []).map(entry => ({
    id: entry.id,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    entity_name: entry.entity_name,
    details: entry.details as Record<string, unknown> | null,
    created_at: entry.created_at,
    user_id: entry.user_id,
    user_email: (entry.details as Record<string, unknown>)?.user_email as string | undefined,
  }));
}

/**
 * Get audit summary statistics
 */
export async function getAuditSummary(days: number = 30): Promise<{
  totalEvents: number;
  securityEvents: number;
  complianceEvents: number;
  byEntityType: Record<string, number>;
  byAction: Record<string, number>;
  recentHighPriority: ActivityLogEntry[];
}> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return {
      totalEvents: 0,
      securityEvents: 0,
      complianceEvents: 0,
      byEntityType: {},
      byAction: {},
      recentHighPriority: [],
    };
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Get audit summary error:', error);
    return {
      totalEvents: 0,
      securityEvents: 0,
      complianceEvents: 0,
      byEntityType: {},
      byAction: {},
      recentHighPriority: [],
    };
  }

  // Count by entity type
  const byEntityType: Record<string, number> = {};
  const byAction: Record<string, number> = {};
  let securityEvents = 0;
  let complianceEvents = 0;

  const securityActions = ['login', 'login_failed', 'logout', 'password_change', 'mfa_enrolled', 'mfa_unenrolled'];
  const complianceActions = ['roi_submitted', 'roi_exported', 'incident_created', 'incident_reported', 'test_completed'];

  for (const entry of data) {
    // Count by entity type
    byEntityType[entry.entity_type] = (byEntityType[entry.entity_type] || 0) + 1;

    // Count by action
    byAction[entry.action] = (byAction[entry.action] || 0) + 1;

    // Count security events
    if (entry.entity_type === 'auth' || securityActions.includes(entry.action)) {
      securityEvents++;
    }

    // Count compliance events
    if (complianceActions.includes(entry.action)) {
      complianceEvents++;
    }
  }

  // Get high priority events (failed logins, deletions, etc.)
  const highPriorityActions = ['login_failed', 'delete', 'deleted', 'bulk_deleted', 'mfa_challenge_failed'];
  const recentHighPriority = data
    .filter(entry => highPriorityActions.some(a => entry.action.includes(a)))
    .slice(0, 10)
    .map(entry => ({
      id: entry.id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      entity_name: entry.entity_name,
      details: entry.details as Record<string, unknown> | null,
      created_at: entry.created_at,
      user_id: entry.user_id,
      user_email: (entry.details as Record<string, unknown>)?.user_email as string | undefined,
    }));

  return {
    totalEvents: data.length,
    securityEvents,
    complianceEvents,
    byEntityType,
    byAction,
    recentHighPriority,
  };
}

/**
 * Export audit trail as CSV
 */
export async function exportAuditTrailCsv(
  filters: AuditTrailFilters = {}
): Promise<string> {
  const { entries } = await getAuditTrail(filters, 1, 10000); // Get up to 10k entries

  const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity Name', 'User', 'Details'];
  const rows = entries.map(entry => [
    new Date(entry.created_at).toISOString(),
    entry.action,
    entry.entity_type,
    entry.entity_name || '',
    entry.user_email || entry.user_id || '',
    JSON.stringify(entry.details || {}),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}
