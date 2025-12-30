/**
 * Contract Management Types
 *
 * Comprehensive types for ICT contracts aligned with DORA Article 30
 * and RoI templates B_03.01, B_03.02, B_03.03
 */

// ============================================================================
// Enums
// ============================================================================

export type ContractType =
  | 'master_agreement'
  | 'service_agreement'
  | 'sla'
  | 'nda'
  | 'dpa'
  | 'amendment'
  | 'statement_of_work'
  | 'other';

export type ContractStatus =
  | 'draft'
  | 'active'
  | 'expiring'
  | 'expired'
  | 'terminated';

// ============================================================================
// DORA Article 30 Provisions
// ============================================================================

/**
 * DORA Article 30 mandatory provisions for ICT service contracts
 *
 * Article 30.2: Basic requirements for ALL ICT contracts
 * Article 30.3: Additional requirements for critical/important functions
 */

export type DoraProvisionStatus = 'present' | 'partial' | 'missing' | 'not_applicable';

export interface DoraProvision {
  status: DoraProvisionStatus;
  location?: string; // e.g., "Section 5.2, page 12"
  notes?: string;
  last_reviewed?: string;
}

/**
 * Article 30.2 - Basic provisions required for ALL ICT contracts
 */
export interface DoraArticle30_2Provisions {
  // 30.2(a) - Clear description of ICT services
  service_description: DoraProvision;

  // 30.2(b) - Data processing locations (storage, processing, management)
  data_locations: DoraProvision;

  // 30.2(c) - Data protection and confidentiality
  data_protection: DoraProvision;

  // 30.2(d) - Service availability guarantees
  availability_guarantees: DoraProvision;

  // 30.2(e) - Incident support and escalation
  incident_support: DoraProvision;

  // 30.2(f) - Provider cooperation with competent authorities
  authority_cooperation: DoraProvision;

  // 30.2(g) - Termination rights
  termination_rights: DoraProvision;

  // 30.2(h) - Conditions for subcontracting
  subcontracting_conditions: DoraProvision;
}

/**
 * Article 30.3 - Additional provisions for critical/important functions
 */
export interface DoraArticle30_3Provisions {
  // 30.3(a) - Complete service level descriptions with precise targets
  sla_targets: DoraProvision;

  // 30.3(b) - Notice periods and reporting obligations
  notice_periods: DoraProvision;

  // 30.3(c) - Business continuity plans
  business_continuity: DoraProvision;

  // 30.3(d) - ICT security requirements
  ict_security: DoraProvision;

  // 30.3(e) - Participation in TLPT (Threat-Led Penetration Testing)
  tlpt_participation: DoraProvision;

  // 30.3(f) - Unrestricted access and audit rights
  audit_rights: DoraProvision;

  // 30.3(g) - Exit strategies and transition plans
  exit_strategy: DoraProvision;

  // 30.3(h) - Full access to provider performance data
  performance_access: DoraProvision;
}

export interface DoraProvisions {
  article_30_2: DoraArticle30_2Provisions;
  article_30_3?: DoraArticle30_3Provisions; // Only for critical/important functions
  overall_compliance_score?: number; // 0-100
  last_assessment_date?: string;
  next_review_date?: string;
  // AI Analysis tracking - populated when applying signed-off AI analysis
  ai_analysis_id?: string; // Reference to parsed_contracts.id
  ai_reviewed_by?: string; // Name of person who signed off
  ai_reviewed_at?: string; // When sign-off occurred
}

// Default DORA provisions structure
export const DEFAULT_DORA_PROVISIONS: DoraProvisions = {
  article_30_2: {
    service_description: { status: 'missing' },
    data_locations: { status: 'missing' },
    data_protection: { status: 'missing' },
    availability_guarantees: { status: 'missing' },
    incident_support: { status: 'missing' },
    authority_cooperation: { status: 'missing' },
    termination_rights: { status: 'missing' },
    subcontracting_conditions: { status: 'missing' },
  },
};

// ============================================================================
// Contract Types
// ============================================================================

export interface Contract {
  id: string;
  organization_id: string;
  vendor_id: string;
  contract_ref: string;
  contract_type: ContractType;

  // Dates
  signature_date: string | null;
  effective_date: string;
  expiry_date: string | null;

  // Renewal
  auto_renewal: boolean;
  termination_notice_days: number | null;
  last_renewal_date: string | null;

  // DORA compliance
  dora_provisions: DoraProvisions;

  // Financial
  annual_value: number | null;
  total_value: number | null;
  currency: string;

  // Links
  document_ids: string[];

  // Status
  status: ContractStatus;
  notes: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ContractWithVendor extends Contract {
  vendor: {
    id: string;
    name: string;
    lei: string | null;
    tier: string;
  };
  documents_count?: number;
  services_count?: number;
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateContractInput {
  vendor_id: string;
  contract_ref: string;
  contract_type: ContractType;
  signature_date?: string | null;
  effective_date: string;
  expiry_date?: string | null;
  auto_renewal?: boolean;
  termination_notice_days?: number | null;
  annual_value?: number | null;
  total_value?: number | null;
  currency?: string;
  notes?: string | null;
}

export interface UpdateContractInput {
  contract_ref?: string;
  contract_type?: ContractType;
  signature_date?: string | null;
  effective_date?: string;
  expiry_date?: string | null;
  auto_renewal?: boolean;
  termination_notice_days?: number | null;
  last_renewal_date?: string | null;
  annual_value?: number | null;
  total_value?: number | null;
  currency?: string;
  status?: ContractStatus;
  notes?: string | null;
  dora_provisions?: DoraProvisions;
}

// ============================================================================
// UI Metadata
// ============================================================================

export const CONTRACT_TYPE_INFO: Record<
  ContractType,
  { label: string; description: string }
> = {
  master_agreement: {
    label: 'Master Agreement',
    description: 'Framework agreement governing all vendor services',
  },
  service_agreement: {
    label: 'Service Agreement',
    description: 'Specific service delivery contract',
  },
  sla: {
    label: 'Service Level Agreement',
    description: 'Performance metrics and guarantees',
  },
  nda: {
    label: 'Non-Disclosure Agreement',
    description: 'Confidentiality and data protection terms',
  },
  dpa: {
    label: 'Data Processing Agreement',
    description: 'GDPR data processing terms',
  },
  amendment: {
    label: 'Amendment',
    description: 'Modification to existing agreement',
  },
  statement_of_work: {
    label: 'Statement of Work',
    description: 'Specific project or deliverable scope',
  },
  other: {
    label: 'Other',
    description: 'Other contractual document',
  },
};

export const CONTRACT_STATUS_INFO: Record<
  ContractStatus,
  { label: string; color: string; description: string }
> = {
  draft: {
    label: 'Draft',
    color: 'bg-muted text-muted-foreground',
    description: 'Contract being prepared',
  },
  active: {
    label: 'Active',
    color: 'bg-success/10 text-success',
    description: 'Contract in effect',
  },
  expiring: {
    label: 'Expiring Soon',
    color: 'bg-warning/10 text-warning',
    description: 'Contract expires within 90 days',
  },
  expired: {
    label: 'Expired',
    color: 'bg-error/10 text-error',
    description: 'Contract has expired',
  },
  terminated: {
    label: 'Terminated',
    color: 'bg-muted text-muted-foreground',
    description: 'Contract terminated early',
  },
};

export const DORA_PROVISION_LABELS: Record<string, { label: string; article: string; description: string }> = {
  // Article 30.2 provisions
  service_description: {
    label: 'Service Description',
    article: '30.2(a)',
    description: 'Clear and complete description of ICT services to be provided',
  },
  data_locations: {
    label: 'Data Locations',
    article: '30.2(b)',
    description: 'Locations where data will be processed and stored',
  },
  data_protection: {
    label: 'Data Protection',
    article: '30.2(c)',
    description: 'Provisions on data protection and confidentiality',
  },
  availability_guarantees: {
    label: 'Availability Guarantees',
    article: '30.2(d)',
    description: 'Service availability guarantees and targets',
  },
  incident_support: {
    label: 'Incident Support',
    article: '30.2(e)',
    description: 'Provisions on assistance in case of ICT incidents',
  },
  authority_cooperation: {
    label: 'Authority Cooperation',
    article: '30.2(f)',
    description: 'Provider cooperation with competent authorities',
  },
  termination_rights: {
    label: 'Termination Rights',
    article: '30.2(g)',
    description: 'Termination rights and notice periods',
  },
  subcontracting_conditions: {
    label: 'Subcontracting',
    article: '30.2(h)',
    description: 'Conditions for ICT subcontracting',
  },
  // Article 30.3 provisions (critical functions)
  sla_targets: {
    label: 'SLA Targets',
    article: '30.3(a)',
    description: 'Quantitative and qualitative performance targets',
  },
  notice_periods: {
    label: 'Notice Periods',
    article: '30.3(b)',
    description: 'Notice periods and reporting obligations',
  },
  business_continuity: {
    label: 'Business Continuity',
    article: '30.3(c)',
    description: 'Business continuity plans and testing',
  },
  ict_security: {
    label: 'ICT Security',
    article: '30.3(d)',
    description: 'ICT security measures and requirements',
  },
  tlpt_participation: {
    label: 'TLPT Participation',
    article: '30.3(e)',
    description: 'Participation in threat-led penetration testing',
  },
  audit_rights: {
    label: 'Audit Rights',
    article: '30.3(f)',
    description: 'Unrestricted access and audit rights',
  },
  exit_strategy: {
    label: 'Exit Strategy',
    article: '30.3(g)',
    description: 'Exit strategies and transition plans',
  },
  performance_access: {
    label: 'Performance Data',
    article: '30.3(h)',
    description: 'Access to provider performance data',
  },
};

export const CONTRACT_TYPES = Object.keys(CONTRACT_TYPE_INFO) as ContractType[];
export const CONTRACT_STATUSES = Object.keys(CONTRACT_STATUS_INFO) as ContractStatus[];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate DORA compliance score for a contract
 */
export function calculateDoraComplianceScore(
  provisions: DoraProvisions,
  isCriticalFunction: boolean
): number {
  const weights = {
    present: 100,
    partial: 50,
    missing: 0,
    not_applicable: 100, // N/A provisions don't count against score
  };

  // Article 30.2 provisions (always required)
  const article30_2 = provisions.article_30_2;
  const basicProvisions = [
    article30_2.service_description,
    article30_2.data_locations,
    article30_2.data_protection,
    article30_2.availability_guarantees,
    article30_2.incident_support,
    article30_2.authority_cooperation,
    article30_2.termination_rights,
    article30_2.subcontracting_conditions,
  ];

  let totalScore = 0;
  let totalWeight = 0;

  basicProvisions.forEach((p) => {
    totalScore += weights[p.status];
    totalWeight += 100;
  });

  // Article 30.3 provisions (only for critical functions)
  if (isCriticalFunction && provisions.article_30_3) {
    const criticalProvisions = [
      provisions.article_30_3.sla_targets,
      provisions.article_30_3.notice_periods,
      provisions.article_30_3.business_continuity,
      provisions.article_30_3.ict_security,
      provisions.article_30_3.tlpt_participation,
      provisions.article_30_3.audit_rights,
      provisions.article_30_3.exit_strategy,
      provisions.article_30_3.performance_access,
    ];

    criticalProvisions.forEach((p) => {
      totalScore += weights[p.status];
      totalWeight += 100;
    });
  }

  return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
}

/**
 * Determine contract status based on expiry date
 */
export function getContractStatusFromDates(
  expiryDate: string | null,
  currentStatus: ContractStatus
): ContractStatus {
  if (currentStatus === 'terminated' || currentStatus === 'draft') {
    return currentStatus;
  }

  if (!expiryDate) {
    return 'active';
  }

  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return 'expired';
  }

  if (daysUntilExpiry <= 90) {
    return 'expiring';
  }

  return 'active';
}
