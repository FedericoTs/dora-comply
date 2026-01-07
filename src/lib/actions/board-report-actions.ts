'use server';

/**
 * Board Report Data Aggregation
 *
 * Server actions to aggregate data from multiple sources
 * for executive board reporting.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  BoardReportData,
  DORACompliancePillar,
  DORAGap,
  GeographicConcentration,
  ActionItem,
  DORAMaturityLevel,
  RiskLevel,
} from '@/lib/exports/board-report-types';

interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Get board report data for the current organization
 */
export async function getBoardReportData(
  dateRange?: DateRange
): Promise<BoardReportData> {
  const supabase = await createClient();

  // Get current user's organization
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(name)')
    .eq('user_id', user.id)
    .single();

  if (!membership) throw new Error('No organization found');

  const organizationId = membership.organization_id;
  // Extract organization name from the join result
  const orgData = membership.organizations as { name: string } | { name: string }[] | null;
  const organizationName = Array.isArray(orgData)
    ? orgData[0]?.name || 'Organization'
    : orgData?.name || 'Organization';

  // Set default date range (last 30 days)
  const now = new Date();
  const from = dateRange?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const to = dateRange?.to || now;

  // Fetch all data in parallel
  const [
    vendorsResult,
    assessmentsResult,
    incidentsResult,
    subcontractorsResult,
    contractsResult,
  ] = await Promise.all([
    // Vendors
    supabase
      .from('vendors')
      .select('id, name, criticality_tier, risk_rating, country, is_active')
      .eq('organization_id', organizationId)
      .is('deleted_at', null),

    // Assessments
    supabase
      .from('assessments')
      .select('id, status, overall_risk_score, next_review_date')
      .eq('organization_id', organizationId),

    // Incidents
    supabase
      .from('incidents')
      .select('id, status, severity, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString()),

    // Subcontractors for fourth-party analysis
    supabase
      .from('subcontractors')
      .select('id, tier_level, supports_critical_function')
      .eq('organization_id', organizationId)
      .is('deleted_at', null),

    // Contracts for expiry analysis
    supabase
      .from('contracts')
      .select('id, end_date, status')
      .eq('organization_id', organizationId)
      .eq('status', 'active'),
  ]);

  const vendors = vendorsResult.data || [];
  const assessments = assessmentsResult.data || [];
  const incidents = incidentsResult.data || [];
  const subcontractors = subcontractorsResult.data || [];
  const contracts = contractsResult.data || [];

  // Calculate vendor metrics
  const vendorsByTier = {
    critical: vendors.filter((v) => v.criticality_tier === 'critical').length,
    important: vendors.filter((v) => v.criticality_tier === 'important').length,
    standard: vendors.filter(
      (v) => !v.criticality_tier || v.criticality_tier === 'standard'
    ).length,
  };

  const vendorsByRisk = {
    critical: vendors.filter((v) => v.risk_rating === 'critical').length,
    high: vendors.filter((v) => v.risk_rating === 'high').length,
    medium: vendors.filter((v) => v.risk_rating === 'medium').length,
    low: vendors.filter(
      (v) => !v.risk_rating || v.risk_rating === 'low' || v.risk_rating === 'minimal'
    ).length,
  };

  // Calculate pending assessments
  const pendingAssessments = assessments.filter(
    (a) => a.status === 'pending' || a.status === 'in_progress'
  ).length;

  // Calculate expiring contracts
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const contractsExpiring30 = contracts.filter((c) => {
    if (!c.end_date) return false;
    const endDate = new Date(c.end_date);
    return endDate <= thirtyDaysFromNow && endDate > now;
  }).length;

  const contractsExpiring90 = contracts.filter((c) => {
    if (!c.end_date) return false;
    const endDate = new Date(c.end_date);
    return endDate <= ninetyDaysFromNow && endDate > now;
  }).length;

  // Calculate open incidents
  const openIncidents = incidents.filter(
    (i) => i.status === 'open' || i.status === 'in_progress' || i.status === 'investigating'
  ).length;

  // Calculate concentration metrics
  const concentrationMetrics = calculateConcentrationMetrics(vendors);

  // Calculate DORA compliance
  const doraCompliance = calculateDORACompliance(vendors, assessments, subcontractors);

  // Generate action items
  const actionItems = generateActionItems(
    vendors,
    assessments,
    incidents,
    contracts,
    doraCompliance
  );

  // Calculate overall compliance score
  const overallScore = calculateOverallScore(doraCompliance.pillars);
  const maturityLevel = calculateMaturityLevel(overallScore);

  // Generate key risks and recommendations
  const keyRisks = generateKeyRisks(
    concentrationMetrics,
    doraCompliance,
    vendors,
    incidents
  );
  const recommendations = generateRecommendations(
    concentrationMetrics,
    doraCompliance,
    actionItems
  );

  return {
    organization: {
      name: organizationName,
    },
    generatedAt: now,
    reportingPeriod: { from, to },
    executiveSummary: {
      overallComplianceScore: overallScore,
      doraMaturityLevel: maturityLevel,
      criticalVendors: vendorsByTier.critical,
      highRiskVendors: vendorsByRisk.critical + vendorsByRisk.high,
      openIncidents,
      keyRisks,
      recommendations,
    },
    doraCompliance,
    concentrationRisk: concentrationMetrics,
    vendorSummary: {
      total: vendors.length,
      byTier: vendorsByTier,
      byRisk: vendorsByRisk,
      pendingAssessments,
      expiringContracts: contractsExpiring90,
      contractsExpiringIn30Days: contractsExpiring30,
    },
    actionItems,
  };
}

/**
 * Calculate concentration risk metrics
 */
function calculateConcentrationMetrics(
  vendors: Array<{
    id: string;
    name: string;
    country: string | null;
    criticality_tier: string | null;
  }>
): BoardReportData['concentrationRisk'] {
  // Geographic concentration
  const countryCount: Record<string, number> = {};
  vendors.forEach((v) => {
    const country = v.country || 'Unknown';
    countryCount[country] = (countryCount[country] || 0) + 1;
  });

  const totalVendors = vendors.length || 1;
  const geographicBreakdown: GeographicConcentration[] = Object.entries(countryCount)
    .map(([country, count]) => {
      const share = count / totalVendors;
      const riskLevel: RiskLevel = share > 0.5 ? 'high' : share > 0.3 ? 'medium' : 'low';
      return {
        region: getRegion(country),
        country,
        percentage: Math.round(share * 100),
        vendorCount: count,
        riskLevel,
      };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // Calculate HHI (Herfindahl-Hirschman Index)
  const shares = Object.values(countryCount).map((c) => (c / totalVendors) * 100);
  const hhi = shares.reduce((sum, share) => sum + share * share, 0);
  const hhiCategory: 'low' | 'moderate' | 'high' =
    hhi < 1500 ? 'low' : hhi < 2500 ? 'moderate' : 'high';

  // Count critical vendors as potential SPOFs
  const spofsCount = vendors.filter((v) => v.criticality_tier === 'critical').length;

  // Top risks based on concentration
  const topRisks: string[] = [];
  if (hhiCategory === 'high') {
    topRisks.push('High geographic concentration risk');
  }
  if (spofsCount > 3) {
    topRisks.push(`${spofsCount} critical vendors represent single points of failure`);
  }
  const topCountry = geographicBreakdown[0];
  if (topCountry && topCountry.percentage > 50) {
    topRisks.push(
      `${topCountry.percentage}% of vendors concentrated in ${topCountry.country}`
    );
  }

  return {
    hhiScore: Math.round(hhi),
    hhiCategory,
    geographicBreakdown,
    spofsCount,
    fourthPartyDepth: 2, // Default depth for now
    topRisks,
  };
}

/**
 * Get region from country code
 */
function getRegion(country: string): string {
  const euCountries = [
    'Germany',
    'France',
    'Italy',
    'Spain',
    'Netherlands',
    'Belgium',
    'Austria',
    'Ireland',
    'Portugal',
    'Greece',
    'Finland',
    'Sweden',
    'Denmark',
    'Poland',
    'Czech Republic',
    'Romania',
    'Hungary',
    'Bulgaria',
    'Croatia',
    'Slovakia',
    'Slovenia',
    'Lithuania',
    'Latvia',
    'Estonia',
    'Luxembourg',
    'Malta',
    'Cyprus',
    'DE',
    'FR',
    'IT',
    'ES',
    'NL',
    'BE',
    'AT',
    'IE',
    'PT',
    'GR',
    'FI',
    'SE',
    'DK',
    'PL',
    'CZ',
    'RO',
    'HU',
    'BG',
    'HR',
    'SK',
    'SI',
    'LT',
    'LV',
    'EE',
    'LU',
    'MT',
    'CY',
  ];

  const usCountries = ['United States', 'USA', 'US'];

  if (euCountries.includes(country)) return 'EU';
  if (usCountries.includes(country)) return 'North America';
  if (['UK', 'United Kingdom', 'GB', 'Switzerland', 'CH', 'Norway', 'NO'].includes(country))
    return 'Europe (Non-EU)';
  if (country === 'Unknown') return 'Unknown';
  return 'Other';
}

/**
 * Calculate DORA compliance metrics
 */
function calculateDORACompliance(
  vendors: Array<{ criticality_tier: string | null }>,
  assessments: Array<{ status: string; overall_risk_score: number | null }>,
  subcontractors: Array<{ supports_critical_function: boolean | null }>
): BoardReportData['doraCompliance'] {
  // Simplified DORA pillar calculation
  // In production, this would come from actual control assessments

  const hasVendors = vendors.length > 0;
  const hasAssessments = assessments.length > 0;
  const assessmentCompletion = assessments.length
    ? assessments.filter((a) => a.status === 'completed').length / assessments.length
    : 0;
  const hasSubcontractorVisibility = subcontractors.length > 0;

  const pillars: DORACompliancePillar[] = [
    {
      name: 'ICT Risk Management',
      code: 'ICT_RISK',
      coverage: hasAssessments ? Math.min(75 + assessmentCompletion * 20, 95) : 45,
      status: hasAssessments && assessmentCompletion > 0.5 ? 'partial' : 'non-compliant',
      controlsTotal: 25,
      controlsImplemented: hasAssessments ? Math.floor(25 * (0.5 + assessmentCompletion * 0.4)) : 12,
    },
    {
      name: 'Incident Reporting',
      code: 'INCIDENT',
      coverage: 65, // Base coverage
      status: 'partial',
      controlsTotal: 15,
      controlsImplemented: 10,
    },
    {
      name: 'Resilience Testing',
      code: 'RESILIENCE',
      coverage: 55,
      status: 'partial',
      controlsTotal: 20,
      controlsImplemented: 11,
    },
    {
      name: 'Third-Party Risk Management',
      code: 'TPRM',
      coverage: hasVendors && hasSubcontractorVisibility ? 80 : hasVendors ? 60 : 30,
      status: hasVendors && hasSubcontractorVisibility ? 'partial' : 'non-compliant',
      controlsTotal: 30,
      controlsImplemented: hasVendors ? (hasSubcontractorVisibility ? 24 : 18) : 9,
    },
    {
      name: 'Information Sharing',
      code: 'SHARING',
      coverage: 40,
      status: 'non-compliant',
      controlsTotal: 10,
      controlsImplemented: 4,
    },
  ];

  // Update status based on coverage
  pillars.forEach((p) => {
    if (p.coverage >= 80) p.status = 'compliant';
    else if (p.coverage >= 50) p.status = 'partial';
    else p.status = 'non-compliant';
  });

  // Generate gaps
  const criticalGaps: DORAGap[] = [];

  if (!hasSubcontractorVisibility) {
    criticalGaps.push({
      pillar: 'TPRM',
      gap: 'Limited fourth-party visibility',
      priority: 'high',
      remediationSuggestion: 'Implement subcontractor tracking from vendor SOC 2 reports',
    });
  }

  const ictPillar = pillars.find((p) => p.code === 'ICT_RISK');
  if (ictPillar && ictPillar.coverage < 70) {
    criticalGaps.push({
      pillar: 'ICT_RISK',
      gap: 'Incomplete risk assessment coverage',
      priority: 'critical',
      remediationSuggestion: 'Complete vendor risk assessments for all critical vendors',
    });
  }

  const sharingPillar = pillars.find((p) => p.code === 'SHARING');
  if (sharingPillar && sharingPillar.coverage < 50) {
    criticalGaps.push({
      pillar: 'SHARING',
      gap: 'Information sharing arrangements not established',
      priority: 'medium',
      remediationSuggestion: 'Join industry threat intelligence sharing groups',
    });
  }

  return { pillars, criticalGaps };
}

/**
 * Calculate overall compliance score
 */
function calculateOverallScore(pillars: DORACompliancePillar[]): number {
  if (pillars.length === 0) return 0;
  const weights = { ICT_RISK: 0.25, INCIDENT: 0.2, RESILIENCE: 0.2, TPRM: 0.25, SHARING: 0.1 };
  let score = 0;
  pillars.forEach((p) => {
    const weight = weights[p.code as keyof typeof weights] || 0.2;
    score += p.coverage * weight;
  });
  return Math.round(score);
}

/**
 * Calculate DORA maturity level
 */
function calculateMaturityLevel(score: number): DORAMaturityLevel {
  if (score >= 90) return 'L4';
  if (score >= 75) return 'L3';
  if (score >= 55) return 'L2';
  if (score >= 35) return 'L1';
  return 'L0';
}

/**
 * Generate key risks
 */
function generateKeyRisks(
  concentration: BoardReportData['concentrationRisk'],
  dora: BoardReportData['doraCompliance'],
  vendors: Array<{ risk_rating: string | null }>,
  incidents: Array<{ severity: string | null; status: string }>
): string[] {
  const risks: string[] = [];

  // Concentration risks
  if (concentration.hhiCategory === 'high') {
    risks.push('High vendor geographic concentration');
  }
  if (concentration.spofsCount > 2) {
    risks.push(`${concentration.spofsCount} single points of failure identified`);
  }

  // Compliance gaps
  const criticalGaps = dora.criticalGaps.filter((g) => g.priority === 'critical');
  if (criticalGaps.length > 0) {
    risks.push(`${criticalGaps.length} critical DORA compliance gaps`);
  }

  // High risk vendors
  const highRiskCount = vendors.filter(
    (v) => v.risk_rating === 'high' || v.risk_rating === 'critical'
  ).length;
  if (highRiskCount > 3) {
    risks.push(`${highRiskCount} vendors with high/critical risk rating`);
  }

  // Open critical incidents
  const criticalIncidents = incidents.filter(
    (i) =>
      (i.severity === 'critical' || i.severity === 'major') &&
      (i.status === 'open' || i.status === 'in_progress')
  ).length;
  if (criticalIncidents > 0) {
    risks.push(`${criticalIncidents} critical/major incidents open`);
  }

  return risks.slice(0, 5);
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  concentration: BoardReportData['concentrationRisk'],
  dora: BoardReportData['doraCompliance'],
  actionItems: ActionItem[]
): string[] {
  const recommendations: string[] = [];

  // Based on concentration
  if (concentration.hhiCategory === 'high') {
    recommendations.push('Diversify vendor portfolio across multiple regions');
  }

  // Based on DORA gaps
  const criticalPillars = dora.pillars.filter((p) => p.status === 'non-compliant');
  if (criticalPillars.length > 0) {
    recommendations.push(
      `Prioritize ${criticalPillars[0].name} compliance improvements`
    );
  }

  // Based on action items
  const criticalActions = actionItems.filter((a) => a.priority === 'critical');
  if (criticalActions.length > 0) {
    recommendations.push(`Address ${criticalActions.length} critical action items`);
  }

  // General recommendations
  const avgCoverage =
    dora.pillars.reduce((sum, p) => sum + p.coverage, 0) / dora.pillars.length;
  if (avgCoverage < 70) {
    recommendations.push('Accelerate DORA compliance program implementation');
  }

  return recommendations.slice(0, 4);
}

/**
 * Generate prioritized action items
 */
function generateActionItems(
  vendors: Array<{ id: string; name: string; criticality_tier: string | null }>,
  assessments: Array<{ status: string; next_review_date: string | null }>,
  incidents: Array<{ id: string; status: string; severity: string | null }>,
  contracts: Array<{ id: string; end_date: string | null; status: string }>,
  dora: BoardReportData['doraCompliance']
): ActionItem[] {
  const items: ActionItem[] = [];

  // Critical incidents
  incidents
    .filter(
      (i) =>
        (i.severity === 'critical' || i.severity === 'major') &&
        (i.status === 'open' || i.status === 'in_progress')
    )
    .forEach((incident, idx) => {
      items.push({
        id: `INC-${idx + 1}`,
        title: 'Resolve critical incident',
        description: `Critical/major incident requires immediate attention`,
        priority: 'critical',
        category: 'incident',
      });
    });

  // DORA gaps
  dora.criticalGaps
    .filter((g) => g.priority === 'critical' || g.priority === 'high')
    .forEach((gap, idx) => {
      items.push({
        id: `GAP-${idx + 1}`,
        title: `Address ${gap.pillar} gap`,
        description: gap.gap,
        priority: gap.priority,
        category: 'compliance',
      });
    });

  // Expiring contracts
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  contracts
    .filter((c) => c.end_date && new Date(c.end_date) <= thirtyDays)
    .forEach((contract, idx) => {
      items.push({
        id: `CONTRACT-${idx + 1}`,
        title: 'Renew expiring contract',
        description: `Contract expires ${contract.end_date}`,
        priority: 'high',
        category: 'vendor',
        dueDate: contract.end_date ? new Date(contract.end_date) : undefined,
      });
    });

  // Overdue assessments
  assessments
    .filter((a) => {
      if (a.status === 'completed' && a.next_review_date) {
        return new Date(a.next_review_date) < now;
      }
      return a.status === 'overdue';
    })
    .slice(0, 3)
    .forEach((assessment, idx) => {
      items.push({
        id: `ASSESS-${idx + 1}`,
        title: 'Complete overdue assessment',
        description: 'Vendor assessment requires review',
        priority: 'high',
        category: 'risk',
      });
    });

  return items.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (
      (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
    );
  });
}
