/**
 * GDPR Compliance Module Types
 *
 * Types for GDPR compliance tracking including:
 * - Record of Processing Activities (RoPA)
 * - Data Protection Impact Assessments (DPIA)
 * - Data Subject Requests (DSR)
 * - Personal Data Breaches
 */

// ============================================
// Enums
// ============================================

export type LawfulBasis =
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'vital_interests'
  | 'public_task'
  | 'legitimate_interests';

export type SpecialCategoryBasis =
  | 'explicit_consent'
  | 'employment_law'
  | 'vital_interests'
  | 'legitimate_activities'
  | 'public_data'
  | 'legal_claims'
  | 'substantial_public_interest'
  | 'health_purposes'
  | 'public_health'
  | 'archiving_research';

export type ActivityStatus = 'active' | 'under_review' | 'suspended' | 'terminated';

export type DPIAStatus =
  | 'draft'
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'requires_consultation';

export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';

export type DSRType =
  | 'access'
  | 'rectification'
  | 'erasure'
  | 'restriction'
  | 'portability'
  | 'objection'
  | 'automated_decision';

export type DSRStatus =
  | 'received'
  | 'identity_verification'
  | 'in_progress'
  | 'extended'
  | 'completed'
  | 'refused';

export type BreachSeverity = 'low' | 'medium' | 'high' | 'critical';

export type BreachStatus =
  | 'detected'
  | 'investigating'
  | 'contained'
  | 'notified_authority'
  | 'notified_subjects'
  | 'resolved'
  | 'closed';

// ============================================
// Processing Activities (RoPA)
// ============================================

export interface ProcessingActivity {
  id: string;
  organization_id: string;

  // Basic Information
  name: string;
  description: string | null;
  reference_code: string | null;

  // Controller/Processor
  is_controller: boolean;
  joint_controller_details: string | null;
  processor_details: string | null;

  // Processing Details
  purposes: string[];
  lawful_basis: LawfulBasis;
  lawful_basis_details: string | null;

  // Special Category Data
  involves_special_category: boolean;
  special_category_types: string[] | null;
  special_category_basis: SpecialCategoryBasis | null;
  special_category_basis_details: string | null;

  // Data Subjects
  data_subject_categories: string[];
  estimated_data_subjects: number | null;

  // Data Categories
  personal_data_categories: string[];

  // Recipients
  recipient_categories: string[];

  // International Transfers
  involves_international_transfer: boolean;
  transfer_countries: string[];
  transfer_safeguards: string | null;

  // Retention
  retention_period: string | null;
  retention_criteria: string | null;

  // Security
  security_measures: string[];

  // Systems/Vendors
  systems_used: string[];
  vendor_id: string | null;

  // Status
  status: ActivityStatus;

  // Ownership
  data_owner: string | null;
  department: string | null;

  // DPIA Link
  requires_dpia: boolean;
  dpia_id: string | null;

  // Metadata
  last_reviewed_at: string | null;
  last_reviewed_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// DPIA Types
// ============================================

export interface DPIA {
  id: string;
  organization_id: string;

  // Basic Information
  title: string;
  reference_code: string | null;
  description: string | null;

  // Linked Processing Activity
  processing_activity_id: string | null;

  // Project Details
  project_name: string | null;
  project_description: string | null;

  // Assessment Trigger
  trigger_reason: string | null;

  // Processing Description
  processing_description: string | null;
  processing_purposes: string[];
  data_categories: string[];
  data_subject_categories: string[];
  data_volume_estimate: string | null;

  // Necessity & Proportionality
  necessity_assessment: string | null;
  proportionality_assessment: string | null;

  // Risks Assessment
  risks_to_rights_freedoms: string | null;
  overall_risk_level: RiskLevel | null;
  residual_risk_level: RiskLevel | null;

  // Consultation
  dpo_consulted: boolean;
  dpo_consultation_date: string | null;
  dpo_opinion: string | null;
  authority_consultation_required: boolean;
  authority_consultation_date: string | null;
  authority_response: string | null;

  // Approval
  status: DPIAStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;

  // Review Schedule
  next_review_date: string | null;
  review_frequency_months: number;

  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DPIARisk {
  id: string;
  dpia_id: string;

  title: string;
  description: string | null;
  risk_category: string | null;

  likelihood: RiskLevel;
  impact: RiskLevel;
  inherent_risk_level: RiskLevel;

  residual_likelihood: RiskLevel | null;
  residual_impact: RiskLevel | null;
  residual_risk_level: RiskLevel | null;

  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DPIAMitigation {
  id: string;
  dpia_id: string;
  risk_id: string | null;

  title: string;
  description: string | null;
  mitigation_type: string | null;

  status: 'planned' | 'in_progress' | 'implemented';
  responsible_party: string | null;
  implementation_date: string | null;

  effectiveness_notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface DPIAWithDetails extends DPIA {
  risks: DPIARisk[];
  mitigations: DPIAMitigation[];
  processing_activity?: ProcessingActivity | null;
  approved_by_user?: { full_name: string } | null;
  created_by_user?: { full_name: string } | null;
}

// ============================================
// Data Subject Request (DSR) Types
// ============================================

export interface DataSubjectRequest {
  id: string;
  organization_id: string;

  reference_number: string;
  request_type: DSRType;

  // Data Subject
  data_subject_name: string | null;
  data_subject_email: string | null;
  data_subject_phone: string | null;
  identity_verified: boolean;
  identity_verification_method: string | null;
  identity_verified_at: string | null;

  // Request Details
  request_details: string | null;
  received_via: string | null;
  received_at: string;

  // Processing
  status: DSRStatus;
  assigned_to: string | null;

  // Timeline
  response_due_date: string;
  extension_applied: boolean;
  extension_reason: string | null;
  extended_due_date: string | null;

  // Response
  response_date: string | null;
  response_method: string | null;
  response_summary: string | null;

  // Refusal
  refusal_reason: string | null;
  refusal_legal_basis: string | null;

  // Links
  vendor_id: string | null;

  // Notes
  internal_notes: string | null;

  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DSRWithDetails extends DataSubjectRequest {
  assigned_to_user?: { full_name: string } | null;
  vendor?: { id: string; name: string } | null;
}

// ============================================
// Breach Types
// ============================================

export interface DataBreach {
  id: string;
  organization_id: string;

  reference_number: string;
  title: string;

  // Detection
  detected_at: string;
  detected_by: string | null;
  detection_method: string | null;

  // Details
  description: string;
  breach_type: string[];

  // Affected Data
  data_categories_affected: string[];
  special_category_affected: boolean;
  estimated_records_affected: number | null;
  data_subjects_affected: string[];

  // Systems/Vendors
  systems_affected: string[];
  vendor_id: string | null;

  // Impact Assessment
  severity: BreachSeverity;
  likelihood_of_risk: RiskLevel | null;
  impact_assessment: string | null;

  // Notification Decisions
  notify_authority: boolean | null;
  authority_notification_reason: string | null;
  notify_data_subjects: boolean | null;
  data_subject_notification_reason: string | null;

  // Authority Notification
  authority_notified_at: string | null;
  authority_reference: string | null;
  authority_response: string | null;

  // Data Subject Notification
  data_subjects_notified_at: string | null;
  notification_method: string | null;
  notification_content: string | null;

  // Containment & Remediation
  status: BreachStatus;
  containment_actions: string | null;
  containment_date: string | null;
  remediation_actions: string | null;
  remediation_date: string | null;

  // Root Cause
  root_cause: string | null;
  preventive_measures: string | null;

  // Links
  incident_id: string | null;

  // Closure
  closed_at: string | null;
  closed_by: string | null;
  lessons_learned: string | null;

  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BreachWithDetails extends DataBreach {
  vendor?: { id: string; name: string } | null;
  closed_by_user?: { full_name: string } | null;
}

// ============================================
// Stats Types
// ============================================

export interface GDPRStats {
  processing_activities: {
    total: number;
    active: number;
    requiring_dpia: number;
    with_international_transfer: number;
    with_special_category: number;
  };
  dpias: {
    total: number;
    draft: number;
    in_progress: number;
    approved: number;
    high_risk: number;
  };
  dsr: {
    total: number;
    open: number;
    overdue: number;
    completed_this_month: number;
    by_type: Record<DSRType, number>;
  };
  breaches: {
    total: number;
    open: number;
    this_year: number;
    requiring_notification: number;
  };
}

// ============================================
// Input Types
// ============================================

export interface CreateProcessingActivityInput {
  name: string;
  description?: string;
  purposes: string[];
  lawful_basis: LawfulBasis;
  lawful_basis_details?: string;
  data_subject_categories: string[];
  personal_data_categories: string[];
  involves_special_category?: boolean;
  special_category_types?: string[];
  special_category_basis?: SpecialCategoryBasis;
  recipient_categories?: string[];
  involves_international_transfer?: boolean;
  transfer_countries?: string[];
  transfer_safeguards?: string;
  retention_period?: string;
  security_measures?: string[];
  systems_used?: string[];
  vendor_id?: string;
  data_owner?: string;
  department?: string;
  requires_dpia?: boolean;
}

export interface CreateDPIAInput {
  title: string;
  description?: string;
  processing_activity_id?: string;
  project_name?: string;
  project_description?: string;
  trigger_reason?: string;
}

export interface CreateDSRInput {
  request_type: DSRType;
  data_subject_name?: string;
  data_subject_email?: string;
  data_subject_phone?: string;
  request_details?: string;
  received_via?: string;
  received_at?: string;
}

export interface CreateBreachInput {
  title: string;
  description: string;
  detected_at: string;
  detected_by?: string;
  breach_type: string[];
  severity: BreachSeverity;
  data_categories_affected?: string[];
  estimated_records_affected?: number;
  data_subjects_affected?: string[];
  systems_affected?: string[];
  vendor_id?: string;
}

// ============================================
// Display Labels
// ============================================

export const LAWFUL_BASIS_LABELS: Record<LawfulBasis, string> = {
  consent: 'Consent (Art. 6(1)(a))',
  contract: 'Contract Performance (Art. 6(1)(b))',
  legal_obligation: 'Legal Obligation (Art. 6(1)(c))',
  vital_interests: 'Vital Interests (Art. 6(1)(d))',
  public_task: 'Public Task (Art. 6(1)(e))',
  legitimate_interests: 'Legitimate Interests (Art. 6(1)(f))',
};

export const SPECIAL_CATEGORY_BASIS_LABELS: Record<SpecialCategoryBasis, string> = {
  explicit_consent: 'Explicit Consent (Art. 9(2)(a))',
  employment_law: 'Employment Law (Art. 9(2)(b))',
  vital_interests: 'Vital Interests (Art. 9(2)(c))',
  legitimate_activities: 'Legitimate Activities (Art. 9(2)(d))',
  public_data: 'Manifestly Public Data (Art. 9(2)(e))',
  legal_claims: 'Legal Claims (Art. 9(2)(f))',
  substantial_public_interest: 'Substantial Public Interest (Art. 9(2)(g))',
  health_purposes: 'Health Purposes (Art. 9(2)(h))',
  public_health: 'Public Health (Art. 9(2)(i))',
  archiving_research: 'Archiving/Research (Art. 9(2)(j))',
};

export const DSR_TYPE_LABELS: Record<DSRType, string> = {
  access: 'Right of Access (Art. 15)',
  rectification: 'Right to Rectification (Art. 16)',
  erasure: 'Right to Erasure (Art. 17)',
  restriction: 'Right to Restriction (Art. 18)',
  portability: 'Right to Portability (Art. 20)',
  objection: 'Right to Object (Art. 21)',
  automated_decision: 'Automated Decision Rights (Art. 22)',
};

export const DSR_STATUS_LABELS: Record<DSRStatus, string> = {
  received: 'Received',
  identity_verification: 'Identity Verification',
  in_progress: 'In Progress',
  extended: 'Extended',
  completed: 'Completed',
  refused: 'Refused',
};

export const BREACH_STATUS_LABELS: Record<BreachStatus, string> = {
  detected: 'Detected',
  investigating: 'Investigating',
  contained: 'Contained',
  notified_authority: 'Authority Notified',
  notified_subjects: 'Subjects Notified',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const DPIA_STATUS_LABELS: Record<DPIAStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  requires_consultation: 'Requires DPA Consultation',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very High',
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  active: 'Active',
  under_review: 'Under Review',
  suspended: 'Suspended',
  terminated: 'Terminated',
};

export const BREACH_SEVERITY_LABELS: Record<BreachSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

// Common data categories
export const COMMON_DATA_CATEGORIES = [
  'Name',
  'Email address',
  'Phone number',
  'Postal address',
  'Date of birth',
  'National ID number',
  'Financial data',
  'Employment data',
  'Location data',
  'IP address',
  'Device identifiers',
  'Cookies/tracking data',
  'Photos/images',
  'Health data',
  'Biometric data',
  'Genetic data',
  'Political opinions',
  'Religious beliefs',
  'Trade union membership',
  'Sexual orientation',
];

// Common data subject categories
export const COMMON_DATA_SUBJECT_CATEGORIES = [
  'Employees',
  'Job applicants',
  'Contractors',
  'Customers',
  'Prospects',
  'Website visitors',
  'Newsletter subscribers',
  'Suppliers',
  'Business partners',
  'Minors',
];

// Common breach types
export const COMMON_BREACH_TYPES = [
  'Unauthorized access',
  'Data theft',
  'Accidental disclosure',
  'Lost device',
  'Phishing attack',
  'Malware/ransomware',
  'System misconfiguration',
  'Human error',
  'Insider threat',
  'Third-party breach',
];
