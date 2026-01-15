/**
 * DORA Compliance Metrics Calculations
 *
 * Reusable calculation functions for DORA KPIs including:
 * - MTTR (Mean Time To Resolve)
 * - MTTD (Mean Time To Detect)
 * - HHI (Herfindahl-Hirschman Index for concentration risk)
 * - Timeline compliance
 * - Certification scoring
 * - TLPT compliance
 * - CVSS-weighted remediation
 *
 * These functions are used by maturity-history.ts for snapshots
 * and can be reused in dashboards, reports, and real-time displays.
 */

import {
  MTTR_THRESHOLDS,
  MTTD_THRESHOLDS,
  HHI_THRESHOLDS,
  TLPT_REQUIREMENTS,
  getCertificationWeight,
} from './dora-constants';

// ============================================
// INCIDENT RESPONSE METRICS
// ============================================

/**
 * Incident data shape for MTTR calculation
 */
export interface IncidentForMTTR {
  duration_hours: number | null;
}

/**
 * Calculate Mean Time To Resolve (MTTR) from incidents
 * @param incidents - Array of incidents with duration_hours
 * @returns Average hours to resolve, or null if no data
 */
export function calculateMTTR(incidents: IncidentForMTTR[]): number | null {
  const incidentsWithDuration = incidents.filter(
    (i) => i.duration_hours !== null && i.duration_hours > 0
  );

  if (incidentsWithDuration.length === 0) return null;

  const totalHours = incidentsWithDuration.reduce(
    (sum, i) => sum + (i.duration_hours ?? 0),
    0
  );

  return totalHours / incidentsWithDuration.length;
}

/**
 * Score MTTR on 0-100 scale based on DORA thresholds
 * @param mttr - Mean time to resolve in hours
 * @returns Score from 0-100
 */
export function scoreMTTR(mttr: number | null): number {
  if (mttr === null) return 40; // Base score if no data

  if (mttr < MTTR_THRESHOLDS.EXCELLENT) return 100; // < 4 hours
  if (mttr < MTTR_THRESHOLDS.GOOD) return 80;       // < 24 hours
  if (mttr < MTTR_THRESHOLDS.ACCEPTABLE) return 60; // < 72 hours
  if (mttr < MTTR_THRESHOLDS.POOR) return 40;       // < 168 hours

  return 20; // > 168 hours
}

/**
 * Incident data shape for MTTD calculation
 */
export interface IncidentForMTTD {
  occurrence_datetime: string | null;
  detection_datetime: string | null;
}

/**
 * Calculate Mean Time To Detect (MTTD) from incidents
 * @param incidents - Array of incidents with occurrence and detection times
 * @returns Average hours to detect, or null if no data
 */
export function calculateMTTD(incidents: IncidentForMTTD[]): number | null {
  const incidentsWithDates = incidents.filter(
    (i) => i.occurrence_datetime && i.detection_datetime
  );

  if (incidentsWithDates.length === 0) return null;

  let totalHours = 0;
  for (const incident of incidentsWithDates) {
    const occurred = new Date(incident.occurrence_datetime!).getTime();
    const detected = new Date(incident.detection_datetime!).getTime();
    totalHours += Math.max(0, (detected - occurred) / (1000 * 60 * 60));
  }

  return totalHours / incidentsWithDates.length;
}

/**
 * Score MTTD on 0-100 scale based on DORA thresholds
 * @param mttd - Mean time to detect in hours
 * @returns Score from 0-100
 */
export function scoreMTTD(mttd: number | null): number {
  if (mttd === null) return 40; // Base score if no data

  if (mttd < MTTD_THRESHOLDS.EXCELLENT) return 100; // < 1 hour
  if (mttd < MTTD_THRESHOLDS.GOOD) return 80;       // < 4 hours
  if (mttd < MTTD_THRESHOLDS.ACCEPTABLE) return 60; // < 24 hours
  if (mttd < MTTD_THRESHOLDS.POOR) return 40;       // < 72 hours

  return 20; // > 72 hours
}

// ============================================
// TIMELINE COMPLIANCE
// ============================================

/**
 * Incident report data shape for timeline compliance
 */
export interface IncidentReportForTimeline {
  submitted_at: string | null;
  deadline: string | null;
}

/**
 * Check timeline compliance for incident reports
 * @param reports - Array of incident reports with submission and deadline dates
 * @returns Percentage of reports submitted on time (0-100)
 */
export function checkTimelineCompliance(
  reports: IncidentReportForTimeline[]
): number {
  const reportsWithDates = reports.filter(
    (r) => r.submitted_at && r.deadline
  );

  if (reportsWithDates.length === 0) return 50; // Base score if no data

  let onTimeCount = 0;
  for (const report of reportsWithDates) {
    const submitted = new Date(report.submitted_at!).getTime();
    const deadline = new Date(report.deadline!).getTime();
    if (submitted <= deadline) {
      onTimeCount++;
    }
  }

  return (onTimeCount / reportsWithDates.length) * 100;
}

// ============================================
// CONCENTRATION RISK (HHI)
// ============================================

/**
 * Vendor data shape for HHI calculation
 */
export interface VendorForHHI {
  total_annual_expense?: number | null;
}

/**
 * Calculate Herfindahl-Hirschman Index for concentration risk
 * @param vendors - Array of vendors with annual expense data
 * @returns Score from 0-100 (100 = well diversified, 0 = single vendor)
 */
export function calculateHHI(vendors: VendorForHHI[]): number {
  const vendorsWithSpend = vendors.filter(
    (v) => v.total_annual_expense && v.total_annual_expense > 0
  );

  if (vendorsWithSpend.length === 0) return 50; // Base score if no spend data
  if (vendorsWithSpend.length === 1) return 20; // Single vendor = high concentration

  const totalSpend = vendorsWithSpend.reduce(
    (sum, v) => sum + (v.total_annual_expense || 0),
    0
  );

  if (totalSpend === 0) return 50;

  // HHI = sum of squared market shares (as percentages)
  const hhi = vendorsWithSpend.reduce((sum, v) => {
    const share = ((v.total_annual_expense || 0) / totalSpend) * 100;
    return sum + share * share;
  }, 0);

  // Convert HHI to 0-100 score (lower HHI = better diversification = higher score)
  // HHI ranges: 10000 (monopoly) to ~0 (perfect competition)
  if (hhi < HHI_THRESHOLDS.UNCONCENTRATED) return 100;
  if (hhi < HHI_THRESHOLDS.MODERATE) {
    return Math.round(80 - ((hhi - HHI_THRESHOLDS.UNCONCENTRATED) / 1000) * 30);
  }
  return Math.max(20, Math.round(50 - ((hhi - HHI_THRESHOLDS.MODERATE) / 7500) * 30));
}

// ============================================
// CERTIFICATION SCORING
// ============================================

/**
 * Certification data shape
 */
export interface CertificationForScoring {
  certification_type?: string;
  standard?: string;
  status?: string;
  expiry_date?: string | null;
}

/**
 * Score vendor certifications based on quality and validity
 * @param certifications - Array of certifications
 * @param vendorCount - Total number of vendors for coverage calculation
 * @returns Score from 0-100
 */
export function scoreCertifications(
  certifications: CertificationForScoring[],
  vendorCount: number
): number {
  if (vendorCount === 0) return 0;
  if (certifications.length === 0) return 20; // Base score for no certs

  const now = new Date();
  let totalWeight = 0;
  let validCertCount = 0;

  for (const cert of certifications) {
    // Check if certification is valid
    const isValid =
      cert.status === 'valid' ||
      cert.status === 'active' ||
      (cert.expiry_date && new Date(cert.expiry_date) > now);

    if (!isValid) continue;

    validCertCount++;
    const certType = cert.certification_type || cert.standard || '';
    totalWeight += getCertificationWeight(certType);
  }

  if (validCertCount === 0) return 20;

  // Average weight of certifications (max 100)
  const avgWeight = Math.min(100, totalWeight / validCertCount);

  // Coverage factor (what % of vendors have any cert)
  const coverageFactor = Math.min(1, validCertCount / vendorCount);

  // Combine: 60% quality, 40% coverage
  return Math.round(avgWeight * 0.6 + coverageFactor * 100 * 0.4);
}

// ============================================
// TLPT COMPLIANCE
// ============================================

/**
 * TLPT engagement data shape
 */
export interface TLPTEngagementForCompliance {
  next_tlpt_due?: string | null;
  status?: string;
  tester_certifications?: string[];
  tester_independence_verified?: boolean;
}

/**
 * Check TLPT compliance based on DORA Article 26 requirements
 * @param engagements - Array of TLPT engagements
 * @returns Score from 0-100
 */
export function checkTLPTCompliance(
  engagements: TLPTEngagementForCompliance[]
): number {
  if (engagements.length === 0) return 0; // No TLPT = 0 score

  const now = new Date();
  const threeYearsFromNow = new Date();
  threeYearsFromNow.setFullYear(threeYearsFromNow.getFullYear() + TLPT_REQUIREMENTS.FREQUENCY_YEARS);

  let score = 0;

  for (const engagement of engagements) {
    let engagementScore = 0;

    // Check if within 3-year cycle (40 points)
    if (engagement.next_tlpt_due) {
      const nextDue = new Date(engagement.next_tlpt_due);
      if (nextDue > now && nextDue <= threeYearsFromNow) {
        engagementScore += 40;
      }
    }

    // Check status (20 points)
    if (engagement.status === 'completed' || engagement.status === 'in_progress') {
      engagementScore += 20;
    } else if (engagement.status === 'planning') {
      engagementScore += 10;
    }

    // Check tester qualifications (25 points)
    if (engagement.tester_certifications && engagement.tester_certifications.length > 0) {
      const hasRequiredCert = engagement.tester_certifications.some((cert) =>
        TLPT_REQUIREMENTS.REQUIRED_CERTIFICATIONS.some((req) =>
          cert.toUpperCase().includes(req.toUpperCase())
        )
      );
      if (hasRequiredCert) {
        engagementScore += 25;
      } else {
        engagementScore += 10; // Some certs but not required ones
      }
    }

    // Check independence verification (15 points)
    if (engagement.tester_independence_verified) {
      engagementScore += 15;
    }

    score = Math.max(score, engagementScore);
  }

  return Math.min(100, score);
}

// ============================================
// CVSS-WEIGHTED REMEDIATION
// ============================================

/**
 * Test finding data shape for remediation scoring
 */
export interface FindingForRemediation {
  cvss_score?: number | null;
  severity?: string;
  status?: string;
}

/**
 * Calculate remediation score weighted by CVSS severity
 * @param findings - Array of test findings
 * @returns Score from 0-100 (higher = better remediation)
 */
export function scoreRemediationByCVSS(findings: FindingForRemediation[]): number {
  if (findings.length === 0) return 80; // No findings = good (but not perfect)

  let totalWeight = 0;
  let remediatedWeight = 0;

  for (const finding of findings) {
    // Use CVSS score if available, otherwise estimate from severity
    const weight = finding.cvss_score ?? getSeverityWeight(finding.severity);

    totalWeight += weight;

    // Check if remediated
    if (finding.status === 'closed' || finding.status === 'remediated') {
      remediatedWeight += weight;
    } else if (finding.status === 'in_progress') {
      remediatedWeight += weight * 0.5; // Partial credit
    }
  }

  if (totalWeight === 0) return 80;

  return Math.round((remediatedWeight / totalWeight) * 100);
}

/**
 * Get weight from severity string when CVSS is not available
 */
function getSeverityWeight(severity?: string): number {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 10;
    case 'high':
      return 7.5;
    case 'medium':
      return 5;
    case 'low':
      return 2.5;
    default:
      return 5;
  }
}

// ============================================
// TEST COVERAGE
// ============================================

import { REQUIRED_TEST_TYPES, type ResilienceTestType } from './dora-constants';

/**
 * Calculate test type coverage percentage
 * @param completedTestTypes - Array of test types that have been completed
 * @returns Percentage of required test types covered (0-100)
 */
export function calculateTestCoverage(completedTestTypes: string[]): number {
  if (completedTestTypes.length === 0) return 0;

  const uniqueTypes = new Set(completedTestTypes.map((t) => t.toLowerCase()));
  const requiredTypes = new Set(REQUIRED_TEST_TYPES.map((t) => t.toLowerCase()));

  let coveredCount = 0;
  for (const type of requiredTypes) {
    if (uniqueTypes.has(type)) {
      coveredCount++;
    }
  }

  return Math.round((coveredCount / REQUIRED_TEST_TYPES.length) * 100);
}

/**
 * Get missing test types for full coverage
 * @param completedTestTypes - Array of test types that have been completed
 * @returns Array of test types that are still needed
 */
export function getMissingTestTypes(completedTestTypes: string[]): ResilienceTestType[] {
  const uniqueTypes = new Set(completedTestTypes.map((t) => t.toLowerCase()));

  return REQUIRED_TEST_TYPES.filter(
    (type) => !uniqueTypes.has(type.toLowerCase())
  );
}

// ============================================
// UTILITY EXPORTS
// ============================================

/**
 * Combined incident data for all metrics
 */
export interface IncidentMetricsData extends IncidentForMTTR, IncidentForMTTD {}

/**
 * Calculate all incident metrics at once
 */
export function calculateIncidentMetrics(incidents: IncidentMetricsData[]): {
  mttr: number | null;
  mttrScore: number;
  mttd: number | null;
  mttdScore: number;
} {
  const mttr = calculateMTTR(incidents);
  const mttd = calculateMTTD(incidents);

  return {
    mttr,
    mttrScore: scoreMTTR(mttr),
    mttd,
    mttdScore: scoreMTTD(mttd),
  };
}
