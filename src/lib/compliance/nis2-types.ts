/**
 * NIS2 Compliance Scoring Types
 *
 * Based on EU Directive 2022/2555 (Network and Information Security Directive 2)
 * Implements binary compliance scoring with category breakdown
 */

// =============================================================================
// Compliance Status
// =============================================================================

export type NIS2ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';

export const NIS2StatusLabels: Record<NIS2ComplianceStatus, string> = {
  compliant: 'Compliant',
  partial: 'Partially Compliant',
  non_compliant: 'Non-Compliant',
  not_assessed: 'Not Assessed',
};

export const NIS2StatusColors: Record<NIS2ComplianceStatus, string> = {
  compliant: 'text-emerald-600',
  partial: 'text-amber-500',
  non_compliant: 'text-red-500',
  not_assessed: 'text-muted-foreground',
};

// =============================================================================
// NIS2 Categories (Article 21 breakdown)
// =============================================================================

export type NIS2Category =
  | 'governance'           // Article 20: Governance
  | 'risk_management'      // Article 21(2)(a): Risk Analysis
  | 'incident_handling'    // Article 21(2)(b): Incident Handling
  | 'business_continuity'  // Article 21(2)(c): Business Continuity
  | 'supply_chain'         // Article 21(2)(d): Supply Chain Security
  | 'reporting';           // Article 23: Incident Reporting

export const NIS2CategoryLabels: Record<NIS2Category, string> = {
  governance: 'Governance & Accountability',
  risk_management: 'Risk Management',
  incident_handling: 'Incident Handling',
  business_continuity: 'Business Continuity',
  supply_chain: 'Supply Chain Security',
  reporting: 'Incident Reporting',
};

export const NIS2CategoryDescriptions: Record<NIS2Category, string> = {
  governance: 'Management body accountability, training, and oversight (Article 20)',
  risk_management: 'Risk analysis, security policies, vulnerability management (Article 21)',
  incident_handling: 'Detection, analysis, containment, and recovery procedures',
  business_continuity: 'Backup management, disaster recovery, and crisis management',
  supply_chain: 'Supplier security assessment and contractual requirements',
  reporting: 'Significant incident notification to CSIRT/authorities (Article 23)',
};

export const NIS2CategoryArticles: Record<NIS2Category, string> = {
  governance: 'Article 20',
  risk_management: 'Article 21(2)(a,e,f,g,h,i,j)',
  incident_handling: 'Article 21(2)(b)',
  business_continuity: 'Article 21(2)(c)',
  supply_chain: 'Article 21(2)(d)',
  reporting: 'Article 23',
};

export const NIS2CategoryColors: Record<NIS2Category, string> = {
  governance: 'bg-blue-500',
  risk_management: 'bg-emerald-500',
  incident_handling: 'bg-amber-500',
  business_continuity: 'bg-purple-500',
  supply_chain: 'bg-orange-500',
  reporting: 'bg-red-500',
};

/**
 * Array of all NIS2 categories for iteration
 */
export const NIS2_CATEGORIES: NIS2Category[] = [
  'governance',
  'risk_management',
  'incident_handling',
  'business_continuity',
  'supply_chain',
  'reporting',
];

// =============================================================================
// Entity Types
// =============================================================================

export type NIS2EntityType = 'essential_entity' | 'important_entity';

export const NIS2EntityLabels: Record<NIS2EntityType, string> = {
  essential_entity: 'Essential Entity',
  important_entity: 'Important Entity',
};

export const NIS2EntityDescriptions: Record<NIS2EntityType, string> = {
  essential_entity: 'Larger entities in critical sectors (energy, transport, health, etc.)',
  important_entity: 'SMEs in critical sectors or medium entities in important sectors',
};

// =============================================================================
// Compliance Score Types
// =============================================================================

export interface NIS2RequirementScore {
  requirementId: string;
  articleNumber: string;
  title: string;
  category: NIS2Category;
  status: NIS2ComplianceStatus;
  evidenceCount: number;
  gaps: string[];
  notes?: string;
}

export interface NIS2CategoryScore {
  category: NIS2Category;
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;
  notAssessedCount: number;
  totalCount: number;
  percentage: number;
  status: NIS2ComplianceStatus;
}

export interface NIS2ComplianceScore {
  // Overall counts
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;
  notAssessedCount: number;
  totalRequirements: number;

  // Category breakdown
  categories: Record<NIS2Category, NIS2CategoryScore>;

  // Overall metrics
  overallPercentage: number;
  overallStatus: NIS2ComplianceStatus;

  // Weights for overall calculation
  // Compliant = 100%, Partial = 50%, Non-compliant = 0%
}

export interface NIS2ComplianceResult {
  organizationId: string;
  assessmentDate: string;

  // Score breakdown
  score: NIS2ComplianceScore;

  // Requirement-level details
  requirements: NIS2RequirementScore[];

  // Critical gaps requiring immediate attention
  criticalGaps: NIS2GapItem[];

  // All gaps
  allGaps: NIS2GapItem[];

  // Summary metrics
  totalGaps: number;
  estimatedRemediationWeeks: number;

  // Entity type (affects supervision level)
  entityType: NIS2EntityType;
}

// =============================================================================
// Gap Types
// =============================================================================

export interface NIS2GapItem {
  requirementId: string;
  articleNumber: string;
  title: string;
  category: NIS2Category;
  gapDescription: string;
  remediationGuidance: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedEffort: string;
  dueDate?: string;
  status: 'open' | 'in_progress' | 'resolved';
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface NIS2DashboardStats {
  overallScore: number;
  overallStatus: NIS2ComplianceStatus;
  totalRequirements: number;
  compliantCount: number;
  gapsCount: number;
  criticalGapsCount: number;
  categoryScores: NIS2CategoryScore[];
  recentChanges: NIS2RecentChange[];
  upcomingDeadlines: NIS2Deadline[];
}

export interface NIS2RecentChange {
  id: string;
  requirementId: string;
  articleNumber: string;
  previousStatus: NIS2ComplianceStatus;
  newStatus: NIS2ComplianceStatus;
  changedAt: string;
  changedBy?: string;
}

export interface NIS2Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  type: 'regulatory' | 'internal' | 'remediation';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// =============================================================================
// Vendor NIS2 Compliance (for supply chain)
// =============================================================================

export interface VendorNIS2Compliance {
  vendorId: string;
  organizationId: string;
  assessmentDate: string;

  // Overall score
  overallScore: number;
  overallStatus: NIS2ComplianceStatus;

  // Category scores (simplified for vendors)
  categoryScores: Partial<Record<NIS2Category, number>>;

  // Key compliance indicators
  hasSecurityPolicy: boolean;
  hasIncidentPlan: boolean;
  hasBusinessContinuityPlan: boolean;
  hasCertifications: boolean;
  certificationType?: string[];

  // Assessment details
  assessmentMethod: 'questionnaire' | 'audit' | 'certification' | 'self_declared';
  evidenceDocuments: string[];

  created_at: string;
  updated_at: string;
}

// =============================================================================
// Reporting Thresholds
// =============================================================================

export const NIS2ReportingThresholds = {
  // Article 23 reporting timelines
  EARLY_WARNING_HOURS: 24,      // Initial notification
  INCIDENT_REPORT_HOURS: 72,   // Detailed incident report
  FINAL_REPORT_DAYS: 30,       // Final report (1 month)

  // Significant incident criteria
  AFFECTED_USERS_THRESHOLD: 100,
  SERVICE_DISRUPTION_HOURS: 4,
  FINANCIAL_IMPACT_EUR: 100000,
} as const;

// =============================================================================
// Compliance Thresholds
// =============================================================================

export const NIS2ComplianceThresholds = {
  COMPLIANT_MIN: 90,           // >= 90% = Compliant
  PARTIAL_MIN: 50,             // >= 50% = Partial
  NON_COMPLIANT: 0,            // < 50% = Non-compliant
} as const;

export function getStatusFromPercentage(percentage: number): NIS2ComplianceStatus {
  if (percentage >= NIS2ComplianceThresholds.COMPLIANT_MIN) return 'compliant';
  if (percentage >= NIS2ComplianceThresholds.PARTIAL_MIN) return 'partial';
  return 'non_compliant';
}
