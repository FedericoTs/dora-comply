/**
 * AI Insights Generator
 *
 * Generates portfolio-level AI insights for the vendor list page.
 * Analyzes patterns across all vendors to identify risks and recommendations.
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization } from '@/lib/auth/organization';

// ============================================================================
// Types
// ============================================================================

export type InsightType =
  | 'concentration_risk'
  | 'compliance_gap'
  | 'score_deterioration'
  | 'contract_risk'
  | 'data_staleness'
  | 'monitoring_gap'
  | 'positive_trend';

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AIInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  summary: string;
  details?: string;
  affectedVendorIds: string[];
  affectedVendorNames: string[];
  suggestedAction: string;
  actionHref?: string;
  metric?: {
    value: number;
    label: string;
    trend?: 'up' | 'down' | 'stable';
  };
  createdAt: string;
}

interface VendorData {
  id: string;
  name: string;
  tier: string;
  status: string;
  risk_score: number | null;
  external_risk_score: number | null;
  lei: string | null;
  monitoring_enabled: boolean | null;
  last_assessment_date: string | null;
  provider_type: string | null;
  headquarters_country: string | null;
  service_types: string[];
  contracts_count?: number;
  documents_count?: number;
  has_parsed_soc2?: boolean;
}

interface ContractData {
  id: string;
  vendor_id: string;
  contract_ref: string | null;
  expiry_date: string | null;
  dora_provisions: Record<string, unknown> | null;
}

// ============================================================================
// Main Insight Generation Function
// ============================================================================

/**
 * Generate AI insights for the vendor portfolio
 */
export async function generatePortfolioInsights(): Promise<AIInsight[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) return [];

  // Fetch all vendor data needed for analysis
  const [vendorsResult, contractsResult] = await Promise.all([
    supabase
      .from('vendors')
      .select(`
        id, name, tier, status, risk_score, external_risk_score,
        lei, monitoring_enabled, last_assessment_date,
        provider_type, headquarters_country, service_types
      `)
      .eq('organization_id', organizationId)
      .is('deleted_at', null),

    supabase
      .from('contracts')
      .select('id, vendor_id, contract_ref, expiry_date, dora_provisions')
      .eq('organization_id', organizationId),
  ]);

  const vendors = (vendorsResult.data || []) as VendorData[];
  const contracts = (contractsResult.data || []) as ContractData[];

  if (vendors.length === 0) return [];

  // Get document counts per vendor
  const { data: docCounts } = await supabase
    .from('documents')
    .select('vendor_id')
    .in('vendor_id', vendors.map(v => v.id));

  const vendorDocCounts = new Map<string, number>();
  for (const doc of docCounts || []) {
    vendorDocCounts.set(doc.vendor_id, (vendorDocCounts.get(doc.vendor_id) || 0) + 1);
  }

  // Enrich vendor data
  const enrichedVendors = vendors.map(v => ({
    ...v,
    documents_count: vendorDocCounts.get(v.id) || 0,
    contracts_count: contracts.filter(c => c.vendor_id === v.id).length,
  }));

  // Generate insights
  const insights: AIInsight[] = [];

  // 1. Concentration Risk
  const concentrationInsights = analyzeConcentrationRisk(enrichedVendors);
  insights.push(...concentrationInsights);

  // 2. Compliance Gaps
  const complianceInsights = analyzeComplianceGaps(enrichedVendors);
  insights.push(...complianceInsights);

  // 3. Score Deterioration (would need historical data in production)
  const scoreInsights = analyzeScoreIssues(enrichedVendors);
  insights.push(...scoreInsights);

  // 4. Contract Risks
  const contractInsights = analyzeContractRisks(enrichedVendors, contracts);
  insights.push(...contractInsights);

  // 5. Data Staleness
  const stalenessInsights = analyzeDataStaleness(enrichedVendors);
  insights.push(...stalenessInsights);

  // 6. Monitoring Gaps
  const monitoringInsights = analyzeMonitoringGaps(enrichedVendors);
  insights.push(...monitoringInsights);

  // Sort by priority
  const priorityOrder: Record<InsightPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights;
}

// ============================================================================
// Analysis Functions
// ============================================================================

function analyzeConcentrationRisk(vendors: VendorData[]): AIInsight[] {
  const insights: AIInsight[] = [];

  // Group by provider type
  const byProviderType = new Map<string, VendorData[]>();
  for (const v of vendors) {
    if (v.provider_type) {
      if (!byProviderType.has(v.provider_type)) byProviderType.set(v.provider_type, []);
      byProviderType.get(v.provider_type)!.push(v);
    }
  }

  // Check for concentration (>30% in single type for critical vendors)
  const criticalVendors = vendors.filter(v => v.tier === 'critical');
  for (const [type, typeVendors] of byProviderType) {
    const criticalInType = typeVendors.filter(v => v.tier === 'critical');
    if (criticalInType.length >= 3 && criticalVendors.length > 0) {
      const ratio = criticalInType.length / criticalVendors.length;
      if (ratio >= 0.3) {
        insights.push({
          id: `concentration-${type}`,
          type: 'concentration_risk',
          priority: 'high',
          title: 'Concentration Risk Detected',
          summary: `${criticalInType.length} critical vendors share the same provider type (${formatProviderType(type)})`,
          details: 'High concentration in a single provider type increases systemic risk. Consider diversifying your vendor portfolio.',
          affectedVendorIds: criticalInType.map(v => v.id),
          affectedVendorNames: criticalInType.map(v => v.name),
          suggestedAction: 'Review concentration risk and consider alternative providers',
          actionHref: '/concentration',
          metric: {
            value: Math.round(ratio * 100),
            label: '% of critical vendors',
          },
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // Group by country
  const byCountry = new Map<string, VendorData[]>();
  for (const v of vendors) {
    if (v.headquarters_country) {
      if (!byCountry.has(v.headquarters_country)) byCountry.set(v.headquarters_country, []);
      byCountry.get(v.headquarters_country)!.push(v);
    }
  }

  // Check for geographic concentration
  for (const [country, countryVendors] of byCountry) {
    if (countryVendors.length >= 5 && vendors.length > 0) {
      const ratio = countryVendors.length / vendors.length;
      if (ratio >= 0.5) {
        insights.push({
          id: `geo-concentration-${country}`,
          type: 'concentration_risk',
          priority: 'medium',
          title: 'Geographic Concentration',
          summary: `${Math.round(ratio * 100)}% of vendors are headquartered in ${country}`,
          affectedVendorIds: countryVendors.map(v => v.id),
          affectedVendorNames: countryVendors.slice(0, 5).map(v => v.name),
          suggestedAction: 'Consider geographic diversification for resilience',
          actionHref: '/vendors?sort=headquarters_country',
          metric: {
            value: countryVendors.length,
            label: 'vendors',
          },
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return insights;
}

function analyzeComplianceGaps(vendors: VendorData[]): AIInsight[] {
  const insights: AIInsight[] = [];

  // Critical/important vendors without LEI
  const criticalWithoutLei = vendors.filter(
    v => (v.tier === 'critical' || v.tier === 'important') && !v.lei
  );

  if (criticalWithoutLei.length > 0) {
    insights.push({
      id: 'missing-lei',
      type: 'compliance_gap',
      priority: criticalWithoutLei.some(v => v.tier === 'critical') ? 'critical' : 'high',
      title: 'Missing LEI Numbers',
      summary: `${criticalWithoutLei.length} critical/important vendors lack LEI verification`,
      details: 'Legal Entity Identifiers are required for DORA Register of Information compliance.',
      affectedVendorIds: criticalWithoutLei.map(v => v.id),
      affectedVendorNames: criticalWithoutLei.map(v => v.name),
      suggestedAction: 'Add and verify LEI numbers for these vendors',
      actionHref: '/vendors?filter=no_lei',
      metric: {
        value: criticalWithoutLei.length,
        label: 'vendors',
      },
      createdAt: new Date().toISOString(),
    });
  }

  // Vendors without documents
  const withoutDocs = vendors.filter(
    v => (v.tier === 'critical' || v.tier === 'important') && (v.documents_count || 0) === 0
  );

  if (withoutDocs.length > 0) {
    insights.push({
      id: 'missing-docs',
      type: 'compliance_gap',
      priority: 'high',
      title: 'Missing Documentation',
      summary: `${withoutDocs.length} vendors have no documents on file`,
      details: 'DORA requires documented evidence of vendor assessments and certifications.',
      affectedVendorIds: withoutDocs.map(v => v.id),
      affectedVendorNames: withoutDocs.map(v => v.name),
      suggestedAction: 'Upload SOC 2 reports or other security documentation',
      actionHref: '/documents',
      metric: {
        value: withoutDocs.length,
        label: 'vendors',
      },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

function analyzeScoreIssues(vendors: VendorData[]): AIInsight[] {
  const insights: AIInsight[] = [];

  // Low risk scores
  const lowScoreVendors = vendors.filter(
    v => (v.risk_score !== null && v.risk_score < 50) ||
         (v.external_risk_score !== null && v.external_risk_score < 50)
  );

  if (lowScoreVendors.length > 0) {
    const criticalLowScore = lowScoreVendors.filter(v => v.tier === 'critical');

    if (criticalLowScore.length > 0) {
      insights.push({
        id: 'critical-low-score',
        type: 'score_deterioration',
        priority: 'critical',
        title: 'Critical Vendors with Low Scores',
        summary: `${criticalLowScore.length} critical vendors have risk scores below 50`,
        details: 'These vendors pose significant risk and require immediate attention.',
        affectedVendorIds: criticalLowScore.map(v => v.id),
        affectedVendorNames: criticalLowScore.map(v => v.name),
        suggestedAction: 'Review and remediate high-risk critical vendors',
        actionHref: '/vendors?tier=critical&risk=high',
        metric: {
          value: criticalLowScore.length,
          label: 'critical vendors',
          trend: 'down',
        },
        createdAt: new Date().toISOString(),
      });
    }
  }

  return insights;
}

function analyzeContractRisks(vendors: VendorData[], contracts: ContractData[]): AIInsight[] {
  const insights: AIInsight[] = [];

  // Contracts expiring within 60 days
  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const expiringContracts = contracts.filter(c => {
    if (!c.expiry_date) return false;
    const expiry = new Date(c.expiry_date);
    return expiry > now && expiry <= sixtyDaysFromNow;
  });

  if (expiringContracts.length > 0) {
    const affectedVendorIds = [...new Set(expiringContracts.map(c => c.vendor_id))];
    const affectedVendors = vendors.filter(v => affectedVendorIds.includes(v.id));

    insights.push({
      id: 'expiring-contracts',
      type: 'contract_risk',
      priority: affectedVendors.some(v => v.tier === 'critical') ? 'high' : 'medium',
      title: 'Contracts Expiring Soon',
      summary: `${expiringContracts.length} contracts expire within 60 days`,
      details: 'Review these contracts for renewal or replacement before expiration.',
      affectedVendorIds,
      affectedVendorNames: affectedVendors.map(v => v.name),
      suggestedAction: 'Review and renew expiring contracts',
      actionHref: '/vendors?tab=contracts',
      metric: {
        value: expiringContracts.length,
        label: 'contracts',
      },
      createdAt: new Date().toISOString(),
    });
  }

  // Vendors without contracts
  const vendorIdsWithContracts = new Set(contracts.map(c => c.vendor_id));
  const withoutContracts = vendors.filter(
    v => (v.tier === 'critical' || v.tier === 'important') &&
         !vendorIdsWithContracts.has(v.id)
  );

  if (withoutContracts.length > 0) {
    insights.push({
      id: 'missing-contracts',
      type: 'contract_risk',
      priority: 'high',
      title: 'Missing Contracts',
      summary: `${withoutContracts.length} critical/important vendors have no contracts on file`,
      details: 'DORA Article 30 requires documented contractual arrangements with ICT providers.',
      affectedVendorIds: withoutContracts.map(v => v.id),
      affectedVendorNames: withoutContracts.map(v => v.name),
      suggestedAction: 'Upload contracts for these vendors',
      actionHref: '/vendors?filter=no_contracts',
      metric: {
        value: withoutContracts.length,
        label: 'vendors',
      },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

function analyzeDataStaleness(vendors: VendorData[]): AIInsight[] {
  const insights: AIInsight[] = [];

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Vendors not assessed in over a year
  const staleAssessments = vendors.filter(v => {
    if (v.tier !== 'critical' && v.tier !== 'important') return false;
    if (!v.last_assessment_date) return true; // Never assessed
    return new Date(v.last_assessment_date) < oneYearAgo;
  });

  if (staleAssessments.length > 0) {
    const neverAssessed = staleAssessments.filter(v => !v.last_assessment_date);

    insights.push({
      id: 'stale-assessments',
      type: 'data_staleness',
      priority: neverAssessed.some(v => v.tier === 'critical') ? 'high' : 'medium',
      title: 'Overdue Assessments',
      summary: `${staleAssessments.length} vendors haven't been assessed in over 12 months`,
      details: neverAssessed.length > 0
        ? `Including ${neverAssessed.length} that have never been assessed.`
        : 'Annual reassessment is required under DORA.',
      affectedVendorIds: staleAssessments.map(v => v.id),
      affectedVendorNames: staleAssessments.map(v => v.name),
      suggestedAction: 'Schedule vendor assessments',
      actionHref: '/vendors?filter=stale',
      metric: {
        value: staleAssessments.length,
        label: 'vendors',
      },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

function analyzeMonitoringGaps(vendors: VendorData[]): AIInsight[] {
  const insights: AIInsight[] = [];

  // Critical vendors without monitoring enabled
  const criticalWithoutMonitoring = vendors.filter(
    v => v.tier === 'critical' && !v.monitoring_enabled
  );

  if (criticalWithoutMonitoring.length > 0) {
    insights.push({
      id: 'monitoring-gaps',
      type: 'monitoring_gap',
      priority: 'medium',
      title: 'Monitoring Not Enabled',
      summary: `${criticalWithoutMonitoring.length} critical vendors lack continuous monitoring`,
      details: 'Continuous monitoring helps detect security posture changes proactively.',
      affectedVendorIds: criticalWithoutMonitoring.map(v => v.id),
      affectedVendorNames: criticalWithoutMonitoring.map(v => v.name),
      suggestedAction: 'Enable external security monitoring',
      actionHref: '/vendors?tier=critical&monitoring=disabled',
      metric: {
        value: criticalWithoutMonitoring.length,
        label: 'vendors',
      },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatProviderType(type: string): string {
  const labels: Record<string, string> = {
    cloud_service: 'Cloud Service',
    data_analytics: 'Data Analytics',
    software_provider: 'Software Provider',
    payment_services: 'Payment Services',
    network_infrastructure: 'Network Infrastructure',
    security_services: 'Security Services',
    other_ict: 'Other ICT',
  };
  return labels[type] || type;
}

// ============================================================================
// Insight Summary for Dashboard
// ============================================================================

export interface InsightSummary {
  totalInsights: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  topInsights: AIInsight[];
}

/**
 * Get a summary of insights for dashboard display
 */
export async function getInsightSummary(): Promise<InsightSummary> {
  const insights = await generatePortfolioInsights();

  return {
    totalInsights: insights.length,
    bySeverity: {
      critical: insights.filter(i => i.priority === 'critical').length,
      high: insights.filter(i => i.priority === 'high').length,
      medium: insights.filter(i => i.priority === 'medium').length,
      low: insights.filter(i => i.priority === 'low').length,
    },
    topInsights: insights.slice(0, 5),
  };
}
