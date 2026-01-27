/**
 * Intelligence Database Queries
 *
 * Server-side data fetching for business intelligence module.
 * Handles vendor news alerts and sync logging.
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization } from '@/lib/auth/organization';
import {
  VendorNewsAlert,
  IntelligenceSyncLog,
  InsertVendorNewsAlert,
  IntelligenceSummary,
  AlertFilters,
  PaginatedAlerts,
  IntelligenceSource,
  IntelligenceAlertType,
} from './types';

// =============================================================================
// ALERTS QUERIES
// =============================================================================

/**
 * Get vendor news alerts with optional filtering
 */
export async function getVendorAlerts(
  vendorId?: string,
  filters: AlertFilters = {},
  limit: number = 50
): Promise<VendorNewsAlert[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return [];
  }

  let query = supabase
    .from('vendor_news_alerts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Apply vendor filter
  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  // Apply additional filters
  if (filters.source) {
    query = query.eq('source', filters.source);
  }
  if (filters.alertType) {
    query = query.eq('alert_type', filters.alertType);
  }
  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters.isRead !== undefined) {
    query = query.eq('is_read', filters.isRead);
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get vendor alerts error:', error);
    return [];
  }

  return data as VendorNewsAlert[];
}

/**
 * Get paginated alerts
 */
export async function getPaginatedAlerts(
  filters: AlertFilters = {},
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedAlerts> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { alerts: [], totalCount: 0, pageCount: 0, currentPage: page };
  }

  let query = supabase
    .from('vendor_news_alerts')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('is_dismissed', false);

  // Apply filters
  if (filters.vendorId) {
    query = query.eq('vendor_id', filters.vendorId);
  }
  if (filters.source) {
    query = query.eq('source', filters.source);
  }
  if (filters.alertType) {
    query = query.eq('alert_type', filters.alertType);
  }
  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters.isRead !== undefined) {
    query = query.eq('is_read', filters.isRead);
  }
  if (filters.search) {
    query = query.ilike('headline', `%${filters.search}%`);
  }

  // Get total count
  const { count: totalCount } = await query;

  // Apply pagination
  const offset = (page - 1) * pageSize;
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Get paginated alerts error:', error);
    return { alerts: [], totalCount: 0, pageCount: 0, currentPage: page };
  }

  return {
    alerts: data as VendorNewsAlert[],
    totalCount: totalCount || 0,
    pageCount: Math.ceil((totalCount || 0) / pageSize),
    currentPage: page,
  };
}

/**
 * Get unread alerts count
 */
export async function getUnreadAlertsCount(vendorId?: string): Promise<number> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return 0;
  }

  let query = supabase
    .from('vendor_news_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_read', false)
    .eq('is_dismissed', false);

  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Get unread count error:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get intelligence summary for organization
 */
export async function getIntelligenceSummary(): Promise<IntelligenceSummary | null> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return null;
  }

  // Use the database function
  const { data, error } = await supabase.rpc('get_intelligence_summary', {
    p_organization_id: organizationId,
  });

  if (error) {
    console.error('Get intelligence summary error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return {
      totalAlerts: 0,
      unreadAlerts: 0,
      criticalAlerts: 0,
      highAlerts: 0,
      vendorsWithAlerts: 0,
      bySource: {} as Record<IntelligenceSource, number>,
      byType: {} as Record<IntelligenceAlertType, number>,
    };
  }

  const row = data[0];
  return {
    totalAlerts: row.total_alerts || 0,
    unreadAlerts: row.unread_alerts || 0,
    criticalAlerts: row.critical_alerts || 0,
    highAlerts: row.high_alerts || 0,
    vendorsWithAlerts: row.vendors_with_alerts || 0,
    latestAlertAt: row.latest_alert_at,
    bySource: {} as Record<IntelligenceSource, number>,
    byType: {} as Record<IntelligenceAlertType, number>,
  };
}

// =============================================================================
// ALERT MUTATIONS
// =============================================================================

/**
 * Create a new alert
 */
export async function createAlert(
  alert: InsertVendorNewsAlert
): Promise<VendorNewsAlert | null> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return null;
  }

  const { data, error } = await supabase
    .from('vendor_news_alerts')
    .insert({
      ...alert,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (error) {
    console.error('Create alert error:', error);
    return null;
  }

  return data as VendorNewsAlert;
}

/**
 * Create multiple alerts (for sync operations)
 */
export async function createAlertsBatch(
  alerts: InsertVendorNewsAlert[]
): Promise<{ created: number; errors: number }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId || alerts.length === 0) {
    return { created: 0, errors: 0 };
  }

  const alertsWithOrg = alerts.map((a) => ({
    ...a,
    organization_id: organizationId,
  }));

  const { data, error } = await supabase
    .from('vendor_news_alerts')
    .upsert(alertsWithOrg, {
      onConflict: 'vendor_id,source,external_id',
      ignoreDuplicates: true,
    })
    .select();

  if (error) {
    console.error('Create alerts batch error:', error);
    return { created: 0, errors: alerts.length };
  }

  return {
    created: data?.length || 0,
    errors: alerts.length - (data?.length || 0),
  };
}

/**
 * Mark alerts as read
 */
export async function markAlertsRead(alertIds: string[]): Promise<boolean> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId || alertIds.length === 0) {
    return false;
  }

  const { error } = await supabase
    .from('vendor_news_alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .in('id', alertIds);

  if (error) {
    console.error('Mark alerts read error:', error);
    return false;
  }

  return true;
}

/**
 * Mark all alerts as read for a vendor
 */
export async function markAllVendorAlertsRead(vendorId: string): Promise<boolean> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return false;
  }

  const { error } = await supabase
    .from('vendor_news_alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .eq('vendor_id', vendorId)
    .eq('is_read', false);

  if (error) {
    console.error('Mark all vendor alerts read error:', error);
    return false;
  }

  return true;
}

/**
 * Dismiss alerts
 */
export async function dismissAlerts(alertIds: string[]): Promise<boolean> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId || alertIds.length === 0) {
    return false;
  }

  const { error } = await supabase
    .from('vendor_news_alerts')
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .in('id', alertIds);

  if (error) {
    console.error('Dismiss alerts error:', error);
    return false;
  }

  return true;
}

// =============================================================================
// SYNC LOG QUERIES
// =============================================================================

/**
 * Create sync log entry
 */
export async function createSyncLog(
  vendorId: string | null,
  source: IntelligenceSource,
  syncType: 'manual' | 'scheduled' | 'webhook'
): Promise<string | null> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return null;
  }

  const { data, error } = await supabase
    .from('intelligence_sync_log')
    .insert({
      organization_id: organizationId,
      vendor_id: vendorId,
      source,
      sync_type: syncType,
      status: 'running',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Create sync log error:', error);
    return null;
  }

  return data.id;
}

/**
 * Update sync log with results
 */
export async function completeSyncLog(
  logId: string,
  alertsCreated: number,
  alertsUpdated: number,
  errorMessage?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('intelligence_sync_log')
    .update({
      status: errorMessage ? 'failed' : 'completed',
      alerts_created: alertsCreated,
      alerts_updated: alertsUpdated,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);

  if (error) {
    console.error('Complete sync log error:', error);
    return false;
  }

  return true;
}

/**
 * Get recent sync logs
 */
export async function getRecentSyncLogs(
  vendorId?: string,
  limit: number = 10
): Promise<IntelligenceSyncLog[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return [];
  }

  let query = supabase
    .from('intelligence_sync_log')
    .select('*')
    .eq('organization_id', organizationId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get sync logs error:', error);
    return [];
  }

  return data as IntelligenceSyncLog[];
}

// =============================================================================
// VENDOR MONITORING
// =============================================================================

/**
 * Get vendors with monitoring enabled
 */
export async function getMonitoredVendors(): Promise<
  Array<{ id: string; name: string; website?: string; news_keywords?: string[] }>
> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, website, news_keywords')
    .eq('organization_id', organizationId)
    .eq('news_monitoring_enabled', true);

  if (error) {
    console.error('Get monitored vendors error:', error);
    return [];
  }

  return data || [];
}

/**
 * Enable/disable monitoring for a vendor
 */
export async function setVendorMonitoring(
  vendorId: string,
  enabled: boolean,
  keywords?: string[]
): Promise<boolean> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return false;
  }

  const update: Record<string, unknown> = {
    news_monitoring_enabled: enabled,
  };

  if (keywords !== undefined) {
    update.news_keywords = keywords;
  }

  const { error } = await supabase
    .from('vendors')
    .update(update)
    .eq('id', vendorId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Set vendor monitoring error:', error);
    return false;
  }

  return true;
}

/**
 * Update vendor intelligence fields
 */
export async function updateVendorIntelligenceFields(
  vendorId: string,
  fields: {
    last_news_sync?: string;
    breach_exposure_count?: number;
    breach_exposure_checked_at?: string;
    breach_domains?: string[];
    breach_severity?: string;
    sec_cik?: string;
    last_sec_filing_date?: string;
    sec_filing_count?: number;
  }
): Promise<boolean> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return false;
  }

  const { error } = await supabase
    .from('vendors')
    .update(fields)
    .eq('id', vendorId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Update vendor intelligence fields error:', error);
    return false;
  }

  return true;
}
