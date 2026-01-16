/**
 * Vendor Compliance Scoring
 *
 * State-of-the-art automated compliance scoring for vendors across
 * DORA and NIS2 frameworks. Provides transparent, explainable scores
 * with clear breakdown of contributing factors.
 *
 * Scoring Philosophy:
 * - Automated: No manual scoring required - derives from existing data
 * - Transparent: Each score component is explained
 * - Actionable: Clear indicators of what's missing
 * - Framework-aligned: Based on actual regulatory requirements
 */

import { getCertificationWeight } from './dora-constants';

// ============================================
// TYPES
// ============================================

export interface VendorComplianceInput {
  // Basic info
  tier?: 'critical' | 'important' | 'standard' | null;
  status?: string;

  // Risk assessment
  risk_score?: number | null;
  external_risk_score?: number | null;
  external_risk_grade?: string | null;

  // DORA specific
  lei?: string | null;
  supports_critical_function?: boolean;
  critical_functions?: string[] | null;

  // Assessment tracking
  last_assessment_date?: string | null;
  updated_at?: string;

  // Certifications (optional - if available)
  certifications?: Array<{
    type: string;
    status: string;
    expiry_date?: string | null;
  }>;

  // Contracts (optional - if available)
  contracts?: Array<{
    exit_strategy?: boolean;
    audit_rights?: boolean;
  }>;
}

export interface ScoreComponent {
  name: string;
  score: number;
  maxScore: number;
  status: 'complete' | 'partial' | 'missing';
  description: string;
}

export interface ComplianceScore {
  total: number;
  level: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
  components: ScoreComponent[];
  missingItems: string[];
  nextActions: string[];
}

// ============================================
// DORA COMPLIANCE SCORING
// ============================================

/**
 * Calculate DORA compliance score for a vendor
 *
 * Based on DORA Chapter V (Third-Party Risk Management) requirements:
 * - Article 28: General principles on ICT third-party risk management
 * - Article 29: Preliminary assessment of ICT concentration risk
 * - Article 30: Key contractual provisions
 *
 * Scoring weights:
 * - LEI Identification (25%): Legal Entity Identifier for regulatory reporting
 * - Risk Assessment (25%): Documented risk evaluation
 * - Critical Function Mapping (20%): ICT services supporting critical functions
 * - Assessment Currency (15%): Recent due diligence
 * - Contractual Coverage (15%): Exit strategy, audit rights
 */
export function calculateDoraVendorScore(vendor: VendorComplianceInput): ComplianceScore {
  const components: ScoreComponent[] = [];
  const missingItems: string[] = [];
  const nextActions: string[] = [];

  // 1. LEI Identification (25 points) - Required for Register of Information
  const hasLei = !!vendor.lei;
  components.push({
    name: 'LEI Identification',
    score: hasLei ? 25 : 0,
    maxScore: 25,
    status: hasLei ? 'complete' : 'missing',
    description: hasLei
      ? 'Legal Entity Identifier registered'
      : 'Missing LEI - required for ESA reporting',
  });
  if (!hasLei) {
    missingItems.push('Legal Entity Identifier (LEI)');
    nextActions.push('Obtain LEI from vendor for Register of Information');
  }

  // 2. Risk Assessment (25 points) - Article 28 requirement
  const hasRiskScore = vendor.risk_score !== null && vendor.risk_score !== undefined;
  const hasExternalRisk = vendor.external_risk_score !== null || !!vendor.external_risk_grade;
  const riskScore = hasRiskScore ? 20 : hasExternalRisk ? 15 : 0;
  const riskBonus = hasRiskScore && hasExternalRisk ? 5 : 0;

  components.push({
    name: 'Risk Assessment',
    score: riskScore + riskBonus,
    maxScore: 25,
    status: hasRiskScore ? 'complete' : hasExternalRisk ? 'partial' : 'missing',
    description: hasRiskScore
      ? `Risk score: ${vendor.risk_score}${hasExternalRisk ? ' + external monitoring' : ''}`
      : hasExternalRisk
        ? 'External risk monitoring only - internal assessment needed'
        : 'No risk assessment performed',
  });
  if (!hasRiskScore) {
    missingItems.push('Internal risk assessment');
    nextActions.push('Complete vendor risk assessment questionnaire');
  }

  // 3. Critical Function Mapping (20 points) - Article 28(1)(a)
  const supportsCritical = vendor.supports_critical_function;
  const hasFunctionMapping = vendor.critical_functions && vendor.critical_functions.length > 0;
  const isCriticalTier = vendor.tier === 'critical' || vendor.tier === 'important';

  let functionScore = 0;
  let functionStatus: 'complete' | 'partial' | 'missing' = 'missing';
  let functionDesc = '';

  if (!supportsCritical) {
    // Non-critical vendor - full score (mapping not required)
    functionScore = 20;
    functionStatus = 'complete';
    functionDesc = 'Non-critical ICT service provider';
  } else if (hasFunctionMapping) {
    // Critical vendor with proper mapping
    functionScore = 20;
    functionStatus = 'complete';
    functionDesc = `${vendor.critical_functions!.length} critical function(s) mapped`;
  } else if (isCriticalTier) {
    // Critical tier but no function mapping
    functionScore = 5;
    functionStatus = 'partial';
    functionDesc = 'Critical tier - function mapping required';
    missingItems.push('Critical function mapping');
    nextActions.push('Document which critical/important functions this vendor supports');
  } else {
    functionScore = 10;
    functionStatus = 'partial';
    functionDesc = 'Function mapping incomplete';
  }

  components.push({
    name: 'Critical Function Mapping',
    score: functionScore,
    maxScore: 20,
    status: functionStatus,
    description: functionDesc,
  });

  // 4. Assessment Currency (15 points) - Ongoing due diligence
  const now = new Date();
  const assessmentDate = vendor.last_assessment_date
    ? new Date(vendor.last_assessment_date)
    : null;

  let currencyScore = 0;
  let currencyStatus: 'complete' | 'partial' | 'missing' = 'missing';
  let currencyDesc = '';

  if (assessmentDate) {
    const daysSinceAssessment = (now.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceAssessment <= 90) {
      currencyScore = 15;
      currencyStatus = 'complete';
      currencyDesc = 'Assessment current (< 90 days)';
    } else if (daysSinceAssessment <= 180) {
      currencyScore = 12;
      currencyStatus = 'complete';
      currencyDesc = 'Assessment recent (< 6 months)';
    } else if (daysSinceAssessment <= 365) {
      currencyScore = 8;
      currencyStatus = 'partial';
      currencyDesc = 'Assessment aging (< 1 year)';
      nextActions.push('Schedule reassessment within 90 days');
    } else {
      currencyScore = 4;
      currencyStatus = 'partial';
      currencyDesc = 'Assessment overdue (> 1 year)';
      missingItems.push('Current risk assessment');
      nextActions.push('Reassess vendor immediately - assessment expired');
    }
  } else {
    currencyDesc = 'No assessment date recorded';
    missingItems.push('Initial assessment');
    nextActions.push('Perform initial vendor due diligence');
  }

  components.push({
    name: 'Assessment Currency',
    score: currencyScore,
    maxScore: 15,
    status: currencyStatus,
    description: currencyDesc,
  });

  // 5. Contractual Coverage (15 points) - Article 30
  const hasContract = vendor.contracts && vendor.contracts.length > 0;
  const hasExitStrategy = vendor.contracts?.some((c) => c.exit_strategy) ?? false;
  const hasAuditRights = vendor.contracts?.some((c) => c.audit_rights) ?? false;

  let contractScore = 0;
  if (hasExitStrategy) contractScore += 8;
  if (hasAuditRights) contractScore += 7;
  if (!hasContract) contractScore = 5; // Base score if no contract data (might exist but not tracked)

  const contractStatus: 'complete' | 'partial' | 'missing' =
    contractScore >= 12 ? 'complete' : contractScore > 0 ? 'partial' : 'missing';

  components.push({
    name: 'Contractual Coverage',
    score: contractScore,
    maxScore: 15,
    status: contractStatus,
    description: hasContract
      ? `Exit strategy: ${hasExitStrategy ? '✓' : '✗'}, Audit rights: ${hasAuditRights ? '✓' : '✗'}`
      : 'Contract details not tracked',
  });

  if (hasContract && !hasExitStrategy) {
    missingItems.push('Exit strategy clause');
    nextActions.push('Negotiate exit strategy provisions per Article 30');
  }
  if (hasContract && !hasAuditRights) {
    missingItems.push('Audit rights clause');
    nextActions.push('Include audit rights in contract renewal');
  }

  // Calculate total
  const total = components.reduce((sum, c) => sum + c.score, 0);

  // Determine compliance level
  let level: ComplianceScore['level'];
  if (total >= 80) {
    level = 'compliant';
  } else if (total >= 50) {
    level = 'partial';
  } else if (total > 0) {
    level = 'non_compliant';
  } else {
    level = 'not_assessed';
  }

  return { total, level, components, missingItems, nextActions };
}

// ============================================
// NIS2 COMPLIANCE SCORING
// ============================================

/**
 * Calculate NIS2 compliance score for a vendor
 *
 * Based on NIS2 Directive (EU 2022/2555) requirements:
 * - Article 21: Cybersecurity risk-management measures
 * - Article 22: Supply chain security
 *
 * Scoring weights:
 * - Risk Management (30%): Documented risk assessment
 * - Security Posture (25%): Based on risk score (lower = better)
 * - Assessment Currency (25%): Ongoing monitoring requirement
 * - Supply Chain Controls (20%): Critical function documentation
 */
export function calculateNis2VendorScore(vendor: VendorComplianceInput): ComplianceScore {
  const components: ScoreComponent[] = [];
  const missingItems: string[] = [];
  const nextActions: string[] = [];

  // 1. Risk Management (30 points) - Article 21
  const hasRiskAssessment = vendor.risk_score !== null && vendor.risk_score !== undefined;
  const hasExternalMonitoring = vendor.external_risk_score !== null || !!vendor.external_risk_grade;

  let riskMgmtScore = 0;
  if (hasRiskAssessment) riskMgmtScore += 20;
  if (hasExternalMonitoring) riskMgmtScore += 10;

  components.push({
    name: 'Risk Management',
    score: riskMgmtScore,
    maxScore: 30,
    status: hasRiskAssessment ? 'complete' : hasExternalMonitoring ? 'partial' : 'missing',
    description: hasRiskAssessment
      ? `Risk assessed${hasExternalMonitoring ? ' with continuous monitoring' : ''}`
      : hasExternalMonitoring
        ? 'External monitoring only'
        : 'No risk management data',
  });

  if (!hasRiskAssessment) {
    missingItems.push('Risk assessment');
    nextActions.push('Complete cybersecurity risk assessment per NIS2 Article 21');
  }

  // 2. Security Posture (25 points) - Inverted risk score
  let securityScore = 0;
  let securityStatus: 'complete' | 'partial' | 'missing' = 'missing';
  let securityDesc = '';

  if (hasRiskAssessment) {
    const riskScore = vendor.risk_score!;
    // Invert: lower risk = higher security score
    if (riskScore <= 25) {
      securityScore = 25;
      securityStatus = 'complete';
      securityDesc = 'Excellent security posture (low risk)';
    } else if (riskScore <= 40) {
      securityScore = 20;
      securityStatus = 'complete';
      securityDesc = 'Good security posture';
    } else if (riskScore <= 55) {
      securityScore = 15;
      securityStatus = 'partial';
      securityDesc = 'Moderate security posture';
    } else if (riskScore <= 70) {
      securityScore = 10;
      securityStatus = 'partial';
      securityDesc = 'Security concerns identified';
      nextActions.push('Review vendor security controls and remediation plans');
    } else {
      securityScore = 5;
      securityStatus = 'partial';
      securityDesc = 'High risk - requires attention';
      missingItems.push('Adequate security controls');
      nextActions.push('Escalate vendor security review - high risk identified');
    }
  } else {
    securityDesc = 'Security posture unknown';
  }

  components.push({
    name: 'Security Posture',
    score: securityScore,
    maxScore: 25,
    status: securityStatus,
    description: securityDesc,
  });

  // 3. Assessment Currency (25 points) - Ongoing monitoring requirement
  const now = new Date();
  const assessmentDate = vendor.last_assessment_date
    ? new Date(vendor.last_assessment_date)
    : null;

  let currencyScore = 0;
  let currencyStatus: 'complete' | 'partial' | 'missing' = 'missing';
  let currencyDesc = '';

  if (assessmentDate) {
    const daysSinceAssessment = (now.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceAssessment <= 90) {
      currencyScore = 25;
      currencyStatus = 'complete';
      currencyDesc = 'Monitoring current (< 90 days)';
    } else if (daysSinceAssessment <= 180) {
      currencyScore = 18;
      currencyStatus = 'partial';
      currencyDesc = 'Monitoring recent (< 6 months)';
    } else if (daysSinceAssessment <= 365) {
      currencyScore = 10;
      currencyStatus = 'partial';
      currencyDesc = 'Monitoring stale (< 1 year)';
      nextActions.push('Update vendor assessment - NIS2 requires ongoing monitoring');
    } else {
      currencyScore = 5;
      currencyStatus = 'partial';
      currencyDesc = 'Monitoring overdue (> 1 year)';
      missingItems.push('Current monitoring data');
      nextActions.push('Immediate reassessment required for NIS2 compliance');
    }
  } else {
    currencyDesc = 'No monitoring history';
    missingItems.push('Assessment history');
    nextActions.push('Establish vendor monitoring baseline');
  }

  components.push({
    name: 'Assessment Currency',
    score: currencyScore,
    maxScore: 25,
    status: currencyStatus,
    description: currencyDesc,
  });

  // 4. Supply Chain Controls (20 points) - Article 22
  const isCriticalTier = vendor.tier === 'critical' || vendor.tier === 'important';
  const hasFunctionMapping = vendor.critical_functions && vendor.critical_functions.length > 0;
  const hasCertifications = vendor.certifications && vendor.certifications.length > 0;

  let supplyChainScore = 0;
  let supplyChainStatus: 'complete' | 'partial' | 'missing' = 'missing';
  let supplyChainDesc = '';

  if (hasFunctionMapping || !vendor.supports_critical_function) {
    supplyChainScore += 12;
  }

  if (hasCertifications) {
    // Check for security-relevant certifications
    const hasSecurityCert = vendor.certifications!.some(
      (c) =>
        c.status === 'valid' || c.status === 'active'
    );
    if (hasSecurityCert) {
      supplyChainScore += 8;
    } else {
      supplyChainScore += 4;
    }
  } else if (!isCriticalTier) {
    supplyChainScore += 4; // Non-critical vendors get base score
  }

  supplyChainStatus =
    supplyChainScore >= 16 ? 'complete' : supplyChainScore > 0 ? 'partial' : 'missing';
  supplyChainDesc =
    supplyChainScore >= 16
      ? 'Supply chain controls documented'
      : supplyChainScore > 0
        ? 'Partial supply chain documentation'
        : 'Supply chain controls not documented';

  components.push({
    name: 'Supply Chain Controls',
    score: supplyChainScore,
    maxScore: 20,
    status: supplyChainStatus,
    description: supplyChainDesc,
  });

  if (isCriticalTier && !hasFunctionMapping) {
    missingItems.push('Critical function documentation');
    nextActions.push('Document vendor role in supply chain per NIS2 Article 22');
  }

  // Calculate total
  const total = components.reduce((sum, c) => sum + c.score, 0);

  // Determine compliance level
  let level: ComplianceScore['level'];
  if (total >= 75) {
    level = 'compliant';
  } else if (total >= 45) {
    level = 'partial';
  } else if (total > 0) {
    level = 'non_compliant';
  } else {
    level = 'not_assessed';
  }

  return { total, level, components, missingItems, nextActions };
}

// ============================================
// COMBINED SCORING
// ============================================

export interface CombinedComplianceScore {
  dora: ComplianceScore;
  nis2: ComplianceScore;
  overallHealth: 'healthy' | 'attention' | 'critical' | 'unknown';
  priorityActions: string[];
}

/**
 * Calculate combined compliance scores for both frameworks
 */
export function calculateCombinedVendorScore(
  vendor: VendorComplianceInput
): CombinedComplianceScore {
  const dora = calculateDoraVendorScore(vendor);
  const nis2 = calculateNis2VendorScore(vendor);

  // Determine overall health
  let overallHealth: CombinedComplianceScore['overallHealth'];
  const avgScore = (dora.total + nis2.total) / 2;

  if (avgScore >= 70) {
    overallHealth = 'healthy';
  } else if (avgScore >= 45) {
    overallHealth = 'attention';
  } else if (avgScore > 0) {
    overallHealth = 'critical';
  } else {
    overallHealth = 'unknown';
  }

  // Deduplicate and prioritize actions
  const allActions = [...dora.nextActions, ...nis2.nextActions];
  const uniqueActions = [...new Set(allActions)];

  // Prioritize by criticality (simple heuristic: "immediate" > "escalate" > others)
  const priorityActions = uniqueActions.sort((a, b) => {
    const aUrgent = a.toLowerCase().includes('immediate') || a.toLowerCase().includes('escalate');
    const bUrgent = b.toLowerCase().includes('immediate') || b.toLowerCase().includes('escalate');
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;
    return 0;
  }).slice(0, 3); // Top 3 actions

  return { dora, nis2, overallHealth, priorityActions };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get a simple summary label for a compliance score
 */
export function getScoreSummary(score: number): string {
  if (score >= 80) return 'Compliant';
  if (score >= 60) return 'Mostly Compliant';
  if (score >= 40) return 'Partial';
  if (score > 0) return 'Non-Compliant';
  return 'Not Assessed';
}

/**
 * Get color class for score
 */
export function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-lime-600';
  if (score >= 40) return 'text-amber-600';
  if (score > 0) return 'text-red-600';
  return 'text-muted-foreground';
}

/**
 * Get background color class for score
 */
export function getScoreBgClass(score: number): string {
  if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (score >= 60) return 'bg-lime-50 dark:bg-lime-950/30';
  if (score >= 40) return 'bg-amber-50 dark:bg-amber-950/30';
  if (score > 0) return 'bg-red-50 dark:bg-red-950/30';
  return 'bg-muted';
}
