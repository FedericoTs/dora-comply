/**
 * DORA Compliance Module
 *
 * Provides comprehensive DORA compliance scoring based on SOC 2 reports.
 * Uses maturity levels (L0-L4) instead of misleading percentages.
 */

export * from './dora-types';
export * from './dora-calculator';
export {
  DORA_REQUIREMENTS,
  SOC2_TO_DORA_MAPPINGS,
  getRequirementsByPillar,
  getMappingForRequirement,
  getMappingsForSOC2Category,
  getRequirementsWithoutSOC2Coverage,
  getCriticalRequirements,
} from './dora-requirements-data';
