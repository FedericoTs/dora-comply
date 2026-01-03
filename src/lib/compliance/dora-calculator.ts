/**
 * DORA Compliance Calculator
 *
 * Calculates vendor DORA compliance based on:
 * 1. Parsed SOC 2 controls
 * 2. SOC 2 to DORA mappings
 * 3. Maturity level assessment
 *
 * Returns precise compliance scores with gap analysis
 */

import type {
  MaturityLevel,
  DORAPillar,
  DORARequirement,
  SOC2ToDORAMapping,
  VendorDORAEvidence,
  PillarScore,
  GapItem,
  DORAComplianceResult,
  EvidenceSource,
} from './dora-types';
import { MaturityLevel as ML } from './dora-types';
import { DORA_REQUIREMENTS, SOC2_TO_DORA_MAPPINGS } from './dora-requirements-data';

// =============================================================================
// Types for SOC 2 parsed data (from parsed_soc2 table)
// =============================================================================

interface ParsedSOC2Control {
  id: string;
  category: string;
  description: string;
  testResult?: 'operating_effectively' | 'exception' | 'not_tested';
  pageRef?: number;
}

interface ParsedSOC2Data {
  id: string;
  document_id: string;
  report_type: string;
  audit_firm: string;
  opinion: string;
  period_start: string;
  period_end: string;
  controls: ParsedSOC2Control[];
  exceptions: Array<{ controlId: string; description: string }>;
  cuecs: Array<{ id: string; description: string }>;
  subservice_orgs: Array<{ name: string; services: string }>;
  confidence_score: number;
}

// =============================================================================
// Core Calculation Functions
// =============================================================================

/**
 * Calculate DORA compliance for a vendor based on their SOC 2 report
 */
export function calculateDORACompliance(
  vendorId: string,
  vendorName: string,
  parsedSOC2: ParsedSOC2Data,
  documentInfo: { id: string; name: string; type: string }
): DORAComplianceResult {
  const assessmentDate = new Date().toISOString();

  // Get all requirements and mappings
  const requirements = DORA_REQUIREMENTS;
  const mappings = SOC2_TO_DORA_MAPPINGS;

  // Calculate evidence for each requirement
  const evidenceByRequirement = new Map<string, VendorDORAEvidence>();

  for (const req of requirements) {
    const evidence = calculateRequirementEvidence(
      req,
      parsedSOC2,
      mappings,
      documentInfo
    );
    evidenceByRequirement.set(req.id, evidence);
  }

  // Calculate pillar scores
  const pillars = calculatePillarScores(requirements, evidenceByRequirement);

  // Calculate overall maturity
  const pillarScores = Object.values(pillars);
  const overallMaturity = calculateOverallMaturity(pillarScores);
  const overallPercentage = calculateOverallPercentage(pillarScores);
  const overallStatus = determineOverallStatus(overallMaturity);

  // Gather gaps
  const allGaps = gatherAllGaps(requirements, evidenceByRequirement, mappings);
  const criticalGaps = allGaps.filter(g => g.priority === 'critical');

  // Evidence summary
  const evidenceArray = Array.from(evidenceByRequirement.values());
  const evidenceSummary = {
    total: evidenceArray.length,
    sufficient: evidenceArray.filter(e => e.maturity_level !== null && e.maturity_level >= ML.L3_WELL_DEFINED).length,
    partial: evidenceArray.filter(e => e.maturity_level !== null && e.maturity_level === ML.L2_PLANNED).length,
    insufficient: evidenceArray.filter(e => e.maturity_level === null || e.maturity_level < ML.L2_PLANNED).length,
  };

  // Estimate remediation time based on gaps
  const estimatedRemediationMonths = estimateRemediationTime(allGaps);

  return {
    vendorId,
    vendorName,
    assessmentDate,
    overallMaturity,
    overallStatus,
    overallPercentage,
    pillars,
    criticalGaps,
    allGaps,
    totalGaps: allGaps.length,
    evidenceSummary,
    estimatedRemediationMonths,
    sourceDocuments: [{
      id: documentInfo.id,
      name: documentInfo.name,
      type: documentInfo.type,
      parsedAt: assessmentDate,
    }],
  };
}

/**
 * Calculate evidence status for a single DORA requirement
 */
function calculateRequirementEvidence(
  requirement: DORARequirement,
  parsedSOC2: ParsedSOC2Data,
  mappings: SOC2ToDORAMapping[],
  documentInfo: { id: string; name: string }
): VendorDORAEvidence {
  // Find mappings for this requirement
  const reqMappings = mappings.filter(m => m.dora_requirement_id === requirement.id);

  if (reqMappings.length === 0 || reqMappings.every(m => m.mapping_strength === 'none')) {
    // No SOC 2 coverage for this requirement
    return createMissingEvidence(requirement, documentInfo);
  }

  // Find matching controls
  const evidenceSources: EvidenceSource[] = [];
  let totalCoverage = 0;
  let mappingCount = 0;

  for (const mapping of reqMappings) {
    if (mapping.mapping_strength === 'none') continue;

    const pattern = mapping.soc2_control_pattern
      ? new RegExp(mapping.soc2_control_pattern, 'i')
      : new RegExp(`^${mapping.soc2_category}`, 'i');

    const matchingControls = parsedSOC2.controls.filter(c => pattern.test(c.id));

    for (const control of matchingControls) {
      evidenceSources.push({
        documentId: documentInfo.id,
        documentName: documentInfo.name,
        controlId: control.id,
        pageRef: control.pageRef,
        confidence: parsedSOC2.confidence_score,
      });
    }

    totalCoverage += mapping.coverage_percentage;
    mappingCount++;
  }

  const avgCoverage = mappingCount > 0 ? totalCoverage / mappingCount : 0;

  // Determine maturity level based on coverage and control effectiveness
  const maturityLevel = calculateMaturityFromEvidence(
    evidenceSources,
    avgCoverage,
    parsedSOC2.controls,
    parsedSOC2.exceptions
  );

  // Determine design and operating status
  const designStatus = evidenceSources.length > 0 ? 'validated' : 'missing';
  const operatingStatus = determineOperatingStatus(evidenceSources, parsedSOC2.exceptions);

  // Gap analysis
  const gapType = determineGapType(designStatus, operatingStatus, avgCoverage);
  const primaryMapping = reqMappings.find(m => m.mapping_strength !== 'none');

  return {
    id: crypto.randomUUID(),
    vendor_id: '',
    organization_id: '',
    requirement_id: requirement.id,
    design_status: designStatus,
    operating_status: operatingStatus,
    maturity_level: maturityLevel,
    evidence_sources: evidenceSources,
    gap_type: gapType,
    gap_description: gapType !== 'none' ? primaryMapping?.gap_description || null : null,
    remediation_priority: gapType !== 'none' ? requirement.priority : null,
    remediation_status: 'not_started',
    remediation_notes: null,
    verified_by: null,
    verified_at: null,
    verification_method: 'ai_extracted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Create evidence record for requirements with no SOC 2 coverage
 */
function createMissingEvidence(
  requirement: DORARequirement,
  documentInfo: { id: string; name: string }
): VendorDORAEvidence {
  // Find the mapping to get gap description
  const mapping = SOC2_TO_DORA_MAPPINGS.find(
    m => m.dora_requirement_id === requirement.id && m.mapping_strength === 'none'
  );

  return {
    id: crypto.randomUUID(),
    vendor_id: '',
    organization_id: '',
    requirement_id: requirement.id,
    design_status: 'missing',
    operating_status: 'not_tested',
    maturity_level: ML.L0_NOT_PERFORMED,
    evidence_sources: [],
    gap_type: 'both',
    gap_description: mapping?.gap_description || `No SOC 2 coverage for ${requirement.article_number}`,
    remediation_priority: requirement.priority,
    remediation_status: 'not_started',
    remediation_notes: mapping?.remediation_guidance || null,
    verified_by: null,
    verified_at: null,
    verification_method: 'ai_extracted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Calculate maturity level from evidence quality
 */
function calculateMaturityFromEvidence(
  sources: EvidenceSource[],
  coveragePercentage: number,
  allControls: ParsedSOC2Control[],
  exceptions: Array<{ controlId: string }>
): MaturityLevel {
  if (sources.length === 0) {
    return ML.L0_NOT_PERFORMED;
  }

  // Check if any evidence sources have exceptions
  const hasExceptions = sources.some(s =>
    exceptions.some(e => e.controlId === s.controlId)
  );

  // Calculate based on coverage and effectiveness
  if (coveragePercentage >= 85 && !hasExceptions) {
    // Check if controls are well-documented
    const wellDocumented = sources.every(s => {
      const control = allControls.find(c => c.id === s.controlId);
      return control?.description && control.description.length > 100;
    });
    return wellDocumented ? ML.L3_WELL_DEFINED : ML.L2_PLANNED;
  }

  if (coveragePercentage >= 60 && !hasExceptions) {
    return ML.L2_PLANNED;
  }

  if (coveragePercentage >= 30 || sources.length > 0) {
    return ML.L1_INFORMAL;
  }

  return ML.L0_NOT_PERFORMED;
}

/**
 * Determine operating effectiveness status
 */
function determineOperatingStatus(
  sources: EvidenceSource[],
  exceptions: Array<{ controlId: string }>
): 'validated' | 'partial' | 'missing' | 'not_tested' {
  if (sources.length === 0) {
    return 'not_tested';
  }

  const hasExceptions = sources.some(s =>
    exceptions.some(e => e.controlId === s.controlId)
  );

  if (hasExceptions) {
    return 'partial';
  }

  return 'validated';
}

/**
 * Determine gap type based on evidence status
 */
function determineGapType(
  designStatus: string,
  operatingStatus: string,
  coveragePercentage: number
): 'design' | 'operational' | 'both' | 'none' {
  if (designStatus === 'missing' || coveragePercentage < 30) {
    return operatingStatus === 'validated' ? 'design' : 'both';
  }

  if (operatingStatus === 'partial' || operatingStatus === 'not_tested') {
    return 'operational';
  }

  if (coveragePercentage < 70) {
    return 'design';
  }

  return 'none';
}

/**
 * Calculate scores for each DORA pillar
 */
function calculatePillarScores(
  requirements: DORARequirement[],
  evidenceMap: Map<string, VendorDORAEvidence>
): Record<DORAPillar, PillarScore> {
  const pillars: DORAPillar[] = ['ICT_RISK', 'INCIDENT', 'TESTING', 'TPRM', 'SHARING'];
  const result: Record<DORAPillar, PillarScore> = {} as Record<DORAPillar, PillarScore>;

  for (const pillar of pillars) {
    const pillarReqs = requirements.filter(r => r.pillar === pillar);
    const pillarEvidence = pillarReqs.map(r => evidenceMap.get(r.id)!);

    let totalWeight = 0;
    let weightedScore = 0;
    const gaps: GapItem[] = [];

    for (let i = 0; i < pillarReqs.length; i++) {
      const req = pillarReqs[i];
      const evidence = pillarEvidence[i];
      const weight = req.priority === 'critical' ? 3 : req.priority === 'high' ? 2 : 1;

      totalWeight += weight;
      const maturity = evidence?.maturity_level ?? 0;
      weightedScore += (maturity / 4) * weight * 100;

      // Add to gaps if below threshold
      if (maturity < ML.L2_PLANNED) {
        const mapping = SOC2_TO_DORA_MAPPINGS.find(m => m.dora_requirement_id === req.id);
        gaps.push({
          requirementId: req.id,
          articleNumber: req.article_number,
          articleTitle: req.article_title,
          gapType: evidence?.gap_type || 'both',
          gapDescription: evidence?.gap_description || mapping?.gap_description || 'Gap not specified',
          remediationGuidance: mapping?.remediation_guidance || 'Remediation guidance not available',
          priority: req.priority,
          estimatedEffort: estimateEffortForRequirement(req),
          soc2Coverage: mapping?.mapping_strength || 'none',
        });
      }
    }

    const percentageScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
    const maturityLevel = scoreToMaturity(percentageScore);
    const requirementsMet = pillarEvidence.filter(e => e && e.maturity_level !== null && e.maturity_level >= ML.L2_PLANNED).length;

    result[pillar] = {
      pillar,
      maturityLevel,
      percentageScore,
      requirementsMet,
      requirementsTotal: pillarReqs.length,
      gaps,
      status: maturityLevel >= ML.L3_WELL_DEFINED ? 'compliant' :
              maturityLevel >= ML.L2_PLANNED ? 'partial' : 'non_compliant',
    };
  }

  return result;
}

/**
 * Convert percentage score to maturity level
 */
function scoreToMaturity(percentage: number): MaturityLevel {
  if (percentage >= 85) return ML.L4_QUANTITATIVE;
  if (percentage >= 70) return ML.L3_WELL_DEFINED;
  if (percentage >= 50) return ML.L2_PLANNED;
  if (percentage >= 25) return ML.L1_INFORMAL;
  return ML.L0_NOT_PERFORMED;
}

/**
 * Calculate overall maturity from pillar scores
 */
function calculateOverallMaturity(pillarScores: PillarScore[]): MaturityLevel {
  // Overall maturity is the minimum of all pillars (weakest link)
  // But weighted by pillar importance
  const pillarWeights: Record<DORAPillar, number> = {
    ICT_RISK: 3,
    INCIDENT: 3,
    TESTING: 2,
    TPRM: 3,
    SHARING: 1,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const score of pillarScores) {
    const weight = pillarWeights[score.pillar];
    totalWeight += weight;
    weightedSum += score.maturityLevel * weight;
  }

  const avgMaturity = totalWeight > 0 ? Math.floor(weightedSum / totalWeight) : 0;
  return avgMaturity as MaturityLevel;
}

/**
 * Calculate overall percentage from pillar scores
 */
function calculateOverallPercentage(pillarScores: PillarScore[]): number {
  const pillarWeights: Record<DORAPillar, number> = {
    ICT_RISK: 3,
    INCIDENT: 3,
    TESTING: 2,
    TPRM: 3,
    SHARING: 1,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const score of pillarScores) {
    const weight = pillarWeights[score.pillar];
    totalWeight += weight;
    weightedSum += score.percentageScore * weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Determine overall compliance status
 */
function determineOverallStatus(maturity: MaturityLevel): 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' {
  if (maturity >= ML.L3_WELL_DEFINED) return 'compliant';
  if (maturity >= ML.L2_PLANNED) return 'partial';
  return 'non_compliant';
}

/**
 * Gather all gaps across requirements
 */
function gatherAllGaps(
  requirements: DORARequirement[],
  evidenceMap: Map<string, VendorDORAEvidence>,
  mappings: SOC2ToDORAMapping[]
): GapItem[] {
  const gaps: GapItem[] = [];

  for (const req of requirements) {
    const evidence = evidenceMap.get(req.id);
    if (!evidence || evidence.maturity_level === null || evidence.maturity_level < ML.L2_PLANNED) {
      const mapping = mappings.find(m => m.dora_requirement_id === req.id);
      gaps.push({
        requirementId: req.id,
        articleNumber: req.article_number,
        articleTitle: req.article_title,
        gapType: evidence?.gap_type || 'both',
        gapDescription: evidence?.gap_description || mapping?.gap_description || 'Gap not specified',
        remediationGuidance: mapping?.remediation_guidance || 'Remediation guidance not available',
        priority: req.priority,
        estimatedEffort: estimateEffortForRequirement(req),
        soc2Coverage: mapping?.mapping_strength || 'none',
      });
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return gaps;
}

/**
 * Estimate effort for remediating a requirement gap
 */
function estimateEffortForRequirement(requirement: DORARequirement): string {
  const priorityEffort: Record<string, string> = {
    critical: '4-8 weeks',
    high: '2-4 weeks',
    medium: '1-2 weeks',
    low: '< 1 week',
  };
  return priorityEffort[requirement.priority] || '2-4 weeks';
}

/**
 * Estimate total remediation time based on gaps
 */
function estimateRemediationTime(gaps: GapItem[]): number {
  const criticalCount = gaps.filter(g => g.priority === 'critical').length;
  const highCount = gaps.filter(g => g.priority === 'high').length;
  const mediumCount = gaps.filter(g => g.priority === 'medium').length;

  // Rough estimate: critical = 2 months, high = 1 month, medium = 0.5 months
  // Assuming some parallelization
  const totalMonths = (criticalCount * 2 + highCount * 1 + mediumCount * 0.5) * 0.6; // 40% parallelization

  return Math.ceil(totalMonths);
}

// =============================================================================
// Utility Exports
// =============================================================================

export { DORA_REQUIREMENTS, SOC2_TO_DORA_MAPPINGS } from './dora-requirements-data';
