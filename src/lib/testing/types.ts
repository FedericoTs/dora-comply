/**
 * Resilience Testing Types
 *
 * DORA Chapter IV - Digital Operational Resilience Testing
 * Article 24: General requirements for testing
 * Article 25: Testing of ICT tools and systems (10 test types)
 * Article 26: Advanced testing (TLPT)
 * Article 27: Tester requirements
 */

// ============================================================================
// Enums and Constants
// ============================================================================

// Programme Status
export const PROGRAMME_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'active',
  'completed',
  'archived'
] as const;
export type ProgrammeStatus = typeof PROGRAMME_STATUSES[number];

// Test Types - Article 25.1 (all 10 types)
export const TEST_TYPES = [
  'vulnerability_assessment',    // (a) vulnerability assessments and scans
  'open_source_analysis',        // (b) open source analyses
  'network_security_assessment', // (c) network security assessments
  'gap_analysis',                // (d) gap analyses
  'physical_security_review',    // (e) physical security reviews
  'source_code_review',          // (f) source code reviews
  'scenario_based_test',         // (g) scenario-based tests
  'compatibility_test',          // (h) compatibility testing
  'performance_test',            // (i) performance testing
  'penetration_test'             // (j) penetration testing
] as const;
export type TestType = typeof TEST_TYPES[number];

// Test Status
export const TEST_STATUSES = [
  'planned',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'on_hold',
  'remediation_required'
] as const;
export type TestStatus = typeof TEST_STATUSES[number];

// Test Results
export const TEST_RESULTS = [
  'pass',
  'pass_with_findings',
  'fail',
  'inconclusive'
] as const;
export type TestResult = typeof TEST_RESULTS[number];

// Tester Types - Article 27
export const TESTER_TYPES = ['internal', 'external', 'hybrid'] as const;
export type TesterType = typeof TESTER_TYPES[number];

// Finding Severities
export const FINDING_SEVERITIES = [
  'critical',
  'high',
  'medium',
  'low',
  'informational'
] as const;
export type FindingSeverity = typeof FINDING_SEVERITIES[number];

// Finding Statuses
export const FINDING_STATUSES = [
  'open',
  'in_remediation',
  'remediated',
  'verified',
  'risk_accepted',
  'false_positive',
  'deferred'
] as const;
export type FindingStatus = typeof FINDING_STATUSES[number];

// TLPT Frameworks
export const TLPT_FRAMEWORKS = [
  'tiber_eu',
  'tiber_nl',
  'tiber_de',
  'tiber_be',
  'cbest',
  'icast',
  'aase',
  'other'
] as const;
export type TLPTFramework = typeof TLPT_FRAMEWORKS[number];

// TLPT Statuses (TIBER-EU phases)
export const TLPT_STATUSES = [
  'planning',
  'threat_intelligence',
  'red_team_test',
  'closure',
  'remediation',
  'completed',
  'cancelled'
] as const;
export type TLPTStatus = typeof TLPT_STATUSES[number];

// Testing Document Types
export const TESTING_DOCUMENT_TYPES = [
  'test_plan',
  'test_report',
  'executive_summary',
  'findings_report',
  'remediation_plan',
  'remediation_evidence',
  'ti_report',
  'rt_report',
  'attestation',
  'scope_document',
  'other'
] as const;
export type TestingDocumentType = typeof TESTING_DOCUMENT_TYPES[number];

// ============================================================================
// Core Types
// ============================================================================

export interface TestingProgramme {
  id: string;
  organization_id: string;
  programme_ref: string;
  name: string;
  year: number;
  status: ProgrammeStatus;

  // Dates
  start_date: string | null;
  end_date: string | null;
  approval_date: string | null;

  // Management
  approved_by: string | null;
  programme_manager: string | null;

  // Description
  description: string | null;
  scope: string | null;
  objectives: string[];

  // Risk-based approach
  risk_assessment_basis: string | null;
  critical_systems_in_scope: string[];

  // Budget
  budget_allocated: number | null;
  budget_spent: number;

  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResilienceTest {
  id: string;
  organization_id: string;
  programme_id: string | null;
  test_ref: string;
  name: string;
  test_type: TestType;
  status: TestStatus;

  // Dates
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;

  // Testing details
  description: string | null;
  methodology: string | null;
  scope_description: string | null;
  systems_in_scope: string[];

  // Tester information (Article 27)
  tester_type: TesterType | null;
  tester_name: string | null;
  tester_organization: string | null;
  tester_certifications: string[];
  tester_independence_verified: boolean;

  // Results
  overall_result: TestResult | null;
  executive_summary: string | null;
  findings_count: number;
  critical_findings_count: number;
  high_findings_count: number;
  medium_findings_count: number;
  low_findings_count: number;

  // Costs
  estimated_cost: number | null;
  actual_cost: number | null;

  // Vendor linkage
  vendor_id: string | null;

  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestFinding {
  id: string;
  test_id: string;
  finding_ref: string;
  title: string;
  severity: FindingSeverity;
  status: FindingStatus;

  // Details
  description: string;
  affected_systems: string[];
  cvss_score: number | null;
  cve_ids: string[];
  cwe_ids: string[];

  // Remediation
  recommendation: string | null;
  remediation_plan: string | null;
  remediation_owner: string | null;
  remediation_deadline: string | null;
  remediation_date: string | null;
  remediation_evidence: string | null;

  // Verification
  verified_by: string | null;
  verified_date: string | null;
  verification_notes: string | null;

  // Risk acceptance
  risk_acceptance_reason: string | null;
  risk_acceptance_approved_by: string | null;
  risk_acceptance_date: string | null;
  risk_acceptance_expiry: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TLPTEngagement {
  id: string;
  organization_id: string;
  programme_id: string | null;
  tlpt_ref: string;
  name: string;
  framework: TLPTFramework;
  status: TLPTStatus;

  // Scope
  scope_defined: boolean;
  scope_definition_date: string | null;
  scope_systems: string[];
  scope_critical_functions: string[];

  // Threat Intelligence phase
  ti_provider: string | null;
  ti_provider_accreditation: string | null;
  ti_start_date: string | null;
  ti_end_date: string | null;
  ti_report_received: boolean;
  ti_report_date: string | null;

  // Red Team phase
  rt_provider: string | null;
  rt_provider_accreditation: string | null;
  rt_start_date: string | null;
  rt_end_date: string | null;
  rt_report_received: boolean;
  rt_report_date: string | null;

  // Closure
  purple_team_session_date: string | null;
  remediation_plan_date: string | null;
  attestation_date: string | null;
  attestation_reference: string | null;

  // Due dates
  last_tlpt_date: string | null;
  next_tlpt_due: string | null;

  // Results
  scenarios_tested: number;
  scenarios_successful: number;
  findings_count: number;
  critical_findings_count: number;

  // Cost
  estimated_cost: number | null;
  actual_cost: number | null;

  // Regulatory
  regulator_notified: boolean;
  regulator_notification_date: string | null;
  regulator_reference: string | null;

  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestingDocument {
  id: string;
  test_id: string | null;
  tlpt_id: string | null;
  programme_id: string | null;
  document_id: string;
  document_type: TestingDocumentType;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
}

// ============================================================================
// Extended Types with Relations
// ============================================================================

export interface TestingProgrammeWithStats extends TestingProgramme {
  total_tests: number;
  completed_tests: number;
  planned_tests: number;
  in_progress_tests: number;
  total_findings: number;
  critical_findings: number;
}

export interface ResilienceTestWithRelations extends ResilienceTest {
  programme?: Pick<TestingProgramme, 'id' | 'name' | 'programme_ref'> | null;
  vendor?: {
    id: string;
    name: string;
    lei: string | null;
  } | null;
  findings?: TestFinding[];
}

export interface TLPTEngagementWithRelations extends TLPTEngagement {
  programme?: Pick<TestingProgramme, 'id' | 'name' | 'programme_ref'> | null;
}

// ============================================================================
// List Item Types
// ============================================================================

export interface TestListItem {
  id: string;
  test_ref: string;
  name: string;
  test_type: TestType;
  status: TestStatus;
  overall_result: TestResult | null;
  planned_start_date: string | null;
  actual_end_date: string | null;
  findings_count: number;
  critical_findings_count: number;
  programme_name: string | null;
  vendor_name: string | null;
}

export interface TLPTListItem {
  id: string;
  tlpt_ref: string;
  name: string;
  framework: TLPTFramework;
  status: TLPTStatus;
  next_tlpt_due: string | null;
  compliance_status: 'compliant' | 'due_soon' | 'overdue' | 'not_scheduled';
  days_until_due: number | null;
}

// ============================================================================
// Form/Input Types
// ============================================================================

export interface CreateProgrammeInput {
  name: string;
  year: number;
  description?: string;
  scope?: string;
  objectives?: string[];
  risk_assessment_basis?: string;
  critical_systems_in_scope?: string[];
  budget_allocated?: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateProgrammeInput extends Partial<CreateProgrammeInput> {
  status?: ProgrammeStatus;
  approval_date?: string;
  budget_spent?: number;
}

export interface CreateTestInput {
  name: string;
  test_type: TestType;
  programme_id?: string;
  description?: string;
  methodology?: string;
  scope_description?: string;
  systems_in_scope?: string[];
  planned_start_date?: string;
  planned_end_date?: string;
  tester_type?: TesterType;
  tester_name?: string;
  tester_organization?: string;
  tester_certifications?: string[];
  estimated_cost?: number;
  vendor_id?: string;
}

export interface UpdateTestInput extends Partial<CreateTestInput> {
  status?: TestStatus;
  actual_start_date?: string;
  actual_end_date?: string;
  overall_result?: TestResult;
  executive_summary?: string;
  actual_cost?: number;
  tester_independence_verified?: boolean;
}

export interface CreateFindingInput {
  test_id: string;
  title: string;
  severity: FindingSeverity;
  description: string;
  affected_systems?: string[];
  cvss_score?: number;
  cve_ids?: string[];
  cwe_ids?: string[];
  recommendation?: string;
  remediation_deadline?: string;
}

export interface UpdateFindingInput extends Partial<Omit<CreateFindingInput, 'test_id'>> {
  status?: FindingStatus;
  remediation_plan?: string;
  remediation_owner?: string;
  remediation_date?: string;
  remediation_evidence?: string;
  verification_notes?: string;
  risk_acceptance_reason?: string;
  risk_acceptance_expiry?: string;
}

export interface CreateTLPTInput {
  name: string;
  framework?: TLPTFramework;
  programme_id?: string;
  scope_systems?: string[];
  scope_critical_functions?: string[];
  estimated_cost?: number;
  next_tlpt_due?: string;
}

export interface UpdateTLPTInput extends Partial<CreateTLPTInput> {
  status?: TLPTStatus;
  scope_defined?: boolean;
  scope_definition_date?: string;
  ti_provider?: string;
  ti_provider_accreditation?: string;
  ti_start_date?: string;
  ti_end_date?: string;
  ti_report_received?: boolean;
  ti_report_date?: string;
  rt_provider?: string;
  rt_provider_accreditation?: string;
  rt_start_date?: string;
  rt_end_date?: string;
  rt_report_received?: boolean;
  rt_report_date?: string;
  purple_team_session_date?: string;
  remediation_plan_date?: string;
  attestation_date?: string;
  attestation_reference?: string;
  scenarios_tested?: number;
  scenarios_successful?: number;
  findings_count?: number;
  critical_findings_count?: number;
  actual_cost?: number;
  regulator_notified?: boolean;
  regulator_notification_date?: string;
  regulator_reference?: string;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface TestFilters {
  status?: TestStatus | TestStatus[];
  test_type?: TestType | TestType[];
  programme_id?: string;
  vendor_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface FindingFilters {
  test_id?: string;
  severity?: FindingSeverity | FindingSeverity[];
  status?: FindingStatus | FindingStatus[];
  search?: string;
}

export interface TLPTFilters {
  status?: TLPTStatus | TLPTStatus[];
  framework?: TLPTFramework | TLPTFramework[];
  programme_id?: string;
  compliance_status?: 'compliant' | 'due_soon' | 'overdue' | 'not_scheduled';
}

// ============================================================================
// Dashboard/Stats Types
// ============================================================================

export interface TestingStats {
  // Programme stats
  active_programmes: number;
  total_programmes: number;

  // Test stats
  total_tests: number;
  tests_by_status: Record<TestStatus, number>;
  tests_by_type: Record<TestType, number>;
  completed_tests_this_year: number;

  // Finding stats
  open_findings: number;
  critical_open_findings: number;
  findings_by_severity: Record<FindingSeverity, number>;
  overdue_remediations: number;

  // TLPT stats
  active_tlpt: number;
  tlpt_due_soon: number;
  tlpt_overdue: number;

  // Coverage
  test_type_coverage: number; // % of 10 test types executed this year
}

export interface OpenFindingSummary {
  severity: FindingSeverity;
  count: number;
  overdue_count: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getTestTypeLabel(type: TestType): string {
  const labels: Record<TestType, string> = {
    vulnerability_assessment: 'Vulnerability Assessment',
    open_source_analysis: 'Open Source Analysis',
    network_security_assessment: 'Network Security Assessment',
    gap_analysis: 'Gap Analysis',
    physical_security_review: 'Physical Security Review',
    source_code_review: 'Source Code Review',
    scenario_based_test: 'Scenario-Based Test',
    compatibility_test: 'Compatibility Test',
    performance_test: 'Performance Test',
    penetration_test: 'Penetration Test'
  };
  return labels[type];
}

export function getTestTypeShortLabel(type: TestType): string {
  const labels: Record<TestType, string> = {
    vulnerability_assessment: 'Vuln Scan',
    open_source_analysis: 'OSA',
    network_security_assessment: 'Network',
    gap_analysis: 'Gap',
    physical_security_review: 'Physical',
    source_code_review: 'Code Review',
    scenario_based_test: 'Scenario',
    compatibility_test: 'Compat',
    performance_test: 'Perf',
    penetration_test: 'Pentest'
  };
  return labels[type];
}

export function getTestTypeIcon(type: TestType): string {
  const icons: Record<TestType, string> = {
    vulnerability_assessment: 'scan',
    open_source_analysis: 'package',
    network_security_assessment: 'network',
    gap_analysis: 'search',
    physical_security_review: 'building',
    source_code_review: 'code',
    scenario_based_test: 'play',
    compatibility_test: 'puzzle',
    performance_test: 'gauge',
    penetration_test: 'target'
  };
  return icons[type];
}

export function getTestStatusLabel(status: TestStatus): string {
  const labels: Record<TestStatus, string> = {
    planned: 'Planned',
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    on_hold: 'On Hold',
    remediation_required: 'Remediation Required'
  };
  return labels[status];
}

export function getTestStatusColor(status: TestStatus): string {
  const colors: Record<TestStatus, string> = {
    planned: 'secondary',
    scheduled: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'muted',
    on_hold: 'secondary',
    remediation_required: 'destructive'
  };
  return colors[status];
}

export function getTestResultLabel(result: TestResult): string {
  const labels: Record<TestResult, string> = {
    pass: 'Pass',
    pass_with_findings: 'Pass with Findings',
    fail: 'Fail',
    inconclusive: 'Inconclusive'
  };
  return labels[result];
}

export function getTestResultColor(result: TestResult): string {
  const colors: Record<TestResult, string> = {
    pass: 'success',
    pass_with_findings: 'warning',
    fail: 'destructive',
    inconclusive: 'secondary'
  };
  return colors[result];
}

export function getTesterTypeLabel(type: TesterType): string {
  const labels: Record<TesterType, string> = {
    internal: 'Internal',
    external: 'External',
    hybrid: 'Hybrid'
  };
  return labels[type];
}

export function getFindingSeverityLabel(severity: FindingSeverity): string {
  const labels: Record<FindingSeverity, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    informational: 'Info'
  };
  return labels[severity];
}

export function getFindingSeverityColor(severity: FindingSeverity): string {
  const colors: Record<FindingSeverity, string> = {
    critical: 'destructive',
    high: 'orange',
    medium: 'warning',
    low: 'info',
    informational: 'secondary'
  };
  return colors[severity];
}

export function getFindingStatusLabel(status: FindingStatus): string {
  const labels: Record<FindingStatus, string> = {
    open: 'Open',
    in_remediation: 'In Remediation',
    remediated: 'Remediated',
    verified: 'Verified',
    risk_accepted: 'Risk Accepted',
    false_positive: 'False Positive',
    deferred: 'Deferred'
  };
  return labels[status];
}

export function getTLPTFrameworkLabel(framework: TLPTFramework): string {
  const labels: Record<TLPTFramework, string> = {
    tiber_eu: 'TIBER-EU',
    tiber_nl: 'TIBER-NL',
    tiber_de: 'TIBER-DE',
    tiber_be: 'TIBER-BE',
    cbest: 'CBEST',
    icast: 'iCAST',
    aase: 'AASE',
    other: 'Other'
  };
  return labels[framework];
}

export function getTLPTStatusLabel(status: TLPTStatus): string {
  const labels: Record<TLPTStatus, string> = {
    planning: 'Planning',
    threat_intelligence: 'Threat Intelligence',
    red_team_test: 'Red Team Test',
    closure: 'Closure',
    remediation: 'Remediation',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  return labels[status];
}

export function getTLPTStatusColor(status: TLPTStatus): string {
  const colors: Record<TLPTStatus, string> = {
    planning: 'secondary',
    threat_intelligence: 'info',
    red_team_test: 'warning',
    closure: 'info',
    remediation: 'orange',
    completed: 'success',
    cancelled: 'muted'
  };
  return colors[status];
}

export function getProgrammeStatusLabel(status: ProgrammeStatus): string {
  const labels: Record<ProgrammeStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived'
  };
  return labels[status];
}

export function getProgrammeStatusColor(status: ProgrammeStatus): string {
  const colors: Record<ProgrammeStatus, string> = {
    draft: 'secondary',
    pending_approval: 'warning',
    approved: 'info',
    active: 'success',
    completed: 'success',
    archived: 'muted'
  };
  return colors[status];
}

export function getDocumentTypeLabel(type: TestingDocumentType): string {
  const labels: Record<TestingDocumentType, string> = {
    test_plan: 'Test Plan',
    test_report: 'Test Report',
    executive_summary: 'Executive Summary',
    findings_report: 'Findings Report',
    remediation_plan: 'Remediation Plan',
    remediation_evidence: 'Remediation Evidence',
    ti_report: 'Threat Intelligence Report',
    rt_report: 'Red Team Report',
    attestation: 'Attestation',
    scope_document: 'Scope Document',
    other: 'Other'
  };
  return labels[type];
}

// TLPT Due date helpers
export function calculateNextTLPTDue(lastTLPTDate: Date): Date {
  const nextDue = new Date(lastTLPTDate);
  nextDue.setFullYear(nextDue.getFullYear() + 3); // Article 26.1 - every 3 years
  return nextDue;
}

export function getTLPTComplianceStatus(
  nextDue: string | null
): 'compliant' | 'due_soon' | 'overdue' | 'not_scheduled' {
  if (!nextDue) return 'not_scheduled';

  const dueDate = new Date(nextDue);
  const today = new Date();
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  if (dueDate < today) return 'overdue';
  if (dueDate < sixMonthsFromNow) return 'due_soon';
  return 'compliant';
}

export function getDaysUntilDue(nextDue: string | null): number | null {
  if (!nextDue) return null;
  const dueDate = new Date(nextDue);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Test type coverage calculation
export function calculateTestTypeCoverage(completedTestTypes: TestType[]): number {
  const uniqueTypes = new Set(completedTestTypes);
  return Math.round((uniqueTypes.size / TEST_TYPES.length) * 100);
}
