/**
 * Activity Log Utilities
 *
 * Client-safe utility functions for activity log entries.
 * These are separated from queries.ts to allow client component imports.
 */

// ============================================================================
// Types
// ============================================================================

export type ActivityType = 'success' | 'warning' | 'info' | 'security';

// ============================================================================
// Helper Functions
// ============================================================================

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
