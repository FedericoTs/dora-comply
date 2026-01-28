/**
 * Business Intelligence Types
 *
 * Unified types for the intelligence module that aggregates
 * news, SEC filings, and breach data for vendor monitoring.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Intelligence data source
 */
export type IntelligenceSource =
  | 'newsapi'
  | 'sec_edgar'
  | 'hibp'
  | 'opencorporates'
  | 'manual';

/**
 * Alert types for intelligence items
 */
export type IntelligenceAlertType =
  | 'news'
  | 'regulatory'
  | 'financial'
  | 'leadership'
  | 'breach'
  | 'filing'
  | 'other';

/**
 * Severity levels
 */
export type IntelligenceSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Sentiment classification
 */
export type IntelligenceSentiment = 'positive' | 'neutral' | 'negative';

// =============================================================================
// DATABASE TYPES
// =============================================================================

/**
 * Action status for alerts requiring remediation
 */
export type AlertActionStatus = 'pending' | 'in_progress' | 'resolved' | 'wont_fix';

/**
 * Vendor news alert from database
 */
export interface VendorNewsAlert {
  id: string;
  organization_id: string;
  vendor_id: string;
  source: IntelligenceSource;
  external_id?: string;
  alert_type: IntelligenceAlertType;
  severity: IntelligenceSeverity;
  headline: string;
  summary?: string;
  url?: string;
  image_url?: string;
  published_at?: string;
  sentiment_score?: number;
  sentiment_label?: IntelligenceSentiment;
  keywords?: string[];
  is_read: boolean;
  is_dismissed: boolean;
  read_at?: string;
  dismissed_at?: string;
  // Action tracking
  requires_action?: boolean;
  action_due_date?: string;
  action_status?: AlertActionStatus;
  action_notes?: string;
  assigned_to?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Intelligence sync log entry
 */
export interface IntelligenceSyncLog {
  id: string;
  organization_id: string;
  vendor_id?: string;
  source: IntelligenceSource;
  sync_type: 'manual' | 'scheduled' | 'webhook';
  status: 'pending' | 'running' | 'completed' | 'failed';
  alerts_created: number;
  alerts_updated: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

/**
 * Insert type for news alerts
 */
export interface InsertVendorNewsAlert {
  organization_id: string;
  vendor_id: string;
  source: IntelligenceSource;
  external_id?: string;
  alert_type: IntelligenceAlertType;
  severity?: IntelligenceSeverity;
  headline: string;
  summary?: string;
  url?: string;
  image_url?: string;
  published_at?: string;
  sentiment_score?: number;
  sentiment_label?: IntelligenceSentiment;
  keywords?: string[];
}

// =============================================================================
// VENDOR INTELLIGENCE FIELDS
// =============================================================================

/**
 * Intelligence-related vendor fields
 */
export interface VendorIntelligenceFields {
  news_monitoring_enabled: boolean;
  last_news_sync?: string;
  news_keywords?: string[];
  news_alert_count: number;
  news_unread_count: number;
  breach_exposure_count?: number;
  breach_exposure_checked_at?: string;
  breach_domains?: string[];
  breach_severity?: IntelligenceSeverity;
  sec_cik?: string;
  last_sec_filing_date?: string;
  sec_filing_count?: number;
  opencorporates_url?: string;
  company_number?: string;
  incorporation_date?: string;
  company_status?: string;
}

// =============================================================================
// AGGREGATED TYPES
// =============================================================================

/**
 * Intelligence risk score from database
 */
export interface VendorIntelligenceScore {
  id: string;
  organization_id: string;
  vendor_id: string;

  // Component scores (0-100, higher = more risk)
  news_risk_score: number;
  breach_risk_score: number;
  filing_risk_score: number;
  cyber_risk_score: number;

  // Alert counts
  critical_alert_count: number;
  high_alert_count: number;
  unresolved_alert_count: number;

  // Composite
  composite_score: number;
  risk_level: IntelligenceSeverity;

  // Trend
  previous_score: number | null;
  score_trend: 'improving' | 'stable' | 'degrading';
  trend_change: number;

  // Weights
  news_weight: number;
  breach_weight: number;
  filing_weight: number;
  cyber_weight: number;

  // Metadata
  last_calculated_at: string;
  calculation_version: string;
  calculation_details?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

/**
 * Combined intelligence data for a vendor
 */
export interface VendorIntelligence {
  vendorId: string;
  vendorName: string;

  // Risk Score (new unified metric)
  riskScore?: {
    composite: number;
    level: IntelligenceSeverity;
    trend: 'improving' | 'stable' | 'degrading';
    trendChange: number;
    components: {
      news: number;
      breach: number;
      filing: number;
      cyber: number;
    };
    criticalAlerts: number;
    unresolvedAlerts: number;
    lastCalculated?: string;
  };

  // News
  news: {
    enabled: boolean;
    lastSync?: string;
    alertCount: number;
    unreadCount: number;
    recentAlerts: VendorNewsAlert[];
  };

  // Breach Exposure
  breaches: {
    count: number;
    severity?: IntelligenceSeverity;
    lastChecked?: string;
    domains?: string[];
  };

  // SEC Filings
  secFilings: {
    cik?: string;
    lastFilingDate?: string;
    filingCount?: number;
    recentFilings: SECFilingAlert[];
  };

  // Company Data
  companyData: {
    opencorporatesUrl?: string;
    companyNumber?: string;
    incorporationDate?: string;
    status?: string;
  };

  // Summary
  summary: {
    totalAlerts: number;
    unreadAlerts: number;
    overallSeverity: IntelligenceSeverity;
    lastActivity?: string;
  };
}

/**
 * SEC filing as alert format
 */
export interface SECFilingAlert {
  form: string;
  filedAt: string;
  url?: string;
  severity: IntelligenceSeverity;
  description?: string;
}

/**
 * Intelligence summary for organization
 */
export interface IntelligenceSummary {
  totalAlerts: number;
  unreadAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  vendorsWithAlerts: number;
  latestAlertAt?: string;
  bySource: Record<IntelligenceSource, number>;
  byType: Record<IntelligenceAlertType, number>;
}

// =============================================================================
// SYNC TYPES
// =============================================================================

/**
 * Sync options for intelligence
 */
export interface IntelligenceSyncOptions {
  vendorId?: string;
  sources?: IntelligenceSource[];
  force?: boolean;
}

/**
 * Sync result
 */
export interface IntelligenceSyncResult {
  success: boolean;
  vendorId?: string;
  alertsCreated: number;
  alertsUpdated: number;
  errors: Array<{
    source: IntelligenceSource;
    message: string;
  }>;
  duration: number;
}

// =============================================================================
// UI TYPES
// =============================================================================

/**
 * Alert filter options
 */
export interface AlertFilters {
  source?: IntelligenceSource;
  alertType?: IntelligenceAlertType;
  severity?: IntelligenceSeverity;
  isRead?: boolean;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Paginated alerts result
 */
export interface PaginatedAlerts {
  alerts: VendorNewsAlert[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get severity color
 */
export function getSeverityColor(severity: IntelligenceSeverity): string {
  const colors: Record<IntelligenceSeverity, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };
  return colors[severity];
}

/**
 * Get severity background color
 */
export function getSeverityBgColor(severity: IntelligenceSeverity): string {
  const colors: Record<IntelligenceSeverity, string> = {
    low: 'bg-green-500/10',
    medium: 'bg-yellow-500/10',
    high: 'bg-orange-500/10',
    critical: 'bg-red-500/10',
  };
  return colors[severity];
}

/**
 * Get alert type icon
 */
export function getAlertTypeIcon(alertType: IntelligenceAlertType): string {
  const icons: Record<IntelligenceAlertType, string> = {
    news: 'Newspaper',
    regulatory: 'Gavel',
    financial: 'TrendingUp',
    leadership: 'Users',
    breach: 'ShieldAlert',
    filing: 'FileText',
    other: 'Info',
  };
  return icons[alertType];
}

/**
 * Get alert type label
 */
export function getAlertTypeLabel(alertType: IntelligenceAlertType): string {
  const labels: Record<IntelligenceAlertType, string> = {
    news: 'News',
    regulatory: 'Regulatory',
    financial: 'Financial',
    leadership: 'Leadership',
    breach: 'Security Breach',
    filing: 'SEC Filing',
    other: 'Other',
  };
  return labels[alertType];
}

/**
 * Get source label
 */
export function getSourceLabel(source: IntelligenceSource): string {
  const labels: Record<IntelligenceSource, string> = {
    newsapi: 'NewsAPI',
    sec_edgar: 'SEC EDGAR',
    hibp: 'Have I Been Pwned',
    opencorporates: 'OpenCorporates',
    manual: 'Manual Entry',
  };
  return labels[source];
}

/**
 * Get sentiment color
 */
export function getSentimentColor(sentiment: IntelligenceSentiment): string {
  const colors: Record<IntelligenceSentiment, string> = {
    positive: 'text-green-600',
    neutral: 'text-gray-600',
    negative: 'text-red-600',
  };
  return colors[sentiment];
}
