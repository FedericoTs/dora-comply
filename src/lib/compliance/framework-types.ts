/**
 * Multi-Framework Compliance Types
 *
 * Shared types for DORA, NIS2, GDPR Article 32, and ISO 27001:2022 frameworks.
 * Enables cross-framework mapping and unified compliance tracking.
 */

// ============================================================================
// Framework Codes
// ============================================================================

export type FrameworkCode = 'dora' | 'nis2' | 'gdpr' | 'iso27001';

export const FRAMEWORK_NAMES: Record<FrameworkCode, string> = {
  dora: 'DORA',
  nis2: 'NIS2 Directive',
  gdpr: 'GDPR Article 32',
  iso27001: 'ISO 27001:2022',
};

export const FRAMEWORK_FULL_NAMES: Record<FrameworkCode, string> = {
  dora: 'Digital Operational Resilience Act',
  nis2: 'Network and Information Security Directive 2',
  gdpr: 'General Data Protection Regulation - Security of Processing',
  iso27001: 'ISO/IEC 27001:2022 Information Security Management',
};

export const FRAMEWORK_DESCRIPTIONS: Record<FrameworkCode, string> = {
  dora: 'EU regulation on digital operational resilience for the financial sector, covering ICT risk management, incident reporting, resilience testing, and third-party risk management.',
  nis2: 'EU directive establishing cybersecurity requirements for essential and important entities across critical sectors.',
  gdpr: 'Article 32 of GDPR mandates appropriate technical and organizational measures to ensure security of personal data processing.',
  iso27001: 'International standard for information security management systems (ISMS), providing a systematic approach to managing sensitive information.',
};

// ============================================================================
// Framework Requirements
// ============================================================================

export type RequirementPriority = 'critical' | 'high' | 'medium' | 'low';

export interface FrameworkRequirement {
  id: string;
  framework: FrameworkCode;
  article_number: string;           // 'Art.5', 'A.5.1', '32(1)(a)', '21(2)(a)'
  title: string;
  description: string;
  category: string;                 // Pillar/domain/chapter
  subcategory?: string;             // Sub-section
  priority: RequirementPriority;
  evidence_types: EvidenceType[];
  applicability?: EntityType[];     // Which entity types this applies to
  parent_id?: string;               // For hierarchical requirements
  sort_order: number;
  implementation_guidance?: string;
  regulatory_reference?: string;    // Link to official text
}

export type EvidenceType =
  | 'policy'
  | 'procedure'
  | 'technical_control'
  | 'audit_report'
  | 'soc2_report'
  | 'penetration_test'
  | 'vulnerability_scan'
  | 'training_records'
  | 'incident_log'
  | 'bcp_drp'
  | 'vendor_assessment'
  | 'contract'
  | 'risk_assessment'
  | 'certification'
  | 'monitoring_evidence'
  | 'access_review'
  | 'encryption_config'
  | 'network_diagram'
  | 'data_flow_diagram'
  | 'interview'
  | 'observation'
  | 'questionnaire';

export type EntityType =
  // DORA entity types
  | 'credit_institution'
  | 'investment_firm'
  | 'payment_institution'
  | 'insurance_undertaking'
  | 'ict_service_provider'
  // NIS2 entity types
  | 'essential_entity'
  | 'important_entity'
  | 'energy_sector'
  | 'transport_sector'
  | 'banking_sector'
  | 'health_sector'
  | 'digital_infrastructure'
  | 'public_administration'
  // Generic
  | 'all';

// ============================================================================
// Cross-Framework Mappings
// ============================================================================

export type MappingType =
  | 'equivalent'    // 100% coverage, requirements are identical
  | 'partial'       // Some coverage, may need additional controls
  | 'supports'      // Helps meet requirement but doesn't fully satisfy
  | 'related';      // Conceptually related but different scope

export interface CrossFrameworkMapping {
  id: string;
  source_framework: FrameworkCode;
  source_requirement_id: string;
  target_framework: FrameworkCode;
  target_requirement_id: string;
  mapping_type: MappingType;
  coverage_percentage: number;      // 0-100
  confidence: number;               // 0-1 (how confident we are in this mapping)
  notes?: string;
  bidirectional: boolean;           // If true, mapping works both ways
}

export interface CrossFrameworkCoverage {
  source_framework: FrameworkCode;
  target_framework: FrameworkCode;
  total_source_requirements: number;
  mapped_requirements: number;
  coverage_percentage: number;
  by_mapping_type: Record<MappingType, number>;
  by_category: Record<string, {
    total: number;
    mapped: number;
    percentage: number;
  }>;
}

// ============================================================================
// Compliance Assessment
// ============================================================================

export type ComplianceStatus =
  | 'compliant'
  | 'partially_compliant'
  | 'non_compliant'
  | 'not_applicable'
  | 'not_assessed';

export interface RequirementAssessment {
  requirement_id: string;
  framework: FrameworkCode;
  status: ComplianceStatus;
  score: number;                    // 0-100
  evidence_ids: string[];
  gaps: string[];
  remediation_actions: string[];
  assessed_at: Date;
  assessed_by?: string;
  notes?: string;
}

export interface FrameworkComplianceResult {
  framework: FrameworkCode;
  overall_score: number;            // 0-100
  status: ComplianceStatus;
  category_scores: Record<string, {
    score: number;
    status: ComplianceStatus;
    requirements_met: number;
    requirements_total: number;
  }>;
  requirements_met: number;
  requirements_total: number;
  critical_gaps: FrameworkGap[];
  last_assessed_at: Date;
}

export interface FrameworkGap {
  requirement_id: string;
  requirement_title: string;
  category: string;
  priority: RequirementPriority;
  current_status: ComplianceStatus;
  gap_description: string;
  remediation_suggestion: string;
  estimated_effort: 'low' | 'medium' | 'high';
  cross_framework_impact: {
    framework: FrameworkCode;
    requirement_id: string;
    would_satisfy: boolean;
  }[];
}

// ============================================================================
// Organization Framework Settings
// ============================================================================

export interface OrganizationFramework {
  organization_id: string;
  framework: FrameworkCode;
  enabled: boolean;
  target_compliance_date?: Date;
  primary_contact?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Vendor Framework Compliance
// ============================================================================

export interface VendorFrameworkCompliance {
  vendor_id: string;
  organization_id: string;
  framework: FrameworkCode;
  overall_score: number;
  status: ComplianceStatus;
  category_scores: Record<string, number>;
  requirements_met: number;
  requirements_total: number;
  critical_gaps: FrameworkGap[];
  evidence_sources: {
    type: 'soc2_report' | 'questionnaire' | 'document' | 'certification';
    document_id?: string;
    name: string;
    date: Date;
  }[];
  last_assessed_at: Date;
  next_review_date?: Date;
}

// ============================================================================
// Framework Categories (Pillars/Domains)
// ============================================================================

export interface FrameworkCategory {
  framework: FrameworkCode;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  icon?: string;
  color?: string;
}

export const DORA_CATEGORIES: FrameworkCategory[] = [
  {
    framework: 'dora',
    code: 'ict_risk',
    name: 'ICT Risk Management',
    description: 'Framework for managing ICT risks including governance, identification, protection, and recovery',
    sort_order: 1,
    icon: 'Shield',
    color: '#3B82F6',
  },
  {
    framework: 'dora',
    code: 'incident',
    name: 'Incident Reporting',
    description: 'Requirements for detecting, managing, and reporting ICT-related incidents',
    sort_order: 2,
    icon: 'AlertTriangle',
    color: '#EF4444',
  },
  {
    framework: 'dora',
    code: 'testing',
    name: 'Resilience Testing',
    description: 'Digital operational resilience testing including TLPT and vulnerability assessments',
    sort_order: 3,
    icon: 'TestTube',
    color: '#10B981',
  },
  {
    framework: 'dora',
    code: 'tprm',
    name: 'Third-Party Risk',
    description: 'Management of ICT third-party risks and critical service providers',
    sort_order: 4,
    icon: 'Users',
    color: '#8B5CF6',
  },
  {
    framework: 'dora',
    code: 'sharing',
    name: 'Information Sharing',
    description: 'Arrangements for sharing cyber threat information and intelligence',
    sort_order: 5,
    icon: 'Share2',
    color: '#F59E0B',
  },
];

export const NIS2_CATEGORIES: FrameworkCategory[] = [
  {
    framework: 'nis2',
    code: 'risk_management',
    name: 'Risk Management Measures',
    description: 'Cybersecurity risk management policies and procedures (Article 21)',
    sort_order: 1,
    icon: 'Shield',
    color: '#3B82F6',
  },
  {
    framework: 'nis2',
    code: 'incident_handling',
    name: 'Incident Handling',
    description: 'Incident detection, response, and recovery capabilities',
    sort_order: 2,
    icon: 'AlertTriangle',
    color: '#EF4444',
  },
  {
    framework: 'nis2',
    code: 'business_continuity',
    name: 'Business Continuity',
    description: 'Business continuity and crisis management',
    sort_order: 3,
    icon: 'RefreshCw',
    color: '#10B981',
  },
  {
    framework: 'nis2',
    code: 'supply_chain',
    name: 'Supply Chain Security',
    description: 'Security in supply chain and supplier relationships',
    sort_order: 4,
    icon: 'Link',
    color: '#8B5CF6',
  },
  {
    framework: 'nis2',
    code: 'reporting',
    name: 'Reporting Obligations',
    description: 'Incident notification and reporting requirements',
    sort_order: 5,
    icon: 'FileText',
    color: '#F59E0B',
  },
  {
    framework: 'nis2',
    code: 'governance',
    name: 'Governance',
    description: 'Management body responsibilities and accountability',
    sort_order: 6,
    icon: 'Building',
    color: '#6366F1',
  },
];

export const GDPR_CATEGORIES: FrameworkCategory[] = [
  {
    framework: 'gdpr',
    code: 'technical_measures',
    name: 'Technical Measures',
    description: 'Technical security controls for data protection',
    sort_order: 1,
    icon: 'Lock',
    color: '#3B82F6',
  },
  {
    framework: 'gdpr',
    code: 'organizational_measures',
    name: 'Organizational Measures',
    description: 'Organizational policies and procedures for data security',
    sort_order: 2,
    icon: 'Users',
    color: '#10B981',
  },
  {
    framework: 'gdpr',
    code: 'risk_assessment',
    name: 'Risk Assessment',
    description: 'Assessment of risks to data subjects rights and freedoms',
    sort_order: 3,
    icon: 'Search',
    color: '#F59E0B',
  },
];

export const ISO27001_CATEGORIES: FrameworkCategory[] = [
  {
    framework: 'iso27001',
    code: 'A5',
    name: 'Organizational Controls',
    description: 'Policies, roles, responsibilities, and management controls (37 controls)',
    sort_order: 1,
    icon: 'Building',
    color: '#3B82F6',
  },
  {
    framework: 'iso27001',
    code: 'A6',
    name: 'People Controls',
    description: 'HR security, awareness, and training (8 controls)',
    sort_order: 2,
    icon: 'Users',
    color: '#10B981',
  },
  {
    framework: 'iso27001',
    code: 'A7',
    name: 'Physical Controls',
    description: 'Physical and environmental security (14 controls)',
    sort_order: 3,
    icon: 'Home',
    color: '#F59E0B',
  },
  {
    framework: 'iso27001',
    code: 'A8',
    name: 'Technological Controls',
    description: 'System and application security controls (34 controls)',
    sort_order: 4,
    icon: 'Server',
    color: '#8B5CF6',
  },
];

export const ALL_FRAMEWORK_CATEGORIES: Record<FrameworkCode, FrameworkCategory[]> = {
  dora: DORA_CATEGORIES,
  nis2: NIS2_CATEGORIES,
  gdpr: GDPR_CATEGORIES,
  iso27001: ISO27001_CATEGORIES,
};

// ============================================================================
// Utility Functions
// ============================================================================

export function getFrameworkName(code: FrameworkCode): string {
  return FRAMEWORK_NAMES[code];
}

export function getFrameworkFullName(code: FrameworkCode): string {
  return FRAMEWORK_FULL_NAMES[code];
}

export function getFrameworkCategories(code: FrameworkCode): FrameworkCategory[] {
  return ALL_FRAMEWORK_CATEGORIES[code];
}

export function getCategoryByCode(framework: FrameworkCode, categoryCode: string): FrameworkCategory | undefined {
  return ALL_FRAMEWORK_CATEGORIES[framework].find(c => c.code === categoryCode);
}

export function getComplianceStatusColor(status: ComplianceStatus): string {
  switch (status) {
    case 'compliant':
      return '#10B981'; // green
    case 'partially_compliant':
      return '#F59E0B'; // amber
    case 'non_compliant':
      return '#EF4444'; // red
    case 'not_applicable':
      return '#6B7280'; // gray
    case 'not_assessed':
      return '#9CA3AF'; // light gray
  }
}

export function getPriorityColor(priority: RequirementPriority): string {
  switch (priority) {
    case 'critical':
      return '#EF4444'; // red
    case 'high':
      return '#F59E0B'; // amber
    case 'medium':
      return '#3B82F6'; // blue
    case 'low':
      return '#6B7280'; // gray
  }
}

export function getPriorityWeight(priority: RequirementPriority): number {
  switch (priority) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
  }
}

export function calculateWeightedScore(
  assessments: RequirementAssessment[],
  requirements: FrameworkRequirement[]
): number {
  if (assessments.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const assessment of assessments) {
    const requirement = requirements.find(r => r.id === assessment.requirement_id);
    if (!requirement) continue;

    const weight = getPriorityWeight(requirement.priority);
    totalWeight += weight;
    weightedSum += assessment.score * weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}
