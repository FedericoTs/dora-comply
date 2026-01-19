/**
 * AI Analysis Generator
 *
 * Generates vendor-specific AI analysis for the vendor detail page.
 * Provides summary, strengths, concerns, recommendations, and predictions.
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization } from '@/lib/auth/organization';
import { getVendorHealthBreakdown } from '../vendor-health-utils';
import type { VendorWithRelations } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface VendorAIAnalysis {
  /** Generated summary of the vendor */
  summary: string;
  /** Key strengths identified */
  strengths: AnalysisPoint[];
  /** Concerns requiring attention */
  concerns: AnalysisPoint[];
  /** Prioritized recommendations */
  recommendations: Recommendation[];
  /** Peer comparison data */
  peerComparison: PeerComparison;
  /** Risk trend prediction */
  riskPrediction: RiskPrediction;
  /** Analysis metadata */
  metadata: {
    generatedAt: string;
    dataPoints: number;
    confidenceScore: number;
  };
}

export interface AnalysisPoint {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'compliance' | 'security' | 'operational' | 'contractual';
}

export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionType: 'upload' | 'review' | 'schedule' | 'configure' | 'verify';
  actionHref?: string;
  estimatedEffort: 'quick' | 'moderate' | 'significant';
  impact: string;
}

export interface PeerComparison {
  /** How this vendor compares to others in same tier */
  tierComparison: {
    vendorScore: number | null;
    tierAverage: number;
    percentile: number;
    verdict: 'above_average' | 'average' | 'below_average';
  };
  /** Comparison on key dimensions */
  dimensions: {
    compliance: { vendor: number; tierAvg: number };
    documentation: { vendor: number; tierAvg: number };
    monitoring: { vendor: boolean; tierPct: number };
  };
}

export interface RiskPrediction {
  /** Predicted trend direction */
  trend: 'improving' | 'stable' | 'declining';
  /** Confidence in prediction */
  confidence: 'high' | 'medium' | 'low';
  /** Factors influencing prediction */
  factors: string[];
  /** Predicted score range in 30 days */
  predictedRange: {
    min: number;
    max: number;
  };
}

// ============================================================================
// Main Analysis Generator
// ============================================================================

/**
 * Generate comprehensive AI analysis for a vendor
 */
export async function generateVendorAnalysis(
  vendor: VendorWithRelations
): Promise<VendorAIAnalysis> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  // Get health breakdown for analysis
  const health = getVendorHealthBreakdown(vendor);

  // Fetch peer data for comparison
  let tierVendors: Array<{ risk_score: number | null; monitoring_enabled: boolean | null }> = [];
  if (organizationId) {
    const { data } = await supabase
      .from('vendors')
      .select('risk_score, monitoring_enabled, lei, has_parsed_soc2:documents(parsed_soc2(id))')
      .eq('organization_id', organizationId)
      .eq('tier', vendor.tier)
      .is('deleted_at', null);

    tierVendors = data || [];
  }

  // Generate analysis components
  const summary = generateSummary(vendor, health.scores);
  const strengths = identifyStrengths(vendor, health);
  const concerns = identifyConcerns(vendor, health);
  const recommendations = generateRecommendations(vendor, health, concerns);
  const peerComparison = calculatePeerComparison(vendor, health, tierVendors);
  const riskPrediction = predictRiskTrend(vendor, health, strengths, concerns);

  // Calculate confidence based on available data
  let dataPoints = 0;
  if (vendor.risk_score !== null) dataPoints++;
  if (vendor.external_risk_score !== null) dataPoints++;
  if (vendor.lei) dataPoints++;
  if (vendor.last_assessment_date) dataPoints++;
  if (vendor.monitoring_enabled) dataPoints++;
  if ((vendor.documents_count || 0) > 0) dataPoints++;
  if ((vendor.contracts_count || 0) > 0) dataPoints++;
  if ((vendor.contacts?.length || 0) > 0) dataPoints++;

  const confidenceScore = Math.min(100, Math.round((dataPoints / 8) * 100));

  return {
    summary,
    strengths,
    concerns,
    recommendations,
    peerComparison,
    riskPrediction,
    metadata: {
      generatedAt: new Date().toISOString(),
      dataPoints,
      confidenceScore,
    },
  };
}

// ============================================================================
// Analysis Component Generators
// ============================================================================

function generateSummary(
  vendor: VendorWithRelations,
  scores: { overall: number; risk: number | null; compliance: number; documentation: number }
): string {
  const tierLabel = vendor.tier === 'critical' ? 'critical' : vendor.tier === 'important' ? 'important' : 'standard';
  const riskStatus = scores.risk === null
    ? 'not yet assessed'
    : scores.risk >= 70
      ? 'well-managed'
      : scores.risk >= 50
        ? 'moderate'
        : 'elevated';

  const complianceStatus = scores.compliance >= 75
    ? 'strong compliance posture'
    : scores.compliance >= 50
      ? 'adequate compliance coverage'
      : 'compliance gaps that require attention';

  const docStatus = scores.documentation >= 75
    ? 'comprehensive documentation'
    : scores.documentation >= 50
      ? 'partial documentation'
      : 'limited documentation on file';

  return `${vendor.name} is a ${tierLabel} vendor with ${riskStatus} risk levels. ` +
    `The vendor demonstrates ${complianceStatus} with ${docStatus}. ` +
    `Overall health score is ${scores.overall}/100.`;
}

function identifyStrengths(
  vendor: VendorWithRelations,
  health: ReturnType<typeof getVendorHealthBreakdown>
): AnalysisPoint[] {
  const strengths: AnalysisPoint[] = [];
  const { components, scores } = health;

  // LEI verified
  if (components.hasLei && components.leiVerified) {
    strengths.push({
      id: 'lei-verified',
      title: 'Verified Legal Entity',
      description: 'LEI is verified with GLEIF, ensuring accurate entity identification for regulatory reporting.',
      impact: 'high',
      category: 'compliance',
    });
  }

  // Good risk score
  if (scores.risk !== null && scores.risk >= 70) {
    strengths.push({
      id: 'good-risk-score',
      title: 'Strong Risk Score',
      description: `Risk score of ${scores.risk}/100 indicates well-managed security posture.`,
      impact: 'high',
      category: 'security',
    });
  }

  // Has SOC 2
  if (components.hasParsedSoc2) {
    strengths.push({
      id: 'soc2-analyzed',
      title: 'SOC 2 Report Analyzed',
      description: 'SOC 2 Type II report has been uploaded and analyzed for DORA compliance mapping.',
      impact: 'high',
      category: 'compliance',
    });
  }

  // Good documentation
  if (scores.documentation >= 75) {
    strengths.push({
      id: 'complete-docs',
      title: 'Complete Documentation',
      description: 'Vendor has comprehensive documentation including contacts, contracts, and evidence files.',
      impact: 'medium',
      category: 'operational',
    });
  }

  // Monitoring enabled
  if (components.hasMonitoring) {
    strengths.push({
      id: 'monitoring-active',
      title: 'Continuous Monitoring Active',
      description: 'External security monitoring is enabled for proactive risk detection.',
      impact: 'medium',
      category: 'security',
    });
  }

  // Has contracts
  if (components.hasContracts) {
    strengths.push({
      id: 'contracts-defined',
      title: 'Contractual Framework',
      description: 'Formal contracts are in place defining service terms and obligations.',
      impact: 'medium',
      category: 'contractual',
    });
  }

  return strengths;
}

function identifyConcerns(
  vendor: VendorWithRelations,
  health: ReturnType<typeof getVendorHealthBreakdown>
): AnalysisPoint[] {
  const concerns: AnalysisPoint[] = [];
  const { components, scores } = health;

  // No LEI
  if (!components.hasLei && (vendor.tier === 'critical' || vendor.tier === 'important')) {
    concerns.push({
      id: 'missing-lei',
      title: 'Missing LEI',
      description: 'Legal Entity Identifier is required for DORA Register of Information compliance.',
      impact: 'high',
      category: 'compliance',
    });
  }

  // Low risk score
  if (scores.risk !== null && scores.risk < 50) {
    concerns.push({
      id: 'low-risk-score',
      title: 'Elevated Risk Score',
      description: `Risk score of ${scores.risk}/100 indicates potential security concerns that require review.`,
      impact: 'high',
      category: 'security',
    });
  }

  // No assessment
  if (!components.hasAssessment) {
    concerns.push({
      id: 'no-assessment',
      title: 'No Recent Assessment',
      description: 'Vendor has not been formally assessed. DORA requires documented due diligence.',
      impact: vendor.tier === 'critical' ? 'high' : 'medium',
      category: 'compliance',
    });
  }

  // No SOC 2
  if (!components.hasParsedSoc2 && (vendor.tier === 'critical' || vendor.tier === 'important')) {
    concerns.push({
      id: 'no-soc2',
      title: 'No SOC 2 Report',
      description: 'SOC 2 Type II report is recommended for critical/important vendors under DORA.',
      impact: 'high',
      category: 'compliance',
    });
  }

  // No contracts
  if (!components.hasContracts && (vendor.tier === 'critical' || vendor.tier === 'important')) {
    concerns.push({
      id: 'no-contracts',
      title: 'No Contracts on File',
      description: 'DORA Article 30 requires documented contractual arrangements with ICT providers.',
      impact: 'high',
      category: 'contractual',
    });
  }

  // No monitoring for critical
  if (!components.hasMonitoring && vendor.tier === 'critical') {
    concerns.push({
      id: 'no-monitoring',
      title: 'Monitoring Not Enabled',
      description: 'Critical vendors should have continuous security monitoring for early risk detection.',
      impact: 'medium',
      category: 'security',
    });
  }

  // No contacts
  if (!components.hasContacts) {
    concerns.push({
      id: 'no-contacts',
      title: 'No Contacts Defined',
      description: 'Primary contact information is needed for incident response coordination.',
      impact: 'medium',
      category: 'operational',
    });
  }

  return concerns;
}

function generateRecommendations(
  vendor: VendorWithRelations,
  health: ReturnType<typeof getVendorHealthBreakdown>,
  concerns: AnalysisPoint[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { components } = health;

  // Map concerns to recommendations
  for (const concern of concerns) {
    switch (concern.id) {
      case 'missing-lei':
        recommendations.push({
          id: 'rec-add-lei',
          priority: 'critical',
          title: 'Add and Verify LEI',
          description: 'Add the vendor\'s Legal Entity Identifier and verify it through GLEIF.',
          actionType: 'verify',
          actionHref: `/vendors/${vendor.id}?tab=enrichment`,
          estimatedEffort: 'quick',
          impact: 'Enables DORA RoI compliance and entity verification',
        });
        break;

      case 'no-soc2':
        recommendations.push({
          id: 'rec-upload-soc2',
          priority: vendor.tier === 'critical' ? 'critical' : 'high',
          title: 'Upload SOC 2 Report',
          description: 'Request and upload the vendor\'s latest SOC 2 Type II report.',
          actionType: 'upload',
          actionHref: `/vendors/${vendor.id}?tab=documents`,
          estimatedEffort: 'moderate',
          impact: 'Automates DORA compliance mapping and gap analysis',
        });
        break;

      case 'no-contracts':
        recommendations.push({
          id: 'rec-add-contract',
          priority: 'high',
          title: 'Add Contract',
          description: 'Upload the master services agreement and verify DORA Article 30 provisions.',
          actionType: 'upload',
          actionHref: `/vendors/${vendor.id}?tab=contracts`,
          estimatedEffort: 'moderate',
          impact: 'Ensures contractual compliance with DORA requirements',
        });
        break;

      case 'no-assessment':
        recommendations.push({
          id: 'rec-schedule-assessment',
          priority: vendor.tier === 'critical' ? 'high' : 'medium',
          title: 'Schedule Assessment',
          description: 'Conduct a formal vendor risk assessment and document findings.',
          actionType: 'schedule',
          actionHref: `/vendors/${vendor.id}?tab=dora`,
          estimatedEffort: 'significant',
          impact: 'Establishes baseline risk profile for ongoing monitoring',
        });
        break;

      case 'no-monitoring':
        recommendations.push({
          id: 'rec-enable-monitoring',
          priority: 'medium',
          title: 'Enable Monitoring',
          description: 'Configure external security monitoring to track vendor risk changes.',
          actionType: 'configure',
          actionHref: `/vendors/${vendor.id}?tab=monitoring`,
          estimatedEffort: 'quick',
          impact: 'Enables proactive risk detection and alerting',
        });
        break;

      case 'no-contacts':
        recommendations.push({
          id: 'rec-add-contacts',
          priority: 'medium',
          title: 'Add Primary Contact',
          description: 'Add the vendor\'s primary contact for security and business communications.',
          actionType: 'configure',
          actionHref: `/vendors/${vendor.id}?tab=contacts`,
          estimatedEffort: 'quick',
          impact: 'Enables incident response coordination',
        });
        break;

      case 'low-risk-score':
        recommendations.push({
          id: 'rec-review-risk',
          priority: 'high',
          title: 'Review Risk Factors',
          description: 'Analyze the specific risk factors contributing to the low score and develop remediation plan.',
          actionType: 'review',
          actionHref: `/vendors/${vendor.id}?tab=monitoring`,
          estimatedEffort: 'moderate',
          impact: 'Addresses specific security concerns',
        });
        break;
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

function calculatePeerComparison(
  vendor: VendorWithRelations,
  health: ReturnType<typeof getVendorHealthBreakdown>,
  tierVendors: Array<{ risk_score: number | null; monitoring_enabled: boolean | null }>
): PeerComparison {
  const { scores, components } = health;

  // Calculate tier averages
  const vendorsWithScore = tierVendors.filter(v => v.risk_score !== null);
  const tierAvgRisk = vendorsWithScore.length > 0
    ? Math.round(vendorsWithScore.reduce((sum, v) => sum + (v.risk_score || 0), 0) / vendorsWithScore.length)
    : 65; // Default

  const monitoringPct = tierVendors.length > 0
    ? Math.round((tierVendors.filter(v => v.monitoring_enabled).length / tierVendors.length) * 100)
    : 40; // Default

  // Calculate percentile
  let percentile = 50;
  if (scores.risk !== null && vendorsWithScore.length > 0) {
    const belowCount = vendorsWithScore.filter(v => (v.risk_score || 0) < scores.risk!).length;
    percentile = Math.round((belowCount / vendorsWithScore.length) * 100);
  }

  // Determine verdict
  let verdict: 'above_average' | 'average' | 'below_average' = 'average';
  if (scores.risk !== null) {
    if (scores.risk > tierAvgRisk + 10) verdict = 'above_average';
    else if (scores.risk < tierAvgRisk - 10) verdict = 'below_average';
  }

  return {
    tierComparison: {
      vendorScore: scores.risk,
      tierAverage: tierAvgRisk,
      percentile,
      verdict,
    },
    dimensions: {
      compliance: {
        vendor: scores.compliance,
        tierAvg: 60, // Simulated for now
      },
      documentation: {
        vendor: scores.documentation,
        tierAvg: 55, // Simulated for now
      },
      monitoring: {
        vendor: components.hasMonitoring,
        tierPct: monitoringPct,
      },
    },
  };
}

function predictRiskTrend(
  vendor: VendorWithRelations,
  health: ReturnType<typeof getVendorHealthBreakdown>,
  strengths: AnalysisPoint[],
  concerns: AnalysisPoint[]
): RiskPrediction {
  const { scores, components } = health;

  // Calculate trend based on current state
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];

  // Positive factors
  if (components.hasMonitoring) positiveFactors.push('Active monitoring in place');
  if (components.hasParsedSoc2) positiveFactors.push('SOC 2 report on file');
  if (components.hasContracts) positiveFactors.push('Contractual framework defined');
  if (strengths.length > concerns.length) positiveFactors.push('More strengths than concerns');

  // Negative factors
  if (!components.hasAssessment) negativeFactors.push('No recent assessment');
  if (!components.hasMonitoring && vendor.tier === 'critical') negativeFactors.push('No monitoring for critical vendor');
  if (concerns.some(c => c.impact === 'high')) negativeFactors.push('High-impact concerns identified');
  if ((scores.risk ?? 50) < 50) negativeFactors.push('Current risk score below threshold');

  // Determine trend
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (positiveFactors.length > negativeFactors.length + 1) {
    trend = 'improving';
  } else if (negativeFactors.length > positiveFactors.length + 1) {
    trend = 'declining';
  }

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (components.hasMonitoring && components.hasAssessment) {
    confidence = 'high';
  } else if (!components.hasAssessment && !components.hasMonitoring) {
    confidence = 'low';
  }

  // Predict range
  const currentScore = scores.risk ?? 50;
  let min = currentScore;
  let max = currentScore;

  if (trend === 'improving') {
    min = currentScore;
    max = Math.min(100, currentScore + 10);
  } else if (trend === 'declining') {
    min = Math.max(0, currentScore - 15);
    max = currentScore;
  } else {
    min = Math.max(0, currentScore - 5);
    max = Math.min(100, currentScore + 5);
  }

  return {
    trend,
    confidence,
    factors: [...positiveFactors, ...negativeFactors].slice(0, 4),
    predictedRange: { min, max },
  };
}

// ============================================================================
// Quick Analysis for List View
// ============================================================================

export interface QuickAnalysis {
  healthScore: number;
  topConcern: string | null;
  topStrength: string | null;
  recommendedAction: string | null;
}

/**
 * Generate quick analysis summary for list views
 */
export function generateQuickAnalysis(vendor: VendorWithRelations): QuickAnalysis {
  const health = getVendorHealthBreakdown(vendor);

  // Quick strength/concern detection
  let topStrength: string | null = null;
  let topConcern: string | null = null;
  let recommendedAction: string | null = null;

  if (health.components.hasParsedSoc2) {
    topStrength = 'SOC 2 analyzed';
  } else if (health.components.leiVerified) {
    topStrength = 'LEI verified';
  } else if (health.scores.risk !== null && health.scores.risk >= 70) {
    topStrength = 'Strong risk score';
  }

  if (!health.components.hasLei && (vendor.tier === 'critical' || vendor.tier === 'important')) {
    topConcern = 'Missing LEI';
    recommendedAction = 'Add LEI';
  } else if (!health.components.hasParsedSoc2 && vendor.tier === 'critical') {
    topConcern = 'No SOC 2';
    recommendedAction = 'Upload SOC 2';
  } else if (!health.components.hasContracts && vendor.tier === 'critical') {
    topConcern = 'No contracts';
    recommendedAction = 'Add contract';
  } else if (health.scores.risk !== null && health.scores.risk < 50) {
    topConcern = 'Low risk score';
    recommendedAction = 'Review risk';
  }

  return {
    healthScore: health.scores.overall,
    topConcern,
    topStrength,
    recommendedAction,
  };
}
