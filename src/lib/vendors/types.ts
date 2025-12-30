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

  // Risk
  risk_score?: number | null;
  last_assessment_date?: string | null;

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

export interface VendorEntity {
  id: string;
  vendor_id: string;
  entity_name: string;
  entity_lei?: string | null;
  country_code: string;
  entity_type?: 'headquarters' | 'subsidiary' | 'branch' | 'data_center' | null;
  address: Record<string, unknown>;
  created_at: string;
}

// ============================================
// AGGREGATED TYPES
// ============================================

export interface VendorWithRelations extends Vendor {
  contacts?: VendorContactRecord[];
  entities?: VendorEntity[];
  contracts?: Contract[];
  documents_count?: number;
  contracts_count?: number;
  services_count?: number;
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

export interface GLEIFEntity {
  lei: string;
  legalName: string;
  otherNames?: string[];
  legalAddress: {
    country: string;
    city?: string;
    postalCode?: string;
    addressLines?: string[];
  };
  headquartersAddress?: {
    country: string;
    city?: string;
  };
  registrationStatus: 'ISSUED' | 'LAPSED' | 'RETIRED' | 'ANNULLED' | 'PENDING_VALIDATION';
  entityCategory?: string;
  legalForm?: string;
}

export interface GLEIFSearchResult {
  total: number;
  results: GLEIFEntity[];
}

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
