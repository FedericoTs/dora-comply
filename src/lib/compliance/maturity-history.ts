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
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return { success: false, error: 'No organization found' };
    }

    // Get current compliance data
    const complianceData = await getCurrentComplianceData(
      supabase,
      userData.organization_id,
      vendorId
    );

    if (!complianceData) {
      return { success: false, error: 'Failed to calculate compliance data' };
    }

    // Calculate change from previous snapshot
    const changeFromPrevious = await calculateChangeFromPrevious(
      supabase,
      userData.organization_id,
      vendorId,
      complianceData
    );

    // Insert snapshot
    const { data: snapshot, error } = await supabase
      .from('maturity_snapshots')
      .insert({
        organization_id: userData.organization_id,
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
        organization_id: userData.organization_id,
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
 * Get current compliance data calculated from live data sources
 * Calculates KPIs from: vendors, incidents, tests, documents, certifications
 */
async function getCurrentComplianceData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  vendorId?: string
): Promise<SnapshotData | null> {
  try {
    // Fetch all relevant data in parallel
    const [
      vendorsResult,
      incidentsResult,
      testsResult,
      findingsResult,
      documentsResult,
      certificationsResult,
    ] = await Promise.all([
      // Vendors for TPRM pillar
      supabase
        .from('vendors')
        .select('id, tier, status, risk_score, lei, supports_critical_function, last_assessment_date')
        .eq('organization_id', organizationId)
        .is('deleted_at', null),

      // Incidents for Incident Reporting pillar
      supabase
        .from('incidents')
        .select('id, classification, status, incident_type')
        .eq('organization_id', organizationId),

      // Tests for Resilience Testing pillar
      supabase
        .from('resilience_tests')
        .select('id, status, test_type')
        .eq('organization_id', organizationId),

      // Findings for gap analysis
      supabase
        .from('test_findings')
        .select('id, severity, status')
        .eq('organization_id', organizationId),

      // Documents for evidence
      supabase
        .from('documents')
        .select('id, type, parsing_status')
        .eq('organization_id', organizationId),

      // Certifications for ICT Risk Management
      supabase
        .from('vendor_certifications')
        .select('id, standard, status, vendor_id')
        .eq('organization_id', organizationId),
    ]);

    const vendors = vendorsResult.data || [];
    const incidents = incidentsResult.data || [];
    const tests = testsResult.data || [];
    const findings = findingsResult.data || [];
    const documents = documentsResult.data || [];
    const certifications = certificationsResult.data || [];

    // If vendor-specific, filter data
    const relevantVendors = vendorId
      ? vendors.filter(v => v.id === vendorId)
      : vendors;
    const relevantCerts = vendorId
      ? certifications.filter(c => c.vendor_id === vendorId)
      : certifications;

    // Calculate pillar scores from real data
    const pillarScores = {
      ict_risk_management: calculateICTRiskScore(relevantVendors, relevantCerts, documents),
      incident_reporting: calculateIncidentReportingScore(incidents),
      resilience_testing: calculateResilienceTestingScore(tests, findings),
      third_party_risk: calculateTPRMScore(relevantVendors, relevantCerts),
      information_sharing: calculateInfoSharingScore(documents),
    };

    // Calculate overall maturity (weighted average)
    const weights = {
      ict_risk_management: 3,
      incident_reporting: 3,
      resilience_testing: 2,
      third_party_risk: 3,
      information_sharing: 1,
    };

    let totalWeight = 0;
    let weightedSum = 0;
    let weightedPercentSum = 0;

    for (const [pillar, score] of Object.entries(pillarScores)) {
      const weight = weights[pillar as keyof typeof weights];
      totalWeight += weight;
      weightedSum += score.level * weight;
      weightedPercentSum += score.percent * weight;
    }

    const overallLevel = Math.round(weightedSum / totalWeight) as MaturityLevel;
    const overallPercent = Math.round(weightedPercentSum / totalWeight);

    // Calculate gaps from findings and missing data
    const gapAnalysis = calculateGapAnalysis(
      relevantVendors,
      incidents,
      tests,
      findings,
      documents,
      relevantCerts
    );

    return {
      overall_level: overallLevel,
      overall_percent: overallPercent,
      pillars: pillarScores,
      gaps: gapAnalysis.gaps,
      critical_gaps: gapAnalysis.criticalGaps,
      estimated_weeks: gapAnalysis.estimatedWeeks,
    };
  } catch (error) {
    console.error('[MaturityHistory] Get compliance data error:', error);
    return null;
  }
}

/**
 * Calculate ICT Risk Management score
 * Based on: vendor risk assessments, certifications, documented policies
 */
function calculateICTRiskScore(
  vendors: { risk_score: number | null; last_assessment_date: string | null }[],
  certifications: { standard: string; status: string }[],
  documents: { type: string; parsing_status: string }[]
): { level: MaturityLevel; percent: number } {
  let score = 0;

  // Vendor risk assessments (40% weight)
  if (vendors.length > 0) {
    const assessedVendors = vendors.filter(v => v.risk_score !== null);
    const assessmentRate = (assessedVendors.length / vendors.length) * 100;
    score += (assessmentRate / 100) * 40;
  } else {
    score += 20; // Base score if no vendors yet
  }

  // Valid certifications (30% weight)
  const validCerts = certifications.filter(c => c.status === 'valid');
  const soc2Certs = validCerts.filter(c => c.standard.toLowerCase().includes('soc'));
  const isoCerts = validCerts.filter(c => c.standard.toLowerCase().includes('27001'));
  if (soc2Certs.length > 0 || isoCerts.length > 0) {
    const certScore = Math.min(100, (validCerts.length / Math.max(vendors.length, 1)) * 100);
    score += (certScore / 100) * 30;
  }

  // Documented policies (30% weight)
  const parsedDocs = documents.filter(d => d.parsing_status === 'completed');
  if (parsedDocs.length > 0) {
    score += Math.min(30, parsedDocs.length * 5);
  }

  const percent = Math.round(score);
  const level = percentToMaturityLevel(percent);

  return { level, percent };
}

/**
 * Calculate Incident Reporting score
 * Based on: incident tracking, classification, resolution
 */
function calculateIncidentReportingScore(
  incidents: { classification: string; status: string; incident_type: string }[]
): { level: MaturityLevel; percent: number } {
  // Base score for having incident tracking capability
  let score = 25;

  if (incidents.length === 0) {
    // No incidents - could be good (no problems) or bad (not tracking)
    // Give moderate score for having capability even without incidents
    return { level: 1 as MaturityLevel, percent: 40 };
  }

  // Proper classification (25% weight)
  const classifiedIncidents = incidents.filter(i =>
    i.classification && ['major', 'significant', 'minor'].includes(i.classification)
  );
  score += (classifiedIncidents.length / incidents.length) * 25;

  // Resolution rate (25% weight)
  const resolvedIncidents = incidents.filter(i =>
    ['resolved', 'closed'].includes(i.status)
  );
  score += (resolvedIncidents.length / incidents.length) * 25;

  // Incident type categorization (25% weight)
  const typedIncidents = incidents.filter(i => i.incident_type);
  score += (typedIncidents.length / incidents.length) * 25;

  const percent = Math.round(score);
  const level = percentToMaturityLevel(percent);

  return { level, percent };
}

/**
 * Calculate Resilience Testing score
 * Based on: test coverage, completion rate, findings remediation
 */
function calculateResilienceTestingScore(
  tests: { status: string; test_type: string }[],
  findings: { severity: string; status: string }[]
): { level: MaturityLevel; percent: number } {
  // Base score for having testing programme
  let score = 20;

  if (tests.length === 0) {
    return { level: 0 as MaturityLevel, percent: 20 };
  }

  // Test completion rate (40% weight)
  const completedTests = tests.filter(t => t.status === 'completed');
  score += (completedTests.length / tests.length) * 40;

  // Test type diversity (20% weight)
  const testTypes = new Set(tests.map(t => t.test_type));
  const diversityScore = Math.min(20, testTypes.size * 5);
  score += diversityScore;

  // Findings remediation (20% weight)
  if (findings.length > 0) {
    const remediatedFindings = findings.filter(f =>
      ['remediated', 'risk_accepted'].includes(f.status)
    );
    score += (remediatedFindings.length / findings.length) * 20;
  } else {
    score += 20; // No findings is good
  }

  const percent = Math.round(score);
  const level = percentToMaturityLevel(percent);

  return { level, percent };
}

/**
 * Calculate Third Party Risk Management score
 * Based on: vendor inventory, risk assessments, due diligence
 */
function calculateTPRMScore(
  vendors: { tier: string; status: string; risk_score: number | null; lei: string | null; supports_critical_function: boolean }[],
  certifications: { standard: string; status: string }[]
): { level: MaturityLevel; percent: number } {
  // Base score for having vendor management
  let score = 15;

  if (vendors.length === 0) {
    return { level: 0 as MaturityLevel, percent: 15 };
  }

  // Active vendor management (25% weight)
  const activeVendors = vendors.filter(v => v.status === 'active');
  score += (activeVendors.length / vendors.length) * 25;

  // Risk assessment coverage (25% weight)
  const assessedVendors = vendors.filter(v => v.risk_score !== null);
  score += (assessedVendors.length / vendors.length) * 25;

  // LEI validation (15% weight)
  const leiValidated = vendors.filter(v => v.lei);
  score += (leiValidated.length / vendors.length) * 15;

  // Critical function identification (10% weight)
  const criticalVendors = vendors.filter(v => v.supports_critical_function);
  if (criticalVendors.length > 0) {
    score += 10;
  }

  // Vendor certifications (10% weight)
  const vendorWithCerts = new Set(certifications.map(c => c.standard));
  if (vendorWithCerts.size > 0) {
    score += Math.min(10, vendorWithCerts.size * 2);
  }

  const percent = Math.round(score);
  const level = percentToMaturityLevel(percent);

  return { level, percent };
}

/**
 * Calculate Information Sharing score
 * Based on: documented processes, external sharing participation
 */
function calculateInfoSharingScore(
  documents: { type: string; parsing_status: string }[]
): { level: MaturityLevel; percent: number } {
  // Base score - info sharing is often least mature
  let score = 20;

  // Having documented evidence of information sharing practices
  const completedDocs = documents.filter(d => d.parsing_status === 'completed');
  if (completedDocs.length > 0) {
    score += Math.min(30, completedDocs.length * 3);
  }

  // Information sharing is typically the least developed pillar
  // Cap at 60% unless explicitly configured
  const percent = Math.min(60, Math.round(score));
  const level = percentToMaturityLevel(percent);

  return { level, percent };
}

/**
 * Convert percentage to maturity level
 */
function percentToMaturityLevel(percent: number): MaturityLevel {
  if (percent >= 85) return 4;
  if (percent >= 70) return 3;
  if (percent >= 50) return 2;
  if (percent >= 25) return 1;
  return 0;
}

/**
 * Calculate gap analysis from compliance data
 */
function calculateGapAnalysis(
  vendors: { tier: string; risk_score: number | null }[],
  incidents: { classification: string; status: string }[],
  tests: { status: string }[],
  findings: { severity: string; status: string }[],
  documents: { type: string }[],
  certifications: { standard: string; status: string }[]
): {
  gaps: {
    total: number;
    met: number;
    partial: number;
    not_met: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  criticalGaps: CriticalGap[];
  estimatedWeeks: number | undefined;
} {
  const totalRequirements = 64; // Total DORA requirements
  const criticalGaps: CriticalGap[] = [];
  let met = 0;
  let partial = 0;
  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;

  // ICT Risk Management gaps
  const hasRiskFramework = documents.length > 0;
  const hasVendorAssessments = vendors.some(v => v.risk_score !== null);
  if (!hasRiskFramework) {
    criticalGaps.push({
      requirement_id: 'art-5',
      article: 'Article 5',
      pillar: 'ict_risk_management',
      priority: 'critical',
      description: 'No documented ICT risk management framework detected',
    });
    critical++;
  } else if (hasVendorAssessments) {
    met += 8;
    partial += 4;
  } else {
    partial += 10;
    high += 2;
  }

  // Incident Reporting gaps
  const hasIncidentProcess = incidents.length > 0;
  if (!hasIncidentProcess) {
    criticalGaps.push({
      requirement_id: 'art-17',
      article: 'Article 17',
      pillar: 'incident_reporting',
      priority: 'high',
      description: 'No incident management records found',
    });
    high++;
    partial += 6;
  } else {
    met += 8;
    partial += 2;
  }

  // Resilience Testing gaps
  const hasTestingProgramme = tests.length > 0;
  const completedTests = tests.filter(t => t.status === 'completed').length;
  if (!hasTestingProgramme) {
    criticalGaps.push({
      requirement_id: 'art-24',
      article: 'Article 24',
      pillar: 'resilience_testing',
      priority: 'critical',
      description: 'No resilience testing programme established',
    });
    critical++;
  } else if (completedTests === 0) {
    high++;
    partial += 4;
  } else {
    met += 6;
    partial += 2;
  }

  // TPRM gaps
  const criticalVendorsWithoutAssessment = vendors.filter(
    v => v.tier === 'critical' && v.risk_score === null
  );
  if (vendors.length === 0) {
    criticalGaps.push({
      requirement_id: 'art-28',
      article: 'Article 28',
      pillar: 'third_party_risk',
      priority: 'critical',
      description: 'No third-party vendor inventory established',
    });
    critical++;
  } else if (criticalVendorsWithoutAssessment.length > 0) {
    criticalGaps.push({
      requirement_id: 'art-28',
      article: 'Article 28',
      pillar: 'third_party_risk',
      priority: 'high',
      description: `${criticalVendorsWithoutAssessment.length} critical vendors without risk assessment`,
    });
    high++;
    partial += 4;
  } else {
    met += 10;
    partial += 2;
  }

  // Open findings contribute to gaps
  const openFindings = findings.filter(f => !['remediated', 'risk_accepted'].includes(f.status));
  const criticalFindings = openFindings.filter(f => f.severity === 'critical').length;
  const highFindings = openFindings.filter(f => f.severity === 'high').length;
  const mediumFindings = openFindings.filter(f => f.severity === 'medium').length;
  const lowFindings = openFindings.filter(f => f.severity === 'low').length;

  critical += criticalFindings;
  high += highFindings;
  medium += mediumFindings;
  low += lowFindings;

  // Calculate remaining
  const not_met = totalRequirements - met - partial;

  // Estimate remediation time
  const estimatedWeeks = criticalGaps.length * 4 + high * 2 + medium * 1;

  return {
    gaps: {
      total: totalRequirements,
      met: Math.min(met, totalRequirements),
      partial: Math.min(partial, totalRequirements - met),
      not_met: Math.max(0, not_met),
      critical,
      high,
      medium,
      low,
    },
    criticalGaps: criticalGaps.slice(0, 10),
    estimatedWeeks: estimatedWeeks > 0 ? estimatedWeeks : undefined,
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

    const { data: userRecord } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', profile.user.id)
      .single();

    if (!userRecord?.organization_id) {
      return { success: false, error: 'No organization found' };
    }

    const { error } = await supabase.from('maturity_snapshot_settings').upsert(
      {
        organization_id: userRecord.organization_id,
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
