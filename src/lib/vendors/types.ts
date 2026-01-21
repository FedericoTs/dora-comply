/**
 * Vendor Management Types
 *
 * These types align with the database schema defined in:
 * - 001_initial_schema.sql (vendors table)
 * - 003_enhanced_roi.sql (vendor extensions)
 */

import type { Contract } from '../contracts';

// ============================================
// ENUMS
// ============================================

export type VendorTier = 'critical' | 'important' | 'standard';

export type VendorStatus = 'active' | 'pending' | 'inactive' | 'offboarding';

export type ProviderType =
  | 'ict_service_provider'
  | 'cloud_service_provider'
  | 'data_centre'
  | 'network_provider'
  | 'other';

export type ServiceType =
  | 'cloud_computing'
  | 'software_as_service'
  | 'platform_as_service'
  | 'infrastructure_as_service'
  | 'data_analytics'
  | 'data_management'
  | 'network_services'
  | 'security_services'
  | 'payment_services'
  | 'hardware'
  | 'other';

export type ContactType =
  | 'primary'
  | 'technical'
  | 'security'
  | 'commercial'
  | 'escalation';

// ============================================
// CTPP (Critical Third-Party Provider) TYPES
// Per DORA Articles 33-44
// ============================================

export type CTTPDesignationSource = 'esa_list' | 'self_identified' | 'authority_notification';
export type CTTPDesignatingAuthority = 'EBA' | 'ESMA' | 'EIOPA';
export type OversightPlanStatus = 'not_applicable' | 'pending' | 'in_progress' | 'completed';
export type CTTPSubstitutability = 'easily_substitutable' | 'moderately_difficult' | 'highly_concentrated' | 'no_alternatives';

export interface CTTPOversightInfo {
  // Designation (Art. 33)
  is_ctpp: boolean;
  ctpp_designation_date: string | null;
  ctpp_designation_source: CTTPDesignationSource | null;
  ctpp_designating_authority: CTTPDesignatingAuthority | null;
  ctpp_designation_reason: string | null;

  // Lead Overseer (Art. 33-34)
  lead_overseer: CTTPDesignatingAuthority | null;
  lead_overseer_assigned_date: string | null;
  lead_overseer_contact_email: string | null;
  joint_examination_team: boolean;

  // Oversight Framework (Art. 35-37)
  oversight_plan_status: OversightPlanStatus;
  last_oversight_assessment_date: string | null;
  next_oversight_assessment_date: string | null;
  oversight_findings_count: number;
  oversight_recommendations_pending: number;

  // Information Sharing (Art. 38)
  info_sharing_portal_access: boolean;
  info_sharing_portal_url: string | null;
  last_info_exchange_date: string | null;

  // Exit Strategy (Art. 28(8))
  ctpp_exit_strategy_documented: boolean;
  ctpp_exit_strategy_last_review: string | null;
  ctpp_substitutability_assessment: CTTPSubstitutability | null;
}

// ============================================
// CORE TYPES
// ============================================

export interface VendorContact {
  name: string;
  email?: string;
  phone?: string;
  title?: string;
}

export interface Vendor {
  id: string;
  organization_id: string;

  // Basic info
  name: string;
  lei?: string | null;
  tier: VendorTier;
  status: VendorStatus;

  // Classification
  provider_type?: ProviderType | null;
  headquarters_country?: string | null;
  jurisdiction?: string | null;
  service_types: string[];

  // DORA specific
  supports_critical_function: boolean;
  critical_functions: string[];
  is_intra_group: boolean;
  parent_provider_id?: string | null;
  registration_number?: string | null;
  regulatory_authorizations: string[];

  // ESA/DORA B_05.01 fields (from Migration 005/006)
  direct_parent_lei?: string | null;
  direct_parent_name?: string | null;
  direct_parent_country?: string | null;
  ultimate_parent_lei?: string | null;
  ultimate_parent_name?: string | null;
  ultimate_parent_country?: string | null;
  esa_register_id?: string | null;
  substitutability_assessment?: SubstitutabilityAssessment | null;
  total_annual_expense?: number | null;
  expense_currency?: string | null;

  // LEI Verification (from GLEIF API)
  lei_status?: LEIRegistrationStatus | null;
  lei_verified_at?: string | null;
  lei_next_renewal?: string | null;
  entity_status?: EntityStatus | null;
  registration_authority_id?: string | null;
  legal_form_code?: string | null;
  legal_address?: GLEIFAddress | null;
  headquarters_address?: GLEIFAddress | null;
  entity_creation_date?: string | null;
  gleif_data?: Record<string, unknown> | null;
  gleif_fetched_at?: string | null;

  // Risk
  risk_score?: number | null;
  last_assessment_date?: string | null;

  // External Monitoring (from Migration 015)
  external_risk_score?: number | null;
  external_risk_grade?: 'A' | 'B' | 'C' | 'D' | 'F' | null;
  external_score_provider?: string | null;
  external_score_updated_at?: string | null;
  external_score_factors?: unknown[] | null;
  monitoring_enabled?: boolean;
  monitoring_domain?: string | null;
  last_monitoring_sync?: string | null;
  monitoring_alert_threshold?: number | null;

  // CTPP Oversight (from Migration 017 - DORA Articles 33-44)
  is_ctpp?: boolean;
  ctpp_designation_date?: string | null;
  ctpp_designation_source?: CTTPDesignationSource | null;
  ctpp_designating_authority?: CTTPDesignatingAuthority | null;
  ctpp_designation_reason?: string | null;
  lead_overseer?: CTTPDesignatingAuthority | null;
  lead_overseer_assigned_date?: string | null;
  lead_overseer_contact_email?: string | null;
  joint_examination_team?: boolean;
  oversight_plan_status?: OversightPlanStatus;
  last_oversight_assessment_date?: string | null;
  next_oversight_assessment_date?: string | null;
  oversight_findings_count?: number;
  oversight_recommendations_pending?: number;
  info_sharing_portal_access?: boolean;
  info_sharing_portal_url?: string | null;
  last_info_exchange_date?: string | null;
  ctpp_exit_strategy_documented?: boolean;
  ctpp_exit_strategy_last_review?: string | null;
  ctpp_substitutability_assessment?: CTTPSubstitutability | null;

  // Contact
  primary_contact: VendorContact;

  // Metadata
  notes?: string | null;
  metadata: Record<string, unknown>;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// ============================================
// RELATED ENTITIES
// ============================================

export interface VendorContactRecord {
  id: string;
  vendor_id: string;
  contact_type: ContactType;
  name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at: string;
}

// ============================================
// AGGREGATED TYPES
// ============================================

export interface VendorWithRelations extends Vendor {
  contacts?: VendorContactRecord[];
  contracts?: Contract[];
  documents_count?: number;
  contracts_count?: number;
  services_count?: number;
  has_parsed_soc2?: boolean;
}

export interface VendorStats {
  total: number;
  by_tier: {
    critical: number;
    important: number;
    standard: number;
  };
  by_status: {
    active: number;
    pending: number;
    inactive: number;
    offboarding: number;
  };
  by_risk: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  pending_reviews: number;
  roi_ready_percentage: number;
  avg_risk_score: number | null;
}

// ============================================
// FILTER & PAGINATION
// ============================================

export interface VendorFilters {
  search?: string;
  tier?: VendorTier[];
  status?: VendorStatus[];
  provider_type?: ProviderType[];
  risk_min?: number;
  risk_max?: number;
  has_lei?: boolean;
  supports_critical_function?: boolean;
  /** Filter by framework - shows only vendors with gap analysis for this framework */
  framework?: 'dora' | 'nis2' | 'gdpr' | 'iso27001';
}

export interface VendorSortOptions {
  field: 'name' | 'created_at' | 'risk_score' | 'tier' | 'status';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// INPUT TYPES (for forms)
// ============================================

export interface CreateVendorInput {
  name: string;
  lei?: string;
  tier: VendorTier;
  provider_type?: ProviderType;
  headquarters_country?: string;
  service_types?: string[];
  supports_critical_function?: boolean;
  critical_functions?: string[];
  is_intra_group?: boolean;
  primary_contact?: VendorContact;
  notes?: string;
}

export interface UpdateVendorInput {
  name?: string;
  lei?: string;
  tier?: VendorTier;
  status?: VendorStatus;
  provider_type?: ProviderType;
  headquarters_country?: string;
  jurisdiction?: string;
  service_types?: string[];
  supports_critical_function?: boolean;
  critical_functions?: string[];
  is_intra_group?: boolean;
  primary_contact?: VendorContact;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// GLEIF API TYPES
// ============================================

export type LEIRegistrationStatus = 'ISSUED' | 'LAPSED' | 'RETIRED' | 'ANNULLED' | 'PENDING_VALIDATION' | 'PENDING_TRANSFER' | 'PENDING_ARCHIVAL';
export type EntityStatus = 'ACTIVE' | 'INACTIVE';

export interface GLEIFAddress {
  country: string;
  city?: string;
  region?: string;
  postalCode?: string;
  addressLines?: string[];
}

export interface GLEIFEntity {
  lei: string;
  legalName: string;
  otherNames?: string[];
  legalAddress: GLEIFAddress;
  headquartersAddress?: GLEIFAddress;
  registrationStatus: LEIRegistrationStatus;
  entityCategory?: string;
  legalForm?: string;
}

/**
 * Extended GLEIF entity with all available fields for ESA compliance
 */
export interface GLEIFFullEntity extends GLEIFEntity {
  // Registration data from GLEIF
  registeredAs?: string;          // Business registration number
  registeredAt?: string;          // Registration authority ID
  jurisdiction?: string;          // ISO country/region code
  entityStatus?: EntityStatus;    // ACTIVE or INACTIVE
  nextRenewalDate?: string;       // LEI renewal date (ISO format)
  entityCreationDate?: string;    // When entity was formed
  legalFormCode?: string;         // ISO legal form code
  corroborationLevel?: string;    // Validation level
  lastUpdateDate?: string;        // Last GLEIF update
  initialRegistrationDate?: string; // First LEI registration
}

/**
 * Parent entity information from GLEIF Level 2 data
 */
export interface GLEIFParentEntity {
  lei: string;
  legalName: string;
  country: string;
  relationshipType: 'IS_DIRECTLY_CONSOLIDATED_BY' | 'IS_ULTIMATELY_CONSOLIDATED_BY';
}

/**
 * Fully enriched entity with parent relationships
 * This is the comprehensive data structure for ESA RoI compliance
 */
export interface GLEIFEnrichedEntity extends GLEIFFullEntity {
  directParent?: GLEIFParentEntity | null;
  ultimateParent?: GLEIFParentEntity | null;
  parentException?: string;  // Reason if no parent reported
}

export interface GLEIFSearchResult {
  total: number;
  results: GLEIFEntity[];
}

/**
 * Substitutability assessment per DORA Article 28
 */
export type SubstitutabilityAssessment =
  | 'easily_substitutable'
  | 'substitutable_with_difficulty'
  | 'not_substitutable'
  | 'not_assessed';

// ============================================
// UI HELPER TYPES
// ============================================

export type ViewMode = 'cards' | 'table';

export interface VendorFormStep {
  id: number;
  title: string;
  description: string;
}

// Risk level thresholds
export const RISK_THRESHOLDS = {
  low: { min: 0, max: 30 },
  medium: { min: 31, max: 60 },
  high: { min: 61, max: 80 },
  critical: { min: 81, max: 100 },
} as const;

export type RiskLevel = keyof typeof RISK_THRESHOLDS;

export function getRiskLevel(score: number | null | undefined): RiskLevel | null {
  if (score === null || score === undefined) return null;
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'critical';
}

// Service type labels for UI
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  cloud_computing: 'Cloud Computing',
  software_as_service: 'Software as a Service (SaaS)',
  platform_as_service: 'Platform as a Service (PaaS)',
  infrastructure_as_service: 'Infrastructure as a Service (IaaS)',
  data_analytics: 'Data Analytics',
  data_management: 'Data Management',
  network_services: 'Network Services',
  security_services: 'Security Services',
  payment_services: 'Payment Services',
  hardware: 'Hardware',
  other: 'Other',
};

// Provider type labels for UI
export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  ict_service_provider: 'ICT Service Provider',
  cloud_service_provider: 'Cloud Service Provider',
  data_centre: 'Data Centre',
  network_provider: 'Network Provider',
  other: 'Other',
};

// Tier labels and descriptions
export const TIER_INFO: Record<VendorTier, { label: string; description: string; color: string }> = {
  critical: {
    label: 'Critical',
    description: 'Supports critical or important functions, no substitutability',
    color: 'bg-error text-white',
  },
  important: {
    label: 'Important',
    description: 'Significant operational dependency, limited substitutability',
    color: 'bg-warning text-white',
  },
  standard: {
    label: 'Standard',
    description: 'Regular vendor, easily substitutable',
    color: 'bg-muted text-muted-foreground',
  },
};

// Status labels and colors
export const STATUS_INFO: Record<VendorStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-success/10 text-success' },
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning' },
  inactive: { label: 'Inactive', color: 'bg-muted text-muted-foreground' },
  offboarding: { label: 'Offboarding', color: 'bg-error/10 text-error' },
};

// ============================================
// CTPP UI HELPER CONSTANTS
// ============================================

export const CTPP_DESIGNATION_SOURCE_LABELS: Record<CTTPDesignationSource, string> = {
  esa_list: 'ESA Published List',
  self_identified: 'Self-Identified',
  authority_notification: 'Authority Notification',
};

export const CTPP_AUTHORITY_LABELS: Record<CTTPDesignatingAuthority, string> = {
  EBA: 'European Banking Authority (EBA)',
  ESMA: 'European Securities and Markets Authority (ESMA)',
  EIOPA: 'European Insurance and Occupational Pensions Authority (EIOPA)',
};

export const OVERSIGHT_PLAN_STATUS_INFO: Record<OversightPlanStatus, { label: string; color: string }> = {
  not_applicable: { label: 'Not Applicable', color: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning' },
  in_progress: { label: 'In Progress', color: 'bg-info/10 text-info' },
  completed: { label: 'Completed', color: 'bg-success/10 text-success' },
};

export const CTPP_SUBSTITUTABILITY_INFO: Record<CTTPSubstitutability, { label: string; color: string; description: string }> = {
  easily_substitutable: {
    label: 'Easily Substitutable',
    color: 'bg-success/10 text-success',
    description: 'Multiple alternative providers available',
  },
  moderately_difficult: {
    label: 'Moderately Difficult',
    color: 'bg-warning/10 text-warning',
    description: 'Limited alternatives, manageable transition',
  },
  highly_concentrated: {
    label: 'Highly Concentrated',
    color: 'bg-error/10 text-error',
    description: 'Few alternatives, significant market concentration',
  },
  no_alternatives: {
    label: 'No Alternatives',
    color: 'bg-destructive/10 text-destructive',
    description: 'No viable alternatives in the market',
  },
};
