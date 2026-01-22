/**
 * Shared Scoring Utilities
 *
 * Common scoring functions used across framework calculators.
 * Consolidates weighted scoring, status conversion, effort estimation,
 * and assessment freshness calculations.
 */

// ============================================================================
// Types
// ============================================================================

export type ComplianceLevel = 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
export type ComplianceStatus = 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type EffortLevel = 'high' | 'medium' | 'low';

export interface ScoreThresholds {
  compliant: number;
  partial: number;
  // Below partial threshold = non_compliant
  // Score of 0 = not_assessed
}

export interface WeightedItem {
  score: number;
  weight: number;
  status?: string;
}

export interface FreshnessResult {
  score: number;
  maxScore: number;
  status: 'complete' | 'partial' | 'missing';
  description: string;
  isStale: boolean;
  daysSinceAssessment: number | null;
}

// ============================================================================
// Framework-Specific Thresholds
// ============================================================================

/**
 * Score thresholds for converting numeric scores to compliance levels.
 * Different frameworks have different thresholds based on regulatory requirements.
 */
export const SCORE_THRESHOLDS = {
  /** Default thresholds: 90/60 */
  default: { compliant: 90, partial: 60 } as ScoreThresholds,

  /** DORA: 80/50 (stricter for financial entities) */
  dora: { compliant: 80, partial: 50 } as ScoreThresholds,

  /** NIS2: 75/45 */
  nis2: { compliant: 75, partial: 45 } as ScoreThresholds,

  /** Vendor scoring: 80/50 */
  vendor: { compliant: 80, partial: 50 } as ScoreThresholds,
} as const;

/**
 * Priority weights for weighted score calculations.
 * Higher priority items have higher weights.
 */
export const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Effort estimation strings per priority level.
 * Used for gap remediation time estimates.
 */
export const EFFORT_ESTIMATES: Record<PriorityLevel, string> = {
  critical: '4-8 weeks',
  high: '2-4 weeks',
  medium: '1-2 weeks',
  low: '< 1 week',
};

/**
 * Effort weeks (numeric) per priority level.
 * Used for total remediation time calculation.
 */
export const EFFORT_WEEKS: Record<PriorityLevel, number> = {
  critical: 6,
  high: 3,
  medium: 1.5,
  low: 0.5,
};

/**
 * Assessment freshness thresholds (in days).
 * Used for determining if assessments are current, aging, or stale.
 */
export const FRESHNESS_THRESHOLDS = {
  current: 90,    // < 90 days = current
  recent: 180,    // < 180 days = recent
  aging: 365,     // < 365 days = aging
  // > 365 days = stale/expired
} as const;

// ============================================================================
// Weighted Scoring Functions
// ============================================================================

/**
 * Calculate weighted average score from items with scores and weights.
 *
 * @param items - Array of items with score and weight properties
 * @param options - Optional configuration
 * @returns Weighted average score (0-100), rounded to nearest integer
 *
 * @example
 * const items = [
 *   { score: 80, weight: 4 },  // critical
 *   { score: 60, weight: 2 },  // medium
 * ];
 * calculateWeightedScore(items); // Returns 73
 */
export function calculateWeightedScore(
  items: WeightedItem[],
  options: {
    excludeNotAssessed?: boolean;
    notAssessedStatuses?: string[];
  } = {}
): number {
  const { excludeNotAssessed = false, notAssessedStatuses = ['not_assessed', 'not_applicable'] } = options;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const item of items) {
    // Skip not assessed items if configured
    if (excludeNotAssessed && item.status && notAssessedStatuses.includes(item.status)) {
      continue;
    }

    totalWeight += item.weight;
    weightedSum += item.score * item.weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Calculate weighted score from requirements with priority-based weights.
 * Convenience wrapper that applies PRIORITY_WEIGHTS automatically.
 *
 * @param items - Array of items with score and priority
 * @returns Weighted average score
 */
export function calculatePriorityWeightedScore(
  items: Array<{ score: number; priority: PriorityLevel; status?: string }>
): number {
  const weightedItems = items.map(item => ({
    score: item.score,
    weight: PRIORITY_WEIGHTS[item.priority],
    status: item.status,
  }));

  return calculateWeightedScore(weightedItems, { excludeNotAssessed: true });
}

/**
 * Sum component scores (for additive scoring like vendor compliance).
 *
 * @param components - Array of score components
 * @returns Total score
 */
export function sumComponentScores(
  components: Array<{ score: number }>
): number {
  return components.reduce((sum, c) => sum + c.score, 0);
}

// ============================================================================
// Status Conversion Functions
// ============================================================================

/**
 * Convert numeric score to compliance status using specified thresholds.
 *
 * @param score - Numeric score (0-100)
 * @param thresholds - Threshold configuration (default: 90/60)
 * @returns Compliance status string
 *
 * @example
 * scoreToComplianceStatus(95); // 'compliant'
 * scoreToComplianceStatus(70); // 'partially_compliant'
 * scoreToComplianceStatus(40); // 'non_compliant'
 * scoreToComplianceStatus(0);  // 'not_assessed'
 */
export function scoreToComplianceStatus(
  score: number,
  thresholds: ScoreThresholds = SCORE_THRESHOLDS.default
): ComplianceStatus {
  if (score >= thresholds.compliant) return 'compliant';
  if (score >= thresholds.partial) return 'partially_compliant';
  if (score > 0) return 'non_compliant';
  return 'not_assessed';
}

/**
 * Convert numeric score to compliance level (shorter labels).
 *
 * @param score - Numeric score (0-100)
 * @param thresholds - Threshold configuration
 * @returns Compliance level string
 */
export function scoreToComplianceLevel(
  score: number,
  thresholds: ScoreThresholds = SCORE_THRESHOLDS.default
): ComplianceLevel {
  if (score >= thresholds.compliant) return 'compliant';
  if (score >= thresholds.partial) return 'partial';
  if (score > 0) return 'non_compliant';
  return 'not_assessed';
}

/**
 * Framework-specific status converters for convenience.
 */
export const frameworkStatusConverters = {
  default: (score: number) => scoreToComplianceStatus(score, SCORE_THRESHOLDS.default),
  dora: (score: number) => scoreToComplianceLevel(score, SCORE_THRESHOLDS.dora),
  nis2: (score: number) => scoreToComplianceLevel(score, SCORE_THRESHOLDS.nis2),
  vendor: (score: number) => scoreToComplianceLevel(score, SCORE_THRESHOLDS.vendor),
};

// ============================================================================
// Effort Estimation Functions
// ============================================================================

/**
 * Get effort estimate string for a priority level.
 *
 * @param priority - Priority level
 * @returns Human-readable effort estimate
 */
export function getEffortEstimate(priority: PriorityLevel): string {
  return EFFORT_ESTIMATES[priority];
}

/**
 * Map requirement priority to effort level.
 *
 * @param priority - Requirement priority
 * @returns Effort level (high/medium/low)
 */
export function priorityToEffort(priority: PriorityLevel): EffortLevel {
  if (priority === 'critical') return 'high';
  if (priority === 'high') return 'medium';
  return 'low';
}

/**
 * Calculate total remediation time from gap counts.
 *
 * @param gaps - Object with gap counts per priority
 * @param parallelizationFactor - Factor for parallel work (default: 0.5 = 50% parallelization)
 * @returns Estimated weeks for remediation
 */
export function calculateRemediationTime(
  gaps: Partial<Record<PriorityLevel, number>>,
  parallelizationFactor: number = 0.5
): number {
  const totalWeeks = (
    (gaps.critical || 0) * EFFORT_WEEKS.critical +
    (gaps.high || 0) * EFFORT_WEEKS.high +
    (gaps.medium || 0) * EFFORT_WEEKS.medium +
    (gaps.low || 0) * EFFORT_WEEKS.low
  ) * parallelizationFactor;

  return Math.ceil(totalWeeks);
}

// ============================================================================
// Assessment Freshness Functions
// ============================================================================

/**
 * Calculate assessment freshness score based on days since last assessment.
 *
 * @param assessmentDate - Date of last assessment (string or Date)
 * @param maxScore - Maximum score for this component (default: 15)
 * @returns Freshness result with score, status, and description
 */
export function calculateAssessmentFreshness(
  assessmentDate: string | Date | null | undefined,
  maxScore: number = 15
): FreshnessResult {
  if (!assessmentDate) {
    return {
      score: 0,
      maxScore,
      status: 'missing',
      description: 'No assessment date recorded',
      isStale: true,
      daysSinceAssessment: null,
    };
  }

  const now = new Date();
  const assessed = new Date(assessmentDate);
  const daysSinceAssessment = Math.floor(
    (now.getTime() - assessed.getTime()) / (1000 * 60 * 60 * 24)
  );

  const { current, recent, aging } = FRESHNESS_THRESHOLDS;

  if (daysSinceAssessment <= current) {
    return {
      score: maxScore,
      maxScore,
      status: 'complete',
      description: `Assessment current (< ${current} days)`,
      isStale: false,
      daysSinceAssessment,
    };
  }

  if (daysSinceAssessment <= recent) {
    return {
      score: Math.round(maxScore * 0.8),
      maxScore,
      status: 'complete',
      description: `Assessment recent (< ${recent / 30} months)`,
      isStale: false,
      daysSinceAssessment,
    };
  }

  if (daysSinceAssessment <= aging) {
    return {
      score: Math.round(maxScore * 0.53),
      maxScore,
      status: 'partial',
      description: `Assessment aging (< 1 year)`,
      isStale: false,
      daysSinceAssessment,
    };
  }

  return {
    score: Math.round(maxScore * 0.27),
    maxScore,
    status: 'partial',
    description: 'Assessment overdue (> 1 year)',
    isStale: true,
    daysSinceAssessment,
  };
}

// ============================================================================
// Priority Weight Functions
// ============================================================================

/**
 * Get numeric weight for a priority level.
 *
 * @param priority - Priority level string
 * @returns Numeric weight (1-4)
 */
export function getPriorityWeight(priority: string): number {
  return PRIORITY_WEIGHTS[priority as PriorityLevel] || 1;
}

/**
 * Sort items by priority (critical first).
 *
 * @param items - Array of items with priority property
 * @returns Sorted array (descending by priority weight)
 */
export function sortByPriority<T extends { priority: PriorityLevel }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clamp a score to 0-100 range.
 */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/**
 * Round score to specified decimal places.
 */
export function roundScore(score: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(score * factor) / factor;
}

/**
 * Calculate percentage of items meeting a condition.
 */
export function calculatePercentage(
  items: unknown[],
  predicate: (item: unknown) => boolean
): number {
  if (items.length === 0) return 0;
  const matching = items.filter(predicate).length;
  return Math.round((matching / items.length) * 100);
}
