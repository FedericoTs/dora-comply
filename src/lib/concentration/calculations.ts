/**
 * Concentration Risk Calculations
 *
 * Utilities for calculating concentration risk metrics per DORA Article 28-29
 */

import type { Vendor } from '@/lib/vendors/types';
import {
  type RiskLevel,
  type SinglePointOfFailure,
  type HeatMapCell,
  type GeographicSpread,
  type ConcentrationMetrics,
  type ConcentrationAlert,
  type ConcentrationAlertType,
  type RiskLevelSummary,
  CONCENTRATION_THRESHOLDS,
  getRegionFromCountry,
  getRiskLevel,
  getHHILevel,
  SERVICE_TYPE_LABELS,
} from './types';
import type { AggregateChainMetrics } from './chain-utils';

/**
 * Calculate Herfindahl-Hirschman Index (HHI) for service concentration
 *
 * HHI = Sum of (market share)^2 for each service type
 * - < 0.15: Low concentration (competitive)
 * - 0.15-0.25: Moderate concentration
 * - > 0.25: High concentration
 */
export function calculateServiceHHI(vendors: Vendor[]): {
  hhi: number;
  level: 'low' | 'moderate' | 'high';
  breakdown: Array<{ service: string; share: number; contribution: number }>;
} {
  if (vendors.length === 0) {
    return { hhi: 0, level: 'low', breakdown: [] };
  }

  // Count service occurrences
  const serviceCounts: Record<string, number> = {};
  let totalServices = 0;

  for (const vendor of vendors) {
    for (const service of vendor.service_types || []) {
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
      totalServices++;
    }
  }

  if (totalServices === 0) {
    return { hhi: 0, level: 'low', breakdown: [] };
  }

  // Calculate HHI
  let hhi = 0;
  const breakdown: Array<{ service: string; share: number; contribution: number }> = [];

  for (const [service, count] of Object.entries(serviceCounts)) {
    const share = count / totalServices;
    const contribution = share * share;
    hhi += contribution;
    breakdown.push({
      service,
      share: Math.round(share * 100),
      contribution: Math.round(contribution * 10000) / 10000,
    });
  }

  // Sort by contribution descending
  breakdown.sort((a, b) => b.contribution - a.contribution);

  return {
    hhi: Math.round(hhi * 100) / 100,
    level: getHHILevel(hhi),
    breakdown,
  };
}

/**
 * Detect Single Points of Failure (SPOF)
 *
 * A SPOF is a vendor that:
 * 1. Supports a critical function
 * 2. Is the only vendor supporting that function
 * 3. Has limited or no substitutability
 */
export function detectSinglePointsOfFailure(vendors: Vendor[]): SinglePointOfFailure[] {
  // Group vendors by critical functions they support
  const functionVendorMap: Map<string, Vendor[]> = new Map();

  for (const vendor of vendors) {
    if (!vendor.supports_critical_function || !vendor.critical_functions) continue;

    for (const func of vendor.critical_functions) {
      const existing = functionVendorMap.get(func) || [];
      existing.push(vendor);
      functionVendorMap.set(func, existing);
    }
  }

  // Find functions with only one vendor
  const spofs: SinglePointOfFailure[] = [];

  for (const [func, vendorList] of functionVendorMap.entries()) {
    if (vendorList.length === 1) {
      const vendor = vendorList[0];

      // Calculate recovery time estimate based on substitutability
      let recoveryEstimate = '3-6 months';
      if (vendor.substitutability_assessment === 'not_substitutable') {
        recoveryEstimate = '12+ months';
      } else if (vendor.substitutability_assessment === 'substitutable_with_difficulty') {
        recoveryEstimate = '6-12 months';
      } else if (vendor.substitutability_assessment === 'easily_substitutable') {
        recoveryEstimate = '1-3 months';
      }

      // Generate recommended actions
      const actions: string[] = [];
      if (!vendor.substitutability_assessment) {
        actions.push('Complete substitutability assessment');
      }
      if (vendor.tier === 'critical') {
        actions.push('Develop exit strategy and transition plan');
        actions.push('Identify alternative providers');
      }
      actions.push('Review contractual exit provisions');
      actions.push('Document recovery procedures');

      // Check if this vendor is already in SPOFs (might support multiple functions)
      const existingSpof = spofs.find(s => s.vendor_id === vendor.id);
      if (existingSpof) {
        existingSpof.critical_functions.push(func);
      } else {
        spofs.push({
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          vendor_tier: vendor.tier,
          critical_functions: [func],
          substitutability: vendor.substitutability_assessment || null,
          recovery_time_estimate: recoveryEstimate,
          risk_score: calculateSpofRiskScore(vendor),
          recommended_actions: actions,
        });
      }
    }
  }

  // Sort by risk score descending
  return spofs.sort((a, b) => b.risk_score - a.risk_score);
}

/**
 * Calculate SPOF risk score (0-100)
 */
function calculateSpofRiskScore(vendor: Vendor): number {
  let score = 50; // Base score

  // Tier multiplier
  if (vendor.tier === 'critical') score += 30;
  else if (vendor.tier === 'important') score += 15;

  // Substitutability impact
  if (vendor.substitutability_assessment === 'not_substitutable') score += 20;
  else if (vendor.substitutability_assessment === 'substitutable_with_difficulty') score += 10;
  else if (!vendor.substitutability_assessment) score += 15; // Unknown = risky

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Calculate geographic concentration metrics
 */
export function calculateGeographicSpread(vendors: Vendor[]): {
  spread: GeographicSpread[];
  euPercentage: number;
  nonEuPercentage: number;
  alerts: ConcentrationAlert[];
} {
  if (vendors.length === 0) {
    return { spread: [], euPercentage: 0, nonEuPercentage: 0, alerts: [] };
  }

  // Count by region
  const regionCounts: Record<string, { total: number; critical: number }> = {};
  const alerts: ConcentrationAlert[] = [];

  for (const vendor of vendors) {
    const region = getRegionFromCountry(vendor.headquarters_country || null);
    if (!regionCounts[region]) {
      regionCounts[region] = { total: 0, critical: 0 };
    }
    regionCounts[region].total++;
    if (vendor.tier === 'critical') {
      regionCounts[region].critical++;
    }
  }

  // Calculate percentages
  const totalVendors = vendors.length;
  const spread: GeographicSpread[] = [];
  let euCount = 0;

  for (const [region, counts] of Object.entries(regionCounts)) {
    const percentage = Math.round((counts.total / totalVendors) * 100);
    spread.push({
      region,
      country_code: region,
      vendor_count: counts.total,
      critical_vendor_count: counts.critical,
      percentage,
    });

    if (region === 'EU') {
      euCount = counts.total;
    }

    // Check for geographic concentration alert
    if (percentage > CONCENTRATION_THRESHOLDS.geographic_concentration) {
      alerts.push({
        id: `geo-${region}`,
        type: 'geographic_concentration',
        severity: 'high',
        title: 'Geographic Concentration Alert',
        description: `${percentage}% of vendors are located in ${region}. This exceeds the ${CONCENTRATION_THRESHOLDS.geographic_concentration}% threshold and creates geographic concentration risk.`,
        affected_vendors: vendors
          .filter(v => getRegionFromCountry(v.headquarters_country) === region)
          .map(v => v.id),
        created_at: new Date().toISOString(),
        action_required: true,
      });
    }
  }

  // Sort by percentage descending
  spread.sort((a, b) => b.percentage - a.percentage);

  const euPercentage = Math.round((euCount / totalVendors) * 100);

  return {
    spread,
    euPercentage,
    nonEuPercentage: 100 - euPercentage,
    alerts,
  };
}

/**
 * Generate heat map data for service x geography concentration
 */
export function generateHeatMapData(vendors: Vendor[]): {
  cells: HeatMapCell[];
  services: string[];
  regions: string[];
} {
  // Collect unique services and regions
  const serviceSet = new Set<string>();
  const regionSet = new Set<string>();

  for (const vendor of vendors) {
    const region = getRegionFromCountry(vendor.headquarters_country);
    regionSet.add(region);
    for (const service of vendor.service_types || []) {
      serviceSet.add(service);
    }
  }

  const services = Array.from(serviceSet).sort();
  const regions = Array.from(regionSet).sort();
  const cells: HeatMapCell[] = [];

  // Calculate cell data for each service x region combination
  for (const service of services) {
    for (const region of regions) {
      const matchingVendors = vendors.filter(v =>
        v.service_types?.includes(service) &&
        getRegionFromCountry(v.headquarters_country) === region
      );

      if (matchingVendors.length === 0) continue;

      const criticalCount = matchingVendors.filter(v => v.tier === 'critical').length;
      const criticalFunctionCount = matchingVendors.filter(v => v.supports_critical_function).length;

      // Calculate concentration score
      // Higher score = higher concentration risk
      const totalInService = vendors.filter(v => v.service_types?.includes(service)).length;
      const concentrationPercent = (matchingVendors.length / totalInService) * 100;
      const criticalWeight = criticalCount > 0 ? 1.5 : 1;
      const score = Math.min(100, Math.round(concentrationPercent * criticalWeight));

      cells.push({
        service_type: service,
        region,
        vendor_count: matchingVendors.length,
        critical_vendor_count: criticalCount,
        critical_function_coverage: criticalFunctionCount,
        concentration_score: score,
        risk_level: getRiskLevel(score),
        vendors: matchingVendors.map(v => ({
          id: v.id,
          name: v.name,
          tier: v.tier,
          supports_critical_function: v.supports_critical_function,
        })),
      });
    }
  }

  return { cells, services, regions };
}

/**
 * Generate risk level summaries for overview cards
 */
export function generateRiskLevelSummaries(
  vendors: Vendor[],
  spofs: SinglePointOfFailure[],
  geoAlerts: ConcentrationAlert[]
): RiskLevelSummary[] {
  const criticalVendors = vendors.filter(v => v.tier === 'critical');
  const criticalFunctions = new Set<string>();
  for (const vendor of criticalVendors) {
    for (const func of vendor.critical_functions || []) {
      criticalFunctions.add(func);
    }
  }

  const summaries: RiskLevelSummary[] = [];

  // Critical: SPOFs and vendors with critical functions
  if (spofs.length > 0) {
    summaries.push({
      level: 'critical',
      vendor_count: spofs.length,
      critical_function_count: spofs.reduce((sum, s) => sum + s.critical_functions.length, 0),
      primary_concern: `${spofs.length} single point${spofs.length > 1 ? 's' : ''} of failure affecting ${
        new Set(spofs.flatMap(s => s.critical_functions)).size
      } critical function${new Set(spofs.flatMap(s => s.critical_functions)).size > 1 ? 's' : ''}`,
      vendors: spofs.map(s => ({
        id: s.vendor_id,
        name: s.vendor_name,
        tier: s.vendor_tier,
      })),
    });
  }

  // High: Geographic concentration or service concentration
  if (geoAlerts.length > 0) {
    summaries.push({
      level: 'high',
      vendor_count: geoAlerts.reduce((sum, a) => sum + a.affected_vendors.length, 0),
      critical_function_count: 0,
      primary_concern: `Geographic concentration in ${geoAlerts.length} region${geoAlerts.length > 1 ? 's' : ''}`,
      vendors: vendors
        .filter(v => geoAlerts.some(a => a.affected_vendors.includes(v.id)))
        .map(v => ({ id: v.id, name: v.name, tier: v.tier }))
        .slice(0, 5),
    });
  }

  // Medium: Vendors without substitutability assessment
  const unassessedCritical = criticalVendors.filter(v => !v.substitutability_assessment);
  if (unassessedCritical.length > 0) {
    summaries.push({
      level: 'medium',
      vendor_count: unassessedCritical.length,
      critical_function_count: 0,
      primary_concern: `${unassessedCritical.length} critical vendor${
        unassessedCritical.length > 1 ? 's' : ''
      } without substitutability assessment`,
      vendors: unassessedCritical.map(v => ({ id: v.id, name: v.name, tier: v.tier })),
    });
  }

  // Low: Diversified vendors
  const lowRiskVendors = vendors.filter(v =>
    v.tier === 'standard' &&
    !spofs.some(s => s.vendor_id === v.id) &&
    !geoAlerts.some(a => a.affected_vendors.includes(v.id))
  );

  if (lowRiskVendors.length > 0) {
    summaries.push({
      level: 'low',
      vendor_count: lowRiskVendors.length,
      critical_function_count: 0,
      primary_concern: 'Diversified portfolio with balanced distribution',
      vendors: lowRiskVendors.slice(0, 5).map(v => ({ id: v.id, name: v.name, tier: v.tier })),
    });
  }

  return summaries;
}

/**
 * Generate all concentration alerts
 */
export function generateConcentrationAlerts(
  vendors: Vendor[],
  spofs: SinglePointOfFailure[],
  serviceHHI: { hhi: number; breakdown: Array<{ service: string; share: number }> },
  geoData: { euPercentage: number; alerts: ConcentrationAlert[] }
): ConcentrationAlert[] {
  const alerts: ConcentrationAlert[] = [...geoData.alerts];

  // SPOF alerts
  for (const spof of spofs) {
    alerts.push({
      id: `spof-${spof.vendor_id}`,
      type: 'spof_detected',
      severity: 'critical',
      title: 'Single Point of Failure Detected',
      description: `${spof.vendor_name} is the sole provider for ${spof.critical_functions.length} critical function${
        spof.critical_functions.length > 1 ? 's' : ''
      }: ${spof.critical_functions.join(', ')}. Estimated recovery time if vendor fails: ${spof.recovery_time_estimate}.`,
      affected_vendors: [spof.vendor_id],
      affected_functions: spof.critical_functions,
      created_at: new Date().toISOString(),
      action_required: true,
    });
  }

  // Service concentration alerts
  for (const item of serviceHHI.breakdown) {
    if (item.share > CONCENTRATION_THRESHOLDS.service_concentration) {
      const serviceName = SERVICE_TYPE_LABELS[item.service] || item.service;
      alerts.push({
        id: `svc-${item.service}`,
        type: 'service_concentration',
        severity: 'high',
        title: 'Service Concentration Alert',
        description: `${serviceName} represents ${item.share}% of your vendor services, exceeding the ${CONCENTRATION_THRESHOLDS.service_concentration}% threshold.`,
        affected_vendors: vendors
          .filter(v => v.service_types?.includes(item.service))
          .map(v => v.id),
        created_at: new Date().toISOString(),
        action_required: true,
      });
    }
  }

  // Substitutability gap alert
  const criticalVendors = vendors.filter(v => v.tier === 'critical');
  const unassessed = criticalVendors.filter(v => !v.substitutability_assessment);
  if (unassessed.length > 0) {
    alerts.push({
      id: 'substitutability-gap',
      type: 'substitutability_gap',
      severity: 'medium',
      title: 'Substitutability Assessment Required',
      description: `${unassessed.length} critical vendor${
        unassessed.length > 1 ? 's have' : ' has'
      } not been assessed for substitutability. DORA Article 29 requires this assessment.`,
      affected_vendors: unassessed.map(v => v.id),
      created_at: new Date().toISOString(),
      action_required: true,
    });
  }

  // Sort by severity
  const severityOrder: Record<RiskLevel, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

/**
 * Calculate complete concentration metrics
 */
export function calculateConcentrationMetrics(
  vendors: Vendor[],
  chainMetrics?: AggregateChainMetrics
): ConcentrationMetrics {
  const serviceHHI = calculateServiceHHI(vendors);
  const geoData = calculateGeographicSpread(vendors);

  const criticalVendors = vendors.filter(v => v.tier === 'critical');
  const importantVendors = vendors.filter(v => v.tier === 'important');
  const standardVendors = vendors.filter(v => v.tier === 'standard');

  const assessedCount = vendors.filter(v => v.substitutability_assessment).length;
  const notSubstitutableCount = vendors.filter(
    v => v.substitutability_assessment === 'not_substitutable'
  ).length;

  // Get top service
  const topService = serviceHHI.breakdown[0];

  // Count critical functions from all vendors
  const allCriticalFunctions = new Set<string>();
  for (const vendor of vendors) {
    for (const func of vendor.critical_functions || []) {
      allCriticalFunctions.add(func);
    }
  }

  const spofs = detectSinglePointsOfFailure(vendors);

  return {
    total_vendors: vendors.length,
    critical_vendors: criticalVendors.length,
    important_vendors: importantVendors.length,
    standard_vendors: standardVendors.length,

    service_hhi: serviceHHI.hhi,
    service_concentration_level: serviceHHI.level,
    top_service: topService?.service || 'N/A',
    top_service_percentage: topService?.share || 0,

    geographic_spread: geoData.spread,
    eu_percentage: geoData.euPercentage,
    non_eu_percentage: geoData.nonEuPercentage,

    substitutability_assessed_count: assessedCount,
    substitutability_coverage_percentage: vendors.length > 0
      ? Math.round((assessedCount / vendors.length) * 100)
      : 0,
    not_substitutable_count: notSubstitutableCount,

    // Fourth-party tracking (from chain metrics if available)
    avg_chain_length: chainMetrics?.avgChainLength ?? 0,
    max_chain_depth: chainMetrics?.maxChainDepth ?? 0,

    spof_count: spofs.length,
    total_critical_functions: allCriticalFunctions.size,
  };
}

/**
 * Generate fourth-party risk alerts based on chain metrics
 */
export function generateFourthPartyAlerts(
  chainMetrics: AggregateChainMetrics
): ConcentrationAlert[] {
  const alerts: ConcentrationAlert[] = [];

  // Deep chain warning (> 3 levels)
  if (chainMetrics.maxChainDepth > CONCENTRATION_THRESHOLDS.max_chain_depth_warning) {
    const severity: RiskLevel = chainMetrics.maxChainDepth > CONCENTRATION_THRESHOLDS.max_chain_depth_critical
      ? 'critical'
      : 'high';

    alerts.push({
      id: 'deep-chain',
      type: 'threshold_breach',
      severity,
      title: 'Extended Supply Chain Detected',
      description: `Your vendor ecosystem has a supply chain depth of ${chainMetrics.maxChainDepth} levels${
        chainMetrics.deepestVendorName ? ` (via ${chainMetrics.deepestVendorName})` : ''
      }. DORA Article 28(8) requires enhanced visibility and oversight of subcontracting chains.`,
      affected_vendors: chainMetrics.deepestVendorId ? [chainMetrics.deepestVendorId] : [],
      created_at: new Date().toISOString(),
      action_required: true,
    });
  }

  // Unmonitored fourth parties
  if (chainMetrics.unmonitoredCount > 0) {
    alerts.push({
      id: 'unmonitored-fourth-parties',
      type: 'threshold_breach',
      severity: chainMetrics.unmonitoredCount > 5 ? 'high' : 'medium',
      title: 'Unmonitored Fourth Parties',
      description: `${chainMetrics.unmonitoredCount} subcontractor${
        chainMetrics.unmonitoredCount > 1 ? 's are' : ' is'
      } not actively monitored. Consider implementing oversight per DORA requirements.`,
      affected_vendors: [],
      created_at: new Date().toISOString(),
      action_required: true,
    });
  }

  // Critical functions at deep levels
  if (chainMetrics.criticalAtDepth > 0) {
    alerts.push({
      id: 'critical-deep-chain',
      type: 'spof_detected',
      severity: 'critical',
      title: 'Critical Functions at Deep Chain Levels',
      description: `${chainMetrics.criticalAtDepth} vendor${
        chainMetrics.criticalAtDepth > 1 ? 's have' : ' has'
      } critical functions supported by subcontractors at tier 3 or deeper. This creates resilience risk.`,
      affected_vendors: [],
      created_at: new Date().toISOString(),
      action_required: true,
    });
  }

  return alerts;
}
