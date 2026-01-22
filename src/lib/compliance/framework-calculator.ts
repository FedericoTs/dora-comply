/**
 * Multi-Framework Compliance Calculator
 *
 * Calculates compliance scores across DORA, NIS2, GDPR Article 32, and ISO 27001:2022.
 * Supports cross-framework coverage analysis and gap identification.
 */

import {
  FrameworkCode,
  FrameworkRequirement,
  FrameworkComplianceResult,
  FrameworkGap,
  ComplianceStatus,
  RequirementPriority,
  RequirementAssessment,
  ALL_FRAMEWORK_CATEGORIES,
} from './framework-types';
import {
  calculateWeightedScore,
  scoreToComplianceStatus,
  priorityToEffort,
  sortByPriority,
  getPriorityWeight,
  SCORE_THRESHOLDS,
} from './scoring-utils';

import { NIS2_REQUIREMENTS } from './nis2-requirements';
import { GDPR_REQUIREMENTS } from './gdpr-requirements';
import { ISO27001_REQUIREMENTS } from './iso27001-requirements';
import { DORA_REQUIREMENTS } from './dora-requirements-data';
import {
  getMappingsForRequirement,
  calculateCrossFrameworkCoverage,
  getFrameworkOverlapSummary,
} from './mappings';

// ============================================================================
// DORA Requirements Conversion
// ============================================================================

// Convert DORA requirements from DORARequirement format to FrameworkRequirement format
const DORA_FRAMEWORK_REQUIREMENTS: FrameworkRequirement[] = DORA_REQUIREMENTS.map((req, index) => ({
  id: req.id,
  framework: 'dora' as FrameworkCode,
  article_number: req.article_number,
  title: req.article_title,
  description: req.requirement_text,
  category: req.pillar,
  priority: req.priority as RequirementPriority,
  evidence_types: req.evidence_needed.map(e => {
    // Map evidence strings to EvidenceType
    if (e.toLowerCase().includes('policy')) return 'policy';
    if (e.toLowerCase().includes('procedure')) return 'procedure';
    if (e.toLowerCase().includes('soc') || e.toLowerCase().includes('audit')) return 'soc2_report';
    if (e.toLowerCase().includes('test')) return 'penetration_test';
    if (e.toLowerCase().includes('training')) return 'training_record';
    if (e.toLowerCase().includes('contract')) return 'contract';
    if (e.toLowerCase().includes('certificate')) return 'certificate';
    return 'technical_control';
  }) as FrameworkRequirement['evidence_types'],
  applicability: req.applies_to?.includes('all') ? undefined : req.applies_to as FrameworkRequirement['applicability'],
  sort_order: index + 1,
  implementation_guidance: `Implement controls to satisfy: ${req.evidence_needed.join(', ')}`,
  regulatory_reference: `DORA ${req.chapter ? `Chapter ${req.chapter}, ` : ''}${req.article_number}`,
}));

// ============================================================================
// Requirement Access Functions
// ============================================================================

const FRAMEWORK_REQUIREMENTS: Record<FrameworkCode, FrameworkRequirement[]> = {
  dora: DORA_FRAMEWORK_REQUIREMENTS,
  nis2: NIS2_REQUIREMENTS,
  gdpr: GDPR_REQUIREMENTS,
  iso27001: ISO27001_REQUIREMENTS,
};

/**
 * Get all requirements for a framework
 */
export function getFrameworkRequirements(framework: FrameworkCode): FrameworkRequirement[] {
  return FRAMEWORK_REQUIREMENTS[framework] || [];
}

/**
 * Get requirements by category within a framework
 */
export function getRequirementsByCategory(
  framework: FrameworkCode,
  category: string
): FrameworkRequirement[] {
  return getFrameworkRequirements(framework).filter(r => r.category === category);
}

/**
 * Get critical requirements for a framework
 */
export function getCriticalRequirements(framework: FrameworkCode): FrameworkRequirement[] {
  return getFrameworkRequirements(framework).filter(r => r.priority === 'critical');
}

/**
 * Get requirement by ID
 */
export function getRequirementById(
  framework: FrameworkCode,
  requirementId: string
): FrameworkRequirement | undefined {
  return getFrameworkRequirements(framework).find(r => r.id === requirementId);
}

// ============================================================================
// Compliance Score Calculation
// ============================================================================

export interface FrameworkComplianceInput {
  vendorId: string;
  framework: FrameworkCode;
  assessments: RequirementAssessment[];
}

/**
 * Calculate compliance status from score
 * Uses default thresholds (90/60)
 */
export function getComplianceStatusFromScore(score: number): ComplianceStatus {
  return scoreToComplianceStatus(score, SCORE_THRESHOLDS.default);
}

/**
 * Calculate weighted compliance score for a framework
 */
export function calculateFrameworkScore(
  framework: FrameworkCode,
  assessments: RequirementAssessment[]
): number {
  const requirements = getFrameworkRequirements(framework);
  if (requirements.length === 0 || assessments.length === 0) return 0;

  // Build weighted items from requirements and assessments
  const weightedItems = requirements.map(requirement => {
    const assessment = assessments.find(a => a.requirement_id === requirement.id);
    return {
      score: assessment?.score || 0,
      weight: getPriorityWeight(requirement.priority),
      status: assessment?.status || 'not_assessed',
    };
  });

  return calculateWeightedScore(weightedItems, { excludeNotAssessed: true });
}

/**
 * Calculate category-level scores
 */
export function calculateCategoryScores(
  framework: FrameworkCode,
  assessments: RequirementAssessment[]
): Record<string, { score: number; status: ComplianceStatus; requirements_met: number; requirements_total: number }> {
  const categories = ALL_FRAMEWORK_CATEGORIES[framework] || [];
  const result: Record<string, { score: number; status: ComplianceStatus; requirements_met: number; requirements_total: number }> = {};

  for (const category of categories) {
    const categoryRequirements = getRequirementsByCategory(framework, category.code);
    const categoryAssessments = assessments.filter(a =>
      categoryRequirements.some(r => r.id === a.requirement_id)
    );

    // Build weighted items for this category
    const weightedItems = categoryRequirements.map(requirement => {
      const assessment = categoryAssessments.find(a => a.requirement_id === requirement.id);
      return {
        score: assessment?.score || 0,
        weight: getPriorityWeight(requirement.priority),
        status: assessment?.status || 'not_assessed',
      };
    });

    const score = calculateWeightedScore(weightedItems, { excludeNotAssessed: true });
    const met = categoryAssessments.filter(a => a.status === 'compliant').length;

    result[category.code] = {
      score,
      status: getComplianceStatusFromScore(score),
      requirements_met: met,
      requirements_total: categoryRequirements.length,
    };
  }

  return result;
}

/**
 * Identify gaps in compliance
 */
export function identifyGaps(
  framework: FrameworkCode,
  assessments: RequirementAssessment[]
): FrameworkGap[] {
  const requirements = getFrameworkRequirements(framework);
  const gaps: FrameworkGap[] = [];

  for (const requirement of requirements) {
    const assessment = assessments.find(a => a.requirement_id === requirement.id);

    // Skip if compliant or not applicable
    if (assessment?.status === 'compliant' || assessment?.status === 'not_applicable') {
      continue;
    }

    // Get cross-framework impact
    const mappings = getMappingsForRequirement(requirement.id);
    const crossFrameworkImpact = mappings.map(m => ({
      framework: m.target_framework as FrameworkCode,
      requirement_id: m.target_requirement_id,
      would_satisfy: m.mapping_type === 'equivalent' && m.coverage_percentage >= 80,
    }));

    gaps.push({
      requirement_id: requirement.id,
      requirement_title: requirement.title,
      category: requirement.category,
      priority: requirement.priority,
      current_status: assessment?.status || 'not_assessed',
      gap_description: assessment?.gaps?.join('; ') || `${requirement.title} not implemented`,
      remediation_suggestion: requirement.implementation_guidance || 'Implement the required control',
      estimated_effort: priorityToEffort(requirement.priority),
      cross_framework_impact: crossFrameworkImpact,
    });
  }

  // Sort by priority (critical first) using shared utility
  return sortByPriority(gaps);
}

/**
 * Calculate full compliance result for a framework
 */
export function calculateFrameworkCompliance(
  input: FrameworkComplianceInput
): FrameworkComplianceResult {
  const { framework, assessments } = input;
  const requirements = getFrameworkRequirements(framework);

  const overallScore = calculateFrameworkScore(framework, assessments);
  const categoryScores = calculateCategoryScores(framework, assessments);
  const gaps = identifyGaps(framework, assessments);

  const criticalGaps = gaps.filter(g => g.priority === 'critical');
  const requirementsMet = assessments.filter(a => a.status === 'compliant').length;

  return {
    framework,
    overall_score: overallScore,
    status: getComplianceStatusFromScore(overallScore),
    category_scores: categoryScores,
    requirements_met: requirementsMet,
    requirements_total: requirements.length,
    critical_gaps: criticalGaps,
    last_assessed_at: new Date(),
  };
}

// ============================================================================
// Cross-Framework Analysis
// ============================================================================

export interface CrossFrameworkAnalysis {
  vendor_id: string;
  frameworks: FrameworkCode[];
  compliance_scores: Record<FrameworkCode, number>;
  cross_framework_coverage: {
    source: FrameworkCode;
    target: FrameworkCode;
    coverage: number;
    details: ReturnType<typeof getFrameworkOverlapSummary>;
  }[];
  unified_gaps: FrameworkGap[];
  high_value_controls: {
    requirement_id: string;
    requirement_title: string;
    framework: FrameworkCode;
    satisfies_frameworks: FrameworkCode[];
    priority: RequirementPriority;
  }[];
}

/**
 * Analyze compliance across multiple frameworks
 */
export function analyzeMultiFrameworkCompliance(
  vendorId: string,
  frameworkCompliance: Record<FrameworkCode, FrameworkComplianceResult>
): CrossFrameworkAnalysis {
  const frameworks = Object.keys(frameworkCompliance) as FrameworkCode[];

  // Calculate compliance scores
  const compliance_scores: Record<FrameworkCode, number> = {} as Record<FrameworkCode, number>;
  for (const fw of frameworks) {
    compliance_scores[fw] = frameworkCompliance[fw].overall_score;
  }

  // Calculate cross-framework coverage
  const cross_framework_coverage: CrossFrameworkAnalysis['cross_framework_coverage'] = [];
  for (const source of frameworks) {
    for (const target of frameworks) {
      if (source !== target) {
        const coverage = calculateCrossFrameworkCoverage(
          source,
          target,
          compliance_scores[source]
        );
        const details = getFrameworkOverlapSummary(source, target);
        if (details.total_mappings > 0) {
          cross_framework_coverage.push({ source, target, coverage, details });
        }
      }
    }
  }

  // Collect all gaps
  const unified_gaps: FrameworkGap[] = [];
  for (const fw of frameworks) {
    unified_gaps.push(...frameworkCompliance[fw].critical_gaps);
  }

  // Deduplicate and sort by priority
  const uniqueGaps = unified_gaps.reduce((acc, gap) => {
    const existing = acc.find(g => g.requirement_title === gap.requirement_title);
    if (!existing) {
      acc.push(gap);
    }
    return acc;
  }, [] as FrameworkGap[]);

  // Identify high-value controls (those that satisfy multiple frameworks)
  const high_value_controls: CrossFrameworkAnalysis['high_value_controls'] = [];

  for (const fw of frameworks) {
    const requirements = getFrameworkRequirements(fw);
    for (const req of requirements) {
      const mappings = getMappingsForRequirement(req.id);
      const satisfiesFrameworks = new Set<FrameworkCode>();
      satisfiesFrameworks.add(fw);

      for (const mapping of mappings) {
        if (mapping.mapping_type === 'equivalent' && mapping.coverage_percentage >= 70) {
          satisfiesFrameworks.add(mapping.target_framework as FrameworkCode);
        }
      }

      if (satisfiesFrameworks.size > 1 && req.priority !== 'low') {
        high_value_controls.push({
          requirement_id: req.id,
          requirement_title: req.title,
          framework: fw,
          satisfies_frameworks: Array.from(satisfiesFrameworks),
          priority: req.priority,
        });
      }
    }
  }

  // Sort high-value controls by number of frameworks satisfied
  high_value_controls.sort((a, b) =>
    b.satisfies_frameworks.length - a.satisfies_frameworks.length ||
    getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
  );

  return {
    vendor_id: vendorId,
    frameworks,
    compliance_scores,
    cross_framework_coverage,
    unified_gaps: uniqueGaps,
    high_value_controls: high_value_controls.slice(0, 20), // Top 20
  };
}

// ============================================================================
// Evidence Mapping
// ============================================================================

export interface EvidenceMapping {
  evidence_id: string;
  evidence_type: string;
  frameworks_covered: FrameworkCode[];
  requirements_covered: {
    framework: FrameworkCode;
    requirement_id: string;
    requirement_title: string;
    coverage: number;
  }[];
}

/**
 * Map evidence to framework requirements
 */
export function mapEvidenceToRequirements(
  evidenceType: string,
  frameworks: FrameworkCode[]
): EvidenceMapping['requirements_covered'] {
  const covered: EvidenceMapping['requirements_covered'] = [];

  for (const fw of frameworks) {
    const requirements = getFrameworkRequirements(fw);
    for (const req of requirements) {
      if (req.evidence_types.includes(evidenceType as never)) {
        covered.push({
          framework: fw,
          requirement_id: req.id,
          requirement_title: req.title,
          coverage: 100, // Full coverage for direct evidence type match
        });
      }
    }
  }

  return covered;
}

// ============================================================================
// Reporting Helpers
// ============================================================================

/**
 * Generate compliance summary for reporting
 */
export interface ComplianceSummary {
  overall_status: ComplianceStatus;
  overall_score: number;
  frameworks: {
    code: FrameworkCode;
    name: string;
    score: number;
    status: ComplianceStatus;
    critical_gap_count: number;
  }[];
  total_requirements: number;
  total_met: number;
  total_critical_gaps: number;
  recommended_priorities: string[];
}

export function generateComplianceSummary(
  frameworkResults: Record<FrameworkCode, FrameworkComplianceResult>
): ComplianceSummary {
  const frameworks = Object.entries(frameworkResults).map(([code, result]) => ({
    code: code as FrameworkCode,
    name: {
      dora: 'DORA',
      nis2: 'NIS2 Directive',
      gdpr: 'GDPR Article 32',
      iso27001: 'ISO 27001:2022',
    }[code] || code,
    score: result.overall_score,
    status: result.status,
    critical_gap_count: result.critical_gaps.length,
  }));

  const totalScore = frameworks.reduce((sum, f) => sum + f.score, 0) / frameworks.length;
  const totalRequirements = Object.values(frameworkResults).reduce(
    (sum, r) => sum + r.requirements_total, 0
  );
  const totalMet = Object.values(frameworkResults).reduce(
    (sum, r) => sum + r.requirements_met, 0
  );
  const totalCriticalGaps = frameworks.reduce((sum, f) => sum + f.critical_gap_count, 0);

  // Generate recommended priorities
  const priorities: string[] = [];
  if (totalCriticalGaps > 0) {
    priorities.push(`Address ${totalCriticalGaps} critical gaps immediately`);
  }

  const lowestFramework = frameworks.reduce((lowest, f) =>
    f.score < lowest.score ? f : lowest
  );
  if (lowestFramework.score < 60) {
    priorities.push(`Focus on ${lowestFramework.name} compliance (currently ${lowestFramework.score}%)`);
  }

  return {
    overall_status: getComplianceStatusFromScore(Math.round(totalScore)),
    overall_score: Math.round(totalScore),
    frameworks,
    total_requirements: totalRequirements,
    total_met: totalMet,
    total_critical_gaps: totalCriticalGaps,
    recommended_priorities: priorities,
  };
}
