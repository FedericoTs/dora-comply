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

// Import centralized DORA constants and calculations
import { percentToMaturityLevel, REQUIRED_TEST_TYPES } from './dora-constants';
import {
  calculateMTTR,
  scoreMTTR,
  calculateMTTD,
  scoreMTTD,
  checkTimelineCompliance,
  calculateHHI,
  scoreCertifications,
  checkTLPTCompliance,
  scoreRemediationByCVSS,
} from './metrics-calculations';

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
 * Uses DORA-aligned metrics: MTTR, HHI concentration risk, timeline compliance, etc.
 */
async function getCurrentComplianceData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  vendorId?: string
): Promise<SnapshotData | null> {
  try {
    // Fetch all relevant data in parallel with extended fields for improved KPIs
    const [
      vendorsResult,
      incidentsResult,
      incidentReportsResult,
      testsResult,
      findingsResult,
      documentsResult,
      certificationsResult,
      tlptResult,
      contractsResult,
    ] = await Promise.all([
      // Vendors for TPRM pillar - extended fields for HHI and monitoring
      supabase
        .from('vendors')
        .select('id, tier, status, risk_score, lei, supports_critical_function, last_assessment_date, total_annual_expense, external_risk_score, updated_at')
        .eq('organization_id', organizationId)
        .is('deleted_at', null),

      // Incidents for Incident Reporting pillar - extended for MTTR/MTTD
      supabase
        .from('incidents')
        .select('id, classification, status, incident_type, duration_hours, occurrence_datetime, detection_datetime')
        .eq('organization_id', organizationId),

      // Incident reports for timeline compliance (via incident_id join)
      supabase
        .from('incident_reports')
        .select('id, submitted_at, deadline, report_type, incident_id, incidents!inner(organization_id)')
        .eq('incidents.organization_id', organizationId),

      // Tests for Resilience Testing pillar - extended for tester qualifications
      supabase
        .from('resilience_tests')
        .select('id, status, test_type, tester_certifications, tester_independence_verified, scheduled_date, completed_date')
        .eq('organization_id', organizationId),

      // Findings for gap analysis - extended for CVSS
      supabase
        .from('test_findings')
        .select('id, severity, status, cvss_score, remediation_status')
        .eq('organization_id', organizationId),

      // Documents for evidence
      supabase
        .from('documents')
        .select('id, type, parsing_status')
        .eq('organization_id', organizationId),

      // Certifications for ICT Risk Management - extended for type scoring
      supabase
        .from('vendor_certifications')
        .select('id, standard, status, vendor_id, certification_type, expiry_date')
        .eq('organization_id', organizationId),

      // TLPT engagements for resilience testing
      supabase
        .from('tlpt_engagements')
        .select('id, status, next_tlpt_due')
        .eq('organization_id', organizationId),

      // Vendor contracts for contractual coverage
      supabase
        .from('vendor_contracts')
        .select('id, vendor_id, exit_strategy, audit_rights')
        .eq('organization_id', organizationId),
    ]);

    const vendors = vendorsResult.data || [];
    const incidents = incidentsResult.data || [];
    const incidentReports = incidentReportsResult.data || [];
    const tests = testsResult.data || [];
    const findings = findingsResult.data || [];
    const documents = documentsResult.data || [];
    const certifications = certificationsResult.data || [];
    const tlptEngagements = tlptResult.data || [];
    const contracts = contractsResult.data || [];

    // If vendor-specific, filter data
    const relevantVendors = vendorId
      ? vendors.filter(v => v.id === vendorId)
      : vendors;
    const relevantCerts = vendorId
      ? certifications.filter(c => c.vendor_id === vendorId)
      : certifications;
    const relevantContracts = vendorId
      ? contracts.filter(c => c.vendor_id === vendorId)
      : contracts;

    // Calculate pillar scores from real data with improved algorithms
    const pillarScores = {
      ict_risk_management: calculateICTRiskScore(relevantVendors, relevantCerts, documents),
      incident_reporting: calculateIncidentReportingScore(incidents, incidentReports),
      resilience_testing: calculateResilienceTestingScore(tests, findings, tlptEngagements),
      third_party_risk: calculateTPRMScore(relevantVendors, relevantCerts, relevantContracts),
      information_sharing: calculateInfoSharingScore(documents, incidentReports),
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
 * Improved algorithm based on DORA requirements:
 * - Certification quality (30%): SOC2 II > SOC2 I > ISO27001
 * - Assessment currency (25%): Recent assessments with recency decay
 * - Control effectiveness (25%): Based on documented controls
 * - Policy maturity (20%): Documented policies and procedures
 */
function calculateICTRiskScore(
  vendors: { risk_score: number | null; last_assessment_date: string | null; updated_at: string }[],
  certifications: { standard: string; status: string; certification_type?: string; expiry_date?: string | null }[],
  documents: { type: string; parsing_status: string }[]
): { level: MaturityLevel; percent: number } {
  let score = 0;

  // 1. Certification Quality (30% weight) - using improved scoring
  const certScore = scoreCertifications(
    certifications.map(c => ({
      certification_type: c.certification_type || c.standard,
      expiry_date: c.expiry_date || null,
      status: c.status,
    })),
    Math.max(vendors.length, 1)
  );
  score += (certScore / 100) * 30;

  // 2. Assessment Currency (25% weight) - with recency decay
  if (vendors.length > 0) {
    const now = new Date();
    let currencyScore = 0;

    for (const vendor of vendors) {
      if (vendor.risk_score !== null) {
        // Check recency of assessment
        const lastAssessment = vendor.last_assessment_date || vendor.updated_at;
        if (lastAssessment) {
          const daysSinceAssessment = (now.getTime() - new Date(lastAssessment).getTime()) / (1000 * 60 * 60 * 24);
          // Full score if < 90 days, decay to 50% at 365 days
          if (daysSinceAssessment < 90) {
            currencyScore += 100;
          } else if (daysSinceAssessment < 365) {
            currencyScore += 100 - ((daysSinceAssessment - 90) / 275) * 50;
          } else {
            currencyScore += 50; // Stale but exists
          }
        } else {
          currencyScore += 70; // Has score but unknown date
        }
      }
    }
    score += (currencyScore / vendors.length / 100) * 25;
  } else {
    score += 12.5; // Base score if no vendors
  }

  // 3. Control Effectiveness (25% weight) - based on documentation
  const policyDocs = documents.filter(d =>
    d.type === 'policy' || d.type === 'procedure' || d.type === 'control'
  );
  const completedPolicyDocs = policyDocs.filter(d => d.parsing_status === 'completed');

  if (policyDocs.length > 0) {
    const effectivenessScore = (completedPolicyDocs.length / policyDocs.length) * 100;
    score += (effectivenessScore / 100) * 25;
  } else {
    // No policy docs - check for any completed docs as evidence
    const parsedDocs = documents.filter(d => d.parsing_status === 'completed');
    score += Math.min(15, parsedDocs.length * 2.5);
  }

  // 4. Policy Maturity (20% weight) - breadth of documentation
  const parsedDocs = documents.filter(d => d.parsing_status === 'completed');
  const docTypes = new Set(parsedDocs.map(d => d.type));
  // More diverse documentation = more mature
  const diversityScore = Math.min(100, docTypes.size * 20);
  score += (diversityScore / 100) * 20;

  const percent = Math.round(Math.min(100, score));
  const level = percentToMaturityLevel(percent);

  return { level, percent };
}

/**
 * Calculate Incident Reporting score
 * Improved algorithm based on DORA requirements:
 * - Timeline compliance (35%): Reports submitted within 4h/72h/1m deadlines
 * - MTTR (25%): Mean Time To Resolve
 * - MTTD (20%): Mean Time To Detect
 * - Classification accuracy (10%): Proper incident classification
 * - Process maturity (10%): Complete incident records
 */
function calculateIncidentReportingScore(
  incidents: { classification: string; status: string; incident_type: string; duration_hours: number | null; occurrence_datetime: string | null; detection_datetime: string | null }[],
  incidentReports: { submitted_at: string | null; deadline: string | null }[]
): { level: MaturityLevel; percent: number } {
  // Base score for having incident tracking capability
  let score = 15;

  if (incidents.length === 0) {
    // No incidents - could be good (no problems) or bad (not tracking)
    // Give moderate score for having capability even without incidents
    return { level: 1 as MaturityLevel, percent: 45 };
  }

  // 1. Timeline Compliance (35% weight) - DORA 4h/72h/1m requirements
  const timelineScore = checkTimelineCompliance(incidentReports);
  score += (timelineScore / 100) * 35;

  // 2. MTTR (25% weight) - Mean Time To Resolve
  const mttr = calculateMTTR(incidents);
  const mttrScore = scoreMTTR(mttr);
  score += (mttrScore / 100) * 25;

  // 3. MTTD (20% weight) - Mean Time To Detect
  const mttd = calculateMTTD(incidents);
  const mttdScore = scoreMTTD(mttd);
  score += (mttdScore / 100) * 20;

  // 4. Classification Accuracy (10% weight)
  const classifiedIncidents = incidents.filter(i =>
    i.classification && ['major', 'significant', 'minor'].includes(i.classification)
  );
  const classificationRate = (classifiedIncidents.length / incidents.length) * 100;
  score += (classificationRate / 100) * 10;

  // 5. Process Maturity (10% weight) - completeness of records
  let completenessScore = 0;
  for (const incident of incidents) {
    let fieldsComplete = 0;
    if (incident.classification) fieldsComplete++;
    if (incident.incident_type) fieldsComplete++;
    if (incident.occurrence_datetime) fieldsComplete++;
    if (incident.detection_datetime) fieldsComplete++;
    completenessScore += (fieldsComplete / 4) * 100;
  }
  completenessScore = completenessScore / incidents.length;
  score += (completenessScore / 100) * 10;

  const percent = Math.round(Math.min(100, score));
  const level = percentToMaturityLevel(percent);

  return { level, percent };
}

/**
 * Calculate Resilience Testing score
 * Improved algorithm based on DORA requirements:
 * - Test coverage (25%): Types covered / 10 required types
 * - TLPT compliance (25%): Threat-Led Penetration Testing within 3 years
 * - Tester qualification (20%): Certified + independent testers
 * - Finding remediation (20%): CVSS-weighted remediation rate
 * - Execution cadence (10%): Tests completed on schedule
 */
function calculateResilienceTestingScore(
  tests: { status: string; test_type: string; tester_certifications?: string[] | null; tester_independence_verified?: boolean; scheduled_date?: string | null; completed_date?: string | null }[],
  findings: { severity: string; status: string; cvss_score?: number | null; remediation_status?: string }[],
  tlptEngagements: { next_tlpt_due: string | null; status: string }[]
): { level: MaturityLevel; percent: number } {
  // Base score for having testing programme
  let score = 10;

  if (tests.length === 0) {
    return { level: 0 as MaturityLevel, percent: 15 };
  }

  // 1. Test Coverage (25% weight) - types covered / 10 required
  const testTypes = new Set(tests.map(t => t.test_type?.toLowerCase() || ''));
  const coveredTypes = REQUIRED_TEST_TYPES.filter(rt =>
    testTypes.has(rt) || [...testTypes].some(tt => tt.includes(rt.replace('_', ' ')) || tt.includes(rt))
  );
  const coverageScore = (coveredTypes.length / REQUIRED_TEST_TYPES.length) * 100;
  score += (coverageScore / 100) * 25;

  // 2. TLPT Compliance (25% weight) - required every 3 years
  const tlptScore = checkTLPTCompliance(tlptEngagements);
  score += (tlptScore / 100) * 25;

  // 3. Tester Qualification (20% weight) - certifications + independence
  let qualificationScore = 0;
  let testsWithQualifiedTesters = 0;

  for (const test of tests) {
    let testScore = 0;
    // Check for certifications
    if (test.tester_certifications && test.tester_certifications.length > 0) {
      testScore += 60;
    }
    // Check for independence verification
    if (test.tester_independence_verified) {
      testScore += 40;
    }
    if (testScore > 0) {
      qualificationScore += testScore;
      testsWithQualifiedTesters++;
    }
  }

  if (testsWithQualifiedTesters > 0) {
    qualificationScore = qualificationScore / testsWithQualifiedTesters;
  } else {
    qualificationScore = 30; // Base score if no qualification data
  }
  score += (qualificationScore / 100) * 20;

  // 4. Finding Remediation (20% weight) - CVSS-weighted
  const remediationScore = scoreRemediationByCVSS(
    findings.map(f => ({
      cvss_score: f.cvss_score || null,
      remediation_status: f.remediation_status || f.status,
    }))
  );
  score += (remediationScore / 100) * 20;

  // 5. Execution Cadence (10% weight) - tests completed on/before schedule
  const completedTests = tests.filter(t => t.status === 'completed');
  if (completedTests.length > 0) {
    let onTimeCount = 0;
    for (const test of completedTests) {
      if (test.scheduled_date && test.completed_date) {
        const scheduled = new Date(test.scheduled_date).getTime();
        const completed = new Date(test.completed_date).getTime();
        if (completed <= scheduled + (7 * 24 * 60 * 60 * 1000)) { // Allow 1 week grace
          onTimeCount++;
        }
      } else {
        onTimeCount++; // No schedule = assume on time
      }
    }
    const cadenceScore = (onTimeCount / completedTests.length) * 100;
    score += (cadenceScore / 100) * 10;
  } else {
    score += 5; // Base if no completed tests
  }

  const percent = Math.round(Math.min(100, score));
  const level = percentToMaturityLevel(percent);

  return { level, percent };
}

/**
 * Calculate Third Party Risk Management score
 * Improved algorithm based on DORA requirements:
 * - Concentration risk (25%): HHI-based vendor diversification
 * - Due diligence (25%): Certifications + risk assessments
 * - Continuous monitoring (20%): External risk scores + recency
 * - Contractual coverage (15%): Exit strategy + audit rights
 * - Critical provider mgmt (15%): Critical vendors fully documented
 */
function calculateTPRMScore(
  vendors: { id: string; tier: string; status: string; risk_score: number | null; lei: string | null; supports_critical_function: boolean; total_annual_expense?: number | null; external_risk_score?: number | null; updated_at?: string }[],
  certifications: { standard: string; status: string }[],
  contracts: { vendor_id: string; exit_strategy?: boolean | null; audit_rights?: boolean | null }[]
): { level: MaturityLevel; percent: number } {
  // Base score for having vendor management
  let score = 10;

  if (vendors.length === 0) {
    return { level: 0 as MaturityLevel, percent: 15 };
  }

  // 1. Concentration Risk (25% weight) - HHI calculation
  const hhiScore = calculateHHI(vendors);
  score += (hhiScore / 100) * 25;

  // 2. Due Diligence (25% weight) - certifications + assessments
  const assessedVendors = vendors.filter(v => v.risk_score !== null);
  const assessmentRate = (assessedVendors.length / vendors.length) * 100;

  // Count vendors with valid certifications
  const vendorsWithCerts = new Set(
    certifications.filter(c => c.status === 'valid' || c.status === 'active').map(c => c.standard)
  );
  const certRate = Math.min(100, (vendorsWithCerts.size / vendors.length) * 100);

  const dueDiligenceScore = (assessmentRate * 0.6 + certRate * 0.4);
  score += (dueDiligenceScore / 100) * 25;

  // 3. Continuous Monitoring (20% weight) - external risk scores + recency
  const now = new Date();
  let monitoringScore = 0;
  let vendorsWithMonitoring = 0;

  for (const vendor of vendors) {
    if (vendor.external_risk_score !== null) {
      vendorsWithMonitoring++;
      // Check recency
      if (vendor.updated_at) {
        const daysSinceUpdate = (now.getTime() - new Date(vendor.updated_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 30) {
          monitoringScore += 100; // Recent monitoring
        } else if (daysSinceUpdate < 90) {
          monitoringScore += 70;
        } else {
          monitoringScore += 40; // Stale but exists
        }
      } else {
        monitoringScore += 60;
      }
    }
  }

  if (vendorsWithMonitoring > 0) {
    monitoringScore = monitoringScore / vendorsWithMonitoring;
    // Also factor in coverage
    const coverageMultiplier = vendorsWithMonitoring / vendors.length;
    monitoringScore = monitoringScore * coverageMultiplier;
  } else {
    monitoringScore = 30; // Base if no external monitoring
  }
  score += (monitoringScore / 100) * 20;

  // 4. Contractual Coverage (15% weight) - exit strategy + audit rights
  let contractScore = 0;
  const vendorContractMap = new Map<string, { exit_strategy: boolean; audit_rights: boolean }>();

  for (const contract of contracts) {
    const existing = vendorContractMap.get(contract.vendor_id) || { exit_strategy: false, audit_rights: false };
    if (contract.exit_strategy) existing.exit_strategy = true;
    if (contract.audit_rights) existing.audit_rights = true;
    vendorContractMap.set(contract.vendor_id, existing);
  }

  for (const vendor of vendors) {
    const contract = vendorContractMap.get(vendor.id);
    if (contract) {
      if (contract.exit_strategy) contractScore += 50;
      if (contract.audit_rights) contractScore += 50;
    }
  }

  if (vendors.length > 0) {
    contractScore = contractScore / vendors.length;
  }
  score += (contractScore / 100) * 15;

  // 5. Critical Provider Management (15% weight) - critical vendors fully documented
  const criticalVendors = vendors.filter(v => v.supports_critical_function || v.tier === 'critical');

  if (criticalVendors.length > 0) {
    let criticalScore = 0;
    for (const vendor of criticalVendors) {
      let vendorScore = 0;
      if (vendor.risk_score !== null) vendorScore += 25;
      if (vendor.lei) vendorScore += 25;
      if (vendor.external_risk_score !== null) vendorScore += 25;
      const hasContract = vendorContractMap.has(vendor.id);
      if (hasContract) vendorScore += 25;
      criticalScore += vendorScore;
    }
    criticalScore = criticalScore / criticalVendors.length;
    score += (criticalScore / 100) * 15;
  } else {
    // No critical vendors identified - partial score
    score += 7.5;
  }

  const percent = Math.round(Math.min(100, score));
  const level = percentToMaturityLevel(percent);

  return { level, percent };
}

/**
 * Calculate Information Sharing score
 * Improved algorithm based on DORA requirements:
 * - Threat intel capability (40%): Documented processes for threat intelligence
 * - Incident sharing (30%): External incident reporting compliance
 * - Regulatory reporting (30%): On-time submission to authorities
 * Note: Removed artificial 60% cap - full 0-100% range now available
 */
function calculateInfoSharingScore(
  documents: { type: string; parsing_status: string }[],
  incidentReports: { submitted_at: string | null; deadline: string | null; report_type?: string }[]
): { level: MaturityLevel; percent: number } {
  let score = 15; // Base score for having infrastructure

  // 1. Threat Intel Capability (40% weight) - based on documentation
  const threatIntelDocs = documents.filter(d =>
    d.type === 'threat_intelligence' ||
    d.type === 'security_policy' ||
    d.type === 'incident_response' ||
    d.type === 'information_sharing'
  );
  const completedThreatDocs = threatIntelDocs.filter(d => d.parsing_status === 'completed');

  if (threatIntelDocs.length > 0) {
    const threatCapabilityScore = (completedThreatDocs.length / threatIntelDocs.length) * 100;
    score += (threatCapabilityScore / 100) * 40;
  } else {
    // Check for any completed docs as evidence of documentation capability
    const completedDocs = documents.filter(d => d.parsing_status === 'completed');
    if (completedDocs.length > 0) {
      score += Math.min(20, completedDocs.length * 4); // Up to 20% for general docs
    }
  }

  // 2. Incident Sharing (30% weight) - external reporting
  // Check for reports submitted to authorities
  const externalReports = incidentReports.filter(r =>
    r.report_type === 'competent_authority' ||
    r.report_type === 'final' ||
    r.report_type === 'intermediate'
  );

  if (externalReports.length > 0) {
    // Score based on having external reporting
    const reportsWithSubmission = externalReports.filter(r => r.submitted_at);
    const sharingScore = (reportsWithSubmission.length / externalReports.length) * 100;
    score += (sharingScore / 100) * 30;
  } else if (incidentReports.length > 0) {
    // Has internal reporting but no external - partial score
    score += 10;
  } else {
    // No incident reports - minimal base score
    score += 5;
  }

  // 3. Regulatory Reporting (30% weight) - on-time submission
  if (incidentReports.length > 0) {
    const timelineScore = checkTimelineCompliance(incidentReports);
    score += (timelineScore / 100) * 30;
  } else {
    // No reports to evaluate - base score
    score += 10;
  }

  // No artificial cap - full 0-100% range
  const percent = Math.round(Math.min(100, score));
  const level = percentToMaturityLevel(percent);

  return { level, percent };
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
  const hasValidCertifications = certifications.some(c => c.status === 'valid' || c.status === 'active');

  if (!hasRiskFramework) {
    criticalGaps.push({
      requirement_id: 'art-5',
      article: 'Article 5',
      pillar: 'ict_risk_management',
      priority: 'critical',
      description: 'No documented ICT risk management framework detected',
    });
    critical++;
  } else if (hasVendorAssessments && hasValidCertifications) {
    met += 10;
    partial += 2;
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
// DORA DASHBOARD DATA
// =============================================================================

export interface DORADashboardData {
  overall_percent: number;
  overall_level: MaturityLevel;
  pillars: {
    id: string;
    name: string;
    articles: string;
    percent: number;
    level: MaturityLevel;
    status: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
  }[];
  gaps: {
    total: number;
    met: number;
    critical: number;
    high: number;
  };
  critical_gaps: CriticalGap[];
  estimated_weeks?: number;
  last_updated?: string;
}

/**
 * Get DORA dashboard data for the overview page
 * Returns real calculated data from current compliance state or latest snapshot
 */
export async function getDORADashboardData(): Promise<ActionResult<DORADashboardData>> {
  try {
    const supabase = await createClient();

    // Get current user and org
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return { success: false, error: 'No organization found' };
    }

    // Try to get latest snapshot first (cached/historical view)
    const { data: latestSnapshot } = await supabase
      .from('maturity_snapshots')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .is('vendor_id', null)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    // If we have a recent snapshot (< 24h old), use it
    if (latestSnapshot) {
      const snapshotDate = new Date(latestSnapshot.created_at);
      const hoursOld = (Date.now() - snapshotDate.getTime()) / (1000 * 60 * 60);

      if (hoursOld < 24) {
        return {
          success: true,
          data: formatSnapshotToDashboardData(latestSnapshot),
        };
      }
    }

    // Otherwise calculate fresh data
    const complianceData = await getCurrentComplianceData(
      supabase,
      userData.organization_id
    );

    if (!complianceData) {
      // Return empty/default state if no data
      return {
        success: true,
        data: {
          overall_percent: 0,
          overall_level: 0 as MaturityLevel,
          pillars: getDefaultPillars(),
          gaps: { total: 64, met: 0, critical: 0, high: 0 },
          critical_gaps: [],
        },
      };
    }

    // Convert to dashboard format
    const dashboardData: DORADashboardData = {
      overall_percent: complianceData.overall_percent,
      overall_level: complianceData.overall_level,
      pillars: [
        {
          id: 'ict_risk',
          name: 'ICT Risk Management',
          articles: 'Articles 5-16',
          percent: complianceData.pillars.ict_risk_management.percent,
          level: complianceData.pillars.ict_risk_management.level,
          status: getStatusFromPercent(complianceData.pillars.ict_risk_management.percent),
        },
        {
          id: 'incident',
          name: 'Incident Reporting',
          articles: 'Articles 17-23',
          percent: complianceData.pillars.incident_reporting.percent,
          level: complianceData.pillars.incident_reporting.level,
          status: getStatusFromPercent(complianceData.pillars.incident_reporting.percent),
        },
        {
          id: 'testing',
          name: 'Resilience Testing',
          articles: 'Articles 24-27',
          percent: complianceData.pillars.resilience_testing.percent,
          level: complianceData.pillars.resilience_testing.level,
          status: getStatusFromPercent(complianceData.pillars.resilience_testing.percent),
        },
        {
          id: 'tprm',
          name: 'Third Party Risk',
          articles: 'Articles 28-44',
          percent: complianceData.pillars.third_party_risk.percent,
          level: complianceData.pillars.third_party_risk.level,
          status: getStatusFromPercent(complianceData.pillars.third_party_risk.percent),
        },
        {
          id: 'sharing',
          name: 'Information Sharing',
          articles: 'Article 45',
          percent: complianceData.pillars.information_sharing.percent,
          level: complianceData.pillars.information_sharing.level,
          status: getStatusFromPercent(complianceData.pillars.information_sharing.percent),
        },
      ],
      gaps: {
        total: complianceData.gaps.total,
        met: complianceData.gaps.met,
        critical: complianceData.gaps.critical,
        high: complianceData.gaps.high,
      },
      critical_gaps: complianceData.critical_gaps,
      estimated_weeks: complianceData.estimated_weeks,
      last_updated: new Date().toISOString(),
    };

    return { success: true, data: dashboardData };
  } catch (error) {
    console.error('[getDORADashboardData] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dashboard data',
    };
  }
}

function formatSnapshotToDashboardData(snapshot: MaturitySnapshot): DORADashboardData {
  return {
    overall_percent: snapshot.overall_readiness_percent,
    overall_level: snapshot.overall_maturity_level as MaturityLevel,
    pillars: [
      {
        id: 'ict_risk',
        name: 'ICT Risk Management',
        articles: 'Articles 5-16',
        percent: snapshot.pillar_ict_risk_mgmt_percent || 0,
        level: snapshot.pillar_ict_risk_mgmt as MaturityLevel,
        status: getStatusFromPercent(snapshot.pillar_ict_risk_mgmt_percent || 0),
      },
      {
        id: 'incident',
        name: 'Incident Reporting',
        articles: 'Articles 17-23',
        percent: snapshot.pillar_incident_reporting_percent || 0,
        level: snapshot.pillar_incident_reporting as MaturityLevel,
        status: getStatusFromPercent(snapshot.pillar_incident_reporting_percent || 0),
      },
      {
        id: 'testing',
        name: 'Resilience Testing',
        articles: 'Articles 24-27',
        percent: snapshot.pillar_resilience_testing_percent || 0,
        level: snapshot.pillar_resilience_testing as MaturityLevel,
        status: getStatusFromPercent(snapshot.pillar_resilience_testing_percent || 0),
      },
      {
        id: 'tprm',
        name: 'Third Party Risk',
        articles: 'Articles 28-44',
        percent: snapshot.pillar_third_party_risk_percent || 0,
        level: snapshot.pillar_third_party_risk as MaturityLevel,
        status: getStatusFromPercent(snapshot.pillar_third_party_risk_percent || 0),
      },
      {
        id: 'sharing',
        name: 'Information Sharing',
        articles: 'Article 45',
        percent: snapshot.pillar_info_sharing_percent || 0,
        level: snapshot.pillar_info_sharing as MaturityLevel,
        status: getStatusFromPercent(snapshot.pillar_info_sharing_percent || 0),
      },
    ],
    gaps: {
      total: snapshot.total_requirements,
      met: snapshot.requirements_met,
      critical: snapshot.critical_gaps_count,
      high: snapshot.high_gaps_count || 0,
    },
    critical_gaps: (snapshot.critical_gaps as CriticalGap[]) || [],
    estimated_weeks: snapshot.estimated_remediation_weeks || undefined,
    last_updated: snapshot.created_at,
  };
}

function getStatusFromPercent(percent: number): 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' {
  if (percent >= 75) return 'compliant';
  if (percent >= 40) return 'partial';
  if (percent > 0) return 'non_compliant';
  return 'not_assessed';
}

function getDefaultPillars() {
  return [
    { id: 'ict_risk', name: 'ICT Risk Management', articles: 'Articles 5-16', percent: 0, level: 0 as MaturityLevel, status: 'not_assessed' as const },
    { id: 'incident', name: 'Incident Reporting', articles: 'Articles 17-23', percent: 0, level: 0 as MaturityLevel, status: 'not_assessed' as const },
    { id: 'testing', name: 'Resilience Testing', articles: 'Articles 24-27', percent: 0, level: 0 as MaturityLevel, status: 'not_assessed' as const },
    { id: 'tprm', name: 'Third Party Risk', articles: 'Articles 28-44', percent: 0, level: 0 as MaturityLevel, status: 'not_assessed' as const },
    { id: 'sharing', name: 'Information Sharing', articles: 'Article 45', percent: 0, level: 0 as MaturityLevel, status: 'not_assessed' as const },
  ];
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
