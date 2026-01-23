/**
 * DORA Compliance Constants
 *
 * Centralized configuration for DORA (Digital Operational Resilience Act)
 * compliance calculations. All thresholds, deadlines, and scoring parameters
 * should be defined here to ensure consistency across the platform.
 *
 * Reference: Regulation (EU) 2022/2554
 */

import type { RiskLevel } from '@/lib/constants/ui';

// Re-export for backwards compatibility
export type { RiskLevel };

// ============================================
// MATURITY LEVELS
// ============================================

/**
 * Maturity level thresholds (percentage-based)
 * L3 (75%) represents DORA minimum compliance
 */
export const MATURITY_THRESHOLDS = {
  L4: 90, // Optimized - exceeds DORA requirements
  L3: 75, // Managed - meets DORA requirements
  L2: 50, // Defined - partial compliance
  L1: 25, // Initial - basic compliance
  L0: 0,  // Non-existent - no compliance
} as const;

export type MaturityLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Convert percentage score to maturity level
 */
export function percentToMaturityLevel(percent: number): MaturityLevel {
  if (percent >= MATURITY_THRESHOLDS.L4) return 4;
  if (percent >= MATURITY_THRESHOLDS.L3) return 3;
  if (percent >= MATURITY_THRESHOLDS.L2) return 2;
  if (percent >= MATURITY_THRESHOLDS.L1) return 1;
  return 0;
}

/**
 * Maturity level labels for display
 */
export const MATURITY_LABELS: Record<MaturityLevel, string> = {
  0: 'Non-existent',
  1: 'Initial',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized',
};

// ============================================
// INCIDENT REPORTING DEADLINES (Article 19)
// ============================================

/**
 * DORA incident reporting timeline requirements
 * Reference: Article 19 - Reporting of major ICT-related incidents
 */
export const INCIDENT_DEADLINES = {
  /** Initial notification to competent authority (hours) */
  INITIAL_NOTIFICATION: 4,
  /** Intermediate report deadline (hours) */
  INTERMEDIATE_REPORT: 72,
  /** Final report deadline (days) */
  FINAL_REPORT_DAYS: 30,
} as const;

// ============================================
// MTTR/MTTD SCORING (Incident Response)
// ============================================

/**
 * Mean Time To Resolve (MTTR) thresholds in hours
 * Used for scoring incident response capability
 */
export const MTTR_THRESHOLDS = {
  /** L4: Excellent - resolved in under 4 hours */
  EXCELLENT: 4,
  /** L3: Good - resolved within 24 hours */
  GOOD: 24,
  /** L2: Acceptable - resolved within 72 hours */
  ACCEPTABLE: 72,
  /** L1: Poor - resolved within 1 week */
  POOR: 168,
} as const;

/**
 * Mean Time To Detect (MTTD) thresholds in hours
 * Used for scoring incident detection capability
 */
export const MTTD_THRESHOLDS = {
  /** Excellent - detected in under 1 hour */
  EXCELLENT: 1,
  /** Good - detected within 4 hours */
  GOOD: 4,
  /** Acceptable - detected within 24 hours */
  ACCEPTABLE: 24,
  /** Poor - detected within 72 hours */
  POOR: 72,
} as const;

// ============================================
// RISK SCORING
// ============================================

/**
 * Risk level thresholds (0-100 scale)
 * Used for vendor risk assessment and overall risk scoring
 */
export const RISK_THRESHOLDS = {
  /** Critical risk: 81-100 */
  CRITICAL: 81,
  /** High risk: 61-80 */
  HIGH: 61,
  /** Medium risk: 31-60 */
  MEDIUM: 31,
  /** Low risk: 0-30 */
  LOW: 0,
} as const;

/**
 * Convert risk score to risk level
 */
export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'critical';
  if (score >= RISK_THRESHOLDS.HIGH) return 'high';
  if (score >= RISK_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

// ============================================
// THIRD-PARTY RISK MANAGEMENT (Chapter V)
// ============================================

/**
 * Herfindahl-Hirschman Index (HHI) thresholds
 * Used for measuring concentration risk in third-party providers
 * Reference: Article 28 - General principles
 */
export const HHI_THRESHOLDS = {
  /** Unconcentrated market - low risk */
  UNCONCENTRATED: 1500,
  /** Moderate concentration - medium risk */
  MODERATE: 2500,
  /** Highly concentrated - high risk (above 2500) */
} as const;

/**
 * Vendor tier definitions for DORA classification
 */
export const VENDOR_TIERS = {
  CRITICAL: 'critical',
  IMPORTANT: 'important',
  STANDARD: 'standard',
} as const;

// ============================================
// RESILIENCE TESTING (Article 24-27)
// ============================================

/**
 * TLPT (Threat-Led Penetration Testing) requirements
 * Reference: Article 26
 */
export const TLPT_REQUIREMENTS = {
  /** Maximum years between TLPT exercises */
  FREQUENCY_YEARS: 3,
  /** Required tester certifications for TLPT */
  REQUIRED_CERTIFICATIONS: ['CREST', 'TIBER-EU', 'CBEST', 'iCAST', 'STAR-FS'],
} as const;

/**
 * Required resilience test types for full coverage
 * Reference: Article 24 - General requirements for ICT testing
 */
export const REQUIRED_TEST_TYPES = [
  'vulnerability_assessment',
  'penetration_testing',
  'scenario_based',
  'red_team',
  'disaster_recovery',
  'business_continuity',
  'tabletop_exercise',
  'backup_restoration',
  'failover_testing',
  'communication_testing',
] as const;

export type ResilienceTestType = (typeof REQUIRED_TEST_TYPES)[number];

// ============================================
// CERTIFICATION SCORING
// ============================================

/**
 * Certification quality weights for vendor assessment
 * Higher weight = more valuable certification
 */
export const CERTIFICATION_WEIGHTS: Record<string, number> = {
  // SOC 2 Type II is the gold standard
  'SOC 2 Type II': 100,
  'SOC2 Type II': 100,
  'SOC2-II': 100,

  // SOC 2 Type I (point-in-time)
  'SOC 2 Type I': 75,
  'SOC2 Type I': 75,
  'SOC2-I': 75,

  // ISO certifications
  'ISO 27001': 80,
  'ISO27001': 80,
  'ISO 27017': 70,
  'ISO 27018': 70,
  'ISO 22301': 65,

  // Other certifications
  'PCI DSS': 60,
  'HIPAA': 55,
  'FedRAMP': 50,
  'CSA STAR': 45,
};

/**
 * Get certification weight, defaulting to base value for unknown certs
 */
export function getCertificationWeight(certType: string): number {
  // Normalize certification name
  const normalized = certType.toUpperCase().replace(/\s+/g, ' ').trim();

  // Check for exact match first
  if (CERTIFICATION_WEIGHTS[certType]) {
    return CERTIFICATION_WEIGHTS[certType];
  }

  // Check for partial matches
  for (const [key, weight] of Object.entries(CERTIFICATION_WEIGHTS)) {
    if (normalized.includes(key.toUpperCase())) {
      return weight;
    }
  }

  // Default weight for unknown certifications
  return 30;
}

// ============================================
// INCIDENT CLASSIFICATION (Article 18)
// ============================================

/**
 * Major incident thresholds
 * Reference: Article 18 - Classification of ICT-related incidents
 */
export const MAJOR_INCIDENT_THRESHOLDS = {
  /** Clients affected percentage threshold */
  CLIENTS_AFFECTED_PERCENT: 10,
  /** Transaction value threshold (EUR) */
  TRANSACTION_VALUE: 1_000_000,
  /** Duration threshold (hours) */
  DURATION_HOURS: 2,
  /** Data breach automatically triggers major */
  DATA_BREACH: true,
} as const;

// ============================================
// PILLAR WEIGHTS
// ============================================

/**
 * DORA five pillars with their relative weights
 * Used for calculating overall compliance score
 */
export const PILLAR_WEIGHTS = {
  ICT_RISK_MANAGEMENT: 25,
  INCIDENT_REPORTING: 25,
  RESILIENCE_TESTING: 20,
  THIRD_PARTY_RISK: 20,
  INFORMATION_SHARING: 10,
} as const;

/**
 * Pillar identifiers
 */
export const PILLARS = {
  ICT_RISK_MANAGEMENT: 'ict_risk_management',
  INCIDENT_REPORTING: 'incident_reporting',
  RESILIENCE_TESTING: 'resilience_testing',
  THIRD_PARTY_RISK: 'third_party_risk',
  INFORMATION_SHARING: 'information_sharing',
} as const;

export type PillarId = (typeof PILLARS)[keyof typeof PILLARS];

// ============================================
// ASSESSMENT FRESHNESS
// ============================================

/**
 * Assessment freshness thresholds in days
 * Used for scoring how recent vendor assessments are
 */
export const ASSESSMENT_FRESHNESS = {
  /** Fresh - assessed within last 90 days */
  FRESH_DAYS: 90,
  /** Recent - assessed within last 180 days */
  RECENT_DAYS: 180,
  /** Stale - assessed within last 365 days */
  STALE_DAYS: 365,
  /** Outdated - over 365 days (requires reassessment) */
} as const;
