/**
 * Cross-Framework Mappings Index
 *
 * Exports all cross-framework mappings and utility functions.
 */

// Individual mapping files
export * from './dora-nis2';
export * from './dora-iso27001';
export * from './dora-gdpr';
export * from './nis2-iso27001';
export * from './gdpr-iso27001';

// Re-export all mappings as a combined array
import { DORA_NIS2_MAPPINGS } from './dora-nis2';
import { DORA_ISO27001_MAPPINGS } from './dora-iso27001';
import { DORA_GDPR_MAPPINGS } from './dora-gdpr';
import { NIS2_ISO27001_MAPPINGS } from './nis2-iso27001';
import { GDPR_ISO27001_MAPPINGS } from './gdpr-iso27001';
import { CrossFrameworkMapping, FrameworkCode } from '../framework-types';

/**
 * All cross-framework mappings combined
 */
export const ALL_FRAMEWORK_MAPPINGS: CrossFrameworkMapping[] = [
  ...DORA_NIS2_MAPPINGS,
  ...DORA_ISO27001_MAPPINGS,
  ...DORA_GDPR_MAPPINGS,
  ...NIS2_ISO27001_MAPPINGS,
  ...GDPR_ISO27001_MAPPINGS,
];

/**
 * Get mappings from a source framework to a target framework
 */
export function getMappingsBetweenFrameworks(
  source: FrameworkCode,
  target: FrameworkCode
): CrossFrameworkMapping[] {
  return ALL_FRAMEWORK_MAPPINGS.filter(
    m => m.source_framework === source && m.target_framework === target
  );
}

/**
 * Get all mappings involving a specific framework (as source or target)
 */
export function getMappingsForFramework(framework: FrameworkCode): CrossFrameworkMapping[] {
  return ALL_FRAMEWORK_MAPPINGS.filter(
    m => m.source_framework === framework ||
         (m.target_framework === framework && m.bidirectional)
  );
}

/**
 * Get all mappings for a specific requirement
 */
export function getMappingsForRequirement(requirementId: string): CrossFrameworkMapping[] {
  return ALL_FRAMEWORK_MAPPINGS.filter(
    m => m.source_requirement_id === requirementId ||
         (m.target_requirement_id === requirementId && m.bidirectional)
  );
}

/**
 * Get summary of framework overlap
 */
export interface FrameworkOverlapSummary {
  source: FrameworkCode;
  target: FrameworkCode;
  total_mappings: number;
  equivalent_count: number;
  partial_count: number;
  supports_count: number;
  related_count: number;
  average_coverage: number;
}

export function getFrameworkOverlapSummary(
  source: FrameworkCode,
  target: FrameworkCode
): FrameworkOverlapSummary {
  const mappings = getMappingsBetweenFrameworks(source, target);

  if (mappings.length === 0) {
    return {
      source,
      target,
      total_mappings: 0,
      equivalent_count: 0,
      partial_count: 0,
      supports_count: 0,
      related_count: 0,
      average_coverage: 0,
    };
  }

  const typeCounts = mappings.reduce((acc, m) => {
    acc[m.mapping_type] = (acc[m.mapping_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgCoverage = mappings.reduce((sum, m) => sum + m.coverage_percentage, 0) / mappings.length;

  return {
    source,
    target,
    total_mappings: mappings.length,
    equivalent_count: typeCounts['equivalent'] || 0,
    partial_count: typeCounts['partial'] || 0,
    supports_count: typeCounts['supports'] || 0,
    related_count: typeCounts['related'] || 0,
    average_coverage: Math.round(avgCoverage),
  };
}

/**
 * Get all framework overlap summaries
 */
export function getAllFrameworkOverlaps(): FrameworkOverlapSummary[] {
  const frameworks: FrameworkCode[] = ['dora', 'nis2', 'gdpr', 'iso27001'];
  const summaries: FrameworkOverlapSummary[] = [];

  for (const source of frameworks) {
    for (const target of frameworks) {
      if (source !== target) {
        const summary = getFrameworkOverlapSummary(source, target);
        if (summary.total_mappings > 0) {
          summaries.push(summary);
        }
      }
    }
  }

  return summaries;
}

/**
 * Calculate how much of a target framework is covered by being compliant with source
 */
export function calculateCrossFrameworkCoverage(
  source: FrameworkCode,
  target: FrameworkCode,
  sourceComplianceLevel: number // 0-100
): number {
  const mappings = getMappingsBetweenFrameworks(source, target);
  if (mappings.length === 0) return 0;

  // Weight by mapping type and coverage percentage
  const totalPotentialCoverage = mappings.reduce((sum, m) => {
    const typeWeight = {
      'equivalent': 1.0,
      'partial': 0.7,
      'supports': 0.5,
      'related': 0.3,
    }[m.mapping_type];
    return sum + (m.coverage_percentage * typeWeight * m.confidence);
  }, 0);

  const maxCoverage = mappings.length * 100;
  const coverageRatio = totalPotentialCoverage / maxCoverage;

  // Apply source compliance level
  return Math.round(coverageRatio * sourceComplianceLevel);
}
