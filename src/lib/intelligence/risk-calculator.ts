/**
 * Intelligence Risk Calculator
 *
 * Calculates a unified risk score by compounding data from multiple sources:
 * - News sentiment and alerts (NewsAPI)
 * - Breach exposure (HIBP)
 * - SEC filings (SEC EDGAR / sec-api.io)
 * - Cyber risk ratings (SecurityScorecard)
 *
 * Scoring Philosophy:
 * - Higher score = Higher risk (0-100 scale)
 * - Recent events weighted more heavily than old ones
 * - Critical alerts have exponential impact
 * - Trend detection for early warning
 */

import { VendorNewsAlert, IntelligenceSeverity } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface RiskScoreComponent {
  score: number; // 0-100
  weight: number; // 0-1
  alertCount: number;
  criticalCount: number;
  highCount: number;
  latestAlertDate: string | null;
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  impact: number; // 0-100
  description: string;
  source: string;
  date?: string;
}

export interface VendorRiskScore {
  // Component scores (0-100, higher = more risk)
  newsRiskScore: number;
  breachRiskScore: number;
  filingRiskScore: number;
  cyberRiskScore: number;

  // Composite
  compositeScore: number;
  riskLevel: IntelligenceSeverity;

  // Trend
  previousScore: number | null;
  scoreTrend: 'improving' | 'stable' | 'degrading';
  trendChange: number;

  // Counts
  criticalAlertCount: number;
  highAlertCount: number;
  unresolvedAlertCount: number;

  // Details
  topRiskFactors: RiskFactor[];
  calculationDetails: {
    newsComponent: RiskScoreComponent;
    breachComponent: RiskScoreComponent;
    filingComponent: RiskScoreComponent;
    cyberComponent: RiskScoreComponent;
  };

  // Metadata
  calculatedAt: string;
  version: string;
}

export interface RiskCalculationConfig {
  // Weights (must sum to 1.0)
  newsWeight: number;
  breachWeight: number;
  filingWeight: number;
  cyberWeight: number;

  // Decay settings
  criticalDecayDays: number; // Days before critical alert loses weight
  highDecayDays: number;
  maxAlertAgeDays: number; // Ignore alerts older than this

  // Thresholds
  criticalThreshold: number; // Score above this = critical
  highThreshold: number;
  mediumThreshold: number;

  // Escalation
  alertStormCount: number; // # of alerts in timeframe to trigger storm
  alertStormDays: number;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

export const DEFAULT_RISK_CONFIG: RiskCalculationConfig = {
  // Weights optimized for TPRM compliance focus
  newsWeight: 0.20, // News is useful but can have false positives
  breachWeight: 0.35, // Breaches are high-impact security events
  filingWeight: 0.15, // SEC filings matter for financial health
  cyberWeight: 0.30, // SecurityScorecard provides technical risk view

  // Temporal decay
  criticalDecayDays: 30, // Critical alerts stay relevant for 30 days
  highDecayDays: 60,
  maxAlertAgeDays: 365, // Ignore alerts older than 1 year

  // Risk level thresholds
  criticalThreshold: 75,
  highThreshold: 50,
  mediumThreshold: 25,

  // Alert storm detection
  alertStormCount: 5,
  alertStormDays: 7,
};

// =============================================================================
// SEVERITY WEIGHTS
// =============================================================================

const SEVERITY_WEIGHTS: Record<IntelligenceSeverity, number> = {
  critical: 100,
  high: 70,
  medium: 40,
  low: 15,
};

const ALERT_TYPE_WEIGHTS: Record<string, number> = {
  breach: 1.5, // Breaches are most severe
  regulatory: 1.3, // Regulatory issues are serious
  financial: 1.2, // Financial problems matter
  filing: 1.1, // SEC filings are informational but important
  leadership: 0.9, // Leadership changes are contextual
  news: 0.7, // General news has most false positives
};

// =============================================================================
// CORE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate temporal decay factor (0-1)
 * Recent events have factor close to 1, old events approach 0
 */
function calculateDecayFactor(
  alertDate: string | null,
  decayDays: number,
  maxAgeDays: number
): number {
  if (!alertDate) return 0;

  const now = new Date();
  const alertTime = new Date(alertDate);
  const ageInDays = (now.getTime() - alertTime.getTime()) / (1000 * 60 * 60 * 24);

  // Ignore alerts older than max age
  if (ageInDays > maxAgeDays) return 0;

  // Within decay period: full weight
  if (ageInDays <= decayDays) return 1;

  // After decay period: linear decay to 0 at max age
  const remainingDays = maxAgeDays - decayDays;
  const decayProgress = (ageInDays - decayDays) / remainingDays;
  return Math.max(0, 1 - decayProgress);
}

/**
 * Calculate risk score from a set of alerts
 */
function calculateAlertRiskScore(
  alerts: VendorNewsAlert[],
  config: RiskCalculationConfig
): RiskScoreComponent {
  if (alerts.length === 0) {
    return {
      score: 0,
      weight: 0,
      alertCount: 0,
      criticalCount: 0,
      highCount: 0,
      latestAlertDate: null,
      factors: [],
    };
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;
  const factors: RiskFactor[] = [];
  let criticalCount = 0;
  let highCount = 0;

  // Sort by date descending (most recent first)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const dateA = new Date(a.published_at || a.created_at).getTime();
    const dateB = new Date(b.published_at || b.created_at).getTime();
    return dateB - dateA;
  });

  for (const alert of sortedAlerts) {
    const severity = alert.severity as IntelligenceSeverity;
    const alertType = alert.alert_type || 'news';
    const alertDate = alert.published_at || alert.created_at;

    // Count severity levels
    if (severity === 'critical') criticalCount++;
    if (severity === 'high') highCount++;

    // Calculate decay based on severity
    const decayDays =
      severity === 'critical'
        ? config.criticalDecayDays
        : severity === 'high'
        ? config.highDecayDays
        : config.highDecayDays * 1.5;

    const decayFactor = calculateDecayFactor(
      alertDate,
      decayDays,
      config.maxAlertAgeDays
    );

    // Skip if fully decayed
    if (decayFactor === 0) continue;

    // Calculate weighted score for this alert
    const severityWeight = SEVERITY_WEIGHTS[severity] || 15;
    const typeWeight = ALERT_TYPE_WEIGHTS[alertType] || 1.0;
    const alertScore = severityWeight * typeWeight * decayFactor;

    totalWeightedScore += alertScore;
    totalWeight += decayFactor;

    // Track top risk factors (limit to most impactful)
    if (factors.length < 5 && (severity === 'critical' || severity === 'high')) {
      factors.push({
        name: alert.headline,
        impact: alertScore,
        description: alert.summary || '',
        source: alert.source,
        date: alertDate,
      });
    }
  }

  // Normalize to 0-100 scale
  // Max possible single alert score: 100 * 1.5 * 1 = 150
  // We want multiple alerts to compound but not exceed 100
  const normalizedScore = Math.min(100, (totalWeightedScore / Math.max(1, totalWeight)) * 0.8);

  // Apply alert storm multiplier
  const recentAlerts = alerts.filter((a) => {
    const date = new Date(a.published_at || a.created_at);
    const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= config.alertStormDays;
  });

  const stormMultiplier =
    recentAlerts.length >= config.alertStormCount
      ? 1 + (recentAlerts.length - config.alertStormCount) * 0.1
      : 1;

  const finalScore = Math.min(100, normalizedScore * stormMultiplier);

  return {
    score: Math.round(finalScore * 100) / 100,
    weight: totalWeight,
    alertCount: alerts.length,
    criticalCount,
    highCount,
    latestAlertDate: sortedAlerts[0]?.published_at || sortedAlerts[0]?.created_at || null,
    factors,
  };
}

/**
 * Calculate news-specific risk score
 */
export function calculateNewsRiskScore(
  alerts: VendorNewsAlert[],
  config: RiskCalculationConfig = DEFAULT_RISK_CONFIG
): RiskScoreComponent {
  const newsAlerts = alerts.filter((a) => a.source === 'newsapi');
  return calculateAlertRiskScore(newsAlerts, config);
}

/**
 * Calculate breach-specific risk score
 */
export function calculateBreachRiskScore(
  alerts: VendorNewsAlert[],
  breachCount: number | null,
  breachSeverity: string | null,
  config: RiskCalculationConfig = DEFAULT_RISK_CONFIG
): RiskScoreComponent {
  const breachAlerts = alerts.filter((a) => a.source === 'hibp');
  const component = calculateAlertRiskScore(breachAlerts, config);

  // Factor in total breach count even if not all are alerts
  if (breachCount && breachCount > 0) {
    const countFactor = Math.min(1, breachCount / 10) * 30; // Up to 30 points for breach count
    const severityBonus =
      breachSeverity === 'critical'
        ? 20
        : breachSeverity === 'high'
        ? 10
        : 0;
    component.score = Math.min(100, component.score + countFactor + severityBonus);
  }

  return component;
}

/**
 * Calculate filing-specific risk score
 */
export function calculateFilingRiskScore(
  alerts: VendorNewsAlert[],
  config: RiskCalculationConfig = DEFAULT_RISK_CONFIG
): RiskScoreComponent {
  const filingAlerts = alerts.filter((a) => a.source === 'sec_edgar');
  return calculateAlertRiskScore(filingAlerts, config);
}

/**
 * Calculate cyber risk score from SecurityScorecard
 * Note: SSC score is 0-100 where higher is BETTER
 * We invert it so higher = more risk
 */
export function calculateCyberRiskScore(
  sscScore: number | null,
  sscGrade: string | null
): RiskScoreComponent {
  if (sscScore === null) {
    return {
      score: 0,
      weight: 0, // No weight if no data
      alertCount: 0,
      criticalCount: 0,
      highCount: 0,
      latestAlertDate: null,
      factors: [],
    };
  }

  // Invert: SSC 90 (good) -> Risk 10, SSC 40 (bad) -> Risk 60
  const invertedScore = 100 - sscScore;

  const factors: RiskFactor[] = [];
  if (invertedScore >= 50) {
    factors.push({
      name: `SecurityScorecard Grade: ${sscGrade || 'N/A'}`,
      impact: invertedScore,
      description: `External cyber risk rating indicates elevated risk`,
      source: 'securityscorecard',
    });
  }

  return {
    score: invertedScore,
    weight: 1, // Full weight if we have data
    alertCount: 0,
    criticalCount: invertedScore >= 70 ? 1 : 0,
    highCount: invertedScore >= 50 && invertedScore < 70 ? 1 : 0,
    latestAlertDate: null,
    factors,
  };
}

/**
 * Calculate composite risk score from all components
 */
export function calculateCompositeScore(
  components: {
    news: RiskScoreComponent;
    breach: RiskScoreComponent;
    filing: RiskScoreComponent;
    cyber: RiskScoreComponent;
  },
  config: RiskCalculationConfig = DEFAULT_RISK_CONFIG
): number {
  // Adjust weights based on data availability
  let totalWeight = 0;
  let weightedSum = 0;

  const addComponent = (
    component: RiskScoreComponent,
    baseWeight: number
  ) => {
    // Only include if we have data
    if (component.alertCount > 0 || component.weight > 0) {
      const adjustedWeight = baseWeight * (component.weight > 0 ? 1 : 0.5);
      weightedSum += component.score * adjustedWeight;
      totalWeight += adjustedWeight;
    }
  };

  addComponent(components.news, config.newsWeight);
  addComponent(components.breach, config.breachWeight);
  addComponent(components.filing, config.filingWeight);
  addComponent(components.cyber, config.cyberWeight);

  if (totalWeight === 0) return 0;

  // Calculate weighted average
  let composite = weightedSum / totalWeight;

  // Apply critical alert escalation
  const totalCritical =
    components.news.criticalCount +
    components.breach.criticalCount +
    components.filing.criticalCount +
    components.cyber.criticalCount;

  if (totalCritical >= 3) {
    composite = Math.min(100, composite * 1.3); // 30% escalation for 3+ critical
  } else if (totalCritical >= 1) {
    composite = Math.min(100, composite * 1.15); // 15% escalation for any critical
  }

  return Math.round(composite * 100) / 100;
}

/**
 * Determine risk level from score
 */
export function scoreToRiskLevel(
  score: number,
  config: RiskCalculationConfig = DEFAULT_RISK_CONFIG
): IntelligenceSeverity {
  if (score >= config.criticalThreshold) return 'critical';
  if (score >= config.highThreshold) return 'high';
  if (score >= config.mediumThreshold) return 'medium';
  return 'low';
}

/**
 * Calculate trend from previous score
 */
export function calculateTrend(
  currentScore: number,
  previousScore: number | null
): { trend: 'improving' | 'stable' | 'degrading'; change: number } {
  if (previousScore === null) {
    return { trend: 'stable', change: 0 };
  }

  const change = currentScore - previousScore;
  const absChange = Math.abs(change);

  // Need at least 5 points change to be significant
  if (absChange < 5) {
    return { trend: 'stable', change };
  }

  // Positive change = score went up = risk increased = degrading
  // Negative change = score went down = risk decreased = improving
  return {
    trend: change > 0 ? 'degrading' : 'improving',
    change: Math.round(change * 100) / 100,
  };
}

/**
 * Main function: Calculate complete vendor risk score
 */
export function calculateVendorRiskScore(
  alerts: VendorNewsAlert[],
  vendorData: {
    breachCount?: number | null;
    breachSeverity?: string | null;
    sscScore?: number | null;
    sscGrade?: string | null;
    previousScore?: number | null;
  },
  config: RiskCalculationConfig = DEFAULT_RISK_CONFIG
): VendorRiskScore {
  // Calculate component scores
  const newsComponent = calculateNewsRiskScore(alerts, config);
  const breachComponent = calculateBreachRiskScore(
    alerts,
    vendorData.breachCount || null,
    vendorData.breachSeverity || null,
    config
  );
  const filingComponent = calculateFilingRiskScore(alerts, config);
  const cyberComponent = calculateCyberRiskScore(
    vendorData.sscScore || null,
    vendorData.sscGrade || null
  );

  // Calculate composite
  const compositeScore = calculateCompositeScore(
    {
      news: newsComponent,
      breach: breachComponent,
      filing: filingComponent,
      cyber: cyberComponent,
    },
    config
  );

  const riskLevel = scoreToRiskLevel(compositeScore, config);
  const { trend, change } = calculateTrend(compositeScore, vendorData.previousScore || null);

  // Aggregate top risk factors
  const allFactors = [
    ...newsComponent.factors,
    ...breachComponent.factors,
    ...filingComponent.factors,
    ...cyberComponent.factors,
  ].sort((a, b) => b.impact - a.impact);

  // Count alerts
  const unresolvedAlerts = alerts.filter(
    (a) => !a.is_dismissed && a.action_status !== 'resolved'
  );

  return {
    newsRiskScore: newsComponent.score,
    breachRiskScore: breachComponent.score,
    filingRiskScore: filingComponent.score,
    cyberRiskScore: cyberComponent.score,

    compositeScore,
    riskLevel,

    previousScore: vendorData.previousScore || null,
    scoreTrend: trend,
    trendChange: change,

    criticalAlertCount:
      newsComponent.criticalCount +
      breachComponent.criticalCount +
      filingComponent.criticalCount +
      cyberComponent.criticalCount,
    highAlertCount:
      newsComponent.highCount +
      breachComponent.highCount +
      filingComponent.highCount +
      cyberComponent.highCount,
    unresolvedAlertCount: unresolvedAlerts.length,

    topRiskFactors: allFactors.slice(0, 5),

    calculationDetails: {
      newsComponent,
      breachComponent,
      filingComponent,
      cyberComponent,
    },

    calculatedAt: new Date().toISOString(),
    version: 'v1.0',
  };
}
