/**
 * GET /api/intelligence/[vendorId]
 *
 * Get intelligence data for a specific vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVendorIntelligenceScore } from '@/lib/intelligence/queries';
import { getVendorIntelligence } from '@/lib/intelligence/aggregator';
import { checkDomainBreachesOrMock } from '@/lib/external/hibp';
import { searchAndGetFilings } from '@/lib/external/sec-edgar';
import { getVendorWithRelations } from '@/lib/vendors/queries';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ vendorId: string }> }
) {
  const { vendorId } = await context.params;

  try {
    // Get vendor details
    const vendor = await getVendorWithRelations(vendorId);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get combined intelligence
    const intelligence = await getVendorIntelligence(vendorId, vendor.name);

    // Get risk score from database
    const scoreData = await getVendorIntelligenceScore(vendorId);
    const riskScore = scoreData ? {
      composite: scoreData.composite_score,
      level: scoreData.risk_level,
      trend: scoreData.score_trend,
      trendChange: scoreData.trend_change,
      components: {
        news: scoreData.news_risk_score,
        breach: scoreData.breach_risk_score,
        filing: scoreData.filing_risk_score,
        cyber: scoreData.cyber_risk_score,
      },
      weights: {
        news: scoreData.news_weight,
        breach: scoreData.breach_weight,
        filing: scoreData.filing_weight,
        cyber: scoreData.cyber_weight,
      },
      criticalAlerts: scoreData.critical_alert_count,
      highAlerts: scoreData.high_alert_count,
      unresolvedAlerts: scoreData.unresolved_alert_count,
      lastCalculated: scoreData.last_calculated_at,
    } : null;

    // Get breach data if domain available
    let breachData = null;
    if (vendor.monitoring_domain) {
      try {
        breachData = await checkDomainBreachesOrMock(vendor.monitoring_domain);
      } catch {
        // Invalid domain, skip breach check
      }
    }

    // Get SEC filings if available
    let secFilings = null;
    if (vendor.sec_cik) {
      secFilings = await searchAndGetFilings(vendor.name, { limit: 10 });
    }

    return NextResponse.json({
      intelligence,
      riskScore,
      breachData,
      secFilings,
    });
  } catch (error) {
    console.error('Get vendor intelligence error:', error);
    return NextResponse.json(
      { error: 'Failed to get intelligence data' },
      { status: 500 }
    );
  }
}
