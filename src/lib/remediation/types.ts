/**
 * Remediation Types
 * Type definitions for remediation plans and actions
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export type PlanStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type ActionStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'blocked'
  | 'completed'
  | 'cancelled';

export type SourceType =
  | 'vendor_assessment'
  | 'nis2_risk'
  | 'dora_gap'
  | 'audit_finding'
  | 'questionnaire'
  | 'incident'
  | 'manual';

export type ActionType =
  | 'policy_update'
  | 'technical_control'
  | 'process_change'
  | 'training'
  | 'documentation'
  | 'vendor_engagement'
  | 'audit'
  | 'assessment'
  | 'procurement'
  | 'configuration'
  | 'monitoring'
  | 'other';

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Framework = 'nis2' | 'dora' | 'iso27001' | 'soc2' | 'gdpr' | 'general';
export type EvidenceType = 'document' | 'screenshot' | 'url' | 'attestation' | 'report' | 'other';
export type CommentType = 'comment' | 'status_change' | 'assignment' | 'system';

// ============================================================================
// Constants
// ============================================================================

export const PLAN_STATUS_INFO: Record<PlanStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-500/10 text-yellow-600' },
  approved: { label: 'Approved', color: 'bg-blue-500/10 text-blue-600' },
  in_progress: { label: 'In Progress', color: 'bg-primary/10 text-primary' },
  on_hold: { label: 'On Hold', color: 'bg-orange-500/10 text-orange-600' },
  completed: { label: 'Completed', color: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

export const ACTION_STATUS_INFO: Record<ActionStatus, { label: string; color: string; kanbanColumn: number }> = {
  backlog: { label: 'Backlog', color: 'bg-muted text-muted-foreground', kanbanColumn: 0 },
  todo: { label: 'To Do', color: 'bg-blue-500/10 text-blue-600', kanbanColumn: 1 },
  in_progress: { label: 'In Progress', color: 'bg-primary/10 text-primary', kanbanColumn: 2 },
  in_review: { label: 'In Review', color: 'bg-purple-500/10 text-purple-600', kanbanColumn: 3 },
  blocked: { label: 'Blocked', color: 'bg-error/10 text-error', kanbanColumn: -1 },
  completed: { label: 'Completed', color: 'bg-success/10 text-success', kanbanColumn: 4 },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground', kanbanColumn: -1 },
};

export const PRIORITY_INFO: Record<Priority, { label: string; color: string; sortOrder: number }> = {
  low: { label: 'Low', color: 'bg-blue-500/10 text-blue-600', sortOrder: 0 },
  medium: { label: 'Medium', color: 'bg-yellow-500/10 text-yellow-600', sortOrder: 1 },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-600', sortOrder: 2 },
  critical: { label: 'Critical', color: 'bg-error/10 text-error', sortOrder: 3 },
};

export const SOURCE_TYPE_INFO: Record<SourceType, { label: string; icon: string }> = {
  vendor_assessment: { label: 'Vendor Assessment', icon: 'building' },
  nis2_risk: { label: 'NIS2 Risk', icon: 'shield-alert' },
  dora_gap: { label: 'DORA Gap', icon: 'file-warning' },
  audit_finding: { label: 'Audit Finding', icon: 'clipboard-check' },
  questionnaire: { label: 'Questionnaire', icon: 'file-question' },
  incident: { label: 'Incident', icon: 'alert-triangle' },
  manual: { label: 'Manual', icon: 'edit' },
};

export const ACTION_TYPE_INFO: Record<ActionType, { label: string; icon: string }> = {
  policy_update: { label: 'Policy Update', icon: 'file-text' },
  technical_control: { label: 'Technical Control', icon: 'settings' },
  process_change: { label: 'Process Change', icon: 'git-branch' },
  training: { label: 'Training', icon: 'graduation-cap' },
  documentation: { label: 'Documentation', icon: 'book-open' },
  vendor_engagement: { label: 'Vendor Engagement', icon: 'users' },
  audit: { label: 'Audit', icon: 'clipboard-check' },
  assessment: { label: 'Assessment', icon: 'chart-bar' },
  procurement: { label: 'Procurement', icon: 'shopping-cart' },
  configuration: { label: 'Configuration', icon: 'wrench' },
  monitoring: { label: 'Monitoring', icon: 'activity' },
  other: { label: 'Other', icon: 'more-horizontal' },
};

export const KANBAN_COLUMNS: { id: ActionStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'completed', title: 'Completed' },
];

// ============================================================================
// Database Types
// ============================================================================

export interface RemediationPlan {
  id: string;
  organization_id: string;
  plan_ref: string;
  title: string;
  description: string | null;
  source_type: SourceType;
  source_id: string | null;
  vendor_id: string | null;
  framework: Framework | null;
  status: PlanStatus;
  priority: Priority;
  risk_level: RiskLevel | null;
  target_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  owner_id: string | null;
  approver_id: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  total_actions: number;
  completed_actions: number;
  progress_percentage: number;
  estimated_cost: number | null;
  actual_cost: number | null;
  cost_currency: string;
  tags: string[] | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RemediationAction {
  id: string;
  organization_id: string;
  plan_id: string;
  action_ref: string;
  title: string;
  description: string | null;
  action_type: ActionType;
  status: ActionStatus;
  blocked_reason: string | null;
  priority: Priority;
  sort_order: number;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  assignee_id: string | null;
  reviewer_id: string | null;
  requires_evidence: boolean;
  evidence_description: string | null;
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  control_id: string | null;
  requirement_reference: string | null;
  depends_on: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RemediationActionComment {
  id: string;
  action_id: string;
  content: string;
  comment_type: CommentType;
  old_status: string | null;
  new_status: string | null;
  author_id: string | null;
  created_at: string;
}

export interface RemediationEvidence {
  id: string;
  organization_id: string;
  action_id: string;
  evidence_type: EvidenceType;
  document_id: string | null;
  external_url: string | null;
  attestation_text: string | null;
  title: string;
  description: string | null;
  verified_at: string | null;
  verified_by: string | null;
  uploaded_by: string | null;
  created_at: string;
}

// ============================================================================
// Extended Types (with relations)
// ============================================================================

export interface RemediationPlanWithRelations extends RemediationPlan {
  vendor?: {
    id: string;
    name: string;
  } | null;
  owner?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  approver?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  actions?: RemediationAction[];
}

export interface RemediationActionWithRelations extends RemediationAction {
  plan?: RemediationPlan;
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  reviewer?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  evidence?: RemediationEvidence[];
  comments?: RemediationActionCommentWithAuthor[];
}

export interface RemediationActionCommentWithAuthor extends RemediationActionComment {
  author?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

// ============================================================================
// Dashboard Stats
// ============================================================================

export interface RemediationStats {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  overduePlans: number;
  totalActions: number;
  completedActions: number;
  overdueActions: number;
  blockedActions: number;
  avgProgress: number;
  byPriority: Record<Priority, number>;
  byStatus: Record<PlanStatus, number>;
  byFramework: Record<string, number>;
}

export interface KanbanData {
  columns: {
    id: ActionStatus;
    title: string;
    actions: RemediationActionWithRelations[];
  }[];
  blockedActions: RemediationActionWithRelations[];
}
