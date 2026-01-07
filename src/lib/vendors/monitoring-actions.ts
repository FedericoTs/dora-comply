'use server';

/**
 * Server Actions for Vendor Continuous Monitoring
 *
 * Provides server-side operations for managing external security monitoring.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  getScorecardOrMock,
  isValidDomain,
} from '@/lib/external/securityscorecard';
import { scoreToGrade } from '@/lib/external/securityscorecard-types';

// =============================================================================
// TYPES
// =============================================================================

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MonitoringConfig {
  vendorId: string;
  domain: string;
  enabled: boolean;
  alertThreshold: number;
}

interface ScoreHistoryEntry {
  id: string;
  score: number;
  grade: string;
  recorded_at: string;
  factors: unknown;
}

interface MonitoringAlert {
  id: string;
  vendor_id: string;
  alert_type: string;
  severity: string;
  previous_score: number;
  current_score: number;
  previous_grade: string;
  current_grade: string;
  score_change: number;
  title: string;
  message: string;
  status: string;
  created_at: string;
}

// =============================================================================
// ENABLE/DISABLE MONITORING
// =============================================================================

/**
 * Enable monitoring for a vendor with a specific domain
 */
export async function enableMonitoring(
  vendorId: string,
  domain: string,
  alertThreshold: number = 70
): Promise<ActionResult<MonitoringConfig>> {
  try {
    // Validate domain
    if (!isValidDomain(domain)) {
      return {
        success: false,
        error: 'Invalid domain format. Example: example.com',
      };
    }

    const supabase = await createClient();

    // Check if vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return { success: false, error: 'Vendor not found' };
    }

    // Verify domain has a scorecard (do initial lookup)
    const scorecard = await getScorecardOrMock(domain);

    // Update vendor with monitoring config
    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        monitoring_enabled: true,
        monitoring_domain: domain.toLowerCase().trim(),
        monitoring_alert_threshold: alertThreshold,
        external_risk_score: scorecard?.score ?? null,
        external_risk_grade: scorecard?.grade ?? null,
        external_score_provider: 'securityscorecard',
        external_score_updated_at: new Date().toISOString(),
        external_score_factors: scorecard?.factors ?? [],
        last_monitoring_sync: new Date().toISOString(),
      })
      .eq('id', vendorId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Record initial score in history if we have one
    if (scorecard) {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('organization_id')
        .eq('id', vendorId)
        .single();

      if (vendorData) {
        await supabase.from('vendor_score_history').insert({
          organization_id: vendorData.organization_id,
          vendor_id: vendorId,
          score: scorecard.score,
          grade: scorecard.grade,
          provider: 'securityscorecard',
          factors: scorecard.factors,
        });
      }
    }

    revalidatePath(`/vendors/${vendorId}`);
    revalidatePath('/vendors');

    return {
      success: true,
      data: {
        vendorId,
        domain,
        enabled: true,
        alertThreshold,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable monitoring',
    };
  }
}

/**
 * Disable monitoring for a vendor
 */
export async function disableMonitoring(
  vendorId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('vendors')
      .update({
        monitoring_enabled: false,
      })
      .eq('id', vendorId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/vendors/${vendorId}`);
    revalidatePath('/vendors');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable monitoring',
    };
  }
}

/**
 * Update monitoring configuration
 */
export async function updateMonitoringConfig(
  vendorId: string,
  config: Partial<MonitoringConfig>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const updates: Record<string, unknown> = {};

    if (config.domain !== undefined) {
      if (!isValidDomain(config.domain)) {
        return { success: false, error: 'Invalid domain format' };
      }
      updates.monitoring_domain = config.domain.toLowerCase().trim();
    }

    if (config.enabled !== undefined) {
      updates.monitoring_enabled = config.enabled;
    }

    if (config.alertThreshold !== undefined) {
      updates.monitoring_alert_threshold = config.alertThreshold;
    }

    const { error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/vendors/${vendorId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update config',
    };
  }
}

// =============================================================================
// SYNC SCORES
// =============================================================================

/**
 * Sync external score for a single vendor
 */
export async function syncVendorScore(
  vendorId: string
): Promise<ActionResult<{ score: number; grade: string; change?: number }>> {
  try {
    const supabase = await createClient();

    // Get vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, monitoring_domain, external_risk_score, organization_id, monitoring_alert_threshold')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return { success: false, error: 'Vendor not found' };
    }

    if (!vendor.monitoring_domain) {
      return { success: false, error: 'No monitoring domain configured' };
    }

    // Fetch scorecard
    const scorecard = await getScorecardOrMock(vendor.monitoring_domain);

    if (!scorecard) {
      return { success: false, error: 'Failed to fetch scorecard' };
    }

    const previousScore = vendor.external_risk_score;
    const scoreChange = previousScore ? scorecard.score - previousScore : null;

    // Update vendor
    await supabase
      .from('vendors')
      .update({
        external_risk_score: scorecard.score,
        external_risk_grade: scorecard.grade,
        external_score_updated_at: new Date().toISOString(),
        external_score_factors: scorecard.factors,
        last_monitoring_sync: new Date().toISOString(),
      })
      .eq('id', vendorId);

    // Record history
    await supabase.from('vendor_score_history').insert({
      organization_id: vendor.organization_id,
      vendor_id: vendorId,
      score: scorecard.score,
      grade: scorecard.grade,
      provider: 'securityscorecard',
      factors: scorecard.factors,
    });

    // Check for alerts
    if (previousScore && scoreChange && scoreChange < -5) {
      const previousGrade = scoreToGrade(previousScore);

      await supabase.from('monitoring_alerts').insert({
        organization_id: vendor.organization_id,
        vendor_id: vendorId,
        alert_type: previousGrade !== scorecard.grade ? 'grade_change' : 'score_drop',
        severity: scoreChange <= -15 ? 'high' : 'medium',
        previous_score: previousScore,
        current_score: scorecard.score,
        previous_grade: previousGrade,
        current_grade: scorecard.grade,
        score_change: scoreChange,
        title: `${vendor.name}: Score dropped`,
        message: `Security score decreased from ${previousScore} to ${scorecard.score}`,
        status: 'active',
      });
    }

    // Check threshold breach
    if (
      vendor.monitoring_alert_threshold &&
      scorecard.score < vendor.monitoring_alert_threshold &&
      (!previousScore || previousScore >= vendor.monitoring_alert_threshold)
    ) {
      await supabase.from('monitoring_alerts').insert({
        organization_id: vendor.organization_id,
        vendor_id: vendorId,
        alert_type: 'threshold_breach',
        severity: 'high',
        previous_score: previousScore,
        current_score: scorecard.score,
        previous_grade: previousScore ? scoreToGrade(previousScore) : null,
        current_grade: scorecard.grade,
        score_change: scoreChange,
        title: `${vendor.name}: Score below threshold`,
        message: `Security score (${scorecard.score}) dropped below alert threshold (${vendor.monitoring_alert_threshold})`,
        status: 'active',
      });
    }

    revalidatePath(`/vendors/${vendorId}`);
    revalidatePath('/vendors');

    return {
      success: true,
      data: {
        score: scorecard.score,
        grade: scorecard.grade,
        change: scoreChange ?? undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync score',
    };
  }
}

// =============================================================================
// SCORE HISTORY
// =============================================================================

/**
 * Get score history for a vendor
 */
export async function getScoreHistory(
  vendorId: string,
  limit: number = 30
): Promise<ActionResult<ScoreHistoryEntry[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('vendor_score_history')
      .select('id, score, grade, recorded_at, factors')
      .eq('vendor_id', vendorId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history',
    };
  }
}

// =============================================================================
// ALERTS
// =============================================================================

/**
 * Get active monitoring alerts for organization
 */
export async function getActiveAlerts(): Promise<ActionResult<MonitoringAlert[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('monitoring_alerts')
      .select(`
        id,
        vendor_id,
        alert_type,
        severity,
        previous_score,
        current_score,
        previous_grade,
        current_grade,
        score_change,
        title,
        message,
        status,
        created_at
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get alerts',
    };
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('monitoring_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: user?.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acknowledge alert',
    };
  }
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('monitoring_alerts')
      .update({
        status: 'dismissed',
      })
      .eq('id', alertId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dismiss alert',
    };
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('monitoring_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve alert',
    };
  }
}
