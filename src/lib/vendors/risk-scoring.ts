/**
 * Vendor Risk Scoring Algorithm
 *
 * Calculates a unified risk score (0-100) by combining:
 * 1. External cyber risk (SecurityScorecard)
 * 2. DORA compliance maturity
 * 3. Concentration/substitutability risk
 * 4. Assessment freshness
 * 5. Tier-based criticality
 *
 * Higher score = Higher risk
 * - 0-30: Low risk (green)
 * - 31-60: Medium risk (yellow)
 * - 61-80: High risk (orange)
 * - 81-100: Critical risk (red)
 */

import type { Vendor, VendorTier } from './types';

// =============================================================================
// Types
// =============================================================================

export interface RiskScoreInput {
  vendor: Vendor;
  // Optional additional data
  doraMaturityLevel?: number | null; // 0-4 scale from DORA compliance
  doraCompliancePercentage?: number | null; // 0-100
  hasSOC2Report?: boolean;
  soc2Opinion?: 'unqualified' | 'qualified' | 'adverse' | null;
  soc2ExceptionCount?: number;
  concentrationAlertCount?: number;
  isSinglePointOfFailure?: boolean;
}

export interface RiskScoreResult {
  totalScore: number; // 0-100 (higher = more risk)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  components: RiskComponentBreakdown;
  recommendations: string[];
  lastCalculated: string;
}

export interface RiskComponentBreakdown {
  externalRisk: RiskComponent;
  complianceRisk: RiskComponent;
  concentrationRisk: RiskComponent;
  freshnessRisk: RiskComponent;
  tierRisk: RiskComponent;
}

export interface RiskComponent {
  score: number; // Component score (0-100)
  weight: number; // Weight as percentage
  weightedScore: number; // score * weight
  factors: string[]; // Factors that contributed
}

// =============================================================================
// Weights Configuration
// =============================================================================

// These weights should sum to 1.0 (100%)
const RISK_WEIGHTS = {
  external: 0.25, // SecurityScorecard or similar
  compliance: 0.30, // DORA maturity, SOC2 findings
  concentration: 0.20, // SPOF, substitutability
  freshness: 0.10, // Assessment age
  tier: 0.15, // Vendor criticality tier
} as const;

// Tier risk base scores
const TIER_RISK_BASE: Record<VendorTier, number> = {
  critical: 75, // High base risk for critical vendors
  important: 50, // Medium base risk
  standard: 25, // Low base risk
};

// Days thresholds for freshness scoring
const FRESHNESS_THRESHOLDS = {
  fresh: 90, // < 90 days = fresh (low risk)
  aging: 180, // 90-180 days = aging (medium risk)
  stale: 365, // 180-365 days = stale (high risk)
  // > 365 days = very stale (critical risk)
} as const;

// =============================================================================
// Main Calculation Function
// =============================================================================

/**
 * Calculate unified risk score for a vendor
 */
export function calculateVendorRiskScore(input: RiskScoreInput): RiskScoreResult {
  const { vendor } = input;

  // Calculate each component
  const externalRisk = calculateExternalRiskComponent(input);
  const complianceRisk = calculateComplianceRiskComponent(input);
  const concentrationRisk = calculateConcentrationRiskComponent(input);
  const freshnessRisk = calculateFreshnessRiskComponent(input);
  const tierRisk = calculateTierRiskComponent(input);

  // Sum weighted scores
  const totalScore = Math.round(
    externalRisk.weightedScore +
    complianceRisk.weightedScore +
    concentrationRisk.weightedScore +
    freshnessRisk.weightedScore +
    tierRisk.weightedScore
  );

  // Clamp to 0-100
  const clampedScore = Math.max(0, Math.min(100, totalScore));

  // Determine risk level
  const riskLevel = scoreToRiskLevel(clampedScore);

  // Generate recommendations
  const recommendations = generateRecommendations({
    vendor,
    externalRisk,
    complianceRisk,
    concentrationRisk,
    freshnessRisk,
    tierRisk,
  });

  return {
    totalScore: clampedScore,
    riskLevel,
    components: {
      externalRisk,
      complianceRisk,
      concentrationRisk,
      freshnessRisk,
      tierRisk,
    },
    recommendations,
    lastCalculated: new Date().toISOString(),
  };
}

// =============================================================================
// Component Calculations
// =============================================================================

/**
 * Calculate external risk component (SecurityScorecard, etc.)
 */
function calculateExternalRiskComponent(input: RiskScoreInput): RiskComponent {
  const { vendor } = input;
  const factors: string[] = [];
  let score = 50; // Default score when no external data

  // SecurityScorecard integration
  if (vendor.external_risk_score !== null && vendor.external_risk_score !== undefined) {
    // SSC score is 0-100 where higher = better
    // We need to invert it: higher risk score = worse
    score = 100 - vendor.external_risk_score;
    factors.push(`SecurityScorecard: ${vendor.external_risk_grade || scoreToGrade(vendor.external_risk_score)}`);

    // Check for specific issues from factors
    if (vendor.external_score_factors && Array.isArray(vendor.external_score_factors)) {
      const lowScoreFactors = (vendor.external_score_factors as Array<{ name: string; score: number }>)
        .filter(f => f.score < 70)
        .slice(0, 2);
      for (const factor of lowScoreFactors) {
        factors.push(`Low ${formatFactorName(factor.name)}: ${factor.score}`);
      }
    }
  } else if (vendor.monitoring_enabled && !vendor.monitoring_domain) {
    score = 60;
    factors.push('Monitoring enabled but no domain configured');
  } else if (!vendor.monitoring_enabled) {
    score = 50;
    factors.push('No external monitoring configured');
  }

  const weight = RISK_WEIGHTS.external;
  return {
    score,
    weight,
    weightedScore: score * weight,
    factors,
  };
}

/**
 * Calculate compliance risk component (DORA, SOC2, etc.)
 */
function calculateComplianceRiskComponent(input: RiskScoreInput): RiskComponent {
  const { vendor, doraMaturityLevel, doraCompliancePercentage, hasSOC2Report, soc2Opinion, soc2ExceptionCount } = input;
  const factors: string[] = [];
  let score = 50; // Default when no compliance data

  // DORA Maturity (most important for DORA Comply platform)
  if (doraMaturityLevel !== null && doraMaturityLevel !== undefined) {
    // Maturity 0-4, convert to risk: 0 = 100 risk, 4 = 0 risk
    const maturityRisk = (4 - doraMaturityLevel) * 25;
    score = maturityRisk;
    factors.push(`DORA Maturity Level: ${doraMaturityLevel}/4`);
  } else if (doraCompliancePercentage !== null && doraCompliancePercentage !== undefined) {
    // Alternative: use percentage directly (invert it)
    score = 100 - doraCompliancePercentage;
    factors.push(`DORA Compliance: ${doraCompliancePercentage}%`);
  }

  // SOC 2 Report quality
  if (hasSOC2Report !== undefined) {
    if (!hasSOC2Report) {
      score = Math.min(100, score + 20); // No SOC2 increases risk
      factors.push('No SOC 2 report on file');
    } else {
      // Has SOC2, check opinion
      if (soc2Opinion === 'qualified') {
        score = Math.min(100, score + 15);
        factors.push('SOC 2: Qualified opinion');
      } else if (soc2Opinion === 'adverse') {
        score = Math.min(100, score + 30);
        factors.push('SOC 2: Adverse opinion');
      } else if (soc2Opinion === 'unqualified') {
        score = Math.max(0, score - 10);
        factors.push('SOC 2: Unqualified opinion');
      }

      // Exception count
      if (soc2ExceptionCount !== undefined && soc2ExceptionCount > 0) {
        const exceptionPenalty = Math.min(20, soc2ExceptionCount * 4);
        score = Math.min(100, score + exceptionPenalty);
        factors.push(`SOC 2: ${soc2ExceptionCount} exception${soc2ExceptionCount > 1 ? 's' : ''}`);
      }
    }
  }

  const weight = RISK_WEIGHTS.compliance;
  return {
    score: Math.max(0, Math.min(100, score)),
    weight,
    weightedScore: Math.max(0, Math.min(100, score)) * weight,
    factors,
  };
}

/**
 * Calculate concentration risk component (SPOF, substitutability)
 */
function calculateConcentrationRiskComponent(input: RiskScoreInput): RiskComponent {
  const { vendor, concentrationAlertCount, isSinglePointOfFailure } = input;
  const factors: string[] = [];
  let score = 20; // Base low risk

  // Single Point of Failure is critical
  if (isSinglePointOfFailure) {
    score = 85;
    factors.push('Single point of failure for critical function');
  }

  // Substitutability assessment
  if (vendor.substitutability_assessment) {
    switch (vendor.substitutability_assessment) {
      case 'not_substitutable':
        score = Math.max(score, 90);
        factors.push('Not substitutable');
        break;
      case 'substitutable_with_difficulty':
        score = Math.max(score, 60);
        factors.push('Difficult to substitute');
        break;
      case 'easily_substitutable':
        score = Math.min(score, 30);
        factors.push('Easily substitutable');
        break;
    }
  } else if (vendor.tier === 'critical') {
    // Critical vendor without assessment = higher risk
    score = Math.max(score, 50);
    factors.push('Substitutability not assessed');
  }

  // CTPP (Critical Third-Party Provider) status
  if (vendor.is_ctpp) {
    score = Math.max(score, 70);
    factors.push('Designated Critical Third-Party Provider');

    // Check CTPP-specific risks
    if (!vendor.ctpp_exit_strategy_documented) {
      score = Math.min(100, score + 10);
      factors.push('No CTPP exit strategy');
    }
  }

  // Concentration alerts
  if (concentrationAlertCount !== undefined && concentrationAlertCount > 0) {
    const alertPenalty = Math.min(20, concentrationAlertCount * 5);
    score = Math.min(100, score + alertPenalty);
    factors.push(`${concentrationAlertCount} concentration alert${concentrationAlertCount > 1 ? 's' : ''}`);
  }

  const weight = RISK_WEIGHTS.concentration;
  return {
    score: Math.max(0, Math.min(100, score)),
    weight,
    weightedScore: Math.max(0, Math.min(100, score)) * weight,
    factors,
  };
}

/**
 * Calculate freshness risk component (assessment age)
 */
function calculateFreshnessRiskComponent(input: RiskScoreInput): RiskComponent {
  const { vendor } = input;
  const factors: string[] = [];
  let score = 30; // Default moderate risk when no assessment date

  // Check last assessment date
  const assessmentDate = vendor.last_assessment_date
    ? new Date(vendor.last_assessment_date)
    : null;

  if (assessmentDate) {
    const daysSinceAssessment = Math.floor(
      (Date.now() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceAssessment < FRESHNESS_THRESHOLDS.fresh) {
      score = 10;
      factors.push(`Assessed ${daysSinceAssessment} days ago (fresh)`);
    } else if (daysSinceAssessment < FRESHNESS_THRESHOLDS.aging) {
      score = 40;
      factors.push(`Assessed ${daysSinceAssessment} days ago (aging)`);
    } else if (daysSinceAssessment < FRESHNESS_THRESHOLDS.stale) {
      score = 70;
      factors.push(`Assessed ${daysSinceAssessment} days ago (stale)`);
    } else {
      score = 90;
      factors.push(`Assessed ${daysSinceAssessment} days ago (overdue)`);
    }
  } else {
    score = 60;
    factors.push('Never assessed');
  }

  // Check external score freshness
  if (vendor.external_score_updated_at) {
    const externalDate = new Date(vendor.external_score_updated_at);
    const daysSinceExternal = Math.floor(
      (Date.now() - externalDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceExternal > 7) {
      score = Math.min(100, score + 10);
      factors.push(`External score ${daysSinceExternal} days old`);
    }
  }

  // LEI verification freshness
  if (vendor.lei && !vendor.lei_verified_at) {
    score = Math.min(100, score + 10);
    factors.push('LEI not verified');
  } else if (vendor.lei_next_renewal) {
    const renewalDate = new Date(vendor.lei_next_renewal);
    if (renewalDate < new Date()) {
      score = Math.min(100, score + 15);
      factors.push('LEI renewal overdue');
    }
  }

  const weight = RISK_WEIGHTS.freshness;
  return {
    score: Math.max(0, Math.min(100, score)),
    weight,
    weightedScore: Math.max(0, Math.min(100, score)) * weight,
    factors,
  };
}

/**
 * Calculate tier-based criticality risk component
 */
function calculateTierRiskComponent(input: RiskScoreInput): RiskComponent {
  const { vendor } = input;
  const factors: string[] = [];

  // Start with tier base score
  let score = TIER_RISK_BASE[vendor.tier];
  factors.push(`Tier: ${vendor.tier}`);

  // Critical function support increases risk
  if (vendor.supports_critical_function) {
    score = Math.min(100, score + 15);
    factors.push('Supports critical functions');

    // Count of critical functions
    const funcCount = vendor.critical_functions?.length || 0;
    if (funcCount > 3) {
      score = Math.min(100, score + 10);
      factors.push(`${funcCount} critical functions`);
    }
  }

  // Intra-group reduces risk slightly (more control)
  if (vendor.is_intra_group) {
    score = Math.max(0, score - 10);
    factors.push('Intra-group provider');
  }

  // Check status
  if (vendor.status === 'offboarding') {
    score = Math.max(0, score - 20); // Lower ongoing risk if offboarding
    factors.push('Currently offboarding');
  } else if (vendor.status === 'pending') {
    score = Math.min(100, score + 10); // Higher risk during pending review
    factors.push('Pending review');
  }

  const weight = RISK_WEIGHTS.tier;
  return {
    score: Math.max(0, Math.min(100, score)),
    weight,
    weightedScore: Math.max(0, Math.min(100, score)) * weight,
    factors,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert score to risk level
 */
function scoreToRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'critical';
}

/**
 * Convert SecurityScorecard score to grade
 */
function scoreToGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Format factor name for display
 */
function formatFactorName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Generate actionable recommendations based on risk components
 */
function generateRecommendations(data: {
  vendor: Vendor;
  externalRisk: RiskComponent;
  complianceRisk: RiskComponent;
  concentrationRisk: RiskComponent;
  freshnessRisk: RiskComponent;
  tierRisk: RiskComponent;
}): string[] {
  const { vendor, externalRisk, complianceRisk, concentrationRisk, freshnessRisk, tierRisk } = data;
  const recommendations: string[] = [];

  // External risk recommendations
  if (externalRisk.score > 60) {
    if (!vendor.monitoring_enabled) {
      recommendations.push('Enable continuous monitoring via SecurityScorecard');
    } else {
      recommendations.push('Review and address external security findings');
    }
  }

  // Compliance recommendations
  if (complianceRisk.score > 50) {
    if (complianceRisk.factors.some(f => f.includes('No SOC 2'))) {
      recommendations.push('Request SOC 2 Type II report from vendor');
    }
    if (complianceRisk.factors.some(f => f.includes('DORA Maturity Level: 0') || f.includes('DORA Maturity Level: 1'))) {
      recommendations.push('Schedule DORA compliance assessment with vendor');
    }
    if (complianceRisk.factors.some(f => f.includes('exception'))) {
      recommendations.push('Review SOC 2 exceptions and remediation plans');
    }
  }

  // Concentration recommendations
  if (concentrationRisk.score > 60) {
    if (concentrationRisk.factors.some(f => f.includes('Single point of failure'))) {
      recommendations.push('Develop exit strategy and identify alternative providers');
    }
    if (concentrationRisk.factors.some(f => f.includes('Not substitutable'))) {
      recommendations.push('Document substitution plan per DORA Article 28(8)');
    }
    if (!vendor.substitutability_assessment && vendor.tier === 'critical') {
      recommendations.push('Complete substitutability assessment');
    }
  }

  // Freshness recommendations
  if (freshnessRisk.score > 50) {
    if (freshnessRisk.factors.some(f => f.includes('Never assessed') || f.includes('overdue'))) {
      recommendations.push('Schedule vendor risk assessment');
    }
    if (freshnessRisk.factors.some(f => f.includes('LEI'))) {
      recommendations.push('Verify vendor LEI registration status');
    }
  }

  // Tier-based recommendations
  if (tierRisk.score > 70 && vendor.tier === 'critical') {
    if (!vendor.ctpp_exit_strategy_documented) {
      recommendations.push('Document exit strategy for critical vendor');
    }
    recommendations.push('Ensure enhanced due diligence per DORA Article 28');
  }

  // Limit to top 5 recommendations
  return recommendations.slice(0, 5);
}

// =============================================================================
// Batch Calculation
// =============================================================================

/**
 * Calculate risk scores for multiple vendors
 */
export function calculateBatchRiskScores(
  vendors: Vendor[],
  additionalData?: Map<string, Partial<Omit<RiskScoreInput, 'vendor'>>>
): Map<string, RiskScoreResult> {
  const results = new Map<string, RiskScoreResult>();

  for (const vendor of vendors) {
    const extra = additionalData?.get(vendor.id) || {};
    const result = calculateVendorRiskScore({ vendor, ...extra });
    results.set(vendor.id, result);
  }

  return results;
}

/**
 * Get risk distribution summary for a set of vendors
 */
export function getRiskDistribution(results: Map<string, RiskScoreResult>): {
  low: number;
  medium: number;
  high: number;
  critical: number;
  average: number;
} {
  const scores = Array.from(results.values()).map(r => r.totalScore);
  const distribution = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
    average: 0,
  };

  for (const score of scores) {
    const level = scoreToRiskLevel(score);
    distribution[level]++;
  }

  distribution.average = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  return distribution;
}
