/**
 * Heat Map Utilities
 *
 * Functions for generating and manipulating risk heat map data.
 * Supports both inherent and residual risk views with position markers.
 */

import type {
  NIS2Risk,
  RiskLevel,
  LikelihoodScore,
  ImpactScore,
  HeatMapCell,
  HeatMapData,
  HeatMapConfig,
} from './types';
import type { NIS2Category } from '../compliance/nis2-types';
import { getRiskLevel, calculateAggregatePosition } from './risk-calculator';

// =============================================================================
// Heat Map Data Generation
// =============================================================================

/**
 * Generate heat map data structure from risks
 *
 * Returns a 5x5 matrix where:
 * - Row index = 5 - impact (so impact 5 is at top)
 * - Column index = likelihood - 1 (so likelihood 1 is at left)
 */
export function generateHeatMapData(
  risks: NIS2Risk[],
  config: HeatMapConfig
): HeatMapData {
  const { view, tolerance_threshold, filter_category } = config;

  // Filter risks by category if specified
  const filteredRisks = filter_category
    ? risks.filter(r => r.category === filter_category)
    : risks;

  // Calculate aggregate position for markers
  const aggregatePosition = calculateAggregatePosition(
    filteredRisks,
    view,
    tolerance_threshold
  );

  // Initialize 5x5 matrix
  const matrix: HeatMapData = [];

  // Build matrix (impact 5 at top, likelihood 1 at left)
  for (let impactRow = 5; impactRow >= 1; impactRow--) {
    const row: HeatMapCell[] = [];

    for (let likelihoodCol = 1; likelihoodCol <= 5; likelihoodCol++) {
      const impact = impactRow as ImpactScore;
      const likelihood = likelihoodCol as LikelihoodScore;
      const score = likelihood * impact;
      const level = getRiskLevel(score);

      // Get risks for this cell based on view
      const cellRisks = filteredRisks.filter(r => {
        if (view === 'inherent') {
          return r.likelihood_score === likelihood && r.impact_score === impact;
        } else {
          const rLikelihood = r.residual_likelihood ?? r.likelihood_score;
          const rImpact = r.residual_impact ?? r.impact_score;
          return rLikelihood === likelihood && rImpact === impact;
        }
      });

      // Determine if this cell represents the current position
      const isCurrentPosition = config.show_aggregate_position &&
        Math.round(aggregatePosition.avg_likelihood) === likelihood &&
        Math.round(aggregatePosition.avg_impact) === impact;

      // Determine if this cell represents the target position
      // Target is typically at tolerance threshold (e.g., score 9 = 3x3)
      const isTargetPosition = config.show_target_position &&
        score === tolerance_threshold;

      row.push({
        likelihood,
        impact,
        score,
        level,
        risks: cellRisks.map(r => ({
          id: r.id,
          reference_code: r.reference_code,
          title: r.title,
          category: r.category,
        })),
        risk_count: cellRisks.length,
        is_current_position: isCurrentPosition,
        is_target_position: isTargetPosition,
        is_above_tolerance: score > tolerance_threshold,
      });
    }

    matrix.push(row);
  }

  return matrix;
}

/**
 * Get cell by coordinates
 */
export function getCell(
  matrix: HeatMapData,
  likelihood: LikelihoodScore,
  impact: ImpactScore
): HeatMapCell | undefined {
  const rowIndex = 5 - impact;
  const colIndex = likelihood - 1;
  return matrix[rowIndex]?.[colIndex];
}

/**
 * Get cell background color based on risk level
 */
export function getCellBackgroundColor(level: RiskLevel, hasRisks: boolean): string {
  const baseColors: Record<RiskLevel, { empty: string; filled: string }> = {
    low: {
      empty: 'bg-emerald-50',
      filled: 'bg-emerald-100',
    },
    medium: {
      empty: 'bg-amber-50',
      filled: 'bg-amber-100',
    },
    high: {
      empty: 'bg-orange-50',
      filled: 'bg-orange-100',
    },
    critical: {
      empty: 'bg-red-50',
      filled: 'bg-red-100',
    },
  };

  return hasRisks ? baseColors[level].filled : baseColors[level].empty;
}

/**
 * Get cell border color
 */
export function getCellBorderColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: 'border-emerald-200',
    medium: 'border-amber-200',
    high: 'border-orange-200',
    critical: 'border-red-200',
  };
  return colors[level];
}

/**
 * Get cell hover color
 */
export function getCellHoverColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: 'hover:bg-emerald-200',
    medium: 'hover:bg-amber-200',
    high: 'hover:bg-orange-200',
    critical: 'hover:bg-red-200',
  };
  return colors[level];
}

// =============================================================================
// Risk Distribution
// =============================================================================

export interface RiskDistribution {
  total: number;
  by_level: Record<RiskLevel, number>;
  by_category: Record<NIS2Category, number>;
  percentages: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

/**
 * Calculate risk distribution from risks
 */
export function calculateRiskDistribution(
  risks: NIS2Risk[],
  view: 'inherent' | 'residual' = 'residual'
): RiskDistribution {
  const total = risks.length;

  if (total === 0) {
    return {
      total: 0,
      by_level: { low: 0, medium: 0, high: 0, critical: 0 },
      by_category: {} as Record<NIS2Category, number>,
      percentages: { low: 0, medium: 0, high: 0, critical: 0 },
    };
  }

  // Count by level
  const byLevel: Record<RiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const risk of risks) {
    const level = view === 'inherent'
      ? risk.inherent_risk_level
      : (risk.residual_risk_level ?? risk.inherent_risk_level);
    byLevel[level]++;
  }

  // Count by category
  const byCategory = {} as Record<NIS2Category, number>;
  for (const risk of risks) {
    byCategory[risk.category] = (byCategory[risk.category] || 0) + 1;
  }

  // Calculate percentages
  const percentages = {
    low: Math.round((byLevel.low / total) * 100),
    medium: Math.round((byLevel.medium / total) * 100),
    high: Math.round((byLevel.high / total) * 100),
    critical: Math.round((byLevel.critical / total) * 100),
  };

  return { total, by_level: byLevel, by_category: byCategory, percentages };
}

// =============================================================================
// Position Markers
// =============================================================================

export interface PositionMarker {
  likelihood: number;
  impact: number;
  score: number;
  level: RiskLevel;
  type: 'current' | 'target';
  label: string;
}

/**
 * Calculate position markers for heat map
 */
export function calculatePositionMarkers(
  risks: NIS2Risk[],
  view: 'inherent' | 'residual',
  toleranceThreshold: number
): { current: PositionMarker | null; target: PositionMarker } {
  const aggregate = calculateAggregatePosition(risks, view, toleranceThreshold);

  const current: PositionMarker | null = risks.length > 0 ? {
    likelihood: aggregate.avg_likelihood,
    impact: aggregate.avg_impact,
    score: aggregate.avg_score,
    level: aggregate.risk_level,
    type: 'current',
    label: 'You are here',
  } : null;

  // Target position - within tolerance
  // Find the highest acceptable cell (e.g., 3x3=9 for threshold 9)
  const targetLikelihood = Math.floor(Math.sqrt(toleranceThreshold));
  const targetImpact = Math.ceil(toleranceThreshold / targetLikelihood);

  const target: PositionMarker = {
    likelihood: Math.min(5, targetLikelihood),
    impact: Math.min(5, targetImpact),
    score: toleranceThreshold,
    level: getRiskLevel(toleranceThreshold),
    type: 'target',
    label: 'Target',
  };

  return { current, target };
}

// =============================================================================
// Tolerance Band
// =============================================================================

/**
 * Get cells that are within tolerance
 */
export function getToleranceCells(toleranceThreshold: number): Array<{
  likelihood: LikelihoodScore;
  impact: ImpactScore;
}> {
  const cells: Array<{ likelihood: LikelihoodScore; impact: ImpactScore }> = [];

  for (let l = 1; l <= 5; l++) {
    for (let i = 1; i <= 5; i++) {
      if (l * i <= toleranceThreshold) {
        cells.push({
          likelihood: l as LikelihoodScore,
          impact: i as ImpactScore,
        });
      }
    }
  }

  return cells;
}

/**
 * Check if a cell is within tolerance
 */
export function isCellWithinTolerance(
  likelihood: LikelihoodScore,
  impact: ImpactScore,
  toleranceThreshold: number
): boolean {
  return likelihood * impact <= toleranceThreshold;
}

// =============================================================================
// Comparison Utilities
// =============================================================================

export interface HeatMapComparison {
  inherent: HeatMapData;
  residual: HeatMapData;
  improvement: {
    risks_reduced: number;
    avg_score_reduction: number;
    percentage_reduction: number;
  };
}

/**
 * Generate comparison between inherent and residual heat maps
 */
export function generateHeatMapComparison(
  risks: NIS2Risk[],
  toleranceThreshold: number = 9
): HeatMapComparison {
  const baseConfig: Omit<HeatMapConfig, 'view'> = {
    view: 'inherent',
    show_aggregate_position: true,
    show_target_position: true,
    tolerance_threshold: toleranceThreshold,
  };

  const inherent = generateHeatMapData(risks, { ...baseConfig, view: 'inherent' });
  const residual = generateHeatMapData(risks, { ...baseConfig, view: 'residual' });

  // Calculate improvement metrics
  const inherentDistribution = calculateRiskDistribution(risks, 'inherent');
  const residualDistribution = calculateRiskDistribution(risks, 'residual');

  const inherentHighCritical = inherentDistribution.by_level.high + inherentDistribution.by_level.critical;
  const residualHighCritical = residualDistribution.by_level.high + residualDistribution.by_level.critical;

  const inherentAggregate = calculateAggregatePosition(risks, 'inherent', toleranceThreshold);
  const residualAggregate = calculateAggregatePosition(risks, 'residual', toleranceThreshold);

  const avgReduction = inherentAggregate.avg_score - residualAggregate.avg_score;
  const percentageReduction = inherentAggregate.avg_score > 0
    ? Math.round((avgReduction / inherentAggregate.avg_score) * 100)
    : 0;

  return {
    inherent,
    residual,
    improvement: {
      risks_reduced: inherentHighCritical - residualHighCritical,
      avg_score_reduction: Math.round(avgReduction * 10) / 10,
      percentage_reduction: percentageReduction,
    },
  };
}

// =============================================================================
// Label Utilities
// =============================================================================

export const LIKELIHOOD_LABELS: Record<LikelihoodScore, string> = {
  1: 'Rare',
  2: 'Unlikely',
  3: 'Possible',
  4: 'Likely',
  5: 'Certain',
};

export const IMPACT_LABELS: Record<ImpactScore, string> = {
  1: 'Negligible',
  2: 'Minor',
  3: 'Moderate',
  4: 'Major',
  5: 'Catastrophic',
};

export const LIKELIHOOD_LABELS_SHORT: Record<LikelihoodScore, string> = {
  1: 'Rare',
  2: 'Unl.',
  3: 'Poss.',
  4: 'Like.',
  5: 'Cert.',
};

export const IMPACT_LABELS_SHORT: Record<ImpactScore, string> = {
  1: 'Neg.',
  2: 'Min.',
  3: 'Mod.',
  4: 'Maj.',
  5: 'Cat.',
};
