/**
 * POST /api/monitoring/sync
 *
 * Sync external monitoring scores for a vendor or all monitored vendors.
 *
 * Body:
 * - vendorId?: string - Sync specific vendor
 * - all?: boolean - Sync all monitored vendors
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  isConfigured,
  getScorecardOrMock,
} from '@/lib/external/securityscorecard';
import { scoreToGrade } from '@/lib/external/securityscorecard-types';

interface SyncResult {
  vendorId: string;
  vendorName: string;
  success: boolean;
  score?: number;
  grade?: string;
  previousScore?: number;
  scoreChange?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, all } = body;

    if (!vendorId && !all) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_PARAMS',
            message: 'Either vendorId or all=true is required',
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user's organization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Build query for vendors to sync
    let query = supabase
      .from('vendors')
      .select('id, name, monitoring_domain, monitoring_enabled, external_risk_score, organization_id');

    if (vendorId) {
      query = query.eq('id', vendorId);
    } else if (all) {
      query = query.eq('monitoring_enabled', true);
    }

    const { data: vendors, error: vendorError } = await query;

    if (vendorError) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: vendorError.message } },
        { status: 500 }
      );
    }

    if (!vendors || vendors.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: vendorId
              ? 'Vendor not found'
              : 'No vendors with monitoring enabled',
          },
        },
        { status: 404 }
      );
    }

    const results: SyncResult[] = [];
    const apiConfigured = isConfigured();

    // Process each vendor
    for (const vendor of vendors) {
      const result: SyncResult = {
        vendorId: vendor.id,
        vendorName: vendor.name,
        success: false,
      };

      try {
        // Check if vendor has monitoring domain
        if (!vendor.monitoring_domain) {
          result.error = 'No monitoring domain configured';
          results.push(result);
          continue;
        }

        // Fetch scorecard
        const scorecard = await getScorecardOrMock(vendor.monitoring_domain);

        if (!scorecard) {
          result.error = 'Domain not found in SecurityScorecard';
          results.push(result);
          continue;
        }

        // Calculate score change
        const previousScore = vendor.external_risk_score;
        const scoreChange = previousScore
          ? scorecard.score - previousScore
          : null;

        // Update vendor with new score
        const { error: updateError } = await supabase
          .from('vendors')
          .update({
            external_risk_score: scorecard.score,
            external_risk_grade: scorecard.grade,
            external_score_provider: 'securityscorecard',
            external_score_updated_at: new Date().toISOString(),
            external_score_factors: scorecard.factors,
            last_monitoring_sync: new Date().toISOString(),
          })
          .eq('id', vendor.id);

        if (updateError) {
          result.error = updateError.message;
          results.push(result);
          continue;
        }

        // Record score history
        await supabase.from('vendor_score_history').insert({
          organization_id: vendor.organization_id,
          vendor_id: vendor.id,
          score: scorecard.score,
          grade: scorecard.grade,
          provider: 'securityscorecard',
          factors: scorecard.factors,
        });

        // Check for alerts (score dropped below threshold or grade changed)
        if (previousScore !== null && scoreChange !== null && scoreChange < 0) {
          const previousGrade = scoreToGrade(previousScore);
          const currentGrade = scorecard.grade;

          // Determine if alert is needed
          const needsAlert =
            scoreChange <= -10 || // Score dropped 10+
            previousGrade !== currentGrade; // Grade changed

          if (needsAlert) {
            const alertType =
              previousGrade !== currentGrade
                ? 'grade_change'
                : 'score_drop';

            const severity =
              scoreChange <= -20 || (previousGrade !== currentGrade && currentGrade >= 'D')
                ? 'critical'
                : scoreChange <= -15
                ? 'high'
                : 'medium';

            await supabase.from('monitoring_alerts').insert({
              organization_id: vendor.organization_id,
              vendor_id: vendor.id,
              alert_type: alertType,
              severity,
              previous_score: previousScore,
              current_score: scorecard.score,
              previous_grade: previousGrade,
              current_grade: currentGrade,
              score_change: scoreChange,
              title: `${vendor.name}: Security score ${alertType === 'grade_change' ? 'grade changed' : 'dropped'}`,
              message: `Score changed from ${previousScore} (${previousGrade}) to ${scorecard.score} (${currentGrade})`,
              status: 'active',
            });
          }
        }

        result.success = true;
        result.score = scorecard.score;
        result.grade = scorecard.grade;
        result.previousScore = previousScore ?? undefined;
        result.scoreChange = scoreChange ?? undefined;
        results.push(result);
      } catch (err) {
        result.error =
          err instanceof Error ? err.message : 'Unknown error';
        results.push(result);
      }
    }

    // Summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      mock: !apiConfigured,
      summary: {
        total: results.length,
        successful,
        failed,
      },
      results,
    });
  } catch (error) {
    console.error('[Monitoring Sync] Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'SYNC_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to sync scores',
        },
      },
      { status: 500 }
    );
  }
}
