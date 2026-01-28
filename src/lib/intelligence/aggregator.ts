/**
 * Intelligence Data Aggregator
 *
 * Combines data from multiple external sources (NewsAPI, SEC EDGAR, HIBP)
 * into unified intelligence for vendor monitoring.
 */

import { searchCompanyNewsOrMock, hasHighSeverityNews } from '@/lib/external/newsapi';
import { calculateSeverity as newsCalculateSeverity } from '@/lib/external/newsapi-types';
import { searchAndGetFilings, getFilingsOrMock } from '@/lib/external/sec-edgar';
import { secApiIo } from '@/lib/external/sec-api-io';
import { calculateFilingSeverity, FORM_TYPE_LABELS, SECFilingsResult } from '@/lib/external/sec-edgar-types';
import { checkDomainBreachesOrMock } from '@/lib/external/hibp';
import {
  InsertVendorNewsAlert,
  IntelligenceSource,
  IntelligenceAlertType,
  IntelligenceSeverity,
  IntelligenceSyncResult,
  VendorIntelligence,
} from './types';
import {
  createAlert,
  createAlertsBatch,
  createSyncLog,
  completeSyncLog,
  updateVendorIntelligenceFields,
  getVendorAlerts,
} from './queries';

// =============================================================================
// SYNC FUNCTIONS
// =============================================================================

/**
 * Sync news for a vendor
 */
export async function syncVendorNews(
  vendorId: string,
  vendorName: string,
  keywords?: string[]
): Promise<{ alertsCreated: number; error?: string }> {
  try {
    // Build search query
    const searchQuery = keywords?.length
      ? `"${vendorName}" OR ${keywords.map(k => `"${k}"`).join(' OR ')}`
      : vendorName;

    // Fetch news
    const news = await searchCompanyNewsOrMock(searchQuery, {
      pageSize: 20,
      sortBy: 'publishedAt',
    });

    if (!news) {
      return { alertsCreated: 0, error: 'Failed to fetch news' };
    }

    // Convert to alerts
    const alerts: InsertVendorNewsAlert[] = news.articles.map((article) => ({
      vendor_id: vendorId,
      organization_id: '', // Will be set by query
      source: 'newsapi' as IntelligenceSource,
      external_id: article.url, // Use URL as unique identifier
      alert_type: article.alertType as IntelligenceAlertType,
      severity: newsCalculateSeverity(
        article.sentimentLabel,
        article.alertType
      ) as IntelligenceSeverity,
      headline: article.title,
      summary: article.description || undefined,
      url: article.url,
      image_url: article.urlToImage || undefined,
      published_at: article.publishedAt,
      sentiment_score: article.sentimentScore,
      sentiment_label: article.sentimentLabel,
      keywords: article.matchedKeywords,
    }));

    // Save alerts
    const result = await createAlertsBatch(alerts);

    // Update vendor last sync time
    await updateVendorIntelligenceFields(vendorId, {
      last_news_sync: new Date().toISOString(),
    });

    return { alertsCreated: result.created };
  } catch (error) {
    console.error('Sync vendor news error:', error);
    return {
      alertsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync SEC filings for a vendor
 *
 * Uses sec-api.io (premium) if configured, otherwise falls back to free SEC EDGAR
 */
export async function syncVendorSECFilings(
  vendorId: string,
  vendorName: string,
  cik?: string
): Promise<{ alertsCreated: number; error?: string }> {
  try {
    let filings: SECFilingsResult | null = null;

    // Try sec-api.io first (premium API with better search)
    if (secApiIo.isConfigured()) {
      console.log('[SEC] Using sec-api.io (premium)');
      filings = cik
        ? await secApiIo.getFilingsByCik(cik, { limit: 10 })
        : await secApiIo.searchByCompanyName(vendorName, { limit: 10 });
    }

    // Fall back to free SEC EDGAR API
    if (!filings) {
      console.log('[SEC] Using free SEC EDGAR API');
      filings = cik
        ? await getFilingsOrMock(vendorName, { limit: 10 })
        : await searchAndGetFilings(vendorName, { limit: 10 });
    }

    if (!filings) {
      return { alertsCreated: 0 }; // Not an error - may not be a US public company
    }

    // Convert risk-relevant filings to alerts
    const alerts: InsertVendorNewsAlert[] = filings.filings
      .filter((f) => ['10-K', '10-Q', '8-K', '8-K/A'].includes(f.form))
      .map((filing) => ({
        vendor_id: vendorId,
        organization_id: '',
        source: 'sec_edgar' as IntelligenceSource,
        external_id: filing.accessionNumber,
        alert_type: 'filing' as IntelligenceAlertType,
        severity: calculateFilingSeverity(filing) as IntelligenceSeverity,
        headline: `${FORM_TYPE_LABELS[filing.form as keyof typeof FORM_TYPE_LABELS] || filing.form} Filed`,
        summary: filing.description || `${filing.form} filing dated ${filing.filedAt}`,
        url: filing.primaryDocUrl || filing.filingUrl,
        published_at: filing.filedAt,
      }));

    // Save alerts
    const result = await createAlertsBatch(alerts);

    // Update vendor SEC fields
    await updateVendorIntelligenceFields(vendorId, {
      sec_cik: filings.company?.cik,
      last_sec_filing_date: filings.filings[0]?.filedAt,
      sec_filing_count: filings.totalFilings,
    });

    return { alertsCreated: result.created };
  } catch (error) {
    console.error('Sync vendor SEC filings error:', error);
    return {
      alertsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync breach exposure for a vendor
 */
export async function syncVendorBreachExposure(
  vendorId: string,
  domain: string
): Promise<{ alertsCreated: number; error?: string }> {
  try {
    // Check breach exposure
    const breachData = await checkDomainBreachesOrMock(domain);

    if (!breachData) {
      return { alertsCreated: 0, error: 'Failed to check breach data' };
    }

    // Update vendor breach fields
    await updateVendorIntelligenceFields(vendorId, {
      breach_exposure_count: breachData.breachCount,
      breach_exposure_checked_at: new Date().toISOString(),
      breach_domains: [domain],
      breach_severity: breachData.severity,
    });

    // Create alerts for significant breaches
    const alerts: InsertVendorNewsAlert[] = breachData.breaches
      .filter((b) => b.severity === 'high' || b.severity === 'critical')
      .map((breach) => ({
        vendor_id: vendorId,
        organization_id: '',
        source: 'hibp' as IntelligenceSource,
        external_id: `hibp:${breach.name}`,
        alert_type: 'breach' as IntelligenceAlertType,
        severity: breach.severity as IntelligenceSeverity,
        headline: `Data Breach: ${breach.name}`,
        summary: `${breach.pwnCount.toLocaleString()} accounts exposed. Data exposed: ${breach.dataClasses.slice(0, 3).join(', ')}`,
        url: `https://haveibeenpwned.com/PwnedWebsites#${breach.name}`,
        published_at: breach.breachDate,
      }));

    // Save alerts
    const result = await createAlertsBatch(alerts);

    return { alertsCreated: result.created };
  } catch (error) {
    console.error('Sync vendor breach exposure error:', error);
    return {
      alertsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// FULL SYNC
// =============================================================================

/**
 * Full intelligence sync for a vendor
 */
export async function syncVendorIntelligence(
  vendorId: string,
  vendorName: string,
  options: {
    domain?: string;
    cik?: string;
    keywords?: string[];
    sources?: IntelligenceSource[];
  } = {}
): Promise<IntelligenceSyncResult> {
  const startTime = Date.now();
  const sources = options.sources || ['newsapi', 'sec_edgar', 'hibp'];
  const errors: Array<{ source: IntelligenceSource; message: string }> = [];
  let totalCreated = 0;

  // Create sync log
  const logId = await createSyncLog(vendorId, 'newsapi', 'manual');

  // Sync news
  if (sources.includes('newsapi')) {
    const newsResult = await syncVendorNews(vendorId, vendorName, options.keywords);
    totalCreated += newsResult.alertsCreated;
    if (newsResult.error) {
      errors.push({ source: 'newsapi', message: newsResult.error });
    }
  }

  // Sync SEC filings
  if (sources.includes('sec_edgar')) {
    const secResult = await syncVendorSECFilings(vendorId, vendorName, options.cik);
    totalCreated += secResult.alertsCreated;
    if (secResult.error) {
      errors.push({ source: 'sec_edgar', message: secResult.error });
    }
  }

  // Sync breach exposure
  if (sources.includes('hibp') && options.domain) {
    const breachResult = await syncVendorBreachExposure(vendorId, options.domain);
    totalCreated += breachResult.alertsCreated;
    if (breachResult.error) {
      errors.push({ source: 'hibp', message: breachResult.error });
    }
  }

  // Complete sync log
  if (logId) {
    await completeSyncLog(
      logId,
      totalCreated,
      0,
      errors.length > 0 ? errors.map((e) => `${e.source}: ${e.message}`).join('; ') : undefined
    );
  }

  return {
    success: errors.length === 0,
    vendorId,
    alertsCreated: totalCreated,
    alertsUpdated: 0,
    errors,
    duration: Date.now() - startTime,
  };
}

// =============================================================================
// AGGREGATED DATA
// =============================================================================

/**
 * Get combined intelligence for a vendor
 */
export async function getVendorIntelligence(
  vendorId: string,
  vendorName: string
): Promise<VendorIntelligence> {
  // Get recent alerts from database
  const alerts = await getVendorAlerts(vendorId, {}, 50);

  // Separate by source
  const newsAlerts = alerts.filter((a) => a.source === 'newsapi');
  const secAlerts = alerts.filter((a) => a.source === 'sec_edgar');
  const breachAlerts = alerts.filter((a) => a.source === 'hibp');

  // Calculate summary
  const unreadAlerts = alerts.filter((a) => !a.is_read);
  const criticalOrHigh = alerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'high'
  );

  // Determine overall severity
  let overallSeverity: IntelligenceSeverity = 'low';
  if (criticalOrHigh.some((a) => a.severity === 'critical')) {
    overallSeverity = 'critical';
  } else if (criticalOrHigh.length > 0) {
    overallSeverity = 'high';
  } else if (alerts.some((a) => a.severity === 'medium')) {
    overallSeverity = 'medium';
  }

  return {
    vendorId,
    vendorName,
    news: {
      enabled: true, // Would come from vendor record
      alertCount: newsAlerts.length,
      unreadCount: newsAlerts.filter((a) => !a.is_read).length,
      recentAlerts: newsAlerts.slice(0, 10),
    },
    breaches: {
      count: breachAlerts.length,
      severity: breachAlerts[0]?.severity as IntelligenceSeverity | undefined,
    },
    secFilings: {
      filingCount: secAlerts.length,
      recentFilings: secAlerts.slice(0, 5).map((a) => ({
        form: a.headline.replace(' Filed', ''),
        filedAt: a.published_at || a.created_at,
        url: a.url,
        severity: a.severity as IntelligenceSeverity,
        description: a.summary,
      })),
    },
    companyData: {},
    summary: {
      totalAlerts: alerts.length,
      unreadAlerts: unreadAlerts.length,
      overallSeverity,
      lastActivity: alerts[0]?.created_at,
    },
  };
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Sync intelligence for all monitored vendors
 */
export async function syncAllMonitoredVendors(
  vendors: Array<{
    id: string;
    name: string;
    website?: string;
    news_keywords?: string[];
  }>
): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: IntelligenceSyncResult[];
}> {
  const results: IntelligenceSyncResult[] = [];
  let successful = 0;
  let failed = 0;

  for (const vendor of vendors) {
    // Extract domain from website
    const domain = vendor.website
      ? new URL(
          vendor.website.startsWith('http')
            ? vendor.website
            : `https://${vendor.website}`
        ).hostname
      : undefined;

    const result = await syncVendorIntelligence(vendor.id, vendor.name, {
      domain,
      keywords: vendor.news_keywords,
    });

    results.push(result);

    if (result.success) {
      successful++;
    } else {
      failed++;
    }

    // Rate limiting between vendors
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return {
    total: vendors.length,
    successful,
    failed,
    results,
  };
}
