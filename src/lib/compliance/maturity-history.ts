'use server';

/**
 * Maturity History Service
 *
 * Server actions for creating, retrieving, and analyzing maturity snapshots.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  MaturitySnapshot,
  MaturityChangeLog,
  MaturitySnapshotSettings,
  SnapshotType,
  SnapshotData,
  TrendAnalysis,
  MaturityComparison,
  MaturityLevel,
  DORAPllar,
  MATURITY_LABELS,
  determineTrendDirection,
  CriticalGap,
} from './maturity-history-types';

// =============================================================================
// TYPES
// =============================================================================

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// CREATE SNAPSHOT
// =============================================================================

/**
 * Create a new maturity snapshot from current compliance data
 */
export async function createMaturitySnapshot(
  snapshotType: SnapshotType,
  vendorId?: string,
  notes?: string
): Promise<ActionResult<MaturitySnapshot>> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return { success: false, error: 'No organization found' };
    }

    // Get current compliance data
    const complianceData = await getCurrentComplianceData(
      supabase,
      profile.organization_id,
      vendorId
    );

    if (!complianceData) {
      return { success: false, error: 'Failed to calculate compliance data' };
    }

    // Calculate change from previous snapshot
    const changeFromPrevious = await calculateChangeFromPrevious(
      supabase,
      profile.organization_id,
      vendorId,
      complianceData
    );

    // Insert snapshot
    const { data: snapshot, error } = await supabase
      .from('maturity_snapshots')
      .insert({
        organization_id: profile.organization_id,
        vendor_id: vendorId || null,
        snapshot_type: snapshotType,
        snapshot_date: new Date().toISOString().split('T')[0],

        overall_maturity_level: complianceData.overall_level,
        overall_maturity_label: MATURITY_LABELS[complianceData.overall_level],
        overall_readiness_percent: complianceData.overall_percent,

        pillar_ict_risk_mgmt: complianceData.pillars.ict_risk_management.level,
        pillar_incident_reporting: complianceData.pillars.incident_reporting.level,
        pillar_resilience_testing: complianceData.pillars.resilience_testing.level,
        pillar_third_party_risk: complianceData.pillars.third_party_risk.level,
        pillar_info_sharing: complianceData.pillars.information_sharing.level,

        pillar_ict_risk_mgmt_percent: complianceData.pillars.ict_risk_management.percent,
        pillar_incident_reporting_percent: complianceData.pillars.incident_reporting.percent,
        pillar_resilience_testing_percent: complianceData.pillars.resilience_testing.percent,
        pillar_third_party_risk_percent: complianceData.pillars.third_party_risk.percent,
        pillar_info_sharing_percent: complianceData.pillars.information_sharing.percent,

        total_requirements: complianceData.gaps.total,
        requirements_met: complianceData.gaps.met,
        requirements_partial: complianceData.gaps.partial,
        requirements_not_met: complianceData.gaps.not_met,
        critical_gaps_count: complianceData.gaps.critical,
        high_gaps_count: complianceData.gaps.high,
        medium_gaps_count: complianceData.gaps.medium,
        low_gaps_count: complianceData.gaps.low,

        critical_gaps: complianceData.critical_gaps,
        estimated_remediation_weeks: complianceData.estimated_weeks,
        change_from_previous: changeFromPrevious,

        created_by: user.id,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (snapshot already exists for today)
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A snapshot already exists for today. Try again tomorrow or update the existing snapshot.',
        };
      }
      return { success: false, error: error.message };
    }

    // Log the change if there was a significant change
    if (changeFromPrevious && changeFromPrevious.overall_change !== 0) {
      await logMaturityChange(supabase, {
        organization_id: profile.organization_id,
        vendor_id: vendorId,
        change_type: 'maturity_level_change',
        previous_value: { level: changeFromPrevious.previous_overall },
        new_value: { level: complianceData.overall_level },
        maturity_impact: changeFromPrevious.overall_change,
        changed_by: user.id,
        source: snapshotType,
        related_snapshot_id: snapshot.id,
      });
    }

    revalidatePath('/compliance');
    revalidatePath('/compliance/trends');

    return { success: true, data: snapshot as MaturitySnapshot };
  } catch (error) {
    console.error('[MaturityHistory] Create snapshot error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create snapshot',
    };
  }
}

/**
 * Get current compliance data from vendor_dora_compliance or calculate fresh
 */
async function getCurrentComplianceData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  vendorId?: string
): Promise<SnapshotData | null> {
  try {
    if (vendorId) {
      // Get vendor-specific compliance data
      const { data: compliance } = await supabase
        .from('vendor_dora_compliance')
        .select('*')
        .eq('vendor_id', vendorId)
        .single();

      if (compliance) {
        return mapComplianceToSnapshotData(compliance);
      }
    }

    // Get aggregate organization compliance
    const { data: vendors } = await supabase
      .from('vendor_dora_compliance')
      .select('*')
      .eq('organization_id', organizationId);

    if (!vendors || vendors.length === 0) {
      // Return baseline data if no compliance records exist
      return {
        overall_level: 0,
        overall_percent: 0,
        pillars: {
          ict_risk_management: { level: 0, percent: 0 },
          incident_reporting: { level: 0, percent: 0 },
          resilience_testing: { level: 0, percent: 0 },
          third_party_risk: { level: 0, percent: 0 },
          information_sharing: { level: 0, percent: 0 },
        },
        gaps: {
          total: 64, // Total DORA requirements
          met: 0,
          partial: 0,
          not_met: 64,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        critical_gaps: [],
        estimated_weeks: undefined,
      };
    }

    // Aggregate across all vendors
    return aggregateComplianceData(vendors);
  } catch (error) {
    console.error('[MaturityHistory] Get compliance data error:', error);
    return null;
  }
}

function mapComplianceToSnapshotData(compliance: Record<string, unknown>): SnapshotData {
  const levelMap: Record<string, MaturityLevel> = {
    'L0 - Not Performed': 0,
    'L1 - Informal': 1,
    'L2 - Planned & Tracked': 2,
    'L3 - Well-Defined': 3,
    'L4 - Quantitatively Managed': 4,
  };

  const overallLabel = compliance.overall_maturity_level as string || 'L0 - Not Performed';
  const overallLevel = levelMap[overallLabel] ?? 0;

  return {
    overall_level: overallLevel,
    overall_percent: (compliance.overall_readiness_percent as number) || 0,
    pillars: {
      ict_risk_management: {
        level: levelMap[compliance.pillar_ict_risk_mgmt as string] ?? 0,
        percent: (compliance.pillar_ict_risk_mgmt_percent as number) || 0,
      },
      incident_reporting: {
        level: levelMap[compliance.pillar_incident_reporting as string] ?? 0,
        percent: (compliance.pillar_incident_reporting_percent as number) || 0,
      },
      resilience_testing: {
        level: levelMap[compliance.pillar_resilience_testing as string] ?? 0,
        percent: (compliance.pillar_resilience_testing_percent as number) || 0,
      },
      third_party_risk: {
        level: levelMap[compliance.pillar_third_party_risk as string] ?? 0,
        percent: (compliance.pillar_third_party_risk_percent as number) || 0,
      },
      information_sharing: {
        level: levelMap[compliance.pillar_info_sharing as string] ?? 0,
        percent: (compliance.pillar_info_sharing_percent as number) || 0,
      },
    },
    gaps: {
      total: (compliance.total_requirements as number) || 0,
      met: (compliance.requirements_met as number) || 0,
      partial: (compliance.requirements_partial as number) || 0,
      not_met: (compliance.requirements_not_met as number) || 0,
      critical: (compliance.critical_gaps_count as number) || 0,
      high: (compliance.high_gaps_count as number) || 0,
      medium: (compliance.medium_gaps_count as number) || 0,
      low: (compliance.low_gaps_count as number) || 0,
    },
    critical_gaps: (compliance.critical_gaps as CriticalGap[]) || [],
    estimated_weeks: (compliance.estimated_remediation_months as number)
      ? Math.round((compliance.estimated_remediation_months as number) * 4)
      : undefined,
  };
}

function aggregateComplianceData(vendors: Record<string, unknown>[]): SnapshotData {
  if (vendors.length === 0) {
    return {
      overall_level: 0,
      overall_percent: 0,
      pillars: {
        ict_risk_management: { level: 0, percent: 0 },
        incident_reporting: { level: 0, percent: 0 },
        resilience_testing: { level: 0, percent: 0 },
        third_party_risk: { level: 0, percent: 0 },
        information_sharing: { level: 0, percent: 0 },
      },
      gaps: { total: 0, met: 0, partial: 0, not_met: 0, critical: 0, high: 0, medium: 0, low: 0 },
      critical_gaps: [],
    };
  }

  // Map all vendors to snapshot data
  const vendorData = vendors.map(mapComplianceToSnapshotData);

  // Calculate averages
  const avgOverallLevel = Math.round(
    vendorData.reduce((sum, v) => sum + v.overall_level, 0) / vendors.length
  ) as MaturityLevel;

  const avgOverallPercent =
    vendorData.reduce((sum, v) => sum + v.overall_percent, 0) / vendors.length;

  // Aggregate pillars
  const pillars = {
    ict_risk_management: {
      level: Math.round(
        vendorData.reduce((sum, v) => sum + v.pillars.ict_risk_management.level, 0) / vendors.length
      ) as MaturityLevel,
      percent:
        vendorData.reduce((sum, v) => sum + v.pillars.ict_risk_management.percent, 0) /
        vendors.length,
    },
    incident_reporting: {
      level: Math.round(
        vendorData.reduce((sum, v) => sum + v.pillars.incident_reporting.level, 0) / vendors.length
      ) as MaturityLevel,
      percent:
        vendorData.reduce((sum, v) => sum + v.pillars.incident_reporting.percent, 0) /
        vendors.length,
    },
    resilience_testing: {
      level: Math.round(
        vendorData.reduce((sum, v) => sum + v.pillars.resilience_testing.level, 0) / vendors.length
      ) as MaturityLevel,
      percent:
        vendorData.reduce((sum, v) => sum + v.pillars.resilience_testing.percent, 0) /
        vendors.length,
    },
    third_party_risk: {
      level: Math.round(
        vendorData.reduce((sum, v) => sum + v.pillars.third_party_risk.level, 0) / vendors.length
      ) as MaturityLevel,
      percent:
        vendorData.reduce((sum, v) => sum + v.pillars.third_party_risk.percent, 0) / vendors.length,
    },
    information_sharing: {
      level: Math.round(
        vendorData.reduce((sum, v) => sum + v.pillars.information_sharing.level, 0) / vendors.length
      ) as MaturityLevel,
      percent:
        vendorData.reduce((sum, v) => sum + v.pillars.information_sharing.percent, 0) /
        vendors.length,
    },
  };

  // Aggregate gaps
  const gaps = {
    total: vendorData.reduce((sum, v) => sum + v.gaps.total, 0),
    met: vendorData.reduce((sum, v) => sum + v.gaps.met, 0),
    partial: vendorData.reduce((sum, v) => sum + v.gaps.partial, 0),
    not_met: vendorData.reduce((sum, v) => sum + v.gaps.not_met, 0),
    critical: vendorData.reduce((sum, v) => sum + v.gaps.critical, 0),
    high: vendorData.reduce((sum, v) => sum + v.gaps.high, 0),
    medium: vendorData.reduce((sum, v) => sum + v.gaps.medium, 0),
    low: vendorData.reduce((sum, v) => sum + v.gaps.low, 0),
  };

  // Collect all critical gaps
  const criticalGaps = vendorData.flatMap((v) => v.critical_gaps);

  return {
    overall_level: avgOverallLevel,
    overall_percent: avgOverallPercent,
    pillars,
    gaps,
    critical_gaps: criticalGaps.slice(0, 10), // Top 10 critical gaps
  };
}

interface ChangeFromPrevious {
  overall_change: number;
  previous_overall: number;
  previous_date: string;
  pillar_changes: {
    ict_risk_mgmt: number;
    incident_reporting: number;
    resilience_testing: number;
    third_party_risk: number;
    info_sharing: number;
  };
  gaps_change: number;
}

async function calculateChangeFromPrevious(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  vendorId: string | undefined,
  currentData: SnapshotData
): Promise<ChangeFromPrevious | null> {
  const { data: previous } = await supabase
    .from('maturity_snapshots')
    .select('*')
    .eq('organization_id', organizationId)
    .is('vendor_id', vendorId || null)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  if (!previous) return null;

  return {
    overall_change: currentData.overall_level - previous.overall_maturity_level,
    previous_overall: previous.overall_maturity_level,
    previous_date: previous.snapshot_date,
    pillar_changes: {
      ict_risk_mgmt:
        currentData.pillars.ict_risk_management.level - previous.pillar_ict_risk_mgmt,
      incident_reporting:
        currentData.pillars.incident_reporting.level - previous.pillar_incident_reporting,
      resilience_testing:
        currentData.pillars.resilience_testing.level - previous.pillar_resilience_testing,
      third_party_risk:
        currentData.pillars.third_party_risk.level - previous.pillar_third_party_risk,
      info_sharing:
        currentData.pillars.information_sharing.level - previous.pillar_info_sharing,
    },
    gaps_change: currentData.gaps.critical - previous.critical_gaps_count,
  };
}

async function logMaturityChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: {
    organization_id: string;
    vendor_id?: string;
    change_type: string;
    pillar?: DORAPllar;
    requirement_id?: string;
    previous_value: unknown;
    new_value: unknown;
    maturity_impact: number;
    changed_by: string;
    change_reason?: string;
    source: string;
    related_document_id?: string;
    related_snapshot_id?: string;
  }
): Promise<void> {
  await supabase.from('maturity_change_log').insert({
    organization_id: data.organization_id,
    vendor_id: data.vendor_id || null,
    change_type: data.change_type,
    pillar: data.pillar || null,
    requirement_id: data.requirement_id || null,
    previous_value: data.previous_value,
    new_value: data.new_value,
    maturity_impact: data.maturity_impact,
    changed_by: data.changed_by,
    change_reason: data.change_reason || null,
    source: data.source,
    related_document_id: data.related_document_id || null,
    related_snapshot_id: data.related_snapshot_id || null,
  });
}

// =============================================================================
// RETRIEVE SNAPSHOTS
// =============================================================================

/**
 * Get maturity snapshots for an organization
 */
export async function getMaturitySnapshots(
  limit: number = 30,
  vendorId?: string
): Promise<ActionResult<MaturitySnapshot[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('maturity_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(limit);

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    } else {
      query = query.is('vendor_id', null);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as MaturitySnapshot[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get snapshots',
    };
  }
}

/**
 * Get latest snapshot
 */
export async function getLatestSnapshot(
  vendorId?: string
): Promise<ActionResult<MaturitySnapshot | null>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('maturity_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1);

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    } else {
      query = query.is('vendor_id', null);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as MaturitySnapshot) || null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get latest snapshot',
    };
  }
}

// =============================================================================
// TREND ANALYSIS
// =============================================================================

/**
 * Analyze maturity trends over a time period
 */
export async function analyzeTrends(
  days: number = 90,
  vendorId?: string
): Promise<ActionResult<TrendAnalysis>> {
  try {
    const supabase = await createClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('maturity_snapshots')
      .select('*')
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: false });

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    } else {
      query = query.is('vendor_id', null);
    }

    const { data: snapshots, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    if (!snapshots || snapshots.length === 0) {
      return {
        success: true,
        data: {
          snapshots: [],
          trend_direction: 'stable',
          overall_change: 0,
          days_analyzed: days,
          pillar_trends: {
            ict_risk_management: 'stable',
            incident_reporting: 'stable',
            resilience_testing: 'stable',
            third_party_risk: 'stable',
            information_sharing: 'stable',
          },
          gaps_closed: 0,
          gaps_opened: 0,
          projected_l3_date: null,
        },
      };
    }

    const typedSnapshots = snapshots as MaturitySnapshot[];
    const trendDirection = determineTrendDirection(typedSnapshots);

    const oldest = typedSnapshots[typedSnapshots.length - 1];
    const newest = typedSnapshots[0];

    // Calculate pillar trends
    const pillarTrends: Record<DORAPllar, 'improving' | 'stable' | 'declining'> = {
      ict_risk_management: calculatePillarTrend(
        oldest.pillar_ict_risk_mgmt,
        newest.pillar_ict_risk_mgmt
      ),
      incident_reporting: calculatePillarTrend(
        oldest.pillar_incident_reporting,
        newest.pillar_incident_reporting
      ),
      resilience_testing: calculatePillarTrend(
        oldest.pillar_resilience_testing,
        newest.pillar_resilience_testing
      ),
      third_party_risk: calculatePillarTrend(
        oldest.pillar_third_party_risk,
        newest.pillar_third_party_risk
      ),
      information_sharing: calculatePillarTrend(
        oldest.pillar_info_sharing,
        newest.pillar_info_sharing
      ),
    };

    // Calculate gaps change
    const gapsChange = oldest.critical_gaps_count - newest.critical_gaps_count;

    // Project L3 date (simple linear projection)
    let projectedL3Date: string | null = null;
    if (
      trendDirection === 'improving' &&
      newest.overall_maturity_level < 3 &&
      typedSnapshots.length >= 2
    ) {
      const daysPerLevel =
        days / Math.max(1, newest.overall_maturity_level - oldest.overall_maturity_level);
      const levelsToL3 = 3 - newest.overall_maturity_level;
      const projectedDays = levelsToL3 * daysPerLevel;
      const projectedDate = new Date();
      projectedDate.setDate(projectedDate.getDate() + projectedDays);
      projectedL3Date = projectedDate.toISOString().split('T')[0];
    }

    return {
      success: true,
      data: {
        snapshots: typedSnapshots,
        trend_direction: trendDirection,
        overall_change: newest.overall_maturity_level - oldest.overall_maturity_level,
        days_analyzed: days,
        pillar_trends: pillarTrends,
        gaps_closed: gapsChange > 0 ? gapsChange : 0,
        gaps_opened: gapsChange < 0 ? Math.abs(gapsChange) : 0,
        projected_l3_date: projectedL3Date,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze trends',
    };
  }
}

function calculatePillarTrend(
  oldValue: number,
  newValue: number
): 'improving' | 'stable' | 'declining' {
  if (newValue > oldValue) return 'improving';
  if (newValue < oldValue) return 'declining';
  return 'stable';
}

/**
 * Compare two snapshots
 */
export async function compareSnapshots(
  currentId: string,
  previousId: string
): Promise<ActionResult<MaturityComparison>> {
  try {
    const supabase = await createClient();

    const { data: snapshots, error } = await supabase
      .from('maturity_snapshots')
      .select('*')
      .in('id', [currentId, previousId]);

    if (error) {
      return { success: false, error: error.message };
    }

    if (!snapshots || snapshots.length !== 2) {
      return { success: false, error: 'Snapshots not found' };
    }

    const current = snapshots.find((s) => s.id === currentId) as MaturitySnapshot;
    const previous = snapshots.find((s) => s.id === previousId) as MaturitySnapshot;

    const changes = {
      overall: current.overall_maturity_level - previous.overall_maturity_level,
      percent: current.overall_readiness_percent - previous.overall_readiness_percent,
      pillars: {
        ict_risk_mgmt: current.pillar_ict_risk_mgmt - previous.pillar_ict_risk_mgmt,
        incident_reporting:
          current.pillar_incident_reporting - previous.pillar_incident_reporting,
        resilience_testing:
          current.pillar_resilience_testing - previous.pillar_resilience_testing,
        third_party_risk: current.pillar_third_party_risk - previous.pillar_third_party_risk,
        info_sharing: current.pillar_info_sharing - previous.pillar_info_sharing,
      },
      gaps: previous.critical_gaps_count - current.critical_gaps_count,
    };

    const improvedAreas = Object.entries(changes.pillars)
      .filter(([, change]) => change > 0)
      .map(([pillar]) => pillar);

    const declinedAreas = Object.entries(changes.pillars)
      .filter(([, change]) => change < 0)
      .map(([pillar]) => pillar);

    return {
      success: true,
      data: {
        current,
        previous,
        changes,
        improved_areas: improvedAreas,
        declined_areas: declinedAreas,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare snapshots',
    };
  }
}

// =============================================================================
// CHANGE LOG
// =============================================================================

/**
 * Get maturity change log
 */
export async function getChangeLog(
  limit: number = 50,
  vendorId?: string
): Promise<ActionResult<MaturityChangeLog[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('maturity_change_log')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as MaturityChangeLog[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get change log',
    };
  }
}

// =============================================================================
// SETTINGS
// =============================================================================

/**
 * Get snapshot settings
 */
export async function getSnapshotSettings(): Promise<ActionResult<MaturitySnapshotSettings | null>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('maturity_snapshot_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as MaturitySnapshotSettings) || null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get settings',
    };
  }
}

/**
 * Update snapshot settings
 */
export async function updateSnapshotSettings(
  settings: Partial<MaturitySnapshotSettings>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: profile } = await supabase.auth.getUser();
    if (!profile.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', profile.user.id)
      .single();

    if (!userProfile?.organization_id) {
      return { success: false, error: 'No organization found' };
    }

    const { error } = await supabase.from('maturity_snapshot_settings').upsert(
      {
        organization_id: userProfile.organization_id,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/compliance/trends');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    };
  }
}
