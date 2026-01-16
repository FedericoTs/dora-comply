/**
 * NIS2 Compliance Calculator
 *
 * Calculates organization NIS2 compliance based on:
 * 1. Requirement assessments (42 requirements across 6 categories)
 * 2. Binary scoring model (compliant/partial/non-compliant)
 * 3. Category breakdown aligned with Article 21
 *
 * Returns compliance scores with gap analysis
 */

import type {
  NIS2ComplianceStatus,
  NIS2Category,
  NIS2EntityType,
  NIS2RequirementScore,
  NIS2CategoryScore,
  NIS2ComplianceScore,
  NIS2ComplianceResult,
  NIS2GapItem,
} from './nis2-types';
import {
  getStatusFromPercentage,
  NIS2CategoryLabels,
} from './nis2-types';
import { NIS2_REQUIREMENTS } from './nis2-requirements';
import type { FrameworkRequirement } from './framework-types';

// =============================================================================
// Types for Assessment Input
// =============================================================================

export interface NIS2RequirementAssessment {
  requirementId: string;
  status: NIS2ComplianceStatus;
  evidenceCount: number;
  gaps: string[];
  notes?: string;
  assessedAt?: string;
  assessedBy?: string;
}

export interface NIS2AssessmentInput {
  organizationId: string;
  entityType: NIS2EntityType;
  assessments: NIS2RequirementAssessment[];
}

// =============================================================================
// Constants
// =============================================================================

const ALL_CATEGORIES: NIS2Category[] = [
  'governance',
  'risk_management',
  'incident_handling',
  'business_continuity',
  'supply_chain',
  'reporting',
];

const CATEGORY_WEIGHTS: Record<NIS2Category, number> = {
  governance: 15,
  risk_management: 25,
  incident_handling: 20,
  business_continuity: 15,
  supply_chain: 15,
  reporting: 10,
};

// =============================================================================
// Core Calculation Functions
// =============================================================================

/**
 * Calculate full NIS2 compliance for an organization
 */
export function calculateNIS2Compliance(
  input: NIS2AssessmentInput
): NIS2ComplianceResult {
  const { organizationId, entityType, assessments } = input;
  const assessmentDate = new Date().toISOString();

  // Calculate requirement-level scores
  const requirementScores = calculateRequirementScores(assessments, entityType);

  // Calculate category scores
  const categoryScores = calculateCategoryScores(requirementScores);

  // Calculate overall score
  const score = calculateOverallScore(
    requirementScores,
    categoryScores
  );

  // Identify gaps
  const allGaps = identifyGaps(requirementScores);
  const criticalGaps = allGaps.filter(g => g.priority === 'critical');

  // Estimate remediation time
  const estimatedRemediationWeeks = estimateRemediationTime(allGaps);

  return {
    organizationId,
    assessmentDate,
    score,
    requirements: requirementScores,
    criticalGaps,
    allGaps,
    totalGaps: allGaps.length,
    estimatedRemediationWeeks,
    entityType,
  };
}

/**
 * Calculate scores for each requirement
 */
function calculateRequirementScores(
  assessments: NIS2RequirementAssessment[],
  entityType: NIS2EntityType
): NIS2RequirementScore[] {
  const scores: NIS2RequirementScore[] = [];

  for (const req of NIS2_REQUIREMENTS) {
    // Check if requirement applies to this entity type
    if (!isRequirementApplicable(req, entityType)) {
      continue;
    }

    const assessment = assessments.find(a => a.requirementId === req.id);
    const status: NIS2ComplianceStatus = assessment?.status || 'not_assessed';
    const evidenceCount = assessment?.evidenceCount || 0;
    const gaps = assessment?.gaps || [];
    const notes = assessment?.notes;

    scores.push({
      requirementId: req.id,
      articleNumber: req.article_number,
      title: req.title,
      category: req.category as NIS2Category,
      status,
      evidenceCount,
      gaps,
      notes,
    });
  }

  return scores;
}

/**
 * Check if a requirement applies to the entity type
 */
function isRequirementApplicable(
  req: FrameworkRequirement,
  entityType: NIS2EntityType
): boolean {
  // If no applicability specified, applies to all
  if (!req.applicability || req.applicability.length === 0) {
    return true;
  }

  // Check if entity type is in applicability list
  return req.applicability.includes(entityType as never);
}

/**
 * Calculate scores for each NIS2 category
 */
function calculateCategoryScores(
  requirementScores: NIS2RequirementScore[]
): Record<NIS2Category, NIS2CategoryScore> {
  const result = {} as Record<NIS2Category, NIS2CategoryScore>;

  for (const category of ALL_CATEGORIES) {
    const categoryReqs = requirementScores.filter(r => r.category === category);

    const compliantCount = categoryReqs.filter(r => r.status === 'compliant').length;
    const partialCount = categoryReqs.filter(r => r.status === 'partial').length;
    const nonCompliantCount = categoryReqs.filter(r => r.status === 'non_compliant').length;
    const notAssessedCount = categoryReqs.filter(r => r.status === 'not_assessed').length;
    const totalCount = categoryReqs.length;

    // Calculate percentage: compliant = 100%, partial = 50%, others = 0%
    const assessedCount = compliantCount + partialCount + nonCompliantCount;
    const percentage = assessedCount > 0
      ? Math.round(((compliantCount * 100) + (partialCount * 50)) / assessedCount)
      : 0;

    const status = totalCount > 0 && notAssessedCount === totalCount
      ? 'not_assessed'
      : getStatusFromPercentage(percentage);

    result[category] = {
      category,
      compliantCount,
      partialCount,
      nonCompliantCount,
      notAssessedCount,
      totalCount,
      percentage,
      status,
    };
  }

  return result;
}

/**
 * Calculate overall compliance score
 */
function calculateOverallScore(
  requirementScores: NIS2RequirementScore[],
  categoryScores: Record<NIS2Category, NIS2CategoryScore>
): NIS2ComplianceScore {
  // Count by status
  const compliantCount = requirementScores.filter(r => r.status === 'compliant').length;
  const partialCount = requirementScores.filter(r => r.status === 'partial').length;
  const nonCompliantCount = requirementScores.filter(r => r.status === 'non_compliant').length;
  const notAssessedCount = requirementScores.filter(r => r.status === 'not_assessed').length;
  const totalRequirements = requirementScores.length;

  // Calculate weighted overall percentage using category weights
  let totalWeight = 0;
  let weightedSum = 0;

  for (const category of ALL_CATEGORIES) {
    const catScore = categoryScores[category];
    const weight = CATEGORY_WEIGHTS[category];

    if (catScore.totalCount > 0) {
      totalWeight += weight;
      weightedSum += catScore.percentage * weight;
    }
  }

  const overallPercentage = totalWeight > 0
    ? Math.round(weightedSum / totalWeight)
    : 0;

  // Determine overall status
  // If all requirements are not assessed, status is not_assessed
  const overallStatus = totalRequirements > 0 && notAssessedCount === totalRequirements
    ? 'not_assessed'
    : getStatusFromPercentage(overallPercentage);

  return {
    compliantCount,
    partialCount,
    nonCompliantCount,
    notAssessedCount,
    totalRequirements,
    categories: categoryScores,
    overallPercentage,
    overallStatus,
  };
}

/**
 * Identify compliance gaps
 */
function identifyGaps(
  requirementScores: NIS2RequirementScore[]
): NIS2GapItem[] {
  const gaps: NIS2GapItem[] = [];

  for (const score of requirementScores) {
    // Only non-compliant and partial are gaps
    if (score.status === 'compliant' || score.status === 'not_assessed') {
      continue;
    }

    const requirement = NIS2_REQUIREMENTS.find(r => r.id === score.requirementId);
    if (!requirement) continue;

    const priority = mapPriorityToGapPriority(
      requirement.priority,
      score.status
    );

    const gapDescription = score.gaps.length > 0
      ? score.gaps.join('; ')
      : `${requirement.title} - ${score.status === 'partial' ? 'Partially implemented' : 'Not implemented'}`;

    gaps.push({
      requirementId: score.requirementId,
      articleNumber: score.articleNumber,
      title: score.title,
      category: score.category,
      gapDescription,
      remediationGuidance: requirement.implementation_guidance || 'Implement required controls and document evidence.',
      priority,
      estimatedEffort: estimateEffortForGap(priority),
      status: 'open',
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return gaps;
}

/**
 * Map requirement priority to gap priority, considering compliance status
 */
function mapPriorityToGapPriority(
  requirementPriority: string,
  status: NIS2ComplianceStatus
): 'critical' | 'high' | 'medium' | 'low' {
  // Non-compliant critical requirements are critical gaps
  if (status === 'non_compliant' && requirementPriority === 'critical') {
    return 'critical';
  }

  // Non-compliant high priority or partial critical = high
  if (
    (status === 'non_compliant' && requirementPriority === 'high') ||
    (status === 'partial' && requirementPriority === 'critical')
  ) {
    return 'high';
  }

  // Partial high or non-compliant medium = medium
  if (
    (status === 'partial' && requirementPriority === 'high') ||
    (status === 'non_compliant' && requirementPriority === 'medium')
  ) {
    return 'medium';
  }

  return 'low';
}

/**
 * Estimate effort for a gap based on priority
 */
function estimateEffortForGap(
  priority: 'critical' | 'high' | 'medium' | 'low'
): string {
  const effortMap = {
    critical: '4-8 weeks',
    high: '2-4 weeks',
    medium: '1-2 weeks',
    low: '< 1 week',
  };
  return effortMap[priority];
}

/**
 * Estimate total remediation time in weeks
 */
function estimateRemediationTime(gaps: NIS2GapItem[]): number {
  const criticalCount = gaps.filter(g => g.priority === 'critical').length;
  const highCount = gaps.filter(g => g.priority === 'high').length;
  const mediumCount = gaps.filter(g => g.priority === 'medium').length;
  const lowCount = gaps.filter(g => g.priority === 'low').length;

  // Estimate: critical = 6 weeks, high = 3 weeks, medium = 1.5 weeks, low = 0.5 weeks
  // Apply 50% parallelization factor
  const totalWeeks = (
    criticalCount * 6 +
    highCount * 3 +
    mediumCount * 1.5 +
    lowCount * 0.5
  ) * 0.5;

  return Math.ceil(totalWeeks);
}

// =============================================================================
// Helper Functions for Dashboard
// =============================================================================

/**
 * Get summary statistics for dashboard display
 */
export function getNIS2DashboardStats(
  result: NIS2ComplianceResult
): {
  overallScore: number;
  overallStatus: NIS2ComplianceStatus;
  categoryBreakdown: Array<{
    category: NIS2Category;
    label: string;
    percentage: number;
    status: NIS2ComplianceStatus;
  }>;
  gapSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  progressMetrics: {
    assessed: number;
    compliant: number;
    total: number;
  };
} {
  const categoryBreakdown = ALL_CATEGORIES.map(category => ({
    category,
    label: NIS2CategoryLabels[category],
    percentage: result.score.categories[category].percentage,
    status: result.score.categories[category].status,
  }));

  const gapSummary = {
    critical: result.allGaps.filter(g => g.priority === 'critical').length,
    high: result.allGaps.filter(g => g.priority === 'high').length,
    medium: result.allGaps.filter(g => g.priority === 'medium').length,
    low: result.allGaps.filter(g => g.priority === 'low').length,
  };

  const assessed = result.score.totalRequirements - result.score.notAssessedCount;

  return {
    overallScore: result.score.overallPercentage,
    overallStatus: result.score.overallStatus,
    categoryBreakdown,
    gapSummary,
    progressMetrics: {
      assessed,
      compliant: result.score.compliantCount,
      total: result.score.totalRequirements,
    },
  };
}

/**
 * Calculate quick compliance check (lightweight for list views)
 */
export function calculateNIS2QuickScore(
  assessments: NIS2RequirementAssessment[]
): { percentage: number; status: NIS2ComplianceStatus } {
  const total = assessments.length;
  if (total === 0) {
    return { percentage: 0, status: 'not_assessed' };
  }

  const compliant = assessments.filter(a => a.status === 'compliant').length;
  const partial = assessments.filter(a => a.status === 'partial').length;
  const notAssessed = assessments.filter(a => a.status === 'not_assessed').length;

  // If all not assessed
  if (notAssessed === total) {
    return { percentage: 0, status: 'not_assessed' };
  }

  const assessed = total - notAssessed;
  const percentage = Math.round(((compliant * 100) + (partial * 50)) / assessed);
  const status = getStatusFromPercentage(percentage);

  return { percentage, status };
}

/**
 * Get requirements grouped by category for assessment UI
 */
export function getNIS2RequirementsByCategory(
  entityType: NIS2EntityType
): Record<NIS2Category, FrameworkRequirement[]> {
  const result = {} as Record<NIS2Category, FrameworkRequirement[]>;

  for (const category of ALL_CATEGORIES) {
    result[category] = NIS2_REQUIREMENTS.filter(
      r => r.category === category && isRequirementApplicable(r, entityType)
    );
  }

  return result;
}

/**
 * Get critical requirements for priority focus
 */
export function getNIS2CriticalRequirements(
  entityType: NIS2EntityType
): FrameworkRequirement[] {
  return NIS2_REQUIREMENTS.filter(
    r => r.priority === 'critical' && isRequirementApplicable(r, entityType)
  );
}

// =============================================================================
// Export Requirements
// =============================================================================

export { NIS2_REQUIREMENTS } from './nis2-requirements';
export { ALL_CATEGORIES as NIS2_ALL_CATEGORIES };
