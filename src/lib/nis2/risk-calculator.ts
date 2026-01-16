/**
 * NIS2 Risk Calculator
 *
 * Mathematical functions for calculating risk scores:
 * - Inherent Risk = Likelihood × Impact
 * - Combined Control Effectiveness = 1 - Π(1 - effectiveness_i)
 * - Residual Risk = Inherent Risk × (1 - Combined Control Effectiveness)
 *
 * This uses the compound effectiveness formula (not simple average)
 * which is more accurate for multiple overlapping controls.
 */

import type {
  RiskLevel,
  LikelihoodScore,
  ImpactScore,
  NIS2Risk,
  AggregateRiskPosition,
} from './types';

// =============================================================================
// Core Calculation Functions
// =============================================================================

/**
 * Calculate inherent risk score from likelihood and impact
 */
export function calculateInherentRisk(
  likelihood: LikelihoodScore,
  impact: ImpactScore
): number {
  return likelihood * impact;
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 16) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

/**
 * Calculate combined control effectiveness using compound formula
 *
 * Formula: 1 - Π(1 - effectiveness_i)
 *
 * This is more accurate than simple average because:
 * - Two 50% effective controls don't give 50%, they give 75%
 * - Three controls at 60%, 70%, 80% give 97.6%, not 70%
 *
 * @param controlEffectiveness Array of effectiveness values (0-100)
 * @returns Combined effectiveness (0-100)
 */
export function calculateCombinedControlEffectiveness(
  controlEffectiveness: number[]
): number {
  if (controlEffectiveness.length === 0) return 0;

  // Filter out zero effectiveness controls (they don't contribute)
  const validControls = controlEffectiveness.filter(e => e > 0);
  if (validControls.length === 0) return 0;

  // Compound formula: 1 - Π(1 - effectiveness_i)
  // Each effectiveness is 0-100, so divide by 100 for calculation
  const product = validControls.reduce(
    (acc, effectiveness) => acc * (1 - effectiveness / 100),
    1
  );

  // Convert back to 0-100 scale and round
  return Math.round((1 - product) * 100);
}

/**
 * Calculate residual risk score
 *
 * @param inherentRisk The inherent risk score (1-25)
 * @param combinedEffectiveness Combined control effectiveness (0-100)
 * @returns Residual risk score (minimum 1)
 */
export function calculateResidualRisk(
  inherentRisk: number,
  combinedEffectiveness: number
): number {
  const residual = inherentRisk * (1 - combinedEffectiveness / 100);
  // Minimum residual risk is 1 (can never be 0)
  return Math.max(1, Math.round(residual));
}

/**
 * Calculate residual likelihood based on control effectiveness
 * Preventive controls reduce likelihood
 */
export function calculateResidualLikelihood(
  inherentLikelihood: LikelihoodScore,
  preventiveEffectiveness: number
): LikelihoodScore {
  const reduction = (inherentLikelihood - 1) * (preventiveEffectiveness / 100);
  const residual = Math.max(1, Math.round(inherentLikelihood - reduction));
  return Math.min(5, residual) as LikelihoodScore;
}

/**
 * Calculate residual impact based on control effectiveness
 * Corrective controls reduce impact
 */
export function calculateResidualImpact(
  inherentImpact: ImpactScore,
  correctiveEffectiveness: number
): ImpactScore {
  const reduction = (inherentImpact - 1) * (correctiveEffectiveness / 100);
  const residual = Math.max(1, Math.round(inherentImpact - reduction));
  return Math.min(5, residual) as ImpactScore;
}

// =============================================================================
// Full Risk Assessment
// =============================================================================

export interface ControlForCalculation {
  id: string;
  effectiveness_score: number;
  control_type?: 'preventive' | 'detective' | 'corrective';
}

export interface RiskCalculationResult {
  // Inherent
  inherent_risk_score: number;
  inherent_risk_level: RiskLevel;

  // Controls
  combined_control_effectiveness: number;
  control_count: number;

  // Residual
  residual_likelihood: LikelihoodScore;
  residual_impact: ImpactScore;
  residual_risk_score: number;
  residual_risk_level: RiskLevel;

  // Analysis
  risk_reduction_percentage: number;
  is_within_tolerance: boolean;
}

/**
 * Calculate full risk assessment including residual risk
 */
export function calculateFullRiskAssessment(
  likelihood: LikelihoodScore,
  impact: ImpactScore,
  controls: ControlForCalculation[],
  toleranceThreshold: number = 9
): RiskCalculationResult {
  // Calculate inherent risk
  const inherentRisk = calculateInherentRisk(likelihood, impact);
  const inherentLevel = getRiskLevel(inherentRisk);

  // Calculate combined effectiveness
  const effectivenessValues = controls.map(c => c.effectiveness_score);
  const combinedEffectiveness = calculateCombinedControlEffectiveness(effectivenessValues);

  // Calculate preventive and corrective effectiveness separately
  const preventiveControls = controls.filter(c => c.control_type === 'preventive');
  const correctiveControls = controls.filter(c => c.control_type === 'corrective');

  const preventiveEffectiveness = calculateCombinedControlEffectiveness(
    preventiveControls.map(c => c.effectiveness_score)
  );
  const correctiveEffectiveness = calculateCombinedControlEffectiveness(
    correctiveControls.map(c => c.effectiveness_score)
  );

  // Calculate residual likelihood and impact
  const residualLikelihood = calculateResidualLikelihood(likelihood, preventiveEffectiveness);
  const residualImpact = calculateResidualImpact(impact, correctiveEffectiveness);

  // Calculate residual risk score
  const residualRisk = calculateResidualRisk(inherentRisk, combinedEffectiveness);
  const residualLevel = getRiskLevel(residualRisk);

  // Calculate risk reduction
  const riskReduction = inherentRisk > 0
    ? Math.round(((inherentRisk - residualRisk) / inherentRisk) * 100)
    : 0;

  return {
    inherent_risk_score: inherentRisk,
    inherent_risk_level: inherentLevel,
    combined_control_effectiveness: combinedEffectiveness,
    control_count: controls.length,
    residual_likelihood: residualLikelihood,
    residual_impact: residualImpact,
    residual_risk_score: residualRisk,
    residual_risk_level: residualLevel,
    risk_reduction_percentage: riskReduction,
    is_within_tolerance: residualRisk <= toleranceThreshold,
  };
}

// =============================================================================
// Aggregate Position Calculation
// =============================================================================

/**
 * Calculate aggregate risk position for visualization
 * Shows "where the organization stands" overall
 */
export function calculateAggregatePosition(
  risks: NIS2Risk[],
  view: 'inherent' | 'residual' = 'residual',
  toleranceThreshold: number = 9
): AggregateRiskPosition {
  if (risks.length === 0) {
    return {
      avg_likelihood: 1,
      avg_impact: 1,
      avg_score: 1,
      risk_level: 'low',
      by_level: { low: 0, medium: 0, high: 0, critical: 0 },
      target_score: toleranceThreshold,
      gap_to_target: 0,
      is_within_tolerance: true,
      trend: 'stable',
      change_from_previous: 0,
    };
  }

  // Get scores based on view
  const scores = risks.map(r => {
    if (view === 'inherent') {
      return {
        likelihood: r.likelihood_score,
        impact: r.impact_score,
        score: r.inherent_risk_score,
        level: r.inherent_risk_level,
      };
    } else {
      return {
        likelihood: r.residual_likelihood ?? r.likelihood_score,
        impact: r.residual_impact ?? r.impact_score,
        score: r.residual_risk_score ?? r.inherent_risk_score,
        level: r.residual_risk_level ?? r.inherent_risk_level,
      };
    }
  });

  // Calculate averages
  const avgLikelihood = scores.reduce((sum, s) => sum + s.likelihood, 0) / scores.length;
  const avgImpact = scores.reduce((sum, s) => sum + s.impact, 0) / scores.length;
  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

  // Count by level
  const byLevel: Record<RiskLevel, number> = {
    low: scores.filter(s => s.level === 'low').length,
    medium: scores.filter(s => s.level === 'medium').length,
    high: scores.filter(s => s.level === 'high').length,
    critical: scores.filter(s => s.level === 'critical').length,
  };

  // Calculate gap to target
  const gapToTarget = Math.max(0, avgScore - toleranceThreshold);

  return {
    avg_likelihood: Math.round(avgLikelihood * 10) / 10,
    avg_impact: Math.round(avgImpact * 10) / 10,
    avg_score: Math.round(avgScore * 10) / 10,
    risk_level: getRiskLevel(Math.round(avgScore)),
    by_level: byLevel,
    target_score: toleranceThreshold,
    gap_to_target: Math.round(gapToTarget * 10) / 10,
    is_within_tolerance: avgScore <= toleranceThreshold,
    trend: 'stable', // Calculated separately with historical data
    change_from_previous: 0,
  };
}

// =============================================================================
// Target Position Calculation
// =============================================================================

/**
 * Calculate target position (where risk should be after treatment)
 */
export function calculateTargetPosition(
  risk: NIS2Risk,
  targetEffectiveness: number = 85 // Target 85% effectiveness
): { likelihood: LikelihoodScore; impact: ImpactScore; score: number; level: RiskLevel } {
  const residualLikelihood = calculateResidualLikelihood(risk.likelihood_score, targetEffectiveness);
  const residualImpact = calculateResidualImpact(risk.impact_score, targetEffectiveness);
  const score = calculateResidualRisk(risk.inherent_risk_score, targetEffectiveness);

  return {
    likelihood: residualLikelihood,
    impact: residualImpact,
    score,
    level: getRiskLevel(score),
  };
}

// =============================================================================
// Risk Guidance Generation
// =============================================================================

/**
 * Generate recommended actions based on risk position
 */
export function generateRecommendedActions(
  risk: NIS2Risk,
  currentControls: ControlForCalculation[],
  availableControls: { id: string; title: string; effectiveness: number; type: 'preventive' | 'detective' | 'corrective' }[]
): {
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expected_reduction: number;
  control_id?: string;
}[] {
  const actions: {
    action: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    expected_reduction: number;
    control_id?: string;
  }[] = [];

  const currentResidual = risk.residual_risk_score ?? risk.inherent_risk_score;
  const targetScore = risk.tolerance_threshold;

  if (currentResidual <= targetScore) {
    return []; // Already within tolerance
  }

  // Find controls not yet linked
  const linkedControlIds = currentControls.map(c => c.id);
  const unlinkedControls = availableControls.filter(c => !linkedControlIds.includes(c.id));

  // Sort by effectiveness
  const sortedControls = [...unlinkedControls].sort((a, b) => b.effectiveness - a.effectiveness);

  // Simulate adding each control
  for (const control of sortedControls.slice(0, 5)) {
    const newEffectiveness = calculateCombinedControlEffectiveness([
      ...currentControls.map(c => c.effectiveness_score),
      control.effectiveness,
    ]);

    const newResidual = calculateResidualRisk(risk.inherent_risk_score, newEffectiveness);
    const reduction = currentResidual - newResidual;

    if (reduction > 0) {
      const priority = currentResidual >= 16 ? 'critical'
        : currentResidual >= 10 ? 'high'
        : currentResidual >= 5 ? 'medium'
        : 'low';

      actions.push({
        action: `Implement ${control.title}`,
        priority,
        expected_reduction: reduction,
        control_id: control.id,
      });
    }
  }

  return actions;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if risk is within tolerance
 */
export function isWithinTolerance(
  riskScore: number,
  toleranceThreshold: number = 9
): boolean {
  return riskScore <= toleranceThreshold;
}

/**
 * Get color for risk level
 */
export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444',
  };
  return colors[level];
}

/**
 * Get background color class for risk level
 */
export function getRiskLevelBgClass(level: RiskLevel): string {
  const classes: Record<RiskLevel, string> = {
    low: 'bg-emerald-100',
    medium: 'bg-amber-100',
    high: 'bg-orange-100',
    critical: 'bg-red-100',
  };
  return classes[level];
}

/**
 * Get text color class for risk level
 */
export function getRiskLevelTextClass(level: RiskLevel): string {
  const classes: Record<RiskLevel, string> = {
    low: 'text-emerald-700',
    medium: 'text-amber-700',
    high: 'text-orange-700',
    critical: 'text-red-700',
  };
  return classes[level];
}

/**
 * Format effectiveness as percentage
 */
export function formatEffectiveness(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Get effectiveness label
 */
export function getEffectivenessLabel(value: number): string {
  if (value >= 90) return 'Optimal';
  if (value >= 75) return 'Substantial';
  if (value >= 50) return 'Partial';
  if (value >= 25) return 'Minimal';
  return 'None';
}
