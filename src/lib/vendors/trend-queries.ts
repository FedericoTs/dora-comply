/**
 * Vendor Trend & Activity Queries
 *
 * Phase 5 data layer for sparklines, activity timeline, and peer benchmarking.
 * These queries power the enhanced vendor dashboard visualizations.
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization } from '@/lib/auth/organization';

// ============================================================================
// Types
// ============================================================================

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface VendorTrends {
  /** Risk score trend (from vendor_score_history) */
  riskScoreTrend: TrendDataPoint[];
  /** Overall vendor count trend */
  vendorCountTrend: TrendDataPoint[];
  /** Critical vendor count trend */
  criticalCountTrend: TrendDataPoint[];
  /** Average risk score trend */
  avgRiskTrend: TrendDataPoint[];
  /** Period statistics */
  period: {
    start: string;
    end: string;
    days: number;
  };
  /** Summary changes */
  changes: {
    totalVendors: number;
    criticalVendors: number;
    avgRiskScore: number;
  };
}

export interface VendorScoreTrend {
  vendorId: string;
  vendorName: string;
  currentScore: number | null;
  currentGrade: string | null;
  trend: TrendDataPoint[];
  change: number;
  changePercent: number;
}

export type ActivityType =
  | 'vendor_created'
  | 'vendor_updated'
  | 'document_uploaded'
  | 'contract_added'
  | 'contract_expiring'
  | 'assessment_completed'
  | 'risk_score_changed'
  | 'monitoring_alert'
  | 'soc2_parsed'
  | 'lei_verified'
  | 'contact_added'
  | 'status_changed'
  | 'maturity_change';

export interface VendorActivity {
  id: string;
  vendorId: string;
  vendorName?: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

export interface PeerBenchmark {
  /** Organization's average risk score */
  orgAvgRiskScore: number | null;
  /** Industry average (simulated for now) */
  industryAvgRiskScore: number;
  /** Percentile rank (0-100) */
  percentileRank: number;
  /** Organization's critical vendor ratio */
  orgCriticalRatio: number;
  /** Industry average critical ratio */
  industryCriticalRatio: number;
  /** DORA readiness comparison */
  doraReadiness: {
    org: number;
    industryAvg: number;
  };
  /** Sample size for benchmark */
  sampleSize: number;
}

// ============================================================================
// Vendor Trends Query
// ============================================================================

/**
 * Get vendor trends for sparklines and dashboard stats
 */
export async function getVendorTrends(
  period: '7d' | '30d' | '90d' = '30d'
): Promise<VendorTrends> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  const defaultTrends: VendorTrends = {
    riskScoreTrend: [],
    vendorCountTrend: [],
    criticalCountTrend: [],
    avgRiskTrend: [],
    period: { start: '', end: '', days: 0 },
    changes: { totalVendors: 0, criticalVendors: 0, avgRiskScore: 0 },
  };

  if (!organizationId) return defaultTrends;

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const endDate = new Date();

  // Fetch vendor score history for trend data
  const { data: scoreHistory } = await supabase
    .from('vendor_score_history')
    .select('vendor_id, score, grade, recorded_at')
    .eq('organization_id', organizationId)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: true });

  // Fetch current vendor stats
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, tier, risk_score, created_at')
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (!vendors) return defaultTrends;

  // Calculate current stats
  const currentTotal = vendors.length;
  const currentCritical = vendors.filter(v => v.tier === 'critical').length;
  const vendorsWithScore = vendors.filter(v => v.risk_score !== null);
  const currentAvgRisk = vendorsWithScore.length > 0
    ? Math.round(vendorsWithScore.reduce((sum, v) => sum + (v.risk_score || 0), 0) / vendorsWithScore.length)
    : null;

  // Count vendors added in period
  const vendorsInPeriod = vendors.filter(v => new Date(v.created_at) >= startDate);
  const criticalInPeriod = vendorsInPeriod.filter(v => v.tier === 'critical').length;

  // Build risk score trend from history
  const riskScoreTrend: TrendDataPoint[] = [];
  if (scoreHistory && scoreHistory.length > 0) {
    // Group by date and average
    const byDate = new Map<string, number[]>();
    for (const record of scoreHistory) {
      const date = record.recorded_at.split('T')[0];
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(record.score);
    }

    for (const [date, scores] of byDate) {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      riskScoreTrend.push({ date, value: avg });
    }
  }

  // Generate synthetic trend data for vendor counts (based on created_at)
  const vendorCountTrend: TrendDataPoint[] = [];
  const criticalCountTrend: TrendDataPoint[] = [];

  // Create daily buckets
  for (let d = 0; d <= days; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];

    // Count vendors that existed on this date
    const vendorsOnDate = vendors.filter(v => new Date(v.created_at) <= date);
    vendorCountTrend.push({ date: dateStr, value: vendorsOnDate.length });
    criticalCountTrend.push({
      date: dateStr,
      value: vendorsOnDate.filter(v => v.tier === 'critical').length,
    });
  }

  // Calculate risk score change
  const firstRisk = riskScoreTrend.length > 0 ? riskScoreTrend[0].value : currentAvgRisk || 0;
  const lastRisk = riskScoreTrend.length > 0 ? riskScoreTrend[riskScoreTrend.length - 1].value : currentAvgRisk || 0;

  return {
    riskScoreTrend,
    vendorCountTrend,
    criticalCountTrend,
    avgRiskTrend: riskScoreTrend, // Reuse for now
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      days,
    },
    changes: {
      totalVendors: vendorsInPeriod.length,
      criticalVendors: criticalInPeriod,
      avgRiskScore: lastRisk - firstRisk,
    },
  };
}

// ============================================================================
// Vendor Score Trend Query (Individual Vendor)
// ============================================================================

/**
 * Get score trend for a specific vendor
 */
export async function getVendorScoreTrend(
  vendorId: string,
  period: '7d' | '30d' | '90d' = '30d'
): Promise<VendorScoreTrend | null> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) return null;

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch vendor info
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, name, risk_score, external_risk_score, external_risk_grade')
    .eq('id', vendorId)
    .eq('organization_id', organizationId)
    .single();

  if (!vendor) return null;

  // Fetch score history
  const { data: history } = await supabase
    .from('vendor_score_history')
    .select('score, grade, recorded_at')
    .eq('vendor_id', vendorId)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: true });

  const trend: TrendDataPoint[] = (history || []).map(h => ({
    date: h.recorded_at.split('T')[0],
    value: h.score,
  }));

  // Calculate change
  const currentScore = vendor.external_risk_score ?? vendor.risk_score ?? null;
  const firstScore = trend.length > 0 ? trend[0].value : currentScore;
  const change = currentScore !== null && firstScore !== null ? currentScore - firstScore : 0;
  const changePercent = firstScore && firstScore > 0 ? Math.round((change / firstScore) * 100) : 0;

  return {
    vendorId: vendor.id,
    vendorName: vendor.name,
    currentScore,
    currentGrade: vendor.external_risk_grade,
    trend,
    change,
    changePercent,
  };
}

// ============================================================================
// Vendor Activities Query
// ============================================================================

/**
 * Get activity timeline for a vendor
 */
export async function getVendorActivities(
  vendorId: string,
  limit: number = 20
): Promise<VendorActivity[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) return [];

  const activities: VendorActivity[] = [];

  // Fetch from multiple sources in parallel
  const [
    vendorResult,
    documentsResult,
    contractsResult,
    alertsResult,
    changeLogResult,
  ] = await Promise.all([
    // Vendor basic info for created/updated
    supabase
      .from('vendors')
      .select('id, name, created_at, updated_at, status, lei_verified_at')
      .eq('id', vendorId)
      .eq('organization_id', organizationId)
      .single(),

    // Documents
    supabase
      .from('documents')
      .select('id, filename, type, created_at, parsed_soc2(id)')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(10),

    // Contracts
    supabase
      .from('contracts')
      .select('id, contract_ref, created_at, expiry_date, status')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(10),

    // Monitoring alerts
    supabase
      .from('monitoring_alerts')
      .select('id, alert_type, title, message, severity, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(10),

    // Maturity change log
    supabase
      .from('maturity_change_log')
      .select('id, change_type, pillar, previous_value, new_value, changed_at, change_reason')
      .eq('vendor_id', vendorId)
      .order('changed_at', { ascending: false })
      .limit(10),
  ]);

  const vendor = vendorResult.data;
  if (!vendor) return [];

  // Vendor created event
  activities.push({
    id: `vendor-created-${vendor.id}`,
    vendorId: vendor.id,
    vendorName: vendor.name,
    type: 'vendor_created',
    title: 'Vendor Added',
    description: `${vendor.name} was added to the vendor registry`,
    createdAt: vendor.created_at,
  });

  // LEI verified
  if (vendor.lei_verified_at) {
    activities.push({
      id: `lei-verified-${vendor.id}`,
      vendorId: vendor.id,
      type: 'lei_verified',
      title: 'LEI Verified',
      description: 'Legal Entity Identifier verified via GLEIF',
      createdAt: vendor.lei_verified_at,
    });
  }

  // Documents
  for (const doc of documentsResult.data || []) {
    const hasSoc2 = doc.parsed_soc2 && (doc.parsed_soc2 as unknown[]).length > 0;
    activities.push({
      id: `doc-${doc.id}`,
      vendorId: vendorId,
      type: hasSoc2 ? 'soc2_parsed' : 'document_uploaded',
      title: hasSoc2 ? 'SOC 2 Report Analyzed' : 'Document Uploaded',
      description: doc.filename,
      metadata: { documentId: doc.id, type: doc.type },
      createdAt: doc.created_at,
    });
  }

  // Contracts
  for (const contract of contractsResult.data || []) {
    activities.push({
      id: `contract-${contract.id}`,
      vendorId: vendorId,
      type: 'contract_added',
      title: 'Contract Added',
      description: contract.contract_ref || 'New contract',
      metadata: { contractId: contract.id, expiryDate: contract.expiry_date },
      createdAt: contract.created_at,
    });

    // Check for expiring contracts
    if (contract.expiry_date) {
      const expiryDate = new Date(contract.expiry_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 90 && daysUntilExpiry > 0) {
        activities.push({
          id: `contract-expiring-${contract.id}`,
          vendorId: vendorId,
          type: 'contract_expiring',
          title: 'Contract Expiring Soon',
          description: `${contract.contract_ref || 'Contract'} expires in ${daysUntilExpiry} days`,
          metadata: { contractId: contract.id, daysUntilExpiry },
          createdAt: now.toISOString(),
        });
      }
    }
  }

  // Monitoring alerts
  for (const alert of alertsResult.data || []) {
    activities.push({
      id: `alert-${alert.id}`,
      vendorId: vendorId,
      type: 'monitoring_alert',
      title: alert.title,
      description: alert.message || undefined,
      metadata: { alertType: alert.alert_type, severity: alert.severity },
      createdAt: alert.created_at,
    });
  }

  // Maturity changes
  for (const change of changeLogResult.data || []) {
    activities.push({
      id: `maturity-${change.id}`,
      vendorId: vendorId,
      type: 'maturity_change',
      title: formatChangeType(change.change_type),
      description: change.change_reason || formatChangeDescription(change),
      metadata: {
        pillar: change.pillar,
        previousValue: change.previous_value,
        newValue: change.new_value,
      },
      createdAt: change.changed_at,
    });
  }

  // Sort by date and limit
  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return activities.slice(0, limit);
}

function formatChangeType(type: string): string {
  const labels: Record<string, string> = {
    maturity_level_change: 'Maturity Level Changed',
    requirement_status_change: 'Requirement Status Updated',
    evidence_added: 'Evidence Added',
    evidence_removed: 'Evidence Removed',
    gap_identified: 'Gap Identified',
    gap_remediated: 'Gap Remediated',
    assessment_completed: 'Assessment Completed',
    score_recalculated: 'Score Recalculated',
  };
  return labels[type] || type;
}

function formatChangeDescription(change: {
  pillar?: string;
  previous_value?: unknown;
  new_value?: unknown;
}): string {
  if (change.pillar) {
    const pillarLabels: Record<string, string> = {
      ict_risk_management: 'ICT Risk Management',
      incident_reporting: 'Incident Reporting',
      resilience_testing: 'Resilience Testing',
      third_party_risk: 'Third Party Risk',
      information_sharing: 'Information Sharing',
    };
    return `${pillarLabels[change.pillar] || change.pillar} updated`;
  }
  return 'Compliance status updated';
}

// ============================================================================
// Organization Activities Query
// ============================================================================

/**
 * Get recent activities across all vendors (for dashboard)
 */
export async function getRecentActivities(limit: number = 10): Promise<VendorActivity[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) return [];

  const activities: VendorActivity[] = [];

  // Fetch recent from multiple sources
  const [vendorsResult, documentsResult, alertsResult] = await Promise.all([
    // Recently added vendors
    supabase
      .from('vendors')
      .select('id, name, created_at')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),

    // Recent documents
    supabase
      .from('documents')
      .select('id, filename, vendor_id, vendors(name), created_at, parsed_soc2(id)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5),

    // Recent alerts
    supabase
      .from('monitoring_alerts')
      .select('id, vendor_id, vendors(name), alert_type, title, message, severity, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Process vendors
  for (const vendor of vendorsResult.data || []) {
    activities.push({
      id: `vendor-${vendor.id}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      type: 'vendor_created',
      title: 'New Vendor Added',
      description: vendor.name,
      createdAt: vendor.created_at,
    });
  }

  // Process documents
  for (const doc of documentsResult.data || []) {
    const hasSoc2 = doc.parsed_soc2 && (doc.parsed_soc2 as unknown[]).length > 0;
    // Supabase returns joined tables as objects (not arrays) when it's a belongs_to relation
    const vendorData = doc.vendors as unknown;
    const vendorName = vendorData && typeof vendorData === 'object' && 'name' in vendorData
      ? (vendorData as { name: string }).name
      : undefined;
    activities.push({
      id: `doc-${doc.id}`,
      vendorId: doc.vendor_id,
      vendorName,
      type: hasSoc2 ? 'soc2_parsed' : 'document_uploaded',
      title: hasSoc2 ? 'SOC 2 Report Analyzed' : 'Document Uploaded',
      description: `${doc.filename}${vendorName ? ` for ${vendorName}` : ''}`,
      createdAt: doc.created_at,
    });
  }

  // Process alerts
  for (const alert of alertsResult.data || []) {
    const alertVendorData = alert.vendors as unknown;
    const vendorName = alertVendorData && typeof alertVendorData === 'object' && 'name' in alertVendorData
      ? (alertVendorData as { name: string }).name
      : undefined;
    activities.push({
      id: `alert-${alert.id}`,
      vendorId: alert.vendor_id,
      vendorName,
      type: 'monitoring_alert',
      title: alert.title,
      description: alert.message || vendorName,
      metadata: { severity: alert.severity },
      createdAt: alert.created_at,
    });
  }

  // Sort and limit
  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return activities.slice(0, limit);
}

// ============================================================================
// Peer Benchmark Query
// ============================================================================

/**
 * Get peer benchmarking data
 * Note: In production, this would compare against anonymized industry data.
 * For now, we use simulated industry averages.
 */
export async function getPeerBenchmark(): Promise<PeerBenchmark> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  const defaultBenchmark: PeerBenchmark = {
    orgAvgRiskScore: null,
    industryAvgRiskScore: 72,
    percentileRank: 50,
    orgCriticalRatio: 0,
    industryCriticalRatio: 0.15,
    doraReadiness: { org: 0, industryAvg: 65 },
    sampleSize: 150,
  };

  if (!organizationId) return defaultBenchmark;

  // Get organization's vendor stats
  const { data: vendors } = await supabase
    .from('vendors')
    .select('tier, risk_score, lei')
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (!vendors || vendors.length === 0) return defaultBenchmark;

  // Calculate org metrics
  const vendorsWithScore = vendors.filter(v => v.risk_score !== null);
  const orgAvgRiskScore = vendorsWithScore.length > 0
    ? Math.round(vendorsWithScore.reduce((sum, v) => sum + (v.risk_score || 0), 0) / vendorsWithScore.length)
    : null;

  const criticalCount = vendors.filter(v => v.tier === 'critical').length;
  const orgCriticalRatio = vendors.length > 0 ? criticalCount / vendors.length : 0;

  // LEI coverage as proxy for DORA readiness
  const leiCount = vendors.filter(v => v.lei).length;
  const doraReadiness = vendors.length > 0 ? Math.round((leiCount / vendors.length) * 100) : 0;

  // Calculate percentile rank (simulated - higher score = better)
  // Industry average is 72, so if org is above that, rank > 50
  const percentileRank = orgAvgRiskScore !== null
    ? Math.min(99, Math.max(1, Math.round(50 + (orgAvgRiskScore - 72) * 2)))
    : 50;

  return {
    orgAvgRiskScore,
    industryAvgRiskScore: 72,
    percentileRank,
    orgCriticalRatio: Math.round(orgCriticalRatio * 100) / 100,
    industryCriticalRatio: 0.15,
    doraReadiness: {
      org: doraReadiness,
      industryAvg: 65,
    },
    sampleSize: 150, // Simulated sample size
  };
}

// ============================================================================
// Export Trends for Sparklines
// ============================================================================

/**
 * Get sparkline data for a specific metric
 */
export async function getSparklineData(
  metric: 'vendorCount' | 'riskScore' | 'criticalCount' | 'doraReadiness',
  period: '7d' | '30d' | '90d' = '30d'
): Promise<number[]> {
  const trends = await getVendorTrends(period);

  switch (metric) {
    case 'vendorCount':
      return trends.vendorCountTrend.map(t => t.value);
    case 'riskScore':
      return trends.riskScoreTrend.map(t => t.value);
    case 'criticalCount':
      return trends.criticalCountTrend.map(t => t.value);
    case 'doraReadiness':
      // For now, return a synthetic increasing trend
      const base = 60;
      return Array.from({ length: 7 }, (_, i) => base + i * 2 + Math.round(Math.random() * 3));
    default:
      return [];
  }
}
