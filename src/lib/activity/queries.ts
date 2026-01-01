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
}

export type ActivityType = 'success' | 'warning' | 'info';

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
