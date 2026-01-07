/**
 * Concentration Risk Types
 *
 * Types for DORA Article 28-29 concentration risk management
 */

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export type SubstitutabilityRating =
  | 'easily_substitutable'
  | 'substitutable_with_difficulty'
  | 'not_substitutable'
  | 'not_assessed';

/**
 * Concentration risk alert types
 */
export type ConcentrationAlertType =
  | 'threshold_breach'
  | 'geographic_concentration'
  | 'service_concentration'
  | 'spof_detected'
  | 'substitutability_gap';

export interface ConcentrationAlert {
  id: string;
  type: ConcentrationAlertType;
  severity: RiskLevel;
  title: string;
  description: string;
  affected_vendors: string[];
  affected_functions?: string[];
  created_at: string;
  dismissed_until?: string | null;
  action_required: boolean;
}

/**
 * Risk level summary for overview cards
 */
export interface RiskLevelSummary {
  level: RiskLevel;
  vendor_count: number;
  critical_function_count: number;
  primary_concern: string;
  vendors: Array<{
    id: string;
    name: string;
    tier: string;
  }>;
}

/**
 * Single Point of Failure detection
 */
export interface SinglePointOfFailure {
  vendor_id: string;
  vendor_name: string;
  vendor_tier: string;
  critical_functions: string[];
  substitutability: SubstitutabilityRating | null;
  recovery_time_estimate: string;
  risk_score: number;
  recommended_actions: string[];
}

/**
 * Heat map cell data
 */
export interface HeatMapCell {
  service_type: string;
  region: string;
  vendor_count: number;
  critical_vendor_count: number;
  critical_function_coverage: number;
  concentration_score: number; // 0-100
  risk_level: RiskLevel;
  vendors: Array<{
    id: string;
    name: string;
    tier: string;
    supports_critical_function: boolean;
  }>;
}

/**
 * Geographic distribution data
 */
export interface GeographicSpread {
  region: string;
  country_code: string;
  vendor_count: number;
  critical_vendor_count: number;
  percentage: number;
}

/**
 * Concentration metrics
 */
export interface ConcentrationMetrics {
  // Vendor distribution
  total_vendors: number;
  critical_vendors: number;
  important_vendors: number;
  standard_vendors: number;

  // Herfindahl-Hirschman Index for service concentration
  // < 0.15 = Low, 0.15-0.25 = Moderate, > 0.25 = High
  service_hhi: number;
  service_concentration_level: 'low' | 'moderate' | 'high';
  top_service: string;
  top_service_percentage: number;

  // Geographic spread
  geographic_spread: GeographicSpread[];
  eu_percentage: number;
  non_eu_percentage: number;

  // Substitutability
  substitutability_assessed_count: number;
  substitutability_coverage_percentage: number;
  not_substitutable_count: number;

  // Fourth-party depth (future)
  avg_chain_length: number;
  max_chain_depth: number;

  // SPOF
  spof_count: number;
  total_critical_functions: number;
}

/**
 * Substitutability assessment form data
 */
export interface SubstitutabilityAssessment {
  vendor_id: string;

  // Assessment factors (1-5 scale)
  market_alternatives: 1 | 2 | 3 | 4 | 5;  // 1=none, 5=many
  transition_complexity: 1 | 2 | 3 | 4 | 5; // 1=trivial, 5=extreme
  contractual_freedom: 1 | 2 | 3 | 4 | 5;   // 1=locked, 5=flexible
  data_portability: 1 | 2 | 3 | 4 | 5;      // 1=impossible, 5=easy
  integration_depth: 1 | 2 | 3 | 4 | 5;     // 1=shallow, 5=deep

  // Timeline
  estimated_transition_months: number;

  // Notes
  alternative_vendors?: string[];
  migration_notes?: string;
  contractual_constraints?: string;

  // Calculated result
  overall_rating: SubstitutabilityRating;
  confidence_score: number; // 0-100

  // Metadata
  assessed_by: string;
  assessed_at: string;
  next_review_date: string;
}

/**
 * Vendor dependency for graph visualization
 */
export interface VendorDependency {
  id: string;
  vendor_id: string;
  vendor_name: string;
  subcontractor_id: string;
  subcontractor_name: string;
  service_provided: string;
  criticality: 'critical' | 'important' | 'standard';
  depth: number; // 1 = direct, 2 = fourth-party, etc.
}

/**
 * Dependency graph node
 */
export interface DependencyNode {
  id: string;
  name: string;
  type: 'entity' | 'third_party' | 'fourth_party';
  tier: 'critical' | 'important' | 'standard';
  risk_score: number | null;
  services: string[];
  x?: number;
  y?: number;
}

/**
 * Dependency graph edge
 */
export interface DependencyEdge {
  source: string;
  target: string;
  service: string;
  criticality: string;
}

/**
 * Complete dependency graph
 */
export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

/**
 * Concentration overview response
 */
export interface ConcentrationOverviewResponse {
  risk_levels: RiskLevelSummary[];
  alerts: ConcentrationAlert[];
  spof_count: number;
  last_updated: string;
}

/**
 * Heat map response
 */
export interface HeatMapResponse {
  cells: HeatMapCell[];
  dimensions: {
    services: string[];
    regions: string[];
  };
  max_concentration: number;
}

/**
 * Thresholds for concentration alerts
 */
export const CONCENTRATION_THRESHOLDS = {
  // Percentage thresholds
  single_vendor_spend: 30,       // >30% spend with single vendor = Critical
  geographic_concentration: 50,  // >50% vendors in single country = High
  service_concentration: 40,     // >40% of service type = High
  eu_minimum: 30,                // <30% EU vendors for EU entity = Warning

  // HHI thresholds
  hhi_low: 0.15,
  hhi_moderate: 0.25,
  hhi_high: 0.40,

  // Substitutability
  substitutability_coverage_target: 100, // All critical vendors assessed

  // Fourth-party
  max_chain_depth_warning: 3,
  max_chain_depth_critical: 5,
} as const;

/**
 * Risk level colors for visualization
 */
export const RISK_COLORS = {
  critical: '#ef4444', // Red 500
  high: '#f97316',     // Orange 500
  medium: '#eab308',   // Yellow 500
  low: '#22c55e',      // Green 500
} as const;

/**
 * Service type labels for display
 */
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  cloud_computing: 'Cloud Computing',
  cloud_infrastructure: 'Cloud Infrastructure',
  platform_as_service: 'Platform (PaaS)',
  software_as_service: 'Software (SaaS)',
  saas: 'SaaS',
  data_analytics: 'Data Analytics',
  data_management: 'Data Management',
  security: 'Security Services',
  network: 'Network Services',
  telecommunications: 'Telecommunications',
  payment_processing: 'Payment Processing',
  identity_management: 'Identity Management',
  other: 'Other Services',
};

/**
 * Region labels for display
 */
export const REGION_LABELS: Record<string, string> = {
  EU: 'European Union',
  US: 'United States',
  UK: 'United Kingdom',
  APAC: 'Asia Pacific',
  LATAM: 'Latin America',
  MEA: 'Middle East & Africa',
  OTHER: 'Other Regions',
};

/**
 * Country to region mapping
 */
export const COUNTRY_TO_REGION: Record<string, string> = {
  // EU countries
  DE: 'EU', FR: 'EU', IT: 'EU', ES: 'EU', NL: 'EU', BE: 'EU',
  AT: 'EU', PT: 'EU', IE: 'EU', LU: 'EU', FI: 'EU', SE: 'EU',
  DK: 'EU', PL: 'EU', CZ: 'EU', GR: 'EU', HU: 'EU', RO: 'EU',
  BG: 'EU', HR: 'EU', SK: 'EU', SI: 'EU', LT: 'EU', LV: 'EU',
  EE: 'EU', CY: 'EU', MT: 'EU',
  // Other regions
  US: 'US',
  GB: 'UK',
  // APAC
  JP: 'APAC', CN: 'APAC', KR: 'APAC', AU: 'APAC', NZ: 'APAC',
  SG: 'APAC', HK: 'APAC', IN: 'APAC', TW: 'APAC',
  // LATAM
  BR: 'LATAM', MX: 'LATAM', AR: 'LATAM', CL: 'LATAM', CO: 'LATAM',
  // MEA
  AE: 'MEA', SA: 'MEA', IL: 'MEA', ZA: 'MEA', EG: 'MEA',
};

/**
 * Get region from country code
 */
export function getRegionFromCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return 'OTHER';
  return COUNTRY_TO_REGION[countryCode.toUpperCase()] || 'OTHER';
}

/**
 * Calculate risk level from concentration score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Calculate HHI concentration level
 */
export function getHHILevel(hhi: number): 'low' | 'moderate' | 'high' {
  if (hhi < CONCENTRATION_THRESHOLDS.hhi_low) return 'low';
  if (hhi < CONCENTRATION_THRESHOLDS.hhi_moderate) return 'moderate';
  return 'high';
}
