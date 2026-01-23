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
  provisions: DoraProvisions | null | undefined | Record<string, unknown>,
  isCriticalFunction: boolean
): number {
  // Handle empty or missing provisions - return 0% compliance
  if (!provisions || !('article_30_2' in provisions) || !provisions.article_30_2) {
    return 0;
  }

  const weights = {
    present: 100,
    partial: 50,
    missing: 0,
    not_applicable: 100, // N/A provisions don't count against score
  };

  // Article 30.2 provisions (always required)
  const article30_2 = provisions.article_30_2 as DoraArticle30_2Provisions;

  // Safely get provisions, defaulting to 'missing' status
  const defaultProvision: DoraProvision = { status: 'missing' };
  const basicProvisions = [
    article30_2.service_description || defaultProvision,
    article30_2.data_locations || defaultProvision,
    article30_2.data_protection || defaultProvision,
    article30_2.availability_guarantees || defaultProvision,
    article30_2.incident_support || defaultProvision,
    article30_2.authority_cooperation || defaultProvision,
    article30_2.termination_rights || defaultProvision,
    article30_2.subcontracting_conditions || defaultProvision,
  ];

  let totalScore = 0;
  let totalWeight = 0;

  basicProvisions.forEach((p) => {
    totalScore += weights[p.status] ?? 0;
    totalWeight += 100;
  });

  // Article 30.3 provisions (only for critical functions)
  if (isCriticalFunction && provisions.article_30_3) {
    const article30_3 = provisions.article_30_3 as DoraArticle30_3Provisions;
    const criticalProvisions = [
      article30_3.sla_targets || defaultProvision,
      article30_3.notice_periods || defaultProvision,
      article30_3.business_continuity || defaultProvision,
      article30_3.ict_security || defaultProvision,
      article30_3.tlpt_participation || defaultProvision,
      article30_3.audit_rights || defaultProvision,
      article30_3.exit_strategy || defaultProvision,
      article30_3.performance_access || defaultProvision,
    ];

    criticalProvisions.forEach((p) => {
      totalScore += weights[p.status] ?? 0;
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

// ============================================================================
// CONTRACT LIFECYCLE TYPES
// ============================================================================

// -------------------- Contract Clauses --------------------

export type ClauseType =
  | 'termination'
  | 'liability'
  | 'indemnification'
  | 'confidentiality'
  | 'data_protection'
  | 'audit_rights'
  | 'subcontracting'
  | 'exit_strategy'
  | 'service_levels'
  | 'business_continuity'
  | 'security_requirements'
  | 'incident_notification'
  | 'intellectual_property'
  | 'governing_law'
  | 'dispute_resolution'
  | 'force_majeure'
  | 'insurance'
  | 'other';

export type ClauseRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ClauseReviewStatus = 'pending' | 'reviewed' | 'flagged' | 'approved';

export interface ContractClause {
  id: string;
  organization_id: string;
  contract_id: string;

  // Clause identification
  clause_type: ClauseType;
  title: string;
  summary: string | null;
  full_text: string | null;
  location: string | null;

  // AI extraction metadata
  ai_extracted: boolean;
  ai_confidence: number | null;
  extracted_at: string | null;

  // Risk assessment
  risk_level: ClauseRiskLevel | null;
  risk_notes: string | null;

  // Key dates
  effective_date: string | null;
  expiry_date: string | null;
  notice_period_days: number | null;

  // Financial terms
  liability_cap: number | null;
  liability_cap_currency: string;

  // Compliance flags
  dora_relevant: boolean;
  nis2_relevant: boolean;
  gdpr_relevant: boolean;

  // Review status
  review_status: ClauseReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;

  created_at: string;
  updated_at: string;
}

export const CLAUSE_TYPE_INFO: Record<ClauseType, { label: string; description: string; icon: string }> = {
  termination: {
    label: 'Termination',
    description: 'Contract termination conditions and rights',
    icon: 'ban',
  },
  liability: {
    label: 'Liability',
    description: 'Liability limitations and caps',
    icon: 'scale',
  },
  indemnification: {
    label: 'Indemnification',
    description: 'Indemnification clauses and conditions',
    icon: 'shield',
  },
  confidentiality: {
    label: 'Confidentiality',
    description: 'Confidentiality and non-disclosure obligations',
    icon: 'lock',
  },
  data_protection: {
    label: 'Data Protection',
    description: 'GDPR and data protection provisions',
    icon: 'database',
  },
  audit_rights: {
    label: 'Audit Rights',
    description: 'Rights to audit and inspect provider',
    icon: 'clipboard-check',
  },
  subcontracting: {
    label: 'Subcontracting',
    description: 'Subcontracting permissions and restrictions',
    icon: 'git-branch',
  },
  exit_strategy: {
    label: 'Exit Strategy',
    description: 'Exit and transition planning provisions',
    icon: 'door-open',
  },
  service_levels: {
    label: 'Service Levels',
    description: 'SLA targets and performance metrics',
    icon: 'gauge',
  },
  business_continuity: {
    label: 'Business Continuity',
    description: 'Business continuity and disaster recovery',
    icon: 'refresh-cw',
  },
  security_requirements: {
    label: 'Security Requirements',
    description: 'ICT security and cybersecurity obligations',
    icon: 'shield-check',
  },
  incident_notification: {
    label: 'Incident Notification',
    description: 'Incident reporting and notification procedures',
    icon: 'bell',
  },
  intellectual_property: {
    label: 'Intellectual Property',
    description: 'IP ownership and licensing terms',
    icon: 'lightbulb',
  },
  governing_law: {
    label: 'Governing Law',
    description: 'Applicable law and jurisdiction',
    icon: 'gavel',
  },
  dispute_resolution: {
    label: 'Dispute Resolution',
    description: 'Dispute resolution mechanisms',
    icon: 'messages-square',
  },
  force_majeure: {
    label: 'Force Majeure',
    description: 'Force majeure events and consequences',
    icon: 'cloud-lightning',
  },
  insurance: {
    label: 'Insurance',
    description: 'Insurance requirements and coverage',
    icon: 'umbrella',
  },
  other: {
    label: 'Other',
    description: 'Other contractual clauses',
    icon: 'file-text',
  },
};

export const CLAUSE_RISK_INFO: Record<ClauseRiskLevel, { label: string; color: string }> = {
  low: { label: 'Low Risk', color: 'bg-success/10 text-success' },
  medium: { label: 'Medium Risk', color: 'bg-warning/10 text-warning' },
  high: { label: 'High Risk', color: 'bg-orange-500/10 text-orange-500' },
  critical: { label: 'Critical Risk', color: 'bg-error/10 text-error' },
};

// -------------------- Contract Renewals --------------------

export type RenewalType = 'automatic' | 'manual' | 'renegotiated' | 'extended' | 'terminated';
export type RenewalStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface ContractRenewal {
  id: string;
  organization_id: string;
  contract_id: string;

  // Renewal details
  renewal_number: number;
  renewal_type: RenewalType;

  // Dates
  previous_expiry_date: string;
  new_expiry_date: string | null;
  decision_date: string | null;
  notice_sent_date: string | null;

  // Decision tracking
  status: RenewalStatus;
  decision_by: string | null;
  decision_notes: string | null;

  // Changes in terms
  value_change: number | null;
  value_change_percent: number | null;
  terms_changed: boolean;
  terms_change_summary: string | null;

  // New contract reference
  new_contract_id: string | null;

  // Workflow
  assigned_to: string | null;
  due_date: string | null;
  reminder_sent: boolean;

  created_at: string;
  updated_at: string;
}

export const RENEWAL_TYPE_INFO: Record<RenewalType, { label: string; description: string }> = {
  automatic: {
    label: 'Automatic',
    description: 'Contract auto-renews unless terminated',
  },
  manual: {
    label: 'Manual',
    description: 'Requires explicit renewal decision',
  },
  renegotiated: {
    label: 'Renegotiated',
    description: 'Terms renegotiated for renewal',
  },
  extended: {
    label: 'Extended',
    description: 'Contract term extended',
  },
  terminated: {
    label: 'Terminated',
    description: 'Contract not renewed / terminated',
  },
};

export const RENEWAL_STATUS_INFO: Record<RenewalStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
  under_review: { label: 'Under Review', color: 'bg-blue-500/10 text-blue-500' },
  approved: { label: 'Approved', color: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', color: 'bg-error/10 text-error' },
  completed: { label: 'Completed', color: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

// -------------------- Contract Alerts --------------------

export type AlertType =
  | 'expiry_90_days'
  | 'expiry_60_days'
  | 'expiry_30_days'
  | 'expiry_14_days'
  | 'expiry_7_days'
  | 'expired'
  | 'renewal_due'
  | 'review_due'
  | 'clause_expiry'
  | 'compliance_review'
  | 'value_threshold'
  | 'auto_renewal_notice'
  | 'termination_window'
  | 'custom';

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'scheduled' | 'triggered' | 'acknowledged' | 'resolved' | 'dismissed' | 'snoozed';

export interface ContractAlert {
  id: string;
  organization_id: string;
  contract_id: string;

  // Alert type
  alert_type: AlertType;

  // Alert details
  title: string;
  description: string | null;
  priority: AlertPriority;

  // Trigger info
  trigger_date: string;
  triggered_at: string | null;

  // Status
  status: AlertStatus;

  // Assignment
  assigned_to: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;

  // Snooze functionality
  snoozed_until: string | null;
  snooze_count: number;

  // Notifications
  notification_sent: boolean;
  notification_sent_at: string | null;
  email_sent: boolean;

  // Related entities
  renewal_id: string | null;
  clause_id: string | null;

  created_at: string;
  updated_at: string;
}

export const ALERT_TYPE_INFO: Record<AlertType, { label: string; description: string }> = {
  expiry_90_days: { label: '90 Days to Expiry', description: 'Contract expires in 90 days' },
  expiry_60_days: { label: '60 Days to Expiry', description: 'Contract expires in 60 days' },
  expiry_30_days: { label: '30 Days to Expiry', description: 'Contract expires in 30 days' },
  expiry_14_days: { label: '14 Days to Expiry', description: 'Contract expires in 14 days' },
  expiry_7_days: { label: '7 Days to Expiry', description: 'Contract expires in 7 days' },
  expired: { label: 'Expired', description: 'Contract has expired' },
  renewal_due: { label: 'Renewal Due', description: 'Renewal decision required' },
  review_due: { label: 'Review Due', description: 'Periodic contract review due' },
  clause_expiry: { label: 'Clause Expiring', description: 'Specific clause expiring' },
  compliance_review: { label: 'Compliance Review', description: 'DORA/NIS2 compliance review needed' },
  value_threshold: { label: 'Value Threshold', description: 'Contract value threshold exceeded' },
  auto_renewal_notice: { label: 'Auto-Renewal Notice', description: 'Notice deadline for auto-renewal' },
  termination_window: { label: 'Termination Window', description: 'Termination window opening/closing' },
  custom: { label: 'Custom Alert', description: 'User-defined alert' },
};

export const ALERT_PRIORITY_INFO: Record<AlertPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-blue-500/10 text-blue-500' },
  medium: { label: 'Medium', color: 'bg-warning/10 text-warning' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-500' },
  critical: { label: 'Critical', color: 'bg-error/10 text-error' },
};

export const ALERT_STATUS_INFO: Record<AlertStatus, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'bg-muted text-muted-foreground' },
  triggered: { label: 'Triggered', color: 'bg-warning/10 text-warning' },
  acknowledged: { label: 'Acknowledged', color: 'bg-blue-500/10 text-blue-500' },
  resolved: { label: 'Resolved', color: 'bg-success/10 text-success' },
  dismissed: { label: 'Dismissed', color: 'bg-muted text-muted-foreground' },
  snoozed: { label: 'Snoozed', color: 'bg-purple-500/10 text-purple-500' },
};

// -------------------- Contract Versions --------------------

export type VersionType = 'original' | 'amendment' | 'addendum' | 'restatement' | 'renewal';

export interface ContractVersion {
  id: string;
  organization_id: string;
  contract_id: string;

  // Version info
  version_number: number;
  version_type: VersionType;

  // Document reference
  document_id: string | null;

  // Dates
  effective_date: string;
  supersedes_version: number | null;

  // Summary
  change_summary: string | null;

  // Metadata
  created_by: string | null;
  created_at: string;
}

export const VERSION_TYPE_INFO: Record<VersionType, { label: string; description: string }> = {
  original: { label: 'Original', description: 'Original contract version' },
  amendment: { label: 'Amendment', description: 'Formal amendment to contract' },
  addendum: { label: 'Addendum', description: 'Additional terms or schedules' },
  restatement: { label: 'Restatement', description: 'Restated and amended version' },
  renewal: { label: 'Renewal', description: 'Renewed contract terms' },
};

// -------------------- Extended Contract Types --------------------

export type ContractCriticality = 'low' | 'medium' | 'high' | 'critical';
export type ContractCategory =
  | 'ict_services'
  | 'cloud_services'
  | 'software_licenses'
  | 'maintenance'
  | 'consulting'
  | 'data_processing'
  | 'infrastructure'
  | 'security'
  | 'other';

export interface ContractExtended extends Contract {
  // New lifecycle fields
  next_review_date: string | null;
  owner_id: string | null;
  criticality: ContractCriticality | null;
  category: ContractCategory | null;
  ai_analyzed_at: string | null;
  clauses_extracted: boolean;
}

export interface ContractWithLifecycle extends ContractExtended {
  vendor: {
    id: string;
    name: string;
    lei: string | null;
    tier: string;
  };
  clauses_count?: number;
  active_alerts_count?: number;
  pending_renewals_count?: number;
  owner?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export const CONTRACT_CRITICALITY_INFO: Record<ContractCriticality, { label: string; color: string; description: string }> = {
  low: {
    label: 'Low',
    color: 'bg-blue-500/10 text-blue-500',
    description: 'Non-critical support services',
  },
  medium: {
    label: 'Medium',
    color: 'bg-warning/10 text-warning',
    description: 'Important operational services',
  },
  high: {
    label: 'High',
    color: 'bg-orange-500/10 text-orange-500',
    description: 'Critical business functions',
  },
  critical: {
    label: 'Critical',
    color: 'bg-error/10 text-error',
    description: 'Mission-critical / regulated functions',
  },
};

export const CONTRACT_CATEGORY_INFO: Record<ContractCategory, { label: string; description: string }> = {
  ict_services: { label: 'ICT Services', description: 'General ICT service provision' },
  cloud_services: { label: 'Cloud Services', description: 'Cloud infrastructure and platforms' },
  software_licenses: { label: 'Software Licenses', description: 'Software licensing agreements' },
  maintenance: { label: 'Maintenance', description: 'Support and maintenance services' },
  consulting: { label: 'Consulting', description: 'Professional and consulting services' },
  data_processing: { label: 'Data Processing', description: 'Data processing agreements' },
  infrastructure: { label: 'Infrastructure', description: 'Infrastructure and hosting' },
  security: { label: 'Security', description: 'Security and cybersecurity services' },
  other: { label: 'Other', description: 'Other contract types' },
};
