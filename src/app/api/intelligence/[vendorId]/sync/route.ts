/**
 * POST /api/intelligence/[vendorId]/sync
 *
 * Sync intelligence data for a specific vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncVendorIntelligence } from '@/lib/intelligence/aggregator';
import { getVendorWithRelations } from '@/lib/vendors/queries';
import { getVendorAlerts, saveVendorIntelligenceScore, getVendorIntelligenceScore } from '@/lib/intelligence/queries';
import { calculateVendorRiskScore } from '@/lib/intelligence/risk-calculator';
import { checkDomainBreachesOrMock } from '@/lib/external/hibp';

export async function POST(
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

    // Use monitoring domain
    const domain = vendor.monitoring_domain || undefined;

    // Sync intelligence
    const result = await syncVendorIntelligence(vendorId, vendor.name, {
      domain,
      cik: vendor.sec_cik || undefined,
      keywords: vendor.news_keywords || undefined,
    });

    // After syncing, calculate and save the risk score
    try {
      // Get all alerts for this vendor
      const alerts = await getVendorAlerts(vendorId, {}, 1000);

      // Get breach data
      let breachCount = null;
      let breachSeverity = null;
      if (domain) {
        try {
          const breachData = await checkDomainBreachesOrMock(domain);
          if (breachData) {
            breachCount = breachData.breachCount;
            breachSeverity = breachData.severity;
          }
        } catch {
          // Ignore breach check errors
        }
      }

      // Get previous score for trend calculation
      const existingScore = await getVendorIntelligenceScore(vendorId);

      // Calculate new risk score
      const riskScore = calculateVendorRiskScore(alerts, {
        breachCount,
        breachSeverity,
        sscScore: vendor.external_risk_score || null,
        sscGrade: vendor.external_risk_grade || null,
        previousScore: existingScore?.composite_score || null,
      });

      // Save the score
      await saveVendorIntelligenceScore(vendorId, riskScore, 'sync');

      // Include score in response
      return NextResponse.json({
        ...result,
        riskScore: {
          composite: riskScore.compositeScore,
          level: riskScore.riskLevel,
          trend: riskScore.scoreTrend,
          trendChange: riskScore.trendChange,
          components: {
            news: riskScore.newsRiskScore,
            breach: riskScore.breachRiskScore,
            filing: riskScore.filingRiskScore,
            cyber: riskScore.cyberRiskScore,
          },
          criticalAlerts: riskScore.criticalAlertCount,
          highAlerts: riskScore.highAlertCount,
          unresolvedAlerts: riskScore.unresolvedAlertCount,
        },
      });
    } catch (scoreError) {
      console.error('Risk score calculation error:', scoreError);
      // Return sync result even if score calculation fails
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Sync vendor intelligence error:', error);
    return NextResponse.json(
      { error: 'Failed to sync intelligence data' },
      { status: 500 }
    );
  }
}
