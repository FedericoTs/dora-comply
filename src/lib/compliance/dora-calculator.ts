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
import {
  getEffortEstimate,
  EFFORT_WEEKS,
  type PriorityLevel,
} from './scoring-utils';

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

// Exception with severity information for accurate DORA scoring
interface ParsedSOC2Exception {
  controlId: string;
  description: string;
  exceptionType?: 'design_deficiency' | 'operating_deficiency' | 'population_deviation';
  impact?: 'low' | 'medium' | 'high';
  managementResponse?: string;
  remediationDate?: string;
  remediationVerified?: boolean;
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
  exceptions: ParsedSOC2Exception[];
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

  // Evidence summary - using L3_WELL_DEFINED as minimum for "sufficient"
  const evidenceArray = Array.from(evidenceByRequirement.values());
  const evidenceSummary = {
    total: evidenceArray.length,
    sufficient: evidenceArray.filter(e => e.maturity_level !== null && e.maturity_level >= ML.L3_WELL_DEFINED).length,
    partial: evidenceArray.filter(e => e.maturity_level !== null &&
      (e.maturity_level === ML.L2_PLANNED || e.maturity_level === ML.L1_INFORMAL)).length,
    insufficient: evidenceArray.filter(e => e.maturity_level === null || e.maturity_level === ML.L0_NOT_PERFORMED).length,
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
  // Parameter kept for API consistency with extractEvidenceForRequirement
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _documentInfo: { id: string; name: string }
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
 * Calculate exception severity score
 * Lower score = more severe (worse for compliance)
 *
 * Design deficiencies are most severe as they indicate missing controls
 * High impact exceptions significantly reduce the score
 * Remediated exceptions have less impact
 */
function calculateExceptionSeverityScore(exception: ParsedSOC2Exception): number {
  // Type scoring (design is worst)
  const typeScore: Record<string, number> = {
    'design_deficiency': 0.3,      // Missing control - very bad
    'operating_deficiency': 0.5,   // Control exists but didn't work
    'population_deviation': 0.7,   // Minor testing deviation
  };

  // Impact scoring
  const impactScore: Record<string, number> = {
    'high': 0.4,
    'medium': 0.6,
    'low': 0.8,
  };

  const baseTypeScore = typeScore[exception.exceptionType || 'operating_deficiency'] || 0.5;
  const baseImpactScore = impactScore[exception.impact || 'medium'] || 0.6;

  // If remediated and verified, exception has less impact
  let remediationBonus = 0;
  if (exception.remediationVerified) {
    remediationBonus = 0.3; // Verified remediation significantly reduces impact
  } else if (exception.remediationDate) {
    const remediationDate = new Date(exception.remediationDate);
    if (remediationDate < new Date()) {
      remediationBonus = 0.15; // Past remediation date, unverified
    }
  }

  return Math.min(1.0, baseTypeScore * baseImpactScore + remediationBonus);
}

/**
 * Calculate maturity level from evidence quality
 *
 * CRITICAL: This function now properly factors in exception SEVERITY:
 * - Exception type (design_deficiency is worse than operating_deficiency)
 * - Exception impact (high/medium/low)
 * - Remediation status (verified remediation reduces impact)
 */
function calculateMaturityFromEvidence(
  sources: EvidenceSource[],
  coveragePercentage: number,
  allControls: ParsedSOC2Control[],
  exceptions: ParsedSOC2Exception[]
): MaturityLevel {
  if (sources.length === 0) {
    return ML.L0_NOT_PERFORMED;
  }

  // Find exceptions that affect our evidence sources
  const relevantExceptions = exceptions.filter(e =>
    sources.some(s => s.controlId === e.controlId)
  );

  // Calculate exception impact on maturity
  let exceptionPenalty = 0;
  let hasSevereException = false;

  for (const exception of relevantExceptions) {
    const severityScore = calculateExceptionSeverityScore(exception);

    // Severe exceptions (design deficiency + high impact) drop maturity significantly
    if (severityScore < 0.3) {
      hasSevereException = true;
    }

    // Each exception reduces the effective score
    // Low severity = small penalty, high severity = large penalty
    exceptionPenalty += (1 - severityScore) * 15; // Up to 15% penalty per exception
  }

  // Cap total penalty at 50%
  exceptionPenalty = Math.min(50, exceptionPenalty);

  // Calculate effective coverage after exception penalty
  const effectiveCoverage = coveragePercentage * ((100 - exceptionPenalty) / 100);

  // Check documentation quality
  const wellDocumented = sources.every(s => {
    const control = allControls.find(c => c.id === s.controlId);
    return control?.description && control.description.length > 100;
  });

  // If there's a severe exception, cap at L2 regardless of coverage
  if (hasSevereException) {
    if (effectiveCoverage >= 50) {
      return ML.L2_PLANNED;
    }
    return ML.L1_INFORMAL;
  }

  // Calculate maturity based on effective coverage
  if (effectiveCoverage >= 85 && relevantExceptions.length === 0) {
    return wellDocumented ? ML.L4_QUANTITATIVE : ML.L3_WELL_DEFINED;
  }

  if (effectiveCoverage >= 70) {
    return wellDocumented ? ML.L3_WELL_DEFINED : ML.L2_PLANNED;
  }

  if (effectiveCoverage >= 50) {
    return ML.L2_PLANNED;
  }

  if (effectiveCoverage >= 25 || sources.length > 0) {
    return ML.L1_INFORMAL;
  }

  return ML.L0_NOT_PERFORMED;
}

/**
 * Determine operating effectiveness status
 *
 * Now considers exception severity:
 * - High impact or design deficiency = 'missing' (severe gap)
 * - Medium impact = 'partial'
 * - Low impact with remediation = 'partial' (close to validated)
 */
function determineOperatingStatus(
  sources: EvidenceSource[],
  exceptions: ParsedSOC2Exception[]
): 'validated' | 'partial' | 'missing' | 'not_tested' {
  if (sources.length === 0) {
    return 'not_tested';
  }

  // Find exceptions affecting our sources
  const relevantExceptions = exceptions.filter(e =>
    sources.some(s => s.controlId === e.controlId)
  );

  if (relevantExceptions.length === 0) {
    return 'validated';
  }

  // Check for severe exceptions
  const hasSevereException = relevantExceptions.some(e =>
    e.exceptionType === 'design_deficiency' ||
    e.impact === 'high'
  );

  if (hasSevereException) {
    return 'missing'; // Severe exception = effectively missing control
  }

  // Check if all exceptions are low impact and remediated
  const allLowAndRemediated = relevantExceptions.every(e =>
    e.impact === 'low' && (e.remediationVerified || e.remediationDate)
  );

  if (allLowAndRemediated) {
    return 'partial'; // Low severity, being addressed
  }

  return 'partial';
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

      // Add to gaps if below L3 threshold (DORA minimum)
      // Also flag if there are operational gaps (exceptions)
      const hasOperationalGap = evidence?.operating_status === 'partial' ||
        evidence?.operating_status === 'missing';

      if (maturity < ML.L3_WELL_DEFINED || hasOperationalGap) {
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
    // Requirements are only "met" at L3 or above (DORA minimum)
    const requirementsMet = pillarEvidence.filter(e => e && e.maturity_level !== null && e.maturity_level >= ML.L3_WELL_DEFINED).length;

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
 *
 * CRITICAL FIX: Threshold lowered from L2_PLANNED to L3_WELL_DEFINED
 * For DORA compliance, L3 (Well-Defined) is the minimum acceptable level.
 * Requirements at L2 or below should be flagged as gaps.
 */
function gatherAllGaps(
  requirements: DORARequirement[],
  evidenceMap: Map<string, VendorDORAEvidence>,
  mappings: SOC2ToDORAMapping[]
): GapItem[] {
  const gaps: GapItem[] = [];

  for (const req of requirements) {
    const evidence = evidenceMap.get(req.id);

    // Flag as gap if maturity is below L3 (Well-Defined)
    // This ensures requirements at L2_PLANNED or below are visible as gaps
    const isBelowThreshold = !evidence ||
      evidence.maturity_level === null ||
      evidence.maturity_level < ML.L3_WELL_DEFINED;

    // Also check for operational gaps (exceptions) even at higher maturity
    const hasOperationalGap = evidence?.operating_status === 'partial' ||
      evidence?.operating_status === 'missing';

    if (isBelowThreshold || hasOperationalGap) {
      const mapping = mappings.find(m => m.dora_requirement_id === req.id);

      // Determine gap severity for prioritization
      let adjustedPriority = req.priority;
      if (evidence?.maturity_level === ML.L0_NOT_PERFORMED) {
        // No coverage at all - escalate priority
        adjustedPriority = req.priority === 'low' ? 'medium' :
                          req.priority === 'medium' ? 'high' : 'critical';
      }

      gaps.push({
        requirementId: req.id,
        articleNumber: req.article_number,
        articleTitle: req.article_title,
        gapType: evidence?.gap_type || 'both',
        gapDescription: evidence?.gap_description || mapping?.gap_description || 'Gap not specified',
        remediationGuidance: mapping?.remediation_guidance || 'Remediation guidance not available',
        priority: adjustedPriority,
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
 * Uses shared effort estimates from scoring-utils
 */
function estimateEffortForRequirement(requirement: DORARequirement): string {
  return getEffortEstimate(requirement.priority as PriorityLevel);
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
